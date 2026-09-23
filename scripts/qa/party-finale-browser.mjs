import puppeteer from 'puppeteer';
import fs from 'node:fs';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5180';
const out='scripts/tmp/party-finale';fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true});
try {
 const page=await browser.newPage();await page.setViewport({width:320,height:900});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base)||r.url().startsWith('data:')?r.continue():r.abort('blockedbyclient'));
 await page.goto(`${base}/scripts/qa/games-browser.html`);await page.waitForFunction(()=>!!qa);
 await page.evaluate(async()=>{await qa.setLanguage('en');await qa.mountFinale();});
 await page.waitForSelector('[role=dialog]');await new Promise(r=>setTimeout(r,1200));console.log(await page.evaluate(()=>document.body.innerText.slice(0,600)));
 const result=await page.evaluate(()=>({text:document.querySelector('[role=dialog]')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,errors:qaErrors}));
 if(!['Anna','Ben','Clara','David'].every(name=>result.text.includes(name))||!result.text.includes('share the win')||result.overflow||result.errors.length)throw Error(JSON.stringify(result));
 await page.screenshot({path:`${out}/tie-320.png`});fs.writeFileSync(`${out}/report.json`,JSON.stringify(result,null,2));console.log('Four joint winners displayed; no horizontal overflow or runtime errors');
}finally{await browser.close();}
