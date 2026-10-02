// Per-game summary of the all-modes matrix (party-play-modes-matrix.mjs reports), as a Markdown table.
//   node scripts/qa/party-play-matrix-summary.mjs [--since 2026-10-02T10]
// Cell legend per mode: R = result stored / game over, P = progressed but no result within the budget,
// S = stalled (driver could not move it), B = correctly blocked, F = failure, U = picker ≠ gameAvailability.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '';
const dir = 'scripts/tmp/party-play';
const latest = new Map(); // `${mode}|${game}|${config}|${players}` -> row (newest run wins)
for (const run of fs.readdirSync(dir).filter(d => d.startsWith('modes-') && d.slice(-19) >= since).sort()) {
  const file = path.join(dir, run, 'report.json'); if (!fs.existsSync(file)) continue;
  const { mode, rows } = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const r of rows ?? []) if (r.game !== '(setup)') latest.set(`${mode}|${r.game}|${r.config}|${r.players}`, { ...r, mode });
}
const code = r => r.ui && r.expected && r.ui !== r.expected && r.ui !== 'n/a (fixture)' ? 'U'
  : r.outcome === 'blocked' ? 'B' : ['result-stored', 'game-over-screen'].includes(r.outcome) ? 'R'
  : r.status === 'FAIL' ? 'F' : String(r.outcome).startsWith('stalled') ? 'S' : 'P';
const modes = ['local', 'controller', 'online'];
const games = [...new Set([...latest.values()].map(r => r.game))].sort();
console.log(`| Game | ${modes.join(' | ')} |\n|---|${modes.map(() => '---').join('|')}|`);
for (const g of games) {
  const cells = modes.map(m => {
    const rows = [...latest.values()].filter(r => r.mode === m && r.game === g);
    if (!rows.length) return '–';
    const counts = rows.reduce((a, r) => { const c = code(r); a[c] = (a[c] ?? 0) + 1; return a; }, {});
    return Object.entries(counts).sort().map(([c, n]) => `${c}${n}`).join(' ');
  });
  console.log(`| ${g} | ${cells.join(' | ')} |`);
}
const all = [...latest.values()];
console.log(`\nCases: ${all.length} · UI≠gameAvailability: ${all.filter(r => code(r) === 'U').length} · failures: ${all.filter(r => code(r) === 'F').length}`);
