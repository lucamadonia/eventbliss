import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = process.argv[2] ?? process.env.QA_ORIGIN ?? 'http://127.0.0.1:5180';
const output = 'scripts/tmp/controller-web-fallback';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000 });
const report = { views: [], errors: [], blockedMutations: [] };
let page;
try {
  const context = await browser.createBrowserContext();
  page = await context.newPage();
  await page.evaluateOnNewDocument(() => {
    const NativeSocket = window.WebSocket;
    class QuietHMR extends EventTarget { readyState = 0; send() {} close() {} }
    window.WebSocket = new Proxy(NativeSocket, { construct(target, args) { return args[1] === 'vite-hmr' ? new QuietHMR() : Reflect.construct(target, args); } });
  });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) console.log('Local HTTP error', response.status(), response.url()); });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) report.blockedMutations.push({ method: request.method(), url: new URL(request.url()).pathname });
      void request.abort();
    } else void request.continue();
  });
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    await page.goto(`${origin}/party/join/ABCDEF`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Route loaded', width, page.url());
    await page.waitForSelector('a[href="eventbliss://party/join/ABCDEF"]', { timeout: 30000 });
    const view = await page.evaluate(() => {
      const main = document.querySelector('a[href^="eventbliss://party/join/"]').closest('main');
      return { width: innerWidth, text: main.innerText, overflow: document.documentElement.scrollWidth > innerWidth, inputs: main.querySelectorAll('input').length, buttons: main.querySelectorAll('button').length, links: [...main.querySelectorAll('a')].map(link => ({ text: link.textContent, href: link.getAttribute('href') })) };
    });
    assert.equal(view.overflow, false);
    assert.equal(view.inputs, 0, 'Web fallback must not offer browser controller joining');
    assert.equal(view.buttons, 0);
    assert.ok(view.text.includes('ABCDEF'));
    assert.ok(view.links.some(link => link.href === 'eventbliss://party/join/ABCDEF'));
    assert.ok(view.links.some(link => link.href.includes('apps.apple.com')));
    assert.ok(view.links.some(link => link.href.includes('play.google.com')));
    await page.screenshot({ path: `${output}/join-${width}.png`, fullPage: true });
    report.views.push(view);
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.blockedMutations, [], 'Fallback must not attempt cloud writes');
  report.limitations = 'Actual web route only; native auth, installed-app deep-link launch, controller join and cloud transport not exercised.';
} catch (error) {
  report.failure = error.stack;
  report.body = await page?.evaluate(() => document.body.innerText);
  report.url = page?.url();
  await page?.screenshot({ path: `${output}/failure.png`, fullPage: true });
  process.exitCode = 1;
}
finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
