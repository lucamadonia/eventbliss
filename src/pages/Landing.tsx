import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Wallet, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { FloatingElement } from "@/components/ui/FloatingElement";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Users,
      title: t('landing.features.multiEvent.title'),
      description: t('landing.features.multiEvent.description'),
      gradient: "primary" as const,
    },
    {
      icon: Wallet,
      title: t('landing.features.costSplitting.title'),
      description: t('landing.features.costSplitting.description'),
      gradient: "secondary" as const,
    },
    {
      icon: MessageSquare,
      title: t('landing.features.messageTemplates.title'),
      description: t('landing.features.messageTemplates.description'),
      gradient: "accent" as const,
    },
  ];

  return (
    <AnimatedBackground>
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center">
            {/* Floating decorative elements */}
            <FloatingElement className="absolute top-20 left-10 opacity-30" delay={0}>
              <Sparkles className="w-8 h-8 text-primary" />
            </FloatingElement>
            <FloatingElement className="absolute top-40 right-20 opacity-20" delay={2}>
              <Sparkles className="w-12 h-12 text-accent" />
            </FloatingElement>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('landing.subtitle')}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
            >
              <span className="text-gradient-primary">{t('landing.title')}</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12"
            >
              {t('landing.description')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <GradientButton
                size="lg"
                onClick={() => navigate("/create")}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('landing.createEvent')}
              </GradientButton>
              <GradientButton
                variant="outline"
                size="lg"
                onClick={() => navigate("/join")}
              >
                {t('landing.joinEvent')}
              </GradientButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <GlassCard className="text-center p-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              {t('landing.cta.description')}
            </p>
            <GradientButton
              size="lg"
              onClick={() => navigate("/create")}
              icon={<Sparkles className="w-5 h-5" />}
            >
              {t('landing.cta.button')}
            </GradientButton>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>{t('landing.footer')}</p>
        </div>
      </footer>
    </AnimatedBackground>
  );
};

export default Landing;
