import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useContextualServices, type ContextualService } from "@/hooks/useContextualServices";
import { useServiceAdTracker } from "@/hooks/useServiceAdTracker";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarketplaceRecommendationCardProps {
  /** AI-suggested activity categories (e.g., "workshop", "entertainment") */
  suggestedCategories: string[];
  /** Optional full response text — if provided, overrides category-only matching for richer keyword coverage */
  responseText?: string;
  /** City from event context */
  city?: string;
  /** Event type for relevance */
  eventType?: string;
  /** AI request type that produced this recommendation set */
  requestType?: string;
  /** User's EventBliss event id — for ad attribution linkage */
  eventId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(euros: number, type: ContextualService["priceType"], perPersonLabel: string): string {
  if (type === "per_person") return `ab ${euros} €/${perPersonLabel}`;
  if (type === "per_hour")   return `${euros} €/h`;
  if (type === "flat_rate")  return `${euros} € Pauschal`;
  return `${euros} €`;
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
// Skeleton
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
  service: ContextualService;
  index: number;
  perPersonLabel: string;
  bookLabel: string;
  onNavigate: (service: ContextualService) => void;
}

function MiniServiceCard({ service, index, perPersonLabel, bookLabel, onNavigate }: MiniServiceCardProps) {
  const Icon = service.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="flex-shrink-0 w-52 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-3 hover:border-purple-500/30 hover:bg-white/[0.07] transition-all duration-200 group snap-start"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
            service.gradient,
          )}
        >
          <Icon className="h-5 w-5 text-white/95" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate leading-tight">
            {service.title}
          </p>
          <p className="text-xs text-white/50 truncate mt-0.5">{service.agency}</p>
          <div className="mt-1">{renderStars(service.rating)}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-purple-300">
          {formatPrice(service.pricePerPerson, service.priceType, perPersonLabel)}
        </span>
        <button
          type="button"
          onClick={() => onNavigate(service)}
          className="h-7 px-3 text-xs font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 rounded-lg shadow-lg shadow-purple-500/20 transition-all"
        >
          {bookLabel}
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MarketplaceRecommendationCard = ({
  suggestedCategories,
  responseText,
  city,
  eventType,
  requestType,
  eventId,
}: MarketplaceRecommendationCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackImpressions, trackClick } = useServiceAdTracker();

  // Feed the hook a text blob — prefer full response, fall back to categories.
  const text = responseText && responseText.trim().length > 0
    ? responseText
    : suggestedCategories.join(" ");

  const { services, isLoading } = useContextualServices({
    text,
    city,
    eventType,
    limit: 6,
    enterpriseOnly: true,
  });

  // Log impressions when services render
  useEffect(() => {
    if (services.length === 0) return;
    trackImpressions(services, {
      requestType,
      eventId,
      sourceLocation: "marketplace_card",
      responseExcerpt: responseText?.slice(0, 500),
      cityHint: city,
      eventTypeHint: eventType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, requestType, eventId]);

  const handleNavigate = async (service: ContextualService) => {
    trackClick(service, {
      requestType,
      eventId,
      sourceLocation: "marketplace_card",
      cityHint: city,
      eventTypeHint: eventType,
    }).catch(() => {});
    navigate(`/marketplace/service/${service.slug}`);
  };

  if (!isLoading && services.length === 0) return null;

  const perPersonLabel = t("dashboard.ai.perPerson", "pro Person").replace(/^pro\s*/i, "");
  const bookLabel = t("dashboard.ai.bookableHere", "Direkt buchbar");

  return (
    <GlassCard
      variant="default"
      padding="none"
      className="relative overflow-hidden border-purple-500/20"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-purple-600/30 to-cyan-600/30">
            <Sparkles className="h-4 w-4 text-purple-300" />
          </div>
          <h3 className="text-base font-bold text-white">
            {t("dashboard.ai.suggestedFor", "Vorgeschlagen für deinen Plan")}
          </h3>
        </div>
        <p className="text-xs text-white/50 ml-9 mb-4">
          {t("dashboard.ai.bookableHere", "Direkt buchbar")}
        </p>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 snap-x snap-mandatory md:snap-none md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
            {services.map((service, index) => (
              <MiniServiceCard
                key={service.slug}
                service={service}
                index={index}
                perPersonLabel={perPersonLabel}
                bookLabel={bookLabel}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/marketplace")}
          className="mt-4 flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors group/link"
        >
          <span>{t("dashboard.ai.exploreMore", "Alle Services entdecken")}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
        </button>
      </div>
    </GlassCard>
  );
};
