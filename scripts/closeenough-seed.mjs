/**
 * CLOSE ENOUGH — Schätzfragen aus Wikidata beschaffen.
 *
 * Wikidata-Action-API (`wbgetentities`), NICHT SPARQL: Der Abfragedienst lief
 * beim PIXELJAGD-Aufbau reproduzierbar in Zeitüberschreitungen. Ein Aufruf
 * holt Labels, Sitelinks und alle Claims zugleich.
 *
 * Aufruf:
 *   node scripts/closeenough-seed.mjs --probe     → Trefferquoten, schreibt nichts
 *   node scripts/closeenough-seed.mjs --dry-run   → voller Lauf, schreibt nichts
 *   node scripts/closeenough-seed.mjs             → Migration schreiben
 *   node scripts/closeenough-seed.mjs --only natur,sport
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBJECTS, PROBE_SIZE } from './lib/closeenough-subjects.mjs';
import { FRAMES, GROUP_FRAMES, categoryOf } from './lib/closeenough-frames.mjs';
import { toTarget, unknownUnits } from './lib/closeenough-units.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const PROBE = argv.includes('--probe');
const DRY = argv.includes('--dry-run') || PROBE;
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? (argv[onlyIdx + 1] ?? '').split(',').filter(Boolean) : null;

const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];
const UA = { 'User-Agent': 'eventbliss-closeenough/1.0 (https://event-bliss.com; info@yjbn.me)' };
const YEAR_NOW = 2026;

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

/** Zählt, warum Kandidaten ausscheiden — der eigentliche Wert des Probelaufs. */
const stats = {};
function bump(frame, reason) {
  stats[frame] ??= { versucht: 0, ok: 0, gruende: {} };
  if (reason === 'versucht') stats[frame].versucht++;
  else if (reason === 'ok') stats[frame].ok++;
  else stats[frame].gruende[reason] = (stats[frame].gruende[reason] ?? 0) + 1;
}

/**
 * Aus mehreren Claims den einen belastbaren Wert bestimmen.
 *
 * Wikidata erlaubt mehrere Werte je Eigenschaft, und genau daran scheitert eine
 * Schätzfrage: „Eiffelturm — 300 oder 330 Meter?" ist kein Rätsel mehr, sondern
 * ein Streit am Tisch. Weichen die Kandidaten um mehr als 2 % voneinander ab,
 * wird die Frage verworfen.
 */
function pickClaim(claims, frame) {
  let cs = (claims ?? []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue);
  if (!cs.length) return { err: 'kein_wert' };

  const preferred = cs.filter((c) => c.rank === 'preferred');
  if (preferred.length) cs = preferred;

  // Qualifier, die den Wert unbrauchbar machen.
  cs = cs.filter((c) => {
    const qual = c.qualifiers ?? {};
    if (qual.P582) return false;   // Endzeitpunkt → veralteter Wert
    if (qual.P518) return false;   // betrifft nur einen Teil („Höhe des Nordflügels")
    if (qual.P1013) return false;  // andere Messgrundlage („Fläche inkl. Gewässer")
    return true;
  });
  if (!cs.length) return { err: 'qualifier' };

  // Zeitabhängige Größen brauchen einen Stichtag, sonst wirkt jede richtige
  // Antwort falsch, weil der Spieler eine andere Jahresangabe im Kopf hat.
  let asOf = null;
  if (frame.needsDate) {
    const dated = cs
      .map((c) => {
        const t = c.qualifiers?.P585?.[0]?.datavalue?.value?.time;
        const y = t ? Number(String(t).slice(1, 5)) : null;
        return y ? { c, y } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.y - a.y);
    if (!dated.length) return { err: 'ohne_stichtag' };
    if (dated[0].y < YEAR_NOW - 12) return { err: 'veraltet' };
    cs = [dated[0].c];
    asOf = dated[0].y;
  }

  const values = [];
  for (const c of cs) {
    const dv = c.mainsnak.datavalue.value;
    if (frame.isTime) {
      if ((dv.precision ?? 0) < 9) continue;         // Jahrzehnt oder Jahrhundert
      const m = /^([+-])(\d{4,})/.exec(dv.time ?? '');
      if (!m) continue;
      values.push(Number(m[1] + m[2]));
    } else {
      if (typeof dv !== 'object' || dv.amount === undefined) continue;
      // Zu unscharf angegeben? Dann taugt der Wert nicht als Antwort.
      if (dv.lowerBound !== undefined && dv.upperBound !== undefined) {
        const spread = Math.abs(Number(dv.upperBound) - Number(dv.lowerBound));
        if (spread / Math.max(Math.abs(Number(dv.amount)), 1) > 0.1) continue;
      }
      const v = toTarget(dv.amount, dv.unit, frame.unit);
      if (v === null) continue;
      values.push(v);
    }
  }
  if (!values.length) return { err: 'einheit' };

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min > 0 && max / min > 1.02) return { err: 'uneindeutig' };

  const sorted = [...values].sort((a, b) => a - b);
  const value = sorted[Math.floor(sorted.length / 2)];
  if (value < frame.min || value > frame.max) return { err: 'ausserhalb' };

  return { value, asOf };
}

/** Enthält der Name schon die Antwort? „Wie lang ist der 100-Meter-Lauf?" */
function selfAnswering(name, value) {
  for (const m of String(name).matchAll(/\d[\d.,]*/g)) {
    const n = Number(m[0].replace(/[.,]/g, ''));
    if (!Number.isFinite(n) || n === 0) continue;
    if (Math.abs(n - value) / Math.max(Math.abs(value), 1) < 0.1) return true;
  }
  return false;
}

async function collectGroup(group, titles) {
  const frames = GROUP_FRAMES[group] ?? [];
  const rows = [];

  for (const part of chunk(titles, 45)) {
    const url =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&sites=dewiki' +
      '&props=labels|claims|sitelinks&languages=' + LANGS.join('|') +
      '&titles=' + encodeURIComponent(part.join('|'));
    const j = await getJson(url);

    for (const [qid, e] of Object.entries(j?.entities ?? {})) {
      if (!qid.startsWith('Q') || !e.labels) continue;

      const siteCount = Object.keys(e.sitelinks ?? {}).length;
      if (siteCount < 15) continue;

      // Wikipedia-Titel schlägt Label, Klammerzusatz weg — dieselbe Begründung
      // wie bei PIXELJAGD: Labels tragen oft Fachbezeichnungen.
      const names = {};
      for (const l of LANGS) {
        const title = e.sitelinks?.[l + 'wiki']?.title;
        const clean = title ? title.replace(/\s*\([^)]*\)\s*$/, '').trim() : '';
        const v = clean || e.labels[l]?.value;
        if (v) names[l] = v;
      }
      if (!names.de || !names.en) continue;
      if (Object.keys(names).length < 5) continue;

      let takenForEntity = 0;
      for (const key of frames) {
        if (takenForEntity >= 2) break;
        const frame = FRAMES[key];
        bump(key, 'versucht');

        const res = pickClaim(e.claims?.[frame.prop], frame);
        if (res.err) { bump(key, res.err); continue; }
        if (selfAnswering(names.de, res.value)) { bump(key, 'selbstbeantwortend'); continue; }

        bump(key, 'ok');
        takenForEntity++;
        rows.push({
          qid,
          prop: frame.prop,
          frameKey: key,
          names,
          answer: frame.isTime ? res.value : Number(res.value.toPrecision(6)),
          unitKey: frame.unit,
          category: categoryOf(group),
          tolerance: frame.tol,
          asOf: res.asOf,
          languages: Object.keys(names).sort(),
          sitelinks: siteCount,
        });
      }
    }
    await sleep(150);
  }
  return rows;
}

/** Ausreißer über Median und mittlere absolute Abweichung je Rahmen. */
function dropOutliers(rows) {
  const byFrame = {};
  for (const r of rows) (byFrame[r.frameKey] ??= []).push(r);
  const keep = new Set();
  for (const list of Object.values(byFrame)) {
    if (list.length < 8) { list.forEach((r) => keep.add(r)); continue; }
    const vals = list.map((r) => r.answer).sort((a, b) => a - b);
    const med = vals[Math.floor(vals.length / 2)];
    const devs = vals.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
    const mad = devs[Math.floor(devs.length / 2)] || 1;
    for (const r of list) if (Math.abs(r.answer - med) <= 12 * mad) keep.add(r);
  }
  return rows.filter((r) => keep.has(r));
}

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

async function main() {
  const groups = Object.keys(SUBJECTS).filter(
    (g) => !ONLY || ONLY.includes(categoryOf(g)) || ONLY.includes(g),
  );

  let all = [];
  for (const g of groups) {
    const titles = PROBE ? SUBJECTS[g].slice(0, PROBE_SIZE) : SUBJECTS[g];
    process.stdout.write(`${g}: ${titles.length} Titel … `);
    const rows = await collectGroup(g, titles);
    console.log(`${rows.length} Fragen`);
    all.push(...rows);
  }

  const before = all.length;
  all = dropOutliers(all);
  if (all.length < before) console.log(`\nAusreißer verworfen: ${before - all.length}`);

  // Kein Rahmen darf eine Kategorie beherrschen — sonst besteht `bauwerke`
  // am Ende nur aus „Wie hoch ist …".
  const byCat = {};
  for (const r of all) (byCat[r.category] ??= []).push(r);
  const balanced = [];
  for (const list of Object.values(byCat)) {
    const cap = Math.max(8, Math.ceil(list.length * 0.35));
    const seen = {};
    for (const r of [...list].sort((a, b) => b.sitelinks - a.sitelinks)) {
      seen[r.frameKey] = (seen[r.frameKey] ?? 0) + 1;
      if (seen[r.frameKey] <= cap) balanced.push(r);
    }
  }
  all = balanced;

  const catCount = {};
  for (const r of all) catCount[r.category] = (catCount[r.category] ?? 0) + 1;
  console.log('\n== Fragen je Kategorie ==');
  for (const [c, n] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(10)} ${String(n).padStart(4)}`);
  }
  console.log(`  ${'gesamt'.padEnd(10)} ${String(all.length).padStart(4)}`);

  if (PROBE) {
    console.log('\n== Trefferquote je Rahmen ==');
    const lines = Object.entries(stats)
      .map(([k, s]) => {
        const quote = s.versucht ? Math.round((s.ok / s.versucht) * 100) : 0;
        const top = Object.entries(s.gruende).sort((a, b) => b[1] - a[1]).slice(0, 2)
          .map(([g, n]) => `${g} ${n}`).join(', ');
        return { k, quote, s, top };
      })
      .sort((a, b) => a.quote - b.quote);
    for (const l of lines) {
      console.log(`  ${String(l.quote).padStart(3)}%  ${l.k.padEnd(20)} ${l.s.ok}/${l.s.versucht}   ${l.top}`);
    }
    if (unknownUnits.size) {
      console.log('\n== Unbekannte Einheiten (von Hand ergänzen) ==');
      for (const [qid, n] of [...unknownUnits].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${qid.padEnd(12)} ${n}x`);
      }
    } else {
      console.log('\nKeine unbekannten Einheiten.');
    }
    console.log('\nProbelauf — nichts geschrieben.\nBeispiele:');
    for (const r of all.slice(0, 8)) {
      console.log(`  ${r.frameKey.padEnd(18)} ${r.names.de} = ${r.answer} ${r.unitKey}` +
        (r.asOf ? ` (Stand ${r.asOf})` : '') + `  [${r.languages.length} Sprachen]`);
    }
    return;
  }

  if (DRY) { console.log('\nTrockenlauf — nichts geschrieben.'); return; }

  const values = all.map((r) =>
    `  (${q(JSON.stringify(r.names))}::jsonb, ${q(r.frameKey)}, ${r.answer}, ${q(r.unitKey)}, ` +
    `${q(r.category)}, ${r.tolerance}, ${r.asOf ?? 'NULL'}, ` +
    `${q(`Wikidata (${r.qid}, ${r.prop})`)}, ${q('https://www.wikidata.org/wiki/' + r.qid)}, ` +
    `${q(r.qid)}, ${q(r.prop)}, ARRAY[${r.languages.map(q).join(',')}]::text[])`,
  );

  const sql = `-- CLOSE ENOUGH — Fragenbestand aus Wikidata.
--
-- Erzeugt von scripts/closeenough-seed.mjs. Nicht von Hand bearbeiten; stattdessen
-- das Skript erneut laufen lassen.
--
-- Der Fragetext steht NICHT hier: gespeichert sind Vorlagenschluessel und Name
-- in bis zu zehn Sprachen. Die Frage entsteht zur Laufzeit daraus.
--
-- Fragen gesamt: ${all.length}
${Object.entries(catCount).map(([c, n]) => `--   ${c.padEnd(10)} ${n}`).join('\n')}

INSERT INTO public.closeenough_questions
  (name_i18n, frame_key, answer, unit_key, category, tolerance_pct, as_of_year,
   source_label, source_url, wikidata_qid, wikidata_property, languages)
VALUES
${values.join(',\n')}
ON CONFLICT DO NOTHING;
`;

  const dir = join(ROOT, 'supabase', 'migrations');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '20260821130000_closeenough_seed.sql'), sql, 'utf8');
  console.log('\nMigration geschrieben: supabase/migrations/20260821130000_closeenough_seed.sql');
}

main().catch((e) => { console.error(e); process.exit(1); });
