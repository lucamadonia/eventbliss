import { motion } from 'framer-motion';
export default function Component({ gameState }: { gameState: any; drawing?: unknown[] }) {
  const game = gameState?.game || 'Spiel';
  const phase = gameState?.phase || '';
  const player = gameState?.currentPlayer || gameState?.playerName || '';
  const task = gameState?.task || gameState?.question || gameState?.word || '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative">
      <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
        <span className="text-sm font-bold text-[#a8abb3] tracking-wider">RUNDE {round}/{total}</span>
      </div>
      {player && (
        <motion.div className="mb-8 px-6 py-3 rounded-full bg-[#df8eff]/15 border border-[#df8eff]/25"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <span className="text-2xl font-bold text-[#df8eff]">{player}</span>
        </motion.div>
      )}
      {task && (
        <motion.h1 className="text-6xl md:text-8xl font-black italic text-center leading-tight max-w-4xl"
          style={{ background: 'linear-gradient(135deg, #df8eff, #8ff5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(223,142,255,0.4))' }}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          key={task}>
          {task}
        </motion.h1>
      )}
      {!task && (
        <motion.div className="flex items-center gap-3" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="w-3 h-3 rounded-full bg-[#8ff5ff]" />
          <span className="text-2xl text-[#a8abb3]">Spiel laeuft...</span>
        </motion.div>
      )}
    </div>
  );
}
