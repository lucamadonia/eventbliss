import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Eye, Pencil, Trash2, Star, Plus, Search, Filter,
  TrendingUp, ShoppingBag, BarChart3, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GlassCard } from "./ui/GlassCard";
import { StatCard } from "./ui/StatCard";
import { AgencyServiceEditor } from "./AgencyServiceEditor";

/* ─── Types ──────────────────────────────────────────── */
type ServiceStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";

interface MarketplaceService {
  id: string;
  title: string;
  category: string;
  price: number;
  priceType: string;
  status: ServiceStatus;
  rating: number;
  reviewCount: number;
  bookingsThisMonth: number;
  coverColor: string;
}

/* ─── Mock Data ──────────────────────────────────────── */
const mockServices: MarketplaceService[] = [
  {
    id: "svc-1",
    title: "Premium Cocktail Workshop",
    category: "Workshop",
    price: 49,
    priceType: "pro Person",
    status: "approved",
    rating: 4.8,
    reviewCount: 24,
    bookingsThisMonth: 7,
    coverColor: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "svc-2",
    title: "Live-Band: Jazz Ensemble",
    category: "Musik",
    price: 1200,
    priceType: "Pauschal",
    status: "approved",
    rating: 4.9,
    reviewCount: 18,
    bookingsThisMonth: 3,
    coverColor: "from-cyan-500 to-blue-500",
  },
  {
    id: "svc-3",
    title: "Food Truck Catering",
    category: "Catering",
    price: 25,
    priceType: "pro Person",
    status: "pending_review",
    rating: 0,
    reviewCount: 0,
    bookingsThisMonth: 0,
    coverColor: "from-amber-500 to-orange-500",
  },
  {
    id: "svc-4",
    title: "Eventfotografie Deluxe",
    category: "Fotografie",
    price: 890,
    priceType: "Pauschal",
    status: "draft",
    rating: 0,
    reviewCount: 0,
    bookingsThisMonth: 0,
    coverColor: "from-emerald-500 to-teal-500",
  },
  {
    id: "svc-5",
    title: "Escape Room Teambuilding",
    category: "Entertainment",
    price: 35,
    priceType: "pro Person",
    status: "rejected",
    rating: 0,
    reviewCount: 0,
    bookingsThisMonth: 0,
    coverColor: "from-red-500 to-pink-500",
  },
];

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  draft: { label: "Entwurf", className: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  pending_review: { label: "In Prüfung", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  approved: { label: "Aktiv", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Abgelehnt", className: "bg-red-500/20 text-red-300 border-red-500/30" },
  suspended: { label: "Gesperrt", className: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

type FilterTab = "all" | ServiceStatus;

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "approved", label: "Aktiv" },
  { id: "draft", label: "Entwurf" },
  { id: "pending_review", label: "In Prüfung" },
  { id: "rejected", label: "Abgelehnt" },
];

function formatEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

/* ─── Component ──────────────────────────────────────── */
export default function AgencyMarketplace({ agencyId = "" }: { agencyId?: string }) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<MarketplaceService | null>(null);

  const filteredServices = mockServices.filter((s) => {
    if (activeFilter !== "all" && s.status !== activeFilter) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalServices = mockServices.length;
  const activeListings = mockServices.filter((s) => s.status === "approved").length;
  const monthlyBookings = mockServices.reduce((sum, s) => sum + s.bookingsThisMonth, 0);
  const monthlyRevenue = mockServices.reduce((sum, s) => sum + s.bookingsThisMonth * s.price, 0);

  const kpis = [
    { label: "Gesamt Services", value: totalServices, icon: Package, variant: "purple" as const, sparkData: [2, 3, 3, 4, totalServices] },
    { label: "Aktive Listings", value: activeListings, icon: ShoppingBag, variant: "cyan" as const, sparkData: [1, 1, 2, 2, activeListings] },
    { label: "Buchungen (Monat)", value: monthlyBookings, icon: BarChart3, variant: "green" as const, sparkData: [3, 5, 7, 8, monthlyBookings] },
    { label: "Umsatz (Monat)", value: monthlyRevenue, prefix: "\u20AC", icon: DollarSign, variant: "amber" as const, sparkData: [500, 800, 1200, monthlyRevenue] },
  ];

  const handleEdit = (service: MarketplaceService) => {
    setEditingService(service);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Marketplace</h3>
          <p className="text-sm text-slate-500">Verwalte deine Services und Angebote</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white cursor-pointer shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuen Service erstellen
        </Button>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...kpi} trend={0} />
          </motion.div>
        ))}
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Service suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-slate-100 text-sm placeholder:text-slate-600 rounded-xl"
          />
        </div>
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
            </button>
          ))}
        </div>
      </div>

      {/* Service List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredServices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-12 text-center"
            >
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Noch keine Services — erstelle deinen ersten Marketplace-Eintrag!
              </p>
              <Button
                onClick={handleCreate}
                variant="ghost"
                className="mt-4 text-violet-400 hover:text-violet-300 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Jetzt erstellen
              </Button>
            </motion.div>
          ) : (
            filteredServices.map((service, i) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 sm:p-5 hover:border-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  {/* Cover Thumbnail */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center",
                      service.coverColor
                    )}
                  >
                    <Package className="w-5 h-5 text-white/80" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-50 truncate">
                        {service.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-white/[0.04] border-white/[0.1] text-slate-400"
                      >
                        {service.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-300">
                        {formatEUR(service.price)}{" "}
                        <span className="font-normal text-slate-600">/ {service.priceType}</span>
                      </span>
                      {service.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {service.rating} ({service.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-2 py-0.5 shrink-0", statusConfig[service.status].className)}
                  >
                    {statusConfig[service.status].label}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-slate-500 hover:text-violet-300 cursor-pointer"
                      onClick={() => handleEdit(service)}
                      title="Bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-slate-500 hover:text-cyan-300 cursor-pointer"
                      title="Ansehen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Service Editor Slide-over */}
      <AgencyServiceEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingService(null); }}
        agencyId={agencyId}
        service={editingService}
      />
    </div>
  );
}
