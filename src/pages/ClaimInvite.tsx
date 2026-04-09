import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { createPasswordSchema } from "@/lib/password-validation";

interface InviteData {
  participant_id: string;
  participant_name: string;
  event_name: string;
  event_slug: string;
  already_claimed: boolean;
}

const ClaimInvite = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const registerSchema = z.object({
    email: z.string().trim().email({ message: t("auth.invalidEmail") }),
    password: createPasswordSchema(t),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordsMismatch"),
    path: ["confirmPassword"],
  });

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verify invite token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifyError("Kein Einladungstoken gefunden");
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-invite-token", {
          body: { token },
        });

        if (error) throw error;

        if (!data.success) {
          setVerifyError(data.error || "Ungültiger Einladungslink");
          setIsVerifying(false);
          return;
        }

        setInviteData(data.invite);
      } catch (err) {
        console.error("Verify error:", err);
        setVerifyError("Einladungslink konnte nicht überprüft werden");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // If user is already authenticated, try to claim directly
  useEffect(() => {
    const claimWithExistingUser = async () => {
      if (isAuthenticated && user && inviteData && !inviteData.already_claimed) {
        setIsSubmitting(true);
        try {
          const { data, error } = await supabase.functions.invoke("claim-invite", {
            body: {
              token,
              user_id: user.id,
            },
          });

          if (error) throw error;

          if (data.success) {
            toast.success("Dashboard-Zugang aktiviert!");
            navigate(`/e/${slug}/dashboard`);
          } else {
            toast.error(data.error || "Fehler beim Aktivieren");
          }
        } catch (err) {
          console.error("Claim error:", err);
          toast.error("Fehler beim Aktivieren des Zugangs");
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    if (!isVerifying && inviteData) {
      claimWithExistingUser();
    }
  }, [isAuthenticated, user, inviteData, isVerifying, token, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const result = registerSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // First, create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getBaseUrl()}/e/${slug}/dashboard`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("Diese E-Mail ist bereits registriert. Bitte melde dich an.");
          navigate("/auth");
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      if (!signUpData.user) {
        toast.error("Registrierung fehlgeschlagen");
        return;
      }

      // Then claim the invite
      const { data: claimData, error: claimError } = await supabase.functions.invoke("claim-invite", {
        body: {
          token,
          user_id: signUpData.user.id,
        },
      });

      if (claimError) throw claimError;

      if (claimData.success) {
        toast.success("Account erstellt und Dashboard-Zugang aktiviert!");
        navigate(`/e/${slug}/dashboard`);
      } else {
        toast.error(claimData.error || "Fehler beim Aktivieren");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Einladung wird überprüft...</p>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  if (verifyError) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-8 text-center max-w-md">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">
                Einladung ungültig
              </h1>
              <p className="text-muted-foreground mb-6">{verifyError}</p>
              <GradientButton onClick={() => navigate("/")}>
                Zur Startseite
              </GradientButton>
            </GlassCard>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  if (inviteData?.already_claimed) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-8 text-center max-w-md">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">
                Bereits aktiviert
              </h1>
              <p className="text-muted-foreground mb-6">
                Diese Einladung wurde bereits angenommen. Du kannst dich anmelden, um auf das Dashboard zuzugreifen.
              </p>
              <div className="space-y-3">
                <GradientButton onClick={() => navigate("/auth")} className="w-full">
                  Anmelden
                </GradientButton>
                <GradientButton
                  variant="outline"
                  onClick={() => navigate(`/e/${slug}/dashboard`)}
                  className="w-full"
                >
                  Zum Dashboard
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  if (isAuthenticated && isSubmitting) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Dashboard-Zugang wird aktiviert...</p>
          </motion.div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">
                Hallo, {inviteData?.participant_name}!
              </h1>
              <p className="text-muted-foreground">
                Du wurdest zum Dashboard von <strong>{inviteData?.event_name}</strong> eingeladen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  className={errors.email ? "border-destructive" : ""}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 6 Zeichen"
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Passwort bestätigen
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  className={errors.confirmPassword ? "border-destructive" : ""}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <GradientButton
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {isSubmitting ? "Wird erstellt..." : "Account erstellen & Zugang aktivieren"}
              </GradientButton>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Bereits einen Account?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-primary hover:underline"
              >
                Anmelden
              </button>
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
};

export default ClaimInvite;
