import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState<PlanType>("free");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Sync subscription from Stripe via edge function
  const syncSubscription = useCallback(async () => {
    if (!auth.user) {
      setIsPremium(false);
      setPlanType("free");
      return;
    }

    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error syncing subscription:", error);
      } else if (data) {
        setIsPremium(data.subscribed === true);
        setPlanType(data.plan_type || "free");
      }
    } catch (err) {
      console.error("Error in syncSubscription:", err);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [auth.user]);

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

  // Sync subscription on login and when user changes
  useEffect(() => {
    if (auth.user && !auth.isLoading) {
      syncSubscription();
    } else if (!auth.user) {
      setIsPremium(false);
      setPlanType("free");
    }
  }, [auth.user, auth.isLoading, syncSubscription]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  const contextValue: AuthContextType = {
    ...auth,
    isPremium,
    planType,
    subscriptionLoading,
    syncSubscription,
  };

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

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
