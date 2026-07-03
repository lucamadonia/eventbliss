/**
 * EventQuestionsStep — "Liquid Party Premium" question picker for GUESTS during
 * event creation. The user chooses WHICH questions appear AND can define their
 * ANSWERS inline (dates, budget tiers, destinations, activities, …).
 *
 * Controlled: parent owns `value` and gets updates via `onChange`.
 * `attendance` is always on (the whole RSVP/dashboard depends on it).
 *
 * Free: all core questions + smart/quick presets + answer editing + 1 custom
 * extra question. Premium: unlimited custom extra questions (gentle nudge).
 */
import { useMemo, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  type Transition,
} from "framer-motion";
import { Check, Lock, Sparkles, Plus, Wand2, ListChecks, LayoutGrid, Crown, ChevronDown, CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  type QuestionConfigs,
  type QuestionConfig,
  type CustomQuestion,
  type SelectOption,
  type ActivityOption,
  DEFAULT_SURVEY_CONFIG,
  DEFAULT_QUESTION_CONFIG,
  CORE_QUESTION_KEYS,
  questionConfigForEventType,
} from "@/lib/survey-config";
import { CoreQuestionEditor } from "@/components/dashboard/CoreQuestionEditor";
import { CORE_META_BY_KEY } from "@/components/formstudio/questionRegistry";
import { DateRangeBlockEditor, type DateRangeBlock } from "@/components/dashboard/DateRangeBlockEditor";
import {
  CUSTOM_QUESTION_PRESETS,
  presetAlreadyAdded,
  type CustomQuestionPreset,
} from "@/lib/custom-question-presets";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { cn } from "@/lib/utils";

/** Free tier: one custom "extra" question as a teaser. Premium = unlimited. */
const FREE_CUSTOM_LIMIT = 1;

type CoreKey = keyof QuestionConfigs;

export interface QuestionsOptions {
  date_range_blocks: DateRangeBlock[];
  attendance_options: SelectOption[];
  duration_options: SelectOption[];
  budget_options: SelectOption[];
  destination_options: SelectOption[];
  travel_options: SelectOption[];
  fitness_options: SelectOption[];
  alcohol_options: SelectOption[];
  activity_options: ActivityOption[];
}

export interface QuestionsValue {
  question_config: QuestionConfigs;
  custom_questions: CustomQuestion[];
  options: QuestionsOptions;
}

const cloneArr = <T,>(a: T[]): T[] => JSON.parse(JSON.stringify(a));

/** Fresh, fully-defaulted answer options (parents use this to seed state). */
export const defaultQuestionsOptions = (): QuestionsOptions => ({
  date_range_blocks: [],
  attendance_options: cloneArr(DEFAULT_SURVEY_CONFIG.attendance_options),
  duration_options: cloneArr(DEFAULT_SURVEY_CONFIG.duration_options),
  budget_options: cloneArr(DEFAULT_SURVEY_CONFIG.budget_options),
  destination_options: cloneArr(DEFAULT_SURVEY_CONFIG.destination_options),
  travel_options: cloneArr(DEFAULT_SURVEY_CONFIG.travel_options),
  fitness_options: cloneArr(DEFAULT_SURVEY_CONFIG.fitness_options),
  alcohol_options: cloneArr(DEFAULT_SURVEY_CONFIG.alcohol_options),
  activity_options: cloneArr(DEFAULT_SURVEY_CONFIG.activity_options),
});

/** Flatten the editable options into the `settings` shape the survey form reads. */
export function questionsOptionsToSettings(o: QuestionsOptions): Record<string, unknown> {
  const date_blocks: Record<string, string> = {};
  const date_warnings: Record<string, string> = {};
  o.date_range_blocks.forEach((b) => {
    date_blocks[b.key] = b.label || `${b.start} – ${b.end}`;
    if (b.warning) date_warnings[b.key] = b.warning;
  });
  return {
    date_blocks,
    date_warnings,
    date_ranges: o.date_range_blocks,
    attendance_options: o.attendance_options,
    duration_options: o.duration_options,
    budget_options: o.budget_options,
    destination_options: o.destination_options,
    travel_options: o.travel_options,
    fitness_options: o.fitness_options,
    alcohol_options: o.alcohol_options,
    activity_options: o.activity_options,
  };
}

const GROUPS: { id: string; keys: CoreKey[] }[] = [
  { id: "basics", keys: ["attendance", "duration", "date_blocks"] },
  { id: "logistik", keys: ["budget", "destination", "travel"] },
  { id: "vibe", keys: ["activities", "fitness", "alcohol"] },
];

const EMOJI: Record<CoreKey, string> = {
  attendance: "🎉", duration: "🗓️", date_blocks: "📅", budget: "💶",
  destination: "📍", travel: "🧳", activities: "🎯", fitness: "💪", alcohol: "🍻",
};

// core question key -> its editable option array in QuestionsOptions
const OPT_KEY: Partial<Record<CoreKey, keyof QuestionsOptions>> = {
  attendance: "attendance_options", duration: "duration_options", budget: "budget_options",
  destination: "destination_options", travel: "travel_options", fitness: "fitness_options",
  alcohol: "alcohol_options", activities: "activity_options",
};

const TOTAL_SLOTS = CORE_QUESTION_KEYS.length + CUSTOM_QUESTION_PRESETS.length;

const cloneCfg = (c: QuestionConfigs): QuestionConfigs => JSON.parse(JSON.stringify(c));
const sig = (c: QuestionConfigs) => CORE_QUESTION_KEYS.map((k) => (c[k]?.enabled ? "1" : "0")).join("");
const SPRING: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 };

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
  const { isPremium } = usePremium();
  const { question_config: qc, custom_questions, options } = value;

  const [expanded, setExpanded] = useState<Set<CoreKey>>(new Set());

  const enabledCount = useMemo(
    () => CORE_QUESTION_KEYS.filter((k) => qc[k]?.enabled).length + custom_questions.length,
    [qc, custom_questions],
  );
  const progress = Math.min(1, enabledCount / TOTAL_SLOTS);

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
  const activeSig = sig(qc);

  const applyPreset = (config: QuestionConfigs) => {
    haptics.medium();
    onChange({ ...value, question_config: cloneCfg(config) });
  };

  const toggle = (key: CoreKey) => {
    if (key === "attendance") return; // always on
    haptics.select();
    const nextOn = !qc[key].enabled;
    // Auto-open the answer editor when enabling date blocks (they're empty by
    // default → the question would otherwise be invisible on the public form).
    if (key === "date_blocks" && nextOn) setExpanded((s) => new Set(s).add("date_blocks"));
    onChange({ ...value, question_config: { ...qc, [key]: { ...qc[key], enabled: nextOn } } });
  };

  const toggleExpand = (key: CoreKey) => {
    haptics.light();
    setExpanded((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const setConfig = (key: CoreKey, cfg: QuestionConfig) =>
    onChange({ ...value, question_config: { ...qc, [key]: cfg } });

  const setOptions = (optKey: keyof QuestionsOptions, arr: SelectOption[] | ActivityOption[] | DateRangeBlock[]) =>
    onChange({ ...value, options: { ...options, [optKey]: arr } });

  const togglePreset = (preset: CustomQuestionPreset) => {
    const ids = new Set([preset.id, ...preset.aliases]);
    const exists = custom_questions.some((c) => ids.has(c.id));
    if (!exists && !isPremium && custom_questions.length >= FREE_CUSTOM_LIMIT) {
      void haptics.warning();
      toast.info(t("native.create.questions.premiumHint", "Mehr eigene Fragen mit Premium"));
      return;
    }
    haptics.select();
    onChange({
      ...value,
      custom_questions: exists
        ? custom_questions.filter((c) => !ids.has(c.id))
        : [...custom_questions, { id: preset.id, ...preset.build(t) }],
    });
  };

  const container: Variants = {
    hidden: {},
    show: { transition: reduce ? { staggerChildren: 0 } : { staggerChildren: 0.06, delayChildren: 0.04 } },
  };
  const item: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
      };

  const R = 26;
  const C = 2 * Math.PI * R;

  /** Renders the inline answer editor for an enabled question. */
  const renderEditor = (key: CoreKey) => {
    if (key === "date_blocks") {
      return (
        <div className="space-y-2">
          {options.date_range_blocks.length === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-500">
              <CalendarPlus className="h-3.5 w-3.5" />
              {t("native.create.questions.noDatesYet", "Lege mindestens einen Termin fest")}
            </p>
          )}
          <DateRangeBlockEditor
            blocks={options.date_range_blocks}
            onChange={(b) => setOptions("date_range_blocks", b)}
          />
        </div>
      );
    }
    const optKey = OPT_KEY[key];
    if (!optKey) return null;
    return (
      <CoreQuestionEditor
        title={t(`native.create.questions.q.${key}.title`, key)}
        options={options[optKey] as SelectOption[]}
        onChange={(o) => setOptions(optKey, o)}
        showVisibilityToggle={false}
        allowAddRemove={CORE_META_BY_KEY[key].policy.canEditValues}
        allowMultiToggle={CORE_META_BY_KEY[key].policy.canMultiSelect}
        allowDisable={CORE_META_BY_KEY[key].policy.canDisable}
        questionConfig={qc[key]}
        onConfigChange={(c) => setConfig(key, c)}
        maxOptions={key === "activities" ? 15 : 8}
      />
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="relative pt-2">
      {/* Gradient-mesh atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, 24, -8, 0], y: [0, 16, -10, 0], scale: [1, 1.12, 0.96, 1] }}
          transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-10 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, -20, 10, 0], y: [0, 24, -6, 0], scale: [1, 0.94, 1.1, 1] }}
          transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div variants={item}>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">
          {t("native.create.questions.title", "Welche Fragen?")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("native.create.questions.subtitle", "Wähle, was dein Formular fragen soll. Später jederzeit änderbar.")}
        </p>
      </motion.div>

      {/* HERO */}
      <motion.div variants={item} className="mb-5">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-violet-500/10 via-background/40 to-fuchsia-500/10 p-4 backdrop-blur-xl">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl"
            animate={
              reduce
                ? { opacity: 0.25 + progress * 0.35 }
                : { opacity: [0.2 + progress * 0.3, 0.45 + progress * 0.4, 0.2 + progress * 0.3], scale: [1, 1.08, 1] }
            }
            transition={reduce ? { duration: 0.4 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex items-center gap-4">
            <div className="relative grid h-[68px] w-[68px] shrink-0 place-items-center">
              <svg width="68" height="68" viewBox="0 0 68 68" className="absolute inset-0 -rotate-90">
                <defs>
                  <linearGradient id="eqs-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(139,92,246)" />
                    <stop offset="100%" stopColor="rgb(217,70,239)" />
                  </linearGradient>
                </defs>
                <circle cx="34" cy="34" r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground/10" />
                <motion.circle
                  cx="34" cy="34" r={R} fill="none" stroke="url(#eqs-ring)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={C} initial={false}
                  animate={{ strokeDashoffset: C * (1 - progress) }}
                  transition={reduce ? { duration: 0.25 } : { type: "spring", stiffness: 160, damping: 24 }}
                />
              </svg>
              {!reduce && (
                <motion.div aria-hidden className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 text-fuchsia-400/80" />
                </motion.div>
              )}
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={enabledCount}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 1.4, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.7, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className="font-display text-2xl font-black tabular-nums text-foreground"
                >
                  {enabledCount}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
                <Sparkles className="h-3 w-3" />
                {t("native.create.questions.smartHint", "Smart-Vorschlag aktiv")}
              </span>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-display text-lg font-extrabold leading-none text-foreground tabular-nums">{enabledCount}</span>
                <span className="text-sm font-medium text-muted-foreground">{t("native.create.questions.countSuffix", "Fragen")}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick presets */}
      <motion.div variants={item} className="mb-6 grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const active = sig(p.config) === activeSig;
          const Icon = p.icon;
          return (
            <motion.button
              key={p.id}
              type="button"
              whileTap={reduce ? undefined : { scale: 0.95 }}
              transition={SPRING}
              onClick={() => applyPreset(p.config)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border py-3 text-xs font-semibold transition-colors duration-300",
                active ? "border-transparent text-white" : "border-border bg-foreground/[0.04] text-foreground/80 active:bg-foreground/[0.07]",
              )}
            >
              {active && (
                <motion.span layoutId="eqs-preset-active" className="absolute inset-0 -z-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_8px_30px_-6px_rgba(217,70,239,0.6)]" transition={reduce ? { duration: 0.2 } : SPRING} />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t(`native.create.questions.presets.${p.id}`, p.id)}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Grouped question cards */}
      {GROUPS.map((group) => {
        const total = group.keys.length;
        const on = group.keys.filter((k) => qc[k]?.enabled).length;
        return (
          <motion.div variants={item} key={group.id} className="mb-6">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t(`native.create.questions.groups.${group.id}`, group.id)}
              </h3>
              <span className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-mono text-muted-foreground/60 tabular-nums">{on}/{total}</span>
            </div>
            <div className="space-y-2.5">
              {group.keys.map((key) => {
                const locked = key === "attendance";
                const isOn = qc[key].enabled;
                const isExpanded = expanded.has(key);
                return (
                  <div
                    key={key}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border transition-colors duration-300",
                      isOn
                        ? "border-primary/40 bg-gradient-to-r from-violet-500/[0.12] to-fuchsia-500/[0.12] shadow-[0_10px_30px_-12px_rgba(139,92,246,0.5)]"
                        : "border-border bg-foreground/[0.03]",
                    )}
                  >
                    <div className="relative flex items-center gap-3 p-3.5">
                      {/* toggle area */}
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-pressed={isOn}
                        aria-disabled={locked}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <motion.span className="text-2xl leading-none" animate={isOn && !reduce ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }} transition={SPRING}>
                          {EMOJI[key]}
                        </motion.span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-base font-semibold text-foreground">{t(`native.create.questions.q.${key}.title`, key)}</span>
                            {locked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                <Lock className="h-2.5 w-2.5" />
                                {t("native.create.questions.attendanceAlways", "immer dabei")}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{t(`native.create.questions.q.${key}.desc`, "")}</span>
                        </span>
                        {/* sliding-pill toggle */}
                        <span className={cn("relative flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300", isOn ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-foreground/15", locked && "opacity-90")}>
                          <motion.span className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm" animate={{ x: isOn ? 20 : 0 }} transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 700, damping: 32 }}>
                            {locked ? <Lock className="h-3 w-3 text-primary" /> : isOn ? <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
                          </motion.span>
                        </span>
                      </button>

                      {/* edit-answers expander (only when the question is on) */}
                      {isOn && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          aria-expanded={isExpanded}
                          aria-label={t("native.create.questions.editAnswers", "Antworten bearbeiten")}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={SPRING}>
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                        </button>
                      )}
                    </div>

                    {/* inline answer editor */}
                    <AnimatePresence initial={false}>
                      {isOn && isExpanded && (
                        <motion.div
                          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 bg-background/30 p-3">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                              {t("native.create.questions.editAnswers", "Antworten bearbeiten")}
                            </p>
                            {renderEditor(key)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Extra questions */}
      <motion.div variants={item} className="mb-4">
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
          {t("native.create.questions.extrasTitle", "Extra-Fragen (optional)")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_QUESTION_PRESETS.map((p) => {
            const isOn = presetAlreadyAdded(p, custom_questions);
            const locked = !isOn && !isPremium && custom_questions.length >= FREE_CUSTOM_LIMIT;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileTap={reduce ? undefined : { scale: 0.93 }}
                transition={SPRING}
                onClick={() => togglePreset(p)}
                aria-pressed={isOn}
                className={cn(
                  "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-300",
                  isOn
                    ? "border-transparent text-white"
                    : locked
                      ? "border-amber-400/30 bg-amber-400/5 text-foreground/55"
                      : "border-border bg-foreground/5 text-foreground/80 active:bg-foreground/[0.08]",
                )}
              >
                {isOn && (
                  <motion.span layoutId={`eqs-extra-${p.id}`} className="absolute inset-0 -z-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_6px_20px_-6px_rgba(217,70,239,0.6)]" transition={reduce ? { duration: 0.2 } : SPRING} />
                )}
                <span className="relative z-10">{p.emoji}</span>
                <span className="relative z-10">{t(p.labelKey)}</span>
                <span className="relative z-10">
                  {isOn ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : locked ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-500">
                      <Crown className="h-2.5 w-2.5" />
                      {t("native.create.questions.premiumBadge", "Premium")}
                    </span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 opacity-60" />
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default EventQuestionsStep;
