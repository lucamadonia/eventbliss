import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://127.0.0.1:5180';
const output = 'scripts/tmp/bomb-taboo-presentation';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, timeout: 120000, protocolTimeout: 120000 });
const report = { checks: [], errors: [] };
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    const NativeSocket = WebSocket;
    class QuietHMR extends EventTarget { readyState = 0; send() {} close() {} }
    window.WebSocket = new Proxy(NativeSocket, { construct(target, args) { return args[1] === 'vite-hmr' ? new QuietHMR() : Reflect.construct(target, args); } });
  });
  await page.setRequestInterception(true);
  page.on('request', request => /^https?:/.test(request.url()) && new URL(request.url()).origin !== origin ? request.abort() : request.continue());
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(`${origin}/scripts/qa/games-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.qa, { timeout: 120000 });
  await page.evaluate(() => window.qa.setLanguage('de'));
  const click = async key => {
    const handle = await page.evaluateHandle(key => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === window.qa.translate(key)), key);
    assert.ok(handle.asElement(), `Missing action ${key}`);
    await handle.asElement().click(); await handle.dispose();
  };
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    for (const game of ['bomb', 'taboo']) {
      await page.evaluate(game => window.qa.mountLocal(game), game);
      await page.waitForSelector(`[data-game-stage="${game}"]`);
      await new Promise(resolve => setTimeout(resolve, 400));
      await page.screenshot({ path: `${output}/${game}-${width}-setup.png`, fullPage: true });
      await click(game === 'bomb' ? 'games.bomb.startGame' : 'games.taboo.setup.startBtn');
      if (game === 'taboo') { await page.waitForSelector('[data-phase="turnStart"]'); await click('games.taboo.turn.startBtn'); }
      await page.waitForSelector(game === 'bomb' ? '.bomb-playing' : '.taboo-word-card');
      await page.evaluate(() => window.scrollTo(0, 0));
      const metrics = await page.evaluate(game => {
        const target = document.querySelector(game === 'bomb' ? '.bomb-task' : '.taboo-word-card');
        return { viewport: innerWidth, width: target.getBoundingClientRect().width, overflow: document.documentElement.scrollWidth - innerWidth,
          textSize: getComputedStyle(target.querySelector('h2')).fontSize };
      }, game);
      assert.ok(metrics.overflow <= 1, `${game} ${width} horizontal overflow`);
      assert.ok(metrics.width >= width * (width < 500 ? .85 : .4), `${game} task too narrow`);
      await page.screenshot({ path: `${output}/${game}-${width}-playing.png`, fullPage: true });
      const before = await page.$eval(game === 'bomb' ? '.stage-title' : '.taboo-word-card h2', element => element.textContent);
      await click(game === 'bomb' ? 'games.bomb.btnSolved' : 'games.taboo.playing.correctBtn');
      await page.waitForFunction((game, before) => document.querySelector(game === 'bomb' ? '.stage-title' : '.taboo-word-card h2')?.textContent !== before, {}, game, before);
      report.checks.push({ game, width, height, metrics, actionAdvanced: true });
    }
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report));
} finally {
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
