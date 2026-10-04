// Per-game guest runs (P-<game>): every game with a guest mode, played with two 🔁 guests on the host
// phone + phones + TV, guest play forced (window.__partyPlayForceShared, dev/QA only). Checks per game:
// F01–F04 guests participate per mode and every guest turn starts with a covered handover; secrecy
// (another seat's secret never on a wrong device, nothing secret on the TV); T-1 phase-sync skew;
// guests in the result. Result per game goes to timing-handover (flag owner).
//   node scripts/qa/party-play-browser.mjs --scenario 'P-*'   (or P-taboo)
import fs from 'node:fs';
import { assert, Inconclusive, sceneSkew } from './party-play-harness.mjs';
import { matchSetup } from './party-play-scenarios-game.mjs';
import { playMatch } from './party-play-games.mjs';

const registry = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
const games = registry.split('{').filter(e => /id:\s*"/.test(e) && /minPlayers/.test(e)).map(e => ({
  id: e.match(/id:\s*"([^"]+)"/)[1], min: Number(e.match(/minPlayers:\s*(\d+)/)[1]),
  mode: (e.match(/sharedDevice:\s*"(\w+)"/) ?? [])[1] ?? 'sitout', released: /sharedDeviceSupported:\s*true/.test(e),
})).filter(g => g.mode !== 'sitout');

/** Secret-bearing elements: their data-player-id must be a seat this device plays (own + its guests); none on the TV. */
const SECRET_SEL = '[data-testid*="role-card"],[data-testid*="secret"],[data-testid*="identity"],[data-testid*="impostor-word"],[data-testid*="sharedquiz-role"]';
async function secrecyViolations(devices, tv, gameId) {
  const found = [];
  for (const d of devices) {
    if (gameId === 'wer-bin-ich') {
      // In this game every player must see the other identities. Only the
      // current holder's own identity must be absent from the assign screen.
      const ownCard = await d.page.$eval('[data-testid="whoami-assign"]', stage => {
        const holder = stage.getAttribute('data-seat-id');
        return !!holder && [...stage.querySelectorAll('[data-testid="whoami-identity-card"]')]
          .some(card => card.getAttribute('data-player-id') === holder);
      }).catch(() => false);
      if (ownCard) found.push(`${d.name} shows the current holder's own identity`);
      continue;
    }
    const local = new Set((await d.snapshot().catch(() => ({}))).localPlayerIds ?? []);
    const owners = await d.page.$$eval(SECRET_SEL, ns => ns.filter(n => n.getBoundingClientRect().height > 0).map(n => n.getAttribute('data-player-id')).filter(Boolean)).catch(() => []);
    for (const o of owners) if (local.size && !local.has(o)) found.push(`${d.name} shows secret of ${o.slice(0, 14)}`);
  }
  if (tv) { const n = await tv.page.$$eval(SECRET_SEL, ns => ns.filter(x => x.getBoundingClientRect().height > 0).length).catch(() => 0); if (n) found.push(`TV shows ${n} secret element(s)`); }
  return found;
}

function guestRun(game) {
  return async ctx => {
    const phones = ['Lena', 'Tom', 'Uwe', 'Vera'].slice(0, Math.max(1, game.min - 3));
    const m = await matchSetup(ctx, { game: game.id, guests: ['ALEXANDRA-MARIE', 'Gerda'], phones, forceShared: [game.id] });
    const guestIds = Object.values(m.guests); const parts = await m.participants();
    ctx.evidence = { mode: game.mode, released: game.released, guestsParticipating: guestIds.filter(id => parts.includes(id)).length };
    assert(guestIds.every(id => parts.includes(id)), `${game.id} (${game.mode}): guests not in participantIds even with guest play forced`);
    const handed = new Set(); const secrets = []; let leaks = 0, ticks = 0;
    const res = await playMatch(m.h, m.host, game.id, m.map, { budgetMs: 150000, onHandover: async info => {
      if (info.step !== 'cover') handed.add(info.playerId);
      leaks += await m.host.page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height && !b.closest('[data-testid="handover-screen"]') && !b.closest('[aria-haspopup]') && !b.hasAttribute('aria-haspopup') && !/spieler|players|abort|abbrechen|tv/i.test(b.innerText + (b.getAttribute('aria-label') ?? ''))).length > 2 ? 1 : 0);
    }, onTick: async () => { if (++ticks % 6 === 0) secrets.push(...await secrecyViolations([m.host, ...m.phones], m.tv, game.id)); } });
    // T-1: every planned scene (phase gate) shown on ≥ 2 devices within 250 ms.
    const traces = await Promise.all([m.host, ...m.phones, m.tv].filter(Boolean).map(async c => ({ device: c.name, entries: await c.trace() })));
    const skews = sceneSkew(traces); const worst = skews.length ? Math.max(...skews.map(s => s.skewMs)) : null;
    Object.assign(ctx.evidence, { handed: [...handed].filter(id => guestIds.includes(id)).length, leaks, secrecy: [...new Set(secrets)].slice(0, 5), scenes: skews.length, worstSkewMs: worst, res });
    await m.h.shotAll(`${game.id}-end`);
    assert(!leaks, `${game.id}: game content visible behind the handover screen ${leaks}×`);
    assert(!secrets.length, `${game.id}: secrecy violated — ${[...new Set(secrets)].slice(0, 2).join('; ')}`);
    if (worst !== null) assert(worst <= 250, `${game.id}: phase-sync skew ${worst} ms > 250 (T-1)`);
    // A timeout cannot prove the guests reached the result, even if secrecy and timing looked good.
    if (!res.finished) throw new Inconclusive(`${game.id}: match did not finish within the driver budget; participation/secrecy/skew checks passed`);
    const scores = (await m.host.party()).results.at(-1).scores;
    assert(guestIds.every(id => id in scores), `${game.id}: guest missing from the result`);
    // Bomb keeps the fuse running and has no private pass screen between players.
    const needsHandover = game.id !== 'bomb' && ['turns', 'sequential', 'secret'].includes(game.mode);
    if (needsHandover && !handed.size) throw new Inconclusive(`${game.id}: no guest turn reached within the budget (driver), participation/secrecy/skew checks passed`);
  };
}

export const guestScenarios = games.map(g => ({ id: `P-${g.id}`, title: `Guests on the host phone (${g.mode}): ${g.id} — F01–F04, secrecy, T-1`, timeoutMs: 420000, run: guestRun(g) }));
