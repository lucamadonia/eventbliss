/**
 * Motion Design Tokens — central source of truth for all native-app animations.
 * Used by PageTransition, micro-interactions, VFX components.
 *
 * Philosophy: cohesive motion language across the app — same springs everywhere
 * so transitions feel like one piece, not stitched together.
 */
import type { Transition, Variants } from "framer-motion";

// Duration tiers (seconds, as framer-motion expects)
export const duration = {
  instant: 0.15, // micro-feedback (hover, focus, selection)
  quick: 0.25,   // button press, tab switch, icon swap, toast
  smooth: 0.4,   // page transitions, modal fade, card reveal
  dramatic: 0.7, // game enter/exit, win screen, hero reveal
  ambient: 2.0,  // background orbs, breathing loops
} as const;

// Spring presets
export const spring = {
  soft:   { type: "spring", stiffness: 170, damping: 26, mass: 1 } as Transition,
  snappy: { type: "spring", stiffness: 400, damping: 30 } as Transition,
  bouncy: { type: "spring", stiffness: 260, damping: 14 } as Transition,
  slow:   { type: "spring", stiffness: 80,  damping: 20 } as Transition,
  game:   { type: "spring", stiffness: 500, damping: 18 } as Transition,
} as const;

// Easing curves (cubic-bezier arrays for framer-motion)
export const ease = {
  out:  [0.22, 1, 0.36, 1] as const,
  in:   [0.64, 0, 0.78, 0] as const,
  snap: [0.34, 1.56, 0.64, 1] as const, // playful overshoot
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

// Page transition variants — picked by PageTransition based on navigation direction
export const pageVariants = {
  // iOS-style push: new page slides in from right, old parallax-depths to left
  push: {
    initial: { x: "100%", opacity: 1 },
    animate: { x: 0, opacity: 1, transition: spring.soft },
    exit:    { x: "-30%", opacity: 0.6, transition: { duration: duration.smooth, ease: ease.out } },
  } satisfies Variants,

  // Reverse of push
  pop: {
    initial: { x: "-30%", opacity: 0.6 },
    animate: { x: 0, opacity: 1, transition: spring.snappy },
    exit:    { x: "100%", opacity: 1, transition: { duration: duration.smooth, ease: ease.out } },
  } satisfies Variants,

  // Tab switch: fade + subtle scale, no slide
  tab: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: duration.quick, ease: ease.out } },
    exit:    { opacity: 0, scale: 0.98, transition: { duration: duration.instant, ease: ease.in } },
  } satisfies Variants,

  // Modal: slides up from bottom
  modal: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1, transition: spring.slow },
    exit:    { y: "100%", opacity: 0, transition: { duration: duration.smooth, ease: ease.in } },
  } satisfies Variants,

  // Game enter: dramatic zoom with blur
  gameEnter: {
    initial: { scale: 1.4, opacity: 0, filter: "blur(20px)" },
    animate: { scale: 1, opacity: 1, filter: "blur(0px)", transition: { duration: duration.dramatic, ease: ease.snap } },
    exit:    { scale: 0.9, opacity: 0, filter: "blur(10px)", transition: { duration: duration.smooth, ease: ease.in } },
  } satisfies Variants,
} as const;

// Signature motions — recurring brand patterns
export const blissBloom: Variants = {
  initial: { scale: 0.8, opacity: 0, y: 12 },
  animate: { scale: 1, opacity: 1, y: 0, transition: spring.soft },
};

export const liquidTap = {
  whileTap: { scale: 0.96, filter: "brightness(1.15)" },
  transition: spring.snappy,
};

// Staggered list reveal (for list items on mount/scroll)
export const stagger: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring.soft },
};

// Reduced-motion variants (used when prefers-reduced-motion is set)
export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.instant } },
  exit:    { opacity: 0, transition: { duration: duration.instant } },
};

// ── Einstiegs-Choreografie (Splash, Intro, Gast-Startseite) ──────────
/**
 * Die gemeinsame Handschrift des ersten Eindrucks.
 *
 * WARUM ZENTRAL: Splash, Intro und Gast-Startseite laufen direkt
 * hintereinander. Drei eigene Timings lassen den Einstieg zusammengestueckelt
 * wirken — genau der Eindruck, den die Ueberarbeitung beseitigen soll.
 *
 * WICHTIG zur Bewegungsarmut: Diese Bewegungen sind ZWECKGEBUNDEN und duerfen
 * NICHT an `useAmbientMotion` haengen — das liefert auf nativen Geraeten immer
 * `false` und ist ausschliesslich fuer Endlosschleifen gedacht (siehe dessen
 * Kopfkommentar). Der richtige Riegel ist `useReducedMotion()` von
 * framer-motion: Bei Bewegungsarmut wird `entranceReduced` benutzt, das
 * denselben Endzustand ohne Weg dorthin zeigt.
 */
export const entrance = {
  /** Etwas zieht aus der Tiefe heran. */
  approach: { type: "spring", stiffness: 120, damping: 22, mass: 1.2 } as Transition,
  /** Der Einschlag — kurz und hart, damit er sitzt. */
  impact: { type: "spring", stiffness: 520, damping: 24, mass: 0.8 } as Transition,
  /** Aufbluehen nach dem Einschlag. */
  bloom: { duration: 0.55, ease: ease.out } as Transition,
  /** Aufloesung nach oben, wenn der naechste Bildschirm nachkommt. */
  dissolve: { duration: 0.42, ease: ease.in } as Transition,
} as const;

/** Taktzeiten des Splash in Millisekunden — eine Quelle fuer Bild und Haptik. */
export const splashBeats = {
  approach: 180,
  impact: 620,
  wordmark: 1040,
  sparks: 1180,
  dissolve: 1880,
  done: 2300,
} as const;

/**
 * Endzustand ohne Weg dorthin. Bei Bewegungsarmut sieht der Nutzer dasselbe
 * Bild — nur ohne Reise. Kein zweitklassiges Erlebnis, ein stilles.
 */
export const entranceReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Szenen des Intros treten gestaffelt ein — sichtbar geordnet, nicht zufaellig. */
export const sceneStagger: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

export const sceneItem: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};
