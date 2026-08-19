/**
 * iTunes Search API — Anreicherung für die OHRWURM-Chart-Pipeline.
 *
 * Warum direkt und nicht über die eigene Edge Function `ohrwurm-preview`:
 *  1. Die Function verwirft genau die Felder, die hier gebraucht werden
 *     (`releaseDate`, `primaryGenreName`, `trackId`).
 *  2. iTunes drosselt PRO IP bei rund 20 Anfragen je Minute. Alle Edge
 *     Functions teilen sich die Egress-IP — ein Massenlauf von dort würde die
 *     Drossel für jede laufende Partie auslösen und die stummen Runden
 *     zurückbringen, die gerade erst behoben wurden.
 *
 * Kein API-Schlüssel nötig.
 */

const BASE = 'https://itunes.apple.com/search';
const LOOKUP = 'https://itunes.apple.com/lookup';

/** Pause zwischen Anfragen. 3 s hält uns sicher unter ~20/min. */
export const ITUNES_DELAY_MS = Number(process.env.ITUNES_DELAY || 3000);

/** Wird bei jeder Drosselung gerufen. Setzt der Aufrufer, um Wartezeit zu zeigen. */
export let onThrottle = null;
export function setThrottleReporter(fn) { onThrottle = fn; }

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Normalisierung für den Künstler-Abgleich.
 *
 * Bewusst OHNE den Artikel-Strip aus `answer-match.ts`: dort ist er richtig
 * (Ratespiel), hier würde er „The Weeknd" zu „weeknd" verstümmeln und damit
 * echte Treffer verwerfen.
 */
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Dedup-Schlüssel für den Abgleich gegen den Altbestand (ohne iTunes-ID). */
export function songKey(artist, title) {
  return `${norm(artist)}|${norm(title)}`;
}

/**
 * Künstler-Gegenprobe. iTunes liefert bei einer Titelsuche gern fremde
 * Interpreten; ein falscher Song ist schlimmer als gar keiner, weil er eine
 * falsche Jahreszahl ins Spiel trägt.
 */
function artistMatches(want, got) {
  const a = norm(want);
  const b = norm(got);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

async function query(params, attempt = 0, endpoint = 'search') {
  const url = `${endpoint === 'lookup' ? LOOKUP : BASE}?${new URLSearchParams(params)}`;
  let res;
  try {
    // Zeitlimit ist Pflicht: ohne AbortSignal wartet fetch unbegrenzt, und ein
    // einziger haengender Aufruf legt einen Lauf ueber tausende Songs still.
    res = await fetch(url, {
      headers: { 'User-Agent': 'eventbliss-ohrwurm-charts' },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    if (attempt >= 5) return null;
    await sleep(5000 + attempt * 5000);
    return query(params, attempt + 1, endpoint);
  }
  // 403 ist bei iTunes das Drossel-Signal.
  if (res.status === 403 || res.status === 429) {
    if (attempt >= 5) return null;
    const wait = 30000 + attempt * 15000;
    // Sichtbar machen, sonst ist eine Drosselung von einem Absturz nicht zu
    // unterscheiden — der Aufrufer sieht in beiden Faellen nur Stillstand.
    onThrottle?.(wait);
    await sleep(wait);
    return query(params, attempt + 1, endpoint);
  }
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Sammelabfrage über die Lookup-Schnittstelle: bis zu 200 Track-IDs in EINEM
 * Aufruf.
 *
 * Das ist der große Hebel. Apples Länder-Feeds liefern die Track-ID bereits
 * mit — für diese Songs braucht es also keine Einzelsuche. 5.000 Titel kosten
 * so rund 25 Anfragen statt 5.000, und die Drossel von ~20/min spielt keine
 * Rolle mehr. Die Einzelsuche `enrich()` bleibt nur für Kandidaten ohne ID
 * (Wikipedia-Historik) nötig.
 *
 * @param {Array<number|string>} ids
 * @returns {Promise<Map<number, object>>} trackId → angereicherte Felder
 */
export async function lookupBatch(ids) {
  const out = new Map();
  const list = [...new Set(ids.filter(Boolean).map(String))];

  for (let i = 0; i < list.length; i += 200) {
    if (i > 0) await sleep(ITUNES_DELAY_MS);
    const chunk = list.slice(i, i + 200);
    const data = await query({ id: chunk.join(','), entity: 'song' }, 0, 'lookup');
    for (const hit of data?.results ?? []) {
      if (hit.wrapperType !== 'track' || !hit.trackId) continue;
      out.set(hit.trackId, {
        itunesTrackId: hit.trackId,
        artist: hit.artistName,
        title: hit.trackName,
        releaseDate: hit.releaseDate ? hit.releaseDate.slice(0, 10) : null,
        year: hit.releaseDate ? Number(hit.releaseDate.slice(0, 4)) : null,
        genre: hit.primaryGenreName || 'Pop',
        previewUrl: hit.previewUrl || null,
        artworkUrl: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100', '600x600') : null,
      });
    }
  }
  return out;
}

/**
 * Sucht einen Titel und liefert die angereicherten Felder — oder `null`, wenn
 * iTunes ihn nicht bestätigt. Nur Bestätigtes landet in der Datenbank.
 *
 * Dreistufig, wie in `ohrwurm-preview`: Zielmarkt → ohne Markt → nur Titel mit
 * Künstler-Gegenprobe.
 */
export async function enrich({ artist, title, market = 'DE' }) {
  const term = `${artist} ${title}`.trim();

  const attempts = [
    { term, media: 'music', entity: 'song', limit: '10', country: market },
    { term, media: 'music', entity: 'song', limit: '10' },
    { term: title, media: 'music', entity: 'song', limit: '25' },
  ];

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(ITUNES_DELAY_MS);
    const data = await query(attempts[i]);
    const results = data?.results ?? [];
    if (results.length === 0) continue;

    // Beim lockeren dritten Lauf ist die Gegenprobe Pflicht.
    const pool = i === 2 ? results.filter((r) => artistMatches(artist, r.artistName)) : results;
    // Treffer mit Vorschau bevorzugen — ohne sie bliebe die Runde stumm.
    const hit = pool.find((r) => r.previewUrl) || pool[0];
    if (!hit) continue;
    if (!artistMatches(artist, hit.artistName)) continue;

    return {
      itunesTrackId: hit.trackId ?? null,
      artist: hit.artistName || artist,
      title: hit.trackName || title,
      releaseDate: hit.releaseDate ? hit.releaseDate.slice(0, 10) : null,
      year: hit.releaseDate ? Number(hit.releaseDate.slice(0, 4)) : null,
      genre: hit.primaryGenreName || 'Pop',
      previewUrl: hit.previewUrl || null,
      artworkUrl: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100', '600x600') : null,
    };
  }
  return null;
}
