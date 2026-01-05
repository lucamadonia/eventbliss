import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Calendar, Sparkles, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { cn } from "@/lib/utils";

interface DayPlanDurationSelectorProps {
  onSelect: (days: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  remainingCredits?: number;
}

const DURATION_OPTIONS = [
  {
    days: 3,
    emoji: "🎉",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
    ring: "ring-emerald-500/30",
  },
  {
    days: 5,
    emoji: "🚀",
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    border: "border-blue-500/30",
    hoverBorder: "hover:border-blue-500/50",
    ring: "ring-blue-500/30",
  },
  {
    days: 7,
    emoji: "🌟",
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    border: "border-violet-500/30",
    hoverBorder: "hover:border-violet-500/50",
    ring: "ring-violet-500/30",
  },
];

export const DayPlanDurationSelector = ({
  onSelect,
  isLoading = false,
  disabled = false,
  remainingCredits,
}: DayPlanDurationSelectorProps) => {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number | null>(null);

  const handleGenerate = () => {
    if (selectedDays && !disabled && !isLoading) {
      onSelect(selectedDays);
    }
  };

  const noCredits = remainingCredits !== undefined && remainingCredits <= 0;

  return (
    <GlassCard className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-gradient-primary">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <h3 className="font-display text-xl font-bold">
          {t("aiCredits.selectDuration")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("aiCredits.selectDurationDesc")}
        </p>
      </div>

      {/* Duration Options */}
      <div className="grid grid-cols-3 gap-3">
        {DURATION_OPTIONS.map((option, index) => {
          const isSelected = selectedDays === option.days;
          
          return (
            <motion.button
              key={option.days}
              type="button"
              onClick={() => !disabled && !noCredits && setSelectedDays(option.days)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200",
                "flex flex-col items-center gap-2",
                "bg-gradient-to-br",
                option.gradient,
                isSelected ? option.ring : option.border,
                isSelected ? "ring-2" : "",
                option.hoverBorder,
                disabled || noCredits ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!disabled && !noCredits ? { scale: 1.02 } : undefined}
              whileTap={!disabled && !noCredits ? { scale: 0.98 } : undefined}
              disabled={disabled || noCredits}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="font-bold text-lg">{option.days}</span>
              <span className="text-xs text-muted-foreground">
                {t(`aiCredits.days${option.days}`)}
              </span>
              
              {isSelected && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <span className="text-primary-foreground text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Generate Button */}
      <div className="space-y-3">
        <GradientButton
          onClick={handleGenerate}
          disabled={!selectedDays || disabled || isLoading || noCredits}
          className="w-full"
          size="lg"
          icon={
            isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )
          }
        >
          {isLoading
            ? t("aiCredits.generating")
            : t("aiCredits.generatePlan")}
        </GradientButton>

        {/* Credit cost info */}
        <p className="text-center text-xs text-muted-foreground">
          {t("aiCredits.costInfo", { cost: 1 })}
        </p>

        {noCredits && (
          <p className="text-center text-xs text-red-500 font-medium">
            {t("aiCredits.noCreditsLeft")}
          </p>
        )}
      </div>
    </GlassCard>
  );
};
