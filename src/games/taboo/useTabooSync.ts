import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { tabooRecipients } from './taboo-seats';

/**
 * Verschluesselter Zustand je GERAET (nicht je Platz): Der Host schickt jedem
 * Handy seine eigene Sicht (`project`). 🔁-Gaeste haben kein Geraet und
 * bekommen nie eine Sendung — ihre Sicht entsteht am Host-Handy selbst
 * (Halter-Regel in taboo-seats). Handys nehmen nur Zustaende vom Host an.
 */
export function useTabooSync<T extends Record<string, unknown>>(
  online: OnlineGameProps | undefined,
  localIds: readonly string[],
  state: T,
  project: (state: T, recipient: string) => T,
  receive: (state: T) => void,
) {
  const receiver = useRef(receive);
  receiver.current = receive;
  const projector = useRef(project);
  projector.current = project;
  const serialized = JSON.stringify(state);
  const roster = online?.players.map(p => `${p.id}:${p.controlledBy ?? ''}`).join(',');
  const local = localIds.join(',');
  useEffect(() => {
    if (!online?.isHost || online.isConnected === false || !online.broadcastTo) return;
    const snapshot = JSON.parse(serialized) as T;
    for (const id of tabooRecipients(online.players, online.myPlayerId, localIds)) {
      online.broadcastTo(id, 'taboo-state', projector.current(snapshot, id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.isHost, online?.isConnected, online?.broadcastTo, serialized, roster, local]);
  useEffect(() => {
    if (!online || online.isHost) return;
    const hostId = online.hostPlayerId ?? online.players.find(p => p.isHost)?.id;
    return online.onBroadcast('taboo-state', data => {
      if (hostId && data.__senderId !== undefined && data.__senderId !== hostId) return;
      receiver.current(data as T);
    });
  }, [online?.isHost, online?.onBroadcast, online?.hostPlayerId]); // eslint-disable-line react-hooks/exhaustive-deps
}
