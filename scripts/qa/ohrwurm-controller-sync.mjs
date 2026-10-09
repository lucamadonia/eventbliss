// Verify Ohrwurm reaches the same running round on Host, phone and TV.
// Run against scripts/qa/party-play-vite.config.ts on port 5186.
import fs from 'node:fs';
import { createHarness, assert, pause } from './party-play-harness.mjs';
import { matchSetup } from './party-play-scenarios-game.mjs';

const out = 'scripts/tmp/party-play/ohrwurm-controller-sync';
fs.mkdirSync(out, { recursive: true });
const h = await createHarness({ out, base: process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186', lang: 'de' });
const report = { passed: false };
try {
  const m = await matchSetup({ h, notes: [], evidence: {} }, { game: 'ohrwurm', phones: ['Lena'], tv: true });
  const guest = m.phones[0];
  await guest.page.waitForSelector('[data-phase="draw"]', { timeout: 20000 });
  await m.host.page.waitForSelector('[data-phase="draw"]', { timeout: 20000 });
  report.firstGuestPhase = await guest.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  report.firstHostPhase = await m.host.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  report.guestRoute = await guest.route();
  report.hostRoute = await m.host.route();
  report.tvGame = (await m.tv.tvMessages()).filter(message => message?.game === 'ohrwurm').at(-1)?.game ?? null;
  await h.shotAll('01-running');

  await guest.reload();
  await guest.page.waitForSelector('[data-phase="draw"]', { timeout: 20000 });
  await pause(500);
  report.rejoinedGuestPhase = await guest.page.$eval('[data-phase]', node => node.getAttribute('data-phase'));
  report.rejoinedGuestRoute = await guest.route();
  report.guestErrors = guest.errors;
  report.hostErrors = m.host.errors;
  await h.shotAll('02-rejoined');
  assert(report.rejoinedGuestRoute.startsWith('/games/ohrwurm'), 'guest returned to the waiting lobby');
  assert(report.guestErrors.length === 0 && report.hostErrors.length === 0, 'browser errors occurred');
  report.passed = true;
  console.log(JSON.stringify(report));
} catch (error) {
  report.error = String(error.stack ?? error);
  console.error(report.error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await h.close();
}
