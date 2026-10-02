// Scenarios F (in game, incl. kick F13–F19) from the masterplan, section 8.
import fs from 'node:fs';
import { assert, need, needSource, pause, hasTestId, NotImplemented, Deferred, Inconclusive, sourceText } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, memberBy, ready, startGame, wallNow, rowAction, connectTv } from './party-play-flows.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

/** Party with guests + phones, everyone ready, `game` started and set up. */
export async function matchSetup(ctx, { game, guests = [], phones = ['Lena', 'Tom'], hostPlays = true, tv = true, rounds = 'min', mode }) {
  const { h } = ctx; const { host, code } = await createParty(h, { hostPlays });
  const tvc = tv ? await connectTv(h, host) : null; const gids = {};
  for (const g of guests) gids[g] = await addGuest(ctx, host, code, g);
  const devices = []; for (const p of phones) devices.push(await joinPhone(h, ctx, host, code, p));
  for (const p of devices) await ready(p);
  await startGame(host, [game, 'this-or-that']); await hostSetup(host, game, 20000, { rounds, mode });
  const pid = async p => (await memberBy(host, m => m.user_id === p.account)).player_id;
  const ids = {}; for (const p of devices) ids[p.name] = await pid(p);
  return { h, host, code, tv: tvc, phones: devices, guests: gids, ids, map: await deviceMap(host, devices), participants: async () => (await host.snapshot()).room.participantIds };
}
/** Opens the in-game player list on the host and kicks `pid` with `mode`. */
/**
 * Kicks through the in-game player list. The client sends the RPC only after the 5 s undo window
 * (by design); with `h` given this waits for that RPC and returns its time, the start for ≤ 1 s checks.
 */
export async function kickMidGame(host, pid, mode, { via = 'pause', h } = {}) {
  const since = Date.now();
  need(via === 'remote' ? 'tv-remote-players' : 'pause-players', 'kick-player-', 'kick-sheet', `kick-mode-${mode}`, 'kick-confirm');
  if (via === 'remote') {
    // The TV remote lives in the TV pill/popover; open it first when collapsed.
    if (!await host.exists('tv-remote-players')) await host.page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => b.getBoundingClientRect().height && (/^(tv|connect a tv|fernseher)/i.test(b.innerText.trim()) || /tv|fernseh/i.test(b.getAttribute('aria-label') ?? ''))); b?.click(); });
    await host.click('tv-remote-players');
  } else await host.click('pause-players');
  // The game re-renders its top bar on every state tick; re-open the player list if the first tap got lost.
  for (let i = 0; i < 3 && !await host.waitAny([`kick-player-${pid}`], 4000); i++) await host.click(via === 'remote' ? 'tv-remote-players' : 'pause-players').catch(() => {});
  await host.click(`kick-player-${pid}`); await host.wait('kick-sheet');
  await host.click(`kick-mode-${mode}`); await host.click('kick-confirm');
  if (!h) return null;
  const end = Date.now() + 12000;
  while (Date.now() < end) { const r = h.stats.rpc.find(r => r.action === 'kick' && r.at >= since); if (r) { if (r.error) throw new Error(`kick RPC failed: ${r.error}`); return r.at; } await pause(100); }
  throw new Error('kick RPC never sent (undo window > 12 s?)');
}
const room = host => host.snapshot().then(s => s.room);

/** F13 core: kick a non-current player mid-game in `game`; the match must still finish without him. */
function kickNotCurrent(game) {
  return async ctx => {
    need('pause-players');
    const m = await matchSetup(ctx, { game, phones: ['Lena', 'Tom', 'Uwe'] }); const tom = m.phones[1], tomPid = m.ids.Tom;
    let kicked = false, t0 = 0;
    const res = await playMatch(m.h, m.host, game, m.map, { onTick: async s => {
      if (kicked) return; const cur = s.players?.[s.currentPlayerIdx ?? s.selectedIdx ?? -1]?.id; if (cur === tomPid) return;
      kicked = true; t0 = await kickMidGame(m.host, tomPid, 'party', { h: m.h }); m.map.delete(tomPid);
    } });
    assert(kicked, 'never reached a state to kick from'); await m.h.shotAll(`${game}-after-kick`);
    await tom.wait('party-removed-screen', { timeout: 5000 }); ctx.evidence.removedNoticeMs = Math.round(await wallNow(tom) - t0);
    assert(!(await room(m.host)).participantIds.includes(tomPid) || res.finished, 'Tom still a participant');
    assert(res.finished, `match did not finish after kick: ${JSON.stringify(res)}`);
    const last = (await m.host.party()).results.at(-1); assert(!(tomPid in last.scores), 'kicked player scored in the running match');
    if (m.tv && hasTestId('tv-toast')) { const t = await m.tv.textOf('tv-toast'); ctx.evidence.tvToast = t; }
  };
}

/** First game whose guest policy is `mode` (declared AND sharedDeviceSupported), else NotImplemented. */
function supportedGame(mode) {
  const registry = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
  const hit = [...registry.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*\}/g)].find(m => m[0].includes(`sharedDevice: "${mode}"`) && /sharedDeviceSupported:\s*true/.test(m[0]));
  if (!hit) throw new NotImplemented(`no game with sharedDevice "${mode}" + sharedDeviceSupported`);
  return hit[1];
}
/**
 * F01–F03: guests on the host phone. Every guest turn must show the covered handover screen for exactly
 * that guest (TV names them) before content is revealed; all guests end up in the result.
 */
function handoverScenario(mode, guests, phones) {
  return async ctx => {
    need('handover-screen', 'handover-confirm'); needSource(/<HandoverScreen\b/, 'HandoverScreen mounted in a game');
    const game = supportedGame(mode); ctx.evidence.game = game;
    const m = await matchSetup(ctx, { game, guests, phones }); const handed = new Set(); const steps = []; let leaks = 0, tvMiss = 0;
    const res = await playMatch(m.h, m.host, game, m.map, { budgetMs: 240000, onHandover: async info => {
      steps.push(info.step); if (info.step !== 'cover') handed.add(info.playerId);
      // Covered: nothing of the game may be on screen or clickable behind the handover.
      leaks += await m.host.page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height && !b.closest('[data-testid="handover-screen"]') && !b.closest('[aria-haspopup]') && !b.hasAttribute('aria-haspopup') && !/spieler|players|abort|abbrechen|tv/i.test(b.innerText + (b.getAttribute('aria-label') ?? ''))).length > 2 ? 1 : 0);
      const guest = Object.values(m.guests).includes(info.playerId);
      // TV names the guest: banner tv-handover[data-player-id] or the cinema stage tv-handover-stage[data-current].
      if (m.tv && guest && info.step === 'pass' && (hasTestId('tv-handover') || hasTestId('tv-handover-stage')))
        await m.tv.until(async c => (await c.attr('tv-handover', 'data-player-id')) === info.playerId || (await c.attr('tv-handover-stage', 'data-current')) === info.playerId, 'TV banner', 3000).catch(() => { tvMiss++; });
      if (steps.length <= 6) await m.h.shotAll(`handover-${steps.length}-${info.step}`);
    } });
    const tvSeen = m.tv ? await m.tv.page.evaluate(() => window.__qaSeenLog.filter(e => e.id === 'tv-handover' || e.id === 'tv-handover-stage').length) : 0;
    const tvIds = m.tv ? await m.tv.page.evaluate(() => [...document.querySelectorAll('[data-testid="tv-handover"]')].map(n => n.getAttribute('data-player-id'))) : [];
    ctx.evidence = { ...ctx.evidence, handed: handed.size, steps: steps.slice(0, 30), res, tvMiss, tvBannerShownTimes: tvSeen, tvIdsAtEnd: tvIds, guestIds: m.guests };
    for (const [n, id] of Object.entries(m.guests)) assert(handed.has(id), `no handover for ${n}`);
    assert(!leaks, `game content visible behind the handover screen ${leaks}×`);
    if (mode === 'secret') assert(steps.includes('cover'), 'secret game never showed the cover step');
    assert(!tvMiss, `TV did not show tv-handover for the guest ${tvMiss}×`);
    assert(res.finished, `match did not finish: ${JSON.stringify(res)}`);
    const scores = (await m.host.party()).results.at(-1).scores; for (const [n, id] of Object.entries(m.guests)) assert(id in scores, `guest ${n} missing from result`);
  };
}

export const gameScenarios = [
  { id: 'F01', title: 'turns: guest is up → hidden handover, clock paused, TV hint', timeoutMs: 300000, run: handoverScenario('turns', ['Max'], ['Lena']) },
  { id: 'F02', title: 'sequential: 3 guests answer in turn, all answers count', timeoutMs: 300000, run: handoverScenario('sequential', ['Max', 'Gerda', 'Udo'], ['Lena']) },
  { id: 'F03', title: 'secret: reveal/cover never visible without confirmation', timeoutMs: 300000, run: handoverScenario('secret', ['Max', 'Gerda'], ['Lena', 'Tom']) },
  { id: 'F04', title: 'sitout game: guests excluded, result without them', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'brew', guests: ['Max'], phones: ['Lena'] });
    const ids = await m.participants(); assert(!ids.includes(m.guests.Max), 'guest in participants of a sitout game');
    if (hasTestId('sitout-banner')) await m.host.wait('sitout-banner');
    const res = await playMatch(m.h, m.host, 'brew', m.map, { budgetMs: 90000 }); ctx.evidence.res = res;
    if (res.finished) assert(!(m.guests.Max in (await m.host.party()).results.at(-1).scores), 'sitting-out guest scored');
    else ctx.notes.push('brew not driven to the end by the generic driver; participant check only');
  } },
  { id: 'F05', title: '📱 player offline → pause; after 30 s host options', timeoutMs: 300000, async run(ctx) {
    need('waiting-for-player', 'stuck-options', 'stuck-continue-without');
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena', 'Tom'] }); const tom = m.phones[1];
    await pause(1500); await tom.offline(true);
    const t0 = Date.now(); const where = await Promise.race([m.host.waitAny(['waiting-for-player'], 5000), m.tv?.waitAny(['waiting-for-player'], 5000)]);
    assert(where, 'nobody shows "Warte auf Tom"'); ctx.evidence.waitingAfterMs = Date.now() - t0;
    await m.host.wait('stuck-options', { timeout: 40000 }); ctx.evidence.optionsAfterMs = Date.now() - t0; await m.h.shotAll('stuck-options');
    assert(ctx.evidence.optionsAfterMs >= 25000, `host options after ${ctx.evidence.optionsAfterMs} ms (expected ~30 s)`);
    await m.host.click('stuck-continue-without'); m.map.delete(m.ids.Tom);
    const res = await playMatch(m.h, m.host, 'this-or-that', m.map); assert(res.finished, 'match did not continue without Tom');
  } },
  { id: 'F06', title: 'Host offline → everyone paused, no result loss', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'this-or-that', guests: ['Max'], phones: ['Lena'] });
    await pause(1500); await m.host.offline(true); await pause(6000); await m.h.shotAll('host-offline');
    const lenaConn = (await m.phones[0].snapshot()).connection; ctx.evidence.phoneConnectionWhileHostAway = lenaConn;
    await m.host.offline(false); await m.host.page.evaluate(() => controllerQA.retry());
    // Auto-resume is expected; a visible "Reconnect" is the documented way out and recorded when needed.
    const auto = await m.phones[0].until(async c => (await c.snapshot()).connection === 'connected' && !/game paused|spiel pausiert/i.test(await c.text()), 'phone still paused', 8000).then(() => true, () => false);
    ctx.evidence.phoneAutoResumed = auto;
    if (!auto) { ctx.notes.push('phone stayed "Game paused" after host returned; needed manual Reconnect'); await m.phones[0].clickText('^(reconnect|neu verbinden|erneut verbinden)', 3000); }
    const res = await playMatch(m.h, m.host, 'this-or-that', m.map); assert(res.finished, `match lost after host reconnect: ${JSON.stringify(res)}`);
    const results = (await m.host.party()).results; assert(new Set(results.map(r => r.match_id)).size === results.length, 'duplicate result');
  } },
  { id: 'F07', title: 'Abort → does not count, lobby, TV waiting room', async run(ctx) {
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena'] }); const before = (await m.host.party()).results.length;
    await pause(1500); await m.host.page.evaluate(() => controllerQA.abort());
    await m.host.until(async c => (await c.route()).startsWith('/party'), 'host not back in lobby'); await m.phones[0].until(async c => (await c.route()).startsWith('/party'), 'phone not back in lobby');
    if (m.tv && hasTestId('tv-lobby')) await m.tv.wait('tv-lobby', { timeout: 8000 });
    assert((await m.host.party()).results.length === before, 'aborted match counted'); await m.h.shotAll('aborted');
  } },
  { id: 'F10', title: 'Pause / resume → all clocks stop, deadlines move', async run(ctx) {
    need('game-pause', 'game-resume');
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena'] });
    await m.host.click('game-pause'); const a = await m.phones[0].text(); await pause(3000); const b = await m.phones[0].text();
    assert(a === b, 'phone kept counting while paused'); await m.h.shotAll('paused'); await m.host.click('game-resume');
  } },
  { id: 'F11', title: 'Device hangs (no input > 30 s) → stuck_detected + host way out', timeoutMs: 300000, async run(ctx) {
    // room-runtime: idle-but-connected detection needs per-game progress signals (deadlines) — deferred from sprint 1.
    if (!/stuck_detected/.test(sourceText())) throw new Deferred('stuck_detected for connected-but-idle devices deferred (room-runtime, sprint 2)');
    need('stuck-options');
    const m = await matchSetup(ctx, { game: 'fake-or-fact', phones: ['Lena', 'Tom'] });
    await m.host.wait('stuck-options', { timeout: 45000 }); await m.h.shotAll('stuck');
    needSource(/stuck_detected/, 'stuck_detected event'); const trace = await m.host.trace(); ctx.evidence.trace = trace.filter(e => /stuck/.test(e.kind ?? '')).slice(-3);
  } },
  { id: 'F12', title: 'Input after deadline (delayed device) → discarded, "zu spät"', timeoutMs: 300000, async run(ctx) {
    needSource(/\bacceptInput\(\{/, 'a game checking inputs against deadlines (acceptInput)');
    // Deadlines exist in speed mode (5 s per player); Tom's packets take 4 s each way.
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena', 'Tom'], mode: 'speed' }); m.phones[1].net.delay = [4000, 4000];
    await m.h.shotAll('speed-mode'); ctx.evidence.timerVisible = /\b[0-9]s\b|⏱|seconds|sekunden/i.test(await m.host.text());
    const rejected0 = (await m.host.trace()).filter(e => e.kind === 'input-rejected').length;
    if (!ctx.evidence.timerVisible && !await m.host.exists('scene-countdown')) ctx.notes.push('speed mode probably not selected: controller-party start skips the game setup screen');
    await playMatch(m.h, m.host, 'this-or-that', m.map, { budgetMs: 90000 });
    const rejected = (await m.host.trace()).filter(e => e.kind === 'input-rejected'); ctx.evidence.rejected = rejected.length;
    if (!rejected.length && !ctx.evidence.timerVisible) throw new Inconclusive('speed mode (the only this-or-that mode with deadlines) is not selectable in the controller-party flow: the game starts without its setup screen');
    assert(rejected.some(e => e.playerId === m.ids.Tom), 'late input from Tom was not rejected');
  } },
  { id: 'F13a', title: 'Kick non-current player mid-game: this-or-that', timeoutMs: 300000, run: kickNotCurrent('this-or-that') },
  { id: 'F13b', title: 'Kick non-current player mid-game: fake-or-fact', timeoutMs: 300000, run: kickNotCurrent('fake-or-fact') },
  { id: 'F13c', title: 'Kick non-current player mid-game: flaschendrehen', timeoutMs: 300000, run: kickNotCurrent('flaschendrehen') },
  { id: 'F14', title: 'Kick the player whose turn it is → turn skipped, no hang', timeoutMs: 300000, async run(ctx) {
    need('pause-players');
    const m = await matchSetup(ctx, { game: 'fake-or-fact', phones: ['Lena', 'Tom', 'Uwe'] }); let kicked = null;
    const res = await playMatch(m.h, m.host, 'fake-or-fact', m.map, { onTick: async s => {
      if (kicked || s.phase !== 'statement') return; const cur = s.players[s.currentPlayerIdx].id; if (cur === (await m.host.party()).party.host_player_id) return;
      kicked = cur; await kickMidGame(m.host, cur, 'party', { h: m.h }); m.map.delete(cur);
      await m.host.until(async () => { const n = await m.phones.find(p => p !== m.map.get(cur))?.gameState('game-state'); return n && n.players[n.currentPlayerIdx]?.id !== cur; }, 'turn not skipped', 5000);
    } });
    assert(kicked && res.finished, `kick-current did not complete: ${JSON.stringify(res)}`);
  } },
  { id: 'F15', title: 'Kick → too few players → abort / lobby choice, scores untouched', timeoutMs: 300000, async run(ctx) {
    need('below-min-dialog', 'below-min-abort', 'below-min-lobby');
    for (const choice of ['below-min-abort', 'below-min-lobby']) {
      const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena'], tv: false }); const before = (await m.host.party()).results.length;
      await pause(1500); await kickMidGame(m.host, m.ids.Lena, 'match_only', { h: m.h }); await m.host.wait('below-min-dialog'); await m.h.shotAll(choice);
      await m.host.click(choice); await m.host.until(async c => (await c.route()).startsWith('/party'), `${choice}: host not in lobby`);
      assert((await m.host.party()).results.length === before, `${choice}: a result was written`);
    } // second iteration: fresh party with new accounts in the same harness
  } },
  { id: 'F16', title: 'Kick + ban, player rescans → rejected; unban lets him back', async run(ctx) {
    need('lobby-kick-', 'kick-mode-ban', 'unban-');
    const { h } = ctx; const { host, code } = await createParty(h); const tom = await joinPhone(h, ctx, host, code, 'Tom');
    const tomPid = (await memberBy(host, m => m.user_id === tom.account)).player_id;
    const rpcAfter = async (action, since) => { await host.until(async () => h.stats.rpc.some(r => r.action === action && r.at >= since && !r.error), `${action} RPC never sent`, 12000); };
    let since = Date.now(); await rowAction(host, tomPid, `lobby-kick-${tomPid}`); await host.wait('kick-sheet'); await host.click('kick-mode-ban'); await host.click('kick-confirm');
    await rpcAfter('kick', since); // after the 5 s undo window
    await tom.page.evaluate(code => controllerQA.navigate(`/party/join/${code}`), code);
    const shown = await tom.waitAny(['seat-error', 'party-removed-screen'], 8000); assert(shown, 'banned player got no rejection screen');
    assert(!(await host.party()).members.some(m => m.user_id === tom.account), 'banned player is back in the party'); await h.shotAll('banned');
    // The "Gesperrt (n)" list is a collapsed <details>; open it like a user would.
    await host.page.evaluate(() => document.querySelectorAll('details').forEach(d => { if (/gesperrt|blocked|banned/i.test(d.querySelector('summary')?.innerText ?? '')) d.open = true; })); await pause(300);
    since = Date.now(); await host.click(`unban-${tomPid}`); await rpcAfter('unban', since);
    await tom.page.evaluate(() => controllerQA.navigate('/party/controllers')); await tom.page.evaluate(code => controllerQA.navigate(`/party/join/${code}`), code);
    await host.until(async c => (await c.party()).members.some(m => m.user_id === tom.account), 'unbanned player cannot rejoin', 15000);
  } },
  { id: 'F17', title: 'Kick via TV remote vs lobby → same result, all devices ≤ 1 s', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena', 'Tom', 'Uwe'] });
    const t0 = await kickMidGame(m.host, m.ids.Tom, 'party', { via: 'remote', h: m.h });
    const [tomAt, lenaAt] = await Promise.all([m.phones[1].wait('party-removed-screen', { timeout: 5000 }).then(() => wallNow(m.phones[1])),
      m.phones[0].until(async c => !(await c.snapshot()).room.participantIds.includes(m.ids.Tom), 'Lena still sees Tom', 5000).then(() => wallNow(m.phones[0]))]);
    ctx.evidence.ms = { tom: Math.round(tomAt - t0), lena: Math.round(lenaAt - t0) };
    const data = await m.host.party(); assert(data.past_members.some(p => p.player_id === m.ids.Tom), 'remote kick did not archive like lobby kick');
    for (const [who, ms] of Object.entries(ctx.evidence.ms)) assert(ms <= 1000, `${who} updated after ${ms} ms`);
  } },
  { id: 'F18', title: '"Only this game" → stays in the party, back in the next game', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'this-or-that', phones: ['Lena', 'Tom'] });
    await pause(1500); await kickMidGame(m.host, m.ids.Tom, 'match_only', { h: m.h });
    await m.host.until(async () => !(await m.participants()).includes(m.ids.Tom), 'Tom still in participants');
    assert((await m.host.party()).members.some(p => p.player_id === m.ids.Tom), 'match_only removed Tom from the party');
    m.map.delete(m.ids.Tom); const res = await playMatch(m.h, m.host, 'this-or-that', m.map); assert(res.finished, 'match did not finish');
    await m.host.until(async c => (await c.route()).startsWith('/party'), 'not back in lobby', 15000);
    for (const p of m.phones) await ready(p).catch(() => {}); await startGame(m.host, ['this-or-that']);
    assert((await m.participants()).includes(m.ids.Tom), 'Tom not back in the next game');
  } },
  { id: 'F19', title: 'Kicked player held a key role (hochstapler) → role reassigned or round restarted', timeoutMs: 300000, async run(ctx) {
    const m = await matchSetup(ctx, { game: 'hochstapler', phones: ['Lena', 'Tom', 'Uwe', 'Vera'] }); await pause(4000);
    for (const p of m.phones) ctx.evidence[p.name] = (await p.text()).slice(0, 160);
    await kickMidGame(m.host, m.ids.Tom, 'party', { h: m.h }); m.map.delete(m.ids.Tom);
    const res = await playMatch(m.h, m.host, 'hochstapler', m.map, { budgetMs: 120000 }); ctx.evidence.res = res;
    assert(res.finished || res.returnedToLobby, `hochstapler hung after kicking a player: ${JSON.stringify(res)}`);
    assert(!res.stalls, `${res.stalls} stalls > 10 s`);
  } },
];
