/**
 * PIXELJAGD online: der Host spiegelt Zustand und Uhr an alle Handys.
 * Der Snapshot kommt ohne `timeLeft` (sonst 60 Nachrichten pro Runde) — die Uhr
 * laeuft ueber eigene Nachrichten und stellt nach einem Reconnect die richtige
 * Restzeit wieder her.
 */
import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import type { useGameTimer } from '../engine/TimerSystem';

type Timer = ReturnType<typeof useGameTimer>;

export function usePixelRoomSync(
  online: OnlineGameProps | undefined,
  snapshot: Record<string, unknown>,
  onSnapshot: (s: Record<string, unknown>) => void,
  timer: Timer,
  timerRef: { current: Timer | null },
  tvPayload: Record<string, unknown>,
) {
  const isHost = !!online?.isHost;
  const receiver = useRef(onSnapshot);
  receiver.current = onSnapshot;

  useEffect(() => {
    if (!online?.isHost) return;
    online.broadcast('pixeljagd-timer-state', { timeLeft: timer.timeLeft, running: timer.isRunning });
  }, [online, timer.timeLeft, timer.isRunning]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('pixeljagd-timer-state', data => {
      if (typeof data.timeLeft !== 'number') return;
      timerRef.current?.reset(data.timeLeft);
      if (data.running) timerRef.current?.start();
      else timerRef.current?.pause();
    });
  }, [online, timerRef]);

  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('pixeljagd-state', { snapshot: JSON.parse(serialized) });
  }, [online, isHost, serialized]);
  useEffect(() => {
    if (!online || isHost) return;
    return online.onBroadcast('pixeljagd-state', (d) => {
      const s = (d as { snapshot?: Record<string, unknown> }).snapshot;
      if (s) receiver.current(s);
    });
  }, [online, isHost]);

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'pixeljagd', ...tvPayload });
  }, [online, isHost, tvPayload]);
}
