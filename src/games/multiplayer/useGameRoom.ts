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
  createRoom: (gameId: string, isPremium?: boolean) => Promise<string>;
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
// Helpers
// ---------------------------------------------------------------------------

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerIdRef = useRef<string>(generatePlayerId());
  const listenersRef = useRef<Map<string, Set<BroadcastCallback>>>(new Map());

  const isHost = room?.hostId === playerIdRef.current;
  const roomHasPremium = players.some((p) => p.isPremium);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // ---- Resolve presence state into RoomPlayer[] ----
  const syncPlayers = useCallback((channel: RealtimeChannel, hostId: string) => {
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

    const mapped: RoomPlayer[] = sorted.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isHost: p.id === hostId,
      isReady: p.isReady,
      isPremium: p.isPremium ?? false,
    }));

    setPlayers(mapped);
    setRoom((prev) => (prev ? { ...prev, players: mapped } : prev));
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

      setRoom({
        roomCode,
        hostId,
        players: [],
        gameId,
        status: "lobby",
        settings: {},
      });
    },
    [syncPlayers],
  );

  // ---- Public API ----

  const createRoom = useCallback(
    async (gameId: string, isPremiumPlayer: boolean = false): Promise<string> => {
      setError(null);
      const code = generateRoomCode();
      const hostId = playerIdRef.current;
      subscribe(code, gameId, hostId, "Host", 0, isPremiumPlayer);
      return code;
    },
    [subscribe],
  );

  const joinRoom = useCallback(
    async (code: string, name: string, isPremiumPlayer: boolean = false): Promise<void> => {
      setError(null);
      const normalized = code.toUpperCase().trim();
      if (normalized.length !== 6) {
        setError("Ungultiger Raumcode.");
        return;
      }

      // We join the channel; the host is determined by presence order
      // The first player tracked is the host. We subscribe and wait for
      // presence sync to tell us the host.
      const playerId = playerIdRef.current;

      const channel = supabase.channel(`game-room:${normalized}`, {
        config: { presence: { key: playerId } },
      });

      // Temporary presence sync to discover the host
      const hostPromise = new Promise<string>((resolve) => {
        channel.on("presence", { event: "sync" }, () => {
          const state = channel.presenceState<{
            id: string;
            joinedAt: number;
          }>();
          const all = Object.values(state).flat();
          if (all.length > 0) {
            const earliest = all.reduce((a, b) =>
              a.joinedAt < b.joinedAt ? a : b,
            );
            resolve(earliest.id);
          }
        });
      });

      // We need to unsubscribe this temp channel and re-subscribe properly
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const colorIndex = Object.keys(channel.presenceState()).length;
          await channel.track({
            id: playerId,
            name,
            color: pickColor(colorIndex),
            avatar: getInitial(name),
            isPremium: isPremiumPlayer,
            isReady: false,
            joinedAt: Date.now(),
          });
        }
      });

      // Wait for host discovery (with timeout)
      const timeout = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      );

      let hostId: string;
      try {
        hostId = await Promise.race([hostPromise, timeout]);
      } catch {
        supabase.removeChannel(channel);
        setError("Raum nicht gefunden oder Zeituberschreitung.");
        return;
      }

      // Remove temp channel and set up properly via subscribe()
      supabase.removeChannel(channel);
      subscribe(normalized, "", hostId, name, players.length, isPremiumPlayer);
    },
    [subscribe, players.length],
  );

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
    setError(null);
    listenersRef.current.clear();
  }, []);

  const setReady = useCallback(
    (ready: boolean) => {
      if (!channelRef.current) return;
      const state = channelRef.current.presenceState<Record<string, unknown>>();
      const myState = state[playerIdRef.current]?.[0];
      if (myState) {
        channelRef.current.track({ ...myState, isReady: ready });
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
