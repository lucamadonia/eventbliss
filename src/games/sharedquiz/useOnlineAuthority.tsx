import { useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { acceptOnlineAction } from './online-action';

type Action = { allow: (sender: string, args: any[]) => boolean; run: (...args: any[]) => void };

/** All mutations run on the host; clients submit intent against a turn token. */
export function useOnlineAuthority(online: OnlineGameProps | undefined, game: string, token: string,
  actions: Record<string, Action>) {
  const current = useRef({ online, token, actions });
  current.current = { online, token, actions };
  const executing = useRef(false);
  const sequence = useRef(0);
  const instance = useRef<string | null>(null);
  if (!instance.current) instance.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const seen = useRef(new Map<string, number>());
  const busy = useRef(false);
  const consumed = useRef(new Set<string>());
  const consumedToken = useRef(token);
  const claim = (sender: string, action: string) => {
    if (consumedToken.current !== current.current.token) {
      consumed.current.clear();
      consumedToken.current = current.current.token;
    }
    if (['chooseBet', 'rerollCurrent', 'toggleAnswer'].includes(action)) return true;
    const key = `${sender}:${action}`;
    if (consumed.current.has(key)) return false;
    consumed.current.add(key);
    return true;
  };
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast(`${game}-action`, (data) => {
      const sender = data.__senderId;
      const action = current.current.actions[data.action as string];
      const args = Array.isArray(data.args) ? data.args : [];
      if (current.current.online?.isConnected === false) return;
      if (!action || busy.current || !acceptOnlineAction(data, current.current.token,
          online.players.map(p => p.id), seen.current, (id) => action.allow(id, args))) return;
      if (!claim(sender as string, data.action as string)) return;
      busy.current = true;
      executing.current = true;
      try { action.run(...args); } finally {
        executing.current = false;
        queueMicrotask(() => { busy.current = false; });
      }
    });
  }, [online?.isHost, online?.onBroadcast, game, online?.players]);
  return (action: string, args: any[] = []) => {
    const state = current.current;
    if (!state.online || executing.current) return false;
    if (state.online.isConnected === false) return true;
    if (!state.actions[action]?.allow(state.online.myPlayerId, args)) return true;
    if (state.online.isHost) return !claim(state.online.myPlayerId, action);
    state.online.broadcast(`${game}-action`, { action, args, token: state.token, seq: ++sequence.current, instance: instance.current });
    return true;
  };
}

export { default as OnlineWaiting } from '../multiplayer/OnlineWaiting';

export function useOnlineSnapshot(online: OnlineGameProps | undefined, event: string,
  snapshot: Record<string, unknown>, receive: (data: any) => void) {
  const receiveRef = useRef(receive);
  receiveRef.current = receive;
  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (online?.isHost) online.broadcast(event, JSON.parse(serialized));
  }, [online?.isHost, online?.broadcast, event, serialized]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast(event, data => {
      if (data.__senderId !== online.players.find(p => p.isHost)?.id) return;
      receiveRef.current(data);
    });
  }, [online?.isHost, online?.onBroadcast, online?.players, event]);
}

/** Send only the recipient's permitted view; shared channels never carry secrets. */
export function usePrivateSnapshot(online: OnlineGameProps | undefined, event: string,
  snapshot: Record<string, unknown>, project: (state: any, recipient: string) => Record<string, unknown>,
  receive: (data: any) => void) {
  const callbacks = useRef({ project, receive });
  callbacks.current = { project, receive };
  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (!online?.isHost) return;
    const state = JSON.parse(serialized);
    for (const recipient of online.players) {
      if (recipient.id !== online.myPlayerId) online.broadcastTo?.(recipient.id, event, callbacks.current.project(state, recipient.id));
    }
  }, [serialized, online?.isHost, online?.broadcastTo, online?.players, online?.myPlayerId, event]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast(event, data => {
      if (data.__senderId === online.players.find(p => p.isHost)?.id) callbacks.current.receive(data);
    });
  }, [online?.isHost, online?.onBroadcast, online?.players, event]);
}
