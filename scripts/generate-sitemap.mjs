/**
 * Sitemap generator — single source of truth for ALL public URLs.
 *
 * Emits into public/:
 *   • sitemap-core.xml        static public pages (home, games, marketplace, pricing, legal)
 *   • sitemap-i18n.xml        bachelor/hen city pages, calculator, activity glossary (×10 langs, hreflang)
 *   • sitemap-marketplace.xml approved marketplace services + agencies (fetched from Supabase at build)
 *   • sitemap-index.xml       references the three above
 * Also removes the legacy hand-maintained public/sitemap.xml.
 *
 * Data is parsed from the TS sources (same approach as generate-og-images.mjs);
 * marketplace URLs come from Supabase via the public anon key.
 *
 * Run: node scripts/generate-sitemap.mjs   (or: npm run sitemap)
 */
import { writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE = "https://event-bliss.com";
const LASTMOD = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── env (.env files) → Supabase creds ─────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  for (const f of [".env", ".env.local", ".env.production"]) {
    try {
      for (const line of read(f).split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch { /* file may not exist */ }
  }
  return env;
}

// ── Path maps (mirror src/lib/seo-routes.ts) ──────────────────────────
const JGA_PATH = {
  de: "/jga/", en: "/stag-do/", es: "/despedida/", fr: "/evg/", it: "/addio/",
  pt: "/despedida-de-solteiro/", nl: "/vrijgezellenfeest/", pl: "/wieczor-kawalerski/",
  tr: "/bekarliga-veda/", ar: "/wadaa-azubiya/",
};
const HEN_PATH = {
  de: "/jga-frauen/", en: "/hen-do/", es: "/despedida-soltera/", fr: "/evjf/",
  it: "/addio-nubilato/", pt: "/despedida-de-solteira/", nl: "/vrijgezellinnenfeest/",
  pl: "/wieczor-panienski/", tr: "/kadin-bekarliga-veda/", ar: "/wadaa-azubiya-banat/",
};
const CALC_PATH = {
  de: "/jga/kalkulator", en: "/stag-do/calculator", es: "/despedida/calculadora",
  fr: "/evg/calculatrice", it: "/addio/calcolatore", pt: "/despedida-de-solteiro/calculadora",
  nl: "/vrijgezellenfeest/calculator", pl: "/wieczor-kawalerski/kalkulator",
  tr: "/bekarliga-veda/hesaplayici", ar: "/wadaa-azubiya/hasiba",
};
const ACT_PATH = {
  de: "/ideen/", en: "/activities/", es: "/actividades/", fr: "/activites/",
  it: "/attivita/", pt: "/atividades/", nl: "/activiteiten/", pl: "/atrakcje/",
  tr: "/aktiviteler/", ar: "/anshita/",
};
const EN_OF = {
  muenchen: "munich", koeln: "cologne", duesseldorf: "dusseldorf", wien: "vienna",
  zuerich: "zurich", nuernberg: "nuremberg", krakau: "krakow", prag: "prague",
  lissabon: "lisbon", rom: "rome", mailand: "milan", florenz: "florence",
  warschau: "warsaw", athen: "athens", kopenhagen: "copenhagen", bukarest: "bucharest",
  bruessel: "brussels", nizza: "nice",
};
const enOf = (de) => EN_OF[de] ?? de;

// ── Parse static data ─────────────────────────────────────────────────
const cityDe = [...read("src/lib/jga-cities.ts").matchAll(/slug:\s*"([^"]+)",\s*\n\s*name:\s*"/g)].map((m) => m[1]);
const activities = [...new Set([...read("src/lib/activities-library.ts").matchAll(/value:\s*'([a-z_]+)'/g)].map((m) => m[1]))];
const henBase = [...read("src/lib/hen-do-overlay.ts").matchAll(/\{\s*slug:\s*"([a-z-]+)"/g)].map((m) => m[1]);
const henIntl = new Set([...read("src/lib/hen-do-overlay-intl.ts").matchAll(/^\s{2}([a-z]+):\s*\{/gm)].map((m) => m[1]));
const intlArKeys = new Set([...read("src/lib/intl-cities-ar.ts").matchAll(/"([a-z-]+)":\s*\{/g)].map((m) => m[1]));
const henArKeys = new Set([...read("src/lib/hen-do-overlay-ar.ts").matchAll(/"([a-z-]+)":\s*\{/g)].map((m) => m[1]));

// ── XML builders ──────────────────────────────────────────────────────
function plainUrl(loc, priority, changefreq, lastmod = LASTMOD) {
  return `  <url>
    <loc>${xmlEsc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
function altUrl(loc, alternates, priority, changefreq) {
  const links = alternates
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${xmlEsc(a.href)}"/>`)
    .join("\n");
  return `  <url>
    <loc>${xmlEsc(loc)}</loc>
    <lastmod>${LASTMOD}</lastmod>
${links}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
const wrap = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

// ── 1. CORE (static public pages) ─────────────────────────────────────
// Homepage language cluster: unprefixed "/" (x-default) + /de … /ar, all sharing
// one hreflang set (mirrors src/lib/home-routes.ts).
const HOME_LANGS = ["de", "en", "es", "fr", "it", "nl", "pt", "pl", "tr", "ar"];
const homeAlt = HOME_LANGS.map((l) => ({ lang: l, href: `${SITE}/${l}` }));
homeAlt.push({ lang: "x-default", href: `${SITE}/` });
const core = [
  altUrl(`${SITE}/`, homeAlt, "1.0", "weekly"),
  ...HOME_LANGS.map((l) => altUrl(`${SITE}/${l}`, homeAlt, "1.0", "weekly")),
  plainUrl(`${SITE}/games`, "0.8", "weekly"),
  plainUrl(`${SITE}/marketplace`, "0.8", "weekly"),
  plainUrl(`${SITE}/agency/pricing`, "0.6", "monthly"),
  plainUrl(`${SITE}/support`, "0.5", "monthly"),
  ...["imprint", "privacy", "terms", "disclaimer", "agency-agreement"].map((p) =>
    plainUrl(`${SITE}/legal/${p}`, "0.3", "yearly")),
];

// Language-prefixed legal & support pages (constant English path segments,
// only the language prefix varies — mirrors src/lib/legal-routes.ts):
// 6 hreflang clusters × 10 languages; x-default → the unprefixed URL.
const STATIC_LANGS = ["de", "en", "es", "fr", "it", "nl", "pt", "pl", "tr", "ar"];
const STATIC_PAGES = [
  { base: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
  { base: "/legal/terms", priority: "0.3", changefreq: "yearly" },
  { base: "/legal/disclaimer", priority: "0.3", changefreq: "yearly" },
  { base: "/legal/imprint", priority: "0.3", changefreq: "yearly" },
  { base: "/legal/agency-agreement", priority: "0.3", changefreq: "yearly" },
  { base: "/support", priority: "0.5", changefreq: "monthly" },
];
for (const p of STATIC_PAGES) {
  const alternates = STATIC_LANGS.map((l) => ({ lang: l, href: `${SITE}/${l}${p.base}` }));
  alternates.push({ lang: "x-default", href: `${SITE}${p.base}` });
  for (const l of STATIC_LANGS) {
    core.push(altUrl(`${SITE}/${l}${p.base}`, alternates, p.priority, p.changefreq));
  }
}
writeFileSync(join(ROOT, "public", "sitemap-core.xml"), wrap(core));

// ── 2. i18n landing families (city × langs, calc, activities) ──────────
const i18n = [];
function cityFamily(deSlug, paths, langs) {
  const en = enOf(deSlug);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${paths[l]}${l === "de" ? deSlug : en}` }));
  if (langs.includes("en")) alternates.push({ lang: "x-default", href: `${SITE}${paths.en}${en}` });
  for (const l of langs) {
    i18n.push(altUrl(`${SITE}${paths[l]}${l === "de" ? deSlug : en}`, alternates, "0.7", "monthly"));
  }
}
for (const de of cityDe) {
  const langs = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr"];
  if (intlArKeys.has(enOf(de))) langs.push("ar");
  cityFamily(de, JGA_PATH, langs);
}
for (const de of henBase) {
  const langs = ["de", "en"];
  for (const l of ["es", "fr", "it", "pt", "nl", "pl", "tr"]) if (henIntl.has(de)) langs.push(l);
  if (henArKeys.has(de)) langs.push("ar");
  cityFamily(de, HEN_PATH, langs);
}
{
  const langs = Object.keys(CALC_PATH);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${CALC_PATH[l]}` }));
  alternates.push({ lang: "x-default", href: `${SITE}${CALC_PATH.en}` });
  for (const l of langs) i18n.push(altUrl(`${SITE}${CALC_PATH[l]}`, alternates, "0.9", "monthly"));
}
for (const slug of activities) {
  const langs = Object.keys(ACT_PATH);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${ACT_PATH[l]}${slug}` }));
  alternates.push({ lang: "x-default", href: `${SITE}${ACT_PATH.en}${slug}` });
  for (const l of langs) i18n.push(altUrl(`${SITE}${ACT_PATH[l]}${slug}`, alternates, "0.6", "monthly"));
}
writeFileSync(join(ROOT, "public", "sitemap-i18n.xml"), wrap(i18n));

// ── 3. MARKETPLACE (Supabase: approved services + agencies) ───────────
async function marketplaceUrls() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("⚠️  Supabase creds missing — sitemap-marketplace.xml will be empty.");
    return [];
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const urls = [];
  try {
    const { data: services, error: sErr } = await supabase
      .from("marketplace_services").select("slug, updated_at").eq("status", "approved");
    if (sErr) throw sErr;
    for (const s of services ?? []) {
      if (!s.slug) continue;
      urls.push(plainUrl(`${SITE}/marketplace/service/${s.slug}`, "0.7", "weekly",
        (s.updated_at ?? "").slice(0, 10) || LASTMOD));
    }
    const { data: agencies, error: aErr } = await supabase
      .from("agencies").select("slug, updated_at");
    if (aErr) throw aErr;
    for (const a of agencies ?? []) {
      if (!a.slug) continue;
      urls.push(plainUrl(`${SITE}/marketplace/agency/${a.slug}`, "0.6", "weekly",
        (a.updated_at ?? "").slice(0, 10) || LASTMOD));
    }
  } catch (e) {
    console.warn(`⚠️  Supabase fetch failed (${e?.message ?? e}) — marketplace sitemap may be partial.`);
  }
  return urls;
}
const market = await marketplaceUrls();
writeFileSync(join(ROOT, "public", "sitemap-marketplace.xml"), wrap(market));

// ── 4. INDEX + cleanup ────────────────────────────────────────────────
const subSitemaps = ["sitemap-core.xml", "sitemap-i18n.xml", "sitemap-marketplace.xml"];
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${subSitemaps.map((s) => `  <sitemap><loc>${SITE}/${s}</loc><lastmod>${LASTMOD}</lastmod></sitemap>`).join("\n")}
</sitemapindex>
`;
writeFileSync(join(ROOT, "public", "sitemap-index.xml"), indexXml);

// Remove the legacy hand-maintained sitemap (superseded by the generated set).
const legacy = join(ROOT, "public", "sitemap.xml");
if (existsSync(legacy)) rmSync(legacy);

console.log(`sitemap-core.xml: ${core.length} URLs`);
console.log(`sitemap-i18n.xml: ${i18n.length} URLs (cities=${cityDe.length}, hen=${henBase.length}, activities=${activities.length})`);
console.log(`sitemap-marketplace.xml: ${market.length} URLs`);
console.log(`sitemap-index.xml → ${subSitemaps.join(", ")}; legacy sitemap.xml removed.`);
