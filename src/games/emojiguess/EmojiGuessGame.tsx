import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, RotateCcw, Timer, ArrowLeft, ArrowRight,
  Zap, Clock, Crown, Lightbulb, Eye, Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameTimer } from '@/games/engine/TimerSystem';
import { EMOJI_PUZZLES, type EmojiPuzzle } from './emoji-content-de';
import { GameSetup, type GameMode, type SettingsConfig } from '../ui/GameSetup';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'setup' | 'playing' | 'reveal' | 'roundEnd' | 'gameOver';

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
  { id: 'classic', name: 'Klassisch', desc: '30 Sek. pro Runde', icon: <Clock className="w-6 h-6" /> },
  { id: 'speed', name: 'Speed', desc: '10 Sek. pro Runde', icon: <Zap className="w-6 h-6" /> },
  { id: 'team', name: 'Team', desc: 'Teams wechseln sich ab', icon: <Crown className="w-6 h-6" /> },
];

const SETUP_SETTINGS: SettingsConfig = {
  timer: { min: 5, max: 60, default: 30, step: 5, label: 'Timer' },
  rounds: { min: 5, max: 30, default: 10, step: 1, label: 'Runden' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmojiGuessGame() {
  const navigate = useNavigate();

  // Setup state
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState('classic');
  const [timerDuration, setTimerDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(10);

  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<EmojiPuzzle | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [pointsAvailable, setPointsAvailable] = useState(100);
  const deck = useRef<EmojiPuzzle[]>([]);
  const deckPos = useRef(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  const handleTimerExpire = useCallback(() => {
    setPhase('reveal');
  }, []);
  const timer = useGameTimer(timerDuration, handleTimerExpire);

  // Derived
  const currentPlayer = players[currentPlayerIdx] ?? null;

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
      setMode(selectedMode);
      setTimerDuration(selectedMode === 'speed' ? 10 : settings.timer);
      setTotalRounds(settings.rounds);
      deck.current = shuffle(EMOJI_PUZZLES);
      deckPos.current = 0;
      setCurrentRound(1);
      setCurrentPlayerIdx(0);
      startRound(selectedMode === 'speed' ? 10 : settings.timer);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---------------------------------------------------------------------------
  // Game logic
  // ---------------------------------------------------------------------------

  function drawPuzzle(): EmojiPuzzle {
    if (deckPos.current >= deck.current.length) {
      deck.current = shuffle(EMOJI_PUZZLES);
      deckPos.current = 0;
    }
    return deck.current[deckPos.current++];
  }

  function startRound(dur?: number) {
    const puzzle = drawPuzzle();
    setCurrentPuzzle(puzzle);
    setShowHint(false);
    setPointsAvailable(100);
    timer.reset(dur ?? timerDuration);
    timer.start();
    setPhase('playing');

    // Hint after 15 seconds
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowHint(true), 15000);

    // Decrease available points over time
    if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    const effectiveDur = dur ?? timerDuration;
    const interval = (effectiveDur * 1000) / 100;
    let pts = 100;
    pointsIntervalRef.current = setInterval(() => {
      pts = Math.max(10, pts - 1);
      setPointsAvailable(pts);
    }, interval);
  }

  function stopTimers() {
    if (hintTimerRef.current) { clearTimeout(hintTimerRef.current); hintTimerRef.current = null; }
    if (pointsIntervalRef.current) { clearInterval(pointsIntervalRef.current); pointsIntervalRef.current = null; }
    timer.pause();
  }

  function handleCorrectGuess() {
    stopTimers();
    const pts = pointsAvailable;
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIdx ? { ...p, score: p.score + pts, streak: p.streak + 1 } : p
    ));
    setPhase('reveal');
  }

  function handleSkip() {
    stopTimers();
    setPlayers(prev => prev.map((p, i) =>
      i === currentPlayerIdx ? { ...p, streak: 0 } : p
    ));
    setPhase('reveal');
  }

  function advanceRound() {
    const nextPlayer = (currentPlayerIdx + 1) % players.length;
    const isNewRound = nextPlayer === 0;

    if (isNewRound && currentRound >= totalRounds) {
      setPhase('gameOver');
      return;
    }

    setCurrentPlayerIdx(nextPlayer);
    if (isNewRound) setCurrentRound(r => r + 1);
    startRound();
  }

  function resetGame() {
    stopTimers();
    setPhase('setup');
    setPlayers([]);
    setCurrentRound(1);
    setCurrentPlayerIdx(0);
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (pointsIntervalRef.current) clearInterval(pointsIntervalRef.current);
    };
  }, []);

  // Sorted players for results
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  if (phase === 'setup') {
    return (
      <GameSetup
        modes={GAME_MODES}
        settings={SETUP_SETTINGS}
        onStart={handleStart}
        title="Emoji-Raten"
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0d0d15] text-white flex flex-col">
      {/* ---- PLAYING ---- */}
      {phase === 'playing' && currentPuzzle && (
        <div className="flex-1 flex flex-col">
          {/* Timer bar */}
          <div className="h-1 bg-white/[0.04]">
            <motion.div
              className={cn('h-full', timer.percentLeft > 25
                ? 'bg-gradient-to-r from-[#cf96ff] to-[#00e3fd]'
                : 'bg-red-500')}
              initial={{ width: '100%' }}
              animate={{ width: `${timer.percentLeft}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

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
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">Runde {currentRound}/{totalRounds}</span>
              <div className={cn(
                'px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] text-lg font-mono font-bold',
                timer.timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white/80',
              )}>
                {timer.timeLeft}s
              </div>
            </div>
          </div>

          {/* Category badge */}
          <div className="flex justify-center mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] text-xs font-semibold text-[#cf96ff]">
              {currentPuzzle.category} {'⭐'.repeat(currentPuzzle.difficulty)}
            </span>
          </div>

          {/* Emoji display */}
          <div className="flex-1 flex items-center justify-center px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-[1rem] bg-[#13131b]/80 backdrop-blur-xl border border-white/[0.06] p-8 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#cf96ff] via-[#00e3fd] to-[#ff7350]" />
              <motion.div
                className="text-7xl leading-tight mb-6 pt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentPuzzle.emojis}
              </motion.div>

              {/* Points available */}
              <div className="text-sm text-white/40 mb-3">
                <span className="text-[#00e3fd] font-bold">{pointsAvailable}</span> Punkte moeglich
              </div>

              {/* Hint */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 text-sm text-[#ff7350]"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Beginnt mit: <strong>{currentPuzzle.answer.charAt(0)}</strong></span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-4 pb-6 pt-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCorrectGuess}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full py-4 font-bold text-base text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Eye className="w-5 h-5" /> Erraten!
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="flex-none flex items-center justify-center bg-[#1f1f29] border border-white/[0.06] rounded-full py-4 px-5 text-white/40"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* ---- REVEAL ---- */}
      {phase === 'reveal' && currentPuzzle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8 max-w-lg mx-auto w-full"
        >
          <div className="text-6xl mb-2">{currentPuzzle.emojis}</div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="text-2xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-[#cf96ff] to-[#00e3fd] bg-clip-text text-transparent text-center"
          >
            {currentPuzzle.answer}
          </motion.div>
          <span className="px-3 py-1 rounded-full bg-[#1f1f29] border border-white/[0.06] text-xs text-white/40">
            {currentPuzzle.category}
          </span>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={advanceRound}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] px-8 py-4 rounded-full font-extrabold text-base shadow-[0_0_25px_rgba(207,150,255,0.25)]"
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-[Plus_Jakarta_Sans] bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Spielende!
          </h2>

          {sortedPlayers[0] && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#1f1f29] border border-amber-500/20">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: sortedPlayers[0].color }}
              >
                {sortedPlayers[0].avatar}
              </div>
              <div>
                <div className="font-bold text-white">{sortedPlayers[0].name}</div>
                <div className="text-amber-400 text-sm font-semibold">{sortedPlayers[0].score} Punkte</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="w-full space-y-2">
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-[1rem] border',
                  i === 0
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-[#1f1f29] border-white/[0.06]',
                )}
              >
                <span className="text-sm font-bold text-white/40 w-6 text-center">{i + 1}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <span className="flex-1 text-white font-medium text-sm truncate">{p.name}</span>
                <span className="text-sm font-bold text-white/70">{p.score}</span>
              </motion.div>
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3 mt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#cf96ff] to-[#a855f7] text-[#0d0d15] py-4 rounded-full font-extrabold text-base shadow-[0_0_25px_rgba(207,150,255,0.25)]"
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
