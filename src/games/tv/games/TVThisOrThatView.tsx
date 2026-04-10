import { motion, AnimatePresence } from 'framer-motion';

export default function TVThisOrThatView({ gameState }: { gameState: any }) {
  const optionA = gameState?.optionA || gameState?.options?.[0] || 'Option A';
  const optionB = gameState?.optionB || gameState?.options?.[1] || 'Option B';
  const phase = gameState?.phase || 'voting';
  const percentA = gameState?.percentA ?? 50;
  const percentB = gameState?.percentB ?? 50;
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const category = gameState?.category || '';
  const votesA = gameState?.votesA ?? 0;
  const votesB = gameState?.votesB ?? 0;
  const votersA = gameState?.votersA || [];
  const votersB = gameState?.votersB || [];
  const showResults = phase === 'results' || phase === 'reveal';
  const winnerSide = percentA > percentB ? 'A' : percentB > percentA ? 'B' : 'tie';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Top bar */}
      <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {category && (
            <div className="px-5 py-2 rounded-full border border-[#df8eff]/30"
              style={{ background: 'rgba(223,142,255,0.08)', boxShadow: '0 0 20px rgba(223,142,255,0.1)' }}>
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
        </div>
        <div className="px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
        </div>
      </div>

      {/* Split screen */}
      <div className="flex-1 flex relative">
        {/* Option A - Left side */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            background: showResults && winnerSide === 'B'
              ? 'linear-gradient(135deg, rgba(223,142,255,0.03), rgba(223,142,255,0.01))'
              : 'linear-gradient(135deg, rgba(223,142,255,0.12), rgba(223,142,255,0.04))',
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{
            x: 0,
            opacity: showResults && winnerSide === 'B' ? 0.5 : 1,
          }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          {/* Gradient accent line on edge */}
          <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{
            background: 'linear-gradient(to bottom, transparent, rgba(223,142,255,0.3), transparent)',
          }} />

          {/* Option text */}
          <motion.h2
            className="text-5xl md:text-7xl font-black italic text-center px-10 leading-tight max-w-xl"
            style={{
              color: '#df8eff',
              textShadow: showResults && winnerSide === 'A'
                ? '0 0 40px rgba(223,142,255,0.6), 0 0 80px rgba(223,142,255,0.3)'
                : '0 0 20px rgba(223,142,255,0.3)',
            }}
            key={`a-${optionA}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: showResults && winnerSide === 'A' ? [1, 1.05, 1] : 1,
            }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {optionA}
          </motion.h2>

          {/* Voter avatars flowing to this side */}
          {showResults && votersA.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 justify-center max-w-xs">
              {votersA.map((v: any, i: number) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    backgroundColor: v.color || '#df8eff',
                    boxShadow: `0 0 8px ${v.color || '#df8eff'}66`,
                  }}
                  initial={{ x: 100, opacity: 0, scale: 0 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, type: 'spring', damping: 12 }}
                >
                  {(v.name || '?').charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </div>
          )}

          {/* Results overlay */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-start pt-8"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${Math.max(percentA, 8)}%`, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: winnerSide === 'A'
                    ? 'linear-gradient(to top, rgba(223,142,255,0.35), rgba(223,142,255,0.05))'
                    : 'linear-gradient(to top, rgba(223,142,255,0.15), transparent)',
                }}
              >
                <motion.span
                  className="text-7xl font-black"
                  style={{
                    color: '#df8eff',
                    textShadow: winnerSide === 'A' ? '0 0 30px rgba(223,142,255,0.6)' : 'none',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                >
                  {Math.round(percentA)}%
                </motion.span>
                <motion.span
                  className="text-xl text-[#a8abb3] mt-2 font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {votesA} Stimmen
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Winner confetti-like particles */}
          {showResults && winnerSide === 'A' && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`conf-a-${i}`}
              className="absolute w-2 h-2 rounded-full bg-[#df8eff]"
              style={{ left: `${20 + Math.random() * 60}%`, top: `${20 + Math.random() * 40}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -40] }}
              transition={{ delay: 1 + i * 0.1, duration: 1, repeat: 2, repeatDelay: 0.5 }}
            />
          ))}
        </motion.div>

        {/* VS divider */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <motion.div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: '#060810',
              border: '3px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 30px rgba(0,0,0,0.5), 0 0 60px rgba(0,0,0,0.3)',
            }}
            animate={!showResults ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-3xl font-black italic text-[#a8abb3]"
              style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
              VS
            </span>
          </motion.div>

          {/* Live vote bar in the middle */}
          {!showResults && (votesA > 0 || votesB > 0) && (
            <motion.div
              className="absolute w-2 rounded-full overflow-hidden"
              style={{ height: 200, top: '50%', marginTop: 60, background: '#1b2028' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
            >
              <motion.div
                className="w-full rounded-full"
                style={{ background: 'linear-gradient(to bottom, #df8eff, #8ff5ff)' }}
                animate={{ height: `${percentA}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </div>

        {/* Option B - Right side */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            background: showResults && winnerSide === 'A'
              ? 'linear-gradient(135deg, rgba(143,245,255,0.01), rgba(143,245,255,0.03))'
              : 'linear-gradient(135deg, rgba(143,245,255,0.04), rgba(143,245,255,0.12))',
          }}
          initial={{ x: 100, opacity: 0 }}
          animate={{
            x: 0,
            opacity: showResults && winnerSide === 'A' ? 0.5 : 1,
          }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          {/* Gradient accent line on edge */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{
            background: 'linear-gradient(to bottom, transparent, rgba(143,245,255,0.3), transparent)',
          }} />

          <motion.h2
            className="text-5xl md:text-7xl font-black italic text-center px-10 leading-tight max-w-xl"
            style={{
              color: '#8ff5ff',
              textShadow: showResults && winnerSide === 'B'
                ? '0 0 40px rgba(143,245,255,0.6), 0 0 80px rgba(143,245,255,0.3)'
                : '0 0 20px rgba(143,245,255,0.3)',
            }}
            key={`b-${optionB}`}
            initial={{ y: 30, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              scale: showResults && winnerSide === 'B' ? [1, 1.05, 1] : 1,
            }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {optionB}
          </motion.h2>

          {/* Voter avatars */}
          {showResults && votersB.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 justify-center max-w-xs">
              {votersB.map((v: any, i: number) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    backgroundColor: v.color || '#8ff5ff',
                    boxShadow: `0 0 8px ${v.color || '#8ff5ff'}66`,
                  }}
                  initial={{ x: -100, opacity: 0, scale: 0 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, type: 'spring', damping: 12 }}
                >
                  {(v.name || '?').charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </div>
          )}

          {/* Results overlay */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-start pt-8"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${Math.max(percentB, 8)}%`, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: winnerSide === 'B'
                    ? 'linear-gradient(to top, rgba(143,245,255,0.35), rgba(143,245,255,0.05))'
                    : 'linear-gradient(to top, rgba(143,245,255,0.15), transparent)',
                }}
              >
                <motion.span
                  className="text-7xl font-black"
                  style={{
                    color: '#8ff5ff',
                    textShadow: winnerSide === 'B' ? '0 0 30px rgba(143,245,255,0.6)' : 'none',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                >
                  {Math.round(percentB)}%
                </motion.span>
                <motion.span
                  className="text-xl text-[#a8abb3] mt-2 font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {votesB} Stimmen
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Winner confetti */}
          {showResults && winnerSide === 'B' && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`conf-b-${i}`}
              className="absolute w-2 h-2 rounded-full bg-[#8ff5ff]"
              style={{ left: `${20 + Math.random() * 60}%`, top: `${20 + Math.random() * 40}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -40] }}
              transition={{ delay: 1 + i * 0.1, duration: 1, repeat: 2, repeatDelay: 0.5 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
