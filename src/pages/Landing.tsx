import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Wallet, MessageSquare } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { FloatingElement } from "@/components/ui/FloatingElement";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Multi-Event Management",
      description: "Create unlimited events. Each gets its own unique link, dashboard, and participant list.",
      gradient: "primary" as const,
    },
    {
      icon: Wallet,
      title: "Smart Cost Splitting",
      description: "Track expenses, split costs fairly, and see who owes what in real-time.",
      gradient: "secondary" as const,
    },
    {
      icon: MessageSquare,
      title: "Message Templates",
      description: "Pre-built WhatsApp templates for every stage. Copy, customize, send.",
      gradient: "accent" as const,
    },
  ];

  return (
    <AnimatedBackground>
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
                The Modern Party Planning Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
            >
              <span className="text-gradient-primary">STAG</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12"
            >
              Plan epic bachelor parties, split costs effortlessly, and coordinate everything in one beautiful place.
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
                Create Event
              </GradientButton>
              <GradientButton
                variant="outline"
                size="lg"
                onClick={() => navigate("/join")}
              >
                Join with Code
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
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From planning to payment — we've got every angle covered.
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
              Ready to Start Planning?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Create your event in seconds. No signup required to get started.
            </p>
            <GradientButton
              size="lg"
              onClick={() => navigate("/create")}
              icon={<Sparkles className="w-5 h-5" />}
            >
              Create Free Event
            </GradientButton>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 STAG. Built for legendary celebrations.</p>
        </div>
      </footer>
    </AnimatedBackground>
  );
};

export default Landing;
