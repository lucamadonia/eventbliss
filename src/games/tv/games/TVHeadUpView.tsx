import { motion, AnimatePresence } from 'framer-motion';
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
  const lastAction = gameState?.lastAction || ''; // 'correct' | 'skip' | ''

  if (phase === 'roundResult' || phase === 'gameOver') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: '#060810' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(223,142,255,0.08) 0%, transparent 70%)' }} />

        <motion.h2
          className="text-7xl font-black italic mb-10"
          style={{ color: '#df8eff', textShadow: '0 0 40px rgba(223,142,255,0.5), 0 0 80px rgba(223,142,255,0.2)' }}
          initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          {phase === 'gameOver' ? 'SPIELENDE!' : 'RUNDE VORBEI!'}
        </motion.h2>

        <div className="flex gap-16">
          <motion.div
            className="text-center px-10 py-8 rounded-3xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.2)' }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.div
              className="text-8xl font-black text-[#10b981]"
              style={{ textShadow: '0 0 30px rgba(16,185,129,0.5)' }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {correct}
            </motion.div>
            <div className="text-xl text-[#a8abb3] mt-3 font-bold">Richtig</div>
          </motion.div>

          <motion.div
            className="text-center px-10 py-8 rounded-3xl"
            style={{ background: 'rgba(255,110,132,0.08)', border: '2px solid rgba(255,110,132,0.2)' }}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.div
              className="text-8xl font-black text-[#ff6e84]"
              style={{ textShadow: '0 0 30px rgba(255,110,132,0.5)' }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {skipped}
            </motion.div>
            <div className="text-xl text-[#a8abb3] mt-3 font-bold">Uebersprungen</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(223,142,255,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(143,245,255,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,107,152,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(223,142,255,0.06) 0%, transparent 70%)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      />

      {/* Top bar */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {category && (
            <div className="px-5 py-2 rounded-full border border-[#df8eff]/30"
              style={{ background: 'rgba(223,142,255,0.08)', boxShadow: '0 0 20px rgba(223,142,255,0.1)' }}>
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
          <div className="px-4 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
            <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
          </div>
        </div>
        {timeLeft !== '' && (
          <div className="px-6 py-3 rounded-full bg-[#151a21] border border-white/5">
            <motion.span
              className={`text-4xl font-mono font-black ${Number(timeLeft) <= 10 ? 'text-[#ef4444]' : 'text-[#f1f3fc]'}`}
              animate={Number(timeLeft) <= 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.4 }}
            >
              {timeLeft}s
            </motion.span>
          </div>
        )}
      </div>

      {/* Player badge */}
      <motion.div
        className="mb-4 px-8 py-3 rounded-full flex items-center gap-3"
        style={{
          background: `${playerColor}15`,
          border: `2px solid ${playerColor}55`,
          boxShadow: `0 0 30px ${playerColor}22`,
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Smartphone className="w-6 h-6" style={{ color: playerColor }} />
        <span className="text-3xl font-bold" style={{ color: playerColor }}>{player}</span>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        className="text-xl text-[#a8abb3] mb-6 tracking-wide"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        Beschreibe es!
      </motion.p>

      {/* THE WORD - absolutely massive */}
      <div className="relative min-h-[200px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {word ? (
            <motion.h1
              key={word}
              className="text-[7rem] md:text-[9rem] font-black italic text-center leading-none max-w-6xl"
              style={{
                background: 'linear-gradient(135deg, #df8eff 0%, #8ff5ff 50%, #ff6b98 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 50px rgba(223,142,255,0.5)) drop-shadow(0 0 100px rgba(143,245,255,0.3))',
              }}
              initial={
                lastAction === 'skip'
                  ? { x: 200, opacity: 0, scale: 0.9 }
                  : lastAction === 'correct'
                    ? { y: -60, opacity: 0, scale: 1.1 }
                    : { scale: 0.5, opacity: 0 }
              }
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={
                lastAction === 'skip'
                  ? { x: -300, opacity: 0 }
                  : lastAction === 'correct'
                    ? { y: -80, opacity: 0, scale: 1.1 }
                    : { opacity: 0, scale: 0.9 }
              }
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
              {word}
            </motion.h1>
          ) : (
            <motion.div
              key="waiting"
              className="flex items-center gap-3"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-3 h-3 rounded-full bg-[#8ff5ff]" />
              <span className="text-3xl text-[#a8abb3]">Bereit machen...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Green flash on correct */}
        <AnimatePresence>
          {lastAction === 'correct' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Score counters - bottom */}
      <div className="absolute bottom-10 flex gap-8">
        <motion.div
          className="flex items-center gap-3 px-8 py-4 rounded-2xl"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '2px solid rgba(16,185,129,0.2)',
            boxShadow: '0 0 20px rgba(16,185,129,0.1)',
          }}
        >
          <motion.span
            key={correct}
            className="text-5xl font-black text-[#10b981]"
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {correct}
          </motion.span>
          <span className="text-lg text-[#a8abb3] font-bold">Richtig</span>
        </motion.div>
        <motion.div
          className="flex items-center gap-3 px-8 py-4 rounded-2xl"
          style={{
            background: 'rgba(255,110,132,0.08)',
            border: '2px solid rgba(255,110,132,0.2)',
            boxShadow: '0 0 20px rgba(255,110,132,0.1)',
          }}
        >
          <motion.span
            key={skipped}
            className="text-5xl font-black text-[#ff6e84]"
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {skipped}
          </motion.span>
          <span className="text-lg text-[#a8abb3] font-bold">Skip</span>
        </motion.div>
      </div>
    </div>
  );
}
