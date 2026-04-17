import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Building2,
  ChevronDown,
  Filter,
  X,
  Map,
  List,
  ShieldCheck,
  Star,
  ShoppingBag,
  Crown,
  Calendar,
  Clock,
  Users,
  XCircle,
  Package,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENCIES as STATIC_AGENCIES,
  COUNTRIES as STATIC_COUNTRIES,
  type Agency,
  searchAgencies,
  getAgenciesByCountry,
  getCitiesForCountry,
} from "@/lib/agencies-data";
import { cn } from "@/lib/utils";
import { AgenciesMapView } from "./AgenciesMapView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useEventBookings,
  useCancelBooking,
  type MarketplaceBooking,
} from "@/hooks/useMarketplaceBookings";
import {
  useMarketplaceServices,
  type MarketplaceService,
} from "@/hooks/useMarketplaceServices";

interface Event {
  id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  honoree_name: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface AgenciesTabProps {
  event?: Event;
  participants?: Participant[];
}

// Mock marketplace services per agency (will be replaced with real API)
const AGENCY_MARKETPLACE_SERVICES: Record<string, { slug: string; title: string; price: number; rating: number; tier: string }[]> = {
  "Gourmet Events": [
    { slug: "wine-tasting-premium", title: "Wine Tasting Premium", price: 4900, rating: 4.9, tier: "enterprise" },
    { slug: "private-chef-dinner", title: "Private Chef Dinner", price: 8900, rating: 5.0, tier: "enterprise" },
  ],
  "Berlin Events GmbH": [
    { slug: "cocktail-workshop-berlin", title: "Cocktail Workshop Berlin", price: 3900, rating: 4.8, tier: "professional" },
    { slug: "dj-party-paket", title: "DJ & Party Paket", price: 59900, rating: 4.5, tier: "professional" },
  ],
  "Lens Masters": [
    { slug: "fotoshooting-event", title: "Event Fotoshooting", price: 34900, rating: 4.8, tier: "enterprise" },
  ],
};

function getAgencyTier(agencyName: string): "starter" | "professional" | "enterprise" {
  const services = AGENCY_MARKETPLACE_SERVICES[agencyName];
  if (!services?.length) return "starter";
  return services[0].tier as "starter" | "professional" | "enterprise";
}

// ---------------------------------------------------------------------------
// Marketplace: Constants & Helpers
// ---------------------------------------------------------------------------

const SERVICE_CATEGORIES = [
  { label: "Alle", filter: "", emoji: "\u2728" },
  { label: "Workshop", filter: "workshop", emoji: "\uD83C\uDFA8" },
  { label: "Entertainment", filter: "entertainment", emoji: "\uD83C\uDFAD" },
  { label: "Catering", filter: "catering", emoji: "\uD83C\uDF77" },
  { label: "Musik", filter: "music", emoji: "\uD83C\uDFB5" },
  { label: "Foto", filter: "photography", emoji: "\uD83D\uDCF8" },
  { label: "Venue", filter: "venue", emoji: "\uD83C\uDFDB\uFE0F" },
  { label: "Wellness", filter: "wellness", emoji: "\uD83D\uDC86" },
  { label: "Sport", filter: "sport", emoji: "\u26BD" },
  { label: "Deko", filter: "deko", emoji: "\uD83C\uDF80" },
];

const CATEGORY_COVER_GRADIENTS: Record<string, string> = {
  workshop: "from-violet-500/40 to-fuchsia-500/20",
  entertainment: "from-cyan-500/40 to-blue-500/20",
  catering: "from-amber-500/40 to-orange-500/20",
  music: "from-pink-500/40 to-rose-500/20",
  photography: "from-indigo-500/40 to-violet-500/20",
  venue: "from-emerald-500/40 to-green-500/20",
  wellness: "from-teal-400/40 to-cyan-500/20",
  sport: "from-red-500/40 to-orange-500/20",
  deko: "from-rose-400/40 to-pink-500/20",
  transport: "from-slate-500/40 to-zinc-600/20",
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Zahlung ausstehend", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  confirmed: { label: "Best\u00e4tigt", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "Abgeschlossen", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  cancelled_by_customer: { label: "Storniert", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  cancelled_by_agency: { label: "Storniert (Agentur)", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const CANCELLABLE_STATUSES = new Set(["pending_payment", "confirmed"]);

const EVENT_TYPE_RECOMMENDATIONS: Record<string, string[]> = {
  bachelor: ["sport", "entertainment", "workshop"],
  bachelorette: ["sport", "entertainment", "workshop"],
  wedding: ["catering", "photography", "music", "venue"],
  birthday: ["entertainment", "workshop", "catering"],
};

function formatPriceCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatBookingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Booked Services Section
// ---------------------------------------------------------------------------

function BookedServicesSection({
  eventId,
  bookings,
  isLoading,
}: {
  eventId: string;
  bookings: MarketplaceBooking[];
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const cancelBooking = useCancelBooking();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-0 overflow-hidden">
        {/* Section header with gradient accent */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#cf96ff]/5 via-transparent to-[#00e3fd]/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center shadow-lg shadow-[#cf96ff]/20">
                <Package className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Gebuchte Dienstleistungen</h3>
                <p className="text-xs text-muted-foreground">
                  {bookings.length > 0
                    ? `${bookings.length} Service${bookings.length !== 1 ? "s" : ""} gebucht`
                    : "Noch keine Buchungen"}
                </p>
              </div>
            </div>
            {bookings.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#cf96ff]/20 to-[#00e3fd]/20 text-[#cf96ff] border border-[#cf96ff]/20">
                {bookings.length}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#cf96ff]" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="font-display font-semibold text-foreground/80">Noch keine Dienstleistungen</p>
              <p className="text-sm text-muted-foreground mt-1">Entdecke passende Services weiter unten</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, i) => {
                const statusInfo = STATUS_STYLES[booking.status] || { label: booking.status, color: "bg-foreground/10 text-muted-foreground border-border" };
                const canCancel = CANCELLABLE_STATUSES.has(booking.status);

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-foreground/[0.03] backdrop-blur border border-white/[0.06] hover:border-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)] transition-all duration-200"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] hidden sm:block" />

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm">
                          {booking.service_title || "Service"}
                        </h4>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {booking.agency_name && (
                        <p className="text-xs text-muted-foreground">von {booking.agency_name}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#cf96ff]" />
                          {formatBookingDate(booking.booking_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00e3fd]" />
                          {booking.booking_time} Uhr
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#ff7350]" />
                          {booking.participant_count} Pers.
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground/60">
                        #{booking.booking_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-display font-black">
                        {formatPriceCents(booking.total_price_cents)} <span className="text-xs font-normal text-muted-foreground">EUR</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {booking.service_slug && (
                          <button
                            onClick={() => navigate(`/marketplace/service/${booking.service_slug}`)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-foreground/5 border border-white/[0.06] hover:border-[#cf96ff]/30 transition-colors"
                          >
                            Details
                          </button>
                        )}
                        {canCancel && (
                          <button
                            disabled={cancelBooking.isPending}
                            onClick={() => cancelBooking.mutate({ bookingId: booking.id, asAgency: false })}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3 inline mr-1" />
                            Stornieren
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Browse Marketplace Services Section
// ---------------------------------------------------------------------------

function MarketplaceServiceCard({
  service,
  eventId,
  index = 0,
}: {
  service: MarketplaceService;
  eventId: string;
  index?: number;
}) {
  const navigate = useNavigate();
  const coverGradient = CATEGORY_COVER_GRADIENTS[service.category] || "from-violet-500/30 to-fuchsia-500/15";
  const tierStyle = service.agency_tier === "enterprise"
    ? "ring-1 ring-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
    : service.agency_tier === "professional"
      ? "ring-1 ring-[#cf96ff]/20"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl bg-foreground/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden",
        "hover:border-violet-500/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)] transition-all duration-200 group",
        tierStyle,
      )}
    >
      <div className={cn("relative h-32 bg-gradient-to-br overflow-hidden", coverGradient)}>
        {service.cover_image_url ? (
          <img
            src={service.cover_image_url}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Category badge */}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/30 backdrop-blur-sm text-white/90 border border-white/10">
          {service.category}
        </span>
        {/* Agency tier badge */}
        {service.agency_tier === "enterprise" && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30 backdrop-blur-sm">
            Enterprise
          </span>
        )}
        {service.agency_tier === "professional" && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#cf96ff]/20 text-[#cf96ff] border border-[#cf96ff]/30 backdrop-blur-sm">
            Pro
          </span>
        )}
        {/* Price overlay */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-xl font-display font-black text-white drop-shadow-lg">
            {formatPriceCents(service.price_cents)} <span className="text-xs font-normal opacity-70">EUR</span>
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <h4 className="font-display font-bold text-sm truncate">{service.title}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {service.agency_name && <span className="truncate">{service.agency_name}</span>}
          {service.avg_rating > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {service.avg_rating.toFixed(1)}
            </span>
          )}
          {service.location_city && (
            <span className="flex items-center gap-0.5 shrink-0">
              <MapPin className="w-3 h-3" />
              {service.location_city}
            </span>
          )}
        </div>

        <button
          onClick={() => navigate(`/marketplace/service/${service.slug}?event_id=${eventId}`)}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] shadow-lg shadow-[#cf96ff]/20 hover:shadow-[#cf96ff]/30 transition-shadow flex items-center justify-center gap-1.5"
        >
          Für Event buchen
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function BrowseServicesSection({ eventId }: { eventId: string }) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({ category: category || undefined, search: search || undefined }),
    [category, search],
  );

  const { data, isLoading } = useMarketplaceServices(filters, 1, 12);
  const services = data?.services || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <GlassCard className="p-0 overflow-hidden">
        {/* Section header */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00e3fd]/5 via-transparent to-[#cf96ff]/5" />
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e3fd] to-[#cf96ff] flex items-center justify-center shadow-lg shadow-[#00e3fd]/20">
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Dienstleistungen entdecken</h3>
              <p className="text-xs text-muted-foreground">Services direkt für dein Event buchen</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Service suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-foreground/5 border-white/[0.06] focus:border-[#cf96ff]/40"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.filter}
                onClick={() => setCategory(cat.filter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200",
                  category === cat.filter
                    ? "bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] border-transparent shadow-lg shadow-[#cf96ff]/20"
                    : "bg-foreground/5 border-white/[0.06] text-muted-foreground hover:border-[#cf96ff]/20 hover:text-foreground",
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Service grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#cf96ff]" />
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="font-display font-semibold text-foreground/80">Keine Services gefunden</p>
              <p className="text-sm text-muted-foreground mt-1">Versuche eine andere Kategorie oder Suche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, i) => (
                <MarketplaceServiceCard key={service.id} service={service} eventId={eventId} index={i} />
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Recommended Services Section
// ---------------------------------------------------------------------------

function RecommendedServicesSection({
  eventId,
  eventType,
  bookingCount,
}: {
  eventId: string;
  eventType?: string;
  bookingCount: number;
}) {
  const navigate = useNavigate();

  const recommendedCategories = useMemo(() => {
    if (!eventType) return ["entertainment", "workshop", "catering"];
    return EVENT_TYPE_RECOMMENDATIONS[eventType] || ["entertainment", "workshop", "catering"];
  }, [eventType]);

  const shouldShow = bookingCount < 3;

  const { data, isLoading } = useMarketplaceServices(
    { category: recommendedCategories[0] },
    1,
    4,
  );

  if (!shouldShow) return null;

  const services = data?.services?.slice(0, 4) || [];
  if (isLoading || services.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative px-6 pt-5 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-[#ff7350]/5" />
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Empfohlene Services</h3>
              <p className="text-xs text-muted-foreground">Passend zu deinem Event-Typ</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((service, i) => {
              const coverGradient = CATEGORY_COVER_GRADIENTS[service.category] || "from-violet-500/30 to-fuchsia-500/15";
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/marketplace/service/${service.slug}?event_id=${eventId}`)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-foreground/[0.03] border border-white/[0.06] hover:border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] transition-all duration-200 cursor-pointer group"
                >
                  <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br overflow-hidden shrink-0", coverGradient)}>
                    {service.cover_image_url ? (
                      <img src={service.cover_image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-sm truncate">{service.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPriceCents(service.price_cents)} EUR
                      {service.agency_name && ` \u00B7 ${service.agency_name}`}
                    </p>
                    {service.avg_rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-muted-foreground">{service.avg_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[#cf96ff] transition-colors shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main AgenciesTab
// ---------------------------------------------------------------------------

export const AgenciesTab = ({ event, participants = [] }: AgenciesTabProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [expandedCountries, setExpandedCountries] = useState<string[]>(["DE"]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [dbAgencies, setDbAgencies] = useState<Agency[]>([]);

  // Load agencies from database
  useEffect(() => {
    const loadDbAgencies = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_affiliates')
          .select('*')
          .eq('status', 'active')
          .eq('is_verified', true);

        if (error) throw error;

        if (data) {
          // Convert database agencies to Agency format
          const convertedAgencies: Agency[] = data.map((dbAgency, index) => ({
            id: 1000 + index, // Offset IDs to avoid conflicts with static agencies
            country: dbAgency.agency_country,
            countryCode: getCountryCodeFromName(dbAgency.agency_country),
            city: dbAgency.agency_city,
            name: dbAgency.agency_name,
            website: '',
            phone: '',
            email: dbAgency.contact_email || '',
            description: `${dbAgency.agency_name} - ${dbAgency.agency_city}, ${dbAgency.agency_country}`,
          }));
          setDbAgencies(convertedAgencies);
        }
      } catch (err) {
        console.error('Failed to load database agencies:', err);
      }
    };

    loadDbAgencies();
  }, []);

  // Helper function to get country code from country name
  const getCountryCodeFromName = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'Deutschland': 'DE',
      'Germany': 'DE',
      'Österreich': 'AT',
      'Austria': 'AT',
      'Schweiz': 'CH',
      'Switzerland': 'CH',
      'Niederlande': 'NL',
      'Netherlands': 'NL',
      'Belgien': 'BE',
      'Belgium': 'BE',
      'Frankreich': 'FR',
      'France': 'FR',
      'Spanien': 'ES',
      'Spain': 'ES',
      'Italien': 'IT',
      'Italy': 'IT',
      'Portugal': 'PT',
      'Polen': 'PL',
      'Poland': 'PL',
      'Tschechien': 'CZ',
      'Czech Republic': 'CZ',
      'Ungarn': 'HU',
      'Hungary': 'HU',
      'Kroatien': 'HR',
      'Croatia': 'HR',
      'Griechenland': 'GR',
      'Greece': 'GR',
      'Türkei': 'TR',
      'Turkey': 'TR',
      'Vereinigtes Königreich': 'GB',
      'United Kingdom': 'GB',
      'Irland': 'IE',
      'Ireland': 'IE',
      'Dänemark': 'DK',
      'Denmark': 'DK',
      'Schweden': 'SE',
      'Sweden': 'SE',
      'Norwegen': 'NO',
      'Norway': 'NO',
      'Finnland': 'FI',
      'Finland': 'FI',
    };
    return countryMap[countryName] || 'OTHER';
  };

  // Combine static and database agencies
  const AGENCIES = useMemo(() => {
    return [...STATIC_AGENCIES, ...dbAgencies];
  }, [dbAgencies]);

  // Build dynamic COUNTRIES object including new countries from DB
  const COUNTRIES = useMemo(() => {
    const dynamicCountries: Record<string, { name: string; emoji: string }> = { ...STATIC_COUNTRIES };
    
    dbAgencies.forEach(agency => {
      if (!dynamicCountries[agency.countryCode] && agency.countryCode !== 'OTHER') {
        dynamicCountries[agency.countryCode] = {
          name: agency.country,
          emoji: getCountryEmoji(agency.countryCode),
        };
      }
    });

    return dynamicCountries;
  }, [dbAgencies]);

  // Helper function to get country emoji
  const getCountryEmoji = (countryCode: string): string => {
    const emojiMap: Record<string, string> = {
      DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', NL: '🇳🇱', BE: '🇧🇪',
      FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹', PT: '🇵🇹', PL: '🇵🇱',
      CZ: '🇨🇿', HU: '🇭🇺', HR: '🇭🇷', GR: '🇬🇷', TR: '🇹🇷',
      GB: '🇬🇧', IE: '🇮🇪', DK: '🇩🇰', SE: '🇸🇪', NO: '🇳🇴', FI: '🇫🇮',
    };
    return emojiMap[countryCode] || '🌍';
  };

  // Filter agencies
  const filteredAgencies = useMemo(() => {
    let agencies = AGENCIES;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      agencies = agencies.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    if (selectedCountry !== "all") {
      agencies = agencies.filter(a => a.countryCode === selectedCountry);
    }

    if (selectedCity !== "all") {
      agencies = agencies.filter(a => a.city === selectedCity);
    }

    return agencies;
  }, [AGENCIES, searchQuery, selectedCountry, selectedCity]);

  // Group by country and city
  const groupedAgencies = useMemo(() => {
    const groups: Record<string, Record<string, Agency[]>> = {};
    
    filteredAgencies.forEach(agency => {
      if (!groups[agency.countryCode]) {
        groups[agency.countryCode] = {};
      }
      if (!groups[agency.countryCode][agency.city]) {
        groups[agency.countryCode][agency.city] = [];
      }
      groups[agency.countryCode][agency.city].push(agency);
    });

    return groups;
  }, [filteredAgencies]);


  // Toggle country expansion
  const toggleCountry = (countryCode: string) => {
    setExpandedCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCountry("all");
    setSelectedCity("all");
  };

  // Track agency interaction
  const trackInteraction = async (agency: Agency, interactionType: 'phone' | 'email' | 'website') => {
    if (!event?.id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use type assertion as the table was just created and types may not be updated yet
      await (supabase.from('agency_interactions' as never) as unknown as ReturnType<typeof supabase.from>).insert({
        event_id: event.id,
        agency_id: agency.id,
        agency_name: agency.name,
        interaction_type: interactionType,
        user_id: user?.id || null,
        metadata: {
          city: agency.city,
          country: agency.countryCode,
          agency_email: agency.email,
          agency_phone: agency.phone,
          agency_website: agency.website,
        },
      } as never);
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  };

  // Handle email click with dynamic template
  const handleEmailClick = (agency: Agency) => {
    // Track the interaction
    trackInteraction(agency, 'email');

    // Fallback template if no event data available
    if (!event || !event.name) {
      const subject = encodeURIComponent(
        t('agencies.email.subjectFallback', 'Anfrage für Junggesellenabschied')
      );
      const body = encodeURIComponent(
`${t('agencies.email.greeting', 'Guten Tag')},

${t('agencies.email.fallbackIntro', 'wir planen ein Event und würden gerne Ihr Angebot anfragen.')}

${t('agencies.email.requestText', 'Bitte senden Sie uns Ihr Angebot mit verfügbaren Aktivitäten, Preisen und möglichen Terminen.')}

${t('agencies.email.closing', 'Mit freundlichen Grüßen')}`
      );
      
      window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`, '_blank');
      toast.success(t('agencies.emailTemplateOpened', 'Email-Vorlage geöffnet'));
      return;
    }

    // Generate reference code
    const refCode = `EB-${event.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Event type labels
    const eventTypeLabels: Record<string, string> = {
      bachelor: t('createEvent.types.bachelor', 'Junggesellenabschied'),
      bachelorette: t('createEvent.types.bachelorette', 'Junggesellinnenabschied'),
      birthday: t('createEvent.types.birthday', 'Geburtstag'),
      trip: t('createEvent.types.trip', 'Gruppenreise'),
      other: t('createEvent.types.other', 'Event'),
    };

    // Participant info
    const participantNames = participants.map(p => p.name).join(', ');
    const participantCount = participants.length;
    const organizer = participants.find(p => p.role === 'organizer');

    // Format date if available
    const formattedDate = event.event_date
      ? format(parseISO(event.event_date), 'dd.MM.yyyy')
      : t('agencies.email.dateNotSet', 'Noch nicht festgelegt');

    // Build email subject
    const subject = encodeURIComponent(
      `${t('agencies.email.subjectPrefix', 'Anfrage für')} ${event.name} - Ref: ${refCode}`
    );

    // Build email body
    const body = encodeURIComponent(
`${t('agencies.email.greeting', 'Guten Tag')},

${t('agencies.email.intro', 'wir planen ein Event und würden gerne Ihr Angebot anfragen.')}

=== ${t('agencies.email.eventDetails', 'EVENT-DETAILS')} ===
${t('agencies.email.eventName', 'Event-Name')}: ${event.name}
${t('agencies.email.eventType', 'Event-Typ')}: ${eventTypeLabels[event.event_type] || 'Event'}
${t('agencies.email.honoree', 'Ehrengast')}: ${event.honoree_name}
${t('agencies.email.date', 'Datum')}: ${formattedDate}
${t('agencies.email.participants', 'Anzahl Teilnehmer')}: ${participantCount}
${participantCount > 0 && participantCount <= 10 ? `${t('agencies.email.participantNames', 'Teilnehmer')}: ${participantNames}` : ''}

=== ${t('agencies.email.request', 'ANFRAGE')} ===
${t('agencies.email.requestText', 'Bitte senden Sie uns Ihr Angebot mit verfügbaren Aktivitäten, Preisen und möglichen Terminen.')}

${t('agencies.email.referenceCode', 'Referenz-Code')}: ${refCode}

${t('agencies.email.closing', 'Mit freundlichen Grüßen')},
${organizer?.name || t('agencies.email.planningTeam', 'Das Planungsteam')}

---
${t('agencies.email.generatedBy', 'Diese Anfrage wurde über EventBliss generiert.')}
`);

    // Open mailto link
    window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success(t('agencies.emailTemplateOpened', 'Email-Vorlage geöffnet'));
  };

  // Handle phone click
  const handlePhoneClick = (agency: Agency) => {
    trackInteraction(agency, 'phone');
  };

  // Handle website click
  const handleWebsiteClick = (agency: Agency) => {
    trackInteraction(agency, 'website');
  };

  // Available cities based on selected country (dynamic)
  const availableCities = useMemo(() => {
    if (selectedCountry === "all") {
      return [...new Set(AGENCIES.map(a => a.city))].sort();
    }
    return [...new Set(AGENCIES.filter(a => a.countryCode === selectedCountry).map(a => a.city))].sort();
  }, [AGENCIES, selectedCountry]);

  // Stats
  const stats = {
    total: AGENCIES.length,
    countries: Object.keys(COUNTRIES).length,
    cities: [...new Set(AGENCIES.map(a => a.city))].length,
    filtered: filteredAgencies.length,
  };

  // Marketplace: Event bookings
  const { data: eventBookings, isLoading: bookingsLoading } = useEventBookings(event?.id);
  const bookingList = eventBookings || [];

  return (
    <div className="space-y-6">
      {/* Marketplace: Booked services for this event */}
      {event?.id && (
        <BookedServicesSection
          eventId={event.id}
          bookings={bookingList}
          isLoading={bookingsLoading}
        />
      )}

      {/* Marketplace: Recommended services */}
      {event?.id && (
        <RecommendedServicesSection
          eventId={event.id}
          eventType={event.event_type}
          bookingCount={bookingList.length}
        />
      )}

      {/* Marketplace: Browse services */}
      {event?.id && <BrowseServicesSection eventId={event.id} />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {t('agencies.title')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('agencies.stats', { total: stats.total, countries: stats.countries, cities: stats.cities })}
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(COUNTRIES).slice(0, 5).map(([code, country]) => (
            <Badge
              key={code}
              variant={selectedCountry === code ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => {
                setSelectedCountry(selectedCountry === code ? "all" : code);
                setSelectedCity("all");
              }}
            >
              {country.emoji} {getAgenciesByCountry(code).length}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('agencies.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Country filter */}
          <Select value={selectedCountry} onValueChange={(v) => {
            setSelectedCountry(v);
            setSelectedCity("all");
          }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('agencies.country')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agencies.allCountries')}</SelectItem>
              {Object.entries(COUNTRIES).map(([code, country]) => (
                <SelectItem key={code} value={code}>
                  {country.emoji} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City filter */}
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('agencies.city')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agencies.allCities')}</SelectItem>
              {availableCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {(searchQuery || selectedCountry !== "all" || selectedCity !== "all") && (
            <Button variant="ghost" onClick={resetFilters} className="flex-shrink-0">
              <X className="w-4 h-4 mr-1" />
              {t('common.reset')}
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode("map")}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || selectedCountry !== "all" || selectedCity !== "all") && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{t('agencies.filteredOf', { filtered: filteredAgencies.length, total: stats.total })}</span>
          </div>
        )}
      </GlassCard>

      {/* Map View */}
      {viewMode === "map" && (
        <AgenciesMapView
          agencies={filteredAgencies}
          selectedCountry={selectedCountry}
          selectedCity={selectedCity !== "all" ? selectedCity : undefined}
          onCityClick={(city) => setSelectedCity(city)}
        />
      )}

      {/* Agency List */}
      {viewMode === "list" && (
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
          <div className="space-y-4 pr-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedAgencies).map(([countryCode, cities]) => {
                const country = COUNTRIES[countryCode];
                const isExpanded = expandedCountries.includes(countryCode);
                const countryAgencyCount = Object.values(cities).flat().length;

                return (
                  <motion.div
                    key={countryCode}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCountry(countryCode)}>
                      <CollapsibleTrigger asChild>
                        <GlassCard className="p-4 cursor-pointer hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{country?.emoji}</span>
                              <div>
                                <h3 className="font-display font-semibold text-lg">
                                  {country?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {t('agencies.agenciesInCities', { agencies: countryAgencyCount, cities: Object.keys(cities).length })}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                        </GlassCard>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-2 ml-4 pl-4 border-l-2 border-border space-y-4">
                          {Object.entries(cities).sort().map(([city, agencies]) => (
                            <div key={city}>
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                <h4 className="font-medium">{city}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {agencies.length}
                                </Badge>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {agencies.map((agency, index) => (
                                  <motion.div
                                    key={agency.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <GlassCard className={cn(
                                      "p-4 h-full flex flex-col hover:border-primary/30 transition-colors group",
                                      getAgencyTier(agency.name) === "enterprise" && "ring-2 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                                      getAgencyTier(agency.name) === "professional" && "ring-1 ring-primary/20",
                                    )}>
                                      <div className="flex-1">
                                        {/* Agency name + badges */}
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <h5 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                            {agency.name}
                                          </h5>
                                          {getAgencyTier(agency.name) !== "starter" && (
                                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                          )}
                                        </div>
                                        {/* Tier badge */}
                                        {getAgencyTier(agency.name) !== "starter" && (
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                              getAgencyTier(agency.name) === "enterprise"
                                                ? "bg-amber-500/20 text-amber-400"
                                                : "bg-primary/15 text-primary",
                                            )}>
                                              {getAgencyTier(agency.name) === "enterprise" ? "Enterprise ✓" : "Pro ✓"}
                                            </span>
                                          </div>
                                        )}
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                          {agency.description}
                                        </p>
                                      </div>

                                      {/* Marketplace Services Preview */}
                                      {AGENCY_MARKETPLACE_SERVICES[agency.name] && (
                                        <div className="mb-3 space-y-1.5">
                                          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                                            <ShoppingBag className="w-3 h-3" />
                                            <span>Buchbare Services</span>
                                          </div>
                                          {AGENCY_MARKETPLACE_SERVICES[agency.name].slice(0, 2).map((svc) => (
                                            <button
                                              key={svc.slug}
                                              onClick={() => navigate(`/marketplace/service/${svc.slug}`)}
                                              className="w-full flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5 text-left hover:bg-primary/10 transition-colors"
                                            >
                                              <span className="text-xs font-medium truncate">{svc.title}</span>
                                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="text-[10px] text-muted-foreground">{svc.rating}</span>
                                                <span className="text-xs font-bold text-primary">{(svc.price / 100).toFixed(0)}€</span>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      <div className="space-y-1 text-xs">
                                        {agency.phone && (
                                          <a
                                            href={`tel:${agency.phone}`}
                                            onClick={() => handlePhoneClick(agency)}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span className="truncate">{agency.phone}</span>
                                          </a>
                                        )}
                                        {agency.email && (
                                          <button
                                            onClick={() => handleEmailClick(agency)}
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                          >
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{agency.email}</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* Action buttons */}
                                      <div className="mt-3 flex gap-2">
                                        {AGENCY_MARKETPLACE_SERVICES[agency.name] ? (
                                          <button
                                            onClick={() => navigate(`/marketplace`)}
                                            className={cn(
                                              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                                              getAgencyTier(agency.name) === "enterprise"
                                                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                                                : "bg-gradient-to-r from-primary to-cyan-500 text-black",
                                            )}
                                          >
                                            {getAgencyTier(agency.name) === "enterprise" ? "Direkt buchen" : "Services ansehen"}
                                          </button>
                                        ) : (
                                          <a
                                            href={agency.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleWebsiteClick(agency)}
                                            className="flex-1 py-2 rounded-lg text-xs font-bold text-center bg-muted hover:bg-muted/70 transition-colors"
                                          >
                                            Website besuchen
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleEmailClick(agency)}
                                          className="px-3 py-2 rounded-lg text-xs font-bold bg-muted hover:bg-muted/70 transition-colors"
                                        >
                                          Anfragen
                                        </button>
                                      </div>
                                    </GlassCard>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredAgencies.length === 0 && (
              <GlassCard className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <h3 className="font-display font-semibold text-lg mb-2">
                  {t('agencies.noAgencies')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('agencies.noAgenciesDesc')}
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  {t('agencies.resetFilters')}
                </Button>
              </GlassCard>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
