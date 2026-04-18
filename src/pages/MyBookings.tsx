import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, Users, ChevronRight, Star,
  ShoppingBag, ArrowRight, MapPin, Euro, Hash,
  Filter, Search, Loader2, XCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyBookings, useCancelBooking, type MarketplaceBooking } from "@/hooks/useMarketplaceBookings";
import { toast } from "sonner";
import { derivePaymentState, usePayBookingNow } from "@/lib/bookingPayment";

/* ─── Types ─────────────────────────────────────────────── */
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "unpaid" | "on_site";
type FilterTab = "alle" | "unbezahlt" | "anstehend" | "abgeschlossen" | "storniert";

interface Booking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  serviceSlug?: string;
  agencyName: string;
  date: string;
  time: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
  paymentMethod?: string | null;
}

function mapBooking(b: MarketplaceBooking): Booking {
  const statusMap: Record<string, BookingStatus> = {
    pending: "pending",
    pending_confirmation: "pending",
    confirmed: "confirmed",
    completed: "completed",
    cancelled_by_customer: "cancelled",
    cancelled_by_agency: "cancelled",
  };

  const paymentState = derivePaymentState(b as any);

  let status: BookingStatus;
  if (paymentState === "unpaid") {
    status = "unpaid";
  } else if (
    paymentState === "on_site" &&
    ["pending_confirmation", "confirmed", "completed"].includes(b.status)
  ) {
    status = "on_site";
  } else {
    status = statusMap[b.status] || "pending";
  }

  return {
    id: b.id,
    bookingNumber: b.booking_number,
    serviceName: b.service_title || "Service",
    serviceSlug: b.service_slug || undefined,
    agencyName: b.agency_name || "Agentur",
    date: new Date(b.booking_date).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }),
    time: b.booking_time || "",
    participants: b.participant_count,
    totalPrice: b.total_price_cents / 100,
    status,
    paymentMethod: (b as any).payment_method ?? null,
  };
}

/* ─── Status Config ─────────────────────────────────────── */
const statusConfig: Record<BookingStatus, { key: string; className: string }> = {
  pending: {
    key: "pending",
    className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  unpaid: {
    key: "unpaid",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  on_site: {
    key: "onSite",
    className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  confirmed: {
    key: "confirmed",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  completed: {
    key: "completed",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  cancelled: {
    key: "cancelled",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

const filterTabs: { id: FilterTab; key: string }[] = [
  { id: "alle", key: "all" },
  { id: "unbezahlt", key: "unpaid" },
  { id: "anstehend", key: "upcoming" },
  { id: "abgeschlossen", key: "completed" },
  { id: "storniert", key: "cancelled" },
];

const filterMap: Record<FilterTab, BookingStatus[] | null> = {
  alle: null,
  unbezahlt: ["unpaid"],
  anstehend: ["pending", "confirmed", "on_site"],
  abgeschlossen: ["completed"],
  storniert: ["cancelled"],
};

/* ─── Component ─────────────────────────────────────────── */
export default function MyBookings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("alle");
  const { data: rawBookings, isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();
  const payNow = usePayBookingNow();

  // Handle ?cancelled=true when user returns from aborted Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("cancelled") === "true") {
      toast.info(
        t(
          "myBookings.paymentCancelled",
          "Zahlung abgebrochen — du kannst sie jederzeit fortsetzen.",
        ),
      );
      params.delete("cancelled");
      const remaining = params.toString();
      navigate(
        { pathname: location.pathname, search: remaining ? `?${remaining}` : "" },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookings = (rawBookings || []).map(mapBooking);

  const filtered = filterMap[activeFilter]
    ? bookings.filter(b => filterMap[activeFilter]!.includes(b.status))
    : bookings;

  const handleCancel = (bookingId: string) => {
    if (!confirm(t("myBookings.cancelConfirm", "Buchung wirklich stornieren?"))) return;
    cancelBooking.mutate({ bookingId });
  };

  return (
    <div className="min-h-screen bg-[#0d0d15]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-50">{t("myBookings.title", "Meine Buchungen")}</h1>
              <p className="text-sm text-slate-500">
                {isLoading ? t("myBookings.loading", "Buchungen werden geladen...") : t("myBookings.totalBookings", "{{count}} Buchungen insgesamt", { count: bookings.length })}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/marketplace")}
            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer shadow-lg shadow-violet-500/20 h-10 px-5 text-sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {t("myBookings.discoverMarketplace", "Marketplace entdecken")}
          </Button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                activeFilter === tab.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.06]",
              )}
            >
              {t(`myBookings.filters.${tab.key}`, tab.key)}
            </button>
          ))}
        </motion.div>

        {/* Booking Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
              <p className="text-sm text-slate-500">{t("myBookings.loading", "Buchungen werden geladen...")}</p>
            </motion.div>
          ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              /* Empty State */
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1f1f29] border border-white/[0.06] rounded-2xl p-12 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <CalendarCheck className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  {t("myBookings.noBookings", "Noch keine Buchungen")}
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  {t("myBookings.noBookingsHint", "Entdecke tolle Services auf dem Marketplace und buche deinen nächsten Event-Dienstleister.")}
                </p>
                <Button
                  onClick={() => navigate("/marketplace")}
                  className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                >
                  {t("myBookings.discoverMarketplace", "Marketplace entdecken")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ) : (
              filtered.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="bg-[#1f1f29] border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:border-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all duration-300 group"
                >
                  {/* Top Row: Booking Number + Status */}
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-mono text-slate-400">
                        {booking.bookingNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {booking.status === "on_site" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                          aria-label={t("myBookings.onSiteBadge", "Zahlung vor Ort")}
                        >
                          <span aria-hidden className="mr-1">💶</span>
                          {t("myBookings.onSiteBadge", "Zahlung vor Ort")}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2", statusConfig[booking.status].className)}
                      >
                        {booking.status === "unpaid" && (
                          <AlertCircle className="w-3 h-3 mr-1 inline" aria-hidden />
                        )}
                        {t(`myBookings.status.${statusConfig[booking.status].key}`, statusConfig[booking.status].key)}
                      </Badge>
                    </div>
                  </div>

                  {/* Service + Agency */}
                  <h3 className="text-base font-semibold text-slate-50 mb-1 group-hover:text-violet-300 transition-colors">
                    {booking.serviceName}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{booking.agencyName}</p>

                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400 mb-5">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {booking.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      {booking.participants} {t("myBookings.participants", "Teilnehmer")}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Euro className="w-3.5 h-3.5 text-slate-600" />
                      {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(booking.totalPrice)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {booking.status === "unpaid" && (
                      <Button
                        size="sm"
                        onClick={() => payNow.mutate(booking.id)}
                        disabled={payNow.isPending}
                        className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold cursor-pointer text-xs h-9 min-h-[44px] sm:min-h-0 px-4"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                        {payNow.isPending
                          ? t("myBookings.payingPreparing", "Wird vorbereitet…")
                          : t("myBookings.payNow", "Jetzt bezahlen")}
                      </Button>
                    )}
                    {booking.serviceSlug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/marketplace/service/${booking.serviceSlug}`)}
                        className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer text-xs h-8 px-3"
                      >
                        {t("myBookings.details", "Details")}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                    {(booking.status === "pending" || booking.status === "confirmed" || booking.status === "unpaid" || booking.status === "on_site") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelBooking.isPending}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer text-xs h-8 px-3"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        {t("myBookings.cancel", "Stornieren")}
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button
                        size="sm"
                        className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20 cursor-pointer text-xs h-8 px-3"
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5" />
                        {t("myBookings.writeReview", "Bewertung schreiben")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
