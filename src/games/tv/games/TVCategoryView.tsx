import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id?: string;
  name: string;
  color?: string;
  avatar?: string;
  score?: number;
}

export default function TVCategoryView({ gameState }: { gameState: any }) {
  const phase = gameState?.phase || 'playing';
  const currentRound = gameState?.currentRound || gameState?.round || 1;
  const currentPlayerIndex = gameState?.currentPlayerIndex ?? 0;
  const currentCategory = gameState?.currentCategory || gameState?.category || '';
  const players: Player[] = gameState?.players || [];
  const currentPlayer = players[currentPlayerIndex] || null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-8 relative overflow-hidden"
      style={{ background: '#060810' }}
    >
      {/* Top bar */}
      <div className="w-full flex items-center justify-between z-10">
        <h1
          className="text-3xl font-black italic"
          style={{
            background: 'linear-gradient(90deg, #df8eff, #8ff5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 12px rgba(223,142,255,0.4))',
          }}
        >
          KATEGORIE
        </h1>
        <motion.div
          key={currentRound}
          className="px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {currentRound}</span>
        </motion.div>
      </div>

      {/* Center: Category reveal */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <AnimatePresence mode="wait">
          {currentCategory ? (
            <motion.div
              key={currentCategory}
              className="rounded-3xl p-12 text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2
                className="text-5xl md:text-7xl font-black text-white"
                style={{
                  textShadow:
                    '0 0 30px rgba(223,142,255,0.5), 0 0 60px rgba(143,245,255,0.3)',
                }}
              >
                {currentCategory}
              </h2>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              className="flex items-center gap-3"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-3 h-3 rounded-full bg-[#df8eff]" />
              <span className="text-2xl text-[#a8abb3]">Warte auf Kategorie...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current player */}
        <AnimatePresence mode="wait">
          {currentPlayer && (
            <motion.div
              key={currentPlayerIndex}
              className="flex flex-col items-center gap-3"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
                style={{
                  border: `4px solid ${currentPlayer.color || '#df8eff'}`,
                  boxShadow: `0 0 20px ${currentPlayer.color || '#df8eff'}55, 0 0 40px ${currentPlayer.color || '#df8eff'}22`,
                  background: `${currentPlayer.color || '#df8eff'}15`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                {currentPlayer.avatar || currentPlayer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span
                className="text-4xl font-black"
                style={{
                  color: currentPlayer.color || '#df8eff',
                  textShadow: `0 0 20px ${currentPlayer.color || '#df8eff'}66`,
                }}
              >
                {currentPlayer.name}
              </span>
              <span className="text-xl tracking-widest text-[#a8abb3] font-medium">
                IST DRAN
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Player score row */}
      {players.length > 0 && (
        <div className="w-full flex justify-center gap-4 pb-4 z-10">
          {players.map((p, i) => {
            const isActive = i === currentPlayerIndex;
            const color = p.color || '#df8eff';
            return (
              <motion.div
                key={p.id || p.name}
                className="flex flex-col items-center px-6 py-3 rounded-xl min-w-[120px]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                  borderTop: `3px solid ${isActive ? color : `${color}66`}`,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderTopWidth: 3,
                  borderTopColor: isActive ? color : `${color}66`,
                  boxShadow: isActive ? `0 0 20px ${color}33` : 'none',
                }}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <span
                  className="text-lg font-bold truncate max-w-[100px]"
                  style={{ color: isActive ? '#f1f3fc' : '#a8abb3' }}
                >
                  {p.name}
                </span>
                <motion.span
                  key={`${p.name}-${p.score}`}
                  className="text-2xl font-black text-[#f1f3fc]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {p.score ?? 0}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
