import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Wallet,
  MessageSquare,
  Calendar,
  Bot,
  ChevronDown,
  Check,
  Crown,
  Building2,
  FileEdit,
  Download,
  Globe,
  LayoutDashboard,
  ClipboardList,
  Play,
  Pause,
  MessageSquareHeart,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { HoloFrame } from "@/components/ui/HoloFrame";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { AuroraText } from "@/components/ui/AuroraText";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CookieBanner } from "@/components/landing/CookieBanner";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { FeaturesBento } from "@/components/landing/sections/FeaturesBento";
import { HowItWorksTimeline } from "@/components/landing/sections/HowItWorksTimeline";
import { EventTypesOrbit } from "@/components/landing/sections/EventTypesOrbit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.png";
import featurePlanning from "@/assets/feature-planning.png";
import featureVoting from "@/assets/feature-voting.png";
import multiDeviceMockup from "@/assets/multi-device-mockup.png";
import agenciesHero from "@/assets/agencies-hero.webp";

import { DemoDashboard } from "@/components/landing/demos/DemoDashboard";
import { DemoExpenses } from "@/components/landing/demos/DemoExpenses";
import { DemoAIAssistant } from "@/components/landing/demos/DemoAIAssistant";
import { DemoSurvey } from "@/components/landing/demos/DemoSurvey";
import { DemoAgencies } from "@/components/landing/demos/DemoAgencies";
import { DemoPlanner } from "@/components/landing/demos/DemoPlanner";

const demoComponents: Record<string, React.ComponentType> = {
  dashboard: DemoDashboard,
  expenses: DemoExpenses,
  ai: DemoAIAssistant,
  survey: DemoSurvey,
  agencies: DemoAgencies,
  planner: DemoPlanner,
};

const demoFeatures = [
  { id: "dashboard", icon: LayoutDashboard, gradient: "from-primary to-accent" },
  { id: "expenses", icon: Wallet, gradient: "from-accent to-neon-pink" },
  { id: "planner", icon: Calendar, gradient: "from-neon-pink to-primary" },
  { id: "ai", icon: Bot, gradient: "from-neon-cyan to-primary" },
  { id: "survey", icon: ClipboardList, gradient: "from-neon-pink to-warning" },
  { id: "agencies", icon: Building2, gradient: "from-success to-accent" },
];

const AUTO_ROTATE_INTERVAL = 4000;

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeDemo, setActiveDemo] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoFeatures.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleDemoClick = (index: number) => {
    setActiveDemo(index);
    setIsAutoPlaying(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        message: feedbackText,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
      });
      if (error) throw error;
      setFeedbackSent(true);
      setFeedbackText("");
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackSent(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error(t("common.error"));
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
    { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
    { q: t("landing.faq.q7"), a: t("landing.faq.a7") },
  ];

  const premiumFeatures = [
    { icon: Bot, text: t("landing.premium.features.ai") },
    { icon: Wallet, text: t("landing.premium.features.expenses") },
    { icon: FileEdit, text: t("landing.premium.features.questions") },
    { icon: MessageSquare, text: t("landing.premium.features.messages") },
    { icon: Crown, text: t("landing.premium.features.priority") },
  ];

  return (
    <AnimatedBackground>
      <LandingHeader onScrollToSection={scrollToSection} />

      {/* Floating Feedback Button */}
      <motion.button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <MessageSquareHeart className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">{t("feedback.button")}</span>
      </motion.button>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-primary" />
              {t("feedback.title")}
            </DialogTitle>
            <DialogDescription>{t("feedback.description")}</DialogDescription>
          </DialogHeader>
          {!feedbackSent ? (
            <div className="space-y-4">
              <Textarea
                placeholder={t("feedback.placeholder")}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedbackText.trim() || feedbackSubmitting}
                className="w-full"
              >
                {feedbackSubmitting ? t("common.loading") : t("feedback.submit")}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="font-medium text-foreground">{t("feedback.thankYou")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <HeroSection
        heroImage={heroImage}
        featurePlanning={featurePlanning}
        featureVoting={featureVoting}
        onScrollNext={() => scrollToSection("features")}
      />

      {/* Interactive Demo — Holographic Switcher */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <ScrollReveal variant="slide-up" className="text-center mb-12">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <Play className="w-3 h-3 mr-1" />
              {t("landing.demo.badge", "Interactive Demo")}
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.demo.title", "Experience EventBliss in Action")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.demo.subtitle", "Click on the features to see how easy group planning can be")}
            </p>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <HoloFrame>
              <GlassCard className="p-6 md:p-8 relative overflow-hidden rounded-3xl">
                <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                  {/* Feature Tabs */}
                  <div className="lg:col-span-2 space-y-3">
                    {demoFeatures.map((feature, index) => {
                      const isActive = activeDemo === index;
                      return (
                        <motion.button
                          key={feature.id}
                          onClick={() => handleDemoClick(index)}
                          className={`relative w-full text-left p-4 rounded-xl transition-colors duration-300 ${
                            isActive
                              ? "text-foreground"
                              : "bg-muted/40 hover:bg-muted/60 text-foreground/90"
                          }`}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="demo-active-pill"
                              className="absolute inset-0 rounded-xl bg-primary/10 border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
                              transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            />
                          )}
                          <div className="relative flex items-start gap-4">
                            <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-md`}>
                              <feature.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold mb-1 ${isActive ? "text-primary" : ""}`}>
                                {t(`landing.demo.features.${feature.id}.title`, feature.id)}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {t(`landing.demo.features.${feature.id}.description`, "")}
                              </p>
                            </div>
                          </div>
                          {isActive && isAutoPlaying && (
                            <div className="relative mt-3 h-1 bg-primary/15 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary via-neon-pink to-accent rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: AUTO_ROTATE_INTERVAL / 1000, ease: "linear" }}
                                key={activeDemo}
                              />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          {t("landing.demo.pause", "Pause auto-play")}
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          {t("landing.demo.play", "Resume auto-play")}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Screenshot Area */}
                  <div className="lg:col-span-3 relative min-h-[300px] md:min-h-[400px]">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-destructive/60" />
                          <div className="w-3 h-3 rounded-full bg-warning/60" />
                          <div className="w-3 h-3 rounded-full bg-success/60" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                            event-bliss.com/{demoFeatures[activeDemo].id}
                          </div>
                        </div>
                      </div>
                      <div className="relative h-[calc(100%-48px)]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeDemo}
                            initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0"
                          >
                            {(() => {
                              const DemoComponent = demoComponents[demoFeatures[activeDemo].id];
                              return DemoComponent ? <DemoComponent /> : null;
                            })()}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-border/50">
                  <MagneticButton strength={0.3} sparkles>
                    <GradientButton
                      onClick={() => navigate("/create")}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {t("landing.demo.cta", "Try it yourself")}
                    </GradientButton>
                  </MagneticButton>
                </div>
              </GlassCard>
            </HoloFrame>
          </ScrollReveal>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <FeaturesBento />

      {/* Feature Showcase */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <ScrollReveal variant="slide-up" className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.features.showcaseTitle")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.features.showcaseSubtitle")}
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { img: featurePlanning, title: "landing.features.multiEvent.title", grad: "from-primary/20 to-accent/20" },
              { img: "/brand-uploads/4cd5cddc-cab8-4de8-9431-6f0d99baaeff.png", title: "landing.features.costSplitting.title", grad: "from-accent/20 to-primary/20" },
              { img: agenciesHero, title: "landing.features.agencyDirectory.title", grad: "from-neon-cyan/20 to-accent/20" },
              { img: featureVoting, title: "landing.features.dateCoordination.title", grad: "from-success/20 to-accent/20" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                  <div className={`aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br ${item.grad} flex items-center justify-center`}>
                    <img
                      src={item.img}
                      alt={t(item.title)}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-center">{t(item.title)}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Device Mockup */}
      <section className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal variant="slide-right">
              <img
                src={multiDeviceMockup}
                alt="EventBliss on multiple devices"
                loading="lazy"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </ScrollReveal>
            <ScrollReveal variant="slide-left" className="text-center lg:text-left">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                {t("landing.multiDevice.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">{t("landing.multiDevice.description")}</p>
              <ul className="space-y-4">
                {[
                  { icon: Check, key: "feature1" },
                  { icon: Check, key: "feature2" },
                  { icon: Check, key: "feature3" },
                  { icon: Download, key: "feature4" },
                  { icon: Globe, key: "feature5" },
                ].map(({ icon: Icon, key }) => (
                  <li key={key} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span>{t(`landing.multiDevice.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-primary/5 via-accent/5 to-background">
        <div className="container max-w-5xl mx-auto">
          <ScrollReveal variant="slide-up" className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Crown className="w-4 h-4 mr-1" />
              Premium
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.premium.sectionTitle")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.premium.sectionSubtitle")}
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal variant="slide-up" delay={0.1}>
              <GlassCard className="p-8 h-full">
                <h3 className="font-display text-xl font-semibold mb-2">{t("landing.premium.monthly")}</h3>
                <p className="text-3xl font-bold text-primary mb-6">{t("landing.premium.monthlyPrice")}</p>
                <ul className="space-y-3 mb-6">
                  {premiumFeatures.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <MagneticButton strength={0.25} sparkles={false} className="w-full">
                  <GradientButton variant="outline" className="w-full" onClick={() => navigate("/premium")}>
                    {t("landing.premium.cta")}
                  </GradientButton>
                </MagneticButton>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal variant="slide-up" delay={0.2}>
              <div className="holo-border h-full rounded-2xl">
                <GlassCard className="p-8 h-full relative">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {t("landing.premium.lifetimeBadge")}
                  </Badge>
                  <h3 className="font-display text-xl font-semibold mb-2 mt-2">{t("landing.premium.lifetime")}</h3>
                  <p className="text-3xl font-bold text-primary mb-6">{t("landing.premium.lifetimePrice")}</p>
                  <ul className="space-y-3 mb-6">
                    {premiumFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  <MagneticButton strength={0.3} sparkles>
                    <GradientButton
                      className="w-full"
                      onClick={() => navigate("/premium")}
                      icon={<Crown className="w-4 h-4" />}
                    >
                      {t("landing.premium.cta")}
                    </GradientButton>
                  </MagneticButton>
                </GlassCard>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* For Agencies */}
      <section id="for-agencies" className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-pink-950/30 to-amber-900/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.15),transparent_60%)] pointer-events-none" />
        <div className="container max-w-5xl mx-auto relative">
          <ScrollReveal variant="slide-up">
            <GlassCard className="p-8 md:p-14 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-transparent blur-3xl rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl rounded-full" />
              <div className="relative grid md:grid-cols-2 gap-10 md:gap-14 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-5">
                    <Building2 className="w-3.5 h-3.5 text-pink-300" />
                    <span className="text-xs font-black tracking-widest text-pink-200">
                      {t("agency.landingSection.badge", "FÜR AGENTUREN")}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black leading-[1.1] mb-5">
                    {t("agency.landingSection.title1", "Du bist Event-Agentur?")}
                    <br />
                    <span className="text-foreground">{t("agency.landingSection.title2", "Werde Partner und")}</span>{" "}
                    <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                      {t("agency.landingSection.highlight", "erreiche 100.000+ Planer")}
                    </span>
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                    {t(
                      "agency.landingSection.subtitle",
                      "Kein Marketing-Budget nötig. Wir bringen dir die Kunden — du lieferst die magische Event-Experience.",
                    )}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm md:text-base text-foreground/85">
                          {t(`agency.landingSection.b${i}`, "")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/agency/pricing">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:shadow-[0_16px_48px_rgba(236,72,153,0.5)] hover:scale-[1.03] text-white border-0 font-bold h-13 px-8 rounded-xl transition-all"
                    >
                      {t("agency.landingSection.cta", "Agentur-Pläne ansehen")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-pink-600/20 to-amber-500/20 blur-2xl rounded-full" />
                  <div className="relative aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-violet-900/40 to-pink-900/40 border border-white/10 p-8 flex flex-col items-center justify-center gap-6">
                    <div className="text-6xl md:text-7xl font-black bg-gradient-to-br from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                      170+
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-white/60">
                        {t("landing.stats.agencies", "Partner-Agenturen")}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        9 {t("landing.stats.countries", "Länder")} · 10 {t("landing.stats.languages", "Sprachen")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[Building2, Sparkles, Crown].map((Icon, i) => (
                        <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-pink-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* How it Works — Scroll Timeline */}
      <HowItWorksTimeline />

      {/* Event Types — Orbital */}
      <EventTypesOrbit />

      {/* FAQ */}
      <section id="faq" className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-3xl mx-auto">
          <ScrollReveal variant="slide-up" className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.faq.title")}
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="slide-up" delay={0.1}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card rounded-xl px-6 border-0 transition-all data-[state=open]:shadow-[0_0_40px_hsl(var(--primary)/0.25)] data-[state=open]:border data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-display font-medium hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA — Aurora Panel */}
      <section className="relative py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <ScrollReveal variant="scale">
            <div className="relative rounded-3xl overflow-hidden">
              <AuroraBackground className="absolute inset-0" intensity="intense" grain spotlight={false} />
              <GlassCard className="relative text-center p-12 md:p-16 rounded-3xl border-primary/20">
                <div className="relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-6"
                  >
                    <Sparkles className="w-14 h-14 text-primary drop-shadow-[0_0_24px_hsl(var(--primary))]" />
                  </motion.div>
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    <AuroraText>{t("landing.cta.title")}</AuroraText>
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                    {t("landing.cta.description")}
                  </p>
                  <MagneticButton strength={0.35} sparkles>
                    <GradientButton
                      size="lg"
                      onClick={() => navigate("/create")}
                      icon={<ArrowRight className="w-5 h-5" />}
                    >
                      {t("landing.cta.button")}
                    </GradientButton>
                  </MagneticButton>
                </div>
              </GlassCard>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LandingFooter />
      <CookieBanner />
    </AnimatedBackground>
  );
};

export default Landing;
