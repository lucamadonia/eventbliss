// Party-Play multi-device harness: N phones + host + TV (1920x1080) in isolated
// browser contexts, PGlite (default) or real local Supabase (--real), synthetic
// realtime broker with chaos (delay/drop/disconnect), per-step screenshots and
// per-scene timestamps. Used by party-play-browser.mjs; see docs/qa/party-play-*.md.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { createDB } from './controller-db.mjs';
import { createRealDB } from './controller-real-db.mjs';

export const pause = ms => new Promise(r => setTimeout(r, ms));
export class NotImplemented extends Error { constructor(what) { super(`not implemented: ${what}`); this.name = 'NotImplemented'; } }
export class Inconclusive extends Error { constructor(why) { super(why); this.name = 'Inconclusive'; } }
export class Deferred extends Error { constructor(why) { super(why); this.name = 'Deferred'; } }
export class Manual extends Error { constructor(why) { super(why); this.name = 'Manual'; } }
export const assert = (value, label) => { if (!value) throw new Error(label); };

// --- static feature detection: a test id that exists nowhere in src/ is "not built yet", not a bug.
let sourceCache = null;
export function sourceText(refresh = false) {
  if (sourceCache && !refresh) return sourceCache;
  const parts = [];
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name)) parts.push(fs.readFileSync(p, 'utf8')); } };
  walk('src'); return (sourceCache = parts.join('\n'));
}
/** True if the app source mentions the test id (exact or as `${prefix}` template). */
export const hasTestId = id => {
  const s = sourceText();
  if (s.includes(`"${id}"`) || s.includes(`'${id}'`) || s.includes(`\`${id}`) || s.includes(`${id}\${`) || s.includes(`${id}-\${`)) return true;
  // Templated ids such as `kick-mode-${option}` cover concrete ids like kick-mode-party.
  const prefixes = [...s.matchAll(/(?:data-testid=\{`|testId[=:]\s*\{?`)([a-z0-9-]+)\$\{/g)].map(m => m[1]);
  return prefixes.some(p => id.startsWith(p));
};
export function need(...ids) { const missing = ids.filter(id => !hasTestId(id)); if (missing.length) throw new NotImplemented(`data-testid ${missing.join(', ')}`); }
export function needSource(pattern, what) { if (!pattern.test(sourceText())) throw new NotImplemented(what); }

let accountCounter = 0;
const newAccount = () => `00000000-0000-4000-8000-${String(++accountCounter).padStart(12, '0')}`;

export async function createHarness({ real = false, out, base, chaos = null, lang = 'en', browser: shared = null }) {
  fs.mkdirSync(out, { recursive: true });
  const db = real ? await createRealDB() : await createDB();
  const browser = shared ?? await puppeteer.launch({ headless: true, protocolTimeout: 180000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const channels = new Map(); const clients = []; const stats = { packets: 0, dropped: 0, delayedMs: 0, rpc: [] };
  let step = 0;
  const h = { db, browser, clients, stats, out, real, chaos, errors: [] };

  const rand = ([a, b]) => a + Math.random() * (b - a);
  const netOf = page => clients.find(c => c.page === page)?.net ?? {};
  async function deliver(ch, message, { droppable = false } = {}) {
    if (ch.page.isClosed()) return;
    const net = netOf(ch.page), cfg = { ...(chaos ?? {}), ...net };
    if (net.offline) return;
    if (droppable && cfg.drop && Math.random() < cfg.drop) { stats.dropped++; return; }
    const delay = cfg.delay ? rand(cfg.delay) : 0; stats.delayedMs += delay;
    if (delay) await pause(delay);
    if (ch.page.isClosed() || !channels.has(ch.id) && message.kind !== 'disconnect') return;
    await ch.page.evaluate(packet => window.controllerDeliver?.(packet), { id: ch.id, ...message }).catch(e => { if (!/closed|detached|destroyed|navigat/i.test(String(e))) h.errors.push(String(e)); });
  }
  async function sync(topic) {
    const relevant = [...channels.values()].filter(ch => ch.topic === topic);
    const presence = Object.fromEntries(relevant.filter(ch => ch.presence && !netOf(ch.page).offline).map(ch => [ch.presence.id ?? ch.id, [ch.presence]]));
    await Promise.all(relevant.map(ch => deliver(ch, { kind: 'presence', presence })));
  }
  async function wire(page, packet) {
    if (packet.kind === 'subscribe') { channels.set(packet.id, { id: packet.id, topic: packet.topic, page, presence: null }); return; }
    const ch = channels.get(packet.id); if (!ch) return;
    if (netOf(page).offline) return;
    if (packet.kind === 'track') { ch.presence = packet.presence; setTimeout(() => void sync(ch.topic), 5); }
    if (packet.kind === 'remove') { channels.delete(ch.id); setTimeout(() => void sync(ch.topic), 5); }
    if (packet.kind === 'send') {
      stats.packets++;
      setTimeout(() => { for (const peer of channels.values()) if (peer !== ch && peer.topic === ch.topic) void deliver(peer, { kind: 'broadcast', message: packet.message }, { droppable: true }); }, 5);
    }
  }
  /** Drop every channel of this page (simulated network loss) and tell the app. */
  h.disconnect = async client => {
    for (const ch of [...channels.values()].filter(ch => ch.page === client.page)) { channels.delete(ch.id); await deliver(ch, { kind: 'disconnect' }); await sync(ch.topic); }
  };

  /**
   * Opens a device. kind: 'phone' (390x900) | 'tv' (1920x1080). identity:false = signed out (A03).
   * clockSkewMs shifts Date.now() only (T-3); trace timestamps use performance time and stay true.
   */
  h.open = async (name, { route = '/party/controllers', kind = 'phone', account, premium = false, identity = true, clockSkewMs = 0, net = {}, language = lang } = {}) => {
    account ??= newAccount();
    let credentials = null;
    if (!kind.startsWith('tv') || real) { credentials = await db.seedUser(account, { premium }); if (real) account = credentials.userId; }
    const context = await browser.createBrowserContext(); const page = await context.newPage();
    await page.setViewport(kind === 'tv' ? { width: 1920, height: 1080 } : { width: 390, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const client = { name, kind, page, context, account, net: { ...net }, console: [], errors: [], shots: [] };
    if (!real) {
      await page.setRequestInterception(true);
      page.on('request', r => { const u = new URL(r.url()); if (u.origin === base || ['data:', 'blob:'].includes(u.protocol)) void r.continue(); else void r.abort('blockedbyclient'); });
      await page.exposeFunction('controllerWire', packet => wire(page, packet));
      await page.exposeFunction('controllerRPC', async args => {
        const cfg = { ...(chaos ?? {}), ...client.net };
        if (client.net.offline) return { data: null, error: { message: 'Failed to fetch' } };
        if (cfg.delay) await pause(rand(cfg.delay) / 2);
        try {
          const data = await db.request(client.account, args.action, args.code, args.payload);
          if (args.action !== 'read') stats.rpc.push({ who: name, action: args.action, revision: data?.party?.revision, at: Date.now() });
          if (cfg.delay) await pause(rand(cfg.delay) / 2);
          return { data, error: null };
        } catch (e) { stats.rpc.push({ who: name, action: args.action, error: e.message, at: Date.now() }); return { data: null, error: { message: e.message } }; }
      });
    }
    const id = identity ? { id: account, user_metadata: { display_name: name } } : null;
    await page.evaluateOnNewDocument(p => { window.controllerPremium = p; }, premium);
    await page.evaluateOnNewDocument((id, route, credentials, skew, language) => {
      window.controllerIdentity = id; window.controllerInitialRoute = route; window.controllerCredentials = credentials; window.qaLanguage = language;
      if (skew) { const real = Date.now; Date.now = () => real() + skew; }
      const Native = WebSocket; class Quiet extends EventTarget { readyState = 0; send() {} close() {} }
      window.WebSocket = new Proxy(Native, { construct(t, a) { return a[1] === 'vite-hmr' ? new Quiet() : Reflect.construct(t, a); } });
    }, id, route, real ? { email: credentials.email, password: credentials.password } : null, clockSkewMs, language);
    page.on('pageerror', e => { client.errors.push(e.message); });
    page.on('console', m => { if (m.type() === 'error') client.console.push(m.text().slice(0, 400)); });
    page.on('framenavigated', f => { if (f === page.mainFrame()) for (const ch of [...channels.values()]) if (ch.page === page) { channels.delete(ch.id); void sync(ch.topic); } });
    await page.goto(`${base}/scripts/qa/party-play.html`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => !!window.controllerQA, { timeout: 90000 });
    Object.assign(client, clientApi(client, h));
    clients.push(client); return client;
  };
  h.tv = (code, opts = {}) => h.open(opts.name ?? 'TV', { ...opts, kind: 'tv', route: `/tv/${code}` });

  /** Screenshot every open device with a running step number. */
  h.shotAll = async label => { step++; for (const c of clients) if (!c.page.isClosed()) await c.shot(`${String(step).padStart(2, '0')}-${label}`); };
  h.consoleErrors = () => clients.flatMap(c => [...c.errors.map(e => `${c.name}: ${e}`)]);
  h.close = async () => { for (const c of clients) await c.context.close().catch(() => {}); if (!shared) await browser.close(); await db.close().catch(() => {}); };
  return h;
}

function clientApi(c, h) {
  const { page } = c;
  const sel = id => `[data-testid="${id}"]`;
  const api = {
    // Several components may share a test id (one hidden, e.g. during a transition): always act on the first VISIBLE match.
    async exists(id) { return page.evaluate(s => [...document.querySelectorAll(s)].some(n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; }), sel(id)).catch(() => false); },
    async wait(id, { timeout = 15000, gone = false } = {}) {
      try { await page.waitForFunction((s, gone) => { const vis = [...document.querySelectorAll(s)].some(n => n.getBoundingClientRect().height > 0); return gone ? !vis : vis; }, { timeout, polling: 100 }, sel(id), gone); }
      catch { throw new Error(`${c.name}: ${gone ? 'still shows' : 'never showed'} [${id}] within ${timeout} ms (route ${await api.route().catch(() => '?')})`); }
    },
    async waitAny(ids, timeout = 15000) {
      const handle = await page.waitForFunction(ids => ids.find(id => [...document.querySelectorAll(`[data-testid="${id}"]`)].some(n => n.getBoundingClientRect().height > 0)), { timeout, polling: 100 }, ids).catch(() => null);
      return handle ? handle.jsonValue() : null;
    },
    visible: id => page.evaluateHandle(s => [...document.querySelectorAll(s)].find(n => n.getBoundingClientRect().height > 0) ?? null, sel(id)),
    async click(id, { timeout = 15000 } = {}) {
      await api.wait(id, { timeout });
      await page.waitForFunction(s => { const n = [...document.querySelectorAll(s)].find(n => n.getBoundingClientRect().height > 0); return n && !n.disabled && n.getAttribute('aria-disabled') !== 'true'; }, { timeout, polling: 100 }, sel(id))
        .catch(async () => { throw new Error(`${c.name}: [${id}] stayed disabled (${await api.attr(id, 'data-disabled-reason')})`); });
      const el = (await api.visible(id)).asElement(); if (!el) throw new Error(`${c.name}: [${id}] vanished before click`);
      await el.evaluate(n => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await el.click().catch(async e => { if (/not clickable|detached|not an Element/i.test(String(e))) await el.evaluate(n => n.click()); else throw e; }); await pause(150);
    },
    async type(id, text, { clear = true } = {}) {
      await api.wait(id); const el = (await api.visible(id)).asElement();
      if (clear) await el.evaluate(n => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(n), 'value').set; set.call(n, ''); n.dispatchEvent(new Event('input', { bubbles: true })); });
      await el.type(text);
    },
    /** Press-and-hold (secret handover, 600 ms): pointerdown → wait → pointerup on the visible element. */
    async hold(id, ms = 700) {
      await api.wait(id); await pause(450); // 400 ms double-tap guard after the screen appears
      const el = (await api.visible(id)).asElement(); const box = await el.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await pause(ms); await page.mouse.up(); await pause(200);
    },
    // Several components may share a test id (e.g. setlist hints); prefer the visible one.
    attr: (id, name) => page.$$eval(sel(id), (ns, name) => { const n = ns.find(n => n.getBoundingClientRect().height > 0) ?? ns[0]; return n ? n.getAttribute(name) : null; }, name).catch(() => null),
    attrs: (prefix, name) => page.$$eval(`[data-testid^="${prefix}"]`, (ns, name) => ns.map(n => ({ id: n.getAttribute('data-testid'), value: n.getAttribute(name), text: n.innerText.trim() })), name),
    textOf: id => page.$$eval(sel(id), ns => { const n = ns.find(n => n.getBoundingClientRect().height > 0) ?? ns[0]; return n ? n.innerText.trim() : null; }).catch(() => null),
    text: () => page.evaluate(() => document.body.innerText),
    route: () => page.evaluate(() => window.controllerQA?.route?.() ?? location.pathname),
    snapshot: () => page.evaluate(() => controllerQA.snapshot()),
    state: () => page.evaluate(() => { const s = controllerQA.state(); return { ...s, data: s.data }; }),
    party: () => page.evaluate(() => controllerQA.state().data),
    /** Server action as this device's account; returns {data} or {error}. */
    request: (action, code, payload = {}) => page.evaluate((a, c, p) => controllerQA.request(a, c, p).then(data => ({ data }), e => ({ error: e.message })), action, code, payload),
    trace: () => page.evaluate(() => window.__partyPlayTrace ?? []),
    seen: () => page.evaluate(() => window.__qaSeenLog ?? []),
    tvMessages: () => page.evaluate(() => window.controllerTVMessages ?? []),
    gameState: event => page.evaluate(e => window.controllerGameStates?.[e] ?? null, event),
    async clickText(pattern, timeout = 15000) {
      const ok = await page.waitForFunction(p => [...document.querySelectorAll('button,[role=button]')].some(b => !b.disabled && b.getBoundingClientRect().height && new RegExp(p, 'i').test(b.innerText.trim())), { timeout, polling: 100 }, pattern).then(() => true, () => false);
      if (!ok) return false;
      return page.evaluate(p => { const b = [...document.querySelectorAll('button,[role=button]')].find(b => !b.disabled && b.getBoundingClientRect().height && new RegExp(p, 'i').test(b.innerText.trim())); b.scrollIntoView({ block: 'center' }); b.click(); return true; }, pattern);
    },
    async shot(label) { if (page.isClosed()) return; const file = path.join(h.out, `${label}-${c.name.replace(/\W+/g, '_')}.png`); await page.screenshot({ path: file }).catch(() => {}); c.shots.push(file); return file; },
    /** route: where the app starts after the reload (default: the original start route, e.g. the invite link). */
    async reload({ route } = {}) { if (route) await page.evaluateOnNewDocument(r => { window.controllerInitialRoute = r; }, route); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => !!window.controllerQA, { timeout: 90000 }); },
    // Explicit error path: the app first receives CHANNEL_ERROR, then the device goes silent.
    async offline(on) { if (on) await h.disconnect(c); c.net.offline = on; if (h.real) await page.setOfflineMode(on); },
    /** Waits until fn(client) is truthy; fn runs in Node. */
    async until(fn, label, timeout = 15000) { const end = Date.now() + timeout; while (Date.now() < end) { try { if (await fn(c)) return; } catch { /* page mid-navigation */ } await pause(120); } throw new Error(`${c.name}: ${label} (timeout ${timeout} ms)`); },
  };
  return api;
}

/** Skew per scene across devices from __partyPlayTrace entries (kind 'scene'). */
export function sceneSkew(traces) {
  const byScene = new Map();
  // Persistent scenes (lobby:<code>) are shown whenever a device arrives; only planned transitions count.
  for (const { device, entries } of traces) for (const e of entries) if (e.kind === 'scene' && e.scene !== 'lobby' && !String(e.sceneId).startsWith('lobby:')) {
    const list = byScene.get(e.sceneId) ?? []; byScene.set(e.sceneId, list);
    // lag: server time when the device showed the scene minus its planned startsAt.
    list.push({ device, shownAt: e.shownAt, late: e.late, scene: e.scene, lag: Math.round(e.localNow + e.offsetMs - e.startsAt) });
  }
  return [...byScene.entries()].filter(([, l]) => l.length > 1).map(([sceneId, l]) => {
    const times = l.map(x => x.shownAt); return { sceneId, scene: l[0].scene, devices: l.length, skewMs: Math.round(Math.max(...times) - Math.min(...times)), late: l.filter(x => x.late).map(x => x.device), lagMs: Object.fromEntries(l.map(x => [x.device, x.lag])) };
  });
}
