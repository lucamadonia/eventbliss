// Chaos run (masterplan 12.1-5, G4): random delay 0–800 ms and 5 % broadcast loss on every
// device (set by the runner), plus random phone reloads. Asserts: the match ends, no device
// is stuck > 10 s while progress is expected, no page errors, the result is stored exactly once
// with every active participant.
import { assert, pause } from './party-play-harness.mjs';
import { matchSetup } from './party-play-scenarios-game.mjs';
import { playMatch } from './party-play-games.mjs';

export const chaosScenario = {
  id: 'CHAOS', title: 'Chaos: delay 0–800 ms, 5 % loss, random reloads', timeoutMs: 480000,
  allowErrors: [/Failed to fetch/],
  async run(ctx) {
    const game = ['this-or-that', 'fake-or-fact', 'flaschendrehen'][Math.floor(Math.random() * 3)]; ctx.evidence.game = game;
    const m = await matchSetup(ctx, { game, guests: ['Max'], phones: ['Lena', 'Tom', 'Uwe'] });
    const startIds = (await m.host.snapshot()).room.participantIds; let reloads = 0, lastReload = Date.now();
    const res = await playMatch(m.h, m.host, game, m.map, { budgetMs: 300000, onTick: async () => {
      if (Date.now() - lastReload < 12000 || Math.random() > 0.3) return;
      const victim = m.phones[Math.floor(Math.random() * m.phones.length)]; lastReload = Date.now(); reloads++;
      await victim.reload({ route: '/party/controllers' }).catch(() => {}); // app restart, not a re-scan (that is B07b)
    } });
    ctx.evidence.res = res; ctx.evidence.reloads = reloads; await m.h.shotAll('chaos-end');
    assert(res.finished, `match did not finish under chaos: ${JSON.stringify(res)}`);
    assert(!res.stalls, `${res.stalls} stalls > 10 s`);
    const results = (await m.host.party()).results; assert(results.length === 1, `${results.length} results stored`);
    const keys = Object.keys(results[0].scores).sort(); assert(JSON.stringify(keys) === JSON.stringify([...startIds].sort()), 'result roster differs from participants (score loss)');
    for (const c of [m.host, ...m.phones]) { c.net = {}; await c.until(async x => (await x.route()).startsWith('/party'), 'device stuck after match', 20000); }
    await pause(200);
  },
};
