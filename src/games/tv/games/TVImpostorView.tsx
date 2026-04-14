import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

interface Player {
  id?: string;
  name: string;
  isImpostor?: boolean;
  hasSpoken?: boolean;
  votedFor?: string;
  score?: number;
  color?: string;
}

const glass = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const shimmerKeyframes = `
@keyframes shimmer-text {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}`;

function PlayerCard({ player, index, showVotes, revealImpostor, isTopVoted }: {
  player: Player; index: number; showVotes?: boolean;
  revealImpostor?: boolean; isTopVoted?: boolean;
}) {
  const color = player.color || '#df8eff';
  const voteCount = showVotes ? (player as any).voteCount || 0 : 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-2 px-5 py-4 rounded-2xl relative"
      style={{
        ...glass,
        opacity: player.hasSpoken && !showVotes ? 0.55 : 1,
        boxShadow: isTopVoted ? '0 0 30px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.2)' :
          revealImpostor && player.isImpostor ? '0 0 40px rgba(239,68,68,0.6)' : 'none',
        borderColor: isTopVoted ? 'rgba(239,68,68,0.4)' :
          revealImpostor && player.isImpostor ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: player.hasSpoken && !showVotes ? 0.55 : 1,
        y: 0, scale: 1,
        ...((!player.hasSpoken && !showVotes) ? { boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 12px rgba(255,255,255,0.06)', '0 0 0px rgba(255,255,255,0)'] } : {}),
      }}
      transition={{ delay: index * 0.1, type: 'spring', damping: 18 }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
        style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}55` }}>
        {player.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-lg font-bold text-[#f1f3fc]">{player.name}</span>
      {player.hasSpoken && !showVotes && (
        <span className="text-sm text-[#a8abb3]">✓</span>
      )}
      <AnimatePresence>
        {showVotes && voteCount > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
            style={{ background: '#ef4444', boxShadow: '0 0 12px rgba(239,68,68,0.6)' }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ type: 'spring', damping: 10 }}
          >
            {voteCount}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TVImpostorView({ gameState }: { gameState: any }) {
  const phase: string = gameState?.phase || 'setup';
  const round: number = gameState?.round || 1;
  const players: Player[] = gameState?.players || [];

  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    if (phase === 'reveal') {
      setRevealStep(1);
      const timer = setTimeout(() => setRevealStep(2), 1500);
      return () => clearTimeout(timer);
    }
    setRevealStep(0);
  }, [phase]);

  const impostor = useMemo(() => players.find(p => p.isImpostor), [players]);

  const playersWithVotes = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach(p => { if (p.votedFor) counts[p.votedFor] = (counts[p.votedFor] || 0) + 1; });
    const maxVotes = Math.max(0, ...Object.values(counts));
    return players.map(p => ({
      ...p,
      voteCount: counts[p.id || p.name] || 0,
      isTopVoted: maxVotes > 0 && (counts[p.id || p.name] || 0) === maxVotes,
    }));
  }, [players]);

  const sortedResults = useMemo(
    () => [...players].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [players],
  );

  // --- WORD REVEAL ---
  if (phase === 'wordReveal') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
        <style>{shimmerKeyframes}</style>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 70%)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 3 }} />
        <motion.h1 className="text-4xl font-black text-[#f1f3fc] mb-4"
          animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          👀 SCHAUT AUF EURE HANDYS!
        </motion.h1>
        <p className="text-xl text-[#a8abb3]">Ein Wort — aber einer hat ein anderes...</p>
      </div>
    );
  }

  // --- DISCUSSION ---
  if (phase === 'discussion') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background: '#060810' }}>
        <style>{shimmerKeyframes}</style>
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
          <div className="px-5 py-2 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-lg font-bold text-[#f59e0b]">DISKUSSION</span>
          </div>
          <div className="px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
            <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}</span>
          </div>
        </div>
        <motion.h1 className="text-5xl font-black text-center mb-12 leading-tight"
          style={{
            background: 'linear-gradient(90deg, #f1f3fc 40%, #ef4444 50%, #f1f3fc 60%)',
            backgroundSize: '200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer-text 3s linear infinite',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.3))',
          }}>
          WER IST DER HOCHSTAPLER?
        </motion.h1>
        <div className="flex flex-wrap justify-center gap-5 max-w-4xl">
          {players.map((p, i) => (
            <PlayerCard key={p.id || p.name} player={p} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // --- VOTING ---
  if (phase === 'voting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background: '#060810' }}>
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-10">
          <div className="px-5 py-2 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span className="text-lg font-bold text-[#ef4444]">ABSTIMMUNG</span>
          </div>
          <div className="px-5 py-2 rounded-full bg-[#151a21]/80 border border-white/5">
            <span className="text-xl font-bold text-[#a8abb3]">RUNDE {round}</span>
          </div>
        </div>
        <motion.h1 className="text-4xl font-black text-[#f1f3fc] mb-10"
          style={{ textShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
          WER WIRD VERDÄCHTIGT?
        </motion.h1>
        <div className="flex flex-wrap justify-center gap-5 max-w-4xl">
          {playersWithVotes.map((p, i) => (
            <PlayerCard key={p.id || p.name} player={p} index={i} showVotes isTopVoted={p.isTopVoted} />
          ))}
        </div>
      </div>
    );
  }

  // --- REVEAL COUNTDOWN ---
  if (phase === 'revealCountdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        <motion.h1 className="text-5xl font-black text-[#f1f3fc]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2 }}>
          ENTHÜLLUNG IN...
        </motion.h1>
      </div>
    );
  }

  // --- REVEAL ---
  if (phase === 'reveal') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
        <AnimatePresence mode="wait">
          {revealStep === 1 && (
            <motion.h1 key="step1" className="text-5xl font-black text-[#f1f3fc]"
              style={{ textShadow: '0 0 30px rgba(239,68,68,0.4)' }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: [0.8, 1.05, 1] }}
              exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6 }}>
              DER HOCHSTAPLER IST...
            </motion.h1>
          )}
          {revealStep === 2 && impostor && (
            <motion.div key="step2" className="flex flex-col items-center gap-6">
              <motion.div className="w-28 h-28 rounded-full flex items-center justify-center text-white font-black text-5xl"
                style={{
                  backgroundColor: impostor.color || '#ef4444',
                  boxShadow: '0 0 40px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.3)',
                }}
                initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: 'spring', damping: 8, stiffness: 120 }}>
                {impostor.name.charAt(0).toUpperCase()}
              </motion.div>
              <motion.h1 className="text-8xl font-black text-[#ef4444]"
                style={{ textShadow: '0 0 40px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.3)' }}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                transition={{ type: 'spring', damping: 8, stiffness: 120, delay: 0.15 }}>
                {impostor.name}
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- BONUS GUESS ---
  if (phase === 'bonusGuess') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2.5 }} />
        <motion.h1 className="text-3xl font-black text-[#f1f3fc] text-center px-8 leading-relaxed"
          style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}
          animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          KANN DER HOCHSTAPLER DAS WORT ERRATEN?
        </motion.h1>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background: '#060810' }}>
        <h2 className="text-3xl font-black text-[#f1f3fc] mb-8">ERGEBNIS</h2>
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {sortedResults.map((p, i) => (
            <motion.div key={p.id || p.name}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl"
              style={{
                ...glass,
                borderColor: i === 0 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)',
                boxShadow: i === 0 ? '0 0 24px rgba(251,191,36,0.2)' : 'none',
              }}
              initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring' }}>
              <span className="text-2xl font-black" style={{ color: i === 0 ? '#fbbf24' : '#a8abb3', minWidth: 32 }}>
                {i === 0 ? '👑' : `#${i + 1}`}
              </span>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: p.color || '#df8eff' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xl font-bold text-[#f1f3fc] flex-1">{p.name}</span>
              {p.isImpostor && <span className="text-sm text-[#ef4444] font-bold">HOCHSTAPLER</span>}
              <span className="text-xl font-black" style={{ color: i === 0 ? '#fbbf24' : '#df8eff' }}>
                {p.score || 0}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // --- FALLBACK (setup / unknown) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
      <motion.div className="flex items-center gap-3"
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
        <div className="w-3 h-3 rounded-full bg-[#df8eff]" />
        <span className="text-2xl text-[#a8abb3]">Spiel wird vorbereitet...</span>
      </motion.div>
    </div>
  );
}
