import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, Sparkles } from 'lucide-react';
import type { TVScore } from './useTVConnection';

const CONFETTI_COLORS = ['#df8eff', '#ff6b98', '#8ff5ff', '#fbbf24', '#00deec', '#d779ff', '#ff7675', '#55efc4'];
const spring = { type: 'spring' as const, stiffness: 200, damping: 15 };

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    left: `${Math.random() * 100}%`, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 8, delay: Math.random() * 2, duration: 3 + Math.random() * 3,
    rotation: Math.random() * 360, drift: -50 + Math.random() * 100,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div key={i} className="absolute top-0" style={{ left: p.left, width: p.size, height: p.size * 2, backgroundColor: p.color, borderRadius: 2 }}
          initial={{ y: -20, rotate: 0, x: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotation + 720, x: p.drift, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }} />
      ))}
    </div>
  );
}

export default function TVGameOver({ scores }: { scores: TVScore[] }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const [showWinner, setShowWinner] = useState(false);
  const [showPodium, setShowPodium] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowWinner(true), 1500);
    const t2 = setTimeout(() => setShowPodium(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
  const podiumHeights = ['h-32', 'h-48', 'h-24'];
  const podiumColors = ['#a8abb3', '#fbbf24', '#cd7f32'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <Confetti />

      {/* Pre-reveal */}
      {!showWinner && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Sparkles className="w-16 h-16 text-[#df8eff] mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(223,142,255,0.6))' }} />
          <motion.h2 className="text-5xl font-bold text-[#a8abb3] tracking-wide" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            Und der Gewinner ist...
          </motion.h2>
        </motion.div>
      )}

      {/* Winner reveal */}
      {showWinner && winner && !showPodium && (
        <motion.div className="text-center" initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={spring}>
          <Crown className="w-20 h-20 text-[#fbbf24] mx-auto mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.6))' }} />
          <h1 className="text-[8rem] font-black italic leading-none"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #df8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.4))' }}>
            {winner.name}
          </h1>
          <p className="text-4xl font-bold text-[#8ff5ff] mt-4" style={{ textShadow: '0 0 20px rgba(143,245,255,0.4)' }}>
            {winner.score.toLocaleString('de-DE')} Punkte
          </p>
        </motion.div>
      )}

      {/* Podium */}
      {showPodium && (
        <motion.div className="w-full max-w-4xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="flex items-center justify-center gap-3 mb-12" initial={{ y: -30 }} animate={{ y: 0 }}>
            <Trophy className="w-12 h-12 text-[#fbbf24]" />
            <h2 className="text-5xl font-black italic text-[#fbbf24]" style={{ textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>SPIELENDE</h2>
          </motion.div>

          <div className="flex items-end justify-center gap-6">
            {podiumOrder.map((entry, i) => entry && (
              <motion.div key={entry.name} className="flex flex-col items-center"
                initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ ...spring, delay: 0.3 + i * 0.3 }}>
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                  style={{ background: entry.color, boxShadow: i === 1 ? '0 0 30px rgba(251,191,36,0.5)' : `0 0 15px ${entry.color}44` }}>
                  {entry.name.charAt(0)}
                </div>
                <span className="text-lg font-bold text-white mb-1">{entry.name}</span>
                <span className="text-sm font-bold mb-3" style={{ color: podiumColors[i] }}>{entry.score.toLocaleString('de-DE')}</span>
                {/* Podium block */}
                <motion.div className={`w-32 ${podiumHeights[i]} rounded-t-xl flex items-start justify-center pt-4`}
                  style={{ background: `linear-gradient(to top, ${podiumColors[i]}22, ${podiumColors[i]}08)`, border: `1px solid ${podiumColors[i]}33` }}
                  initial={{ height: 0 }} animate={{ height: 'auto' }} transition={{ delay: 0.5 + i * 0.3, duration: 0.8 }}>
                  {i === 1 ? <Crown className="w-8 h-8" style={{ color: podiumColors[i] }} /> : <Medal className="w-7 h-7" style={{ color: podiumColors[i] }} />}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
