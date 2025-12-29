import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ForcePasswordChange } from "./ForcePasswordChange";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

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

  return (
    <AuthContext.Provider value={auth}>
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
