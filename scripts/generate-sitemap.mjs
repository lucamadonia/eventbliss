/**
 * Multilingual SEO sitemap generator.
 *
 * Emits public/sitemap-i18n.xml — every bachelor/hen party landing page, the
 * budget calculator and the activity glossary, in all 10 languages, each <url>
 * carrying xhtml:link rel="alternate" hreflang annotations (incl. Arabic and
 * x-default). Also writes public/sitemap-index.xml referencing the existing
 * public/sitemap.xml plus this i18n sitemap.
 *
 * Data is parsed from the TS sources (same approach as generate-og-images.mjs)
 * so it stays in sync without importing TypeScript.
 *
 * Run: node scripts/generate-sitemap.mjs   (or: npm run sitemap)
 */
import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE = "https://event-bliss.com";

const read = (p) => readFileSync(join(ROOT, p), "utf8");

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

// ── Parse data from sources ───────────────────────────────────────────
const cityDe = [...read("src/lib/jga-cities.ts").matchAll(/slug:\s*"([^"]+)",\s*\n\s*name:\s*"/g)].map((m) => m[1]);
const activities = [...new Set([...read("src/lib/activities-library.ts").matchAll(/value:\s*'([a-z_]+)'/g)].map((m) => m[1]))];
const henBase = [...read("src/lib/hen-do-overlay.ts").matchAll(/\{\s*slug:\s*"([a-z-]+)"/g)].map((m) => m[1]);
const henIntl = new Set([...read("src/lib/hen-do-overlay-intl.ts").matchAll(/^\s{2}([a-z]+):\s*\{/gm)].map((m) => m[1]));
const intlArKeys = new Set([...read("src/lib/intl-cities-ar.ts").matchAll(/"([a-z-]+)":\s*\{/g)].map((m) => m[1]));
const henArKeys = new Set([...read("src/lib/hen-do-overlay-ar.ts").matchAll(/"([a-z-]+)":\s*\{/g)].map((m) => m[1]));

// ── XML builders ──────────────────────────────────────────────────────
const xmlEsc = (s) => s.replace(/&/g, "&amp;");
function urlBlock(loc, alternates, priority, changefreq) {
  const links = alternates
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${xmlEsc(a.href)}"/>`)
    .join("\n");
  return `  <url>
    <loc>${xmlEsc(loc)}</loc>
${links}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const urls = [];

// City family helper: build one <url> per available language, each listing all
// available languages as alternates (reciprocal hreflang) + x-default → en.
function cityFamily(deSlug, paths, langs) {
  const en = enOf(deSlug);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${paths[l]}${l === "de" ? deSlug : en}` }));
  if (langs.includes("en")) alternates.push({ lang: "x-default", href: `${SITE}${paths.en}${en}` });
  for (const l of langs) {
    const loc = `${SITE}${paths[l]}${l === "de" ? deSlug : en}`;
    urls.push(urlBlock(loc, alternates, "0.7", "monthly"));
  }
}

// 1. Stag/bachelor city pages (all 41 cities × 9 langs + ar where content exists)
for (const de of cityDe) {
  const langs = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr"];
  if (intlArKeys.has(enOf(de))) langs.push("ar");
  cityFamily(de, JGA_PATH, langs);
}

// 2. Hen-do city pages (base cities; intl langs where covered + ar where content exists)
for (const de of henBase) {
  const langs = ["de", "en"];
  for (const l of ["es", "fr", "it", "pt", "nl", "pl", "tr"]) if (henIntl.has(de)) langs.push(l);
  if (henArKeys.has(de)) langs.push("ar");
  cityFamily(de, HEN_PATH, langs);
}

// 3. Budget calculator (all 10 languages)
{
  const langs = Object.keys(CALC_PATH);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${CALC_PATH[l]}` }));
  alternates.push({ lang: "x-default", href: `${SITE}${CALC_PATH.en}` });
  for (const l of langs) urls.push(urlBlock(`${SITE}${CALC_PATH[l]}`, alternates, "0.9", "monthly"));
}

// 4. Activity glossary (all activities × 10 languages — Arabic frameworks exist)
for (const slug of activities) {
  const langs = Object.keys(ACT_PATH);
  const alternates = langs.map((l) => ({ lang: l, href: `${SITE}${ACT_PATH[l]}${slug}` }));
  alternates.push({ lang: "x-default", href: `${SITE}${ACT_PATH.en}${slug}` });
  for (const l of langs) urls.push(urlBlock(`${SITE}${ACT_PATH[l]}${slug}`, alternates, "0.6", "monthly"));
}

const i18nXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
writeFileSync(join(ROOT, "public", "sitemap-i18n.xml"), i18nXml);

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/sitemap.xml</loc></sitemap>
  <sitemap><loc>${SITE}/sitemap-i18n.xml</loc></sitemap>
</sitemapindex>
`;
writeFileSync(join(ROOT, "public", "sitemap-index.xml"), indexXml);

console.log(`sitemap-i18n.xml: ${urls.length} URLs`);
console.log(`  cities=${cityDe.length} hen=${henBase.length} activities=${activities.length}`);
console.log(`  intlAr=${intlArKeys.size} henAr=${henArKeys.size} henIntl=${henIntl.size}`);
console.log(`sitemap-index.xml written.`);
