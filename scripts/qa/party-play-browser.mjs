// Party-Play scenario runner (masterplan section 8 / 12.1-3).
//   node scripts/qa/party-play-browser.mjs --scenario <ID|ID,ID|prefix*|all> [--real] [--chaos N] [--lang de|en] [--viewport 390x844]
// Starts the QA vite server on demand (PGlite: 5186, --real: 5185 via controller-real-vite.config.ts).
// Output: scripts/tmp/party-play/<run>/ (screenshots per step and device, report.json, summary.md).
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { createHarness, NotImplemented, Manual, Deferred, Inconclusive, sourceText } from './party-play-harness.mjs';
import { joinScenarios } from './party-play-scenarios-join.mjs';
import { lobbyScenarios } from './party-play-scenarios-lobby.mjs';
import { gameScenarios } from './party-play-scenarios-game.mjs';
import { tvScenarios } from './party-play-scenarios-tv.mjs';
import { manualScenarios } from './party-play-manual.mjs';
import { kickScenarios } from './party-play-scenarios-kick.mjs';
import { guestScenarios } from './party-play-scenarios-guests.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] ?? true) : fallback; };
const real = args.includes('--real');
const chaosRuns = Number(opt('chaos', 0));
// --lang de|en|… (UI language on every device) · --viewport 390x844 (phone size; default 390x900).
const lang = String(opt('lang', 'en'));
const [vw, vh] = String(opt('viewport', '390x900')).split('x').map(Number);
if (!/^[a-z]{2}$/.test(lang) || !vw || !vh) { console.error('usage: --lang <2-letter code> --viewport <W>x<H>'); process.exit(2); }
const selection = String(opt('scenario', chaosRuns ? 'none' : 'all'));
const base = process.env.QA_PARTY_URL ?? (real ? 'http://127.0.0.1:5185' : 'http://127.0.0.1:5186');
const runId = `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}${real ? '-real' : ''}${args.includes('--lang') ? `-${opt('lang')}` : ''}`;
const root = `scripts/tmp/party-play/${runId}`;
fs.mkdirSync(root, { recursive: true });

// F14 (kick the active player) uses the kick matrix's state-based check for fake-or-fact.
{ const f14 = gameScenarios.find(s => s.id === 'F14'), k14 = kickScenarios.find(s => s.id === 'K14-fake-or-fact'); if (f14 && k14) f14.run = k14.run; }
const all = [...joinScenarios, ...lobbyScenarios, ...gameScenarios, ...tvScenarios, ...kickScenarios, ...guestScenarios];
const wanted = selection === 'all' ? all : selection === 'none' ? [] : all.filter(s => selection.split(',').some(sel => sel.endsWith('*') ? s.id.startsWith(sel.slice(0, -1)) : s.id === sel));
if (!wanted.length && !chaosRuns) { console.error(`No scenario matches "${selection}". Known: ${all.map(s => s.id).join(' ')}`); process.exit(2); }

async function ensureServer() {
  const up = async () => { try { return (await fetch(`${base}/scripts/qa/party-play.html`)).ok; } catch { return false; } };
  if (await up()) return null;
  const config = real ? 'scripts/qa/controller-real-vite.config.ts' : 'scripts/qa/party-play-vite.config.ts';
  console.log(`Starting vite (${config})`);
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', config, '--strictPort'], { stdio: 'ignore', detached: false });
  for (let i = 0; i < 120; i++) { if (await up()) return child; await new Promise(r => setTimeout(r, 1000)); }
  child.kill(); throw new Error('vite did not start');
}

const results = [];
const server = await ensureServer();
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
// Warm the vite module graph once so the first scenario does not pay the cold compile.
{ const p = await browser.newPage(); await p.goto(`${base}/scripts/qa/party-play.html`, { waitUntil: 'domcontentloaded', timeout: 300000 }).catch(() => {}); await p.waitForFunction(() => !!window.controllerQA, { timeout: 300000 }).catch(() => {}); await p.close(); }

async function runOne(s, { chaos = null, label = s.id } = {}) {
  sourceText(true);
  if (s.realOnly && !real) { results.push({ id: label, title: s.title, status: 'SKIPPED', error: 'needs --real' }); return; }
  if (s.pgliteOnly && real) { results.push({ id: label, title: s.title, status: 'SKIPPED', error: 'PGlite broker only' }); return; }
  const out = `${root}/${label}`; const started = Date.now();
  const ctx = { notes: [], evidence: {}, real, out };
  let h = null, status = 'PASS', error = null;
  try {
    h = await createHarness({ real, out, base, chaos, lang, phoneViewport: { width: vw, height: vh }, browser }); ctx.h = h;
    await Promise.race([s.run(ctx), new Promise((_, rej) => setTimeout(() => rej(new Error(`scenario timeout ${s.timeoutMs ?? 240000} ms`)), s.timeoutMs ?? 240000))]);
    const pageErrors = h.consoleErrors().filter(e => !(s.allowErrors ?? []).some(re => re.test(e)));
    if (pageErrors.length) { status = 'FAIL'; error = `page errors: ${pageErrors.slice(0, 3).join(' | ')}`; }
  } catch (e) {
    status = e instanceof NotImplemented ? 'NOT_IMPLEMENTED' : e instanceof Manual ? 'MANUAL' : e instanceof Deferred ? 'DEFERRED' : e instanceof Inconclusive ? 'INCONCLUSIVE' : 'FAIL';
    error = String(e.message ?? e).slice(0, 1200);
    if (h && status === 'FAIL') { await h.shotAll('failure').catch(() => {}); ctx.evidence.lastText = await Promise.all(h.clients.map(async c => ({ name: c.name, route: await c.route().catch(() => null), text: (await c.text().catch(() => '')).slice(0, 600), errors: c.errors.slice(0, 5),
      room: await c.page.evaluate(() => { const s = controllerQA.snapshot(); return { connection: s.connection, error: s.error, me: s.myPlayerId, status: s.room?.status, host: s.room?.hostId, participants: s.room?.participantIds, players: s.players?.map(p => p.id.slice(0, 14) + (p.controlledBy ? '(guest)' : '')) }; }).catch(() => null) }))); }
  } finally {
    if (h) { ctx.evidence.broker = { packets: h.stats.packets, dropped: h.stats.dropped, rpcErrors: h.stats.rpc.filter(r => r.error).slice(-10) }; await h.close().catch(() => {}); }
  }
  const row = { id: label, title: s.title, status, ms: Date.now() - started, error, notes: ctx.notes, evidence: ctx.evidence, out };
  results.push(row);
  console.log(`${status.padEnd(16)} ${label.padEnd(10)} ${(row.ms / 1000).toFixed(1)}s ${s.title}${error ? `\n    -> ${error.split('\n')[0]}` : ''}`);
  fs.writeFileSync(`${root}/report.json`, JSON.stringify({ base, real, results }, null, 2));
}

try {
  for (const s of wanted) await runOne(s);
  if (chaosRuns) {
    const { chaosScenario } = await import('./party-play-chaos.mjs');
    for (let i = 1; i <= chaosRuns; i++) await runOne(chaosScenario, { chaos: { delay: [0, 800], drop: 0.05 }, label: `CHAOS-${i}` });
  }
} finally {
  await browser.close(); server?.kill();
  for (const m of manualScenarios) if (selection === 'all') results.push({ id: m.id, title: m.title, status: 'MANUAL', checklist: m.checklist });
  const lines = ['| ID | Status | s | Scenario | Detail |', '|---|---|---|---|---|', ...results.map(r => `| ${r.id} | ${r.status} | ${r.ms ? (r.ms / 1000).toFixed(0) : ''} | ${r.title} | ${(r.error ?? r.notes?.join('; ') ?? '').replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 220)} |`)];
  const counts = results.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
  fs.writeFileSync(`${root}/summary.md`, `# Party-Play run ${runId}\n\n${JSON.stringify(counts)}\n\n${lines.join('\n')}\n`);
  fs.writeFileSync(`${root}/report.json`, JSON.stringify({ base, real, results }, null, 2));
  console.log(`\n${JSON.stringify(counts)}\nReport: ${root}/summary.md`);
  if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
}
