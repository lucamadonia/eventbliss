import { motion, AnimatePresence } from 'framer-motion';

export default function TVBottleView({ gameState }: { gameState: any }) {
  const players = gameState?.players || [];
  const rotation = gameState?.rotation || 0;
  const phase = gameState?.phase || 'spinning';
  const selectedPlayer = gameState?.selectedPlayer || '';
  const task = gameState?.task || gameState?.challenge || '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';

  const count = players.length || 6;
  const radius = 280;
  const containerSize = radius * 2 + 160;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Ambient circular glow */}
      <div className="absolute pointer-events-none" style={{
        width: containerSize + 200,
        height: containerSize + 200,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(223,142,255,0.04) 0%, transparent 60%)',
      }} />

      {/* Round counter */}
      <div className="absolute top-8 right-8 px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
        <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
      </div>

      {/* Player circle + bottle */}
      <div className="relative" style={{ width: containerSize, height: containerSize }}>
        {/* Outer decorative ring */}
        <div className="absolute inset-4 rounded-full border border-[#df8eff]/10" />
        <div className="absolute inset-8 rounded-full border border-[#8ff5ff]/5" />

        {/* Player avatars around circle */}
        {players.map((p: any, i: number) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + containerSize / 2;
          const y = Math.sin(angle) * radius + containerSize / 2;
          const isSelected = p.name === selectedPlayer || p === selectedPlayer;
          const color = p.color || `hsl(${(i / count) * 360}, 70%, 60%)`;

          return (
            <motion.div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: x - 36, top: y - 36 }}
              animate={
                isSelected && phase === 'result'
                  ? { scale: [1, 1.4, 1.25] }
                  : phase === 'result' && !isSelected
                    ? { opacity: 0.4, scale: 0.85 }
                    : {}
              }
              transition={{ duration: 0.6, type: 'spring' }}
            >
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-2xl border-3"
                style={{
                  backgroundColor: color,
                  borderColor: isSelected && phase === 'result' ? '#fff' : `${color}66`,
                  borderWidth: isSelected && phase === 'result' ? 4 : 3,
                  boxShadow: isSelected && phase === 'result'
                    ? `0 0 30px ${color}, 0 0 60px ${color}88, 0 0 90px ${color}44`
                    : `0 4px 15px ${color}33`,
                }}
              >
                {(p.name || p || '?').charAt(0).toUpperCase()}
              </div>
              <motion.span
                className="mt-2 text-base font-bold truncate max-w-[100px] text-center"
                style={{
                  color: isSelected && phase === 'result' ? '#fff' : '#a8abb3',
                  textShadow: isSelected && phase === 'result' ? `0 0 15px ${color}` : 'none',
                }}
                animate={isSelected && phase === 'result' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isSelected && phase === 'result' ? Infinity : 0, duration: 1.5 }}
              >
                {p.name || p}
              </motion.span>
            </motion.div>
          );
        })}

        {/* Bottle - center */}
        <motion.div
          className="absolute"
          style={{
            left: containerSize / 2 - 24,
            top: containerSize / 2 - 80,
            transformOrigin: '24px 80px',
          }}
          animate={{ rotate: rotation }}
          transition={
            phase === 'spinning'
              ? { duration: 3.5, ease: [0.12, 0.8, 0.2, 1] }
              : { duration: 0 }
          }
        >
          <svg width="48" height="160" viewBox="0 0 48 160">
            <defs>
              <linearGradient id="bottle-grad-tv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#df8eff" />
                <stop offset="50%" stopColor="#c77aff" />
                <stop offset="100%" stopColor="#8ff5ff" />
              </linearGradient>
              <filter id="bottle-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Pointer tip */}
            <polygon points="24,0 16,18 32,18" fill="#df8eff" filter="url(#bottle-glow)" />
            {/* Bottle neck */}
            <rect x="19" y="16" width="10" height="35" rx="5" fill="url(#bottle-grad-tv)" />
            {/* Bottle body */}
            <ellipse cx="24" cy="90" rx="22" ry="55" fill="url(#bottle-grad-tv)" opacity="0.9" />
            {/* Highlight */}
            <ellipse cx="18" cy="80" rx="6" ry="30" fill="rgba(255,255,255,0.15)" />
          </svg>
        </motion.div>

        {/* Center glow dot */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: containerSize / 2 - 20,
            top: containerSize / 2 - 20,
            width: 40,
            height: 40,
            background: 'radial-gradient(circle, rgba(223,142,255,0.4) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>

      {/* Selected player name - HUGE reveal */}
      <AnimatePresence>
        {phase === 'result' && selectedPlayer && (
          <motion.div
            className="absolute bottom-32 text-center px-12"
            initial={{ y: 50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, type: 'spring', damping: 12 }}
          >
            <h2 className="text-6xl font-black italic text-white mb-4"
              style={{ textShadow: '0 0 40px rgba(223,142,255,0.5), 0 0 80px rgba(223,142,255,0.2)' }}>
              {selectedPlayer}
            </h2>
            {task && (
              <motion.p
                className="text-4xl font-bold text-[#f1f3fc]/90 max-w-3xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {task}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinning indicator */}
      {phase === 'spinning' && (
        <motion.div
          className="absolute bottom-16"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <span className="text-2xl text-[#a8abb3] font-bold tracking-wide">Flasche dreht sich...</span>
        </motion.div>
      )}
    </div>
  );
}
