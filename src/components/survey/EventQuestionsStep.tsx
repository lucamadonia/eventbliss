/**
 * EventQuestionsStep — the "choose your questions" step shown to GUESTS (not
 * logged in) during event creation. Produces a `question_config` (+ optional
 * custom_questions) that is persisted onto the event so the public survey form
 * asks exactly the chosen questions.
 *
 * Controlled: parent owns `value` and gets updates via `onChange`.
 * `attendance` is always on (the whole RSVP/dashboard depends on it).
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles, Plus } from "lucide-react";
import {
  type QuestionConfigs,
  type CustomQuestion,
  DEFAULT_SURVEY_CONFIG,
} from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

export interface QuestionsValue {
  question_config: QuestionConfigs;
  custom_questions: CustomQuestion[];
}

type CoreKey = keyof QuestionConfigs;

const GROUPS: { id: string; title: string; keys: CoreKey[] }[] = [
  { id: "basics", title: "Basics", keys: ["attendance", "duration", "date_blocks"] },
  { id: "logistik", title: "Logistik", keys: ["budget", "destination", "travel"] },
  { id: "vibe", title: "Vibe", keys: ["activities", "fitness", "alcohol"] },
];

const META: Record<CoreKey, { emoji: string; title: string; desc: string; preview: () => string[] }> = {
  attendance:  { emoji: "🎉", title: "Zusage",      desc: "Bist du dabei?",            preview: () => DEFAULT_SURVEY_CONFIG.attendance_options.map(o => o.label) },
  duration:    { emoji: "🗓️", title: "Zeitraum",    desc: "Tag oder Wochenende?",      preview: () => DEFAULT_SURVEY_CONFIG.duration_options.map(o => o.label) },
  date_blocks: { emoji: "📅", title: "Termine",     desc: "Mögliche Termin-Blöcke",    preview: () => ["Termine, die du im Dashboard festlegst"] },
  budget:      { emoji: "💶", title: "Budget",      desc: "Budget pro Person",         preview: () => DEFAULT_SURVEY_CONFIG.budget_options.map(o => o.label) },
  destination: { emoji: "📍", title: "Reiseziel",   desc: "Wohin soll's gehen?",       preview: () => DEFAULT_SURVEY_CONFIG.destination_options.map(o => o.label) },
  travel:      { emoji: "🧳", title: "Anreise",     desc: "Übernachtung okay?",        preview: () => DEFAULT_SURVEY_CONFIG.travel_options.map(o => o.label) },
  activities:  { emoji: "🎯", title: "Aktivitäten", desc: "Was wollt ihr machen?",     preview: () => DEFAULT_SURVEY_CONFIG.activity_options.map(o => o.label) },
  fitness:     { emoji: "💪", title: "Fitness",     desc: "Wie sportlich darf's sein?", preview: () => DEFAULT_SURVEY_CONFIG.fitness_options.map(o => o.label) },
  alcohol:     { emoji: "🍻", title: "Alkohol",     desc: "Mit oder ohne?",            preview: () => DEFAULT_SURVEY_CONFIG.alcohol_options.map(o => o.label) },
};

const CUSTOM_PRESETS: { id: string; emoji: string; label: string; q: Omit<CustomQuestion, "id"> }[] = [
  { id: "dietary",  emoji: "🥗", label: "Ernährung", q: { type: "textarea", label: "Ernährung / Allergien?", required: false, placeholder: "z.B. vegetarisch, Nuss-Allergie" } },
  { id: "song",     emoji: "🎵", label: "Songwunsch", q: { type: "text", label: "Dein Songwunsch?", required: false } },
  { id: "tshirt",   emoji: "👕", label: "T-Shirt-Größe", q: { type: "select", label: "T-Shirt-Größe", required: false, options: ["S", "M", "L", "XL", "XXL"] } },
  { id: "license",  emoji: "🚗", label: "Führerschein", q: { type: "toggle", label: "Hast du einen Führerschein?", required: false } },
];

export function EventQuestionsStep({
  value,
  onChange,
}: {
  value: QuestionsValue;
  onChange: (v: QuestionsValue) => void;
  /** Only used to show the "smart suggestion active" hint. */
  eventType?: string;
}) {
  const haptics = useHaptics();
  const { question_config: qc, custom_questions } = value;

  const enabledCount = useMemo(
    () => Object.values(qc).filter((q) => q.enabled).length + custom_questions.length,
    [qc, custom_questions],
  );

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
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-display font-bold text-foreground">Welche Fragen?</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Wähle, was dein Formular fragen soll. Du kannst es später jederzeit anpassen.
      </p>

      {/* Smart hint + live counter */}
      <div className="flex items-center justify-between gap-2 mb-5 rounded-2xl px-4 py-2.5 bg-primary/10 border border-primary/20">
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Smart-Vorschlag aktiv
        </span>
        <span className="text-xs font-bold text-primary">{enabledCount} Fragen</span>
      </div>

      {GROUPS.map((group) => (
        <div key={group.id} className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2.5">{group.title}</h3>
          <div className="space-y-2.5">
            {group.keys.map((key) => {
              const m = META[key];
              const locked = key === "attendance";
              const on = qc[key].enabled;
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={{ scale: locked ? 1 : 0.98 }}
                  onClick={() => toggle(key)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-colors",
                    on
                      ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-primary/40"
                      : "bg-foreground/[0.03] border-border",
                  )}
                >
                  <span className="text-2xl leading-none mt-0.5">{m.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base font-semibold text-foreground">{m.title}</span>
                      {locked && <Lock className="w-3 h-3 text-muted-foreground/70" />}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{m.desc}</span>
                    <span className="block text-[11px] text-muted-foreground/60 mt-1 truncate">
                      {m.preview().slice(0, 3).join(" · ")}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 w-6 h-6 rounded-full grid place-items-center border-2 transition-colors mt-0.5",
                      on ? "bg-primary border-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {on && <Check className="w-4 h-4 text-white" />}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quick custom-question presets */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2.5">Extra-Fragen (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_PRESETS.map((p) => {
            const on = custom_questions.some((c) => c.id === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePreset(p.id, p.q)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors",
                  on ? "bg-primary text-white border-primary" : "bg-foreground/5 text-foreground/80 border-border",
                )}
              >
                <span>{p.emoji}</span>
                {p.label}
                {on ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EventQuestionsStep;
