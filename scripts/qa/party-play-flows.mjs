// Reusable Party-Play flows on top of party-play-harness.mjs. Each flow prefers the
// real UI (data-testid contract) and falls back to the server action only for
// setup steps that are not under test, which is recorded in `ctx.notes`.
import { assert, hasTestId, pause } from './party-play-harness.mjs';

export const members = async host => (await host.party())?.members ?? [];
export const memberBy = async (host, pred) => (await members(host)).find(pred);
export const byName = name => m => m.name === name;
/** Escapes a translated label for use inside a RegExp source. */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Host creates a party. hostPlays=false ticks the moderator checkbox. */
export async function createParty(h, { hostPlays = true, name = 'Host' } = {}) {
  const host = await h.open(name, { premium: true });
  // Labels come from the page's own i18n so the flow works in every --lang.
  const createLabel = await host.page.evaluate(() => window.qaT?.('partyControllers.create') ?? 'Create');
  await host.page.waitForFunction(l => [...document.querySelectorAll('button')].some(b => b.innerText.trim().toLowerCase().startsWith(l.toLowerCase())), { timeout: 30000 }, createLabel);
  if (!hostPlays) {
    const box = await host.page.$('[data-testid="host-plays-toggle"]') ?? await host.page.$('input[type=checkbox]');
    assert(box, 'no host-plays toggle'); await box.click();
  }
  assert(await host.clickText(`^${esc(createLabel)}`), `no "${createLabel}" button`);
  await host.until(async c => !!(await c.party())?.party?.code, 'party was not created', 20000);
  const code = (await host.party()).party.code;
  return { host, code };
}

/**
 * Real pairing flow (3.1 step 3): host taps "Connect a TV", the TV opens the code the phone shows.
 * Falls back to the party code only when the host UI offers no TV button.
 */
export async function connectTv(h, host, opts = {}) {
  let code = null;
  const tvLabel = await host.page.evaluate(() => window.qaT?.('partyControllers.tv') ?? 'Connect a TV');
  if (await host.exists('lobby-tv-tile') ? (await host.click('lobby-tv-tile').then(() => true, () => false)) : await host.clickText(`connect a tv|fernseher verbinden|^tv|^${esc(tvLabel)}`, 5000)) { await pause(600); code = await host.page.evaluate(() => controllerQA.tvCode()); }
  code ??= (await host.party()).party.code;
  const tv = await h.tv(code, opts);
  await host.until(async c => c.page.evaluate(() => controllerQA.tvActive()), 'host never registered the TV', 15000).catch(() => {});
  // The connect popover has an icon-only close button and ignores Escape.
  await host.page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label]')].find(b => /close|schlie/i.test(b.getAttribute('aria-label')) && b.getBoundingClientRect().height); b?.click(); });
  await pause(400);
  return tv;
}

/** Adds a 🔁 guest seat. Setup uses the server action; C06 drives the lobby UI with via:'ui'. */
export async function addGuest(ctx, host, code, name, { via = 'rpc' } = {}) {
  const ui = via === 'ui' || (via === 'auto' && hasTestId('lobby-add-guest') && hasTestId('guest-name'));
  if (ui) {
    await host.click('lobby-add-guest'); await host.type('guest-name', name);
    if (hasTestId('guest-save')) await host.click('guest-save'); else await host.page.keyboard.press('Enter');
  } else {
    const r = await host.request('add_guest', code, { name }); assert(!r.error, `add_guest ${name}: ${r.error}`);
    await host.request('read', code); // app picks it up on its own poll; read keeps clock fresh
  }
  await host.until(async c => !!(await memberBy(c, byName(name))), `guest ${name} not in host data`, 15000);
  return (await memberBy(host, byName(name))).player_id;
}

/**
 * Phone opens the invite link. choice: 'new' (create own seat), {claim:name}, or 'auto' (whatever the
 * app offers; new seat when Who-are-you appears). Resolves when the member exists server-side.
 */
export async function joinPhone(h, ctx, host, code, name, { choice = 'new', route, ...open } = {}) {
  const phone = await h.open(name, { route: route ?? `/party/join/${code}`, ...open });
  await settleJoin(phone, host, name, choice);
  return phone;
}

// Text fallbacks while the screens have no data-testid yet (recorded as a note by the caller's report).
const WHO_RE = /wer bist du|who are you/i, NEW_RE = 'ich finde mich nicht|neu anlegen|can.t find|create new', PROFILE_RE = /wie sollen dich|so sieht dich|how should everyone|how the tv shows you/i, PROFILE_GO = "^(los geht|let.?s go|save|speichern|fertig|done)";

/** Drives Who-are-you and the profile screen until the phone sits in the lobby as a member. */
export async function settleJoin(phone, host, name, choice = 'new') {
  const isMember = async () => (await members(host)).some(m => m.user_id === phone.account || (choice?.claim && m.name === choice.claim && m.pending_claim));
  const end = Date.now() + 30000; const acted = { who: 0, profile: 0 };
  while (Date.now() < end) {
    const screen = await phone.waitAny(['who-are-you', 'profile-editor', 'party-lobby', 'seat-error', 'party-full-message', 'update-required', 'party-removed-screen', 'party-ended-screen'], 800);
    const text = await phone.text().catch(() => '');
    if (['seat-error', 'party-full-message', 'update-required', 'party-removed-screen', 'party-ended-screen'].includes(screen)) return screen;
    if (acted.who < 3 && (screen === 'who-are-you' || WHO_RE.test(text)) && !PROFILE_RE.test(text)) {
      acted.who++; if (acted.who > 1) { await pause(1500); if (!await phone.exists('who-are-you') || PROFILE_RE.test(await phone.text())) continue; }
      if (choice?.claim) {
        const seat = await memberBy(host, byName(choice.claim)); assert(seat, `seat ${choice.claim} missing`);
        if (hasTestId('seat-option-')) await phone.click(`seat-option-${seat.player_id}`); else assert(await phone.clickText(`^\\W*${choice.claim}`), `no seat button for ${choice.claim}`);
      } else if (hasTestId('seat-create-new')) await phone.click('seat-create-new'); else assert(await phone.clickText(NEW_RE), 'no "neu anlegen" button');
      continue;
    }
    if (acted.profile < 6 && (screen === 'profile-editor' || PROFILE_RE.test(text)) && !/toggle ready|bereit melden/i.test(text)) {
      acted.profile++; await pause(acted.profile > 1 ? 1500 : 300);
      if (!choice?.claim) { if (hasTestId('profile-name')) { if (await phone.exists('profile-name')) await phone.type('profile-name', name).catch(() => {}); } else await phone.page.evaluate(name => { const input = document.querySelector('input[type=text], input:not([type])'); if (!input) return; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(input, name); input.dispatchEvent(new Event('input', { bubbles: true })); }, name); }
      // The editor can re-mount once the seat arrives (key = player_id); re-type until the value sticks.
      for (let i = 0; i < 4 && !choice?.claim && hasTestId('profile-name'); i++) {
        await pause(400); if (await phone.page.$eval('[data-testid="profile-name"]', n => n.value).catch(() => name) === name) break;
        await phone.type('profile-name', name);
      }
      const locked = await phone.page.$eval('[data-testid="profile-save"]', b => b.disabled).catch(() => false);
      // During a running match the profile is locked; onboarding offers "Später ändern" instead (A10).
      if (locked) assert(await phone.clickText('^(später|later)', 4000), 'profile locked and no "Später ändern"');
      // DOM click: the submit button can sit under the sticky footer, where a coordinate click misses.
      else if (hasTestId('profile-save') && await phone.exists('profile-save')) await phone.page.$eval('[data-testid="profile-save"]', b => b.click()); else await phone.clickText(PROFILE_GO, 3000);
      continue;
    }
    // Lobby = member and no onboarding screen ("alREADY in on their own phone" must not count as ready).
    const onboarding = screen === 'who-are-you' || screen === 'profile-editor' || WHO_RE.test(text) || PROFILE_RE.test(text);
    if (await isMember() && !onboarding && (screen === 'party-lobby' || /\bready\b|bereit/i.test(text))) return 'lobby';
  }
  assert(await isMember(), `${name} never became a member`);
  return 'member';
}

/** Lobby rows open an action sheet; `id` is one of its actions (lobby-edit-, seat-release, seat-recall-, lobby-kick-). */
export async function rowAction(c, pid, id) {
  if (!await c.exists(id)) await c.click(`lobby-player-${pid}`);
  await c.click(id);
}
export async function rowHasAction(c, pid, id) {
  if (await c.exists(id)) return true;
  await c.click(`lobby-player-${pid}`); await pause(500);
  const has = await c.exists(id); await c.page.keyboard.press('Escape'); await pause(300); return has;
}

/** Idempotent: the control is a toggle, so only press it when this phone is not ready yet. */
export async function ready(phone) {
  const s = await phone.snapshot().catch(() => null);
  if (s?.players?.find(p => p.id === s.myPlayerId)?.isReady) return;
  if (hasTestId('lobby-ready-toggle') && await phone.exists('lobby-ready-toggle')) return phone.click('lobby-ready-toggle');
  assert(await phone.clickText('^(toggle ready|ready|i.m ready|bereit)'), `${phone.name}: no ready button`);
}

/** Plans `games` and starts the first through the host lobby; resolves when the room is playing. */
export async function startGame(host, games) {
  // The next game is playlist[results.length]: keep what was played, append the new games.
  await host.page.evaluate(g => { const d = controllerQA.state().data; return controllerQA.playlist([...(d?.party.playlist ?? []).slice(0, d?.results.length ?? 0), ...g]); }, games);
  await pause(400);
  if (hasTestId('lobby-start') && await host.waitAny(['lobby-start'], 10000)) await host.click('lobby-start');
  else assert(await host.clickText('^start next|^start'), 'no start button');
  await host.until(async c => (await c.snapshot()).room?.status === 'playing', 'room never started', 20000);
  await host.until(async c => (await c.route()).startsWith('/games/'), 'host not routed into game', 20000);
}

export const wallNow = c => c.page.evaluate(() => performance.timeOrigin + performance.now());
/** Wall time (ms, comparable across tabs) at which `predicate(arg)` first held in the page, or null. */
export async function visibleAt(c, predicate, arg, timeout = 8000) {
  const handle = await c.page.waitForFunction(new Function('arg', `return (${predicate})(arg) ? performance.timeOrigin + performance.now() : false;`), { timeout, polling: 30 }, arg).catch(() => null);
  return handle ? handle.jsonValue() : null;
}
export const textIn = (testid, text) => [`a => { const n = document.querySelector('[data-testid="' + a.id + '"]'); return !!n && n.innerText.includes(a.text); }`, { id: testid, text }];

/** Text + game-state fingerprint used to detect hangs (no visible progress). */
export const fingerprint = c => c.page.evaluate(() => (document.body.innerText.slice(0, 1500) + JSON.stringify(window.controllerGameStates ?? {}).slice(0, 1500)));

/**
 * Generic driver for any game: clicks positive actions on every device, types into inputs, until the
 * host's result count grows or `budgetMs` passes. Reports stalls > stallMs (no fingerprint change anywhere).
 */
/** isDone(): optional completion check → 'finished' | 'lobby' | null (online rooms, local party). */
export async function driveGame(devices, host, { budgetMs = 90000, stallMs = 10000, before = 0, tick, isDone } = {}) {
  const verbs = '^(start game|start|los|play|let.?s go|begin|ready|bereit|weiter|continue|next|n.chste|accept|done|fertig|submit|senden|ok|reveal|aufdecken|view|ansehen|show|zeigen|spin|drehen|truth|dare|true|wahr|a\\b|yes|ja|confirm|skip|game over|results?|ergebnis|ich bin|i.m |got it|verstanden|close)';
  const end = Date.now() + budgetMs; let last = '', lastChange = Date.now(), stalls = 0, clicks = 0;
  while (Date.now() < end) {
    if (isDone) { const d = await isDone().catch(() => null); if (d === 'finished') return { finished: true, clicks, stalls }; if (d === 'lobby') return { finished: false, returnedToLobby: true, clicks, stalls }; }
    else {
      const data = await host.party().catch(() => null);
      if (data && data.results.length > before) return { finished: true, clicks, stalls };
      if (data && data.party.status === 'lobby' && (await host.route()).startsWith('/party')) return { finished: false, returnedToLobby: true, clicks, stalls };
    }
    if (tick && await tick() === 'stop') return { finished: false, stopped: true, clicks, stalls };
    for (const d of devices) {
      if (d.page.isClosed()) continue;
      await d.page.evaluate(() => { for (const input of document.querySelectorAll('input[type=text],input:not([type]),textarea')) if (!input.value && !input.disabled && input.getBoundingClientRect().height) { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set; set.call(input, 'Test'); input.dispatchEvent(new Event('input', { bubbles: true })); } }).catch(() => {});
      // Party-level controls (players sheet, abort, leave) are never part of playing a game.
      if (await d.page.evaluate(v => { const b = [...document.querySelectorAll('button')].find(b => !b.disabled && b.getBoundingClientRect().height && !b.hasAttribute('aria-haspopup') && !/leave|verlassen|abort|abbrechen|remove|entfernen|players|spieler/i.test(b.innerText) && new RegExp(v, 'i').test(b.innerText.trim())); if (b) { b.click(); return true; } return false; }, verbs).catch(() => false)) clicks++;
    }
    const fp = (await Promise.all(devices.map(d => fingerprint(d).catch(() => '')))).join('|');
    if (fp !== last) { last = fp; lastChange = Date.now(); } else if (Date.now() - lastChange > stallMs) { stalls++; lastChange = Date.now(); }
    await pause(350);
  }
  return { finished: false, timedOut: true, clicks, stalls };
}
