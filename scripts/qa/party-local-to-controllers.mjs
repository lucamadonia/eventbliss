// Local Party -> Joystick Party, including TV QR and profile/plan import.
// Run against scripts/qa/party-play-vite.config.ts on port 5186.
import fs from 'node:fs';
import { createHarness, pause, assert } from './party-play-harness.mjs';
import { joinPhone, ready, startGame } from './party-play-flows.mjs';
import { hostSetup } from './party-play-games.mjs';

const out = 'scripts/tmp/party-play/local-to-controllers';
fs.mkdirSync(out, { recursive: true });
const h = await createHarness({ out, base: process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186', lang: 'de' });
const report = {};
try {
  const host = await h.open('Host', { premium: true, route: '/party' });
  await host.page.waitForSelector('input[type=text]', { timeout: 30000 });
  for (const name of ['Anna', 'Ben']) {
    await host.page.type('input[type=text]', name);
    await host.page.keyboard.press('Enter');
    await pause(200);
  }
  await host.page.waitForSelector('[data-testid^="party-edit-player-"]');
  await host.page.click('[data-testid^="party-edit-player-"]');
  await host.page.waitForSelector('[data-testid="profile-editor"]');
  await host.page.click('[data-testid="profile-name"]');
  await host.page.keyboard.down('Control');
  await host.page.keyboard.press('A');
  await host.page.keyboard.up('Control');
  await host.page.keyboard.type('Alex');
  await host.page.$eval('[data-testid="profile-avatar"]:nth-of-type(2)', b => b.click());
  await host.page.$eval('[data-testid="profile-color"]:nth-of-type(2)', b => b.click());
  await pause(200);
  await host.page.$eval('[data-testid="profile-save"]', b => b.click());
  await host.page.waitForFunction(() => JSON.parse(localStorage.getItem('eventbliss_party_session') || 'null')?.players?.some(p => p.name === 'Alex'), { timeout: 8000 }).catch(() => {});
  const before = await host.page.evaluate(() => JSON.parse(localStorage.getItem('eventbliss_party_session') || 'null'));
  report.profileAfterEdit = before?.players?.map(p => p.name);
  assert(before?.players?.some(p => p.name === 'Alex'), 'local profile edit did not persist');
  report.localPlayers = before.players.map(p => ({ name: p.name, avatar: p.avatar, color: p.color }));

  await host.page.evaluate(() => { const d = document.querySelector('details'); if (d) d.open = true; });
  const tvCode = await host.page.evaluate(() => document.body.innerText.match(/\/tv\/([A-Z0-9]{4,8})/)?.[1] ?? null);
  assert(tvCode, 'no TV link code');
  const tv = await h.tv(tvCode);
  await tv.page.waitForSelector('[data-testid="tv-lobby-joystick-qr"]', { timeout: 30000 });
  report.localTvQr = await tv.page.$eval('[data-testid="tv-lobby-joystick-qr"]', node => node.getAttribute('data-join-url'));
  assert(report.localTvQr?.includes(`/party/controllers?source=tv&tv=${tvCode}`), 'TV switch QR is wrong');
  await tv.page.screenshot({ path: `${out}/01-local-tv.png` });

  await host.page.click('[data-testid="party-switch-joystick"]');
  await host.page.waitForSelector('[data-testid="local-party-activation"]', { timeout: 20000 });
  await host.page.screenshot({ path: `${out}/02-activation.png` });
  await host.page.waitForFunction(() => {
    const data = window.controllerQA?.state()?.data;
    return data?.members?.filter(m => !m.is_host).length === 2;
  }, { timeout: 45000 });
  await pause(1200);
  const after = await host.page.evaluate(() => ({
    data: window.controllerQA?.state()?.data,
    backup: JSON.parse(localStorage.getItem('eventbliss_party_local_backup') || 'null'),
  }));
  assert(after.backup?.players?.length === 2, 'local party backup missing');
  const guests = after.data.members.filter(m => !m.is_host);
  for (const player of before.players) {
    assert(guests.some(m => m.name === player.name && m.avatar === player.avatar && m.color === player.color), `profile not imported: ${player.name}`);
  }
  report.controllerCode = after.data.party.code;
  report.serverTvCode = after.data.party.tv_code;
  report.backupTvCode = after.backup?.tvCode;
  assert(after.data.party.tv_code === tvCode, 'TV pairing code changed during upgrade');
  assert(after.data.party.host_plays === false, 'host was added as an extra player');
  report.importedPlayers = guests.map(m => ({ name: m.name, avatar: m.avatar, color: m.color }));
  await tv.page.waitForFunction(code => document.querySelector('[data-testid="tv-lobby-qr"]')?.getAttribute('data-join-url')?.includes(`/party/join/${code}`), { timeout: 30000 }, report.controllerCode);
  await tv.page.waitForFunction(() => document.querySelector('[data-testid="tv-lobby"]')?.getAttribute('data-player-count') === '3', { timeout: 20000 });
  report.joinQr = await tv.page.$eval('[data-testid="tv-lobby-qr"]', node => node.getAttribute('data-join-url'));
  report.tvPlayers = await tv.page.$eval('[data-testid="tv-lobby"]', node => node.getAttribute('data-player-count'));
  await tv.page.screenshot({ path: `${out}/03-controller-tv.png` });

  const lena = await joinPhone(h, { notes: [] }, host, report.controllerCode, 'Lena', { choice: { claim: 'Alex' } });
  report.claimedSeat = after.data.members.find(member => member.name === 'Alex')?.player_id;
  report.guestJoinRoute = await lena.route();
  report.guestJoinText = (await lena.text()).slice(0, 700);
  report.membersAfterGuestJoin = (await host.party()).members.map(member => ({ name: member.name, player_id: member.player_id, user_id: member.user_id, controlled_by: member.controlled_by }));
  await host.until(async client => (await client.party()).members.some(member => member.name === 'Alex' && member.user_id === lena.account), 'guest did not claim local seat', 15000);
  report.claimedPhoneSeat = (await host.party()).members.find(member => member.name === 'Alex')?.player_id;
  await ready(lena);
  await startGame(host, ['ohrwurm']);
  await lena.until(async client => (await client.route()).startsWith('/games/ohrwurm'), 'claimed phone stayed in waiting lobby', 15000);
  assert(await hostSetup(host, 'ohrwurm'), 'Host could not start Ohrwurm');
  await lena.page.waitForSelector('[data-phase="draw"]', { timeout: 20000 });
  report.guestGameRoute = await lena.route();
  report.guestGamePhase = await lena.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  report.hostGamePhase = await host.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  assert(report.hostGamePhase === 'draw', 'Host did not enter Ohrwurm round');
  await h.shotAll('04-ohrwurm');
  await lena.click('ohrwurm-start-silent');
  await lena.wait('ohrwurm-to-place');
  await lena.click('ohrwurm-to-place');
  await host.page.waitForSelector('[data-phase="place"]', { timeout: 12000 });
  await lena.page.waitForSelector('[data-phase="place"]', { timeout: 12000 });
  report.guestActionReachedHost = true;
  await lena.reload();
  await lena.page.waitForSelector('[data-phase="place"]', { timeout: 20000 });
  report.guestRejoinedPhase = await lena.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  await h.shotAll('05-rejoined-ohrwurm');
  report.passed = true;
  console.log(JSON.stringify(report));
} catch (error) {
  report.passed = false;
  report.error = String(error.stack ?? error);
  console.error(report.error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await h.close();
}
