// OHRWURM — Wiedergabe-Abstraktion.
//
// Zwei Modi:
//  - 'preview' : verdeckte 30s-Vorschau (iTunes), Standard, überall (Web + App).
//  - 'spotify' : verdeckte Vollversion via Spotify App Remote (Premium, nur
//                native). Erfordert das native Bridge-Plugin (native-plugins/
//                ohrwurm-spotify) + installierte Spotify-App + Premium + eine
//                Spotify-Developer-App (Client ID). Fehlt etwas → Fallback Preview.

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { Song } from './ohrwurm-engine';

export type PlaybackMode = 'preview' | 'spotify';

/**
 * Spotify Developer App Client ID (kein Secret — steckt ohnehin in jeder
 * Mobile-App). Override via .env VITE_SPOTIFY_CLIENT_ID möglich.
 */
const SPOTIFY_CLIENT_ID =
  (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ?? '370afb4c06fc4e67b5f5e7687604d5d5';
/** Muss in der Spotify-Developer-App als Redirect-URI registriert sein. */
const SPOTIFY_REDIRECT_URL = 'eventbliss://spotify-callback';

/** Native Spotify-App-Remote-Bridge (Capacitor-Plugin OhrwurmSpotify). */
export interface SpotifyBridge {
  play(uri: string): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  disconnect(): Promise<void>;
}

interface NativeSpotifyPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  connect(o: { clientId: string; redirectUrl: string }): Promise<{ connected: boolean }>;
  play(o: { uri: string }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Liefert die native Spotify-Bridge, falls verbunden — sonst null (→ Fallback).
 * Voraussetzungen: native Plattform + Plugin installiert + Client ID gesetzt +
 * Spotify-App installiert + Premium-Login erfolgreich.
 */
export async function getSpotifyBridge(): Promise<SpotifyBridge | null> {
  if (!Capacitor.isNativePlatform() || !SPOTIFY_CLIENT_ID) return null;
  const plugin = (Capacitor as unknown as { Plugins?: Record<string, unknown> })
    .Plugins?.OhrwurmSpotify as NativeSpotifyPlugin | undefined;
  if (!plugin) return null;
  try {
    const { available } = await plugin.isAvailable();
    if (!available) return null;
    const { connected } = await plugin.connect({ clientId: SPOTIFY_CLIENT_ID, redirectUrl: SPOTIFY_REDIRECT_URL });
    if (!connected) return null;
    return {
      play: (uri) => plugin.play({ uri }),
      pause: () => plugin.pause(),
      resume: () => plugin.resume(),
      disconnect: () => plugin.disconnect(),
    };
  } catch {
    return null;
  }
}

/** Löst Künstler+Titel zu einer Spotify-Track-URI auf (Edge Function). */
export async function resolveSpotifyUri(song: Song): Promise<string | null> {
  try {
    const { data } = await supabase.functions.invoke('ohrwurm-spotify-track', {
      body: { artist: song.artist, title: song.title },
    });
    return (data as { uri?: string | null } | null)?.uri ?? null;
  } catch {
    return null;
  }
}

/**
 * Kann der Spotify-Premium-Modus grundsätzlich angeboten werden?
 * Nur native Plattform (Web-SDK funktioniert in der nativen WebView nicht).
 */
export function spotifyModePossible(): boolean {
  return Capacitor.isNativePlatform();
}
