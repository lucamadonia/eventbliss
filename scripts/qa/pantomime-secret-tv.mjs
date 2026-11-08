// Real controller-party route: the actor sees a word, the paired TV never does.
import fs from 'node:fs';
import { createHarness, assert, pause } from './party-play-harness.mjs';
import { matchSetup } from './party-play-scenarios-game.mjs';

const out = 'scripts/tmp/party-play/pantomime-secret-tv';
fs.mkdirSync(out, { recursive: true });
const h = await createHarness({ out, base: process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186', lang: 'de' });
const report = { passed: false };
try {
  const match = await matchSetup({ h, notes: [], evidence: {} }, { game: 'pantomime', guests: ['Max', 'Gerd'], phones: ['Lena'], tv: true });
  const devices = [match.host, ...match.phones];
  await match.tv.page.waitForSelector('[data-testid="tv-pantomime-view"]', { timeout: 20000 });
  await match.host.page.waitForSelector('.theater-ready button', { timeout: 20000 });
  await match.host.page.$eval('.theater-ready button', button => button.click());

  let actor = null;
  let secret = null;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && !secret) {
    for (const device of devices) {
      const cue = await device.page.$eval('.theater-cue', node => node.innerText.trim()).catch(() => null);
      if (cue) { actor = device; secret = cue; break; }
      await device.page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const decline = buttons.find(button => !button.disabled && button.getBoundingClientRect().height && /lieber normal|decline|ohne herausforderung/i.test(button.innerText));
        decline?.click();
      });
    }
    await pause(300);
  }
  assert(secret, 'no actor device received the secret word');
  await match.tv.page.waitForSelector('[data-testid="tv-pantomime-view"]', { timeout: 10000 });
  const tvText = await match.tv.text();
  const packets = (await match.tv.tvMessages()).filter(message => message?.game === 'pantomime');
  report.actor = actor.name;
  report.actorHasWord = true;
  report.tvHasView = true;
  report.tvLeaksWord = tvText.includes(secret);
  report.tvPacketLeaksWord = packets.some(packet => JSON.stringify(packet).includes(secret));
  report.otherDeviceLeaksWord = false;
  for (const device of devices.filter(device => device !== actor)) {
    if ((await device.text()).includes(secret)) report.otherDeviceLeaksWord = true;
  }
  await h.shotAll('word-visible-only-to-actor');
  assert(!report.tvLeaksWord, 'the paired TV displayed the secret word');
  assert(!report.tvPacketLeaksWord, 'a TV packet contained the secret word');
  assert(!report.otherDeviceLeaksWord, 'another phone displayed the secret word');
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
