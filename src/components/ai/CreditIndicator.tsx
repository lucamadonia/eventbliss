import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditIndicatorProps {
  used: number;
  limit: number;
  remaining: number;
  resetDate: Date;
  loading?: boolean;
  variant?: "full" | "compact" | "minimal";
  showAnimation?: boolean;
  className?: string;
}

export const CreditIndicator = ({
  used,
  limit,
  remaining,
  resetDate,
  loading = false,
  variant = "full",
  showAnimation = false,
  className,
}: CreditIndicatorProps) => {
  const { t, i18n } = useTranslation();

  if (loading || limit === 0) return null;

  const percentage = limit > 0 ? (remaining / limit) * 100 : 0;
  const isLow = remaining <= 5 && remaining > 0;
  const isEmpty = remaining === 0;
  
  // Color based on remaining percentage
  const getColor = () => {
    if (isEmpty) return { stroke: "stroke-red-500", text: "text-red-500", bg: "bg-red-500" };
    if (isLow) return { stroke: "stroke-amber-500", text: "text-amber-500", bg: "bg-amber-500" };
    if (percentage > 50) return { stroke: "stroke-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500" };
    return { stroke: "stroke-primary", text: "text-primary", bg: "bg-primary" };
  };

  const colors = getColor();
  const radius = variant === "full" ? 40 : 24;
  const strokeWidth = variant === "full" ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const formattedResetDate = resetDate.toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
  });

  // Minimal variant - just text
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <motion.div
          initial={showAnimation ? { scale: 1.2 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <Sparkles className={cn("w-4 h-4", colors.text)} />
        </motion.div>
        <span className={cn("font-medium tabular-nums", colors.text)}>
          {remaining}/{limit}
        </span>
        <span className="text-muted-foreground">{t("aiCredits.credits")}</span>
      </div>
    );
  }

  // Compact variant - small ring with number
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="relative">
          <svg width={56} height={56} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={28}
              cy={28}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-muted/30"
            />
            {/* Progress circle */}
            <motion.circle
              cx={28}
              cy={28}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={colors.stroke}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className={cn("font-bold text-lg tabular-nums", colors.text)}
              initial={showAnimation ? { scale: 1.3 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              {remaining}
            </motion.span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {t("aiCredits.remaining")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("aiCredits.resetOn", { date: formattedResetDate })}
          </span>
        </div>
      </div>
    );
  }

  // Full variant - large ring with details
  return (
    <motion.div
      className={cn(
        "relative p-4 rounded-2xl border bg-gradient-to-br from-background via-background to-muted/20",
        isEmpty ? "border-red-500/30" : isLow ? "border-amber-500/30" : "border-primary/20",
        className
      )}
      initial={showAnimation ? { scale: 0.95, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={96} height={96} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={48}
              cy={48}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-muted/20"
            />
            {/* Progress circle */}
            <motion.circle
              cx={48}
              cy={48}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={colors.stroke}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              className={cn("flex items-center gap-1", colors.text)}
              initial={showAnimation ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: 0.2 }}
            >
              {isEmpty ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </motion.div>
            <motion.span
              className={cn("font-bold text-2xl tabular-nums", colors.text)}
              initial={showAnimation ? { scale: 1.3 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
            >
              {remaining}
            </motion.span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={cn("w-4 h-4", colors.text)} />
            <h4 className="font-bold text-sm">{t("aiCredits.title")}</h4>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("aiCredits.used")}</span>
              <span className="font-medium tabular-nums">{used} / {limit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("aiCredits.remaining")}</span>
              <span className={cn("font-bold tabular-nums", colors.text)}>{remaining}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("aiCredits.reset")}</span>
              <span className="text-muted-foreground">{formattedResetDate}</span>
            </div>
          </div>

          {/* Warning messages */}
          {isEmpty && (
            <motion.p
              className="text-xs text-red-500 mt-2 font-medium"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t("aiCredits.exhausted")}
            </motion.p>
          )}
          {isLow && !isEmpty && (
            <motion.p
              className="text-xs text-amber-500 mt-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t("aiCredits.lowCredits", { count: remaining })}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
