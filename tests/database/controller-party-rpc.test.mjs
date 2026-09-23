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
await db.close();
