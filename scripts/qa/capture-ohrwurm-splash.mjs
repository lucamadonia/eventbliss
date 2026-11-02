import puppeteer from 'puppeteer';
import { installLocalGameNetwork } from './local-game-network.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4187';
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });

try {
  const page = await browser.newPage();
  page.on('pageerror', error => console.error('Page error:', error.message));
  page.on('console', message => { if (message.type() === 'error') console.error('Console error:', message.text()); });
  await installLocalGameNetwork(page, origin);
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!window.qa, { timeout: 120000 });
  await page.evaluate(async () => {
    await window.qa.setLanguage('de');
    await window.qa.mountTV('ohrwurm', {
      phase: 'draw', activeId: 'ohrwurm-team-1', activeName: 'Hitparade',
      timeLeft: 38, totalTime: 60, winTarget: 10, listening: true,
      players: [
        { id: 'ohrwurm-team-1', name: 'Hitparade', color: '#ff2e88', score: 2, hooks: 3 },
        { id: 'ohrwurm-team-2', name: 'Team 2', color: '#26e0c4', score: 1, hooks: 2 },
      ],
      teams: [
        { id: 'ohrwurm-team-1', name: 'Hitparade', players: ['Anna', 'Ben'] },
        { id: 'ohrwurm-team-2', name: 'Team 2', players: ['Clara', 'David'] },
      ],
      timeline: [{ id: 'song-1', year: 1984 }, { id: 'song-2', year: 1995 }, { id: 'song-3', year: 2008 }],
      previewUrl: null,
    });
  });
  await page.waitForSelector('[data-testid="tv-ohrwurm-view"]');
  await page.screenshot({ path: 'src/assets/splash-ohrwurm-tv.webp', type: 'webp', quality: 88 });
} finally {
  await browser.close();
}
