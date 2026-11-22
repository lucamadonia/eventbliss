/**
 * OHRWURM — Chart-Pipeline.
 *
 *   Phase 1  Sammeln    Apples Länder-Feeds je Markt
 *   Phase 2  Anreichern iTunes-Sammelabfrage (200 IDs pro Aufruf)
 *   Phase 3  Verdichten nach Track-ID gruppieren, chart_markets vereinigen
 *   Phase 4  Zuordnen   languages aus chart_markets ableiten (≥4 ⇒ ['*'])
 *   Phase 5  Schreiben  neue Titel anlegen; im Bestand nur Chart-Märkte und
 *                       fehlende Links (Track-ID, Clip, Cover) ergänzen
 *
 * Aufruf:
 *   node scripts/charts-sync.mjs --dry-run              # nichts schreiben
 *   node scripts/charts-sync.mjs --markets DE,AT,US
 *   node scripts/charts-sync.mjs --limit 100
 *
 * Datenbankzugang: Service-Role-Key aus EB_SERVICE_KEY (umgeht RLS).
 * Der Key steht NICHT im Repository.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { lookupBatch, enrich, songKey, sleep, ITUNES_DELAY_MS } from './lib/itunes.mjs';
import { collectWikipedia, WIKI_MARKETS } from './lib/wikipedia-charts.mjs';
import {
  collectAllAppleCharts, langsForMarkets, flagFor, MARKETS, indexExisting, planChartWrite,
} from './lib/charts-sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROGRESS = join(ROOT, 'scripts', '_charts-progress.json');
// Zwischenspeicher der iTunes-Einzeltreffer. Ohne ihn müsste ein abgebrochener
// Backfill komplett von vorn laufen — bei 3 s je Anfrage wären das Stunden.
const CACHE = join(ROOT, 'scripts', '_charts-enriched.json');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const DRY = has('--dry-run');
// Historischer Backfill statt laufender Charts.
const HISTORY = has('--history');
const FROM_YEAR = Number(val('--from', '2000'));
const TO_YEAR = Number(val('--to', String(new Date().getFullYear() - 1)));
const LIMIT = Number(val('--limit', '100'));
const MARKET_LIST = val('--markets', '')
  ? val('--markets', '').split(',').map((m) => m.trim().toUpperCase())
  : MARKETS;

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const SERVICE_KEY = process.env.EB_SERVICE_KEY;
if (!DRY && !SERVICE_KEY) {
  console.error('EB_SERVICE_KEY fehlt. Ohne ihn kann nur --dry-run laufen.');
  process.exit(1);
}

// Im Trockenlauf ohne Service-Key trotzdem lesen: die öffentliche Leseregel
// deckt aktive Songs ab. Nur so zeigt der Trockenlauf echte Dubletten-Zahlen
// statt einer nichtssagenden Null.
const sb = createClient(
  env.VITE_SUPABASE_URL,
  (!DRY && SERVICE_KEY) ? SERVICE_KEY : (SERVICE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY),
  { auth: { persistSession: false } },
);

const log = (...a) => console.log(...a);

/** Bestand laden — seitenweise, weil Supabase bei 1000 Zeilen deckelt. */
async function loadExisting() {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('ohrwurm_songs')
      .select('id,itunes_track_id,artist,title,source,preview_url,artwork_url,chart_markets')
      // Feste Reihenfolge — ohne sie kann eine Zeile zwischen zwei Seiten fehlen.
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error('Bestand laden fehlgeschlagen: ' + error.message);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return { ...indexExisting(rows, songKey), rows };
}

/** Neue Titel in Blöcken anlegen. Gibt die Zahl der geschriebenen Zeilen zurück. */
async function insertRows(rows) {
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await sb.from('ohrwurm_songs').insert(chunk);
    if (error) throw new Error(`Anlegen fehlgeschlagen nach ${written} Zeilen: ${error.message}`);
    written += chunk.length;
    writeFileSync(PROGRESS, JSON.stringify({ at: new Date().toISOString(), written }, null, 2));
    process.stdout.write(`\r  neu angelegt: ${written}/${rows.length}`);
  }
  return written;
}

async function main() {
  log(`OHRWURM Chart-Sync${DRY ? ' (Trockenlauf — es wird nichts geschrieben)' : ''}`);
  log(`Märkte: ${MARKET_LIST.length} · je ${LIMIT} Titel\n`);

  if (HISTORY) return runHistory();

  // --- Phase 1: Sammeln ---------------------------------------------------
  const raw = await collectAllAppleCharts(MARKET_LIST, LIMIT, (m, n) =>
    process.stdout.write(`  ${m}:${n}`),
  );
  log(`\n\nPhase 1: ${raw.length} Chart-Einträge gesammelt`);

  // --- Phase 3 (vorgezogen): nach Track-ID verdichten ---------------------
  // Ein Titel steht oft in mehreren Ländern — genau daraus entsteht die
  // Sprachzuordnung.
  const grouped = new Map();
  for (const r of raw) {
    const g = grouped.get(r.itunesTrackId);
    if (g) g.markets.add(r.market);
    else grouped.set(r.itunesTrackId, { ...r, markets: new Set([r.market]) });
  }
  log(`Phase 3: ${grouped.size} eindeutige Titel (${raw.length - grouped.size} Mehrfachnennungen)`);

  // --- Phase 2: Anreichern ------------------------------------------------
  const enriched = await lookupBatch([...grouped.keys()]);
  log(`Phase 2: ${enriched.size} von iTunes bestätigt`);

  // --- Bestand abgleichen -------------------------------------------------
  const existing = await loadExisting();
  log(`Bestand: ${existing.byTrack.size} mit Track-ID, ${existing.byKey.size} Titel gesamt\n`);

  // --- Phase 4: Zuordnen --------------------------------------------------
  const rows = [];
  // Bestandszeile → Ergänzung. Zwei Fassungen desselben Songs können auf
  // dieselbe Zeile zeigen; ihre Märkte werden dann vereinigt.
  const updates = new Map();
  let skippedNoItunes = 0;
  let skippedManual = 0;
  let linked = 0;
  let gainedPreview = 0;
  let globalHits = 0;

  for (const [trackId, chart] of grouped) {
    const it = enriched.get(trackId);
    // Nur schreiben, was iTunes bestätigt — sonst droht eine falsche Jahreszahl.
    if (!it) { skippedNoItunes++; continue; }

    const markets = [...chart.markets].sort();
    const plan = planChartWrite({
      trackId,
      key: songKey(it.artist, it.title),
      markets,
      previewUrl: it.previewUrl,
      artworkUrl: it.artworkUrl ?? chart.artworkUrl ?? null,
    }, existing);

    // Von Hand gepflegte Songs bleiben unangetastet.
    if (plan.kind === 'manual') { skippedManual++; continue; }
    if (plan.kind === 'update') {
      const earlier = updates.get(plan.id);
      if (earlier) {
        earlier.chart_markets = [...new Set([...earlier.chart_markets, ...markets])].sort();
        continue;
      }
      updates.set(plan.id, plan.patch);
      if (plan.linked) {
        linked++;
        // Die Zeile hat jetzt eine ID — eine zweite Fassung darf sie nicht überschreiben.
        const target = existing.byKey.get(songKey(it.artist, it.title)).find((r) => r.id === plan.id);
        target.itunes_track_id = trackId;
        existing.byTrack.set(trackId, target);
      }
      if (plan.gainedPreview) gainedPreview++;
      continue;
    }

    const languages = langsForMarkets(markets);
    if (languages[0] === '*') globalHits++;

    rows.push({
      itunes_track_id: trackId,
      artist: it.artist,
      title: it.title,
      year: it.year ?? chart.year ?? new Date().getFullYear(),
      release_date: it.releaseDate ?? chart.releaseDate ?? null,
      country: flagFor(markets[0]),
      genre: it.genre || chart.genre || 'Pop',
      language: 'de', // veraltete Spalte, NOT NULL — maßgeblich ist `languages`
      languages,
      chart_markets: markets,
      preview_url: it.previewUrl,
      artwork_url: it.artworkUrl ?? chart.artworkUrl ?? null,
      source: 'apple-rss',
      is_active: true,
    });
  }

  log(`Phase 4: ${rows.length} neue Titel, ${updates.size} Bestandstitel stehen in den Charts`);
  log(`  neu — davon Welthits (alle Sprachen): ${globalHits}`);
  log(`  neu — ohne Vorschau (blieben stumm): ${rows.filter((r) => !r.preview_url).length}`);
  log(`  Bestand — Track-ID ergänzt: ${linked}`);
  log(`  Bestand — Clip-Link ergänzt: ${gainedPreview}`);
  log(`  übersprungen — nicht bei iTunes: ${skippedNoItunes}`);
  log(`  übersprungen — von Hand gepflegt: ${skippedManual}`);

  // Wer aus den Charts gefallen ist, verlässt den Bereich „Charts" — der Song
  // selbst bleibt im Spiel. Nur nach einem vollständigen Lauf: fehlen Märkte
  // (Teilauswahl, Feed-Ausfall), würde sonst der halbe Bereich geleert.
  const complete = MARKET_LIST.length === MARKETS.length && raw.length >= MARKETS.length * LIMIT * 0.9;
  const stale = complete
    ? existing.rows.filter((r) => r.chart_markets?.length && !updates.has(r.id)).map((r) => r.id)
    : [];
  log(complete
    ? `  aus den Charts gefallen: ${stale.length}`
    : '  aus den Charts gefallen: nicht geprüft (Lauf unvollständig)');

  if (DRY) {
    log('\nBeispiele:');
    for (const r of rows.slice(0, 8)) {
      log(`  ${r.year}  ${r.artist} — ${r.title}`);
      log(`         Märkte: ${r.chart_markets.join(',')} → Sprachen: ${r.languages.join(',')}`);
    }
    log('\nTrockenlauf beendet, nichts geschrieben.');
    return;
  }

  // --- Phase 5: Schreiben -------------------------------------------------
  const inserted = await insertRows(rows);
  let updated = 0;
  for (const [id, patch] of updates) {
    const { error } = await sb.from('ohrwurm_songs').update(patch).eq('id', id);
    if (error) throw new Error(`Ergänzen fehlgeschlagen (${id}) nach ${updated} Zeilen: ${error.message}`);
    updated++;
    if (updated % 25 === 0) process.stdout.write(`\r  Bestand ergänzt: ${updated}/${updates.size}`);
  }
  let cleared = 0;
  for (let i = 0; i < stale.length; i += 100) {
    const ids = stale.slice(i, i + 100);
    const { error } = await sb.from('ohrwurm_songs').update({ chart_markets: [] }).in('id', ids);
    if (error) throw new Error(`Austragen fehlgeschlagen nach ${cleared} Zeilen: ${error.message}`);
    cleared += ids.length;
  }
  log(`

Fertig. ${inserted} neu angelegt, ${updated} Bestandstitel ergänzt, ${cleared} aus den Charts ausgetragen.`);
}

/**
 * Historischer Backfill aus Wikipedia.
 *
 * Anders als bei Apples Feeds gibt es hier KEINE Track-ID — jeder Kandidat
 * braucht eine iTunes-Einzelsuche. Bei ~3 s Pause und mehreren tausend
 * Kandidaten läuft das Stunden, deshalb sind Zwischenspeicher und
 * Wiederaufnahme keine Kür, sondern Voraussetzung.
 */
async function runHistory() {
  log(`Historischer Backfill ${FROM_YEAR}–${TO_YEAR}`);
  log(`Märkte mit Jahresseiten: ${WIKI_MARKETS.join(', ')}\n`);

  const candidates = await collectWikipedia(FROM_YEAR, TO_YEAR, WIKI_MARKETS, (m, n) =>
    log(`  ${m}: ${n} Kandidaten`),
  );
  log(`\nPhase 1: ${candidates.length} Kandidaten gesammelt`);

  // Über Märkte und Jahre hinweg verdichten — die Marktmenge ist die Grundlage
  // der Sprachzuordnung.
  const byName = new Map();
  for (const c of candidates) {
    const k = songKey(c.artist, c.title);
    const g = byName.get(k);
    if (g) { g.markets.add(c.market); g.year = Math.min(g.year, c.year); }
    else byName.set(k, { ...c, markets: new Set([c.market]) });
  }
  log(`Phase 3: ${byName.size} eindeutige Titel`);

  // Zwischenspeicher laden.
  let cache = {};
  if (existsSync(CACHE)) {
    try { cache = JSON.parse(readFileSync(CACHE, 'utf8')); } catch { cache = {}; }
  }
  const cachedCount = Object.keys(cache).length;
  if (cachedCount) log(`Zwischenspeicher: ${cachedCount} bereits aufgelöst`);

  const { byTrack, byKey, manual } = await loadExisting();
  log(`Bestand: ${byKey.size} Titel\n`);

  // --- Phase 2: Anreichern (Einzelsuche) ----------------------------------
  const todo = [...byName.entries()].filter(([k]) => !(k in cache));
  log(`Phase 2: ${todo.length} noch aufzulösen (~${Math.round((todo.length * ITUNES_DELAY_MS) / 60000)} min)`);

  let done = 0;
  for (const [k, c] of todo) {
    const hit = await enrich({ artist: c.artist, title: c.title, market: c.market });
    cache[k] = hit ?? null; // auch Fehltreffer merken, sonst sucht man ewig neu
    done++;
    if (done % 25 === 0) {
      writeFileSync(CACHE, JSON.stringify(cache));
      process.stdout.write(`\r  aufgelöst: ${done}/${todo.length}`);
    }
    await sleep(ITUNES_DELAY_MS);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  log(`\r  aufgelöst: ${done}/${todo.length}          `);

  // --- Phase 4: Zuordnen --------------------------------------------------
  const rows = [];
  let noHit = 0, dupe = 0, skippedManual = 0, globalHits = 0;
  const usedTrackIds = new Set();

  for (const [k, c] of byName) {
    const it = cache[k];
    if (!it) { noHit++; continue; }
    // Verschiedene Wikipedia-Schreibweisen können auf denselben Track zeigen.
    if (usedTrackIds.has(it.itunesTrackId)) { dupe++; continue; }
    const dbKey = songKey(it.artist, it.title);
    if (manual.has(dbKey)) { skippedManual++; continue; }
    // Was der Bestand schon kennt — über ID oder Namen —, wird nicht angefasst.
    if (byTrack.has(it.itunesTrackId) || byKey.has(dbKey)) { dupe++; continue; }
    usedTrackIds.add(it.itunesTrackId);

    const markets = [...c.markets].sort();
    const languages = langsForMarkets(markets);
    if (languages[0] === '*') globalHits++;

    rows.push({
      itunes_track_id: it.itunesTrackId,
      artist: it.artist,
      title: it.title,
      // Das Chartjahr ist verlässlicher als iTunes: dort trägt eine spätere
      // Neuveröffentlichung das Datum der Wiederveröffentlichung.
      year: c.year ?? it.year,
      release_date: it.releaseDate,
      country: flagFor(markets[0]),
      genre: it.genre || 'Pop',
      language: 'de',
      languages,
      chart_markets: markets,
      preview_url: it.previewUrl,
      artwork_url: it.artworkUrl,
      source: 'wikipedia',
      is_active: true,
    });
  }

  log(`\nPhase 4: ${rows.length} Datensätze bereit`);
  log(`  Welthits (alle Sprachen): ${globalHits}`);
  log(`  nicht bei iTunes: ${noHit}`);
  log(`  Dubletten übersprungen: ${dupe}`);
  log(`  von Hand gepflegt, unangetastet: ${skippedManual}`);
  log(`  ohne Vorschau: ${rows.filter((r) => !r.preview_url).length}`);

  if (DRY) {
    log('\nBeispiele:');
    for (const r of rows.slice(0, 10)) {
      log(`  ${r.year}  ${r.artist} — ${r.title}   [${r.chart_markets.join(',')} → ${r.languages.join(',')}]`);
    }
    log('\nTrockenlauf beendet, nichts geschrieben.');
    return;
  }

  const written = await insertRows(rows);
  log(`\n\nFertig. ${written} Datensätze geschrieben.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
