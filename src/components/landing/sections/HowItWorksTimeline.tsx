/**
 * HowItWorksTimeline — scroll-driven cinematic timeline. Sticky left column
 * with a large morphing step number (derived from scrollYProgress). Right
 * column renders each step with a mask-reveal entrance. A vertical SVG line
 * draws along scroll via `pathLength`.
 */
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const STEPS = [
  { numberKey: "01", titleKey: "landing.howItWorks.step1.title", descriptionKey: "landing.howItWorks.step1.description" },
  { numberKey: "02", titleKey: "landing.howItWorks.step2.title", descriptionKey: "landing.howItWorks.step2.description" },
  { numberKey: "03", titleKey: "landing.howItWorks.step3.title", descriptionKey: "landing.howItWorks.step3.description" },
  { numberKey: "04", titleKey: "landing.howItWorks.step4.title", descriptionKey: "landing.howItWorks.step4.description" },
];

export function HowItWorksTimeline() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // SVG line draws from 0..1 as the section scrolls past
  const pathLength = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [0, 1]);

  // Drive active step from scroll progress
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    if (idx !== activeStep) setActiveStep(idx);
  });

  return (
    <section id="how-it-works" className="relative py-24 px-4 bg-muted/30 overflow-hidden">
      <div className="container max-w-6xl mx-auto">
        <ScrollReveal variant="slide-up" className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {t("landing.howItWorks.subtitle")}
          </p>
        </ScrollReveal>

        <div ref={containerRef} className="relative grid md:grid-cols-[minmax(200px,1fr)_2fr] gap-8 md:gap-16">
          {/* Sticky big step number */}
          <div className="md:sticky md:top-24 md:self-start flex md:block items-center gap-4">
            <div className="relative">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 30, filter: prefersReducedMotion ? "blur(0px)" : "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-7xl md:text-[10rem] font-black leading-none text-aurora select-none"
                aria-hidden
              >
                {STEPS[activeStep].numberKey}
              </motion.div>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mt-4">
              {t("landing.howItWorks.title")}
            </p>
          </div>

          {/* Timeline: SVG line + steps */}
          <div className="relative">
            {/* Animated connecting line */}
            <svg
              aria-hidden
              className="absolute left-4 md:left-5 top-4 bottom-4 w-[2px] overflow-visible pointer-events-none"
              viewBox="0 0 2 100"
              preserveAspectRatio="none"
            >
              <motion.line
                x1="1"
                y1="0"
                x2="1"
                y2="100"
                stroke="url(#tl-gradient)"
                strokeWidth="2"
                style={{ pathLength }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="tl-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--neon-pink))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>

            <div className="space-y-12 md:space-y-16">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.numberKey}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : 0.05 }}
                  className="relative pl-12 md:pl-14"
                >
                  {/* Step dot */}
                  <motion.span
                    aria-hidden
                    className="absolute left-0 top-1 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-neon-pink text-white flex items-center justify-center font-display font-bold text-sm shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
                    whileInView={{ scale: [0.6, 1.1, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step.numberKey}
                  </motion.span>

                  <motion.div
                    initial={{ clipPath: prefersReducedMotion ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
                    whileInView={{ clipPath: "inset(0 0 0 0)" }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.77, 0, 0.18, 1] }}
                  >
                    <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
                      {t(step.descriptionKey)}
                    </p>
                  </motion.div>

                  {/* Index hint for screen readers */}
                  <span className="sr-only">Step {i + 1} of {STEPS.length}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
