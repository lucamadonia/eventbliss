import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDB } from '../../scripts/qa/controller-db.mjs';

const { db, seedUser, request } = await createDB();
const host = '00000000-0000-4000-8000-000000000801';
const guest = '00000000-0000-4000-8000-000000000802';
await seedUser(host, { premium: true });
await seedUser(guest);
const playerId = `player-${'8'.repeat(64)}`;
const localStart = Date.now() - 90 * 60_000;
const upgrade = async payload => db.transaction(async tx => {
  await tx.query("SELECT set_config('test.uid',$1,true),set_config('test.anonymous','false',true)", [host]);
  await tx.exec('SET LOCAL ROLE authenticated');
  const result = await tx.query('SELECT public.controller_party_upgrade($1::jsonb) AS data', [JSON.stringify(payload)]);
  return result.rows[0].data;
});
const payload = {
  player_id: playerId, name: 'Host', tv_code: 'TVX247', local_started_at: localStart,
  players: [
    { id: 'local-anna', name: 'Anna', avatar: '🎉', color: '#df8eff' },
    { id: 'local-ben', name: 'Ben', avatar: '🔥', color: '#ff6b98' },
  ],
  archived_players: [{ id: 'local-old', name: 'Chris', avatar: '⭐', color: '#8ff5ff' }],
  history: [{ game_id: 'bomb', scored: true, played_at: localStart + 10_000,
    scores: { 'local-anna': 8, 'local-ben': 5, 'local-old': 2 } }],
  playlist: ['bomb', 'pixeljagd'],
};

await test('upgrade keeps the TV channel, profiles, history and next game in one party', async () => {
  const data = await upgrade(payload);
  assert.equal(data.party.tv_code, 'TVX247');
  assert.equal(data.party.host_plays, false);
  assert.equal(data.party.playlist[1], 'pixeljagd');
  assert.equal(data.party.min_client, 2);
  assert.ok(Math.abs(Date.parse(data.party.local_started_at) - localStart) < 1000);
  const active = data.members.filter(m => !m.is_host);
  assert.deepEqual(active.map(m => [m.name, m.avatar, m.color]), [
    ['Anna', '🎉', '#df8eff'], ['Ben', '🔥', '#ff6b98'],
  ]);
  assert.equal(data.past_members[0].name, 'Chris');
  assert.equal(data.results.length, 1);
  const scoreIds = Object.keys(data.results[0].scores);
  assert.ok(scoreIds.includes(active[0].player_id));
  assert.ok(scoreIds.includes(active[1].player_id));
  assert.ok(scoreIds.includes(data.past_members[0].player_id));
  assert.equal(data.results[0].scores[active[0].player_id], 8);
  const reopened = await request(host, 'read', data.party.code);
  assert.deepEqual(reopened.results, data.results);
  assert.equal(reopened.party.tv_code, payload.tv_code);
  const joined = await request(guest, 'join', data.party.code, { player_id: `player-${'9'.repeat(64)}`, name: 'Guest' });
  assert.equal(joined.members.length, 4);
  const claimed = await request(guest, 'claim', data.party.code, { player_id: active[0].player_id });
  const phoneSeat = claimed.members.find(m => m.user_id === guest && !m.is_host);
  assert.equal(phoneSeat.name, 'Anna');
  assert.equal(phoneSeat.player_id, `player-${'9'.repeat(64)}`);
  assert.equal(claimed.results[0].scores[phoneSeat.player_id], 8);
  assert.equal(claimed.results[0].scores[active[0].player_id], undefined);
});

await test('invalid history rolls back the whole upgrade', async () => {
  const before = Number((await db.query('SELECT count(*) AS n FROM public.controller_parties')).rows[0].n);
  await assert.rejects(() => upgrade({ ...payload, tv_code: 'TVX248', history: [
    { game_id: 'bomb', scored: true, played_at: localStart, scores: { unknown: 5 } },
  ] }), /Invalid score/);
  const after = Number((await db.query('SELECT count(*) AS n FROM public.controller_parties')).rows[0].n);
  assert.equal(after, before);
});

await db.close();
