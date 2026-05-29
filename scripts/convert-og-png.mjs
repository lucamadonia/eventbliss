/**
 * Convert OG SVG → PNG using @resvg/resvg-js (no native deps, fast).
 *
 * Run with: node scripts/convert-og-png.mjs
 * Requires: npm install --save-dev @resvg/resvg-js
 *
 * Output: public/og/*.png alongside the SVG sources.
 *
 * PNG-Compat ist Pflicht für Twitter/X-Cards und Facebook OG-Previews.
 * SVG ist OK für ChatGPT/Perplexity/Slack/LinkedIn, aber nicht überall.
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const OG_DIR = join(PROJECT_ROOT, "public", "og");

let Resvg;
try {
  ({ Resvg } = await import("@resvg/resvg-js"));
} catch (e) {
  console.error(
    "[convert-og-png] @resvg/resvg-js not installed. Run:\n  npm install --save-dev @resvg/resvg-js\nthen re-run this script."
  );
  process.exit(1);
}

const svgFiles = readdirSync(OG_DIR).filter((f) => f.endsWith(".svg"));
console.log(`[convert-og-png] Converting ${svgFiles.length} SVG → PNG (1200×630)...`);

let ok = 0;
let fail = 0;
for (const file of svgFiles) {
  const inPath = join(OG_DIR, file);
  const outPath = join(OG_DIR, file.replace(/\.svg$/, ".png"));
  try {
    const svg = readFileSync(inPath, "utf8");
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { loadSystemFonts: true },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    writeFileSync(outPath, pngBuffer);
    ok++;
  } catch (e) {
    console.error(`[convert-og-png] FAIL ${file}: ${e.message}`);
    fail++;
  }
}

console.log(`[convert-og-png] Done — ${ok} converted, ${fail} failed.`);
