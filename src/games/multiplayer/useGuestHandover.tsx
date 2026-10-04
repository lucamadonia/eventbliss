import { useEffect, useRef } from 'react';
import { useGuestHandover as useHandoverMachine, type GuestHandover } from '../ui/useGuestHandover';
import type { OnlineGameProps } from './OnlineGameTypes';

/**
 * Declarative pass-the-phone on top of the shared `ui/useGuestHandover`: the
 * game only names the seat that must act now (`activeSeat`). When it is a 🔁
 * guest this device controls, the phone is handed over first; as soon as the
 * game moves on it goes back to the host (or straight on to the next guest).
 * Removed guests drop out automatically. Phone-only groups never have local
 * guests, so nothing changes for them.
 */
export function useSeatHandover(online: OnlineGameProps | undefined, activeSeat: string | null, options: { secret?: boolean } = {}): GuestHandover {
  const handover = useHandoverMachine(online, { secret: options.secret, clockPaused: true });
  const latest = useRef(handover);
  latest.current = handover;
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const was = previous.current, h = latest.current;
    previous.current = activeSeat;
    if (was === activeSeat) return;
    // The guest finished (done) or the game moved on before they got the phone (cancel that leg).
    if (was && h.isGuest(was)) {
      if (h.activeGuest === was) h.done();
      else if (h.recipient === was) h.cancel();
    }
    if (activeSeat && h.isGuest(activeSeat)) h.request([activeSeat]);
  }, [activeSeat]);
  return handover;
}
