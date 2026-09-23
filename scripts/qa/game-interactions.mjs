import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Local browser fixture only. External HTTP requests are blocked, including cloud writes.
const origin = process.env.QA_ORIGIN ?? 'http://127.0.0.1:5180';
const output = 'scripts/tmp/game-interactions';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000, protocolTimeout: 120000 });
let page;
const report = { checks: [], screenshots: [], errors: [] };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  const context = await browser.createBrowserContext();
  page = await context.newPage();
  await page.evaluateOnNewDocument(() => {
    const NativeSocket = window.WebSocket;
    class QuietHMR extends EventTarget { readyState = 0; send() {} close() {} }
    window.WebSocket = new Proxy(NativeSocket, { construct(target, args) {
      return args[1] === 'vite-hmr' ? new QuietHMR() : Reflect.construct(target, args);
    } });
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  page.setDefaultTimeout(30000);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url) && new URL(url).origin !== origin) void request.abort();
    else void request.continue();
  });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.qa, { timeout: 120000 });
  await page.evaluate(async () => { await window.qa.setLanguage('de'); await window.qa.mountLocal('schnellzeichner'); });
  await pause(700);
  const clickKey = async key => {
    const label = await page.evaluate(key => window.qa.translate(key), key);
    const button = await page.evaluateHandle(label => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === label || button.getAttribute('aria-label') === label), label);
    assert.ok(button.asElement(), `Button missing: ${key} (${label})`);
    await button.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await pause(150);
    await button.asElement().click();
    await button.dispose();
    await pause(500);
  };
  const blind = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Zeichnung nach 5s unsichtbar')));
  await blind.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await pause(150);
  await blind.asElement().click();
  await blind.dispose();
  await pause(500);
  await clickKey('games.setup.startGame');
  await clickKey('games.quickdraw.startDrawing');
  await page.waitForSelector('canvas');
  await pause(150);
  const snapshot = () => page.$eval('canvas', canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] && data[i] < 200) ink++;
    return { ink, dataURL: canvas.toDataURL(), opacity: getComputedStyle(canvas).opacity };
  });
  const stroke = async offset => {
    const canvas = await page.$('canvas');
    await canvas.scrollIntoView();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * .2, box.y + box.height * offset);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .8, box.y + box.height * offset, { steps: 12 });
    await page.mouse.up();
  };
  await stroke(.3);
  const first = await snapshot();
  assert.ok(first.ink > 0, 'First stroke must draw');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('canvas')).opacity === '0', { timeout: 8000 });
  await stroke(.6);
  const second = await snapshot();
  assert.ok(second.ink > first.ink * 1.5, 'A new pointer stroke must work after Blind hides the canvas');
  report.checks.push('Blind: first stroke, release, 5-second hide, second pointer stroke adds ink');
  await page.screenshot({ path: `${output}/blind-mobile.png`, fullPage: true });
  report.screenshots.push('blind-mobile.png');
  await clickKey('games.quickdraw.undo');
  const undone = await snapshot();
  assert.equal(undone.dataURL, first.dataURL, 'Undo restores exact initial stroke');
  await clickKey('games.quickdraw.clear');
  const cleared = await snapshot();
  assert.equal(cleared.ink, 0, 'Clear produces a white canvas');
  report.checks.push('Local canvas undo restores exact pixels; clear removes all ink');

  await page.click('#qa-back');
  await page.waitForSelector('[role="alertdialog"]');
  const readTimer = () => page.evaluate(() => Number(document.body.innerText.match(/\b(\d+)s\b/)?.[1]));
  const pausedTime = await readTimer();
  await pause(1300);
  assert.equal(await readTimer(), pausedTime, 'Exit dialog pauses local drawing timer');
  const dialog = await page.$eval('[role="alertdialog"]', element => ({ labelled: !!document.getElementById(element.getAttribute('aria-labelledby')), described: !!document.getElementById(element.getAttribute('aria-describedby')), focused: element.contains(document.activeElement) }));
  assert.ok(dialog.labelled && dialog.described && dialog.focused, 'Exit dialog must be named, described and focus-contained');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    assert.ok(await page.$eval('[role="alertdialog"]', element => element.contains(document.activeElement)), 'Tab must remain in dialog');
  }
  await page.screenshot({ path: `${output}/exit-mobile.png`, fullPage: true });
  report.screenshots.push('exit-mobile.png');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="alertdialog"]', { hidden: true });
  report.focusRestored = await page.evaluate(() => document.activeElement.id === 'qa-back');
  await pause(1300);
  assert.ok(await readTimer() < pausedTime, 'Escape resumes local drawing timer');
  report.checks.push('Exit dialog: accessible name/description, initial focus, Tab containment and Escape');
  report.checks.push('Drawing countdown pauses while exit dialog is open and resumes after Escape');

  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  const state = { phase: 'drawing', drawer: 'Anna', round: 1, totalRounds: 8, timeLeft: 40, maxTime: 60 };
  await page.evaluate(async state => window.qa.mountTV('draw', state), { ...state, drawingDataURL: second.dataURL });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas?.getContext('2d').getImageData(140, 420, 1, 1).data[0] < 200;
  });
  const tvSecond = await snapshot();
  await page.evaluate(state => window.qa.updateTV(state), { ...state, drawingDataURL: undone.dataURL });
  await page.waitForFunction(() => document.querySelector('canvas').getContext('2d').getImageData(350, 420, 1, 1).data[0] === 255);
  const tvUndone = await snapshot();
  assert.ok(tvUndone.ink > 0 && tvUndone.ink < tvSecond.ink * .7, 'TV replaces full drawing after undo');
  await page.screenshot({ path: `${output}/tv-undo.png`, fullPage: true });
  report.screenshots.push('tv-undo.png');
  await page.evaluate(state => window.qa.updateTV(state), { ...state, drawingDataURL: cleared.dataURL });
  await page.waitForFunction(() => {
    const data = document.querySelector('canvas').getContext('2d').getImageData(0, 0, 700, 700).data;
    return !data.some((value, index) => index % 4 === 0 && value < 200);
  });
  assert.equal((await snapshot()).ink, 0);
  report.checks.push('Same mounted production TVDrawView replaces actual canvas images after undo and clear');
  report.errors.push(...await page.evaluate(() => window.qaErrors));
  assert.deepEqual(report.errors, []);
  assert.ok(report.focusRestored, 'Escape must restore focus to back button');
  report.limitation = 'Source snapshots passed through local fixture; cloud transport, physical touch hardware and native Back remain separate acceptance.';
} catch (error) {
  report.failure = error.stack;
  report.body = page ? await page.evaluate(() => document.body.innerText).catch(() => '') : '';
  if (page) await page.screenshot({ path: output + '/failure.png' }).catch(() => {});
  process.exitCode = 1;
} finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
