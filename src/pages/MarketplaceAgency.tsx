import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin, Star, ShieldCheck, Calendar, Users, TrendingUp,
  Mail, Phone, Globe, ChevronRight, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Design tokens
const C = {
  surface: "bg-[#0d0d15]",
  high: "bg-[#1f1f29]",
  low: "bg-[#13131b]",
  primary: "#cf96ff",
  secondary: "#00e3fd",
  tertiary: "#ff7350",
  border: "border-[#484750]/10",
} as const;

const TIER_BADGES: Record<string, { label: string; color: string; partnerLabel: string }> = {
  starter: { label: "Starter", color: "text-gray-400 bg-gray-400/10", partnerLabel: "Standard" },
  professional: { label: "Professional", color: "text-[#cf96ff] bg-[#cf96ff]/10", partnerLabel: "Pro Partner" },
  enterprise: { label: "Enterprise", color: "text-amber-400 bg-amber-400/10", partnerLabel: "Enterprise Partner" },
  premium: { label: "Premium", color: "text-[#00e3fd] bg-[#00e3fd]/10", partnerLabel: "Premium Partner" },
};

const TIER_BENEFITS: Record<string, string[]> = {
  professional: [
    "Verifizierte Agentur",
    "Priorisiert in der Suche",
    "Eigene Profilseite",
  ],
  enterprise: [
    "Verifizierte Agentur",
    "Priorisiert in der Suche",
    "Eigene Profilseite",
    "KI-Empfehlung",
    "Auto-Featured",
    "Premium Support",
  ],
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_person: "pro Person",
  flat_rate: "Pauschal",
  per_hour: "pro Stunde",
  custom: "Individuell",
};

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon, value, label, delay,
}: { icon: React.ElementType; value: string; label: string; delay: number }) {
  return (
    <motion.div
      className={`flex-1 min-w-[120px] p-4 rounded-2xl ${C.high} border ${C.border}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Icon size={20} className="text-[#cf96ff] mb-2" />
      <div className="text-xl font-black font-game">{value}</div>
      <div className="text-xs text-gray-500 font-['Be_Vietnam_Pro'] mt-0.5">{label}</div>
    </motion.div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-2xl ${className ?? ""}`} />;
}

function LoadingSkeleton() {
  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#cf96ff]/20 via-[#1f1f29] to-[#00e3fd]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <div className="flex items-end gap-5">
          <SkeletonBlock className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 pb-1 space-y-2">
            <SkeletonBlock className="h-8 w-64" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          {[...Array(5)].map((_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <div className="mt-10 space-y-3">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-16 w-full max-w-3xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} className="h-56" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------

function useAgencyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["agency-profile", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agencies")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        website: string | null;
        email: string | null;
        phone: string | null;
        city: string | null;
        country: string;
        marketplace_tier: string;
        is_active: boolean;
        created_at: string;
      };
    },
    staleTime: 60_000,
  });
}

function useAgencyApprovedServices(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-approved-services", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data: services, error } = await (supabase.from as any)("marketplace_services")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("avg_rating", { ascending: false });

      if (error) throw error;
      if (!services || services.length === 0) return [];

      // Fetch translations (prefer DE)
      const ids = services.map((s: any) => s.id);
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("*")
        .in("service_id", ids)
        .in("locale", ["de", "en"]);

      const txMap = new Map<string, any>();
      for (const tx of translations || []) {
        const existing = txMap.get(tx.service_id);
        if (!existing || tx.locale === "de") txMap.set(tx.service_id, tx);
      }

      return services.map((s: any) => {
        const tx = txMap.get(s.id);
        return {
          id: s.id,
          slug: s.slug,
          category: s.category,
          price_cents: s.price_cents,
          price_type: s.price_type,
          avg_rating: s.avg_rating ?? 0,
          review_count: s.review_count ?? 0,
          booking_count: s.booking_count ?? 0,
          cover_image_url: s.cover_image_url,
          title: tx?.title || "Ohne Titel",
          short_description: tx?.short_description || null,
        };
      });
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketplaceAgency() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: agency, isLoading: agencyLoading, error: agencyError } = useAgencyBySlug(slug);
  const { data: services = [], isLoading: servicesLoading } = useAgencyApprovedServices(agency?.id);

  // Reviews: empty for now (no reviews table yet)
  const reviews: any[] = [];

  if (agencyLoading) return <LoadingSkeleton />;

  if (agencyError || !agency) {
    return (
      <div className={`min-h-screen ${C.surface} text-white flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black font-game">Agentur nicht gefunden</h1>
          <p className="text-gray-400 font-['Be_Vietnam_Pro']">
            Die Agentur mit dem Slug "{slug}" existiert nicht oder ist nicht mehr aktiv.
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-4 px-6 py-2.5 rounded-full bg-[#cf96ff] text-black font-bold font-game text-sm hover:bg-[#b87ae6] transition-colors"
          >
            Zum Marketplace
          </button>
        </div>
      </div>
    );
  }

  const tier = agency.marketplace_tier || "starter";
  const tierBadge = TIER_BADGES[tier] ?? TIER_BADGES.starter;
  const createdYear = new Date(agency.created_at).getFullYear();

  // Compute aggregate stats from services
  const totalBookings = services.reduce((sum: number, s: any) => sum + (s.booking_count || 0), 0);
  const avgRating =
    services.length > 0
      ? services.reduce((sum: number, s: any) => sum + (s.avg_rating || 0), 0) / services.length
      : 0;

  return (
    <div className={`min-h-screen ${C.surface} text-white`}>
      {/* Header Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className={`absolute inset-0 ${
          tier === "enterprise"
            ? "bg-gradient-to-br from-amber-400/30 via-[#1f1f29] to-amber-600/15"
            : tier === "professional"
            ? "bg-gradient-to-br from-[#cf96ff]/30 via-[#1f1f29] to-[#cf96ff]/10"
            : "bg-gradient-to-br from-[#cf96ff]/25 via-[#1f1f29] to-[#00e3fd]/15"
        }`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
      </div>

      {/* Agency Info Overlay */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-16 relative z-10">
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-end gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          {agency.logo_url ? (
            <img
              src={agency.logo_url}
              alt={agency.name}
              className="w-20 h-20 rounded-full object-cover shadow-xl shadow-[#cf96ff]/20 border-4 border-[#0d0d15]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-3xl font-black font-game shadow-xl shadow-[#cf96ff]/20 border-4 border-[#0d0d15]">
              {agency.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black font-game">{agency.name}</h1>
              {(tier === "professional" || tier === "enterprise") && (
                <ShieldCheck size={22} className="text-[#00e3fd]" />
              )}
              {tier === "professional" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-['Be_Vietnam_Pro'] bg-[#cf96ff]/15 text-[#cf96ff] border border-[#cf96ff]/20">
                  Pro Partner &#10003;
                </span>
              )}
              {tier === "enterprise" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-['Be_Vietnam_Pro'] bg-amber-400/15 text-amber-400 border border-amber-400/20">
                  Enterprise Partner &#10003;
                </span>
              )}
              {tier === "starter" && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] ${tierBadge.color}`}>
                  {tierBadge.label}
                </span>
              )}
            </div>
            {agency.city && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400 font-['Be_Vietnam_Pro']">
                <MapPin size={14} className="text-gray-500" />
                {agency.city}
              </div>
            )}
          </div>
        </motion.div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-['Be_Vietnam_Pro'] mt-6">
          <button onClick={() => navigate("/marketplace")} className="hover:text-[#cf96ff] transition-colors">
            Marketplace
          </button>
          <ChevronRight size={14} />
          <span className="text-white/70">{agency.name}</span>
        </nav>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
          <StatCard icon={TrendingUp} value={String(services.length)} label="Services" delay={0.1} />
          <StatCard icon={Users} value={totalBookings > 0 ? `${totalBookings}+` : "0"} label="Buchungen" delay={0.15} />
          <StatCard icon={Star} value={avgRating > 0 ? `${avgRating.toFixed(1)}\u2605` : "\u2014"} label="Bewertung" delay={0.2} />
          <StatCard icon={Calendar} value={`Seit ${createdYear}`} label="Aktiv seit" delay={0.25} />
          <StatCard
            icon={ShieldCheck}
            value={(tier === "professional" || tier === "enterprise") ? "\u2713" : "\u2014"}
            label={(tier === "professional" || tier === "enterprise") ? "Verifiziert" : "Standard"}
            delay={0.3}
          />
        </div>

        {/* Tier-Vorteile */}
        {(tier === "professional" || tier === "enterprise") && TIER_BENEFITS[tier] && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <h2 className="text-lg font-black font-game mb-3">Tier-Vorteile</h2>
            <div className="flex flex-wrap gap-2">
              {TIER_BENEFITS[tier]!.map((benefit) => (
                <span
                  key={benefit}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-['Be_Vietnam_Pro'] border ${
                    tier === "enterprise"
                      ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                      : "bg-[#cf96ff]/10 text-[#cf96ff] border-[#cf96ff]/20"
                  }`}
                >
                  <ShieldCheck size={12} />
                  {benefit}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Über uns */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl font-black font-game mb-3">Über uns</h2>
          <p className="text-gray-300 leading-relaxed font-['Be_Vietnam_Pro'] text-sm max-w-3xl">
            {agency.name} ist seit {createdYear} aktiv{agency.city ? ` in ${agency.city}` : ""}.
          </p>
        </motion.section>

        {/* Services */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xl font-black font-game mb-4">Services</h2>
          {servicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonBlock key={i} className="h-56" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className={`p-8 rounded-2xl ${C.high} border ${C.border} text-center`}>
              <p className="text-gray-400 font-['Be_Vietnam_Pro'] text-sm">
                Diese Agentur hat noch keine Services im Marketplace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc: any, i: number) => (
                <motion.button
                  key={svc.slug}
                  onClick={() => navigate(`/marketplace/service/${svc.slug}`)}
                  className={`text-left p-4 rounded-2xl ${C.high} border ${C.border} hover:border-[#cf96ff]/20 transition-all group`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileHover={{ y: -2 }}
                >
                  {/* Image / Placeholder */}
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[#cf96ff]/10 via-[#1f1f29] to-[#00e3fd]/10 mb-3 overflow-hidden">
                    {svc.cover_image_url ? (
                      <img
                        src={svc.cover_image_url}
                        alt={svc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-['Be_Vietnam_Pro']">
                        {svc.category}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cf96ff]/10 text-[#cf96ff] font-semibold font-['Be_Vietnam_Pro']">
                      {svc.category}
                    </span>
                  </div>
                  <h3 className="font-bold font-game text-sm group-hover:text-[#cf96ff] transition-colors">
                    {svc.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={svc.avg_rating} size={12} />
                      <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">({svc.review_count})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black font-game">{formatPrice(svc.price_cents)} €</span>
                      <span className="text-[10px] text-gray-500 font-['Be_Vietnam_Pro'] ml-1">
                        {PRICE_TYPE_LABELS[svc.price_type] || svc.price_type}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        {/* Bewertungen */}
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-xl font-black font-game mb-4">Bewertungen</h2>
          {reviews.length === 0 ? (
            <div className={`p-8 rounded-2xl ${C.high} border ${C.border} text-center`}>
              <Star size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-['Be_Vietnam_Pro'] text-sm">
                Noch keine Bewertungen für diese Agentur.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any, i: number) => (
                <motion.div
                  key={i}
                  className={`p-4 rounded-2xl ${C.high} border ${C.border}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cf96ff] to-[#00e3fd] flex items-center justify-center text-sm font-bold font-game">
                      {review.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm font-game">{review.name}</span>
                        <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">
                          {new Date(review.date).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs text-gray-500 font-['Be_Vietnam_Pro']">{review.service}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-300 font-['Be_Vietnam_Pro'] leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Kontakt */}
        <motion.section
          className="mt-10 pb-16"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="text-xl font-black font-game mb-4">Kontakt</h2>
          <div className={`p-5 rounded-2xl ${C.high} border ${C.border} space-y-3 max-w-md`}>
            {agency.email && (
              <a
                href={`mailto:${agency.email}`}
                className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#cf96ff] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                  <Mail size={16} className="text-[#cf96ff]" />
                </div>
                {agency.email}
              </a>
            )}
            {agency.phone && (
              <a
                href={`tel:${agency.phone}`}
                className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#00e3fd] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-[#00e3fd]" />
                </div>
                {agency.phone}
              </a>
            )}
            {agency.website && (
              <a
                href={agency.website.startsWith("http") ? agency.website : `https://${agency.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-['Be_Vietnam_Pro'] text-gray-300 hover:text-[#ff7350] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#13131b] flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-[#ff7350]" />
                </div>
                {agency.website}
                <ExternalLink size={12} className="text-gray-500 ml-auto" />
              </a>
            )}
            {!agency.email && !agency.phone && !agency.website && (
              <p className="text-gray-500 font-['Be_Vietnam_Pro'] text-sm">
                Keine Kontaktdaten hinterlegt.
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
