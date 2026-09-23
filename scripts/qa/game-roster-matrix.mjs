import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:5184';
const filter = process.argv[3];
const folder = `scripts/tmp/game-roster-matrix${filter ? `-${filter}` : ''}`;
await fs.mkdir(folder, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000, protocolTimeout: 120000 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { scope: 'Actual local game UI at registry minimum/maximum players; English start then Arabic RTL display. Synthetic CloseEnough/Pixeljagd content, no external requests. Not complete game-mode or native acceptance.', cases: [] };
try {
  const page = await browser.newPage();
  await installLocalGameNetwork(page, origin);
  await page.setViewport({ width: 320, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => {
    // Each boundary is a fresh party; restored game state must not reuse the previous roster.
    localStorage.clear(); sessionStorage.clear();
    const Native = WebSocket;
    class QuietHMR extends EventTarget { readyState = 0; send() {} close() {} }
    window.WebSocket = new Proxy(Native, { construct(target, args) { return args[1] === 'vite-hmr' ? new QuietHMR() : Reflect.construct(target, args); } });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function load() {
    await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
    await page.evaluate(() => qa.setLanguage('en'));
  }
  await load();
  const games = await page.evaluate(async () => (await import('/src/lib/playable-games.ts')).playableGames.map(({ id, minPlayers, maxPlayers }) => ({ id, minPlayers, maxPlayers })));
  async function click(pattern) {
    const handle = await page.evaluateHandle(pattern => [...document.querySelectorAll('button')].find(b => !b.disabled && b.getBoundingClientRect().height > 0 && new RegExp(pattern, 'i').test(b.innerText.trim())), pattern);
    const button = handle.asElement();
    if (!button) { await handle.dispose(); return false; }
    await button.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await pause(450); await button.click(); await handle.dispose(); await pause(450); return true;
  }
  async function view() {
    return page.evaluate(() => ({ text: document.body.innerText.slice(0, 3200), errors: [...qaErrors], width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth + 2, direction: document.documentElement.dir,
      geometry: [...document.querySelectorAll('#root, [data-game-stage], [data-game-stage] > div, .stage-header, .stage-action')].slice(0, 18).map(node => {
        const box = node.getBoundingClientRect(), css = getComputedStyle(node);
        return { tag: node.tagName, classes: node.className, x: box.x, width: box.width, transform: css.transform, minWidth: css.minWidth };
      }) }));
  }
  for (const game of games) for (const boundary of ['min', 'max']) {
    if (filter && game.id !== filter) continue;
    const count = game[boundary === 'min' ? 'minPlayers' : 'maxPlayers'];
    const result = { game: game.id, boundary, count };
    try {
      errors.length = 0; await load();
      await page.evaluate(({ game, count }) => qa.mountLocal(game, { players: Array.from({ length: count }, (_, i) => `Player ${i + 1}`) }), { game: game.id, count });
      await pause(900);
      result.setup = await view();
      if (game.id === 'flaschendrehen') await click('^(continue|prepare|next)');
      if (game.id === 'headup') await click('celebrit');
      if (game.id === 'pantomime') await click('all categories|mix');
      result.started = await click('^(start\\b|play\\b|let.s\\b|begin\\b|curtain\\b|los\\b|bereit\\b)');
      if (result.started) await page.waitForFunction(previous => document.body.innerText.slice(0, 3200) !== previous, { timeout: 10000 }, result.setup.text);
      await pause(game.id === 'category' ? 3500 : 600);
      result.play = await view();
      await page.evaluate(() => qa.setLanguage('ar')); await pause(450);
      result.rtl = await view();
      result.errors = errors.slice();
      result.passed = result.started && result.setup.text !== result.play.text && [result.setup, result.play, result.rtl].every(state => !state.overflow && !state.errors.length) && !errors.length && result.rtl.direction === 'rtl';
      await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
      await page.screenshot({ path: `${folder}/${game.id}-${boundary}-rtl.png`, fullPage: false });
    } catch (error) { result.failure = String(error.stack ?? error); result.passed = false; }
    report.cases.push(result);
    await fs.writeFile(`${folder}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ game: game.id, boundary, count, passed: result.passed, failure: result.failure, overflow: [result.setup, result.play, result.rtl].map(s => s?.overflow) }));
  }
} finally { await browser.close(); }
if (report.cases.some(result => !result.passed)) process.exitCode = 1;
