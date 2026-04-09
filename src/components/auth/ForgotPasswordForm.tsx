import { useState } from "react";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/platform";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const emailSchema = z.string().trim().email({ message: t("auth.invalidEmail") });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Capacitor.isNativePlatform()
          ? 'app.eventbliss:///auth?type=recovery'
          : `${getBaseUrl()}/auth?type=recovery`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSent(true);
    } catch {
      toast.error(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <GlassCard className="p-8 w-full max-w-md">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">{t("auth.resetLinkSent")}</h1>
          <p className="text-muted-foreground mb-2">
            {t("auth.resetLinkSentDescription")}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.checkSpamFolder")}
          </p>
          <button
            onClick={onBackToLogin}
            className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backToLogin")}
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold mb-2">{t("auth.forgotPasswordTitle")}</h1>
        <p className="text-muted-foreground">
          {t("auth.forgotPasswordSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {t("auth.email")}
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            className={error ? "border-destructive" : ""}
            autoComplete="email"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <GradientButton
          type="submit"
          disabled={isLoading}
          className="w-full"
          icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isLoading ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
        </GradientButton>

        <p className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-primary hover:underline font-medium text-sm inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backToLogin")}
          </button>
        </p>
      </form>
    </GlassCard>
  );
}
