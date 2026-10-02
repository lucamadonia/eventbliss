import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { useHaptics } from '@/hooks/useHaptics';
import { partyMotion } from '@/lib/party-motion';
import { cancelKick, usePendingKick } from './kick-queue';

/** "Tom wird entfernt · Rückgängig" with a bar that drains over the undo window. */
export function KickUndoSnackbar() {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduced = !!useReducedMotion();
  const pending = usePendingKick();

  useEffect(() => { if (pending) haptics.medium(); }, [pending?.id, pending?.sendsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = pending ? Math.max(0, pending.sendsAt - Date.now()) : 0;
  const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {pending && (
          <motion.div key={`${pending.id}:${pending.sendsAt}`} role="status" aria-live="polite"
            variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate" exit="exit"
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[140] mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#16152a]/95 text-white shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <div className="flex min-h-14 items-center gap-3 ps-4 pe-2">
              <p className="min-w-0 flex-1 truncate text-sm">{t('partyPlay.kick.pending', '{{name}} wird entfernt', { name: pending.label })}</p>
              <button type="button" data-testid="kick-undo" onClick={() => { haptics.medium(); cancelKick(); }}
                className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#8ff5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10">
                <Undo2 className="h-4 w-4 rtl:-scale-x-100" aria-hidden />{t('partyPlay.undo', 'Rückgängig')}
              </button>
            </div>
            {/* Drains toward the reading start; clip-path keeps it crisp and RTL-safe. */}
            <motion.div aria-hidden className="h-1 bg-[#8ff5ff]"
              initial={{ clipPath: 'inset(0 0% 0 0%)' }} animate={{ clipPath: rtl ? 'inset(0 0% 0 100%)' : 'inset(0 100% 0 0%)' }}
              transition={{ duration: left / 1000, ease: 'linear' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
