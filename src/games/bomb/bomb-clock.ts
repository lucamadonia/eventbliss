/**
 * Bomb clock — the hidden fuse (pausable, never re-rolled on a transport
 * pause), the clockwork tick and the per-turn task generator.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import i18next from 'i18next';
import { generateCategoryPrompt } from '../content/categories';
import { getRandomQuestion, type QuizQuestion } from '../content/questions';
import { useLocalGamePaused } from '../engine/local-pause';
import type { GameMode } from './BombGame';
import { speedFuseMs } from './rules';

// ---------------------------------------------------------------------------
// Hook: useBombTimer
// ---------------------------------------------------------------------------

export function useBombTimer(
  active: boolean,
  minMs: number,
  maxMs: number,
  onExplode: () => void,
  enabled = true,
) {
  const locallyPaused = useLocalGamePaused();
  const clockEnabled = enabled && !locallyPaused;
  const [progress, setProgress] = useState(0);
  const durationRef = useRef(0);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const rafRef = useRef<number>(0);
  const explodedRef = useRef(false);
  const onExplodeRef = useRef(onExplode);
  onExplodeRef.current = onExplode;

  const start = useCallback(() => {
    durationRef.current = minMs + Math.random() * (maxMs - minMs);
    startRef.current = performance.now();
    elapsedRef.current = 0;
    explodedRef.current = false;
    setProgress(0);
  }, [minMs, maxMs]);

  // Starting a round picks one fuse; transport pauses never pick another.
  useEffect(() => { if (active) start(); }, [active, start]);
  useEffect(() => {
    if (!active || !clockEnabled) return;
    startRef.current = performance.now();
    const tick = () => {
      const elapsed = elapsedRef.current + performance.now() - startRef.current;
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
    return () => {
      cancelAnimationFrame(rafRef.current);
      elapsedRef.current += performance.now() - startRef.current;
    };
  }, [active, start, clockEnabled]);

  return { progress, durationMs: durationRef.current };
}

// ---------------------------------------------------------------------------
// Hook: useTickSound (Web Audio API oscillator)
// ---------------------------------------------------------------------------

export function useTickSound(active: boolean, progress: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tockRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const playTick = () => {
      try {
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;
        const now = ctx.currentTime;
        // Alternate tick/tock for a real clockwork feel.
        tockRef.current = !tockRef.current;
        const tock = tockRef.current;

        const osc = ctx.createOscillator();
        const filt = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);

        // Short, percussive click (square through a lowpass) — not a sine beep.
        osc.type = 'square';
        osc.frequency.value = tock ? 230 : 300;            // lower = mechanical
        filt.type = 'lowpass';
        filt.frequency.value = 900 + progress * 2600;       // opens up = more urgent
        // Sharp attack + fast exponential decay = a tight "tick".
        const peak = 0.16 + progress * 0.22;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch { /* audio not available */ }
    };

    const ms = Math.max(90, 620 - progress * 520);
    intervalRef.current = setInterval(playTick, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, Math.round(progress * 10)]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateTask(mode: GameMode): { task: string; quiz: QuizQuestion | null } {
  // random mode removed — randomTimer is now a flag on GameState
  if (mode === 'quiz') {
    const q = getRandomQuestion();
    return { task: q.question, quiz: q };
  }
  if (mode === 'alle') {
    const { category, letter } = generateCategoryPrompt();
    return { task: i18next.t('games.bomb.taskAllePrompt', { category, letter }), quiz: null };
  }
  const { category, letter } = generateCategoryPrompt();
  return { task: i18next.t('games.bomb.taskKategoriePrompt', { category, letter }), quiz: null };
}

/** Fuse window in ms for the current settings (random, speed with per-round reduction, or fixed). */
export function speedFuseRange(state: { randomTimer: boolean; mode: GameMode; timerMin: number; timerMax: number }, reductionMs: number): { min: number; max: number } {
  if (state.randomTimer) return { min: 15000, max: 90000 };
  if (state.mode === 'speed') return speedFuseMs(state.timerMin, state.timerMax, reductionMs);
  return { min: state.timerMin * 1000, max: state.timerMax * 1000 };
}
