import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://127.0.0.1:5181';
const output = 'scripts/tmp/pantomime-presentation';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000 });
const report = { checks: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', r => /^https?:/.test(r.url()) && new URL(r.url()).origin !== origin ? r.abort() : r.continue());
  page.on('pageerror', e => report.errors.push(e.message));
  await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.qa, { timeout: 120000 });
  await page.evaluate(() => window.qa.setLanguage('de'));
  const click = async key => {
    const button = await page.evaluateHandle(key => [...document.querySelectorAll('button')].find(b => !b.disabled && b.textContent.trim() === window.qa.translate(key)), key);
    assert.ok(button.asElement(), `Missing action ${key}`);
    await button.asElement().evaluate(b => b.scrollIntoView({ block: 'center' }));
    await button.asElement().click(); await button.dispose();
  };
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    await page.setViewport({ width, height });
    await page.evaluate(() => { localStorage.removeItem('eb.gamesnap.pantomime'); return window.qa.mountLocal('pantomime'); });
    await page.waitForSelector('.pantomime-hero');
    await page.waitForFunction(() => document.querySelector('.pantomime-hero').naturalWidth > 0);
    await page.screenshot({ path: `${output}/${width}-setup.png`, fullPage: true });
    await click('games.pantomime.start');
    await click('games.pantomime.ready');
    await page.waitForFunction(() => document.querySelector('.theater-cue') || [...document.querySelectorAll('button')].some(b => b.textContent.trim() === window.qa.translate('games.pantomime.extraDecline')));
    if (!await page.$('.theater-cue')) await click('games.pantomime.extraDecline');
    await page.waitForSelector('.theater-cue');
    await new Promise(resolve => setTimeout(resolve, 600));
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, width: document.querySelector('.theater-cue').getBoundingClientRect().width, overflow: document.documentElement.scrollWidth - innerWidth }));
    assert.ok(metrics.overflow <= 1, 'Horizontal overflow');
    assert.ok(metrics.width >= width * (width < 500 ? .85 : .7), 'Word stage too narrow');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${width}-playing.png`, fullPage: true });
    const before = await page.$eval('.theater-cue', e => e.textContent);
    await click('games.pantomime.guessed');
    await page.waitForFunction(before => document.querySelector('.theater-cue')?.textContent !== before, {}, before);
    report.checks.push({ width, height, metrics, guessedAdvances: true });
  }
  assert.deepEqual(report.errors, []);
} catch (error) { report.failure = error.stack; process.exitCode = 1; }
finally { await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser.close(); }
