/**
 * OG-Image Generator — produces SVG OG images per JGA city, Stag Do city,
 * and JGA activity. Writes to public/og/*.svg
 *
 * Run with: node scripts/generate-og-images.mjs
 *
 * SVG OG images are supported by:
 *   • Modern AI search engines (ChatGPT, Perplexity, Google AI Overview)
 *   • Slack, Discord, iMessage, Telegram
 *   • LinkedIn (rendered server-side)
 *   • Facebook/Twitter accept SVG with caveats (some prefer PNG)
 *
 * For full PNG conversion: pipe these through sharp or resvg-js at build time.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OG_DIR = join(PROJECT_ROOT, "public", "og");

if (!existsSync(OG_DIR)) mkdirSync(OG_DIR, { recursive: true });

// Read ALL 176 activities from activities-library.ts by parsing the source
const ACTIVITIES_LIB = readFileSync(
  join(PROJECT_ROOT, "src", "lib", "activities-library.ts"),
  "utf8"
);
const ACTIVITY_RE = /\{\s*value:\s*'([a-z_]+)',\s*label:\s*'([^']+)',\s*emoji:\s*'([^']+)',\s*category:\s*'([a-z]+)'/g;
const ALL_ACTIVITIES = [];
const seenSlugs = new Set();
let match;
while ((match = ACTIVITY_RE.exec(ACTIVITIES_LIB)) !== null) {
  const [, slug, label, emoji, category] = match;
  if (seenSlugs.has(slug)) continue;
  seenSlugs.add(slug);
  ALL_ACTIVITIES.push({
    slug,
    label,
    emoji,
    category: category.charAt(0).toUpperCase() + category.slice(1),
  });
}

// ──────────────────────────────────────────────────────────────────
// Data — duplicated minimally to avoid TS imports in a .mjs script
// (Reads from generated metadata)
// ──────────────────────────────────────────────────────────────────

const JGA_CITIES = [
  // DACH
  { slug: "berlin", name: "Berlin", country: "Deutschland", vibe: "Späti, Berghain, Spreefahrt" },
  { slug: "hamburg", name: "Hamburg", country: "Deutschland", vibe: "Reeperbahn, Hafen, Alster" },
  { slug: "muenchen", name: "München", country: "Deutschland", vibe: "Biergarten, Wiesn, Englischer Garten" },
  { slug: "koeln", name: "Köln", country: "Deutschland", vibe: "Kölsch, Karneval, Brauhaus" },
  { slug: "frankfurt", name: "Frankfurt", country: "Deutschland", vibe: "Skyline, Apfelwein, Sachsenhausen" },
  { slug: "stuttgart", name: "Stuttgart", country: "Deutschland", vibe: "Cannstatter, Karts, Weinberge" },
  { slug: "duesseldorf", name: "Düsseldorf", country: "Deutschland", vibe: "Altbier, längste Theke der Welt" },
  { slug: "wien", name: "Wien", country: "Österreich", vibe: "Kaffeehaus, Donauinsel, Heuriger" },
  { slug: "zuerich", name: "Zürich", country: "Schweiz", vibe: "Limmat, Berge, Langstrasse" },
  { slug: "hannover", name: "Hannover", country: "Deutschland", vibe: "Steintor, Schützenfest, Maschsee" },
  { slug: "dresden", name: "Dresden", country: "Deutschland", vibe: "Frauenkirche, Neustadt, Elbflorenz" },
  { slug: "leipzig", name: "Leipzig", country: "Deutschland", vibe: "Karli, Plagwitz, Hypezig" },
  { slug: "nuernberg", name: "Nürnberg", country: "Deutschland", vibe: "Burg, Bratwurst, Christkindle" },
  { slug: "salzburg", name: "Salzburg", country: "Österreich", vibe: "Mozart, Festung, Alpenkulisse" },
  // International
  { slug: "mallorca", name: "Mallorca", country: "Spanien", vibe: "Ballermann, Strand, Bootscharter" },
  { slug: "prag", name: "Prag", country: "Tschechien", vibe: "Beer Spa, Pilsner, Altstadt" },
  { slug: "krakau", name: "Krakau", country: "Polen", vibe: "Wodka, Kazimierz, Salzbergwerk" },
  { slug: "budapest", name: "Budapest", country: "Ungarn", vibe: "Thermalbäder, Ruin-Pubs, Donau" },
  { slug: "amsterdam", name: "Amsterdam", country: "Niederlande", vibe: "Grachten, Coffeeshops, Bootstouren" },
  { slug: "barcelona", name: "Barcelona", country: "Spanien", vibe: "Strand, Tapas, Gaudí" },
  { slug: "paris", name: "Paris", country: "Frankreich", vibe: "Cocktails, Le Marais, Eiffelturm" },
  { slug: "london", name: "London", country: "UK", vibe: "Pubs, Soho, Themse" },
  { slug: "lissabon", name: "Lissabon", country: "Portugal", vibe: "Bairro Alto, Atlantik, Tram" },
  { slug: "istanbul", name: "Istanbul", country: "Türkei", vibe: "Bosporus, Hammam, Beyoğlu" },
  { slug: "madrid", name: "Madrid", country: "Spanien", vibe: "Tapas, Malasaña, Late-Night" },
  { slug: "valencia", name: "Valencia", country: "Spanien", vibe: "Paella, Strand, Las Fallas" },
  { slug: "ibiza", name: "Ibiza", country: "Spanien", vibe: "Pacha, Sunset Strip, Beach Clubs" },
  { slug: "rom", name: "Rom", country: "Italien", vibe: "Trastevere, Aperitivo, Kolosseum" },
  { slug: "mailand", name: "Mailand", country: "Italien", vibe: "Navigli, Aperitivo, Comer See" },
  { slug: "florenz", name: "Florenz", country: "Italien", vibe: "Chianti, Renaissance, Toskana" },
  { slug: "dublin", name: "Dublin", country: "Irland", vibe: "Temple Bar, Guinness, Stag-Do" },
  { slug: "edinburgh", name: "Edinburgh", country: "UK", vibe: "Castle, Whisky, Highlands" },
  { slug: "porto", name: "Porto", country: "Portugal", vibe: "Portwein, Douro, Galerias" },
  { slug: "warschau", name: "Warschau", country: "Polen", vibe: "Praga, Wodka, Altstadt" },
  { slug: "athen", name: "Athen", country: "Griechenland", vibe: "Akropolis, Psiri, Mediterran" },
  { slug: "kopenhagen", name: "Kopenhagen", country: "Dänemark", vibe: "Mikkeller, Vesterbro, Hygge" },
  { slug: "stockholm", name: "Stockholm", country: "Schweden", vibe: "Schären, Södermalm, Stureplan" },
  { slug: "tallinn", name: "Tallinn", country: "Estland", vibe: "Mittelalter, Telliskivi, Sauna" },
  { slug: "bukarest", name: "Bukarest", country: "Rumänien", vibe: "Lipscani, Therme, Schießstand" },
  { slug: "bruessel", name: "Brüssel", country: "Belgien", vibe: "Delirium, Pommes, Atomium" },
  { slug: "nizza", name: "Nizza", country: "Frankreich", vibe: "Côte d'Azur, Promenade, Monaco" },
];

const STAG_DO_CITIES = [
  { slug: "london", name: "London", country: "United Kingdom", vibe: "Pubs, Soho, the Thames" },
  { slug: "dublin", name: "Dublin", country: "Ireland", vibe: "Guinness, Temple Bar, stag royalty" },
  { slug: "edinburgh", name: "Edinburgh", country: "United Kingdom", vibe: "Castle, whisky, Royal Mile" },
  { slug: "amsterdam", name: "Amsterdam", country: "Netherlands", vibe: "Canals, coffeeshops, red light" },
  { slug: "prague", name: "Prague", country: "Czech Republic", vibe: "Cheap pints, Beer Spa, old town" },
  { slug: "barcelona", name: "Barcelona", country: "Spain", vibe: "Beach, tapas, late-night clubs" },
  { slug: "berlin", name: "Berlin", country: "Germany", vibe: "No curfew, every subculture" },
  { slug: "hamburg", name: "Hamburg", country: "Germany", vibe: "Reeperbahn, harbour, Alster" },
  { slug: "munich", name: "Munich", country: "Germany", vibe: "Beer gardens, Oktoberfest, Alps" },
  { slug: "cologne", name: "Cologne", country: "Germany", vibe: "Kölsch, Karneval, brewery crawls" },
  { slug: "frankfurt", name: "Frankfurt", country: "Germany", vibe: "Skyline, Apfelwein, Sachsenhausen" },
  { slug: "stuttgart", name: "Stuttgart", country: "Germany", vibe: "Cannstatter, karts, vineyards" },
  { slug: "dusseldorf", name: "Düsseldorf", country: "Germany", vibe: "Altbier, longest bar in the world" },
  { slug: "vienna", name: "Vienna", country: "Austria", vibe: "Coffeehouse, Heuriger, imperial mix" },
  { slug: "zurich", name: "Zurich", country: "Switzerland", vibe: "Lake, mountains, banking precision" },
  { slug: "hannover", name: "Hannover", country: "Germany", vibe: "Steintor, Schützenfest, Maschsee" },
  { slug: "dresden", name: "Dresden", country: "Germany", vibe: "Frauenkirche, Neustadt, Elbe" },
  { slug: "leipzig", name: "Leipzig", country: "Germany", vibe: "Karli, Plagwitz, Hypezig" },
  { slug: "nuremberg", name: "Nuremberg", country: "Germany", vibe: "Castle, Bratwurst, Christkindle" },
  { slug: "salzburg", name: "Salzburg", country: "Austria", vibe: "Mozart, fortress, Alpine backdrop" },
  { slug: "mallorca", name: "Mallorca", country: "Spain", vibe: "Ballermann, beaches, boat charters" },
  { slug: "krakow", name: "Krakow", country: "Poland", vibe: "Vodka, Kazimierz, salt mine" },
  { slug: "budapest", name: "Budapest", country: "Hungary", vibe: "Thermal baths, ruin pubs, Danube" },
  { slug: "paris", name: "Paris", country: "France", vibe: "Cocktails, Le Marais, Eiffel Tower" },
  { slug: "lisbon", name: "Lisbon", country: "Portugal", vibe: "Bairro Alto, Atlantic, hills" },
  { slug: "istanbul", name: "Istanbul", country: "Türkiye", vibe: "Bosphorus, Bazaar, Beyoğlu" },
  { slug: "madrid", name: "Madrid", country: "Spain", vibe: "Tapas, Malasaña, late-night" },
  { slug: "valencia", name: "Valencia", country: "Spain", vibe: "Paella, beach, Las Fallas" },
  { slug: "ibiza", name: "Ibiza", country: "Spain", vibe: "Pacha, Sunset Strip, beach clubs" },
  { slug: "rome", name: "Rome", country: "Italy", vibe: "Trastevere, aperitivo, Colosseum" },
  { slug: "milan", name: "Milan", country: "Italy", vibe: "Navigli, aperitivo, Lake Como" },
  { slug: "florence", name: "Florence", country: "Italy", vibe: "Chianti, Renaissance, Tuscany" },
  { slug: "porto", name: "Porto", country: "Portugal", vibe: "Port wine, Douro, Galerias" },
  { slug: "warsaw", name: "Warsaw", country: "Poland", vibe: "Praga, vodka, post-war rebuild" },
  { slug: "athens", name: "Athens", country: "Greece", vibe: "Acropolis, Psiri, Mediterranean" },
  { slug: "copenhagen", name: "Copenhagen", country: "Denmark", vibe: "Mikkeller, Vesterbro, hygge" },
  { slug: "stockholm", name: "Stockholm", country: "Sweden", vibe: "Archipelago, Södermalm, Stureplan" },
  { slug: "tallinn", name: "Tallinn", country: "Estonia", vibe: "Medieval, Telliskivi, sauna" },
  { slug: "bucharest", name: "Bucharest", country: "Romania", vibe: "Lipscani, thermal, shooting range" },
  { slug: "brussels", name: "Brussels", country: "Belgium", vibe: "Delirium, frites, Atomium" },
  { slug: "nice", name: "Nice", country: "France", vibe: "Côte d'Azur, Promenade, Monaco" },
];

// Activities — slug + label + emoji (subset; full list pulled from activities-library)
const ACTIVITIES_TOP = [
  { slug: "karting", label: "Karting", emoji: "🏎️", category: "Action" },
  { slug: "escape_room", label: "Escape Room", emoji: "🔐", category: "Action" },
  { slug: "lasertag", label: "Lasertag", emoji: "🔫", category: "Action" },
  { slug: "paintball", label: "Paintball", emoji: "🎯", category: "Action" },
  { slug: "axe_throwing", label: "Axtwerfen", emoji: "🪓", category: "Action" },
  { slug: "shooting_range", label: "Schießstand", emoji: "🎯", category: "Action" },
  { slug: "vr_arena", label: "VR Arena", emoji: "🥽", category: "Action" },
  { slug: "sup", label: "Stand-Up Paddling", emoji: "🏄", category: "Outdoor" },
  { slug: "sailing", label: "Segeln", emoji: "⛵", category: "Outdoor" },
  { slug: "rafting", label: "Rafting", emoji: "🚣", category: "Outdoor" },
  { slug: "climbing", label: "Klettern", emoji: "🧗", category: "Outdoor" },
  { slug: "hiking", label: "Wandern", emoji: "🥾", category: "Outdoor" },
  { slug: "indoor_skydiving", label: "Indoor Skydiving", emoji: "💨", category: "Action" },
  { slug: "rage_room", label: "Rage Room", emoji: "🔨", category: "Action" },
  { slug: "wine_tasting", label: "Weinprobe", emoji: "🍷", category: "Food" },
  { slug: "cocktail_course", label: "Cocktailkurs", emoji: "🍹", category: "Food" },
  { slug: "brewery_tour", label: "Brauerei-Tour", emoji: "🍺", category: "Food" },
  { slug: "pub_crawl", label: "Pub Crawl", emoji: "🍻", category: "Nightlife" },
  { slug: "karaoke", label: "Karaoke", emoji: "🎤", category: "Entertainment" },
  { slug: "bubble_soccer", label: "Bubble Soccer", emoji: "⚽", category: "Action" },
];

// ──────────────────────────────────────────────────────────────────
// SVG Templates
// ──────────────────────────────────────────────────────────────────

const W = 1200;
const H = 630;

// Escape XML special chars
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgGradientBg(gradientId) {
  return `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.95"/>
        <stop offset="50%" stop-color="#EC4899" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="${gradientId}-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0.7"/>
      </linearGradient>
      <radialGradient id="${gradientId}-spot" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#${gradientId})"/>
    <rect width="${W}" height="${H}" fill="url(#${gradientId}-overlay)"/>
    <rect width="${W}" height="${H}" fill="url(#${gradientId}-spot)"/>
  `;
}

function svgLogo(x, y) {
  return `
    <g transform="translate(${x},${y})">
      <circle cx="0" cy="0" r="20" fill="#FFFFFF" fill-opacity="0.95"/>
      <text x="0" y="6" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="20" fill="#0F172A">E</text>
      <text x="32" y="7" font-family="Inter, sans-serif" font-weight="700" font-size="22" fill="#FFFFFF">EventBliss</text>
    </g>
  `;
}

function cityOg(city, lang, badgeLabel) {
  const id = `g-${city.slug}`;
  const accent = lang === "en" ? "STAG DO" : "JGA";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${svgGradientBg(id)}
  ${svgLogo(60, 60)}
  <g>
    <text x="60" y="280" font-family="Inter, sans-serif" font-weight="500" font-size="28" fill="#FFFFFF" fill-opacity="0.7" letter-spacing="6">${esc(accent)} · ${esc(city.country.toUpperCase())}</text>
    <text x="60" y="400" font-family="Inter, sans-serif" font-weight="900" font-size="132" fill="#FFFFFF">${esc(city.name)}</text>
    <text x="60" y="470" font-family="Inter, sans-serif" font-weight="500" font-size="34" fill="#FFFFFF" fill-opacity="0.85">${esc(city.vibe)}</text>
  </g>
  <g transform="translate(${W - 280}, ${H - 80})">
    <rect width="220" height="48" rx="24" fill="#FFFFFF" fill-opacity="0.18"/>
    <text x="110" y="32" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="18" fill="#FFFFFF">${esc(badgeLabel)}</text>
  </g>
</svg>`;
}

function activityOg(activity) {
  const id = `g-${activity.slug}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${svgGradientBg(id)}
  ${svgLogo(60, 60)}
  <g>
    <text x="60" y="280" font-family="Inter, sans-serif" font-weight="500" font-size="28" fill="#FFFFFF" fill-opacity="0.7" letter-spacing="6">JGA · ${esc(activity.category.toUpperCase())}</text>
    <text x="60" y="400" font-family="Inter, sans-serif" font-weight="900" font-size="120" fill="#FFFFFF">${esc(activity.label)}</text>
    <text x="60" y="465" font-family="Inter, sans-serif" font-weight="500" font-size="32" fill="#FFFFFF" fill-opacity="0.85">Ideen, Kosten und beste Städte</text>
  </g>
  <text x="${W - 80}" y="${H - 60}" text-anchor="end" font-family="Inter, sans-serif" font-size="160" fill="#FFFFFF" fill-opacity="0.5">${activity.emoji}</text>
</svg>`;
}

// ──────────────────────────────────────────────────────────────────
// Generate
// ──────────────────────────────────────────────────────────────────

let count = 0;

for (const c of JGA_CITIES) {
  const svg = cityOg(c, "de", "event-bliss.com/jga/" + c.slug);
  writeFileSync(join(OG_DIR, `jga-${c.slug}.svg`), svg, "utf8");
  count++;
}

for (const c of STAG_DO_CITIES) {
  const svg = cityOg(c, "en", "event-bliss.com/stag-do/" + c.slug);
  writeFileSync(join(OG_DIR, `stag-do-${c.slug}.svg`), svg, "utf8");
  count++;
}

// Generate OG for ALL 176 unique activities (read live from activities-library.ts)
for (const a of ALL_ACTIVITIES) {
  const svg = activityOg(a);
  writeFileSync(join(OG_DIR, `ideen-${a.slug}.svg`), svg, "utf8");
  count++;
}

console.log(`Generated ${count} OG images in ${OG_DIR}`);
