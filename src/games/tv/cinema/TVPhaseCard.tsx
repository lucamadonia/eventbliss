import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyEase } from '@/lib/party-motion';
import { serverClock } from '@/games/party/scene-clock';
import { lu } from '../components/tv-lobby-scale';
import { useTVCue } from './tv-cue-context';
import { remainingCardMs, type TVPhaseCue } from './tv-phase-cues';

/** Toene nur ausspielen, solange der Moment noch frisch ist. */
const SOUND_GRACE_MS = 1200;

/**
 * Titelkarte zwischen zwei Spielphasen („Rollen verteilen“ → „Diskussion“ →
 * „Abstimmung“). Kommt die Phase mit `phaseStartsAt` (Serverzeit), richtet
 * sich die Karte nach der Szenenuhr: Ein Fernseher, der den Wechsel spaet
 * empfaengt, zeigt nur den Rest — er laeuft den Handys nie hinterher.
 */
export default function TVPhaseCard({ cue, phaseStartsAt }: { cue: TVPhaseCue | null; phaseStartsAt: number | null }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const audio = useTVCue();
  const [shown, setShown] = useState<TVPhaseCue | null>(null);
  // undefined = noch nie einen Zustand gesehen (frisch verbunden).
  const lastKeyRef = useRef<string | null | undefined>(undefined);
  const stopDrumrollRef = useRef<(() => void) | null>(null);
  const audioRef = useRef(audio);
  audioRef.current = audio;
  // Neuester Cue fuer den Effekt — der Effekt selbst haengt nur am Schluessel.
  const cueRef = useRef(cue);
  cueRef.current = cue;
  const cueKey = cue?.key ?? null;

  useEffect(() => {
    const cue = cueRef.current;
    const key = cueKey;
    if (key === lastKeyRef.current) return;
    const first = lastKeyRef.current === undefined && phaseStartsAt === null;
    lastKeyRef.current = key;
    // Jeder Phasenwechsel beendet einen laufenden Trommelwirbel.
    stopDrumrollRef.current?.();
    stopDrumrollRef.current = null;
    if (!cue) { setShown(null); return; }

    const elapsed = phaseStartsAt !== null ? serverClock.now() - phaseStartsAt : null;
    // `phaseStartsAt` ist der GEPLANTE gemeinsame Start: liegt er noch vorn,
    // wartet die Karte (Ton inklusive) genau bis dahin — wie Host und Handys.
    const waitMs = elapsed !== null && elapsed < 0 ? Math.min(-elapsed, 3000) : 0;
    const remaining = remainingCardMs(elapsed !== null && elapsed < 0 ? 0 : elapsed);
    // Ein frisch verbundener Fernseher ohne Szenenuhr steigt mitten ein: kein
    // Ton und keine Karte fuer einen Wechsel, den er nicht miterlebt hat.
    const fresh = !first && (elapsed === null || elapsed < SOUND_GRACE_MS);
    const timers: number[] = [];
    const start = () => {
      if (fresh && cue.sound !== 'none') {
        if (cue.sound === 'drumroll') stopDrumrollRef.current = audioRef.current.drumroll();
        else audioRef.current.play(cue.sound);
      }
      if (!cue.card || first || remaining <= 0) { setShown(null); return; }
      setShown(cue);
      timers.push(window.setTimeout(() => setShown(null), remaining));
    };
    if (waitMs > 0) timers.push(window.setTimeout(start, waitMs));
    else start();
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [cueKey, phaseStartsAt]);

  useEffect(() => () => stopDrumrollRef.current?.(), []);

  const text = (part?: TVPhaseCue['title']) => (part ? t(part.key, part.fallback, part.params ?? {}) : '');

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.key}
          data-testid="tv-phase-card"
          data-cue={shown.key}
          className="pointer-events-none fixed inset-0 z-[170] grid place-items-center overflow-hidden"
          // Deckend: eine Titelkarte ist ein eigener Moment, das Spielbild darunter wuerde nur flimmern.
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${shown.accent}2e 0%, #060810 62%), #060810` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.32, ease: partyEase.out } }}
          exit={{ opacity: 0, transition: { duration: 0.34, ease: partyEase.exit } }}
          role="status"
          aria-live="polite"
        >
          {/* Lichtkante, die einmal durchs Bild faehrt — nur transform/opacity. */}
          {!reduced && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 w-[40vw]"
              style={{ background: `linear-gradient(90deg, transparent, ${shown.accent}22, transparent)` }}
              initial={{ x: '-60vw' }}
              animate={{ x: '120vw' }}
              transition={{ duration: 1.3, ease: partyEase.inOut }}
            />
          )}
          <div className="relative flex flex-col items-center text-center" style={{ gap: lu(2), paddingInline: '8vw' }}>
            {shown.eyebrow && (
              <motion.span
                className="font-black uppercase"
                style={{ fontSize: lu(2.4), letterSpacing: '0.32em', color: shown.accent }}
                initial={{ opacity: 0, y: reduced ? 0 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: partyEase.out, delay: 0.05 }}
              >
                {text(shown.eyebrow)}
              </motion.span>
            )}
            <div className="flex items-center" style={{ gap: lu(3) }}>
              <motion.span aria-hidden className="h-[3px] origin-right rounded-full" style={{ width: lu(10), background: shown.accent }}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.15 }} />
              <motion.h2
                className="font-black italic leading-none text-white"
                style={{ fontSize: lu(11), textShadow: `0 0 60px ${shown.accent}66` }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.94, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: partyEase.out, delay: 0.08 }}
              >
                {text(shown.title)}
              </motion.h2>
              <motion.span aria-hidden className="h-[3px] origin-left rounded-full" style={{ width: lu(10), background: shown.accent }}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: partyEase.out, delay: 0.15 }} />
            </div>
            {shown.subtitle && (
              <motion.p
                className="font-semibold text-white/80"
                style={{ fontSize: lu(3.2), maxWidth: '40ch' }}
                initial={{ opacity: 0, y: reduced ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: partyEase.out, delay: 0.25 }}
              >
                {text(shown.subtitle)}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
