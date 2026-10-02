import type { Variants } from 'framer-motion';
import { partyEase, reduceVariants } from '@/lib/party-motion';

/**
 * Szenenwechsel innerhalb einer Spielansicht (Diskussion → Abstimmung …):
 * die neue Szene schaerft sich aus leichter Unschaerfe heraus, die alte tritt
 * schneller ab. Gleiche Kurven wie Handys und Wartebereich.
 */
const scene: Variants = {
  initial: { opacity: 0, scale: 1.025, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.55, ease: partyEase.out } },
  exit: { opacity: 0, scale: 0.985, filter: 'blur(6px)', transition: { duration: 0.28, ease: partyEase.exit } },
};

export function sceneVariants(reduced: boolean): Variants {
  return reduced ? reduceVariants(scene) : scene;
}

/** Gestaffelter Auftritt von Karten in einer Szene. */
export const staggerChildren = (stepMs = 60): Variants => ({
  initial: {},
  animate: { transition: { staggerChildren: stepMs / 1000, delayChildren: 0.12 } },
});

export const riseIn = (reduced: boolean): Variants => (reduced
  ? reduceVariants({ initial: { opacity: 0 }, animate: { opacity: 1 } })
  : {
    initial: { opacity: 0, y: 24, scale: 0.94 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: partyEase.out } },
  });
