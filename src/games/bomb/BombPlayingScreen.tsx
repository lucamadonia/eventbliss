import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bomb, CheckCircle2 } from 'lucide-react';
import type { GameState } from './BombGame';

interface PlayingScreenProps {
  state: GameState;
  progress: number;
  onWeiter: () => void;
  onQuizAnswer: (idx: number) => void;
}

function triggerVibration(intensity: number) {
  if (!navigator.vibrate) return;
  if (intensity < 0.3) return;
  const on = Math.round(30 + intensity * 70);
  const off = Math.round(100 - intensity * 60);
  navigator.vibrate([on, off, on]);
}

export default function BombPlayingScreen({ state, progress, onWeiter, onQuizAnswer }: PlayingScreenProps) {
  const player = state.players[state.currentPlayerIndex];
  const isRandom = state.randomTimer;
  const timerSeconds = Math.max(0, Math.round((1 - progress) * ((state.timerMin + state.timerMax) / 2)));
  const pulseSpeed = isRandom ? Math.max(0.5, 1.2 - progress * 0.6) : Math.max(0.3, 1.2 - progress * 0.9);

  useEffect(() => {
    triggerVibration(progress);
  }, [Math.round(progress * 20)]);

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d15] relative overflow-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background auras */}
      <div
        className="pointer-events-none absolute top-[-15%] right-[-20%] w-[60vw] h-[60vw] rounded-full blur-[120px] transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, rgba(255,115,80,${0.08 + progress * 0.15}) 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] left-[-20%] w-[50vw] h-[50vw] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(0,227,253,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Status Bar */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-white font-semibold text-sm">{player.name}</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06]">
          <span className="text-white/60 text-xs font-medium">RUNDE {state.round}/{state.totalRounds}</span>
        </div>
      </div>

      {/* Challenge Card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-4 mt-6"
        key={state.currentTask}
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="rounded-2xl p-5 backdrop-blur-xl border border-white/[0.08]"
          style={{
            background: 'linear-gradient(135deg, rgba(31,31,41,0.8) 0%, rgba(19,19,27,0.9) 100%)',
            borderTop: '2px solid',
            borderImage: 'linear-gradient(90deg, #cf96ff, #00e3fd) 1',
          }}
        >
          <span className="text-[#cf96ff] text-xs font-semibold uppercase tracking-wider">Die Challenge</span>
          <p className="text-white text-lg font-semibold mt-2 leading-relaxed">{state.currentTask}</p>
        </div>
      </motion.div>

      {/* Central Bomb */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-[-20px] rounded-full border-2 border-[#ff7350]/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: pulseSpeed, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-[-40px] rounded-full border border-[#ff7350]/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ repeat: Infinity, duration: pulseSpeed * 1.3, ease: 'easeInOut' }}
          />

          {/* Ping particles */}
          {progress > 0.5 && (
            <>
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-[#ff7350]"
                style={{ top: '10%', left: '80%' }}
                animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
              />
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-[#fc3c00]"
                style={{ top: '75%', left: '15%' }}
                animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              />
            </>
          )}

          {/* Bomb circle */}
          <motion.div
            className="w-36 h-36 rounded-full flex flex-col items-center justify-center relative"
            style={{
              background: isRandom
                ? `conic-gradient(from 0deg, #ff7350 ${(progress > 0.7 ? ((progress - 0.7) / 0.3) : 0) * 360}deg, #1f1f29 ${(progress > 0.7 ? ((progress - 0.7) / 0.3) : 0) * 360}deg)`
                : `conic-gradient(from 0deg, #ff7350 ${progress * 360}deg, #1f1f29 ${progress * 360}deg)`,
              boxShadow: isRandom
                ? `0 0 ${20 + (progress > 0.7 ? (progress - 0.7) / 0.3 * 50 : 0)}px rgba(255,115,80,${0.15 + (progress > 0.7 ? (progress - 0.7) / 0.3 * 0.35 : 0)})`
                : `0 0 ${20 + progress * 50}px rgba(255,115,80,${0.15 + progress * 0.35})`,
            }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: pulseSpeed }}
          >
            <div className="w-[128px] h-[128px] rounded-full bg-[#0d0d15] flex flex-col items-center justify-center">
              <Bomb className="w-8 h-8 text-[#ff7350] mb-1" />
              {isRandom ? (
                <>
                  <span
                    className="text-3xl font-black text-[#ff7350] tabular-nums"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    ???
                  </span>
                  <span className="text-white/30 text-[10px] uppercase tracking-wider">Random</span>
                </>
              ) : (
                <>
                  <span
                    className="text-3xl font-black text-white tabular-nums"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {timerSeconds}
                  </span>
                  <span className="text-white/30 text-[10px] uppercase tracking-wider">Sekunden</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quiz answers */}
      {state.mode === 'quiz' && state.currentQuiz && (
        <div className="relative z-10 w-full max-w-md mx-auto px-4 mb-4">
          <div className="grid grid-cols-1 gap-2">
            {state.currentQuiz.answers.map((ans, idx) => (
              <motion.button
                key={idx}
                onClick={() => onQuizAnswer(idx)}
                className="w-full p-3.5 rounded-xl bg-[#1f1f29] border border-white/[0.06] text-white text-sm text-left hover:bg-[#262630] active:bg-[#2a2a36] transition-colors flex items-center gap-3"
                whileTap={{ scale: 0.98 }}
              >
                <span className="w-7 h-7 rounded-lg bg-[#13131b] flex items-center justify-center text-[#cf96ff] text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                {ans}
              </motion.button>
            ))}
          </div>
          <p className="text-white/25 text-[10px] text-center mt-2">Falsche Antwort = Bombe tickt schneller</p>
        </div>
      )}

      {/* Intensity Bar (hidden in random mode) */}
      {!isRandom && (
        <div className="relative z-10 w-full max-w-md mx-auto px-4 mb-4">
          <div className="h-1.5 w-full rounded-full bg-[#1f1f29] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #00e3fd, #ff7350)',
              }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      {state.mode !== 'quiz' && (
        <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-6">
          <motion.button
            onClick={onWeiter}
            className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #00e3fd 0%, #cf96ff 100%)',
              boxShadow: '0 8px 32px rgba(0,227,253,0.2), 0 2px 8px rgba(207,150,255,0.15)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <CheckCircle2 className="w-5 h-5" />
            GELOEST!
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
