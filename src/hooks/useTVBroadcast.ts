/**
 * useTVBroadcast — persistent Supabase Realtime channels for TV output.
 *
 * Designed to wrap the ENTIRE games section (not per-game).
 * Channels survive game switches. Code persists in sessionStorage.
 * Auto-activates if previously activated in this browser session.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { stripTVMessageId, withTVMessageId } from "@/games/tv/tv-wire";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TV_CODE_KEY = "eb.tv-code";
const TV_ACTIVE_KEY = "eb.tv-active";

function generateCode(len = 6): string {
  return Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

/** Get or create a session-persistent TV code */
function getSessionTVCode(): string {
  try {
    const stored = sessionStorage.getItem(TV_CODE_KEY);
    if (stored && stored.length === 6) return stored;
    const code = generateCode();
    sessionStorage.setItem(TV_CODE_KEY, code);
    return code;
  } catch {
    return generateCode();
  }
}

/** Check if TV was previously activated in this session */
function wasActivated(): boolean {
  try { return sessionStorage.getItem(TV_ACTIVE_KEY) === "1"; } catch { return false; }
}

type TVBroadcastMessage = {
  type: "broadcast";
  event: string;
  payload: Record<string, unknown>;
};

/** A shared Supabase topic can appear in more than one ref; send it only once. */
function sendToDistinctChannels(
  channels: Array<RealtimeChannel | null>,
  message: TVBroadcastMessage,
): void {
  const sent = new Set<RealtimeChannel>();
  channels.forEach((channel) => {
    if (!channel || sent.has(channel)) return;
    sent.add(channel);
    void channel.send(message);
  });
}

export interface TVBroadcastAPI {
  tvCode: string;
  /** Code shown to the user — the online room code when in a room, else the session TV code. */
  displayCode: string;
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  broadcastTV: (event: string, data: Record<string, unknown>) => void;
  /** Set online room code — adds extra channel for online mode */
  setOnlineRoom: (code: string | null) => void;
}

export function useTVBroadcast(sessionCode?: string): TVBroadcastAPI {
  const [tvCode] = useState(() => sessionCode || getSessionTVCode());
  const [isActive, setIsActive] = useState(false);
  const [onlineCode, setOnlineCode] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  const onlineChannelRef = useRef<RealtimeChannel | null>(null);
  const lastStateRef = useRef<Record<string, unknown> | null>(null);
  const lastLeaderboardRef = useRef<Record<string, unknown> | null>(null);
  /** Buffered drawing segments (QuickDraw) so late-joining TVs don't see a blank canvas. */
  const drawingBufferRef = useRef<Record<string, unknown>[]>([]);
  const drawingRevisionRef = useRef(0);
  const DRAWING_BUFFER_MAX = 500;
  const activatedRef = useRef(false);
  // supabase.channel() dedupes by topic and returns the EXISTING instance —
  // for online rooms that is useGameRoom's channel. We must never remove a
  // channel we don't own, or we'd kill the multiplayer connection.
  const onlineChannelOwnedRef = useRef(false);
  const senderIdRef = useRef(`${Date.now().toString(36)}-${generateCode(4)}`);
  const messageSeqRef = useRef(0);
  const lastReadyHandledAtRef = useRef(0);

  const handleTVReady = useCallback(() => {
    // The TV announces itself on both compatible channel prefixes. One replay
    // reaches both listeners, so collapse the mirrored ready burst as well.
    const now = Date.now();
    if (now - lastReadyHandledAtRef.current < 250) return;
    lastReadyHandledAtRef.current = now;
    const channels = [channelRef.current, gameChannelRef.current, onlineChannelRef.current];
    if (lastStateRef.current) {
      const syncPayload = { type: "broadcast" as const, event: "tv-state-sync", payload: lastStateRef.current };
      sendToDistinctChannels(channels, syncPayload);
    }
    // Late-joining TVs also need the current leaderboard — it is only
    // broadcast once on game end, so replay it alongside the state.
    if (lastLeaderboardRef.current) {
      const lbPayload = { type: "broadcast" as const, event: "tv-leaderboard", payload: lastLeaderboardRef.current };
      sendToDistinctChannels(channels, lbPayload);
    }
    // Replay accumulated drawing strokes (QuickDraw) in one batch.
    if (drawingBufferRef.current.length > 0) {
      const drawPayload = {
        type: "broadcast" as const,
        event: "tv-drawing-sync",
        payload: withTVMessageId(
          { segments: drawingBufferRef.current },
          `${senderIdRef.current}:drawing:${drawingRevisionRef.current}`,
        ),
      };
      sendToDistinctChannels(channels, drawPayload);
    }
  }, []);

  const activate = useCallback(() => {
    if (activatedRef.current) return;
    activatedRef.current = true;

    const ch = supabase.channel(`tv-room:${tvCode}`);
    const gameCh = supabase.channel(`game-room:${tvCode}`);

    ch.on("broadcast", { event: "tv-ready" }, handleTVReady);
    gameCh.on("broadcast", { event: "tv-ready" }, handleTVReady);

    ch.subscribe();
    gameCh.subscribe();
    channelRef.current = ch;
    gameChannelRef.current = gameCh;
    setIsActive(true);

    try { sessionStorage.setItem(TV_ACTIVE_KEY, "1"); } catch { /* ok */ }
  }, [tvCode, handleTVReady]);

  const deactivate = useCallback(() => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (gameChannelRef.current) { supabase.removeChannel(gameChannelRef.current); gameChannelRef.current = null; }
    if (onlineChannelRef.current) {
      if (onlineChannelOwnedRef.current) supabase.removeChannel(onlineChannelRef.current);
      onlineChannelRef.current = null;
      onlineChannelOwnedRef.current = false;
    }
    lastStateRef.current = null;
    lastLeaderboardRef.current = null;
    activatedRef.current = false;
    setOnlineCode(null);
    setIsActive(false);
    try { sessionStorage.removeItem(TV_ACTIVE_KEY); } catch { /* ok */ }
  }, []);

  const setOnlineRoom = useCallback((code: string | null) => {
    // Same room already attached — keep the channel (avoids re-subscribe churn).
    if (code && onlineChannelRef.current && (onlineChannelRef.current as unknown as { topic: string }).topic === `realtime:game-room:${code}`) {
      return;
    }
    // Detach previous online channel (only remove it if we created it)
    if (onlineChannelRef.current) {
      if (onlineChannelOwnedRef.current) supabase.removeChannel(onlineChannelRef.current);
      onlineChannelRef.current = null;
      onlineChannelOwnedRef.current = false;
    }
    // Attach the room channel whenever a room is active — the lobby advertises
    // /tv/<roomCode>, so broadcasts must flow WITHOUT requiring the user to
    // separately tap the TV button. isActive follows automatically.
    if (code) {
      // supabase.channel() dedupes by topic: if useGameRoom already holds this
      // room's channel we get that same (joined) instance back and subscribe()
      // is a no-op. Track ownership so cleanup never removes a shared channel.
      const topic = `realtime:game-room:${code}`;
      const existed = supabase.getChannels().some((c) => (c as unknown as { topic: string }).topic === topic);
      const ch = supabase.channel(`game-room:${code}`);
      ch.on("broadcast", { event: "tv-ready" }, handleTVReady);
      if (!existed) ch.subscribe();
      onlineChannelRef.current = ch;
      onlineChannelOwnedRef.current = !existed;
      setOnlineCode(code);
      setIsActive(true);
    } else {
      setOnlineCode(null);
      if (!activatedRef.current) setIsActive(false);
    }
  }, [handleTVReady]);

  const broadcastTV = useCallback((event: string, data: Record<string, unknown>) => {
    // The same logical event may intentionally travel over both compatible
    // room prefixes. Its shared ID lets the TV collapse those mirror packets.
    const wireData = withTVMessageId(
      data,
      `${senderIdRef.current}:${++messageSeqRef.current}`,
    );
    const msg = { type: "broadcast" as const, event, payload: wireData };
    sendToDistinctChannels(
      [channelRef.current, gameChannelRef.current, onlineChannelRef.current],
      msg,
    );
    if (event === "tv-state" || event === "game-start") {
      lastStateRef.current = wireData;
      if (event === "game-start") drawingBufferRef.current = [];
    } else if (event === "tv-leaderboard") {
      lastLeaderboardRef.current = wireData;
    } else if (event === "game-end") {
      lastStateRef.current = {
        ...stripTVMessageId(lastStateRef.current || {}),
        ...wireData,
      };
    } else if (event === "tv-drawing") {
      if ((data as { type?: string }).type === "clear") {
        drawingBufferRef.current = [];
      } else {
        drawingBufferRef.current.push(data);
        if (drawingBufferRef.current.length > DRAWING_BUFFER_MAX) drawingBufferRef.current.shift();
      }
      drawingRevisionRef.current++;
    }
  }, []);

  // Auto-activate if previously activated in this session
  useEffect(() => {
    if (wasActivated() && !activatedRef.current) {
      activate();
    }
  }, [activate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (gameChannelRef.current) supabase.removeChannel(gameChannelRef.current);
      if (onlineChannelRef.current && onlineChannelOwnedRef.current) supabase.removeChannel(onlineChannelRef.current);
    };
  }, []);

  return { tvCode, displayCode: onlineCode || tvCode, isActive, activate, deactivate, broadcastTV, setOnlineRoom };
}
