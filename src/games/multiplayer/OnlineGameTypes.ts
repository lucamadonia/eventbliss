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
  /** Authoritative host identity, including a moderator outside the playable roster. */
  hostPlayerId?: string;
  /** The 6-char room code */
  roomCode: string;
  /**
   * Active match players. In a controller party this is exactly the
   * participant list (incl. 🔁 guests, marked by `controlledBy`); it shrinks
   * reactively when the host removes someone mid-match.
   */
  players: RoomPlayer[];
  /** This device's player id */
  myPlayerId: string;
  /**
   * Every seat this device plays: `myPlayerId` first, then the active guests it
   * controls (the host's 🔁 guests). Use it instead of `id === myPlayerId` to
   * decide "is it my turn" and to show the HandoverScreen when the active id is
   * a guest. `myPlayerId` stays first even for a non-playing moderator host.
   * Always set by OnlineGameWrapper; optional only for hand-built test fixtures —
   * read it via `localSeats(online)`.
   */
  localPlayerIds?: string[];
  /** Guests excluded from this match (game's guestPolicy is 'sitout'). Not in `players`. */
  sittingOut?: string[];
  /**
   * Participants removed during this match (kick/leave). They are already gone
   * from `players`. Host-authoritative games should, on change: drop pending
   * inputs from these ids, and if the current turn/role belongs to one, advance
   * to the next id still in `players` (or restart the round for key roles).
   */
  removedPlayerIds?: string[];
  /** Whether any player in the room has a Premium subscription */
  roomHasPremium: boolean;
  /** Send a named event + payload to all devices */
  broadcast: (event: string, data: Record<string, unknown>) => void;
  /** Encrypted personal state. Never fall back to public broadcast for secrets. */
  broadcastTo?: (playerId: string, event: string, data: Record<string, unknown>) => void;
  /** Subscribe to a named event — returns unsubscribe fn */
  onBroadcast: (event: string, cb: (data: Record<string, unknown>) => void) => () => void;
}

/** Seats this device plays; falls back to the single own seat. */
export const localSeats = (online: Pick<OnlineGameProps, 'myPlayerId' | 'localPlayerIds'>): string[] =>
  online.localPlayerIds?.length ? online.localPlayerIds : [online.myPlayerId];
