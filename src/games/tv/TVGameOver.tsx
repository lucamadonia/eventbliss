import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TVScore } from './useTVConnection';

const CONFETTI_COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#fbbf24', '#00deec', '#d779ff', '#ff7675', '#55efc4'];
const spring = { type: 'spring' as const, stiffness: 200, damping: 15 };
const springBouncy = { type: 'spring' as const, stiffness: 300, damping: 12 };

type Stage = 'drumroll' | 'reveal' | 'podium';

/* ─── Ambient particles ─── */
function AmbientParticles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.15,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Confetti burst (100 particles) ─── */
function ConfettiExplosion() {
  const pieces = Array.from({ length: 100 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 500;
    return {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed - 200,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 4 + Math.random() * 10,
      rotation: Math.random() * 720 - 360,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 0.3,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  });
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: p.shape === 'rect' ? p.size : p.size * 0.7,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size * 0.7,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            rotate: p.rotation,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ─── Expanding pulsing rings ─── */
function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 0.4, 0.8].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[#fbbf24]"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{
            width: [0, 600],
            height: [0, 600],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

/* ─── Animated dots ─── */
function AnimatedDots() {
  return (
    <span className="inline-flex gap-1 ml-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.span
          key={i}
          className="text-5xl text-[#a8abb3]"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, delay, repeat: Infinity }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Screen flash effect ─── */
function ScreenFlash() {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.8, 0] }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'radial-gradient(circle, #fbbf24, #df8eff)',
      }}
    />
  );
}

/* ─── Main TVGameOver ─── */
export default function TVGameOver({ scores }: { scores: TVScore[] }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const [stage, setStage] = useState<Stage>('drumroll');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('reveal'), 2000);
    const t2 = setTimeout(() => setStage('podium'), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const winnerScore = useCountUp(winner?.score ?? 0, 1.5, stage === 'reveal' || stage === 'podium');

  // Display order: 2nd(left), 1st(center), 3rd(right)
  const displayOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const podiumMeta = [
    { height: 160, color: '#a8abb3', label: '2nd', emoji: '🥈' },
    { height: 220, color: '#fbbf24', label: '1st', emoji: '👑' },
    { height: 120, color: '#cd7f32', label: '3rd', emoji: '🥉' },
  ];

  const remaining = sorted.slice(3);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ backgroundColor: '#060810' }}>
      <AmbientParticles />

      {/* Stage 1: Drumroll */}
      <AnimatePresence mode="wait">
        {stage === 'drumroll' && (
          <motion.div
            key="drumroll"
            className="text-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          >
            {/* Violet glow building */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  'radial-gradient(circle at 50% 50%, rgba(223,142,255,0) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(223,142,255,0.15) 0%, transparent 70%)',
                ],
              }}
              transition={{ duration: 2, ease: 'easeIn' }}
            />
            <motion.h2
              className="text-5xl md:text-6xl font-bold text-[#a8abb3] tracking-wide"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ textShadow: '0 0 30px rgba(223,142,255,0.3)' }}
            >
              Und der Gewinner ist
              <AnimatedDots />
            </motion.h2>
          </motion.div>
        )}

        {/* Stage 2: Winner Reveal */}
        {stage === 'reveal' && winner && (
          <motion.div
            key="reveal"
            className="text-center z-10 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.5 }}
          >
            <ScreenFlash />
            <ConfettiExplosion />
            <PulsingRings />

            {/* Giant avatar */}
            <motion.div
              className="mx-auto mb-8 w-32 h-32 rounded-full flex items-center justify-center text-5xl font-black text-white"
              style={{
                background: winner.color,
                boxShadow: `0 0 60px ${winner.color}88, 0 0 120px ${winner.color}44`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springBouncy}
            >
              {winner.name.charAt(0).toUpperCase()}
            </motion.div>

            {/* Winner name */}
            <motion.h1
              className="text-6xl md:text-8xl font-black italic leading-none mb-6"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 40%, #fbbf24 60%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.5))',
              }}
              initial={{ scale: 0, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springBouncy, delay: 0.2 }}
            >
              {winner.name}
            </motion.h1>

            {/* Score counting up */}
            <motion.p
              className="text-4xl md:text-5xl font-bold text-[#8ff5ff] tabular-nums"
              style={{ textShadow: '0 0 30px rgba(143,245,255,0.5)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {winnerScore.toLocaleString('de-DE')} Punkte
            </motion.p>
          </motion.div>
        )}

        {/* Stage 3: Podium */}
        {stage === 'podium' && (
          <motion.div
            key="podium"
            className="w-full max-w-5xl z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ConfettiExplosion />

            {/* Podium blocks */}
            <div className="flex items-end justify-center gap-6 mb-12">
              {displayOrder.map((entry, i) => {
                if (!entry) return null;
                const meta = podiumMeta[i];
                const actualRank = sorted.indexOf(entry);
                const gradients: Record<number, string> = {
                  0: 'linear-gradient(to top, #fbbf2433, #fbbf2410)',
                  1: 'linear-gradient(to top, #a8abb333, #a8abb310)',
                  2: 'linear-gradient(to top, #cd7f3233, #cd7f3210)',
                };
                return (
                  <motion.div
                    key={entry.name}
                    className="flex flex-col items-center"
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...spring, delay: 0.3 + (2 - i) * 0.3 }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white mb-3"
                      style={{
                        background: entry.color,
                        boxShadow: actualRank === 0
                          ? `0 0 40px ${entry.color}88, 0 0 80px rgba(251,191,36,0.3)`
                          : `0 0 20px ${entry.color}44`,
                      }}
                    >
                      {entry.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <span className="text-xl font-bold text-white mb-1">{entry.name}</span>

                    {/* Score */}
                    <span className="text-lg font-bold mb-3" style={{ color: meta.color }}>
                      {entry.score.toLocaleString('de-DE')} Punkte
                    </span>

                    {/* Podium block */}
                    <motion.div
                      className="w-36 rounded-t-2xl flex flex-col items-center justify-start pt-5"
                      style={{
                        background: gradients[actualRank] ?? gradients[2],
                        border: `1px solid ${meta.color}44`,
                        borderBottom: 'none',
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: meta.height }}
                      transition={{ delay: 0.6 + (2 - i) * 0.3, duration: 0.8, ease: 'easeOut' }}
                    >
                      <span className="text-3xl mb-1">{meta.emoji}</span>
                      <span className="text-2xl font-black" style={{ color: meta.color }}>
                        #{actualRank + 1}
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Remaining players */}
            {remaining.length > 0 && (
              <motion.div
                className="max-w-2xl mx-auto space-y-3 mb-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                {remaining.map((entry, i) => (
                  <div
                    key={entry.name}
                    className="flex items-center gap-4 px-6 py-3 rounded-xl"
                    style={{
                      background: 'rgba(21,26,33,0.5)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="text-2xl font-black text-[#a8abb3]/40 w-10 text-center">
                      {i + 4}
                    </span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: entry.color }}
                    >
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-lg font-bold text-[#f1f3fc] flex-1">{entry.name}</span>
                    <span className="text-lg font-bold text-[#a8abb3] tabular-nums">
                      {entry.score.toLocaleString('de-DE')}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Nochmal spielen button */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              <button
                className="px-10 py-4 rounded-2xl text-xl font-black text-white tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #df8eff, #ff6b98)',
                  boxShadow: '0 0 30px rgba(223,142,255,0.3), 0 0 60px rgba(223,142,255,0.1)',
                }}
              >
                🎮 NOCHMAL SPIELEN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
