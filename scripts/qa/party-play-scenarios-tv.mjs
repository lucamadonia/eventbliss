// Scenarios G (TV), T (timing), H (platform/network), I (compatibility), X (extras).
import { assert, need, needSource, pause, hasTestId, sceneSkew, sourceText } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, ready, startGame, connectTv } from './party-play-flows.mjs';
import { matchSetup } from './party-play-scenarios-game.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

// Scenes are traced only by screens that render through useScene(); the hook definition alone does not count.
const hasSceneTrace = () => (sourceText().match(/\buseScene\s*[<(]/g) ?? []).length > 1;
const ids = async (c, prefix) => (await c.attrs(prefix, 'data-seat')).map(x => x.id).sort();

/**
 * Starts a game on host + phones (+TV) and measures per-scene skew. Uses __partyPlayTrace scene
 * entries when the app emits them; otherwise falls back to the moment each phone routed into the
 * game (coordinator) — that fallback measures today's "switch when the message arrives" behaviour.
 */
async function measureSkew(ctx, { phones = 5, tweak = () => {}, openOpts = () => ({}) } = {}) {
  const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host); const devs = [];
  for (let i = 0; i < phones; i++) devs.push(await joinPhone(h, ctx, host, code, `P${i + 1}`, openOpts(i)));
  await tweak(devs); for (const d of devs) await ready(d);
  await startGame(host, ['this-or-that']); await hostSetup(host, 'this-or-that');
  await playMatch(h, host, 'this-or-that', await deviceMap(host, devs), { budgetMs: 25000 });
  const all = [host, ...devs, tv];
  if (hasSceneTrace()) {
    const traces = await Promise.all(all.map(async c => ({ device: c.name, entries: await c.trace() })));
    const skews = sceneSkew(traces); ctx.evidence.source = 'scene-trace'; ctx.evidence.scenes = skews.slice(0, 20);
    assert(skews.length, 'scene trace present in source but no scene was shared by ≥ 2 devices');
    return { skews, devs, all };
  }
  ctx.notes.push('FALLBACK: no scene trace in app yet; skew = time each phone routed into /games/');
  const at = await Promise.all([host, ...devs].map(c => c.page.evaluate(() => window.__qaRouteLog.find(r => r.route.startsWith('/games/'))?.at)));
  const valid = at.filter(Boolean); const skewMs = Math.round(Math.max(...valid) - Math.min(...valid));
  ctx.evidence.source = 'route-fallback'; ctx.evidence.routeSkewMs = skewMs; ctx.evidence.devices = valid.length;
  return { skews: [{ sceneId: 'game-start(route)', devices: valid.length, skewMs, late: [] }], devs, all };
}

export const tvScenarios = [
  { id: 'G01', title: 'Pair TV by QR ≤ 10 s, phone language', async run() { need('tv-pair-qr'); } },
  { id: 'G02', title: 'Pairing code expired → TV renews; old link → "neu scannen"', async run() { need('tv-pair-qr', 'tv-pair-expired'); } },
  { id: 'G03', title: 'TV reloads → reconnects by itself', async run(ctx) {
    need('tv-lobby');
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host); await joinPhone(h, ctx, host, code, 'Lena');
    await tv.until(async c => /Lena/.test(await c.text()), 'TV never lists Lena'); const before = await ids(tv, 'tv-lobby-player-');
    const t0 = Date.now(); await tv.reload(); await tv.wait('tv-lobby', { timeout: 10000 });
    await tv.until(async c => JSON.stringify(await ids(c, 'tv-lobby-player-')) === JSON.stringify(before), 'TV roster differs after reload', 10000);
    ctx.evidence.reconnectMs = Date.now() - t0; await h.shotAll('tv-reloaded');
  } },
  { id: 'G04', title: 'Two TVs → identical display, in sync', async run(ctx) {
    need('tv-lobby');
    const { h } = ctx; const { host, code } = await createParty(h); const tv1 = await connectTv(h, host, { name: 'TV1' }); const tv2 = await h.tv(await host.page.evaluate(() => controllerQA.tvCode()), { name: 'TV2' });
    await addGuest(ctx, host, code, 'Max'); await joinPhone(h, ctx, host, code, 'Lena');
    for (const tv of [tv1, tv2]) await tv.until(async c => /Max/.test(await c.text()) && /Lena/.test(await c.text()), `${tv.name} incomplete`);
    assert(JSON.stringify(await ids(tv1, 'tv-lobby-player-')) === JSON.stringify(await ids(tv2, 'tv-lobby-player-')), 'TVs show different rosters');
    // Both TVs animate in independently; they must converge on identical text within 3 s.
    await tv1.until(async () => await tv1.textOf('tv-lobby') === await tv2.textOf('tv-lobby'), 'TV texts still differ after 3 s', 3000)
      .catch(async e => { ctx.evidence.tv1 = await tv1.textOf('tv-lobby'); ctx.evidence.tv2 = await tv2.textOf('tv-lobby'); throw e; });
    await h.shotAll('two-tvs');
  } },
  { id: 'G05', title: '"Startbild" called during the game → current state', async run(ctx) {
    // "Startbild" = TVRemote view 'intro' ("Welcome screen"), reached through the TV pill during the game.
    const m = await matchSetup(ctx, { game: 'this-or-that', guests: ['Max'], phones: ['Lena'] });
    if (!await m.host.clickText('welcome|startbild|willkommen', 1500)) {
      await m.host.page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-haspopup]')].find(b => b.getBoundingClientRect().height && /tv|fernseh|📺/i.test(b.innerText + (b.getAttribute('aria-label') ?? ''))); b?.click(); });
      await pause(600);
    }
    assert(await m.host.clickText('welcome|startbild|willkommen', 4000), 'no Startbild / Welcome screen button in the TV remote');
    await m.tv.wait('tv-lobby', { timeout: 5000 }); assert(/Max/.test(await m.tv.text()) && /Lena/.test(await m.tv.text()), 'Startbild not current'); await m.h.shotAll('startbild');
  } },
  { id: 'G06', title: 'Secret info never on the TV (fake-or-fact answer, hochstapler role)', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'fake-or-fact', phones: ['Lena', 'Tom'] });
    await playMatch(m.h, m.host, 'fake-or-fact', m.map, { budgetMs: 60000 });
    const msgs = await m.tv.tvMessages(); const statements = msgs.filter(x => x.game === 'fakeorfact' && x.phase === 'statement');
    assert(statements.length, 'TV received no fake-or-fact statement'); assert(statements.every(x => x.correctAnswer === -1 || x.correctAnswer === undefined), 'TV got the answer before reveal');
    assert(msgs.every(x => !x.internalScoresPresent), 'TV received internal score map');
    const hk = await matchSetup(ctx, { game: 'hochstapler', phones: ['A', 'B', 'C', 'D'] }); await pause(5000);
    const keys = new Set((await hk.tv.tvMessages()).flatMap(x => x.keys ?? [])); ctx.evidence.hochstaplerKeys = [...keys];
    const leaked = [...keys].filter(k => /impostor|secret|word|role/i.test(k)); assert(!leaked.length, `TV payload carries secret keys: ${leaked}`);
    await hk.h.shotAll('hochstapler-tv');
  } },
  { id: 'T-1', title: 'Scene change 6 devices + TV → skew ≤ 250 ms', timeoutMs: 400000, async run(ctx) {
    const { skews } = await measureSkew(ctx); const worst = Math.max(...skews.map(s => s.skewMs)); ctx.evidence.worstMs = worst;
    assert(worst <= 250, `scene skew ${worst} ms > 250 (${ctx.evidence.source})`);
  } },
  { id: 'T-2', title: 'One device with 800 ms latency → jumps in, ≤ 500 ms skew', timeoutMs: 400000, async run(ctx) {
    const { skews, devs } = await measureSkew(ctx, { phones: 3, tweak: d => { d[0].net.delay = [800, 800]; } });
    const worst = Math.max(...skews.map(s => s.skewMs)); ctx.evidence.worstMs = worst;
    if (ctx.evidence.source === 'scene-trace') assert(skews.some(s => s.late.includes(devs[0].name)), 'slow device never marked late (no fast-forward)');
    assert(worst <= 500, `skew with 800 ms latency ${worst} ms > 500`);
  } },
  { id: 'T-3', title: 'Device clock 5 min wrong → server-time sync compensates', timeoutMs: 400000, async run(ctx) {
    if (!hasSceneTrace()) needSource(/__partyPlayTrace[\s\S]{0,400}scene/, 'scene trace (T-3 needs startsAt-based switching)');
    const { skews, devs } = await measureSkew(ctx, { phones: 3, openOpts: i => (i === 0 ? { clockSkewMs: 300000 } : {}) });
    const worst = Math.max(...skews.map(s => s.skewMs)); ctx.evidence.worstMs = worst;
    const offs = (await devs[0].trace()).filter(e => e.kind === 'clock-sync').map(e => e.offsetMs); ctx.evidence.skewedOffsets = offs.slice(-3);
    assert(offs.some(o => Math.abs(o + 300000) < 2000), 'skewed device never estimated a −5 min offset');
    assert(worst <= 250, `skew ${worst} ms with a wrong clock`);
  } },
  { id: 'T-4', title: 'Countdown T05 → all devices show the same number', timeoutMs: 300000, async run(ctx) {
    need('scene-countdown'); needSource(/<SceneCountdown\b/, 'SceneCountdown mounted on phones');
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host); const devs = [];
    for (const n of ['A', 'B', 'C']) devs.push(await joinPhone(h, ctx, host, code, n)); for (const d of devs) await ready(d);
    const watch = [host, tv, ...devs];
    // Each device records (rAF) the wall time at which its countdown digit changes; digits must flip together.
    for (const c of watch) await c.page.evaluate(() => { window.__qaCountdown = []; let last = null; const tick = () => { const n = document.querySelector('[data-testid="scene-countdown"], [data-testid="tv-scene-countdown"]'); const v = n?.getAttribute('data-value') ?? null; if (v !== last && v !== null) window.__qaCountdown.push({ v, at: performance.timeOrigin + performance.now() }); last = v; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await startGame(host, ['this-or-that']); await pause(1500);
    const logs = await Promise.all(watch.map(c => c.page.evaluate(() => window.__qaCountdown)));
    const flips = {}; logs.forEach((log, i) => log.forEach(({ v, at }) => { (flips[v] ??= []).push({ device: watch[i].name, at }); }));
    const skew = Object.fromEntries(Object.entries(flips).filter(([, l]) => l.length >= 2).map(([v, l]) => [v, Math.round(Math.max(...l.map(x => x.at)) - Math.min(...l.map(x => x.at)))]));
    ctx.evidence = { devicesWithCountdown: logs.filter(l => l.length).length, digits: Object.fromEntries(Object.entries(flips).map(([v, l]) => [v, l.map(x => x.device)])), skewMsPerDigit: skew };
    assert(Object.keys(skew).length >= 2, 'countdown not visible on ≥ 2 devices');
    const worst = Math.max(...Object.values(skew)); assert(worst <= 250, `countdown digits flip up to ${worst} ms apart (target ≤ 250 ms)`);
  } },
  { id: 'H03', title: '800 ms latency + 5 % loss → playable, no ghost states', timeoutMs: 420000, async run(ctx) {
    ctx.h.chaos = null; const m = await matchSetup(ctx, { game: 'this-or-that', guests: ['Max'], phones: ['Lena', 'Tom'] });
    for (const c of [m.host, ...m.phones, m.tv]) c.net = { delay: [0, 800], drop: 0.05 };
    const res = await playMatch(m.h, m.host, 'this-or-that', m.map, { budgetMs: 240000 }); ctx.evidence.res = res;
    assert(res.finished, `match not finished under chaos: ${JSON.stringify(res)}`);
    for (const c of [m.host, ...m.phones]) { c.net = {}; await c.until(async x => (await x.route()).startsWith('/party'), 'device stuck after match', 15000); }
  } },
  { id: 'H03L', title: '800 ms latency only (no loss) → match completes', timeoutMs: 420000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'this-or-that', guests: ['Max'], phones: ['Lena', 'Tom'] });
    for (const c of [m.host, ...m.phones, m.tv]) c.net = { delay: [0, 800] };
    const res = await playMatch(m.h, m.host, 'this-or-that', m.map, { budgetMs: 240000 }); ctx.evidence.res = res;
    assert(res.finished, `match not finished with latency alone: ${JSON.stringify(res)}`);
  } },
  { id: 'H04', title: 'Deep link during a game → asks instead of leaving silently', async run(ctx) {
    need('switch-party-prompt');
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena'] }); const other = await createParty(ctx.h, { name: 'Other' });
    await m.phones[0].page.evaluate(code => controllerQA.navigate(`/party/join/${code}`), other.code);
    await m.phones[0].wait('switch-party-prompt'); assert((await m.participants()).includes(m.ids.Lena), 'Lena left the running game silently'); await m.h.shotAll('deeplink-prompt');
  } },
  { id: 'H05', title: 'All new Party-Play texts translated in 10 languages (static key check)', async run(ctx) {
    const fs = await import('node:fs'); const src = sourceText();
    const keys = [...new Set([...src.matchAll(/\bt\(\s*['"]((?:partyPlay|tvLobby)\.[\w.]+)['"]/g)].map(m => m[1]))];
    assert(keys.length, 'no partyPlay/tvLobby keys found');
    const missing = {};
    for (const file of fs.readdirSync('src/i18n/locales').filter(f => f.endsWith('.json'))) {
      const json = JSON.parse(fs.readFileSync(`src/i18n/locales/${file}`, 'utf8'));
      const gaps = keys.filter(k => k.split('.').reduce((o, part) => (o && typeof o === 'object' ? o[part] : undefined), json) === undefined);
      if (gaps.length) missing[file] = gaps.length;
    }
    ctx.evidence = { keys: keys.length, missingPerLocale: missing };
    assert(!Object.keys(missing).length, `${keys.length} keys; missing per locale: ${JSON.stringify(missing)}`);
  } },
  { id: 'I01', title: 'Local party after update keeps working (smoke)', async run(ctx) {
    const c = await ctx.h.open('Local', { route: '/party' }); await pause(3000);
    assert(!c.errors.length, `local party screen errors: ${c.errors[0]}`); assert((await c.text()).length > 40, 'local party screen empty'); await ctx.h.shotAll('local');
    ctx.notes.push('smoke only: migration local→server (10.1) is phase 6');
  } },
  { id: 'I02', title: 'Mixed party raises min_client; current client not blocked', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max');
    const r = await host.request('read', code); ctx.evidence.minClient = r.data.party.min_client; assert(r.data.party.min_client >= 2, 'add_guest did not raise min_client');
    const lena = await joinPhone(h, ctx, host, code, 'Lena', { choice: 'new' }); assert(!await lena.exists('update-required'), 'current client blocked by min_client');
  } },
  { id: 'X01', title: 'Reactions in waiting phases → emoji flies over TV, max 1/s', async run(ctx) {
    need('reaction-bar', 'tv-reaction');
    const m = await matchSetup(ctx, { game: 'fake-or-fact', phones: ['Lena', 'Tom'] }); await m.phones[1].wait('reaction-bar');
    for (let i = 0; i < 5; i++) await m.phones[1].page.click('[data-testid="reaction-bar"] button');
    await m.tv.wait('tv-reaction', { timeout: 3000 }); await pause(1200);
    const count = await m.tv.page.evaluate(() => window.__qaSeenLog.filter(e => e.id === 'tv-reaction' && e.shown).length); ctx.evidence.reactionsShown = count;
    assert(count <= 2, `${count} reactions within ~1 s from one player (limit 1/s)`);
  } },
];
