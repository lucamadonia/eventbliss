/**
 * CustomQuestionSheet — two-step builder for custom (extra) questions.
 *
 * Step 1: a 3x3 grid of question types (rating/number/date are premium and
 * show a Crown badge — tapping one as a free user reveals a premium gate instead
 * of advancing) plus a "Blitzstart" preset row that skips already-added presets.
 * Step 2: label / required / placeholder / options with a pinned live preview
 * and the add button.
 *
 * Creating a NEW question while at the free limit shows a blurred gate with a
 * /premium CTA; editing an existing question is never gated.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  CircleDot,
  Crown,
  Hash,
  List,
  Plus,
  Star,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/ui/GradientButton";
import { StudioSheet } from "./StudioSheet";
import { CustomQuestionPreview } from "@/components/dashboard/CustomQuestionPreview";
import type { FormStudioAction } from "./formStudioReducer";
import {
  FREE_CUSTOM_QUESTION_LIMIT,
  PREMIUM_CUSTOM_TYPES,
} from "@/components/formstudio/questionRegistry";
import { CUSTOM_QUESTION_PRESETS, presetAlreadyAdded } from "@/lib/custom-question-presets";
import {
  type EventSettings,
  type CustomQuestion,
  type CustomQuestionType,
} from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TYPE_TILES: { type: CustomQuestionType; icon: typeof Type }[] = [
  { type: "text", icon: Type },
  { type: "textarea", icon: AlignLeft },
  { type: "select", icon: List },
  { type: "radio", icon: CircleDot },
  { type: "checkbox", icon: CheckSquare },
  { type: "toggle", icon: ToggleLeft },
  { type: "rating", icon: Star },
  { type: "number", icon: Hash },
  { type: "date", icon: CalendarDays },
];

const TYPE_LABELS: Record<CustomQuestionType, string> = {
  text: "Text",
  textarea: "Absatz",
  select: "Dropdown",
  radio: "Einfachauswahl",
  checkbox: "Mehrfachauswahl",
  toggle: "Ja/Nein",
  rating: "Bewertung",
  number: "Zahl",
  date: "Datum",
};

const CHOICE_TYPES: CustomQuestionType[] = ["select", "radio", "checkbox"];
const TEXT_TYPES: CustomQuestionType[] = ["text", "textarea"];

const isPremiumType = (type: CustomQuestionType) =>
  (PREMIUM_CUSTOM_TYPES as readonly string[]).includes(type);

const freshId = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface CustomQuestionSheetProps {
  open: boolean;
  /** Id of the question being edited, or null when creating a new one. */
  editingId: string | null;
  settings: EventSettings;
  isPremium: boolean;
  dispatch: React.Dispatch<FormStudioAction>;
  onClose: () => void;
  flush: () => void;
}

export function CustomQuestionSheet({
  open,
  editingId,
  settings,
  isPremium,
  dispatch,
  onClose,
  flush,
}: CustomQuestionSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const navigate = useNavigate();

  const [step, setStep] = useState<"type" | "config">("type");
  const [draft, setDraft] = useState<CustomQuestion | null>(null);
  const [typeGate, setTypeGate] = useState(false);

  const customQuestions = settings.custom_questions ?? [];
  const editing = editingId ? customQuestions.find((q) => q.id === editingId) : undefined;
  const limitReached =
    !isPremium && !editingId && customQuestions.length >= FREE_CUSTOM_QUESTION_LIMIT;

  // Reset the builder whenever it (re)opens.
  useEffect(() => {
    if (!open) return;
    setTypeGate(false);
    if (editing) {
      setDraft({ ...editing });
      setStep("config");
    } else {
      setDraft(null);
      setStep("type");
    }
  }, [open, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickType = (type: CustomQuestionType) => {
    if (isPremiumType(type) && !isPremium) {
      haptics.warning();
      setTypeGate(true);
      return;
    }
    haptics.select();
    setDraft({
      id: freshId(),
      type,
      label: "",
      required: false,
      options: CHOICE_TYPES.includes(type) ? ["", ""] : undefined,
    });
    setStep("config");
  };

  const applyPreset = (id: string) => {
    const preset = CUSTOM_QUESTION_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    haptics.select();
    setDraft({ id: preset.id, ...preset.build(t) });
    setStep("config");
  };

  const save = () => {
    if (!draft || !draft.label.trim()) return;
    haptics.success();
    const cleaned: CustomQuestion = {
      ...draft,
      label: draft.label.trim(),
      options: CHOICE_TYPES.includes(draft.type)
        ? (draft.options ?? []).map((o) => o.trim()).filter(Boolean)
        : undefined,
      placeholder: TEXT_TYPES.includes(draft.type) ? draft.placeholder : undefined,
    };
    dispatch({ type: "UPSERT_CUSTOM_QUESTION", question: cleaned });
    onClose();
  };

  const title = editing
    ? draft?.label || t("formStudio.addCustom", "Eigene Frage")
    : step === "type"
      ? t("formStudio.typeStep", "Typ wählen")
      : t("formStudio.configStep", "Konfigurieren");

  return (
    <StudioSheet open={open} onClose={onClose} flush={flush} emoji="✏️" title={title}>
      {limitReached ? (
        <PremiumGate onUpgrade={() => navigate("/premium")} onClose={onClose} />
      ) : typeGate ? (
        <PremiumGate onUpgrade={() => navigate("/premium")} onClose={() => setTypeGate(false)} typeGate />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {step === "type" ? (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={spring.snappy}
              className="space-y-5"
            >
              <div className="grid grid-cols-3 gap-2.5">
                {TYPE_TILES.map(({ type, icon: Icon }) => {
                  const locked = isPremiumType(type) && !isPremium;
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      transition={spring.snappy}
                      onClick={() => pickType(type)}
                      className="relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-foreground/[0.03] text-center active:bg-foreground/[0.06]"
                    >
                      {locked && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400/15 text-amber-500">
                          <Crown className="h-3 w-3" />
                        </span>
                      )}
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="px-1 text-[11px] font-medium leading-tight text-foreground">
                        {TYPE_LABELS[type]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Blitzstart presets */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  {t("formStudio.quickstart", "Blitzstart")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_QUESTION_PRESETS.filter((p) => !presetAlreadyAdded(p, customQuestions)).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/5 px-3 py-2 text-sm font-medium text-foreground/80 active:bg-foreground/[0.08]"
                    >
                      <span>{p.emoji}</span>
                      <span>{t(p.labelKey)}</span>
                      <Plus className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={spring.snappy}
              className="space-y-4"
            >
              {draft && (
                <>
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => setStep("type")}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t("formStudio.typeStep", "Typ wählen")}
                    </button>
                  )}

                  <CustomQuestionPreview questions={[draft]} />

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                        {t("formStudio.questionLabel", "Frage")}
                      </label>
                      <Input
                        autoFocus
                        value={draft.label}
                        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        placeholder={t("formStudio.questionLabel", "Frage")}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-foreground/[0.04] px-3.5 py-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {t("formStudio.requiredField", "Pflichtfeld")}
                      </span>
                      <Switch
                        checked={draft.required}
                        onCheckedChange={(v) => setDraft({ ...draft, required: v })}
                      />
                    </div>

                    {TEXT_TYPES.includes(draft.type) && (
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                          {t("formStudio.placeholderLabel", "Platzhalter (optional)")}
                        </label>
                        <Input
                          value={draft.placeholder ?? ""}
                          onChange={(e) => setDraft({ ...draft, placeholder: e.target.value })}
                        />
                      </div>
                    )}

                    {CHOICE_TYPES.includes(draft.type) && (
                      <OptionsEditor
                        options={draft.options ?? []}
                        onChange={(options) => setDraft({ ...draft, options })}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <GradientButton className="flex-1" onClick={save} disabled={!draft.label.trim()}>
                      {t("formStudio.addToForm", "Zur Umfrage hinzufügen")}
                    </GradientButton>
                    {!isPremium && !editing && (
                      <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {t("formStudio.freeLimitBadge", "1/1 kostenlos")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </StudioSheet>
  );
}

/* -------------------------------------------------------------------------- */

function OptionsEditor({ options, onChange }: { options: string[]; onChange: (o: string[]) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => onChange(options.map((o, j) => (j === i ? e.target.value : o)))}
            className="h-9 flex-1"
            placeholder={`${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, j) => j !== i))}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-destructive/80"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...options, ""])}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-sm text-muted-foreground active:bg-foreground/[0.04]"
      >
        <Plus className="h-4 w-4" />
        {t("formStudio.addOption", "Antwort hinzufügen")}
      </button>
    </div>
  );
}

function PremiumGate({
  onUpgrade,
  onClose,
  typeGate,
}: {
  onUpgrade: () => void;
  onClose: () => void;
  typeGate?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      {/* Blurred fake cards behind the gate */}
      <div aria-hidden className="pointer-events-none space-y-2.5 opacity-40 blur-sm">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 rounded-2xl border border-border bg-foreground/[0.05]" />
        ))}
      </div>
      <div className="relative mt-3 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.08] to-fuchsia-500/[0.06] p-5 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-fuchsia-500 text-white shadow-lg">
          <Crown className="h-6 w-6" />
        </div>
        <p className="mb-4 text-sm text-foreground">
          {typeGate
            ? t("formStudio.premiumType", "Premium-Fragetyp")
            : t("formStudio.premiumUpsell", "Mit Premium: unbegrenzte eigene Fragen & alle Fragetypen")}
        </p>
        <div className="flex justify-center gap-2">
          <GradientButton size="sm" icon={<Crown className="h-4 w-4" />} onClick={onUpgrade}>
            {t("formStudio.premiumType", "Premium")}
          </GradientButton>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            {t("common.back", "Zurück")}
          </button>
        </div>
      </div>
    </div>
  );
}
