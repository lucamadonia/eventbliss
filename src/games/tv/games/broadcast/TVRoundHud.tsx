import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import { tvPanel } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';

const DIM = '#a8abb3';

/**
 * Kopfzeile fuer Spielansichten auf dem Fernseher: links Phase + Runde,
 * rechts frei (Kategorie, Uhr …). Sitzt im 5-%-Sicherheitsrand; die Mitte
 * oben bleibt frei — dort zeigt der TVScreen die Weitergabe.
 */
export interface HudPhase { text: string; color: string }

export function TVPhasePill({ phase }: { phase: HudPhase }) {
  const reduced = !!useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={phase.text} data-testid="tv-phase-pill"
        className="flex items-center gap-3 rounded-full px-6 py-2"
        style={{ background: `${phase.color}1f`, border: `1px solid ${phase.color}4d` }}
        variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate" exit="exit">
        <span aria-hidden className="rounded-full" style={{ width: lu(1), height: lu(1), background: phase.color, boxShadow: `0 0 12px ${phase.color}` }} />
        <span className="font-bold" style={{ fontSize: lu(2.4), color: phase.color }}>{phase.text}</span>
      </motion.div>
    </AnimatePresence>
  );
}

export function TVRoundPill({ round, total }: { round: number; total?: number | string }) {
  const { t } = useTranslation();
  const hasTotal = total !== undefined && total !== '' && total !== '?' && Number(total) > 0;
  return (
    <div className={`${tvPanel} px-5 py-2`} data-testid="tv-round-pill">
      <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: DIM }}>
        {hasTotal
          ? t('tvCinema.roundOf', 'Runde {{round}} von {{total}}', { round, total })
          : t('tvCinema.round', 'Runde {{round}}', { round })}
      </span>
    </div>
  );
}

export default function TVRoundHud({ phase, round, total, right }: {
  phase?: HudPhase | null; round?: number; total?: number | string; right?: ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute left-[5vw] right-[5vw] top-[5vh] z-20 flex items-start justify-between gap-6">
      <div className="flex items-center gap-3">
        {phase && <TVPhasePill phase={phase} />}
        {typeof round === 'number' && round > 0 && <TVRoundPill round={round} total={total} />}
      </div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

/** Ruhige Kategorie-/Modus-Pille fuer die rechte Seite der Kopfzeile. */
export function TVHudChip({ children, color = '#df8eff' }: { children: ReactNode; color?: string }) {
  return (
    <div className="rounded-full px-5 py-2" style={{ background: `${color}14`, border: `1px solid ${color}4d` }}>
      <span className="font-bold" style={{ fontSize: lu(2.4), color: '#f1f3fc' }}>{children}</span>
    </div>
  );
}
