/**
 * NativeEventSchedule — "Zeitplan" tab for the Event Dashboard.
 * Vertical timeline per day with expand-on-tap cards. Organisers add, edit
 * and delete activities on any day; everyone else reads the plan.
 */
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronDown, Clock, MapPin, Pencil, Plus, User, WifiOff } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NativeScheduleActivityForm, {
  CATEGORY_META, activityCategory, type ActivityDraft, type ScheduleActivity,
} from "./NativeScheduleActivityForm";

interface NativeEventScheduleProps {
  eventSlug: string;
  /** Organisers plan; guests read. The database enforces the same rule. */
  canManage: boolean;
  participants: { id: string; name: string }[];
  /** The event's currency for new activities. */
  currency: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const hhmm = (time: string | null): string | null => (time ? time.slice(0, 5) : null);

/** Local calendar day as YYYY-MM-DD (never shifted by the UTC offset). */
function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayAfter(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return isoDay(date);
}

function formatDayLabel(day: string, locale: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" });
}

function computeDuration(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return "";
  const diffMs = new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime();
  if (diffMs <= 0) return "";
  const hours = diffMs / 3_600_000;
  if (hours >= 1) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(diffMs / 60_000)}min`;
}

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    // An unknown currency code must not take the whole tab down.
    return `${amount} ${currency}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const timelineLineVariant = {
  initial: { scaleY: 0, originY: 0 },
  animate: { scaleY: 1, transition: { duration: duration.dramatic, ease: ease.out, delay: 0.15 } },
};

const dotVariant = {
  initial: { scale: 0, opacity: 0 },
  animate: (i: number) => ({ scale: 1, opacity: 1, transition: { ...spring.bouncy, delay: 0.2 + i * 0.08 } }),
};

const cardVariant = {
  initial: { opacity: 0, x: 24, scale: 0.95 },
  animate: (i: number) => ({ opacity: 1, x: 0, scale: 1, transition: { ...spring.soft, delay: 0.25 + i * 0.08 } }),
};

const timeVariant = {
  initial: { opacity: 0, x: -12 },
  animate: (i: number) => ({ opacity: 1, x: 0, transition: { ...spring.snappy, delay: 0.2 + i * 0.08 } }),
};

const expandVariant = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { ...spring.soft, opacity: { duration: duration.quick } } },
  exit: { height: 0, opacity: 0, transition: { duration: duration.quick, ease: ease.in } },
};

const fabVariant = {
  initial: { scale: 0, rotate: -90 },
  animate: { scale: 1, rotate: 0, transition: { ...spring.bouncy, delay: 0.5 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NativeEventSchedule({ eventSlug, canManage, participants, currency }: NativeEventScheduleProps) {
  const { t, i18n } = useTranslation();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** null = closed; "new" = add on `formDate`; otherwise the activity being edited. */
  const [formFor, setFormFor] = useState<ScheduleActivity | "new" | null>(null);
  const [formDate, setFormDate] = useState("");
  const [busy, setBusy] = useState(false);

  const queryKey = useMemo(() => ["native-schedule", eventSlug], [eventSlug]);
  const { data: scheduleData, isPending: loading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, event_date")
        .eq("slug", eventSlug)
        .maybeSingle();
      // A failed request is an error, not an empty schedule.
      if (eventError) throw eventError;
      if (!eventData) return { eventId: null as string | null, eventDate: null as string | null, activities: [] as ScheduleActivity[] };

      const { data, error } = await supabase
        .from("schedule_activities")
        .select("*")
        .eq("event_id", eventData.id)
        .order("day_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;

      const activities: ScheduleActivity[] = (data || []).map((a) => ({
        id: a.id,
        dayDate: a.day_date,
        startTime: hhmm(a.start_time),
        endTime: hhmm(a.end_time),
        title: a.title,
        category: activityCategory(a.category),
        description: a.description || "",
        notes: a.notes || "",
        location: a.location || "",
        estimatedCost: a.estimated_cost != null ? Number(a.estimated_cost) : null,
        costPerPerson: a.cost_per_person ?? true,
        currency: a.currency || "EUR",
        responsibleId: a.responsible_participant_id ?? null,
      }));

      return { eventId: eventData.id as string | null, eventDate: (eventData.event_date as string | null)?.slice(0, 10) ?? null, activities };
    },
  });

  const eventId = scheduleData?.eventId ?? null;
  const eventDate = scheduleData?.eventDate ?? null;
  const allActivities = useMemo(() => scheduleData?.activities ?? [], [scheduleData]);

  /* ---------- Days: the event day plus every day that has an activity ---------- */
  const dayDates = useMemo(() => {
    const days = new Set(allActivities.map((activity) => activity.dayDate));
    if (eventDate) days.add(eventDate);
    return [...days].sort();
  }, [allActivities, eventDate]);

  const today = isoDay(new Date());
  const activeDate = selectedDate && dayDates.includes(selectedDate) ? selectedDate
    : dayDates.includes(today) ? today
    : eventDate && dayDates.includes(eventDate) ? eventDate
    : dayDates[0] ?? null;
  const activities = useMemo(() => allActivities.filter((activity) => activity.dayDate === activeDate), [allActivities, activeDate]);
  const personName = useCallback((id: string | null) => participants.find((person) => person.id === id)?.name ?? null, [participants]);

  const toggleExpand = (id: string) => {
    haptics.light();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openCreate = (day: string) => {
    haptics.medium();
    setFormDate(day);
    setFormFor("new");
  };

  const editing = formFor && formFor !== "new" ? formFor : null;

  const handleSave = async (draft: ActivityDraft) => {
    if (!eventId || busy) return;
    setBusy(true);
    const row = {
      title: draft.title,
      day_date: draft.dayDate,
      start_time: draft.startTime || null,
      end_time: draft.endTime || null,
      category: draft.category,
      notes: draft.notes || null,
      location: draft.location || null,
      estimated_cost: draft.estimatedCost,
      cost_per_person: draft.costPerPerson,
      currency: editing?.currency ?? currency,
      responsible_participant_id: draft.responsibleId,
    };
    // `.select` returns the written rows: a write the database silently
    // refused (no permission) comes back empty and must not look saved.
    const { data, error } = editing
      ? await supabase.from("schedule_activities").update(row).eq("id", editing.id).select("id")
      : await supabase.from("schedule_activities").insert({ event_id: eventId, ...row }).select("id");
    if (error || !data?.length) {
      setBusy(false);
      haptics.warning();
      toast.error(t("nativeSchedule.saveFailed"));
      return;
    }
    await queryClient.invalidateQueries({ queryKey });
    setBusy(false);
    haptics.success();
    setSelectedDate(draft.dayDate);
    setFormFor(null);
  };

  const handleDelete = async () => {
    if (!editing || busy) return;
    setBusy(true);
    const { data, error } = await supabase.from("schedule_activities").delete().eq("id", editing.id).select("id");
    if (error || !data?.length) {
      setBusy(false);
      haptics.warning();
      toast.error(t("nativeSchedule.deleteFailed"));
      return;
    }
    await queryClient.invalidateQueries({ queryKey });
    setBusy(false);
    setExpandedId(null);
    setFormFor(null);
    toast.success(t("nativeSchedule.deleted"));
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const showDays = !loading && !isError && (dayDates.length > 1 || (canManage && dayDates.length > 0));
  const newActivityDate = activeDate ?? eventDate ?? today;

  return (
    <div className="relative flex flex-col h-full bg-background">
      {/* ------- Day Selector ------- */}
      {showDays && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 overflow-x-auto no-scrollbar">
          {dayDates.map((day) => {
            const active = day === activeDate;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => { haptics.light(); setSelectedDate(day); setExpandedId(null); }}
                className="relative shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="day-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25"
                    transition={spring.snappy}
                  />
                )}
                <span className={cn("relative z-10", active ? "text-white" : "text-muted-foreground")}>
                  {formatDayLabel(day, i18n.language)}
                </span>
              </button>
            );
          })}
          {/* Another day: the form opens on the day after the last one; the date stays editable there. */}
          {canManage && (
            <button
              type="button"
              aria-label={t("nativeSchedule.addDay")}
              onClick={() => openCreate(dayAfter(dayDates[dayDates.length - 1]))}
              className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-border text-sm font-medium text-muted-foreground active:bg-foreground/5"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("nativeSchedule.addDay")}
            </button>
          )}
        </div>
      )}

      {/* ------- Timeline ------- */}
      <div className="flex-1 overflow-y-auto native-scroll px-5 pb-28 pt-4">
        {loading ? (
          <div className="flex flex-col gap-4 pt-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-0 animate-pulse">
                <div className="w-[42px] shrink-0 pt-3 text-right">
                  <div className="h-4 w-10 bg-muted/40 rounded ml-auto" />
                </div>
                <div className="relative shrink-0 w-[26px] flex justify-center pt-3.5 z-10">
                  <div className="w-3 h-3 rounded-full bg-muted/40" />
                </div>
                <div className="flex-1 min-w-0 pb-3">
                  <div className="rounded-2xl p-3.5 border border-border/30 bg-card/40 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-muted/40 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/4 bg-muted/40 rounded" />
                        <div className="h-3 w-1/2 bg-muted/30 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-12 bg-muted/30 rounded-md" />
                      <div className="h-5 w-16 bg-muted/30 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <WifiOff className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{t("nativeSchedule.loadError")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("nativeDashboard.loadErrorDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => { haptics.select(); void refetch(); }}
              className="mt-2 h-11 px-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              {t("nativeDashboard.retry")}
            </button>
          </div>
        ) : activities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.soft}
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
              <Calendar className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {t(allActivities.length > 0 ? "nativeSchedule.noActivitiesDay" : "nativeSchedule.noActivities")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t(canManage ? "nativeSchedule.noActivitiesDesc" : "nativeSchedule.noActivitiesGuest")}
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => openCreate(newActivityDate)}
                className="mt-2 h-11 px-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 active:scale-95 transition-transform"
              >
                {t("nativeSchedule.addActivity")}
              </button>
            )}
          </motion.div>
        ) : (
          <div className="relative" key={activeDate}>
            <motion.div
              variants={timelineLineVariant}
              initial="initial"
              animate="animate"
              className="absolute left-[54px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-violet-500 via-purple-500 to-cyan-500 rounded-full"
              style={{ transformOrigin: "top" }}
            />

            <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col gap-1">
              {activities.map((act, i) => {
                const isExpanded = expandedId === act.id;
                const catMeta = CATEGORY_META[act.category];
                const details = [act.description, act.notes].filter(Boolean).join("\n\n");
                const activityDuration = computeDuration(act.startTime, act.endTime);
                const responsible = personName(act.responsibleId);
                const money = act.estimatedCost != null && act.estimatedCost > 0
                  ? formatMoney(act.estimatedCost, act.currency, i18n.language) : null;

                return (
                  <div key={act.id} className="relative flex items-start gap-0">
                    <motion.div custom={i} variants={timeVariant} initial="initial" animate="animate" className="w-[42px] shrink-0 pt-3 text-right">
                      <span className="text-sm font-bold text-foreground font-mono tracking-tight">
                        {act.startTime ?? "–"}
                      </span>
                    </motion.div>

                    <motion.div custom={i} variants={dotVariant} initial="initial" animate="animate" className="relative shrink-0 w-[26px] flex justify-center pt-3.5 z-10">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full bg-gradient-to-br shadow-lg",
                          catMeta.color,
                          isExpanded && "ring-2 ring-white/50 ring-offset-2 ring-offset-background",
                        )}
                      />
                    </motion.div>

                    <motion.div custom={i} variants={cardVariant} initial="initial" animate="animate" className="flex-1 min-w-0 pb-3">
                      {/* A div, not a button: the expanded card holds a link and an edit button of its own. */}
                      <motion.div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(act.id)}
                        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleExpand(act.id); } }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full cursor-pointer text-left rounded-2xl p-3.5 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
                          isExpanded
                            ? "bg-card/90 border-violet-500/30 shadow-lg shadow-violet-500/10"
                            : "bg-card/60 border-border/50",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br text-lg shrink-0", catMeta.color)}>
                            {catMeta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-foreground truncate">{act.title}</p>
                            {details && !isExpanded && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{details}</p>
                            )}
                          </div>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={spring.snappy}>
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 empty:hidden">
                          {act.startTime && act.endTime && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 text-[11px] font-medium tabular-nums">
                              <Clock className="w-3 h-3" />
                              {act.startTime}–{act.endTime}{activityDuration && ` · ${activityDuration}`}
                            </span>
                          )}
                          {money && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-medium tabular-nums">
                              {act.costPerPerson ? t("nativeSchedule.perPersonAmount", { amount: money }) : money}
                            </span>
                          )}
                          {responsible && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-[11px] font-medium">
                              <User className="w-3 h-3" />
                              {responsible}
                            </span>
                          )}
                          {act.location && !isExpanded && (
                            <span className="inline-flex min-w-0 items-center gap-1 px-2 py-0.5 rounded-md bg-foreground/5 text-muted-foreground text-[11px] font-medium">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[10rem]">{act.location}</span>
                            </span>
                          )}
                        </div>

                        <AnimatePresence>
                          {isExpanded && (details || act.location || canManage) && (
                            <motion.div variants={expandVariant} initial="initial" animate="animate" exit="exit" className="overflow-hidden">
                              <div className="pt-3 mt-3 border-t border-border/40 space-y-2.5">
                                {details && (
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{details}</p>
                                )}
                                {act.location && (
                                  <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(act.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-sm text-violet-400"
                                  >
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="underline underline-offset-2">{act.location}</span>
                                  </a>
                                )}
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); haptics.light(); setFormFor(act); }}
                                    className="inline-flex items-center gap-1.5 h-11 px-4 -ml-1 rounded-xl bg-foreground/5 text-sm font-semibold text-foreground active:bg-foreground/10"
                                  >
                                    <Pencil className="w-3.5 h-3.5" aria-hidden />
                                    {t("common.edit")}
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>

      {/* ------- FAB (organisers only) ------- */}
      {canManage && !loading && !isError && (
        <motion.button
          type="button"
          variants={fabVariant}
          initial="initial"
          animate="animate"
          whileTap={{ scale: 0.9 }}
          aria-label={t("nativeSchedule.addActivity")}
          onClick={() => openCreate(newActivityDate)}
          className="fixed bottom-24 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700"
          style={{ boxShadow: "0 0 24px rgba(139,92,246,0.4), 0 8px 32px rgba(139,92,246,0.25)" }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      <NativeScheduleActivityForm
        open={formFor !== null}
        activity={editing}
        defaultDate={formDate || newActivityDate}
        people={participants}
        currency={currency}
        busy={busy}
        onClose={() => setFormFor(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
