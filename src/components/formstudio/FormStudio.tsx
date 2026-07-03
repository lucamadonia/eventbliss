/**
 * FormStudio — native-first rebuild of the event form editor.
 *
 * "Du baust kein Formular — du siehst es entstehen." One canvas of draggable
 * question cards over a live, autosaving draft, with focused bottom-sheet editors
 * and a real-form preview. All state lives in useFormStudio (reducer + autosave);
 * this component only wires the header, SmartBar, card stack, the custom/design/
 * fine-print rails, the single open-sheet state machine, and the preview overlay.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Palette, Plus, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormStudio } from "./useFormStudio";
import { StudioHeader, type StudioMode } from "./StudioHeader";
import { SmartBar } from "./SmartBar";
import { QuestionCardStack } from "./QuestionCardStack";
import { OptionEditorSheet } from "./OptionEditorSheet";
import { DateBlocksSheet } from "./DateBlocksSheet";
import { CustomQuestionSheet } from "./CustomQuestionSheet";
import { DesignSheet } from "./DesignSheet";
import { ExtrasSheet } from "./ExtrasSheet";
import { StudioPreview } from "./StudioPreview";
import type { CoreKey } from "@/components/formstudio/questionRegistry";
import {
  type EventSettings,
  type QuestionConfigs,
  DEFAULT_BRANDING,
} from "@/lib/survey-config";
import { getTemplateById } from "@/lib/design-templates";
import { usePremium } from "@/hooks/usePremium";
import { useHaptics } from "@/hooks/useHaptics";

interface StudioEvent {
  id: string;
  slug: string;
  name: string;
  honoree_name?: string;
  event_type?: string;
  settings: Partial<EventSettings> | null;
}

type OpenSheet =
  | { type: "option"; key: CoreKey }
  | { type: "dates" }
  | { type: "custom"; id?: string }
  | { type: "design" }
  | { type: "extras" }
  | null;

interface FormStudioProps {
  event: StudioEvent;
  onUpdate: () => void;
  isActive: boolean;
}

export default function FormStudio({ event, onUpdate, isActive }: FormStudioProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const { isPremium } = usePremium();
  const { state, dispatch, flush, retry } = useFormStudio(event, onUpdate, isActive);

  const [mode, setMode] = useState<StudioMode>("edit");
  const [scrollToKey, setScrollToKey] = useState<string | undefined>();
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const settings = state.settings;
  const questionConfig = settings.question_config as QuestionConfigs;
  const customCount = settings.custom_questions?.length ?? 0;
  const finePrintCount = (settings.no_gos?.length ?? 0) + (settings.focus_points?.length ?? 0);
  const branding = settings.branding ?? DEFAULT_BRANDING;
  const templateName = branding.template_id ? getTemplateById(branding.template_id)?.name : undefined;
  const eventType = event.event_type || "bachelor";

  const closeSheet = () => setSheet(null);
  const openPreview = (key?: string) => {
    setScrollToKey(key);
    setMode("preview");
  };
  const openEdit = () => {
    setScrollToKey(undefined);
    setMode("edit");
  };
  const peek = (key: string) => {
    closeSheet();
    openPreview(key);
  };

  // --- card stack callbacks ---
  const onOpenCore = (key: CoreKey) =>
    key === "date_blocks" ? setSheet({ type: "dates" }) : setSheet({ type: "option", key });
  const onToggleCore = (key: CoreKey) => {
    const cfg = questionConfig[key];
    dispatch({ type: "SET_QUESTION_CONFIG", key, cfg: { ...cfg, enabled: !cfg.enabled } });
  };

  return (
    <div className="relative min-h-[60vh]">
      {/* EDIT CANVAS — blur-crossfades out while the preview is up */}
      <motion.div
        animate={
          mode === "preview"
            ? { scale: 0.96, filter: "blur(4px)", opacity: 0 }
            : { scale: 1, filter: "blur(0px)", opacity: 1 }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ pointerEvents: mode === "preview" ? "none" : "auto" }}
        className="space-y-5"
      >
        <StudioHeader
          mode={mode}
          onMode={(m) => (m === "preview" ? openPreview() : openEdit())}
          saveState={state.saveState}
          onRetry={retry}
        />

        <SmartBar
          eventType={eventType}
          current={questionConfig}
          onApply={(config) => dispatch({ type: "APPLY_PRESET", config })}
        />

        <QuestionCardStack
          settings={settings}
          onReorder={(order) => dispatch({ type: "REORDER_QUESTIONS", order })}
          onDrop={flush}
          onOpenCore={onOpenCore}
          onToggleCore={onToggleCore}
          onOpenCustom={(id) => setSheet({ type: "custom", id })}
          onDeleteCustom={(id) => dispatch({ type: "DELETE_CUSTOM_QUESTION", id })}
          onUndo={() => dispatch({ type: "UNDO" })}
        />

        {/* Custom rail */}
        <div className="space-y-2.5">
          {customCount === 0 && (
            <p className="px-1 text-sm text-muted-foreground">
              {t("formStudio.emptyCustom", "Noch keine eigenen Fragen — frag z. B. nach Songwünschen 🎵")}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setSheet({ type: "custom" });
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-3.5 text-left active:bg-primary/[0.08]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Plus className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {t("formStudio.addCustom", "Eigene Frage")}
              </span>
              {!isPremium && (
                <span className="block text-[11px] text-muted-foreground">
                  {t("formStudio.freeLimitBadge", "1/1 kostenlos")}
                </span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        {/* Design + fine-print rails */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setSheet({ type: "design" });
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-foreground/[0.03] p-3.5 text-left active:bg-foreground/[0.06]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.06]">
              <Palette className="h-5 w-5 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {t("formStudio.design", "Design")}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {templateName ?? t("dashboard.form.design.templates", "Vorlage")}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.light();
              setSheet({ type: "extras" });
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-foreground/[0.03] p-3.5 text-left active:bg-foreground/[0.06]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.06]">
              <ScrollText className="h-5 w-5 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {t("formStudio.extras", "No-Gos & Fokus")}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {finePrintCount > 0 ? finePrintCount : t("formStudio.requiredField", "0")}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* PREVIEW OVERLAY */}
      <AnimatePresence>
        {mode === "preview" && (
          <StudioPreview eventId={event.id} draft={settings} scrollToKey={scrollToKey} onEdit={openEdit} />
        )}
      </AnimatePresence>

      {/* SHEETS */}
      {sheet?.type === "option" && (
        <OptionEditorSheet
          open
          coreKey={sheet.key}
          settings={settings}
          isPremium={isPremium}
          dispatch={dispatch}
          onClose={closeSheet}
          flush={flush}
          onPeek={peek}
        />
      )}
      {sheet?.type === "dates" && (
        <DateBlocksSheet
          open
          settings={settings}
          dispatch={dispatch}
          onClose={closeSheet}
          flush={flush}
          onPeek={() => peek("date_blocks")}
        />
      )}
      {sheet?.type === "custom" && (
        <CustomQuestionSheet
          open
          editingId={sheet.id ?? null}
          settings={settings}
          isPremium={isPremium}
          dispatch={dispatch}
          onClose={closeSheet}
          flush={flush}
        />
      )}
      {sheet?.type === "design" && (
        <DesignSheet
          open
          settings={settings}
          eventName={event.name}
          honoreeName={event.honoree_name ?? ""}
          eventType={eventType}
          dispatch={dispatch}
          onClose={closeSheet}
          flush={flush}
        />
      )}
      {sheet?.type === "extras" && (
        <ExtrasSheet open settings={settings} dispatch={dispatch} onClose={closeSheet} flush={flush} />
      )}
    </div>
  );
}
