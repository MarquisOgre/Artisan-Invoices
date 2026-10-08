import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Users } from "lucide-react";

export const UserManagement = () => {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password) {
      toast({
        title: "Validation Error",
        description: "Username, email and password are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to create users');
      }

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { username, email, password, role }
      });

      // Check for successful response
      if (data?.success) {
        toast({
          title: "User Created",
          description: `User ${username} created successfully with ${role} role.`
        });

        // Reset form
        setUsername("");
        setEmail("");
        setPassword("");
        setRole('user');
        return;
      }

      // Supabase wraps 4xx/5xx Edge Function responses in FunctionsHttpError.
      // Read the function response body so the UI shows the real server error
      // instead of the generic "Edge Function returned a non-2xx status code".
      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            throw new Error(
              body?.error ||
              body?.message ||
              error.message ||
              'Failed to create user'
            );
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message !== error.message) {
              throw parseError;
            }
            throw new Error(error.message || 'Failed to create user');
          }
        }

        throw new Error(error.message || 'Failed to create user');
      }

      // Handle application-level errors from the function
      if (data?.error) {
        throw new Error(data.error);
      }

      // If we got here, something unexpected happened
      throw new Error('Unexpected response from server');

    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Extract the actual error message
      let errorMessage = 'Failed to create user.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error Creating User",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <Label htmlFor="userUsername">Username</Label>
            <Input
              id="userUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              minLength={3}
              maxLength={30}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">3–30 characters: letters, numbers, dot, dash or underscore.</p>
          </div>
          <div>
            <Label htmlFor="userEmail">Email</Label>
            <Input
              id="userEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="userPassword">Password</Label>
            <Input
              id="userPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="userRole">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'user') => setRole(value)}>
              <SelectTrigger id="userRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
