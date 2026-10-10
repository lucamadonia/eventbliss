import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:5183';
const output = 'scripts/tmp/party-team-roster';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const report = { steps: [], errors: [] };

try {
  const page = await browser.newPage();
  await installLocalGameNetwork(page, origin);
  await page.setViewport({ width: 390, height: 844 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!window.qa);
  await page.evaluate(async () => {
    await window.qa.setLanguage('de');
    await window.qa.mountLocal('closeenough', { players: ['Anna', 'Ben', 'Clara', 'David'] });
  });
  const groupMode = await page.evaluateHandle(() => [...document.querySelectorAll('button')]
    .find((button) => button.textContent?.trim() === 'In Gruppen'));
  assert.ok(groupMode.asElement(), 'Nah dran must offer team mode');
  await groupMode.asElement().click();
  await groupMode.dispose();
  await page.waitForSelector('[data-testid="closeenough-team-setup"]');
  assert.equal(await page.$$eval('[data-testid^="formation-team-"]', (nodes) => nodes.length), 2);
  await page.click('[data-testid="formation-member-qa-0"]');
  assert.ok((await page.$eval('[data-testid="formation-team-1"]', (node) => node.textContent)).includes('Anna'));
  await page.click('[data-testid="team-formation-shuffle"]');
  const input = await page.$('[data-testid="formation-team-0"] input');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await input.type('Zahlenfüchse');
  assert.equal(await page.$eval('[data-testid="formation-team-0"] input', (node) => node.value), 'Zahlenfüchse');
  await page.screenshot({ path: `${output}/nah-dran-setup.png`, fullPage: true });
  report.steps.push('setup');

  await page.waitForFunction(() => !document.querySelector('[data-testid="closeenough-start"]')?.disabled, { timeout: 15000 });
  await page.click('[data-testid="closeenough-start"]');
  await page.waitForSelector('[data-phase="guessing"]');
  await page.waitForSelector('[data-testid="ce-intro"]', { hidden: true });
  const chips = await page.$$eval('[data-testid="team-roster-disclosure"] button', (nodes) => nodes.map((node) => node.textContent));
  assert.equal(chips.length, 2);
  assert.ok(chips.some((chip) => chip.includes('Zahlenfüchse')));
  await page.click('[data-testid="team-roster-disclosure"] button');
  await page.waitForSelector('[data-testid="team-roster-disclosure"] [role="region"]');
  const phoneMembers = await page.$eval('[data-testid="team-roster-disclosure"] [role="region"]', (node) => node.textContent);
  assert.ok(['Anna', 'Ben', 'Clara', 'David'].some((name) => phoneMembers.includes(name)));
  await page.screenshot({ path: `${output}/nah-dran-game.png` });
  report.steps.push('phone-members');

  await page.waitForSelector('[data-testid="ce-key-1"]');
  await page.click('[data-testid="ce-key-1"]');
  await page.click('[data-testid="ce-submit"]');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((button) => /bereit/i.test(button.textContent ?? '') && button.offsetParent !== null));
  const pass = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => /bereit/i.test(button.textContent ?? '') && button.offsetParent !== null));
  assert.ok(pass.asElement(), 'the second team must get its turn');
  await pass.asElement().click();
  await pass.dispose();
  await page.waitForSelector('[data-testid="ce-key-2"]');
  await page.click('[data-testid="ce-key-2"]');
  await page.click('[data-testid="ce-submit"]');
  await page.waitForSelector('[data-phase="reveal"]', { timeout: 15000 });
  assert.ok((await page.$eval('[data-testid="team-roster-disclosure"]', (node) => node.textContent)).includes('Zahlenfüchse'));
  report.steps.push('two-team-round');

  await page.setViewport({ width: 1280, height: 720 });
  const closeEnoughState = {
    phase: 'guessing', round: 1, totalRounds: 7, question: 'Wie viele Sterne?', unitLabel: 'Sterne', timeLeft: 28, totalTime: 40,
    players: [
      { id: 'closeenough-team-1', name: 'Zahlenfüchse', color: '#fbbf24', score: 5, members: ['Anna', 'Ben'], status: 'done' },
      { id: 'closeenough-team-2', name: 'Team 2', color: '#34d399', score: 3, members: ['Clara', 'David'], status: 'thinking' },
    ],
  };
  await page.evaluate((state) => window.qa.mountTV('closeenough', state), closeEnoughState);
  await page.waitForSelector('body');
  const closeTv = await page.evaluate(() => ({ text: document.body.innerText, overflow: document.documentElement.scrollWidth > innerWidth + 2 }));
  assert.ok(['Anna', 'Ben', 'Clara', 'David'].every((name) => closeTv.text.includes(name)));
  assert.equal(closeTv.overflow, false);
  await page.screenshot({ path: `${output}/nah-dran-tv.png` });
  await page.click('[data-testid="tv-team-members-closeenough-team-1"]');
  await page.waitForSelector('[data-testid="tv-team-members-overlay"]');
  assert.ok((await page.$eval('[data-testid="tv-team-members-overlay"]', (node) => node.textContent)).includes('Anna'));
  await page.screenshot({ path: `${output}/nah-dran-tv-members.png` });
  await page.click('[data-testid="tv-team-members-overlay"] [role="dialog"] button');
  report.steps.push('nah-dran-tv');

  const ohrwurmState = {
    phase: 'draw', activeId: 'ohrwurm-team-1', activeName: 'Hitparade', timeLeft: 60, totalTime: 60, winTarget: 10,
    players: [
      { id: 'ohrwurm-team-1', name: 'Hitparade', color: '#ff2e88', score: 2, hooks: 3 },
      { id: 'ohrwurm-team-2', name: 'Team 2', color: '#26e0c4', score: 1, hooks: 2 },
    ],
    teams: [
      { id: 'ohrwurm-team-1', name: 'Hitparade', players: ['Anna', 'Ben'] },
      { id: 'ohrwurm-team-2', name: 'Team 2', players: ['Clara', 'David'] },
    ], timeline: [], listening: false, previewUrl: null,
  };
  await page.evaluate((state) => window.qa.mountTV('ohrwurm', state), ohrwurmState);
  const ohrTv = await page.evaluate(() => ({ text: document.body.innerText, overflow: document.documentElement.scrollWidth > innerWidth + 2 }));
  assert.ok(['Anna', 'Ben', 'Clara', 'David'].every((name) => ohrTv.text.includes(name)));
  assert.equal(ohrTv.overflow, false);
  await page.screenshot({ path: `${output}/ohrwurm-tv.png` });
  await page.click('[data-testid="tv-team-members-ohrwurm-team-1"]');
  await page.waitForSelector('[data-testid="tv-team-members-overlay"]');
  assert.ok((await page.$eval('[data-testid="tv-team-members-overlay"]', (node) => node.textContent)).includes('Ben'));
  report.steps.push('ohrwurm-tv');
  assert.deepEqual(await page.evaluate(() => window.qaErrors), []);
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
