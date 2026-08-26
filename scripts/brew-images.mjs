/**
 * Bringt die erzeugten GEBRAEU-Quellbilder auf Zielgroesse und legt sie als
 * WebP ab. Vorbild: scripts/_resize_65.mjs (Schleife) und _gen_favicons.mjs
 * (Zieltabelle).
 *
 * Aufruf: node scripts/brew-images.mjs
 * Quelle: .brew-src/*.png (oder $BREW_SRC)   Ziel: public/images/...
 *
 * ERZEUGERNEUTRAL: Ob die Rohbilder von Magnific oder ueber den
 * Lovart-Rueckfallweg (_brew_gen.mjs) kommen, sieht man hier nicht — beide
 * schreiben in dasselbe Ablagefach. Vorher zeigte SRC in einen
 * Sitzungs-Temp-Ordner, der beim naechsten Aufraeumen verschwunden waere.
 *
 * Idempotent, loescht nie. Am Ende ein Pruefdurchlauf: Masse, Gewicht, und
 * bei freigestellten Icons zusaetzlich der Alphakanal.
 */
import sharp from "sharp";
import { existsSync, mkdirSync, statSync } from "node:fs";

const SRC = process.env.BREW_SRC || ".brew-src/";

/** Alle Zutaten-Kennungen — Reihenfolge wie INGREDIENT_IDS in brew-content.ts. */
const IDS = [
  "base1", "base2", "base3", "base4",
  "sour", "sweetFruit", "redFruit", "exotic",
  "herb", "sugar", "fizz", "bitterHerb",
  "cold", "bitter", "creamy", "topping",
];

/**
 * Die 32 Icons werden ERZEUGT statt getippt — 32 Handzeilen waeren 32
 * Gelegenheiten fuer einen Tippfehler, den niemand bemerkt, weil die Bilder
 * optional sind und das Emoji einspringt.
 *
 * 384 Kantenlaenge: groesster physischer Bedarf ist DrawReveal mit 96 px bei
 * dreifacher Pixeldichte = 288. 512 waeren 78 % mehr Gewicht ohne einen
 * sichtbaren Pixel.
 *
 * alphaQuality 100 statt der sonst ueblichen 90: eine weiche Freistellkante
 * bekommt bei 90 einen sichtbaren Hof, sobald sie auf der dunklen
 * Kartenplatte liegt. Kostet rund ein Kilobyte je Datei.
 *
 * fill 0.90 ist der eigentliche Fortschritt: frueher HOFFTE der Prompt auf
 * gleich grosse Motive und bekam sie nie. Jetzt wird gemessen und normiert.
 */
const ICONS = ["bar", "brew"].flatMap((skin) =>
  IDS.map((id) => ({
    src: `icon-${skin}-${id}.png`,
    out: `public/images/brew/${skin}-${id}.webp`,
    w: 384, h: 384,
    alpha: true,
    fill: 0.90,
    q: 84, alphaQ: 100,
    // 28 statt der zuerst geschaetzten 24: Der Mittelwert liegt bei 16 KB,
    // aber Motive mit viel hochfrequentem Detail (Sodawasser mit Blaeschen)
    // landen legitim darueber. Das echte Budget ist nicht die Einzeldatei,
    // sondern die Vorwaermung pro Partie — `preloadIngredients` laedt nur EIN
    // Gewand, gemessen 265 KB (bar) und 259 KB (brew). Eine Grenze, die eine
    // gesunde Datei dauerhaft rot meldet, bringt niemandem etwas.
    maxKb: 28,
  })),
);

/**
 * Hintergruende: q68 galt, solange sie bei 32 % Deckkraft hinter einem
 * Schleier lagen. Sie liegen jetzt bei rund 60 % — dabei werden Banding in
 * den dunklen Verlaeufen und Farbbluten an den Neonkanten sichtbar.
 * smartSubsample ist gegen das Bluten die eigentliche Massnahme.
 *
 * `flatten` je Gewand: die Bar hat eine eigene Grundfarbe. Vorher wurden
 * beide auf das Blauschwarz des Labors geflacht.
 */
const BACKDROPS = [
  { src: "tile.png", out: "public/images/games/brew.webp", w: 480, h: 480, inset: 0, flatten: "#1A0F08", q: 82, maxKb: 90 },

  { src: "bg-brew-tv.png", out: "public/images/brew/bg-brew-tv.webp", w: 2560, h: 1440, flatten: "#0B0F1A", q: 80, smart: true, maxKb: 700, quiet: "center" },
  { src: "bg-bar-tv.png", out: "public/images/brew/bg-bar-tv.webp", w: 2560, h: 1440, flatten: "#1A0F08", q: 80, smart: true, maxKb: 700, quiet: "center" },
  { src: "bg-brew-phone.png", out: "public/images/brew/bg-brew-phone.webp", w: 1080, h: 2340, flatten: "#0B0F1A", q: 80, smart: true, maxKb: 380, quiet: "lower" },
  { src: "bg-bar-phone.png", out: "public/images/brew/bg-bar-phone.webp", w: 1080, h: 2340, flatten: "#1A0F08", q: 80, smart: true, maxKb: 380, quiet: "lower" },
];

const TARGETS = [...ICONS, ...BACKDROPS];

mkdirSync("public/images/brew", { recursive: true });
mkdirSync("public/images/games", { recursive: true });

let fehler = 0;
let uebersprungen = 0;

for (const t of TARGETS) {
  const p = SRC + t.src;
  if (!existsSync(p)) { uebersprungen++; continue; }
  try {
    await verarbeite(t, p);
  } catch (e) {
    // EIN KAPUTTES QUELLBILD DARF NICHT DEN GANZEN LAUF ABBRECHEN.
    // Genau das ist passiert: ein abgebrochener Download hinterliess eine
    // unvollstaendige PNG, `libspng` warf, und die Ziele DANACH wurden nie
    // erzeugt — ohne dass die Ausgabe verriet, dass noch etwas fehlt.
    fehler++;
    console.log(`${t.out}: QUELLE UNLESBAR (${t.src}) — ${String(e.message || e).split("\n")[0]}`);
  }
}

async function verarbeite(t, p) {
  let img = sharp(p);
  const meta = await img.metadata();

  if (t.inset) {
    const dx = Math.round(meta.width * t.inset);
    const dy = Math.round(meta.height * t.inset);
    img = img.extract({ left: dx, top: dy, width: meta.width - 2 * dx, height: meta.height - 2 * dy });
  }

  if (t.alpha) {
    // Durchsichtigen Rand wegschneiden, dann auf einen festen Anteil der
    // Kante bringen und symmetrisch auffuellen. Danach sind alle Motive
    // optisch gleich gross, egal wie das Modell komponiert hat.
    const side = Math.round(t.w * t.fill);
    const trimmed = await sharp(p).ensureAlpha().trim({ threshold: 8 })
      .resize(side, side, { fit: "inside", withoutEnlargement: false })
      .toBuffer({ resolveWithObject: true });
    const dx = Math.max(0, t.w - trimmed.info.width);
    const dy = Math.max(0, t.h - trimmed.info.height);
    img = sharp(trimmed.data).extend({
      left: Math.floor(dx / 2), right: Math.ceil(dx / 2),
      top: Math.floor(dy / 2), bottom: Math.ceil(dy / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    await img.webp({ quality: t.q, alphaQuality: t.alphaQ, effort: 6 }).toFile(t.out);
  } else {
    img = img.resize(t.w, t.h, { fit: "cover", position: "centre" });
    if (t.flatten) img = img.flatten({ background: t.flatten });
    await img.webp({ quality: t.q, effort: 6, smartSubsample: !!t.smart }).toFile(t.out);
  }

  // --- Pruefdurchlauf -----------------------------------------------------
  const kb = Math.round(statSync(t.out).size / 1024);
  const m2 = await sharp(t.out).metadata();
  const hinweise = [];
  if (m2.width !== t.w || m2.height !== t.h) hinweise.push(`Masse ${m2.width}x${m2.height}`);
  if (kb > t.maxKb) hinweise.push(`${kb} KB > ${t.maxKb}`);

  if (t.alpha) {
    // 1. Alphakanal ueberhaupt vorhanden — faengt ein fehlgeschlagenes
    //    Freistellen sofort, statt es als grauen Kasten im Spiel zu zeigen.
    if (!m2.hasAlpha) hinweise.push("KEIN Alphakanal");
    else {
      const raw = await sharp(t.out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { data, info } = raw;
      const A = info.channels;
      // 2. Randprobe: der aeussere 2-px-Rahmen muss vollstaendig
      //    durchsichtig sein. Ist auch nur ein Pixel deckend, ist der graue
      //    Erzeugungsgrund mitgekommen.
      let randDeckend = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          if (x > 1 && x < info.width - 2 && y > 1 && y < info.height - 2) continue;
          if (data[(y * info.width + x) * A + 3] > 8) randDeckend++;
        }
      }
      if (randDeckend > 0) hinweise.push(`Rand deckend (${randDeckend} px)`);
      // 3. Deckungsanteil: darunter ist das Motiv weggeschnitten, darueber
      //    ist der Hintergrund geblieben. WARUM DAS NOETIG IST: sieben der
      //    Motive sind selbst nahezu weiss (Knochenstaub, Perlmuttmilch,
      //    Kristallwasser ...). Beim alten Freistellen per Flutfuellung
      //    wurden genau die durchloechert, und niemand bemerkte es.
      let deckend = 0;
      for (let i = 3; i < data.length; i += A) if (data[i] > 16) deckend++;
      const anteil = deckend / (info.width * info.height);
      if (anteil < 0.12 || anteil > 0.80) hinweise.push(`Deckung ${(anteil * 100).toFixed(0)} %`);
    }
  }

  if (t.quiet) {
    // 4. Die Ruhezone muss dunkel genug sein, damit Panels und weisser Text
    //    bei voller Deckkraft darauf sitzen koennen. Vorher war das eine
    //    Bitte im Prompt und wurde nach Augenmass geprueft.
    const zone = t.quiet === "center"
      ? { left: Math.round(t.w * 0.2), top: Math.round(t.h * 0.2), width: Math.round(t.w * 0.6), height: Math.round(t.h * 0.6) }
      : { left: 0, top: Math.round(t.h / 3), width: t.w, height: Math.round((t.h * 2) / 3) };
    const st = await sharp(t.out).extract(zone).greyscale().stats();
    const mittel = st.channels[0].mean;
    if (mittel > 40) hinweise.push(`Ruhezone zu hell (${mittel.toFixed(0)}/255)`);
  }

  if (hinweise.length) fehler++;
  console.log(`${t.out}: ${m2.width}x${m2.height}, ${kb} KB ${hinweise.length ? "PRUEFEN — " + hinweise.join(", ") : "ok"}`);
}

if (uebersprungen) console.log(`\n${uebersprungen} Ziele ohne Quelldatei in ${SRC} — uebersprungen.`);
console.log(fehler ? `${fehler} Eintraege brauchen Aufmerksamkeit.` : "Alle vorhandenen Ziele in Ordnung.");
