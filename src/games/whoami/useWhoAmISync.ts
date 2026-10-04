import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { whoamiSnapshotFor } from './private-state';
import { snapshotRecipients } from './party-seats';

type SnapshotState = Parameters<typeof whoamiSnapshotFor>[0] & Record<string, unknown>;

/**
 * Privater Zustand je Handy: Der Host schickt jedem Platz mit eigenem Handy
 * seine Sicht (ohne die eigene Figur). Host und 🔁-Gaeste an diesem Handy
 * bekommen nie etwas — sie haben kein Geraet (`localSeats`).
 */
export function useWhoAmISync<S extends SnapshotState>(online: OnlineGameProps | undefined, state: S, localSeats: readonly string[], receive: (data: S) => void) {
  const receiveRef = useRef(receive);
  receiveRef.current = receive;
  const serialized = JSON.stringify(state);
  const localKey = localSeats.join(',');
  useEffect(() => {
    if (!online?.isHost) return;
    const parsed = JSON.parse(serialized) as S;
    for (const id of snapshotRecipients(online.players, online.myPlayerId, localSeats)) {
      online.broadcastTo?.(id, 'whoami-state', whoamiSnapshotFor(parsed, id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, online?.isHost, online?.broadcastTo, online?.players, online?.myPlayerId, localKey]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('whoami-state', data => {
      if (data.__senderId !== (online.hostPlayerId ?? online.players.find(p => p.isHost)?.id)) return;
      receiveRef.current(data as unknown as S);
    });
  }, [online?.isHost, online?.onBroadcast, online?.players]); // eslint-disable-line react-hooks/exhaustive-deps
}
