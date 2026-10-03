import { useEffect, useRef, useState } from 'react';
import { TV_STALE_MS } from '../tv/useTVConnection';
import { gameRoomSession } from './useGameRoom';
import { tvLinked } from './tv-link';


/** Is a TV in this room right now? Every device hears the TV heartbeat on the room channel. */
export function useTvLink(active: boolean): boolean {
  const [linked, setLinked] = useState(false);
  const seenAt = useRef(0);
  useEffect(() => {
    if (!active) return;
    const stop = gameRoomSession.onBroadcast('tv-ready', () => { seenAt.current = Date.now(); setLinked(true); });
    const timer = window.setInterval(() => setLinked(tvLinked(seenAt.current, Date.now(), TV_STALE_MS)), 5_000);
    return () => { stop(); window.clearInterval(timer); };
  }, [active]);
  return linked;
}
