import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, Users, DollarSign, Check,
  AlertCircle, CheckCircle2, XCircle, Ban, Loader2, Wallet,
} from "lucide-react";
import { BookingGuideAssign } from "./BookingGuideAssign";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { StatCard } from "./ui/StatCard";
import {
  useAgencyBookings,
  useConfirmBooking,
  useCancelBooking,
  useCompleteBooking,
  type MarketplaceBooking,
  type CancellationReasonCode,
} from "@/hooks/useMarketplaceBookings";
import { derivePaymentState } from "@/lib/bookingPayment";

/* ─── Types ──────────────────────────────────────────── */
type UIStatus = "new" | "confirmed" | "completed" | "cancelled" | "unpaid" | "on_site";

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

// Combined status — payment state takes precedence for unpaid/on_site surfacing.
function mapWithPayment(b: MarketplaceBooking): UIStatus {
  const base = mapDBStatus(b.status);
  // Completed/cancelled bookings keep their terminal UI status — payment
  // surfacing only matters for actionable states.
  if (base === "completed" || base === "cancelled") return base;

  const payment = derivePaymentState({
    status: b.status,
    stripe_payment_intent_id: b.stripe_payment_intent_id ?? null,
    payment_method: b.payment_method ?? null,
  });

  if (payment === "unpaid") return "unpaid";
  if (
    payment === "on_site" &&
    (b.status === "pending_confirmation" || b.status === "confirmed")
  ) {
    return "on_site";
  }
  return base;
}

const statusConfig: Record<UIStatus, { key: string; className: string; icon: typeof Clock }> = {
  new: { key: "new", className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: AlertCircle },
  confirmed: { key: "confirmed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  completed: { key: "completed", className: "bg-white/10 text-white/50 border-white/20", icon: Check },
  cancelled: { key: "cancelled", className: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
  unpaid: { key: "unpaid", className: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertCircle },
  on_site: { key: "onSite", className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: Wallet },
};

type FilterTab = "all" | UIStatus;

const filterTabs: { id: FilterTab; key: string }[] = [
  { id: "all", key: "all" },
  { id: "new", key: "new" },
  { id: "confirmed", key: "confirmed" },
  { id: "unpaid", key: "unpaid" },
  { id: "on_site", key: "onSite" },
  { id: "completed", key: "completed" },
  { id: "cancelled", key: "cancelled" },
];

const cancellationReasons: { value: CancellationReasonCode; label: string }[] = [
  { value: "agency_unavailable", label: "Nicht verfügbar (Termin nicht möglich)" },
  { value: "agency_staff_shortage", label: "Personalengpass" },
  { value: "agency_weather", label: "Wetter / höhere Gewalt" },
  { value: "customer_no_show", label: "Kunde nicht erschienen" },
  { value: "customer_unreachable", label: "Kunde nicht erreichbar" },
  { value: "agency_other", label: "Anderer Grund" },
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

  // Cancel dialog state
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReasonCode, setCancelReasonCode] = useState<CancellationReasonCode>("agency_unavailable");
  const [cancelReasonText, setCancelReasonText] = useState("");

  const { data: bookings = [], isLoading } = useAgencyBookings(agencyId);
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();

  const mappedBookings = bookings.map((b) => ({
    ...b,
    uiStatus: mapWithPayment(b),
  }));

  const filtered = mappedBookings.filter((b) => {
    if (activeFilter === "all") return true;
    return b.uiStatus === activeFilter;
  });

  const newCount = mappedBookings.filter((b) => b.uiStatus === "new").length;
  const confirmedCount = mappedBookings.filter((b) => b.uiStatus === "confirmed").length;
  // Revenue counts only paid or on_site bookings whose DB-status is terminal-ish
  // (confirmed/completed). Unpaid is explicitly excluded until money lands.
  const monthlyRevenue = mappedBookings
    .filter((b) => {
      if (b.uiStatus === "unpaid") return false;
      const paymentState = derivePaymentState({
        status: b.status,
        stripe_payment_intent_id: b.stripe_payment_intent_id ?? null,
        payment_method: b.payment_method ?? null,
      });
      const earns = paymentState === "paid" || paymentState === "on_site";
      const dbOk = b.status === "confirmed" || b.status === "completed";
      return earns && dbOk;
    })
    .reduce((sum, b) => sum + b.total_price_cents, 0);

  const openCancel = (bookingId: string) => {
    setCancelTargetId(bookingId);
    setCancelReasonCode("agency_unavailable");
    setCancelReasonText("");
  };

  const confirmCancel = () => {
    if (!cancelTargetId) return;
    cancelBooking.mutate(
      {
        bookingId: cancelTargetId,
        reasonCode: cancelReasonCode,
        reasonText:
          cancelReasonCode === "agency_other" ? cancelReasonText.trim() || undefined : undefined,
        asAgency: true,
      },
      {
        onSuccess: () => {
          setCancelTargetId(null);
          setCancelReasonText("");
        },
      },
    );
  };

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
                      {(booking.uiStatus === "new" || booking.uiStatus === "confirmed" || booking.uiStatus === "on_site") && (
                        <div className="pt-1">
                          <BookingGuideAssign
                            bookingId={booking.id}
                            agencyId={agencyId}
                            currentGuideId={(booking as unknown as { assigned_guide_id?: string | null }).assigned_guide_id ?? null}
                            compact
                          />
                        </div>
                      )}

                      {/* Payment-state sub-hint */}
                      {booking.uiStatus === "unpaid" && (
                        <div className="mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-200/90">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>Noch nicht bezahlt — bitte keine Ressourcen zuweisen bis Zahlung bestätigt.</span>
                        </div>
                      )}
                      {booking.uiStatus === "on_site" && (
                        <div className="mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[10px] text-cyan-200/90">
                          <Wallet className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>Zahlung erfolgt vor Ort.</span>
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
                        {(booking.uiStatus === "confirmed" || booking.uiStatus === "on_site") && (
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
                        {(booking.uiStatus === "new" ||
                          booking.uiStatus === "confirmed" ||
                          booking.uiStatus === "on_site" ||
                          booking.uiStatus === "unpaid") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={cancelBooking.isPending}
                            onClick={() => openCancel(booking.id)}
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

      {/* Cancel reason dialog — contractual requirement (§ 7) */}
      <AlertDialog open={!!cancelTargetId} onOpenChange={(o) => !o && setCancelTargetId(null)}>
        <AlertDialogContent className="bg-[#1a1625] border-white/[0.08] text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">Buchung stornieren</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs leading-relaxed">
              Warum stornierst du? Diese Angabe ist vertraglich verpflichtend. Bei wiederholten Stornierungen &gt; 20 % kann dein Listing deaktiviert werden (siehe Agentur-Vertrag § 7).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">Grund</label>
              <select
                value={cancelReasonCode}
                onChange={(e) => setCancelReasonCode(e.target.value as CancellationReasonCode)}
                className="w-full h-10 px-3 text-sm bg-white/[0.04] border border-white/[0.08] text-slate-100 rounded-xl outline-none focus:border-violet-500/40 transition-all appearance-none cursor-pointer"
              >
                {cancellationReasons.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#1a1625] text-slate-200">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {cancelReasonCode === "agency_other" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-400">Details (erforderlich)</label>
                <textarea
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  rows={3}
                  placeholder="Bitte kurz erläutern…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-violet-500/40 transition-all"
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white/[0.04] border-white/[0.1] text-slate-300 hover:bg-white/[0.08] hover:text-slate-100"
              disabled={cancelBooking.isPending}
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmCancel();
              }}
              disabled={
                cancelBooking.isPending ||
                (cancelReasonCode === "agency_other" && cancelReasonText.trim().length === 0)
              }
              className="bg-red-600/80 hover:bg-red-600 text-white border border-red-500/40"
            >
              {cancelBooking.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Storniere…
                </>
              ) : (
                "Stornieren"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
