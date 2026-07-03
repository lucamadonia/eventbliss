/**
 * SmartBar — quick preset chips (Empfohlen / Minimal / Alle) for the Studio.
 *
 * Reuses the wizard's preset configs so the two surfaces stay in sync:
 * "recommended" = questionConfigForEventType, "minimal" = attendance + duration
 * + date_blocks, "all" = every question on. Active detection uses the same
 * enabled-signature as EventQuestionsStep and morphs a gradient pill via
 * layoutId.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, ListChecks, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type QuestionConfigs,
  DEFAULT_QUESTION_CONFIG,
  CORE_QUESTION_KEYS,
  questionConfigForEventType,
} from "@/lib/survey-config";
import type { CoreKey } from "@/components/formstudio/questionRegistry";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const cloneCfg = (c: QuestionConfigs): QuestionConfigs => JSON.parse(JSON.stringify(c));
const sig = (c: QuestionConfigs) => CORE_QUESTION_KEYS.map((k) => (c[k]?.enabled ? "1" : "0")).join("");

interface SmartBarProps {
  eventType: string;
  current: QuestionConfigs;
  onApply: (config: QuestionConfigs) => void;
}

export function SmartBar({ eventType, current, onApply }: SmartBarProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();

  const presets = useMemo(() => {
    const all = cloneCfg(DEFAULT_QUESTION_CONFIG);
    CORE_QUESTION_KEYS.forEach((k) => (all[k] = { ...all[k], enabled: true }));
    const minimal = cloneCfg(DEFAULT_QUESTION_CONFIG);
    CORE_QUESTION_KEYS.forEach((k) => (minimal[k] = { ...minimal[k], enabled: false }));
    (["attendance", "duration", "date_blocks"] as CoreKey[]).forEach((k) => (minimal[k].enabled = true));
    return [
      { id: "recommended", icon: Wand2, config: questionConfigForEventType(eventType) },
      { id: "minimal", icon: ListChecks, config: minimal },
      { id: "all", icon: LayoutGrid, config: all },
    ];
  }, [eventType]);

  const activeSig = sig(current);

  return (
    <div className="grid grid-cols-3 gap-2">
      {presets.map((p) => {
        const active = sig(p.config) === activeSig;
        const Icon = p.icon;
        return (
          <motion.button
            key={p.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={spring.snappy}
            onClick={() => {
              haptics.medium();
              onApply(cloneCfg(p.config));
            }}
            aria-pressed={active}
            className={cn(
              "relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border py-3 text-xs font-semibold transition-colors duration-300",
              active
                ? "border-transparent text-white"
                : "border-border bg-foreground/[0.04] text-foreground/80 active:bg-foreground/[0.07]",
            )}
          >
            {active && (
              <motion.span
                layoutId="studio-preset-active"
                className="absolute inset-0 -z-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_8px_30px_-6px_rgba(217,70,239,0.6)]"
                transition={spring.snappy}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{t(`native.create.questions.presets.${p.id}`, p.id)}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
