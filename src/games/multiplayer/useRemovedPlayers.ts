import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from './OnlineGameTypes';

/**
 * Host-side hook for games that keep their own roster from match start
 * (turn order, scores): fires once per newly removed participant (kick/leave,
 * masterplan 6.6). Drop the ids from the game's players; if one of them is the
 * current turn/role, move on to the next player still in `online.players`.
 *
 *   useRemovedPlayers(online, ids => setPlayers(p => p.filter(x => !ids.includes(x.id))));
 */
export function useRemovedPlayers(online: OnlineGameProps | undefined, onRemoved: (ids: string[]) => void): void {
  const handled = useRef(new Set<string>());
  const callback = useRef(onRemoved);
  callback.current = onRemoved;
  const key = online?.removedPlayerIds?.join(',') ?? '';
  useEffect(() => {
    if (!online?.isHost) return;
    const fresh = (online.removedPlayerIds ?? []).filter(id => !handled.current.has(id));
    if (!fresh.length) return;
    fresh.forEach(id => handled.current.add(id));
    callback.current(fresh);
  }, [key, online?.isHost]); // eslint-disable-line react-hooks/exhaustive-deps
}
