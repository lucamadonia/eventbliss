import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, Users, DollarSign, Check, X as XIcon,
  ChevronRight, AlertCircle, CheckCircle2, XCircle, Ban, Loader2,
} from "lucide-react";
import { BookingGuideAssign } from "./BookingGuideAssign";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatCard } from "./ui/StatCard";
import {
  useAgencyBookings,
  useConfirmBooking,
  useCancelBooking,
  useCompleteBooking,
  type MarketplaceBooking,
} from "@/hooks/useMarketplaceBookings";

/* ─── Types ──────────────────────────────────────────── */
type UIStatus = "new" | "confirmed" | "completed" | "cancelled";

interface Props {
  agencyId: string;
}

/* ─── Status mapping ────────────────────────────────── */
function mapDBStatus(dbStatus: string): UIStatus {
  switch (dbStatus) {
    case "pending_confirmation":
      return "new";
    case "confirmed":
      return "confirmed";
    case "completed":
      return "completed";
    case "cancelled_by_customer":
    case "cancelled_by_agency":
      return "cancelled";
    default:
      return "new";
  }
}

const statusConfig: Record<UIStatus, { key: string; className: string; icon: typeof Clock }> = {
  new: { key: "new", className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: AlertCircle },
  confirmed: { key: "confirmed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  completed: { key: "completed", className: "bg-white/10 text-white/50 border-white/20", icon: Check },
  cancelled: { key: "cancelled", className: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
};

type FilterTab = "all" | UIStatus;

const filterTabs: { id: FilterTab; key: string }[] = [
  { id: "all", key: "all" },
  { id: "new", key: "new" },
  { id: "confirmed", key: "confirmed" },
  { id: "completed", key: "completed" },
  { id: "cancelled", key: "cancelled" },
];

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const created = new Date(dateStr);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `vor ${diffMin} Minuten`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `vor ${diffHours} Stunden`;
  const diffDays = Math.floor(diffHours / 24);
  return `vor ${diffDays} Tagen`;
}

/* ─── Component ──────────────────────────────────────── */
export default function AgencyBookingsManager({ agencyId }: Props) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const { data: bookings = [], isLoading } = useAgencyBookings(agencyId);
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();

  const mappedBookings = bookings.map((b) => ({
    ...b,
    uiStatus: mapDBStatus(b.status),
  }));

  const filtered = mappedBookings.filter((b) => {
    if (activeFilter === "all") return true;
    return b.uiStatus === activeFilter;
  });

  const newCount = mappedBookings.filter((b) => b.uiStatus === "new").length;
  const confirmedCount = mappedBookings.filter((b) => b.uiStatus === "confirmed").length;
  const monthlyRevenue = mappedBookings
    .filter((b) => b.uiStatus === "completed" || b.uiStatus === "confirmed")
    .reduce((sum, b) => sum + b.total_price_cents, 0);

  const kpis = [
    { label: t("bookingsManager.newRequests", "Neue Anfragen"), value: newCount, icon: AlertCircle, variant: "cyan" as const, trend: 0, sparkData: [1, 2, 1, newCount] },
    { label: t("bookingsManager.confirmedBookings", "Bestätigte Buchungen"), value: confirmedCount, icon: CalendarCheck, variant: "purple" as const, trend: 0, sparkData: [0, 1, 1, confirmedCount] },
    { label: t("bookingsManager.monthlyRevenue", "Umsatz (Monat)"), value: Math.round(monthlyRevenue / 100), prefix: "€", icon: DollarSign, variant: "green" as const, trend: 0, sparkData: [800, 1500, 2200, Math.round(monthlyRevenue / 100)] },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-slate-50">Buchungen</h3>
        <p className="text-sm text-slate-500">Eingehende Buchungen verwalten</p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
              activeFilter === tab.id
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent"
            )}
          >
            {t(`bookingsManager.filters.${tab.key}`, tab.key)}
            {tab.id === "new" && newCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-cyan-500 text-white rounded-full">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-12 text-center"
            >
              <CalendarCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">{t("bookingsManager.noBookings", "Noch keine Buchungen")}</p>
            </motion.div>
          ) : (
            filtered.map((booking, i) => {
              const StatusIcon = statusConfig[booking.uiStatus].icon;
              return (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 sm:p-5 hover:border-violet-500/20 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-600">{booking.booking_number}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5", statusConfig[booking.uiStatus].className)}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {t(`bookingsManager.status.${statusConfig[booking.uiStatus].key}`, statusConfig[booking.uiStatus].key)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-50">
                        {booking.service_title || "Service"}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(booking.booking_date)}, {booking.booking_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.participant_count} {t("myBookings.participants", "Teilnehmer")}
                        </span>
                      </div>
                      {/* Guide assignment — only for active bookings */}
                      {(booking.uiStatus === "new" || booking.uiStatus === "confirmed") && (
                        <div className="pt-1">
                          <BookingGuideAssign
                            bookingId={booking.id}
                            agencyId={agencyId}
                            currentGuideId={(booking as unknown as { assigned_guide_id?: string | null }).assigned_guide_id ?? null}
                            compact
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-100">
                          {formatEUR(booking.total_price_cents)}
                        </p>
                        <p className="text-[10px] text-slate-600">{timeAgo(booking.created_at)}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {booking.uiStatus === "new" && (
                          <Button
                            size="sm"
                            disabled={confirmBooking.isPending}
                            onClick={() => confirmBooking.mutate(booking.id)}
                            className="h-8 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 cursor-pointer text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {t("bookingsManager.confirm", "Bestätigen")}
                          </Button>
                        )}
                        {booking.uiStatus === "confirmed" && (
                          <Button
                            size="sm"
                            disabled={completeBooking.isPending}
                            onClick={() => completeBooking.mutate(booking.id)}
                            className="h-8 bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 cursor-pointer text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            {t("bookingsManager.complete", "Abschließen")}
                          </Button>
                        )}
                        {(booking.uiStatus === "new" || booking.uiStatus === "confirmed") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={cancelBooking.isPending}
                            onClick={() =>
                              cancelBooking.mutate({
                                bookingId: booking.id,
                                asAgency: true,
                              })
                            }
                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            {t("bookingsManager.cancelBooking", "Stornieren")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
