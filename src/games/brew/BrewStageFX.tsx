import { AnimatePresence, motion } from "framer-motion";
import type { DrawnCard } from "./DrawReveal";

interface BrewStageFXProps {
  drawnCard: DrawnCard | null;
  pourSeq: number;
  pouring: boolean;
  accent: string;
  danger: string;
  reduced?: boolean;
}

/** Zustandsgebundene Reaktor-Effekte. Jede Sequenz wird nur einmal gemountet. */
export function BrewStageFX({ drawnCard, pourSeq, pouring, accent, danger, reduced }: BrewStageFXProps) {
  const outcome = drawnCard?.outcome;
  const color = outcome === "bust" ? danger : accent;
  const burstKey = drawnCard ? `draw-${drawnCard.seq}` : pouring ? `pour-${pourSeq}` : null;

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden" aria-hidden>
      <AnimatePresence mode="sync">
        {burstKey && (
          <motion.div key={burstKey} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}>
            <motion.div
              className="absolute left-1/2 top-[43%] h-20 w-20 rounded-full border-2"
              style={{ borderColor: color, boxShadow: `0 0 35px ${color}, inset 0 0 25px ${color}55` }}
              initial={{ x: "-50%", y: "-50%", scale: 0.25, opacity: 1 }}
              animate={{ scale: outcome === "bust" ? 5.2 : pouring ? 3.8 : 2.8, opacity: 0 }}
              transition={{ duration: outcome === "bust" ? 0.7 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            />
            {(outcome === "hit" || outcome === "bust" || pouring) && Array.from({ length: outcome === "bust" ? 18 : 12 }).map((_, i) => {
              const angle = (Math.PI * 2 * i) / (outcome === "bust" ? 18 : 12);
              const distance = outcome === "bust" ? 180 + (i % 3) * 22 : 105 + (i % 4) * 16;
              return (
                <motion.span key={i} className="absolute left-1/2 top-[43%] h-1.5 w-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                  initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                  animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, scale: [0.2, 1.5, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.65 + (i % 3) * 0.08, delay: (i % 4) * 0.025, ease: "easeOut" }}
                />
              );
            })}
            {pouring && (
              <motion.div className="absolute left-1/2 top-6 h-[245px] w-5 -translate-x-1/2 origin-bottom rounded-full"
                style={{ background: `linear-gradient(180deg, transparent, ${accent}55 18%, white 48%, ${accent} 72%, transparent)`, boxShadow: `0 0 26px ${accent}` }}
                initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: [0, 1, 0.92], opacity: [0, 1, 0.65] }} exit={{ opacity: 0 }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} />
            )}
            {outcome === "bust" && (
              <motion.div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 43%, ${danger}80, transparent 68%)` }}
                initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0] }} transition={{ duration: 0.62 }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
