/**
 * Gemeinsame Buehnenteile der Zug-Spiele auf dem Fernseher (Schnellzeichner,
 * Ohne Worte, Wer bin ich, Wahrheit oder Pflicht, Geschichten): Kopfzeile mit
 * Phasen-Band und Rundenzaehler im 5-%-Rand, Zeit-Ring, Farbschleier.
 *
 * Die Mitte der Kopfzeile bleibt frei — dort sitzt die globale Weitergabe.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { partyMotion } from '@/lib/party-motion';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel } from '../../tv-tokens';

export const TS = { text: '#f1f3fc', dim: '#a8abb3', bg: '#060810', panel: '#0d0915', raised: '#16101f', good: '#10b981', bad: '#ef4444', warn: '#f59e0b', gold: '#FFD23F', accent: '#df8eff', cyan: '#8ff5ff', pink: '#ff6b98' } as const;

/**
 * Nur echte Emoji sind Spieler-Symbole. Manche Bruecken schicken als Rueckfall
 * den Anfangsbuchstaben — dann lieber das Emoji aus der Teilnehmerliste.
 */
export function emojiOnly(avatar: unknown): string | undefined {
  return typeof avatar === 'string' && /\p{Extended_Pictographic}/u.test(avatar) ? avatar : undefined;
}

/** Hex-Farbe oder Rueckfall (Glow/Verlaeufe rechnen mit #rrggbb). */
export function hexOr(color: unknown, fallback: string): string {
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

/** Alpha-Suffix fuer #rrggbb. */
export const alpha = (a: number) => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

export function PhasePill({ label, color }: { label: string; color: string }) {
  const reduced = !!useReducedMotion();
  return (
    <motion.div key={label} className="rounded-full px-6 py-2" data-testid="tv-phase-pill"
      style={{ background: `${color}1f`, border: `1px solid ${color}4d` }}
      variants={partyMotion('phaseTitleSweep', reduced)} initial="initial" animate="animate">
      <span className="font-bold" style={{ fontSize: lu(2.4), color: TS.text }}>{label}</span>
    </motion.div>
  );
}

/** Kopfzeile: links das Phasen-Band, rechts Runde (+ optional Zusatz wie die Uhr). */
export function TVTopBar({ phase, round, right }: { phase?: { label: string; color: string } | null; round?: string; right?: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-[5vw] right-[5vw] top-[5vh] z-20 flex items-start justify-between">
      {phase ? <PhasePill label={phase.label} color={phase.color} /> : <span />}
      <div className="flex items-center gap-4">
        {round && (
          <div className={`${tvPanel} px-5 py-2`}>
            <span className="font-bold tabular-nums" style={{ fontSize: lu(2.4), color: TS.dim }}>{round}</span>
          </div>
        )}
        {right}
      </div>
    </div>
  );
}

/** Ruhiger Farbschleier hinter der Szene (nur Deckkraft animiert). */
export function Wash({ color, strength = 0.1, at = '50% 50%' }: { color: string; strength?: number; at?: string }) {
  const ambient = useAmbientMotion();
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0"
      style={{ background: `radial-gradient(ellipse 70% 60% at ${at}, ${color}${alpha(strength)} 0%, transparent 70%)`, transition: 'background 600ms ease' }}
      animate={ambient ? { opacity: [0.55, 1, 0.55] } : { opacity: 0.85 }}
      transition={ambient ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' } : { duration: 0.3 }} />
  );
}

export const timerColor = (ratio: number) => (ratio > 0.5 ? TS.good : ratio > 0.2 ? TS.warn : TS.bad);

/**
 * Zeit-Ring in `lu`-Groesse. Der Ring laeuft per strokeDashoffset, die Zahl
 * pulsiert in den letzten Sekunden (nur transform, entfaellt bei Bewegungsarmut).
 */
export function TVTimerRing({ timeLeft, total, size = 14 }: { timeLeft: number; total: number; size?: number }) {
  const reduced = !!useReducedMotion();
  const ratio = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const color = timerColor(ratio);
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = timeLeft > 0 && timeLeft <= 10;
  return (
    <div className="relative grid place-items-center" style={{ width: lu(size), height: lu(size) }} data-testid="tv-timer-ring">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx="50" cy="50" r={r} fill="#0d0915" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - ratio) }} transition={{ duration: 0.6, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)`, transition: 'stroke 400ms ease' }} />
      </svg>
      <motion.span className="relative font-black tabular-nums leading-none" style={{ fontSize: lu(size * 0.36), color: TS.text }}
        animate={urgent && !reduced ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={urgent && !reduced ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : { duration: 0.2 }}>
        {Math.max(0, Math.round(timeLeft))}
      </motion.span>
    </div>
  );
}
