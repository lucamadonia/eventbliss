import puppeteer from 'puppeteer';
import fs from 'node:fs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5183';
const out = 'scripts/tmp/tv-party-finale';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000, protocolTimeout: 120000 });
const report = [];
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) || request.url().startsWith('data:')
    ? request.continue() : request.abort('blockedbyclient'));
  await page.goto(`${base}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('TV QA page loaded');
  await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
  console.log('TV QA fixture ready');
  await page.evaluate(() => qa.setLanguage('de'));
  for (const [width, height] of [[1280, 720], [1920, 1080]]) {
    await page.setViewport({ width, height });
    await page.evaluate(() => qa.mountTVFinale());
    console.log(`TV finale mounted at ${width}x${height}`);
    await page.waitForSelector('[data-testid="tv-finale-board"]', { timeout: 120000 });
    const result = await page.evaluate(() => {
      const finale = document.querySelector('[data-testid="tv-party-finale"]');
      const winner = document.querySelector('[data-testid="tv-finale-winner"]');
      const board = document.querySelector('[data-testid="tv-finale-board"]');
      const rect = winner?.getBoundingClientRect();
      return {
        winner: winner?.textContent?.trim(),
        board: board?.textContent?.trim(),
        podiumPoints: ['anna', 'ben', 'clara'].map(id => document.querySelector(`[data-testid="tv-podium-points-${id}"]`)?.textContent?.trim()),
        beat: finale?.getAttribute('data-beat'),
        overflow: document.documentElement.scrollWidth > innerWidth,
        winnerVisible: !!rect && rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
        runtimeErrors: window.qaErrors,
      };
    });
    if (!result.winner?.includes('Anna') || !result.winner.includes('47') ||
      !['Anna', 'Ben', 'Clara', 'David'].every(name => result.board?.includes(name)) ||
      result.board?.includes('Tom') || result.podiumPoints.join(',') !== '47,39,31' ||
      result.beat !== '3' || result.overflow || !result.winnerVisible ||
      errors.length || result.runtimeErrors.length) throw Error(JSON.stringify({ width, height, result, errors }));
    await page.screenshot({ path: `${out}/finale-${width}x${height}.png` });
    report.push({ width, height, ...result });
  }
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluate(() => qa.mountTVFinale(2000));
  await page.waitForFunction(() => document.querySelector('[data-testid="tv-party-finale"]')?.getAttribute('data-beat') === '1');
  await new Promise(resolve => setTimeout(resolve, 240));
  const revealPoints = await page.evaluate(() => ['anna', 'ben', 'clara'].map(id => document.querySelector(`[data-testid="tv-podium-points-${id}"]`)?.textContent?.trim()));
  if (revealPoints.join(',') !== '47,39,31') throw Error(`Reveal points differ from final standings: ${revealPoints.join(',')}`);
  await page.screenshot({ path: `${out}/reveal-1280x720.png` });
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log('TV finale winner, ranks and viewport pass at 720p and 1080p');
} finally {
  await browser.close();
}
