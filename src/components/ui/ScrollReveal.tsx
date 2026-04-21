/**
 * ScrollReveal — a reusable primitive that reveals its children when scrolled
 * into view. Uses IntersectionObserver via framer-motion's whileInView with
 * `once: true`. Respects prefers-reduced-motion.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type RevealVariant = "fade" | "slide-up" | "slide-left" | "slide-right" | "mask" | "blur" | "scale";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  /** Distance used by slide-* variants (px). Default 24. */
  distance?: number;
  /** Root margin used by IntersectionObserver. */
  margin?: string;
}

function buildVariants(variant: RevealVariant, distance: number, duration: number): Variants {
  const transition = { duration, ease: [0.22, 1, 0.36, 1] as const };
  switch (variant) {
    case "slide-up":
      return {
        hidden: { opacity: 0, y: distance },
        show: { opacity: 1, y: 0, transition },
      };
    case "slide-left":
      return {
        hidden: { opacity: 0, x: distance },
        show: { opacity: 1, x: 0, transition },
      };
    case "slide-right":
      return {
        hidden: { opacity: 0, x: -distance },
        show: { opacity: 1, x: 0, transition },
      };
    case "mask":
      return {
        hidden: { clipPath: "inset(0 100% 0 0)" },
        show: { clipPath: "inset(0 0 0 0)", transition: { ...transition, duration: duration + 0.2 } },
      };
    case "blur":
      return {
        hidden: { opacity: 0, filter: "blur(12px)" },
        show: { opacity: 1, filter: "blur(0px)", transition },
      };
    case "scale":
      return {
        hidden: { opacity: 0, scale: 0.92 },
        show: { opacity: 1, scale: 1, transition },
      };
    case "fade":
    default:
      return {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition },
      };
  }
}

const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

export function ScrollReveal({
  children,
  variant = "slide-up",
  delay = 0,
  duration = 0.6,
  className,
  distance = 24,
  margin = "-80px",
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? reducedVariants : buildVariants(variant, distance, duration);

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
