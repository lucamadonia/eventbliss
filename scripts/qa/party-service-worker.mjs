import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

// Uses the actual generated Workbox worker and production assets. Only the
// precached index response is poisoned, in an isolated temporary browser.
const dist = path.resolve(process.argv[2] ?? 'dist');
const output = 'scripts/tmp/party-service-worker';
await fs.mkdir(output, { recursive: true });
const sw = await fs.readFile(path.join(dist, 'sw.js'));
const app = await fs.readFile(path.join(dist, 'app.html'));
const requests = [];
const report = { swSha256: createHash('sha256').update(sw).digest('hex'), appSha256: createHash('sha256').update(app).digest('hex'), checks: [], errors: [] };
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    requests.push(pathname);
    res.setHeader('Cache-Control', 'no-store');
    if (pathname === '/qa-sw-bootstrap') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>Isolated service worker QA</title><body>Installing the production service worker</body>');
      return;
    }
    // Match the extensionless app.html rewrite in vercel.json.
    const relative = !path.extname(pathname) ? 'app.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end('QA server: file missing'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  console.log('Opening isolated browser with built production worker');
  browser = await puppeteer.launch({ headless: true, timeout: 120000, protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => /^https?:/.test(request.url()) && new URL(request.url()).origin !== origin ? request.abort() : request.continue());
  await page.goto(`${origin}/qa-sw-bootstrap`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller, { timeout: 120000 });
  console.log('Production worker controls page; seeding stale cached shell');
  const seeded = await page.evaluate(async () => {
    const matches = [];
    for (const name of await caches.keys()) {
      if (!name.includes('precache')) continue;
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (new URL(request.url).pathname !== '/index.html') continue;
        await cache.put(request, new Response('<!doctype html><h1 id="stale-404">404 — obsolete cached app shell</h1>', { headers: { 'Content-Type': 'text/html' } }));
        matches.push(name);
      }
    }
    return matches;
  });
  assert.ok(seeded.length, 'Production worker did not precache index.html; fixture needs reassessment');
  const control = await page.goto(`${origin}/qa-stale-control`);
  await page.waitForSelector('#stale-404');
  // Chrome may return null when a controlling worker replaces the navigation.
  // The poisoned marker plus absence of a server request proves the same path.
  if (control) assert.equal(control.fromServiceWorker(), true, 'Control must exercise the poisoned Workbox fallback');
  assert.equal(requests.includes('/qa-stale-control'), false, 'Control must not reach the server');
  report.checks.push('Control route renders the deliberately obsolete cached 404 through the real service worker');
  const before = requests.filter(url => url === '/party/join/JL2D6Z').length;
  const invitation = await page.goto(`${origin}/party/join/JL2D6Z`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('a[href="eventbliss://party/join/JL2D6Z"]', { timeout: 120000 });
  assert.equal(await page.$('#stale-404'), null);
  if (invitation) {
    assert.equal(invitation.status(), 200);
    assert.equal(invitation.fromServiceWorker(), false, 'Invitation navigation must bypass cached index fallback');
  }
  assert.ok(requests.filter(url => url === '/party/join/JL2D6Z').length > before, 'Invitation must reach the server rewrite');
  assert.equal(await page.$('input'), null, 'Web invitation must show app handoff rather than browser join');
  await page.screenshot({ path: `${output}/invitation-390.png`, fullPage: true });
  report.checks.push('Party invitation bypasses poisoned shell and reaches real app.html with working app handoff');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
