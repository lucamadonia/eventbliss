import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new sentences arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [sentences.length, currentSentence]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060810' }}>
      {/* Warm reading lamp glow - top-right corner */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 100% 0%, rgba(251,191,36,0.04) 0%, transparent 70%)',
        }}
      />
      {/* Subtle bottom-left accent */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 0% 100%, rgba(223,142,255,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-10 pt-8 pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <BookOpen className="w-8 h-8 text-[#fbbf24]" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }} />
          </motion.div>
          {title && (
            <h2 className="text-3xl font-bold text-[#fbbf24]"
              style={{ textShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
              {title}
            </h2>
          )}
        </div>
        <div className="px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
          <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}/{total}</span>
        </div>
      </div>

      {/* Decorative line */}
      <div className="mx-10 h-[1px] mb-6"
        style={{ background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.2), transparent)' }} />

      {/* Story content - scrollable movie-credits style */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 pb-8 relative z-10 scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 5%, black 90%, transparent)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full space-y-8 py-8">
          {sentences.map((s, i) => {
            const isLast = i === sentences.length - 1 && phase === 'writing';
            return (
              <motion.div
                key={i}
                className="flex flex-col gap-2"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5, type: 'spring', damping: 20 }}
              >
                {s.player && (
                  <span className="text-base font-bold tracking-wide uppercase"
                    style={{ color: s.playerColor || '#a8abb3', opacity: 0.7 }}>
                    {s.player}
                  </span>
                )}
                <span
                  className="text-4xl font-semibold leading-relaxed"
                  style={{
                    color: isLast ? 'rgba(241,243,252,0.95)' : 'rgba(241,243,252,0.5)',
                    textShadow: isLast ? '0 0 30px rgba(241,243,252,0.1)' : 'none',
                  }}
                >
                  {s.text}
                </span>
              </motion.div>
            );
          })}

          {/* Current sentence being written */}
          <AnimatePresence>
            {phase === 'writing' && currentPlayer && (
              <motion.div
                className="flex flex-col gap-2 mt-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                {/* Author badge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: currentPlayerColor, boxShadow: `0 0 12px ${currentPlayerColor}66` }}>
                    {currentPlayer.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-base font-bold tracking-wide uppercase"
                    style={{ color: currentPlayerColor }}>
                    {currentPlayer}
                  </span>
                </div>

                {currentSentence ? (
                  <span className="text-4xl font-semibold text-[#f1f3fc] leading-relaxed"
                    style={{ textShadow: '0 0 20px rgba(241,243,252,0.15)' }}>
                    {currentSentence}
                    <motion.span
                      className="inline-block w-[3px] h-[1.1em] ml-1 align-middle rounded-full"
                      style={{ backgroundColor: currentPlayerColor }}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="text-3xl text-[#a8abb3]/40 italic"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      schreibt...
                    </motion.span>
                    <motion.span
                      className="inline-block w-[3px] h-8 rounded-full"
                      style={{ backgroundColor: currentPlayerColor }}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed story */}
          {phase === 'complete' && sentences.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <h2 className="text-7xl font-black italic text-[#fbbf24]"
                style={{ textShadow: '0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(251,191,36,0.2)' }}>
                Ende
              </h2>
              <p className="text-2xl text-[#a8abb3] mt-4">Geschichte beendet!</p>
            </motion.div>
          )}

          {phase === 'complete' && sentences.length > 0 && (
            <motion.div
              className="text-center pt-12 pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-4xl font-black italic text-[#fbbf24]"
                style={{ textShadow: '0 0 30px rgba(251,191,36,0.4)' }}>
                - Ende -
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom ambient gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to top, rgba(251,191,36,0.03), transparent)' }} />
    </div>
  );
}
