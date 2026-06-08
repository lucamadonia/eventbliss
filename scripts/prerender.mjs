/**
 * Static meta prerenderer for the key public pages — browserless.
 *
 * The app is a client SPA, so non-JS crawlers (many AI/GEO engines and social
 * preview scrapers) only ever see the default index.html <head>. This script
 * takes the freshly-built dist/index.html (which has the correct hashed asset
 * tags) and, per static route, writes dist/<route>/index.html with the
 * route-specific <title>, description, canonical, Open Graph and Twitter tags
 * injected. Vercel serves these static files before the SPA rewrite, so
 * crawlers get correct per-page meta + social previews; the React app still
 * boots and hydrates normally for users.
 *
 * No headless browser is used (Puppeteer can't be installed in this repo due to
 * unresolvable local `@repo/*` / `link:` deps, and Chromium-in-CI is brittle).
 * The <body> stays client-rendered; <head> meta is what search snippets, social
 * cards and JSON-LD consumers read, which is the bulk of the ranking/CTR value.
 *
 * Keep this map in sync with each page's useSEO() call. Skipped for Capacitor.
 *
 * Runs in the build after `vite build`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const SITE = "https://event-bliss.com";
const OG = `${SITE}/og-image.png`;

if (process.env.CAPACITOR_BUILD) {
  console.log("prerender: skipped (CAPACITOR_BUILD).");
  process.exit(0);
}

// route → meta (mirror of each page's useSEO call)
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

const shellPath = join(DIST, "index.html");
if (!existsSync(shellPath)) {
  console.warn("prerender: dist/index.html not found — run after vite build. Skipping.");
  process.exit(0);
}
const shell = readFileSync(shellPath, "utf8");

const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function setTitle(html, v) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(v)}</title>`);
}
function setMeta(html, sel, key, value) {
  // sel: 'name' | 'property'; key: the tag identifier (e.g. "og:title")
  const re = new RegExp(`(<meta\\s+${sel}="${key.replace(/[:]/g, "\\$&")}"\\s+content=")[^"]*(")`, "i");
  if (re.test(html)) return html.replace(re, `$1${attr(value)}$2`);
  return html.replace("</head>", `    <meta ${sel}="${key}" content="${attr(value)}" />\n  </head>`);
}
function setCanonical(html, href) {
  const re = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  if (re.test(html)) return html.replace(re, `$1${attr(href)}$2`);
  return html.replace("</head>", `    <link rel="canonical" href="${attr(href)}" />\n  </head>`);
}

let ok = 0;
for (const [route, meta] of Object.entries(PAGES)) {
  const url = `${SITE}${route}`;
  let html = shell;
  html = setTitle(html, meta.title);
  html = setMeta(html, "name", "title", meta.title);
  html = setMeta(html, "name", "description", meta.description);
  html = setMeta(html, "property", "og:title", meta.title);
  html = setMeta(html, "property", "og:description", meta.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", OG);
  html = setMeta(html, "name", "twitter:title", meta.title);
  html = setMeta(html, "name", "twitter:description", meta.description);
  html = setMeta(html, "name", "twitter:url", url);
  html = setCanonical(html, url);

  const dir = join(DIST, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  ok++;
}
console.log(`prerender (meta): ${ok}/${Object.keys(PAGES).length} static pages written.`);
