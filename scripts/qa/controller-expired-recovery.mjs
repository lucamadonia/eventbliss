// A server-expired joystick party must not leave its roster or QR in the app.
// Run with party-play-vite.config.ts on port 5186; all data is local PGlite.
import { createHarness, assert } from './party-play-harness.mjs';
import { connectTv, createParty, joinPhone } from './party-play-flows.mjs';

const h = await createHarness({ out: 'scripts/tmp/party-play/expired-recovery', base: 'http://127.0.0.1:5186', lang: 'de' });
try {
  console.log('Creating first party');
  const { host, code: oldCode } = await createParty(h);
  console.log('Expiring first party', oldCode);
  await h.db.db.query("UPDATE public.controller_parties SET expires_at=now()-interval '1 second' WHERE code=$1", [oldCode]);
  await host.until(async client => (await client.party()) === null, 'expired party still shown', 12000);
  const stored = await host.page.evaluate(account => ({
    remembered: localStorage.getItem(`controller_party:${account}`),
    session: localStorage.getItem('eventbliss_party_session'),
  }), host.account);
  assert(stored.remembered === null && stored.session === null, 'expired party stayed in device storage');
  await host.wait('party-error');
  console.log('Creating replacement party');

  const createLabel = await host.page.evaluate(() => window.qaT?.('partyControllers.create') ?? 'Create');
  assert(await host.clickText(`^${createLabel}`), 'fresh party action missing');
  await host.until(async client => !!(await client.party())?.party.code, 'fresh party was not created', 20000);
  const newCode = (await host.party()).party.code;
  assert(newCode !== oldCode, 'new party reused expired code');
  assert((await host.party()).members.length === 1, 'expired roster carried into new party');

  console.log('Connecting TV', newCode);
  const tv = await connectTv(h, host);
  await tv.wait('tv-lobby-qr');
  const joinUrl = await tv.attr('tv-lobby-qr', 'data-join-url');
  assert(new URL(joinUrl).pathname === `/party/join/${newCode}`, 'TV QR does not use fresh party code');
  console.log('Joining replacement party');
  const guest = await joinPhone(h, { notes: [] }, host, newCode, 'Lena', { route: new URL(joinUrl).pathname });
  assert((await host.party()).members.some(member => member.user_id === guest.account), 'phone could not join the fresh QR');
  console.log(JSON.stringify({ passed: true, expiredCode: oldCode, newCode, joinUrl, members: (await host.party()).members.length }));
} finally {
  await h.close();
}
