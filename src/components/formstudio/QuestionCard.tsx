/**
 * QuestionCard — one draggable question tile in the Studio stack.
 *
 * Visually matches EventQuestionsStep's cards (emoji tile, gradient-active
 * surface, sliding-pill toggle) and adds Studio-only affordances: an answer
 * summary line, up to three ghost option chips, a long-press drag handle, and
 * (for custom questions) a type badge + delete with undo toast.
 *
 * It is a Reorder.Item; dragging is bound to the GripVertical handle only
 * (dragListener disabled on the item) so vertical scroll never fights the drag.
 * Tapping the card body opens the question's editor sheet.
 */
import { Reorder, motion, useDragControls } from "framer-motion";
import { Check, GripVertical, Lock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CoreQuestionMeta } from "@/components/formstudio/questionRegistry";
import type { CustomQuestion, QuestionConfig } from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  value: string;
  /** Core question metadata (mutually exclusive with `custom`). */
  meta?: CoreQuestionMeta;
  config?: QuestionConfig;
  /** Custom question payload (mutually exclusive with `meta`). */
  custom?: CustomQuestion;
  answerCount: number;
  multiSelect: boolean;
  /** Up to three already-translated option labels shown as ghost chips. */
  chips: string[];
  onOpen: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  /** Called on drag drop so the parent can flush the reorder. */
  onDropped?: () => void;
}

export function QuestionCard({
  value,
  meta,
  config,
  custom,
  answerCount,
  multiSelect,
  chips,
  onOpen,
  onToggle,
  onDelete,
  onUndo,
  onDropped,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const controls = useDragControls();

  const isCustom = !!custom;
  const canDisable = meta ? meta.policy.canDisable : true;
  const enabled = isCustom ? true : (config?.enabled ?? true);
  const emoji = meta?.emoji ?? "✏️";
  const title = isCustom
    ? custom!.label || t("dashboard.form.customQuestions.untitledQuestion", "Frage")
    : t(meta!.titleKey, meta!.key);
  const desc = isCustom ? undefined : t(meta!.descKey, "");

  const handleDelete = () => {
    haptics.warning();
    onDelete?.();
    toast(t("formStudio.questionDeleted", "Frage gelöscht"), {
      action: onUndo
        ? { label: t("formStudio.undo", "Rückgängig"), onClick: () => onUndo() }
        : undefined,
    });
  };

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => haptics.medium()}
      onDragEnd={() => {
        haptics.light();
        onDropped?.();
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-colors duration-300",
        enabled
          ? "border-primary/40 bg-gradient-to-r from-violet-500/[0.12] to-fuchsia-500/[0.12] shadow-[0_10px_30px_-12px_rgba(139,92,246,0.5)]"
          : "border-border bg-foreground/[0.03]",
        !enabled && "opacity-55",
      )}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle — long-press area, isolated from scroll */}
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label={t("formStudio.reorderHint", "Halten & ziehen zum Sortieren")}
          className="grid h-9 w-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground/50 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Tap target opens the editor */}
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="text-2xl leading-none">{emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-base font-semibold text-foreground">{title}</span>
              {isCustom && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  {t("formStudio.customBadge", "Eigene Frage")}
                </span>
              )}
              {!isCustom && !canDisable && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" />
                  {t("native.create.questions.attendanceAlways", "immer dabei")}
                </span>
              )}
            </span>
            {desc && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{desc}</span>}
            <span className="mt-1 block text-[11px] text-muted-foreground/80">
              {isCustom
                ? custom!.type
                : `${t("formStudio.answersCount", { count: answerCount })} · ${
                    multiSelect ? t("formStudio.multi", "Mehrfachauswahl") : t("formStudio.single", "Einfachauswahl")
                  }`}
            </span>
            {/* Ghost option chips */}
            {enabled && chips.length > 0 && (
              <span className="mt-1.5 flex flex-wrap gap-1">
                {chips.slice(0, 3).map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="inline-flex max-w-[9rem] items-center truncate rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </span>
            )}
          </span>
        </button>

        {/* Trailing control: custom → delete, core → toggle (or lock) */}
        {isCustom ? (
          <button
            type="button"
            onClick={handleDelete}
            aria-label={t("formStudio.undo", "Löschen")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!canDisable) return;
              haptics.select();
              onToggle?.();
            }}
            aria-pressed={enabled}
            aria-disabled={!canDisable}
            className={cn(
              "relative flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300",
              enabled ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-foreground/15",
              !canDisable && "opacity-90",
            )}
          >
            <motion.span
              className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm"
              animate={{ x: enabled ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 700, damping: 32 }}
            >
              {!canDisable ? (
                <Lock className="h-3 w-3 text-primary" />
              ) : enabled ? (
                <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              )}
            </motion.span>
          </button>
        )}
      </div>
    </Reorder.Item>
  );
}
