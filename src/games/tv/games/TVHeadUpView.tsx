import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

export default function TVHeadUpView({ gameState }: { gameState: any }) {
  const word = gameState?.word || gameState?.currentWord || '';
  const player = gameState?.currentPlayer || gameState?.playerName || '';
  const playerColor = gameState?.playerColor || '#df8eff';
  const correct = gameState?.correct ?? 0;
  const skipped = gameState?.skipped ?? 0;
  const timeLeft = gameState?.timeLeft ?? '';
  const phase = gameState?.phase || 'playing';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const category = gameState?.category || '';

  if (phase === 'roundResult' || phase === 'gameOver') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12" style={{ background: '#060810' }}>
        <motion.h2 className="text-6xl font-black italic text-[#df8eff] mb-8"
          style={{ textShadow: '0 0 30px rgba(223,142,255,0.5)' }}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {phase === 'gameOver' ? 'SPIELENDE!' : 'RUNDE VORBEI!'}
        </motion.h2>
        <div className="flex gap-12">
          <div className="text-center">
            <div className="text-7xl font-black text-[#8ff5ff]">{correct}</div>
            <div className="text-xl text-[#a8abb3] mt-2">Richtig</div>
          </div>
          <div className="text-center">
            <div className="text-7xl font-black text-[#ff6e84]">{skipped}</div>
            <div className="text-xl text-[#a8abb3] mt-2">Uebersprungen</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative" style={{ background: '#060810' }}>
      {/* Top bar */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {category && (
            <div className="px-4 py-2 rounded-full bg-[#df8eff]/15 border border-[#df8eff]/25">
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
          <div className="px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
            <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
          </div>
        </div>
        {timeLeft !== '' && (
          <div className="px-5 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
            <span className={`text-3xl font-mono font-bold ${Number(timeLeft) <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#f1f3fc]'}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Player */}
      <motion.div className="mb-6 px-8 py-3 rounded-full"
        style={{ background: `${playerColor}22`, border: `2px solid ${playerColor}66` }}>
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6" style={{ color: playerColor }} />
          <span className="text-4xl font-bold" style={{ color: playerColor }}>{player}</span>
        </div>
      </motion.div>

      {/* THE WORD */}
      {word ? (
        <motion.h1 key={word} className="text-[8rem] font-black italic text-center leading-none max-w-5xl"
          style={{
            background: 'linear-gradient(135deg, #df8eff, #8ff5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(223,142,255,0.5))',
          }}
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}>
          {word}
        </motion.h1>
      ) : (
        <motion.div className="flex items-center gap-3"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="w-3 h-3 rounded-full bg-[#8ff5ff]" />
          <span className="text-2xl text-[#a8abb3]">Bereit machen...</span>
        </motion.div>
      )}

      {/* Score counters */}
      <div className="absolute bottom-12 flex gap-8">
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#8ff5ff]/10 border border-[#8ff5ff]/20">
          <span className="text-4xl font-black text-[#8ff5ff]">{correct}</span>
          <span className="text-lg text-[#a8abb3]">Richtig</span>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#ff6e84]/10 border border-[#ff6e84]/20">
          <span className="text-4xl font-black text-[#ff6e84]">{skipped}</span>
          <span className="text-lg text-[#a8abb3]">Skip</span>
        </div>
      </div>
    </div>
  );
}
