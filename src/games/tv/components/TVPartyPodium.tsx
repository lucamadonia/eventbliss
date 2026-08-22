import { motion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import { tvPanel, tvPanelRaised, tvType, tvActiveRing } from '../tv-tokens';
import { useCountUp } from '../useCountUp';
import TVRankDelta from './TVRankDelta';
import type { PartyStanding } from '../party-types';

/**
 * TVPartyPodium — the top-3 broadcast moment shared by the between-games
 * standings and the end-of-night finale.
 *
 * Columns rise in place order (2 · 1 · 3), the leader wears the crown and the
 * only accent ring on screen, and every total counts up. Reveal is driven from
 * the outside so the parent scene owns the beat timeline.
 */
const spring = { type: 'spring' as const, stiffness: 240, damping: 20 };

/** Plinth height per place — first place towers, third is a step. */
const PLINTH = ['clamp(6.5rem,12vh,11rem)', 'clamp(4.5rem,8.5vh,8rem)', 'clamp(3rem,5.5vh,5.5rem)'];
const AVATAR = ['clamp(4.5rem,7vw,7.5rem)', 'clamp(3.4rem,5.2vw,5.5rem)', 'clamp(3rem,4.6vw,5rem)'];
const PLACE_COLOR = ['#FFD23F', '#cfd3dc', '#e0915b'];

interface Props {
  /** already ranked; only the first three are used */
  entries: PartyStanding[];
  /** gate the reveal — the parent scene flips this on its own beat */
  reveal: boolean;
  /** show the ▲/▼ chip versus the previous game (standings) or hide it (finale) */
  showDelta?: boolean;
  className?: string;
}

function PodiumColumn({
  entry,
  place,
  reveal,
  showDelta,
}: {
  entry: PartyStanding;
  place: number;
  reveal: boolean;
  showDelta: boolean;
}) {
  const points = useCountUp(entry.points, 1.3, reveal);
  const isLeader = place === 0;

  return (
    <motion.div
      className="flex flex-col items-center justify-end gap-[clamp(0.4rem,0.8vh,0.9rem)] min-w-0"
      initial={{ opacity: 0, y: 30 }}
      animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ ...spring, delay: 0.08 + place * 0.12 }}
    >
      {isLeader && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.6 }}
          animate={reveal ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.6 }}
          transition={{ ...spring, delay: 0.45 }}
        >
          <Crown
            style={{
              width: 'clamp(2rem,3.2vw,3.4rem)',
              height: 'clamp(2rem,3.2vw,3.4rem)',
              color: '#FFD23F',
              filter: 'drop-shadow(0 0 14px rgba(255,210,63,0.55))',
            }}
          />
        </motion.div>
      )}

      <div
        className="rounded-full flex items-center justify-center font-black text-white shrink-0"
        style={{
          width: AVATAR[place],
          height: AVATAR[place],
          fontSize: `calc(${AVATAR[place]} * 0.44)`,
          background: entry.color,
          ...(isLeader ? tvActiveRing(entry.color) : {}),
        }}
      >
        {entry.avatar || entry.name?.slice(0, 1).toUpperCase()}
      </div>

      <div className="flex flex-col items-center gap-[0.15em] min-w-0 w-full">
        <span
          className="font-black text-white truncate max-w-full text-center"
          style={{ fontSize: isLeader ? tvType.title : tvType.body }}
        >
          {entry.name}
        </span>
        <div className="flex items-center gap-[0.5em]">
          <span
            className="font-black tabular-nums"
            style={{ fontSize: isLeader ? tvType.title : tvType.body, color: entry.color }}
          >
            {points.toLocaleString('de-DE')}
          </span>
          {showDelta && <TVRankDelta rank={entry.rank} prevRank={entry.prevRank} size={tvType.label} />}
          {(entry.streak ?? 0) >= 2 && (
            <span
              className="inline-flex items-center gap-[0.15em] font-black tabular-nums"
              style={{ fontSize: tvType.label, color: '#ff6b98' }}
            >
              <Flame style={{ width: '1em', height: '1em' }} strokeWidth={2.5} />
              {entry.streak}
            </span>
          )}
        </div>
      </div>

      {/* Plinth */}
      <motion.div
        className={`${isLeader ? tvPanelRaised : tvPanel} w-full flex items-start justify-center pt-[clamp(0.5rem,1vh,1rem)]`}
        style={{
          height: PLINTH[place],
          ...(isLeader ? { background: `linear-gradient(180deg, ${entry.color}26, #16101f 70%)` } : {}),
        }}
        initial={{ scaleY: 0 }}
        animate={reveal ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ ...spring, delay: 0.12 + place * 0.12 }}
      >
        <span
          className="font-black tabular-nums leading-none"
          style={{ fontSize: tvType.display, color: PLACE_COLOR[place] }}
        >
          {entry.rank}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function TVPartyPodium({ entries, reveal, showDelta = false, className }: Props) {
  const top = entries.slice(0, 3);
  if (!top.length) return null;

  // Visual order puts the winner in the middle: 2 · 1 · 3.
  const order = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];

  return (
    <div
      className={`grid items-end gap-[clamp(0.75rem,1.6vw,1.75rem)] w-full ${className ?? ''}`}
      style={{ gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))` }}
    >
      {order.map((place) => (
        <PodiumColumn
          key={top[place].id}
          entry={top[place]}
          place={place}
          reveal={reveal}
          showDelta={showDelta}
        />
      ))}
    </div>
  );
}
