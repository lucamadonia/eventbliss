/**
 * Deezer als Quelle für Hörproben.
 *
 * Warum nicht iTunes: Apple drosselt bei ~20 Anfragen pro Minute und IP. Für
 * einen Lauf über 1281 Songs bedeutet das über eine Stunde — und wenn das
 * Tageskontingent verbraucht ist, gar nichts mehr. Deezer erlaubt rund 50
 * Anfragen alle 5 Sekunden, braucht keinen Schlüssel und liefert dieselbe Art
 * 30-Sekunden-Ausschnitt. Derselbe Bestand ist damit in Minuten statt Stunden
 * aufgelöst.
 *
 * Die Trefferquote liegt etwas unter iTunes, deshalb bleibt iTunes als zweite
 * Instanz für das, was Deezer nicht kennt.
 */
import { artistMatches, sleep } from './itunes.mjs';

/** Deezers Grenze liegt bei ~50 Anfragen/5s. 150 ms lassen reichlich Luft. */
export const DEEZER_DELAY_MS = Number(process.env.DEEZER_DELAY || 150);

const API = 'https://api.deezer.com/search';

async function query(q, attempt = 0) {
  const url = `${API}?limit=10&q=${encodeURIComponent(q)}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    if (attempt >= 3) return null;
    await sleep(2000 * (attempt + 1));
    return query(q, attempt + 1);
  }
  // Deezer meldet Überlast mit 429 und im Rumpf mit error.code 4.
  if (res.status === 429) {
    if (attempt >= 3) return null;
    await sleep(5000 * (attempt + 1));
    return query(q, attempt + 1);
  }
  if (!res.ok) return null;
  let json;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  if (json?.error?.code === 4) {
    if (attempt >= 3) return null;
    await sleep(5000 * (attempt + 1));
    return query(q, attempt + 1);
  }
  return json;
}

/**
 * Hörprobe zu Interpret und Titel suchen.
 * Liefert `{ previewUrl, artworkUrl, deezerId, artist, title }` oder `null`.
 */
export async function deezerEnrich({ artist, title }) {
  const attempts = [
    // Streng: Feldsuche trifft genau, scheitert aber an Schreibvarianten.
    `artist:"${artist}" track:"${title}"`,
    // Locker: findet auch Umlaut- und Zusatzvarianten. Die Gegenprobe auf den
    // Interpreten verhindert, dass dabei ein fremder Titel hereinrutscht.
    `${artist} ${title}`,
  ];

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(DEEZER_DELAY_MS);
    const data = await query(attempts[i]);
    const results = data?.data ?? [];
    if (results.length === 0) continue;

    const pool = results.filter((r) => artistMatches(artist, r.artist?.name));
    // Treffer mit Hörprobe bevorzugen — ohne sie bliebe die Runde stumm.
    const hit = pool.find((r) => r.preview) || pool[0];
    if (!hit?.preview) continue;

    return {
      deezerId: hit.id ?? null,
      artist: hit.artist?.name || artist,
      title: hit.title || title,
      previewUrl: hit.preview,
      artworkUrl: hit.album?.cover_big || hit.album?.cover_medium || null,
    };
  }
  return null;
}
