import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Star, MapPin, ChevronRight, SlidersHorizontal, X } from "lucide-react";

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
  gradient: string;
}

const MOCK_SERVICES: ServiceItem[] = [
  { id: "1", slug: "cocktail-workshop-berlin", title: "Cocktail Workshop Berlin", shortDesc: "Mixt eure eigenen Cocktails mit professionellem Barkeeper", category: "workshop", price: 3900, priceType: "per_person", city: "Berlin", rating: 4.8, reviews: 47, bookings: 182, featured: true, agencyName: "Berlin Events GmbH", agencyTier: "professional", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "2", slug: "escape-room-adventure", title: "Escape Room Adventure", shortDesc: "Spannende Raetsel loesen im Team — perfekt fuer Gruppen", category: "entertainment", price: 2500, priceType: "per_person", city: "München", rating: 4.6, reviews: 89, bookings: 341, featured: false, agencyName: "Fun Factory Munich", agencyTier: "starter", gradient: "from-cyan-500 to-blue-500" },
  { id: "3", slug: "wine-tasting-premium", title: "Wine Tasting Premium", shortDesc: "Exklusive Weinprobe mit Sommelier und 6 erlesenen Weinen", category: "catering", price: 4900, priceType: "per_person", city: "Hamburg", rating: 4.9, reviews: 34, bookings: 98, featured: true, agencyName: "Gourmet Events", agencyTier: "enterprise", gradient: "from-amber-500 to-orange-500" },
  { id: "4", slug: "graffiti-workshop", title: "Graffiti & Street Art Workshop", shortDesc: "Kreative Street Art unter professioneller Anleitung", category: "workshop", price: 3500, priceType: "per_person", city: "Köln", rating: 4.7, reviews: 22, bookings: 67, featured: false, agencyName: "Urban Arts Cologne", agencyTier: "professional", gradient: "from-emerald-500 to-green-500" },
  { id: "5", slug: "dj-party-paket", title: "DJ & Party Paket", shortDesc: "Professioneller DJ mit Licht- und Soundanlage", category: "music", price: 59900, priceType: "flat_rate", city: "Berlin", rating: 4.5, reviews: 63, bookings: 211, featured: false, agencyName: "Berlin Events GmbH", agencyTier: "professional", gradient: "from-pink-500 to-rose-500" },
  { id: "6", slug: "fotoshooting-event", title: "Event Fotoshooting", shortDesc: "Professionelle Eventfotografie mit sofort bearbeiteten Bildern", category: "photography", price: 34900, priceType: "flat_rate", city: "Frankfurt", rating: 4.8, reviews: 51, bookings: 156, featured: true, agencyName: "Lens Masters", agencyTier: "enterprise", gradient: "from-indigo-500 to-violet-500" },
  { id: "7", slug: "yoga-retreat-gruppe", title: "Yoga & Wellness Retreat", shortDesc: "Entspannendes Gruppen-Yoga mit Meditation und Snacks", category: "wellness", price: 2900, priceType: "per_person", city: "München", rating: 4.4, reviews: 18, bookings: 45, featured: false, agencyName: "Zen Space Munich", agencyTier: "starter", gradient: "from-teal-400 to-cyan-500" },
  { id: "8", slug: "go-kart-racing", title: "Go-Kart Racing Challenge", shortDesc: "Adrenalin pur — Rennen auf professioneller Indoor-Bahn", category: "sport", price: 3200, priceType: "per_person", city: "Stuttgart", rating: 4.7, reviews: 71, bookings: 289, featured: false, agencyName: "Speed Events", agencyTier: "professional", gradient: "from-red-500 to-orange-500" },
  { id: "9", slug: "private-chef-dinner", title: "Private Chef Dinner", shortDesc: "Privatkoch kocht ein 5-Gaenge-Menü bei euch zuhause", category: "catering", price: 8900, priceType: "per_person", city: "Berlin", rating: 5.0, reviews: 12, bookings: 34, featured: true, agencyName: "Gourmet Events", agencyTier: "enterprise", gradient: "from-yellow-400 to-amber-500" },
  { id: "10", slug: "krimi-dinner", title: "Krimi Dinner Erlebnis", shortDesc: "Interaktives Dinner mit Mordraetsel — wer ist der Taeter?", category: "entertainment", price: 5900, priceType: "per_person", city: "Hamburg", rating: 4.6, reviews: 38, bookings: 127, featured: false, agencyName: "Mystery Events HH", agencyTier: "starter", gradient: "from-slate-500 to-zinc-600" },
];

const CATEGORIES = [
  { label: "Alle", emoji: "✨", filter: "all" },
  { label: "Workshop", emoji: "🎨", filter: "workshop" },
  { label: "Entertainment", emoji: "🎭", filter: "entertainment" },
  { label: "Catering", emoji: "🍷", filter: "catering" },
  { label: "Musik", emoji: "🎵", filter: "music" },
  { label: "Foto", emoji: "📸", filter: "photography" },
  { label: "Venue", emoji: "🏛️", filter: "venue" },
  { label: "Wellness", emoji: "💆", filter: "wellness" },
  { label: "Sport", emoji: "⚽", filter: "sport" },
  { label: "Deko", emoji: "🎀", filter: "deko" },
  { label: "Transport", emoji: "🚐", filter: "transport" },
];

const PRICE_FILTERS = [
  { label: "Alle", min: 0, max: Infinity },
  { label: "bis 30 \u20AC", min: 0, max: 3000 },
  { label: "30\u201360 \u20AC", min: 3000, max: 6000 },
  { label: "60 \u20AC+", min: 6000, max: Infinity },
];

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  starter: { bg: "bg-zinc-700/50", text: "text-zinc-300", label: "Starter" },
  professional: { bg: "bg-purple-500/20", text: "text-[#cf96ff]", label: "Pro" },
  enterprise: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Enterprise" },
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

function priceLabel(priceType: "per_person" | "flat_rate"): string {
  return priceType === "per_person" ? "/Person" : "Pauschal";
}

function ServiceCard({ service, onClick }: { service: ServiceItem; onClick: () => void }) {
  const tier = TIER_COLORS[service.agencyTier];
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${C.card} rounded-2xl ${C.border} border overflow-hidden cursor-pointer group relative`}
    >
      {/* Featured glow */}
      {service.featured && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#cf96ff]/30 via-[#00e3fd]/20 to-[#ff7350]/30 blur-sm -z-10" />
      )}

      {/* Cover image placeholder */}
      <div className={`relative h-[200px] bg-gradient-to-br ${service.gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-medium text-white font-['Be_Vietnam_Pro']">
          {CATEGORIES.find(c => c.filter === service.category)?.emoji}{" "}
          {CATEGORIES.find(c => c.filter === service.category)?.label ?? service.category}
        </span>
        {/* Featured badge */}
        {service.featured && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-xs font-bold text-black font-['Be_Vietnam_Pro']">
            Featured
          </span>
        )}
        {/* Bookings count */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[11px] text-white/70 font-['Be_Vietnam_Pro']">
          {service.bookings}x gebucht
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
              {priceLabel(service.priceType)}
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

        {/* Agency */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] truncate max-w-[60%]">
            {service.agencyName}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tier.bg} ${tier.text} font-['Be_Vietnam_Pro']`}>
            {tier.label}
          </span>
        </div>
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriceIdx, setActivePriceIdx] = useState(0);
  const [cityFilter, setCityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    let result = MOCK_SERVICES;
    if (activeCategory !== "all") result = result.filter(s => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q) || s.shortDesc.toLowerCase().includes(q));
    }
    const pf = PRICE_FILTERS[activePriceIdx];
    result = result.filter(s => s.price >= pf.min && s.price < pf.max);
    if (cityFilter.trim()) {
      const c = cityFilter.toLowerCase();
      result = result.filter(s => s.city.toLowerCase().includes(c));
    }
    if (ratingFilter) result = result.filter(s => s.rating >= 4);
    // Featured first
    result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return result;
  }, [activeCategory, search, activePriceIdx, cityFilter, ratingFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

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
            Marketplace
          </h1>
          <p className="text-white/50 font-['Be_Vietnam_Pro'] text-sm sm:text-base max-w-md mx-auto">
            Entdecke Erlebnisse, Dienstleister & Pakete fuer dein naechstes Event
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-lg mx-auto relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 focus-within:border-[#cf96ff]/40 transition-colors">
              <Search size={18} className="text-white/30 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Services, Workshops, Erlebnisse suchen..."
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
                <span>{cat.label}</span>
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
            <span>Filter</span>
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
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">Stadt</span>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  placeholder="z.B. Berlin"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-['Be_Vietnam_Pro'] placeholder:text-white/20 outline-none focus:border-[#cf96ff]/40 max-w-[200px]"
                />
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">Preis</span>
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
                      {pf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs font-['Be_Vietnam_Pro'] w-16 shrink-0">Bewertung</span>
                <button
                  onClick={() => setRatingFilter(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-['Be_Vietnam_Pro'] transition-all ${
                    ratingFilter
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <Star size={12} className={ratingFilter ? "fill-amber-400 text-amber-400" : ""} />
                  4+ Sterne
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs text-white/30 hover:text-white/60 font-['Be_Vietnam_Pro'] underline transition-colors"
                  >
                    Alle zurücksetzen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between pb-4">
          <span className="text-white/30 text-xs font-['Be_Vietnam_Pro']">
            {filtered.length} {filtered.length === 1 ? "Ergebnis" : "Ergebnisse"}
          </span>
        </div>

        {/* Service grid */}
        {filtered.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${activeCategory}-${activePriceIdx}-${cityFilter}-${ratingFilter}-${search}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {visible.map(service => (
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
              Keine Ergebnisse
            </h3>
            <p className="text-white/30 text-sm font-['Be_Vietnam_Pro'] max-w-xs">
              Versuche andere Filter oder einen anderen Suchbegriff
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#cf96ff]/10 text-[#cf96ff] text-sm font-medium font-['Be_Vietnam_Pro'] hover:bg-[#cf96ff]/20 transition-colors"
            >
              Filter zurücksetzen
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
              onClick={() => setVisibleCount(v => v + 6)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium font-['Be_Vietnam_Pro'] transition-all"
            >
              Mehr laden
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
