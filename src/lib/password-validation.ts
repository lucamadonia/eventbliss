import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

interface PasswordStrength {
  score: number; // 0-4
  label: "weak" | "fair" | "good" | "strong";
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const label: PasswordStrength["label"] =
    score <= 1 ? "weak" : score === 2 ? "fair" : score === 3 ? "good" : "strong";

  return { score, label, checks };
}

export function createPasswordSchema(t: (key: string) => string) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: t("auth.passwordMinLength") })
    .regex(/[A-Z]/, { message: t("auth.passwordNeedsUppercase") })
    .regex(/[a-z]/, { message: t("auth.passwordNeedsLowercase") })
    .regex(/[0-9]/, { message: t("auth.passwordNeedsNumber") });
}
