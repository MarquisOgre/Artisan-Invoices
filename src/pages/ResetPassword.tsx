import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase places a recovery token in the URL hash and fires
    // PASSWORD_RECOVERY on the auth state change. We arm the form as soon
    // as either event or an existing session tells us we can update the user.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
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
          {ready
            ? "Enter a new password for your account."
            : "Validating your reset link…"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="text-sm text-white mb-1 block">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-yellow-100 text-black placeholder-gray-700 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
              minLength={8}
              required
              disabled={!ready}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-sm text-white mb-1 block">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="bg-yellow-100 text-black placeholder-gray-700 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300"
              minLength={8}
              required
              disabled={!ready}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !ready}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
          >
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>

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
