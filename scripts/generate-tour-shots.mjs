/**
 * Echte App-Bildschirme fuer den Influencer-Bereich, klein gerechnet.
 *
 *   node scripts/generate-tour-shots.mjs            (de und en)
 *   node scripts/generate-tour-shots.mjs de en es   (Sprachen einzeln)
 *
 * Quelle sind die Aufnahmen, die fuer die App-Stores schon gemacht wurden:
 * appstore/raw/<lang>/iphone/*.png, 1290 x 2796, in zehn Sprachen.
 *
 * WARUM NICHT NEU AUFNEHMEN: ein frischer Lauf braucht das Demo-Konto, ein
 * gesaetes Ereignis und einen laufenden Server auf Port 8080. Diese Bilder
 * zeigen dieselbe App, sind bereits geprueft und kosten nichts. Sobald sich
 * die Oberflaeche merklich aendert, werden ohnehin die Store-Aufnahmen neu
 * gemacht — dann laeuft dieses Skript einfach noch einmal.
 *
 * WARUM WEBP MIT 750 px: die Bilder stehen als Vorschau in einer Kachelreihe.
 * In voller Groesse waeren es je 2 bis 3 MB fuer etwas, das 260 px breit
 * angezeigt wird.
 *
 * ABGELEGT UNTER public/tour/, weil gebuendelte Assets bei jedem Build eine
 * neue Adresse mit Hash bekommen — derselbe Grund wie bei public/press/.
 */
import { mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "appstore", "raw");
const OUT = join(ROOT, "public", "tour");

const WIDTH = 750;

/** Welche Bildschirme uebernommen werden — nicht alle, nur die erzaehlbaren. */
const KEYS = ["home", "schedule", "expenses", "games", "ideas", "guests", "messages", "services"];

/**
 * ALLE ZEHN SPRACHEN als Voreinstellung. Die Tour im Influencer-Bereich
 * erklaert die Module in zehn Sprachen; ein englischer Bildschirm unter einem
 * tuerkischen Text waere genau die Halbheit, die man sofort sieht.
 */
const ALL = ["de", "en", "es", "fr", "it", "pt", "nl", "pl", "tr", "ar"];
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

let written = 0;
let bytes = 0;

for (const lang of langs) {
  const dir = join(SRC, lang, "iphone");
  if (!existsSync(dir)) {
    console.warn(`  übersprungen: ${lang} — ${dir} fehlt`);
    continue;
  }
  const outDir = join(OUT, lang);
  mkdirSync(outDir, { recursive: true });

  const available = new Set(readdirSync(dir).map((f) => f.replace(/\.png$/i, "")));

  for (const key of KEYS) {
    if (!available.has(key)) {
      // Kein Abbruch: fehlt ein Bildschirm in einer Sprache, fehlt genau diese
      // Kachel — nicht der ganze Lauf.
      console.warn(`  fehlt: ${lang}/${key}.png`);
      continue;
    }
    const file = join(outDir, `${key}.webp`);
    await sharp(join(dir, `${key}.png`))
      .resize({ width: WIDTH })
      .webp({ quality: 80 })
      .toFile(file);
    const size = statSync(file).size;
    bytes += size;
    written++;
    console.log(`  ${lang}/${key}.webp  ${Math.round(size / 1024)} kB`);
  }
}

console.log(`\nFertig — ${written} Bilder, ${Math.round((bytes / 1024 / 1024) * 10) / 10} MB unter public/tour/`);
