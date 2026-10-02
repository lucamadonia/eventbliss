// Latest result per scenario ID across all Party-Play runs (scripts/tmp/party-play/<run>/report.json).
//   node scripts/qa/party-play-latest.mjs [--since 2026-10-02T09] [--md]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '';
const dir = 'scripts/tmp/party-play';
const latest = new Map();
for (const run of fs.readdirSync(dir).filter(d => /^\d{4}-/.test(d) && d >= since).sort()) {
  const file = path.join(dir, run, 'report.json');
  if (!fs.existsSync(file)) continue;
  let report; try { report = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; } // truncated (e.g. disk full)
  for (const r of report.results ?? []) if (r.status !== 'MANUAL') latest.set(r.id, { ...r, run });
}
const rows = [...latest.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
const detail = r => (r.error ?? r.notes?.join('; ') ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 180);
if (args.includes('--md')) {
  console.log(`${JSON.stringify(counts)}\n\n| ID | Status | Run | Detail |\n|---|---|---|---|`);
  for (const r of rows) console.log(`| ${r.id} | ${r.status} | ${r.run} | ${detail(r)} |`);
} else {
  for (const r of rows) console.log(`${r.status.padEnd(16)} ${r.id.padEnd(22)} ${r.run}  ${detail(r).slice(0, 110)}`);
  console.log(JSON.stringify(counts));
}
