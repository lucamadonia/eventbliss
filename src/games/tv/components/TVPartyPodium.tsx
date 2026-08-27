import { motion, useReducedMotion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import { tvType } from '../tv-tokens';
import { useCountUp } from '../useCountUp';
import TVRankDelta from './TVRankDelta';
import type { PartyStanding } from '../party-types';

/**
 * Victory Circuit Stage — die gemeinsame Top-3-Buehne fuer Zwischenstand,
 * Finale, Telefon und Onboarding. Die drei Sockel sind kein Kartenstapel mehr,
 * sondern ein zusammenhaengendes Show-Objekt mit Lichtspur und klarer Mitte.
 *
 * `variant` veraendert die Dramaturgie, nicht die Ranglogik:
 * - standings: sportlicher, schneller, Rangbewegung bleibt sichtbar
 * - finale: goldener Champion-Moment mit spaeterem Sieger-Lock-in
 * - preview: kompakter Auftritt im Onboarding
 */
const entrance = { type: 'spring' as const, stiffness: 230, damping: 22, mass: 0.8 };
const PLACE_COLOR = ['#FFD75E', '#D9E1F2', '#E99A67'];
const REVEAL_DELAY = [0.42, 0.1, 0.24];

export type TVPartyPodiumVariant = 'standings' | 'finale' | 'preview';

interface Props {
  /** Bereits sortiert; nur die ersten drei Eintraege werden verwendet. */
  entries: PartyStanding[];
  /** Der Eltern-Screen steuert den Reveal-Beat. */
  reveal: boolean;
  /** Rangveraenderung gegenueber dem vorherigen Spiel. */
  showDelta?: boolean;
  /** Eigenstaendige Dramaturgie fuer Zwischenstand, Finale oder Vorschau. */
  variant?: TVPartyPodiumVariant;
  /** Engere Geometrie fuer Telefon und Onboarding. */
  compact?: boolean;
  className?: string;
}

function initials(entry: PartyStanding): string {
  return entry.avatar || entry.name?.slice(0, 1).toUpperCase() || '?';
}

function PodiumColumn({
  entry,
  place,
  reveal,
  showDelta,
  compact,
  reduce,
}: {
  entry: PartyStanding;
  place: number;
  reveal: boolean;
  showDelta: boolean;
  compact: boolean;
  reduce: boolean;
}) {
  const animatedPoints = useCountUp(entry.points, reduce ? 0.01 : 1.15, reveal);
  const isChampion = place === 0;
  const delay = reduce ? 0 : REVEAL_DELAY[place];
  const avatarSize = compact
    ? isChampion ? 'clamp(4rem,18vw,5.5rem)' : 'clamp(3rem,14vw,4.25rem)'
    : isChampion ? 'clamp(5rem,7.2vw,8.5rem)' : 'clamp(3.8rem,5.3vw,6.1rem)';
  const plinthHeight = compact
    ? isChampion ? '6.7rem' : place === 1 ? '4.7rem' : '3.8rem'
    : isChampion ? 'clamp(8rem,14vh,13rem)' : place === 1 ? 'clamp(5.8rem,10vh,9.5rem)' : 'clamp(4.5rem,7.5vh,7rem)';
  const podiumColor = PLACE_COLOR[place];

  return (
    <motion.div
      className="relative flex min-w-0 flex-col items-center justify-end"
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      animate={reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 28 }}
      transition={{ ...entrance, delay }}
      aria-label={`${entry.rank}. ${entry.name}, ${entry.points}`}
    >
      <div className="relative z-20 flex min-w-0 flex-col items-center">
        {isChampion && (
          <motion.div
            className="absolute -top-[2.2rem] left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.45, rotate: reduce ? 0 : -12 }}
            animate={reveal ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : { opacity: 0, y: 10, scale: 0.45 }}
            transition={{ ...entrance, delay: delay + (reduce ? 0 : 0.28) }}
          >
            <Crown
              aria-hidden
              className="text-[#FFD75E]"
              style={{
                width: compact ? '2rem' : 'clamp(2.4rem,3.5vw,4rem)',
                height: compact ? '2rem' : 'clamp(2.4rem,3.5vw,4rem)',
                filter: 'drop-shadow(0 0 18px rgba(255,215,94,.72))',
              }}
              strokeWidth={2.35}
            />
          </motion.div>
        )}

        <motion.div
          className="relative grid shrink-0 place-items-center rounded-full font-black text-white"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize: `calc(${avatarSize} * .38)`,
            background: `linear-gradient(145deg, ${entry.color}, #0c0b18)`,
            border: `2px solid ${isChampion ? podiumColor : 'rgba(255,255,255,.2)'}`,
            boxShadow: isChampion
              ? `0 0 0 5px rgba(7,9,20,.92), 0 0 0 7px ${entry.color}aa, 0 0 48px ${entry.color}88`
              : `0 0 0 4px rgba(7,9,20,.9), 0 14px 36px -18px ${entry.color}`,
          }}
          initial={{ scale: reduce ? 1 : 0.68 }}
          animate={reveal ? { scale: 1 } : { scale: reduce ? 1 : 0.68 }}
          transition={{ ...entrance, delay: delay + (reduce ? 0 : 0.08) }}
        >
          <span aria-hidden>{initials(entry)}</span>
          {isChampion && (
            <motion.span
              aria-hidden
              className="absolute inset-[-11px] rounded-full border border-white/35"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={reveal ? { opacity: [0, 0.9, 0.35], scale: [0.8, 1.12, 1] } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: reduce ? 0.1 : 0.75, delay: delay + 0.18, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </motion.div>

        <div className="mt-3 flex w-full min-w-0 flex-col items-center leading-none">
          <span
            className="max-w-full truncate text-center font-black text-white"
            style={{ fontSize: compact ? (isChampion ? '1rem' : '.78rem') : isChampion ? tvType.title : tvType.body }}
          >
            {entry.name}
          </span>
          <div className="mt-1.5 flex items-center justify-center gap-[.45em]">
            <span
              className="font-black tabular-nums"
              style={{ color: isChampion ? podiumColor : entry.color, fontSize: compact ? '.78rem' : tvType.label }}
            >
              {animatedPoints.toLocaleString('de-DE')}
            </span>
            {showDelta && <TVRankDelta rank={entry.rank} prevRank={entry.prevRank} size={compact ? '.72rem' : tvType.label} />}
            {(entry.streak ?? 0) >= 2 && (
              <span className="inline-flex items-center gap-0.5 font-black tabular-nums text-[#ff6b98]" style={{ fontSize: compact ? '.68rem' : tvType.micro }}>
                <Flame aria-hidden className="h-[1em] w-[1em]" strokeWidth={2.6} />
                {entry.streak}
              </span>
            )}
          </div>
        </div>
      </div>

      <motion.div
        className="relative z-10 mt-2 w-full origin-bottom overflow-hidden rounded-t-[clamp(1rem,2vw,1.8rem)] border-x border-t"
        style={{
          height: plinthHeight,
          borderColor: `${podiumColor}72`,
          background: `linear-gradient(180deg, ${podiumColor}28 0%, ${entry.color}16 26%, rgba(12,10,25,.96) 78%)`,
          boxShadow: isChampion
            ? `inset 0 1px 0 ${podiumColor}aa, inset 0 -36px 60px rgba(0,0,0,.42), 0 0 48px -14px ${entry.color}`
            : 'inset 0 1px 0 rgba(255,255,255,.24), inset 0 -30px 50px rgba(0,0,0,.4)',
        }}
        initial={{ scaleY: reduce ? 1 : 0 }}
        animate={reveal ? { scaleY: 1 } : { scaleY: reduce ? 1 : 0 }}
        transition={{ ...entrance, delay: delay + (reduce ? 0 : 0.04) }}
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div aria-hidden className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px)', backgroundSize: '100% 18px' }} />
        {!reduce && reveal && (
          <motion.div
            aria-hidden
            className="absolute inset-x-2 h-8 bg-gradient-to-b from-transparent via-white/16 to-transparent"
            initial={{ y: '-120%' }}
            animate={{ y: '420%' }}
            transition={{ duration: 1.15, delay: delay + 0.22, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        <span
          className="relative grid h-full place-items-center font-black leading-none tabular-nums"
          style={{
            color: podiumColor,
            fontSize: compact ? (isChampion ? '2.7rem' : '2rem') : tvType.display,
            textShadow: `0 0 28px ${podiumColor}66`,
          }}
        >
          {entry.rank}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function TVPartyPodium({
  entries,
  reveal,
  showDelta = false,
  variant = 'standings',
  compact = false,
  className,
}: Props) {
  const reduce = !!useReducedMotion();
  const top = entries.slice(0, 3);
  if (!top.length) return null;

  // Visuelle Reihenfolge: Platz 2 · Platz 1 · Platz 3.
  const order = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
  const single = order.length === 1;
  const accent = top[0]?.color ?? '#df8eff';

  return (
    <div className={`relative isolate w-full px-1 ${compact ? 'pt-10' : 'pt-14'} ${className ?? ''}`}>
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[42%] -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: compact ? '18rem' : 'min(62vw,52rem)',
          height: compact ? '13rem' : 'min(44vw,34rem)',
          background: `radial-gradient(ellipse, ${accent}${variant === 'finale' ? '45' : '2e'} 0%, transparent 68%)`,
          filter: compact ? 'blur(32px)' : 'blur(58px)',
        }}
        initial={{ opacity: 0, scale: reduce ? 1 : 0.72 }}
        animate={reveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.72 }}
        transition={{ duration: reduce ? 0.1 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {!reduce && reveal && variant !== 'preview' && (
        <div aria-hidden className="absolute inset-x-[8%] top-0 -z-10 flex justify-between overflow-hidden opacity-60">
          {[-18, -7, 7, 18].map((rotate, index) => (
            <motion.span
              key={rotate}
              className="h-[min(48vh,30rem)] w-[10%] origin-top bg-gradient-to-b from-white/18 via-white/5 to-transparent blur-sm"
              style={{ clipPath: 'polygon(42% 0,58% 0,100% 100%,0 100%)' }}
              initial={{ opacity: 0, rotate }}
              animate={{ opacity: [0, 0.9, 0.42], rotate: rotate + (index % 2 ? 2 : -2) }}
              transition={{ duration: 0.9, delay: 0.1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
      )}

      <div
        className="relative z-10 grid items-end gap-[clamp(.45rem,1.4vw,1.5rem)]"
        style={{
          gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))`,
          maxWidth: single ? (compact ? '11rem' : '18rem') : undefined,
          marginInline: single ? 'auto' : undefined,
        }}
      >
        {order.map((place) => (
          <PodiumColumn
            key={top[place].id}
            entry={top[place]}
            place={place}
            reveal={reveal}
            showDelta={showDelta}
            compact={compact}
            reduce={reduce}
          />
        ))}
      </div>

      <motion.div
        aria-hidden
        className="relative z-20 -mt-px h-[clamp(1rem,2.5vh,2rem)] overflow-hidden rounded-b-[clamp(1rem,2vw,1.8rem)] border border-white/15"
        style={{
          background: `linear-gradient(90deg, rgba(11,10,22,.98), ${accent}35 50%, rgba(11,10,22,.98))`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.22), 0 18px 50px -22px ${accent}`,
        }}
        initial={{ opacity: 0, scaleX: reduce ? 1 : 0.62 }}
        animate={reveal ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: reduce ? 1 : 0.62 }}
        transition={{ duration: reduce ? 0.1 : 0.55, delay: reduce ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent" />
      </motion.div>
    </div>
  );
}
