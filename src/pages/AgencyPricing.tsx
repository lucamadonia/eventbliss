import { useState, useEffect, useRef, useCallback } from "react";
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
  CalendarDays, Contact, FolderOpen, UserCog, ChevronRight, Quote, Award, Play,
} from "lucide-react";

type Tier = "starter" | "professional" | "enterprise";

const IMG = {
  // Dramatic crowd with stage lights — emotional hook
  hero: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2200&q=85",
  // Celebration/confetti — party energy
  viral: "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=1800&q=85",
  // Modern dashboard/analytics
  ai: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=85",
  // Elegant event setup with sparklers
  booking: "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=1400&q=85",
  // High-end gala / venue
  enterprise: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=2000&q=85",
  // Confetti explosion finale
  cta: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2000&q=85",
  // Awards / trophy vibe
  awards: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1800&q=85",
};

const PORTRAITS = {
  anna: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=85",
  marco: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=85",
  sophie: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=85",
};

const STATS = [
  { value: 17, suffix: "", key: "games", icon: PartyPopper },
  { value: 203, suffix: "", key: "ideas", icon: Sparkles },
  { value: 170, suffix: "+", key: "agencies", icon: Users },
  { value: 10, suffix: "", key: "languages", icon: Globe },
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

const TESTIMONIALS = [
  {
    key: "t1",
    image: PORTRAITS.anna,
    nameDefault: "Anna Richter",
    roleDefault: "Gründerin · Berlin Events Co.",
    tierLabel: "Professional",
    tierColor: "from-purple-600 to-pink-600",
    quoteDefault: "In 3 Monaten 47 neue Bookings nur über EventBliss — ohne einen einzigen Euro in Ads. Der KI-Planner empfiehlt uns automatisch bei passenden Events.",
    metricValue: "47",
    metricLabelDefault: "neue Bookings",
  },
  {
    key: "t2",
    image: PORTRAITS.marco,
    nameDefault: "Marco Silveira",
    roleDefault: "Managing Director · Lisboa Party Crew",
    tierLabel: "Enterprise",
    tierColor: "from-amber-500 to-red-600",
    quoteDefault: "Wir haben unser altes CRM komplett abgelöst. Alles — Kalender, Kunden, Abrechnung, Team — an einem Ort. Unser Team ist 40% schneller.",
    metricValue: "+40%",
    metricLabelDefault: "Team-Speed",
  },
  {
    key: "t3",
    image: PORTRAITS.sophie,
    nameDefault: "Sophie Laurent",
    roleDefault: "Event-Planerin · Paris Celebrations",
    tierLabel: "Professional",
    tierColor: "from-pink-600 to-rose-500",
    quoteDefault: "Die TV-Screens auf unseren Events bringen allein 8–12 Neukunden pro Party. Völlig passiv. Das ist Marketing, das sich selbst bezahlt.",
    metricValue: "10×",
    metricLabelDefault: "organisches Wachstum",
  },
];

const TRUST_BAR = [
  { labelDefault: "10 Sprachen", icon: Globe },
  { labelDefault: "170+ Partner-Agenturen", icon: Users },
  { labelDefault: "0€ Setup-Gebühr", icon: Shield },
  { labelDefault: "Live in 60 Sekunden", icon: Zap },
  { labelDefault: "SSL-gesichert & DSGVO", icon: Shield },
  { labelDefault: "24/7 Support", icon: Clock },
  { labelDefault: "Stripe Connect integriert", icon: Wallet },
  { labelDefault: "iOS + Android + Web", icon: Rocket },
];

// Animated number counter with scroll trigger
function useAnimatedCounter(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) { setValue(target); return; }
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { ref, value };
}

function AnimatedStat({ stat, label }: { stat: typeof STATS[number]; label: string }) {
  const Icon = stat.icon;
  const { ref, value } = useAnimatedCounter(stat.value);
  return (
    <div
      ref={ref}
      className="group relative text-center p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 hover:bg-white/10 transition-all cursor-default overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <Icon className="w-6 h-6 mx-auto mb-3 text-purple-400 group-hover:text-pink-400 transition-colors" />
        <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white via-purple-200 to-pink-300 bg-clip-text text-transparent tabular-nums">
          {value}{stat.suffix}
        </div>
        <div className="text-xs md:text-sm text-white/60 mt-2 font-medium">{label}</div>
      </div>
    </div>
  );
}

// Scroll-reveal wrapper
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {children}
    </div>
  );
}

export default function AgencyPricing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
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

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="dark min-h-screen bg-[#070012] text-white font-jakarta overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');
        .font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .font-serif-display { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; letter-spacing: -0.01em; }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes gridPan { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
        @keyframes kenBurns { 0% { transform: scale(1.05) translate(0,0); } 50% { transform: scale(1.12) translate(-1%, -1%); } 100% { transform: scale(1.05) translate(0,0); } }
        .animate-floaty { animation: floaty 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
        .marquee-track { animation: marquee 40s linear infinite; }
        .ken-burns { animation: kenBurns 22s ease-in-out infinite; }
        .grid-pan { background-image: linear-gradient(to right, rgba(168,85,247,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.07) 1px, transparent 1px); background-size: 60px 60px; animation: gridPan 18s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-floaty, .animate-pulse-glow, .shimmer, .marquee-track, .ken-burns, .grid-pan { animation: none; }
        }
      `}</style>

      {/* ═══════ HERO ═══════ */}
      <section
        className="relative overflow-hidden min-h-[100vh] flex items-center"
        onMouseMove={handleMove}
      >
        <div className="absolute inset-0">
          <img src={IMG.hero} alt="" className="w-full h-full object-cover ken-burns" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070012]/70 via-[#070012]/88 to-[#070012]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.38),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.28),transparent_55%)]" />
          {/* Mouse-tracking spotlight */}
          <div
            className="absolute inset-0 pointer-events-none transition-[background] duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(236,72,153,0.18), transparent 50%)`,
            }}
          />
          <div className="absolute inset-0 grid-pan opacity-40" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex mb-8 animate-floaty">
              <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white border-0 text-xs md:text-sm font-bold px-5 py-2 rounded-full shadow-2xl shadow-amber-500/40">
                {t("agencyPricing.hero.badge")}
              </Badge>
            </div>
            {/* Award ribbon */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/15">
              <Award className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold text-white/80 tracking-wider uppercase">
                {t("agencyPricing.hero.awardLine", "Best-in-Class Event Platform · 2026")}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[1] mb-8">
              <span className="block">{t("agencyPricing.hero.titleLine1")}</span>
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                {t("agencyPricing.hero.titleHighlight")}
              </span>
              <span className="block mt-2 text-white/90 text-4xl md:text-5xl lg:text-6xl font-serif-display">{t("agencyPricing.hero.titleLine2")}</span>
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
                onClick={scrollToPricing}
                className="group bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/15 h-14 px-8 rounded-xl transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 mr-2 text-pink-300 group-hover:scale-110 transition-transform" />
                {t("agencyPricing.hero.seePricing", "Preise ansehen")}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustNoFee")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustCancel")}</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" />{t("agencyPricing.hero.trustInstant")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-20 max-w-5xl mx-auto">
            {STATS.map((stat) => (
              <AnimatedStat key={stat.key} stat={stat} label={t(`agencyPricing.stats.${stat.key}`)} />
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest font-semibold animate-pulse-glow">
          ↓ SCROLL
        </div>
      </section>

      {/* ═══════ TRUST MARQUEE ═══════ */}
      <section className="relative py-10 border-y border-white/5 bg-gradient-to-b from-[#070012] via-[#0a0118] to-[#070012] overflow-hidden">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
          <div className="flex marquee-track shrink-0">
            {[...TRUST_BAR, ...TRUST_BAR].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-8 shrink-0">
                  <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-sm font-semibold text-white/70 whitespace-nowrap">
                    {t(`agencyPricing.trustBar.${i % TRUST_BAR.length}`, item.labelDefault)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ VIRAL LOOPS ═══════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.viral} alt="" className="w-full h-full object-cover opacity-20 ken-burns" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070012] via-[#070012]/95 to-[#070012]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
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
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {VIRAL_LOOPS.map((loop, i) => {
              const Icon = loop.icon;
              return (
                <Reveal key={loop.key} delay={i * 120}>
                  <Card className="relative h-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 hover:scale-[1.02] hover:border-pink-400/40 transition-all cursor-default overflow-hidden group">
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ SPOTLIGHT FEATURES ═══════ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-5 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-1 font-bold tracking-wider">
                {t("agencyPricing.spotlight.badge")}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                {t("agencyPricing.spotlight.titleLine1")}{" "}
                <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent font-serif-display">
                  {t("agencyPricing.spotlight.titleHighlight")}
                </span>
                {t("agencyPricing.spotlight.titleLine2") ? <> {t("agencyPricing.spotlight.titleLine2")}</> : null}
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.spotlight.subtitle")}</p>
            </div>
          </Reveal>

          <div className="space-y-10">
            {SPOTLIGHT.map((feat, idx) => {
              const Icon = feat.icon;
              const reverse = idx % 2 === 1;
              const bullets = Array.from({ length: feat.bullets }, (_, i) => t(`agencyPricing.spotlight.${feat.key}.b${i + 1}`));
              return (
                <Reveal key={feat.key} delay={idx * 100}>
                  <Card className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden relative group hover:border-white/20 transition-all">
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.awards} alt="" className="w-full h-full object-cover opacity-10" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070012] via-[#0a0118] to-[#070012]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-1 font-bold tracking-wider">
                {t("agencyPricing.testimonials.badge", "VON AGENTUREN GEWÄHLT")}
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                {t("agencyPricing.testimonials.titleLine1", "Warum 170+ Agenturen")}{" "}
                <span className="font-serif-display bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  {t("agencyPricing.testimonials.titleHighlight", "nicht mehr ohne uns")}
                </span>{" "}
                {t("agencyPricing.testimonials.titleLine2", "arbeiten")}
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                {t("agencyPricing.testimonials.subtitle", "Echte Zahlen, echte Stimmen — nach ihrem ersten Quartal mit EventBliss.")}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS.map((tm, i) => (
              <Reveal key={tm.key} delay={i * 130}>
                <Card className="relative h-full bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-8 hover:border-white/25 hover:-translate-y-1 transition-all overflow-hidden group">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/5 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                  <Quote className="absolute top-6 right-6 w-10 h-10 text-white/10" strokeWidth={2.5} />

                  {/* Portrait + identity */}
                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className={`absolute -inset-0.5 bg-gradient-to-br ${tm.tierColor} rounded-full opacity-80 blur-[2px]`} />
                      <img
                        src={tm.image}
                        alt={t(`agencyPricing.testimonials.${tm.key}.name`, tm.nameDefault)}
                        className="relative w-14 h-14 rounded-full object-cover border-2 border-[#0a0118]"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-white text-base truncate">
                        {t(`agencyPricing.testimonials.${tm.key}.name`, tm.nameDefault)}
                      </div>
                      <div className="text-xs text-white/60 truncate">
                        {t(`agencyPricing.testimonials.${tm.key}.role`, tm.roleDefault)}
                      </div>
                    </div>
                  </div>

                  {/* 5 stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <Star key={n} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="relative text-white/90 text-sm md:text-[15px] leading-relaxed mb-6">
                    "{t(`agencyPricing.testimonials.${tm.key}.quote`, tm.quoteDefault)}"
                  </p>

                  {/* Metric + tier badge */}
                  <div className="relative flex items-end justify-between pt-5 border-t border-white/10">
                    <div>
                      <div className={`text-3xl font-black bg-gradient-to-br ${tm.tierColor} bg-clip-text text-transparent leading-none`}>
                        {tm.metricValue}
                      </div>
                      <div className="text-[11px] text-white/55 font-semibold mt-1 uppercase tracking-wider">
                        {t(`agencyPricing.testimonials.${tm.key}.metricLabel`, tm.metricLabelDefault)}
                      </div>
                    </div>
                    <Badge className={`bg-gradient-to-r ${tm.tierColor} text-white border-0 font-bold px-3 py-1 text-[10px]`}>
                      {tm.tierLabel}
                    </Badge>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ENTERPRISE MODULES ═══════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG.enterprise} alt="" className="w-full h-full object-cover opacity-10 ken-burns" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070012] via-[#070012]/90 to-[#070012]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white border-0 font-bold px-5 py-2 rounded-full shadow-2xl shadow-amber-500/30">
                <Crown className="w-4 h-4 mr-2 inline" />
                {t("agencyPricing.enterpriseModules.badge")}
              </Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 leading-[1.05]">
                {t("agencyPricing.enterpriseModules.titleLine1")}{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent font-serif-display">
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
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {ENTERPRISE_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Reveal key={mod.key} delay={i * 40}>
                  <Card className="group relative h-full bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl border border-white/10 p-5 hover:border-amber-400/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all overflow-hidden cursor-default">
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
                </Reveal>
              );
            })}
            <Reveal delay={ENTERPRISE_MODULES.length * 40}>
              <Card className="relative h-full bg-gradient-to-br from-amber-500/25 via-orange-600/25 to-red-600/25 backdrop-blur-xl border border-amber-500/50 p-5 flex items-center justify-center overflow-hidden group">
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
            </Reveal>
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

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="relative py-24 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-5 bg-gradient-to-r from-amber-500 to-red-600 text-white border-0 font-bold px-5 py-2 rounded-full shadow-xl shadow-amber-500/30">
                {t("agencyPricing.pricing.badge")}
              </Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 leading-[1.05]">
                {t("agencyPricing.pricing.titleLine1")}{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-serif-display">
                  {t("agencyPricing.pricing.titleHighlight")}
                </span>
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">{t("agencyPricing.pricing.subtitle")}</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {TIERS.map((tier, tierIdx) => {
              const Icon = tier.icon;
              const isLoading = loadingTier === tier.id;
              const features = Array.from({ length: tier.featureCount }, (_, i) => t(`agencyPricing.pricing.tiers.${tier.id}.f${i + 1}`));
              return (
                <Reveal key={tier.id} delay={tierIdx * 120}>
                  <div className="relative">
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
                </Reveal>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <p className="text-white/55 text-sm">{t("agencyPricing.pricing.fineprint")}</p>
          </div>
        </div>
      </section>

      {/* ═══════ USPs ═══════ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
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
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USPS.map((usp, i) => {
              const Icon = usp.icon;
              return (
                <Reveal key={usp.key} delay={i * 80}>
                  <Card className="group h-full bg-white/5 backdrop-blur-xl border border-white/10 p-7 hover:bg-white/10 hover:border-pink-400/30 hover:-translate-y-1 transition-all cursor-default">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:shadow-pink-500/40 transition-shadow group-hover:scale-110">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-black mb-2">{t(`agencyPricing.usps.${usp.key}.title`)}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{t(`agencyPricing.usps.${usp.key}.desc`)}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <Card className="relative overflow-hidden border border-white/20">
              <div className="absolute inset-0">
                <img src={IMG.cta} alt="" className="w-full h-full object-cover ken-burns" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-amber-900/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.4),transparent_70%)]" />
              </div>
              <div className="relative p-10 md:p-16 text-center">
                <Badge className="mb-6 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5">
                  {t("agencyPricing.cta.badge")}
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
                  {t("agencyPricing.cta.titleLine1")}{" "}
                  <span className="bg-gradient-to-r from-amber-200 via-pink-200 to-purple-200 bg-clip-text text-transparent font-serif-display">
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
          </Reveal>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal>
            <h3 className="text-3xl md:text-5xl font-black mb-10 text-center leading-tight">{t("agencyPricing.faq.title")}</h3>
          </Reveal>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Reveal key={i} delay={i * 60}>
                <details className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 open:bg-white/10 open:border-white/20 transition-all">
                  <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                    <h4 className="font-bold text-white text-base md:text-lg">{t(`agencyPricing.faq.q${i}`)}</h4>
                    <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-white/75 text-sm md:text-base leading-relaxed mt-4 pt-4 border-t border-white/10">{t(`agencyPricing.faq.a${i}`)}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STICKY CTA ═══════ */}
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
