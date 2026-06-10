/**
 * Prerenderer for public pages — two tiers, both run in `build` after `vite build`.
 *
 * TIER 1 — full body render (Puppeteer): a small, finite set of high-value pages
 * (home, budget calculator ×10 langs, marketplace/games/pricing hubs, legal
 * pages without a static .html shadow). Boots Vite preview + headless Chromium
 * (via @sparticuz/chromium on Vercel) and snapshots the full rendered HTML into
 * dist/<route>/index.html (home → dist/home.html, served at "/" via vercel.json).
 *
 * TIER 2 — head-meta only (no browser): EVERY templated landing page (~2.6k):
 * all JGA/stag/hen city pages and activity-glossary pages, in all languages.
 * Per-page <title>/description/canonical/OG/Twitter + hreflang are injected into
 * the built shell. Meta is what social cards, search snippets and AI engines
 * read; the body stays client-rendered (Google executes JS). Templates are
 * loaded from the real TS modules via Vite ssrLoadModule (no duplication).
 *
 * Fully resilient: any failure degrades gracefully and never fails the build.
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
const LANGS = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr", "ar"];
const ACT_PATH = {
  de: "/ideen/", en: "/activities/", es: "/actividades/", fr: "/activites/",
  it: "/attivita/", pt: "/atividades/", nl: "/activiteiten/", pl: "/atrakcje/",
  tr: "/aktiviteler/", ar: "/anshita/",
};

if (process.env.CAPACITOR_BUILD) {
  console.log("prerender: skipped (CAPACITOR_BUILD).");
  process.exit(0);
}
if (!existsSync(join(DIST, "index.html"))) {
  console.warn("prerender: dist/index.html missing — run after vite build. Skipping.");
  process.exit(0);
}
const shell = readFileSync(join(DIST, "index.html"), "utf8");
// Neutral SPA shell for the catch-all rewrite (vercel.json → /app.html). Written
// first so it always exists; lets us overwrite dist/index.html with the
// body-rendered home for "/" without polluting the fallback for other routes.
writeFileSync(join(DIST, "app.html"), shell);

// ── HTML meta injection ───────────────────────────────────────────────
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
function setTitle(h, v) { return h.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(v)}</title>`); }
function setMeta(h, sel, key, value) {
  const re = new RegExp(`(<meta\\s+${sel}="${key.replace(/[:]/g, "\\$&")}"\\s+content=")[^"]*(")`, "i");
  return re.test(h) ? h.replace(re, `$1${attr(value)}$2`)
    : h.replace("</head>", `    <meta ${sel}="${key}" content="${attr(value)}" />\n  </head>`);
}
function setCanonical(h, href) {
  const re = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  return re.test(h) ? h.replace(re, `$1${attr(href)}$2`)
    : h.replace("</head>", `    <link rel="canonical" href="${attr(href)}" />\n  </head>`);
}
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildHtml({ title, description, canonical, ogImage = OG, ogType = "article", hreflangs = [], body = "" }) {
  let h = shell;
  h = setTitle(h, title);
  h = setMeta(h, "name", "title", title);
  if (description) h = setMeta(h, "name", "description", description);
  h = setMeta(h, "property", "og:title", title);
  if (description) h = setMeta(h, "property", "og:description", description);
  h = setMeta(h, "property", "og:type", ogType);
  h = setMeta(h, "property", "og:url", canonical);
  h = setMeta(h, "property", "og:image", ogImage);
  h = setMeta(h, "name", "twitter:title", title);
  if (description) h = setMeta(h, "name", "twitter:description", description);
  h = setMeta(h, "name", "twitter:image", ogImage);
  h = setCanonical(h, canonical);
  if (hreflangs.length) {
    const links = hreflangs
      .map((a) => `    <link rel="alternate" hreflang="${a.hreflang}" href="${attr(a.href)}" />`)
      .join("\n");
    h = h.replace("</head>", `${links}\n  </head>`);
  }
  // Inject static, crawlable body content (read by non-JS AI crawlers; the SPA
  // replaces #root on mount for real users). No-op if body is empty.
  if (body) h = h.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return h;
}
function writeRoute(routePath, html) {
  const dir = join(DIST, routePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

// ── TIER 2: head-meta for all templated landing pages (no browser) ────
async function headMeta() {
  let vite;
  try {
    const { createServer } = await import("vite");
    vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
    const jga = await vite.ssrLoadModule("/src/lib/jga-cities.ts");
    const intl = await vite.ssrLoadModule("/src/lib/intl-cities.ts");
    const seo = await vite.ssrLoadModule("/src/lib/seo-routes.ts");
    const henMod = await vite.ssrLoadModule("/src/lib/hen-do-overlay.ts");
    const henIntl = await vite.ssrLoadModule("/src/lib/hen-do-overlay-intl.ts");
    const acts = await vite.ssrLoadModule("/src/lib/activities-library.ts");
    const actIntl = await vite.ssrLoadModule("/src/lib/activity-content-intl.ts");
    const actLabels = await vite.ssrLoadModule("/src/lib/activity-labels-i18n.ts");
    const labelOf = (lang, a) => actLabels.getActivityLabel(a.value, a.label, lang);
    const actContent = await vite.ssrLoadModule("/src/lib/activity-content.ts");
    const actEn = await vite.ssrLoadModule("/src/lib/activity-content-en.ts");
    const CF_DE = actContent.CATEGORY_FRAMEWORKS;
    const CF_EN = actEn.CATEGORY_FRAMEWORKS_EN;
    const CF_INTL = actIntl.CATEGORY_FRAMEWORKS_INTL;
    const getSpec = actContent.getActivitySpec;
    const localizeSpec = actIntl.localizeSpecValue;

    // Build a content-rich, crawlable body for an activity page from the data modules.
    const activityBody = (lang, a, label) => {
      try {
        const fw = lang === "de" ? CF_DE[a.category] : lang === "en" ? CF_EN[a.category] : CF_INTL[lang][a.category];
        if (!fw) return "";
        const la = { ...a, label }; // activity with the localized name for framework interpolation
        const spec = getSpec(a);
        const gs = lang === "de" || lang === "en" ? spec.groupSize : localizeSpec(spec.groupSize, lang);
        const du = lang === "de" || lang === "en" ? spec.duration : localizeSpec(spec.duration, lang);
        const li = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join("");
        const faqs = (fw.faqs(la) || []).map((f) => `<div><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("");
        return `<main><article>` +
          `<h1>${esc(label)}</h1>` +
          `<p>${esc(fw.introFor(la))}</p>` +
          `<ul><li>€${esc(String(spec.costFrom))}–€${esc(String(spec.costTo))}</li><li>${esc(gs)}</li><li>${esc(du)}</li></ul>` +
          `<ul>${li(fw.whenSection)}</ul>` +
          `<ul>${li(fw.whoSection)}</ul>` +
          `<p>${esc(fw.costExplain)}</p>` +
          `<ul>${li(fw.commonMistakes)}</ul>` +
          `<section>${faqs}</section>` +
          `</article></main>`;
      } catch { return ""; }
    };

    // Build a basic crawlable body for a city page (name + description + top activities).
    const cityBody = (lang, heading, description, activitySlugs) => {
      try {
        const items = (activitySlugs || []).slice(0, 12)
          .map((s) => { const a = acts.ACTIVITIES_LIBRARY.find((x) => x.value === s); return a ? `<li>${esc(labelOf(lang, a))}</li>` : ""; })
          .join("");
        return `<main><article><h1>${esc(heading)}</h1><p>${esc(description)}</p>${items ? `<section><ul>${items}</ul></section>` : ""}</article></main>`;
      } catch { return ""; }
    };
    const strip = (t) => t.replace(/\s*\|\s*EventBliss\s*$/, "");

    const { LANG_META, JGA_PATH, HEN_PATH, jgaHreflangs, henHreflangs, enSlugFromDe } = {
      ...intl, ...seo,
    };
    const HEN_DO_LANG_META = henIntl.HEN_DO_LANG_META;
    const ACTIVITY_LANG_META = actIntl.ACTIVITY_LANG_META;
    const enOf = seo.enSlugFromDe || henMod.enSlugFromDe;

    const jgaTitle = (lang, c) =>
      lang === "de" ? `JGA ${c.name} — Ideen, Aktivitäten & Planung | EventBliss`
        : lang === "en" ? `Stag Do in ${c.name} — Activities, Bars & Budget | EventBliss`
          : LANG_META[lang].titleTpl(c.name);
    const jgaDesc = (lang, c) =>
      lang === "de" ? `Junggesellenabschied ${c.nameLocative}: Aktivitäten, beste Viertel, Budgetplanung, Insider-Tipps. Plant euren JGA in Minuten mit der EventBliss-App.`
        : lang === "en" ? `Stag do in ${c.name}: top activities, best neighbourhoods, budget breakdown, insider tips. Plan your stag weekend in minutes with EventBliss.`
          : LANG_META[lang].descriptionTpl(c.name);
    const henTitle = (lang, name) =>
      lang === "de" ? `Junggesellinnenabschied ${name} — Ideen & Spa-Programm | EventBliss`
        : lang === "en" ? `Hen Do in ${name} — Ideas, Spa & Cocktails | EventBliss`
          : HEN_DO_LANG_META[lang].titleTpl(name);
    const henDesc = (lang, name, loc) =>
      lang === "de" ? `JGA Frauen ${loc}: Spa, Cocktail-Workshop, Brunch, Bootstour. Plant in Minuten mit EventBliss.`
        : lang === "en" ? `Hen do in ${name}: spa, cocktail workshop, brunch, boat tour. Plan in minutes with EventBliss.`
          : HEN_DO_LANG_META[lang].descriptionTpl(name);
    const actTitle = (lang, label) =>
      lang === "de" ? `${label} für JGA — Ideen, Kosten & Top-Städte | EventBliss`
        : lang === "en" ? `${label} for a Stag Do — Ideas, Costs & Top Cities | EventBliss`
          : ACTIVITY_LANG_META[lang].titleTpl(label);
    const actDesc = (lang, label) =>
      lang === "de" ? `${label} als JGA-Aktivität: Kosten pro Person, ideale Gruppengröße, beste Städte. Jetzt mit EventBliss planen.`
        : lang === "en" ? `${label} as a stag-do activity: cost per person, ideal group size, best cities. Plan with EventBliss.`
          : ACTIVITY_LANG_META[lang].descriptionTpl(label);

    let n = 0;
    // JGA / stag city pages
    for (const c of jga.JGA_CITIES) {
      const hl = jgaHreflangs(c.slug, SITE);
      const ogImg = `${SITE}/og/jga-${c.slug}.svg`;
      for (const lang of LANGS) {
        if (!hl.some((h) => h.hreflang === lang)) continue;
        const slug = lang === "de" ? c.slug : enOf(c.slug);
        const path = `${JGA_PATH[lang]}${slug}`;
        const t = jgaTitle(lang, c), d = jgaDesc(lang, c);
        writeRoute(path, buildHtml({ title: t, description: d, canonical: SITE + path, ogImage: ogImg, hreflangs: hl, body: cityBody(lang, strip(t), d, c.topActivitySlugs) }));
        n++;
      }
    }
    // Hen-do city pages
    for (const d of henMod.getAllHenDoCities()) {
      const deSlug = d.city.slug, name = d.city.name, loc = d.city.nameLocative;
      const hl = henHreflangs(deSlug, SITE);
      const ogImg = `${SITE}/og/jga-${deSlug}.svg`;
      for (const lang of LANGS) {
        if (!hl.some((h) => h.hreflang === lang)) continue;
        const slug = lang === "de" ? deSlug : enOf(deSlug);
        const path = `${HEN_PATH[lang]}${slug}`;
        const t = henTitle(lang, name), desc = henDesc(lang, name, loc);
        writeRoute(path, buildHtml({ title: t, description: desc, canonical: SITE + path, ogImage: ogImg, hreflangs: hl, body: cityBody(lang, strip(t), desc, d.city.topActivitySlugs) }));
        n++;
      }
    }
    // Activity glossary pages (all 10 languages each)
    for (const a of acts.ACTIVITIES_LIBRARY) {
      const hl = LANGS.map((l) => ({ hreflang: l, href: `${SITE}${ACT_PATH[l]}${a.value}` }));
      hl.push({ hreflang: "x-default", href: `${SITE}${ACT_PATH.en}${a.value}` });
      const ogImg = `${SITE}/og/ideen-${a.value}.svg`;
      for (const lang of LANGS) {
        const path = `${ACT_PATH[lang]}${a.value}`;
        const lbl = labelOf(lang, a);
        writeRoute(path, buildHtml({ title: actTitle(lang, lbl), description: actDesc(lang, lbl), canonical: SITE + path, ogImage: ogImg, hreflangs: hl, body: activityBody(lang, a, lbl) }));
        n++;
      }
    }
    console.log(`prerender: head-meta written for ${n} landing pages.`);
  } catch (e) {
    console.warn(`prerender: head-meta step failed (${e?.message ?? e}) — landing pages stay client-rendered.`);
  } finally {
    try { await vite?.close(); } catch { /* noop */ }
  }
}

// ── TIER 1: full body render of the finite high-value set ─────────────
const CALC = {
  "/jga/kalkulator": "JGA-Budget-Rechner — Kosten pro Person berechnen | EventBliss",
  "/stag-do/calculator": "Stag Do Budget Calculator — Cost Per Person | EventBliss",
  "/despedida/calculadora": "Calculadora de Despedida de Soltero — Coste por Persona | EventBliss",
  "/evg/calculatrice": "Calculateur EVG — Coût par Personne | EventBliss",
  "/addio/calcolatore": "Calcolatore Addio al Celibato — Costo a Persona | EventBliss",
  "/despedida-de-solteiro/calculadora": "Calculadora de Despedida de Solteiro — Custo por Pessoa | EventBliss",
  "/vrijgezellenfeest/calculator": "Vrijgezellenfeest-Calculator — Kosten per Persoon | EventBliss",
  "/wieczor-kawalerski/kalkulator": "Kalkulator Wieczoru Kawalerskiego — Koszt na Osobę | EventBliss",
  "/bekarliga-veda/hesaplayici": "Bekarlığa Veda Bütçe Hesaplayıcısı — Kişi Başı Maliyet | EventBliss",
  "/wadaa-azubiya/hasiba": "حاسبة ميزانية وداع العزوبية — التكلفة لكل شخص | EventBliss",
};
const STATIC = {
  "/games": { title: "Party Games — 24+ Free Group Games for Any Event | EventBliss", description: "Play 24+ free party games for bachelor & bachelorette parties, birthdays and group events — no install, works on any phone or on the big screen via TV mode." },
  "/marketplace": { title: "Event Services Marketplace — Book Party & Event Pros | EventBliss", description: "Browse and book vetted agencies and services for bachelor parties, weddings, birthdays and group events across Europe — compare offers, prices and reviews." },
  "/agency/pricing": { title: "EventBliss for Agencies — Pricing & Plans", description: "Plans and pricing for event agencies: list your services, receive bookings and grow with the EventBliss marketplace. Start free." },
  "/legal/imprint": { title: "Imprint | EventBliss", description: "Legal information and company details for EventBliss — operated by MYFAMBLISS GROUP LTD, Paphos, Cyprus." },
  "/legal/privacy": { title: "Privacy Policy | EventBliss", description: "How EventBliss collects, uses, stores and protects your personal data — your privacy rights and our data practices." },
  "/legal/terms": { title: "Terms of Service | EventBliss", description: "The terms and conditions governing your use of EventBliss — accounts, services, payments and responsibilities." },
  "/legal/disclaimer": { title: "Disclaimer | EventBliss", description: "Liability, content and external-link disclaimer for the EventBliss platform." },
  "/legal/agency-agreement": { title: "Agency Partner Agreement | EventBliss", description: "Partnership agreement terms for agencies joining the EventBliss marketplace." },
};
const HOME = { title: "EventBliss — Smart Event & Party Planning App | Bachelor Parties, Birthdays & Trips", description: "Plan bachelor parties, bachelorette celebrations, birthdays and group trips effortlessly — AI suggestions, automatic cost splitting, 24+ party games and real-time collaboration. 100% free." };

async function startBrowser() {
  let puppeteer;
  try { puppeteer = (await import("puppeteer")).default; }
  catch { console.warn("prerender: puppeteer missing — body pages use head-meta fallback."); return null; }
  let server;
  try {
    const { preview } = await import("vite");
    server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
  } catch (e) { console.warn(`prerender: vite preview failed (${e?.message ?? e}).`); return null; }
  let launchOpts = { headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] };
  if (process.env.VERCEL) {
    try {
      const chromium = (await import("@sparticuz/chromium")).default;
      launchOpts = { args: [...chromium.args, "--disable-dev-shm-usage"], executablePath: await chromium.executablePath(), headless: chromium.headless };
      console.log("prerender: using @sparticuz/chromium (Vercel).");
    } catch (e) { console.warn(`prerender: @sparticuz/chromium unavailable (${e?.message ?? e}).`); }
  }
  let browser;
  try { browser = await puppeteer.launch(launchOpts); }
  catch (e1) {
    try {
      const { execSync } = await import("child_process");
      execSync("node node_modules/puppeteer/install.mjs", { stdio: "inherit" });
      browser = await puppeteer.launch(launchOpts);
    } catch (e2) {
      console.warn(`prerender: Chromium unavailable (${e2?.message ?? e2}) — body pages use head-meta fallback.`);
      try { server.httpServer?.close(); } catch { /* noop */ }
      return null;
    }
  }
  return { browser, server };
}

async function renderFull(browser, route) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${PORT}${route === "/" ? "/" : route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => { const r = document.querySelector("#root"); return r && r.innerText && r.innerText.replace(/\s/g, "").length > 80; },
      { timeout: 35000, polling: 250 },
    );
    await new Promise((r) => setTimeout(r, 900));
    return "<!doctype html>\n" + (await page.content()).replace(/^<!doctype html>/i, "");
  } finally { await page.close().catch(() => {}); }
}

async function bodyTier() {
  const ctx = await startBrowser().catch(() => null);
  let full = 0, meta = 0;
  // route → {out, fallback{title,description,ogType}}
  const jobs = [];
  jobs.push({ route: "/", out: "__index__", fb: { ...HOME, ogType: "website" } });
  for (const [route, t] of Object.entries(CALC)) jobs.push({ route, out: route, fb: { title: t, description: t, ogType: "website" } });
  for (const [route, m] of Object.entries(STATIC)) jobs.push({ route, out: route, fb: { ...m, ogType: route.startsWith("/legal") ? "article" : "website" } });

  for (const job of jobs) {
    let html = null;
    if (ctx?.browser) {
      try { html = await renderFull(ctx.browser, job.route); full++; }
      catch (e) { console.warn(`prerender ✗ body ${job.route}: ${e?.message ?? e} — meta fallback.`); html = null; }
    }
    if (!html) {
      html = buildHtml({ title: job.fb.title, description: job.fb.description, canonical: `${SITE}${job.route === "/" ? "/" : job.route}`, ogType: job.fb.ogType });
      meta++;
    }
    if (job.out === "__index__") { writeFileSync(join(DIST, "index.html"), html); }
    else writeRoute(job.out, html);
  }
  if (ctx) {
    try { await ctx.browser.close(); } catch { /* noop */ }
    try { ctx.server.httpServer?.close(); } catch { /* noop */ }
  }
  console.log(`prerender: body tier — ${full} full-render + ${meta} meta-only.`);
}

// ── run ────────────────────────────────────────────────────────────────
await headMeta();
await bodyTier();
process.exit(0);
