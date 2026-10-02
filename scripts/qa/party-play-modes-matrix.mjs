// Party-Play all-modes game matrix: every playable game × mode (local-party, controller-party incl.
// guests, online-room) × player count (min / typical / max). Per case it records whether the UI offers
// the game exactly as gameAvailability() says (plannable/startable) and, for every startable case,
// whether the game is playable end-to-end (start → progress → result stored / game over), or why not.
//   node scripts/qa/party-play-modes-matrix.mjs --mode controller|online|local [--games a,b] [--counts min,typical,max] [--budget 60]
// Output: scripts/tmp/party-play/modes-<mode>-<ts>/{report.json,summary.md} + screenshots.
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { createHarness, pause } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, ready, connectTv, driveGame } from './party-play-flows.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const mode = opt('mode', 'controller');
const base = process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186';
const budgetMs = Number(opt('budget', 60)) * 1000;
const registry = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
const games = [...registry.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?minPlayers:\s*(\d+),\s*maxPlayers:\s*(\d+)[^}]*\}/g)].map(m => ({ id: m[1], min: +m[2], max: +m[3] }))
  .filter(g => !opt('games') || opt('games').split(',').includes(g.id));
const cap = mode === 'local' ? 30 : 12;
const countFor = (g, kind) => kind === 'min' ? Math.max(2, g.min) : kind === 'max' ? Math.min(cap, g.max) : Math.min(Math.max(4, Math.max(2, g.min)), Math.min(cap, g.max));
const kinds = opt('counts', 'min,typical,max').split(',');
const root = `scripts/tmp/party-play/modes-${mode}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
fs.mkdirSync(root, { recursive: true });
const rows = [];
const save = () => {
  fs.writeFileSync(`${root}/report.json`, JSON.stringify({ mode, rows }, null, 2));
  const c = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
  fs.writeFileSync(`${root}/summary.md`, `# Modes matrix: ${mode}\n\n${JSON.stringify(c)}\n\n| game | config | players | expected | UI | outcome | status | detail |\n|---|---|---|---|---|---|---|---|\n${rows.map(r => `| ${r.game} | ${r.config} | ${r.players} | ${r.expected} | ${r.ui ?? ''} | ${r.outcome ?? ''} | ${r.status} | ${(r.detail ?? '').replace(/\|/g, '/').slice(0, 160)} |`).join('\n')}\n`);
};
const log = r => { rows.push(r); save(); console.log(`${r.status.padEnd(5)} ${r.game.padEnd(17)} ${r.config.padEnd(18)} n=${String(r.players).padEnd(2)} exp=${r.expected} ui=${r.ui ?? '-'} ${r.outcome ?? ''} ${r.detail ?? ''}`); };
const expectedOf = a => a.startable ? 'startable' : a.plannable ? 'plannable' : 'locked';
const availability = (page, gameId, ctx) => page.evaluate(async (g, c) => (await import('/src/lib/playable-games.ts')).gameAvailability(g, c), gameId, ctx);
/** Did the generic/specific driver reach a result? Normalised outcome string. */
const outcomeOf = res => res.finished ? 'result-stored' : res.returnedToLobby ? 'ended-early' : res.stalls ? `stalled(${res.stalls}x10s)` : 'progressing-no-result';

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
try {
  if (mode === 'controller') await controllerMode();
  else if (mode === 'online') await onlineMode();
  else await localMode();
} finally { await browser.close(); save(); console.log(`Report: ${root}/summary.md`); if (rows.some(r => r.status === 'FAIL')) process.exitCode = 1; }

/** Controller party: one party per (players, guests, host role); all games checked in the picker, startable ones played. */
async function controllerMode() {
  const configs = [{ name: 'phones,host-plays', guestShare: 0, hostPlays: true }, { name: 'mixed30,host-plays', guestShare: 0.3, hostPlays: true }, { name: 'phones,moderator', guestShare: 0, hostPlays: false }];
  const parties = new Map();
  for (const g of games) for (const k of kinds) for (const cfg of configs) { const n = countFor(g, k); const key = `${n}|${cfg.name}`; parties.set(key, [...(parties.get(key) ?? []), g]); }
  for (const [key, list] of parties) {
    const [n, cfgName] = key.split('|'); const cfg = configs.find(c => c.name === cfgName); const total = Number(n);
    const others = total - (cfg.hostPlays ? 1 : 0); const guests = Math.round(others * cfg.guestShare); const phonesN = others - guests;
    const h = await createHarness({ out: `${root}/c${n}-${cfgName}`, base, browser }); const ctx = { notes: [] };
    try {
      const { host, code } = await createParty(h, { hostPlays: cfg.hostPlays }); await connectTv(h, host);
      for (let i = 0; i < guests; i++) await addGuest(ctx, host, code, `Gast${i + 1}`);
      const phones = []; for (let i = 0; i < phonesN; i++) phones.push(await joinPhone(h, ctx, host, code, `Spieler${i + 1}`));
      for (const p of phones) await ready(p);
      const actx = { mode: 'controller-party', phonePlayers: phonesN, guestPlayers: guests, hostPlays: cfg.hostPlays, hostPremium: true };
      for (const g of list) {
        const a = await availability(host.page, g.id, actx); const row = { game: g.id, config: cfgName, players: total, expected: expectedOf(a) };
        try {
          // UI: the set-list picker tile must carry the same plannable/startable flags.
          await host.page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
          const tile = await host.page.$eval(`[data-testid="game-option-${g.id}"]`, n => ({ plannable: n.getAttribute('data-available'), startable: n.getAttribute('data-startable') })).catch(() => null);
          row.ui = tile ? (tile.startable === 'true' ? 'startable' : tile.plannable === 'true' ? 'plannable' : 'locked') : 'missing';
          if (row.ui !== row.expected) { row.status = 'FAIL'; row.detail = `picker shows ${row.ui}, gameAvailability says ${row.expected} (${a.reason ?? 'ok'})`; continue; }
          const before = (await host.party()).results.length;
          for (const p of phones) await ready(p).catch(() => {});
          await host.page.evaluate(id => { const d = controllerQA.state().data; return controllerQA.playlist([...(d?.party.playlist ?? []).slice(0, d?.results.length ?? 0), id]); }, g.id); await pause(300);
          const startErr = await host.page.evaluate(id => controllerQA.start(id).then(() => null, e => String(e.message ?? e)), g.id);
          const playing = await host.until(async c => (await c.snapshot()).room?.status === 'playing', 'x', 8000).then(() => true, () => false);
          if (row.expected !== 'startable') { row.status = playing ? 'FAIL' : 'PASS'; row.outcome = playing ? 'started-although-blocked' : 'blocked'; row.detail = playing ? `started with reason ${a.reason}` : `${a.reason}`; if (playing) await host.page.evaluate(() => controllerQA.abort()); continue; }
          if (!playing) { row.status = 'FAIL'; row.outcome = 'did-not-start'; row.detail = startErr ?? 'room never playing'; continue; }
          await hostSetup(host, g.id, 10000);
          const res = await playMatch(h, host, g.id, await deviceMap(host, phones), { budgetMs, before }); row.outcome = outcomeOf(res);
          if (res.finished) { const r = (await host.party()).results.at(-1); const ids = Object.keys(r.scores); row.detail = `result with ${ids.length} players`; row.status = ids.length === a.activePlayers ? 'PASS' : 'FAIL'; if (row.status === 'FAIL') row.detail += `, expected ${a.activePlayers}`; }
          else { row.status = res.stalls ? 'WARN' : 'WARN'; row.detail = `driver: ${JSON.stringify(res)}`; await host.page.evaluate(() => controllerQA.abort()).catch(() => {}); }
          for (const c of [host, ...phones]) await c.until(async x => (await x.route()).startsWith('/party'), 'stuck after match', 12000).catch(e => { row.status = 'FAIL'; row.detail = `${row.detail}; ${e.message}`; });
          if (h.consoleErrors().length) { row.status = 'FAIL'; row.detail = `${row.detail}; page error: ${h.consoleErrors().at(-1).slice(0, 160)}`; h.clients.forEach(c => { c.errors.length = 0; }); }
        } catch (e) { row.status = 'FAIL'; row.detail = String(e.message ?? e).slice(0, 300); await host.page.evaluate(() => controllerQA.abort()).catch(() => {}); }
        finally { log(row); }
      }
    } catch (e) { log({ game: '(setup)', config: cfgName, players: total, expected: '-', status: 'FAIL', detail: String(e.message ?? e).slice(0, 300) }); }
    finally { await h.close(); }
  }
}

/** Online room: per game a fresh room (host creates in GameLobby, phones join by code); tile checked, startable games played. */
async function onlineMode() {
  const byCount = new Map();
  for (const g of games) for (const k of kinds) { const n = countFor(g, k); byCount.set(n, [...(byCount.get(n) ?? []), g]); }
  for (const [n, list] of byCount) {
    const h = await createHarness({ out: `${root}/o${n}`, base, browser });
    try {
      const host = await h.open('Host', { route: '/party', premium: true }); const phones = [];
      for (let i = 1; i < n; i++) phones.push(await h.open(`P${i}`, { route: '/party' }));
      const freshRoom = async gameId => {
        for (const c of [host, ...phones]) { await c.page.evaluate(id => { controllerQA.leaveRoom(); for (const k of ['eventbliss_active_room', 'eventbliss_room_history']) { localStorage.removeItem(k); sessionStorage.removeItem(k); } controllerQA.navigate('/party'); setTimeout(() => controllerQA.navigate(`/lobby/${id}`), 300); }, gameId); }
        await pause(600); await host.clickText('create|erstellen', 20000);
        const nameInput = await host.page.waitForSelector('input[type=text]', { visible: true, timeout: 10000 }); await nameInput.type('Host');
        await host.clickText('^(create room|raum erstellen)', 8000);
        await host.until(async c => !!(await c.snapshot()).room?.roomCode, 'room not created', 20000);
        const code = (await host.snapshot()).room.roomCode;
        for (const [i, p] of phones.entries()) {
          await p.clickText('join|beitreten', 20000); await p.page.waitForSelector('input[maxlength="6"]', { visible: true, timeout: 10000 });
          for (const input of await p.page.$$('input[type=text], input:not([type])')) { const max = await input.evaluate(x => x.maxLength); await input.type(max === 6 ? code : `P${i + 1}`); }
          await p.clickText('^(join|beitreten|los)', 8000); await p.until(async c => (await c.snapshot()).connection === 'connected', 'join failed', 20000);
          await p.clickText('ready|bereit', 4000);
        }
        await host.until(async c => (await c.snapshot()).players.length === n, `room never reached ${n} players`, 20000);
      };
      for (const g of list) {
        const a = await availability(host.page, g.id, { mode: 'online-room', phonePlayers: n - 1, guestPlayers: 0, hostPlays: true, hostPremium: true });
        const row = { game: g.id, config: 'online', players: n, expected: expectedOf(a) };
        try {
          await freshRoom(g.id);
          // The host's game picker is collapsed behind the "switch game" toggle.
          if (!await host.page.$('[data-testid^="room-game-"]')) { await host.clickText('switch|wechseln|change|ändern', 4000); await pause(600); }
          const tile = await host.page.$eval(`[data-testid="room-game-${g.id}"]`, t => ({ p: t.getAttribute('data-plannable'), s: t.getAttribute('data-startable') })).catch(() => null);
          row.ui = tile ? (tile.s === 'true' ? 'startable' : tile.p === 'true' ? 'plannable' : 'locked') : 'missing';
          if (row.ui !== row.expected) { row.status = 'FAIL'; row.detail = `room picker shows ${row.ui}, gameAvailability says ${row.expected} (${a.reason ?? 'ok'})`; continue; }
          if (row.expected !== 'startable') { row.status = 'PASS'; row.outcome = 'blocked'; row.detail = a.reason; continue; }
          await host.clickText('^(start|los|spiel starten)', 8000);
          const playing = await host.until(async c => (await c.snapshot()).room?.status === 'playing', 'x', 12000).then(() => true, () => false);
          if (!playing) { row.status = 'FAIL'; row.outcome = 'did-not-start'; await h.shotAll(`${g.id}-${n}-nostart`); continue; }
          await hostSetup(host, g.id, 10000);
          // Online rooms have no party standings: finished = the game's own game-over/result screen.
          const overNow = () => host.page.evaluate(() => /game over|spiel vorbei|winner|gewinner|endstand|final score|play again|nochmal/i.test(document.body.innerText));
          const map = new Map([[(await host.snapshot()).myPlayerId, host], ...await Promise.all(phones.map(async p => [(await p.snapshot()).myPlayerId, p]))]);
          const res = await playMatch(h, host, g.id, map, { budgetMs, isDone: async () => (await overNow()) ? 'finished' : null });
          const over = res.finished || await overNow();
          row.outcome = over ? 'game-over-screen' : outcomeOf(res); row.status = over ? 'PASS' : 'WARN'; row.detail = `driver: ${JSON.stringify(res)}`;
          if (h.consoleErrors().length) { row.status = 'FAIL'; row.detail = `${row.detail}; page error: ${h.consoleErrors().at(-1).slice(0, 160)}`; h.clients.forEach(c => { c.errors.length = 0; }); }
          if (!over) await h.shotAll(`${g.id}-${n}-end`);
        } catch (e) { row.status = 'FAIL'; row.detail = String(e.message ?? e).slice(0, 300); await h.shotAll(`${g.id}-${n}-failure`).catch(() => {}); }
        finally { log(row); }
      }
    } catch (e) { await h.shotAll('setup-failure').catch(() => {}); log({ game: '(setup)', config: 'online', players: n, expected: '-', status: 'FAIL', detail: String(e.message ?? e).slice(0, 300) }); }
    finally { await h.close(); }
  }
}

/** Local party (one phone, pass-and-play): mountLocal fixture with N players; result = party gameHistory grows. */
async function localMode() {
  const origin = process.env.QA_ORIGIN ?? 'http://127.0.0.1:5184';
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 900 });
  await page.evaluateOnNewDocument(() => { const N = WebSocket; class Q extends EventTarget { readyState = 0; send() {} close() {} } window.WebSocket = new Proxy(N, { construct(t, a) { return a[1] === 'vite-hmr' ? new Q() : Reflect.construct(t, a); } }); });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const load = async () => { await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 180000 }); await page.waitForFunction(() => !!window.qa, { timeout: 180000 }); await page.evaluate(() => qa.setLanguage('en')); };
  const client = { page, name: 'local', exists: id => page.evaluate(i => !!document.querySelector(`[data-testid="${i}"]`), id), party: async () => ({ results: await page.evaluate(() => JSON.parse(localStorage.getItem('eventbliss_party_session') ?? '{}').gameHistory ?? []), party: { status: 'playing' } }), route: async () => '/games' };
  for (const g of games) for (const k of kinds) {
    const n = countFor(g, k); const row = { game: g.id, config: 'local', players: n };
    try {
      await load(); errors.length = 0;
      const a = await page.evaluate(async (id, n) => (await import('/src/lib/playable-games.ts')).gameAvailability(id, { mode: 'local-party', phonePlayers: 0, guestPlayers: n, hostPlays: false, hostPremium: true }), g.id, n);
      row.expected = expectedOf(a); row.ui = 'n/a (fixture)';
      if (row.expected !== 'startable') { row.status = 'PASS'; row.outcome = 'blocked'; row.detail = a.reason; continue; }
      await page.evaluate((id, n) => qa.mountLocal(id, { players: Array.from({ length: n }, (_, i) => `Player ${i + 1}`) }), g.id, n);
      const res = await driveGame([client], client, { budgetMs, isDone: async () => (await client.party()).results.length > 0 ? 'finished' : null });
      row.outcome = outcomeOf(res); row.status = res.finished ? 'PASS' : 'WARN'; row.detail = `driver: ${JSON.stringify(res)}`;
      if (errors.length) { row.status = 'FAIL'; row.detail = `page error: ${errors[0].slice(0, 200)}`; }
      if (!res.finished) await page.screenshot({ path: `${root}/${g.id}-${n}.png` }).catch(() => {});
    } catch (e) { row.status = 'FAIL'; row.detail = String(e.message ?? e).slice(0, 300); }
    finally { log(row); }
  }
}
