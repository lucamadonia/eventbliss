import { useCallback, useEffect, useRef } from 'react';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { privateRecipients } from '../multiplayer/private-recipients';
import { reportLateIntent } from '../sharedquiz/late-intent';

/**
 * `answer`: a vote/choice that closes with its turn — a late one gets the „zu spät“ notice (F12).
 * A function decides from (staleTurn, currentTurn) whether the turn really closed (not just a sub-tick like the next card).
 */
export type AnswerRule = boolean | ((staleTurn: string, currentTurn: string) => boolean);
type Action = { allowed: boolean | string; run: (...args: never[]) => void; answer?: AnswerRule };
export const answerClosed = (rule: AnswerRule | undefined, stale: unknown, current: string) =>
  typeof rule === 'function' ? typeof stale === 'string' && rule(stale, current) : !!rule;
export function canAct(online: OnlineGameProps, allowed: boolean | string, sender: unknown): boolean {
  if (typeof sender !== 'string') return false;
  const hostId = online.hostPlayerId ?? online.players.find(p => p.isHost)?.id;
  if (allowed === 'host') return sender === hostId;
  if (allowed !== true && allowed !== sender) {
    // A 🔁 guest's turn is played on the device that controls the seat (host phone).
    return typeof allowed === 'string' && online.players.some(p => p.id === allowed && p.controlledBy === sender);
  }
  return online.players.some(p => p.id === sender);
}

/** Host validates the authenticated sender and current turn, never client scores. */
export function useOnlineActions(online: OnlineGameProps | undefined, game: string, turn: string, actions: Record<string, Action>) {
  const latest = useRef({ online, turn, actions });
  latest.current = { online, turn, actions };
  const apply = useCallback((name: string, args: unknown[], sender: unknown, expectedTurn: unknown) => {
    const current = latest.current;
    const action = current.actions[name];
    if (!action || expectedTurn !== current.turn || !current.online || current.online.isConnected === false || !canAct(current.online, action.allowed, sender)) return;
    action.run(...args as never[]);
  }, []);
  useEffect(() => {
    if (!online?.isHost) return;
    return online.onBroadcast(`${game}-action`, data => {
      if (typeof data.action !== 'string' || !Array.isArray(data.args)) return;
      // Intent for a turn that already moved on: dropped, traced, the sender sees „zu spät“ (F12).
      if (latest.current.online && reportLateIntent(latest.current.online, { __senderId: data.__senderId, token: data.turn }, latest.current.turn, answerClosed(latest.current.actions[data.action]?.answer, data.turn, latest.current.turn))) return;
      apply(data.action, data.args, data.__senderId, data.turn);
    });
  }, [online?.isHost, online?.onBroadcast, game, apply]);
  const dispatch = useCallback((name: string, ...args: unknown[]) => {
    const current = latest.current;
    if (!current.online) { current.actions[name]?.run(...args as never[]); return; }
    if (current.online.isConnected === false || !canAct(current.online, current.actions[name]?.allowed ?? false, current.online.myPlayerId)) return;
    if (current.online.isHost) apply(name, args, current.online.myPlayerId, current.turn);
    else current.online.broadcast(`${game}-action`, { action: name, args, turn: current.turn });
  }, [apply, game]);
  return Object.assign(dispatch, { can: (name: string) => {
    const current = latest.current;
    return !current.online || (current.online.isConnected !== false && canAct(current.online, current.actions[name]?.allowed ?? false, current.online.myPlayerId));
  } });
}

export { default as OnlineWaiting } from '../multiplayer/OnlineWaiting';

export function useOnlineSnapshot<T extends Record<string, unknown>>(online: OnlineGameProps | undefined, game: string, state: T, receive: (state: T) => void) {
  const receiver = useRef(receive);
  receiver.current = receive;
  const serialized = JSON.stringify(state);
  useEffect(() => {
    if (online?.isHost && online.isConnected !== false) online.broadcast(`${game}-state`, JSON.parse(serialized));
  }, [online?.isHost, online?.isConnected, online?.broadcast, game, serialized]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast(`${game}-state`, data => receiver.current(data as T));
  }, [online?.isHost, online?.onBroadcast, game]);
}

/** Per-device encrypted snapshots: hidden cards never enter the public room stream. */
export function useOnlinePrivateSnapshot<T extends Record<string, unknown>>(online: OnlineGameProps | undefined, game: string, state: T, project: (state: T, playerId: string) => T, receive: (state: T) => void) {
  const receiver = useRef(receive);
  receiver.current = receive;
  const projector = useRef(project);
  projector.current = project;
  const serialized = JSON.stringify(state);
  const roster = online?.players.map(p => p.id).join(',');
  useEffect(() => {
    if (!online?.isHost || online.isConnected === false || !online.broadcastTo) return;
    const snapshot = JSON.parse(serialized) as T;
    // Own-device seats only: guests' private views stay on this device (handover reveal), never on the wire.
    for (const player of privateRecipients(online.players, online.myPlayerId)) online.broadcastTo(player.id, `${game}-state`, projector.current(snapshot, player.id));
  }, [online?.isHost, online?.isConnected, online?.broadcastTo, game, serialized, roster]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast(`${game}-state`, data => receiver.current(data as T));
  }, [online?.isHost, online?.onBroadcast, game]);
}
