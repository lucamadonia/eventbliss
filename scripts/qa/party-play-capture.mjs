// Design capture: plays each game with host + one phone + one 🔁 guest (guest play forced via
// window.__partyPlayForceShared, dev/QA only) and a TV, and saves a screenshot of every device
// whenever its screen changes. Output: scripts/tmp/party-play/design-capture/<lang>/<game>/NN-<device>.png
// plus index.md (one line per image).
//   node scripts/qa/party-play-capture.mjs --games bomb,taboo --lang de [--viewport 390x844] [--budget 60] [--max 14] [--tag final]
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { createHarness, pause } from './party-play-harness.mjs';
import { createParty, addGuest, joinPhone, ready, startGame, connectTv, fingerprint } from './party-play-flows.mjs';
import { hostSetup, playMatch, deviceMap } from './party-play-games.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const games = String(opt('games', '')).split(',').filter(Boolean);
const lang = opt('lang', 'de');
const [vw, vh] = String(opt('viewport', '390x844')).split('x').map(Number);
const budgetMs = Number(opt('budget', 60)) * 1000;
const maxShots = Number(opt('max', 14));
const tag = opt('tag', ''); // fresh folder per re-shoot so stale shots never mix in
const base = process.env.QA_PARTY_URL ?? 'http://127.0.0.1:5186';
if (!games.length) { console.error('usage: --games a,b [--lang de|en]'); process.exit(2); }
const REGISTRY = fs.readFileSync('src/lib/playable-games.ts', 'utf8');
const ALL_GAMES = [...REGISTRY.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map(m => m[1]);
const minPlayers = id => { const entry = REGISTRY.split('{').find(e => e.includes(`id: "${id}"`)) ?? ''; return Number((entry.match(/minPlayers:\s*(\d+)/) ?? [])[1] ?? 2); };

const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
try {
  for (const game of games) {
    const out = `scripts/tmp/party-play/design-capture/${tag ? `${tag}/` : ''}${lang}/${game}`; fs.mkdirSync(out, { recursive: true });
    const index = [`# ${game} (${lang}, phone ${vw}×${vh}, TV 1920×1080)`, ''];
    const h = await createHarness({ out, base, lang, phoneViewport: { width: vw, height: vh }, browser });
    try {
      const { host, code } = await createParty(h);
      // Guests play in every game (QA switch); without it unadapted games would let them sit out.
      await host.page.evaluate(g => { window.__partyPlayForceShared = g; }, ALL_GAMES);
      const tv = await connectTv(h, host);
      await addGuest({ notes: [] }, host, code, 'ALEXANDRA-MARIE');
      const lena = await joinPhone(h, { notes: [] }, host, code, 'Lena'); await ready(lena);
      // Games with a higher minimum (taboo, pantomime, …) get extra phones; only Lena is captured.
      const extra = []; for (let i = 3; i < minPlayers(game); i++) { const p = await joinPhone(h, { notes: [] }, host, code, `Spieler${i}`); await ready(p); extra.push(p); }
      const devices = [host, lena, tv]; const last = new Map(); const counts = new Map(); let n = 0;
      const capture = async (label = '') => {
        for (const d of devices) {
          if ((counts.get(d) ?? 0) >= maxShots) continue;
          // Digits masked: a ticking timer alone is not a new design state.
          const fp = (await fingerprint(d).catch(() => '')).replace(/[0-9]+/g, '#'); if (!fp || fp === last.get(d)) continue;
          last.set(d, fp); counts.set(d, (counts.get(d) ?? 0) + 1); n++;
          const file = `${String(n).padStart(2, '0')}-${d.name}.png`;
          await d.page.screenshot({ path: `${out}/${file}` }).catch(() => {});
          const text = (await d.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 110);
          index.push(`- ${file} — ${d.name}${label ? ` (${label})` : ''}: ${text}`);
        }
      };
      await capture('lobby');
      await startGame(host, [game]); await pause(800); await capture('start / countdown');
      await hostSetup(host, game, 8000); await capture('after setup');
      await playMatch(h, host, game, await deviceMap(host, [lena, ...extra]), { budgetMs, onTick: async () => { await capture(); }, onHandover: async info => { await capture(`handover ${info.step}`); } });
      await capture('end'); console.log(`${game} (${lang}): ${n} shots`);
    } catch (e) { index.push('', `Capture stopped: ${String(e.message ?? e).slice(0, 200)}`); console.log(`${game} (${lang}): stopped — ${e.message}`); }
    finally { fs.writeFileSync(`${out}/index.md`, index.join('\n') + '\n'); await h.close(); }
  }
} finally { await browser.close(); }
