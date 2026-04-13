/**
 * NativeMarketplaceScreen — native mobile marketplace browser.
 * Category-filtered service grid with search, pull-to-refresh, and native feel.
 */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Star, MapPin, ShieldCheck, SlidersHorizontal,
  X, ChevronDown, Store, DollarSign,
} from "lucide-react";
import { useMarketplaceServices, type MarketplaceService } from "@/hooks/useMarketplaceServices";
import { useHaptics } from "@/hooks/useHaptics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { FloatingOrbs } from "@/components/vfx/FloatingOrbs";
import { cn } from "@/lib/utils";

// ─── Category config ─────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", icon: "all", filter: "all" },
  { key: "workshop", icon: "workshop", filter: "workshop" },
  { key: "entertainment", icon: "entertainment", filter: "entertainment" },
  { key: "catering", icon: "catering", filter: "catering" },
  { key: "music", icon: "music", filter: "music" },
  { key: "photography", icon: "photography", filter: "photography" },
  { key: "venue", icon: "venue", filter: "venue" },
  { key: "wellness", icon: "wellness", filter: "wellness" },
  { key: "sport", icon: "sport", filter: "sport" },
  { key: "deko", icon: "deko", filter: "deko" },
  { key: "transport", icon: "transport", filter: "transport" },
] as const;

const CATEGORY_GRADIENTS: Record<string, string> = {
  workshop: "from-violet-500/30 to-fuchsia-500/20",
  entertainment: "from-cyan-500/30 to-blue-500/20",
  catering: "from-amber-500/30 to-orange-500/20",
  music: "from-pink-500/30 to-rose-500/20",
  photography: "from-indigo-500/30 to-violet-500/20",
  venue: "from-emerald-500/30 to-green-500/20",
  wellness: "from-teal-400/30 to-cyan-500/20",
  sport: "from-red-500/30 to-orange-500/20",
  deko: "from-rose-400/30 to-pink-500/20",
  transport: "from-slate-500/30 to-zinc-600/20",
};

const TIER_COLORS: Record<string, { ring: string; badge: string; text: string }> = {
  starter: { ring: "", badge: "bg-muted", text: "text-muted-foreground" },
  professional: { ring: "ring-1 ring-violet-500/30", badge: "bg-violet-500/15", text: "text-violet-400" },
  enterprise: { ring: "ring-2 ring-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]", badge: "bg-amber-500/15", text: "text-amber-400" },
};

// ─── ServiceCard ─────────────────────────────────────────────────
function NativeServiceCard({
  service,
  onTap,
}: {
  service: MarketplaceService;
  onTap: () => void;
}) {
  const { t } = useTranslation();
  const tier = TIER_COLORS[service.agency_tier] ?? TIER_COLORS.starter;
  const gradient = CATEGORY_GRADIENTS[service.category] || "from-muted/30 to-muted/10";

  return (
    <motion.button
      variants={staggerItem}
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "w-full text-left rounded-2xl overflow-hidden border border-border bg-card backdrop-blur",
        tier.ring,
      )}
    >
      {/* Cover */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {service.cover_image_url && (
          <img
            src={service.cover_image_url}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Category pill */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-medium text-white">
          {t(`marketplace.categories.${service.category}`, service.category)}
        </span>

        {/* Featured */}
        {service.is_featured && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
            {t("marketplace.featured", "Featured")}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-1">
            {service.title}
          </h3>
          <span className="shrink-0 text-sm font-bold text-foreground tabular-nums">
            {(service.price_cents / 100).toFixed(0)} €
          </span>
        </div>

        {service.short_description && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {service.short_description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-foreground font-medium">{service.avg_rating}</span>
            <span>({service.review_count})</span>
          </div>
          {service.location_city && (
            <div className="flex items-center gap-0.5">
              <MapPin size={11} />
              <span>{service.location_city}</span>
            </div>
          )}
        </div>

        {/* Agency row */}
        <div className="flex items-center justify-between pt-1.5 border-t border-border">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-muted-foreground text-[11px] truncate">{service.agency_name}</span>
            {(service.agency_tier === "professional" || service.agency_tier === "enterprise") && (
              <ShieldCheck size={12} className="text-primary shrink-0" />
            )}
          </div>
          <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold", tier.badge, tier.text)}>
            {t(`marketplace.tiers.${service.agency_tier}`, service.agency_tier)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="h-3 w-full bg-muted rounded" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-14 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function NativeMarketplaceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [ratingFilter, setRatingFilter] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const PRICE_FILTERS = [
    { key: "priceAll", min: 0, max: Infinity },
    { key: "priceTo30", min: 0, max: 3000 },
    { key: "price30to60", min: 3000, max: 6000 },
    { key: "price60plus", min: 6000, max: Infinity },
  ];

  const pf = PRICE_FILTERS[priceIdx];
  const filters = useMemo(
    () => ({
      category: activeCategory !== "all" ? activeCategory : undefined,
      search: search.trim() || undefined,
      city: cityFilter.trim() || undefined,
      minPrice: pf.min > 0 ? pf.min : undefined,
      maxPrice: pf.max < Infinity ? pf.max : undefined,
      minRating: ratingFilter ? 4 : undefined,
    }),
    [activeCategory, search, cityFilter, pf, ratingFilter],
  );

  const { data, isLoading, refetch } = useMarketplaceServices(filters, page, LIMIT);

  const services = useMemo(() => {
    if (!data?.services) return [];
    const sorted = [...data.services];
    const tw: Record<string, number> = { enterprise: 3, professional: 2, starter: 1 };
    sorted.sort((a, b) => {
      const t = (tw[b.agency_tier] || 0) - (tw[a.agency_tier] || 0);
      if (t !== 0) return t;
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || b.avg_rating - a.avg_rating;
    });
    return sorted;
  }, [data]);

  const totalResults = data?.total || 0;
  const hasMore = page * LIMIT < totalResults;

  const { containerRef, PullIndicator } = usePullToRefresh({
    onRefresh: async () => { await refetch(); },
  });

  const go = useCallback(
    (path: string) => {
      haptics.light();
      navigate(path);
    },
    [haptics, navigate],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto native-scroll safe-top pb-tabbar"
    >
      <PullIndicator />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <FloatingOrbs />
      </div>

      {/* Header */}
      <motion.div
        className="px-5 pt-6 pb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {t("marketplace.title", "Marketplace")}
          </p>
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
          {t("marketplace.subtitle", "Entdecke Erlebnisse & Services")}
        </h1>
      </motion.div>

      {/* Search */}
      <motion.div
        className="px-5 mt-3 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-foreground/[0.06] backdrop-blur border border-border focus-within:border-primary/40 transition-colors">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("marketplace.searchPlaceholder", "Services suchen...")}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground/50 outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="p-0.5">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => { setShowFilters((v) => !v); haptics.light(); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showFilters ? "bg-primary/20 text-primary" : "text-muted-foreground",
            )}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div
        className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1 no-scrollbar"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.2 }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.filter;
          return (
            <button
              key={cat.filter}
              onClick={() => {
                setActiveCategory(cat.filter);
                setPage(1);
                haptics.select();
              }}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-foreground/[0.06] text-muted-foreground border border-transparent",
              )}
            >
              {t(`marketplace.categories.${cat.key}`, cat.key)}
            </button>
          );
        })}
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5"
          >
            <div className="space-y-3 pb-3">
              {/* City */}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                  placeholder={t("marketplace.filters.cityPlaceholder", "z.B. Berlin")}
                  className="flex-1 bg-foreground/[0.06] border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 max-w-[180px]"
                />
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-muted-foreground shrink-0" />
                <div className="flex gap-1.5">
                  {PRICE_FILTERS.map((f, idx) => (
                    <button
                      key={f.key}
                      onClick={() => { setPriceIdx(idx); setPage(1); haptics.light(); }}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                        priceIdx === idx
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-foreground/[0.06] text-muted-foreground border-transparent",
                      )}
                    >
                      {t(`marketplace.filters.${f.key}`, f.key)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <Star size={14} className="text-muted-foreground shrink-0" />
                <button
                  onClick={() => { setRatingFilter((v) => !v); setPage(1); haptics.light(); }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                    ratingFilter
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-foreground/[0.06] text-muted-foreground border-transparent",
                  )}
                >
                  <Star size={11} className={ratingFilter ? "fill-amber-400 text-amber-400" : ""} />
                  {t("marketplace.filters.rating4plus", "4+ Sterne")}
                </button>

                {(priceIdx !== 0 || cityFilter || ratingFilter) && (
                  <button
                    onClick={() => { setPriceIdx(0); setCityFilter(""); setRatingFilter(false); setPage(1); }}
                    className="ml-auto text-[11px] text-muted-foreground underline"
                  >
                    {t("marketplace.filters.resetAll", "Alle zurücksetzen")}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results info */}
      <div className="px-5 pb-2">
        <span className="text-[11px] text-muted-foreground">
          {isLoading
            ? t("marketplace.loading", "Laden...")
            : t("marketplace.results_plural", "{{count}} Ergebnisse", { count: totalResults })}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : services.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          key={`${activeCategory}-${search}-${page}`}
          className="grid grid-cols-2 gap-3 px-5"
        >
          {services.map((s) => (
            <NativeServiceCard
              key={s.id}
              service={s}
              onTap={() => go(`/marketplace/service/${s.slug}`)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center px-5"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Search size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground/70 mb-1">
            {t("marketplace.noResults", "Keine Ergebnisse")}
          </h3>
          <p className="text-muted-foreground text-xs max-w-[240px]">
            {t("marketplace.noResultsHint", "Versuche andere Filter oder einen anderen Suchbegriff")}
          </p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("all"); setPage(1); }}
            className="mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold"
          >
            {t("marketplace.resetFilters", "Filter zurücksetzen")}
          </button>
        </motion.div>
      )}

      {/* Load more */}
      {hasMore && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-6"
        >
          <button
            onClick={() => { setPage((p) => p + 1); haptics.light(); }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-foreground/[0.06] border border-border text-muted-foreground text-xs font-semibold"
          >
            {t("marketplace.loadMore", "Mehr laden")}
            <ChevronDown size={14} />
          </button>
        </motion.div>
      )}

      {/* Bottom spacing for tabbar */}
      <div className="h-8" />
    </div>
  );
}
