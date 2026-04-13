/**
 * useTVBroadcast — creates a lightweight Supabase Realtime channel for TV output.
 * Works in OFFLINE (pass-and-play) mode. No player joining needed.
 * Just broadcasts game state so a TV screen can display it.
 *
 * Channel is created LAZILY — no Supabase connection until activate() is called.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(len = 6): string {
  return Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

export interface TVBroadcastAPI {
  tvCode: string;
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  broadcastTV: (event: string, data: Record<string, unknown>) => void;
}

export function useTVBroadcast(externalCode?: string): TVBroadcastAPI {
  const [tvCode] = useState(() => externalCode || generateCode());
  const [isActive, setIsActive] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  /** Stores the last broadcast state so we can re-send it when a TV connects late */
  const lastStateRef = useRef<Record<string, unknown> | null>(null);

  // Also broadcast on game-room: channel so TV receives via either prefix
  const gameChannelRef = useRef<RealtimeChannel | null>(null);

  const activate = useCallback(() => {
    if (channelRef.current) return;
    const ch = supabase.channel(`tv-room:${tvCode}`);
    const gameCh = supabase.channel(`game-room:${tvCode}`);

    // Listen for tv-ready from the TV screen — re-send current game state
    // so a late-connecting TV doesn't get stuck on the waiting screen.
    const handleTVReady = () => {
      if (lastStateRef.current) {
        const syncPayload = { type: "broadcast" as const, event: "tv-state-sync", payload: lastStateRef.current };
        channelRef.current?.send(syncPayload);
        gameChannelRef.current?.send(syncPayload);
      }
    };

    ch.on("broadcast", { event: "tv-ready" }, handleTVReady);
    gameCh.on("broadcast", { event: "tv-ready" }, handleTVReady);

    ch.subscribe();
    gameCh.subscribe();
    channelRef.current = ch;
    gameChannelRef.current = gameCh;
    setIsActive(true);
  }, [tvCode]);

  const deactivate = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (gameChannelRef.current) {
      supabase.removeChannel(gameChannelRef.current);
      gameChannelRef.current = null;
    }
    lastStateRef.current = null;
    setIsActive(false);
  }, []);

  const broadcastTV = useCallback((event: string, data: Record<string, unknown>) => {
    const msg = { type: "broadcast" as const, event, payload: data };
    channelRef.current?.send(msg);
    gameChannelRef.current?.send(msg);
    // Track the latest state so we can re-send it on tv-ready
    if (event === "tv-state" || event === "game-start") {
      lastStateRef.current = data;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (gameChannelRef.current) {
        supabase.removeChannel(gameChannelRef.current);
        gameChannelRef.current = null;
      }
    };
  }, []);

  return { tvCode, isActive, activate, deactivate, broadcastTV };
}
