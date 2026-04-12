import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, Users, DollarSign, Check, X as XIcon,
  ChevronRight, AlertCircle, CheckCircle2, XCircle, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatCard } from "./ui/StatCard";

/* ─── Types ──────────────────────────────────────────── */
type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  customerName: string;
  date: string;
  time: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

/* ─── Mock Data ──────────────────────────────────────── */
const mockBookings: Booking[] = [
  {
    id: "b1",
    bookingNumber: "EB-2026-48291",
    serviceName: "Premium Cocktail Workshop",
    customerName: "Lena Mueller",
    date: "18. Apr 2026",
    time: "18:00",
    participants: 12,
    totalPrice: 588,
    status: "new",
    createdAt: "vor 2 Stunden",
  },
  {
    id: "b2",
    bookingNumber: "EB-2026-48287",
    serviceName: "Live-Band: Jazz Ensemble",
    customerName: "Thomas Becker",
    date: "22. Apr 2026",
    time: "20:00",
    participants: 1,
    totalPrice: 1200,
    status: "confirmed",
    createdAt: "vor 1 Tag",
  },
  {
    id: "b3",
    bookingNumber: "EB-2026-48265",
    serviceName: "Premium Cocktail Workshop",
    customerName: "Sarah Fischer",
    date: "25. Apr 2026",
    time: "19:00",
    participants: 8,
    totalPrice: 392,
    status: "new",
    createdAt: "vor 3 Stunden",
  },
  {
    id: "b4",
    bookingNumber: "EB-2026-48201",
    serviceName: "Live-Band: Jazz Ensemble",
    customerName: "Michael Hoffmann",
    date: "10. Apr 2026",
    time: "19:30",
    participants: 1,
    totalPrice: 1200,
    status: "completed",
    createdAt: "vor 5 Tagen",
  },
  {
    id: "b5",
    bookingNumber: "EB-2026-48190",
    serviceName: "Premium Cocktail Workshop",
    customerName: "Julia Wagner",
    date: "08. Apr 2026",
    time: "17:00",
    participants: 15,
    totalPrice: 735,
    status: "completed",
    createdAt: "vor 7 Tagen",
  },
  {
    id: "b6",
    bookingNumber: "EB-2026-48150",
    serviceName: "Premium Cocktail Workshop",
    customerName: "Andreas Schneider",
    date: "12. Apr 2026",
    time: "18:00",
    participants: 10,
    totalPrice: 490,
    status: "cancelled",
    createdAt: "vor 4 Tagen",
  },
];

const statusConfig: Record<BookingStatus, { label: string; className: string; icon: typeof Clock }> = {
  new: { label: "Neu", className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: AlertCircle },
  confirmed: { label: "Bestaetigt", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  completed: { label: "Abgeschlossen", className: "bg-white/10 text-white/50 border-white/20", icon: Check },
  cancelled: { label: "Storniert", className: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
};

type FilterTab = "all" | BookingStatus;

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "new", label: "Neu" },
  { id: "confirmed", label: "Bestaetigt" },
  { id: "completed", label: "Abgeschlossen" },
  { id: "cancelled", label: "Storniert" },
];

function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

/* ─── Component ──────────────────────────────────────── */
export default function AgencyBookingsManager() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = mockBookings.filter((b) => {
    if (activeFilter === "all") return true;
    return b.status === activeFilter;
  });

  const newCount = mockBookings.filter((b) => b.status === "new").length;
  const todayCount = mockBookings.filter((b) => b.status === "confirmed").length;
  const monthlyRevenue = mockBookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const kpis = [
    { label: "Neue Anfragen", value: newCount, icon: AlertCircle, variant: "cyan" as const, trend: 0, sparkData: [1, 2, 1, newCount] },
    { label: "Heutige Buchungen", value: todayCount, icon: CalendarCheck, variant: "purple" as const, trend: 0, sparkData: [0, 1, 1, todayCount] },
    { label: "Umsatz (Monat)", value: monthlyRevenue, prefix: "\u20AC", icon: DollarSign, variant: "green" as const, trend: 0, sparkData: [800, 1500, 2200, monthlyRevenue] },
  ];

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
            {tab.label}
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
              <p className="text-slate-400 text-sm">Keine Buchungen in dieser Kategorie</p>
            </motion.div>
          ) : (
            filtered.map((booking, i) => {
              const StatusIcon = statusConfig[booking.status].icon;
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
                        <span className="text-[10px] font-mono text-slate-600">{booking.bookingNumber}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0.5", statusConfig[booking.status].className)}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[booking.status].label}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-50">{booking.serviceName}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.date}, {booking.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {booking.participants} Teilnehmer
                        </span>
                      </div>
                    </div>

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-100">{formatEUR(booking.totalPrice)}</p>
                        <p className="text-[10px] text-slate-600">{booking.createdAt}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {booking.status === "new" && (
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 cursor-pointer text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Bestaetigen
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            className="h-8 bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border border-violet-500/30 cursor-pointer text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Abschliessen
                          </Button>
                        )}
                        {(booking.status === "new" || booking.status === "confirmed") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Stornieren
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
