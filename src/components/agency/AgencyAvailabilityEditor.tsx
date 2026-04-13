import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Copy, Trash2, CalendarOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useAvailabilitySlots,
  useAddSlot,
  useUpdateSlot,
  useRemoveSlot,
  useBlockedDates,
  useBlockDate,
  useUnblockDate,
} from "@/hooks/useAvailabilityEditor";

/* ─── Types ──────────────────────────────────────────── */
interface Props {
  serviceId: string;
  open: boolean;
  onClose: () => void;
}

interface LocalSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
  isNew?: boolean;
}

/* ─── Constants ──────────────────────────────────────── */
const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// Reordered: Monday first (1-6, then 0 for Sunday)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const inputClass =
  "bg-white/[0.04] border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-lg focus:border-violet-500/40 focus:shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all";

/* ─── Component ──────────────────────────────────────── */
export function AgencyAvailabilityEditor({ serviceId, open, onClose }: Props) {
  const { data: dbSlots = [] } = useAvailabilitySlots(serviceId);
  const { data: blockedDates = [] } = useBlockedDates(serviceId);

  const addSlot = useAddSlot();
  const updateSlot = useUpdateSlot();
  const removeSlot = useRemoveSlot();
  const blockDate = useBlockDate();
  const unblockDate = useUnblockDate();

  const [newReasons, setNewReasons] = useState<Record<string, string>>({});

  /* ── Group slots by day ─────────────────────────────── */
  const slotsByDay = useMemo(() => {
    const map = new Map<number, typeof dbSlots>();
    for (const slot of dbSlots) {
      const list = map.get(slot.day_of_week) || [];
      list.push(slot);
      map.set(slot.day_of_week, list);
    }
    return map;
  }, [dbSlots]);

  /* ── Handlers ───────────────────────────────────────── */
  const handleAddSlot = (dayOfWeek: number) => {
    addSlot.mutate({
      service_id: serviceId,
      day_of_week: dayOfWeek,
      start_time: "09:00",
      end_time: "17:00",
      max_bookings: 1,
      is_active: true,
    });
  };

  const handleRemoveSlot = (id: string) => {
    removeSlot.mutate({ id, serviceId });
  };

  const handleUpdateField = (id: string, field: string, value: string | number | boolean) => {
    updateSlot.mutate({ id, [field]: value });
  };

  const handleToggleDay = (dayOfWeek: number) => {
    const daySlots = slotsByDay.get(dayOfWeek) || [];
    if (daySlots.length === 0) {
      // Enable day: add a default slot
      handleAddSlot(dayOfWeek);
    } else {
      // Toggle active state for all slots of this day
      const allActive = daySlots.every((s) => s.is_active);
      for (const slot of daySlots) {
        updateSlot.mutate({ id: slot.id, is_active: !allActive });
      }
    }
  };

  const handleCopyMonday = () => {
    const mondaySlots = slotsByDay.get(1) || [];
    if (mondaySlots.length === 0) {
      toast.error("Montag hat keine Zeitslots zum Kopieren");
      return;
    }

    // For each other day (Tue-Sun), remove existing and add Monday's slots
    for (const dow of [2, 3, 4, 5, 6, 0]) {
      const existing = slotsByDay.get(dow) || [];
      for (const slot of existing) {
        removeSlot.mutate({ id: slot.id, serviceId });
      }
      for (const ms of mondaySlots) {
        addSlot.mutate({
          service_id: serviceId,
          day_of_week: dow,
          start_time: ms.start_time,
          end_time: ms.end_time,
          max_bookings: ms.max_bookings,
          is_active: ms.is_active,
        });
      }
    }
    toast.success("Montag-Slots auf alle Tage kopiert");
  };

  /* ── Blocked dates ──────────────────────────────────── */
  const blockedDateSet = useMemo(
    () => new Set(blockedDates.map((b) => b.blocked_date)),
    [blockedDates],
  );

  const blockedDayMatcher = useMemo(() => {
    return blockedDates.map((b) => {
      const [y, m, d] = b.blocked_date.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
  }, [blockedDates]);

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (blockedDateSet.has(dateStr)) {
      const entry = blockedDates.find((b) => b.blocked_date === dateStr);
      if (entry) unblockDate.mutate({ id: entry.id, serviceId });
    } else {
      blockDate.mutate({
        service_id: serviceId,
        blocked_date: dateStr,
        reason: newReasons[dateStr] || undefined,
      });
    }
  };

  const handleReasonChange = (dateStr: string, reason: string) => {
    setNewReasons((prev) => ({ ...prev, [dateStr]: reason }));
  };

  const isBusy =
    addSlot.isPending || updateSlot.isPending || removeSlot.isPending ||
    blockDate.isPending || unblockDate.isPending;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0d0d15]/98 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-50 font-['Plus_Jakarta_Sans']">
                  Verfügbarkeit bearbeiten
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zeitslots und Sperrtage verwalten
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 px-6 py-5 space-y-8">
              {/* ── Section 1: Weekly Time Slots ───────────── */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Wöchentliche Zeitslots
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyMonday}
                    disabled={isBusy}
                    className="text-[11px] h-7 border-white/[0.1] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] cursor-pointer"
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    Alle Tage kopieren
                  </Button>
                </div>

                <div className="space-y-2">
                  {DAY_ORDER.map((dow) => {
                    const daySlots = slotsByDay.get(dow) || [];
                    const isEnabled = daySlots.length > 0 && daySlots.some((s) => s.is_active);

                    return (
                      <motion.div
                        key={dow}
                        layout
                        className="bg-[#1f1f29] rounded-xl border border-white/[0.06] overflow-hidden"
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            {/* Toggle */}
                            <button
                              onClick={() => handleToggleDay(dow)}
                              className={cn(
                                "w-9 h-5 rounded-full transition-colors cursor-pointer relative shrink-0",
                                isEnabled ? "bg-violet-500" : "bg-white/[0.1]",
                              )}
                            >
                              <motion.div
                                animate={{ x: isEnabled ? 16 : 2 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                              />
                            </button>
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isEnabled ? "text-slate-200" : "text-slate-500",
                              )}
                            >
                              {DAY_NAMES[dow]}
                            </span>
                          </div>

                          {isEnabled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddSlot(dow)}
                              disabled={isBusy}
                              className="h-6 w-6 p-0 text-slate-500 hover:text-violet-400 hover:bg-white/[0.04] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Slots */}
                        <AnimatePresence>
                          {isEnabled && daySlots.filter((s) => s.is_active).length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/[0.04] px-4 pb-3"
                            >
                              {daySlots
                                .filter((s) => s.is_active)
                                .map((slot) => (
                                  <div
                                    key={slot.id}
                                    className="flex items-center gap-2 mt-2.5"
                                  >
                                    <Input
                                      type="time"
                                      value={slot.start_time?.slice(0, 5) || "09:00"}
                                      onChange={(e) =>
                                        handleUpdateField(slot.id, "start_time", e.target.value)
                                      }
                                      className={cn(inputClass, "w-24 h-8 text-xs px-2")}
                                    />
                                    <span className="text-slate-600 text-xs">–</span>
                                    <Input
                                      type="time"
                                      value={slot.end_time?.slice(0, 5) || "17:00"}
                                      onChange={(e) =>
                                        handleUpdateField(slot.id, "end_time", e.target.value)
                                      }
                                      className={cn(inputClass, "w-24 h-8 text-xs px-2")}
                                    />
                                    <div className="flex items-center gap-1 ml-1">
                                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                        Max:
                                      </span>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={slot.max_bookings}
                                        onChange={(e) =>
                                          handleUpdateField(
                                            slot.id,
                                            "max_bookings",
                                            Math.max(1, parseInt(e.target.value) || 1),
                                          )
                                        }
                                        className={cn(inputClass, "w-14 h-8 text-xs px-2")}
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleRemoveSlot(slot.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 ml-auto"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* ── Section 2: Blocked Dates ──────────────── */}
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CalendarOff className="w-3.5 h-3.5" />
                  Sperrtage
                </h4>

                <div className="bg-[#1f1f29] rounded-xl border border-white/[0.06] p-4">
                  <p className="text-xs text-slate-500 mb-3">
                    Klicke auf ein Datum, um es zu sperren oder zu entsperren.
                  </p>
                  <Calendar
                    mode="single"
                    onSelect={handleCalendarSelect}
                    modifiers={{ blocked: blockedDayMatcher }}
                    modifiersClassNames={{
                      blocked: "!bg-red-500/20 !text-red-400 hover:!bg-red-500/30",
                    }}
                    className="rounded-lg border border-white/[0.06] bg-[#0d0d15]"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-slate-200",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-white/[0.08] text-slate-300",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative",
                      day: "h-9 w-9 p-0 font-normal text-slate-300 hover:bg-white/[0.06] rounded-md cursor-pointer transition-colors",
                      day_selected: "bg-violet-500/30 text-violet-300",
                      day_today: "bg-white/[0.06] text-slate-100 font-semibold",
                      day_outside: "text-slate-700 opacity-50",
                      day_disabled: "text-slate-700 opacity-30",
                    }}
                  />
                </div>

                {/* Blocked dates list */}
                {blockedDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">
                      Gesperrte Tage ({blockedDates.length})
                    </p>
                    {blockedDates.map((bd) => {
                      const dateObj = new Date(bd.blocked_date + "T00:00:00");
                      const formatted = dateObj.toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <motion.div
                          key={bd.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-3 bg-[#1f1f29] rounded-lg border border-white/[0.06] px-3 py-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs text-slate-300 whitespace-nowrap">
                            {formatted}
                          </span>
                          <Input
                            value={bd.reason || newReasons[bd.blocked_date] || ""}
                            onChange={(e) => handleReasonChange(bd.blocked_date, e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value !== (bd.reason || "")) {
                                // We could update the reason here if the table supports it
                              }
                            }}
                            placeholder="Grund (optional)"
                            className={cn(inputClass, "h-7 text-xs flex-1")}
                          />
                          <button
                            onClick={() => unblockDate.mutate({ id: bd.id, serviceId })}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-white/[0.06] shrink-0">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer"
              >
                Fertig
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
