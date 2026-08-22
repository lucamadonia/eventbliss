import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { tvPanel, tvType } from './tv-tokens';
import TVScoreboard from './components/TVScoreboard';
import type { TVScore } from './useTVConnection';
import type { PartyNightState } from './party-types';

/**
 * TVLeaderboard — the between-rounds standings on the shared big screen.
 *
 * Shows the FULL party (every player), ranked, with a leader spotlight and the
 * smooth animated reorder TVScoreboard already does via `layout`. Quick to read
 * since it only flashes up between rounds: a "Zwischenstand · Rang X" header,
 * then the complete board in a clean rail. Flat-modern, solid panels,
 * transform/opacity animation only.
 */

const spring = { type: 'spring' as const, stiffness: 220, damping: 22 };

export default function TVLeaderboard({
  scores,
  previousRanks,
  party,
}: {
  scores: TVScore[];
  /** optional: drives the up/down arrow per player when the host sends prior ranks */
  previousRanks?: Record<string, number>;
  /** optional Party Night context — adds the evening's rank/points chip per player */
  party?: PartyNightState | null;
}) {
  const { t } = useTranslation();
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  // TVScoreboard keys players by id — names are our stable identity here.
  const players = sorted.map((s) => {
    const rank = sorted.indexOf(s) + 1;
    const prev = previousRanks?.[s.name];
    let arrow = '';
    if (prev !== undefined) arrow = rank < prev ? '▲' : rank > prev ? '▼' : '—';
    return {
      id: s.name,
      name: s.name,
      color: s.color,
      score: s.score,
      subtitle: arrow || undefined,
    };
  });

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center gap-[clamp(1.5rem,3vh,3rem)] p-[clamp(1.5rem,3vw,3.5rem)] relative overflow-hidden"
      style={{ backgroundColor: '#060810' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Static brand wash (no loop) */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[52rem] h-[34rem] rounded-full blur-[110px] pointer-events-none"
        style={{ background: 'rgba(223,142,255,0.10)' }}
      />

      {/* Header — Zwischenstand */}
      <motion.div
        className="relative text-center"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <span
          className="uppercase font-black tracking-[0.3em]"
          style={{ fontSize: tvType.label, color: '#b3a8c9' }}
        >
          {t('tv.standings', 'Zwischenstand')}
        </span>
        <div className="font-black text-white" style={{ fontSize: tvType.title }}>
          {t('tv.leaderboard', 'Rangliste')}
        </div>
      </motion.div>

      {/* Full party board — animated reorder, leader spotlight, every player */}
      <motion.div
        className={`${tvPanel} relative w-full max-w-[min(48rem,90vw)] p-[clamp(1rem,1.8vw,2rem)] max-h-[64vh] overflow-y-auto`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.1 }}
      >
        <TVScoreboard players={players} party={party} layout="rail" sort="score" activeId={null} />
      </motion.div>
    </motion.div>
  );
}
