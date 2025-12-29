import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Wallet, MessageSquare, Calendar, Zap, Bot, PartyPopper, Cake, Plane, Heart, Briefcase, Star, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { FloatingElement } from "@/components/ui/FloatingElement";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CookieBanner } from "@/components/landing/CookieBanner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import eventBlissLogo from "@/assets/eventbliss-logo.png";
import heroImage from "@/assets/hero-image.png";
import featurePlanning from "@/assets/feature-planning.png";
import featureBillSplitting from "@/assets/feature-bill-splitting.png";
import featureExpenseTracking from "@/assets/feature-expense-tracking.png";
import featureVoting from "@/assets/feature-voting.png";
import multiDeviceMockup from "@/assets/multi-device-mockup.png";
import socialProof from "@/assets/social-proof.png";
const Landing = () => {
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const features = [{
    icon: Users,
    title: t("landing.features.multiEvent.title"),
    description: t("landing.features.multiEvent.description"),
    gradient: "from-primary to-neon-pink"
  }, {
    icon: Wallet,
    title: t("landing.features.costSplitting.title"),
    description: t("landing.features.costSplitting.description"),
    gradient: "from-accent to-primary"
  }, {
    icon: Bot,
    title: t("landing.features.aiSuggestions.title"),
    description: t("landing.features.aiSuggestions.description"),
    gradient: "from-neon-cyan to-accent"
  }, {
    icon: MessageSquare,
    title: t("landing.features.messageTemplates.title"),
    description: t("landing.features.messageTemplates.description"),
    gradient: "from-neon-pink to-neon-orange"
  }, {
    icon: Calendar,
    title: t("landing.features.dateCoordination.title"),
    description: t("landing.features.dateCoordination.description"),
    gradient: "from-success to-accent"
  }, {
    icon: Zap,
    title: t("landing.features.realtime.title"),
    description: t("landing.features.realtime.description"),
    gradient: "from-warning to-neon-orange"
  }];
  const steps = [{
    number: "01",
    title: t("landing.howItWorks.step1.title"),
    description: t("landing.howItWorks.step1.description")
  }, {
    number: "02",
    title: t("landing.howItWorks.step2.title"),
    description: t("landing.howItWorks.step2.description")
  }, {
    number: "03",
    title: t("landing.howItWorks.step3.title"),
    description: t("landing.howItWorks.step3.description")
  }, {
    number: "04",
    title: t("landing.howItWorks.step4.title"),
    description: t("landing.howItWorks.step4.description")
  }];
  const eventTypes = [{
    icon: PartyPopper,
    label: t("landing.eventTypes.bachelor"),
    color: "text-primary"
  }, {
    icon: Heart,
    label: t("landing.eventTypes.bachelorette"),
    color: "text-neon-pink"
  }, {
    icon: Cake,
    label: t("landing.eventTypes.birthday"),
    color: "text-warning"
  }, {
    icon: Briefcase,
    label: t("landing.eventTypes.team"),
    color: "text-accent"
  }, {
    icon: Plane,
    label: t("landing.eventTypes.trip"),
    color: "text-success"
  }, {
    icon: Heart,
    label: t("landing.eventTypes.wedding"),
    color: "text-destructive"
  }];
  const testimonials = [{
    text: t("landing.testimonials.testimonial1.text"),
    author: "Sarah M.",
    role: "Bachelor Party Organizer",
    rating: 5
  }, {
    text: t("landing.testimonials.testimonial2.text"),
    author: "Michael K.",
    role: "Group Trip Planner",
    rating: 5
  }, {
    text: t("landing.testimonials.testimonial3.text"),
    author: "Anna L.",
    role: "Birthday Party Host",
    rating: 5
  }];
  const faqs = [{
    q: t("landing.faq.q1"),
    a: t("landing.faq.a1")
  }, {
    q: t("landing.faq.q2"),
    a: t("landing.faq.a2")
  }, {
    q: t("landing.faq.q3"),
    a: t("landing.faq.a3")
  }, {
    q: t("landing.faq.q4"),
    a: t("landing.faq.a4")
  }];
  return <AnimatedBackground>
      <LandingHeader onScrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
        <div className="container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5
            }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("landing.hero.badge")}
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.1
            }} className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold mb-6">
                <span className="text-gradient-primary">{t("landing.hero.title")}</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                {t("landing.hero.subtitle")}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.3
            }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <GradientButton size="lg" onClick={() => navigate("/create")} icon={<ArrowRight className="w-5 h-5" />}>
                  {t("landing.hero.createEvent")}
                </GradientButton>
                <GradientButton variant="outline" size="lg" onClick={() => navigate("/join")}>
                  {t("landing.hero.joinEvent")}
                </GradientButton>
              </motion.div>

              {/* Trust Badge */}
              <motion.p initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} transition={{
              duration: 0.6,
              delay: 0.5
            }} className="text-sm text-muted-foreground">
                {t("landing.hero.trustedBy")}
              </motion.p>
            </div>

            {/* Right Column - Hero Image */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.9,
            x: 50
          }} animate={{
            opacity: 1,
            scale: 1,
            x: 0
          }} transition={{
            duration: 0.8,
            delay: 0.3
          }} className="relative">
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 gradient-glow opacity-30 blur-3xl scale-110" />
                <img src={heroImage} alt="EventBliss - People celebrating with the app" className="relative z-10 w-full h-auto rounded-2xl shadow-2xl" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1
      }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{
          y: [0, 8, 0]
        }} transition={{
          repeat: Infinity,
          duration: 1.5
        }} className="cursor-pointer" onClick={() => scrollToSection("features")}>
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="container max-w-7xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <motion.div key={feature.title} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }}>
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
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Feature Showcase Section with Images */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-7xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.features.showcaseTitle", "Powerful Features, Beautiful Design")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.features.showcaseSubtitle", "Everything you need to plan the perfect group event")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Image Cards */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: 0
          }}>
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img src={featurePlanning} alt="Event Planning Feature" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.multiEvent.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: 0.1
          }}>
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img alt="Bill Splitting Feature" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="/lovable-uploads/4cd5cddc-cab8-4de8-9431-6f0d99baaeff.png" />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.costSplitting.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: 0.2
          }}>
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img alt="Expense Tracking Feature" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="" />
                </div>
                <h3 className="font-display text-lg font-semibold text-center">
                  {t("landing.features.realtime.title")}
                </h3>
              </GlassCard>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: 0.3
          }}>
              <GlassCard className="p-4 h-full glass-card-hover group overflow-hidden">
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img src={featureVoting} alt="Voting & Polls Feature" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
              <img src={multiDeviceMockup} alt="EventBliss on multiple devices" className="w-full h-auto rounded-2xl shadow-xl" />
            </motion.div>
            
            <motion.div initial={{
            opacity: 0,
            x: 50
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} className="text-center lg:text-left">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                {t("landing.multiDevice.title", "Plan Events Anywhere, Anytime")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("landing.multiDevice.description", "Access EventBliss from any device. Our responsive design ensures a seamless experience whether you're on your phone, tablet, or desktop.")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature1", "Real-time sync across all devices")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature2", "Instant notifications for updates")}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span>{t("landing.multiDevice.feature3", "Works offline with auto-sync")}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Image Section */}
      <section className="relative py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img src={socialProof} alt="Friends using EventBliss at a party" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
              <p className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
                {t("landing.socialProof.quote", "Join thousands of happy event planners")}
              </p>
              <p className="text-muted-foreground">
                {t("landing.socialProof.stats", "Over 10,000+ events planned successfully")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>


      <section id="how-it-works" className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.howItWorks.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => <motion.div key={step.number} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: index * 0.15
          }} className="relative">
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
                {index < steps.length - 1 && <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />}
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section id="solutions" className="relative py-24 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.eventTypes.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.eventTypes.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {eventTypes.map((type, index) => <motion.div key={type.label} initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.4,
            delay: index * 0.1
          }} whileHover={{
            scale: 1.05
          }} className="cursor-pointer" onClick={() => navigate("/create")}>
                <GlassCard className="p-6 text-center glass-card-hover">
                  <type.icon className={`w-10 h-10 mx-auto mb-3 ${type.color}`} />
                  <p className="font-medium text-sm">{type.label}</p>
                </GlassCard>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.testimonials.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              {t("landing.testimonials.subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => <motion.div key={testimonial.author} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: index * 0.15
          }}>
                <GlassCard className="p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-warning fill-warning" />)}
                  </div>
                  <p className="text-foreground mb-6 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </GlassCard>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 px-4">
        <div className="container max-w-3xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t("landing.faq.title")}
            </h2>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="glass-card rounded-xl px-6 border-0">
                  <AccordionTrigger className="text-left font-display font-medium hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4">
        <div className="container max-w-4xl mx-auto">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <GlassCard className="text-center p-12 md:p-16 relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 gradient-glow opacity-50" />
              
              <div className="relative z-10">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {t("landing.cta.title")}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
                  {t("landing.cta.description")}
                </p>
                <GradientButton size="lg" onClick={() => navigate("/create")} icon={<ArrowRight className="w-5 h-5" />}>
                  {t("landing.cta.button")}
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
      <CookieBanner />
    </AnimatedBackground>;
};
export default Landing;