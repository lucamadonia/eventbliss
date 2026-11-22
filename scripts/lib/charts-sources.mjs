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
  //
  // Gezählt werden MÄRKTE, nicht Sprachen. Der Trockenlauf zeigte, warum: die
  // historischen Quellen decken nur drei Sprachen ab (US→en, DE/AT/CH→de,
  // FR→fr), eine Schwelle von vier SPRACHEN wäre dort unerreichbar gewesen —
  // „Love the Way You Lie" stand in fünf Ländern und wäre trotzdem nicht als
  // Welthit erkannt worden. Polnische und türkische Spieler hätten aus 25
  // Jahren Chartgeschichte praktisch nichts gesehen.
  if (markets.length >= GLOBAL_THRESHOLD || set.size >= GLOBAL_THRESHOLD) return ['*'];
  return [...set].sort();
}

const FEED_ATTEMPTS = 5;
const FEED_TIMEOUT_MS = 20000;

/**
 * Aktuelle Charts eines Marktes.
 * Liefert `{ itunesTrackId, artist, title, market, year, releaseDate, genre, artworkUrl }`.
 */
export async function collectAppleChart(market, limit = 100) {
  const url = `https://rss.marketingtools.apple.com/api/v2/${market.toLowerCase()}/music/most-played/${limit}/songs.json`;
  // Apples Feeds antworten zeitweise mit 504 oder hängen. Ohne Wiederholung
  // fällt ein ganzer Markt still aus — im Trockenlauf fehlten so 9 von 24
  // Märkten, darunter alle spanischen.
  let json = null;
  for (let attempt = 0; attempt < FEED_ATTEMPTS && !json; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2000 * attempt));
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'eventbliss-ohrwurm-charts' },
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      });
      if (res.ok) json = await res.json();
    } catch {
      // nächster Versuch
    }
  }
  if (!json) return [];
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

/**
 * Bestand so aufbereiten, dass ein Chart-Titel seinem Datensatz zugeordnet
 * werden kann: über die Track-ID, sonst über den normalisierten Namen.
 */
export function indexExisting(rows, keyOf) {
  const byTrack = new Map();
  const byKey = new Map();
  const manual = new Set();
  for (const r of rows) {
    if (r.itunes_track_id) byTrack.set(Number(r.itunes_track_id), r);
    const k = keyOf(r.artist, r.title);
    if (byKey.has(k)) byKey.get(k).push(r);
    else byKey.set(k, [r]);
    if (r.source === 'manual') manual.add(k);
  }
  return { byTrack, byKey, manual };
}

/**
 * Was geschieht mit einem Chart-Titel?
 *
 *   manual  von Hand gepflegt — bleibt unangetastet
 *   insert  unbekannt — wird neu angelegt
 *   update  steht schon im Bestand — nur Chart-Märkte und fehlende Links
 *           werden ergänzt. Jahr, Sprachen, Quelle und der Aktiv-Schalter
 *           bleiben, wie sie sind: ein vom Admin abgeschalteter Song darf
 *           durch die Charts nicht wieder auftauchen.
 *
 * Bewusst kein upsert: der Unique-Index auf itunes_track_id ist partiell, und
 * PostgREST kann einen partiellen Index nicht als Konfliktziel angeben.
 */
export function planChartWrite({ trackId, key, markets, previewUrl, artworkUrl }, index) {
  if (index.manual.has(key)) return { kind: 'manual' };
  const sameName = index.byKey.get(key) ?? [];
  const target = index.byTrack.get(trackId)
    ?? sameName.find((r) => !r.itunes_track_id)
    ?? sameName[0];
  if (!target) return { kind: 'insert' };

  const patch = { chart_markets: markets };
  // Nur ein Datensatz ohne ID bekommt eine — eine andere Fassung desselben
  // Songs behält ihre eigene ID und ihren eigenen Clip.
  const linked = !target.itunes_track_id;
  if (linked) patch.itunes_track_id = trackId;
  const sameTrack = linked || Number(target.itunes_track_id) === trackId;
  if (previewUrl && (sameTrack || !target.preview_url)) patch.preview_url = previewUrl;
  if (artworkUrl && (sameTrack || !target.artwork_url)) patch.artwork_url = artworkUrl;
  return { kind: 'update', id: target.id, patch, linked, gainedPreview: !target.preview_url && !!patch.preview_url };
}
