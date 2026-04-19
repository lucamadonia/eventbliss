import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Trophy, ArrowLeft, ArrowRight, Timer,
  Zap, MessageSquare, Shuffle, BarChart3, Clock, Check,
  X as CloseIcon, Users, Stars, Flame, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import { useGameTimer } from '../engine/TimerSystem';
import { THISORTHAT_PAIRS, type ThisOrThatPair } from './thisorthat-content-de';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";
import { useHaptics } from "@/hooks/useHaptics";

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

// Mode cards for the bento setup grid. `size` controls the grid span,
// `tone` selects the accent color family used for border/chip/icon.
type ModeCard = {
  id: string;
  label: string;
  tag?: string;
  desc: string;
  icon: React.ReactNode;
  size: 'large' | 'medium' | 'small';
  tone: 'primary' | 'secondary' | 'tertiary';
};
const MODE_CARDS: ModeCard[] = [
  { id: 'classic', label: 'Classic', tag: 'Beliebt', desc: 'Kein Zeitdruck — die Gruppe stimmt gemeinsam ab.', icon: <Shuffle className="w-6 h-6" />, size: 'large',  tone: 'primary'  },
  { id: 'speed',   label: 'Speed',                    desc: '5s pro Person — Bauchgefühl gewinnt.',          icon: <Zap className="w-6 h-6" />,      size: 'small',  tone: 'tertiary' },
  { id: 'debatte', label: 'Debatte',                  desc: 'Nach dem Voting: 30s Diskussion.',              icon: <MessageSquare className="w-6 h-6" />, size: 'medium', tone: 'secondary' },
  { id: 'chaos',   label: 'Chaos',                    desc: 'Schnellere Runden + mehr Cards.',               icon: <Flame className="w-6 h-6" />,    size: 'medium', tone: 'primary'  },
];

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

const EP_STYLE = `
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.neon-glow-cyan { text-shadow: 0 0 20px rgba(143,245,255,0.6), 0 0 40px rgba(143,245,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
`;

export default function ThisOrThatGame({ online }: { online?: OnlineGameProps } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [speedTimer, setSpeedTimer] = useState(5);
  const [totalRounds, setTotalRounds] = useState(15);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);
  const [currentRound, setCurrentRound] = useState(1);

  const [deck] = useState(() => shuffle(THISORTHAT_PAIRS));
  const [deckPos, setDeckPos] = useState(0);
  const [currentPair, setCurrentPair] = useState<ThisOrThatPair | null>(null);
  const [voterIdx, setVoterIdx] = useState(0);
  const [roundVotes, setRoundVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [history, setHistory] = useState<RoundVote[]>([]);

  useTVGameBridge('thisorthat', { phase, currentRound, currentPair, players }, [phase, currentRound]);

  const handleDebateExpire = useCallback(() => setPhase('reveal'), []);
  const debateTimer = useGameTimer(30, handleDebateExpire);

  // speedTimerHook must be declared before handleSpeedExpire uses it
  const speedTimerRef = useRef<ReturnType<typeof useGameTimer> | null>(null);

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
      speedTimerRef.current?.reset(speedTimer);
      speedTimerRef.current?.start();
    }
  }, [voterIdx, players, speedTimer]);

  const speedTimerHook = useGameTimer(speedTimer, handleSpeedExpire);
  speedTimerRef.current = speedTimerHook;

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
    // Online mode: everyone votes simultaneously on their own device
    if (online) {
      const myId = online.myPlayerId;
      if (!myId || roundVotes[myId]) return; // already voted
      if (online.isHost) {
        applyVoteLocally(myId, choice);
      } else {
        // Non-host broadcasts to host and optimistically shows own vote
        online.broadcast('player-action', { type: 'vote', playerId: myId, choice });
        setRoundVotes(prev => prev[myId] ? prev : { ...prev, [myId]: choice });
      }
      return;
    }

    // Offline pass-and-play (unchanged)
    const voter = players[voterIdx];
    if (!voter) return;
    const newVotes = { ...roundVotes, [voter.id]: choice };
    setRoundVotes(newVotes);

    if (voterIdx + 1 >= players.length) {
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

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('this-or-that', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
  };

  const winner = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score)[0], [players]);

  /* ---- Online: host broadcast helper ---- */
  const broadcastGameState = useCallback(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, totalRounds,
      currentPair: currentPair ? { optionA: currentPair.optionA, optionB: currentPair.optionB } : null,
      roundVotes,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  }, [online, phase, currentRound, totalRounds, currentPair, roundVotes, players]);

  /* ---- Online: host broadcasts on state change ---- */
  useEffect(() => {
    broadcastGameState();
  }, [broadcastGameState]);

  /* ---- Online: handshake — host replies to late joiners with full state ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('request-state', () => broadcastGameState());
  }, [online, broadcastGameState]);

  /* ---- Online: host merges votes coming from non-hosts ---- */
  const applyVoteLocally = useCallback((playerId: string, choice: 'A' | 'B') => {
    setRoundVotes(prev => {
      if (prev[playerId]) return prev;
      const next = { ...prev, [playerId]: choice };
      if (online?.isHost && Object.keys(next).length >= players.length) {
        // All players voted → transition phase
        queueMicrotask(() => {
          if (mode === 'speed') speedTimerHook.pause();
          if (mode === 'debatte') {
            debateTimer.reset(30);
            debateTimer.start();
            setPhase('debate');
          } else {
            setPhase('reveal');
          }
        });
      }
      return next;
    });
  }, [online, players.length, mode, speedTimerHook, debateTimer]);

  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('player-action', (data) => {
      if (data.type === 'vote' && typeof data.playerId === 'string' && (data.choice === 'A' || data.choice === 'B')) {
        applyVoteLocally(data.playerId, data.choice);
      }
    });
  }, [online, applyVoteLocally]);

  /* ---- Online: non-host syncs game-state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.currentPair) setCurrentPair(data.currentPair as ThisOrThatPair);
      if (data.roundVotes) setRoundVotes(data.roundVotes as Record<string, 'A' | 'B'>);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  /* ---- Online: non-host requests current state once on mount ---- */
  const requestedStateRef = useRef(false);
  useEffect(() => {
    if (!online || online.isHost || requestedStateRef.current) return;
    requestedStateRef.current = true;
    online.broadcast('request-state', {});
  }, [online]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (phase === 'setup') {
    return (
      <ThisOrThatSetup
        onStart={handleStart}
        onlinePlayers={online?.players}
        haptics={haptics}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col font-game">
      <style>{EP_STYLE}</style>
      {/* Ambient glow orbs */}
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#44484f]/20">
        <button onClick={() => navigate('/games')} className="p-2 text-[#a8abb3] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-[#a8abb3]">
          Runde {currentRound}/{totalRounds}
        </div>
        <div className="px-3 py-1 rounded-full glass-card border border-[#44484f]/30 text-xs font-bold text-[#8ff5ff]">
          {currentPair?.category}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* VOTING — full-bleed A/B panels with floating VS medallion */}
        {phase === 'voting' && currentPair && (() => {
          const myId = online?.myPlayerId;
          const iAlreadyVoted = !!(online && myId && roundVotes[myId]);
          const votedCount = Object.keys(roundVotes).length;
          const tap = (choice: 'A' | 'B') => {
            if (iAlreadyVoted) return;
            void haptics.medium();
            castVote(choice);
          };
          return (
            <motion.div
              key="voting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col px-4 sm:px-6 py-4"
            >
              {/* Title + progress strip */}
              <div className="mb-4 sm:mb-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter italic">
                  THIS <span className="text-[#df8eff] drop-shadow-[0_0_10px_#df8eff]">or</span> THAT?
                </h2>
                <div className="mt-3 flex justify-center gap-1">
                  {Array.from({ length: totalRounds }).slice(0, 12).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i < currentRound - 1 && 'w-6 bg-[#df8eff]/70',
                        i === currentRound - 1 && 'w-8 bg-[#df8eff] shadow-[0_0_10px_#df8eff]',
                        i > currentRound - 1 && 'w-6 bg-[#20262f]',
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Voter banner */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {online ? (
                  <span className="text-[#a8abb3] text-xs font-semibold">
                    {iAlreadyVoted
                      ? `Warte auf andere · ${votedCount}/${players.length}`
                      : 'Deine Wahl'}
                  </span>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: players[voterIdx]?.color }}
                    >
                      {players[voterIdx]?.avatar}
                    </div>
                    <span className="text-[#a8abb3] text-xs font-semibold">
                      <span className="text-white font-bold">{players[voterIdx]?.name}</span> wählt
                    </span>
                  </>
                )}
                {mode === 'speed' && !online && (
                  <span className={cn(
                    "ml-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-black",
                    speedTimerHook.timeLeft <= 2
                      ? 'bg-[#ff6e84]/15 text-[#ff6e84] animate-pulse'
                      : 'bg-[#ff6b98]/15 text-[#ff6b98]',
                  )}>
                    {speedTimerHook.timeLeft}s
                  </span>
                )}
              </div>

              {/* Two panels — column on mobile, row on larger */}
              <div className="relative flex-1 flex flex-col sm:flex-row items-stretch gap-3 min-h-[440px]">
                {/* Option A */}
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  whileTap={iAlreadyVoted ? {} : { scale: 0.97 }}
                  onClick={() => tap('A')}
                  disabled={iAlreadyVoted}
                  className={cn(
                    "group relative flex-1 rounded-2xl overflow-hidden text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all",
                    iAlreadyVoted ? 'opacity-60 cursor-default' : 'hover:shadow-[0_30px_60px_rgba(255,107,152,0.25)]',
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b98] via-[#a1004b] to-[#47001d]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,107,152,0.35),transparent_60%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative h-full min-h-[200px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-8">
                    <span className="text-[#ffc1ce] font-black text-[10px] tracking-[0.3em] uppercase mb-1">
                      Option A
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05] break-words">
                      {currentPair.optionA}
                    </h3>
                    {!iAlreadyVoted && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ff6b98] text-[#47001d] font-black text-[11px] tracking-wider uppercase w-fit opacity-90 group-hover:opacity-100">
                        Wählen <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </motion.button>

                {/* VS medallion — floats between the two panels */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <motion.div
                    animate={{ rotate: [-2, 2, -2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-[#df8eff]/30 blur-xl" />
                    <div
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                      style={{
                        background: 'radial-gradient(circle, #0a0e14 55%, #151a21 100%)',
                        border: '4px solid #20262f',
                      }}
                    >
                      <span className="text-3xl sm:text-4xl font-black italic tracking-tighter bg-gradient-to-br from-[#ff6b98] via-white to-[#8ff5ff] bg-clip-text text-transparent">
                        VS
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Option B */}
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  whileTap={iAlreadyVoted ? {} : { scale: 0.97 }}
                  onClick={() => tap('B')}
                  disabled={iAlreadyVoted}
                  className={cn(
                    "group relative flex-1 rounded-2xl overflow-hidden text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all",
                    iAlreadyVoted ? 'opacity-60 cursor-default' : 'hover:shadow-[0_30px_60px_rgba(143,245,255,0.25)]',
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-bl from-[#8ff5ff] via-[#005e64] to-[#003f43]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(143,245,255,0.35),transparent_60%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative h-full min-h-[200px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-8">
                    <span className="text-[#8ff5ff] font-black text-[10px] tracking-[0.3em] uppercase mb-1">
                      Option B
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05] break-words">
                      {currentPair.optionB}
                    </h3>
                    {!iAlreadyVoted && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8ff5ff] text-[#003f43] font-black text-[11px] tracking-wider uppercase w-fit opacity-90 group-hover:opacity-100">
                        Wählen <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Voter progress dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {players.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      online
                        ? i < votedCount ? 'bg-[#df8eff] scale-125' : 'bg-white/10'
                        : i < voterIdx ? 'bg-[#df8eff] scale-125'
                        : i === voterIdx ? 'bg-white scale-150' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* DEBATE */}
        {phase === 'debate' && currentPair && (
          <motion.div key="debate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <MessageSquare className="w-10 h-10 text-[#ff6b98]" />
            <h2 className="text-2xl font-extrabold">Debatte!</h2>
            <p className="text-white/40 text-sm text-center">Diskutiert 30 Sekunden ueber eure Wahl</p>
            <div className="text-4xl font-mono font-black text-[#ff6b98]">{debateTimer.timeLeft}s</div>
            <div className="flex gap-4 w-full max-w-sm">
              <div className="flex-1 rounded-2xl bg-[#df8eff]/10 border border-[#df8eff]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#df8eff]">{currentPair.optionA}</span>
              </div>
              <div className="text-white/20 self-center font-bold">vs</div>
              <div className="flex-1 rounded-2xl bg-[#8ff5ff]/10 border border-[#8ff5ff]/20 p-4 text-center">
                <span className="text-lg font-bold text-[#8ff5ff]">{currentPair.optionB}</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={endDebate}
              className="mt-4 px-8 py-3 rounded-2xl bg-white/10 border border-white/10 text-white/60 font-bold text-sm">
              Ueberspringen
            </motion.button>
          </motion.div>
        )}

        {/* REVEAL — "THE VERDICT" bento with winner + runner-up */}
        {phase === 'reveal' && currentPair && (() => {
          const aIsWinner = voteStats.aCount >= voteStats.bCount;
          const winnerLabel = aIsWinner ? currentPair.optionA : currentPair.optionB;
          const loserLabel  = aIsWinner ? currentPair.optionB : currentPair.optionA;
          const winnerPct   = aIsWinner ? voteStats.aPct : voteStats.bPct;
          const loserPct    = aIsWinner ? voteStats.bPct : voteStats.aPct;
          const winnerVotes = aIsWinner ? voteStats.aCount : voteStats.bCount;
          const loserVotes  = aIsWinner ? voteStats.bCount : voteStats.aCount;
          const winnerVoters = players.filter((p) => roundVotes[p.id] === (aIsWinner ? 'A' : 'B'));
          const loserVoters  = players.filter((p) => roundVotes[p.id] === (aIsWinner ? 'B' : 'A'));
          const landslide = winnerPct >= 75;
          const sentiment = landslide
            ? 'Eindeutige Entscheidung — eure Gruppe ist sich einig.'
            : winnerPct >= 60
              ? 'Klare Mehrheit, aber Raum für Debatte.'
              : 'Knappes Rennen — das wird spannend.';

          return (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 px-5 py-6 max-w-2xl mx-auto w-full"
            >
              {/* Hero header */}
              <div className="relative mb-8 text-center">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-56 h-56 bg-[#df8eff]/10 rounded-full blur-[80px] pointer-events-none" />
                <p className="text-[#8ff5ff] font-bold tracking-[0.25em] uppercase text-[11px] mb-2">Runde {currentRound} · Ergebnis</p>
                <motion.h2
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.35 }}
                  className="text-4xl sm:text-5xl font-black tracking-tight italic drop-shadow-[0_0_12px_rgba(223,142,255,0.45)]"
                >
                  DAS VERDIKT
                </motion.h2>
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#20262f] border border-[#44484f]/40 text-xs">
                  <Users className="w-3.5 h-3.5 text-[#ff6b98]" />
                  <span className="font-bold">{voteStats.total} Stimmen</span>
                </div>
              </div>

              {/* Winner + Runner-up bento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* Winner card */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-[#1b2028] border-b-4 border-[#df8eff] p-6 flex flex-col items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                >
                  {/* Stars top-right with glow */}
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-4 right-4"
                  >
                    <Stars className="w-6 h-6 text-[#df8eff] drop-shadow-[0_0_10px_rgba(223,142,255,0.6)]" />
                  </motion.div>
                  {/* Percentage puck */}
                  <div className="relative mb-4">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(223,142,255,0.5)',
                          '0 0 0 16px rgba(223,142,255,0)',
                        ],
                      }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#df8eff]/30 to-[#d779ff]/10 border-4 border-[#df8eff]/40 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.4 }}
                        className="text-3xl font-black text-white"
                      >
                        {winnerPct}%
                      </motion.span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#a8abb3]">Winner</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2 break-words">{winnerLabel}</h3>
                  <div className="w-full h-2 rounded-full bg-[#20262f] overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winnerPct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#df8eff] to-[#d779ff] shadow-[0_0_10px_rgba(223,142,255,0.5)]"
                    />
                  </div>
                  <p className="text-[11px] text-[#a8abb3] font-medium">{winnerVotes} {winnerVotes === 1 ? 'Stimme' : 'Stimmen'}</p>
                  {/* Voter avatars */}
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {winnerVoters.slice(0, 8).map((p) => (
                      <div
                        key={p.id}
                        className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#1b2028]"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Runner-up card */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl bg-[#151a21] border-b-4 border-[#ff6b98]/40 p-6 flex flex-col items-center text-center"
                >
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-[#20262f] border-4 border-[#ff6b98]/20 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white/80">{loserPct}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#a8abb3]">Runner-up</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-white/80 mb-2 break-words">{loserLabel}</h3>
                  <div className="w-full h-2 rounded-full bg-[#20262f] overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${loserPct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#ff6b98]/60 to-[#e4006c]/50 opacity-70"
                    />
                  </div>
                  <p className="text-[11px] text-[#a8abb3] font-medium">{loserVotes} {loserVotes === 1 ? 'Stimme' : 'Stimmen'}</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {loserVoters.slice(0, 8).map((p) => (
                      <div
                        key={p.id}
                        className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#151a21] opacity-70"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Sentiment row */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-[#0f141a] border border-[#44484f]/20 p-5 mb-6"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-[#ff6b98] uppercase tracking-[0.25em]">Gruppen-Stimmung</span>
                  <div className="flex -space-x-1.5">
                    {players.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="w-6 h-6 rounded-full border-2 border-[#0f141a] flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                    ))}
                    {players.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-[#20262f] border-2 border-[#0f141a] flex items-center justify-center text-[8px] font-bold">
                        +{players.length - 4}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#a8abb3]">
                  {sentiment} <span className="text-white font-bold">{winnerLabel}</span>{landslide ? ' gewinnt im Erdrutsch.' : '.'}
                </p>
              </motion.div>

              {/* Next round CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { void haptics.light(); nextRound(); }}
                className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[#0a0e14] font-black tracking-tight text-base shadow-[0_12px_24px_-8px_rgba(223,142,255,0.4)]"
                style={{ background: 'linear-gradient(135deg, #df8eff, #d779ff)' }}
              >
                Nächste Runde <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          );
        })()}

        {/* GAME OVER */}
        {phase === 'gameOver' && winner && (
          <motion.div key="over" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full">
            <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-extrabold text-[#df8eff] neon-glow">
              Spielende!
            </h2>
            <div className="text-lg font-bold text-[#8ff5ff]">{winner.name} gewinnt!</div>
            <div className="w-full space-y-2 max-h-64 overflow-y-auto">
              {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#1b2028] border border-[#44484f]/20 rounded-2xl px-4 py-3">
                  <span className="text-white/30 text-sm font-bold w-5">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>{p.avatar}</div>
                  <span className="flex-1 text-white/80 font-semibold truncate">{p.name}</span>
                  <span className="text-[#8ff5ff] font-bold">{p.score} Pkt.</span>
                </div>
              ))}
            </div>
            <div className="w-full space-y-3 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] text-[#0a0e14] py-4 rounded-2xl h-14 font-extrabold shadow-[0_0_25px_rgba(207,150,255,0.25)]">
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

// ---------------------------------------------------------------------------
// ThisOrThatSetup — bento-grid game setup (hero + mode cards + difficulty +
// player strip + start). Lives inside the same file to keep the diff
// reviewable; the shared `GameSetup` component stays in place for the 6
// other games that use it.
// ---------------------------------------------------------------------------

interface ThisOrThatSetupProps {
  onStart: (
    mapped: { id: string; name: string; color: string; avatar: string }[],
    selectedMode: string,
    settings: { timer: number; rounds: number },
  ) => void;
  onlinePlayers?: { id: string; name: string; color?: string; avatar?: string }[];
  haptics: ReturnType<typeof useHaptics>;
}

const TONE_STYLE: Record<'primary' | 'secondary' | 'tertiary', {
  border: string; chip: string; icon: string; text: string; glow: string;
}> = {
  primary:   { border: 'border-[#df8eff]', chip: 'bg-[#df8eff]/20 text-[#df8eff]',  icon: 'text-[#df8eff]',  text: 'text-[#df8eff]',  glow: 'shadow-[0_0_22px_rgba(223,142,255,0.22)]' },
  secondary: { border: 'border-[#ff6b98]', chip: 'bg-[#ff6b98]/20 text-[#ff6b98]',  icon: 'text-[#ff6b98]',  text: 'text-[#ff6b98]',  glow: 'shadow-[0_0_22px_rgba(255,107,152,0.22)]' },
  tertiary:  { border: 'border-[#8ff5ff]', chip: 'bg-[#8ff5ff]/20 text-[#8ff5ff]',  icon: 'text-[#8ff5ff]',  text: 'text-[#8ff5ff]',  glow: 'shadow-[0_0_22px_rgba(143,245,255,0.22)]' },
};

function ThisOrThatSetup({ onStart, onlinePlayers, haptics }: ThisOrThatSetupProps) {
  const navigate = useNavigate();
  const isOnline = (onlinePlayers?.length ?? 0) > 0;

  const [modeId, setModeId] = useState<string>('classic');
  const [rounds, setRounds] = useState<number>(15);
  const [players, setPlayers] = useState<{ id: string; name: string; color: string; avatar: string }[]>(() => {
    if (isOnline && onlinePlayers) {
      return onlinePlayers.map((p, i) => ({
        id: p.id, name: p.name,
        color: p.color ?? PLAYER_COLORS[i % PLAYER_COLORS.length],
        avatar: p.avatar ?? p.name.slice(0, 1).toUpperCase(),
      }));
    }
    return [
      { id: 'p-1', name: 'Du',        color: PLAYER_COLORS[0], avatar: 'D' },
      { id: 'p-2', name: 'Spieler 2', color: PLAYER_COLORS[1], avatar: '2' },
    ];
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const MIN = 2, MAX = 20;
  const addPlayer = () => {
    if (players.length >= MAX) return;
    const idx = players.length;
    const id = `p-${Date.now()}-${idx}`;
    void haptics.select();
    setPlayers((prev) => [...prev, {
      id,
      name: `Spieler ${idx + 1}`,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      avatar: String(idx + 1),
    }]);
    setEditingId(id);
  };
  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.length > MIN ? prev.filter((p) => p.id !== id) : prev);
  };
  const renamePlayer = (id: string, name: string) => {
    setPlayers((prev) => prev.map((p) =>
      p.id === id ? { ...p, name, avatar: name.slice(0, 1).toUpperCase() || '?' } : p,
    ));
  };

  const canStart = players.length >= MIN && players.every((p) => p.name.trim().length > 0);
  const handleStart = () => {
    if (!canStart) return;
    void haptics.celebrate();
    onStart(
      players,
      modeId === 'chaos' ? 'speed' : modeId, // chaos routes to speed with tighter rounds
      { timer: modeId === 'chaos' ? 3 : 5, rounds },
    );
  };

  // Bento grid layout map: col/row spans per card size. `large` takes
  // 4 columns of the 6-col grid with double height, others fill in.
  const bentoClasses: Record<ModeCard['size'], string> = {
    large:  'col-span-4 h-44 sm:h-48',
    medium: 'col-span-3 h-36 sm:h-40',
    small:  'col-span-2 h-44 sm:h-48',
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e14] text-[#f1f3fc] pb-40">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#df8eff]/10 rounded-full blur-[100px]" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#ff6b98]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-32 -right-20 w-64 h-64 bg-[#ff6b98]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#df8eff]/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 pt-10 px-6 max-w-2xl mx-auto">
        {/* Back + hero */}
        <button
          onClick={() => navigate('/games')}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#a8abb3] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück
        </button>

        <section className="relative mb-10">
          <p className="text-[#8ff5ff] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">Social Challenge</p>
          <h2 className="text-5xl font-black tracking-tighter leading-[0.95] mb-3">
            This <span className="text-[#df8eff] italic drop-shadow-[0_0_10px_rgba(223,142,255,0.5)]">oder</span> That
          </h2>
          <p className="text-[#a8abb3] text-sm max-w-[300px]">
            Wähl deinen Modus und startet den Präferenz-Battle.
          </p>
        </section>

        {/* Mode bento grid */}
        <section className="mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3] mb-4 flex items-center gap-2">
            Modus wählen
            <span className="w-1.5 h-1.5 bg-[#ff6b98] rounded-full animate-pulse" />
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {MODE_CARDS.map((m) => {
              const active = modeId === m.id;
              const tone = TONE_STYLE[m.tone];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { void haptics.select(); setModeId(m.id); }}
                  className={cn(
                    'relative rounded-2xl overflow-hidden group text-left transition-all active:scale-[0.98]',
                    bentoClasses[m.size],
                    active
                      ? cn('border-2', tone.border, tone.glow)
                      : 'border border-[#44484f]/20 hover:border-[#44484f]/60',
                  )}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(32,38,47,0.8), rgba(15,20,26,0.95))'
                      : 'rgba(15,20,26,0.7)',
                  }}
                >
                  {/* Oversized bg icon */}
                  <div className={cn(
                    'absolute -right-2 -bottom-2 opacity-10 transition-opacity pointer-events-none',
                    active ? 'opacity-25' : 'group-hover:opacity-20',
                    tone.icon,
                  )}>
                    <span className="block scale-[5] origin-bottom-right">
                      {m.icon}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      {m.tag && (
                        <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md', tone.chip)}>
                          {m.tag}
                        </span>
                      )}
                      {active && (
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center', tone.chip)}>
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={cn('mb-1.5', tone.icon)}>{m.icon}</div>
                      <h4 className={cn('text-lg font-extrabold leading-none mb-1', active ? tone.text : 'text-white')}>
                        {m.label}
                      </h4>
                      {m.size !== 'small' && (
                        <p className="text-[10px] text-[#a8abb3] leading-snug line-clamp-2">{m.desc}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Player strip */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-[#a8abb3] inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8ff5ff]" />
              Spieler · {players.length}/{MAX}
            </h3>
            {!isOnline && players.length < MAX && (
              <button
                type="button"
                onClick={addPlayer}
                className="text-xs font-bold text-[#df8eff] hover:opacity-80 transition-opacity"
              >
                + Hinzufügen
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-6 px-6 snap-x">
            {players.map((p, i) => {
              const isEditing = editingId === p.id;
              const isFirst = i === 0;
              return (
                <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-2 snap-start w-16">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full p-0.5 shadow-lg"
                      style={{
                        background: isFirst
                          ? 'linear-gradient(135deg, #df8eff, #ff6b98)'
                          : `linear-gradient(135deg, ${p.color}, #20262f)`,
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full border-2 border-[#0a0e14] flex items-center justify-center text-base font-black text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.avatar}
                      </div>
                    </div>
                    {!isOnline && !isFirst && players.length > MIN && (
                      <button
                        type="button"
                        onClick={() => { void haptics.light(); removePlayer(p.id); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#20262f] border border-[#44484f] flex items-center justify-center hover:bg-[#ff6e84]/20"
                        aria-label={`${p.name} entfernen`}
                      >
                        <CloseIcon className="w-2.5 h-2.5 text-[#a8abb3]" />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={p.name}
                      maxLength={12}
                      onChange={(e) => renamePlayer(p.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="w-16 text-center text-[10px] font-bold bg-transparent border-b border-[#df8eff] text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => !isOnline && setEditingId(p.id)}
                      disabled={isOnline}
                      className="text-[10px] font-bold truncate max-w-full hover:text-[#df8eff] transition-colors"
                    >
                      {p.name}
                    </button>
                  )}
                </div>
              );
            })}
            {!isOnline && players.length < MAX && (
              <button
                type="button"
                onClick={addPlayer}
                className="flex-shrink-0 flex flex-col items-center gap-2 snap-start w-16 group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#44484f] flex items-center justify-center text-[#72757d] group-hover:border-[#df8eff] group-hover:text-[#df8eff] transition-colors active:scale-95">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-[#a8abb3]">Gast</span>
              </button>
            )}
          </div>
        </section>

        {/* Rounds slider */}
        <section className="rounded-2xl bg-[#0f141a] border-l-4 border-[#df8eff] p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#a8abb3] font-medium text-sm">Rundenanzahl</span>
            <span className="text-[#8ff5ff] font-black text-lg tabular-nums">{rounds}</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#df8eff]"
            style={{
              background: `linear-gradient(to right, #df8eff 0%, #ff6b98 ${((rounds - 5) / 25) * 100}%, #20262f ${((rounds - 5) / 25) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-bold text-[#44484f] mt-2">
            <span>5</span>
            <span>15</span>
            <span>30</span>
          </div>
        </section>
      </main>

      {/* Floating start CTA */}
      <div className="fixed bottom-6 inset-x-0 px-6 flex justify-center z-40 pointer-events-none">
        <motion.button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          whileTap={canStart ? { scale: 0.97 } : {}}
          className={cn(
            'w-full max-w-md h-16 rounded-full font-black tracking-tight text-base flex items-center justify-center gap-3 pointer-events-auto transition-all',
            canStart
              ? 'text-[#0a0e14] shadow-[0_20px_40px_rgba(223,142,255,0.35)]'
              : 'bg-[#20262f] text-[#44484f] cursor-not-allowed',
          )}
          style={canStart ? { background: 'linear-gradient(135deg, #df8eff, #d779ff)' } : {}}
        >
          {canStart ? (
            <>
              Start Game
              <Zap className="w-5 h-5" />
            </>
          ) : (
            'Mindestens 2 Spieler'
          )}
        </motion.button>
      </div>
    </div>
  );
}
