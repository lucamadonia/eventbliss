import { motion } from 'framer-motion';

export default function TVBottleView({ gameState }: { gameState: any }) {
  const players = gameState?.players || [];
  const rotation = gameState?.rotation || 0;
  const phase = gameState?.phase || 'spinning';
  const selectedPlayer = gameState?.selectedPlayer || '';
  const task = gameState?.task || gameState?.challenge || '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';

  const count = players.length || 6;
  const radius = 260;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Round counter */}
      <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
        <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
      </div>

      {/* Player circle + bottle */}
      <div className="relative" style={{ width: radius * 2 + 120, height: radius * 2 + 120 }}>
        {/* Player avatars around circle */}
        {players.map((p: any, i: number) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + radius + 60;
          const y = Math.sin(angle) * radius + radius + 60;
          const isSelected = p.name === selectedPlayer || p === selectedPlayer;
          const color = p.color || `hsl(${(i / count) * 360}, 70%, 60%)`;
          return (
            <motion.div key={i} className="absolute flex flex-col items-center" style={{ left: x - 32, top: y - 32 }}
              animate={isSelected && phase === 'result' ? { scale: [1, 1.3, 1.15] } : {}}
              transition={{ duration: 0.5 }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2"
                style={{
                  backgroundColor: color,
                  borderColor: isSelected ? '#fff' : 'transparent',
                  boxShadow: isSelected ? `0 0 20px ${color}` : 'none',
                }}>
                {(p.name || p || '?').charAt(0).toUpperCase()}
              </div>
              <span className={`mt-1 text-sm font-bold truncate max-w-[80px] text-center ${isSelected ? 'text-white' : 'text-[#a8abb3]'}`}>
                {p.name || p}
              </span>
            </motion.div>
          );
        })}

        {/* Bottle */}
        <motion.div className="absolute" style={{ left: radius + 60 - 24, top: radius + 60 - 80 }}
          animate={{ rotate: rotation }}
          transition={phase === 'spinning' ? { duration: 3, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}>
          <svg width="48" height="160" viewBox="0 0 48 160">
            <defs>
              <linearGradient id="bottle-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#df8eff" />
                <stop offset="100%" stopColor="#8ff5ff" />
              </linearGradient>
            </defs>
            {/* Bottle neck */}
            <rect x="20" y="0" width="8" height="40" rx="4" fill="url(#bottle-grad)" />
            {/* Bottle body */}
            <ellipse cx="24" cy="80" rx="20" ry="50" fill="url(#bottle-grad)" opacity="0.9" />
            {/* Pointer tip */}
            <polygon points="24,0 18,15 30,15" fill="#df8eff" />
          </svg>
        </motion.div>

        {/* Center glow */}
        <div className="absolute rounded-full" style={{
          left: radius + 60 - 30, top: radius + 60 - 30, width: 60, height: 60,
          background: 'radial-gradient(circle, rgba(223,142,255,0.2) 0%, transparent 70%)',
        }} />
      </div>

      {/* Task / Challenge */}
      {phase === 'result' && task && (
        <motion.div className="absolute bottom-16 max-w-3xl text-center px-8"
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-5xl font-bold text-[#f1f3fc] leading-relaxed">{task}</p>
        </motion.div>
      )}

      {phase === 'spinning' && (
        <motion.div className="absolute bottom-16"
          animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <span className="text-2xl text-[#a8abb3] font-bold">Flasche dreht sich...</span>
        </motion.div>
      )}
    </div>
  );
}
