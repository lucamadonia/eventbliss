import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";
import { logInRevenueCat, logOutRevenueCat } from "@/lib/revenuecat";
import { isNative } from "@/lib/platform";
import { ForcePasswordChange } from "./ForcePasswordChange";

type PlanType = "free" | "monthly" | "yearly" | "lifetime";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  planType: PlanType;
  subscriptionLoading: boolean;
  syncSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  // Subscription state comes from the shared usePremium query (deduped across
  // all observers by TanStack Query) instead of a second check-subscription
  // call path. syncSubscription stays in the context as an alias on refetch.
  const {
    isPremium,
    planType,
    loading: subscriptionLoading,
    refetch: syncSubscription,
  } = usePremium();

  // Keep RevenueCat identity in sync with the Supabase user (native only).
  // App User ID = Supabase user.id; logOut only after a previous login to
  // avoid logging out the anonymous RC user on cold start.
  const rcUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isNative() || auth.isLoading) return;
    const userId = auth.user?.id ?? null;
    if (userId === rcUserIdRef.current) return;
    if (userId) {
      logInRevenueCat(userId);
    } else if (rcUserIdRef.current) {
      logOutRevenueCat();
    }
    rcUserIdRef.current = userId;
  }, [auth.user?.id, auth.isLoading]);

  // Check if user needs to change password
  useEffect(() => {
    const checkPasswordRequirement = async () => {
      if (!auth.user || auth.isLoading) {
        setMustChangePassword(false);
        return;
      }

      setCheckingPassword(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("id", auth.user.id)
          .maybeSingle();

        if (!error && data?.must_change_password === true) {
          setMustChangePassword(true);
        } else {
          setMustChangePassword(false);
        }
      } catch (err) {
        console.error("Error checking password requirement:", err);
        setMustChangePassword(false);
      } finally {
        setCheckingPassword(false);
      }
    };

    checkPasswordRequirement();
  }, [auth.user, auth.isLoading]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user: auth.user,
      session: auth.session,
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      isPremium,
      planType,
      subscriptionLoading,
      syncSubscription,
      signIn: auth.signIn,
      signUp: auth.signUp,
      signOut: auth.signOut,
    }),
    [
      auth.user,
      auth.session,
      auth.isLoading,
      auth.isAuthenticated,
      auth.signIn,
      auth.signUp,
      auth.signOut,
      isPremium,
      planType,
      subscriptionLoading,
      syncSubscription,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <ForcePasswordChange 
        open={mustChangePassword && !checkingPassword} 
        onPasswordChanged={handlePasswordChanged} 
      />
    </AuthContext.Provider>
  );
}

/**
 * Like useAuthContext, but returns undefined instead of throwing when no
 * AuthProvider is mounted (e.g. during HMR edge cases).
 */
export function useOptionalAuthContext() {
  return useContext(AuthContext);
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
