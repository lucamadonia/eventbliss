import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Crown, Plus, Trash2, ChevronRight, RotateCcw, Gamepad2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateCategoryPrompt } from '../content/categories-de';
import { getRandomQuestion, resetQuestions, type QuizQuestion } from '../content/questions-de';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GamePhase = 'setup' | 'playing' | 'explosion' | 'roundEnd' | 'gameOver';
type GameMode = 'kategorie' | 'quiz' | 'speed';

interface PlayerState {
  name: string;
  penalties: number;
}

interface GameState {
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

function interpolateColor(progress: number): string {
  const r1 = 26, g1 = 22, b1 = 37;
  const r2 = 127, g2 = 29, b2 = 29;
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  return `rgb(${r},${g},${b})`;
}

function triggerVibration(intensity: number) {
  if (!navigator.vibrate) return;
  if (intensity < 0.3) return;
  const on = Math.round(30 + intensity * 70);
  const off = Math.round(100 - intensity * 60);
  navigator.vibrate([on, off, on]);
}

function triggerExplosionVibration() {
  navigator.vibrate?.([200, 100, 200, 100, 500]);
}

function generateTask(mode: GameMode): { task: string; quiz: QuizQuestion | null } {
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
// Sub-components
// ---------------------------------------------------------------------------

function SetupScreen({
  state,
  onUpdate,
  onStart,
}: {
  state: GameState;
  onUpdate: (partial: Partial<GameState>) => void;
  onStart: () => void;
}) {
  const canStart = state.players.length >= 2 && state.players.every((p) => p.name.trim().length > 0);

  const addPlayer = () => {
    if (state.players.length >= 20) return;
    onUpdate({ players: [...state.players, { name: '', penalties: 0 }] });
  };

  const removePlayer = (i: number) => {
    if (state.players.length <= 2) return;
    onUpdate({ players: state.players.filter((_, idx) => idx !== i) });
  };

  const setName = (i: number, name: string) => {
    const next = [...state.players];
    next[i] = { ...next[i], name };
    onUpdate({ players: next });
  };

  const modes: { key: GameMode; label: string; desc: string }[] = [
    { key: 'kategorie', label: 'Kategorie-Bombe', desc: 'Nenne etwas aus einer Kategorie' },
    { key: 'quiz', label: 'Quiz-Bombe', desc: 'Multiple-Choice Fragen' },
    { key: 'speed', label: 'Speed-Bombe', desc: 'Timer wird jede Runde kürzer' },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[#1a1625] p-4 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-md space-y-6 py-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Bomb className="w-16 h-16 mx-auto text-red-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Tickende Bombe</h1>
          <p className="text-gray-400 text-sm">Schaffst du es, die Bombe weiterzugeben?</p>
        </div>

        {/* Players */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg">Spieler ({state.players.length})</h2>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {state.players.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-gray-400 text-sm w-6 text-right">{i + 1}.</span>
                <Input
                  value={p.name}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={`Spieler ${i + 1}`}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  maxLength={20}
                />
                {state.players.length > 2 && (
                  <button onClick={() => removePlayer(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {state.players.length < 20 && (
            <Button variant="ghost" size="sm" onClick={addPlayer} className="text-gray-400 hover:text-white w-full">
              <Plus className="w-4 h-4 mr-1" /> Spieler hinzufügen
            </Button>
          )}
        </div>

        {/* Mode */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-lg">Spielmodus</h2>
          <div className="space-y-2">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => onUpdate({ mode: m.key })}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  state.mode === m.key
                    ? 'bg-red-500/20 border-red-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-lg">Einstellungen</h2>
          <div className="space-y-3">
            <div>
              <label className="text-gray-300 text-sm block mb-1">
                Timer: {state.timerMin}s - {state.timerMax}s
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="range" min={5} max={state.timerMax - 5} value={state.timerMin}
                  onChange={(e) => onUpdate({ timerMin: Number(e.target.value) })}
                  className="flex-1 accent-red-500"
                />
                <input
                  type="range" min={state.timerMin + 5} max={60} value={state.timerMax}
                  onChange={(e) => onUpdate({ timerMax: Number(e.target.value) })}
                  className="flex-1 accent-red-500"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-1">
                Runden: {state.totalRounds}
              </label>
              <input
                type="range" min={3} max={10} value={state.totalRounds}
                onChange={(e) => onUpdate({ totalRounds: Number(e.target.value) })}
                className="w-full accent-red-500"
              />
            </div>
          </div>
        </div>

        {/* Start */}
        <Button
          onClick={onStart}
          disabled={!canStart}
          className="w-full min-h-[56px] bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-lg font-bold rounded-xl shadow-lg shadow-red-500/25 disabled:opacity-40 disabled:shadow-none"
        >
          <Bomb className="w-5 h-5 mr-2" />
          Spiel starten!
        </Button>
      </motion.div>
    </motion.div>
  );
}

function PlayerTurnScreen({
  state,
  progress,
  onWeiter,
  onQuizAnswer,
}: {
  state: GameState;
  progress: number;
  onWeiter: () => void;
  onQuizAnswer: (idx: number) => void;
}) {
  const player = state.players[state.currentPlayerIndex];
  const bg = interpolateColor(progress);
  const pulseSpeed = Math.max(0.2, 1.2 - progress * 1.0);
  const borderOpacity = 0.1 + progress * 0.6;

  useEffect(() => {
    triggerVibration(progress);
  }, [Math.round(progress * 20)]);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-between p-4 transition-colors duration-300"
      style={{ backgroundColor: bg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Top bar */}
      <div className="w-full max-w-md flex justify-between items-center pt-4">
        <span className="text-white/60 text-sm">
          Runde {state.round}/{state.totalRounds}
        </span>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: pulseSpeed }}
        >
          <Bomb className="w-8 h-8 text-red-400" />
        </motion.div>
      </div>

      {/* Center content */}
      <motion.div
        className="w-full max-w-md flex-1 flex flex-col items-center justify-center space-y-8"
        style={{
          border: `2px solid rgba(239, 68, 68, ${borderOpacity})`,
          borderRadius: '1.5rem',
          padding: '2rem',
          margin: '1rem 0',
        }}
        animate={{ boxShadow: `0 0 ${20 + progress * 40}px rgba(239, 68, 68, ${borderOpacity * 0.5})` }}
      >
        <motion.h2
          className="text-2xl font-bold text-white text-center"
          key={player.name}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {player.name}
        </motion.h2>

        <motion.p
          className="text-xl text-white/90 text-center leading-relaxed px-2"
          key={state.currentTask}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {state.currentTask}
        </motion.p>

        {/* Quiz answers */}
        {state.mode === 'quiz' && state.currentQuiz && (
          <div className="grid grid-cols-1 gap-3 w-full">
            {state.currentQuiz.answers.map((ans, idx) => (
              <motion.button
                key={idx}
                onClick={() => onQuizAnswer(idx)}
                className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white text-left hover:bg-white/20 active:bg-white/30 transition-colors"
                whileTap={{ scale: 0.97 }}
              >
                <span className="font-medium mr-2 text-red-300">{String.fromCharCode(65 + idx)}.</span>
                {ans}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Weiter button (not for quiz mode — answers advance) */}
      {state.mode !== 'quiz' && (
        <motion.div className="w-full max-w-md pb-6">
          <Button
            onClick={onWeiter}
            className="w-full min-h-[60px] bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white text-xl font-bold rounded-2xl shadow-lg shadow-orange-500/30"
          >
            Weiter! <ChevronRight className="w-6 h-6 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* For quiz mode, show a small skip hint */}
      {state.mode === 'quiz' && (
        <div className="w-full max-w-md pb-6 text-center">
          <p className="text-white/40 text-xs">Wähle eine Antwort! Falsch = Bombe tickt schneller</p>
        </div>
      )}
    </motion.div>
  );
}

function ExplosionScreen({
  playerName,
  onNext,
}: {
  playerName: string;
  onNext: () => void;
}) {
  useEffect(() => {
    triggerExplosionVibration();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-4 overflow-hidden"
      initial={{ backgroundColor: '#7f1d1d' }}
      animate={{ backgroundColor: ['#991b1b', '#dc2626', '#991b1b'] }}
      transition={{ repeat: Infinity, duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: [0, 2, 1.5], rotate: [0, 20, -10, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        <Bomb className="w-32 h-32 text-yellow-400" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
        >
          <div className="w-40 h-40 rounded-full bg-orange-500/30 blur-xl" />
        </motion.div>
      </motion.div>

      <motion.h1
        className="text-7xl font-black text-yellow-400 mt-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ textShadow: '0 0 30px rgba(234, 179, 8, 0.5)' }}
      >
        BOOM!
      </motion.h1>

      <motion.p
        className="text-2xl text-white mt-6 text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {playerName} wurde erwischt!
      </motion.p>

      <motion.div
        className="mt-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={onNext}
          className="min-h-[56px] px-10 bg-white/20 hover:bg-white/30 text-white text-lg font-bold rounded-xl border border-white/20"
        >
          Nächste Runde
        </Button>
      </motion.div>
    </motion.div>
  );
}

function RoundEndScreen({
  state,
  onNext,
}: {
  state: GameState;
  onNext: () => void;
}) {
  const sorted = [...state.players].sort((a, b) => a.penalties - b.penalties);

  return (
    <motion.div
      className="min-h-screen bg-[#1a1625] flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">
          Zwischenstand
        </h2>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              key={p.name}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono w-6 text-right">{i + 1}.</span>
                <span className="text-white font-medium">{p.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: p.penalties }).map((_, j) => (
                  <Bomb key={j} className="w-4 h-4 text-red-400" />
                ))}
                {p.penalties === 0 && <span className="text-green-400 text-sm">Sicher!</span>}
              </div>
            </motion.div>
          ))}
        </div>
        <Button
          onClick={onNext}
          className="w-full min-h-[56px] bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-lg font-bold rounded-xl"
        >
          Runde {state.round + 1} starten
        </Button>
      </div>
    </motion.div>
  );
}

function GameOverScreen({
  state,
  onRestart,
  onExit,
}: {
  state: GameState;
  onRestart: () => void;
  onExit: () => void;
}) {
  const sorted = [...state.players].sort((a, b) => a.penalties - b.penalties);

  return (
    <motion.div
      className="min-h-screen bg-[#1a1625] flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Spielende!</h1>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              key={p.name}
              className={`flex items-center justify-between p-4 rounded-xl ${
                i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="flex items-center gap-3">
                {i === 0 && <Crown className="w-6 h-6 text-yellow-400" />}
                {i !== 0 && <span className="text-gray-400 font-mono w-6 text-right">{i + 1}.</span>}
                <span className={`font-medium ${i === 0 ? 'text-yellow-300 text-lg' : 'text-white'}`}>
                  {p.name}
                </span>
              </div>
              <span className={`text-sm font-mono ${p.penalties === 0 ? 'text-green-400' : 'text-red-400'}`}>
                {p.penalties} {p.penalties === 1 ? 'Treffer' : 'Treffer'}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onRestart}
            className="flex-1 min-h-[56px] bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-xl"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> Nochmal
          </Button>
          <Button
            onClick={onExit}
            variant="outline"
            className="flex-1 min-h-[56px] border-white/20 text-white hover:bg-white/10 font-bold rounded-xl"
          >
            <Gamepad2 className="w-5 h-5 mr-2" /> Anderes Spiel
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Game Component
// ---------------------------------------------------------------------------

export default function BombGame() {
  const [state, setState] = useState<GameState>({ ...defaultState });
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const speedReductionRef = useRef(0);

  const effectiveTimerMin = state.mode === 'speed'
    ? Math.max(5, (state.timerMin * 1000) - speedReductionRef.current)
    : state.timerMin * 1000;
  const effectiveTimerMax = state.mode === 'speed'
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
      // Wrong answer: reduce remaining time by speeding up (we can't modify timer duration mid-run,
      // but we advance to next player with a new task — the bomb keeps ticking)
      triggerVibration(0.8);
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
          <SetupScreen state={state} onUpdate={update} onStart={startGame} />
        </motion.div>
      )}
      {state.phase === 'playing' && (
        <motion.div key={`playing-${timerKey}`} exit={{ opacity: 0 }}>
          <PlayerTurnScreen
            state={state}
            progress={progress}
            onWeiter={handleWeiter}
            onQuizAnswer={handleQuizAnswer}
          />
        </motion.div>
      )}
      {state.phase === 'explosion' && (
        <motion.div key="explosion" exit={{ opacity: 0 }}>
          <ExplosionScreen
            playerName={state.players[state.explodedPlayerIndex]?.name ?? '???'}
            onNext={handleExplosionNext}
          />
        </motion.div>
      )}
      {state.phase === 'roundEnd' && (
        <motion.div key="roundEnd" exit={{ opacity: 0 }}>
          <RoundEndScreen state={state} onNext={handleNextRound} />
        </motion.div>
      )}
      {state.phase === 'gameOver' && (
        <motion.div key="gameOver" exit={{ opacity: 0 }}>
          <GameOverScreen state={state} onRestart={handleRestart} onExit={handleExit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
