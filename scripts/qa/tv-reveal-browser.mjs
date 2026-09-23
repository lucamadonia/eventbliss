import puppeteer from 'puppeteer';
import fs from 'node:fs';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5180';
const out='scripts/tmp/tv-reveal';fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,timeout:120000,protocolTimeout:120000});
const errors=[],checks=[];
try{
 const page=await browser.newPage();await page.setViewport({width:1280,height:720});
 page.on('pageerror',error=>errors.push(error.message));
 await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base)||r.url().startsWith('data:')?r.continue():r.abort('blockedbyclient'));
 await page.goto(`${base}/scripts/qa/games-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>!!window.qa);
 for(const game of ['impostor','category']){
 await page.evaluate(async game=>{await qa.setLanguage('en');await qa.mountTV(game,{phase:game==='impostor'?'reveal':'playing',currentCategory:'Animals',currentLetter:'A',round:1,players:[{id:'anna',name:'Anna',color:'#df8eff',isImpostor:true,score:0},{id:'ben',name:'Ben',color:'#8ff5ff',score:0}]});},game);
 await page.waitForFunction(game=>[...document.querySelectorAll(game==='impostor'?'h1':'h2')].some(e=>e.textContent===(game==='impostor'?'Anna':'Animals')&&Number(getComputedStyle(e).opacity)>.95),{timeout:10000},game);
 await new Promise(resolve=>setTimeout(resolve,1000));
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:`${out}/${game}.png`});checks.push({game,passed:true});
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({scope:'Synthetic local TV states, actual components and motion runtime',checks,errors},null,2));
 console.log('Category and Impostor visible without animation runtime errors');
}finally{await browser.close();}
