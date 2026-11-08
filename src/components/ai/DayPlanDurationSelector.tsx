import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { cn } from "@/lib/utils";

interface DayPlanDurationSelectorProps {
  onSelect: (days: number, wishes?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  remainingCredits?: number;
}

const DURATION_OPTIONS = [
  { days: 3, image: "/images/planning-studio/duration-3-v2.webp" },
  { days: 5, image: "/images/planning-studio/duration-5-v2.webp" },
  { days: 7, image: "/images/planning-studio/duration-7-v2.webp" },
] as const;

export const DayPlanDurationSelector = ({ onSelect, isLoading = false, disabled = false, remainingCredits }: DayPlanDurationSelectorProps) => {
  const { t } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [wishes, setWishes] = useState("");
  const locked = disabled || isLoading || (remainingCredits !== undefined && remainingCredits <= 0);

  const selectCustomDays = (value: string) => {
    setCustomDays(value);
    const days = Number(value);
    setSelectedDays(Number.isInteger(days) && days >= 1 && days <= 14 ? days : null);
  };

  return (
    <GlassCard className="space-y-5 overflow-hidden p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("aiCredits.selectDuration")}</p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{t("aiCredits.selectDurationDesc")}</h3>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible" aria-label={t("aiCredits.selectDuration")}>
        {DURATION_OPTIONS.map((option, index) => {
          const selected = customDays === "" && selectedDays === option.days;
          return (
            <motion.button
              key={option.days}
              type="button"
              aria-pressed={selected}
              onClick={() => { setSelectedDays(option.days); setCustomDays(""); }}
              disabled={locked}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={cn(
                "relative h-48 min-w-[72%] snap-center overflow-hidden rounded-2xl border text-left shadow-lg transition-colors sm:min-w-0",
                selected ? "border-violet-300 ring-2 ring-violet-400/60" : "border-white/15 hover:border-white/40",
                locked && "cursor-not-allowed opacity-55",
              )}
            >
              <img src={option.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b16] via-[#0b0b16]/30 to-transparent" />
              {selected && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-violet-500 text-white"><Check className="h-4 w-4" /></span>}
              <span className="absolute inset-x-4 bottom-4 flex flex-col text-white">
                <span className="text-2xl font-bold tracking-tight">{t("aiCredits.dayCount", { count: option.days })}</span>
                <span className="text-sm text-white/80">{t(`aiCredits.days${option.days}`)}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>{t("aiCredits.customDays")}</span>
          <input type="number" min={1} max={14} inputMode="numeric" value={customDays}
            onChange={(event) => selectCustomDays(event.target.value)} disabled={locked} placeholder="1–14"
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-violet-400" />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>{t("aiCredits.planWishes")}</span>
          <textarea value={wishes} onChange={(event) => setWishes(event.target.value)} disabled={locked}
            maxLength={500} rows={2} placeholder={t("aiCredits.planWishesPlaceholder")}
            className="min-h-12 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-violet-400" />
        </label>
      </div>

      <div className="space-y-2">
        <GradientButton onClick={() => selectedDays && onSelect(selectedDays, wishes.trim() || undefined)}
          disabled={!selectedDays || locked} className="w-full" size="lg"
          icon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}>
          {isLoading ? t("aiCredits.generating") : t("aiCredits.generatePlan")}
        </GradientButton>
        <p className="text-center text-xs text-muted-foreground">{t("aiCredits.costInfo", { cost: 1 })}</p>
        {remainingCredits !== undefined && remainingCredits <= 0 && <p className="text-center text-xs font-medium text-red-500">{t("aiCredits.noCreditsLeft")}</p>}
      </div>
    </GlassCard>
  );
};
