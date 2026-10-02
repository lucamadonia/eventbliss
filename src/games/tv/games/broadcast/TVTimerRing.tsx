import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { partyEase } from '@/lib/party-motion';
import { useTVCue } from '../../cinema/tv-cue-context';
import { lu } from '../../components/tv-lobby-scale';

/**
 * Uhr als Ring (Design §4 „Frist“): fuellt sich ab, wird gelb und rot, in den
 * letzten fuenf Sekunden pocht sie und tickt. Nur transform/opacity laufen
 * dauerhaft; der Ring selbst bewegt sich nur bei neuen Werten.
 */
export function timerTone(fraction: number): string {
  if (fraction > 0.5) return '#8ff5ff';
  if (fraction > 0.2) return '#fbbf24';
  return '#ff6b98';
}

export default function TVTimerRing({ seconds, fraction, size = lu(9), paused = false, tick = true }: {
  seconds: number; fraction: number; size?: string; paused?: boolean; tick?: boolean;
}) {
  const reduced = !!useReducedMotion();
  const cue = useTVCue();
  const f = Math.max(0, Math.min(1, fraction));
  const color = paused ? '#a8abb3' : timerTone(f);
  const urgent = !paused && seconds > 0 && seconds <= 5;
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (!tick || !urgent || lastTick.current === seconds) return;
    lastTick.current = seconds;
    cue.play('tick');
  }, [seconds, urgent, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <motion.div data-testid="tv-timer-ring" data-seconds={seconds} className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: 'radial-gradient(circle, #0d0915 62%, transparent 64%)', boxShadow: urgent ? `0 0 36px -4px ${color}` : 'none' }}
      animate={urgent && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={urgent && !reduced ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : { duration: 0.3 }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} initial={false} animate={{ strokeDashoffset: C * (1 - f) }}
          transition={{ duration: 0.5, ease: partyEase.out }} />
      </svg>
      <span className="relative font-black tabular-nums leading-none" style={{ fontSize: `calc(${size} * 0.36)`, color: '#f1f3fc' }}>
        {paused ? '❚❚' : Math.max(0, Math.ceil(seconds))}
      </span>
    </motion.div>
  );
}
