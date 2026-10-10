import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:5184';
const output = 'scripts/tmp/ohrwurm-teams';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const report = { cases: [], errors: [] };

const assignments = (count) => Array.from({ length: count }, (_, index) =>
  Number(document.querySelector(`[data-testid="formation-member-qa-${index}"]`)
    ?.closest('[data-testid^="formation-team-"]')?.getAttribute('data-testid')?.split('-').at(-1)));
const teams = () => [...document.querySelectorAll('[data-testid^="formation-team-"]')].map((node) => node.textContent);
async function read(page, count) {
  return {
    assignments: await page.evaluate(assignments, count),
    teams: await page.evaluate(teams),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2),
  };
}

try {
  const page = await browser.newPage();
  await installLocalGameNetwork(page, origin);
  await page.evaluateOnNewDocument(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (error) => report.errors.push(error.message));
  for (const count of [3, 9]) {
    report.step = `${count}:open`;
    await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
    await page.evaluate(async (n) => {
      await window.qa.setLanguage('de');
      await window.qa.mountLocal('ohrwurm', { players: Array.from({ length: n }, (_, index) => `Person ${index + 1}`) });
    }, count);
    if (count === 3) {
      const groupMode = await page.evaluateHandle(() => [...document.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Generationen-Teams')));
      assert.ok(groupMode.asElement(), 'three people can choose group mode');
      await groupMode.asElement().click();
      await groupMode.dispose();
    }
    report.step = `${count}:setup`;
    await page.waitForSelector('[data-testid="ohrwurm-team-setup"]', { timeout: 15000 });
    const before = await read(page, count);
    assert.equal(before.assignments.length, count);
    assert.ok(before.assignments.every(Number.isInteger));
    assert.equal(before.teams.length, 2);
    assert.equal(before.overflow, false);

    if (count === 9) {
      report.step = `${count}:add-team`;
      const add = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.trim().startsWith('+')));
      assert.ok(add.asElement());
      await add.asElement().click();
      await add.dispose();
      await page.waitForSelector('[data-testid="formation-team-2"]');
      assert.ok((await page.$eval('[data-testid="formation-team-2"]', (node) => node.textContent)).includes('Person 9'));
      const reassigned = await page.evaluate(assignments, count);
      assert.deepEqual(reassigned, [...before.assignments.slice(0, -1), 2]);
    }

    report.step = `${count}:move`;
    await page.click('[data-testid="formation-member-qa-0"]');
    assert.ok((await page.$eval('[data-testid="formation-team-1"]', (node) => node.textContent)).includes('Person 1'));
    const previous = await page.evaluate(assignments, count);
    report.step = `${count}:shuffle`;
    await page.click('[data-testid="team-formation-shuffle"]');
    await page.waitForFunction(({ count: n, previous: old }) => JSON.stringify(Array.from({ length: n }, (_, index) =>
      Number(document.querySelector(`[data-testid="formation-member-qa-${index}"]`)
        ?.closest('[data-testid^="formation-team-"]')?.getAttribute('data-testid')?.split('-').at(-1)))) !== JSON.stringify(old), {}, { count, previous });
    const shuffled = await read(page, count);
    const sizes = shuffled.teams.map((_, team) => shuffled.assignments.filter((assigned) => assigned === team).length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, 'reshuffle must balance teams');
    shuffled.assignments.forEach((team, index) => assert.ok(shuffled.teams[team].includes(`Person ${index + 1}`)));

    report.step = `${count}:rename`;
    const input = await page.$('[data-testid="formation-team-0"] input');
    await input.click({ clickCount: 3 });
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await input.type('Hitparade');
    assert.equal(await page.$eval('[data-testid="formation-team-0"] input', (node) => node.value), 'Hitparade');
    await page.screenshot({ path: `${output}/setup-${count}.png`, fullPage: true });

    report.step = `${count}:start`;
    const start = await page.evaluateHandle(() => [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Spiel starten') && !button.disabled));
    assert.ok(start.asElement());
    await start.asElement().click();
    await start.dispose();
    await page.waitForSelector('[data-phase="draw"]', { timeout: 15000 });
    const after = await page.evaluate(() => ({
      scoreboard: [...document.querySelectorAll('[data-phase="draw"] .snap-start')].map((node) => node.textContent),
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
      errors: [...window.qaErrors],
    }));
    assert.equal(after.scoreboard.length, count === 9 ? 3 : 2);
    assert.ok(after.scoreboard.some((text) => text.includes('Hitparade')));
    await page.click('[data-phase="draw"] .snap-start');
    const memberList = await page.$eval('[role="region"]', (node) => node.textContent);
    assert.ok(memberList.includes('Person'));
    assert.equal(after.overflow, false);
    assert.deepEqual(after.errors, []);
    report.cases.push({ count, before, shuffled, after, memberList });
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
