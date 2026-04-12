import { useMemo } from "react";
import {
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Crown,
  Star,
  ShoppingBag,
  Sparkles,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Agency } from "@/lib/agencies-data";

/* ------------------------------------------------------------------ */
/*  Marketplace mock (mirrors AgenciesTab — will be replaced by API)  */
/* ------------------------------------------------------------------ */
const AGENCY_MARKETPLACE_SERVICES: Record<
  string,
  { slug: string; title: string; price: number; rating: number; tier: string }[]
> = {
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

type Tier = "starter" | "professional" | "enterprise";

function getAgencyTier(name: string): Tier {
  const svc = AGENCY_MARKETPLACE_SERVICES[name];
  if (!svc?.length) return "starter";
  return svc[0].tier as Tier;
}

/* ------------------------------------------------------------------ */
/*  Tier visual config                                                 */
/* ------------------------------------------------------------------ */
const TIER_CONFIG: Record<Tier, {
  border: string;
  glow: string;
  badge: string;
  badgeText: string;
  label: string;
  accent: string;
}> = {
  enterprise: {
    border: "border-l-amber-400",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
    badgeText: "Enterprise",
    label: "bg-gradient-to-r from-amber-400 to-yellow-300",
    accent: "from-amber-500 to-yellow-400",
  },
  professional: {
    border: "border-l-violet-400",
    glow: "",
    badge: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30",
    badgeText: "Professional",
    label: "bg-gradient-to-r from-violet-400 to-fuchsia-400",
    accent: "from-violet-500 to-fuchsia-400",
  },
  starter: {
    border: "border-l-zinc-600",
    glow: "",
    badge: "bg-zinc-700/60 text-zinc-400 ring-1 ring-zinc-600/40",
    badgeText: "Starter",
    label: "bg-zinc-500",
    accent: "from-zinc-500 to-zinc-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface AgencyCityPanelProps {
  city: string;
  agencies: Agency[];
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function AgencyCityPanel({ city, agencies, onClose }: AgencyCityPanelProps) {
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    const order: Record<Tier, number> = { enterprise: 0, professional: 1, starter: 2 };
    return [...agencies].sort(
      (a, b) => order[getAgencyTier(a.name)] - order[getAgencyTier(b.name)],
    );
  }, [agencies]);

  if (!city || agencies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 bottom-4 w-[340px] z-10 flex items-center justify-center rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl"
      >
        <div className="text-center px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/40">
            <MapPin className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-display text-sm font-medium text-muted-foreground">
            Keine Agenturen in dieser Stadt gefunden.
          </p>
        </div>
      </motion.div>
    );
  }

  const handleEmailClick = (agency: Agency) => {
    const subject = encodeURIComponent(`Anfrage - ${agency.name}`);
    const body = encodeURIComponent(
      `Guten Tag,\n\nwir planen einen Junggesellenabschied in ${city} und interessieren uns für Ihr Angebot.\n\nBitte senden Sie uns verfügbare Aktivitäten, Preise und mögliche Termine.\n\nMit freundlichen Grüßen`,
    );
    window.open(`mailto:${agency.email}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 24, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={cn(
          "absolute top-4 right-4 bottom-4 w-[340px] z-10 flex flex-col overflow-hidden",
          "rounded-2xl border border-border/40",
          "bg-card/80 backdrop-blur-xl",
          "shadow-2xl shadow-black/20",
          // gradient border glow
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:p-px",
          "before:bg-gradient-to-b before:from-violet-500/20 before:via-cyan-500/10 before:to-transparent",
          "before:-z-10",
        )}
      >
        {/* ---- Header ---- */}
        <div className="relative flex items-center justify-between gap-3 px-5 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/5 via-cyan-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <MapPin className="h-4.5 w-4.5 text-violet-300" />
              </div>
              {/* live pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />
              </span>
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                {city}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="secondary"
                  className="h-5 rounded-md px-1.5 text-[10px] font-semibold bg-violet-500/15 text-violet-300 border-0"
                >
                  {sorted.length} {sorted.length === 1 ? "Agentur" : "Agenturen"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ---- Agency List ---- */}
        <ScrollArea className="flex-1">
          <div className="space-y-2.5 p-3">
            {sorted.map((agency, index) => {
              const tier = getAgencyTier(agency.name);
              const cfg = TIER_CONFIG[tier];
              const services = AGENCY_MARKETPLACE_SERVICES[agency.name];
              const isVerified = tier === "enterprise" || tier === "professional";

              return (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    type: "spring",
                    stiffness: 340,
                    damping: 28,
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl",
                    "border border-border/50 bg-background/60 backdrop-blur-sm",
                    "hover:border-border transition-all duration-200",
                    cfg.glow,
                  )}
                >
                  {/* Gradient accent bar left */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                      tier === "enterprise"
                        ? "bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500"
                        : tier === "professional"
                          ? "bg-gradient-to-b from-violet-400 via-fuchsia-400 to-violet-500"
                          : "bg-gradient-to-b from-zinc-500 to-zinc-600",
                    )}
                  />

                  <div className="pl-4 pr-3.5 py-3">
                    {/* Name + verified + tier */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-violet-300 transition-colors">
                          {agency.name}
                        </h4>
                        {isVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          cfg.badge,
                        )}
                      >
                        {tier === "enterprise" && <Crown className="h-2.5 w-2.5" />}
                        {cfg.badgeText}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2 mb-2.5">
                      {agency.description}
                    </p>

                    {/* Contact row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      {agency.phone && (
                        <a
                          href={`tel:${agency.phone}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-violet-500/15 hover:text-violet-300 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          Anrufen
                        </a>
                      )}
                      {agency.email && (
                        <button
                          onClick={() => handleEmailClick(agency)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          E-Mail
                        </button>
                      )}
                      {agency.website && (
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium bg-muted/50 text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </div>

                    {/* Marketplace services mini cards */}
                    {services && services.length > 0 && (
                      <div className="mb-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300">
                          <ShoppingBag className="h-3 w-3" />
                          Buchbare Services
                        </div>
                        {services.slice(0, 2).map((svc) => (
                          <button
                            key={svc.slug}
                            onClick={() => navigate(`/marketplace/service/${svc.slug}`)}
                            className={cn(
                              "w-full flex items-center justify-between gap-2",
                              "rounded-lg px-2.5 py-1.5 text-left",
                              "bg-white/[0.03] border border-border/30",
                              "hover:bg-violet-500/10 hover:border-violet-500/20 transition-all",
                            )}
                          >
                            <span className="text-[11px] font-medium text-foreground/80 truncate">
                              {svc.title}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] text-muted-foreground">
                                {svc.rating}
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                {(svc.price / 100).toFixed(0)}€
                              </span>
                            </div>
                          </button>
                        ))}
                        {services.length > 2 && (
                          <button
                            onClick={() => navigate("/marketplace")}
                            className="w-full text-center text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors py-0.5"
                          >
                            +{services.length - 2} weitere Services
                          </button>
                        )}
                      </div>
                    )}

                    {/* CTA button */}
                    {agency.email && (
                      <button
                        onClick={() => handleEmailClick(agency)}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5",
                          "rounded-lg py-2 text-xs font-bold",
                          "transition-all duration-200",
                          "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
                          tier === "enterprise"
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:shadow-amber-500/20"
                            : tier === "professional"
                              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-violet-500/20"
                              : "bg-gradient-to-r from-zinc-600 to-zinc-500 text-white hover:shadow-zinc-500/10",
                        )}
                      >
                        <Send className="h-3 w-3" />
                        Anfrage senden
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* ---- Footer sparkle ---- */}
        <div className="px-4 py-2.5 border-t border-border/30 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5">
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
            <Sparkles className="h-3 w-3" />
            EventBliss Agentur-Netzwerk
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
