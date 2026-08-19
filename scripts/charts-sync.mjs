/**
 * OHRWURM — Chart-Pipeline.
 *
 *   Phase 1  Sammeln    Apples Länder-Feeds je Markt
 *   Phase 2  Anreichern iTunes-Sammelabfrage (200 IDs pro Aufruf)
 *   Phase 3  Verdichten nach Track-ID gruppieren, chart_markets vereinigen
 *   Phase 4  Zuordnen   languages aus chart_markets ableiten (≥4 ⇒ ['*'])
 *   Phase 5  Schreiben  upsert in 200er-Blöcken, onConflict itunes_track_id
 *
 * Aufruf:
 *   node scripts/charts-sync.mjs --dry-run              # nichts schreiben
 *   node scripts/charts-sync.mjs --markets DE,AT,US
 *   node scripts/charts-sync.mjs --limit 100
 *
 * Datenbankzugang: Service-Role-Key aus EB_SERVICE_KEY (umgeht RLS).
 * Der Key steht NICHT im Repository.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { lookupBatch, songKey } from './lib/itunes.mjs';
import { collectAllAppleCharts, langsForMarkets, flagFor, MARKETS } from './lib/charts-sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROGRESS = join(ROOT, 'scripts', '_charts-progress.json');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const DRY = has('--dry-run');
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
  const byTrack = new Set();
  const byKey = new Set();
  const manual = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('ohrwurm_songs')
      .select('itunes_track_id,artist,title,source')
      .range(from, from + PAGE - 1);
    if (error) throw new Error('Bestand laden fehlgeschlagen: ' + error.message);
    for (const r of data) {
      if (r.itunes_track_id) byTrack.add(Number(r.itunes_track_id));
      const k = songKey(r.artist, r.title);
      byKey.add(k);
      if (r.source === 'manual') manual.add(k);
    }
    if (data.length < PAGE) break;
  }
  return { byTrack, byKey, manual };
}

async function main() {
  log(`OHRWURM Chart-Sync${DRY ? ' (Trockenlauf — es wird nichts geschrieben)' : ''}`);
  log(`Märkte: ${MARKET_LIST.length} · je ${LIMIT} Titel\n`);

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
  const { byTrack, byKey, manual } = await loadExisting();
  log(`Bestand: ${byTrack.size} mit Track-ID, ${byKey.size} Titel gesamt\n`);

  // --- Phase 4: Zuordnen --------------------------------------------------
  const rows = [];
  let skippedNoItunes = 0;
  let skippedManual = 0;
  let skippedDupe = 0;
  let globalHits = 0;

  for (const [trackId, chart] of grouped) {
    const it = enriched.get(trackId);
    // Nur schreiben, was iTunes bestätigt — sonst droht eine falsche Jahreszahl.
    if (!it) { skippedNoItunes++; continue; }

    const key = songKey(it.artist, it.title);
    // Von Hand gepflegte Songs bleiben unangetastet.
    if (manual.has(key)) { skippedManual++; continue; }
    // Altbestand ohne Track-ID: nicht doppelt anlegen.
    if (!byTrack.has(trackId) && byKey.has(key)) { skippedDupe++; continue; }

    const markets = [...chart.markets].sort();
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

  log(`Phase 4: ${rows.length} Datensätze bereit`);
  log(`  davon Welthits (alle Sprachen): ${globalHits}`);
  log(`  übersprungen — nicht bei iTunes: ${skippedNoItunes}`);
  log(`  übersprungen — von Hand gepflegt: ${skippedManual}`);
  log(`  übersprungen — bereits im Bestand: ${skippedDupe}`);
  log(`  ohne Vorschau (blieben stumm): ${rows.filter((r) => !r.preview_url).length}`);

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
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await sb
      .from('ohrwurm_songs')
      .upsert(chunk, { onConflict: 'itunes_track_id' });
    if (error) { console.error('\nSchreiben fehlgeschlagen:', error.message); break; }
    written += chunk.length;
    writeFileSync(PROGRESS, JSON.stringify({ at: new Date().toISOString(), written }, null, 2));
    process.stdout.write(`\r  geschrieben: ${written}/${rows.length}`);
  }
  log(`\n\nFertig. ${written} Datensätze geschrieben.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
