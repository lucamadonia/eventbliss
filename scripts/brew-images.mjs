/**
 * Bringt die erzeugten GEBRAEU-Quellbilder auf Zielgroesse und legt sie als
 * WebP ab. Vorbild: scripts/_resize_65.mjs (Schleife) und _gen_favicons.mjs
 * (Zieltabelle).
 *
 * Aufruf: node scripts/brew-images.mjs
 * Quelle: <scratchpad>/brew/*.png   Ziel: public/images/...
 *
 * Idempotent, loescht nie. Am Ende ein Pruefdurchlauf: Masse und Gewicht.
 */
import sharp from "sharp";
import { existsSync, mkdirSync, statSync } from "node:fs";

const SRC = "C:/Users/luca/AppData/Local/Temp/claude/C--Users-luca-projects-eventbliss/c31d4f12-6f25-4ab3-8153-b784c51a2c67/scratchpad/brew/";

/** inset: Anteil, der ringsum weggeschnitten wird (gegen gemalte Rahmen). */
const TARGETS = [
  { src: "tile2.png", out: "public/images/games/brew.webp", w: 480, h: 480, inset: 0.035, flatten: "#0B0F1A", q: 82, maxKb: 90 },

  // Hintergruende: kein Alphakanal, niedrigere Qualitaet reicht — sie liegen
  // ohnehin bei 32 % Deckkraft hinter einem Schleier.
  { src: "bg-brew-tv.png",    out: "public/images/brew/bg-brew-tv.webp",    w: 2560, h: 1440, flatten: "#0B0F1A", q: 68, maxKb: 400 },
  { src: "bg-bar-tv.png",     out: "public/images/brew/bg-bar-tv.webp",     w: 2560, h: 1440, flatten: "#0B0F1A", q: 68, maxKb: 400 },
  { src: "bg-brew-phone.png", out: "public/images/brew/bg-brew-phone.webp", w: 1080, h: 2340, flatten: "#0B0F1A", q: 68, maxKb: 260 },
  { src: "bg-bar-phone.png",  out: "public/images/brew/bg-bar-phone.webp",  w: 1080, h: 2340, flatten: "#0B0F1A", q: 68, maxKb: 260 },
];

mkdirSync("public/images/brew", { recursive: true });

let fehler = 0;
for (const t of TARGETS) {
  const p = SRC + t.src;
  if (!existsSync(p)) { console.log(`${t.src}: FEHLT in ${SRC}`); fehler++; continue; }
  let img = sharp(p);
  const meta = await img.metadata();
  if (t.inset) {
    const dx = Math.round(meta.width * t.inset);
    const dy = Math.round(meta.height * t.inset);
    img = img.extract({ left: dx, top: dy, width: meta.width - 2 * dx, height: meta.height - 2 * dy });
  }
  img = img.resize(t.w, t.h, { fit: "cover", position: "centre" });
  if (t.flatten) img = img.flatten({ background: t.flatten });
  await img.webp({ quality: t.q, effort: 6 }).toFile(t.out);

  const kb = Math.round(statSync(t.out).size / 1024);
  const m2 = await sharp(t.out).metadata();
  const ok = m2.width === t.w && m2.height === t.h && kb <= t.maxKb;
  if (!ok) fehler++;
  console.log(`${t.out}: ${m2.width}x${m2.height}, ${kb} KB ${ok ? "ok" : "PRUEFEN (Ziel <= " + t.maxKb + " KB)"}`);
}
console.log(fehler ? `\n${fehler} Eintraege brauchen Aufmerksamkeit.` : "\nAlle Ziele in Ordnung.");
