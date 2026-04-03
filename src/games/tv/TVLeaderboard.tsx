import { motion } from 'framer-motion';
import { Crown, Medal, Trophy } from 'lucide-react';
import type { TVScore } from './useTVConnection';

const RANK_COLORS = ['#fbbf24', '#a8abb3', '#cd7f32'];
const RANK_GLOWS = ['0 0 30px rgba(251,191,36,0.4)', '0 0 20px rgba(168,171,179,0.2)', '0 0 20px rgba(205,127,50,0.2)'];

export default function TVLeaderboard({ scores }: { scores: TVScore[] }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center p-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Title */}
      <motion.h1 className="text-7xl font-black italic tracking-tighter mb-16 text-center"
        style={{ background: 'linear-gradient(135deg, #df8eff, #8ff5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(223,142,255,0.4))' }}
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        RANGLISTE
      </motion.h1>

      {/* Leaderboard rows */}
      <div className="w-full max-w-3xl space-y-4">
        {sorted.map((entry, i) => (
          <motion.div key={entry.name}
            className={`flex items-center gap-6 px-8 py-5 rounded-2xl border ${i < 3 ? 'border-white/10' : 'border-white/5'}`}
            style={{
              background: i === 0 ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))' : i < 3 ? 'rgba(21,26,33,0.6)' : 'rgba(15,20,26,0.4)',
              boxShadow: i < 3 ? RANK_GLOWS[i] : 'none',
            }}
            initial={{ x: i % 2 === 0 ? -200 : 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 + i * 0.15 }}
            layout>
            {/* Rank */}
            <div className="flex-shrink-0 w-14 text-center">
              {i === 0 ? <Crown className="w-10 h-10 mx-auto" style={{ color: RANK_COLORS[0], filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
                : i < 3 ? <Medal className="w-8 h-8 mx-auto" style={{ color: RANK_COLORS[i] }} />
                : <span className="text-3xl font-black text-[#a8abb3]/40">{i + 1}</span>}
            </div>

            {/* Avatar */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: entry.color, boxShadow: i === 0 ? `0 0 20px ${entry.color}66` : 'none' }}>
              {entry.name.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <span className={`text-2xl font-bold flex-1 ${i === 0 ? 'text-[#fbbf24]' : 'text-[#f1f3fc]'}`}>{entry.name}</span>

            {/* Score with count-up effect */}
            <motion.span className={`text-3xl font-black tabular-nums ${i === 0 ? 'text-[#fbbf24]' : i < 3 ? 'text-[#df8eff]' : 'text-[#a8abb3]'}`}
              initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}>
              {entry.score.toLocaleString('de-DE')}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
