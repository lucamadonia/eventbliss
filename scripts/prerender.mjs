/**
 * Prerenderer for the key public pages.
 *
 * Primary path: spin up Vite's preview server over the built dist/, drive a
 * headless Chromium (Puppeteer) to each static route, let the SPA render +
 * useSEO apply, and snapshot the FULL HTML (head + body) into
 * dist/<route>/index.html. Vercel serves these static files before the SPA
 * rewrite, so crawlers / AI-GEO engines / social scrapers get real content +
 * per-page meta. The client app still boots (createRoot) and takes over.
 *
 * Fallback path (no Puppeteer / Chromium can't launch, e.g. some CI): inject
 * just the per-route <head> meta (title/description/canonical/OG/Twitter) into
 * the built shell. Head meta is what snippets + social cards consume, so SEO
 * value is preserved even when full rendering isn't possible. The build never
 * fails because of this script.
 *
 * Skipped for Capacitor (native) builds.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const SITE = "https://event-bliss.com";
const OG = `${SITE}/og-image.png`;
const PORT = 41739;

if (process.env.CAPACITOR_BUILD) {
  console.log("prerender: skipped (CAPACITOR_BUILD).");
  process.exit(0);
}

// route → meta (mirror of each page's useSEO call) — used for the fallback
const PAGES = {
  "/games": {
    title: "Party Games — 24+ Free Group Games for Any Event | EventBliss",
    description: "Play 24+ free party games for bachelor & bachelorette parties, birthdays and group events — no install, works on any phone or on the big screen via TV mode.",
  },
  "/marketplace": {
    title: "Event Services Marketplace — Book Party & Event Pros | EventBliss",
    description: "Browse and book vetted agencies and services for bachelor parties, weddings, birthdays and group events across Europe — compare offers, prices and reviews.",
  },
  "/agency/pricing": {
    title: "EventBliss for Agencies — Pricing & Plans",
    description: "Plans and pricing for event agencies: list your services, receive bookings and grow with the EventBliss marketplace. Start free.",
  },
  "/legal/imprint": {
    title: "Imprint | EventBliss",
    description: "Legal information and company details for EventBliss — operated by MYFAMBLISS GROUP LTD, Paphos, Cyprus.",
  },
  "/legal/privacy": {
    title: "Privacy Policy | EventBliss",
    description: "How EventBliss collects, uses, stores and protects your personal data — your privacy rights and our data practices.",
  },
  "/legal/terms": {
    title: "Terms of Service | EventBliss",
    description: "The terms and conditions governing your use of EventBliss — accounts, services, payments and responsibilities.",
  },
  "/legal/disclaimer": {
    title: "Disclaimer | EventBliss",
    description: "Liability, content and external-link disclaimer for the EventBliss platform.",
  },
  "/legal/agency-agreement": {
    title: "Agency Partner Agreement | EventBliss",
    description: "Partnership agreement terms for agencies joining the EventBliss marketplace.",
  },
};
const ROUTES = Object.keys(PAGES);

// ── Fallback: head-meta injection into the built shell ────────────────
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const shell = existsSync(join(DIST, "index.html")) ? readFileSync(join(DIST, "index.html"), "utf8") : null;
function setTitle(html, v) { return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(v)}</title>`); }
function setMeta(html, sel, key, value) {
  const re = new RegExp(`(<meta\\s+${sel}="${key.replace(/[:]/g, "\\$&")}"\\s+content=")[^"]*(")`, "i");
  if (re.test(html)) return html.replace(re, `$1${attr(value)}$2`);
  return html.replace("</head>", `    <meta ${sel}="${key}" content="${attr(value)}" />\n  </head>`);
}
function setCanonical(html, href) {
  const re = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  if (re.test(html)) return html.replace(re, `$1${attr(href)}$2`);
  return html.replace("</head>", `    <link rel="canonical" href="${attr(href)}" />\n  </head>`);
}
function metaInject(route) {
  if (!shell) return null;
  const url = `${SITE}${route}`;
  const m = PAGES[route];
  let html = shell;
  html = setTitle(html, m.title);
  html = setMeta(html, "name", "title", m.title);
  html = setMeta(html, "name", "description", m.description);
  html = setMeta(html, "property", "og:title", m.title);
  html = setMeta(html, "property", "og:description", m.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", OG);
  html = setMeta(html, "name", "twitter:title", m.title);
  html = setMeta(html, "name", "twitter:description", m.description);
  html = setMeta(html, "name", "twitter:url", url);
  html = setCanonical(html, url);
  return html;
}

function writeRoute(route, html) {
  const dir = join(DIST, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

// ── Primary: full render via Vite preview + Puppeteer ─────────────────
async function startBrowser() {
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch {
    console.warn("prerender: puppeteer not installed — using head-meta fallback.");
    return null;
  }
  let server;
  try {
    const { preview } = await import("vite");
    server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
  } catch (e) {
    console.warn(`prerender: vite preview failed (${e?.message ?? e}) — fallback.`);
    return null;
  }
  let launchOpts = {
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  };
  // On Vercel's build container the bundled Chromium can't launch (missing libs).
  // @sparticuz/chromium ships a Lambda/Vercel-compatible headless build.
  if (process.env.VERCEL) {
    try {
      const chromium = (await import("@sparticuz/chromium")).default;
      launchOpts = {
        args: [...chromium.args, "--disable-dev-shm-usage"],
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
      console.log("prerender: using @sparticuz/chromium (Vercel).");
    } catch (e) {
      console.warn(`prerender: @sparticuz/chromium unavailable (${e?.message ?? e}).`);
    }
  }
  let browser;
  try {
    browser = await puppeteer.launch(launchOpts);
  } catch (e1) {
    // Non-Vercel CI: bundled Chromium may be missing — install once and retry.
    console.warn(`prerender: first Chromium launch failed (${e1?.message ?? e1}); installing browser…`);
    try {
      const { execSync } = await import("child_process");
      execSync("node node_modules/puppeteer/install.mjs", { stdio: "inherit" });
      browser = await puppeteer.launch(launchOpts);
    } catch (e2) {
      console.warn(`prerender: Chromium unavailable (${e2?.message ?? e2}) — head-meta fallback.`);
      try { server.httpServer?.close(); } catch { /* noop */ }
      return null;
    }
  }
  return { browser, server };
}

let ctx = null;
try {
  ctx = await startBrowser();
} catch (e) {
  console.warn(`prerender: setup failed (${e?.message ?? e}) — fallback.`);
}

let full = 0;
let meta = 0;
for (const route of ROUTES) {
  let html = null;
  if (ctx?.browser) {
    let page;
    try {
      page = await ctx.browser.newPage();
      // domcontentloaded (not networkidle0, which can hang on websockets like
      // Supabase realtime), then wait for the SPA to paint real text content.
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(
        () => {
          const r = document.querySelector("#root");
          return r && r.innerText && r.innerText.replace(/\s/g, "").length > 80;
        },
        { timeout: 35000, polling: 250 },
      );
      await new Promise((r) => setTimeout(r, 900)); // let useSEO set head tags
      html = "<!doctype html>\n" + (await page.content()).replace(/^<!doctype html>/i, "");
      full++;
    } catch (e) {
      console.warn(`prerender ✗ full ${route}: ${e?.message ?? e} — meta fallback.`);
      html = null;
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
  if (!html) {
    html = metaInject(route);
    if (html) meta++;
  }
  if (html) {
    writeRoute(route, html);
  } else {
    console.warn(`prerender: no output for ${route} (no shell).`);
  }
}

if (ctx) {
  try { await ctx.browser.close(); } catch { /* noop */ }
  try { ctx.server.httpServer?.close(); } catch { /* noop */ }
}
console.log(`prerender: ${full} full-render + ${meta} meta-only = ${full + meta}/${ROUTES.length} pages.`);
process.exit(0);
