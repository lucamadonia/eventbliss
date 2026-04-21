/**
 * HeroSection — epic landing hero. Aurora background + animated headline +
 * staggered subtitle + magnetic CTAs + parallax device stack. Respects
 * prefers-reduced-motion.
 *
 * Drives to `/create` and `/join`. The scroll indicator receives an
 * `onScrollNext` callback so the host page can decide the next anchor.
 */
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { AuroraText } from "@/components/ui/AuroraText";
import { SplitText } from "@/components/ui/SplitText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ParallaxHero } from "@/components/ui/ParallaxHero";
import { TiltCard } from "@/components/ui/TiltCard";
import { GradientButton } from "@/components/ui/GradientButton";

interface HeroSectionProps {
  heroImage: string;
  featurePlanning: string;
  featureVoting: string;
  onScrollNext: () => void;
}

export function HeroSection({
  heroImage,
  featurePlanning,
  featureVoting,
  onScrollNext,
}: HeroSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 overflow-hidden">
      {/* Aurora field — anchored to the hero, sits above AnimatedBackground orbs */}
      <AuroraBackground
        className="absolute inset-0 -z-0"
        intensity="normal"
        spotlight
        grain
      />

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div className="text-center lg:text-left">
            {/* Beta Badge — animated ping preserved */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8 magnetic-pulse"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-accent">
                {t("feedback.betaBadge")}
              </span>
            </motion.div>

            {/* Main headline — SplitText char-stagger + aurora gradient */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-[1.05]">
              <AuroraText as="span" className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl leading-[1.05]">
                <SplitText
                  text={t("landing.hero.title")}
                  mode="char"
                  stagger={0.025}
                  delay={0.05}
                />
              </AuroraText>
            </h1>

            {/* Subheadline — word-level stagger */}
            <motion.p
              initial={{ opacity: 0, y: 16, filter: prefersReducedMotion ? "blur(0px)" : "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
            >
              {t("landing.hero.subtitle")}
            </motion.p>

            {/* CTAs — magnetic wrappers around GradientButton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <MagneticButton strength={0.3} sparkles>
                <GradientButton
                  size="lg"
                  onClick={() => navigate("/create")}
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  {t("landing.hero.createEvent")}
                </GradientButton>
              </MagneticButton>
              <MagneticButton strength={0.25} sparkles={false}>
                <GradientButton
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/join")}
                >
                  {t("landing.hero.joinEvent")}
                </GradientButton>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Right column — parallax device stack with tilt on middle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <TiltCard className="rounded-2xl" glowColor="hsl(var(--primary) / 0.35)">
              <ParallaxHero
                back={featurePlanning}
                mid={heroImage}
                front={featureVoting}
                alt="EventBliss — people celebrating with the app"
              />
            </TiltCard>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onScrollNext}
        aria-label="Scroll to next section"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 rounded-full p-2 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <motion.span
          className="block"
          animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </motion.span>
      </motion.button>
    </section>
  );
}
