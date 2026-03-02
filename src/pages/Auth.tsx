import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const getSafeRedirect = (value: string | null) => {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.startsWith("/auth")) return "/";
  return value;
};

type AuthMode = "login" | "register" | "forgot" | "reset";

const Auth = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const typeParam = searchParams.get("type");

  const [mode, setMode] = useState<AuthMode>(() => {
    // Check for password recovery flow
    if (typeParam === "recovery" || sessionStorage.getItem("password_recovery")) {
      return "reset";
    }
    return "login";
  });

  useEffect(() => {
    // Don't redirect during password reset
    if (mode === "reset") return;
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo, mode]);

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AnimatedBackground>
    );
  }

  const renderForm = () => {
    switch (mode) {
      case "forgot":
        return (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
          </motion.div>
        );

      case "reset":
        return (
          <motion.div
            key="reset"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResetPasswordForm onBackToLogin={() => setMode("login")} />
          </motion.div>
        );

      case "register":
        return (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-8 w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold mb-2">{t('auth.createAccount')}</h1>
                <p className="text-muted-foreground">
                  {t('auth.registerSubtitle')}
                </p>
              </div>
              <RegisterForm onSwitchToLogin={() => setMode("login")} />
            </GlassCard>
          </motion.div>
        );

      default:
        return (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <LoginForm
              onSwitchToRegister={() => setMode("register")}
              onForgotPassword={() => setMode("forgot")}
            />
          </motion.div>
        );
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {renderForm()}
        </AnimatePresence>
      </div>
    </AnimatedBackground>
  );
};

export default Auth;
