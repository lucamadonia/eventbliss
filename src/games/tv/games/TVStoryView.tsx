import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export default function TVStoryView({ gameState }: { gameState: any }) {
  const sentences: { text: string; player?: string; playerColor?: string }[] = gameState?.sentences || [];
  const currentSentence = gameState?.currentSentence || '';
  const currentPlayer = gameState?.currentPlayer || '';
  const currentPlayerColor = gameState?.currentPlayerColor || '#df8eff';
  const round = gameState?.round || 1;
  const total = gameState?.totalRounds || '?';
  const phase = gameState?.phase || 'writing';
  const title = gameState?.title || '';

  return (
    <div className="min-h-screen flex flex-col p-12 relative" style={{ background: '#060810' }}>
      <style>{`
        @keyframes typewriter {
          from { max-width: 0; }
          to { max-width: 100%; }
        }
        .typewriter-line {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 1.5s steps(40, end) forwards;
          display: inline-block;
          max-width: 100%;
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-[#df8eff]" />
          {title && <h2 className="text-3xl font-bold text-[#df8eff]">{title}</h2>}
        </div>
        <div className="px-4 py-2 rounded-full bg-[#151a21]/60 border border-white/5">
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
        </div>
      </div>

      {/* Story sentences */}
      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full space-y-6">
        {sentences.map((s, i) => (
          <motion.div key={i} className="flex flex-wrap items-baseline gap-3"
            initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.3, duration: 0.5 }}>
            {s.player && (
              <span className="text-xl font-bold shrink-0" style={{ color: s.playerColor || '#a8abb3' }}>
                {s.player}:
              </span>
            )}
            <span className="text-4xl font-semibold text-[#f1f3fc]/90 leading-relaxed typewriter-line"
              style={{ animationDelay: `${i * 0.3}s` }}>
              {s.text}
            </span>
          </motion.div>
        ))}

        {/* Current sentence being written */}
        {phase === 'writing' && currentPlayer && (
          <motion.div className="flex items-baseline gap-3 mt-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-xl font-bold shrink-0" style={{ color: currentPlayerColor }}>
              {currentPlayer}:
            </span>
            {currentSentence ? (
              <span className="text-4xl font-semibold text-[#f1f3fc]/60 leading-relaxed">
                {currentSentence}
              </span>
            ) : (
              <motion.span className="text-4xl text-[#a8abb3]/40"
                animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                schreibt...
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Completed story */}
        {phase === 'complete' && sentences.length === 0 && (
          <motion.div className="text-center"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h2 className="text-6xl font-black italic text-[#df8eff]"
              style={{ textShadow: '0 0 30px rgba(223,142,255,0.5)' }}>
              Geschichte beendet!
            </h2>
          </motion.div>
        )}
      </div>

      {/* Bottom ambient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(223,142,255,0.05), transparent)' }} />
    </div>
  );
}
