import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/auth/AuthProvider";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdmin() {
  const { user, isLoading: authLoading } = useAuthContext();
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true
  });

  useEffect(() => {
    // Wenn Auth noch lädt, bleiben wir im Loading-Zustand
    if (authLoading) {
      setState({ isAdmin: false, isLoading: true });
      return;
    }

    // Auth fertig, aber kein User -> nicht Admin
    if (!user) {
      setState({ isAdmin: false, isLoading: false });
      return;
    }

    // User existiert -> Admin-Check durchführen
    let cancelled = false;

    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("Error checking admin role:", error);
          setState({ isAdmin: false, isLoading: false });
        } else {
          setState({ isAdmin: !!data, isLoading: false });
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error checking admin role:", err);
        setState({ isAdmin: false, isLoading: false });
      }
    };

    checkAdminRole();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return state;
}
