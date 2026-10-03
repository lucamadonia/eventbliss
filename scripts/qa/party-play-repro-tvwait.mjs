// Repro of a real-device report: games picked in the lobby → app jumps straight into the first game;
// after start the TV stays on "Warte auf den Host …" while the game runs.
//   A: joystick party, host + 3 phones, TV paired.   B: one-phone local party (/party), 4 names, TV paired.
// Per step: host route, TV route + visible text, screenshots; at the end the TV's received packets.
//   node scripts/qa/party-play-repro-tvwait.mjs [--only A|B] [--lang de] [--games taboo,bomb,category]
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { createHarness, pause } from './party-play-harness.mjs';
import { createParty, joinPhone, ready, connectTv } from './party-play-flows.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const only = opt('only', ''); const lang = opt('lang', 'de');
const games = String(opt('games', 'taboo,bomb,category')).split(',');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const root = `scripts/tmp/party-play/repro-tvwait-${stamp}`;
const base = process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186';

const buttons = c => c.page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height).map(b => (b.getAttribute('data-testid') ? `[${b.getAttribute('data-testid')}] ` : '') + b.innerText.replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean));
const clickRe = (c, re) => c.page.evaluate(re => { const b = [...document.querySelectorAll('button')].find(b => !b.disabled && b.getBoundingClientRect().height && new RegExp(re, 'i').test(b.innerText.replace(/\s+/g, ' ').trim())); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return b ? b.innerText.replace(/\s+/g, ' ').trim().slice(0, 40) : null; }, re);

async function observe(log, label, host, tv) {
  const row = { label, at: Date.now(), hostRoute: await host.route().catch(() => '?'), tvRoute: await tv.route().catch(() => '?'),
    tvText: (await tv.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 220), hostText: (await host.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 160) };
  log.steps.push(row); console.log(`  ${label}: host ${row.hostRoute} | TV ${row.tvRoute} | ${row.tvText.slice(0, 120)}`);
  return row;
}
/** Past the game's setup screen, then play ~25 s while the TV is sampled every 2 s. */
async function sampleTv(log, host, tv, h, phones = []) {
  await pause(3000); await observe(log, 't+3s (before setup)', host, tv); await h.shotAll('after-start');
  if ((await host.route()).startsWith('/games/')) {
    log.setup = await hostSetup(host, games[0], 10000).catch(e => `setup failed: ${e.message}`);
    await pause(1500); await observe(log, 'after setup', host, tv); await h.shotAll('after-setup');
    let last = 0, n = 0;
    await playMatch(h, host, games[0], await deviceMap(host, phones).catch(() => new Map()), { budgetMs: 25000, isDone: async () => null, onTick: async () => {
      if (Date.now() - last < 2000) return; last = Date.now(); const r = await observe(log, `playing #${++n}`, host, tv); log.tvWaiting = /warte auf den host|waiting for the host/i.test(r.tvText);
      if (n === 4) await h.shotAll('playing');
    } }).catch(e => { log.driveError = e.message; });
  }
  const r = await observe(log, 'end', host, tv); log.tvWaiting = /warte auf den host|waiting for the host/i.test(r.tvText); await h.shotAll('end');
}
async function dumpPackets(log, tv, host) {
  log.tvPackets = await tv.page.evaluate(() => (window.__qaPacketLog ?? []).map(p => ({ ...p, at: Math.round(p.at) }))).catch(() => []);
  log.hostPackets = await host.page.evaluate(() => (window.__qaPacketLog ?? []).slice(-120).map(p => ({ ...p, at: Math.round(p.at) }))).catch(() => []);
  log.tvTrace = await tv.trace().catch(() => []);
  log.hostTvCtx = await host.page.evaluate(() => ({ tvCode: controllerQA.tvCode?.(), tvActive: controllerQA.tvActive?.() })).catch(() => null);
}

async function scenarioA(browser) {
  const out = `${root}/A-controllers`; fs.mkdirSync(out, { recursive: true });
  const h = await createHarness({ out, base, lang, phoneViewport: { width: 390, height: 844 }, browser });
  const log = { scenario: 'A joystick party, host + 3 phones, TV', steps: [], picks: [] };
  try {
    const { host, code } = await createParty(h);
    const tv = await connectTv(h, host);
    const phones = []; for (const n of ['Lena', 'Tom', 'Uwe']) { const p = await joinPhone(h, { notes: [] }, host, code, n); await ready(p); phones.push(p); }
    await observe(log, 'lobby ready', host, tv); await h.shotAll('lobby');
    log.lobbyButtons = await buttons(host);
    for (const g of games) {
      const before = await host.route();
      const ok = await host.page.evaluate(id => { const b = [...document.querySelectorAll(`[data-testid="game-option-${id}"]`)].find(b => b.getBoundingClientRect().height); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return !!b; }, g);
      await pause(1500);
      const r = await observe(log, `picked ${g}`, host, tv);
      log.picks.push({ game: g, found: ok, routeBefore: before, routeAfter: r.hostRoute, jumped: r.hostRoute.startsWith('/games/') });
      await h.shotAll(`picked-${g}`);
      if (r.hostRoute.startsWith('/games/')) break;
    }
    log.playlist = await host.page.evaluate(() => controllerQA.state().data?.party.playlist);
    if (!(await host.route()).startsWith('/games/')) {
      log.start = (await host.exists('lobby-start')) ? (await host.click('lobby-start').then(() => 'lobby-start', e => `lobby-start failed: ${e.message}`)) : await clickRe(host, '^(start|los)');
      await pause(500); await observe(log, 'start tapped', host, tv);
    }
    await sampleTv(log, host, tv, h, phones);
    await dumpPackets(log, tv, host);
  } catch (e) { log.error = String(e.stack ?? e).slice(0, 600); console.log(`A stopped: ${e.message}`); }
  finally { fs.writeFileSync(`${out}/repro.json`, JSON.stringify(log, null, 1)); await h.close(); }
  return log;
}

async function scenarioB(browser) {
  const out = `${root}/B-local`; fs.mkdirSync(out, { recursive: true });
  const h = await createHarness({ out, base, lang, phoneViewport: { width: 390, height: 844 }, browser });
  const log = { scenario: 'B one-phone local party, 4 names, TV', steps: [], picks: [] };
  try {
    const host = await h.open('Host', { premium: true, route: '/party' });
    await host.page.waitForSelector('input[type=text]', { timeout: 20000 });
    for (const n of ['Anna', 'Ben', 'Clara', 'Dario']) { await host.page.type('input[type=text]', n); await host.page.keyboard.press('Enter'); await pause(300); }
    // TV code from the "Fernseher verbinden" box.
    await host.page.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
    await pause(400);
    const code = await host.page.evaluate(() => { const m = document.body.innerText.match(/\/tv\/([A-Z0-9]{4,8})/); return m?.[1] ?? null; });
    log.tvCode = code; if (!code) throw new Error('no TV code on /party');
    const tv = await h.tv(code);
    await pause(2500);
    await observe(log, 'lobby, TV paired', host, tv); await h.shotAll('lobby');
    log.lobbyButtons = await buttons(host);
    const plan = await host.page.evaluate(() => window.qaT?.('nativeExtra.partyNight.planEvening'));
    log.openPicker = await clickRe(host, `^${plan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    await pause(1200); await h.shotAll('picker');
    for (const g of games) {
      const before = await host.route();
      const ok = await host.page.evaluate(id => { const b = [...document.querySelectorAll(`[data-testid="game-option-${id}"]`)].find(b => b.getBoundingClientRect().height); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return !!b; }, g);
      await pause(1200);
      const r = await observe(log, `picked ${g}`, host, tv);
      log.picks.push({ game: g, found: ok, routeBefore: before, routeAfter: r.hostRoute, jumped: r.hostRoute.startsWith('/games/') });
      await h.shotAll(`picked-${g}`);
      if (r.hostRoute.startsWith('/games/')) break;
    }
    log.pickerButtons = await buttons(host);
    if (!(await host.route()).startsWith('/games/')) {
      // Picker tray "Start" → ready overlay → "Start".
      log.trayStart = await clickRe(host, '^(los geht|let.?s go|spiel starten|start game)');
      await pause(1500); await observe(log, 'tray start', host, tv); await h.shotAll('ready-overlay');
      log.readyButtons = await buttons(host);
      if (!(await host.route()).startsWith('/games/')) { log.readyStart = await clickRe(host, '^(los geht|let.?s go|spiel starten|start game)'); await pause(500); await observe(log, 'ready start', host, tv); }
    }
    await sampleTv(log, host, tv, h);
    await dumpPackets(log, tv, host);
  } catch (e) { log.error = String(e.stack ?? e).slice(0, 600); console.log(`B stopped: ${e.message}`); }
  finally { fs.writeFileSync(`${out}/repro.json`, JSON.stringify(log, null, 1)); await h.close(); }
  return log;
}

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
try {
  for (const [id, fn] of [['A', scenarioA], ['B', scenarioB]]) {
    if (only && only !== id) continue;
    console.log(`Scenario ${id}`); const log = await fn(browser);
    console.log(`  picks: ${JSON.stringify(log.picks)}\n  TV still waiting at the end: ${log.tvWaiting}`);
  }
} finally { await browser.close(); console.log(`Output: ${root}`); }
