import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown, Rocket, Check, Star, Zap, Shield,
  ToggleLeft, Bell, BellRing, Package, Receipt, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tier = "starter" | "professional" | "enterprise";

interface TierConfig {
  id: Tier;
  name: string;
  price: string;
  priceNote?: string;
  icon: typeof Rocket;
  features: string[];
  color: string;
  borderClass: string;
  badgeClass: string;
  glowClass?: string;
}

const tiers: TierConfig[] = [
  {
    id: "starter",
    name: "Starter",
    price: "Kostenlos",
    icon: Rocket,
    features: ["Bis zu 3 Services", "Basis-Sichtbarkeit", "25% Provision"],
    color: "from-slate-500 to-slate-400",
    borderClass: "border-white/[0.08]",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  {
    id: "professional",
    name: "Professional",
    price: "49\u20AC",
    priceNote: "/ Monat",
    icon: Star,
    features: [
      "Bis zu 20 Services", "Eigene Profilseite", "Featured Listings",
      "Priority Suche", "Pro Badge", "Nur 10% Provision",
    ],
    color: "from-violet-600 to-violet-400",
    borderClass: "border-violet-500/30",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    glowClass: "shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "149\u20AC",
    priceNote: "/ Monat",
    icon: Crown,
    features: [
      "Unbegrenzte Services", "KI-Empfehlung", "Auto-Featured",
      "Hoechste Prioritaet", "Enterprise Badge", "API-Zugang",
    ],
    color: "from-amber-500 to-yellow-400",
    borderClass: "border-amber-500/30",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    glowClass: "shadow-[0_0_50px_rgba(245,158,11,0.15)]",
  },
];

interface Props {
  agencyId?: string;
}

export default function AgencyMarketplaceSettings({ agencyId }: Props) {
  const [currentTier, setCurrentTier] = useState<Tier>("starter");
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<Tier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [cancelPolicy, setCancelPolicy] = useState("flexibel");
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(true);

  useEffect(() => {
    const loadTier = async () => {
      if (!agencyId) { setIsLoading(false); return; }
      const { data, error } = await supabase
        .from("agency_marketplace_subscriptions")
        .select("tier, is_active")
        .eq("agency_id", agencyId)
        .maybeSingle();
      if (!error && data?.is_active && data.tier) {
        setCurrentTier(data.tier as Tier);
      }
      setIsLoading(false);
    };
    loadTier();
  }, [agencyId]);

  const currentTierConfig = tiers.find(t => t.id === currentTier)!;
  const CurrentIcon = currentTierConfig.icon;
  const isPaidTier = currentTier === "professional" || currentTier === "enterprise";

  const handleUpgrade = async (tier: Tier) => {
    if (tier === "starter") return;
    setUpgradingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("agency-subscribe", {
        body: { tier, locale: "de", return_origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Kein Checkout-Link erhalten");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(`Fehler: ${msg}`);
      setUpgradingTier(null);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { return_origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Kein Portal-Link erhalten");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast.error(`Fehler: ${msg}`);
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-lg font-semibold text-slate-50">Abo & Marketplace-Paket</h3>
        <p className="text-sm text-slate-500">Verwalte dein Paket, Rechnungen und Standardeinstellungen</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <div className="flex items-center gap-5 mb-5">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg", currentTierConfig.color)}>
            <CurrentIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Aktuelles Paket</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-xl font-bold text-slate-50">{currentTierConfig.name}</h4>
              <Badge variant="outline" className={cn("text-[10px]", currentTierConfig.badgeClass)}>
                {isLoading ? "…" : "Aktiv"}
              </Badge>
              <span className="text-sm text-slate-400">
                {currentTierConfig.price}{currentTierConfig.priceNote || ""}
              </span>
            </div>
          </div>
        </div>

        {isPaidTier ? (
          <Button
            onClick={handleOpenPortal}
            disabled={portalLoading}
            variant="outline"
            className="w-full sm:w-auto bg-white/[0.04] border-white/[0.12] hover:bg-white/[0.08] text-slate-100 cursor-pointer h-10"
          >
            {portalLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Öffne Portal…</>
            ) : (
              <><Receipt className="w-4 h-4 mr-2" />Rechnungen & Abo verwalten<ExternalLink className="w-3.5 h-3.5 ml-2 opacity-60" /></>
            )}
          </Button>
        ) : (
          <div className="bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-amber-500/10 border border-violet-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100 mb-1">Upgrade sparst du dir langfristig</p>
              <p className="text-xs text-slate-400">
                15% weniger Provision + Featured Listings + eigene Profilseite. Jederzeit kündbar.
              </p>
            </div>
            <Button
              onClick={() => handleUpgrade("professional")}
              disabled={upgradingTier !== null}
              className="shrink-0 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-90 text-white shadow-lg shadow-pink-500/20 cursor-pointer h-10"
            >
              {upgradingTier === "professional" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lade…</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Auf Professional upgraden</>
              )}
            </Button>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((tier, i) => {
          const isCurrent = tier.id === currentTier;
          const TierIcon = tier.icon;
          const isBusy = upgradingTier === tier.id;
          const canUpgradeToThis = !isCurrent && tier.id !== "starter";

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={cn(
                "relative bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-6 flex flex-col transition-all duration-300",
                tier.borderClass, tier.glowClass,
                isCurrent && "ring-1 ring-white/10",
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", tier.color)}>
                  <TierIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-50">{tier.name}</h5>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-100">{tier.price}</span>
                    {tier.priceNote && <span className="text-xs text-slate-500">{tier.priceNote}</span>}
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={cn("w-4 h-4 shrink-0 mt-0.5",
                      tier.id === "enterprise" ? "text-amber-400" :
                      tier.id === "professional" ? "text-violet-400" : "text-slate-500",
                    )} />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button disabled className="w-full bg-white/[0.06] border border-white/[0.08] text-slate-400 cursor-default h-10">
                  Aktuelles Paket
                </Button>
              ) : canUpgradeToThis ? (
                <Button
                  onClick={() => isPaidTier ? handleOpenPortal() : handleUpgrade(tier.id)}
                  disabled={upgradingTier !== null || portalLoading}
                  className={cn("w-full h-10 text-white cursor-pointer shadow-lg",
                    tier.id === "enterprise"
                      ? "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 shadow-amber-500/20"
                      : "bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 shadow-violet-500/20",
                  )}
                >
                  {isBusy || (isPaidTier && portalLoading) ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lade…</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />{isPaidTier ? "Plan wechseln" : "Upgrade"}</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  variant="outline"
                  className="w-full bg-white/[0.04] border-white/[0.10] hover:bg-white/[0.08] text-slate-300 cursor-pointer h-10"
                >
                  {portalLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Lade…</>
                  ) : (
                    <>Downgrade verwalten</>
                  )}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h4 className="text-base font-semibold text-slate-50 mb-1">Standard-Einstellungen</h4>
        <p className="text-sm text-slate-500 mb-5">Standardwerte fuer neue Services und Buchungen</p>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <ToggleLeft className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Auto-Bestaetigung</p>
                <p className="text-xs text-slate-500 mt-0.5">Neue Buchungen automatisch bestaetigen</p>
              </div>
            </div>
            <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} className="cursor-pointer" />
          </div>

          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Standard-Stornierungspolitik</p>
                <p className="text-xs text-slate-500 mt-0.5">Gilt fuer alle neuen Services</p>
              </div>
            </div>
            <Select value={cancelPolicy} onValueChange={setCancelPolicy}>
              <SelectTrigger className="w-40 h-9 bg-white/[0.04] border-white/[0.08] text-slate-200 text-sm cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1625] border-white/[0.1]">
                <SelectItem value="flexibel" className="text-slate-200 cursor-pointer">Flexibel</SelectItem>
                <SelectItem value="moderat" className="text-slate-200 cursor-pointer">Moderat</SelectItem>
                <SelectItem value="strikt" className="text-slate-200 cursor-pointer">Strikt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Benachrichtigungen bei neuen Buchungen</p>
                <p className="text-xs text-slate-500 mt-0.5">E-Mail und Push bei eingehenden Buchungen</p>
              </div>
            </div>
            <Switch checked={notifyBookings} onCheckedChange={setNotifyBookings} className="cursor-pointer" />
          </div>

          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Benachrichtigungen bei Bewertungen</p>
                <p className="text-xs text-slate-500 mt-0.5">Benachrichtigung wenn ein Kunde eine Bewertung hinterlaesst</p>
              </div>
            </div>
            <Switch checked={notifyReviews} onCheckedChange={setNotifyReviews} className="cursor-pointer" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
