import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, RotateCcw, ArrowRight, Check, X, Shield, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FACTS, THREE_STATEMENTS, type Fact, type ThreeStatements } from './fakeorfact-content-de';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useTVGameBridge } from "@/hooks/useTVGameBridge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'statement' | 'voted' | 'reveal' | 'gameOver';
type Mode = 'classic' | 'three';

interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  streak: number;
}

const PLAYER_COLORS = [
  '#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6',
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
// Setup config
// ---------------------------------------------------------------------------

const GAME_MODES: GameMode[] = [
  { id: 'classic', name: 'Klassisch', desc: 'Wahr oder Falsch', icon: <Shield className="w-6 h-6" /> },
  { id: 'three', name: 'Zwei Luegen', desc: 'Finde die Wahrheit', icon: <HelpCircle className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 5, max: 30, default: 15, step: 5, label: 'Abstimmzeit (Sek.)' },
  rounds: { min: 5, max: 25, default: 10, step: 1, label: 'Runden' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FakeOrFactGame({ online }: { online?: OnlineGameProps } = {}) {
  const navigate = useNavigate();

  // Setup
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<Mode>('classic');
  const [totalRounds, setTotalRounds] = useState(10);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const gameRecordedRef = useRef(false);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // Classic mode
  const [factDeck, setFactDeck] = useState<Fact[]>([]);
  const [factIdx, setFactIdx] = useState(0);
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [playerVote, setPlayerVote] = useState<boolean | null>(null);

  // Three-statement mode
  const [threeDeck, setThreeDeck] = useState<ThreeStatements[]>([]);
  const [threeIdx, setThreeIdx] = useState(0);
  const [currentThree, setCurrentThree] = useState<ThreeStatements | null>(null);
  const [playerThreeVote, setPlayerThreeVote] = useState<number | null>(null);

  // Vote tracking for percentage bar
  const [votes, setVotes] = useState<{ playerId: string; correct: boolean }[]>([]);

  // ---------------------------------------------------------------------------
  // Setup handler
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    (
      setupPlayers: { id: string; name: string; color: string; avatar: string }[],
      selectedMode: string,
      settings: { timer: number; rounds: number },
    ) => {
      const mapped: Player[] = setupPlayers.map((p, i) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        score: 0,
        streak: 0,
      }));
      setPlayers(mapped);
      setMode(selectedMode as Mode);
      setTotalRounds(settings.rounds);
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      setVotes([]);

      if (selectedMode === 'three') {
        const shuffled = shuffle(THREE_STATEMENTS);
        setThreeDeck(shuffled);
        setThreeIdx(0);
        setCurrentThree(shuffled[0]);
        setPlayerThreeVote(null);
      } else {
        const shuffled = shuffle(FACTS);
        setFactDeck(shuffled);
        setFactIdx(0);
        setCurrentFact(shuffled[0]);
        setPlayerVote(null);
      }
      setPhase('statement');
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  useTVGameBridge('fakeorfact', { phase, currentRound, currentPlayerIdx, players }, [phase, currentRound, currentPlayerIdx]);

  const currentPlayer = players[currentPlayerIdx] ?? null;

  function scoreAndAdvance(correct: boolean) {
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIdx
        ? { ...p, score: p.score + (correct ? 100 : 0), streak: correct ? p.streak + 1 : 0 }
        : p,
    ));
    setVotes(prev => [...prev, { playerId: currentPlayer?.id ?? '', correct }]);
    const nextPlayerIdx = currentPlayerIdx + 1;
    if (nextPlayerIdx >= players.length) {
      setPhase('reveal');
    } else {
      setCurrentPlayerIdx(nextPlayerIdx);
      setPlayerVote(null);
      setPlayerThreeVote(null);
      setPhase('statement');
    }
  }

  function handleClassicVote(isTrue: boolean) {
    setPlayerVote(isTrue);
    scoreAndAdvance(currentFact ? isTrue === currentFact.isTrue : false);
  }

  function handleThreeVote(idx: number) {
    setPlayerThreeVote(idx);
    scoreAndAdvance(currentThree ? idx === currentThree.trueIndex : false);
  }

  function advanceRound() {
    if (currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }
    setCurrentRound(r => r + 1);
    setCurrentPlayerIdx(0);
    setPlayerVote(null);
    setPlayerThreeVote(null);
    setVotes([]);

    if (mode === 'three') {
      const next = threeIdx + 1;
      setThreeIdx(next);
      setCurrentThree(threeDeck[next % threeDeck.length]);
    } else {
      const next = factIdx + 1;
      setFactIdx(next);
      setCurrentFact(factDeck[next % factDeck.length]);
    }
    setPhase('statement');
  }

  useEffect(() => {
    if (phase === 'gameOver' && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      recordEnd('fake-or-fact', winner?.score ?? 0, true);
    }
    if (phase === 'setup') gameRecordedRef.current = false;
  }, [phase]);

  function resetGame() {
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
  }

  // Percentage correct
  const correctPct = useMemo(() => {
    if (votes.length === 0) return 0;
    return Math.round((votes.filter(v => v.correct).length / votes.length) * 100);
  }, [votes]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  /* ---- Online: host broadcasts game state (statement sync) ---- */
  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('game-state', {
      phase, currentRound, totalRounds, currentPlayerIdx,
      currentFact: currentFact ? { statement: currentFact.statement, isTrue: currentFact.isTrue } : null,
      currentThree: currentThree ? { statements: currentThree.statements, trueIndex: currentThree.trueIndex } : null,
      players: players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  }, [phase, currentRound, currentPlayerIdx, currentFact, currentThree, players, online]);

  /* ---- Online: non-host syncs state ---- */
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('game-state', (data) => {
      if (data.phase) setPhase(data.phase as Phase);
      if (data.currentRound) setCurrentRound(data.currentRound as number);
      if (data.currentPlayerIdx !== undefined) setCurrentPlayerIdx(data.currentPlayerIdx as number);
      if (data.currentFact) setCurrentFact(data.currentFact as Fact);
      if (data.currentThree) setCurrentThree(data.currentThree as ThreeStatements);
      if (data.players) {
        const incoming = data.players as { id: string; name: string; score: number }[];
        setPlayers(prev => prev.map((p, i) => ({
          ...p, score: incoming[i]?.score ?? p.score,
        })));
      }
    });
  }, [online]);

  // =========================================================================
  // RENDER
  // =========================================================================

  if (phase === 'setup') {
    return (
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Luegner — Fake or Fact"
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0e14] text-white flex flex-col">
      <style>{`
.neon-glow { text-shadow: 0 0 20px rgba(223,142,255,0.6), 0 0 40px rgba(223,142,255,0.4); }
.glass-card { background: rgba(32,38,47,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#df8eff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-[#8ff5ff]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* ---- STATEMENT (Classic) ---- */}
      {phase === 'statement' && mode === 'classic' && currentFact && (
        <motion.div
          key={`classic-${currentRound}-${currentPlayerIdx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: currentPlayer?.color }}
              >
                {currentPlayer?.avatar}
              </div>
              <span className="text-sm text-white/60">{currentPlayer?.name}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs text-white/40">
              Runde {currentRound}/{totalRounds}
            </span>
          </div>

          {/* Statement card */}
          <div className="flex-1 flex items-center justify-center px-4">
            <motion.div
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm rounded-[1rem] glass-card border border-[#44484f]/20 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#df8eff] via-[#8ff5ff] to-[#ff6b98]" />
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#1b2028] text-[10px] font-bold text-[#df8eff] mb-4">
                {currentFact.category}
              </span>
              <p className="text-xl font-bold font-[Plus_Jakarta_Sans] text-white leading-relaxed">
                {currentFact.statement}
              </p>
            </motion.div>
          </div>

          {/* Vote buttons */}
          <div className="flex items-center gap-3 px-4 pb-6 pt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClassicVote(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Check className="w-5 h-5" /> WAHR
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClassicVote(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <X className="w-5 h-5" /> FALSCH
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ---- STATEMENT (Three) ---- */}
      {phase === 'statement' && mode === 'three' && currentThree && (
        <motion.div
          key={`three-${currentRound}-${currentPlayerIdx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: currentPlayer?.color }}
              >
                {currentPlayer?.avatar}
              </div>
              <span className="text-sm text-white/60">{currentPlayer?.name}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#1b2028] border border-[#44484f]/20 text-xs text-white/40">
              Runde {currentRound}/{totalRounds}
            </span>
          </div>

          <div className="text-center px-4 mb-2">
            <span className="text-xs font-bold text-[#ff6b98] uppercase tracking-widest">
              Welche Aussage ist WAHR?
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
            {currentThree.statements.map((stmt, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleThreeVote(idx)}
                className="w-full max-w-sm rounded-[1rem] glass-card border border-[#44484f]/20 p-5 text-left hover:border-[#df8eff]/30 transition-colors relative overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#1b2028] border border-[#44484f]/20 flex items-center justify-center text-xs font-bold text-[#df8eff] shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{stmt}</p>
                </div>
              </motion.button>
            ))}
          </div>
          <div className="h-6" />
        </motion.div>
      )}

      {/* ---- REVEAL ---- */}
      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
        >
          {mode === 'classic' && currentFact && (() => {
            const wasCorrect = playerVote === currentFact.isTrue;
            return (
              <>
                {/* Player result — clear feedback */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                  className={cn('w-20 h-20 rounded-full flex items-center justify-center', wasCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
                  {wasCorrect ? <Check className="w-10 h-10 text-emerald-400" /> : <X className="w-10 h-10 text-red-400" />}
                </motion.div>
                <h2 className={cn('text-3xl font-extrabold', wasCorrect ? 'text-emerald-400' : 'text-red-400')}>
                  {wasCorrect ? 'Richtig!' : 'Leider falsch!'}
                </h2>

                {/* What you said vs what it is */}
                <div className="w-full flex gap-3">
                  <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#a8abb3] mb-1">Deine Antwort</p>
                    <p className={cn('text-lg font-bold', playerVote ? 'text-emerald-400' : 'text-red-400')}>
                      {playerVote ? 'WAHR' : 'FALSCH'}
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl bg-[#1b2028] border border-[#44484f]/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#a8abb3] mb-1">Tatsaechlich</p>
                    <p className={cn('text-lg font-bold', currentFact.isTrue ? 'text-emerald-400' : 'text-red-400')}>
                      {currentFact.isTrue ? 'WAHR' : 'FALSCH'}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="w-full rounded-[1rem] bg-[#1b2028] border border-[#44484f]/20 p-5">
                  <p className="text-sm text-white/70 leading-relaxed">{currentFact.explanation}</p>
                </div>
              </>
            );
          })()}

          {mode === 'three' && currentThree && (
            <>
              <h2 className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] text-[#8ff5ff]">
                Die Wahrheit ist...
              </h2>
              <div className="w-full space-y-2">
                {currentThree.statements.map((stmt, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'w-full rounded-[1rem] border p-4 flex items-start gap-3',
                      idx === currentThree.trueIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-[#1b2028] border-[#44484f]/20 opacity-60',
                    )}
                  >
                    {idx === currentThree.trueIndex
                      ? <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      : <X className="w-5 h-5 text-red-400/50 shrink-0 mt-0.5" />
                    }
                    <p className="text-sm text-white/80 leading-relaxed">{stmt}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Vote results bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Richtig: {correctPct}%</span>
              <span>Falsch: {100 - correctPct}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#1b2028] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#8ff5ff] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${correctPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={advanceRound}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(223,142,255,0.3)]"
          >
            Weiter <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'gameOver' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] text-[#df8eff] neon-glow">
            Spielende!
          </h2>

          <div className="w-full space-y-2">
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-[1rem] border',
                  i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#1b2028] border-[#44484f]/20',
                )}
              >
                <span className="text-sm font-bold text-white/40 w-6 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.color }}>
                  {p.avatar}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">{p.name}</span>
                <span className="text-sm font-bold text-white/70">{p.score}</span>
              </motion.div>
            ))}
          </div>

          <div className="w-full space-y-3 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#df8eff] to-[#d779ff] text-[#0a0e14] py-4 rounded-full font-extrabold text-base shadow-[0_0_20px_rgba(223,142,255,0.3)]"
            >
              <RotateCcw className="w-4 h-4" /> Nochmal
            </motion.button>
            <button
              onClick={() => navigate('/games')}
              className="w-full py-3.5 rounded-full border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/[0.04] transition-colors"
            >
              Anderes Spiel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
