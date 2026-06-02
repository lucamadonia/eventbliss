// OHRWURM — Wiedergabe-Abstraktion.
//
// Zwei Modi:
//  - 'preview' : verdeckte 30s-Vorschau (iTunes), Standard, überall (Web + App).
//  - 'spotify' : verdeckte Vollversion via Spotify App Remote (Premium, nur
//                native). Erfordert das native Bridge-Plugin (native-plugins/
//                ohrwurm-spotify) + installierte Spotify-App + Premium + eine
//                Spotify-Developer-App (Client ID). Fehlt etwas → Fallback Preview.

import { Capacitor, registerPlugin } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { Song } from './ohrwurm-engine';

export type PlaybackMode = 'preview' | 'spotify';

/**
 * Spotify Developer App Client ID (kein Secret — steckt ohnehin in jeder
 * Mobile-App). Override via .env VITE_SPOTIFY_CLIENT_ID möglich.
 */
const SPOTIFY_CLIENT_ID =
  (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ?? '0f3fe9b6275f4742b7fc508c7d8c7cd3';
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

// Capacitor-Standard: registerPlugin routet zur nativen Implementierung (das
// veraltete Capacitor.Plugins.X ist unzuverlässig, wenn die App registerPlugin
// nie aufruft — war der Grund, warum die Bridge auf iOS „nicht verfügbar" war).
const OhrwurmSpotify = registerPlugin<NativeSpotifyPlugin>('OhrwurmSpotify');

export interface SpotifyBridgeResult {
  bridge: SpotifyBridge | null;
  /** Diagnose-Grund (ok / web / spotify_app_fehlt / connect_false / auth:… / err:…). */
  reason: string;
}

/**
 * Verbindet die native Spotify-Bridge. Gibt bridge=null + Grund zurück, damit
 * der Fehlschlag im Spiel sichtbar gemacht werden kann.
 */
export async function getSpotifyBridge(): Promise<SpotifyBridgeResult> {
  if (!Capacitor.isNativePlatform()) return { bridge: null, reason: 'web' };
  if (!SPOTIFY_CLIENT_ID) return { bridge: null, reason: 'no_client_id' };

  let available: boolean;
  try {
    const res = await OhrwurmSpotify.isAvailable();
    available = res.available;
  } catch (e) {
    // z.B. „not implemented" = natives Plugin nicht registriert
    return { bridge: null, reason: 'err:' + msg(e) };
  }
  if (!available) return { bridge: null, reason: 'spotify_app_fehlt' };

  try {
    const { connected } = await OhrwurmSpotify.connect({
      clientId: SPOTIFY_CLIENT_ID,
      redirectUrl: SPOTIFY_REDIRECT_URL,
    });
    if (!connected) return { bridge: null, reason: 'connect_false' };
  } catch (e) {
    return { bridge: null, reason: 'auth:' + msg(e) };
  }

  return {
    reason: 'ok',
    bridge: {
      play: (uri) => OhrwurmSpotify.play({ uri }),
      pause: () => OhrwurmSpotify.pause(),
      resume: () => OhrwurmSpotify.resume(),
      disconnect: () => OhrwurmSpotify.disconnect(),
    },
  };
}

function msg(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  return m.slice(0, 60);
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
