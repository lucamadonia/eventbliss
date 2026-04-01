import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Timer,
  Zap, MessageSquare, Shuffle, BarChart3, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { useGameTimer } from '../engine/TimerSystem';
import { THISORTHAT_PAIRS, type ThisOrThatPair } from './thisorthat-content-de';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'voting' | 'reveal' | 'debate' | 'gameOver';

interface Player {
  id: string; name: string; color: string; avatar: string; score: number;
}

interface RoundVote {
  pair: ThisOrThatPair;
  votes: Record<string, 'A' | 'B'>;
}

const PLAYER_COLORS = ['#06b6d4','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981','#ec4899','#f97316','#6366f1','#14b8a6'];

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Classic', desc: 'Kein Zeitdruck, alle stimmen ab', icon: <Shuffle className="w-6 h-6" /> },
  { id: 'speed', name: 'Speed', desc: '5 Sekunden pro Spieler!', icon: <Zap className="w-6 h-6" /> },
  { id: 'debatte', name: 'Debatte', desc: 'Nach dem Ergebnis: 30s Diskussion', icon: <MessageSquare className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 3, max: 15, default: 5, step: 1, label: 'Speed-Timer (Sek.)' },
  rounds: { min: 5, max: 30, default: 15, step: 1, label: 'Runden' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ThisOrThatGame() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [speedTimer, setSpeedTimer] = useState(5);
  const [totalRounds, setTotalRounds] = useState(15);
  const [currentRound, setCurrentRound] = useState(1);

  const [deck] = useState(() => shuffle(THISORTHAT_PAIRS));
  const [deckPos, setDeckPos] = useState(0);
  const [currentPair, setCurrentPair] = useState<ThisOrThatPair | null>(null);
  const [voterIdx, setVoterIdx] = useState(0);
  const [roundVotes, setRoundVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [history, setHistory] = useState<RoundVote[]>([]);

  const handleDebateExpire = useCallback(() => setPhase('reveal'), []);
  const debateTimer = useGameTimer(30, handleDebateExpire);

  const handleSpeedExpire = useCallback(() => {
    // auto-pick random if not voted in time
    setRoundVotes((prev) => {
      const p = players[voterIdx];
      if (p && !prev[p.id]) return { ...prev, [p.id]: Math.random() > 0.5 ? 'A' : 'B' };
      return prev;
    });
    if (voterIdx + 1 >= players.length) {
      setPhase('reveal');
    } else {
      setVoterIdx((v) => v + 1);
      speedTimerHook.reset(speedTimer);
      speedTimerHook.start();
    }
  }, [voterIdx, players, speedTimerHook, speedTimer]);

  const speedTimerHook = useGameTimer(speedTimer, handleSpeedExpire);

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  const handleStart = (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => {
    const p = mapped.map((m, i) => ({ ...m, color: PLAYER_COLORS[i % PLAYER_COLORS.length], score: 0 }));
    setPlayers(p);
    setMode(selectedMode);
    setSpeedTimer(settings.timer);
    setTotalRounds(settings.rounds);
    setCurrentRound(1);
    setDeckPos(0);
    setHistory([]);
    startRound(0, p);
  };

  const startRound = (pos: number, pls?: Player[]) => {
    const pair = deck[pos % deck.length];
    setCurrentPair(pair);
    setRoundVotes({});
    setVoterIdx(0);
    setPhase('voting');
    if (mode === 'speed') {
      speedTimerHook.reset(speedTimer);
      speedTimerHook.start();
    }
  };

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------

  const castVote = (choice: 'A' | 'B') => {
    const voter = players[voterIdx];
    if (!voter) return;
    const newVotes = { ...roundVotes, [voter.id]: choice };
    setRoundVotes(newVotes);

    if (voterIdx + 1 >= players.length) {
      // All voted
      if (mode === 'speed') speedTimerHook.pause();
      if (mode === 'debatte') {
        debateTimer.reset(30);
        debateTimer.start();
        setPhase('debate');
      } else {
        setPhase('reveal');
      }
    } else {
      setVoterIdx((v) => v + 1);
      if (mode === 'speed') {
        speedTimerHook.reset(speedTimer);
        speedTimerHook.start();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Reveal stats
  // ---------------------------------------------------------------------------

  const voteStats = useMemo(() => {
    const total = Object.keys(roundVotes).length;
    const aCount = Object.values(roundVotes).filter((v) => v === 'A').length;
    const bCount = total - aCount;
    return { total, aCount, bCount, aPct: total > 0 ? Math.round((aCount / total) * 100) : 0, bPct: total > 0 ? Math.round((bCount / total) * 100) : 0 };
  }, [roundVotes]);

  // ---------------------------------------------------------------------------
  // Next round
  // ---------------------------------------------------------------------------

  const nextRound = () => {
    if (currentPair) {
      setHistory((h) => [...h, { pair: currentPair, votes: { ...roundVotes } }]);
    }
    // Award points: majority gets 1 point per voter in majority
    const majority = voteStats.aCount >= voteStats.bCount ? 'A' : 'B';
    setPlayers((prev) => prev.map((p) => ({
      ...p,
      score: p.score + (roundVotes[p.id] === majority ? 1 : 0),
    })));

    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }
    const nextPos = deckPos + 1;
    setDeckPos(nextPos);
    setCurrentRound((r) => r + 1);
    startRound(nextPos);
  };

  const endDebate = () => setPhase('reveal');

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
  };

  const winner = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score)[0], [players]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="This or That"
        minPlayers={2}
        maxPlayers={20}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0d15] text-white flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button onClick={() => navigate('/games')} className="p-2 text-white/40 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-white/40">
          Runde {currentRound}/{totalRounds}
        </div>
        <div className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] text-xs font-bold text-[#00e3fd]">
          {currentPair?.category}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* VOTING */}
        {phase === 'voting' && currentPair && (
          <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6">
            {/* Voter info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: players[voterIdx]?.color }}>
                {players[voterIdx]?.avatar}
              </div>
              <span className="text-white/60 text-sm">{players[voterIdx]?.name} waehlt</span>
              {mode === 'speed' && (
                <span className={cn("ml-2 font-mono font-bold", speedTimerHook.timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-[#ff7350]')}>
                  {speedTimerHook.timeLeft}s
                </span>
              )}
            </div>
            {/* Progress dots */}
            <div className="flex gap-1">
              {players.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full",
                  i < voterIdx ? 'bg-[#cf96ff]' : i === voterIdx ? 'bg-white' : 'bg-white/10')} />
              ))}
            </div>
            {/* Two cards */}
            <div className="flex gap-4 w-full max-w-md mt-4">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => castVote('A')}
                className="flex-1 rounded-2xl bg-gradient-to-br from-[#cf96ff]/20 to-[#8b5cf6]/20 border-2 border-[#cf96ff]/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all hover:border-[#cf96ff]/60 hover:shadow-[0_0_30px_rgba(207,150,255,0.2)]">
                <div className="w-12 h-12 rounded-full bg-[#cf96ff]/20 flex items-center justify-center">
                  <span className="text-[#cf96ff] font-black text-lg">A</span>
                </div>
                <span className="text-xl font-extrabold text-white text-center leading-tight">{currentPair.optionA}</span>
              </motion.button>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => castVote('B')}
                className="flex-1 rounded-2xl bg-gradient-to-br from-[#00e3fd]/20 to-[#0ea5e9]/20 border-2 border-[#00e3fd]/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] transition-all hover:border-[#00e3fd]/60 hover:shadow-[0_0_30px_rgba(0,227,253,0.2)]">
                <div className="w-12 h-12 rounded-full bg-[#00e3fd]/20 flex items-center justify-center">
                  <span className="text-[#00e3fd] font-black text-lg">B</span>
                </div>
                <span className="text-xl font-extrabold text-white text-center leading-tight">{currentPair.optionB}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* DEBATE */}
        {phase === 'debate' && currentPair && (
          <motion.div key="debate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <MessageSquare className="w-10 h-10 text-[#ff7350]" />
            <h2 className="text-2xl font-extrabold">Debatte!</h2>
            <p className="text-white/40 text-sm text-center">Diskutiert 30 Sekunden ueber eure Wahl</p>
            <div className="text-4xl font-mono font-black text-[#ff7350]">{debateTimer.timeLeft}s</div>
            <div className="flex gap-4 w-full max-w-sm">
              <div className="flex-1 rounded-2xl bg-[#cf96ff]/10 border border-[#cf96ff]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#cf96ff]">{currentPair.optionA}</span>
              </div>
              <div className="text-white/20 self-center font-bold">vs</div>
              <div className="flex-1 rounded-2xl bg-[#00e3fd]/10 border border-[#00e3fd]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#00e3fd]">{currentPair.optionB}</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={endDebate}
              className="mt-4 px-8 py-3 rounded-2xl bg-white/10 border border-white/10 text-white/60 font-bold text-sm">
              Ueberspringen
            </motion.button>
          </motion.div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && currentPair && (
          <motion.div key="reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8">
            <BarChart3 className="w-8 h-8 text-[#00e3fd]" />
            <h2 className="text-xl font-extrabold">Ergebnis</h2>
            {/* Result cards */}
            <div className="w-full max-w-sm space-y-3">
              <div className="rounded-2xl bg-[#1f1f29] border border-white/[0.06] p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#cf96ff] font-bold">{currentPair.optionA}</span>
                  <span className="text-white font-black text-lg">{voteStats.aPct}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${voteStats.aPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#cf96ff] to-[#8b5cf6]" />
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {players.filter((p) => roundVotes[p.id] === 'A').map((p) => (
                    <div key={p.id} className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-[#1f1f29] border border-white/[0.06] p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#00e3fd] font-bold">{currentPair.optionB}</span>
                  <span className="text-white font-black text-lg">{voteStats.bPct}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${voteStats.bPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00e3fd] to-[#0ea5e9]" />
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {players.filter((p) => roundVotes[p.id] === 'B').map((p) => (
                    <div key={p.id} className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  ))}
                </div>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={nextRound}
              className="w-full max-w-sm flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_25px_rgba(207,150,255,0.25)]">
              Weiter <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* GAME OVER */}
        {phase === 'gameOver' && winner && (
          <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Spielende!
            </h2>
            <div className="text-lg font-bold text-[#00e3fd]">{winner.name} gewinnt!</div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#1f1f29] border border-white/[0.06] rounded-2xl px-4 py-3">
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
                  <span className="text-[#00e3fd] font-bold">{p.score} Pkt.</span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-3 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] text-[#0d0d15] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_25px_rgba(207,150,255,0.25)]">
                <RotateCcw className="w-4 h-4" /> Nochmal
              </motion.button>
              <button onClick={() => navigate('/games')}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors">
                Anderes Spiel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
