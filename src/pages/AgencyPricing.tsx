import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Check, Sparkles, Zap, Crown, Users, TrendingUp, Globe,
  PartyPopper, Tv, BarChart3, Rocket, Shield, Star, ArrowRight,
  Bot, CalendarCheck, Clock, LayoutDashboard, Wallet, Radio, FileText,
  CalendarDays, Contact, FolderOpen, UserCog,
} from "lucide-react";

type Tier = "starter" | "professional" | "enterprise";

const STATS = [
  { value: "17", key: "games", icon: PartyPopper },
  { value: "203", key: "ideas", icon: Sparkles },
  { value: "170+", key: "agencies", icon: Users },
  { value: "10", key: "languages", icon: Globe },
];

const VIRAL_LOOPS = [
  { icon: PartyPopper, key: "game", color: "from-purple-600 to-pink-600" },
  { icon: BarChart3, key: "survey", color: "from-pink-600 to-amber-500" },
  { icon: Tv, key: "tv", color: "from-amber-500 to-purple-600" },
];

const TIERS: Array<{ id: Tier; price: number; originalPrice: number; icon: typeof Sparkles; highlight: boolean; commission: string; color: string; featureCount: number; }> = [
  { id: "starter", price: 0, originalPrice: 0, icon: Sparkles, highlight: false, commission: "25%", color: "from-slate-600 to-slate-800", featureCount: 5 },
  { id: "professional", price: 49, originalPrice: 98, icon: Zap, highlight: true, commission: "10%", color: "from-purple-600 via-pink-600 to-amber-500", featureCount: 7 },
  { id: "enterprise", price: 149, originalPrice: 298, icon: Crown, highlight: false, commission: "10%", color: "from-amber-500 via-orange-600 to-red-600", featureCount: 8 },
];

const USPS = [
  { key: "u1", icon: Rocket },
  { key: "u2", icon: TrendingUp },
  { key: "u3", icon: Globe },
  { key: "u4", icon: Shield },
  { key: "u5", icon: BarChart3 },
  { key: "u6", icon: Clock },
];

const SPOTLIGHT = [
  { key: "ai", icon: Bot, gradient: "from-purple-600 via-pink-600 to-amber-500", iconBg: "from-purple-600 to-pink-600", bullets: 4 },
  { key: "portal", icon: LayoutDashboard, gradient: "from-pink-600 via-purple-600 to-indigo-600", iconBg: "from-pink-600 to-purple-600", bullets: 4 },
];

const ENTERPRISE_MODULES = [
  { key: "m1", icon: Contact },
  { key: "m2", icon: CalendarDays },
  { key: "m3", icon: Wallet },
  { key: "m4", icon: Radio },
  { key: "m5", icon: FileText },
  { key: "m6", icon: UserCog },
  { key: "m7", icon: CalendarCheck },
  { key: "m8", icon: Shield },
  { key: "m9", icon: BarChart3 },
  { key: "m10", icon: FolderOpen },
  { key: "m11", icon: CalendarCheck },
];

export default function AgencyPricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const handleSubscribe = async (tier: Tier) => {
    if (!isAuthenticated) {
      navigate("/auth?redirect=/agency/pricing");
      return;
    }
    if (tier === "starter") {
      navigate("/agency-apply");
      return;
    }

    setLoadingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("agency-subscribe", {
        body: { tier, locale: (i18n.language || "de").slice(0, 2), return_origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t("agencyPricing.errors.noCheckoutUrl", "No checkout URL received"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`${t("agencyPricing.errors.checkoutFailed", "Error")}: ${msg}`);
      setLoadingTier(null);
    }
  };

  return (
    <div className="dark min-h-screen bg-gradient-to-b from-[#0a0118] via-[#1a0a2e] to-[#0a0118] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.3),transparent_50%),radial-gradient(circle_at_80%_100%,rgba(236,72,153,0.3),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-amber-500 to-red-600 text-white border-0 text-sm font-bold px-4 py-1.5">
              {t("agencyPricing.hero.badge")}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              {t("agencyPricing.hero.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                {t("agencyPricing.hero.titleHighlight")}
              </span>
              <br />{t("agencyPricing.hero.titleLine2")}
            </h1>
            <p className="text-lg md:text-2xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              {t("agencyPricing.hero.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> {t("agencyPricing.hero.trustNoFee")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> {t("agencyPricing.hero.trustCancel")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> {t("agencyPricing.hero.trustInstant")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-5xl mx-auto">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-white/60 mt-1">{t(`agencyPricing.stats.${stat.key}`)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-purple-500/20 border-purple-500/40 text-purple-200">{t("agencyPricing.loops.badge")}</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t("agencyPricing.loops.titleLine1")}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t("agencyPricing.loops.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.loops.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {VIRAL_LOOPS.map((loop) => {
            const Icon = loop.icon;
            return (
              <Card key={loop.key} className="bg-white/5 backdrop-blur border-white/10 p-6 hover:scale-[1.02] transition-transform">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${loop.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <Badge className="mb-2 bg-white/10 border-white/20 text-white text-xs">{t(`agencyPricing.loops.${loop.key}.factor`)}</Badge>
                <h3 className="text-xl font-bold mb-2 text-white">{t(`agencyPricing.loops.${loop.key}.title`)}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.loops.${loop.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-amber-500/20 border-amber-500/40 text-amber-200">{t("agencyPricing.spotlight.badge")}</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t("agencyPricing.spotlight.titleLine1")}{" "}
            <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{t("agencyPricing.spotlight.titleHighlight")}</span>
            {t("agencyPricing.spotlight.titleLine2") ? <> {t("agencyPricing.spotlight.titleLine2")}</> : null}
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.spotlight.subtitle")}</p>
        </div>

        <div className="space-y-8">
          {SPOTLIGHT.map((feat, idx) => {
            const Icon = feat.icon;
            const reverse = idx % 2 === 1;
            const bullets = Array.from({ length: feat.bullets }, (_, i) => t(`agencyPricing.spotlight.${feat.key}.b${i + 1}`));
            return (
              <Card key={feat.key} className="bg-white/5 backdrop-blur border-white/10 overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-[0.08] pointer-events-none`} />
                <div className={`relative grid md:grid-cols-2 gap-8 lg:gap-12 p-8 md:p-12 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.iconBg} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <Badge className={`bg-gradient-to-r ${feat.gradient} text-white border-0 font-bold`}>
                        {t("agencyPricing.spotlight.inclusiveLabel")} {t(`agencyPricing.spotlight.${feat.key}.tier`)}
                      </Badge>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black mb-2">{t(`agencyPricing.spotlight.${feat.key}.headline`)}</h3>
                    <p className="text-base md:text-lg text-white/60 mb-4 font-semibold">{t(`agencyPricing.spotlight.${feat.key}.tagline`)}</p>
                    <p className="text-white/80 leading-relaxed mb-6">{t(`agencyPricing.spotlight.${feat.key}.desc`)}</p>
                    <ul className="space-y-2.5">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${feat.iconBg} flex items-center justify-center`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-white/90 text-sm">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${feat.gradient} p-1 shadow-2xl`}>
                      <div className="w-full h-full rounded-xl bg-[#0a0118] flex items-center justify-center relative overflow-hidden">
                        <Icon className="w-32 h-32 md:w-40 md:h-40 text-white/10" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.2),transparent_70%)]" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-white/60 uppercase tracking-widest font-bold">Live</span>
                          </div>
                          <div className="text-white font-bold text-lg">{t(`agencyPricing.spotlight.${feat.key}.headline`)}</div>
                          <div className="text-white/50 text-sm">{t(`agencyPricing.spotlight.${feat.key}.tagline`)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white border-0 font-bold px-4 py-1.5">
            <Crown className="w-3.5 h-3.5 mr-1.5 inline" />
            {t("agencyPricing.enterpriseModules.badge")}
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4">
            {t("agencyPricing.enterpriseModules.titleLine1")}{" "}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              {t("agencyPricing.enterpriseModules.titleHighlight")}
            </span>{" "}
            {t("agencyPricing.enterpriseModules.titleLine2")}
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto mb-4">
            {t("agencyPricing.enterpriseModules.subtitle")}
          </p>
          <Badge className="bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold">
            💰 {t("agencyPricing.enterpriseModules.comparison")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {ENTERPRISE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.key}
                className="group relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur border-white/10 p-5 hover:border-amber-500/40 hover:bg-white/10 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-red-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-amber-500/30 transition-all" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-base mb-1">{t(`agencyPricing.enterpriseModules.${mod.key}.title`)}</h4>
                    <p className="text-white/65 text-xs leading-relaxed">{t(`agencyPricing.enterpriseModules.${mod.key}.desc`)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
          <Card className="relative bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-red-600/20 backdrop-blur border-amber-500/40 p-5 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.3),transparent_70%)]" />
            <div className="relative text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <Bot className="w-5 h-5 text-pink-300" />
                <Zap className="w-5 h-5 text-purple-300" />
              </div>
              <div className="text-white font-black text-sm">+ KI-Verkäufer + Booking-Portal</div>
              <div className="text-white/60 text-xs mt-1">{t("agencyPricing.enterpriseModules.valueBadge")}</div>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={() => handleSubscribe("enterprise")}
            disabled={loadingTier !== null}
            size="lg"
            className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:opacity-90 text-white border-0 font-bold shadow-2xl shadow-orange-500/40 px-8"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t("agencyPricing.pricing.tiers.enterprise.cta")} – 149€/mo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-red-600 text-white border-0">{t("agencyPricing.pricing.badge")}</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t("agencyPricing.pricing.titleLine1")}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t("agencyPricing.pricing.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.pricing.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loadingTier === tier.id;
            const features = Array.from({ length: tier.featureCount }, (_, i) => t(`agencyPricing.pricing.tiers.${tier.id}.f${i + 1}`));
            return (
              <div key={tier.id} className="relative">
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-0 font-bold px-4 py-1.5 shadow-2xl shadow-pink-500/50">
                      <Star className="w-3 h-3 mr-1 fill-current" /> {t("agencyPricing.pricing.mostChosen")}
                    </Badge>
                  </div>
                )}
                <Card className={`relative h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur border-white/10 p-8 overflow-hidden ${tier.highlight ? "ring-2 ring-pink-500/50 shadow-2xl shadow-pink-500/20 scale-[1.02]" : ""}`}>
                  {tier.highlight && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-amber-500/10 pointer-events-none" />
                  )}
                  <div className="relative">
                    <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} items-center justify-center mb-5`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-1">{t(`agencyPricing.pricing.tiers.${tier.id}.name`)}</h3>
                    <p className="text-white/60 text-sm mb-6">{t(`agencyPricing.pricing.tiers.${tier.id}.tagline`)}</p>

                    <div className="mb-6">
                      {tier.originalPrice > 0 && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white/40 line-through text-xl font-semibold">{tier.originalPrice}€</span>
                          <Badge className="bg-red-500/20 border-red-500/40 text-red-200 text-xs font-bold">-50%</Badge>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                          {tier.price === 0 ? "0" : tier.price}
                        </span>
                        <span className="text-2xl font-bold text-white/80">€</span>
                      </div>
                      <div className="text-sm text-white/50 mt-1">{t(`agencyPricing.pricing.tiers.${tier.id}.billing`)}</div>
                    </div>

                    <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">{t("agencyPricing.pricing.commissionLabel")}</div>
                      <div className="text-2xl font-black text-white">{tier.commission}</div>
                      <div className="text-xs text-white/50">{t("agencyPricing.pricing.perBooking")}</div>
                    </div>

                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isLoading}
                      size="lg"
                      className={`w-full mb-6 font-bold ${tier.highlight
                        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white border-0 shadow-lg shadow-pink-500/30"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      {isLoading ? t("agencyPricing.pricing.loading") : t(`agencyPricing.pricing.tiers.${tier.id}.cta`)}
                      {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>

                    <ul className="space-y-3">
                      {features.map((f, i) => {
                        const highlight = i >= features.length - 2;
                        return (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${highlight ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-white/10"}`}>
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                            <span className={highlight ? "text-white font-semibold" : "text-white/80"}>{f}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-white/60 text-sm">{t("agencyPricing.pricing.fineprint")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-pink-500/20 border-pink-500/40 text-pink-200">{t("agencyPricing.usps.badge")}</Badge>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t("agencyPricing.usps.titleLine1")}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t("agencyPricing.usps.titleHighlight")}</span>
            {t("agencyPricing.usps.titleLine2") ? <> {t("agencyPricing.usps.titleLine2")}</> : null}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USPS.map((usp) => {
            const Icon = usp.icon;
            return (
              <Card key={usp.key} className="bg-white/5 backdrop-blur border-white/10 p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{t(`agencyPricing.usps.${usp.key}.title`)}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.usps.${usp.key}.desc`)}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <Card className="bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-amber-500/20 backdrop-blur border-white/20 p-10 md:p-16 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3),transparent_70%)]" />
          <div className="relative">
            <Badge className="mb-6 bg-white/20 border-white/30 text-white">{t("agencyPricing.cta.badge")}</Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              {t("agencyPricing.cta.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{t("agencyPricing.cta.titleHighlight")}</span>{t("agencyPricing.cta.titleLine2")}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">{t("agencyPricing.cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => handleSubscribe("professional")}
                disabled={loadingTier !== null}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white border-0 font-bold shadow-2xl shadow-pink-500/50"
              >
                {t("agencyPricing.cta.primary")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/agency-apply")}
                className="bg-white/5 border-white/30 text-white hover:bg-white/10"
              >
                {t("agencyPricing.cta.secondary")}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <h3 className="text-2xl md:text-3xl font-black mb-8 text-center">{t("agencyPricing.faq.title")}</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-white/5 backdrop-blur border-white/10 p-6">
              <h4 className="font-bold mb-2 text-white">{t(`agencyPricing.faq.q${i}`)}</h4>
              <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.faq.a${i}`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
