import {readFile,writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const fromVite = createRequire(require.resolve('vite'));
const { build } = fromVite('esbuild');
await build({ entryPoints: [fileURLToPath(new URL('../../src/games/multiplayer/room-session.ts', import.meta.url))], bundle: true, platform: 'node', format: 'esm', outfile: fileURLToPath(new URL('../tmp/controller-room-session.mjs', import.meta.url)), tsconfig: fileURLToPath(new URL('../../tsconfig.app.json', import.meta.url)) });
const { RoomSession } = await import(new URL('../tmp/controller-room-session.mjs', import.meta.url).href);


const status=JSON.parse(await readFile(new URL('../tmp/controller-supabase-status.json',import.meta.url),'utf8'));
if(status.API_URL!=='http://127.0.0.1:56321')throw new Error('Local only');
const accounts=JSON.parse(await readFile(new URL('../tmp/controller-native-accounts.json',import.meta.url),'utf8'));
const host=accounts.find(a=>a.role==='host');
const client=createClient(status.API_URL,status.ANON_KEY,{auth:{persistSession:false}});
const auth=await client.auth.signInWithPassword({email:host.email,password:host.password});if(auth.error)throw auth.error;
const room=new RoomSession(client),id=await room.prepareAccountIdentity(host.userId);
async function rpc(action,code=null,payload={}){const r=await client.rpc('controller_party_request',{action,code,payload});if(r.error)throw new Error(r.error.message);return r.data;}
const party=await rpc('create',null,{player_id:id,name:'Native QA Host',host_plays:true}),code=party.party.code;
async function access(){const s=await rpc('read',code);return {code,hostId:s.party.host_player_id,hostPlays:true,premium:s.party.premium,memberIds:s.members.map(m=>m.player_id),refresh:access,start:async(game_id,participant_ids)=>(await rpc('start',code,{game_id,participant_ids})).party.current_match_id};}
room.configureParty(await access());await room.createPartyRoom(code,'Native QA Host');
async function report(){const s=room.getSnapshot();await writeFile(new URL('../tmp/controller-native-room.json',import.meta.url),JSON.stringify({code,connection:s.connection,status:s.room?.status,players:s.players.map(p=>({name:p.name,ready:p.isReady,host:p.isHost})),error:s.error}));}
room.subscribe(()=>void report());await report();
console.log('Persistent native QA host ready');
setInterval(()=>{},60000);
