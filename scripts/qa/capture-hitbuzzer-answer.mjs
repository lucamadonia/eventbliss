import puppeteer from 'puppeteer';

const origin = process.argv[2] ?? 'http://127.0.0.1:4188';
const output = process.argv[3] ?? 'scripts/tmp';
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
try {
  const page = await browser.newPage();
  page.on('pageerror', error => console.error(error));
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  for (const view of ['active', 'urgent', 'check', 'title', 'artist', 'other', 'history']) {
    await page.goto(`${origin}/scripts/qa/hitbuzzer-answer-browser.html?view=${view}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.screenshot({ path: `${output}/hitbuzzer-${view}.png`, fullPage: true });
  }
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  for (const view of ['answering', 'reviewing', 'reveal']) {
    await page.goto(`${origin}/scripts/qa/hitbuzzer-tv-browser.html?view=${view}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.screenshot({ path: `${output}/hitbuzzer-tv-${view}.png` });
  }
} finally {
  await browser.close();
}
