import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

const TILE_COLORS = ['#e63946', '#3b82f6', '#10b981', '#f59e0b'];
const TILE_SHAPES = ['\u25B2', '\u25C6', '\u25CF', '\u25A0'];
const TILE_LABELS = ['A', 'B', 'C', 'D'];

export default function TVQuizView({ gameState }: { gameState: any }) {
  const question = gameState?.question || gameState?.currentTask || '';
  const answers = gameState?.answers || [];
  const category = gameState?.category || '';
  const timeLeft = gameState?.timeLeft ?? '';
  const maxTime = gameState?.maxTime ?? 30;
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const phase = gameState?.phase || 'playing';
  const correctAnswer = gameState?.correctAnswer ?? -1;
  const points = gameState?.points ?? 0;
  const correctPlayers = gameState?.correctPlayers || [];
  const player = gameState?.currentPlayer || '';
  const playerColor = gameState?.playerColor || '#df8eff';

  const timerPercent = useMemo(() => {
    if (timeLeft === '' || maxTime <= 0) return 100;
    return Math.max(0, Math.min(100, (Number(timeLeft) / maxTime) * 100));
  }, [timeLeft, maxTime]);

  const timerColor = useMemo(() => {
    if (timerPercent > 60) return '#10b981';
    if (timerPercent > 30) return '#f59e0b';
    return '#ef4444';
  }, [timerPercent]);

  const roundProgress = useMemo(() => {
    const t = typeof total === 'number' ? total : parseInt(total, 10);
    if (!t || isNaN(t)) return 0;
    return (round / t) * 100;
  }, [round, total]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Ambient bg glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(223,142,255,0.06) 0%, transparent 70%)',
      }} />

      {/* Timer bar at very top */}
      <div className="relative w-full h-2 bg-[#151a21]">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-r-full"
          style={{ backgroundColor: timerColor }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
        {timerPercent <= 30 && (
          <motion.div
            className="absolute left-0 top-0 h-full rounded-r-full"
            style={{ backgroundColor: timerColor, width: `${timerPercent}%` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
        )}
      </div>

      {/* Top HUD */}
      <div className="flex items-center justify-between px-10 pt-6 pb-2 relative z-10">
        {/* Round counter + progress */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-[#a8abb3] tracking-widest uppercase">Runde</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#f1f3fc]">{round}<span className="text-[#a8abb3]">/{total}</span></span>
              <div className="w-32 h-2 rounded-full bg-[#1b2028] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff]"
                  animate={{ width: `${roundProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {category && (
            <div className="px-5 py-2 rounded-full border border-[#df8eff]/30"
              style={{ background: 'rgba(223,142,255,0.08)', boxShadow: '0 0 20px rgba(223,142,255,0.1)' }}>
              <span className="text-lg font-bold text-[#df8eff]">{category}</span>
            </div>
          )}
          {player && (
            <div className="px-5 py-2 rounded-full"
              style={{ background: `${playerColor}15`, border: `2px solid ${playerColor}44`, boxShadow: `0 0 15px ${playerColor}22` }}>
              <span className="text-xl font-bold" style={{ color: playerColor }}>{player}</span>
            </div>
          )}
          {timeLeft !== '' && (
            <div className="px-5 py-2 rounded-full bg-[#151a21] border border-white/5">
              <motion.span
                className="text-3xl font-mono font-black"
                style={{ color: timerColor }}
                animate={Number(timeLeft) <= 5 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                {timeLeft}s
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 pb-8">
        {/* Question */}
        <AnimatePresence mode="wait">
          {question ? (
            <motion.h1
              key={question}
              className="text-4xl md:text-5xl font-bold text-center max-w-5xl leading-tight mb-12"
              style={{
                color: '#f1f3fc',
                textShadow: '0 0 40px rgba(223,142,255,0.15), 0 2px 10px rgba(0,0,0,0.5)',
              }}
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              {question}
            </motion.h1>
          ) : (
            <motion.div
              key="loading"
              className="flex items-center gap-4 mb-12"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-3 h-3 rounded-full bg-[#df8eff]" />
              <span className="text-3xl text-[#a8abb3]">Frage wird geladen...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer tiles - 2x2 Kahoot-style grid */}
        {answers.length > 0 && (
          <div className="grid grid-cols-2 gap-5 w-full max-w-5xl">
            {answers.map((a: string, i: number) => {
              const isCorrect = phase === 'reveal' && i === correctAnswer;
              const isWrong = phase === 'reveal' && i !== correctAnswer;
              const tileColor = TILE_COLORS[i];

              return (
                <motion.div
                  key={i}
                  className="relative rounded-2xl overflow-hidden cursor-default"
                  style={{
                    background: isWrong ? `${tileColor}22` : tileColor,
                    boxShadow: isCorrect
                      ? `0 0 40px ${tileColor}88, 0 0 80px ${tileColor}44, inset 0 0 30px rgba(255,255,255,0.15)`
                      : isWrong
                        ? 'none'
                        : `0 8px 30px ${tileColor}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  }}
                  initial={{ x: i % 2 === 0 ? -60 : 60, opacity: 0, scale: 0.9 }}
                  animate={{
                    x: 0,
                    opacity: isWrong ? 0.4 : 1,
                    scale: isCorrect ? [1, 1.05, 1.02] : isWrong ? 0.95 : 1,
                  }}
                  transition={{
                    delay: phase === 'reveal' ? 0 : i * 0.12,
                    duration: phase === 'reveal' ? 0.5 : 0.4,
                    type: 'spring',
                    damping: 15,
                  }}
                >
                  <div className="flex items-center gap-5 p-6 min-h-[100px]">
                    {/* Shape icon */}
                    <span className="text-5xl font-black opacity-80 select-none"
                      style={{ color: isWrong ? `${tileColor}66` : 'rgba(255,255,255,0.7)' }}>
                      {TILE_SHAPES[i]}
                    </span>
                    <span className={`text-2xl md:text-3xl font-bold leading-snug ${isWrong ? 'text-[#a8abb3]/40' : 'text-white'}`}>
                      {a}
                    </span>
                    {/* Letter label in corner */}
                    <span className="absolute top-3 right-4 text-lg font-black opacity-40" style={{ color: isWrong ? tileColor : '#fff' }}>
                      {TILE_LABELS[i]}
                    </span>
                  </div>

                  {/* Correct answer glow overlay */}
                  {isCorrect && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Floating points text on reveal */}
        <AnimatePresence>
          {phase === 'reveal' && points > 0 && (
            <motion.div
              className="mt-6 text-center"
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: -40, opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <span className="text-5xl font-black text-[#fbbf24]"
                style={{ textShadow: '0 0 30px rgba(251,191,36,0.6)' }}>
                +{points} Punkte
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correct players avatars */}
        <AnimatePresence>
          {phase === 'reveal' && correctPlayers.length > 0 && (
            <motion.div
              className="flex items-center gap-3 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-lg text-[#a8abb3] mr-2">Richtig:</span>
              {correctPlayers.map((p: any, i: number) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-[#10b981]"
                  style={{
                    backgroundColor: p.color || '#10b981',
                    boxShadow: '0 0 12px rgba(16,185,129,0.5)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                >
                  {(p.name || '?').charAt(0).toUpperCase()}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
