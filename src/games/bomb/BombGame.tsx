import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateCategoryPrompt } from '../content/categories-de';
import { getRandomQuestion, resetQuestions, type QuizQuestion } from '../content/questions-de';
import BombSetupScreen from './BombSetupScreen';
import BombPlayingScreen from './BombPlayingScreen';
import BombExplosionScreen from './BombExplosionScreen';
import BombResultsScreen, { BombRoundEndScreen } from './BombResultsScreen';

// ---------------------------------------------------------------------------
// Types (exported for sub-components)
// ---------------------------------------------------------------------------

export type GamePhase = 'setup' | 'playing' | 'explosion' | 'roundEnd' | 'gameOver';
export type GameMode = 'kategorie' | 'quiz' | 'speed' | 'random';

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
  if (mode === 'random') {
    return { task: 'Gib die Bombe schnell weiter, bevor sie explodiert!', quiz: null };
  }
  if (mode === 'quiz') {
    const q = getRandomQuestion();
    return { task: q.question, quiz: q };
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
};

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function BombGame() {
  const [state, setState] = useState<GameState>({ ...defaultState });
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const speedReductionRef = useRef(0);

  const effectiveTimerMin = state.mode === 'random'
    ? 15000
    : state.mode === 'speed'
      ? Math.max(5, (state.timerMin * 1000) - speedReductionRef.current)
      : state.timerMin * 1000;
  const effectiveTimerMax = state.mode === 'random'
    ? 90000
    : state.mode === 'speed'
      ? Math.max(8, (state.timerMax * 1000) - speedReductionRef.current)
      : state.timerMax * 1000;

  const handleExplode = useCallback(() => {
    setTimerActive(false);
    setState((prev) => {
      const updated = [...prev.players];
      updated[prev.currentPlayerIndex] = {
        ...updated[prev.currentPlayerIndex],
        penalties: updated[prev.currentPlayerIndex].penalties + 1,
      };
      return {
        ...prev,
        phase: 'explosion',
        players: updated,
        explodedPlayerIndex: prev.currentPlayerIndex,
      };
    });
  }, []);

  const { progress } = useBombTimer(timerActive, effectiveTimerMin, effectiveTimerMax, handleExplode);

  useTickSound(timerActive, progress);

  const update = (partial: Partial<GameState>) => setState((prev) => ({ ...prev, ...partial }));

  const startGame = () => {
    resetQuestions();
    speedReductionRef.current = 0;
    const { task, quiz } = generateTask(state.mode);
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      currentPlayerIndex: 0,
      round: 1,
      currentTask: task,
      currentQuiz: quiz,
      players: prev.players.map((p) => ({ ...p, penalties: 0 })),
    }));
    setTimerKey((k) => k + 1);
    setTimerActive(true);
  };

  const advancePlayer = () => {
    const { task, quiz } = generateTask(state.mode);
    setState((prev) => ({
      ...prev,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
      currentTask: task,
      currentQuiz: quiz,
    }));
  };

  const handleWeiter = () => {
    advancePlayer();
  };

  const handleQuizAnswer = (idx: number) => {
    if (state.currentQuiz && idx !== state.currentQuiz.correctIndex) {
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
    advancePlayer();
  };

  const handleExplosionNext = () => {
    if (state.round >= state.totalRounds) {
      setState((prev) => ({ ...prev, phase: 'gameOver' }));
    } else {
      setState((prev) => ({ ...prev, phase: 'roundEnd' }));
    }
  };

  const handleNextRound = () => {
    if (state.mode === 'speed') {
      speedReductionRef.current += 3000;
    }
    const { task, quiz } = generateTask(state.mode);
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      round: prev.round + 1,
      currentPlayerIndex: 0,
      currentTask: task,
      currentQuiz: quiz,
    }));
    setTimerKey((k) => k + 1);
    setTimerActive(true);
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
      {state.phase === 'playing' && (
        <motion.div key={`playing-${timerKey}`} exit={{ opacity: 0 }}>
          <BombPlayingScreen
            state={state}
            progress={progress}
            onWeiter={handleWeiter}
            onQuizAnswer={handleQuizAnswer}
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
          <BombResultsScreen state={state} onRestart={handleRestart} onExit={handleExit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
