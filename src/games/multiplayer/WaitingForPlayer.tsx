import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { partyCue, partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { WaitingDot, type LeftPlayer } from './MatchGuardOverlay';

/**
 * T13: an active participant dropped while the host is still connected. Players
 * see a calm note (no spinner, no countdown); the host gets options only after
 * the T13 delay, so a short network blip never asks anyone to decide.
 */
export default function WaitingForPlayer({ player, isHost, onContinueWithout, onBackToHost }: {
  player: LeftPlayer;
  isHost: boolean;
  onContinueWithout: () => Promise<void> | void;
  onBackToHost: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setShowOptions(false);
    if (!isHost) return;
    const timer = setTimeout(() => setShowOptions(true), partyCue('T13', 'host').delayMs ?? 30_000);
    return () => clearTimeout(timer);
  }, [isHost, player.id]);
  const run = (action: () => Promise<void> | void, reportFailure = false) => async () => {
    if (busy) return;
    setBusy(true); setFailed(false);
    try { await action(); } catch { setFailed(reportFailure); } finally { setBusy(false); }
  };
  return (
    <motion.div variants={partyMotion('scrimFade', reduced)} initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: 'rgba(5,5,12,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p role="status" data-testid="waiting-for-player" data-player-id={player.id}
          className="mx-auto mb-3 flex w-fit items-center gap-3 rounded-full px-4 py-2 text-sm text-white"
          style={{ backgroundColor: '#0c0b17', border: '1px solid rgba(255,255,255,0.08)' }}>
          <WaitingDot color={player.color} />
          {t('partyPlay.waitingFor', 'Warte auf {{name}} …', { name: player.name })}
        </p>
        <AnimatePresence>
          {showOptions && (
            <motion.div variants={partyMotion('sheetEnter', reduced)} initial="initial" animate="animate" exit="exit"
              onAnimationComplete={() => primary.current?.focus()}
              data-testid="stuck-options" role="dialog" aria-modal="true" aria-labelledby="stuck-title"
              className="space-y-3 rounded-[28px] p-5 text-white" style={{ backgroundColor: '#0c0b17', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 id="stuck-title" className="text-lg font-extrabold font-game">{t('partyPlay.stuckTitle', '{{name}} ist nicht erreichbar', { name: player.name })}</h2>
              <motion.button ref={primary} type="button" disabled={busy} onClick={run(onContinueWithout)} {...pressable}
                data-testid="stuck-continue-without" className="w-full rounded-2xl bg-white text-base font-bold text-[#0b0b12] disabled:opacity-60"
                animate={failed && !reduced ? { boxShadow: [playerGlow('#ffffff', 'active'), '0 0 0 0 rgba(255,255,255,0)'] } : undefined}
                transition={{ duration: 1 }}
                style={{ minHeight: 64 }}>
                {t('partyPlay.continueWithout', 'Ohne {{name}} weiterspielen', { name: player.name })}
              </motion.button>
              <motion.button type="button" disabled={busy} onClick={run(onBackToHost, true)} {...pressable}
                data-testid="stuck-to-host" className="w-full rounded-2xl text-base font-bold text-white disabled:opacity-60"
                style={{ minHeight: 64, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {t('partyPlay.seatToHost', '{{name}} spielt am Host-Handy weiter', { name: player.name })}
              </motion.button>
              {failed && (
                <motion.p role="status" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate"
                  className="text-center text-sm text-white/85">
                  {t('partyPlay.seatToHostLater', 'Geht erst nach dieser Runde – spielt solange ohne weiter.')}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
