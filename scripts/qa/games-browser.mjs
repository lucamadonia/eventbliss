import { installLocalGameNetwork } from './local-game-network.mjs';
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5180';
const output = 'scripts/tmp/games-browser';
fs.mkdirSync(output, { recursive: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
const report = { origin: base, scope: 'isolated local games; external requests blocked; synthetic local CloseEnough and Pixeljagd content', games: [], startedAt: new Date().toISOString() };
async function inspect(page) {
  return page.evaluate(() => ({
    text: document.body.innerText.slice(0, 2400),
    buttons: [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height && !b.disabled).map(b => ({text:b.innerText.trim(), label:b.getAttribute('aria-label')})),
    errors: [...window.qaErrors],
    overflow: document.documentElement.scrollWidth > innerWidth + 2,
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')].filter(e => { const r=e.getBoundingClientRect(); return r.width && (r.right>innerWidth+3 || r.left< -3) && getComputedStyle(e).position !== 'absolute'; }).slice(0,8).map(e => ({tag:e.tagName,classes:e.className,text:e.textContent.slice(0,60)})),
  }));
}
async function click(page, pattern) {
  const handle = await page.evaluateHandle(pattern => [...document.querySelectorAll('button')].find(b => !b.disabled && b.getBoundingClientRect().height && new RegExp(pattern, 'i').test(b.innerText.trim())), pattern);
  const element = handle.asElement();
  if (!element) { await handle.dispose(); return null; }
  const label = await element.evaluate(e => e.innerText.trim());
  await element.evaluate(e=>e.scrollIntoView({block:'center'})); await pause(350); await element.click(); await handle.dispose(); await pause(550); return label;
}
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    const Native = window.WebSocket;
    class QuietHMR extends EventTarget { readyState=0; send() {} close() {} }
    window.WebSocket = new Proxy(Native, { construct(target, args) { return args[1] === 'vite-hmr' ? new QuietHMR() : Reflect.construct(target, args); } });
  });
  const blocked = await installLocalGameNetwork(page, base);
  await page.setViewport({width:375,height:900,deviceScaleFactor:1});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.goto(`${base}/scripts/qa/games-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>!!window.qa,{timeout:120000});
  await page.evaluate(()=>qa.setLanguage('en'));
  const games=process.argv.slice(2).length?process.argv.slice(2):await page.evaluate(()=>qa.games);
  for(const game of games){
    const result={game,layouts:{}};
    try {
      await page.goto(`${base}/scripts/qa/games-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});
      await page.waitForFunction(()=>!!window.qa,{timeout:120000});
      await page.evaluate(()=>qa.setLanguage('en'));
      await page.evaluate(async game=>{qaErrors.length=0;await qa.mountLocal(game);},game);
      await pause(800);
      for(const width of [375,320]){
        await page.setViewport({width,height:900,deviceScaleFactor:1});await pause(120);
        result.layouts[`setup-${width}`]=await inspect(page);
        await page.screenshot({path:path.join(output,`${game}-setup-${width}.png`),fullPage:true});
      }
      await page.setViewport({width:375,height:900,deviceScaleFactor:1});
      if(game==='flaschendrehen') result.contentContinue=await click(page,'^(continue|weiter|next|prepare|runde vorbereiten)');
      if(game==='headup') await click(page,'celebrit|promin');
      if(game==='pantomime') await click(page,'all categories|mix');
      result.start=await click(page,'^(start|play|let.s|begin|curtain|los|vorhang|spiel starten|jetzt spielen|bereit)');
      await pause(game==='category'?3700:800);
      for(const width of [375,320]){
        await page.setViewport({width,height:900,deviceScaleFactor:1});await pause(150);
        result.layouts[`play-${width}`]=await inspect(page);
        await page.screenshot({path:path.join(output,`${game}-play-${width}.png`),fullPage:true});
      }
      result.passed=!!result.start&&!result.layouts['play-375'].text.includes('SET UP GAME')&&Object.values(result.layouts).every(s=>!s.errors.length&&!s.overflow&&!s.text.includes('Use window.qa.mountLocal'));
    }catch(error){result.failure=String(error.stack??error);}
    report.games.push(result);report.blockedOrigins=[...blocked];
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({game,start:result.start,passed:result.passed,failure:result.failure,errors:[...new Set(Object.values(result.layouts).flatMap(s=>s.errors))],overflow:Object.entries(result.layouts).filter(([,s])=>s.overflow).map(([name])=>name),buttons:result.layouts['play-375']?.buttons.map(b=>b.text).slice(0,15)}));
  }
}finally{await browser.close();}
if(report.games.some(game=>!game.passed))process.exitCode=1;
