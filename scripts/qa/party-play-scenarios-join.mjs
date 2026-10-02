// Scenarios A (joining) and B (claim / create seat) from the masterplan, section 8.
import { assert, need, pause, hasTestId } from './party-play-harness.mjs';
import { visibleAt, createParty, addGuest, joinPhone, settleJoin, members, memberBy, byName, startGame, ready, rowAction, connectTv } from './party-play-flows.mjs';

const playerId = () => `player-${[...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('')}`;
/** Fills seats with server-side phone members (other accounts) — setup only, PGlite. */
export async function seedPhoneMembers(h, code, n, prefix = 'Seed') {
  for (let i = 0; i < n; i++) {
    const account = `10000000-0000-4000-8000-${String(Date.now() % 1e6 * 100 + i).padStart(12, '0')}`;
    await h.db.seedUser(account); await h.db.request(account, 'join', code, { player_id: playerId(), name: `${prefix} ${i + 1}` });
  }
}
/** Gives seats points through a finished match (server actions; the room stays in the lobby). */
export async function seedResult(host, code, scores) {
  const ids = Object.keys(scores);
  let r = await host.request('start', code, { game_id: 'this-or-that', participant_ids: ids }); assert(!r.error, `seed start: ${r.error}`);
  r = await host.request('finish', code, { match_id: r.data.party.current_match_id, game_id: 'this-or-that', scored: true, scores }); assert(!r.error, `seed finish: ${r.error}`);
  return r.data;
}
// Claims re-key a seat (and its results) to the claimer's controller id, so seats are found by name.
const seatOf = (data, name) => data.members.find(m => m.name === name);
/** Server truth as this device; the host app's own copy only refreshes on its 4 s poll. */
const fresh = async (c, code) => (await c.request('read', code)).data;
const total = (data, pid) => data.results.reduce((s, r) => s + (r.scores[pid] ?? 0), 0);

export const joinScenarios = [
  { id: 'SMOKE', title: 'Harness smoke: host creates, phone joins, TV renders', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h);
    const tv = await connectTv(h, host); const phone = await joinPhone(h, ctx, host, code, 'Lena');
    await h.shotAll('smoke');
    await tv.until(async c => /Lena/.test(await c.text()), 'TV never lists Lena', 15000);
    ctx.evidence.members = (await members(host)).map(m => m.name); assert(phone, 'phone');
  } },
  { id: 'A01', title: 'Scan → "Wer bist du?" ≤ 3 s after app start (signed in)', async run(ctx) {
    need('who-are-you');
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max');
    const phone = await h.open('Lena', { route: `/party/join/${code}` });
    await phone.wait('who-are-you', { timeout: 10000 });
    const [ms, pageMs] = await phone.page.evaluate(() => { const at = window.__qaSeenLog.find(e => e.id === 'who-are-you')?.at ?? 0; return [at - window.__qaAppStart, at - performance.timeOrigin]; });
    ctx.evidence.whoAreYouMs = Math.round(ms); ctx.evidence.includingDevModuleLoadMs = Math.round(pageMs); await h.shotAll('who-are-you');
    assert(ms <= 3000, `who-are-you after ${Math.round(ms)} ms (> 3000)`);
    await settleJoin(phone, host, 'Lena');
  } },
  { id: 'A03', title: 'Signed out → login → continues into the join without re-scan', pgliteOnly: true, async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h);
    const phone = await h.open('Lena', { route: `/party/join/${code}`, identity: false });
    if (!await phone.waitAny(['qa-auth-page'], 4000)) assert(await phone.clickText('log ?in|sign ?in|anmelden'), 'no login prompt for signed-out join');
    await phone.wait('qa-auth-page'); assert((await phone.text()).includes(`/party/join/${code}`), 'login lost the invite redirect');
    await h.shotAll('login');
    await phone.page.evaluate(id => window.partyQAAuth({ id, user_metadata: { display_name: 'Lena' } }), phone.account);
    await settleJoin(phone, host, 'Lena'); await h.shotAll('joined');
  } },
  { id: 'A05', title: 'Already in another party → "Party wechseln?", old one left cleanly', async run(ctx) {
    need('switch-party-prompt', 'switch-party-confirm');
    const { h } = ctx; const a = await createParty(h, { name: 'HostA' }); const b = await createParty(h, { name: 'HostB' });
    const phone = await joinPhone(h, ctx, a.host, a.code, 'Lena');
    await phone.page.evaluate(code => controllerQA.navigate(`/party/join/${code}`), b.code);
    await phone.wait('switch-party-prompt'); await h.shotAll('switch-prompt'); await phone.click('switch-party-confirm');
    await settleJoin(phone, b.host, 'Lena');
    await a.host.until(async c => !(await members(c)).some(m => m.user_id === phone.account), 'old party still lists Lena', 12000);
  } },
  { id: 'A06', title: 'Code typed manually → same as scan', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h);
    const phone = await h.open('Lena', { route: '/party/controllers' });
    const input = await phone.page.waitForSelector('[data-testid="join-code"], input[maxlength="6"], input[autocomplete="one-time-code"], input[type=text]', { timeout: 15000 });
    await input.type(code); assert(await phone.clickText('^join|beitreten'), 'no join button');
    await settleJoin(phone, host, 'Lena'); await h.shotAll('joined-by-code');
  } },
  { id: 'A07', title: 'Party full (12) → clear message, no half join', pgliteOnly: true, async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h); await seedPhoneMembers(h, code, 11);
    const phone = await h.open('Late', { route: `/party/join/${code}` });
    const shown = await phone.waitAny(['party-full-message', 'seat-error'], 10000); await h.shotAll('full');
    if (!shown) { need('party-full-message'); assert(/full|voll/i.test(await phone.text()), 'no "party full" message'); }
    else if (shown === 'seat-error') assert(/full/.test(await phone.attr('seat-error', 'data-error-code')), 'wrong error code');
    await pause(1500); assert(!(await members(host)).some(m => m.user_id === phone.account), 'half join: member row created');
    assert((await members(host)).length === 12, 'roster changed');
  } },
  { id: 'A08', title: 'Party ended → "Diese Party ist vorbei" + own party', async run(ctx) {
    need('party-ended-screen');
    const { h } = ctx; const { host, code } = await createParty(h); await host.request('end', code);
    const phone = await h.open('Lena', { route: `/party/join/${code}` });
    await phone.wait('party-ended-screen'); await h.shotAll('ended');
    assert(/eigene party|own party|start/i.test(await phone.textOf('party-ended-screen')), 'no "start own party" action');
  } },
  { id: 'A09', title: 'Old app version (min_client) → update hint with store link', pgliteOnly: true, async run(ctx) {
    need('update-required');
    const { h } = ctx; const { host, code } = await createParty(h);
    await h.db.db.query('UPDATE public.controller_parties SET min_client=9999 WHERE code=$1', [code]);
    const phone = await h.open('Lena', { route: `/party/join/${code}` });
    await phone.wait('update-required'); await h.shotAll('update');
    assert(await phone.page.$('[data-testid="update-required"] a[href*="apple.com"], [data-testid="update-required"] a[href*="play.google"], [data-testid="update-required"] button'), 'no store link');
  } },
  { id: 'A10', title: 'Join during a running game → "Ab der nächsten Runde dabei"', async run(ctx) {
    need('join-next-round');
    const { h } = ctx; const { host, code } = await createParty(h);
    const p1 = await joinPhone(h, ctx, host, code, 'Lena'); await ready(p1); await startGame(host, ['this-or-that']);
    const late = await joinPhone(h, ctx, host, code, 'Tom'); await late.wait('join-next-round'); await h.shotAll('late-join');
    const snap = await host.snapshot(); const tom = await memberBy(host, m => m.user_id === late.account);
    assert(!snap.room.participantIds.includes(tom.player_id), 'late joiner was put into the running match');
  } },
  { id: 'A12', title: 'Create with / without playing → role correct in lobby and on TV', async run(ctx) {
    need('tv-lobby');
    const { h } = ctx;
    for (const hostPlays of [true, false]) {
      const { host, code } = await createParty(h, { hostPlays, name: hostPlays ? 'Luca' : 'Mod' });
      const tv = await connectTv(h, host, { name: `TV-${hostPlays}` }); const data = await host.party();
      assert(data.party.host_plays === hostPlays, 'server host_plays wrong');
      await tv.wait(`tv-lobby-player-${data.party.host_player_id}`, { timeout: 15000 });
      const flag = await tv.attr(`tv-lobby-player-${data.party.host_player_id}`, 'data-host-plays');
      ctx.evidence[`hostPlays${hostPlays}`] = flag; assert(flag === String(hostPlays), `TV data-host-plays=${flag}, expected ${hostPlays}`);
      await h.shotAll(`host-plays-${hostPlays}`);
    }
  } },
  { id: 'B01', title: 'Claim free 🔁 seat → points/profile kept, TV 🔁→📱', async run(ctx) {
    need('who-are-you', 'seat-option-');
    // Part 1: points and profile travel with the seat (a finished match moves the TV to standings, 5.3).
    const { h } = ctx; const { host, code } = await createParty(h);
    const max = await addGuest(ctx, host, code, 'Max'); const hostPid = (await host.party()).party.host_player_id;
    await seedResult(host, code, { [hostPid]: 3, [max]: 12 });
    const before = seatOf(await fresh(host, code), 'Max');
    const phone = await joinPhone(h, ctx, host, code, 'Maxi', { choice: { claim: 'Max' } }); await h.shotAll('claimed');
    const data = await fresh(host, code); const after = seatOf(data, 'Max');
    assert(after.user_id === phone.account && after.controlled_by === null, 'seat not transferred');
    assert(after.avatar === before.avatar && after.color === before.color && after.name === 'Max', 'profile changed by claim');
    assert(total(data, after.player_id) === 12, `points not carried over: ${total(data, after.player_id)}`); ctx.evidence.rekeyed = after.player_id !== max;
    if (!hasTestId('tv-lobby-player-')) return;
    // Part 2 (T02): before the first game the TV shows the waiting room; the card flips 🔁→📱 within 1 s.
    const p2 = await createParty(h, { name: 'Host2' }); const tv = await connectTv(h, p2.host); const gerda = await addGuest(ctx, p2.host, p2.code, 'Gerda');
    await tv.until(async c => (await c.attr(`tv-lobby-player-${gerda}`, 'data-seat')) === 'host-device', 'TV does not show Gerda at the host device');
    // Watch inside the TV page while the phone claims; both clocks are this machine's wall clock.
    const flip = visibleAt(tv, `() => [...document.querySelectorAll('[data-testid^="tv-lobby-player-"]')].some(n => n.getAttribute('data-seat') === 'phone' && n.innerText.includes('Gerda'))`, null, 60000);
    await joinPhone(h, ctx, p2.host, p2.code, 'Gerda-phone', { choice: { claim: 'Gerda' } });
    const claimedAt = h.stats.rpc.filter(r => r.action === 'claim' && !r.error).at(-1)?.at;
    const flippedAt = await flip; assert(flippedAt, 'TV never flipped Gerda to 📱');
    ctx.evidence.tvFlipMs = Math.round(flippedAt - claimedAt); await h.shotAll('tv-flipped');
    assert(ctx.evidence.tvFlipMs <= 1300, `TV flipped 🔁→📱 after ${ctx.evidence.tvFlipMs} ms (> 1 s)`);
  } },
  { id: 'B02', title: 'Two devices claim the same seat at once → exactly one wins, other sees seat_taken', async run(ctx) {
    need('who-are-you', 'seat-option-', 'seat-error');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max');
    const [a, b] = await Promise.all([h.open('PhoneA', { route: `/party/join/${code}` }), h.open('PhoneB', { route: `/party/join/${code}` })]);
    await Promise.all([a.wait(`seat-option-${max}`), b.wait(`seat-option-${max}`)]);
    await Promise.all([a.page.click(`[data-testid="seat-option-${max}"]`), b.page.click(`[data-testid="seat-option-${max}"]`)]);
    await pause(2500); await h.shotAll('race');
    const seat = seatOf(await fresh(host, code), 'Max'); const winner = [a, b].find(p => p.account === seat.user_id); const loser = [a, b].find(p => p !== winner);
    assert(winner, 'nobody owns the seat'); ctx.evidence.winner = winner.name;
    const code2 = await loser.waitAny(['seat-error'], 6000) && await loser.attr('seat-error', 'data-error-code');
    assert(code2 === 'seat_taken', `loser saw ${code2}`);
    assert(!await loser.exists(`seat-option-${max}`), 'loser list still offers the taken seat');
  } },
  { id: 'B03', title: 'Wrong seat → "Das bin ich nicht" gives it back, nothing lost', async run(ctx) {
    need('seat-release');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max');
    const hostPid = (await host.party()).party.host_player_id; await seedResult(host, code, { [hostPid]: 1, [max]: 7 });
    const phone = await joinPhone(h, ctx, host, code, 'Lena', { choice: { claim: 'Max' } });
    const claimed = seatOf(await fresh(host, code), 'Max').player_id;
    await rowAction(phone, claimed, 'seat-release'); await host.until(async c => seatOf(await fresh(c, code), 'Max')?.controlled_by != null, 'seat not returned to host');
    const data = await host.party(); assert(total(data, seatOf(data, 'Max').player_id) === 7, 'points lost after release'); await h.shotAll('released');
    assert(await phone.waitAny(['who-are-you', 'profile-editor'], 8000), 'phone not back at who-are-you');
  } },
  { id: 'B04', title: 'Claim during a game → pending, completed after the round', async run(ctx) {
    need('who-are-you', 'seat-option-');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max');
    const p1 = await joinPhone(h, ctx, host, code, 'Lena'); await ready(p1); await startGame(host, ['this-or-that']);
    const snap = await host.snapshot(); if (!snap.room.participantIds.includes(max)) ctx.notes.push('Max sits out this-or-that; pending claim still exercised');
    const phone = await joinPhone(h, ctx, host, code, 'Maxi', { choice: { claim: 'Max' } });
    let seat = seatOf(await fresh(host, code), 'Max'); assert(seat.pending_claim || seat.user_id === phone.account, 'claim neither pending nor applied');
    ctx.evidence.pendingDuringGame = seat.pending_claim; await h.shotAll('pending');
    await host.page.evaluate(() => controllerQA.abort());
    await host.until(async c => seatOf(await fresh(c, code), 'Max')?.user_id === phone.account, 'pending claim not applied after the round', 15000);
  } },
  { id: 'B06', title: 'Same account on a second device → "Auf dieses Handy wechseln?"', async run(ctx) {
    need('switch-device-prompt', 'switch-device-confirm');
    const { h } = ctx; const { host, code } = await createParty(h); const first = await joinPhone(h, ctx, host, code, 'Lena');
    const second = await h.open('Lena-2', { route: `/party/join/${code}`, account: first.account });
    await second.wait('switch-device-prompt'); await second.click('switch-device-confirm'); await h.shotAll('switched');
    await first.until(async c => !(await c.text()).match(/ready|bereit/i) || await c.exists('party-removed-screen'), 'old device still controls the seat', 10000);
  } },
  { id: 'B07', title: 'App restarted → own seat restored automatically', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h); const phone = await joinPhone(h, ctx, host, code, 'Lena');
    const before = (await memberBy(host, m => m.user_id === phone.account)).player_id;
    await phone.page.evaluate(() => controllerQA.navigate('/party/controllers')); await phone.reload();
    await phone.until(async c => (await c.party())?.party?.code === code, 'party not resumed after restart', 20000);
    assert((await phone.snapshot()).myPlayerId === before, 'identity changed after restart'); await h.shotAll('restored');
  } },
  { id: 'B07b', title: 'Member re-opens the invite link (re-scan / app via link) → straight back to own seat', async run(ctx) {
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max'); const phone = await joinPhone(h, ctx, host, code, 'Lena');
    const before = (await memberBy(host, m => m.user_id === phone.account)).player_id;
    await phone.reload(); await pause(4000); await h.shotAll('reopened-link');
    const shown = await phone.page.evaluate(() => window.__qaSeenLog.filter(e => e.shown).map(e => e.id));
    assert(!shown.includes('who-are-you'), 'member sees "Wer bist du?" again instead of the own seat');
    assert((await phone.snapshot()).myPlayerId === before, 'identity changed after re-opening the link');
  } },
  { id: 'B08', title: 'Host recalls a 📱 seat → phone: "Du spielst jetzt am Host-Handy"', async run(ctx) {
    need('seat-recall-', 'recalled-notice');
    const { h } = ctx; const { host, code } = await createParty(h); const phone = await joinPhone(h, ctx, host, code, 'Lena');
    const pid = (await memberBy(host, m => m.user_id === phone.account)).player_id;
    await rowAction(host, pid, `seat-recall-${pid}`); await phone.wait('recalled-notice', { timeout: 10000 }); await h.shotAll('recalled');
    const seat = seatOf(await fresh(host, code), 'Lena'); assert(seat.user_id === null && seat.controlled_by, 'seat not moved to host device');
  } },
  { id: 'B09', title: 'No 🔁 seats → "Wer bist du?" skipped', async run(ctx) {
    need('who-are-you');
    const { h } = ctx; const { host, code } = await createParty(h);
    const phone = await h.open('Lena', { route: `/party/join/${code}` });
    await phone.waitAny(['profile-editor', 'party-lobby'], 10000); await pause(800);
    const shown = await phone.page.evaluate(() => window.__qaSeenLog.some(e => e.id === 'who-are-you'));
    assert(!shown, '"Wer bist du?" shown without guest seats'); await settleJoin(phone, host, 'Lena');
  } },
  { id: 'B10', title: 'Only one 🔁 seat → still a choice, no auto-assignment', async run(ctx) {
    need('who-are-you', 'seat-create-new');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max');
    const phone = await h.open('Lena', { route: `/party/join/${code}` }); await phone.wait('who-are-you'); await pause(1500);
    assert(await phone.exists(`seat-option-${max}`) && await phone.exists('seat-create-new'), 'choice missing');
    assert(seatOf(await fresh(host, code), 'Max').user_id === null, 'seat auto-assigned'); await h.shotAll('one-seat');
  } },
  { id: 'B11', title: '"Ich finde mich nicht – neu anlegen" despite free seats → new seat, guests untouched', async run(ctx) {
    need('who-are-you', 'seat-create-new');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max'); const gerda = await addGuest(ctx, host, code, 'Gerda');
    const phone = await joinPhone(h, ctx, host, code, 'Lena', { choice: 'new' }); const data = await host.party();
    assert(seatOf(data, 'Max').controlled_by && seatOf(data, 'Gerda').controlled_by, 'guest seats were touched');
    assert(data.members.some(m => m.user_id === phone.account && m.player_id !== max && m.player_id !== gerda), 'no new seat'); await h.shotAll('new-seat');
  } },
  { id: 'B12', title: 'New name similar to a free seat → "Bist du Max?" yes takes over, no creates new', async run(ctx) {
    need('seat-match-prompt', 'seat-match-yes', 'seat-match-no', 'profile-name');
    const { h } = ctx; const { host, code } = await createParty(h); const max = await addGuest(ctx, host, code, 'Max');
    for (const [answer, name] of [['seat-match-no', 'Maxi'], ['seat-match-yes', 'max']]) {
      const phone = await h.open(`Phone-${answer}`, { route: `/party/join/${code}` });
      await phone.click('seat-create-new'); await phone.type('profile-name', name);
      if (hasTestId('profile-save')) await phone.click('profile-save');
      await phone.wait('seat-match-prompt'); await h.shotAll(`match-${answer}`); await phone.click(answer);
      await host.until(async c => (await fresh(c, code)).members.some(m => m.user_id === phone.account), 'phone never seated');
      if (answer === 'seat-match-yes') await host.until(async c => seatOf(await fresh(c, code), 'Max')?.user_id === phone.account, '"Yes" did not take over Max', 8000).catch(() => {});
      const seat = seatOf(await fresh(host, code), 'Max');
      if (answer === 'seat-match-no') assert(seat.user_id === null, '"No" took over Max anyway');
      else assert(seat.user_id === phone.account, '"Yes" did not take over Max');
    }
  } },
  { id: 'B13', title: 'Create new in a full party → "Party voll – übernimm einen Platz"', pgliteOnly: true, async run(ctx) {
    // Full party with a free 🔁 seat: join returns seated:false → Who-are-you with only guest seats,
    // "neu anlegen" replaced by party-full-message; claiming Max keeps the party at 12.
    need('who-are-you', 'party-full-message');
    const { h } = ctx; const { host, code } = await createParty(h); await addGuest(ctx, host, code, 'Max', { via: 'rpc' }); await seedPhoneMembers(h, code, 10);
    const max = (await memberBy(host, byName('Max'))).player_id;
    const phone = await h.open('Late', { route: `/party/join/${code}` }); await phone.wait('who-are-you'); await phone.wait('party-full-message');
    assert(!await phone.exists('seat-create-new'), '"neu anlegen" offered in a full party'); await h.shotAll('full');
    await phone.click(`seat-option-${max}`);
    await host.until(async c => seatOf(await fresh(c, code), 'Max')?.user_id === phone.account, 'claim in full party failed', 15000);
    assert((await fresh(host, code)).members.length === 12, 'seat count changed');
  } },
];
