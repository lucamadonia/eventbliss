/**
 * EventQuestionsStep — "Liquid Party Premium" redesign.
 *
 * The polished, fully-localized "choose your questions" step shown to GUESTS
 * during event creation. Produces a `question_config` (+ optional
 * custom_questions) persisted onto the event so the public survey asks exactly
 * the chosen questions.
 *
 * Controlled: parent owns `value` and gets updates via `onChange`.
 * `attendance` is always on (the whole RSVP/dashboard depends on it).
 *
 * Direction: depth + soft glow + fluid spring physics. A living hero counter
 * with an animated progress ring, gradient-mesh atmosphere, staggered reveal on
 * mount, tactile cards and sliding-pill toggles. Degrades to opacity-only when
 * the user prefers reduced motion.
 */
import { useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  type Transition,
} from "framer-motion";
import { Check, Lock, Sparkles, Plus, Wand2, ListChecks, LayoutGrid, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  type QuestionConfigs,
  type CustomQuestion,
  DEFAULT_QUESTION_CONFIG,
  CORE_QUESTION_KEYS,
  questionConfigForEventType,
} from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { cn } from "@/lib/utils";

/** Free tier: one custom "extra" question as a teaser. Premium = unlimited. */
const FREE_CUSTOM_LIMIT = 1;

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

const TOTAL_SLOTS = CORE_QUESTION_KEYS.length + CUSTOM_PRESETS.length;

const clone = (c: QuestionConfigs): QuestionConfigs => JSON.parse(JSON.stringify(c));
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
  const { question_config: qc, custom_questions } = value;

  const enabledCount = useMemo(
    () => CORE_QUESTION_KEYS.filter((k) => qc[k]?.enabled).length + custom_questions.length,
    [qc, custom_questions],
  );
  const progress = Math.min(1, enabledCount / TOTAL_SLOTS);

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
    const exists = custom_questions.some((c) => c.id === presetId);
    // Free tier: 1 extra question. Beyond that → gentle premium nudge.
    if (!exists && !isPremium && custom_questions.length >= FREE_CUSTOM_LIMIT) {
      void haptics.warning();
      toast.info(t("native.create.questions.premiumHint", "Mehr eigene Fragen mit Premium"));
      return;
    }
    haptics.select();
    onChange({
      ...value,
      custom_questions: exists
        ? custom_questions.filter((c) => c.id !== presetId)
        : [...custom_questions, { id: presetId, ...q }],
    });
  };

  // Mount choreography: a staggered cascade; opacity-only under reduced motion.
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

      {/* Heading */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">
          {t("native.create.questions.title", "Welche Fragen?")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("native.create.questions.subtitle", "Wähle, was dein Formular fragen soll. Später jederzeit änderbar.")}
        </p>
      </motion.div>

      {/* HERO — living counter ring + smart hint */}
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
                  strokeDasharray={C}
                  initial={false}
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
                <motion.span
                  layoutId="eqs-preset-active"
                  className="absolute inset-0 -z-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_8px_30px_-6px_rgba(217,70,239,0.6)]"
                  transition={reduce ? { duration: 0.2 } : SPRING}
                />
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
              <span className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                {on}/{total}
              </span>
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
                    whileTap={reduce || locked ? undefined : { scale: 0.985 }}
                    transition={SPRING}
                    onClick={() => toggle(key)}
                    aria-pressed={isOn}
                    aria-disabled={locked}
                    className={cn(
                      "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300",
                      isOn
                        ? "border-primary/40 bg-gradient-to-r from-violet-500/[0.12] to-fuchsia-500/[0.12] shadow-[0_10px_30px_-12px_rgba(139,92,246,0.5)]"
                        : "border-border bg-foreground/[0.03] active:bg-foreground/[0.05]",
                    )}
                  >
                    <AnimatePresence>
                      {isOn && !reduce && (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-violet-400/20 blur-2xl"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={SPRING}
                        />
                      )}
                    </AnimatePresence>

                    <motion.span
                      className="relative text-2xl leading-none"
                      animate={isOn && !reduce ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}
                      transition={SPRING}
                    >
                      {EMOJI[key]}
                    </motion.span>

                    <span className="relative min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base font-semibold text-foreground">
                          {t(`native.create.questions.q.${key}.title`, key)}
                        </span>
                        {locked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            <Lock className="h-2.5 w-2.5" />
                            {t("native.create.questions.attendanceAlways", "immer dabei")}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t(`native.create.questions.q.${key}.desc`, "")}
                      </span>
                    </span>

                    {/* Sliding-pill toggle (padlock when locked) */}
                    <span
                      className={cn(
                        "relative flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300",
                        isOn ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-foreground/15",
                        locked && "opacity-90",
                      )}
                    >
                      <motion.span
                        layout={!reduce}
                        className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm"
                        animate={{ x: isOn ? 20 : 0 }}
                        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 700, damping: 32 }}
                      >
                        {locked ? (
                          <Lock className="h-3 w-3 text-primary" />
                        ) : isOn ? (
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                        )}
                      </motion.span>
                    </span>
                  </motion.button>
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
          {CUSTOM_PRESETS.map((p) => {
            const on = custom_questions.some((c) => c.id === p.id);
            const locked = !on && !isPremium && custom_questions.length >= FREE_CUSTOM_LIMIT;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileTap={reduce ? undefined : { scale: 0.93 }}
                transition={SPRING}
                onClick={() => togglePreset(p.id, p.q)}
                aria-pressed={on}
                className={cn(
                  "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-300",
                  on
                    ? "border-transparent text-white"
                    : locked
                      ? "border-amber-400/30 bg-amber-400/5 text-foreground/55"
                      : "border-border bg-foreground/5 text-foreground/80 active:bg-foreground/[0.08]",
                )}
              >
                {on && (
                  <motion.span
                    layoutId={`eqs-extra-${p.id}`}
                    className="absolute inset-0 -z-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_6px_20px_-6px_rgba(217,70,239,0.6)]"
                    transition={reduce ? { duration: 0.2 } : SPRING}
                  />
                )}
                <span className="relative z-10">{p.emoji}</span>
                <span className="relative z-10">{t(`native.create.questions.custom.${p.id}`, p.id)}</span>
                <span className="relative z-10">
                  {on ? (
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
