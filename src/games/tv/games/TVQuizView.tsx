import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

export default function TVQuizView({ gameState }: { gameState: any }) {
  const question = gameState?.question || gameState?.currentTask || '';
  const answers = gameState?.answers || [];
  const category = gameState?.category || '';
  const timeLeft = gameState?.timeLeft ?? '';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const phase = gameState?.phase || 'playing';
  const selectedAnswer = gameState?.selectedAnswer ?? -1;
  const correctAnswer = gameState?.correctAnswer ?? -1;
  const player = gameState?.currentPlayer || '';
  const playerColor = gameState?.playerColor || '#df8eff';

  const answerColors = ['#df8eff', '#8ff5ff', '#ff6b98', '#ffb347'];
  const answerLabels = ['A', 'B', 'C', 'D'];

  if (phase === 'reveal') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 gap-8" style={{ background: '#060810' }}>
        <h2 className="text-5xl font-bold text-[#f1f3fc] text-center max-w-4xl leading-tight">{question}</h2>
        <div className="grid grid-cols-2 gap-6 w-full max-w-4xl mt-4">
          {answers.map((a: string, i: number) => {
            const isCorrect = i === correctAnswer;
            const isSelected = i === selectedAnswer;
            const bg = isCorrect ? '#22c55e' : isSelected ? '#ef4444' : '#1b2028';
            return (
              <motion.div key={i} className="rounded-2xl p-6 border-2 flex items-center gap-4"
                style={{ background: `${bg}${isCorrect || isSelected ? '' : '88'}`, borderColor: isCorrect ? '#22c55e' : isSelected ? '#ef4444' : '#44484f44' }}
                initial={{ scale: 1 }} animate={isCorrect ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}>
                <span className="text-3xl font-black" style={{ color: isCorrect ? '#fff' : isSelected ? '#fff' : answerColors[i] }}>
                  {answerLabels[i]}
                </span>
                <span className={`text-2xl font-bold ${isCorrect || isSelected ? 'text-white' : 'text-[#f1f3fc]/80'}`}>{a}</span>
              </motion.div>
            );
          })}
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
        <div className="flex items-center gap-4">
          {player && (
            <div className="px-5 py-2 rounded-full" style={{ background: `${playerColor}22`, border: `2px solid ${playerColor}44` }}>
              <span className="text-xl font-bold" style={{ color: playerColor }}>{player}</span>
            </div>
          )}
          {timeLeft !== '' && (
            <div className="px-5 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
              <span className={`text-3xl font-mono font-bold ${Number(timeLeft) <= 10 ? 'text-[#ff6e84] animate-pulse' : 'text-[#f1f3fc]'}`}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <HelpCircle className="w-12 h-12 text-[#df8eff] mx-auto mb-4" />
      </div>
      {question ? (
        <motion.h1 key={question} className="text-5xl font-bold text-[#f1f3fc] text-center max-w-4xl leading-tight mb-12"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {question}
        </motion.h1>
      ) : (
        <motion.div className="flex items-center gap-3 mb-12"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="w-3 h-3 rounded-full bg-[#df8eff]" />
          <span className="text-2xl text-[#a8abb3]">Frage wird geladen...</span>
        </motion.div>
      )}

      {/* Answers */}
      {answers.length > 0 && (
        <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
          {answers.map((a: string, i: number) => (
            <motion.div key={i} className="rounded-2xl p-6 border-2 flex items-center gap-4"
              style={{ background: `${answerColors[i]}11`, borderColor: `${answerColors[i]}44` }}
              initial={{ x: i % 2 === 0 ? -30 : 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}>
              <span className="text-4xl font-black" style={{ color: answerColors[i] }}>{answerLabels[i]}</span>
              <span className="text-2xl font-bold text-[#f1f3fc]/80">{a}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
