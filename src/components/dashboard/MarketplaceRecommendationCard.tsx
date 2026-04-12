import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MockService {
  slug: string;
  title: string;
  agency: string;
  /** Price in cents */
  price: number;
  priceType: "per_person" | "flat_rate";
  rating: number;
  reviews: number;
  category: string;
  city: string;
  gradient: string;
  /** Only enterprise-tier agencies are eligible for AI recommendations */
  agencyTier: "starter" | "professional" | "enterprise";
}

export interface MarketplaceRecommendationCardProps {
  /** AI-suggested activity categories (e.g., "workshop", "entertainment") */
  suggestedCategories: string[];
  /** City from event context */
  city?: string;
  /** Event type for relevance */
  eventType?: string;
}

// ---------------------------------------------------------------------------
// Mock data — will be replaced with real marketplace API calls
// ---------------------------------------------------------------------------

// Only Enterprise-tier agencies are shown in AI recommendations.
// When connecting real data, filter by: agency_marketplace_subscriptions.tier = 'enterprise'
// AND marketplace_plan_configs.has_ai_integration = true
const MOCK_MATCHED_SERVICES: MockService[] = [
  {
    slug: "wine-tasting-premium",
    title: "Wine Tasting Premium",
    agency: "Gourmet Events",
    price: 4900,
    priceType: "per_person",
    rating: 4.9,
    reviews: 34,
    category: "catering",
    city: "Hamburg",
    gradient: "from-amber-500 to-orange-500",
    agencyTier: "enterprise",
  },
  {
    slug: "fotoshooting-event",
    title: "Event Fotoshooting",
    agency: "Lens Masters",
    price: 34900,
    priceType: "flat_rate",
    rating: 4.8,
    reviews: 51,
    category: "photography",
    city: "Frankfurt",
    gradient: "from-indigo-500 to-violet-500",
    agencyTier: "enterprise",
  },
  {
    slug: "private-chef-dinner",
    title: "Private Chef Dinner",
    agency: "Gourmet Events",
    price: 8900,
    priceType: "per_person",
    rating: 5.0,
    reviews: 12,
    category: "catering",
    city: "Berlin",
    gradient: "from-yellow-400 to-amber-500",
    agencyTier: "enterprise",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(cents: number, type: "per_person" | "flat_rate"): string {
  const euros = (cents / 100).toFixed(0);
  return type === "per_person" ? `ab ${euros} €/Person` : `${euros} € Pauschal`;
}

function renderStars(rating: number) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span className="text-xs text-white/70">{rating.toFixed(1)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function ServiceCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-52 rounded-xl border border-white/10 bg-white/5 p-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-7 w-16 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini service card
// ---------------------------------------------------------------------------

interface MiniServiceCardProps {
  service: MockService;
  index: number;
  onNavigate: (slug: string) => void;
}

function MiniServiceCard({ service, index, onNavigate }: MiniServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="flex-shrink-0 w-52 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-3 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all duration-200 group"
    >
      {/* Top row: thumbnail + title */}
      <div className="flex items-start gap-3">
        <div
          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center flex-shrink-0`}
        >
          <ShoppingBag className="h-5 w-5 text-white/90" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate leading-tight">
            {service.title}
          </p>
          <p className="text-xs text-white/50 truncate mt-0.5">
            {service.agency}
          </p>
          <div className="mt-1">{renderStars(service.rating)}</div>
        </div>
      </div>

      {/* Bottom row: price + CTA */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-purple-300">
          {formatPrice(service.price, service.priceType)}
        </span>
        <Button
          size="sm"
          onClick={() => onNavigate(service.slug)}
          className="h-7 px-3 text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-0 rounded-lg shadow-lg shadow-purple-500/20"
        >
          Buchen
        </Button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MarketplaceRecommendationCard = ({
  suggestedCategories,
  city,
  eventType: _eventType,
}: MarketplaceRecommendationCardProps) => {
  const navigate = useNavigate();
  const [isLoading] = useState(false);

  // Filter mock services that match any of the suggested categories.
  // Optionally boost city-matched services to the front.
  const matchedServices = useMemo(() => {
    if (!suggestedCategories.length) return [];

    const lowerCategories = suggestedCategories.map((c) => c.toLowerCase());

    const matches = MOCK_MATCHED_SERVICES.filter((s) =>
      lowerCategories.includes(s.category.toLowerCase())
    );

    // Sort city matches first when a city is provided
    if (city) {
      const lowerCity = city.toLowerCase();
      matches.sort((a, b) => {
        const aMatch = a.city.toLowerCase() === lowerCity ? 0 : 1;
        const bMatch = b.city.toLowerCase() === lowerCity ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return matches;
  }, [suggestedCategories, city]);

  // Don't render anything if there are no matches
  if (!isLoading && matchedServices.length === 0) {
    return null;
  }

  const handleNavigate = (slug: string) => {
    navigate(`/marketplace/service/${slug}`);
  };

  return (
    <GlassCard
      variant="default"
      padding="none"
      className="relative overflow-hidden border-purple-500/20"
    >
      {/* Gradient accent border top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-purple-600/30 to-cyan-600/30">
            <Sparkles className="h-4 w-4 text-purple-300" />
          </div>
          <h3 className="text-base font-bold text-white">
            Direkt buchbare Premium-Services
          </h3>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
            Enterprise
          </span>
        </div>
        <p className="text-xs text-white/50 ml-9 mb-4">
          KI-empfohlene Services von verifizierten Enterprise-Agenturen
        </p>

        {/* Scrollable service row */}
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 snap-x snap-mandatory md:snap-none md:grid md:grid-cols-2 md:overflow-visible">
            {matchedServices.map((service, index) => (
              <MiniServiceCard
                key={service.slug}
                service={service}
                index={index}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        {/* Footer link */}
        <button
          onClick={() => navigate("/marketplace")}
          className="mt-4 flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors group/link"
        >
          <span>Alle Services ansehen</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
        </button>
      </div>
    </GlassCard>
  );
};
