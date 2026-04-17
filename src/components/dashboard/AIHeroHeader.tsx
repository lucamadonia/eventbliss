import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Sparkles, Wallet, MapPin, Users, PartyPopper, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreditIndicator } from "@/components/ai/CreditIndicator";
import { cn } from "@/lib/utils";

interface AIHeroHeaderProps {
  eventName?: string;
  eventType?: string;
  /** Raw city value from the survey top-pick. Locale-prefixed keys like "de_berlin" are cleaned. */
  city?: string;
  honoreeName?: string;
  participantCount?: number;
  surveyResponses?: number;
  credits: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: Date;
    loading?: boolean;
  };
  creditsAnimating?: boolean;
}

/** Cleans up survey destination values like "de_berlin" → "Berlin", "en_new_york" → "New York". */
function cleanDestinationLabel(raw: string | undefined): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/^(?:de|en|es|fr|it|nl|pl|pt|tr|ar)_/i, "");
  // Skip if it was JUST a locale prefix with nothing meaningful after
  if (!stripped || stripped.toLowerCase() === "city" || stripped.toLowerCase() === "either") {
    return null;
  }
  // Humanize: snake_case → Title Case
  return stripped
    .split(/[_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Rendered with `position: absolute` inside the hero
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${(i * 83 + 17) % 100}%`,
  top: `${(i * 47 + 11) % 100}%`,
  size: 2 + (i % 3) * 1.5,
  delay: (i % 6) * 0.4,
  duration: 6 + (i % 4),
}));

export default function AIHeroHeader({
  eventName,
  eventType,
  city,
  honoreeName,
  participantCount,
  surveyResponses,
  credits,
  creditsAnimating = false,
}: AIHeroHeaderProps) {
  const { t } = useTranslation();
  const displayCity = useMemo(() => cleanDestinationLabel(city), [city]);
  const displayEventType = useMemo(
    () => (eventType ? t(`eventTypes.${eventType}`, eventType) : null),
    [eventType, t],
  );

  const remainingState = useMemo(() => {
    if (credits.remaining === 0) return "empty";
    if (credits.remaining <= 5) return "low";
    return "healthy";
  }, [credits.remaining]);

  const ringClass = cn(
    "absolute -inset-1 rounded-3xl blur-xl opacity-60 pointer-events-none ai-pulse-ring",
    remainingState === "empty" && "bg-red-500/40",
    remainingState === "low" && "bg-amber-500/40",
    remainingState === "healthy" && "bg-gradient-to-br from-fuchsia-500/40 via-purple-500/40 to-amber-500/40",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/15"
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0118] via-[#140428] to-[#0a0118]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.30),transparent_55%),radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_65%)]" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(168,85,247,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.07) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Drifting particles */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-white/70"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              boxShadow: "0 0 8px rgba(236,72,153,0.6)",
            }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative p-5 md:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Title block with sparkle ring */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className={ringClass} />
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-xl shadow-pink-500/40">
                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-pink-300/90 mb-1">
                {t("dashboard.ai.title", "KI-Assistent")}
              </div>
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight truncate">
                {eventName || t("dashboard.ai.yourEvent", "Dein Event-Plan")}
              </h2>
              <p className="text-xs md:text-sm text-white/60 mt-1 truncate">
                {t("dashboard.ai.subtitle", "Lass dir bei der Planung helfen")}
              </p>
            </div>
          </div>

          {/* Credits ring */}
          <div className="hidden sm:block flex-shrink-0">
            <CreditIndicator
              used={credits.used}
              limit={credits.limit}
              remaining={credits.remaining}
              resetDate={credits.resetDate}
              loading={credits.loading}
              variant="compact"
              showAnimation={creditsAnimating}
            />
          </div>
        </div>

        {/* Context chips */}
        <div className="flex flex-wrap gap-2">
          {displayCity && (
            <Badge
              variant="outline"
              className="border-white/20 bg-white/[0.06] backdrop-blur-sm text-white/90 text-xs font-semibold gap-1.5"
            >
              <MapPin className="w-3 h-3" />
              {displayCity}
            </Badge>
          )}
          {participantCount ? (
            <Badge
              variant="outline"
              className="border-white/20 bg-white/[0.06] backdrop-blur-sm text-white/90 text-xs font-semibold gap-1.5"
            >
              <Users className="w-3 h-3" />
              {participantCount} {t("dashboard.overview.participants", "Teilnehmer")}
            </Badge>
          ) : null}
          {displayEventType && (
            <Badge
              variant="outline"
              className="border-white/20 bg-white/[0.06] backdrop-blur-sm text-white/90 text-xs font-semibold gap-1.5"
            >
              <PartyPopper className="w-3 h-3" />
              {displayEventType}
            </Badge>
          )}
          {typeof surveyResponses === "number" && surveyResponses > 0 && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 backdrop-blur-sm text-emerald-200 text-xs font-semibold gap-1.5"
            >
              <Wallet className="w-3 h-3" />
              {honoreeName
                ? t("dashboard.ai.basedOn", "Basierend auf {{count}} Antworten für {{name}}s Event", { count: surveyResponses, name: honoreeName })
                : t("dashboard.ai.basedOnNoName", "Basierend auf {{count}} Antworten", { count: surveyResponses })}
            </Badge>
          )}
          <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-0 text-xs font-bold gap-1.5 shadow-md shadow-pink-500/30">
            <Zap className="w-3 h-3" />
            {t("dashboard.ai.creditsFuel", "Credits treiben deinen Planer an")}
          </Badge>
        </div>

        {/* Mobile credits row */}
        <div className="sm:hidden mt-4">
          <CreditIndicator
            used={credits.used}
            limit={credits.limit}
            remaining={credits.remaining}
            resetDate={credits.resetDate}
            loading={credits.loading}
            variant="compact"
            showAnimation={creditsAnimating}
          />
        </div>
      </div>
    </motion.div>
  );
}
