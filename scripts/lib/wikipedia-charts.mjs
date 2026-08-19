/**
 * Historische Jahrescharts aus Wikipedia (2000–2024).
 *
 * Warum Wikipedia: Die offiziellen Chart-Anbieter (GfK, Billboard, Official
 * Charts UK) untersagen das Auslesen in ihren Nutzungsbedingungen. Interpret,
 * Titel und Jahr sind dagegen Faktenangaben.
 *
 * WICHTIG — warum der Parser ruhig grob sein darf: Jeder Kandidat wird
 * anschließend gegen iTunes geprüft; was dort nicht bestätigt wird, landet nie
 * in der Datenbank. Ein Fehlgriff beim Zerlegen der Tabelle kostet also einen
 * Datensatz, verfälscht aber nichts. Deshalb wird bewusst großzügig extrahiert
 * statt penibel.
 *
 * Zwei Seitenstrukturen kommen vor:
 *   'table'    | 1 || "[[Tik Tok (song)|Tik Tok]]" || [[Kesha]]
 *   'template' | Titel = [[I Like]]  …  | Interpret = [[Keri Hilson]]
 *   'lines'    |[[Edward Maya]]  (eigene Zeile)  …  |''[[Stereo Love]]''
 */

const API = (lang) => `https://${lang}.wikipedia.org/w/api.php`;

/**
 * Geprüfte Seiten je Markt. Nicht aufgeführte Märkte (IT, PL, NL, PT, TR und
 * der arabische Raum) haben keine durchgängigen Jahresseiten — die füllen sich
 * über Apples laufende Charts.
 */
export const WIKI_PAGES = {
  US: (y) => ({ lang: 'en', title: `Billboard Year-End Hot 100 singles of ${y}`, mode: 'table' }),
  // GB bewusst NICHT konfiguriert: die Nummer-eins-Tabelle enthält an dieser
  // Stelle nur Fließtext-Fußnoten, kein maschinell verwertbares Raster. Für die
  // englische Sprachfassung ist das verkraftbar — die Billboard-Jahresliste
  // liefert bereits 100 Titel pro Jahr.
  DE: (y) => ({ lang: 'de', title: `Liste der Nummer-eins-Hits in Deutschland (${y})`, mode: 'template' }),
  AT: (y) => ({ lang: 'de', title: `Liste der Nummer-eins-Hits in Österreich (${y})`, mode: 'template' }),
  CH: (y) => ({ lang: 'de', title: `Liste der Nummer-eins-Hits in der Schweiz (${y})`, mode: 'template' }),
  FR: (y) => ({ lang: 'fr', title: `Liste des titres musicaux numéro un en France en ${y}`, mode: 'lines' }),
  // ES bewusst NICHT konfiguriert: die Jahresseite besteht fast nur aus
  // eingebundenen Vorlagen und enthält im Quelltext keine verwertbaren Paare.
  // Spanisch füllt sich über Apples laufende Charts.
};

export const WIKI_MARKETS = Object.keys(WIKI_PAGES);

/** Anzeigetext eines Wiki-Links: [[Ziel|Anzeige]] → Anzeige, [[X]] → X. */
function linkText(s) {
  const m = /\[\[([^\]]+)\]\]/.exec(s);
  if (!m) return null;
  const parts = m[1].split('|');
  return (parts[1] ?? parts[0]).trim();
}

/** Wiki-Ballast entfernen, der sonst in Titeln landet. */
function clean(line) {
  return line
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/'''?/g, '')
    .trim();
}

/** Nachgestellte Mitwirkende abschneiden — iTunes findet den Haupttitel besser. */
function trimArtist(a) {
  return a
    .replace(/\s+(featuring|feat\.?|ft\.?|mit|con|avec|and|&|x)\s+.*$/i, '')
    .trim();
}

async function fetchWikitext(lang, title) {
  const url = `${API(lang)}?action=parse&format=json&prop=wikitext&redirects=1&page=${encodeURIComponent(title)}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'eventbliss-ohrwurm-charts/1.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.parse?.wikitext?.['*'] ?? null;
  } catch {
    return null;
  }
}

/** Pipe-Tabellen: der in Anführungszeichen gesetzte Link ist der Titel, der nächste Link der Interpret. */
function parseTable(text) {
  const out = [];
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trimStart().startsWith('|')) continue;
    const line = clean(rawLine);
    // Der Titel steht in Anführungszeichen — das unterscheidet ihn zuverlässig
    // von Wochendaten, Labels und Chartpositionen.
    const q = /"\s*(\[\[[^\]]+\]\])\s*"/.exec(line);
    if (!q) continue;
    const title = linkText(q[1]);
    if (!title) continue;
    const rest = line.slice(q.index + q[0].length);
    const artist = linkText(rest);
    if (!artist) continue;
    out.push({ artist: trimArtist(artist), title });
  }
  return out;
}

/**
 * Vorlagen-Listen: `| Titel = …` und `| Interpret = …` stehen in eigenen
 * Zeilen und gehören paarweise zusammen. Die Reihenfolge unterscheidet sich je
 * Seite, deshalb wird gepuffert statt eine Reihenfolge anzunehmen.
 */
function parseTemplate(text) {
  const out = [];
  let title = null;
  let artist = null;
  const RE_TITLE = /^\|\s*(Titel|Title|Titre|Título)\s*=\s*(.+)$/i;
  const RE_ARTIST = /^\|\s*(Interpret|Künstler|Artist|Artiste|Artista)\s*=\s*(.+)$/i;
  for (const rawLine of text.split('\n')) {
    const line = clean(rawLine);
    const t = RE_TITLE.exec(line);
    if (t) title = linkText(t[2]) ?? t[2].trim();
    const a = RE_ARTIST.exec(line);
    if (a) artist = linkText(a[2]) ?? a[2].trim();
    if (title && artist) {
      out.push({ artist: trimArtist(artist), title });
      title = null;
      artist = null;
    }
  }
  return out;
}

/**
 * Zellen stehen je in einer eigenen Zeile (Frankreich, Spanien). Der Titel ist
 * dort KURSIV ausgezeichnet statt in Anführungszeichen — daran erkennt man ihn,
 * und der zuletzt gesehene nicht-kursive Link davor ist der Interpret.
 */
function parseLines(text) {
  const out = [];
  let lastArtist = null;
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trimStart().startsWith('|')) continue;
    // ACHTUNG: `clean()` entfernt Apostroph-Folgen — also genau die Kursiv-
    // Markierung, an der hier der Titel erkannt wird. Deshalb wird nur der
    // Ballast entfernt, die Auszeichnung bleibt stehen.
    const line = rawLine
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
      .replace(/<ref[^>]*\/>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\{\{[^{}]*\}\}/g, '')
      .trim();
    const italic = /''\s*(\[\[[^\]]+\]\])\s*''/.exec(line);
    if (italic) {
      const title = linkText(italic[1]);
      if (title && lastArtist) out.push({ artist: trimArtist(lastArtist), title });
      continue;
    }
    const link = linkText(line);
    // Datumszellen wie „3 de enero" sind zwar verlinkt, taugen aber nicht als
    // Interpret. Ziffern am Anfang sind das verlässlichste Ausschlusskriterium.
    if (link && !/^\d/.test(link)) lastArtist = link;
  }
  return out;
}

/** Kandidaten eines Marktes für ein Jahr. Leeres Array, wenn es die Seite nicht gibt. */
export async function collectWikipediaYear(market, year) {
  const cfg = WIKI_PAGES[market]?.(year);
  if (!cfg) return [];
  const text = await fetchWikitext(cfg.lang, cfg.title);
  if (!text) return [];
  const rows = cfg.mode === 'template' ? parseTemplate(text)
    : cfg.mode === 'lines' ? parseLines(text)
    : parseTable(text);
  // Innerhalb einer Seite entdoppeln — Nummer-eins-Listen nennen denselben
  // Titel für jede Woche, in der er oben stand.
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.artist || !r.title) continue;
    const k = `${r.artist.toLowerCase()}|${r.title.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...r, market, year });
  }
  return out;
}

/** Alle konfigurierten Märkte über einen Jahresbereich. */
export async function collectWikipedia(fromYear, toYear, markets = WIKI_MARKETS, onProgress) {
  const out = [];
  for (const market of markets) {
    let found = 0;
    for (let y = fromYear; y <= toYear; y++) {
      const rows = await collectWikipediaYear(market, y);
      out.push(...rows);
      found += rows.length;
      // Wikipedia bittet um Zurückhaltung; 200 ms sind großzügig genug.
      await new Promise((r) => setTimeout(r, 200));
    }
    onProgress?.(market, found);
  }
  return out;
}
