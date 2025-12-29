import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdmin() {
  const { user } = useAuth();
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true
  });

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setState({ isAdmin: false, isLoading: false });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          setState({ isAdmin: false, isLoading: false });
        } else {
          // Beide Werte ZUSAMMEN setzen - atomar!
          setState({ isAdmin: !!data, isLoading: false });
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        setState({ isAdmin: false, isLoading: false });
      }
    };

    checkAdminRole();
  }, [user]);

  return state;
}
