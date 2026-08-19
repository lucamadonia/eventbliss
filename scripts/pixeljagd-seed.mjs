/**
 * PIXELJAGD — Bildmotive aus Wikidata und Wikimedia Commons beschaffen.
 *
 * Warum diese Quelle: Das Spiel braucht drei Dinge gleichzeitig, und Commons
 * liefert alle drei — ein frei nutzbares Bild, einen belegbaren Bildnachweis
 * (im Spiel Pflicht) und, über Wikidata, die Antwort in ALLEN ZEHN Sprachen.
 * Jede andere Bildquelle hätte die Übersetzungen offen gelassen.
 *
 * Kein Herunterladen, keine Ablage im Bucket: Die CSP erlaubt `img-src https:`,
 * und die Verpixelung liest keine Pixel zurück (sie zeichnet klein und
 * vergrößert ohne Glättung) — Canvas-Tainting spielt also keine Rolle. Die
 * Commons-Adressen bleiben dauerhaft gültig, anders als etwa die von Deezer.
 *
 * Ergebnis ist eine Migration statt eines Direktschreibens: So ist der Bestand
 * versioniert, nachprüfbar und ohne Dienstschlüssel einspielbar.
 *
 * Aufruf:
 *   node scripts/pixeljagd-seed.mjs            → Migration schreiben
 *   node scripts/pixeljagd-seed.mjs --dry-run  → nur berichten
 *   node scripts/pixeljagd-seed.mjs --only tiere,essen
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBJECTS, TARGET_PER_CATEGORY } from './lib/pixeljagd-subjects.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const onlyArg = argv.indexOf('--only');
const ONLY = onlyArg >= 0 ? (argv[onlyArg + 1] ?? '').split(',').filter(Boolean) : null;

const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];
const UA = { 'User-Agent': 'eventbliss-pixeljagd/1.0 (https://event-bliss.com; info@yjbn.me)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) });
    if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    if (attempt >= 3) return null;
    await sleep(2000 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

/**
 * Wikidata: deutsche Artikeltitel → Bezeichnungen in zehn Sprachen + Bilddatei.
 *
 * Bei Marken ist das Logo (P154) das treffendere Motiv als ein Firmengebäude
 * (P18) — deshalb dort die umgekehrte Reihenfolge.
 */
async function resolveEntities(titles, category) {
  const out = [];
  for (const part of chunk(titles, 45)) {
    const url =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&sites=dewiki' +
      '&props=labels|claims|sitelinks&languages=' + LANGS.join('|') +
      '&sitefilter=' + LANGS.map((l) => l + 'wiki').join('|') +
      '&titles=' + encodeURIComponent(part.join('|'));
    const j = await getJson(url);
    for (const [qid, e] of Object.entries(j?.entities ?? {})) {
      if (!qid.startsWith('Q') || !e.labels) continue;
      const pick = (p) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
      const file = category === 'marken'
        ? (pick('P154') ?? pick('P18'))
        : (pick('P18') ?? pick('P154'));
      if (typeof file !== 'string') continue;

      // Wikipedia-Titel schlaegt Wikidata-Bezeichnung.
      //
      // Grund: Fuer Tiergruppen fuehrt Wikidata den WISSENSCHAFTLICHEN Namen
      // als Label — "Igel" heisst dort englisch "Erinaceidae", nicht
      // "hedgehog". Ein englischer Spieler haette also nie richtig geraten.
      // Die Wikipedia-Artikeltitel sind die gebraeuchlichen Namen.
      //
      // Klammerzusaetze fliegen raus: "Prince (musician)" ist als Antwort
      // unbrauchbar, "Prince" ist richtig.
      const answers = {};
      for (const l of LANGS) {
        const title = e.sitelinks?.[l + 'wiki']?.title;
        const clean = title ? title.replace(/\s*\([^)]*\)\s*$/, '').trim() : '';
        const value = clean || e.labels[l]?.value;
        if (value) answers[l] = value;
      }
      // Wissenschaftliche Namen taugen nicht als Antwort.
      //
      // Fuer manche Tiergruppen fuehrt auch die Wikipedia den Fachartikel:
      // "Igel" heisst englisch "Erinaceidae", "Ratten" heisst "Rattus". Wer
      // "hedgehog" eintippt, laege damit falsch. P225 traegt den Taxonnamen —
      // stimmt eine Antwort damit ueberein, ist sie unbrauchbar und fliegt
      // raus. Lieber eine Sprache weniger als eine Antwort, die niemand trifft.
      const taxon = pick('P225');
      if (typeof taxon === 'string') {
        const t = taxon.toLowerCase();
        // Ueber die GATTUNG vergleichen, nicht ueber den ganzen Namen: Wikidata
        // fuehrt beim Hausschaf "Ovis gmelini aries", die tuerkische Wikipedia
        // aber "Ovis aries". Ein Gleichheitsvergleich haette das durchgelassen.
        const genus = t.split(' ')[0];
        for (const l of Object.keys(answers)) {
          const a = answers[l].toLowerCase();
          if (a === t || a.split(' ')[0] === genus) delete answers[l];
        }
      }
      // Ohne Deutsch verletzt die Zeile den CHECK der Tabelle. Ohne Englisch
      // faellt der groesste Teil der Spieler auf eine fremde Sprache zurueck —
      // beides macht das Motiv unbrauchbar.
      if (!answers.de || !answers.en) continue;
      out.push({ qid, file, answers, category });
    }
    await sleep(150);
  }
  return out;
}

/** Lizenzen, die eine Nutzung im Spiel tragen. Alles andere fliegt raus. */
function licenceOk(meta) {
  const code = String(meta?.License?.value ?? '').toLowerCase();
  const name = String(meta?.LicenseShortName?.value ?? '').toLowerCase();
  if (/fair use|non-?free|all rights/.test(code + ' ' + name)) return false;
  return /^(cc-by|cc-zero|cc0|pd|public)/.test(code) || /^(cc |public domain)/.test(name);
}

const strip = (h) => String(h ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Commons: Bildadresse, Urheber und Lizenz — der Bildnachweis ist Pflicht. */
async function resolveImages(entities) {
  const byFile = new Map(entities.map((e) => ['File:' + e.file, e]));
  const out = [];
  for (const part of chunk([...byFile.keys()], 40)) {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
      '&iiprop=url|extmetadata&iiurlwidth=1024&titles=' + encodeURIComponent(part.join('|'));
    const j = await getJson(url);
    for (const p of Object.values(j?.query?.pages ?? {})) {
      const ent = byFile.get(p.title);
      const ii = p.imageinfo?.[0];
      if (!ent || !ii) continue;
      const meta = ii.extmetadata ?? {};
      if (!licenceOk(meta)) continue;

      const author = strip(meta.Artist?.value).slice(0, 90) || 'Unbekannt';
      const lic = strip(meta.LicenseShortName?.value) || 'siehe Quelle';
      out.push({
        ...ent,
        image: ii.thumburl ?? ii.url,
        credit: `${author}, ${lic} (Wikimedia Commons)`,
        sourceUrl: ii.descriptionurl ?? null,
      });
    }
    await sleep(150);
  }
  return out;
}

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

async function main() {
  const cats = Object.keys(SUBJECTS).filter((c) => !ONLY || ONLY.includes(c));
  const all = [];
  const report = [];

  for (const cat of cats) {
    const titles = SUBJECTS[cat];
    console.log(`\n${cat}: ${titles.length} Begriffe …`);
    const ents = await resolveEntities(titles, cat);
    console.log(`  mit Bild und deutscher Bezeichnung: ${ents.length}`);
    const rows = await resolveImages(ents);
    console.log(`  mit freier Lizenz und Nachweis:     ${rows.length}`);

    // Dubletten über die Wikidata-Kennung: derselbe Begriff kann in mehreren
    // Kategorien auftauchen (etwa Nutella als Marke und als Essen).
    const seen = new Set(all.map((r) => r.qid));
    const fresh = rows.filter((r) => !seen.has(r.qid));
    if (fresh.length < rows.length) {
      console.log(`  Dubletten übersprungen:             ${rows.length - fresh.length}`);
    }
    all.push(...fresh);
    report.push({ cat, geprueft: titles.length, fertig: fresh.length });
  }

  console.log('\n== Ergebnis ==');
  for (const r of report) {
    const ok = r.fertig >= TARGET_PER_CATEGORY ? 'ok  ' : 'kurz';
    console.log(`${ok} ${r.cat.padEnd(8)} ${String(r.fertig).padStart(3)} von ${r.geprueft} Begriffen`);
  }
  console.log(`     gesamt   ${all.length} Motive`);
  const schwach = report.filter((r) => r.fertig < TARGET_PER_CATEGORY);
  if (schwach.length) {
    console.log(`\n  Unter dem Ziel von ${TARGET_PER_CATEGORY}: ${schwach.map((r) => r.cat).join(', ')}`);
    console.log('  Ursache ist fast immer eine fehlende freie Bildlizenz.');
  }

  if (DRY) {
    console.log('\nTrockenlauf — keine Migration geschrieben.\nBeispiele:');
    for (const r of all.slice(0, 6)) {
      console.log(`  ${r.category.padEnd(7)} ${r.answers.de} / ${r.answers.en ?? '-'} / ${r.answers.tr ?? '-'} / ${r.answers.ar ?? '-'}`);
      console.log(`          ${r.credit}`);
    }
    return;
  }

  const values = all.map((r) =>
    `  (${q(r.image)}, ${q(JSON.stringify(r.answers))}::jsonb, ${q(r.category)}, 2, ${q(r.credit)}, ${r.sourceUrl ? q(r.sourceUrl) : 'NULL'})`,
  );

  const sql = `-- PIXELJAGD — Grundbestand an Bildmotiven.
--
-- Erzeugt von scripts/pixeljagd-seed.mjs aus Wikidata und Wikimedia Commons.
-- Nicht von Hand bearbeiten; stattdessen das Skript erneut laufen lassen.
--
-- Jede Zeile traegt ihren Bildnachweis mit: Das Impressum verspricht, fremde
-- Inhalte zu kennzeichnen, und die Tabelle erzwingt es per CHECK.
--
-- Die Antworten liegen in zehn Sprachen vor, direkt aus den Wikidata-Labels.
-- Nur Bilder mit freier Lizenz (CC oder gemeinfrei) sind enthalten.
--
-- Motive gesamt: ${all.length}
${report.map((r) => `--   ${r.cat.padEnd(8)} ${r.fertig}`).join('\n')}

INSERT INTO public.pixel_images (image_path, answers, category, difficulty, credit, source_url)
VALUES
${values.join(',\n')}
ON CONFLICT DO NOTHING;
`;

  const stamp = '20260820120000';
  const dir = join(ROOT, 'supabase', 'migrations');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${stamp}_pixeljagd_seed.sql`);
  writeFileSync(file, sql, 'utf8');
  console.log(`\nMigration geschrieben: supabase/migrations/${stamp}_pixeljagd_seed.sql`);
  console.log('Einspielen mit:  npx supabase db push');
}

main().catch((e) => { console.error(e); process.exit(1); });
