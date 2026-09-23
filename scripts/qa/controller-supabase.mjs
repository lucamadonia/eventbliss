import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const fromVite = createRequire(require.resolve('vite'));
const { build } = fromVite('esbuild');
await build({ entryPoints: [fileURLToPath(new URL('../../src/games/multiplayer/room-session.ts', import.meta.url))], bundle: true, platform: 'node', format: 'esm', outfile: fileURLToPath(new URL('../tmp/controller-room-session.mjs', import.meta.url)), tsconfig: fileURLToPath(new URL('../../tsconfig.app.json', import.meta.url)) });
const { RoomSession } = await import(new URL('../tmp/controller-room-session.mjs', import.meta.url).href);

// Run with node; accepts ONLY the isolated loopback stack, never a hosted project.
const env = JSON.parse(await readFile(new URL('../tmp/controller-supabase-status.json', import.meta.url), 'utf8'));
assert.match(env.API_URL, /^http:\/\/127\.0\.0\.1:56321$/);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
const run = Date.now();
const password = `Local-QA-${crypto.randomUUID()}!`;
const clients = [], rooms = [], users = [];
async function until(check, diagnostic = () => ({})) {
  const deadline = Date.now() + 20000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for real Realtime synchronization: ' + JSON.stringify(diagnostic()));
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
async function rpc(client, action, code = null, payload = {}) {
  const { data, error } = await client.rpc('controller_party_request', { action, code, payload });
  if (error) throw new Error(error.message);
  return data;
}
try {
  const anon = createClient(env.API_URL, env.ANON_KEY, options);
  const denied = await anon.rpc('controller_party_request', { action: 'create', code: null, payload: {} });
  assert.ok(denied.error, 'anonymous RPC denied');
  for (let index = 0; index < 4; index++) {
    const email = `controller-${run}-${index}@example.test`;
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    users.push(created.data.user);
    const client = createClient(env.API_URL, env.ANON_KEY, options);
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error) throw signed.error;
    clients.push(client);
    const room = new RoomSession(client); rooms.push(room);
    await room.prepareAccountIdentity(created.data.user.id);
  }
  const ids = rooms.map(room => room.getSnapshot().myPlayerId);
  // Identity preparation returns the fingerprint before joining (snapshot gets it on connect).
  for (let i = 0; i < rooms.length; i++) ids[i] = await rooms[i].prepareAccountIdentity(users[i].id);
  let state = await rpc(clients[0], 'create', null, { player_id: ids[0], name: 'Moderator', host_plays: false });
  const code = state.party.code;
  for (let i = 1; i < 3; i++) await rpc(clients[i], 'join', code, { player_id: ids[i], name: `Player ${i}` });
  const access = async index => {
    const snapshot = await rpc(clients[index], 'read', code);
    return { code, hostId: snapshot.party.host_player_id, hostPlays: snapshot.party.host_plays,
      premium: snapshot.party.premium, memberIds: snapshot.members.map(member => member.player_id),
      refresh: () => access(index),
      start: async (game_id, participant_ids) => (await rpc(clients[index], 'start', code, { game_id, participant_ids })).party.current_match_id };
  };
  for (let i = 0; i < 3; i++) rooms[i].configureParty(await access(i));
  await rooms[0].createPartyRoom(code, 'Moderator');
  for (let i = 1; i < 3; i++) { await rooms[i].joinRoom(code, `Player ${i}`); rooms[i].setReady(true); }
  await until(() => rooms[0].getSnapshot().players.length === 3 && rooms[0].getSnapshot().players.every(player => player.isReady));
  const matches = [];
  for (const game of ['bomb', 'category', 'this-or-that']) {
    console.log(JSON.stringify({stage:'start',game}));
    const started = await rooms[0].startGame(game);
    const status = rooms[0].getSnapshot();
    assert.equal(started, true, JSON.stringify({game,connection:status.connection,status:status.room.status,players:status.players.map(p=>({host:p.isHost,ready:p.isReady})),memberCount:(await access(0)).memberIds.length}));
    await until(() => rooms[1].getSnapshot().room?.status === 'playing' && rooms[1].getSnapshot().room?.gameId === game);
    const room = rooms[0].getSnapshot().room;
    assert.ok(!room.participantIds.includes(ids[0]));
    matches.push(room.sessionId);
    let received;
    const stop = rooms[0].onBroadcast('qa-move', data => { received = data; });
    rooms[1].broadcast('qa-move', { own: true });
    await until(() => received?.__senderId === ids[1]); stop();
    if (game === 'bomb') {
      console.log('Late account joining');
      await rpc(clients[3], 'join', code, { player_id: ids[3], name: 'Late' });
      rooms[3].configureParty(await access(3)); await rooms[3].joinRoom(code, 'Late');
      assert.ok(!rooms[3].getSnapshot().room.participantIds.includes(ids[3]));
      rooms[3].setReady(true);
      const activeIds = rooms[0].getSnapshot().room.players.map(player => player.id);
      await Promise.all(clients[1].getChannels().map(channel => channel.unsubscribe()));
      await until(() => rooms[0].getSnapshot().connection === 'reconnecting');
      assert.deepEqual(rooms[0].getSnapshot().room.players.map(player => player.id), activeIds);
      console.log('Guest reconnecting');
      await rooms[1].joinRoom(code, 'Player 1');
      await until(() => rooms[0].getSnapshot().connection === 'connected');
      assert.equal(rooms[1].getSnapshot().myPlayerId, ids[1]);
    }
    const payload = { match_id: room.sessionId, game_id: game, scored: true,
      scores: Object.fromEntries(room.participantIds.map(id => [id, 5])) };
    state = await rpc(clients[0], 'finish', code, payload);
    const repeated = await rpc(clients[0], 'finish', code, payload);
    assert.equal(repeated.results.length, state.results.length);
    console.log('Finish room transition');
    rooms[0].finishPartyGame();
    await until(() => rooms[1].getSnapshot().room?.status === 'lobby' && rooms[0].getSnapshot().players.every(player => player.isReady), () => ({game, sessions: rooms.map(r => ({connection: r.getSnapshot().connection, status: r.getSnapshot().room?.status, error: r.getSnapshot().error, players: r.getSnapshot().players.map(p => p.name)}))}));
  }
  assert.equal(new Set(matches).size, 3);
  const stats = await admin.from('game_stats').select('user_id,games_played,games_won').in('user_id', users.map(user => user.id));
  if (stats.error) throw stats.error;
  assert.ok(stats.data.every(row => row.user_id !== users[0].id && row.games_played === 1 && row.games_won === 1));
  assert.equal(stats.data.length, 8);
  await rpc(clients[0], 'end', code);
  const result = { backend: 'local Supabase Auth + PostgREST + Realtime', games: 3, lateJoin: true,
    moderatorExcluded: true, identityReconnect: true, exactlyOnceStats: true, anonymousDenied: true };
  await writeFile(new URL('../tmp/controller-supabase-result.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  rooms.forEach(room => room.leaveRoom());
  await Promise.all(clients.map(client => client.removeAllChannels()));
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
}
