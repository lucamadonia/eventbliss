import puppeteer from 'puppeteer';
import fs from 'node:fs';
import {createDB} from './controller-db.mjs';
import {createRealDB} from './controller-real-db.mjs';
const real=process.argv.includes('--real');
const historySmoke=process.argv.includes('--history-smoke');
const routeGame=process.argv.includes('--route-game')?process.argv[process.argv.indexOf('--route-game')+1]:null;
const base=process.env.QA_CONTROLLER_URL||(real?'http://127.0.0.1:5185':'http://127.0.0.1:5183');
const moderator=!process.argv.includes('--host-plays');const guestCount=routeGame?1:moderator?4:3;
const output=`scripts/tmp/controllers-browser/${historySmoke?'history-smoke':routeGame?`route-${routeGame}`:`${real?'real-':''}${moderator?'moderator':'host'}`}`;fs.mkdirSync(output,{recursive:true});
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
 const context=await browser.createBrowserContext();const page=await context.newPage();console.log('Page',name);await page.setViewport({width:390,height:900});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.setRequestInterception(true);page.on('request',request=>{const u=new URL(request.url());if(u.origin===base||(real&&u.origin===db.url)||['data:','blob:'].includes(u.protocol))void request.continue();else void request.abort('blockedbyclient');});
 await page.exposeFunction('controllerWire',packet=>wire(page,packet));await page.exposeFunction('controllerRPC',async args=>{try{const data=await db.request(account,args.action,args.code,args.payload);if(args.action!=='read')evidence.rpc.push({account,action:args.action,revision:data.party.revision});return{data,error:null};}catch(e){return{data:null,error:{message:e.message}};}});
 await page.evaluateOnNewDocument((identity,route,credentials,browserHistory)=>{window.controllerCredentials=credentials;window.controllerBrowserHistory=browserHistory;window.controllerNativeShell=browserHistory;window.controllerHistoryReplacements=[];if(browserHistory){const replace=history.replaceState.bind(history);history.replaceState=(state,title,url)=>{window.controllerHistoryReplacements.push(String(url??location.pathname+location.search));if(window.controllerHistoryReplacements.length>100)throw new Error('Synthetic WebKit replaceState limit exceeded');return replace(state,title,url);};}const Native=WebSocket;class Quiet extends EventTarget{readyState=0;send(){}close(){}}window.WebSocket=new Proxy(Native,{construct(t,a){return a[1]==='vite-hmr'?new Quiet():Reflect.construct(t,a);}});window.controllerIdentity=identity;window.controllerInitialRoute=route;},{id:account,user_metadata:{display_name:name}},route,real?{email:credentials.email,password:credentials.password}:null,historySmoke);
 page.on('pageerror',error=>{console.log('PAGE ERROR',name,error.message);evidence.errors.push(`${name}: ${error.stack}`);});
 console.log('Navigating',name);await page.goto(`${base}/scripts/qa/controllers-browser.html`,{waitUntil:'domcontentloaded',timeout:120000});console.log('Loaded',name);await page.waitForFunction(()=>!!window.controllerQA,{timeout:30000});console.log('Mounted',name);
 const entry={page,account,name,context};clients.push(entry);return entry;
}
async function click(page,pattern,timeout=20000){await page.bringToFront();try{await page.waitForFunction(pattern=>[...document.querySelectorAll('button')].some(b=>!b.disabled&&b.getBoundingClientRect().height&&new RegExp(pattern,'i').test(b.innerText.trim())),{timeout},pattern);}catch(error){if(timeout<20000&&String(error).includes('Waiting failed'))return false;throw error;}const h=await page.evaluateHandle(pattern=>[...document.querySelectorAll('button')].find(b=>!b.disabled&&b.getBoundingClientRect().height&&new RegExp(pattern,'i').test(b.innerText.trim())),pattern);await h.asElement().evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await pause(400);try{await h.asElement().click();}catch(error){if(!String(error).includes('detached'))throw error;await h.dispose();return false;}await h.dispose();await pause(350);return true;}
async function until(test,label,timeout=16000){for(let i=0;i<timeout/100;i++){if(await test())return;await pause(100);}throw new Error(label);}
const snapshot=client=>client.page.evaluate(()=>controllerQA.snapshot());
let television=null;
try{
 const host=await client(0,moderator?'Moderator':'Host',historySmoke?'/party':'/party/controllers');
 if(historySmoke)await click(host.page,'joystick mode');
 if(moderator&&!historySmoke)await host.page.click('input[type=checkbox]');await click(host.page,'create');
 await until(async()=>!!(await host.page.evaluate(()=>controllerQA.state())).data,'Party was not created');
 const code=await host.page.evaluate(()=>controllerQA.state().data.party.code);
 if(historySmoke){
   await host.page.evaluate(()=>controllerQA.navigate('/party'));
   await pause(5000); // One server poll must not reassert the old lobby route.
   assert(await host.page.evaluate(()=>location.pathname)==='/party','Coordinator redirected without a party phase change');
   await host.page.evaluate(()=>controllerQA.navigate('/party/controllers'));
   await pause(500);
   const replacements=await host.page.evaluate(()=>controllerHistoryReplacements);
   assert(replacements.length<10,`Too many history replacements: ${replacements.length}`);
   assert(!evidence.errors.length,'Browser runtime errors recorded');
   evidence.checks.push({name:'joystick-entry-and-stable-browser-history',passed:true,replacements});
   console.log('History smoke passed');
 }else{
 television=real?await client(99,'TV',`/tv/${code}`):null;if(television){clients.pop();await television.page.setViewport({width:1280,height:720});}
 for(let i=1;i<=guestCount;i++)await client(i,['','Anna','Ben','Clara','David'][i],`/party/join/${code}`);
 await until(async()=>(await snapshot(host)).players.length===guestCount+1,'Roster never reached moderator plus four guests');
 for(const guest of clients.slice(1))await click(guest.page,"let.s go|los geht.s");
 for(const guest of clients.slice(1))await guest.page.click('[data-testid="lobby-ready-toggle"]');
 await until(async()=>(await snapshot(host)).players.filter(p=>!p.isHost&&p.isReady).length===guestCount,'Ready state missing');
 evidence.checks.push({name:'rendered-create-invite-join-ready',passed:true,code,clients:guestCount+1});
 await host.page.screenshot({path:`${output}/moderator-lobby.png`,fullPage:true});
 await host.page.evaluate(games=>controllerQA.playlist(games),routeGame?[routeGame]:['fake-or-fact','this-or-that','flaschendrehen','fake-or-fact']);
 const identities=new Map();for(const c of clients)identities.set((await snapshot(c)).myPlayerId,c);
 const observer=clients.at(-1);
 const state=event=>observer.page.evaluate(event=>window.controllerGameStates[event],event);
 let rejoined=false;
 for(const [matchIndex,game] of (routeGame?[routeGame]:['fake-or-fact','this-or-that','flaschendrehen','fake-or-fact']).entries()){
   console.log('Starting match',matchIndex,game);
   await host.page.click('[data-testid="lobby-start"]');
   await until(async()=>(await snapshot(host)).room?.status==='playing','Game not started');
   await until(async()=>await host.page.evaluate(()=>document.querySelector('#qa-route')?.textContent.startsWith('/games/')),'Coordinator did not route host');
   for(const guest of clients.slice(1))await until(async()=>await guest.page.evaluate(game=>document.querySelector('#qa-route')?.textContent===`/games/${game}`,game),`${guest.name} stayed in the waiting lobby for ${game}`);
   evidence.checks.push({name:'all-phone-game-route',game,matchIndex,passed:true});
   if(routeGame){
     if(game==='pixeljagd'){
       await click(host.page,'^start',20000);
       for(const phone of clients.slice(1))await until(async()=>await phone.page.evaluate(()=>{
         const canvas=document.querySelector('[data-online-game-content] [data-phase] canvas');
         if(!canvas || canvas.parentElement?.querySelector('div.absolute.inset-0'))return false;
         try{return canvas.getContext('2d')?.getImageData(canvas.width/2,canvas.height/2,1,1).data[3]>0;}catch{return false;}
       }),`${phone.name} did not render the Pixeljagd image`,20000);
       evidence.checks.push({name:'pixeljagd-image-on-phone',passed:true});
     }
     break;
   }
   if(game==='flaschendrehen'){await click(host.page,'^questions only');await click(host.page,'^prepare');}
   await host.page.waitForSelector('input[type=range]');
   const ranges=await host.page.$$('input[type=range]');await ranges.at(-1).focus();await host.page.keyboard.press('Home');
   if(game==='fake-or-fact'){await ranges[0].focus();await host.page.keyboard.press('End');}
   await click(host.page,'^start game');
   const event=game==='flaschendrehen'?'bottlespin-state':'game-state';
   await until(async()=>{const s=await state(event);return s&&s.phase===({ 'fake-or-fact':'statement','this-or-that':'voting',flaschendrehen:'spinning' }[game]);},'Game stuck in setup');
   assert((await state(event)).players.every(player=>player.score===0),'Game/rematch carried previous scores');
   await host.page.screenshot({path:`${output}/playing-${matchIndex}-${game}-host.png`,fullPage:true});
   await observer.page.screenshot({path:`${output}/playing-${matchIndex}-${game}-guest.png`,fullPage:true});
   if(television){const wireGame=game==='fake-or-fact'?'fakeorfact':game==='this-or-that'?'thisorthat':'bottlespin';await until(async()=>await television.page.evaluate(game=>controllerTVMessages.some(message=>message.game===game&&message.phase===({fakeorfact:'statement',thisorthat:'voting',bottlespin:'spinning'}[game])),wireGame),'TV received no game state');await television.page.bringToFront();await television.page.waitForFunction(()=>{const scene=document.querySelector('[data-tv-scene]');return scene&&Number(getComputedStyle(scene).opacity)>.95&&[...scene.querySelectorAll('*')].some(child=>{const r=child.getBoundingClientRect();return r.width>200&&r.height>100&&r.top<innerHeight&&r.bottom>0;});},{timeout:10000});await pause(350);evidence.checks.push({name:'tv-rendered-playing',game,matchIndex,...await television.page.evaluate(()=>({passed:!document.body.innerText.includes('Go to'),text:document.body.innerText,hook:window.__qaTVHook,motion:[...document.querySelectorAll('[style]')].filter(e=>e.style.opacity).map(e=>({tag:e.tagName,opacity:e.style.opacity,text:e.innerText?.slice(0,80)})),messages:controllerTVMessages.slice(-8)}))});await television.page.screenshot({path:`${output}/tv-${matchIndex}-${game}.png`});}
   let actions=0;const initialIds=(await snapshot(host)).room.participantIds;
   assert(initialIds.length===4&&initialIds.includes((await snapshot(host)).myPlayerId)!==moderator,'Host participation does not match chosen role');
   if(!rejoined){
      const guest=clients[2],before=(await snapshot(guest)).myPlayerId;
      if(real)await guest.page.setOfflineMode(true);else for(const ch of [...channels.values()].filter(ch=>ch.page===guest.page)){channels.delete(ch.id);await deliver(ch,{kind:'disconnect'});await sync(ch.topic);}
      await until(async()=>(await snapshot(real?guest:host)).connection!=='connected','Disconnect not reflected',60000);
      if(real){await pause(2000);await guest.page.setOfflineMode(false);}
      await guest.page.evaluate(()=>controllerQA.retry());
      await until(async()=>(await snapshot(host)).connection==='connected'&&(await snapshot(guest)).connection==='connected','Rejoin did not recover',60000);
      assert((await snapshot(guest)).myPlayerId===before,'Rejoin changed identity');
      evidence.checks.push({name:'disconnect-rejoin-stable-controller',passed:true});rejoined=true;
   }
   for(let step=0;step<160;step++){
     const result=await host.page.evaluate(()=>controllerQA.state().data.results.length);
     if(result>matchIndex)break;
     const s=await state(event);if(!s){await pause(100);continue;}
     if(game==='fake-or-fact'){
       if(s.phase==='statement'){
         const c=identities.get(s.players[s.currentPlayerIdx].id);assert(c,'Missing current player');
         if(actions===0){const outsider=clients.find(peer=>peer!==c);const canVote=await outsider.page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>!b.disabled&&/^true$/i.test(b.innerText.trim())));assert(!canVote,'Another player could vote out of turn');evidence.checks.push({name:'own-controller-input-only',game,matchIndex,passed:true});}if(await click(c.page,'^true$',1500))actions++;
       }else if(s.phase==='reveal'){await click(host.page,'^continue',1500);}else await pause(150);
     }else if(game==='this-or-that'){
       if(s.phase==='voting'){
         for(const c of clients.slice(moderator?1:0)){
           const enabled=await c.page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>!b.disabled&&/^A\b/.test(b.innerText.trim())));
           if(enabled){await click(c.page,'^A\\b');actions++;}
         }
       }else if(s.phase==='reveal'){await click(host.page,'^(next|game over)');}else await pause(150);
     }else{
       if(s.phase==='spinning'&&!s.isSpinning){await click(host.page,'^spin');await until(async()=>(await state(event))?.phase==='card','Spin did not reveal card');}
       else if(s.phase==='card'){await click(identities.get(s.players[s.selectedIdx].id).page,'^accept');actions++;await until(async()=>{const next=await state(event);return next?.currentRound>s.currentRound||next?.phase==='gameOver'||next?.phase==='vote'||await host.page.evaluate(expected=>controllerQA.state().data.results.length>expected,matchIndex);},'Accepted card did not advance');}
       else await pause(150);
     }
   }
   await until(async()=>await host.page.evaluate(expected=>controllerQA.state().data.results.length===expected,matchIndex+1),'Completed game result missing');
   const data=await host.page.evaluate(()=>controllerQA.state().data);
   assert(Object.keys(data.results[matchIndex].scores).length===4,'Result roster is incomplete');
   await until(async()=>await host.page.evaluate(()=>document.querySelector('#qa-route')?.textContent==='/party/controllers'),'Coordinator did not return to lobby');
   evidence.checks.push({name:'complete-rendered-game',game,matchIndex,actions,result:data.results[matchIndex],passed:true});
   await host.page.screenshot({path:`${output}/completed-${matchIndex}-${game}.png`,fullPage:true});
 }
 if(!routeGame){assert(new Set((await host.page.evaluate(()=>controllerQA.state().data.results)).map(r=>r.match_id)).size===4,'Duplicate match IDs on replay');
 evidence.checks.push({name:'three-game-set-plus-fresh-rematch',passed:true});
 if(television){const messages=await television.page.evaluate(()=>controllerTVMessages);assert(messages.every(m=>!m.internalScoresPresent),'TV exposed internal score map');const statements=messages.filter(m=>m.game==='fakeorfact'&&m.phase==='statement');assert(statements.length>0,'TV received no playable Fake state');assert(statements.every(m=>m.correctAnswer===-1),'TV exposed quiz answer before reveal');evidence.checks.push({name:'actual-tv-screen-public-realtime',passed:true,messages:messages.length});}
 assert(evidence.checks.filter(check=>check.name==='tv-rendered-playing').every(check=>check.passed),'TV retained lobby over gameplay');}
 assert(!evidence.errors.length,'Browser runtime errors recorded');
 }

}catch(error){if(television)evidence.tv={messages:await television.page.evaluate(()=>controllerTVMessages),text:await television.page.evaluate(()=>document.body.innerText)};evidence.lastStates=await Promise.all(clients.map(async c=>({name:c.name,snapshot:await snapshot(c),controller:await c.page.evaluate(()=>controllerQA.state()),transport:await c.page.evaluate(()=>controllerQA.connection()),text:await c.page.evaluate(()=>document.body.innerText)})));evidence.failure=String(error.stack??error);for(const c of clients)await c.page.screenshot({path:`${output}/failure-${c.name}.png`,fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{fs.writeFileSync(`${output}/report.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));await browser.close();await db.close();}
