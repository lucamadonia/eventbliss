import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Eye, Pencil, Trash2, Star, Plus, Search, Loader2,
  ShoppingBag, BarChart3, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StatCard } from "./ui/StatCard";
import { AgencyServiceEditor } from "./AgencyServiceEditor";
import { useAgencyServices, type AgencyService } from "@/hooks/useAgencyServices";

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
  // Back-reference to the raw AgencyService so the editor prop types line up
  raw: AgencyService;
}

const CATEGORY_LABELS: Record<string, string> = {
  workshop: "Workshop",
  entertainment: "Entertainment",
  catering: "Catering",
  music: "Musik",
  photography: "Fotografie",
  venue: "Location",
  wellness: "Wellness",
  sport: "Sport",
  decoration: "Dekoration",
  transport: "Transport",
  other: "Sonstiges",
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_person: "pro Person",
  flat: "Pauschal",
  flat_rate: "Pauschal",
  per_hour: "pro Stunde",
  custom: "individuell",
};

// Deterministic cover gradient from category so repeated renders stay stable
const COVER_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-red-500 to-pink-500",
  "from-indigo-500 to-purple-500",
];

function mapService(s: AgencyService): MarketplaceService {
  const categoryKey = s.category in CATEGORY_LABELS ? s.category : "other";
  const colorIdx = Math.abs(
    [...s.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
  ) % COVER_COLORS.length;
  const rawStatus = (s.status as ServiceStatus) ?? "draft";
  const knownStatus: ServiceStatus = (
    ["draft", "pending_review", "approved", "rejected", "suspended"] as ServiceStatus[]
  ).includes(rawStatus) ? rawStatus : "draft";
  return {
    id: s.id,
    title: s.title ?? "Ohne Titel",
    category: CATEGORY_LABELS[categoryKey] ?? categoryKey,
    price: (s.price_cents ?? 0) / 100,
    priceType: PRICE_TYPE_LABELS[s.price_type] ?? s.price_type,
    status: knownStatus,
    rating: s.avg_rating ?? 0,
    reviewCount: s.review_count ?? 0,
    bookingsThisMonth: s.booking_count ?? 0,
    coverColor: COVER_COLORS[colorIdx],
    raw: s,
  };
}

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

  // Real data from DB (was hardcoded mockServices before)
  const { data: rawServices = [], isLoading } = useAgencyServices(agencyId || undefined);
  const services = useMemo(() => rawServices.map(mapService), [rawServices]);

  const filteredServices = services.filter((s) => {
    if (activeFilter !== "all" && s.status !== activeFilter) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalServices = services.length;
  const activeListings = services.filter((s) => s.status === "approved").length;
  const monthlyBookings = services.reduce((sum, s) => sum + s.bookingsThisMonth, 0);
  const monthlyRevenue = services.reduce((sum, s) => sum + s.bookingsThisMonth * s.price, 0);

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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
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

                  {/* Actions — always visible on mobile, reveal-on-hover on desktop */}
                  <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 sm:w-8 sm:h-8 text-slate-400 sm:text-slate-500 hover:text-violet-300 cursor-pointer"
                      onClick={() => handleEdit(service)}
                      title="Bearbeiten"
                      aria-label="Bearbeiten"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 sm:w-8 sm:h-8 text-slate-400 sm:text-slate-500 hover:text-cyan-300 cursor-pointer"
                      title="Ansehen"
                      aria-label="Ansehen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 sm:w-8 sm:h-8 text-slate-400 sm:text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Löschen"
                      aria-label="Löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        )}
      </div>

      {/* Service Editor Slide-over */}
      <AgencyServiceEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingService(null); }}
        agencyId={agencyId}
        service={editingService ? {
          id: editingService.raw.id,
          title: editingService.raw.title,
          category: editingService.raw.category,
          price: editingService.raw.price_cents / 100,
          priceType: editingService.raw.price_type,
          shortDescription: editingService.raw.short_description ?? undefined,
          description: editingService.raw.description ?? undefined,
          includes: editingService.raw.includes ?? [],
          requirements: editingService.raw.requirements ?? [],
          minParticipants: editingService.raw.min_participants ?? undefined,
          maxParticipants: editingService.raw.max_participants ?? undefined,
          locationType: editingService.raw.location_type,
          locationAddress: editingService.raw.location_address ?? undefined,
          locationCity: editingService.raw.location_city ?? undefined,
          leadTimeDays: editingService.raw.advance_booking_days,
          cancellationPolicy: editingService.raw.cancellation_policy,
          autoConfirm: editingService.raw.auto_confirm,
          paymentMethod: editingService.raw.payment_method,
          capacityPerSlot: editingService.raw.capacity_per_slot,
          groupsPerSlot: editingService.raw.groups_per_slot,
          groupsPerGuide: editingService.raw.groups_per_guide,
        } : null}
      />
    </div>
  );
}
