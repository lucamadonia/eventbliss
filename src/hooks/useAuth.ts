import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";

export interface DashboardPermissions {
  can_view_responses: boolean;
  can_add_expenses: boolean;
  can_view_all_expenses: boolean;
  can_edit_settings: boolean;
}

export interface ParticipantAccess {
  participant_id: string;
  name: string;
  role: "organizer" | "guest";
  can_access_dashboard: boolean;
  dashboard_permissions: DashboardPermissions;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cold-start on native: the session is restored asynchronously from
    // Capacitor Preferences (see integrations/supabase/storage-adapter.ts).
    // `isLoading` must stay true until that restore has actually finished,
    // otherwise ProtectedRoute sees a transient null session and bounces the
    // user to /auth. Exactly two signals are final in supabase-js v2 (both
    // await the client's internal initialize(), i.e. the storage read):
    //   1. onAuthStateChange fires INITIAL_SESSION (or any later auth event)
    //   2. getSession() resolves
    // Whichever arrives first ends the loading state — nothing else does.
    let stateDeliveredByListener = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          sessionStorage.setItem("password_recovery", "true");
        }
        stateDeliveredByListener = true;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // The listener may already have delivered a fresher state (e.g. a
      // SIGNED_IN that happened while the native storage read was pending) —
      // never overwrite it with this potentially stale snapshot. Resolving
      // still counts as "restore finished", so loading always ends.
      if (!stateDeliveredByListener) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = Capacitor.isNativePlatform()
      ? 'app.eventbliss:///'
      : `${getBaseUrl()}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          language: (i18n.language || "en").slice(0, 2),
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
