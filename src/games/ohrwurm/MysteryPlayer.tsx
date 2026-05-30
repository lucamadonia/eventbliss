import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap, Loader2, Music2 } from 'lucide-react';

// OHRWURM — „Mystery Player": spielt die 30s-Vorschau ab, OHNE Titel/Interpret
// zu zeigen. Dreht eine Vinyl, animiert Equalizer-Bars und zeigt einen
// Kreis-Countdown (60s) mit goldener Speed-Zone in den ersten 10 Sekunden.

const C = {
  primary: '#FF2E88',
  secondary: '#26E0C4',
  accent: '#FFD23F',
  bg: '#16101f',
  surface: '#241a39',
  text: '#F7F2E9',
  dim: '#b3a8c9',
  danger: '#ff5d73',
} as const;

const RING_STYLE = `
@keyframes ow-eq { 0%,100% { transform: scaleY(0.28); } 50% { transform: scaleY(1); } }
@keyframes ow-ringpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
`;

export interface MysteryPlayerProps {
  loading: boolean;
  hasPreview: boolean;
  isPlaying: boolean;      // Audio läuft gerade
  started: boolean;        // Runde/Timer gestartet
  timeLeft: number;        // 0..total
  total: number;           // 60
  speedActive: boolean;    // innerhalb der ersten 10s
  onPlay: () => void;      // starten / fortsetzen
  onReplay: () => void;    // von vorn abspielen
}

export function MysteryPlayer({
  loading, hasPreview, isPlaying, started, timeLeft, total, speedActive, onPlay, onReplay,
}: MysteryPlayerProps) {
  const reduce = useReducedMotion();

  const SIZE = 224;
  const STROKE = 10;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 1;
  const offset = circ * (1 - pct);

  const danger = started && timeLeft <= 10;
  const ringColor = !started
    ? C.secondary
    : speedActive
    ? C.accent
    : timeLeft > total / 2
    ? C.secondary
    : timeLeft > 10
    ? '#ff9f43'
    : C.danger;

  const spin = isPlaying && !reduce;

  return (
    <div className="relative flex flex-col items-center gap-5">
      <style>{RING_STYLE}</style>

      {/* Speed-Bonus-Chip */}
      <div
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide uppercase transition-all"
        style={
          speedActive
            ? { background: `${C.accent}22`, color: C.accent, border: `1.5px solid ${C.accent}`, boxShadow: `0 0 22px ${C.accent}55` }
            : { background: C.surface, color: C.dim, border: '1.5px solid transparent', opacity: 0.6 }
        }
      >
        <Zap className="w-3.5 h-3.5" fill={speedActive ? C.accent : 'none'} />
        {speedActive ? 'Speed-Bonus aktiv · +2 🎣' : 'Speed-Bonus (erste 10s)'}
      </div>

      {/* Disc + Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* Glow */}
        <div
          className="absolute inset-2 rounded-full blur-2xl pointer-events-none transition-opacity"
          style={{ background: ringColor, opacity: started ? 0.22 : 0.12 }}
        />

        {/* Countdown-Ring */}
        <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={started ? offset : 0}
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
              animation: danger && !reduce ? 'ow-ringpulse 1s ease-in-out infinite' : undefined,
              filter: `drop-shadow(0 0 6px ${ringColor}aa)`,
            }}
          />
        </svg>

        {/* Vinyl */}
        <motion.button
          type="button"
          onClick={onPlay}
          disabled={loading}
          aria-label={isPlaying ? 'Pause' : 'Song abspielen'}
          className="absolute rounded-full flex items-center justify-center cursor-pointer disabled:cursor-wait"
          style={{ inset: STROKE + 10 }}
          whileTap={{ scale: 0.96 }}
        >
          <motion.div
            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${C.surface} 0%, ${C.bg} 72%)`,
              border: `1px solid rgba(255,255,255,0.08)`,
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.6)',
            }}
            animate={spin ? { rotate: 360 } : { rotate: 0 }}
            transition={spin ? { repeat: Infinity, ease: 'linear', duration: 4 } : { duration: 0.3 }}
          >
            {/* Rillen */}
            {[0.86, 0.66, 0.46].map((s) => (
              <div key={s} className="absolute rounded-full" style={{
                width: `${s * 100}%`, height: `${s * 100}%`,
                border: '1px solid rgba(255,255,255,0.05)',
              }} />
            ))}
            {/* Label-Mitte */}
            <div className="absolute w-[34%] h-[34%] rounded-full" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, opacity: 0.25 }} />
            <Music2 className="absolute w-5 h-5" style={{ color: C.dim, opacity: 0.5, top: '14%' }} />
          </motion.div>

          {/* Play/Pause-Knopf (steht still, dreht nicht mit) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 8px 28px ${C.primary}66` }}
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.bg }} />
            ) : isPlaying ? (
              <Pause className="w-7 h-7" style={{ color: C.bg }} fill={C.bg} />
            ) : (
              <Play className="w-7 h-7 ml-0.5" style={{ color: C.bg }} fill={C.bg} />
            )}
          </div>
        </motion.button>
      </div>

      {/* Equalizer + Countdown */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-end gap-1 h-6" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                height: '100%',
                background: isPlaying ? ringColor : 'rgba(255,255,255,0.12)',
                transformOrigin: 'bottom',
                transform: isPlaying ? undefined : 'scaleY(0.28)',
                animation: isPlaying && !reduce ? `ow-eq ${0.7 + (i % 3) * 0.18}s ease-in-out ${i * 0.08}s infinite` : undefined,
              }}
            />
          ))}
        </div>
        {started ? (
          <div className="text-center">
            <span className="font-mono font-black text-2xl tabular-nums" style={{ color: danger ? C.danger : C.text }}>
              {timeLeft}s
            </span>
            <p className="text-[11px] font-bold" style={{ color: C.dim }}>
              {danger ? 'Schnell — gleich verfällt die Karte!' : 'Zeit zum Einordnen'}
            </p>
          </div>
        ) : (
          <p className="text-sm font-bold text-center" style={{ color: C.dim }}>
            {loading ? 'Song wird geladen …' : hasPreview ? 'Tippen zum Abspielen — Titel bleibt geheim' : 'Antippen & los'}
          </p>
        )}
      </div>

      {/* Replay */}
      {started && (
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
          style={{ color: C.secondary }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Nochmal hören
        </button>
      )}
    </div>
  );
}
