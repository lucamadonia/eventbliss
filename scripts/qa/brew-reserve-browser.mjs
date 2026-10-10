// Exercise both setup choices through an actual local game in the browser.
// Run against scripts/qa/games-browser.html on port 5180.
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5180';
const out = 'scripts/tmp/brew-reserve';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const report = { modes: {} };
let activePage;
const browserErrors = [];

async function read(page) {
  return page.evaluate(() => {
    const node = document.querySelector('[data-testid="brew-playing"]');
    if (!node) return null;
    return {
      withTray: node.getAttribute('data-with-tray') === 'true',
      tray: Number(node.getAttribute('data-tray-count')),
      counter: Number(node.getAttribute('data-counter-count')),
      glass: Number(node.getAttribute('data-glass-count')),
      active: node.getAttribute('data-active-id'),
      penalty: !!document.querySelector('[data-testid="brew-penalty-overlay"]'),
      drawDisabled: document.querySelector('[data-testid="brew-draw"]')?.disabled,
    };
  });
}

try {
  const [page] = await browser.pages();
  activePage = page;
  page.on('pageerror', error => browserErrors.push(String(error)));
  page.on('requestfailed', request => browserErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  await installLocalGameNetwork(page, base);
  for (const withTray of [false, true]) {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`${base}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => !!window.qa, { timeout: 15000 });
    await page.evaluate(async () => { await window.qa.setLanguage('de'); await window.qa.mountLocal('brew', { players: ['Anna', 'Ben'] }); });
    await page.waitForSelector('[data-testid="brew-with-tray"]');
    const defaultChoice = await page.$eval('[data-testid="brew-with-tray"]', node => node.getAttribute('aria-pressed'));
    assert(defaultChoice === 'true', 'existing tray mode must be the default');
    if (!withTray) await page.click('[data-testid="brew-without-tray"]');
    const selected = await page.$eval(`[data-testid="brew-${withTray ? 'with' : 'without'}-tray"]`, node => node.getAttribute('aria-pressed'));
    assert(selected === 'true', `mode choice did not stick: ${withTray}`);
    await page.screenshot({ path: `${out}/setup-${withTray ? 'tray' : 'direct'}.png` });
    await page.click('[data-testid="brew-start"]');
    await page.waitForSelector('[data-testid="brew-playing"]', { timeout: 15000 });
    let state = await read(page);
    assert(state.withTray === withTray, `round did not receive mode: ${withTray}`);
    assert(!!(await page.$(`[data-testid="brew-${withTray ? 'pour' : 'end-turn'}"]`)), 'wrong action for selected mode');
    const draws = [];
    let lostReserve = false;
    for (let i = 0; i < 40; i++) {
      await page.waitForFunction(() => {
        const b = document.querySelector('[data-testid="brew-draw"]');
        return !!b && !b.disabled;
      }, { timeout: 12000 });
      const before = await read(page);
      await page.click('[data-testid="brew-draw"]');
      await pause(1100);
      state = await read(page);
      draws.push({ before, after: state });
      if (state?.penalty) {
        assert(state.tray === 0, 'curfew did not clear drawn cards');
        assert(state.glass === before.glass, 'curfew changed previously secured ingredients');
        if (before.tray > 0) lostReserve = true;
        await page.click('[data-testid="brew-penalty-continue"]');
        await pause(300);
        if (lostReserve) break;
      } else {
        assert(state?.tray === before.tray + 1, 'drawn ingredient was not held at risk');
        assert(state.glass === before.glass, 'drawn ingredient was secured before the turn ended');
        assert(state.counter === before.counter, 'drawn ingredient reached the counter before the turn ended');
      }
    }
    assert(lostReserve, 'did not observe curfew after drawing ingredients');
    for (let i = 0; i < 20; i++) {
      await page.waitForFunction(() => {
        const b = document.querySelector('[data-testid="brew-draw"]');
        return !!b && !b.disabled;
      }, { timeout: 12000 });
      await page.click('[data-testid="brew-draw"]');
      await pause(1100);
      state = await read(page);
      if (state?.penalty) {
        await page.click('[data-testid="brew-penalty-continue"]');
        await pause(300);
      } else if (state?.tray > 0) break;
    }
    assert(state?.tray > 0, 'could not draw an ingredient to secure');
    const beforeBank = state;
    const active = state.active;
    await page.click(withTray ? '[data-testid="brew-pour"]' : '[data-testid="brew-end-turn"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="brew-playing"]')?.getAttribute('data-tray-count') === '0', { timeout: 10000 });
    state = await read(page);
    assert(state.glass + state.counter > beforeBank.glass + beforeBank.counter, 'ending the turn did not secure or share drawn ingredients');
    await page.waitForFunction(id => document.querySelector('[data-testid="brew-playing"]')?.getAttribute('data-active-id') !== id, { timeout: 10000 }, active);
    state = await read(page);
    await page.screenshot({ path: `${out}/played-${withTray ? 'tray' : 'direct'}.png` });
    const errors = await page.evaluate(() => window.qaErrors);
    assert(errors.length === 0, `browser errors in ${withTray ? 'tray' : 'direct'} mode: ${errors.join('; ')}`);
    report.modes[withTray ? 'tray' : 'direct'] = { passed: true, draws: draws.length, lostReserve, final: state };
  }
  console.log(JSON.stringify(report));
} catch (error) {
  report.error = String(error.stack ?? error);
  if (activePage) {
    report.browser = await activePage.evaluate(() => ({ text: document.body.innerText.slice(0, 1600), errors: window.qaErrors ?? [] })).catch(() => null);
    report.browserErrors = browserErrors.slice(0, 30);
    await activePage.screenshot({ path: `${out}/failure.png` }).catch(() => {});
  }
  console.error(report.error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
