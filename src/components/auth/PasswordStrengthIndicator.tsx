import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { getPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/password-validation";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  const { score, label, checks } = getPasswordStrength(password);

  if (!password) return null;

  const barColors = {
    weak: "bg-red-500",
    fair: "bg-orange-500",
    good: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const rules = [
    { key: "minLength", passed: checks.minLength, label: t("auth.passwordMinLength") },
    { key: "uppercase", passed: checks.hasUppercase, label: t("auth.passwordNeedsUppercase") },
    { key: "lowercase", passed: checks.hasLowercase, label: t("auth.passwordNeedsLowercase") },
    { key: "number", passed: checks.hasNumber, label: t("auth.passwordNeedsNumber") },
  ];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? barColors[label] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", barColors[label].replace("bg-", "text-"))}>
        {t(`auth.passwordStrength${label.charAt(0).toUpperCase() + label.slice(1)}`)}
      </p>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-center gap-1.5 text-xs">
            {rule.passed ? (
              <Check className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className={rule.passed ? "text-muted-foreground" : "text-foreground"}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
