import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Users, Wallet, MessageSquare, Calendar, Zap, Bot, PartyPopper, Cake, Plane, Heart, Briefcase, ChevronDown, Check, Crown, Building2, FileEdit, Download, Globe, LayoutDashboard, ClipboardList, Play, Pause, MessageSquareHeart, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CookieBanner } from "@/components/landing/CookieBanner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.png";
import featurePlanning from "@/assets/feature-planning.png";
import featureVoting from "@/assets/feature-voting.png";
import multiDeviceMockup from "@/assets/multi-device-mockup.png";
import agenciesHero from "@/assets/agencies-hero.webp";

// Live Demo Components
import { DemoDashboard } from "@/components/landing/demos/DemoDashboard";
import { DemoExpenses } from "@/components/landing/demos/DemoExpenses";
import { DemoAIAssistant } from "@/components/landing/demos/DemoAIAssistant";
import { DemoSurvey } from "@/components/landing/demos/DemoSurvey";
import { DemoAgencies } from "@/components/landing/demos/DemoAgencies";
import { DemoPlanner } from "@/components/landing/demos/DemoPlanner";

// Demo components mapping
const demoComponents: Record<string, React.ComponentType> = {
  dashboard: DemoDashboard,
  expenses: DemoExpenses,
  ai: DemoAIAssistant,
  survey: DemoSurvey,
  agencies: DemoAgencies,
  planner: DemoPlanner,
};

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Demo section state
  const [activeDemo, setActiveDemo] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const AUTO_ROTATE_INTERVAL = 4000;
  
  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  
  const demoFeatures = [
    { id: "dashboard", icon: LayoutDashboard, gradient: "from-primary to-accent" },
    { id: "expenses", icon: Wallet, gradient: "from-accent to-neon-pink" },
    { id: "planner", icon: Calendar, gradient: "from-neon-pink to-primary" },
    { id: "ai", icon: Bot, gradient: "from-neon-cyan to-primary" },
    { id: "survey", icon: ClipboardList, gradient: "from-neon-pink to-warning" },
    { id: "agencies", icon: Building2, gradient: "from-success to-accent" },
  ];
  
  // Auto-rotate demo features
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoFeatures.length);
    }, AUTO_ROTATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, demoFeatures.length]);
  
  const handleDemoClick = (index: number) => {
    setActiveDemo(index);
    setIsAutoPlaying(false);
  };
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
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
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackSent(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(t("common.error"));
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: t("landing.features.multiEvent.title"),
      description: t("landing.features.multiEvent.description"),
      gradient: "from-primary to-neon-pink"
    },
    {
      icon: Wallet,
      title: t("landing.features.costSplitting.title"),
      description: t("landing.features.costSplitting.description"),
      gradient: "from-accent to-primary"
    },
    {
      icon: Bot,
      title: t("landing.features.aiSuggestions.title"),
      description: t("landing.features.aiSuggestions.description"),
      gradient: "from-neon-cyan to-accent"
    },
    {
      icon: MessageSquare,
      title: t("landing.features.messageTemplates.title"),
      description: t("landing.features.messageTemplates.description"),
      gradient: "from-neon-pink to-neon-orange"
    },
    {
      icon: Calendar,
      title: t("landing.features.planner.title"),
      description: t("landing.features.planner.description"),
      gradient: "from-neon-pink to-primary"
    },
    {
      icon: Calendar,
      title: t("landing.features.dateCoordination.title"),
      description: t("landing.features.dateCoordination.description"),
      gradient: "from-success to-accent"
    },
    {
      icon: Zap,
      title: t("landing.features.realtime.title"),
      description: t("landing.features.realtime.description"),
      gradient: "from-warning to-neon-orange"
    },
    {
      icon: Building2,
      title: t("landing.features.agencyDirectory.title"),
      description: t("landing.features.agencyDirectory.description"),
      gradient: "from-primary to-accent"
    },
    {
      icon: FileEdit,
      title: t("landing.features.formBuilder.title"),
      description: t("landing.features.formBuilder.description"),
      gradient: "from-neon-cyan to-primary"
    }
  ];

  const steps = [
    {
      number: "01",
      title: t("landing.howItWorks.step1.title"),
      description: t("landing.howItWorks.step1.description")
    },
    {
      number: "02",
      title: t("landing.howItWorks.step2.title"),
      description: t("landing.howItWorks.step2.description")
    },
    {
      number: "03",
      title: t("landing.howItWorks.step3.title"),
      description: t("landing.howItWorks.step3.description")
    },
    {
      number: "04",
      title: t("landing.howItWorks.step4.title"),
      description: t("landing.howItWorks.step4.description")
    }
  ];

  const eventTypes = [
    { icon: PartyPopper, label: t("landing.eventTypes.bachelor"), color: "text-primary" },
    { icon: Heart, label: t("landing.eventTypes.bachelorette"), color: "text-neon-pink" },
    { icon: Cake, label: t("landing.eventTypes.birthday"), color: "text-warning" },
    { icon: Briefcase, label: t("landing.eventTypes.team"), color: "text-accent" },
    { icon: Plane, label: t("landing.eventTypes.trip"), color: "text-success" },
    { icon: Heart, label: t("landing.eventTypes.wedding"), color: "text-destructive" }
  ];

  const faqs = [
    { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
    { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
    { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
    { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
    { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
    { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
    { q: t("landing.faq.q7"), a: t("landing.faq.a7") }
  ];

  const premiumFeatures = [
    { icon: Bot, text: t("landing.premium.features.ai") },
    { icon: Wallet, text: t("landing.premium.features.expenses") },
    { icon: FileEdit, text: t("landing.premium.features.questions") },
    { icon: MessageSquare, text: t("landing.premium.features.messages") },
    { icon: Crown, text: t("landing.premium.features.priority") }
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
            <DialogDescription>
              {t("feedback.description")}
            </DialogDescription>
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
        <div className="container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              {/* Beta Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-sm font-medium text-accent">
                  {t("feedback.betaBadge")}
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold mb-6"
              >
                <span className="text-gradient-primary">{t("landing.hero.title")}</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
              >
                {t("landing.hero.subtitle")}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <GradientButton
                  size="lg"
                  onClick={() => navigate("/create")}
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  {t("landing.hero.createEvent")}
                </GradientButton>
                <GradientButton
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/join")}
                >
                  {t("landing.hero.joinEvent")}
                </GradientButton>
              </motion.div>
            </div>

            {/* Right Column - Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-glow opacity-30 blur-3xl scale-110" />
                <img
                  src={heroImage}
                  alt="EventBliss - People celebrating with the app"
                  className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="cursor-pointer"
            onClick={() => scrollToSection("features")}
          >
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard className="p-6 md:p-8 relative overflow-hidden">
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Feature Tabs - Left Side */}
                <div className="lg:col-span-2 space-y-3">
                  {demoFeatures.map((feature, index) => (
                    <motion.button
                      key={feature.id}
                      onClick={() => handleDemoClick(index)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        activeDemo === index
                          ? "bg-primary/10 border-2 border-primary shadow-lg"
                          : "bg-muted/50 border-2 border-transparent hover:bg-muted hover:border-muted-foreground/20"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient}`}>
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold mb-1 ${activeDemo === index ? "text-primary" : "text-foreground"}`}>
                            {t(`landing.demo.features.${feature.id}.title`, feature.id)}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {t(`landing.demo.features.${feature.id}.description`, "")}
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar for active item */}
                      {activeDemo === index && isAutoPlaying && (
                        <motion.div
                          className="mt-3 h-1 bg-primary/20 rounded-full overflow-hidden"
                        >
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: AUTO_ROTATE_INTERVAL / 1000, ease: "linear" }}
                            key={activeDemo}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                  
                  {/* Play/Pause button */}
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

                {/* Screenshot Area - Right Side */}
                <div className="lg:col-span-3 relative min-h-[300px] md:min-h-[400px]">
                  {/* Device Frame */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 overflow-hidden">
                    {/* Browser-like header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-destructive/60" />
                        <div className="w-3 h-3 rounded-full bg-warning/60" />
                        <div className="w-3 h-3 rounded-full bg-success/60" />
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                          eventbliss.app/{demoFeatures[activeDemo].id}
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Demo content */}
                    <div className="relative h-[calc(100%-48px)]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeDemo}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
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
              
              {/* CTA */}
              <div className="text-center mt-8 pt-6 border-t border-border/50">
                <GradientButton
                  onClick={() => navigate("/create")}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {t("landing.demo.cta", "Try it yourself")}
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full glass-card-hover group">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Section with Images */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.features.showcaseTitle")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.features.showcaseSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <img
                    src={featurePlanning}
                    alt="Event Planning Feature"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.multiEvent.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <img
                    alt="Bill Splitting Feature"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="/lovable-uploads/4cd5cddc-cab8-4de8-9431-6f0d99baaeff.png"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.costSplitting.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
            <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-neon-cyan/20 to-accent/20 flex items-center justify-center">
                  <img
                    src={agenciesHero}
                    alt="Agency Directory Feature"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.agencyDirectory.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                  <img
                    src={featureVoting}
                    alt="Voting & Polls Feature"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.dateCoordination.title")}
                </h3>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Multi-Device Mockup Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={multiDeviceMockup}
                alt="EventBliss on multiple devices"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                {t("landing.multiDevice.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("landing.multiDevice.description")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature1")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature2")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature3")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature4")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature5")}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-primary/5 via-accent/5 to-background">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
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
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
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
                <GradientButton
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/premium")}
                >
                  {t("landing.premium.cta")}
                </GradientButton>
              </GlassCard>
            </motion.div>

            {/* Lifetime Card - Highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard className="p-8 h-full border-2 border-primary relative">
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
                <GradientButton
                  className="w-full"
                  onClick={() => navigate("/premium")}
                  icon={<Crown className="w-4 h-4" />}
                >
                  {t("landing.premium.cta")}
                </GradientButton>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.howItWorks.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary font-display font-bold text-2xl mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section id="solutions" className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.eventTypes.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.eventTypes.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {eventTypes.map((type, index) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
                onClick={() => navigate("/create")}
              >
                <GlassCard className="p-6 text-center glass-card-hover">
                  <type.icon className={`w-10 h-10 mx-auto mb-3 ${type.color}`} />
                  <p className="font-medium text-sm">{type.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.faq.title")}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card rounded-xl px-6 border-0"
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
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="text-center p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 gradient-glow opacity-50" />
              
              <div className="relative z-10">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {t("landing.cta.title")}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                  {t("landing.cta.description")}
                </p>
                <GradientButton
                  size="lg"
                  onClick={() => navigate("/create")}
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  {t("landing.cta.button")}
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
      <CookieBanner />
    </AnimatedBackground>
  );
};

export default Landing;
