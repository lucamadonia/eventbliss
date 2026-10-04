import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { firePartyHaptic, partyCue, partyMotion, pressable } from '@/lib/party-motion';
import { useHaptics } from '@/hooks/useHaptics';
import { useBackGuard } from '@/lib/back-guard';
import type { MatchGuard } from './party-roster';

/** „Tom und Sara“ in the UI language, as parts so each name keeps its colour dot. */
const listParts = (language: string, names: string[]): { type: 'element' | 'literal'; value: string }[] => {
  try { return new Intl.ListFormat(language, { type: 'conjunction' }).formatToParts(names); }
  catch { return names.flatMap((value, i) => i ? [{ type: 'literal' as const, value: ', ' }, { type: 'element' as const, value }] : [{ type: 'element' as const, value }]); }
};

export interface LeftPlayer { id: string; name: string; color: string }

/** Calm "someone is waiting" dot — waiting states never show a spinner; static under reduced motion. */
export function WaitingDot({ color = '#df8eff' }: { color?: string }) {
  const reduced = !!useReducedMotion();
  return <motion.span aria-hidden animate={reduced ? undefined : { opacity: [0.35, 1, 0.35] }}
    transition={reduced ? undefined : { duration: 1.6, repeat: Infinity }}
    className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

/** Spinner only after 300 ms so quick actions do not flicker. */
function useLateBusy(busy: boolean) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!busy) { setLate(false); return; }
    const timer = setTimeout(() => setLate(true), 300);
    return () => clearTimeout(timer);
  }, [busy]);
  return late;
}

/**
 * No-hang guard for party matches that lost too many participants (T14). The
 * host decides in a bottom sheet; everyone else sees a calm waiting note.
 */
export default function MatchGuardOverlay({ guard, gameName, left, min, onAbort, onLobby }: {
  guard: Exclude<MatchGuard, 'ok'>;
  gameName: string;
  left: LeftPlayer[];
  min: number;
  onAbort: () => Promise<void> | void;
  onLobby: () => Promise<void> | void;
}) {
  const { t, i18n } = useTranslation();
  const reduced = !!useReducedMotion();
  const parts = listParts(i18n.language, left.map(player => player.name));
  const haptics = useHaptics();
  const primary = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const lateBusy = useLateBusy(busy);
  const host = guard === 'host-decide';
  const run = (action: () => Promise<void> | void) => async () => {
    if (busy) return;
    setBusy(true);
    try { await action(); } catch { /* The party lobby shows controller errors. */ } finally { setBusy(false); }
  };
  useEffect(() => {
    if (!host) return;
    primary.current?.focus();
    firePartyHaptic(haptics, partyCue('T14', 'host').haptic);
  }, [host]); // eslint-disable-line react-hooks/exhaustive-deps
  // Android back means the safe choice; a decision is required, so it never just closes.
  useBackGuard(() => { void run(onLobby)(); return true; }, host);

  return (
    <motion.div variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <motion.div variants={partyMotion('sheetEnter', reduced)} initial="initial" animate="animate" exit="exit"
        role="dialog" aria-modal="true" aria-labelledby="below-min-title" data-testid={host ? 'below-min-dialog' : 'below-min-waiting'}
        className="w-full max-w-md rounded-t-[28px] px-5 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-white shadow-2xl sm:rounded-[28px]"
        style={{ backgroundColor: '#0c0b17', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div aria-hidden className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <h2 id="below-min-title" className="text-xl font-extrabold font-game leading-tight">
          {t('partyPlay.tooFewTitle', 'Zu wenige Spieler für {{game}}', { game: gameName })}
        </h2>
        {left.length > 0 && (
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            <span>
              {(() => { let index = 0; return parts.map((part, i) => part.type === 'literal' ? <span key={i}>{part.value}</span> : (
                <span key={i} className="inline-flex items-center gap-1.5 text-white">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: left[index++]?.color }} />{part.value}
                </span>)); })()}
              {' '}{t('partyPlay.tooFewLeft', '– nicht mehr dabei. Für {{game}} braucht ihr {{min}}.', { game: gameName, min })}</span>
          </p>
        )}
        {host ? (
          <div className="mt-6 space-y-3">
            <motion.button ref={primary} type="button" disabled={busy} onClick={run(onLobby)} {...pressable}
              data-testid="below-min-lobby"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-bold text-[#0b0b12] disabled:opacity-60"
              style={{ minHeight: 64 }}>
              {lateBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('partyPlay.backToLobby', 'Zurück in die Lobby')}
            </motion.button>
            <motion.button type="button" disabled={busy} onClick={run(onAbort)} {...pressable}
              data-testid="below-min-abort"
              className="w-full rounded-2xl text-base font-bold disabled:opacity-60"
              style={{ minHeight: 64, color: '#ff6b98', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {t('partyPlay.abortMatch', 'Spiel abbrechen – zählt nicht')}
            </motion.button>
          </div>
        ) : (
          <p role="status" className="mt-5 flex items-center gap-3 text-sm text-white/70">
            <WaitingDot />
            {t('partyPlay.tooFewWaiting', 'Der Host entscheidet gerade, wie es weitergeht.')}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
