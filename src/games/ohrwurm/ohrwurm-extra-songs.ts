// OHRWURM — lädt die vom Admin gepflegten Songs (Tabelle ohrwurm_songs) und
// schaltet sie zur statischen Liste hinzu. Gefiltert nach Sprache.

import { supabase } from '@/integrations/supabase/client';
import { setBaseSongs, setExtraSongs, spotifySearchUrl, spotifyTrackUrl, type Song } from './ohrwurm-content';

interface Row {
  id: string;
  /** Gesetzt bei den importierten Grundsongs (Format "ow-0001"). */
  base_id: string | null;
  year: number;
  artist: string;
  title: string;
  country: string | null;
  genre: string | null;
  language: string;
  /** Sprachfassungen, in denen der Song erscheint. ['*'] = alle zehn. */
  languages: string[] | null;
  spotify_uri: string | null;
  /** Vorab aufgelöste iTunes-Vorschau (Chart-Pipeline). */
  preview_url: string | null;
}

/**
 * Aktive DB-Songs laden (optional nach Sprache gefiltert) und zuschalten.
 * Gibt die Anzahl zurück. Fehler werden geschluckt (Spiel läuft mit der
 * statischen Liste weiter).
 */
export async function loadExtraSongs(language?: string): Promise<number> {
  try {
    // Seitenweise laden. `.limit()` allein reicht NICHT: Supabase deckelt die
    // REST-API projektweit bei max-rows (Standard 1000). Mit 1281 Basissongs
    // fehlten sonst still ~280 — unbemerkt, weil dabei kein Fehler entsteht.
    const PAGE = 1000;
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      let q = (supabase.from as never as (t: string) => any)('ohrwurm_songs')
        .select('*')
        .eq('is_active', true)
        .range(from, from + PAGE - 1);
      // Mehrfachzuordnung: ein Song kann mehreren der zehn Sprachfassungen
      // zugewiesen sein. `&&` (overlaps) trifft, sobald sich das gepflegte
      // Array mit [aktuelle Sprache, '*'] überschneidet. '*' = überall.
      if (language) q = q.overlaps('languages', [language, '*']);
      const { data, error } = await q;
      if (error || !data) break;
      rows.push(...(data as Row[]));
      if (data.length < PAGE) break;
    }

    const toSong = (r: Row, id: string): Song => ({
      id,
      year: Number(r.year),
      artist: r.artist,
      title: r.title,
      flag: r.country || '🌍',
      genre: r.genre || 'Pop',
      // Mit hinterlegter URI → Track direkt öffnen; sonst Such-Fallback.
      qrPayload: r.spotify_uri ? spotifyTrackUrl(r.spotify_uri) : spotifySearchUrl(r.artist, r.title),
      spotifyUri: r.spotify_uri || undefined,
      previewUrl: r.preview_url || undefined,
    });

    // Zeilen mit base_id sind die importierten Grundsongs — sie ERSETZEN die
    // statische Liste (identische IDs). Alles andere sind echte Zusatzsongs.
    const base: Song[] = [];
    const extra: Song[] = [];
    for (const r of rows) {
      if (r.base_id) base.push(toSong(r, r.base_id));
      else extra.push(toSong(r, 'db-' + r.id));
    }

    setBaseSongs(base.length > 0 ? base : null);
    setExtraSongs(extra);
    return base.length + extra.length;
  } catch {
    // Datenbank nicht erreichbar → auf den Code-Bestand zurückfallen.
    setBaseSongs(null);
    return 0;
  }
}
