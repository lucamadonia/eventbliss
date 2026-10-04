// Game drivers for Party-Play scenarios. Specific drivers for the reference games
// (this-or-that = sequential voting, fake-or-fact = turns, flaschendrehen = turns with a
// spinner, hochstapler = secret roles via test ids); everything else uses the generic
// driveGame() from party-play-flows.mjs. Guest handovers on the host phone are advanced
// for every game by advanceHandover().
import { pause } from './party-play-harness.mjs';
import { driveGame } from './party-play-flows.mjs';

const clickRe = (page, re) => page.evaluate(re => { const b = [...document.querySelectorAll('button')].find(b => !b.disabled && b.getBoundingClientRect().height && new RegExp(re, 'i').test(b.innerText.trim())); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return !!b; }, re).catch(() => false);
const clickId = (page, prefix) => page.evaluate(p => { const b = [...document.querySelectorAll(`[data-testid^="${p}"]`)].find(b => !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.getBoundingClientRect().height); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } return !!b; }, prefix).catch(() => false);

/**
 * One handover step on the host phone (HandoverScreen): pass → confirm, cover → tap, return → next.
 * Respects the 400 ms input guard and press-and-hold (data-hold-ms) of secret games.
 * Returns {step, playerId} of the screen it acted on, or null.
 */
export async function advanceHandover(host, before) {
  if (!await host.exists('handover-screen')) return null;
  const info = { step: await host.attr('handover-screen', 'data-step'), playerId: await host.attr('handover-screen', 'data-player-id') };
  await before?.(info); // assertions run while the covered screen is still up
  for (const id of ['handover-cover', 'handover-confirm', 'handover-next']) {
    if (!await host.exists(id)) continue;
    const holdMs = Number(await host.attr(id, 'data-hold-ms') ?? 0);
    if (holdMs) await host.hold(id, holdMs + 100); else { await pause(450); await host.click(id).catch(() => {}); }
    return { ...info, action: id };
  }
  return info;
}

/** Host-side setup screen: minimum rounds, then "Start game". Returns false if no setup screen appeared. */
export async function hostSetup(host, game, timeout = 20000, { rounds = 'min', mode } = {}) {
  if (game === 'flaschendrehen') {
    await host.clickText('^(questions only|nur fragen)', 8000);
    await host.clickText('^(prepare|runde vorbereiten)', 8000);
  }
  // Generic labels plus the game's own translated start label (e.g. closeenough "Losraten").
  const own = await host.page.evaluate(id => { const k = `games.${id.replace(/-/g, '')}.start`; const v = window.qaT?.(k); return v && v !== k ? v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null; }, game).catch(() => null);
  const startRe = `^(start game|start|los geht|spiel starten${own ? `|${own}` : ''})`;
  const ok = await host.page.waitForFunction(re => [...document.querySelectorAll('button')].some(b => new RegExp(re, 'i').test(b.innerText.trim()) && !b.disabled) || document.querySelector('input[type=range]'), { timeout, polling: 200 }, startRe).then(() => true, () => false);
  if (!ok) return false;
  if (mode) await host.clickText(`^${mode}`, 5000); // game mode tile, e.g. this-or-that "Speed" (F12)
  // Who Am I defaults to twenty questions per seat; five keeps the complete
  // four-player result inside the guest-run budget while exercising every turn.
  if (game === 'wer-bin-ich') await host.page.select('select', '5');
  const ranges = await host.page.$$('input[type=range]');
  // Rounds slider is the last range: Home = shortest match, End = longest (kick tests need time).
  if (ranges.length) { await ranges.at(-1).focus(); await host.page.keyboard.press(rounds === 'max' ? 'End' : 'Home'); }
  if (game === 'fake-or-fact' && ranges.length > 1) { await ranges[0].focus(); await host.page.keyboard.press('End'); }
  await host.clickText(startRe, 8000);
  return true;
}

const stateEvent = game => game === 'flaschendrehen' ? 'bottlespin-state' : 'game-state';
const SPECIFIC = ['this-or-that', 'fake-or-fact', 'flaschendrehen', 'hochstapler', 'wer-bin-ich'];

/** Wer bin ich: finish the covered assignment chain, then make one guess per seat. */
async function whoamiStep(host, all) {
  let acted = 0;
  if (await clickId(host.page, 'whoami-assign-seen')) acted++;
  if (await clickId(host.page, 'whoami-assign-start')) acted++;
  for (const d of all) {
    if (await clickId(d.page, 'whoami-guess-now')) acted++;
    const filled = await d.page.evaluate(() => {
      const input = document.querySelector('[data-testid="whoami-guess-input"]');
      if (!input || input.disabled || !input.getBoundingClientRect().height) return false;
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
      setter?.call(input, 'Test'); input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }).catch(() => false);
    if (filled && await clickId(d.page, 'whoami-guess-submit')) acted++;
  }
  if (await clickId(host.page, 'whoami-result-next')) acted++;
  return acted;
}

/** hochstapler (secret roles): one pass over every device using the impostor-* test ids. */
async function hochstaplerStep(host, all) {
  let acted = 0;
  for (const d of all) {
    if (await clickId(d.page, 'impostor-role-card')) { acted++; await pause(300); }
    if (await clickId(d.page, 'impostor-ready')) acted++;
    if (await clickId(d.page, 'impostor-vote-')) acted++;
    if (await d.exists('impostor-bonus-submit')) { await d.page.evaluate(() => { const i = document.querySelector('input[type=text], input:not([type]), textarea'); if (i) { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(i), 'value').set; set.call(i, 'Apfel'); i.dispatchEvent(new Event('input', { bubbles: true })); } }); if (await clickId(d.page, 'impostor-bonus-submit')) acted++; }
  }
  if (await clickId(host.page, 'impostor-to-voting')) acted++;
  if (await clickId(host.page, 'impostor-proceed')) acted++;
  return acted;
}

/**
 * Plays one match to its result. `devices` maps player_id -> client (guests map to the host client).
 * onTick(state|null) lets scenarios inject actions (kick, disconnect) mid-game; return 'stop' to end early.
 * onHandover(info) runs for every handover screen on the host phone, before it is advanced.
 */
export async function playMatch(h, host, game, devices, { before, budgetMs = 120000, onTick, onHandover, isDone } = {}) {
  if (!isDone) before ??= (await host.party()).results.length;
  const observer = [...devices.values()].find(d => d !== host) ?? host;
  const all = () => [...new Set([host, ...devices.values()])].filter(d => !d.page.isClosed());
  const handover = () => advanceHandover(host, onHandover);
  if (!SPECIFIC.includes(game)) {
    return driveGame(all(), host, { budgetMs, before, isDone, tick: async () => { await handover(); return onTick?.(null); } });
  }
  const end = Date.now() + budgetMs; let actions = 0; const seen = new Set();
  while (Date.now() < end) {
    if (isDone) { const d = await isDone().catch(() => null); if (d === 'finished') return { finished: true, actions }; if (d === 'lobby') return { finished: false, returnedToLobby: true, actions }; }
    else { const data = await host.party(); if (data.results.length > before) return { finished: true, actions }; if (data.party.status === 'lobby') return { finished: false, returnedToLobby: true, actions }; }
    if (await handover()) { actions++; continue; }
    if (game === 'hochstapler') {
      if (onTick && await onTick(null) === 'stop') return { finished: false, stopped: true, actions };
      actions += await hochstaplerStep(host, all()); await pause(400); continue;
    }
    if (game === 'wer-bin-ich') {
      if (onTick && await onTick(null) === 'stop') return { finished: false, stopped: true, actions };
      actions += await whoamiStep(host, all()); await pause(350); continue;
    }
    const s = await observer.gameState(stateEvent(game)) ?? await host.gameState(stateEvent(game));
    if (!s) { await clickRe(host.page, '^(start game|start|spiel starten)'); await pause(200); continue; }
    if (onTick && await onTick(s) === 'stop') return { finished: false, stopped: true, actions };
    seen.add(s.phase);
    const current = (idx) => devices.get(s.players?.[idx]?.id);
    if (game === 'fake-or-fact') {
      if (s.phase === 'statement') { const c = current(s.currentPlayerIdx); if (c && await clickRe(c.page, '^true$')) actions++; }
      else if (s.phase === 'reveal') await clickRe(host.page, '^continue');
    } else if (game === 'this-or-that') {
      if (s.phase === 'voting') { for (const c of all()) if (await clickRe(c.page, '^A\\b')) actions++; }
      else if (s.phase === 'reveal') await clickRe(host.page, '^(next|game over)');
    } else {
      if (s.phase === 'spinning' && !s.isSpinning) await clickRe(host.page, '^(spin|drehen)');
      else if (s.phase === 'card') { const c = current(s.selectedIdx) ?? host; if (await clickRe(c.page, '^(accept|annehmen|done|erledigt)')) actions++; }
      else if (s.phase === 'vote') { for (const c of all()) if (await clickRe(c.page, '^(yes|ja|done|geschafft|👍)')) actions++; }
    }
    await pause(250);
  }
  return { finished: false, timedOut: true, actions, phases: [...seen] };
}

/** player_id -> client map for the current room (guests and the host's own seat map to the host). */
export async function deviceMap(host, phones) {
  const data = await host.party(); const map = new Map();
  for (const m of data.members) {
    if (m.controlled_by || m.user_id === host.account) map.set(m.player_id, host);
    else { const p = phones.find(p => p.account === m.user_id); if (p) map.set(m.player_id, p); }
  }
  return map;
}
