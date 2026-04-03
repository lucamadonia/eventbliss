import { motion } from 'framer-motion';

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
  const showResults = phase === 'results' || phase === 'reveal';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Top bar */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          {category && (
            <div className="px-4 py-2 rounded-full bg-[#df8eff]/15 border border-[#df8eff]/25">
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
        </div>
        <div className="px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
        </div>
      </div>

      {/* Two giant cards side by side */}
      <div className="flex-1 flex">
        {/* Option A */}
        <motion.div className="flex-1 flex flex-col items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #df8eff15, #df8eff05)' }}
          initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="absolute inset-0 border-r border-[#44484f]/20" />
          <motion.h2 className="text-7xl font-black italic text-center px-8 leading-tight max-w-xl"
            style={{ color: '#df8eff', textShadow: '0 0 30px rgba(223,142,255,0.4)' }}
            key={`a-${optionA}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {optionA}
          </motion.h2>

          {showResults && (
            <motion.div className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
              initial={{ height: 0, opacity: 0 }} animate={{ height: `${percentA}%`, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(to top, rgba(223,142,255,0.3), transparent)' }}>
              <div className="absolute top-4 flex flex-col items-center">
                <span className="text-6xl font-black text-[#df8eff]">{Math.round(percentA)}%</span>
                <span className="text-xl text-[#a8abb3] mt-1">{votesA} Stimmen</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* VS divider */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <motion.div className="w-20 h-20 rounded-full bg-[#060810] border-2 border-[#44484f]/40 flex items-center justify-center"
            animate={!showResults ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}>
            <span className="text-2xl font-black italic text-[#a8abb3]">VS</span>
          </motion.div>
        </div>

        {/* Option B */}
        <motion.div className="flex-1 flex flex-col items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #8ff5ff05, #8ff5ff15)' }}
          initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <motion.h2 className="text-7xl font-black italic text-center px-8 leading-tight max-w-xl"
            style={{ color: '#8ff5ff', textShadow: '0 0 30px rgba(143,245,255,0.4)' }}
            key={`b-${optionB}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {optionB}
          </motion.h2>

          {showResults && (
            <motion.div className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
              initial={{ height: 0, opacity: 0 }} animate={{ height: `${percentB}%`, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(to top, rgba(143,245,255,0.3), transparent)' }}>
              <div className="absolute top-4 flex flex-col items-center">
                <span className="text-6xl font-black text-[#8ff5ff]">{Math.round(percentB)}%</span>
                <span className="text-xl text-[#a8abb3] mt-1">{votesB} Stimmen</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
