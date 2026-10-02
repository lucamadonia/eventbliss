import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDB } from '../../scripts/qa/controller-db.mjs';

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const player = n => `player-${String(n).padStart(64, '0')}`;
const { db } = await createDB();
for (let n = 1; n <= 20; n++) await db.query('INSERT INTO auth.users VALUES ($1)', [id(n)]);
await db.query('INSERT INTO public.subscriptions VALUES ($1, $2, NULL)', [id(1), 'premium']);
async function asUser(n, anonymous = false) {
  await db.query("SELECT set_config('test.uid',$1,false),set_config('test.anonymous',$2,false)", [n ? id(n) : '', String(anonymous)]);
}
async function rpc(action, code = null, payload = {}) {
  const result = await db.query('SELECT public.controller_party_request($1,$2,$3::jsonb) AS data', [action, code, JSON.stringify(payload)]);
  return result.rows[0].data;
}
async function reject(fn, pattern) { await assert.rejects(fn, pattern); }
let party;
await test('server game limits and entitlement requirements match the complete client registry',async () => {
  const registry=await readFile(new URL('../../src/lib/playable-games.ts',import.meta.url),'utf8');
  const expected=[...registry.matchAll(/\{ id: "([^"]+)"[^\n]+minPlayers: (\d+), maxPlayers: +(\d+), tier: "(free|premium)"/g)]
    .map(([,game_id,min,max,tier])=>({game_id,min_players:Number(min),max_players:Number(max),premium:tier==='premium'}))
    .sort((a,b)=>a.game_id.localeCompare(b.game_id));
  const actual=(await db.query('SELECT * FROM public.controller_game_limits')).rows.sort((a,b)=>a.game_id.localeCompare(b.game_id));
  assert.equal(expected.length,22); assert.deepEqual(actual,expected);
});
await test('anonymous callers and invalid identities cannot create parties', async () => {
  await asUser(null); await reject(() => rpc('create', null, { player_id: player(1), name: 'Host' }), /Account sign-in/);
  await asUser(1,true); await reject(() => rpc('create', null, { player_id: player(1), name: 'Host' }), /Account sign-in/);
  await asUser(1); await reject(() => rpc('create', null, { player_id: 'fake', name: 'Host' }), /Invalid player/);
  party = await rpc('create',null,{ player_id: player(1), name: 'Same name',host_plays:true });
  assert.match(party.party.code,/^[A-HJ-NP-Z2-9]{6}$/); assert.equal(party.party.premium,true);
});
await test('membership binds accounts and controller fingerprints while allowing duplicate display names', async () => {
  await asUser(2); await reject(() => rpc('read', party.party.code), /membership/);
  await reject(() => rpc('join', party.party.code,{ player_id: player(1),name:'Same name' }), /another account/);
  party = await rpc('join',party.party.code,{ player_id: player(2),name:'Same name' });
  assert.equal(party.members.length,2);
  party = await rpc('join',party.party.code,{ player_id: player(2),name:'Same name' });
  assert.equal(party.members.length,2);
  await reject(() => rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2)]}),/Host action/);
});
let firstMatch;
await test('host starts only known games with the exact compatible participant set',async () => {
  await asUser(1);
  await reject(() => rpc('start',party.party.code,{game_id:'unknown',participant_ids:[player(1),player(2)]}),/Unknown game/);
  await reject(() => rpc('start',party.party.code,{game_id:'taboo',participant_ids:[player(1),player(2)]}),/compatible/);
  await reject(() => rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(1)]}),/compatible/);
  party = await rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(2),player(1)]});
  firstMatch = party.party.current_match_id;
  assert.equal(party.party.status,'playing');
  await asUser(2); await reject(() => rpc('join',party.party.code,{player_id:player(20),name:'New device'}),/same controller/);
  await reject(() => rpc('leave',party.party.code),/finish or abort/);
});
await test('late joins wait for the next match; results exclude them and reject invalid scores',async () => {
  await asUser(3); party = await rpc('join',party.party.code,{player_id:player(3),name:'Late'});
  assert.equal(party.party.current_match_id,firstMatch);
  await asUser(1);
  const finish = {match_id:firstMatch,game_id:'bomb',scored:true};
  await reject(() => rpc('finish',party.party.code,{...finish,scores:{[player(1)]:2}}),/active participants/);
  await reject(() => rpc('finish',party.party.code,{...finish,scores:{[player(1)]:2,[player(2)]:1,[player(3)]:0}}),/active participants/);
  await reject(() => rpc('finish',party.party.code,{...finish,scores:{[player(1)]:'2',[player(2)]:1}}),/active participants/);
  party = await rpc('finish',party.party.code,{...finish,scores:{[player(1)]:2,[player(2)]:1}});
  assert.equal(party.results.length,1); assert.equal(party.party.status,'lobby');
  party = await rpc('finish',party.party.code,{...finish,scores:{}});
  assert.equal(party.results.length,1);
});
await test('a previous result cannot mutate a newer match; abort gives no score',async () => {
  party = await rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2),player(3)]});
  const currentMatch = party.party.current_match_id;
  assert.notEqual(firstMatch,currentMatch);
  party = await rpc('finish',party.party.code,{match_id:firstMatch,game_id:'bomb',scores:{},scored:false});
  assert.equal(party.party.current_match_id,currentMatch); assert.equal(party.results.length,1);
  party = await rpc('abort',party.party.code);
  assert.equal(party.party.status,'lobby'); assert.equal(party.results.length,1);
  await reject(() => rpc('finish',party.party.code,{match_id:currentMatch,game_id:'bomb',scores:{},scored:false}),/no longer active/);
});
await test('premium is host-owned and rechecked; free games remain available',async () => {
  await db.query("UPDATE public.subscriptions SET expires_at=now()-interval '1 second' WHERE user_id=$1",[id(1)]);
  await reject(() => rpc('start',party.party.code,{game_id:'story-builder',participant_ids:[player(1),player(2),player(3)]}),/Host premium/);
  party = await rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2),player(3)]});
  assert.equal(party.party.premium,false);
  await rpc('abort',party.party.code);
});
await test('party caps exclude a moderator but never silently exclude participants',async () => {
  await asUser(4); let moderated = await rpc('create',null,{player_id:player(4),name:'Moderator',host_plays:false});
  for(let n=5;n<=16;n++) { await asUser(n); moderated=await rpc('join',moderated.party.code,{player_id:player(n),name:`Player ${n}`}); }
  await asUser(17); await reject(() => rpc('join',moderated.party.code,{player_id:player(17),name:'Full'}),/Party is full/);
  await asUser(4);
  const ids = Array.from({length:12},(_,i)=>player(i+5));
  await reject(() => rpc('start',moderated.party.code,{game_id:'ohrwurm',participant_ids:ids}),/compatible/);
  moderated=await rpc('start',moderated.party.code,{game_id:'bomb',participant_ids:ids});
  assert.equal(moderated.members.length,13);
  moderated=await rpc('finish',moderated.party.code,{match_id:moderated.party.current_match_id,game_id:'bomb',scored:true,scores:Object.fromEntries(ids.map(playerId=>[playerId,10]))});
  const played=await db.query('SELECT count(*)::integer AS count FROM public.game_stats WHERE user_id=ANY($1::uuid[])',[Array.from({length:12},(_,i)=>id(i+5))]);
  assert.equal(played.rows[0].count,12);
  await rpc('end',moderated.party.code);
});
await test('server statistics are exactly once and ties win for every tied participant',async () => {
  await asUser(1);
  const stats=async ()=>(await db.query("SELECT user_id,games_played,games_won,total_score,best_score,streak,best_streak,last_played_at FROM public.game_stats WHERE game_id='bomb' AND user_id IN ($1,$2,$3) ORDER BY user_id",[id(1),id(2),id(3)])).rows;
  let rows=await stats();
  assert.deepEqual(rows.map(r=>[r.user_id,r.games_played,r.games_won,Number(r.total_score)]),[[id(1),1,1,2],[id(2),1,0,1]]);
  party=await rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2),player(3)]});
  const finish={match_id:party.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(1)]:9,[player(2)]:9,[player(3)]:3}};
  party=await rpc('finish',party.party.code,finish);
  await rpc('finish',party.party.code,finish);
  rows=await stats();
  assert.deepEqual(rows.map(r=>[r.games_played,r.games_won,Number(r.total_score),r.best_score,r.streak,r.best_streak]),[[2,2,11,9,2,2],[2,1,10,9,1,1],[1,0,3,3,0,0]]);
  assert.ok(rows.every(r=>r.last_played_at));
  party=await rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2),player(3)]});
  party=await rpc('finish',party.party.code,{match_id:party.party.current_match_id,game_id:'bomb',scored:false,scores:{[player(1)]:0,[player(2)]:0,[player(3)]:0}});
  rows=await stats();
  assert.deepEqual(rows.map(r=>[r.games_played,r.games_won,Number(r.total_score),r.streak]),[[3,2,11,2],[3,1,10,1],[2,0,3,0]]);
  const moderatorStats=await db.query('SELECT count(*)::integer AS count FROM public.game_stats WHERE user_id=$1',[id(4)]);
  assert.equal(moderatorStats.rows[0].count,0);
});
await test('finished and expired parties cannot restart or admit strangers',async () => {
  await asUser(1); party=await rpc('end',party.party.code);
  await reject(()=>rpc('start',party.party.code,{game_id:'bomb',participant_ids:[player(1),player(2),player(3)]}),/not ready/);
  await asUser(18); await reject(()=>rpc('join',party.party.code,{player_id:player(18),name:'New'}),/has ended/);
  await db.query("UPDATE public.controller_parties SET expires_at=now()-interval '1 second' WHERE code=$1",[party.party.code]);
  await asUser(1); await reject(()=>rpc('read',party.party.code),/expired/);
});
await test('a verified account can replace its controller between matches without losing its scores',async () => {
  await asUser(18); let replacement=await rpc('create',null,{player_id:player(18),name:'Host'});
  await asUser(19); await rpc('join',replacement.party.code,{player_id:player(19),name:'Guest'});
  await asUser(18); replacement=await rpc('start',replacement.party.code,{game_id:'bomb',participant_ids:[player(18),player(19)]});
  replacement=await rpc('finish',replacement.party.code,{match_id:replacement.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(18)]:5,[player(19)]:8}});
  await asUser(19); replacement=await rpc('join',replacement.party.code,{player_id:player(20),name:'New phone'});
  assert.equal(replacement.members.find(m=>m.user_id===id(19)).player_id,player(20));
  assert.deepEqual(replacement.results[0].scores,{[player(18)]:5,[player(20)]:8});
  await reject(()=>rpc('join',replacement.party.code,{player_id:player(18),name:'Collision'}),/another participant/);
});
await test('snapshots expose monotonic revisions so delayed reads cannot revert a match',async () => {
  await asUser(20); let ordered=await rpc('create',null,{player_id:player(20),name:'Ordered host'});
  const initial=ordered.party.revision;
  assert.equal((await rpc('read',ordered.party.code)).party.revision,initial);
  await asUser(17); ordered=await rpc('join',ordered.party.code,{player_id:player(17),name:'Guest'});
  assert.ok(ordered.party.revision>initial);
  const lobbyRevision=ordered.party.revision;
  await asUser(20); ordered=await rpc('start',ordered.party.code,{game_id:'bomb',participant_ids:[player(20),player(17)]});
  assert.ok(ordered.party.revision>lobbyRevision);
  const playingRevision=ordered.party.revision;
  const finish={match_id:ordered.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(20)]:1,[player(17)]:0}};
  ordered=await rpc('finish',ordered.party.code,finish);
  assert.ok(ordered.party.revision>playingRevision);
  assert.equal((await rpc('finish',ordered.party.code,finish)).party.revision,ordered.party.revision);
});
await test('departures preserve score ownership, revoke access, and allow only the same account to restore history',async () => {
  await asUser(18); let history=await rpc('create',null,{player_id:player(18),name:'History host'});
  const created=history.party.created_at;
  assert.ok(!Number.isNaN(Date.parse(created)));
  await asUser(16); history=await rpc('join',history.party.code,{player_id:player(16),name:'Departing'});
  await asUser(18); history=await rpc('start',history.party.code,{game_id:'bomb',participant_ids:[player(18),player(16)]});
  history=await rpc('finish',history.party.code,{match_id:history.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(18)]:1,[player(16)]:7}});
  await asUser(16); history=await rpc('leave',history.party.code);
  assert.equal(history.members.length,1); assert.equal(history.past_members[0].name,'Departing');
  await reject(()=>rpc('read',history.party.code),/membership/);
  await asUser(15); await reject(()=>rpc('join',history.party.code,{player_id:player(16),name:'Thief'}),/another account/);
  await asUser(16); history=await rpc('join',history.party.code,{player_id:player(160),name:'Returned'});
  assert.equal(history.members.length,2); assert.equal(history.past_members.length,0);
  assert.equal(history.results[0].scores[player(160)],7); assert.equal(history.results[0].scores[player(16)],undefined);
  assert.equal(history.party.created_at,created);
  await rpc('leave',history.party.code);
  await asUser(18); history=await rpc('end',history.party.code);
  const endedRevision=history.party.revision;
  const ended=await rpc('join',history.party.code,{player_id:player(18),name:'Changed after end'});
  assert.equal(ended.party.revision,endedRevision); assert.equal(ended.members[0].name,'History host');
  await reject(()=>rpc('join',history.party.code,{player_id:player(180),name:'New host phone'}),/ended/);
  await asUser(16); await reject(()=>rpc('join',history.party.code,{player_id:player(160),name:'Returned'}),/ended/);
});
await test('authenticated role can create and read via the RPC only',async () => {
  await asUser(19);
  await db.exec('SET ROLE authenticated');
  const own=await rpc('create',null,{player_id:player(19),name:'Account'});
  const read=await rpc('read',own.party.code);
  assert.equal(read.party.host_user_id,id(19));
  await reject(()=>rpc('read',party.party.code),/expired/);
  await db.exec('RESET ROLE');
});
await test('direct table access and private snapshot function are denied to authenticated and anonymous roles',async () => {
  await db.exec('SET ROLE authenticated');
  await reject(()=>db.query('SELECT * FROM public.controller_parties'),/permission denied/);
  await reject(()=>db.query('SELECT public.controller_party_snapshot($1)',[party.party.id]),/permission denied/);
  await db.exec('RESET ROLE; SET ROLE anon');
  await reject(()=>rpc('read',party.party.code),/permission denied/);
  await db.exec('RESET ROLE');
  const tables=await db.query("SELECT relrowsecurity FROM pg_class WHERE relname IN ('controller_parties','controller_party_members','controller_party_results','controller_game_limits')");
  assert.equal(tables.rows.length,4); assert.ok(tables.rows.every(r=>r.relrowsecurity));
});

// ── Party-Play: guests on the host's phone, claims, profiles, kicks ──
for (let n = 21; n <= 40; n++) await db.query('INSERT INTO auth.users VALUES ($1)', [id(n)]);
const seat = (snapshot, playerId) => snapshot.members.find(m => m.player_id === playerId);
const past = (snapshot, playerId) => snapshot.past_members.find(m => m.player_id === playerId);
await test('guests are added by the host with validated profiles up to the 12-seat cap',async () => {
  await asUser(21);
  let g=await rpc('create',null,{player_id:player(21),name:'Gastgeber',avatar:'👑',color:'#55EFC4'});
  assert.ok(!Number.isNaN(Date.parse(g.server_now))); assert.equal(g.party.min_client,0);
  assert.deepEqual(seat(g,player(21)),{user_id:id(21),player_id:player(21),name:'Gastgeber',is_host:true,avatar:'👑',color:'#55efc4',
    controlled_by:null,pending_claim:false,pending_claim_mine:false,banned:false});
  await reject(()=>rpc('add_guest',g.party.code,{name:'X',avatar:'🙂'}),/invalid_avatar/);
  await reject(()=>rpc('add_guest',g.party.code,{name:'X',color:'#123456'}),/invalid_color/);
  await reject(()=>rpc('add_guest',g.party.code,{name:'   '}),/invalid_name/);
  await reject(()=>rpc('add_guest',g.party.code,{name:'x'.repeat(25)}),/invalid_name/);
  await reject(()=>rpc('create',null,{player_id:player(22),name:'Bad',avatar:'nope'}),/invalid_avatar/);
  const revision=g.party.revision;
  g=await rpc('add_guest',g.party.code,{name:'  Oma Gerda  '});
  const gerda=g.members.find(m=>m.name==='Oma Gerda');
  assert.match(gerda.player_id,/^player-[0-9a-f]{64}$/);
  assert.deepEqual([gerda.user_id,gerda.controlled_by,gerda.is_host,gerda.avatar,gerda.color],[null,player(21),false,'🎉','#df8eff']);
  assert.equal(g.party.min_client,2); assert.ok(g.party.revision>revision);
  await asUser(22); g=await rpc('join',g.party.code,{player_id:player(22),name:'Lena'});
  assert.deepEqual([seat(g,player(22)).avatar,seat(g,player(22)).color],['🔥','#ff6b98']);
  await reject(()=>rpc('add_guest',g.party.code,{name:'Sneaky'}),/Host action/);
  await asUser(21);
  for (let n=4;n<=12;n++) g=await rpc('add_guest',g.party.code,{name:`Gast ${n}`,avatar:'🍕',color:'#0984e3'});
  assert.equal(g.members.length,12);
  await reject(()=>rpc('add_guest',g.party.code,{name:'Dreizehn'}),/party_full/);
  // Full, but free guest seats remain: the phone gets the list without a seat and claims one.
  await asUser(23); const full=await rpc('join',g.party.code,{player_id:player(23),name:'Too late'});
  assert.equal(full.seated,false); assert.equal(full.members.length,12); assert.equal(seat(full,player(23)),undefined);
  const guest4=full.members.find(m=>m.name==='Gast 4').player_id;
  g=await rpc('claim',g.party.code,{player_id:guest4,controller_id:player(23)});
  assert.equal(seat(g,player(23)).user_id,id(23)); assert.equal(g.members.length,12);
  await asUser(21); g=await rpc('remove_guest',g.party.code,{player_id:gerda.player_id});
  assert.equal(seat(g,gerda.player_id),undefined); assert.equal(past(g,gerda.player_id),undefined);
  await reject(()=>rpc('remove_guest',g.party.code,{player_id:player(22)}),/not_guest/);
  await rpc('end',g.party.code);
});

let night, max, gerda;
await test('claiming a guest seat keeps its player id and results; seats are exclusive',async () => {
  await asUser(24);
  night=await rpc('create',null,{player_id:player(24),name:'Luca'});
  night=await rpc('add_guest',night.party.code,{name:'Max',avatar:'🎸'});
  night=await rpc('add_guest',night.party.code,{name:'Gerda',avatar:'🦄'});
  max=night.members.find(m=>m.name==='Max').player_id; gerda=night.members.find(m=>m.name==='Gerda').player_id;
  // Guests may sit a game out; account seats may not.
  night=await rpc('start',night.party.code,{game_id:'bomb',participant_ids:[player(24),max]});
  night=await rpc('finish',night.party.code,{match_id:night.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(24)]:3,[max]:5}});
  assert.equal(night.results[0].scores[max],5);
  assert.equal((await db.query('SELECT count(*)::integer AS c FROM public.game_stats WHERE user_id=$1',[id(24)])).rows[0].c,1);
  await asUser(25); await reject(()=>rpc('read',night.party.code),/membership/);
  await reject(()=>rpc('claim',night.party.code,{player_id:max,name:'x'.repeat(30)}),/invalid_name/);
  night=await rpc('claim',night.party.code,{player_id:max,name:'Max K.',color:'#f9ca24'});
  assert.deepEqual(seat(night,max),{user_id:id(25),player_id:max,name:'Max K.',is_host:false,avatar:'🎸',color:'#f9ca24',
    controlled_by:null,pending_claim:false,pending_claim_mine:false,banned:false});
  assert.equal(night.results[0].scores[max],5);
  assert.equal((await rpc('claim',night.party.code,{player_id:max})).party.revision,night.party.revision);
  await reject(()=>rpc('claim',night.party.code,{player_id:gerda}),/already_seated/);
  await asUser(26);
  await reject(()=>rpc('claim',night.party.code,{player_id:max}),/seat_taken/);
  await reject(()=>rpc('claim',night.party.code,{player_id:player(24)}),/not_guest/);
  await reject(()=>rpc('claim',night.party.code,{player_id:player(99)}),/not_guest/);
  await asUser(24);
  await reject(()=>rpc('start',night.party.code,{game_id:'bomb',participant_ids:[player(24),gerda]}),/compatible/);
});
await test('concurrent claims of one guest seat admit exactly one account',async () => {
  const isolated=await createDB();
  for (const n of [31,32,33]) await isolated.seedUser(id(n));
  let p=await isolated.request(id(31),'create',null,{player_id:player(31),name:'Host'});
  p=await isolated.request(id(31),'add_guest',p.party.code,{name:'Tom'});
  const tom=p.members.find(m=>m.name==='Tom').player_id;
  const outcomes=await Promise.allSettled([32,33].map(n=>isolated.request(id(n),'claim',p.party.code,{player_id:tom})));
  assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
  const lost=outcomes.find(o=>o.status==='rejected');
  assert.equal(lost.reason.message,'seat_taken');
  const final=await isolated.request(id(31),'read',p.party.code);
  assert.ok([id(32),id(33)].includes(seat(final,tom).user_id));
  // With re-keying (interim seats from join), the loser's stale id still yields seat_taken.
  for (const n of [34,35,36]) await isolated.seedUser(id(n));
  p=await isolated.request(id(34),'create',null,{player_id:player(34),name:'Host'});
  p=await isolated.request(id(34),'add_guest',p.party.code,{name:'Max'});
  const maxSeat=p.members.find(m=>m.name==='Max').player_id;
  for (const n of [35,36]) await isolated.request(id(n),'join',p.party.code,{player_id:player(n),name:`Phone ${n}`});
  const raced=await Promise.allSettled([35,36].map(n=>isolated.request(id(n),'claim',p.party.code,{player_id:maxSeat})));
  assert.equal(raced.filter(o=>o.status==='fulfilled').length,1);
  assert.equal(raced.find(o=>o.status==='rejected').reason.message,'seat_taken');
  await isolated.close();
});
await test('a claim during a running match is deferred and applied when the match ends',async () => {
  await asUser(24);
  night=await rpc('start',night.party.code,{game_id:'bomb',participant_ids:[player(24),max,gerda]});
  await asUser(26); night=await rpc('claim',night.party.code,{player_id:gerda});
  assert.deepEqual([seat(night,gerda).user_id,seat(night,gerda).pending_claim,seat(night,gerda).pending_claim_mine],[null,true,true]);
  assert.equal((await rpc('read',night.party.code)).party.status,'playing');
  await asUser(27); await reject(()=>rpc('claim',night.party.code,{player_id:gerda}),/seat_taken/);
  await asUser(24);
  night=await rpc('finish',night.party.code,{match_id:night.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(24)]:1,[max]:2,[gerda]:3}});
  assert.deepEqual([seat(night,gerda).user_id,seat(night,gerda).controlled_by,seat(night,gerda).pending_claim],[id(26),null,false]);
  assert.equal(night.results[1].scores[gerda],3);
});
await test('release returns a seat to the host phone; never the host seat',async () => {
  await asUser(27); await reject(()=>rpc('release',night.party.code,{player_id:gerda}),/membership/);
  await asUser(25); await reject(()=>rpc('release',night.party.code,{player_id:gerda}),/not_allowed/);
  night=await rpc('release',night.party.code,{player_id:max});
  // The released seat gets a fresh guest id so the account can rejoin with its own identity.
  assert.equal(seat(night,max),undefined);
  const releasedMax=night.members.find(m=>m.name==='Max K.');
  assert.deepEqual([releasedMax.user_id,releasedMax.controlled_by],[null,player(24)]);
  assert.deepEqual([night.results[0].scores[releasedMax.player_id],night.results[0].scores[max]],[5,undefined]);
  await reject(()=>rpc('read',night.party.code),/membership/);
  await asUser(24);
  await reject(()=>rpc('release',night.party.code,{player_id:player(24)}),/cannot_release_host/);
  night=await rpc('release',night.party.code,{player_id:gerda});
  gerda=night.members.find(m=>m.name==='Gerda').player_id;
  assert.equal(seat(night,gerda).user_id,null); assert.equal(night.results[1].scores[gerda],3);
  // A host recall is distinguishable from a kick until the account joins or claims again.
  await asUser(26); await reject(()=>rpc('read',night.party.code),/recalled/);
  await rpc('join',night.party.code,{player_id:player(26),name:'Wieder da'});
  await rpc('leave',night.party.code);
  await reject(()=>rpc('read',night.party.code),/membership/);
  await asUser(25);
  await reject(()=>rpc('claim',night.party.code,{player_id:releasedMax.player_id,controller_id:'bad'}),/invalid_controller/);
  await reject(()=>rpc('claim',night.party.code,{player_id:releasedMax.player_id,controller_id:player(24)}),/controller_taken/);
  // Claiming without an interim seat re-keys the guest to the caller's controller identity.
  night=await rpc('claim',night.party.code,{player_id:releasedMax.player_id,controller_id:max});
  assert.equal(seat(night,max).user_id,id(25)); assert.equal(night.results[0].scores[max],5);
});
await test('profiles: owners edit their seat, the host edits guests, nobody edits during a match',async () => {
  await asUser(25);
  night=await rpc('profile',night.party.code,{player_id:max,name:' Maximilian ',avatar:'🦊',color:'#a29bfe'});
  assert.deepEqual([seat(night,max).name,seat(night,max).avatar,seat(night,max).color],['Maximilian','🦊','#a29bfe']);
  await reject(()=>rpc('profile',night.party.code,{player_id:gerda,name:'Hack'}),/not_allowed/);
  await reject(()=>rpc('profile',night.party.code,{player_id:player(24),name:'Hack'}),/not_allowed/);
  await reject(()=>rpc('profile',night.party.code,{player_id:max,avatar:'💩'}),/invalid_avatar/);
  await reject(()=>rpc('profile',night.party.code,{player_id:max,color:'red'}),/invalid_color/);
  await reject(()=>rpc('profile',night.party.code,{player_id:max,name:''}),/invalid_name/);
  await asUser(24);
  await reject(()=>rpc('profile',night.party.code,{player_id:max,name:'Hack'}),/not_allowed/);
  night=await rpc('profile',night.party.code,{player_id:gerda,name:'Oma Gerda',avatar:'🐙'});
  assert.deepEqual([seat(night,gerda).name,seat(night,gerda).avatar],['Oma Gerda','🐙']);
  night=await rpc('start',night.party.code,{game_id:'bomb',participant_ids:[player(24),max,gerda]});
  await reject(()=>rpc('profile',night.party.code,{player_id:gerda,name:'Later'}),/locked_in_game/);
  await asUser(25); await reject(()=>rpc('profile',night.party.code,{player_id:max,name:'Later'}),/locked_in_game/);
  await reject(()=>rpc('release',night.party.code,{player_id:max}),/locked_in_game/);
});
await test('kicks remove players from the match or party and their match scores are ignored',async () => {
  await asUser(25); await reject(()=>rpc('kick',night.party.code,{player_id:gerda,mode:'party'}),/Host action/);
  await asUser(24);
  await reject(()=>rpc('kick',night.party.code,{player_id:player(24),mode:'party'}),/cannot_kick_host/);
  await reject(()=>rpc('kick',night.party.code,{player_id:gerda,mode:'later'}),/invalid_mode/);
  const statsBefore=(await db.query("SELECT games_played FROM public.game_stats WHERE user_id=$1 AND game_id='bomb'",[id(25)])).rows[0].games_played;
  assert.ok(night.party.participant_ids.includes(gerda));
  night=await rpc('kick',night.party.code,{player_id:gerda,mode:'match_only'});
  assert.ok(seat(night,gerda)); assert.equal(night.party.status,'playing');
  assert.deepEqual(night.party.participant_ids,[player(24),max].sort());
  night=await rpc('kick',night.party.code,{player_id:max,mode:'party'});
  assert.equal(seat(night,max),undefined); assert.equal(past(night,max).banned,false);
  night=await rpc('finish',night.party.code,{match_id:night.party.current_match_id,game_id:'bomb',scored:true,
    scores:{[player(24)]:1,[max]:99,[gerda]:50}});
  assert.deepEqual(night.results.at(-1).scores,{[player(24)]:1});
  const statsAfter=(await db.query("SELECT games_played FROM public.game_stats WHERE user_id=$1 AND game_id='bomb'",[id(25)])).rows[0].games_played;
  assert.equal(statsAfter,statsBefore);
  assert.equal(night.results[0].scores[max],5);
  await reject(()=>rpc('kick',night.party.code,{player_id:gerda,mode:'match_only'}),/not_playing/);
  await asUser(25); await reject(()=>rpc('read',night.party.code),/membership/);
});
await test('banned accounts cannot rejoin or claim until the host lifts the ban',async () => {
  await asUser(25); night=await rpc('join',night.party.code,{player_id:max,name:'Max zurück'});
  assert.equal(seat(night,max).user_id,id(25)); assert.equal(seat(night,max).avatar,'🦊');
  await asUser(24); night=await rpc('kick',night.party.code,{player_id:max,mode:'ban'});
  assert.equal(seat(night,max),undefined); assert.equal(past(night,max).banned,true);
  await asUser(25);
  await reject(()=>rpc('join',night.party.code,{player_id:max,name:'Max'}),/banned/);
  await reject(()=>rpc('claim',night.party.code,{player_id:gerda}),/banned/);
  await asUser(24); night=await rpc('unban',night.party.code,{player_id:max});
  assert.equal(past(night,max).banned,false);
  await asUser(25); night=await rpc('join',night.party.code,{player_id:max,name:'Max'});
  assert.equal(seat(night,max).user_id,id(25));
});
await test('removing a guest with results archives the seat instead of deleting it',async () => {
  await asUser(24); night=await rpc('remove_guest',night.party.code,{player_id:gerda});
  assert.equal(seat(night,gerda),undefined); assert.equal(past(night,gerda).name,'Oma Gerda');
  assert.equal(night.results[1].scores[gerda],3);
  await asUser(26); await reject(()=>rpc('claim',night.party.code,{player_id:gerda}),/not_guest/);
});
await test('a fresh seat from joining is swapped for the claimed guest seat, also when deferred',async () => {
  await asUser(28); let swap=await rpc('create',null,{player_id:player(28),name:'Host'});
  swap=await rpc('add_guest',swap.party.code,{name:'Paula'});
  const paula=swap.members.find(m=>m.name==='Paula').player_id;
  await asUser(29); swap=await rpc('join',swap.party.code,{player_id:player(29),name:'Konto'});
  swap=await rpc('claim',swap.party.code,{player_id:paula});
  // The guest seat takes over the interim seat's controller id; the interim seat disappears.
  assert.equal(seat(swap,paula),undefined); assert.equal(past(swap,player(29)),undefined);
  assert.deepEqual([seat(swap,player(29)).user_id,seat(swap,player(29)).name],[id(29),'Paula']);
  assert.equal(swap.members.length,2);
  await asUser(28); swap=await rpc('add_guest',swap.party.code,{name:'Rita'});
  const rita=swap.members.find(m=>m.name==='Rita').player_id;
  swap=await rpc('start',swap.party.code,{game_id:'bomb',participant_ids:[player(28),player(29),rita]});
  await asUser(29); await reject(()=>rpc('claim',swap.party.code,{player_id:rita}),/already_seated/);
  await asUser(30); swap=await rpc('join',swap.party.code,{player_id:player(30),name:'Spät'});
  swap=await rpc('claim',swap.party.code,{player_id:rita});
  assert.equal(seat(swap,player(30)).user_id,id(30)); assert.equal(seat(swap,rita).pending_claim_mine,true);
  await asUser(28);
  swap=await rpc('finish',swap.party.code,{match_id:swap.party.current_match_id,game_id:'bomb',scored:true,scores:{[player(28)]:1,[player(29)]:2,[rita]:3}});
  assert.equal(seat(swap,rita),undefined);
  assert.deepEqual([seat(swap,player(30)).user_id,seat(swap,player(30)).name],[id(30),'Rita']);
  assert.deepEqual(swap.results[0].scores,{[player(28)]:1,[player(29)]:2,[player(30)]:3});
});
await test('anonymous devices can read the server clock and nothing else',async () => {
  await db.exec('SET ROLE anon');
  const before=Date.now();
  const now=(await db.query('SELECT public.party_server_now() AS now')).rows[0].now;
  assert.ok(Math.abs(new Date(now).getTime()-before)<60000);
  await reject(()=>rpc('read',night.party.code),/permission denied/);
  await db.exec('RESET ROLE');
});
await test('existing members are backfilled with deterministic profiles in join order',async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const legacy=new PGlite();
  await legacy.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
    CREATE FUNCTION public.is_premium(uid uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE TABLE public.game_stats(user_id uuid, game_id text, games_played int, games_won int, total_score int,
      best_score int, streak int, best_streak int, last_played_at timestamptz, updated_at timestamptz, PRIMARY KEY(user_id,game_id));`);
  await legacy.exec(await readFile(new URL('../../supabase/migrations/20260922235000_controller_parties.sql',import.meta.url),'utf8'));
  for (let n=1;n<=14;n++) await legacy.query('INSERT INTO auth.users VALUES ($1)',[id(n)]);
  const legacyParty=(await legacy.query("INSERT INTO public.controller_parties(code,host_user_id,host_player_id) VALUES ('ABCDEF',$1,$2) RETURNING id",[id(1),player(1)])).rows[0].id;
  for (let n=1;n<=14;n++) await legacy.query("INSERT INTO public.controller_party_members(party_id,user_id,player_id,name,joined_at) VALUES ($1,$2,$3,$4,now()+make_interval(secs=>$5))",[legacyParty,id(n),player(n),`P${n}`,n]);
  await legacy.exec(await readFile(new URL('../../supabase/migrations/20261001120000_party_play_guests.sql',import.meta.url),'utf8'));
  const rows=(await legacy.query('SELECT avatar,color,controlled_by,banned FROM public.controller_party_members ORDER BY joined_at')).rows;
  assert.deepEqual(rows.slice(0,3).map(r=>[r.avatar,r.color]),[['🎉','#df8eff'],['🔥','#ff6b98'],['⭐','#8ff5ff']]);
  assert.deepEqual([rows[12].color,rows[13].avatar],['#df8eff','🐼']);
  assert.ok(rows.every(r=>r.controlled_by===null && r.banned===false));
  await legacy.close();
});
await db.close();
