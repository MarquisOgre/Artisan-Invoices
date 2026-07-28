import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type Status = "checking" | "ready" | "invalid";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be 100 characters or fewer");

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let armed = false;
    const arm = () => {
      if (armed) return;
      armed = true;
      setStatus("ready");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") arm();
    });

    // The recovery link places tokens in the URL hash. If neither the hash
    // nor an existing session is present, the link is invalid/expired.
    const hash = window.location.hash || "";
    const hasRecoveryHash = /type=recovery/.test(hash) || /access_token=/.test(hash);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        arm();
        return;
      }
      if (!hasRecoveryHash) {
        setStatus("invalid");
        setStatusMessage(
          "This password reset link is invalid or has expired. Request a new one from the sign-in page."
        );
      } else {
        // Give Supabase a moment to parse the hash and emit PASSWORD_RECOVERY.
        setTimeout(() => {
          if (!armed) {
            setStatus("invalid");
            setStatusMessage(
              "We couldn't verify this reset link. It may have expired or already been used. Request a new one from the sign-in page."
            );
          }
        }, 4000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validate = (): boolean => {
    const parsed = passwordSchema.safeParse(password);
    let ok = true;
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0].message);
      ok = false;
    } else {
      setPasswordError(null);
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match");
      ok = false;
    } else {
      setConfirmError(null);
    }
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "ready") return;
    if (!validate()) return;

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Could not update password",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSuccess(true);
    toast({
      title: "Password updated",
      description: "You can now sign in with your new password.",
    });
    await supabase.auth.signOut();
    setTimeout(() => navigate("/auth", { replace: true }), 1500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00000080] to-[#00000040] backdrop-blur-sm" />
      <div className="z-10 w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
        <p className="text-white/70 text-sm mb-6">
          {status === "checking" && "Validating your reset link…"}
          {status === "ready" && !success && "Enter a new password for your account."}
          {status === "invalid" && statusMessage}
          {success && "Password updated. Redirecting you to sign in…"}
        </p>

        {status === "invalid" && (
          <Button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
          >
            Back to sign in
          </Button>
        )}

        {status !== "invalid" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="new-password" className="text-sm text-white mb-1 block">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="bg-yellow-100 text-black placeholder-gray-700 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
                minLength={8}
                maxLength={100}
                required
                disabled={status !== "ready" || submitting || success}
                aria-invalid={!!passwordError}
              />
              {passwordError && (
                <p className="text-red-300 text-xs mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-sm text-white mb-1 block">
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="bg-yellow-100 text-black placeholder-gray-700 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
                minLength={8}
                maxLength={100}
                required
                disabled={status !== "ready" || submitting || success}
                aria-invalid={!!confirmError}
              />
              {confirmError && (
                <p className="text-red-300 text-xs mt-1">{confirmError}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={submitting || status !== "ready" || success}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
            >
              {submitting ? "Updating…" : success ? "Updated" : "Update password"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-blue-300 underline hover:text-blue-200 text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
