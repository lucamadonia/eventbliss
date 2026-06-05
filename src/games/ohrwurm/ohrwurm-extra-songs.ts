// OHRWURM — lädt die vom Admin gepflegten Songs (Tabelle ohrwurm_songs) und
// schaltet sie zur statischen Liste hinzu. Gefiltert nach Sprache.

import { supabase } from '@/integrations/supabase/client';
import { setExtraSongs, spotifySearchUrl, spotifyTrackUrl, type Song } from './ohrwurm-content';

interface Row {
  id: string;
  year: number;
  artist: string;
  title: string;
  country: string | null;
  genre: string | null;
  language: string;
  spotify_uri: string | null;
}

/**
 * Aktive DB-Songs laden (optional nach Sprache gefiltert) und zuschalten.
 * Gibt die Anzahl zurück. Fehler werden geschluckt (Spiel läuft mit der
 * statischen Liste weiter).
 */
export async function loadExtraSongs(language?: string): Promise<number> {
  try {
    let q = (supabase.from as never as (t: string) => any)('ohrwurm_songs')
      .select('*')
      .eq('is_active', true);
    if (language) q = q.eq('language', language);
    const { data } = await q;
    const rows = (data ?? []) as Row[];
    const songs: Song[] = rows.map((r) => ({
      id: 'db-' + r.id,
      year: Number(r.year),
      artist: r.artist,
      title: r.title,
      flag: r.country || '🌍',
      genre: r.genre || 'Pop',
      // Mit hinterlegter URI → Track direkt öffnen; sonst Such-Fallback.
      qrPayload: r.spotify_uri ? spotifyTrackUrl(r.spotify_uri) : spotifySearchUrl(r.artist, r.title),
      spotifyUri: r.spotify_uri || undefined,
    }));
    setExtraSongs(songs);
    return songs.length;
  } catch {
    return 0;
  }
}
