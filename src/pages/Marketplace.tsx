import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Star, MapPin, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useMarketplaceServices, type MarketplaceService } from "@/hooks/useMarketplaceServices";

// Design tokens
const C = {
  surface: "bg-[#0d0d15]",
  card: "bg-[#1f1f29]",
  border: "border-[#484750]/10",
  purple: "#cf96ff",
  cyan: "#00e3fd",
  pink: "#ff7350",
} as const;

interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  category: string;
  price: number;
  priceType: "per_person" | "flat_rate";
  city: string;
  rating: number;
  reviews: number;
  bookings: number;
  featured: boolean;
  agencyName: string;
  agencyTier: "starter" | "professional" | "enterprise";
  coverImage: string | null;
  gradient: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  workshop: "from-violet-500 to-fuchsia-500",
  entertainment: "from-cyan-500 to-blue-500",
  catering: "from-amber-500 to-orange-500",
  music: "from-pink-500 to-rose-500",
  photography: "from-indigo-500 to-violet-500",
  venue: "from-emerald-500 to-green-500",
  wellness: "from-teal-400 to-cyan-500",
  sport: "from-red-500 to-orange-500",
  deko: "from-rose-400 to-pink-500",
  transport: "from-slate-500 to-zinc-600",
};

function mapServiceToItem(s: MarketplaceService): ServiceItem {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    shortDesc: s.short_description || "",
    category: s.category,
    price: s.price_cents,
    priceType: (s.price_type === "per_person" ? "per_person" : "flat_rate") as "per_person" | "flat_rate",
    city: s.location_city || "",
    rating: s.avg_rating,
    reviews: s.review_count,
    bookings: s.booking_count,
    featured: s.is_featured,
    agencyName: s.agency_name,
    agencyTier: (["starter", "professional", "enterprise"].includes(s.agency_tier) ? s.agency_tier : "starter") as "starter" | "professional" | "enterprise",
    coverImage: s.cover_image_url,
    gradient: CATEGORY_GRADIENTS[s.category] || "from-gray-500 to-gray-600",
  };
}

const CATEGORIES = [
  { key: "all", emoji: "✨", filter: "all" },
  { key: "workshop", emoji: "🎨", filter: "workshop" },
  { key: "entertainment", emoji: "🎭", filter: "entertainment" },
  { key: "catering", emoji: "🍷", filter: "catering" },
  { key: "music", emoji: "🎵", filter: "music" },
  { key: "photography", emoji: "📸", filter: "photography" },
  { key: "venue", emoji: "🏛️", filter: "venue" },
  { key: "wellness", emoji: "💆", filter: "wellness" },
  { key: "sport", emoji: "⚽", filter: "sport" },
  { key: "deko", emoji: "🎀", filter: "deko" },
  { key: "transport", emoji: "🚐", filter: "transport" },
];

const PRICE_FILTERS = [
  { key: "priceAll", min: 0, max: Infinity },
  { key: "priceTo30", min: 0, max: 3000 },
  { key: "price30to60", min: 3000, max: 6000 },
  { key: "price60plus", min: 6000, max: Infinity },
];

const TIER_COLORS: Record<string, { bg: string; text: string; labelKey: string; verified: boolean; glow: string }> = {
  starter: { bg: "bg-zinc-700/50", text: "text-zinc-300", labelKey: "starter", verified: false, glow: "" },
  professional: { bg: "bg-purple-500/20", text: "text-[#cf96ff]", labelKey: "professional", verified: true, glow: "ring-1 ring-[#cf96ff]/20" },
  enterprise: { bg: "bg-gradient-to-r from-amber-500/25 to-yellow-500/25", text: "text-amber-400", labelKey: "enterprise", verified: true, glow: "ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function formatPrice(price: number, priceType: "per_person" | "flat_rate"): string {
  return `${(price / 100).toFixed(0)} \u20AC`;
}

function priceLabel(priceType: "per_person" | "flat_rate", t: (key: string, fallback: string) => string): string {
  return priceType === "per_person" ? t("marketplace.perPerson", "/Person") : t("marketplace.flatRate", "Pauschal");
}

function ServiceCard({ service, onClick }: { service: ServiceItem; onClick: () => void }) {
  const { t } = useTranslation();
  const tier = TIER_COLORS[service.agencyTier];
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${C.card} rounded-2xl ${C.border} border overflow-hidden cursor-pointer group relative ${tier.glow}`}
    >
      {/* Featured / Enterprise glow */}
      {(service.featured || service.agencyTier === "enterprise") && (
        <div className={`absolute -inset-[1px] rounded-2xl blur-sm -z-10 ${
          service.agencyTier === "enterprise"
            ? "bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30"
            : "bg-gradient-to-r from-[#cf96ff]/30 via-[#00e3fd]/20 to-[#ff7350]/30"
        }`} />
      )}

      {/* Cover image */}
      <div className={`relative h-[200px] bg-gradient-to-br ${service.gradient} overflow-hidden`}>
        {service.coverImage && (
          <img src={service.coverImage} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/10" />
        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-medium text-white font-['Be_Vietnam_Pro']">
          {CATEGORIES.find(c => c.filter === service.category)?.emoji}{" "}
          {t(`marketplace.categories.${service.category}`, service.category)}
        </span>
        {/* Featured badge */}
        {service.featured && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-xs font-bold text-black font-['Be_Vietnam_Pro']">
            {t("marketplace.featured", "Featured")}
          </span>
        )}
        {/* Bookings count */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[11px] text-white/70 font-['Be_Vietnam_Pro']">
          {t("marketplace.timesBooked", "{{count}}x gebucht", { count: service.bookings })}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-white text-[15px] leading-tight line-clamp-1 group-hover:text-[#cf96ff] transition-colors">
            {service.title}
          </h3>
          <div className="shrink-0 text-right">
            <span className="text-white font-['Plus_Jakarta_Sans'] font-bold text-[15px]">
              {formatPrice(service.price, service.priceType)}
            </span>
            <span className="block text-[11px] text-white/40 font-['Be_Vietnam_Pro']">
              {priceLabel(service.priceType, t)}
            </span>
          </div>
        </div>

        <p className="text-white/50 text-[13px] font-['Be_Vietnam_Pro'] leading-relaxed line-clamp-2">
          {service.shortDesc}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-white text-xs font-medium font-['Be_Vietnam_Pro']">{service.rating}</span>
              <span className="text-white/30 text-xs font-['Be_Vietnam_Pro']">({service.reviews})</span>
            </div>
            {/* City */}
            <div className="flex items-center gap-1 text-white/40">
              <MapPin size={12} />
              <span className="text-xs font-['Be_Vietnam_Pro']">{service.city}</span>
            </div>
          </div>
        </div>

        {/* Agency + Verified Badge */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] truncate">
              {service.agencyName}
            </span>
            {tier.verified && (
              <span className="flex items-center gap-0.5 shrink-0" title={t("marketplace.verifiedAgency", "Verifizierte Agentur")}>
                <svg className="h-3.5 w-3.5 text-[#00e3fd]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-5.11-1.36a.75.75 0 00-1.085-1.035l-2.165 2.27-.89-.89a.75.75 0 10-1.06 1.06l1.418 1.418a.75.75 0 001.073-.012l2.71-2.81z" clipRule="evenodd" /></svg>
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tier.bg} ${tier.text} font-['Be_Vietnam_Pro']`}>
            {t(`marketplace.tiers.${tier.labelKey}`, tier.labelKey)}
          </span>
        </div>

        {/* Direct booking CTA for paid tiers */}
        {tier.verified && (
          <div className="pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={`w-full py-2 rounded-xl text-xs font-bold font-['Plus_Jakarta_Sans'] transition-all ${
                service.agencyTier === "enterprise"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-black"
              }`}
            >
              {service.agencyTier === "enterprise" ? t("marketplace.directBook", "Direkt buchen") : t("marketplace.inquireNow", "Jetzt anfragen")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className={`${C.card} rounded-2xl ${C.border} border overflow-hidden animate-pulse`}>
      <div className="h-[200px] bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-2/3 bg-white/5 rounded" />
          <div className="h-4 w-16 bg-white/5 rounded" />
        </div>
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-4/5 bg-white/5 rounded" />
        <div className="flex gap-4 pt-1">
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-3 w-20 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriceIdx, setActivePriceIdx] = useState(0);
  const [cityFilter, setCityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  // Build filters for the hook
  const hookFilters = useMemo(() => {
    const pf = PRICE_FILTERS[activePriceIdx];
    return {
      category: activeCategory !== "all" ? activeCategory : undefined,
      city: cityFilter.trim() || undefined,
      minPrice: pf.min > 0 ? pf.min : undefined,
      maxPrice: pf.max < Infinity ? pf.max : undefined,
      minRating: ratingFilter ? 4 : undefined,
      search: search.trim() || undefined,
    };
  }, [activeCategory, activePriceIdx, cityFilter, ratingFilter, search]);

  const { data, isLoading } = useMarketplaceServices(hookFilters, page, LIMIT);

  const services = useMemo(() => {
    if (!data?.services) return [];
    const mapped = data.services.map(mapServiceToItem);
    // Sort: Enterprise first, then Professional, then Starter
    const tierWeight: Record<string, number> = { enterprise: 3, professional: 2, starter: 1 };
    mapped.sort((a, b) => {
      const tw = (tierWeight[b.agencyTier] || 0) - (tierWeight[a.agencyTier] || 0);
      if (tw !== 0) return tw;
      const fw = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (fw !== 0) return fw;
      return b.rating - a.rating;
    });
    return mapped;
  }, [data]);

  const totalResults = data?.total || 0;
  const hasMore = page * LIMIT < totalResults;

  const clearFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("all");
    setActivePriceIdx(0);
    setCityFilter("");
    setRatingFilter(false);
  }, []);

  const activeFilterCount = [
    activeCategory !== "all",
    activePriceIdx !== 0,
    cityFilter.trim() !== "",
    ratingFilter,
  ].filter(Boolean).length;

  return (
    <div className={`min-h-screen ${C.surface} relative overflow-hidden`}>
      {/* Floating orbs */}
      <div className="absolute top-20 -left-32 w-72 h-72 rounded-full bg-[#cf96ff]/8 blur-[120px] animate-pulse" />
      <div className="absolute top-60 right-[-80px] w-64 h-64 rounded-full bg-[#00e3fd]/8 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-40 left-1/3 w-56 h-56 rounded-full bg-[#ff7350]/6 blur-[100px] animate-pulse" style={{ animationDelay: "3s" }} />
      <div className="absolute top-[50%] right-1/4 w-48 h-48 rounded-full bg-[#cf96ff]/5 blur-[80px] animate-pulse" style={{ animationDelay: "4.5s" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 pt-6 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white/70" />
          </button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-4 pb-8 text-center"
        >
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#cf96ff] via-[#00e3fd] to-[#ff7350] bg-clip-text text-transparent pb-2">
            {t("marketplace.title", "Marketplace")}
          </h1>
          <p className="text-white/50 font-['Be_Vietnam_Pro'] text-sm sm:text-base max-w-md mx-auto">
            {t("marketplace.subtitle", "Entdecke Erlebnisse, Dienstleister & Pakete für dein nächstes Event")}
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-lg mx-auto relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 focus-within:border-[#cf96ff]/40 transition-colors">
              <Search size={18} className="text-white/30 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("marketplace.searchPlaceholder", "Services, Workshops, Erlebnisse suchen...")}
                className="flex-1 bg-transparent text-white text-sm font-['Be_Vietnam_Pro'] placeholder:text-white/25 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="p-0.5 rounded-full hover:bg-white/10">
                  <X size={14} className="text-white/40" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.filter;
            return (
              <button
                key={cat.filter}
                onClick={() => setActiveCategory(cat.filter)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium font-['Be_Vietnam_Pro'] transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#cf96ff]/20 to-[#00e3fd]/20 text-white border border-[#cf96ff]/40"
                    : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10 hover:text-white/70"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{t(`marketplace.categories.${cat.key}`, cat.key)}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Filter row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="pb-6"
        >
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-['Be_Vietnam_Pro'] transition-colors mb-3"
          >
            <SlidersHorizontal size={15} />
            <span>{t("marketplace.filters.title", "Filter")}</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-[#cf96ff]/30 text-[#cf96ff] text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* City */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">{t("marketplace.filters.city", "Stadt")}</span>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  placeholder={t("marketplace.filters.cityPlaceholder", "z.B. Berlin")}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-['Be_Vietnam_Pro'] placeholder:text-white/20 outline-none focus:border-[#cf96ff]/40 max-w-[200px]"
                />
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">{t("marketplace.filters.price", "Preis")}</span>
                <div className="flex gap-1.5">
                  {PRICE_FILTERS.map((pf, idx) => (
                    <button
                      key={pf.label}
                      onClick={() => setActivePriceIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium font-['Be_Vietnam_Pro'] transition-all ${
                        activePriceIdx === idx
                          ? "bg-[#cf96ff]/20 text-[#cf96ff] border border-[#cf96ff]/30"
                          : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                      }`}
                    >
                      {t(`marketplace.filters.${pf.key}`, pf.key)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">{t("marketplace.filters.rating", "Bewertung")}</span>
                <button
                  onClick={() => setRatingFilter(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-['Be_Vietnam_Pro'] transition-all ${
                    ratingFilter
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <Star size={12} className={ratingFilter ? "fill-amber-400 text-amber-400" : ""} />
                  {t("marketplace.filters.rating4plus", "4+ Sterne")}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs text-white/30 hover:text-white/60 font-['Be_Vietnam_Pro'] underline transition-colors"
                  >
                    {t("marketplace.filters.resetAll", "Alle zurücksetzen")}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between pb-4">
          <span className="text-white/30 text-xs font-['Be_Vietnam_Pro']">
            {isLoading ? t("marketplace.loading", "Laden...") : (totalResults === 1 ? t("marketplace.results", "{{count}} Ergebnis", { count: totalResults }) : t("marketplace.results_plural", "{{count}} Ergebnisse", { count: totalResults }))}
          </span>
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : services.length > 0 ? (
          /* Service grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${activeCategory}-${activePriceIdx}-${cityFilter}-${ratingFilter}-${search}-${page}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => navigate(`/marketplace/service/${service.slug}`)}
              />
            ))}
          </motion.div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search size={32} className="text-white/20" />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-white/60 mb-1">
              {t("marketplace.noResults", "Keine Ergebnisse")}
            </h3>
            <p className="text-white/30 text-sm font-['Be_Vietnam_Pro'] max-w-xs">
              {t("marketplace.noResultsHint", "Versuche andere Filter oder einen anderen Suchbegriff")}
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#cf96ff]/10 text-[#cf96ff] text-sm font-medium font-['Be_Vietnam_Pro'] hover:bg-[#cf96ff]/20 transition-colors"
            >
              {t("marketplace.resetFilters", "Filter zurücksetzen")}
            </button>
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center pt-8"
          >
            <button
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium font-['Be_Vietnam_Pro'] transition-all"
            >
              {t("marketplace.loadMore", "Mehr laden")}
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
