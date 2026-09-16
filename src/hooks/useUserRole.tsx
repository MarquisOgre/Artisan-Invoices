import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 'admin' | 'user';

// Temporary screenshot/demo mode. Remove this flag when returning to normal auth-only behavior.
const SCREENSHOT_DEMO_MODE = true;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(SCREENSHOT_DEMO_MODE && !user ? 'admin' : null);
  const [loading, setLoading] = useState(!(SCREENSHOT_DEMO_MODE && !user));

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        if (SCREENSHOT_DEMO_MODE) {
          setRole('admin');
          setLoading(false);
          return;
        }
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setRole(data?.role as AppRole || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  return { role, loading, isAdmin, isUser };
};
