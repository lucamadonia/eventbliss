import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Download,
  Clock,
  Users,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { CreateBookingDialog } from "./CreateBookingDialog";
import { CalendarToolbar, type ViewMode } from "./calendar/CalendarToolbar";
import { CalendarFilters, type CalendarFilterState } from "./calendar/CalendarFilters";
import { MonthView } from "./calendar/MonthView";
import { WeekView } from "./calendar/WeekView";
import { DayView } from "./calendar/DayView";
import { ResourceView } from "./calendar/ResourceView";
import { PrintSchedule } from "./calendar/PrintSchedule";
import { useBookingConflicts } from "@/hooks/useBookingConflicts";
import { useAgencyGuidesList } from "@/hooks/useAgencyEarnings";
import { useAgencyServices } from "@/hooks/useManualBooking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import {
  useAgencyBookings,
  useConfirmBooking,
  useCancelBooking,
  useCompleteBooking,
  type MarketplaceBooking,
} from "@/hooks/useMarketplaceBookings";

/* ─── Constants ─────────────────────────────────────────── */

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00–22:00

const categoryColors: Record<string, string> = {
  workshop: "bg-violet-500",
  sport: "bg-red-500",
  entertainment: "bg-cyan-500",
  catering: "bg-amber-500",
  music: "bg-pink-500",
  photography: "bg-emerald-500",
  venue: "bg-indigo-500",
  wellness: "bg-rose-400",
  decoration: "bg-teal-500",
  transport: "bg-orange-500",
  other: "bg-slate-500",
};

const categoryDotColors: Record<string, string> = {
  workshop: "bg-violet-400",
  sport: "bg-red-400",
  entertainment: "bg-cyan-400",
  catering: "bg-amber-400",
  music: "bg-pink-400",
  photography: "bg-emerald-400",
  venue: "bg-indigo-400",
  wellness: "bg-rose-300",
  decoration: "bg-teal-400",
  transport: "bg-orange-400",
  other: "bg-slate-400",
};

const statusConfig: Record<string, { key: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { key: "pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
  confirmed: { key: "confirmed", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: CheckCircle2 },
  completed: { key: "completed", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  cancelled_by_agency: { key: "cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
  cancelled_by_customer: { key: "cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
};

const statusFilterOptions = [
  { value: "all", key: "all" },
  { value: "pending", key: "pending" },
  { value: "confirmed", key: "confirmed" },
  { value: "completed", key: "completed" },
];

/* ─── Helpers ───────────────────────────────────────────── */

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseHour(timeStr: string): number {
  if (!timeStr) return 10;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) || 10;
}

function formatCents(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

function generateICalEvent(b: MarketplaceBooking): string {
  const dtStart = `${b.booking_date.replace(/-/g, "")}T${(b.booking_time || "10:00:00").replace(/:/g, "").slice(0, 6)}00`;
  return [
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `SUMMARY:${b.service_title || "Buchung"} - ${b.customer_name}`,
    `DESCRIPTION:Teilnehmer: ${b.participant_count}\\nBuchungsnr: ${b.booking_number}`,
    `UID:${b.id}@eventbliss`,
    "END:VEVENT",
  ].join("\r\n");
}

/* ─── Booking Detail Dialog ─────────────────────────────── */

function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: MarketplaceBooking;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();
  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-4 top-[10%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-md bg-[#1a1625]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-slate-50">Buchungsdetails</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">#{booking.booking_number}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Service & Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">{booking.service_title || "Service"}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(booking.booking_date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                {booking.booking_time && ` um ${booking.booking_time.slice(0, 5)}`}
              </p>
            </div>
            <Badge variant="outline" className={cn("text-[10px] gap-1", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {t(`bookingCalendar.status.${status.key}`, status.key)}
            </Badge>
          </div>

          {/* Customer */}
          <div className="p-3 rounded-xl bg-white/[0.03] space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-300">{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{booking.customer_email}</span>
            </div>
            {booking.customer_phone && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{booking.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <p className="text-[10px] text-slate-600 mb-0.5">Teilnehmer</p>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-sm font-medium text-slate-200">{booking.participant_count}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <p className="text-[10px] text-slate-600 mb-0.5">Gesamtpreis</p>
              <p className="text-sm font-medium text-slate-200">
                {formatCents(booking.total_price_cents, booking.currency)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {booking.customer_notes && (
            <div className="p-3 rounded-xl bg-white/[0.03]">
              <p className="text-[10px] text-slate-600 mb-1">Kundennotiz</p>
              <p className="text-xs text-slate-400">{booking.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
          {booking.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => { confirmBooking.mutate(booking.id); onClose(); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                disabled={confirmBooking.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {t("bookingsManager.confirm", "Bestätigen")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { cancelBooking.mutate({ bookingId: booking.id, asAgency: true }); onClose(); }}
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs cursor-pointer"
                disabled={cancelBooking.isPending}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {t("bookingsManager.cancelBooking", "Stornieren")}
              </Button>
            </>
          )}
          {booking.status === "confirmed" && (
            <>
              <Button
                size="sm"
                onClick={() => { completeBooking.mutate(booking.id); onClose(); }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                disabled={completeBooking.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {t("bookingsManager.complete", "Abschließen")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { cancelBooking.mutate({ bookingId: booking.id, asAgency: true }); onClose(); }}
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs cursor-pointer"
                disabled={cancelBooking.isPending}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {t("bookingsManager.cancelBooking", "Stornieren")}
              </Button>
            </>
          )}
          {(booking.status === "completed" || booking.status.startsWith("cancelled")) && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/[0.1] text-slate-400 hover:bg-white/[0.04] text-xs cursor-pointer"
            >
              Schließen
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ─── Day Detail Panel ──────────────────────────────────── */

function DayDetailPanel({
  day,
  month,
  year,
  bookings,
  onSelectBooking,
}: {
  day: number;
  month: number;
  year: number;
  bookings: MarketplaceBooking[];
  onSelectBooking: (b: MarketplaceBooking) => void;
}) {
  const { t } = useTranslation();
  // Sort by booking_time
  const sorted = useMemo(
    () => [...bookings].sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || "")),
    [bookings]
  );

  return (
    <motion.div
      key={`${year}-${month}-${day}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
    >
      <GlassCard className="p-5" gradient>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-slate-50">
              {day}. {t(`bookingCalendar.monthNames.${month}`, MONTHS[month])}
            </p>
            <p className="text-xs text-slate-500">
              {bookings.length} {bookings.length === 1 ? "Buchung" : "Buchungen"}
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">{t("bookingCalendar.noBookingsDay", "Keine Buchungen an diesem Tag")}</p>
        ) : (
          <div className="space-y-1 relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/[0.06]" />

            {/* Hourly slots */}
            {HOURS.map((hour) => {
              const hourBookings = sorted.filter((b) => parseHour(b.booking_time) === hour);
              if (hourBookings.length === 0) return null;

              return (
                <div key={hour} className="relative pl-10">
                  {/* Time marker */}
                  <div className="absolute left-0 top-3 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500 ring-2 ring-[#1a1625] z-10" />
                    <span className="text-[10px] text-slate-600 font-mono">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>

                  <div className="space-y-2 py-1">
                    {hourBookings.map((b) => {
                      const status = statusConfig[b.status] || statusConfig.pending;
                      return (
                        <button
                          key={b.id}
                          onClick={() => onSelectBooking(b)}
                          className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-violet-500/20 transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-6 rounded-full shrink-0", categoryColors[(b as any).category] || categoryColors.other)} />
                              <div>
                                <p className="text-xs font-medium text-slate-100 group-hover:text-violet-300 transition-colors">
                                  {b.service_title || "Service"}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{b.customer_name}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn("text-[8px] shrink-0", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 ml-3.5 text-[10px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {b.participant_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {b.booking_time?.slice(0, 5) || "--:--"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Bookings without a matching hour slot */}
            {sorted.filter((b) => !HOURS.includes(parseHour(b.booking_time))).length > 0 && (
              <div className="relative pl-10 pt-2">
                <div className="absolute left-0 top-5 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-600 ring-2 ring-[#1a1625] z-10" />
                  <span className="text-[10px] text-slate-600 font-mono">--:--</span>
                </div>
                <div className="space-y-2 py-1">
                  {sorted
                    .filter((b) => !HOURS.includes(parseHour(b.booking_time)))
                    .map((b) => {
                      const status = statusConfig[b.status] || statusConfig.pending;
                      return (
                        <button
                          key={b.id}
                          onClick={() => onSelectBooking(b)}
                          className="w-full text-left p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-xs font-medium text-slate-100">{b.service_title || "Service"}</p>
                            <Badge variant="outline" className={cn("text-[8px]", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{b.customer_name}</p>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export function AgencyBookingCalendar({ agencyId }: { agencyId: string }) {
  const { t } = useTranslation();
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState<Date>(today);
  const [view, setView] = useState<ViewMode>("month");
  const [resourceGroupMode, setResourceGroupMode] = useState<"guide" | "service">("guide");
  const [filters, setFilters] = useState<CalendarFilterState>({ service: "all", guide: "all", status: "all" });
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [selectedBooking, setSelectedBooking] = useState<MarketplaceBooking | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<{ date?: string; time?: string }>({});

  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const { data: bookings = [], isLoading } = useAgencyBookings(agencyId);
  const { data: guides = [] } = useAgencyGuidesList(agencyId);
  const { data: agencyServices = [] } = useAgencyServices(agencyId);
  const conflicts = useBookingConflicts(agencyId, bookings);

  const openCreateDialog = (presetDay?: number) => {
    if (presetDay) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(presetDay).padStart(2, "0");
      setCreatePreset({ date: `${year}-${mm}-${dd}`, time: "10:00" });
    } else {
      setCreatePreset({});
    }
    setCreateDialogOpen(true);
  };

  // Unique services for filter dropdown
  const serviceOptions = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.service_id && b.service_title) map.set(b.service_id, b.service_title);
    });
    return Array.from(map, ([id, title]) => ({ value: id, label: title }));
  }, [bookings]);

  // Filtered bookings (service + guide + status)
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filters.status !== "all" && b.status !== filters.status) return false;
      if (filters.service !== "all" && b.service_id !== filters.service) return false;
      if (filters.guide !== "all") {
        const gid = (b as unknown as { assigned_guide_id?: string | null }).assigned_guide_id;
        if (filters.guide === "unassigned") {
          if (gid) return false;
        } else if (gid !== filters.guide) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, filters]);

  // Group by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, MarketplaceBooking[]> = {};
    filtered.forEach((b) => {
      const d = new Date(b.booking_date);
      const key = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [filtered]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDateStr = selectedDay ? formatDate(year, month, selectedDay) : null;
  const selectedBookings = selectedDateStr ? bookingsByDate[selectedDateStr] || [] : [];

  // Navigation — adapts to current view
  const navDelta = (delta: number) => {
    const d = new Date(anchorDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + delta);
    } else if (view === "week" || view === "resource") {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(d.getDate() + delta);
    }
    setAnchorDate(d);
    setSelectedDay(view === "month" ? null : d.getDate());
  };
  const goToday = () => setAnchorDate(new Date());

  const toolbarTitle = useMemo(() => {
    if (view === "month") return `${MONTHS[month]} ${year}`;
    if (view === "week" || view === "resource") {
      const ws = new Date(anchorDate); const off = (ws.getDay() + 6) % 7;
      ws.setDate(ws.getDate() - off);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.getDate()}.${ws.getMonth() + 1} – ${we.getDate()}.${we.getMonth() + 1}. ${we.getFullYear()}`;
    }
    return anchorDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }, [view, anchorDate, month, year]);

  // iCal export (current view)
  const handleExportICal = useCallback(() => {
    if (filtered.length === 0) return;
    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventBliss//Buchungskalender//DE",
      ...filtered.map(generateICalEvent),
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buchungen-${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // CSV export
  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) return;
    const rows = [
      ["booking_number", "date", "time", "service", "customer", "email", "phone", "participants", "status", "guide", "total_eur"].join(","),
      ...filtered.map((b) => {
        const guide = (b as unknown as { assigned_guide_name?: string | null }).assigned_guide_name ?? "";
        return [
          b.booking_number, b.booking_date, b.booking_time?.slice(0, 5) ?? "",
          JSON.stringify(b.service_title ?? ""),
          JSON.stringify(b.customer_name ?? ""),
          b.customer_email ?? "", b.customer_phone ?? "",
          b.participant_count, b.status,
          JSON.stringify(guide),
          (b.total_price_cents / 100).toFixed(2),
        ].join(",");
      }),
    ].join("\n");
    const blob = new Blob(["\ufeff" + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buchungen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const handlePrint = useCallback(() => {
    window.setTimeout(() => window.print(), 50);
  }, []);

  const openCreateDialogAt = (dateIso: string, time?: string) => {
    setCreatePreset({ date: dateIso, time: time ?? "10:00" });
    setCreateDialogOpen(true);
  };

  // Services duration lookup (for Week/Day view block heights)
  const durationLookup = useMemo(() => {
    const m = new Map<string, number>();
    agencyServices.forEach((s) => {
      // AgencyServiceOption has no duration_minutes — fallback to 60 if missing
      // Actual durations come from marketplace_services table via conflict hook
    });
    bookings.forEach((b) => {
      if (!m.has(b.service_id as string)) m.set(b.service_id as string, 60);
    });
    return m;
  }, [agencyServices, bookings]);

  // Current day's bookings for DayView
  const dayViewBookings = useMemo(() => {
    const key = formatDate(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
    return bookingsByDate[key] ?? [];
  }, [bookingsByDate, anchorDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  const filterSummaryParts: string[] = [];
  if (filters.service !== "all") {
    const s = serviceOptions.find((x) => x.value === filters.service);
    if (s) filterSummaryParts.push(`Service: ${s.label}`);
  }
  if (filters.guide !== "all") {
    const g = guides.find((x) => x.id === filters.guide);
    filterSummaryParts.push(`Guide: ${g?.name ?? filters.guide}`);
  }
  if (filters.status !== "all") filterSummaryParts.push(`Status: ${filters.status}`);
  const filterSummary = filterSummaryParts.join(" · ") || "—";

  return (
    <div className="space-y-5">
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        title={toolbarTitle}
        onPrev={() => navDelta(-1)}
        onNext={() => navDelta(1)}
        onToday={goToday}
        onExportICal={handleExportICal}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onNewBooking={() => openCreateDialogAt(formatDate(year, month, selectedDay ?? today.getDate()), undefined)}
        bookingCount={filtered.length}
      />

      <CalendarFilters
        filters={filters}
        onChange={setFilters}
        services={serviceOptions.map((s) => ({ id: s.value, title: s.label }))}
        guides={guides}
      />

      {/* View content */}
      <div className="no-print">
        {view === "month" && (
          <MonthView
            year={year}
            month={month}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            bookingsByDate={bookingsByDate}
            conflicts={conflicts}
            onSelectBooking={setSelectedBooking}
            onCreateBooking={(dateIso) => openCreateDialogAt(dateIso)}
          />
        )}
        {view === "week" && (
          <WeekView
            anchorDate={anchorDate}
            bookingsByDate={bookingsByDate}
            conflicts={conflicts}
            onSelectBooking={setSelectedBooking}
            onCreateBooking={openCreateDialogAt}
            durationLookup={durationLookup}
          />
        )}
        {view === "day" && (
          <DayView
            date={anchorDate}
            bookings={dayViewBookings}
            conflicts={conflicts}
            onSelectBooking={setSelectedBooking}
            onCreateBooking={openCreateDialogAt}
            durationLookup={durationLookup}
          />
        )}
        {view === "resource" && (
          <ResourceView
            anchorDate={anchorDate}
            bookings={filtered}
            conflicts={conflicts}
            guides={guides}
            services={serviceOptions.map((s) => ({ id: s.value, title: s.label }))}
            onSelectBooking={setSelectedBooking}
            groupMode={resourceGroupMode}
            onGroupModeChange={setResourceGroupMode}
          />
        )}
      </div>

      <PrintSchedule
        title={`Buchungskalender — ${toolbarTitle}`}
        subtitle={view === "resource" && resourceGroupMode === "guide" ? "Nach Guide gruppiert" : undefined}
        filterSummary={filterSummary}
        bookings={filtered}
        groupBy={view === "resource" && resourceGroupMode === "guide" ? "guide" : "day"}
      />

      {/* Booking detail dialog */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailDialog
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </AnimatePresence>

      {/* Create manual booking dialog */}
      <CreateBookingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        agencyId={agencyId}
        presetDate={createPreset.date}
        presetTime={createPreset.time}
      />
    </div>
  );
}
