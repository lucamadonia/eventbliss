import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

interface SurveyProgressBarProps {
  /** Questions the guest has answered so far. */
  currentStep: number;
  /** Total answerable questions (participant + enabled core + customs). */
  totalSteps: number;
  /** Event branding colour for the fill (falls back to the theme primary). */
  themeColor?: string;
}

/**
 * Sticky guest-completion bar for the immersive survey. Shows the guest's own
 * progress (answered / total) plus a short time reassurance — distinct from
 * the event-level ProgressIndicator (which counts other guests' responses).
 */
const SurveyProgressBar = ({
  currentStep,
  totalSteps,
  themeColor,
}: SurveyProgressBarProps) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const safeTotal = Math.max(1, totalSteps);
  const progress = Math.min((currentStep / safeTotal) * 100, 100);
  const estimatedMinutes = Math.max(1, Math.ceil((safeTotal * 15) / 60));

  const gradientStyle = themeColor
    ? { background: `linear-gradient(90deg, ${themeColor}, ${themeColor}cc)` }
    : undefined;

  return (
    <div
      className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/[0.06] px-4 py-3"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-live="polite"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground font-medium">
            {t("guestForm.progressAnswered", {
              defaultValue: "{{current}} von {{total}} beantwortet",
              current: currentStep,
              total: safeTotal,
            })}
          </span>
          <span className="text-muted-foreground/70 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {t("guestForm.estimatedTime", {
              defaultValue: "schnell — ~{{minutes}} Min.",
              minutes: estimatedMinutes,
            })}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            style={gradientStyle}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 100, damping: 20 }
            }
          />
        </div>
      </div>
    </div>
  );
};

export default SurveyProgressBar;
