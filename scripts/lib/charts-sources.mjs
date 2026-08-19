/**
 * Chart-Quellen für OHRWURM.
 *
 * Aktuell umgesetzt: Apples Länder-Feeds („meistgespielt"). Sie liefern die
 * iTunes-Track-ID gleich mit, wodurch die teure Einzelsuche entfällt.
 *
 * Die historischen Jahrescharts (Wikipedia, 2000–2024) hängen an derselben
 * Schnittstelle: eine `collectWikipedia()` muss lediglich Kandidaten in der
 * Form `{ artist, title, market, year }` liefern — der Rest der Pipeline
 * bleibt unverändert.
 */

/**
 * Markt → Sprachfassung. Ein Song erbt die Sprachen ALLER Märkte, in denen er
 * charted; ab vier von zehn gilt er als Welthit.
 */
export const MARKET_TO_LANG = {
  DE: 'de', AT: 'de', CH: 'de',
  US: 'en', GB: 'en', IE: 'en', AU: 'en', CA: 'en', NZ: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es',
  FR: 'fr',
  IT: 'it',
  NL: 'nl', BE: 'nl',
  PL: 'pl',
  PT: 'pt', BR: 'pt',
  TR: 'tr',
  SA: 'ar', AE: 'ar', EG: 'ar',
};

/**
 * Mehrsprachige Märkte werden bewusst NUR ihrer dominanten Sprache zugeordnet.
 *
 * Naheliegend wäre, die Schweiz auf de+fr+it abzubilden. Das erzeugt aber
 * Unsinn: Ein deutscher Rap-Titel, der in den Schweizer Charts steht, landete
 * dadurch in der französischen und italienischen Fassung des Spiels. Die
 * Chart-Daten sagen nicht, in welcher Sprachregion ein Titel lief — also darf
 * man es auch nicht behaupten. Gleiches gilt für Belgien und Kanada.
 */
const EXTRA_LANGS = {};

/** Alle abzufragenden Storefronts. */
export const MARKETS = Object.keys(MARKET_TO_LANG);

/** Ab wie vielen Sprachfassungen gilt ein Titel als Welthit? */
export const GLOBAL_THRESHOLD = 4;

/** Flaggen-Emoji für die `country`-Spalte. */
export function flagFor(market) {
  return market.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  );
}

/** Sprachfassungen, die aus einer Menge von Chart-Märkten folgen. */
export function langsForMarkets(markets) {
  const set = new Set();
  for (const m of markets) {
    const l = MARKET_TO_LANG[m];
    if (l) set.add(l);
    for (const extra of EXTRA_LANGS[m] ?? []) set.add(extra);
  }
  // Wer breit charted, ist ein Welthit — dann alle Sprachfassungen, auch
  // künftige. Das ist der Kern: Bekanntheit wird gemessen, nicht geraten.
  if (set.size >= GLOBAL_THRESHOLD) return ['*'];
  return [...set].sort();
}

/**
 * Aktuelle Charts eines Marktes.
 * Liefert `{ itunesTrackId, artist, title, market, year, releaseDate, genre, artworkUrl }`.
 */
export async function collectAppleChart(market, limit = 100) {
  const url = `https://rss.marketingtools.apple.com/api/v2/${market.toLowerCase()}/music/most-played/${limit}/songs.json`;
  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': 'eventbliss-ohrwurm-charts' } });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  let json;
  try {
    json = await res.json();
  } catch {
    return [];
  }
  return (json?.feed?.results ?? [])
    .filter((r) => r.id && r.artistName && r.name)
    .map((r) => ({
      itunesTrackId: Number(r.id),
      artist: r.artistName,
      title: r.name,
      market: market.toUpperCase(),
      year: r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : null,
      releaseDate: r.releaseDate ? r.releaseDate.slice(0, 10) : null,
      genre: Array.isArray(r.genres) ? (r.genres[0]?.name ?? 'Pop') : 'Pop',
      artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '600x600') : null,
    }));
}

/** Alle Märkte nacheinander. Apples Feeds sind großzügig, 300 ms genügen. */
export async function collectAllAppleCharts(markets = MARKETS, limit = 100, onProgress) {
  const out = [];
  for (const m of markets) {
    const rows = await collectAppleChart(m, limit);
    out.push(...rows);
    onProgress?.(m, rows.length);
    await new Promise((r) => setTimeout(r, 300));
  }
  return out;
}
