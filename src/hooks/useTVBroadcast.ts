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

export function useTVBroadcast(): TVBroadcastAPI {
  const [tvCode] = useState(() => generateCode());
  const [isActive, setIsActive] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const activate = useCallback(() => {
    if (channelRef.current) return;
    const ch = supabase.channel(`tv-room:${tvCode}`);
    ch.subscribe();
    channelRef.current = ch;
    setIsActive(true);
  }, [tvCode]);

  const deactivate = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsActive(false);
  }, []);

  const broadcastTV = useCallback((event: string, data: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event, payload: data });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { tvCode, isActive, activate, deactivate, broadcastTV };
}
