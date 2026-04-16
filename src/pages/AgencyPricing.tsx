import { useState, useEffect } from "react";
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
  CalendarDays, Contact, FolderOpen, UserCog, ChevronRight,
} from "lucide-react";

type Tier = "starter" | "professional" | "enterprise";

const IMG = {
  hero: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80",
  viral: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
  ai: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  booking: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  enterprise: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=80",
  cta: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1800&q=80",
};

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

const TIERS: Array<{ id: Tier; price: number; originalPrice: number; icon: typeof Sparkles; highlight: boolean; commission: string; color: string; ringColor: string; featureCount: number; }> = [
  { id: "starter", price: 0, originalPrice: 0, icon: Sparkles, highlight: false, commission: "25%", color: "from-slate-600 to-slate-800", ringColor: "ring-white/5", featureCount: 5 },
  { id: "professional", price: 49, originalPrice: 98, icon: Zap, highlight: true, commission: "10%", color: "from-purple-600 via-pink-600 to-amber-500", ringColor: "ring-pink-500/50", featureCount: 7 },
  { id: "enterprise", price: 149, originalPrice: 298, icon: Crown, highlight: false, commission: "10%", color: "from-amber-500 via-orange-600 to-red-600", ringColor: "ring-amber-500/30", featureCount: 8 },
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
  { key: "ai", icon: Bot, image: IMG.ai, gradient: "from-purple-600 via-pink-600 to-amber-500", iconBg: "from-purple-600 to-pink-600", bullets: 4 },
  { key: "portal", icon: LayoutDashboard, image: IMG.booking, gradient: "from-pink-600 via-purple-600 to-indigo-600", iconBg: "from-pink-600 to-purple-600", bullets: 4 },
];

const ENTERPRISE_MODULES = [
  { key: "m1", icon: Contact }, { key: "m2", icon: CalendarDays }, { key: "m3", icon: Wallet },
  { key: "m4", icon: Radio }, { key: "m5", icon: FileText }, { key: "m6", icon: UserCog },
  { key: "m7", icon: CalendarCheck }, { key: "m8", icon: Shield }, { key: "m9", icon: BarChart3 },
  { key: "m10", icon: FolderOpen }, { key: "m11", icon: CalendarCheck },
];

export default function AgencyPricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      if (data?.url) window.location.href = data.url;
      else throw new Error(t("agencyPricing.errors.noCheckoutUrl", "No checkout URL received"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`${t("agencyPricing.errors.checkoutFailed", "Error")}: ${msg}`);
      setLoadingTier(null);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0a0118] text-white font-jakarta">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        .font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-floaty { animation: floaty 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .animate-floaty, .animate-pulse-glow, .shimmer { animation: none; } }
      `}</style>

      <section className="relative overflow-hidden min-h-[100vh] flex items-center">
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118]/80 via-[#0a0118]/90 to-[#0a0118]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.35),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.25),transparent_55%)]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex mb-8 animate-floaty">
              <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white border-0 text-xs md:text-sm font-bold px-5 py-2 rounded-full shadow-2xl shadow-amber-500/40">
                {t("agencyPricing.hero.badge")}
              </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[1] mb-8">
              <span className="block">{t("agencyPricing.hero.titleLine1")}</span>
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                {t("agencyPricing.hero.titleHighlight")}
              </span>
              <span className="block mt-2 text-white/90 text-4xl md:text-5xl lg:text-6xl">{t("agencyPricing.hero.titleLine2")}</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/80 mb-10 leading-relaxed max-w-3xl mx-auto font-light">
              {t("agencyPricing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Button
                size="lg"
                onClick={() => handleSubscribe("professional")}
                disabled={loadingTier !== null}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:shadow-[0_16px_48px_rgba(236,72,153,0.6)] transition-all hover:scale-[1.03] text-white border-0 font-bold text-base h-14 px-8 rounded-xl shadow-2xl shadow-pink-500/50 cursor-pointer"
              >
                <Zap className="w-5 h-5 mr-2" />
                {t("agencyPricing.cta.primary")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/agency-apply")}
                className="bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/15 h-14 px-8 rounded-xl transition-all cursor-pointer"
              >
                {t("agencyPricing.cta.secondary")}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustNoFee")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustCancel")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustInstant")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-20 max-w-5xl mx-auto">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="group relative text-center p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 hover:bg-white/10 transition-all cursor-default overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Icon className="w-6 h-6 mx-auto mb-3 text-purple-400 group-hover:text-pink-400 transition-colors" />
                    <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm text-white/60 mt-2 font-medium">{t(`agencyPricing.stats.${stat.key}`)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest font-semibold animate-pulse-glow">
          ↓ SCROLL
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.viral} alt="" className="w-full h-full object-cover opacity-15" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118] via-[#0a0118]/95 to-[#0a0118]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-purple-500/20 border border-purple-500/40 text-purple-200 px-4 py-1 font-bold tracking-wider">
              {t("agencyPricing.loops.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              {t("agencyPricing.loops.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("agencyPricing.loops.titleHighlight")}
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.loops.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {VIRAL_LOOPS.map((loop, i) => {
              const Icon = loop.icon;
              return (
                <Card
                  key={loop.key}
                  className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:scale-[1.02] hover:border-pink-400/40 transition-all cursor-default overflow-hidden group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent blur-3xl rounded-full group-hover:from-pink-500/30 transition-all" />
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${loop.color} flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20 group-hover:shadow-pink-500/40 transition-shadow`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="mb-3 bg-white/10 border border-white/20 text-white text-xs font-mono">
                      {t(`agencyPricing.loops.${loop.key}.factor`)}
                    </Badge>
                    <h3 className="text-2xl font-black mb-3 text-white">{t(`agencyPricing.loops.${loop.key}.title`)}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.loops.${loop.key}.desc`)}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-1 font-bold tracking-wider">
              {t("agencyPricing.spotlight.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              {t("agencyPricing.spotlight.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {t("agencyPricing.spotlight.titleHighlight")}
              </span>
              {t("agencyPricing.spotlight.titleLine2") ? <> {t("agencyPricing.spotlight.titleLine2")}</> : null}
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.spotlight.subtitle")}</p>
          </div>

          <div className="space-y-10">
            {SPOTLIGHT.map((feat, idx) => {
              const Icon = feat.icon;
              const reverse = idx % 2 === 1;
              const bullets = Array.from({ length: feat.bullets }, (_, i) => t(`agencyPricing.spotlight.${feat.key}.b${i + 1}`));
              return (
                <Card key={feat.key} className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden relative group hover:border-white/20 transition-all">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none`} />
                  <div className={`relative grid md:grid-cols-2 gap-10 lg:gap-14 p-8 md:p-14 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.iconBg} flex items-center justify-center shadow-xl shadow-pink-500/30`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge className={`bg-gradient-to-r ${feat.gradient} text-white border-0 font-bold px-3 py-1`}>
                          {t("agencyPricing.spotlight.inclusiveLabel")} {t(`agencyPricing.spotlight.${feat.key}.tier`)}
                        </Badge>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-2 leading-tight">{t(`agencyPricing.spotlight.${feat.key}.headline`)}</h3>
                      <p className="text-base md:text-lg text-white/60 mb-5 font-semibold">{t(`agencyPricing.spotlight.${feat.key}.tagline`)}</p>
                      <p className="text-white/85 leading-relaxed mb-7 text-base md:text-lg">{t(`agencyPricing.spotlight.${feat.key}.desc`)}</p>
                      <ul className="space-y-3">
                        {bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${feat.iconBg} flex items-center justify-center shadow-md`}>
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            </div>
                            <span className="text-white/90 text-sm md:text-base">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative">
                      <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow`}>
                        <img src={feat.image} alt={t(`agencyPricing.spotlight.${feat.key}.headline`)} className="w-full h-full object-cover" loading="lazy" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} mix-blend-multiply opacity-70`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-white/90 uppercase tracking-widest font-bold">Live</span>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.iconBg} flex items-center justify-center backdrop-blur-md`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-black text-lg">{t(`agencyPricing.spotlight.${feat.key}.headline`)}</div>
                              <div className="text-white/70 text-xs">{t(`agencyPricing.spotlight.${feat.key}.tagline`)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`absolute -inset-2 bg-gradient-to-br ${feat.gradient} blur-3xl opacity-30 -z-10`} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.enterprise} alt="" className="w-full h-full object-cover opacity-10" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118] via-[#0a0118]/90 to-[#0a0118]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white border-0 font-bold px-5 py-2 rounded-full shadow-2xl shadow-amber-500/30">
              <Crown className="w-4 h-4 mr-2 inline" />
              {t("agencyPricing.enterpriseModules.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 leading-[1.05]">
              {t("agencyPricing.enterpriseModules.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
                {t("agencyPricing.enterpriseModules.titleHighlight")}
              </span>{" "}
              {t("agencyPricing.enterpriseModules.titleLine2")}
            </h2>
            <p className="text-lg md:text-xl text-white/75 max-w-3xl mx-auto mb-6">
              {t("agencyPricing.enterpriseModules.subtitle")}
            </p>
            <Badge className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 font-bold px-4 py-1.5">
              <Wallet className="w-3.5 h-3.5 mr-1.5 inline" />
              {t("agencyPricing.enterpriseModules.comparison")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {ENTERPRISE_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Card
                  key={mod.key}
                  className="group relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl border border-white/10 p-5 hover:border-amber-400/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all overflow-hidden cursor-default"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-red-500/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-amber-500/30 transition-all" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-base mb-1 truncate">{t(`agencyPricing.enterpriseModules.${mod.key}.title`)}</h4>
                      <p className="text-white/65 text-xs leading-relaxed">{t(`agencyPricing.enterpriseModules.${mod.key}.desc`)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
            <Card className="relative bg-gradient-to-br from-amber-500/25 via-orange-600/25 to-red-600/25 backdrop-blur-xl border border-amber-500/50 p-5 flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.4),transparent_70%)] animate-pulse-glow" />
              <div className="relative text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
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
              className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:shadow-[0_16px_48px_rgba(245,158,11,0.5)] hover:scale-[1.03] transition-all text-white border-0 font-bold h-14 px-8 rounded-xl shadow-2xl shadow-orange-500/40 cursor-pointer"
            >
              <Crown className="w-5 h-5 mr-2" />
              {t("agencyPricing.pricing.tiers.enterprise.cta")} – 149€/mo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-gradient-to-r from-amber-500 to-red-600 text-white border-0 font-bold px-5 py-2 rounded-full shadow-xl shadow-amber-500/30">
              {t("agencyPricing.pricing.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 leading-[1.05]">
              {t("agencyPricing.pricing.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("agencyPricing.pricing.titleHighlight")}
              </span>
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
                      <Badge className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-0 font-bold px-5 py-1.5 shadow-2xl shadow-pink-500/60 rounded-full">
                        <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                        {t("agencyPricing.pricing.mostChosen")}
                      </Badge>
                    </div>
                  )}
                  <Card className={`relative h-full bg-gradient-to-b from-white/8 to-white/3 backdrop-blur-xl border border-white/10 p-8 overflow-hidden transition-all hover:-translate-y-1 ring-1 ${tier.ringColor} ${tier.highlight ? "shadow-2xl shadow-pink-500/30 scale-[1.04] md:scale-[1.06]" : "hover:shadow-xl hover:shadow-purple-500/20"}`}>
                    {tier.highlight && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-amber-500/15 pointer-events-none" />
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent shimmer" />
                      </>
                    )}
                    <div className="relative">
                      <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} items-center justify-center mb-5 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-1">{t(`agencyPricing.pricing.tiers.${tier.id}.name`)}</h3>
                      <p className="text-white/60 text-sm mb-6">{t(`agencyPricing.pricing.tiers.${tier.id}.tagline`)}</p>

                      <div className="mb-6 pb-6 border-b border-white/10">
                        {tier.originalPrice > 0 && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-white/40 line-through text-xl font-semibold">{tier.originalPrice}€</span>
                            <Badge className="bg-red-500/25 border border-red-500/50 text-red-200 text-xs font-bold">-50%</Badge>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-6xl md:text-7xl font-black bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent leading-none">
                            {tier.price === 0 ? "0" : tier.price}
                          </span>
                          <span className="text-3xl font-bold text-white/80">€</span>
                        </div>
                        <div className="text-sm text-white/50 mt-2 font-medium">{t(`agencyPricing.pricing.tiers.${tier.id}.billing`)}</div>
                      </div>

                      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white/50 uppercase tracking-wider font-bold">{t("agencyPricing.pricing.commissionLabel")}</div>
                          <div className="text-xs text-white/50">{t("agencyPricing.pricing.perBooking")}</div>
                        </div>
                        <div className={`text-3xl font-black ${tier.id === "starter" ? "text-white/90" : "bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"}`}>
                          {tier.commission}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={isLoading}
                        size="lg"
                        className={`w-full mb-6 font-bold h-12 rounded-xl cursor-pointer transition-all ${tier.highlight
                          ? "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:shadow-[0_12px_32px_rgba(236,72,153,0.55)] hover:scale-[1.02] text-white border-0 shadow-lg shadow-pink-500/40"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/40"
                        }`}
                      >
                        {isLoading ? t("agencyPricing.pricing.loading") : (<><span>{t(`agencyPricing.pricing.tiers.${tier.id}.cta`)}</span><ArrowRight className="w-4 h-4 ml-2" /></>)}
                      </Button>

                      <ul className="space-y-3">
                        {features.map((f, i) => {
                          const highlight = i >= features.length - 2;
                          return (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${highlight ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-pink-500/30" : "bg-white/10"}`}>
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                              <span className={highlight ? "text-white font-semibold" : "text-white/85"}>{f}</span>
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
          <div className="mt-12 text-center">
            <p className="text-white/55 text-sm">{t("agencyPricing.pricing.fineprint")}</p>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-5 bg-pink-500/20 border border-pink-500/40 text-pink-200 px-4 py-1 font-bold tracking-wider">
              {t("agencyPricing.usps.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              {t("agencyPricing.usps.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t("agencyPricing.usps.titleHighlight")}</span>
              {t("agencyPricing.usps.titleLine2") ? <> {t("agencyPricing.usps.titleLine2")}</> : null}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USPS.map((usp) => {
              const Icon = usp.icon;
              return (
                <Card key={usp.key} className="group bg-white/5 backdrop-blur-xl border border-white/10 p-7 hover:bg-white/10 hover:border-pink-400/30 hover:-translate-y-1 transition-all cursor-default">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:shadow-pink-500/40 transition-shadow group-hover:scale-110">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2">{t(`agencyPricing.usps.${usp.key}.title`)}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.usps.${usp.key}.desc`)}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Card className="relative overflow-hidden border border-white/20">
            <div className="absolute inset-0">
              <img src={IMG.cta} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-amber-900/80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.4),transparent_70%)]" />
            </div>
            <div className="relative p-10 md:p-16 text-center">
              <Badge className="mb-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5">
                {t("agencyPricing.cta.badge")}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
                {t("agencyPricing.cta.titleLine1")}{" "}
                <span className="bg-gradient-to-r from-amber-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                  {t("agencyPricing.cta.titleHighlight")}
                </span>{t("agencyPricing.cta.titleLine2")}
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">{t("agencyPricing.cta.subtitle")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => handleSubscribe("professional")}
                  disabled={loadingTier !== null}
                  className="bg-white hover:bg-white/90 text-purple-900 font-bold h-14 px-8 rounded-xl shadow-2xl shadow-black/40 hover:scale-[1.03] transition-all cursor-pointer"
                >
                  {t("agencyPricing.cta.primary")} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/agency-apply")}
                  className="bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20 h-14 px-8 rounded-xl cursor-pointer"
                >
                  {t("agencyPricing.cta.secondary")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-3xl md:text-5xl font-black mb-10 text-center leading-tight">{t("agencyPricing.faq.title")}</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <details
                key={i}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 open:bg-white/10 open:border-white/20 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                  <h4 className="font-bold text-white text-base md:text-lg">{t(`agencyPricing.faq.q${i}`)}</h4>
                  <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-white/75 text-sm md:text-base leading-relaxed mt-4 pt-4 border-t border-white/10">{t(`agencyPricing.faq.a${i}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          showStickyCta ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        <Button
          onClick={() => handleSubscribe("professional")}
          disabled={loadingTier !== null}
          size="lg"
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:shadow-[0_16px_48px_rgba(236,72,153,0.7)] hover:scale-[1.05] transition-all text-white border-0 font-bold h-14 px-6 rounded-xl shadow-2xl shadow-pink-500/60 cursor-pointer"
        >
          <Zap className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">{t("agencyPricing.cta.primary")}</span>
          <span className="sm:hidden">49€/mo</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
