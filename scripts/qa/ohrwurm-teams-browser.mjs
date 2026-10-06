import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:5184';
const output = 'scripts/tmp/ohrwurm-teams';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const report = { cases: [], errors: [] };

try {
  const page = await browser.newPage();
  await installLocalGameNetwork(page, origin);
  await page.evaluateOnNewDocument(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (error) => report.errors.push(error.message));
  for (const count of [3, 9]) {
    await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
    await page.evaluate(async (n) => {
      await window.qa.setLanguage('de');
      await window.qa.mountLocal('ohrwurm', { players: Array.from({ length: n }, (_, i) => `Person ${i + 1}`) });
    }, count);
    if (count === 3) {
      await page.waitForSelector('button[aria-pressed="false"]');
      const groupMode = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Generationen-Teams')));
      assert.ok(groupMode.asElement(), 'group mode must be offered to three people');
      await groupMode.asElement().click();
      await groupMode.dispose();
    }
    await page.waitForSelector('[data-testid="ohrwurm-team-setup"]', { timeout: 15000 });
    const before = await page.evaluate(() => ({
      assignments: [...document.querySelectorAll('[data-testid="ohrwurm-team-setup"] select')].map((node) => node.value),
      teams: [...document.querySelectorAll('[data-testid^="ohrwurm-team-"]')].filter((node) => /^ohrwurm-team-\d+$/.test(node.getAttribute('data-testid'))).map((node) => node.textContent),
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
    }));
    assert.equal(before.assignments.length, count, 'every person must get a team assignment');
    assert.equal(before.teams.length, 2, 'two teams must be created by default');
    assert.equal(before.overflow, false, 'setup must fit a phone viewport');
    if (count === 9) {
      const add = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Team hinzufügen')));
      assert.ok(add.asElement());
      await add.asElement().click();
      await add.dispose();
      await page.waitForSelector('[data-testid="ohrwurm-team-2"]');
      const third = await page.$eval('[data-testid="ohrwurm-team-2"]', (node) => node.textContent);
      assert.ok(third.includes('Person 9'), 'the new team must receive a member');
      const reassigned = await page.$$eval('[data-testid="ohrwurm-team-setup"] select', (nodes) => nodes.map((node) => node.value));
      assert.deepEqual(reassigned, [...before.assignments.slice(0, -1), '2'], 'adding a team must not move the other members');
    }
    const first = '[data-testid="ohrwurm-team-setup"] select';
    await page.select(first, '1');
    const moved = await page.$eval('[data-testid="ohrwurm-team-1"]', (node) => node.textContent);
    assert.ok(moved.includes('Person 1'), 'moving a person must update the team roster');
    await page.screenshot({ path: `${output}/setup-${count}.png`, fullPage: true });
    const start = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Spiel starten') && !button.disabled));
    assert.ok(start.asElement(), 'the configured teams must be startable');
    await start.asElement().click();
    await start.dispose();
    await page.waitForSelector('[data-phase="draw"]', { timeout: 15000 });
    const after = await page.evaluate(() => ({
      phase: document.querySelector('[data-phase]')?.getAttribute('data-phase'),
      scoreboard: [...document.querySelectorAll('[data-phase="draw"] .snap-start')].map((node) => node.textContent),
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
      errors: [...window.qaErrors],
    }));
    assert.equal(after.scoreboard.length, count === 9 ? 3 : 2, 'the game must run with the configured shared team timelines');
    assert.equal(after.overflow, false, 'game must fit a phone viewport');
    assert.deepEqual(after.errors, []);
    report.cases.push({ count, before, after, moved });
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
