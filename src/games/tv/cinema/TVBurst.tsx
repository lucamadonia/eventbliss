import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { confettiBurst, partyEase } from '@/lib/party-motion';

/**
 * Feier-Moment: Schockwelle + Funkenregen aus der Bildmitte. Nur transform und
 * opacity (TV-GPUs); Partikel deterministisch verteilt, damit zwei Fernseher
 * dasselbe Bild zeigen. Bei Bewegungsarmut nur ein kurzes Aufleuchten.
 */
export default function TVBurst({ colors, count = 56, delay = 0 }: { colors: string[]; count?: number; delay?: number }) {
  const reduced = !!useReducedMotion();
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => {
    // Goldener Winkel → gleichmaessige, aber nicht starre Verteilung.
    const angle = i * 2.39996;
    const dist = 22 + ((i * 37) % 30);
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.62 - 4,
      size: 0.6 + ((i * 13) % 10) / 10,
      rotate: (i * 47) % 360,
      color: colors[i % colors.length],
      round: i % 3 === 0,
      lag: ((i * 7) % 10) / 60,
    };
  }), [colors, count]);

  if (reduced) {
    return (
      <motion.div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 45%, ${colors[0]}44, transparent 60%)` }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: confettiBurst.reducedFlashMs / 1000, delay }} />
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={`ring-${ring}`}
          className="absolute left-1/2 top-[42%] rounded-full"
          style={{ width: '30vh', height: '30vh', marginLeft: '-15vh', marginTop: '-15vh', border: `2px solid ${colors[ring % colors.length]}` }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 4.5, opacity: 0 }}
          transition={{ duration: 1.4, ease: partyEase.out, delay: delay + ring * 0.16 }}
        />
      ))}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute left-1/2 top-[42%] ${p.round ? 'rounded-full' : 'rounded-[2px]'}`}
          style={{ width: `${p.size}vh`, height: `${p.round ? p.size : p.size * 1.8}vh`, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{ x: `${p.x}vw`, y: [`0vh`, `${p.y}vh`, `${p.y + 26}vh`], opacity: [0, 1, 0], rotate: p.rotate + 540, scale: 1 }}
          transition={{ duration: confettiBurst.durationMs / 1000, ease: partyEase.out, delay: delay + p.lag, times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
