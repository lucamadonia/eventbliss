import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { partyMotion } from '@/lib/party-motion';

/**
 * Buehne fuer Spielphasen (Design §9, P1): Die alte Phase weicht nach hinten,
 * die neue kommt aus der Tiefe (`phaseStage`) — statt eines harten Schnitts,
 * wenn eine Ansicht pro Phase einen eigenen Baum rendert.
 *
 * Nur fuer Phasen mit eigenem Layout verwenden: Wer innerhalb einer Szene
 * weiterlaeuft (Flaschenrotation, Zeichenflaeche), darf nicht neu einhaengen.
 */
export default function TVPhaseStage({ phase, children, className = '' }: { phase: string; children: ReactNode; className?: string }) {
  const reduced = !!useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={phase}
        data-testid="tv-phase-stage"
        data-phase={phase}
        className={`absolute inset-0 ${className}`}
        variants={partyMotion('phaseStage', reduced)}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
