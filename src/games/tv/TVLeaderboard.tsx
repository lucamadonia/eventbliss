import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { TVScore } from './useTVConnection';

const spring = { type: 'spring' as const, stiffness: 200, damping: 20 };

/* ─── Animated counter ─── */
function CountUp({ target, duration = 1, delay = 0 }: { target: number; duration?: number; delay?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return <>{value.toLocaleString('de-DE')}</>;
}

/* ─── Rank change indicator ─── */
function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return null;
  if (current < previous) {
    return <span className="text-lg font-bold text-green-400 ml-2">↑</span>;
  }
  if (current > previous) {
    return <span className="text-lg font-bold text-red-400 ml-2">↓</span>;
  }
  return <span className="text-lg font-bold text-[#a8abb3]/40 ml-2">—</span>;
}

/* ─── Main TVLeaderboard ─── */
export default function TVLeaderboard({
  scores,
  previousRanks,
}: {
  scores: TVScore[];
  previousRanks?: Record<string, number>;
}) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0]?.score ?? 1;

  // Reveal from bottom to top
  const reversed = [...sorted].reverse();

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-12"
      style={{ backgroundColor: '#060810' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Title */}
      <motion.h1
        className="text-7xl font-black italic tracking-tighter mb-16 text-center"
        style={{
          background: 'linear-gradient(135deg, #df8eff, #8ff5ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(223,142,255,0.4))',
        }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        RANGLISTE
      </motion.h1>

      {/* Leaderboard rows — revealed bottom-to-top */}
      <div className="w-full max-w-3xl space-y-4">
        {reversed.map((entry, revIdx) => {
          const rank = sorted.indexOf(entry);
          const isFirst = rank === 0;
          const isTop3 = rank < 3;
          const staggerDelay = 0.4 * revIdx;

          return (
            <motion.div
              key={entry.name}
              className={`flex items-center gap-6 px-8 py-5 rounded-2xl border ${isTop3 ? 'border-white/10' : 'border-white/5'}`}
              style={{
                background: isFirst
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))'
                  : isTop3
                    ? 'rgba(21,26,33,0.6)'
                    : 'rgba(15,20,26,0.4)',
                boxShadow: isFirst
                  ? '0 0 30px rgba(251,191,36,0.3)'
                  : isTop3
                    ? '0 0 15px rgba(168,171,179,0.1)'
                    : 'none',
              }}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ...spring, delay: staggerDelay }}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-14 text-center flex items-center justify-center">
                {isFirst ? (
                  <Crown
                    className="w-10 h-10 mx-auto"
                    style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.7))' }}
                  />
                ) : (
                  <span className={`text-3xl font-black ${isTop3 ? 'text-[#a8abb3]' : 'text-[#a8abb3]/40'}`}>
                    {rank + 1}
                  </span>
                )}
                <RankChange current={rank + 1} previous={previousRanks?.[entry.name]} />
              </div>

              {/* Avatar */}
              <div
                className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${isFirst ? 'w-16 h-16 text-2xl' : 'w-14 h-14 text-xl'}`}
                style={{
                  background: entry.color,
                  boxShadow: isFirst ? `0 0 25px ${entry.color}66` : 'none',
                }}
              >
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + Score bar */}
              <div className="flex-1 min-w-0">
                <span className={`text-2xl font-bold block mb-2 ${isFirst ? 'text-[#fbbf24]' : 'text-[#f1f3fc]'}`}>
                  {entry.name}
                </span>
                {/* Score bar */}
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #df8eff, #8ff5ff)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${(entry.score / maxScore) * 100}%` }}
                    transition={{ duration: 1.2, delay: staggerDelay + 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Score */}
              <span
                className={`text-3xl font-black tabular-nums flex-shrink-0 ${isFirst ? 'text-[#fbbf24]' : isTop3 ? 'text-[#df8eff]' : 'text-[#a8abb3]'}`}
                style={isFirst ? { textShadow: '0 0 15px rgba(251,191,36,0.4)' } : undefined}
              >
                <CountUp target={entry.score} duration={1} delay={staggerDelay + 0.2} />
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
