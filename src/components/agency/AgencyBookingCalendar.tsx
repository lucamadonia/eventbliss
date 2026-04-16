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
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<MarketplaceBooking | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<{ date?: string; time?: string }>({});

  const { data: bookings = [], isLoading } = useAgencyBookings(agencyId);

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

  // Filtered bookings
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (serviceFilter !== "all" && b.service_id !== serviceFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, serviceFilter]);

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

  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }, [month, year]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }, [month, year]);

  // iCal export
  const handleExportICal = useCallback(() => {
    const monthBookings = filtered.filter((b) => {
      const d = new Date(b.booking_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    if (monthBookings.length === 0) return;

    const ical = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventBliss//Buchungskalender//DE",
      ...monthBookings.map(generateICalEvent),
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buchungen-${MONTHS[month]}-${year}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, year, month]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Buchungskalender</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? "Buchung" : "Buchungen"} insgesamt
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Service filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded-lg outline-none focus:border-violet-500/40 transition-all appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#1a1625]">Alle Services</option>
              {serviceOptions.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#1a1625]">{s.label}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer",
                  statusFilter === opt.value
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportICal}
            className="h-8 text-xs border-white/[0.1] text-slate-400 hover:bg-white/[0.04] gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            iCal
          </Button>

          {/* New booking (manual) */}
          <Button
            size="sm"
            onClick={() => openCreateDialog(selectedDay ?? undefined)}
            className="h-8 text-xs bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90 text-white gap-1.5 cursor-pointer shadow-lg shadow-pink-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("bookingCalendar.newAppointment", "Neuer Termin")}
          </Button>
        </div>
      </motion.div>

      {/* Calendar + Day panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Month grid */}
        <GlassCard className="p-5" hoverGlow>
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-50">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
              const dateStr = formatDate(year, month, day);
              const isToday = dateStr === todayStr;
              const isSelected = day === selectedDay;
              const dayBookings = bookingsByDate[dateStr] || [];
              const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              // Unique categories for colored dots
              const uniqueCategories = [...new Set(dayBookings.map((b) => (b as any).category || "other"))];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square p-1 rounded-xl text-left flex flex-col transition-all duration-200 cursor-pointer relative",
                    isSelected
                      ? "bg-violet-500/20 border border-violet-500/40"
                      : "hover:bg-white/[0.04] border border-transparent",
                    isPast && !isSelected && "opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto",
                      isToday && "bg-violet-500 text-white",
                      !isToday && isSelected && "text-violet-300",
                      !isToday && !isSelected && "text-slate-300"
                    )}
                  >
                    {day}
                  </span>

                  {dayBookings.length > 0 && (
                    <>
                      {/* Booking count badge */}
                      <div className="absolute top-0.5 right-1">
                        <span className="text-[8px] font-medium text-violet-400 bg-violet-500/15 rounded-full w-4 h-4 flex items-center justify-center">
                          {dayBookings.length}
                        </span>
                      </div>

                      {/* Category dots */}
                      <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                        {uniqueCategories.slice(0, 4).map((cat, i) => (
                          <div
                            key={`${cat}-${i}`}
                            className={cn("w-1.5 h-1.5 rounded-full", categoryDotColors[cat] || categoryDotColors.other)}
                          />
                        ))}
                        {uniqueCategories.length > 4 && (
                          <span className="text-[7px] text-slate-500">+{uniqueCategories.length - 4}</span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Category legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            {Object.entries(categoryDotColors).slice(0, 6).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-[10px] text-slate-600 capitalize">{cat}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Day detail panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedDay && (
              <DayDetailPanel
                day={selectedDay}
                month={month}
                year={year}
                bookings={selectedBookings}
                onSelectBooking={setSelectedBooking}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

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
