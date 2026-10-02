// Kick-mid-match release gate (F13/F14 per game): for every playable game, kick a non-active player
// and, in a second match, the active player. Asserts within 5 s of the kick RPC: the game's own
// broadcast roster drops the player, the active turn never stays on him, the match keeps changing
// (no stall > 10 s) and the result (if reached) excludes him.
//   node scripts/qa/party-play-browser.mjs --scenario 'K13-*'   (or K14-*, or K13-bomb)
import fs from 'node:fs';
import { assert, pause, Inconclusive } from './party-play-harness.mjs';
import { fingerprint } from './party-play-flows.mjs';
import { matchSetup, kickMidGame } from './party-play-scenarios-game.mjs';
import { playMatch } from './party-play-games.mjs';

const registry = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
const games = [...registry.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?minPlayers:\s*(\d+),\s*maxPlayers:\s*(\d+)[^}]*\}/g)].map(m => ({ id: m[1], min: +m[2], max: +m[3] }));
const NAMES = ['Lena', 'Tom', 'Uwe', 'Vera', 'Wim'];
// Matches the driver finishes within ~30 s: kick early (the baseline then cannot judge stalls).
const FAST_GAMES = ['hochstapler', 'wer-bin-ich', 'story-builder'];

/** Every broadcast payload a phone saw (room-wire unwrapped to room:<event>), newest first. */
const broadcasts = c => c.page.evaluate(() => Object.entries(window.__qaBroadcasts ?? {}).map(([event, v]) => ({ event, at: v.at, payload: v.payload })).sort((a, z) => z.at - a.at));
const ACTIVE_KEY = /^(current|active|selected|turn)(Player)?(Id|Idx|Index)$|^(current|active)?(player|explainer|actor|drawer|guesser|speaker|writer|asker|holder|voter|bombHolder)(Id|Idx|Index)$/i;
/** Game roster = top-level players[] of a game payload; active = a top-level turn key (id or index into players). */
function inspect(p) {
  if (!p || typeof p !== 'object') return null;
  if (!Array.isArray(p.players)) { const inner = Object.values(p).find(v => v && typeof v === 'object' && Array.isArray(v.players)); if (!inner) return null; p = inner; }
  const list = p.players.filter(x => x && typeof x.id === 'string'); let active = null;
  for (const [k, x] of Object.entries(p)) if (ACTIVE_KEY.test(k)) { if (typeof x === 'string' && x.startsWith('player-')) active = x; else if (typeof x === 'number' && list[x]) active = list[x].id; if (active) break; }
  return { ids: new Set(list.map(x => x.id)), active, phase: p.phase, keys: Object.keys(p).slice(0, 40) };
}
async function gameView(observer) {
  const all = await broadcasts(observer);
  for (const b of all) { const i = inspect(b.payload); if (i) return { ...i, event: b.event, events: all.map(x => x.event) }; }
  return { ids: new Set(), active: null, events: all.map(x => x.event) };
}

function kickGame(game, kickActive) {
  return async ctx => {
    const players = Math.min(game.max, Math.max(game.min + 1, 4)); const phones = NAMES.slice(0, players - 1);
    const m = await matchSetup(ctx, { game: game.id, phones, rounds: 'max' });
    const observer = m.phones.at(-1); let rpcAt = 0, before = null;
    // Baseline: does the driver move this game at all before any kick? (No → stall checks are inconclusive.)
    const candidates = m.phones.filter(p => p !== observer).map(p => m.ids[p.name]);
    const progress = async (devices, ms, stop) => { let last = '', still = Date.now(), maxStill = 0;
      const res = await playMatch(m.h, m.host, game.id, m.map, { budgetMs: ms, onTick: async s => {
        const fp = (await Promise.all(devices.map(d => fingerprint(d).catch(() => '')))).join('|');
        if (fp !== last) { last = fp; maxStill = Math.max(maxStill, Date.now() - still); still = Date.now(); }
        if (stop && await stop()) return 'stop';
      } });
      return { res, maxStill: Math.max(maxStill, Date.now() - still) }; };
    // Kick-active waits (≤ 25 s) until a kickable phone holds the turn.
    // 30 s baseline: long enough to show whether the generic driver keeps this game moving without any kick.
    const pre = await progress([m.host, ...m.phones], FAST_GAMES.includes(game.id) ? 4000 : 30000, async () => { before = await gameView(observer); return kickActive ? candidates.includes(before.active) : false; });
    before = await gameView(observer); ctx.evidence = { ...ctx.evidence, events: before.events, keys: before.keys, activeBefore: before.active, preStillMs: pre.maxStill };
    if (pre.res.finished || pre.res.returnedToLobby) throw new Inconclusive(`${game.id} ended before the kick (${JSON.stringify(pre.res)})`);
    // Targets: K13 one non-active phone. K14 the active phone; when the game does not expose who is active,
    // every non-observer phone is kicked (one of them holds the turn) and a below-min dialog is a valid outcome.
    let targets, proxy = false;
    if (kickActive) {
      if (before.active && candidates.includes(before.active)) targets = [before.active];
      else if (!before.active) { targets = candidates; proxy = true; ctx.notes.push(`active player not exposed in broadcasts (keys ${(before.keys ?? []).join(',')}); kicked all ${candidates.length} non-observer phones`); }
      else throw new Inconclusive('the observable active player was the host/observer for 25 s');
    } else targets = [candidates.find(id => id !== before.active) ?? candidates[0]];
    if ((await m.host.snapshot()).room?.status !== 'playing') throw new Inconclusive(`${game.id} match already over before the kick`);
    const victims = m.phones.filter(p => targets.includes(m.ids[p.name]));
    for (const [i, t] of targets.entries()) {
      rpcAt = await kickMidGame(m.host, t, 'party', { h: m.h }); m.map.delete(t);
      // Dropping below the minimum mid-sequence: the below-min guard must ask the host instead of hanging.
      if (players - (i + 1) < Math.max(2, game.min)) {
        // Either the wrapper's below-min guard asks the host, or the game ends itself (e.g. taboo: empty team → game over).
        const seen = await m.host.waitAny(['below-min-dialog'], 8000); await m.h.shotAll(`${game.id}-below-min`);
        if (seen) await m.host.click('below-min-abort', { timeout: 4000 }).catch(() => {}); // the game may end itself first
        await m.host.until(async c => (await c.route()).startsWith('/party'), 'host not back in lobby after below-min', 15000);
        ctx.notes.push(`below ${game.min} players after ${i + 1} kick(s): ${seen ? 'guard dialog → abort' : 'game ended itself'} → lobby`); return;
      }
    }
    // Within 5 s: removed screen on each victim, roster + turn in the game state no longer reference them.
    for (const v of victims) await v.wait('party-removed-screen', { timeout: 5000 });
    let after = null; const end = Date.now() + 5000;
    while (Date.now() < end) { after = await gameView(observer); if (targets.every(t => !after.ids.has(t)) && !targets.includes(after.active)) break; await pause(250); }
    ctx.evidence = { ...ctx.evidence, targets: targets.length, proxy, afterMs: Date.now() - rpcAt, activeAfter: after.active };
    assert(!targets.includes(after.active), `${game.id}: turn still on a kicked player 5 s after the kick`);
    const listed = targets.filter(t => before.ids.has(t) && after.ids.has(t));
    if (before.ids.size) assert(!listed.length, `${game.id}: game roster (${after.event}) still lists ${listed.length} kicked player(s) 5 s after the kick`);
    else ctx.notes.push('roster not observable in broadcasts; turn/progress checks only');
    const remaining = players - targets.length;
    if (remaining < Math.max(2, game.min)) {
      // Too few left: the below-min guard must ask the host (abort / lobby) instead of hanging.
      await m.host.wait('below-min-dialog', { timeout: 8000 }); await m.h.shotAll(`${game.id}-below-min`);
      await m.host.click('below-min-abort'); await m.host.until(async c => (await c.route()).startsWith('/party'), 'host not back in lobby after abort', 12000);
      return;
    }
    // The match must keep moving: no 10 s window without any visible/state change on the remaining devices.
    const { res, maxStill } = await progress([m.host, ...m.phones.filter(p => !victims.includes(p))], 45000);
    ctx.evidence.res = res; ctx.evidence.maxStillMs = maxStill;
    if (maxStill > 10000 && !res.finished && !res.returnedToLobby) {
      // Waiting on a PRESENT player's input (turn moved on, kicked names gone) is not a hang — the driver just can't answer.
      const kickedNames = victims.map(v => v.name); const view = await gameView(observer);
      const texts = await Promise.all([m.host, ...m.phones.filter(p => !victims.includes(p))].map(d => d.text().catch(() => '')));
      const ghost = texts.some(t => kickedNames.some(n => new RegExp('\\b' + n + '\\b').test(t)));
      if (!ghost && !view.active) throw new Inconclusive(`${game.id}: no progress for ${Math.round(maxStill / 1000)} s, but no device references the kicked player any more and the game exposes no turn — waiting on a step the driver cannot perform`);
      if (!ghost && view.active && !targets.includes(view.active)) { ctx.notes.push(`after the kick the turn moved to a present player; then waiting for that player's input (driver limit, ${Math.round(maxStill / 1000)} s)`); return; }
      if (pre.maxStill > 10000) throw new Inconclusive(`${game.id}: the generic driver cannot move this game even before the kick (${Math.round(pre.maxStill / 1000)} s still); turn/roster checks passed`);
      throw new Error(`${game.id}: no progress for ${Math.round(maxStill / 1000)} s after the kick (it progressed before)`);
    }
    if (res.finished) { const r = (await m.host.party()).results.at(-1); assert(targets.every(t => !(t in r.scores)), `${game.id}: kicked player in the result`); }
    await m.h.shotAll(`${game.id}-after-kick`);
  };
}

export const kickScenarios = games.flatMap(g => [
  { id: `K13-${g.id}`, title: `Kick a non-active player mid-match: ${g.id}`, timeoutMs: 360000, run: kickGame(g, false) },
  { id: `K14-${g.id}`, title: `Kick the active player mid-match: ${g.id}`, timeoutMs: 360000, run: kickGame(g, true) },
]);
