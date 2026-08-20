/**
 * OHRWURM — fehlende Vorschau-URLs nachziehen.
 *
 * Warum das der wichtigste Skalierungsschritt ist: Solange ein Song keine
 * gespeicherte Vorschau hat, löst JEDE Runde einen Netzaufruf aus. Ab etwa
 * 30–40 gleichzeitigen Partien kippt das in stumme Runden. Nach diesem Lauf
 * macht das Spiel zur Laufzeit KEINE Anfragen mehr — die Obergrenze fällt weg.
 *
 * Quelle ist iTunes, obwohl Deezer dreissigmal schneller waere. Der Grund ist
 * zwingend: Deezers Vorschau-Adressen sind signiert und laufen nach ~15 MINUTEN
 * ab (`hdnea=exp=…`). Gespeichert waeren sie eine Viertelstunde spaeter tot —
 * die Datenbank haette dann fuer JEDEN Song eine kaputte Adresse statt fuer
 * einige gar keine. Apples Adressen tragen keine Signatur und bleiben gueltig;
 * nur sie sind speicherbar.
 *
 * Deezer bleibt deshalb der Wiedergabe zur Laufzeit vorbehalten (siehe
 * lib/deezer.mjs) und schreibt hier NICHTS in die Datenbank.
 *
 * iTunes drosselt bei ~20 Anfragen pro Minute und IP. Ist das Tageskontingent
 * erschoepft, haelt der Lauf sauber an — dann am naechsten Tag erneut starten.
 *
 * Aufruf:
 *   EB_SERVICE_KEY=... node scripts/backfill-previews.mjs
 *   EB_SERVICE_KEY=... node scripts/backfill-previews.mjs --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { enrich, sleep, setThrottleReporter, ThrottleError } from './lib/itunes.mjs';
import { ITUNES_DELAY_MS } from './lib/itunes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '_preview-backfill.json');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');

/** Merker für „diesmal gedrosselt" — abgrenzbar von „nirgends auffindbar". */
const THROTTLED = 'throttled';

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

/**
 * Eine dauerhaft gültige Hörprobe beschaffen.
 * Liefert ein Patch-Objekt, `THROTTLED` oder `null` (endgültig nicht gefunden).
 */
async function resolveOne(row) {
  try {
    const it = await enrich({ artist: row.artist, title: row.title, market: 'DE' });
    if (!it?.previewUrl) return null;
    return {
      preview_url: it.previewUrl,
      artwork_url: it.artworkUrl,
      ...(row.itunes_track_id ? {} : { itunes_track_id: it.itunesTrackId }),
    };
  } catch (e) {
    // Drosselung ist KEIN Fehltreffer. Wer beides gleich behandelt, merkt sich
    // den Song dauerhaft als hoffnungslos und prüft ihn nie wieder.
    if (e instanceof ThrottleError) return THROTTLED;
    throw e;
  }
}

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
  console.log(`Quelle: Deezer${WITH_ITUNES ? ' + iTunes für Fehltreffer' : ''}`);
  console.log(`Geschätzte Dauer: ~${Math.max(1, Math.round((rows.length * DEEZER_DELAY_MS * 1.6) / 60000))} Minuten\n`);

  let cache = {};
  if (existsSync(CACHE)) {
    try { cache = JSON.parse(readFileSync(CACHE, 'utf8')); } catch { cache = {}; }
  }
  const resumed = Object.keys(cache).length;
  if (resumed) console.log(`Wiederaufnahme: ${resumed} bereits geprüft\n`);

  setThrottleReporter((ms) =>
    console.log(`  iTunes drosselt — warte ${Math.round(ms / 1000)}s …`),
  );

  let found = 0, missing = 0, done = 0;
  const updates = [];

  for (const r of rows) {
    const cached = cache[r.id];
    // Gedrosselte Songs beim nächsten Lauf erneut versuchen — nur echte
    // Fehltreffer sind endgültig.
    if (cached !== undefined && cached !== THROTTLED) {
      if (cached) { updates.push({ id: r.id, ...cached }); found++; }
      else missing++;
      done++;
      continue;
    }

    const result = await resolveOne(r);
    cache[r.id] = result;
    if (result === THROTTLED) {
      writeFileSync(CACHE, JSON.stringify(cache));
      console.log(`
  iTunes drosselt anhaltend. Sauber angehalten bei ${done}/${rows.length}.`);
      console.log('  Nichts verloren — morgen denselben Befehl erneut ausführen.');
      break;
    }
    if (result) { updates.push({ id: r.id, ...result }); found++; }
    else missing++;

    done++;
    // Als abgeschlossene Zeile ausgeben, nicht per Wagenrücklauf überschreiben:
    // Die PowerShell-Konsole stellt eine überschriebene Zeile nicht dar — der
    // Lauf sah dort tot aus, obwohl er arbeitete.
    if (done % 20 === 0 || done === rows.length) {
      console.log(`  ${done}/${rows.length} · gefunden ${found} · ohne Treffer ${missing}`);
    }
    if (done % 50 === 0) writeFileSync(CACHE, JSON.stringify(cache));
    await sleep(ITUNES_DELAY_MS);
  }
  writeFileSync(CACHE, JSON.stringify(cache));
  console.log(`\n  ${done}/${rows.length} · gefunden ${found} · ohne Treffer ${missing}\n`);

  if (DRY) { console.log('Trockenlauf — nichts geschrieben.'); return; }

  // Einzeln aktualisieren: ein Upsert würde die übrigen Spalten überschreiben,
  // und genau das darf hier nicht passieren.
  let written = 0;
  let failed = 0;
  let withoutId = 0;
  for (const u of updates) {
    const { id, ...patch } = u;
    let { error } = await sb.from('ohrwurm_songs').update(patch).eq('id', id);

    // 23505 = die iTunes-Nummer gibt es schon. Zwei Altbestandssongs koennen
    // auf dieselbe Aufnahme aufloesen — dieselbe Nummer zweimal verbietet der
    // UNIQUE-Index. Die Nummer ist aber nur ein Nebenprodukt; worauf es
    // ankommt, ist die Vorschau-Adresse. Also ohne sie erneut versuchen.
    if (error && String(error.code) === '23505' && 'itunes_track_id' in patch) {
      const rest = { ...patch };
      delete rest.itunes_track_id;
      ({ error } = await sb.from('ohrwurm_songs').update(rest).eq('id', id));
      if (!error) withoutId++;
    }

    // NIE abbrechen. Vorher riss eine einzige Kollision die restlichen tausend
    // Songs mit, obwohl mit denen alles in Ordnung war.
    if (error) {
      failed++;
      if (failed <= 3) console.error(`  Zeile ${id}: ${error.message}`);
      else if (failed === 4) console.error('  … weitere Fehler werden nur gezaehlt');
      continue;
    }
    written++;
    if (written % 100 === 0) console.log(`  geschrieben: ${written}/${updates.length}`);
  }
  console.log(`  geschrieben: ${written}/${updates.length}`);
  console.log(`\nFertig. ${written} Songs haben jetzt eine gespeicherte Vorschau.`);
  if (missing) console.log(`Ohne Treffer: ${missing} (bei iTunes nicht auffindbar).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
