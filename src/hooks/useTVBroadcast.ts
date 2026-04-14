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

export interface TVBroadcastAPI {
  tvCode: string;
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const gameChannelRef = useRef<RealtimeChannel | null>(null);
  const onlineChannelRef = useRef<RealtimeChannel | null>(null);
  const lastStateRef = useRef<Record<string, unknown> | null>(null);
  const activatedRef = useRef(false);

  const handleTVReady = useCallback(() => {
    if (lastStateRef.current) {
      const syncPayload = { type: "broadcast" as const, event: "tv-state-sync", payload: lastStateRef.current };
      channelRef.current?.send(syncPayload);
      gameChannelRef.current?.send(syncPayload);
      onlineChannelRef.current?.send(syncPayload);
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
    if (onlineChannelRef.current) { supabase.removeChannel(onlineChannelRef.current); onlineChannelRef.current = null; }
    lastStateRef.current = null;
    activatedRef.current = false;
    setIsActive(false);
    try { sessionStorage.removeItem(TV_ACTIVE_KEY); } catch { /* ok */ }
  }, []);

  const setOnlineRoom = useCallback((code: string | null) => {
    // Remove previous online channel
    if (onlineChannelRef.current) {
      supabase.removeChannel(onlineChannelRef.current);
      onlineChannelRef.current = null;
    }
    // Add new online channel if code provided and TV is active
    if (code && activatedRef.current) {
      const ch = supabase.channel(`game-room:${code}`);
      ch.on("broadcast", { event: "tv-ready" }, handleTVReady);
      ch.subscribe();
      onlineChannelRef.current = ch;
    }
  }, [handleTVReady]);

  const broadcastTV = useCallback((event: string, data: Record<string, unknown>) => {
    const msg = { type: "broadcast" as const, event, payload: data };
    channelRef.current?.send(msg);
    gameChannelRef.current?.send(msg);
    onlineChannelRef.current?.send(msg);
    if (event === "tv-state" || event === "game-start") {
      lastStateRef.current = data;
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
      if (onlineChannelRef.current) supabase.removeChannel(onlineChannelRef.current);
    };
  }, []);

  return { tvCode, isActive, activate, deactivate, broadcastTV, setOnlineRoom };
}
