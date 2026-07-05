/**
 * AIFormSheet — "✨ Mit KI erstellen": describe the event in natural language,
 * the AI configures the whole guest form (question toggles, answer options,
 * matching activities, custom questions, no-gos, focus). Premium-gated.
 *
 * A small state machine inside the StudioSheet shell:
 *   describe → generating → result → (apply) | regenerate
 * with a `gate` branch (non-premium, or a server 402/no_credits) and an
 * `error` branch (friendly retry). The gate lives INSIDE the sheet — never a
 * toast. Non-premium users hit the gate BEFORE any function call is made.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Coins,
  Crown,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StudioSheet } from "../StudioSheet";
import { supabase } from "@/integrations/supabase/client";
import { useHaptics } from "@/hooks/useHaptics";
import { useAICredits } from "@/hooks/useAICredits";
import { spring } from "@/lib/motion";
import {
  CORE_QUESTION_KEYS,
  type CustomQuestion,
  type EventSettings,
  type QuestionConfigs,
} from "@/lib/survey-config";
import { cn } from "@/lib/utils";

/** Hard per-sheet-session cap on (re)generations — each one costs 1 credit. */
const MAX_GENERATIONS = 5;

interface AIFormEvent {
  event_type?: string;
  honoree_name?: string;
  event_date?: string;
  /** Best-known guest count, if the caller has it. */
  guest_count?: number;
}

interface AIFormSheetProps {
  open: boolean;
  onClose: () => void;
  flush: () => void;
  event: AIFormEvent;
  isPremium: boolean;
  onApply: (settings: Partial<EventSettings>) => void;
}

type Phase = "describe" | "generating" | "result" | "gate" | "error";

/** Decide whether an invoke failure is a premium/quota gate or a hard error. */
async function classifyFailure(
  error: unknown,
  data: { success?: boolean; code?: string } | null,
): Promise<"gate" | "error"> {
  if (data && data.code === "no_credits") return "gate";
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.status === "number" && ctx.status === 402) return "gate";
  try {
    const body = await ctx?.json?.();
    if (body?.code === "no_credits" || body?.status === 402) return "gate";
  } catch {
    /* body not JSON — fall through */
  }
  const msg = String((error as { message?: string })?.message ?? "");
  if (msg.includes("402") || msg.toLowerCase().includes("credit")) return "gate";
  return "error";
}

export function AIFormSheet({ open, onClose, flush, event, isPremium, onApply }: AIFormSheetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>(isPremium ? "describe" : "gate");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Partial<EventSettings> | null>(null);
  const [genCount, setGenCount] = useState(0);
  const lastDescription = useRef("");
  const credits = useAICredits();

  const examples = useMemo(() => {
    const raw = t("formStudio.aiExamples", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  // Prefilled hint chips built from what we know about the event.
  const hints = useMemo(() => {
    const out: string[] = [];
    if (event.event_type) out.push(t(`eventTypes.${event.event_type}`, event.event_type));
    if (event.honoree_name) out.push(event.honoree_name);
    if (event.guest_count && event.guest_count > 0)
      out.push(t("formStudio.aiGuestChip", { count: event.guest_count }));
    return out;
  }, [event.event_type, event.honoree_name, event.guest_count, t]);

  const runGenerate = async (prompt: string) => {
    if (!isPremium) {
      setPhase("gate");
      return;
    }
    if (genCount >= MAX_GENERATIONS) return;
    const clean = prompt.trim();
    if (!clean) return;
    lastDescription.current = clean;
    haptics.medium();
    setPhase("generating");
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-event-form", {
        body: {
          event_type: event.event_type,
          description: clean,
          language: (i18n.language || "de").split(/[-_]/)[0],
          context: {
            honoree_name: event.honoree_name,
            guest_count: event.guest_count,
            event_date: event.event_date,
          },
        },
      });

      if (data?.success && data.settings) {
        setResult(data.settings as Partial<EventSettings>);
        setGenCount((c) => c + 1);
        // The server just burned 1 credit — sync the badge.
        void credits.refetch();
        setPhase("result");
        haptics.success();
        return;
      }

      const verdict = await classifyFailure(error, data ?? null);
      setPhase(verdict);
    } catch (err) {
      const verdict = await classifyFailure(err, null);
      setPhase(verdict);
    }
  };

  const handleApply = (filtered: Partial<EventSettings>) => {
    onApply(filtered);
    haptics.celebrate();
    onClose();
  };

  const title =
    phase === "gate"
      ? t("formStudio.aiGateTitle", "KI-Formular ist Premium")
      : phase === "result"
        ? t("formStudio.aiResultTitle", "So könnte dein Formular aussehen")
        : t("formStudio.aiTitle", "Formular mit KI erstellen");

  return (
    <StudioSheet open={open} onClose={onClose} flush={flush} emoji="✨" title={title}>
      <AnimatePresence mode="wait">
        {phase === "describe" && (
          <DescribeStep
            key="describe"
            value={description}
            onChange={setDescription}
            hints={hints}
            examples={examples}
            onGenerate={() => runGenerate(description)}
            onPickExample={(ex) => {
              haptics.select();
              setDescription(ex);
            }}
          />
        )}

        {phase === "generating" && <GeneratingStep key="generating" />}

        {phase === "result" && result && (
          <ResultStep
            key="result"
            settings={result}
            onApply={handleApply}
            onRegenerate={() => runGenerate(lastDescription.current)}
            genCount={genCount}
            maxGenerations={MAX_GENERATIONS}
            creditsRemaining={credits.remaining}
            creditsLimit={credits.limit}
            creditsLoading={credits.loading}
          />
        )}

        {phase === "gate" && (
          <GateStep key="gate" onUpgrade={() => navigate("/premium")} />
        )}

        {phase === "error" && (
          <ErrorStep
            key="error"
            onRetry={() => runGenerate(lastDescription.current || description)}
            onBack={() => setPhase("describe")}
          />
        )}
      </AnimatePresence>
    </StudioSheet>
  );
}

/* ------------------------------------------------------------------ */
/* Shared gradient CTA — the app's violet→fuchsia signature button.    */
/* ------------------------------------------------------------------ */
function GradientCTA({
  children,
  icon,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5",
        "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-bold text-white",
        "shadow-[0_10px_30px_-8px_rgba(217,70,239,0.6)]",
        "disabled:opacity-50",
        className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* DESCRIBE                                                             */
/* ------------------------------------------------------------------ */
function DescribeStep({
  value,
  onChange,
  hints,
  examples,
  onGenerate,
  onPickExample,
}: {
  value: string;
  onChange: (v: string) => void;
  hints: string[];
  examples: string[];
  onGenerate: () => void;
  onPickExample: (ex: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring.soft}
      className="space-y-4 pt-1"
    >
      <p className="text-sm text-muted-foreground">
        {t(
          "formStudio.aiIntro",
          "Beschreibe dein Event in eigenen Worten — die KI stellt Fragen, Antworten & passende Aktivitäten für dich zusammen.",
        )}
      </p>

      {hints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hints.map((h) => (
            <span
              key={h}
              className="rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-foreground/80 ring-1 ring-inset ring-primary/20"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          autoFocus
          placeholder={t(
            "formStudio.aiDescribePlaceholder",
            "Beschreibe dein Event, deine Wünsche & Ideen…",
          )}
          className="w-full resize-none rounded-2xl border border-border bg-foreground/[0.03] p-4 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-foreground/[0.05]"
        />
      </div>

      {examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {t("formStudio.aiExamplesHint", "Zum Ausprobieren")}
          </p>
          <div className="flex flex-col gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onPickExample(ex)}
                className="flex items-start gap-2 rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-left text-xs text-foreground/80 active:bg-foreground/[0.06]"
              >
                <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{ex}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <GradientCTA
        icon={<Sparkles className="h-4 w-4" />}
        onClick={onGenerate}
        disabled={value.trim().length === 0}
      >
        {t("formStudio.aiGenerate", "Formular generieren")}
      </GradientCTA>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* GENERATING — drifting gradient blobs + rotating status lines        */
/* ------------------------------------------------------------------ */
function GeneratingStep() {
  const { t } = useTranslation();
  const statusLines = useMemo(() => {
    const raw = t("formStudio.aiStatusLines", { returnObjects: true }) as unknown;
    return Array.isArray(raw) && raw.length > 0
      ? (raw as string[])
      : [t("formStudio.aiGenerating", "Die KI baut dein Formular…")];
  }, [t]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    // Rotate the status line every ~1.6s while mounted.
    const id = window.setInterval(() => setIdx((i) => i + 1), 1600);
    return () => window.clearInterval(id);
  }, []);
  const line = statusLines[idx % statusLines.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-10"
    >
      {/* Drifting gradient orb spectacle */}
      <div className="relative h-32 w-32">
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-2xl opacity-70"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], x: [0, -12, 0], y: [0, 10, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 blur-2xl opacity-50"
        />
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_12px_40px_-8px_rgba(217,70,239,0.7)]"
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="max-w-[16rem] text-center text-sm font-semibold text-foreground/90"
        >
          {line}
        </motion.p>
      </AnimatePresence>

      {/* Shimmer bar */}
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* RESULT — full preview: every generated element listed & toggleable   */
/* before applying. Regenerate is capped per sheet session.             */
/* ------------------------------------------------------------------ */

const QUESTION_EMOJI: Record<string, string> = {
  attendance: "🎉", duration: "🗓️", date_blocks: "📅", budget: "💶",
  destination: "📍", travel: "🧳", activities: "🎯", fitness: "💪", alcohol: "🍻",
};

/** Pill that can be tapped off/on before applying. */
function ToggleChip({
  active,
  locked,
  onToggle,
  children,
}: {
  active: boolean;
  locked?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={locked ? undefined : { scale: 0.94 }}
      transition={spring.snappy}
      onClick={locked ? undefined : onToggle}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-foreground"
          : "border-border bg-foreground/[0.03] text-muted-foreground/60 line-through",
      )}
    >
      {children}
      {locked ? (
        <Lock className="h-3 w-3 shrink-0 text-primary" />
      ) : active ? (
        <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={3} />
      ) : null}
    </motion.button>
  );
}

function PreviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ResultStep({
  settings,
  onApply,
  onRegenerate,
  genCount,
  maxGenerations,
  creditsRemaining,
  creditsLimit,
  creditsLoading,
}: {
  settings: Partial<EventSettings>;
  onApply: (filtered: Partial<EventSettings>) => void;
  onRegenerate: () => void;
  genCount: number;
  maxGenerations: number;
  creditsRemaining: number;
  creditsLimit: number;
  creditsLoading: boolean;
}) {
  const { t } = useTranslation();

  // Deselection state — everything starts selected.
  const [offQuestions, setOffQuestions] = useState<Set<string>>(new Set());
  const [offCustom, setOffCustom] = useState<Set<string>>(new Set());
  const [offOptions, setOffOptions] = useState<Set<string>>(new Set()); // "<group>:<value>"

  const toggleIn = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const enabledQuestions = settings.question_config
    ? CORE_QUESTION_KEYS.filter((k) => (settings.question_config as QuestionConfigs)[k]?.enabled)
    : [];
  const customQuestions: CustomQuestion[] = settings.custom_questions ?? [];
  const optionGroups = [
    {
      group: "activities",
      label: t("formStudio.aiPreviewActivities", "Aktivitäten"),
      items: (settings.activity_options ?? []).map((o) => ({ value: o.value, text: `${o.emoji ? `${o.emoji} ` : ""}${o.label}` })),
    },
    {
      group: "destination",
      label: t("formStudio.aiPreviewDestination", "Reiseziele"),
      items: (settings.destination_options ?? []).map((o) => ({ value: o.value, text: `${o.emoji ? `${o.emoji} ` : ""}${o.label}` })),
    },
    {
      group: "budget",
      label: t("formStudio.aiPreviewBudget", "Budget-Optionen"),
      items: (settings.budget_options ?? []).map((o) => ({ value: o.value, text: o.label })),
    },
    {
      group: "duration",
      label: t("formStudio.aiPreviewDuration", "Dauer-Optionen"),
      items: (settings.duration_options ?? []).map((o) => ({ value: o.value, text: o.label })),
    },
  ].filter((g) => g.items.length > 0);

  const noGos = settings.no_gos ?? [];
  const focus = settings.focus_points ?? [];

  const limitReached = genCount >= maxGenerations;
  const outOfCredits = !creditsLoading && creditsRemaining <= 0;
  const canRegenerate = !limitReached && !outOfCredits;

  /** Apply only what is still selected. */
  const buildFiltered = (): Partial<EventSettings> => {
    const out: Partial<EventSettings> = { ...settings };
    if (settings.question_config) {
      const qc = JSON.parse(JSON.stringify(settings.question_config)) as QuestionConfigs;
      offQuestions.forEach((k) => {
        const cfg = qc[k as keyof QuestionConfigs];
        if (cfg) cfg.enabled = false;
      });
      out.question_config = qc;
    }
    out.custom_questions = customQuestions.filter((q) => !offCustom.has(q.id));
    const filterOpts = <T extends { value: string }>(group: string, arr?: T[]): T[] | undefined => {
      if (!arr) return undefined;
      const kept = arr.filter((o) => !offOptions.has(`${group}:${o.value}`));
      // Fully deselected → drop the key so the wizard keeps its current options.
      return kept.length > 0 ? kept : undefined;
    };
    out.activity_options = filterOpts("activities", settings.activity_options);
    out.destination_options = filterOpts("destination", settings.destination_options);
    out.budget_options = filterOpts("budget", settings.budget_options);
    out.duration_options = filterOpts("duration", settings.duration_options);
    return out;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring.soft}
      className="space-y-3.5 pt-1"
    >
      {/* Credits + generation counter */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          <Coins className="h-3 w-3 text-amber-400" />
          {creditsLoading
            ? "…"
            : t("formStudio.aiCreditsBadge", {
                defaultValue: "{{remaining}}/{{limit}} Credits",
                remaining: creditsRemaining,
                limit: creditsLimit,
              })}
        </span>
        <span className="rounded-full bg-foreground/[0.05] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {t("formStudio.aiGenCount", {
            defaultValue: "Generierung {{used}}/{{max}}",
            used: genCount,
            max: maxGenerations,
          })}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          "formStudio.aiPreviewHint",
          "Tippe Elemente an, um sie ab- oder wieder anzuwählen — übernommen wird nur, was ausgewählt ist.",
        )}
      </p>

      {/* Full generated content, scrollable */}
      <div className="max-h-[42vh] space-y-3.5 overflow-y-auto rounded-2xl border border-border bg-foreground/[0.02] p-3.5">
        {enabledQuestions.length > 0 && (
          <PreviewSection label={t("formStudio.aiPreviewQuestions", "Aktive Fragen")}>
            {enabledQuestions.map((k) => (
              <ToggleChip
                key={k}
                active={!offQuestions.has(k)}
                locked={k === "attendance"}
                onToggle={() => toggleIn(offQuestions, k, setOffQuestions)}
              >
                <span>{QUESTION_EMOJI[k]}</span>
                <span>{t(`native.create.questions.q.${k}.title`, k)}</span>
              </ToggleChip>
            ))}
          </PreviewSection>
        )}

        {customQuestions.length > 0 && (
          <PreviewSection label={t("formStudio.aiPreviewCustomQs", "Eigene Fragen")}>
            {customQuestions.map((q) => (
              <ToggleChip
                key={q.id}
                active={!offCustom.has(q.id)}
                onToggle={() => toggleIn(offCustom, q.id, setOffCustom)}
              >
                <span>💬</span>
                <span className="max-w-[220px] truncate">{q.label}</span>
              </ToggleChip>
            ))}
          </PreviewSection>
        )}

        {optionGroups.map((g) => (
          <PreviewSection key={g.group} label={g.label}>
            {g.items.map((it) => (
              <ToggleChip
                key={it.value}
                active={!offOptions.has(`${g.group}:${it.value}`)}
                onToggle={() => toggleIn(offOptions, `${g.group}:${it.value}`, setOffOptions)}
              >
                <span className="max-w-[180px] truncate">{it.text}</span>
              </ToggleChip>
            ))}
          </PreviewSection>
        ))}

        {focus.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-primary/80">
              {t("formStudio.aiFocusLabel", "Fokus")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {focus.slice(0, 6).map((f) => (
                <span key={f} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground/85">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
        {noGos.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-400/90">
              {t("formStudio.aiNoGosLabel", "No-Gos")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {noGos.slice(0, 6).map((n) => (
                <span key={n} className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-foreground/85">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {limitReached && (
        <p className="text-center text-xs font-medium text-amber-500">
          {t("formStudio.aiLimitReached", {
            defaultValue: "Maximal {{max}} Generierungen pro Sitzung erreicht",
            max: maxGenerations,
          })}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <motion.button
          type="button"
          whileTap={canRegenerate ? { scale: 0.96 } : undefined}
          transition={spring.snappy}
          onClick={canRegenerate ? onRegenerate : undefined}
          disabled={!canRegenerate}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-foreground/[0.04] px-4 py-3.5 text-sm font-semibold text-foreground/80 active:bg-foreground/[0.08]",
            !canRegenerate && "cursor-not-allowed opacity-45",
          )}
        >
          <RefreshCw className="h-4 w-4" />
          {t("formStudio.aiRegenerate", "Nochmal")}
          <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
            <Coins className="h-2.5 w-2.5" />1
          </span>
        </motion.button>
        <GradientCTA icon={<Sparkles className="h-4 w-4" />} onClick={() => onApply(buildFiltered())} className="flex-1">
          {t("formStudio.aiApply", "Übernehmen")}
        </GradientCTA>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* GATE — premium upsell inside the sheet                              */
/* ------------------------------------------------------------------ */
function GateStep({ onUpgrade }: { onUpgrade: () => void }) {
  const { t } = useTranslation();
  const benefits = [
    t("formStudio.aiGateBenefit1", "Ganze Umfrage aus einer kurzen Beschreibung"),
    t("formStudio.aiGateBenefit2", "Passende Aktivitäten & eigene Fragen automatisch"),
    t("formStudio.aiGateBenefit3", "Jederzeit anpassen — die KI macht nur den Anfang"),
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring.soft}
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.7, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring.bouncy}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-fuchsia-500 text-white shadow-[0_16px_40px_-10px_rgba(251,191,36,0.6)]"
      >
        <Crown className="h-9 w-9" />
      </motion.div>

      <div className="space-y-1.5">
        <h3 className="font-display text-xl font-bold text-foreground">
          {t("formStudio.aiGateHeadline", "KI baut dein Formular")}
        </h3>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          {t("formStudio.aiGateSub", "Ein Premium-Feature — beschreibe dein Event, die KI erledigt den Rest.")}
        </p>
      </div>

      <div className="w-full space-y-2">
        {benefits.map((b, i) => (
          <motion.div
            key={b}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring.soft, delay: 0.06 * i }}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-foreground/[0.03] p-3 text-left"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-foreground/85">{b}</span>
          </motion.div>
        ))}
      </div>

      <GradientCTA
        icon={<Crown className="h-4 w-4" />}
        onClick={onUpgrade}
        className="from-amber-400 to-fuchsia-500"
      >
        {t("formStudio.aiGateCta", "Premium holen")}
      </GradientCTA>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* ERROR — friendly retry                                              */
/* ------------------------------------------------------------------ */
function ErrorStep({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring.soft}
      className="flex flex-col items-center gap-5 py-8 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/15 text-rose-400">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">
        {t("formStudio.aiError", "Das hat gerade nicht geklappt. Versuch es bitte noch einmal.")}
      </p>
      <div className="flex w-full gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
          onClick={onBack}
          className="flex-1 rounded-2xl border border-border bg-foreground/[0.04] py-3.5 text-sm font-semibold text-foreground/80 active:bg-foreground/[0.08]"
        >
          {t("formStudio.aiBack", "Zurück")}
        </motion.button>
        <GradientCTA icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry} className="flex-1">
          {t("formStudio.aiRetry", "Erneut versuchen")}
        </GradientCTA>
      </div>
    </motion.div>
  );
}
