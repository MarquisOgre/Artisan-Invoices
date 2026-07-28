import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be 100 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const AdminSeed = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
        body: { email, password: password || undefined },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Unexpected response from server");

      toast({
        title: data.created ? "Admin created" : "Admin ensured",
        description: `${email} now has admin role.${password ? " Password updated." : ""}`,
      });
      setEmail("");
      setPassword("");
    } catch (err: any) {
      toast({
        title: "Could not seed admin",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5" />
          Seed / Promote Admin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Create an admin account if the email doesn't exist, or promote an existing user
          to admin. Password is optional for existing users; required for new ones (8–100 chars).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="seedEmail">Email</Label>
            <Input
              id="seedEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="seedPassword">Password (optional for existing users)</Label>
            <Input
              id="seedPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={8}
              maxLength={100}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Working…" : "Create or Promote Admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
