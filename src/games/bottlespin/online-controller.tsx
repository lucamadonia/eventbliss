import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';

type Action = { allowed: boolean | string; run: (...args: never[]) => void };
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
      if (typeof data.action === 'string' && Array.isArray(data.args)) apply(data.action, data.args, data.__senderId, data.turn);
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

export function OnlineWaiting() {
  const { t } = useTranslation();
  return <div className="min-h-[100dvh] grid place-items-center bg-[#0a0e14] text-white px-6 text-center"><p>{t('games.ohrwurm.waitingForHost')}</p></div>;
}

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
    for (const player of online.players) {
      if (player.id !== online.myPlayerId) online.broadcastTo(player.id, `${game}-state`, projector.current(snapshot, player.id));
    }
  }, [online?.isHost, online?.isConnected, online?.broadcastTo, game, serialized, roster]);
  useEffect(() => {
    if (!online || online.isHost) return;
    return online.onBroadcast(`${game}-state`, data => receiver.current(data as T));
  }, [online?.isHost, online?.onBroadcast, game]);
}
