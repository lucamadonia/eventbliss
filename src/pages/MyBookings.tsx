import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, Users, ChevronRight, Star,
  ShoppingBag, ArrowRight, MapPin, Euro, Hash,
  Filter, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type FilterTab = "alle" | "anstehend" | "abgeschlossen" | "storniert";

interface Booking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  agencyName: string;
  date: string;
  time: string;
  participants: number;
  totalPrice: number;
  status: BookingStatus;
}

/* ─── Mock Data ─────────────────────────────────────────── */
const mockBookings: Booking[] = [
  {
    id: "1",
    bookingNumber: "EB-2026-48291",
    serviceName: "DJ & Lichtshow Premium",
    agencyName: "SoundWave Events GmbH",
    date: "28. Mai 2026",
    time: "18:00 - 02:00",
    participants: 120,
    totalPrice: 1890,
    status: "confirmed",
  },
  {
    id: "2",
    bookingNumber: "EB-2026-37154",
    serviceName: "Hochzeitsfotografie Deluxe",
    agencyName: "Lichtblick Fotografie",
    date: "15. Jun 2026",
    time: "10:00 - 20:00",
    participants: 80,
    totalPrice: 2450,
    status: "pending",
  },
  {
    id: "3",
    bookingNumber: "EB-2026-29483",
    serviceName: "Catering Italian Night",
    agencyName: "Bella Cucina Catering",
    date: "02. Apr 2026",
    time: "19:00 - 23:00",
    participants: 60,
    totalPrice: 3200,
    status: "completed",
  },
  {
    id: "4",
    bookingNumber: "EB-2026-61027",
    serviceName: "Blumendeko Romantik-Paket",
    agencyName: "Blumenhaus Schneider",
    date: "15. Jun 2026",
    time: "08:00 - 12:00",
    participants: 80,
    totalPrice: 890,
    status: "confirmed",
  },
  {
    id: "5",
    bookingNumber: "EB-2026-15839",
    serviceName: "Moderation & Entertainment",
    agencyName: "Eventkultur Hamburg",
    date: "10. Jan 2026",
    time: "17:00 - 23:00",
    participants: 150,
    totalPrice: 1650,
    status: "cancelled",
  },
];

/* ─── Status Config ─────────────────────────────────────── */
const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: "Ausstehend",
    className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  confirmed: {
    label: "Bestaetigt",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  completed: {
    label: "Abgeschlossen",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  cancelled: {
    label: "Storniert",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "anstehend", label: "Anstehend" },
  { id: "abgeschlossen", label: "Abgeschlossen" },
  { id: "storniert", label: "Storniert" },
];

const filterMap: Record<FilterTab, BookingStatus[] | null> = {
  alle: null,
  anstehend: ["pending", "confirmed"],
  abgeschlossen: ["completed"],
  storniert: ["cancelled"],
};

/* ─── Component ─────────────────────────────────────────── */
export default function MyBookings() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("alle");

  const filtered = filterMap[activeFilter]
    ? mockBookings.filter(b => filterMap[activeFilter]!.includes(b.status))
    : mockBookings;

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
              <h1 className="text-2xl font-bold text-slate-50">Meine Buchungen</h1>
              <p className="text-sm text-slate-500">
                {mockBookings.length} Buchungen insgesamt
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/marketplace")}
            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer shadow-lg shadow-violet-500/20 h-10 px-5 text-sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Marketplace entdecken
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
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Booking Cards */}
        <div className="space-y-4">
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
                  Noch keine Buchungen
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  Entdecke tolle Services auf dem Marketplace und buche deinen naechsten Event-Dienstleister.
                </p>
                <Button
                  onClick={() => navigate("/marketplace")}
                  className="bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                >
                  Marketplace entdecken
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-mono text-slate-400">
                        {booking.bookingNumber}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-2", statusConfig[booking.status].className)}
                    >
                      {statusConfig[booking.status].label}
                    </Badge>
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
                      {booking.participants} Teilnehmer
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Euro className="w-3.5 h-3.5 text-slate-600" />
                      {booking.totalPrice.toLocaleString("de-DE")},00 EUR
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04] cursor-pointer text-xs h-8 px-3"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                    {booking.status === "completed" && (
                      <Button
                        size="sm"
                        className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20 cursor-pointer text-xs h-8 px-3"
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5" />
                        Bewertung schreiben
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
