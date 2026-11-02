import puppeteer from 'puppeteer';

const origin = process.argv[2] ?? 'http://127.0.0.1:4187';
const output = process.argv[3] ?? 'scripts/tmp/splash-preview.png';
const phase = process.argv[4] ?? 'play';
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', error => console.error(error));
  await page.goto(`${origin}/scripts/qa/splash-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector(`[data-splash-phase="${phase}"]`, { timeout: 120000 });
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.screenshot({ path: output });
} finally {
  await browser.close();
}
