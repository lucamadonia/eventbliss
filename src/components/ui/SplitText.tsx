/**
 * SplitText — splits children text by grapheme (or word) and animates each
 * piece with a configurable stagger. Respects prefers-reduced-motion by
 * collapsing to a simple opacity fade.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  text: string;
  /** Split per character (default) or per word. */
  mode?: "char" | "word";
  /** Seconds between each sibling reveal. */
  stagger?: number;
  /** Initial delay before the first reveal. */
  delay?: number;
  /** Tailwind class applied to the outer wrapper (controls text style). */
  className?: string;
  /** Render as an inline span instead of a block. */
  as?: "div" | "span" | "h1" | "h2" | "h3";
}

const charVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

export function SplitText({
  text,
  mode = "char",
  stagger = 0.03,
  delay = 0,
  className,
  as = "span",
}: SplitTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const Tag = motion[as];

  const parts = mode === "word" ? text.split(" ") : Array.from(text);
  const variants = prefersReducedMotion ? reducedVariants : charVariants;

  return (
    <Tag
      className={cn("inline-block", className)}
      aria-label={text}
      initial="hidden"
      animate="show"
      transition={{
        staggerChildren: prefersReducedMotion ? 0 : stagger,
        delayChildren: delay,
      }}
    >
      {parts.map((part, i) => (
        <motion.span
          key={i}
          variants={variants}
          className="inline-block whitespace-pre"
          aria-hidden
        >
          {mode === "word" && i < parts.length - 1 ? `${part} ` : part}
        </motion.span>
      ))}
    </Tag>
  );
}
