/**
 * NativeScheduleActivityForm — bottom sheet to add, edit or delete one
 * schedule activity. Pure form: the schedule tab does the saving.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, CATEGORY_META, isFarFromEvent, parseCost, type ActivityCategory } from "@/lib/schedule-utils";

/** One row of `schedule_activities`, as the schedule tab shows it. */
export interface ScheduleActivity {
  id: string;
  dayDate: string;
  startTime: string | null;
  endTime: string | null;
  title: string;
  category: ActivityCategory;
  /** Free text written on the web ("description"); read-only here. */
  description: string;
  notes: string;
  location: string;
  estimatedCost: number | null;
  costPerPerson: boolean;
  currency: string;
  responsibleId: string | null;
}

/** What the form hands back: already validated, cost parsed. */
export interface ActivityDraft {
  title: string;
  dayDate: string;
  startTime: string;
  endTime: string;
  category: ActivityCategory;
  notes: string;
  location: string;
  estimatedCost: number | null;
  costPerPerson: boolean;
  responsibleId: string | null;
}

interface Props {
  open: boolean;
  /** The activity being edited; null adds a new one. */
  activity: ScheduleActivity | null;
  /** Day a new activity starts on (the day the user is looking at). */
  defaultDate: string;
  /** The event's own day, to catch a date picked in the wrong month. */
  eventDate: string | null;
  people: { id: string; name: string }[];
  currency: string;
  busy: boolean;
  onClose: () => void;
  onSave: (draft: ActivityDraft) => void;
  onDelete: () => void;
}

const overlayVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.quick } },
  exit: { opacity: 0, transition: { duration: duration.instant } },
};

const sheetVariant = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: spring.slow },
  exit: { y: "100%", opacity: 0, transition: { duration: duration.smooth, ease: ease.in } },
};

const label = "block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5";
const field = "w-full px-3.5 h-11 rounded-xl bg-muted/40 border border-border/50 text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all";

export default function NativeScheduleActivityForm({ open, activity, defaultDate, eventDate, people, currency, busy, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [title, setTitle] = useState("");
  const [dayDate, setDayDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [category, setCategory] = useState<ActivityCategory>("activity");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [costPerPerson, setCostPerPerson] = useState(true);
  const [responsibleId, setResponsibleId] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Every opening starts from the activity (or a blank one) — never from the last draft.
  useEffect(() => {
    if (!open) return;
    setTitle(activity?.title ?? "");
    setDayDate(activity?.dayDate ?? defaultDate);
    setStartTime(activity ? activity.startTime ?? "" : "12:00");
    setEndTime(activity ? activity.endTime ?? "" : "13:00");
    setCategory(activity?.category ?? "activity");
    setLocation(activity?.location ?? "");
    setCost(activity?.estimatedCost != null ? String(activity.estimatedCost) : "");
    setCostPerPerson(activity?.costPerPerson ?? true);
    setResponsibleId(activity?.responsibleId ?? "");
    setNotes(activity?.notes ?? "");
    setConfirmDelete(false);
  }, [open, activity, defaultDate]);

  const timesInvalid = !!startTime && !!endTime && endTime <= startTime;
  const parsedCost = parseCost(cost);
  const valid = !!title.trim() && !!dayDate && !timesInvalid && parsedCost !== "invalid";
  const close = () => { if (!busy) onClose(); };

  const submit = () => {
    if (!valid || busy) return;
    haptics.medium();
    onSave({
      title: title.trim(), dayDate, startTime, endTime, category,
      notes: notes.trim(), location: location.trim(),
      estimatedCost: parsedCost, costPerPerson,
      responsibleId: responsibleId || null,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="schedule-form-overlay"
            variants={overlayVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={close}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="schedule-form-sheet"
            variants={sheetVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={t(activity ? "nativeSchedule.editActivity" : "nativeSchedule.addActivity")}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card border-t border-border/50 p-5 pb-8 safe-bottom max-h-[88vh] overflow-y-auto native-scroll"
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {t(activity ? "nativeSchedule.editActivity" : "nativeSchedule.addActivity")}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label={t("common.cancel")}
                className="grid h-11 w-11 place-items-center rounded-full bg-muted/50 text-muted-foreground active:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="native-activity-title" className={label}>{t("nativeSchedule.form.title")}</label>
                <input
                  id="native-activity-title"
                  type="text"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("nativeSchedule.form.titlePlaceholder")}
                  className={field}
                />
              </div>

              {/* The day is a real choice: a weekend has more than the event date. */}
              <div>
                <label htmlFor="native-activity-date" className={label}>{t("planner.form.date")}</label>
                <input
                  id="native-activity-date"
                  type="date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className={cn(field, "appearance-none")}
                />
                {/* A hint, not a block: some plans really do start weeks earlier. */}
                {isFarFromEvent(dayDate, eventDate) && (
                  <p role="status" className="mt-1.5 text-xs text-amber-500">{t("nativeSchedule.farFromEvent")}</p>
                )}
              </div>

              {/* Keep the two times together as one compact range on phones. */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <label htmlFor="native-activity-start" className={label}>{t("planner.form.startTime")}</label>
                  <input
                    id="native-activity-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      setStartTime(start);
                      if (start && endTime && endTime <= start) {
                        const [hour, minute] = start.split(":").map(Number);
                        setEndTime(`${String(Math.min(hour + 1, 23)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
                      }
                    }}
                    className="native-activity-time block h-11 w-full min-w-0 appearance-none overflow-hidden rounded-xl border border-border/50 bg-muted/40 px-1 text-center text-base text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="native-activity-end" className={label}>{t("planner.form.endTime")}</label>
                  <input
                    id="native-activity-end"
                    type="time"
                    min={startTime || undefined}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="native-activity-time block h-11 w-full min-w-0 appearance-none overflow-hidden rounded-xl border border-border/50 bg-muted/40 px-1 text-center text-base text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
                {timesInvalid && (
                  <p role="alert" className="col-span-2 text-xs text-destructive">{t("nativeSchedule.form.endAfterStart")}</p>
                )}
              </div>

              <div>
                <span className={label}>{t("nativeSchedule.form.category")}</span>
                <div className="grid grid-cols-4 gap-2">
                  {ACTIVITY_CATEGORIES.map((value) => {
                    const active = category === value;
                    const meta = CATEGORY_META[value];
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { haptics.light(); setCategory(value); }}
                        className={cn(
                          "flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2 text-center text-[11px] font-medium transition-all",
                          active
                            ? "border-violet-400/60 bg-violet-500/15 text-foreground shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18)]"
                            : "border-border/50 bg-muted/20 text-muted-foreground",
                        )}
                        aria-pressed={active}
                      >
                        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg", meta.color)}>{meta.icon}</span>
                        <span className="min-w-0 break-words leading-tight">{t(`nativeSchedule.categories.${value}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="native-activity-location" className={label}>{t("nativeSchedule.form.location")}</label>
                <input
                  id="native-activity-location"
                  type="text"
                  value={location}
                  maxLength={200}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("planner.form.locationPlaceholder")}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="native-activity-cost" className={label}>{t("nativeSchedule.form.cost")} ({currency})</label>
                <div className="flex items-center gap-2.5">
                  <input
                    id="native-activity-cost"
                    type="text"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    aria-invalid={parsedCost === "invalid"}
                    className={cn(field, "min-w-0 flex-1 tabular-nums", parsedCost === "invalid" && "border-destructive/60")}
                  />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={costPerPerson}
                    onClick={() => { haptics.light(); setCostPerPerson((value) => !value); }}
                    className={cn(
                      "h-11 shrink-0 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                      costPerPerson ? "border-violet-400/60 bg-violet-500/15 text-foreground" : "border-border/50 bg-muted/20 text-muted-foreground",
                    )}
                  >
                    {t("planner.form.perPerson")}
                  </button>
                </div>
              </div>

              {people.length > 0 && (
                <div>
                  <label htmlFor="native-activity-responsible" className={label}>{t("nativeSchedule.form.responsible")}</label>
                  <select
                    id="native-activity-responsible"
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    className={cn(field, "appearance-none")}
                  >
                    <option value="">{t("nativeSchedule.noResponsible")}</option>
                    {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="native-activity-notes" className={label}>{t("nativeSchedule.form.notes")}</label>
                <textarea
                  id="native-activity-notes"
                  value={notes}
                  maxLength={2000}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("planner.form.notesPlaceholder")}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all resize-none"
                />
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={!valid || busy}
                className={cn(
                  "flex w-full items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold transition-all",
                  valid && !busy
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30 active:scale-[0.98]"
                    : "bg-muted/50 text-muted-foreground",
                )}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {t(activity ? "common.save" : "nativeSchedule.form.add")}
              </button>

              {/* Deleting takes a second tap on the same spot: no dialog, no accident. */}
              {activity && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!confirmDelete) { haptics.light(); setConfirmDelete(true); return; }
                    haptics.warning();
                    onDelete();
                  }}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50",
                    confirmDelete ? "bg-destructive text-destructive-foreground" : "text-destructive active:bg-destructive/10",
                  )}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t(confirmDelete ? "nativeSchedule.deleteConfirm" : "common.delete")}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
