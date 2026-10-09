import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:5187';
const output = 'scripts/tmp/taboo-teams';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const report = { cases: [], errors: [], step: 'new-page' };

try {
  const page = await browser.newPage();
  await installLocalGameNetwork(page, origin);
  await page.evaluateOnNewDocument(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  page.on('pageerror', error => report.errors.push(error.message));

  for (const count of [4, 9]) {
    report.step = `${count}:mount`;
    await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
    await page.evaluate(async n => {
      await window.qa.setLanguage('de');
      await window.qa.mountLocal('taboo', { players: Array.from({ length: n }, (_, index) => `Person ${index + 1}`) });
    }, count);
    await page.waitForSelector('[data-testid="taboo-shuffle-teams"]');

    const panels = () => page.$$eval('[data-testid^="taboo-team-"]', nodes => nodes.map(node => node.textContent));
    const before = await panels();
    report.step = `${count}:shuffle`;
    await page.click('[data-testid="taboo-shuffle-teams"]');
    await page.waitForFunction(previous => JSON.stringify([...document.querySelectorAll('[data-testid^="taboo-team-"]')].map(node => node.textContent)) !== JSON.stringify(previous), {}, before);
    const shuffled = await panels();
    const members = shuffled.map(team => [...team.matchAll(/Person \d+/g)].map(match => match[0]));
    assert.equal(members.length, 2);
    assert.ok(Math.abs(members[0].length - members[1].length) <= 1, 'teams must remain balanced');
    assert.deepEqual(members.flat().sort(), Array.from({ length: count }, (_, index) => `Person ${index + 1}`).sort(), 'each person must appear exactly once');
    await page.screenshot({ path: `${output}/setup-${count}.png`, fullPage: true });

    report.step = `${count}:start`;
    const startLabel = await page.evaluate(() => window.qa.translate('games.taboo.setup.startBtn'));
    const start = await page.evaluateHandle(label => [...document.querySelectorAll('button')].find(button => button.textContent?.includes(label) && !button.disabled), startLabel);
    assert.ok(start.asElement(), 'shuffled teams must be startable');
    await start.asElement().click();
    await start.dispose();
    await page.waitForFunction(() => document.querySelector('[data-phase]')?.getAttribute('data-phase') !== 'setup');
    const after = await page.evaluate(() => ({ phase: document.querySelector('[data-phase]')?.getAttribute('data-phase'), text: document.body.innerText, errors: [...window.qaErrors] }));
    assert.ok(after.text.includes(members[0][0]), 'the first turn must use the selected Team A player');
    assert.deepEqual(after.errors, []);
    report.cases.push({ count, before, shuffled, phase: after.phase, firstPlayer: members[0][0] });
  }
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
