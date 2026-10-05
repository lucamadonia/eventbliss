// Reproduce the cocktail glass after the first pour on the 1920x1080 TV fixture.
import fs from 'node:fs';
import puppeteer from 'puppeteer';

const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5180';
const out = 'scripts/tmp/brew-tv-glass';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`${base}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!window.qa, { timeout: 30000 });
  await page.evaluate(() => qa.setLanguage('de'));
  const player = (id, name, glass) => ({ id, name, color: '#df8eff', avatar: '🍹', score: 0, glass, recipeNeeds: ['base1', 'herb', 'sour', 'sugar', 'fizz'], recipeId: 's5' });
  const state = glass => ({ skin: 'bar', phase: 'playing', activeId: 'p1', activeIdx: 0, activeName: 'Host', deckCount: 20, counter: [], tray: [], players: [player('p1', 'Host', glass), player('p2', 'Lena', []), player('p3', 'Gerda', [])] });
  await page.evaluate(s => qa.mountTV('brew', s), state([]));
  await page.screenshot({ path: `${out}/before.png` });
  await page.evaluate(s => qa.updateTV(s), state(['base1']));
  await new Promise(resolve => setTimeout(resolve, 2400));
  await page.screenshot({ path: `${out}/after-one-pour.png` });
  await page.evaluate(s => qa.updateTV(s), state(['base1', 'herb']));
  await new Promise(resolve => setTimeout(resolve, 2400));
  await page.screenshot({ path: `${out}/after-two-pours.png` });
  const result = await page.evaluate(() => ({ errors: window.qaErrors, layers: document.querySelectorAll('[data-liquid-layer]').length, masks: [...document.querySelectorAll('[data-liquid-layer]')].map(node => node.getAttribute('mask')), generated: document.querySelectorAll('[data-testid^="brew-generated-glass-"]').length }));
  console.log(JSON.stringify({ out, ...result }));
} finally { await browser.close(); }
