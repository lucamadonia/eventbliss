import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyMotion } from '@/lib/party-motion';
import { LATE_NOTICE_EVENT } from '../sharedquiz/late-intent';
import type { RoomData } from './room-types';

/**
 * Calm „zu spät“ toast (F12): the host dropped this device's input because the
 * turn had already moved on. No blame, auto-dismiss.
 */
export default function LateToast({ onBroadcast, hostId }: {
  onBroadcast: (event: string, callback: (data: RoomData) => void) => () => void; hostId?: string;
}) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const [shownAt, setShownAt] = useState(0);
  useEffect(() => onBroadcast(LATE_NOTICE_EVENT, data => { if (data.__senderId === hostId) setShownAt(Date.now()); }), [onBroadcast, hostId]);
  useEffect(() => {
    if (!shownAt) return;
    const timer = setTimeout(() => setShownAt(0), 2800);
    return () => clearTimeout(timer);
  }, [shownAt]);
  return (
    <AnimatePresence>
      {shownAt > 0 && (
        <motion.div key={shownAt} role="status" data-testid="late-toast" variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate" exit="exit"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[95] mx-auto flex w-fit max-w-[calc(100vw-32px)] items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'rgba(12,11,23,0.92)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <Clock className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          {t('partyPlay.tooLate', 'Zu spät – die Runde ist schon weiter')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
