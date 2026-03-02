import { useState } from "react";
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { createPasswordSchema } from "@/lib/password-validation";
import { toast } from "sonner";

interface ResetPasswordFormProps {
  onBackToLogin: () => void;
}

export function ResetPasswordForm({ onBackToLogin }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const resetSchema = z
    .object({
      password: createPasswordSchema(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
      // Clear recovery flag
      sessionStorage.removeItem("password_recovery");
    } catch {
      toast.error(t("auth.errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <GlassCard className="p-8 w-full max-w-md">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">
            {t("auth.passwordResetSuccess")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("auth.passwordResetSuccessDescription")}
          </p>
          <GradientButton onClick={onBackToLogin} className="w-full">
            {t("auth.backToLogin")}
          </GradientButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold mb-2">
          {t("auth.resetPasswordTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("auth.resetPasswordSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t("auth.newPassword")}
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          <PasswordStrengthIndicator password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t("auth.confirmPassword")}
          </Label>
          <Input
            id="confirm-new-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={errors.confirmPassword ? "border-destructive" : ""}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <GradientButton
          type="submit"
          disabled={isLoading}
          className="w-full"
          icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isLoading ? t("auth.resettingPassword") : t("auth.resetPassword")}
        </GradientButton>
      </form>
    </GlassCard>
  );
}
