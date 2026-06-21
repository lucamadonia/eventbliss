import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { tvPanel, tvPanelRaised, tvType, tvActiveRing } from './tv-tokens';
import type { TVScore } from './useTVConnection';

/**
 * TVGameOver — the cinematic final screen on the shared big screen.
 *
 * A tasteful winner reveal (spotlight + crown + count-up) followed by the full
 * ranked board of EVERY player (medals for top 3, rank numerals beyond), each
 * row staggered in. One short, capped confetti burst on reveal — gated behind
 * useAmbientMotion so native WebViews stay smooth. Flat-modern, solid panels,
 * transform/opacity animation only.
 */

const spring = { type: 'spring' as const, stiffness: 220, damping: 22 };
const springBouncy = { type: 'spring' as const, stiffness: 280, damping: 16 };

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_COLOR = ['#FFD23F', '#cfd3dc', '#e0915b'];

/* ─── Score count-up (transform-free, just a number tick) ─── */
function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

/* ─── Capped confetti burst — ~26 nodes, stops after one fall, gated ─── */
const CONFETTI_COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#FFD23F', '#26E0C4', '#d779ff'];
function ConfettiBurst() {
  const pieces = Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * Math.PI * 2 + Math.random();
    const dist = 220 + Math.random() * 360;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 120,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 8,
      rotate: Math.random() * 540 - 270,
      duration: 1.6 + Math.random() * 1,
      delay: Math.random() * 0.2,
      round: i % 2 === 0,
    };
  });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: p.round ? p.size * 0.8 : p.size,
            height: p.round ? p.size * 0.8 : p.size * 0.45,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: [1, 1, 0], scale: [0, 1, 0.6] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

/* ─── Player avatar ─── */
function Avatar({ name, color, size, glow }: { name: string; color: string; size: string; glow?: boolean }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: `calc(${size} * 0.42)`,
        background: color,
        ...(glow ? tvActiveRing(color) : {}),
      }}
    >
      {name?.slice(0, 1).toUpperCase()}
    </div>
  );
}

/* ─── Main TVGameOver ─── */
export default function TVGameOver({ scores }: { scores: TVScore[] }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  // Reveal beats: 0 = drumroll, 1 = winner up, 2 = board fills in.
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setBeat(1), 1100);
    const t2 = setTimeout(() => setBeat(2), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const winnerScore = useCountUp(winner?.score ?? 0, 1.4, beat >= 1);

  if (!winner) {
    return <div className="min-h-screen" style={{ backgroundColor: '#060810' }} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-[clamp(1.5rem,3vh,3rem)] p-[clamp(1.5rem,3vw,3.5rem)] relative overflow-hidden"
      style={{ backgroundColor: '#060810' }}
    >
      {/* Static winner wash (no loop) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${winner.color}1f` }}
      />

      {/* One capped confetti burst when the winner lands */}
      {beat >= 1 && ambient && <ConfettiBurst />}

      {/* Headline */}
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
          {t('tv.andTheWinnerIs', 'Und der Gewinner ist')}
        </span>
      </motion.div>

      {/* Winner card — spotlight + crown + count-up */}
      <motion.div
        className={`${tvPanelRaised} relative flex items-center gap-[clamp(1rem,2vw,2rem)] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1.25rem,2.4vw,2.5rem)]`}
        style={beat >= 1 ? tvActiveRing(winner.color) : undefined}
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...springBouncy, delay: 0.1 }}
      >
        <motion.div
          className="absolute -top-[clamp(1.4rem,2.6vw,2.6rem)] left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springBouncy, delay: 0.35 }}
        >
          <Crown
            style={{
              width: 'clamp(2.5rem,4vw,4rem)',
              height: 'clamp(2.5rem,4vw,4rem)',
              color: '#FFD23F',
              filter: 'drop-shadow(0 0 14px rgba(255,210,63,0.6))',
            }}
          />
        </motion.div>

        <Avatar name={winner.name} color={winner.color} size="clamp(4.5rem,8vw,8rem)" glow />

        <div className="flex flex-col items-start leading-tight">
          <span
            className="font-black text-white"
            style={{ fontSize: tvType.display, lineHeight: 1 }}
          >
            {winner.name}
          </span>
          <span
            className="font-black tabular-nums"
            style={{ fontSize: tvType.title, color: winner.color }}
          >
            {winnerScore.toLocaleString('de-DE')}{' '}
            <span className="font-bold" style={{ fontSize: tvType.body, color: '#b3a8c9' }}>
              {t('tv.points', 'Punkte')}
            </span>
          </span>
        </div>
      </motion.div>

      {/* Full ranked board — every player, staggered */}
      <motion.div
        className={`${tvPanel} w-full max-w-[min(54rem,90vw)] p-[clamp(1rem,1.6vw,1.75rem)] flex flex-col gap-2.5 max-h-[42vh] overflow-y-auto`}
        initial={{ opacity: 0 }}
        animate={{ opacity: beat >= 2 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {sorted.map((entry, i) => {
          const isLeader = i === 0;
          return (
            <motion.div
              key={`${entry.name}-${i}`}
              className="flex items-center gap-[clamp(0.75rem,1.4vw,1.5rem)] rounded-2xl px-[clamp(0.85rem,1.4vw,1.5rem)] py-[clamp(0.6rem,1vw,1rem)]"
              style={{
                background: isLeader ? `linear-gradient(120deg, ${entry.color}1f, #140e24 60%)` : '#140e24',
                border: `1.5px solid ${isLeader ? `${entry.color}66` : 'rgba(255,255,255,0.08)'}`,
              }}
              initial={{ opacity: 0, x: -24 }}
              animate={beat >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
              transition={{ ...spring, delay: 0.05 + i * 0.06 }}
            >
              <span
                className="shrink-0 font-black tabular-nums text-center"
                style={{ fontSize: tvType.title, width: '1.6em', color: i < 3 ? RANK_COLOR[i] : '#6b6480' }}
              >
                {i < 3 ? MEDAL[i] : i + 1}
              </span>
              <Avatar name={entry.name} color={entry.color} size="clamp(2.5rem,3.4vw,3.5rem)" />
              <span
                className="flex-1 min-w-0 truncate font-bold text-white"
                style={{ fontSize: tvType.body }}
              >
                {entry.name}
              </span>
              <span
                className="shrink-0 font-black tabular-nums"
                style={{ fontSize: tvType.body, color: isLeader ? entry.color : '#b3a8c9' }}
              >
                {entry.score.toLocaleString('de-DE')}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
