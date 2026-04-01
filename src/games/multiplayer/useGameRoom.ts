import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isPremium: boolean;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  players: RoomPlayer[];
  gameId: string;
  status: "lobby" | "playing" | "finished";
  settings: Record<string, unknown>;
}

type BroadcastCallback = (data: Record<string, unknown>) => void;

export interface UseGameRoomReturn {
  room: GameRoom | null;
  players: RoomPlayer[];
  roomHasPremium: boolean;
  isHost: boolean;
  myPlayerId: string;
  createRoom: (gameId: string, isPremium?: boolean, hostName?: string) => Promise<string>;
  joinRoom: (code: string, name: string, isPremium?: boolean) => Promise<void>;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  broadcast: (event: string, data: Record<string, unknown>) => void;
  onBroadcast: (event: string, callback: BroadcastCallback) => () => void;
  kickPlayer: (playerId: string) => void;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAYER_COLORS = [
  "#df8eff", "#ff6b98", "#8ff5ff", "#f9ca24", "#00b894",
  "#6c5ce7", "#fd79a8", "#e17055", "#0984e3", "#a29bfe",
  "#ff7675", "#55efc4",
] as const;

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ---------------------------------------------------------------------------
// Saved Room
// ---------------------------------------------------------------------------

export interface SavedRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  playerId: string;
  timestamp: number;
}

export function getSavedRoom(): SavedRoom | null {
  try {
    const raw = localStorage.getItem("eventbliss_active_room");
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedRoom;
    // Expire after 2 hours
    if (Date.now() - saved.timestamp > 2 * 60 * 60 * 1000) {
      localStorage.removeItem("eventbliss_active_room");
      return null;
    }
    return saved;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

// Global singleton player ID — same across all hook instances
let _globalPlayerId: string | null = null;
function getGlobalPlayerId(): string {
  if (!_globalPlayerId) _globalPlayerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return _globalPlayerId;
}

// Global singleton channel — shared across hook instances
let _globalChannel: RealtimeChannel | null = null;
let _globalListeners = new Map<string, Set<BroadcastCallback>>();

function pickColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameRoom(): UseGameRoomReturn {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(_globalChannel);
  const playerIdRef = useRef<string>(getGlobalPlayerId());
  const listenersRef = useRef<Map<string, Set<BroadcastCallback>>>(_globalListeners);

  // Host is determined dynamically — earliest player OR the room creator
  const isHost = players.length > 0
    ? players[0]?.id === playerIdRef.current
    : room?.hostId === playerIdRef.current;
  const roomHasPremium = players.some((p) => p.isPremium);

  // ---- Persist active room to localStorage ----
  useEffect(() => {
    if (room) {
      try {
        localStorage.setItem("eventbliss_active_room", JSON.stringify({
          roomCode: room.roomCode, gameId: room.gameId, hostId: room.hostId,
          playerId: playerIdRef.current, timestamp: Date.now(),
        }));
      } catch { /* ignore */ }
    }
  }, [room?.roomCode]);

  // ---- DON'T cleanup channel on unmount — keep connection alive across navigation ----
  // The channel stays open so players remain connected when navigating to a game.

  // ---- Resolve presence state into RoomPlayer[] ----
  // Host is always the player with the earliest joinedAt (first to create/join)
  const syncPlayers = useCallback((channel: RealtimeChannel, _hostIdHint: string) => {
    const state = channel.presenceState<{
      id: string;
      name: string;
      color: string;
      avatar: string;
      isReady: boolean;
      isPremium: boolean;
      joinedAt: number;
    }>();

    const sorted = Object.values(state)
      .flat()
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Host = earliest player (first to join the room)
    const actualHostId = sorted.length > 0 ? sorted[0].id : _hostIdHint;

    const mapped: RoomPlayer[] = sorted.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isHost: p.id === actualHostId,
      isReady: p.isReady,
      isPremium: p.isPremium ?? false,
    }));

    setPlayers(mapped);
    setRoom((prev) => (prev ? { ...prev, hostId: actualHostId, players: mapped } : prev));
  }, []);

  // ---- Subscribe to a channel ----
  const subscribe = useCallback(
    (
      roomCode: string,
      gameId: string,
      hostId: string,
      playerName: string,
      colorIndex: number,
      playerIsPremium: boolean = false,
    ) => {
      try {
      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const playerId = playerIdRef.current;

      const channel = supabase.channel(`game-room:${roomCode}`, {
        config: { presence: { key: playerId } },
      });

      // --- Presence sync ---
      channel.on("presence", { event: "sync" }, () => {
        syncPlayers(channel, hostId);
      });

      // --- Broadcast: game-start ---
      channel.on("broadcast", { event: "game-start" }, () => {
        setRoom((prev) =>
          prev ? { ...prev, status: "playing" } : prev,
        );
      });

      // --- Broadcast: game-end ---
      channel.on("broadcast", { event: "game-end" }, () => {
        setRoom((prev) =>
          prev ? { ...prev, status: "finished" } : prev,
        );
      });

      // --- Broadcast: kick ---
      channel.on("broadcast", { event: "kick-player" }, ({ payload }) => {
        if ((payload as { playerId: string }).playerId === playerId) {
          supabase.removeChannel(channel);
          channelRef.current = null;
          setRoom(null);
          setPlayers([]);
          setError("Du wurdest aus dem Raum entfernt.");
        }
      });

      // --- Broadcast: settings-update ---
      channel.on("broadcast", { event: "settings-update" }, ({ payload }) => {
        setRoom((prev) =>
          prev
            ? { ...prev, settings: payload as Record<string, unknown> }
            : prev,
        );
      });

      // --- Generic broadcast listener relay ---
      channel.on("broadcast", { event: "*" }, ({ event, payload }) => {
        const cbs = listenersRef.current.get(event);
        if (cbs) {
          cbs.forEach((cb) => cb(payload as Record<string, unknown>));
        }
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: playerId,
            name: playerName,
            color: pickColor(colorIndex),
            avatar: getInitial(playerName),
            isReady: playerId === hostId,
            isPremium: playerIsPremium,
            joinedAt: Date.now(),
          });
        }
      });

      channelRef.current = channel;
      _globalChannel = channel; // Keep in sync globally

      setRoom({
        roomCode,
        hostId,
        players: [],
        gameId,
        status: "lobby",
        settings: {},
      });
      } catch (err) {
        console.warn("Failed to subscribe to room:", err);
        setError("Verbindung zum Raum fehlgeschlagen.");
      }
    },
    [syncPlayers],
  );

  // ---- Public API ----

  const createRoom = useCallback(
    async (gameId: string, isPremiumPlayer: boolean = false, hostName: string = "Host"): Promise<string> => {
      setError(null);
      const code = generateRoomCode();
      const hostId = playerIdRef.current;
      subscribe(code, gameId, hostId, hostName, 0, isPremiumPlayer);
      return code;
    },
    [subscribe],
  );

  const joinRoom = useCallback(
    async (code: string, name: string, isPremiumPlayer: boolean = false): Promise<void> => {
      setError(null);
      const normalized = code.toUpperCase().trim();
      if (normalized.length !== 6) {
        setError("Ungültiger Raumcode.");
        return;
      }
      // Subscribe directly to the room — NO temporary channel.
      // Host discovery happens automatically via syncPlayers (earliest joinedAt).
      // Color is randomized to avoid collision with host.
      const colorIndex = Math.floor(Math.random() * PLAYER_COLORS.length);
      subscribe(normalized, "", "", name, colorIndex, isPremiumPlayer);
    },
    [subscribe],
  );

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      _globalChannel = null;
    }
    setRoom(null);
    setPlayers([]);
    setError(null);
    listenersRef.current.clear();
    _globalListeners.clear();
    try { localStorage.removeItem("eventbliss_active_room"); } catch { /* ignore */ }
  }, []);

  const setReady = useCallback(
    (ready: boolean) => {
      if (!channelRef.current) return;
      const presenceState = channelRef.current.presenceState<Record<string, unknown>>();
      const myKey = playerIdRef.current;
      const myState = presenceState[myKey]?.[0];
      if (myState) {
        channelRef.current.track({ ...myState, isReady: ready });
      } else {
        // Fallback: re-track with minimal state if presence entry not found
        channelRef.current.track({
          id: myKey,
          name: "Spieler",
          color: pickColor(0),
          avatar: "?",
          isReady: ready,
          isPremium: false,
          joinedAt: Date.now(),
        });
      }
    },
    [],
  );

  const startGame = useCallback(() => {
    if (!channelRef.current || !isHost) return;
    channelRef.current.send({
      type: "broadcast",
      event: "game-start",
      payload: { startedAt: Date.now() },
    });
    setRoom((prev) => (prev ? { ...prev, status: "playing" } : prev));
  }, [isHost]);

  const broadcast = useCallback(
    (event: string, data: Record<string, unknown>) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event,
        payload: data,
      });
    },
    [],
  );

  const onBroadcast = useCallback(
    (event: string, callback: BroadcastCallback): (() => void) => {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(callback);

      return () => {
        listenersRef.current.get(event)?.delete(callback);
      };
    },
    [],
  );

  const kickPlayer = useCallback(
    (playerId: string) => {
      if (!channelRef.current || !isHost) return;
      channelRef.current.send({
        type: "broadcast",
        event: "kick-player",
        payload: { playerId },
      });
    },
    [isHost],
  );

  return {
    room,
    players,
    roomHasPremium,
    isHost,
    myPlayerId: playerIdRef.current,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    broadcast,
    onBroadcast,
    kickPlayer,
    error,
  };
}
