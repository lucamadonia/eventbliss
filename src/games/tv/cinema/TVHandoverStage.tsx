import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyEase, partyMotion, playerGlow } from '@/lib/party-motion';
import type { TvHandover } from '@/games/ui/guest-handover';
import { lu } from '../components/tv-lobby-scale';
import TVPlayerAvatar from './TVPlayerAvatar';
import { HANDOVER_MIN_VIEW_MS, handoverDots } from './tv-handover';
import { lookupRoster, useTVRoster } from './tv-roster';

/** Neutraler Akzent — nie rollenabhaengig (Design §9.3). */
const ACCENT = '#df8eff';

/**
 * Die Weitergabe-Buehne (T07, Design §9.3): Wer gerade das Host-Handy hat,
 * steht gross im Rampenlicht; darunter die Kette — ✓ fertig, jetzt, offen.
 *
 * GEHEIMNIS-DISZIPLIN: keine Uhr, keine Dauer, keine Rollenfarbe. Damit
 * niemand aus einem besonders kurzen Blick etwas ablesen kann, steht jede
 * Person mindestens 1,5 s im Licht, bevor der Fernseher zur naechsten wechselt
 * (die neuesten Daten werden so lange zurueckgehalten).
 */
export default function TVHandoverStage({ handover, onCue }: { handover: TvHandover | null; onCue?: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const roster = useTVRoster();
  const [shown, setShown] = useState<TvHandover | null>(handover?.progress ? handover : null);
  const sinceRef = useRef(Date.now());
  const latestRef = useRef(handover);
  latestRef.current = handover;
  const cueRef = useRef(onCue);
  cueRef.current = onCue;

  useEffect(() => {
    const next = handover?.progress ? handover : null;
    const current = shown?.progress;
    const switching = !!current && (!next || next.progress!.currentId !== current.currentId || next.progress!.phase === 'covered');
    const wait = switching ? HANDOVER_MIN_VIEW_MS - (Date.now() - sinceRef.current) : 0;
    const apply = () => {
      const value = latestRef.current?.progress ? latestRef.current : null;
      setShown((prev) => {
        if (value?.progress && value.progress.currentId !== prev?.progress?.currentId) {
          sinceRef.current = Date.now();
          if (value.progress.phase !== 'covered') cueRef.current?.();
        }
        return value;
      });
    };
    if (wait <= 0) { apply(); return; }
    const id = window.setTimeout(apply, wait);
    return () => window.clearTimeout(id);
  }, [handover]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = shown?.progress;
  const who = shown ? (lookupRoster(roster, p?.currentId ?? shown.playerId, shown.name) ?? shown) : null;
  const tone = shown?.color || who?.color || ACCENT;
  const line = !p || !shown ? ''
    : p.phase === 'passing' ? t('partyPlay.tv.stagePassing', '{{name}} bekommt das Handy', { name: shown.name })
      : p.phase === 'viewing' ? t('partyPlay.tv.stageViewing', '{{name}} schaut …', { name: shown.name })
        : t('handover.returnToHost', 'Zurück an den Host');

  return (
    <AnimatePresence>
      {shown && p && (
        <motion.div
          key="stage"
          data-testid="tv-handover-stage"
          data-phase={p.phase}
          data-current={p.currentId}
          className="fixed inset-0 z-[165] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: `radial-gradient(ellipse 60% 55% at 50% 42%, ${ACCENT}1f, #060810 70%), #060810`, gap: lu(4) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4, ease: partyEase.out } }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: partyEase.exit } }}
        >
          {/* Atmendes Licht in der Farbe der Person mit dem Handy — nur Deckkraft. */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(circle at 50% 40%, ${tone}33, transparent 45%)` }}
            animate={reduced ? { opacity: 0.8 } : { opacity: [0.45, 1, 0.45] }}
            transition={reduced ? { duration: 0.2 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />

          <span className="relative inline-flex items-center gap-3 rounded-full px-6 py-2 font-bold uppercase"
            style={{ fontSize: lu(2.1), letterSpacing: '0.2em', color: ACCENT, background: `${ACCENT}1a`, boxShadow: `inset 0 0 0 1px ${ACCENT}38` }}>
            <Repeat2 aria-hidden strokeWidth={2.5} style={{ width: '1.1em', height: '1.1em' }} />
            {t('partyPlay.tv.handoverEyebrow', 'Handy weitergeben')}
          </span>

          <AnimatePresence mode="wait">
            <motion.div key={`${p.currentId}:${p.phase === 'covered' ? 'done' : 'on'}`} className="relative flex flex-col items-center" style={{ gap: lu(3) }}
              variants={partyMotion('spotlight', reduced)} initial="initial" animate="animate" exit="exit">
              {p.phase === 'covered' ? (
                <span className="grid place-items-center rounded-full" style={{ width: lu(24), height: lu(24), background: `radial-gradient(circle, ${ACCENT}40, transparent 70%)` }}>
                  <Check aria-hidden strokeWidth={3} style={{ width: lu(12), height: lu(12), color: '#8ff5ff' }} />
                </span>
              ) : (
                <TVPlayerAvatar id={p.currentId} name={shown.name} avatar={shown.avatar} color={shown.color} size={lu(24)} active />
              )}
              <p className="flex items-center text-center font-black text-white" style={{ fontSize: lu(6.5), gap: lu(2) }}>
                {p.phase === 'viewing' && <Eye aria-hidden strokeWidth={2.5} style={{ width: lu(6), height: lu(6), color: ACCENT }} />}
                {line}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Wer danach dran ist — aus `next` oder der Warteschlange (oeffentlich). */}
          {p.phase !== 'covered' && (shown.next || p.queueIds[0]) && (() => {
            const next = shown.next ?? lookupRoster(roster, p.queueIds[0]);
            return next ? (
              <p data-testid="tv-handover-next" className="relative font-semibold text-white/70" style={{ fontSize: lu(2.6) }}>
                {t('partyPlay.tv.nextUp', 'Als Nächstes: {{name}}', { name: next.name })}
              </p>
            ) : null;
          })()}
          {/* Kette: ✓ fertig · jetzt · offen — ohne Luecken, ohne Zeiten. */}
          <div data-testid="tv-handover-dots" className="relative flex flex-wrap items-center justify-center" style={{ gap: lu(2), maxWidth: '80vw' }}>
            {handoverDots(p).map(({ id, state }) => {
              const entry = lookupRoster(roster, id) ?? (id === p.currentId ? { name: shown.name, avatar: shown.avatar, color: shown.color } : undefined);
              return (
                <motion.div key={id} layout={!reduced} data-dot-state={state} className="relative"
                  animate={{ opacity: state === 'queued' ? 0.4 : 1, scale: state === 'current' ? 1.12 : 1 }}
                  transition={{ duration: 0.35, ease: partyEase.out }}>
                  <TVPlayerAvatar id={id} name={entry?.name ?? '?'} avatar={entry?.avatar} color={entry?.color} size={lu(7)} active={state === 'current'} />
                  {state === 'current' && !reduced && (
                    <motion.span aria-hidden className="absolute inset-0 rounded-full"
                      style={{ boxShadow: playerGlow(entry?.color || ACCENT, 'active') }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
                  )}
                  <AnimatePresence>
                    {state === 'done' && (
                      <motion.span key="check" variants={partyMotion('checkPop', reduced)} initial="initial" animate="animate" exit="exit"
                        className="absolute -bottom-1 -right-1 grid place-items-center rounded-full"
                        style={{ width: lu(3), height: lu(3), background: '#8ff5ff', color: '#060810' }}>
                        <Check aria-hidden strokeWidth={3.5} style={{ width: lu(2), height: lu(2) }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
