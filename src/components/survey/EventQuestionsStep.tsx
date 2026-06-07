/**
 * EventQuestionsStep — the polished, fully-localized "choose your questions" step
 * shown to GUESTS (not logged in) during event creation. Produces a
 * `question_config` (+ optional custom_questions) persisted onto the event so the
 * public survey asks exactly the chosen questions.
 *
 * Controlled: parent owns `value` and gets updates via `onChange`.
 * `attendance` is always on (the whole RSVP/dashboard depends on it).
 */
import { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Lock, Sparkles, Plus, Wand2, ListChecks, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type QuestionConfigs,
  type CustomQuestion,
  DEFAULT_QUESTION_CONFIG,
  CORE_QUESTION_KEYS,
  questionConfigForEventType,
} from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

export interface QuestionsValue {
  question_config: QuestionConfigs;
  custom_questions: CustomQuestion[];
}

type CoreKey = keyof QuestionConfigs;

const GROUPS: { id: string; keys: CoreKey[] }[] = [
  { id: "basics", keys: ["attendance", "duration", "date_blocks"] },
  { id: "logistik", keys: ["budget", "destination", "travel"] },
  { id: "vibe", keys: ["activities", "fitness", "alcohol"] },
];

const EMOJI: Record<CoreKey, string> = {
  attendance: "🎉", duration: "🗓️", date_blocks: "📅", budget: "💶",
  destination: "📍", travel: "🧳", activities: "🎯", fitness: "💪", alcohol: "🍻",
};

const CUSTOM_PRESETS: { id: string; emoji: string; q: Omit<CustomQuestion, "id"> }[] = [
  { id: "dietary",  emoji: "🥗", q: { type: "textarea", label: "Ernährung / Allergien?", required: false, placeholder: "z.B. vegetarisch, Nuss-Allergie" } },
  { id: "song",     emoji: "🎵", q: { type: "text", label: "Songwunsch?", required: false } },
  { id: "tshirt",   emoji: "👕", q: { type: "select", label: "T-Shirt-Größe", required: false, options: ["S", "M", "L", "XL", "XXL"] } },
  { id: "license",  emoji: "🚗", q: { type: "toggle", label: "Führerschein?", required: false } },
];

const clone = (c: QuestionConfigs): QuestionConfigs => JSON.parse(JSON.stringify(c));
const sig = (c: QuestionConfigs) => CORE_QUESTION_KEYS.map((k) => (c[k]?.enabled ? "1" : "0")).join("");

export function EventQuestionsStep({
  value,
  onChange,
  eventType = "",
}: {
  value: QuestionsValue;
  onChange: (v: QuestionsValue) => void;
  eventType?: string;
}) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const { question_config: qc, custom_questions } = value;

  const enabledCount = useMemo(
    () => CORE_QUESTION_KEYS.filter((k) => qc[k]?.enabled).length + custom_questions.length,
    [qc, custom_questions],
  );

  // Quick presets ------------------------------------------------------------
  const presets = useMemo(() => {
    const all = clone(DEFAULT_QUESTION_CONFIG);
    CORE_QUESTION_KEYS.forEach((k) => (all[k] = { ...all[k], enabled: true }));
    const minimal = clone(DEFAULT_QUESTION_CONFIG);
    CORE_QUESTION_KEYS.forEach((k) => (minimal[k] = { ...minimal[k], enabled: false }));
    (["attendance", "duration", "date_blocks"] as CoreKey[]).forEach((k) => (minimal[k].enabled = true));
    return [
      { id: "recommended", icon: Wand2, config: questionConfigForEventType(eventType) },
      { id: "minimal", icon: ListChecks, config: minimal },
      { id: "all", icon: LayoutGrid, config: all },
    ];
  }, [eventType]);
  const activeSig = sig(qc);

  const applyPreset = (config: QuestionConfigs) => {
    haptics.medium();
    onChange({ ...value, question_config: clone(config) });
  };

  const toggle = (key: CoreKey) => {
    if (key === "attendance") return; // always on
    haptics.select();
    onChange({ ...value, question_config: { ...qc, [key]: { ...qc[key], enabled: !qc[key].enabled } } });
  };

  const togglePreset = (presetId: string, q: Omit<CustomQuestion, "id">) => {
    haptics.select();
    const exists = custom_questions.some((c) => c.id === presetId);
    onChange({
      ...value,
      custom_questions: exists
        ? custom_questions.filter((c) => c.id !== presetId)
        : [...custom_questions, { id: presetId, ...q }],
    });
  };

  return (
    <div className="pt-2">
      <h2 className="text-2xl font-display font-bold text-foreground mb-1">
        {t("native.create.questions.title", "Welche Fragen?")}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t("native.create.questions.subtitle", "Wähle, was dein Formular fragen soll. Später jederzeit änderbar.")}
      </p>

      {/* Hero: live counter + smart hint */}
      <div className="flex items-center justify-between gap-3 mb-4 rounded-2xl px-4 py-3 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-primary/20">
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="w-3.5 h-3.5" /> {t("native.create.questions.smartHint", "Smart-Vorschlag aktiv")}
        </span>
        <span className="flex items-baseline gap-1">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={enabledCount}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 1.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="text-lg font-black text-primary tabular-nums"
            >
              {enabledCount}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs font-semibold text-primary/80">{t("native.create.questions.countSuffix", "Fragen")}</span>
        </span>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 mb-6">
        {presets.map((p) => {
          const active = sig(p.config) === activeSig;
          const Icon = p.icon;
          return (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => applyPreset(p.config)}
              aria-pressed={active}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-white border-primary shadow-[0_0_18px_rgba(139,92,246,0.35)]"
                  : "bg-foreground/[0.04] text-foreground/80 border-border",
              )}
            >
              <Icon className="w-4 h-4" />
              {t(`native.create.questions.presets.${p.id}`, p.id)}
            </motion.button>
          );
        })}
      </div>

      {/* Grouped question cards */}
      {GROUPS.map((group) => {
        const total = group.keys.length;
        const on = group.keys.filter((k) => qc[k]?.enabled).length;
        return (
          <div key={group.id} className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t(`native.create.questions.groups.${group.id}`, group.id)}
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground/50">{on}/{total}</span>
            </div>
            <div className="space-y-2.5">
              {group.keys.map((key) => {
                const locked = key === "attendance";
                const isOn = qc[key].enabled;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    layout={!reduce}
                    whileTap={{ scale: locked ? 1 : 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onClick={() => toggle(key)}
                    aria-pressed={isOn}
                    aria-disabled={locked}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors",
                      isOn
                        ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-primary/40"
                        : "bg-foreground/[0.03] border-border",
                    )}
                  >
                    <span className="text-2xl leading-none">{EMOJI[key]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base font-semibold text-foreground">
                          {t(`native.create.questions.q.${key}.title`, key)}
                        </span>
                        {locked && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-foreground/10 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            <Lock className="w-2.5 h-2.5" />
                            {t("native.create.questions.attendanceAlways", "immer dabei")}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {t(`native.create.questions.q.${key}.desc`, "")}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full grid place-items-center border-2 transition-colors",
                        isOn ? "bg-primary border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      <AnimatePresence>
                        {isOn && (
                          <motion.span
                            initial={reduce ? { opacity: 0 } : { scale: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={reduce ? { opacity: 0 } : { scale: 0 }}
                            transition={{ type: "spring", stiffness: 600, damping: 24 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Extra questions */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2.5">
          {t("native.create.questions.extrasTitle", "Extra-Fragen (optional)")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_PRESETS.map((p) => {
            const on = custom_questions.some((c) => c.id === p.id);
            return (
              <motion.button
                key={p.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePreset(p.id, p.q)}
                aria-pressed={on}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors",
                  on ? "bg-primary text-white border-primary" : "bg-foreground/5 text-foreground/80 border-border",
                )}
              >
                <span>{p.emoji}</span>
                {t(`native.create.questions.custom.${p.id}`, p.id)}
                {on ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EventQuestionsStep;
