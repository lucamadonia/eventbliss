import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ShieldAlert } from "lucide-react";

/**
 * AdminRoute — protects routes that require an admin role. Additionally
 * enforces a Supabase Auth Assurance Level of `aal2` (MFA-verified session)
 * before granting access. GDPR Art. 32 — appropriate technical measures
 * for privileged accounts.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [aalCheck, setAalCheck] = useState<{
    current: string | null;
    next: string | null;
    loading: boolean;
  }>({ current: null, next: null, loading: true });

  useEffect(() => {
    if (!user) {
      setAalCheck({ current: null, next: null, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (cancelled) return;
        if (error) {
          // Fail-open in dev — but log so prod can be monitored
          console.warn("[AdminRoute] AAL check failed", error);
          setAalCheck({ current: null, next: null, loading: false });
          return;
        }
        setAalCheck({
          current: data?.currentLevel ?? null,
          next: data?.nextLevel ?? null,
          loading: false,
        });
      } catch (e) {
        console.warn("[AdminRoute] AAL check error", e);
        setAalCheck({ current: null, next: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || adminLoading || aalCheck.loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // MFA enforcement — admin accounts must reach AAL2 (MFA verified) for the session.
  // currentLevel = aal1 + nextLevel = aal2 means the user CAN step up (has a factor enrolled).
  // currentLevel = aal1 + nextLevel = aal1 means the user has NO factor enrolled.
  const enforceMfa = import.meta.env.VITE_ADMIN_MFA_REQUIRED !== "false";

  if (enforceMfa && aalCheck.current !== "aal2") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <GlassCard padding="lg" className="max-w-md text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">
            Zusätzliche Verifizierung erforderlich
          </h1>
          <p className="text-muted-foreground mb-6">
            Admin-Bereich erfordert Multi-Faktor-Authentifizierung. Bitte aktiviere MFA in
            deinen Profil-Einstellungen oder melde dich mit MFA erneut an.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/settings">
              <GradientButton size="md" className="w-full">
                MFA einrichten / verifizieren
              </GradientButton>
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Zurück zur Startseite
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
}
