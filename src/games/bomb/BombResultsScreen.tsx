import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, RotateCcw, Gamepad2, Share2, Bomb, Zap, Globe } from 'lucide-react';
import type { GameState } from './BombGame';

interface ResultsScreenProps {
  state: GameState;
  onRestart: () => void;
  onExit: () => void;
}

export function BombRoundEndScreen({
  state,
  onNext,
}: {
  state: GameState;
  onNext: () => void;
}) {
  const sorted = [...state.players].sort((a, b) => a.penalties - b.penalties);

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d15] flex flex-col items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#cf96ff]/[0.04] blur-[100px]" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <h2
          className="text-2xl font-bold text-white text-center"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Zwischenstand
        </h2>

        <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              key={p.name}
              className="flex items-center justify-between p-3 rounded-xl bg-[#13131b]"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-white/30 font-mono text-sm w-5 text-right">{i + 1}</span>
                <span className="text-white font-medium text-sm">{p.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: p.penalties }).map((_, j) => (
                  <Bomb key={j} className="w-3.5 h-3.5 text-[#ff7350]" />
                ))}
                {p.penalties === 0 && <span className="text-[#34d399] text-xs font-medium">Sicher!</span>}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onNext}
          className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #cf96ff 0%, #ff7350 100%)',
            boxShadow: '0 8px 32px rgba(207,150,255,0.2)',
          }}
          whileTap={{ scale: 0.97 }}
        >
          Runde {state.round + 1} starten
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function BombResultsScreen({ state, onRestart, onExit }: ResultsScreenProps) {
  const sorted = [...state.players].sort((a, b) => a.penalties - b.penalties);
  const winner = sorted[0];
  const bestReaction = sorted[0]?.name ?? '---';

  const handleShare = () => {
    const text = `Tickende Bombe - Ergebnis:\n${sorted.map((p, i) => `${i + 1}. ${p.name}: ${p.penalties} Treffer`).join('\n')}`;
    if (navigator.share) {
      navigator.share({ title: 'Tickende Bombe', text });
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d15] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background auras */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#cf96ff]/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#00e3fd]/[0.04] blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Celebration Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Trophy className="w-14 h-14 mx-auto text-[#fbbf24] drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
          </motion.div>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Herzlichen Glueckwunsch!
          </h1>
          <p className="text-white/40 text-sm">
            <span className="text-[#cf96ff] font-semibold">{winner?.name}</span> hat gewonnen!
          </p>
        </motion.div>

        {/* Stats Bento Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] border-l-2 border-l-[#cf96ff]">
            <Zap className="w-5 h-5 text-[#cf96ff] mb-2" />
            <p className="text-white text-sm font-bold">{bestReaction}</p>
            <p className="text-white/30 text-[10px] mt-1">Beste Reaktion</p>
          </div>
          <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] border-l-2 border-l-[#00e3fd]">
            <Crown className="w-5 h-5 text-[#00e3fd] mb-2" />
            <p className="text-white text-sm font-bold">{state.totalRounds}</p>
            <p className="text-white/30 text-[10px] mt-1">Runden gespielt</p>
          </div>
          <div className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] border-l-2 border-l-[#ff7350]">
            <Globe className="w-5 h-5 text-[#ff7350] mb-2" />
            <p className="text-white text-sm font-bold">{state.players.length}</p>
            <p className="text-white/30 text-[10px] mt-1">Spieler</p>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          className="bg-[#1f1f29] rounded-2xl p-4 border border-white/[0.06] space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Rangliste</h3>
          {sorted.map((p, i) => (
            <motion.div
              key={p.name}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                i === 0
                  ? 'bg-[#cf96ff]/10 border border-[#cf96ff]/20'
                  : 'bg-[#13131b]'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <div className="flex items-center gap-3">
                {i === 0 ? (
                  <div className="w-7 h-7 rounded-lg bg-[#cf96ff] flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#13131b] flex items-center justify-center">
                    <span className="text-white/40 text-xs font-bold">{i + 1}</span>
                  </div>
                )}
                <span className={`font-medium text-sm ${i === 0 ? 'text-[#cf96ff]' : 'text-white'}`}>
                  {p.name}
                </span>
              </div>
              <span className={`text-xs font-mono ${p.penalties === 0 ? 'text-[#34d399]' : 'text-[#ff6e84]'}`}>
                {p.penalties} {p.penalties === 1 ? 'Treffer' : 'Treffer'}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3 items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            onClick={onRestart}
            className="flex-1 h-14 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #cf96ff 0%, #ff7350 100%)',
              boxShadow: '0 8px 32px rgba(207,150,255,0.2)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <RotateCcw className="w-4 h-4" />
            Nochmal spielen
          </motion.button>
          <motion.button
            onClick={onExit}
            className="flex-1 h-14 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-transparent border border-white/10 hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <Gamepad2 className="w-4 h-4" />
            Anderes Spiel
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#1f1f29] border border-white/[0.06] hover:bg-[#262630] transition-colors flex-shrink-0"
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5 text-white/50" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
