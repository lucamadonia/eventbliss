import { useEffect, useRef } from 'react';
import { useGuestHandover, type GuestHandover } from '../ui/useGuestHandover';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

/**
 * Wie `useSeatHandover` (multiplayer/useGuestHandover.tsx), aber ohne
 * „Uhr angehalten“: GEBRÄU hat keine Zuguhr (guest-turns.ts). Das Spiel nennt
 * nur den Platz, der jetzt handeln muss; ist es ein 🔁-Gast dieses Handys,
 * wird zuerst weitergegeben, und sobald der Zug wechselt, geht das Handy
 * zurueck an den Host (oder direkt an den naechsten Gast).
 */
export function useBrewHandover(online: OnlineGameProps | undefined, activeSeat: string | null, ended = false): GuestHandover {
  const handover = useGuestHandover(online, { clockPaused: false });
  const latest = useRef(handover);
  latest.current = handover;
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const was = previous.current, h = latest.current;
    previous.current = activeSeat;
    if (was === activeSeat) return;
    // Partie vorbei: kein „Zurueck an …“ ueber dem Ergebnis — alle sehen es sofort.
    if (ended) { h.cancel(); return; }
    if (was && h.isGuest(was)) {
      if (h.activeGuest === was) h.done();
      else if (h.recipient === was) h.cancel();
    }
    if (activeSeat && h.isGuest(activeSeat)) h.request([activeSeat]);
  }, [activeSeat]); // eslint-disable-line react-hooks/exhaustive-deps
  return handover;
}
