import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { projectVisualState, type VisualDiffScene, type VisualScene } from './visual-content';

export type FindItPublicState = Record<string, unknown> & {
  mode: string; phase: string; questionIdx: number; currentScene: VisualScene | null; currentDiff: VisualDiffScene | null;
};

/**
 * Host broadcasts the public state (solutions only on reveal) on every change and
 * answers late joiners; other phones apply it and ask once on mount.
 */
export function useFindItSync(online: OnlineGameProps | undefined, state: FindItPublicState, apply: (data: Record<string, unknown>) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const serialized = JSON.stringify(projectVisualState(state));
  const latest = useRef(serialized);
  latest.current = serialized;

  useEffect(() => {
    if (online?.isHost) online.broadcast('findit-state', JSON.parse(serialized));
  }, [online, serialized]);

  // Initial-state handshake: late joiners request current state, host replies.
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast('request-state', () => {
      if (state.phase !== 'setup') online.broadcast('findit-state', JSON.parse(latest.current));
    });
  }, [online, state.phase]);

  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast('findit-state', data => applyRef.current(data));
  }, [online]);

  const requested = useRef(false);
  useEffect(() => {
    if (!online || online.isHost || requested.current) return;
    requested.current = true;
    online.broadcast('request-state', {});
  }, [online]);
}
