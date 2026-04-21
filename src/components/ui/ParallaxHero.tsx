/**
 * ParallaxHero — 3-layer parallax device-mockup stack. Each layer scrolls at a
 * different rate via `useScroll` + `useTransform`. Falls back to a static
 * composition under prefers-reduced-motion.
 *
 * Accepts: back/mid/front image sources with per-layer alt text.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParallaxHeroProps {
  back: string;
  mid: string;
  front: string;
  alt?: string;
  className?: string;
}

export function ParallaxHero({ back, mid, front, alt = "", className }: ParallaxHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const backY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [40, -120]);
  const midY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [20, -80]);
  const frontY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -40]);

  const backRotate = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [-3, 2]);
  const frontRotate = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [2, -2]);

  return (
    <div ref={ref} className={cn("relative isolate", className)}>
      {/* Glow behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 gradient-glow opacity-50 blur-3xl scale-110 pointer-events-none"
      />

      {/* Back layer — faded, largest parallax range */}
      <motion.div
        style={{ y: backY, rotate: backRotate }}
        className="absolute -top-6 -left-6 w-[70%] opacity-60 mix-blend-screen"
      >
        <img
          src={back}
          alt=""
          loading="lazy"
          className="w-full h-auto rounded-2xl shadow-2xl"
          aria-hidden
        />
      </motion.div>

      {/* Front accent layer */}
      <motion.div
        style={{ y: frontY, rotate: frontRotate }}
        className="absolute -bottom-8 -right-4 w-[55%] opacity-90"
      >
        <img
          src={front}
          alt=""
          loading="lazy"
          className="w-full h-auto rounded-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)]"
          aria-hidden
        />
      </motion.div>

      {/* Mid layer — the hero image itself, eager-loaded for LCP */}
      <motion.div
        style={{ y: midY }}
        className="relative z-10"
      >
        <img
          src={mid}
          alt={alt}
          loading="eager"
          // @ts-expect-error — non-standard but widely supported LCP hint
          fetchpriority="high"
          className="relative w-full h-auto rounded-2xl shadow-2xl"
        />
      </motion.div>
    </div>
  );
}
