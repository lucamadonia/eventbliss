// Party-Play game matrix (masterplan F09 / 12.1-4): every playable game × guest share
// 0/30/100 % × host plays yes/no, one party per (share, host) combination playing all games
// in a row, with a TV attached.
//   node scripts/qa/party-play-matrix.mjs [--games a,b] [--shares 0,30,100] [--host yes,no] [--budget 60] [--real]
// Per case: start allowed iff enough active players (guests sit out in `sitout` games); participants
// match sharedDevice + host role; match finishes with a complete result OR the host's abort returns
// every device to the lobby within 10 s; no page errors. Driving uses the generic monkey driver, so
// "aborted-clean" is expected for games that need real answers.
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { createHarness, pause } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, ready, connectTv } from './party-play-flows.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const real = args.includes('--real');
const base = process.env.QA_PARTY_URL ?? (real ? 'http://127.0.0.1:5185' : 'http://127.0.0.1:5186');
const registry = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
const games = [...registry.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?minPlayers:\s*(\d+),\s*maxPlayers:\s*(\d+)[^}]*?\}/g)]// Effective guest policy mirrors guestPolicy(): declared sharedDevice applies only once sharedDeviceSupported is set.
  .map(m => ({ id: m[1], min: +m[2], max: +m[3], declared: (m[0].match(/sharedDevice:\s*"(\w+)"/) ?? [])[1] ?? null, supported: /sharedDeviceSupported:\s*true/.test(m[0]) }))
  // --force-shared: guests play in every adapted game (QA switch), so the declared mode applies.
  .map(g => ({ ...g, shared: g.supported || args.includes('--force-shared') ? (g.declared ?? 'sitout') : 'sitout' }))
  .filter(g => !opt('games') || opt('games').split(',').includes(g.id));
const shares = opt('shares', '0,30,100').split(',').map(Number);
const hostModes = opt('host', 'yes,no').split(',').map(x => x === 'yes');
const budgetMs = Number(opt('budget', 60)) * 1000;
const root = `scripts/tmp/party-play/matrix-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
fs.mkdirSync(root, { recursive: true });
const rows = [];
const save = () => {
  fs.writeFileSync(`${root}/report.json`, JSON.stringify({ base, real, rows }, null, 2));
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});
  fs.writeFileSync(`${root}/summary.md`, `# Party-Play game matrix\n\n${JSON.stringify(counts)}\n\n| game | guests % | host plays | shared | status | detail |\n|---|---|---|---|---|---|\n${rows.map(r => `| ${r.game} | ${r.share} | ${r.hostPlays ? 'yes' : 'no'} | ${r.shared ?? '(default sitout)'} | ${r.status} | ${(r.detail ?? '').replace(/\|/g, '/').slice(0, 160)} |`).join('\n')}\n`);
};

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
try {
  for (const share of shares) for (const hostPlays of hostModes) {
    const guestsN = Math.round(3 * share / 100), phonesN = 3 - guestsN;
    const h = await createHarness({ real, out: `${root}/g${share}-h${hostPlays ? 1 : 0}`, base, browser });
    try {
      const { host, code } = await createParty(h, { hostPlays }); await connectTv(h, host); const ctx = { notes: [] };
      if (args.includes('--force-shared')) await host.page.evaluate(ids => { window.__partyPlayForceShared = ids; }, games.map(g => g.id));
      for (let i = 0; i < guestsN; i++) await addGuest(ctx, host, code, ['Max', 'Gerda', 'Udo'][i], { via: 'rpc' });
      const phones = []; for (let i = 0; i < phonesN; i++) phones.push(await joinPhone(h, ctx, host, code, ['Lena', 'Tom', 'Sara'][i]));
      for (const game of games) {
        const row = { game: game.id, share, hostPlays, shared: game.shared }; const started = Date.now(); const errs = h.consoleErrors().length;
        try {
          for (const p of phones) { const s = await p.snapshot(); if (!s.players.find(x => x.id === s.myPlayerId)?.isReady) await ready(p).catch(() => {}); }
          const sitout = (game.shared ?? 'sitout') === 'sitout';
          const active = (hostPlays ? 1 : 0) + phonesN + (sitout ? 0 : guestsN);
          await host.page.evaluate(g => controllerQA.playlist([g]), game.id); await pause(300);
          const before = (await host.party()).results.length;
          const startErr = await host.page.evaluate(g => controllerQA.start(g).then(() => null, e => String(e.message ?? e)), game.id);
          const playing = await host.until(async c => (await c.snapshot()).room?.status === 'playing', 'not playing', 6000).then(() => true, () => false);
          if (active < game.min || active > game.max) {
            row.status = playing ? 'FAIL' : 'PASS'; row.detail = playing ? `started with ${active} active (limits ${game.min}-${game.max})` : `blocked as expected (${active} active): ${startErr ?? ''}`;
            if (playing) await host.page.evaluate(() => controllerQA.abort()); continue;
          }
          if (!playing) { row.status = 'FAIL'; row.detail = `did not start with ${active} active: ${startErr}`; continue; }
          const ids = (await host.snapshot()).room.participantIds; const data = await host.party();
          const guestIds = data.members.filter(m => m.controlled_by).map(m => m.player_id);
          const problems = [];
          if (guestIds.some(id => ids.includes(id)) === sitout && guestIds.length) problems.push(`guests ${sitout ? 'included in sitout game' : 'missing from participants'}`);
          if (ids.includes(data.party.host_player_id) !== hostPlays) problems.push('host participation wrong');
          await hostSetup(host, game.id, 10000);
          // Games with a specific driver get time to finish; the rest are exercised and then aborted.
          const driven = ['this-or-that', 'fake-or-fact', 'flaschendrehen'].includes(game.id);
          const res = await playMatch(h, host, game.id, await deviceMap(host, phones), { budgetMs: driven ? Math.max(budgetMs, 150000) : budgetMs, before }); row.res = res;
          if (res.finished) {
            const result = (await host.party()).results.at(-1);
            if (JSON.stringify(Object.keys(result.scores).sort()) !== JSON.stringify([...ids].sort())) problems.push('result roster != participants');
            row.outcome = 'finished';
          } else {
            await host.page.evaluate(() => controllerQA.abort()).catch(e => problems.push(`abort threw ${e.message}`));
            for (const c of [host, ...phones]) await c.until(async x => (await x.route()).startsWith('/party'), 'stuck after abort', 10000).catch(e => problems.push(e.message));
            row.outcome = 'aborted-clean';
          }
          const newErrs = h.consoleErrors().slice(errs); if (newErrs.length) problems.push(`page errors: ${newErrs[0].slice(0, 200)}`);
          row.status = problems.length ? 'FAIL' : 'PASS'; row.detail = problems.join('; ') || `${row.outcome}, ${res.clicks ?? res.actions ?? 0} actions, stalls ${res.stalls ?? 0}`;
        } catch (e) { row.status = 'FAIL'; row.detail = String(e.message ?? e).slice(0, 400); await h.shotAll(`${game.id}-failure`).catch(() => {}); }
        finally {
          row.ms = Date.now() - started; rows.push(row); save(); console.log(`${row.status.padEnd(5)} ${game.id.padEnd(18)} guests ${share}% host ${hostPlays ? 'yes' : 'no '} ${row.detail}`);
          await host.until(async c => (await c.snapshot()).room?.status !== 'playing', 'room still playing', 10000).catch(async () => { await host.page.evaluate(() => controllerQA.abort()).catch(() => {}); });
        }
      }
    } catch (e) { rows.push({ game: '(setup)', share, hostPlays, status: 'FAIL', detail: String(e.message ?? e).slice(0, 400) }); save(); console.log('SETUP FAIL', share, hostPlays, e.message); }
    finally { await h.close(); }
  }
} finally { await browser.close(); save(); console.log(`Report: ${root}/summary.md`); if (rows.some(r => r.status === 'FAIL')) process.exitCode = 1; }
