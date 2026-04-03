import { motion } from 'framer-motion';
import { Bomb } from 'lucide-react';

export default function TVBombView({ gameState }: { gameState: any }) {
  const player = gameState?.players?.[gameState?.currentPlayerIndex]?.name || gameState?.currentPlayer || '';
  const playerColor = gameState?.players?.[gameState?.currentPlayerIndex]?.color || '#df8eff';
  const task = gameState?.currentTask || gameState?.task || '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || 5;
  const phase = gameState?.phase || 'playing';
  const progress = gameState?.progress || 0;
  const exploded = gameState?.players?.[gameState?.explodedPlayerIndex]?.name || '';

  if (phase === 'explosion') {
    return (
      <motion.div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(circle, #ff4444 0%, #cc0000 40%, #060810 80%)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.h1 className="text-[12rem] font-black italic text-white"
          style={{ textShadow: '0 0 60px rgba(255,68,68,0.8), 0 0 120px rgba(255,68,68,0.4)' }}
          initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }}>
          BOOM!
        </motion.h1>
        <motion.p className="text-5xl font-bold text-white/80 mt-4"
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          {exploded} ist explodiert!
        </motion.p>
      </motion.div>
    );
  }

  const pulseSpeed = Math.max(0.3, 1.2 - progress * 0.9);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative" style={{ background: '#060810' }}>
      <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
        <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
      </div>

      <motion.div className="mb-8 px-8 py-3 rounded-full"
        style={{ background: `${playerColor}22`, border: `2px solid ${playerColor}66` }}>
        <span className="text-5xl font-bold" style={{ color: playerColor }}>{player}</span>
      </motion.div>

      {/* Bomb */}
      <div className="relative mb-12">
        <motion.div className="w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(from 0deg, #ff7350 ${progress * 360}deg, #1b2028 ${progress * 360}deg)`,
            boxShadow: `0 0 ${30 + progress * 80}px rgba(255,115,80,${0.2 + progress * 0.5})`,
          }}
          animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: pulseSpeed }}>
          <div className="w-40 h-40 rounded-full bg-[#060810] flex items-center justify-center">
            <Bomb className="w-16 h-16 text-[#ff7350]" />
          </div>
        </motion.div>
        <motion.div className="absolute inset-[-20px] rounded-full border-2 border-[#ff7350]/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: pulseSpeed }} />
        <motion.div className="absolute inset-[-40px] rounded-full border border-[#ff7350]/10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ repeat: Infinity, duration: pulseSpeed, delay: 0.1 }} />
      </div>

      {/* Task */}
      {task ? (
        <motion.div className="max-w-3xl text-center" key={task}
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <p className="text-5xl font-bold text-[#f1f3fc] leading-relaxed">{task}</p>
        </motion.div>
      ) : (
        <motion.div className="flex items-center gap-3"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="w-3 h-3 rounded-full bg-[#ff7350]" />
          <span className="text-2xl text-[#a8abb3]">Warte auf Aufgabe...</span>
        </motion.div>
      )}
    </div>
  );
}
