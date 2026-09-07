import type { RoomPlayer } from "./useGameRoom";

/**
 * Props passed to any game component when played in online mode.
 * Games receive this as an optional `online` prop — when undefined,
 * the game runs in local / pass-and-play mode as before.
 */
export interface OnlineGameProps {
  /** Always true when this object is present */
  isOnline: boolean;
  /** False while any active participant is reconnecting; suspend clocks and actions. */
  isConnected?: boolean;
  /** Whether the current device is the room host */
  isHost: boolean;
  /** The 6-char room code */
  roomCode: string;
  /** All connected players */
  players: RoomPlayer[];
  /** This device's player id */
  myPlayerId: string;
  /** Whether any player in the room has a Premium subscription */
  roomHasPremium: boolean;
  /** Send a named event + payload to all devices */
  broadcast: (event: string, data: Record<string, unknown>) => void;
  /** Encrypted personal state. Never fall back to public broadcast for secrets. */
  broadcastTo?: (playerId: string, event: string, data: Record<string, unknown>) => void;
  /** Subscribe to a named event — returns unsubscribe fn */
  onBroadcast: (event: string, cb: (data: Record<string, unknown>) => void) => () => void;
}
