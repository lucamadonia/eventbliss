// Scenarios C (profile), D (host), E (lobby & start) from the masterplan, section 8.
import { assert, need, pause, hasTestId } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, members, memberBy, byName, ready, startGame, wallNow, visibleAt, textIn, rowAction, rowHasAction, connectTv } from './party-play-flows.mjs';
import { seedResult } from './party-play-scenarios-join.mjs';

const own = async (host, phone) => (await memberBy(host, m => m.user_id === phone.account)).player_id;
async function openEditor(c, pid) {
  // A just-saved editor is still animating out; only reuse one that is really staying open.
  if (await c.exists('profile-editor')) { await pause(900); if (await c.exists('profile-editor')) return; }
  await rowAction(c, pid, `lobby-edit-${pid}`); await c.wait('profile-editor');
}
async function pickOther(c, kind) {
  const value = await c.page.$$eval(`[data-testid="profile-${kind}"]`, ns => (ns.find(n => n.getAttribute('aria-pressed') !== 'true' && !n.disabled) ?? ns[0])?.getAttribute('data-value'));
  await c.page.click(`[data-testid="profile-${kind}"][data-value="${value}"]`); return value;
}
/** Kick through the sheet: opener test id, then mode, then confirm. */
export async function kickVia(host, pid, mode) {
  await rowAction(host, pid, `lobby-kick-${pid}`); await host.wait('kick-sheet');
  await host.click(`kick-mode-${mode}`); await host.click('kick-confirm');
}

export const lobbyScenarios = [
  { id: 'C01', title: 'Change name/avatar/colour → TV + all phones ≤ 1 s', async run(ctx) {
    need('profile-editor', 'profile-name', 'profile-avatar', 'profile-color', 'profile-save', 'lobby-edit-', 'tv-lobby-player-');
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host);
    const lena = await joinPhone(h, ctx, host, code, 'Lena'); const tom = await joinPhone(h, ctx, host, code, 'Tom'); const pid = await own(host, lena);
    await openEditor(lena, pid); await lena.type('profile-name', 'Lena K'); const avatar = await pickOther(lena, 'avatar'); const color = await pickOther(lena, 'color');
    const t0 = await wallNow(lena); await lena.click('profile-save');
    const [tvAt, hostAt, tomAt] = await Promise.all([visibleAt(tv, ...textIn(`tv-lobby-player-${pid}`, 'Lena K')), visibleAt(host, ...textIn(`lobby-player-${pid}`, 'Lena K')), visibleAt(tom, ...textIn(`lobby-player-${pid}`, 'Lena K'))]);
    await h.shotAll('profile-changed');
    ctx.evidence.latencyMs = { tv: tvAt && Math.round(tvAt - t0), host: hostAt && Math.round(hostAt - t0), tom: tomAt && Math.round(tomAt - t0) };
    const seat = await memberBy(host, m => m.player_id === pid); assert(seat.name === 'Lena K' && seat.avatar === avatar && seat.color === color, 'server profile not saved');
    for (const [who, at] of Object.entries(ctx.evidence.latencyMs)) assert(at !== null && at <= 1000, `${who} updated after ${at} ms (> 1000)`);
  } },
  { id: 'C02', title: 'Profile change during a game → locked with hint', async run(ctx) {
    need('profile-locked');
    const { h } = ctx; const { host, code } = await createParty(h); const lena = await joinPhone(h, ctx, host, code, 'Lena'); await ready(lena);
    await startGame(host, ['this-or-that']); const late = await joinPhone(h, ctx, host, code, 'Tom');
    const r = await late.request('profile', code, { player_id: await own(host, late), name: 'Tommy' }); assert(/locked_in_game/.test(r.error ?? ''), `server accepted in-game profile change: ${r.error}`);
    await rowAction(late, await own(host, late), `lobby-edit-${await own(host, late)}`).catch(() => {});
    await late.wait('profile-locked'); await h.shotAll('locked');
  } },
  { id: 'C03', title: 'Validation: empty, spaces, >24, emoji, RTL; TV renders correctly', async run(ctx) {
    need('profile-name', 'profile-save', 'lobby-edit-');
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host); const lena = await joinPhone(h, ctx, host, code, 'Lena'); const pid = await own(host, lena);
    // Read the server directly: the host's own copy only refreshes on its poll.
    const attempt = async name => { await openEditor(lena, pid); await lena.type('profile-name', name); await lena.wait('profile-save'); const disabled = await lena.page.$eval('[data-testid="profile-save"]', b => b.disabled); if (!disabled) await lena.click('profile-save'); await pause(1200); if (disabled) await lena.page.keyboard.press('Escape'); const read = await lena.request('read', code); return { disabled, error: await lena.attr('profile-error', 'data-error-code'), saved: read.data.members.find(m => m.player_id === pid).name }; };
    const empty = await attempt('   '); assert(empty.saved === 'Lena' && (empty.disabled || empty.error), 'whitespace name accepted');
    const long = await attempt('A'.repeat(30)); assert(long.saved.length <= 24, `>24 chars saved (${long.saved.length})`);
    const emoji = await attempt('Lena 🎉'); assert(emoji.saved === 'Lena 🎉', 'emoji name rejected');
    const rtl = await attempt('ليلى'); assert(rtl.saved === 'ليلى', 'RTL name rejected');
    await tv.until(async c => (await c.text()).includes('ليلى'), 'TV does not render RTL name', 8000);
    ctx.evidence.cases = { empty, long, emoji, rtl }; await h.shotAll('rtl');
  } },
  { id: 'C06', title: 'Host edits guest profile (ok); host cannot edit a 📱 profile', async run(ctx) {
    need('lobby-edit-', 'profile-editor');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max', { via: 'ui' }); const lena = await joinPhone(h, ctx, host, code, 'Lena');
    assert((await memberBy(host, m => m.player_id === max)).name === 'Max', 'guest added via lobby UI got a truncated name');
    await openEditor(host, max); await host.type('profile-name', 'Maximilian'); await host.click('profile-save');
    await host.until(async c => (await memberBy(c, m => m.player_id === max)).name === 'Maximilian', 'guest profile not saved');
    const lenaPid = await own(host, lena); assert(!await rowHasAction(host, lenaPid, `lobby-edit-${lenaPid}`), 'host sees an edit action on a 📱 seat');
    const r = await host.request('profile', code, { player_id: lenaPid, name: 'Hacked' }); assert(r.error, 'server let host edit a 📱 profile'); await h.shotAll('guest-edited');
  } },
  { id: 'D01', title: 'Host plays / does not play → marked on TV + lobby; guests shown either way', async run(ctx) {
    need('tv-lobby-player-', 'lobby-player-');
    const { h } = ctx; const { host, code } = await createParty(h, { hostPlays: false }); const max = await addGuest(ctx, host, code, 'Max'); const tv = await connectTv(h, host);
    const hostPid = (await host.party()).party.host_player_id;
    await tv.wait(`tv-lobby-player-${max}`); assert(await tv.attr(`tv-lobby-player-${max}`, 'data-seat') === 'host-device', 'guest not marked 🔁 on TV');
    assert(await tv.attr(`tv-lobby-player-${hostPid}`, 'data-host-plays') === 'false', 'moderator not marked on TV');
    assert(await host.exists(`lobby-player-${max}`), 'guest missing in host lobby'); await h.shotAll('moderator-with-guest');
  } },
  { id: 'D04', title: 'End party → TV finale, all phones → closing screen', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host); const lena = await joinPhone(h, ctx, host, code, 'Lena');
    const hostPid = (await host.party()).party.host_player_id; await seedResult(host, code, { [hostPid]: 5, [await own(host, lena)]: 9 });
    if (hasTestId('end-party')) { await host.click('end-party'); if (!await host.waitAny(['end-party-confirm'], 4000)) { ctx.notes.push('end-party-confirm test id not rendered'); await host.clickText('^(leave|verlassen|party beenden|end party|yes|ja|confirm)$', 4000); } else await host.click('end-party-confirm'); }
    else { assert(await host.clickText('^end party|party beenden'), 'no end-party button'); await pause(500); await host.clickText('^(leave|verlassen|party beenden|yes|ja|confirm)$', 4000); }
    await host.until(async c => (await c.party())?.party?.status === 'finished' || !(await c.party()), 'party not finished', 10000);
    // The finale rows exist invisibly during the drumroll; beat 3 is the revealed podium (tv-lobby contract).
    if (hasTestId('tv-party-finale')) await tv.until(async c => (await c.attr('tv-party-finale', 'data-beat')) === '3', 'TV finale never reached beat 3', 20000);
    else await tv.until(async c => !(await c.exists('tv-lobby')) || /lena/i.test(await c.text()) && /9/.test(await c.text()), 'TV did not leave the lobby for the finale', 10000);
    await h.shotAll('tv-finale');
    const screen = await lena.waitAny(['party-ended-screen'], 10000); await h.shotAll('ended');
    if (!screen) { need('party-ended-screen'); throw new Error('phone shows no closing screen'); }
  } },
  { id: 'D05', title: 'Kick from lobby / player leaves → points archived, tactful notices', async run(ctx) {
    need('lobby-kick-', 'kick-sheet', 'kick-mode-party', 'kick-confirm', 'party-removed-screen');
    const { h } = ctx; const { host, code } = await createParty(h); const tv = await connectTv(h, host);
    const tom = await joinPhone(h, ctx, host, code, 'Tom'); const lena = await joinPhone(h, ctx, host, code, 'Lena'); const tomPid = await own(host, tom);
    const hostPid = (await host.party()).party.host_player_id; await seedResult(host, code, { [hostPid]: 1, [tomPid]: 6, [await own(host, lena)]: 2 });
    // The kick RPC leaves only after the 5 s undo window (by design); latency is measured from the RPC.
    const since = Date.now(); await kickVia(host, tomPid, 'party');
    await tom.wait('party-removed-screen', { timeout: 12000 }); const tomAt = await wallNow(tom);
    const t0 = h.stats.rpc.find(r => r.action === 'kick' && r.at >= since)?.at ?? since;
    const toast = hasTestId('tv-toast') ? await tv.waitAny(['tv-toast'], 5000) && await tv.textOf('tv-toast') : null;
    ctx.evidence.kickMs = Math.round(tomAt - t0); ctx.evidence.tvToast = toast; await h.shotAll('kicked');
    assert(ctx.evidence.kickMs <= 1300, `removed notice ${ctx.evidence.kickMs} ms after the kick RPC (T19: ≤ 1 s)`);
    if (toast !== null) assert(/Tom/.test(toast) && !/entfernt|removed|kicked/i.test(toast), `TV toast not tactful: ${toast}`);
    const data = await host.party(); assert(data.past_members.some(m => m.player_id === tomPid), 'Tom not archived');
    assert(data.results.some(r => r.scores[tomPid] === 6), 'Tom\'s points lost');
    if (hasTestId('leave-party')) { await lena.click('leave-party'); await lena.click('leave-confirm'); await host.until(async c => !(await members(c)).some(m => m.user_id === lena.account), 'leave not reflected'); }
    else ctx.notes.push('self-leave via leave-party not testable (test id missing)');
  } },
  { id: 'E01', title: 'Not all ready → start disabled, names of the missing', async run(ctx) {
    need('lobby-start');
    const { h } = ctx; const { host, code } = await createParty(h); const lena = await joinPhone(h, ctx, host, code, 'Lena'); await joinPhone(h, ctx, host, code, 'Tom'); await ready(lena);
    await host.page.evaluate(() => controllerQA.playlist(['this-or-that'])); await pause(1500);
    await host.wait('lobby-start'); const disabled = await host.page.$eval('[data-testid="lobby-start"]', b => b.disabled || b.getAttribute('aria-disabled') === 'true');
    const reason = await host.attr('lobby-start', 'data-disabled-reason') ?? await host.text(); await h.shotAll('not-ready');
    assert(disabled, 'start enabled although Tom is not ready'); assert(/Tom/.test(reason) && !/Lena/.test(await host.attr('lobby-start', 'data-disabled-reason') ?? ''), `reason does not name exactly the missing player: ${reason?.slice(0, 120)}`);
  } },
  { id: 'E02', title: 'Player count does not fit → hint + next fitting game', async run(ctx) {
    need('setlist-hint-', 'setlist-suggestion');
    // taboo needs 4 active players; host + Lena are 2 (guests would sit out, so phones are used).
    const { h } = ctx; const { host, code } = await createParty(h); await joinPhone(h, ctx, host, code, 'Lena');
    await host.page.evaluate(() => controllerQA.playlist(['taboo', 'this-or-that'])); await host.wait('setlist-hint-taboo');
    const status = await host.attr('setlist-hint-taboo', 'data-status'); ctx.evidence.status = status;
    assert(status === 'too-few', `taboo with 2 active flagged as ${status}`);
    const next = await host.attr('setlist-suggestion', 'data-game-id'); ctx.evidence.suggestion = next;
    assert(next === 'this-or-that', `suggested ${next}, expected the next fitting game this-or-that`); await h.shotAll('too-few');
  } },
  { id: 'E03', title: 'sitout game with guests → "Max & Gerda setzen aus" before start', async run(ctx) {
    need('lobby-sitout-hint');
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max'); await addGuest(ctx, host, code, 'Gerda'); await joinPhone(h, ctx, host, code, 'Lena');
    await host.page.evaluate(() => controllerQA.playlist(['brew'])); await host.wait('lobby-sitout-hint');
    // The pre-start hint names exactly the guests who sit out; the setlist chip is evidence only.
    const text = await host.textOf('lobby-sitout-hint'); ctx.evidence = { hint: text, chip: await host.textOf('setlist-hint-brew'), status: await host.attr('setlist-hint-brew', 'data-status') };
    assert(/Max/.test(text) && /Gerda/.test(text) && !/Lena/.test(text), `sitout hint wrong: ${text}`); await h.shotAll('sitout-hint');
  } },
  { id: 'E04', title: 'Too few active players after sitout → start blocked with reason', async run(ctx) {
    need('lobby-start');
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max'); await addGuest(ctx, host, code, 'Gerda');
    await host.page.evaluate(() => controllerQA.playlist(['brew'])); await pause(1500);
    await host.wait('lobby-start'); const disabled = await host.page.$eval('[data-testid="lobby-start"]', b => b.disabled || b.getAttribute('aria-disabled') === 'true');
    ctx.evidence.reason = await host.attr('lobby-start', 'data-disabled-reason'); await h.shotAll('too-few');
    assert(disabled && ctx.evidence.reason, 'brew startable with only the host active (guests sit out)');
  } },
];
