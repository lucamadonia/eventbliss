import puppeteer from 'puppeteer';
import fs from 'node:fs';
import { installLocalGameNetwork } from './local-game-network.mjs';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5181';
const folder = 'scripts/tmp/headup-tilt';
fs.mkdirSync(folder, {recursive:true});
const browser = await puppeteer.launch({headless:true,protocolTimeout:120000});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (value,message) => {if(!value)throw new Error(message);};
await installLocalGameNetwork(page, base);
await page.evaluateOnNewDocument(() => {
  window.motionPermission = 'granted';
  window.motionPermissionRequests = 0;
  Object.defineProperty(DeviceMotionEvent, 'requestPermission', {configurable:true,value:async () => {
    window.motionPermissionRequests++;
    return window.motionPermission;
  }});
});
async function click(pattern){
  const handle = await page.evaluateHandle(pattern => [...document.querySelectorAll('button')].find(button => !button.disabled && new RegExp(pattern,'i').test(button.textContent.trim())),pattern);
  assert(handle.asElement(),`Missing button ${pattern}`);
  await handle.asElement().click(); await handle.dispose(); await pause(150);
}
async function setup(permission = 'granted') {
  await page.goto(`${base}/scripts/qa/games-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(() => !!window.qa);
  await page.evaluate(async permission => {window.motionPermission = permission;await qa.setLanguage('en');await qa.mountLocal('headup',{players:['Anna','Ben']});}, permission);
  await page.waitForSelector('.headup-stage button[aria-pressed]');
  await page.click('.headup-stage button[aria-pressed]');
  await click('^start game');
  await page.waitForSelector('.headup-ready');
}
async function gravity(x,y,z,count=12) {
  await page.evaluate(async ({x,y,z,count}) => {
    for(let i=0;i<count;i++){
      const event = new Event('devicemotion');
      Object.defineProperty(event,'accelerationIncludingGravity',{value:{x,y,z}});
      window.dispatchEvent(event);
      await new Promise(resolve=>setTimeout(resolve,35));
    }
  },{x,y,z,count});
}
async function score(){return page.$$eval('.headup-play .text-sm span',elements=>elements.map(e=>e.textContent.trim()).filter(v=>/^\d+$/.test(v)));}
const results=[];
try {
  for(const viewport of [{width:390,height:844},{width:844,height:390}]) {
    await page.setViewport(viewport);await setup();await click('^ready');
    await page.click('#qa-back');await page.waitForSelector('[role=alertdialog]');
    await pause(3200);
    assert(await page.$('.headup-ready'),'Countdown continued behind exit dialog');
    await page.keyboard.press('Escape');await page.waitForSelector('[role=alertdialog]',{hidden:true});await pause(180);
    await gravity(viewport.width>viewport.height?9.81:0,viewport.width>viewport.height?0:9.81,0);
    await page.waitForSelector('.headup-play');
    await gravity(6.3,0,7.5);
    assert((await score()).join(',')==='1,0',`Downward nod must score exactly once: ${await score()} / ${await page.$eval('.headup-play',e=>e.innerText)}`);
    await gravity(6.3,0,7.5);
    assert((await score()).join(',')==='1,0','Held tilt scored twice');
    await gravity(9.81,0,0);await gravity(6.3,0,-7.5);
    assert((await score()).join(',')==='1,1','Upward tilt must skip once');
    await page.click('#qa-back');await page.waitForSelector('[role=alertdialog]');
    await gravity(9.81,0,0);await gravity(6.3,0,7.5);
    assert((await score()).join(',')==='1,1','Sensor scored behind exit dialog');
    await page.keyboard.press('Escape');await page.waitForSelector('[role=alertdialog]',{hidden:true});await pause(180);
    await gravity(9.81,0,0);await gravity(6.3,0,7.5);
    assert((await score()).join(',')==='2,1','Tilt did not resume after exit cancellation');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
    const bounds=await page.$eval('.headup-play',e=>({bottom:e.getBoundingClientRect().bottom,top:e.getBoundingClientRect().top}));
    assert(bounds.bottom<=viewport.height+1 && bounds.top>=0,'Playing controls do not fit viewport');
    await page.screenshot({path:`${folder}/${viewport.width}.png`});
    assert(await page.evaluate(()=>window.motionPermissionRequests)===1,'Permission must be requested from Ready click');
    results.push({viewport,tilt:true,pauseResume:true,layout:true});
  }
  await setup('denied');await click('^ready');await page.waitForSelector('.headup-play');
  await gravity(9.81,0,0);await gravity(6.3,0,7.5);
  assert((await score()).join(',')==='0,0','Denied motion still scores');
  await click('^correct');assert((await score()).join(',')==='1,0','Denied permission lacks working button fallback');
  await pause(350);await click('^skip');assert((await score()).join(',')==='1,1','Skip fallback failed');
  assert(!(await page.evaluate(()=>window.qaErrors)).length,'Runtime errors');
  results.push({permissionDenied:true,manualFallback:true});
  fs.writeFileSync(`${folder}/report.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
} catch(error) {
  await page.screenshot({path:`${folder}/failure.png`,fullPage:true});
  throw error;
} finally {await browser.close();}
