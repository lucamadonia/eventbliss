import puppeteer from 'puppeteer';
import fs from 'node:fs';
import {createDB} from './controller-db.mjs';
import {createRealDB} from './controller-real-db.mjs';
const real=process.argv.includes('--real');
const base=process.env.QA_CONTROLLER_URL||(real?'http://127.0.0.1:5185':'http://127.0.0.1:5183');
const moderator=!process.argv.includes('--host-plays');const guestCount=moderator?4:3;
const output='scripts/tmp/party-layout';fs.mkdirSync(output,{recursive:true});
console.log(real?'Connecting local Supabase':'Creating PGlite');const db=real?await createRealDB():await createDB();console.log('Launching browser');const browser=await puppeteer.launch({headless:true,protocolTimeout:120000});
const channels=new Map(),clients=[],evidence={backend:real?'real-local-supabase':'pglite-broker',scope:real?'Real React lobby, coordinator, auth provider, games and Supabase SDK against isolated local GoTrue/Postgres/Realtime; native route eligibility simulated. No production access.':'Real React lobby/controller-session/game UI, signed RoomSession packets, actual migration in PGlite; synthetic account identity, local asynchronous transport, simulated native routing only.',checks:[],errors:[],packets:0,rpc:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(value,label)=>{if(!value)throw new Error(label);};
async function deliver(ch,message){if(!ch.page.isClosed())await ch.page.evaluate(packet=>window.controllerDeliver?.(packet),{id:ch.id,...message}).catch(e=>evidence.errors.push(String(e)));}
async function sync(topic){const relevant=[...channels.values()].filter(ch=>ch.topic===topic);const presence=Object.fromEntries(relevant.filter(ch=>ch.presence).map(ch=>[ch.presence.id,[ch.presence]]));await Promise.all(relevant.map(ch=>deliver(ch,{kind:'presence',presence})));}
async function wire(page,packet){
 if(packet.kind==='subscribe'){channels.set(packet.id,{id:packet.id,topic:packet.topic,page,presence:null});return;}
 const ch=channels.get(packet.id);if(!ch)return;
 if(packet.kind==='track'){ch.presence=packet.presence;setTimeout(()=>void sync(ch.topic),5);}
 if(packet.kind==='remove'){channels.delete(ch.id);setTimeout(()=>void sync(ch.topic),5);}
 if(packet.kind==='send'){evidence.packets++;setTimeout(()=>{for(const peer of channels.values())if(peer!==ch&&peer.topic===ch.topic)void deliver(peer,{kind:'broadcast',message:packet.message});},5);}
}
async function client(index,name,route='/party/controllers'){console.log('Client',name);
 let account=`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`;const credentials=await db.seedUser(account,{premium:index===0});if(real)account=credentials.userId;console.log('Seeded',name);
 const context=await browser.createBrowserContext();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.controllerNativeShell=true;});console.log('Page',name);await page.setViewport({width:390,height:900});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.setRequestInterception(true);page.on('request',request=>{const u=new URL(request.url());if(u.origin===base||(real&&u.origin===db.url)||['data:','blob:'].includes(u.protocol))void request.continue();else void request.abort('blockedbyclient');});
 await page.exposeFunction('controllerWire',packet=>wire(page,packet));await page.exposeFunction('controllerRPC',async args=>{try{const data=await db.request(account,args.action,args.code,args.payload);if(args.action!=='read')evidence.rpc.push({account,action:args.action,revision:data.party.revision});return{data,error:null};}catch(e){return{data:null,error:{message:e.message}};}});
 await page.evaluateOnNewDocument((identity,route,credentials)=>{window.controllerCredentials=credentials;const Native=WebSocket;class Quiet extends EventTarget{readyState=0;send(){}close(){}}window.WebSocket=new Proxy(Native,{construct(t,a){return a[1]==='vite-hmr'?new Quiet():Reflect.construct(t,a);}});window.controllerIdentity=identity;window.controllerInitialRoute=route;},{id:account,user_metadata:{display_name:name}},route,real?{email:credentials.email,password:credentials.password}:null);
 page.on('pageerror',error=>{console.log('PAGE ERROR',name,error.message);evidence.errors.push(`${name}: ${error.stack}`);});
 console.log('Navigating',name);await page.goto(`${base}/scripts/qa/controllers-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});console.log('Loaded',name);await page.waitForFunction(()=>!!window.controllerQA,{timeout:30000});console.log('Mounted',name);
 const entry={page,account,name,context};clients.push(entry);return entry;
}
async function click(page,pattern,timeout=20000){await page.bringToFront();try{await page.waitForFunction(pattern=>[...document.querySelectorAll('button')].some(b=>!b.disabled&&b.getBoundingClientRect().height&&new RegExp(pattern,'i').test(b.innerText.trim())),{timeout},pattern);}catch(error){if(timeout<20000&&String(error).includes('Waiting failed'))return false;throw error;}const h=await page.evaluateHandle(pattern=>[...document.querySelectorAll('button')].find(b=>!b.disabled&&b.getBoundingClientRect().height&&new RegExp(pattern,'i').test(b.innerText.trim())),pattern);await h.asElement().evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await pause(400);try{await h.asElement().click();}catch(error){if(!String(error).includes('detached'))throw error;await h.dispose();return false;}await h.dispose();await pause(350);return true;}
async function until(test,label,timeout=16000){for(let i=0;i<timeout/100;i++){if(await test())return;await pause(100);}throw new Error(label);}
const snapshot=client=>client.page.evaluate(()=>controllerQA.snapshot());
let television=null;
async function bottomProof(page,width,route,label){
 await page.setViewport({width,height:740});await page.evaluate(route=>controllerQA.navigate(route),route);await pause(800);
 await page.mouse.move(width/2,350);await page.mouse.wheel({deltaY:8000});await pause(700);
 const geometry=await page.evaluate(label=>{const button=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()===label);if(!button)return null;const r=button.getBoundingClientRect();const nav=document.querySelector('nav')?.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);const edges=[r.left+8,r.right-8].map(x=>{const e=document.elementFromPoint(x,r.y+r.height/2);return e===button||button.contains(e);});return{leftHit:edges[0],rightHit:edges[1],bottom:r.bottom,top:r.top,navTop:nav?.top,hit:hit===button||button.contains(hit),bodyOverflow:document.documentElement.scrollWidth>innerWidth,scrolled:[...document.querySelectorAll('*')].some(e=>e.scrollTop>100)};},label);
 assert(geometry?.hit&&geometry.leftHit&&geometry.rightHit&&geometry.scrolled&&geometry.top>=0&&geometry.bottom<geometry.navTop&&!geometry.bodyOverflow,JSON.stringify({width,route,geometry}));
 evidence.checks.push({name:'bottom-button-clear-of-native-tabs',width,route,geometry});await page.screenshot({path:`${output}/${route==='/party'?'local':'controller'}-${width}-bottom.png`});
}
try{
 const host=await client(0,'Host');
 await click(host.page,'create');await until(async()=>!!(await host.page.evaluate(()=>controllerQA.state())).data,'Missing party');
 const code=await host.page.evaluate(()=>controllerQA.state().data.party.code);
 await client(1,'Anna',`/party/join/${code}`);
 for(const width of [320,390]){
  await bottomProof(host.page,width,'/party/controllers','End party');
  await host.page.evaluate(()=>{const main=document.querySelector('main main');if(main)main.scrollTop=0;});
  const details=await host.page.$$('details');assert(details.length>=2,'Missing progressive disclosures');
  await details[1].evaluate(e=>e.open=true);await bottomProof(host.page,width,'/party/controllers','End party');
  await details[1].evaluate(e=>e.open=false);
 }
 await click(host.page,'^End party$');await host.page.waitForSelector('[role=alertdialog]',{timeout:5000});evidence.checks.push({name:'end-button-opens-confirmation',passed:true});await host.page.keyboard.press('Escape');await pause(300);
 await host.page.evaluate(()=>document.querySelector('main main').scrollTop=0);await host.page.screenshot({path:`${output}/controller-overview.png`});
 const local=await client(2,'Local','/party');await local.page.waitForSelector('input[type=text]');await local.page.screenshot({path:`${output}/local-entry.png`});
 for(const name of ['Anna','Ben','Clara','David']){await local.page.type('input[type=text]',name);await local.page.click('button[aria-label="Add player"]');await pause(100);}
 for(const width of [320,390])await bottomProof(local.page,width,'/party','End party');
 assert(!evidence.errors.length,'Runtime errors');
}catch(error){evidence.failure=String(error.stack??error);process.exitCode=1;}
finally{fs.writeFileSync(`${output}/report.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));await browser.close();await db.close();}
