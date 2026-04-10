import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

export default function TVBombView({ gameState }: { gameState: any }) {
  const player = gameState?.players?.[gameState?.currentPlayerIndex]?.name || gameState?.currentPlayer || '';
  const playerColor = gameState?.players?.[gameState?.currentPlayerIndex]?.color || '#df8eff';
  const task = gameState?.currentTask || gameState?.task || '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || 5;
  const phase = gameState?.phase || 'playing';
  const progress = gameState?.progress || 0;
  const exploded = gameState?.players?.[gameState?.explodedPlayerIndex]?.name || '';

  const pulseSpeed = useMemo(() => Math.max(0.15, 1.2 - progress * 1.1), [progress]);
  const bombGlow = useMemo(() => 0.2 + progress * 0.8, [progress]);

  // Circular timer: SVG arc calculation
  const circleRadius = 130;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progress);

  if (phase === 'explosion') {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: '#060810' }}
        animate={{ x: [0, -20, 20, -15, 15, -8, 8, 0] }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Red flash overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3] }}
          transition={{ duration: 0.8 }}
        />

        {/* Explosion particles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const rad = (angle * Math.PI) / 180;
          const dist = 150 + Math.random() * 200;
          return (
            <motion.div
              key={i}
              className="absolute text-5xl"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(rad) * dist,
                y: Math.sin(rad) * dist,
                opacity: 0,
                scale: 0.3,
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {['*', '\u2728', '\u26A1', '\u2B50'][i % 4]}
            </motion.div>
          );
        })}

        {/* BOOM text */}
        <motion.h1
          className="text-[12rem] font-black italic text-white relative z-10"
          style={{
            textShadow: '0 0 60px rgba(255,68,68,0.9), 0 0 120px rgba(255,68,68,0.5), 0 0 200px rgba(255,68,68,0.3)',
          }}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: [0, 1.4, 1], rotate: [10, -5, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          BOOM!
        </motion.h1>

        <motion.p
          className="text-5xl font-bold text-white/90 mt-4 relative z-10"
          style={{ textShadow: '0 0 20px rgba(255,68,68,0.5)' }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {exploded} ist explodiert!
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Ambient danger glow that intensifies */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-500" style={{
        background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,115,80,${bombGlow * 0.12}) 0%, transparent 70%)`,
      }} />

      {/* Round counter */}
      <div className="absolute top-8 right-8 px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
        <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
      </div>

      {/* Current player name - HUGE */}
      <motion.div
        className="mb-10 px-10 py-4 rounded-2xl relative"
        style={{
          background: `${playerColor}15`,
          border: `2px solid ${playerColor}55`,
          boxShadow: `0 0 40px ${playerColor}22, 0 0 80px ${playerColor}11`,
        }}
        key={player}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' }}
      >
        <span className="text-5xl font-black" style={{ color: playerColor, textShadow: `0 0 20px ${playerColor}66` }}>
          {player}
        </span>
      </motion.div>

      {/* Giant bomb with circular timer ring */}
      <div className="relative mb-12">
        {/* Circular timer ring */}
        <svg className="absolute inset-[-24px]" width={circleRadius * 2 + 48} height={circleRadius * 2 + 48}
          style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={circleRadius + 24} cy={circleRadius + 24} r={circleRadius}
            fill="none" stroke="#1b2028" strokeWidth="6"
          />
          {/* Progress ring */}
          <motion.circle
            cx={circleRadius + 24} cy={circleRadius + 24} r={circleRadius}
            fill="none"
            stroke={progress > 0.7 ? '#ef4444' : progress > 0.4 ? '#f59e0b' : '#ff7350'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${progress > 0.7 ? 'rgba(239,68,68,0.6)' : 'rgba(255,115,80,0.4)'})` }}
          />
        </svg>

        {/* Bomb emoji */}
        <motion.div
          className="w-[260px] h-[260px] flex items-center justify-center relative"
          animate={{ scale: [1, 1 + progress * 0.06, 1] }}
          transition={{ repeat: Infinity, duration: pulseSpeed, ease: 'easeInOut' }}
        >
          <span className="text-[120px] select-none" style={{
            filter: `drop-shadow(0 0 ${20 + progress * 60}px rgba(255,115,80,${bombGlow}))`,
          }}>
            💣
          </span>

          {/* Fuse spark dot */}
          <motion.div
            className="absolute w-4 h-4 rounded-full"
            style={{
              background: '#fbbf24',
              boxShadow: '0 0 12px #fbbf24, 0 0 24px rgba(251,191,36,0.6)',
              top: 30,
              left: '55%',
            }}
            animate={{
              opacity: [1, 0.4, 1],
              scale: [1, 1.5, 1],
            }}
            transition={{ repeat: Infinity, duration: pulseSpeed * 0.5 }}
          />
        </motion.div>

        {/* Expanding pulse rings */}
        <motion.div
          className="absolute inset-[-30px] rounded-full border-2"
          style={{ borderColor: `rgba(255,115,80,${0.15 + progress * 0.2})` }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: pulseSpeed }}
        />
        <motion.div
          className="absolute inset-[-55px] rounded-full border"
          style={{ borderColor: `rgba(255,115,80,${0.08 + progress * 0.12})` }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ repeat: Infinity, duration: pulseSpeed, delay: 0.1 }}
        />
      </div>

      {/* Task */}
      <AnimatePresence mode="wait">
        {task ? (
          <motion.div
            className="max-w-4xl text-center"
            key={task}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <p className="text-5xl font-bold text-[#f1f3fc] leading-relaxed"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {task}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            className="flex items-center gap-3"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-3 h-3 rounded-full bg-[#ff7350]" />
            <span className="text-2xl text-[#a8abb3]">Warte auf Aufgabe...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
