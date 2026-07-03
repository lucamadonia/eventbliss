/**
 * DateBlocksSheet — manage the event's candidate date ranges.
 *
 * Top: the existing blocks as horizontal cards (letter badge, formatted range,
 * a warning toggle that expands an inline note input, delete). Below: a single
 * inline range calendar; once a full range is picked a preview chip + add button
 * appends a new DateRangeBlock with the next free letter key.
 *
 * Everything dispatches SET_DATE_RANGES — the reducer re-derives the legacy
 * date_blocks/date_warnings records (P5 dual-write). Blocks are kept sorted by
 * start date; legacy blocks that never had real dates show an "unknown" chip.
 */
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { AlertTriangle, CalendarPlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/GradientButton";
import { StudioSheet } from "./StudioSheet";
import type { FormStudioAction } from "./formStudioReducer";
import { type EventSettings, type DateRangeBlock, getDateBlocks } from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function nextKey(used: string[]): string {
  const taken = new Set(used.map((k) => k.toUpperCase()));
  return LETTERS.find((l) => !taken.has(l)) ?? `${Date.now()}`;
}

function sortByStart(blocks: DateRangeBlock[]): DateRangeBlock[] {
  return [...blocks].sort((a, b) => {
    if (!a.start) return 1;
    if (!b.start) return -1;
    return a.start.localeCompare(b.start);
  });
}

function formatRange(start: string, end: string): string {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  const same = start === end || !end;
  return same
    ? format(s, "d. MMM yyyy", { locale: de })
    : `${format(s, "d. MMM", { locale: de })} – ${format(e, "d. MMM yyyy", { locale: de })}`;
}

interface DateBlocksSheetProps {
  open: boolean;
  settings: EventSettings;
  dispatch: React.Dispatch<FormStudioAction>;
  onClose: () => void;
  flush: () => void;
  onPeek: () => void;
}

export function DateBlocksSheet({ open, settings, dispatch, onClose, flush, onPeek }: DateBlocksSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const blocks = getDateBlocks(settings);
  const [range, setRange] = useState<DateRange | undefined>();
  const [warningOpen, setWarningOpen] = useState<string | null>(null);

  const setRanges = (next: DateRangeBlock[]) =>
    dispatch({ type: "SET_DATE_RANGES", ranges: sortByStart(next) });

  const addRange = () => {
    if (!range?.from) return;
    const start = format(range.from, "yyyy-MM-dd");
    const end = format(range.to ?? range.from, "yyyy-MM-dd");
    const key = nextKey(blocks.map((b) => b.key));
    haptics.success();
    setRanges([...blocks, { key, start, end, label: formatRange(start, end) }]);
    setRange(undefined);
  };

  const removeBlock = (key: string) => {
    haptics.light();
    setRanges(blocks.filter((b) => b.key !== key));
  };

  const setWarning = (key: string, warning: string) =>
    setRanges(blocks.map((b) => (b.key === key ? { ...b, warning: warning || undefined } : b)));

  return (
    <StudioSheet open={open} onClose={onClose} flush={flush} emoji="📅" title={t("native.create.questions.q.date_blocks.title", "Termine")} onPeek={onPeek}>
      <div className="space-y-4">
        {/* Existing blocks */}
        {blocks.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {blocks.map((b) => (
              <div
                key={b.key}
                className="min-w-[9.5rem] shrink-0 rounded-2xl border border-primary/25 bg-gradient-to-br from-violet-500/[0.1] to-fuchsia-500/[0.08] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {b.key}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setWarningOpen(warningOpen === b.key ? null : b.key)}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg",
                        b.warning ? "text-amber-500" : "text-muted-foreground/60",
                      )}
                      aria-label="Warning"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(b.key)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-destructive/80"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {b.start ? (
                    formatRange(b.start, b.end)
                  ) : (
                    <span className="text-xs text-amber-500">
                      {t("formStudio.dateBlockUnknown", "Datum unbekannt — neu setzen")}
                    </span>
                  )}
                </p>
                {warningOpen === b.key && (
                  <Input
                    autoFocus
                    value={b.warning ?? ""}
                    onChange={(e) => setWarning(b.key, e.target.value)}
                    placeholder={t("native.create.questions.q.date_blocks.desc", "Hinweis")}
                    className="mt-2 h-8 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Range picker */}
        <div className="rounded-2xl border border-border bg-background/40 p-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            locale={de}
            className="mx-auto"
          />
        </div>

        {/* Preview + add */}
        {range?.from && (
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate rounded-full bg-foreground/[0.06] px-3 py-2 text-sm text-foreground">
              {formatRange(
                format(range.from, "yyyy-MM-dd"),
                format(range.to ?? range.from, "yyyy-MM-dd"),
              )}
            </span>
            <GradientButton size="sm" icon={<CalendarPlus className="h-4 w-4" />} onClick={addRange}>
              {t("formStudio.addToForm", "Hinzufügen")}
            </GradientButton>
          </div>
        )}
      </div>
    </StudioSheet>
  );
}
