import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, ChevronUp, ChevronDown, Trophy, X } from 'lucide-react';
import type { PartyScore } from './usePartySession';

interface Props {
  leaderboard: PartyScore[];
  totalGames: number;
  onEnd: () => void;
}

export default function PartySessionBar({ leaderboard, totalGames, onEnd }: Props) {
  const [expanded, setExpanded] = useState(false);
  const leader = leaderboard[0];
  if (!leader) return null;

  return (
    <motion.div className="fixed bottom-0 left-0 right-0 z-40" initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
      {/* Expanded leaderboard */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-[#0a0e14]/95 backdrop-blur-2xl border-t border-[#df8eff]/10 px-4 pt-4 pb-2 overflow-hidden">
            <div className="max-w-lg mx-auto space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#a8abb3]">Party-Session Rangliste</span>
                <button onClick={onEnd} className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-[#ff6e84] bg-[#ff6e84]/10 border border-[#ff6e84]/20">
                  <X className="w-3 h-3" /> Session beenden
                </button>
              </div>
              {leaderboard.map((p, i) => (
                <motion.div key={p.playerId} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: i === 0 ? 'rgba(251,191,36,0.08)' : 'rgba(21,26,33,0.6)', border: i === 0 ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.03)' }}
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <span className="w-5 text-center text-xs font-bold" style={{ color: i === 0 ? '#fbbf24' : i < 3 ? '#df8eff' : '#a8abb3' }}>
                    {i === 0 ? '👑' : `${i + 1}`}
                  </span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: p.playerColor }}>
                    {p.playerName.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white">{p.playerName}</span>
                  <span className="text-xs text-[#a8abb3]">{p.gamesWon}W</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: i === 0 ? '#fbbf24' : '#df8eff' }}>{p.totalScore}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact bar */}
      <div className="bg-[#0a0e14]/90 backdrop-blur-2xl border-t border-[#df8eff]/15 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
              <span className="text-sm font-bold text-white truncate">{leader.playerName}</span>
              <span className="text-sm font-bold text-[#fbbf24] tabular-nums flex-shrink-0">{leader.totalScore}</span>
            </div>
            <span className="text-[10px] text-[#a8abb3] flex-shrink-0 px-2 py-0.5 rounded-full bg-[#151a21]">
              {totalGames} {totalGames === 1 ? 'Spiel' : 'Spiele'}
            </span>
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg bg-[#151a21] text-[#a8abb3]">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
