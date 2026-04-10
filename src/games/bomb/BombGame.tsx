import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateCategoryPrompt } from '../content/categories';
import { getRandomQuestion, resetQuestions, type QuizQuestion } from '../content/questions';
import BombSetupScreen from './BombSetupScreen';
import BombPlayingScreen from './BombPlayingScreen';
import BombExplosionScreen from './BombExplosionScreen';
import BombResultsScreen, { BombRoundEndScreen } from './BombResultsScreen';
import BombTutorial from './BombTutorial';
import { ActivePlayerBanner } from '@/games/ui/ActivePlayerBanner';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { useGameEnd } from '../social/useGameEnd';
import { GameEndOverlay } from '../social/GameEndOverlay';

// ---------------------------------------------------------------------------
// Types (exported for sub-components)
// ---------------------------------------------------------------------------

export type GamePhase = 'setup' | 'playing' | 'explosion' | 'roundEnd' | 'gameOver';
export type GameMode = 'kategorie' | 'quiz' | 'speed' | 'alle';

export interface PlayerState {
  name: string;
  penalties: number;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  players: PlayerState[];
  currentPlayerIndex: number;
  round: number;
  totalRounds: number;
  timerMin: number;
  timerMax: number;
  currentTask: string;
  currentQuiz: QuizQuestion | null;
  explodedPlayerIndex: number;
  speedTimerBase: number;
  randomTimer: boolean;
  sameCategory: boolean;
}

// ---------------------------------------------------------------------------
// Hook: useBombTimer
// ---------------------------------------------------------------------------

function useBombTimer(
  active: boolean,
  minMs: number,
  maxMs: number,
  onExplode: () => void,
) {
  const [progress, setProgress] = useState(0);
  const durationRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);
  const explodedRef = useRef(false);
  const onExplodeRef = useRef(onExplode);
  onExplodeRef.current = onExplode;

  const start = useCallback(() => {
    durationRef.current = minMs + Math.random() * (maxMs - minMs);
    startRef.current = performance.now();
    explodedRef.current = false;
    setProgress(0);
  }, [minMs, maxMs]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    start();

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min(elapsed / durationRef.current, 1);
      setProgress(p);
      if (p >= 1 && !explodedRef.current) {
        explodedRef.current = true;
        onExplodeRef.current();
        return;
      }
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, start]);

  return { progress };
}

// ---------------------------------------------------------------------------
// Hook: useTickSound (Web Audio API oscillator)
// ---------------------------------------------------------------------------

function useTickSound(active: boolean, progress: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const playTick = () => {
      try {
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800 + progress * 600;
        gain.gain.value = 0.08 + progress * 0.12;
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch { /* audio not available */ }
    };

    const ms = Math.max(100, 600 - progress * 500);
    intervalRef.current = setInterval(playTick, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, Math.round(progress * 10)]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTask(mode: GameMode): { task: string; quiz: QuizQuestion | null } {
  // random mode removed — randomTimer is now a flag on GameState
  if (mode === 'quiz') {
    const q = getRandomQuestion();
    return { task: q.question, quiz: q };
  }
  if (mode === 'alle') {
    const { category, letter } = generateCategoryPrompt();
    return { task: `Nenne: ${category} mit "${letter}"`, quiz: null };
  }
  const { category, letter } = generateCategoryPrompt();
  return { task: `Nenne ein/eine ${category} mit "${letter}"!`, quiz: null };
}

const defaultState: GameState = {
  phase: 'setup',
  mode: 'kategorie',
  players: [{ name: '', penalties: 0 }, { name: '', penalties: 0 }],
  currentPlayerIndex: 0,
  round: 1,
  totalRounds: 5,
  timerMin: 15,
  timerMax: 45,
  currentTask: '',
  currentQuiz: null,
  explodedPlayerIndex: -1,
  speedTimerBase: 30,
  randomTimer: false,
  sameCategory: false,
};

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function BombGame({ online }: { online?: OnlineGameProps }) {
  const [state, setState] = useState<GameState>({ ...defaultState });
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const speedReductionRef = useRef(0);
  const { recordEnd, newAchievements, clearAchievements } = useGameEnd();
  const recordedRef = useRef(false);

  // --- Online sync: host broadcasts state, non-host receives ---
  const broadcastState = useCallback((newState: GameState, extra?: Record<string, unknown>) => {
    if (!online || !online.isHost) return;
    online.broadcast('bomb-state', {
      ...extra,
      state: JSON.parse(JSON.stringify(newState)),
    });
    online.broadcast('tv-state', {
      game: 'bomb',
      phase: newState.phase,
      players: newState.players,
      currentPlayerIndex: newState.currentPlayerIndex,
      currentTask: newState.currentTask,
      round: newState.round,
      totalRounds: newState.totalRounds,
      explodedPlayerIndex: newState.explodedPlayerIndex,
    });
  }, [online]);

  useEffect(() => {
    if (!online || online.isHost) return;
    const unsub = online.onBroadcast('bomb-state', (data) => {
      const incoming = data.state as unknown as GameState;
      if (incoming) {
        setState(incoming);
        if (incoming.phase === 'playing') {
          setTimerActive(true);
          setTimerKey((k) => k + 1);
        } else {
          setTimerActive(false);
        }
      }
    });
    return unsub;
  }, [online]);

  // Non-host: listen for player action requests (e.g., "weiter", quiz answer)
  useEffect(() => {
    if (!online || !online.isHost) return;
    const unsub = online.onBroadcast('bomb-action', (data) => {
      if (data.action === 'weiter') {
        // Host processes the advance
        const { task, quiz } = generateTask(state.mode);
        setState((prev) => {
          const next = {
            ...prev,
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            currentTask: task,
            currentQuiz: quiz,
          };
          broadcastState(next);
          return next;
        });
      } else if (data.action === 'alle-answer') {
        const knows = data.knows as boolean;
        setState((prev) => {
          const updated = [...prev.players];
          if (!knows) {
            updated[prev.currentPlayerIndex] = {
              ...updated[prev.currentPlayerIndex],
              penalties: updated[prev.currentPlayerIndex].penalties + 1,
            };
          }
          const next = {
            ...prev,
            players: updated,
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          };
          broadcastState(next);
          return next;
        });
      } else if (data.action === 'quiz-answer') {
        const idx = data.answerIndex as number;
        if (state.currentQuiz && idx !== state.currentQuiz.correctIndex) {
          const { task, quiz } = generateTask(state.mode);
          setState((prev) => {
            const next = { ...prev, currentTask: task, currentQuiz: quiz };
            broadcastState(next);
            return next;
          });
        } else {
          const { task, quiz } = generateTask(state.mode);
          setState((prev) => {
            const next = {
              ...prev,
              currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
              currentTask: task,
              currentQuiz: quiz,
            };
            broadcastState(next);
            return next;
          });
        }
      }
    });
    return unsub;
  }, [online, state.mode, state.currentQuiz, broadcastState]);

  const effectiveTimerMin = state.randomTimer
    ? 15000
    : state.mode === 'speed'
      ? Math.max(5, (state.timerMin * 1000) - speedReductionRef.current)
      : state.timerMin * 1000;
  const effectiveTimerMax = state.randomTimer
    ? 90000
    : state.mode === 'speed'
      ? Math.max(8, (state.timerMax * 1000) - speedReductionRef.current)
      : state.timerMax * 1000;

  const handleExplode = useCallback(() => {
    setTimerActive(false);
    setState((prev) => {
      const updated = [...prev.players];
      const penaltyAmount = prev.mode === 'alle' ? 2 : 1;
      updated[prev.currentPlayerIndex] = {
        ...updated[prev.currentPlayerIndex],
        penalties: updated[prev.currentPlayerIndex].penalties + penaltyAmount,
      };
      const next = {
        ...prev,
        phase: 'explosion' as GamePhase,
        players: updated,
        explodedPlayerIndex: prev.currentPlayerIndex,
      };
      // Broadcast from host after explosion
      if (online?.isHost) {
        setTimeout(() => {
          online.broadcast('bomb-state', { state: JSON.parse(JSON.stringify(next)) });
          online.broadcast('tv-state', {
            game: 'bomb', phase: 'explosion',
            players: next.players, currentPlayerIndex: next.currentPlayerIndex,
            explodedPlayerIndex: next.explodedPlayerIndex,
            round: next.round, totalRounds: next.totalRounds,
          });
        }, 0);
      }
      return next;
    });
  }, [online]);

  const { progress } = useBombTimer(timerActive, effectiveTimerMin, effectiveTimerMax, handleExplode);

  useTickSound(timerActive, progress);

  const update = (partial: Partial<GameState>) => setState((prev) => ({ ...prev, ...partial }));

  const startGame = () => {
    // Non-host cannot start game
    if (online && !online.isHost) return;
    resetQuestions();
    speedReductionRef.current = 0;
    const { task, quiz } = generateTask(state.mode);
    const newState: GameState = {
      ...state,
      phase: 'playing',
      currentPlayerIndex: 0,
      round: 1,
      currentTask: task,
      currentQuiz: quiz,
      players: state.players.map((p) => ({ ...p, penalties: 0 })),
    };
    setState(newState);
    broadcastState(newState);

    // Show tutorial for 'alle' mode once per session
    if (state.mode === 'alle' && !sessionStorage.getItem('bomb-alle-tutorial-seen')) {
      setShowTutorial(true);
      // Don't start timer yet — it begins after tutorial dismissal
      return;
    }
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  const advancePlayer = () => {
    // If sameCategory is on AND mode is kategorie/alle, keep same task for the round
    const keepTask = state.sameCategory && (state.mode === 'kategorie' || state.mode === 'alle');
    const { task, quiz } = keepTask ? { task: state.currentTask, quiz: state.currentQuiz } : generateTask(state.mode);
    setState((prev) => {
      const next = {
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        currentTask: task,
        currentQuiz: quiz,
      };
      broadcastState(next);
      return next;
    });
  };

  const handleWeiter = () => {
    if (online && !online.isHost) {
      // Non-host sends action to host
      online.broadcast('bomb-action', { action: 'weiter' });
      return;
    }
    advancePlayer();
  };

  const handleQuizAnswer = (idx: number) => {
    if (online && !online.isHost) {
      online.broadcast('bomb-action', { action: 'quiz-answer', answerIndex: idx });
      return;
    }
    if (state.currentQuiz && idx !== state.currentQuiz.correctIndex) {
      // Wrong answer: vibrate + generate new question, but KEEP same player
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      const { task, quiz } = generateTask(state.mode);
      const newState = { ...state, currentTask: task, currentQuiz: quiz };
      setState(newState);
      broadcastState(newState);
      return;
    }
    // Correct answer: advance to next player
    advancePlayer();
  };

  const handleAlleAnswer = (knows: boolean) => {
    if (online && !online.isHost) {
      online.broadcast('bomb-action', { action: 'alle-answer', knows });
      return;
    }
    if (!knows) {
      // Add +1 penalty to current player for not knowing
      setState((prev) => {
        const updated = [...prev.players];
        updated[prev.currentPlayerIndex] = {
          ...updated[prev.currentPlayerIndex],
          penalties: updated[prev.currentPlayerIndex].penalties + 1,
        };
        return { ...prev, players: updated };
      });
    }
    // Advance to next player — keep the same task/category for this round
    setState((prev) => ({
      ...prev,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
    }));
  };

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    sessionStorage.setItem('bomb-alle-tutorial-seen', 'true');
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  useEffect(() => {
    if (state.phase === 'gameOver' && !recordedRef.current) {
      recordedRef.current = true;
      const winner = [...state.players].sort((a, b) => a.penalties - b.penalties)[0];
      const bestScore = state.totalRounds - (winner?.penalties ?? 0);
      recordEnd('bomb', Math.max(0, bestScore), true);
    }
    if (state.phase === 'setup') recordedRef.current = false;
  }, [state.phase]);

  const handleExplosionNext = () => {
    if (online && !online.isHost) return;
    if (state.round >= state.totalRounds) {
      const next = { ...state, phase: 'gameOver' as GamePhase };
      setState(next);
      broadcastState(next);
    } else {
      const next = { ...state, phase: 'roundEnd' as GamePhase };
      setState(next);
      broadcastState(next);
    }
  };

  const handleNextRound = () => {
    if (online && !online.isHost) return;
    if (state.mode === 'speed') {
      speedReductionRef.current += 3000;
    }
    const { task, quiz } = generateTask(state.mode);
    const next: GameState = {
      ...state,
      phase: 'playing',
      round: state.round + 1,
      currentPlayerIndex: 0,
      currentTask: task,
      currentQuiz: quiz,
    };
    setState(next);
    setTimerKey((k) => k + 1);
    setTimerActive(true);
    broadcastState(next);
  };

  const handleRestart = () => {
    speedReductionRef.current = 0;
    resetQuestions();
    setState((prev) => ({
      ...defaultState,
      players: prev.players.map((p) => ({ name: p.name, penalties: 0 })),
      mode: prev.mode,
      timerMin: prev.timerMin,
      timerMax: prev.timerMax,
      totalRounds: prev.totalRounds,
    }));
    setTimerActive(false);
  };

  const handleExit = () => {
    setTimerActive(false);
    setState({ ...defaultState });
  };

  return (
    <AnimatePresence mode="wait">
      {state.phase === 'setup' && (
        <motion.div key="setup" exit={{ opacity: 0 }}>
          <BombSetupScreen state={state} onUpdate={update} onStart={startGame} />
        </motion.div>
      )}
      {showTutorial && (
        <BombTutorial onDismiss={handleTutorialDismiss} />
      )}
      {state.phase === 'playing' && !showTutorial && (
        <motion.div key={`playing-${timerKey}`} exit={{ opacity: 0 }}>
          <ActivePlayerBanner
            playerName={state.players[state.currentPlayerIndex]?.name ?? '???'}
            hidden={false}
          />
          <BombPlayingScreen
            state={state}
            progress={progress}
            onWeiter={handleWeiter}
            onQuizAnswer={handleQuizAnswer}
            onAlleAnswer={handleAlleAnswer}
          />
        </motion.div>
      )}
      {state.phase === 'explosion' && (
        <motion.div key="explosion" exit={{ opacity: 0 }}>
          <BombExplosionScreen
            playerName={state.players[state.explodedPlayerIndex]?.name ?? '???'}
            onNext={handleExplosionNext}
          />
        </motion.div>
      )}
      {state.phase === 'roundEnd' && (
        <motion.div key="roundEnd" exit={{ opacity: 0 }}>
          <BombRoundEndScreen state={state} onNext={handleNextRound} />
        </motion.div>
      )}
      {state.phase === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameEndOverlay achievements={newAchievements} onDismiss={clearAchievements} />
          <BombResultsScreen state={state} onRestart={handleRestart} onExit={handleExit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
