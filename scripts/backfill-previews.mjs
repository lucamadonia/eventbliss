/**
 * OHRWURM — fehlende Vorschau-URLs nachziehen.
 *
 * Warum das der wichtigste Skalierungsschritt ist: Solange ein Song keine
 * gespeicherte Vorschau hat, löst JEDE Runde einen iTunes-Aufruf aus. iTunes
 * drosselt bei ~20 Anfragen pro Minute und IP, und alle Edge Functions teilen
 * sich eine Egress-IP. Ab etwa 30–40 gleichzeitigen Partien kippt das in
 * stumme Runden.
 *
 * Nach diesem Lauf macht das Spiel zur Laufzeit NULL Anfragen bei iTunes —
 * damit fällt die Obergrenze für gleichzeitige Partien weg.
 *
 * Die Altbestandssongs haben keine iTunes-Nummer, deshalb greift die schnelle
 * Sammelabfrage nicht: es sind Einzelsuchen mit ~3 s Pause. Einmalig rund eine
 * Stunde. Wiederaufnahme ist eingebaut — ein Abbruch kostet höchstens 25 Songs.
 *
 * Aufruf:
 *   EB_SERVICE_KEY=... node scripts/backfill-previews.mjs
 *   EB_SERVICE_KEY=... node scripts/backfill-previews.mjs --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { enrich, sleep, ITUNES_DELAY_MS, setThrottleReporter } from './lib/itunes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '_preview-backfill.json');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');

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
if (!SERVICE_KEY) {
  console.error('EB_SERVICE_KEY fehlt — ohne Schreibrecht ist der Lauf sinnlos.');
  console.error('Zu finden im Supabase-Dashboard unter Settings → API (service_role).');
  process.exit(1);
}

const sb = createClient(env.VITE_SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  // Bestand seitenweise laden — Supabase deckelt bei 1000 Zeilen.
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('ohrwurm_songs')
      .select('id,artist,title,country,preview_url,itunes_track_id')
      .is('preview_url', null)
      .range(from, from + PAGE - 1);
    if (error) { console.error('Laden fehlgeschlagen:', error.message); process.exit(1); }
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  console.log(`${rows.length} Songs ohne gespeicherte Vorschau`);
  if (rows.length === 0) { console.log('Nichts zu tun.'); return; }
  console.log(`Geschätzte Dauer: ~${Math.round((rows.length * ITUNES_DELAY_MS) / 60000)} Minuten\n`);

  let cache = {};
  if (existsSync(CACHE)) {
    try { cache = JSON.parse(readFileSync(CACHE, 'utf8')); } catch { cache = {}; }
  }
  const resumed = Object.keys(cache).length;
  if (resumed) console.log(`Wiederaufnahme: ${resumed} bereits aufgelöst\n`);

  setThrottleReporter((ms) =>
    process.stdout.write(`
  iTunes drosselt — warte ${Math.round(ms / 1000)}s …
`),
  );

  let found = 0;
  let missing = 0;
  let done = 0;
  const updates = [];

  for (const r of rows) {
    if (r.id in cache) {
      if (cache[r.id]) { updates.push({ id: r.id, ...cache[r.id] }); found++; } else missing++;
      continue;
    }

    const hit = await enrich({ artist: r.artist, title: r.title, market: 'DE' });
    if (hit?.previewUrl) {
      const patch = {
        preview_url: hit.previewUrl,
        artwork_url: hit.artworkUrl,
        // Track-ID nur setzen, wenn noch keine da ist — sie ist der
        // Dedup-Schlüssel und darf nicht überschrieben werden.
        ...(r.itunes_track_id ? {} : { itunes_track_id: hit.itunesTrackId }),
      };
      cache[r.id] = patch;
      updates.push({ id: r.id, ...patch });
      found++;
    } else {
      cache[r.id] = null; // Fehltreffer merken, sonst sucht man ewig neu
      missing++;
    }

    done++;
    if (done % 25 === 0) {
      writeFileSync(CACHE, JSON.stringify(cache));
      process.stdout.write(`\r  ${done}/${rows.length} · gefunden ${found} · ohne Treffer ${missing}`);
    }
    await sleep(ITUNES_DELAY_MS);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  console.log(`\r  ${done}/${rows.length} · gefunden ${found} · ohne Treffer ${missing}          \n`);

  if (DRY) { console.log('Trockenlauf — nichts geschrieben.'); return; }

  // Einzeln aktualisieren: ein Upsert würde die übrigen Spalten überschreiben,
  // und genau das darf hier nicht passieren.
  let written = 0;
  for (const u of updates) {
    const { id, ...patch } = u;
    const { error } = await sb.from('ohrwurm_songs').update(patch).eq('id', id);
    if (error) { console.error('\nSchreiben fehlgeschlagen:', error.message); break; }
    written++;
    if (written % 50 === 0) process.stdout.write(`\r  geschrieben: ${written}/${updates.length}`);
  }
  console.log(`\r  geschrieben: ${written}/${updates.length}          `);
  console.log(`\nFertig. ${written} Songs haben jetzt eine gespeicherte Vorschau.`);
  console.log(`Verbleibend ohne Vorschau: ${missing} (bei iTunes nicht auffindbar).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
