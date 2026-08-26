/**
 * Story-Kacheln fuer den Influencer-Bereich — 1080 x 1920, fertig zum Hochladen.
 *
 *   node scripts/generate-story-tiles.mjs
 *   node scripts/generate-story-tiles.mjs de        (nur eine Sprache)
 *
 * Schreibt nach public/press/story/<lang>/<key>.png. Die Liste der Motive und
 * ihre Beschriftungen stehen weiter unten; die Bezeichner (`key`) muessen mit
 * `storyTiles` in src/lib/creator-media-kit.ts uebereinstimmen — dort haengt
 * die Vorschau im Material-Reiter dran.
 *
 * WARUM PUPPETEER UND NICHT SVG: die Kacheln sollen Bilder aus der App zeigen,
 * nicht nur Text auf einer Flaeche. Ein Browser kann beides — Bild einbetten,
 * Text darueber setzen, Schrift laden — ohne dass wir Zeilenumbrueche von Hand
 * rechnen.
 *
 * WARUM DIE BILDER ALS data:-URI EINGEBETTET WERDEN: die Seite wird aus einem
 * String geladen (`setContent`), hat also keine Basisadresse, von der aus
 * relative Pfade aufloesen wuerden.
 *
 * SICHERER BEREICH: Instagram und TikTok legen ihre eigene Bedienung ueber die
 * oberen und unteren rund 250 px. Alles, was lesbar bleiben muss, steht
 * deshalb zwischen 260 und 1660.
 *
 * VOR DER AUSLIEFERUNG ANSEHEN. Das hier ist Material mit unserem Namen
 * darauf, das spaeter in fremden Kanaelen steht — ein schiefer Satz faellt dort
 * auf uns zurueck, nicht auf den Influencer.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRESS = join(ROOT, "public", "press");
const OUT = join(PRESS, "story");

const W = 1080;
const H = 1920;

/* ── Die Motive ──────────────────────────────────────────────────────
 *
 * Ein Motiv = ein Gedanke. Zwei Gedanken auf einer Kachel liest niemand,
 * der mit dem Daumen weiterwischt.
 */
const TILES = [
  {
    key: "chaos",
    shot: null, // reine Textkachel — der Einstieg braucht kein Bild
    accent: "#EC4899",
    de: {
      kicker: "Kennst du das",
      title: "Zehn Leute.\nDrei Gruppenchats.\nNiemand entscheidet.",
      sub: "Es liegt nicht an euch. Es liegt daran, wo ihr plant.",
    },
    en: {
      kicker: "Sound familiar",
      title: "Ten people.\nThree group chats.\nNobody deciding.",
      sub: "It is not your group. It is where you are planning.",
    },
  },
  {
    key: "planning",
    shot: "schedule",
    accent: "#A855F7",
    de: {
      kicker: "Der Unterschied",
      title: "Alles an einem Ort",
      sub: "Termin, Ideen, Budget. Alle sehen dasselbe — niemand muss etwas weiterleiten.",
    },
    en: {
      kicker: "The difference",
      title: "All in one place",
      sub: "Date, ideas, budget. Everyone sees the same thing — nothing to forward.",
    },
  },
  {
    key: "split",
    shot: "expenses",
    accent: "#10B981",
    de: {
      kicker: "Der unangenehme Teil",
      title: "Wer schuldet\nwem was",
      sub: "Ausgaben eintragen, aufteilen — gleichmäßig oder nach Anteilen. Am Ende steht es einfach da.",
    },
    en: {
      kicker: "The awkward part",
      title: "Who owes\nwhom what",
      sub: "Enter expenses, split them — evenly or by shares. At the end it simply says so.",
    },
  },
  {
    key: "games",
    shot: "games",
    accent: "#F59E0B",
    de: {
      kicker: "Für den Abend",
      title: "22 Spiele,\nnichts zu installieren",
      sub: "Alle spielen am eigenen Handy mit. Und wenn ein Fernseher da ist, läuft das Spiel darauf.",
    },
    en: {
      kicker: "For the evening",
      title: "22 games,\nnothing to install",
      sub: "Everyone joins from their own phone. And if there is a TV, the game runs on it.",
    },
  },
  {
    /*
      HIER STAND DER FERNSEHMODUS ALS EIGENE KACHEL. Es gibt aber keine echte
      Aufnahme davon — nur ein Werbebild mit Tablet und Handys, das den Satz
      "läuft auf dem Fernseher" gerade nicht belegt. Ein Bild, das die Aussage
      nicht traegt, ist schlechter als keins; der Fernsehmodus steht deshalb
      jetzt auf der Spiele-Kachel, und hier steht das Ideenboard, von dem es
      eine Aufnahme gibt.
    */
    key: "ideas",
    shot: "ideas",
    accent: "#3B82F6",
    de: {
      kicker: "Bevor irgendwas feststeht",
      title: "Ideen sammeln,\nohne zu diskutieren",
      sub: "Jeder wirft rein, was ihm einfällt. Abgestimmt wird danach — nicht in 200 Nachrichten.",
    },
    en: {
      kicker: "Before anything is fixed",
      title: "Collect ideas\nwithout arguing",
      sub: "Everyone throws in what they think of. You vote afterwards — not across 200 messages.",
    },
  },
  {
    key: "code",
    shot: null, // Platz fuer den eigenen Code, deshalb ohne Bild
    accent: "#A855F7",
    /*
      ACHTUNG, DER TEXT WIRD MITVEROEFFENTLICHT. Hier stand vorher eine
      Anweisung an den Influencer ("Schreib deinen Code hierhin") — die haette
      genau so in seiner Story gestanden. Alles auf einer Kachel spricht das
      Publikum an; was der Influencer tun soll, steht im Bereich daneben.
    */
    de: {
      kicker: "Für euch",
      title: "Mein Code",
      sub: "Damit bekommt ihr Premium. Planen könnt ihr auch ohne — das kostet nie etwas.",
      slot: "DEIN CODE",
    },
    en: {
      kicker: "For you",
      title: "My code",
      sub: "This gets you Premium. You can plan without it too — that part is always free.",
      slot: "YOUR CODE",
    },
  },
];

/* ── Bilder einbetten ───────────────────────────────────────────────── */

const dataUri = (file) => {
  const path = join(PRESS, file);
  if (!existsSync(path)) throw new Error(`Bild fehlt: ${path}`);
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
};

/**
 * Ein echter App-Bildschirm in der jeweiligen Sprache.
 *
 * Kommt aus public/tour/ — erzeugt von scripts/generate-tour-shots.mjs, das
 * die vorhandenen Store-Aufnahmen klein rechnet. Fehlt die Datei, faellt die
 * Kachel auf reinen Text zurueck statt den ganzen Lauf abzubrechen.
 */
const shotUri = (lang, key) => {
  const path = join(ROOT, "public", "tour", lang, `${key}.webp`);
  if (!existsSync(path)) return null;
  return `data:image/webp;base64,${readFileSync(path).toString("base64")}`;
};

const ICON = dataUri("eventbliss-icon.png");

/* ── Die Vorlage ────────────────────────────────────────────────────── */

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

function html(tile, lang) {
  const t = tile[lang];
  const image = tile.shot ? shotUri(lang, tile.shot) : null;

  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; overflow: hidden;
    background: #0b0b12;
    font-family: Outfit, "Segoe UI", system-ui, sans-serif;
    color: #fff;
    -webkit-font-smoothing: antialiased;
  }
  .bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(900px 700px at 15% 8%, ${tile.accent}33, transparent 65%),
      radial-gradient(800px 800px at 90% 92%, #10B98122, transparent 60%);
  }
  .frame {
    position: absolute; inset: 260px 80px 260px 80px;
    display: flex; flex-direction: column;
  }
  /*
    Das Wortmarken-PNG hat viel freien Rand und ist dunkel — bei 62 px war es
    auf der fertigen Kachel nicht mehr als ein Fleck. Deshalb das quadratische
    App-Symbol und der Name als Schrift.
  */
  .top { display: flex; align-items: center; gap: 24px; }
  .top img { height: 84px; width: 84px; border-radius: 22px; }
  .top span { font-size: 46px; font-weight: 800; letter-spacing: -0.01em; }
  /* Auf einer Kachel ohne Bild stand der Text oben und darunter die halbe
     Kachel leer. Mit "auto" oben und unten sitzt er in der Mitte. */
  .body.center { margin-top: auto; margin-bottom: auto; }
  .kicker {
    margin-top: 64px;
    font-size: 34px; font-weight: 700; letter-spacing: 0.22em;
    text-transform: uppercase; color: ${tile.accent};
  }
  h1 {
    margin-top: 22px;
    font-size: ${t.title.length > 40 ? 78 : 96}px;
    font-weight: 900; line-height: 1.04; letter-spacing: -0.02em;
  }
  .sub {
    margin-top: 30px;
    font-size: 40px; font-weight: 500; line-height: 1.42;
    color: rgba(255,255,255,0.7);
    max-width: 850px;
  }
  /*
    EIN ECHTER BILDSCHIRM IM TELEFONRAHMEN. Die frueheren Werbebilder waren
    freigestellt — auf durchsichtigem Grund kam das Karomuster des Browsers
    durch, und sie zeigten ohnehin nicht die App, sondern eine Zeichnung davon.
    Hier steht die Aufnahme aus dem Store-Lauf, in der Sprache der Kachel.
  */
  .visual {
    margin-top: auto; margin-bottom: 36px;
    display: flex; justify-content: center;
  }
  /*
    BREIT UND OBEN ABGESCHNITTEN, nicht das ganze Telefon. Im vollen
    Seitenverhaeltnis war die Aufnahme 300 px breit — auf einem Handy gehalten
    ist darin kein Wort mehr zu lesen, und dann kann man das Bild auch
    weglassen. Lieber die obere Haelfte gross als das Ganze winzig.
  */
  .phone {
    width: 620px; height: 700px;
    border-radius: 52px; overflow: hidden;
    border: 10px solid #1c1c2b;
    box-shadow: 0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px ${tile.accent}55;
    background: #0b0b12;
  }
  .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
  /* Oben UND unten "auto": die Flaeche steht dann mittig im freien Raum,
     statt am unteren Rand zu kleben und darueber ein Loch zu lassen. */
  .slot {
    margin-top: auto; margin-bottom: auto;
    border: 4px dashed rgba(255,255,255,0.28);
    border-radius: 40px;
    height: 300px;
    display: flex; align-items: center; justify-content: center;
    font-size: 64px; font-weight: 800; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.4);
  }
  .foot {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 34px; font-weight: 700; color: rgba(255,255,255,0.55);
  }
  .foot .dot { color: ${tile.accent}; }
</style></head>
<body>
  <div class="bg"></div>
  <div class="frame">
    <div class="top"><img src="${ICON}" alt=""><span>EventBliss</span></div>
    <div class="body${image || t.slot ? "" : " center"}">
      <div class="kicker">${escape(t.kicker)}</div>
      <h1>${escape(t.title)}</h1>
      <div class="sub">${escape(t.sub)}</div>
    </div>
    ${
      image
        ? `<div class="visual"><div class="phone"><img src="${image}" alt=""></div></div>`
        : t.slot
          ? `<div class="slot">${escape(t.slot)}</div>`
          : `<div style="margin-top:auto"></div>`
    }
    <div class="foot"><span>event-bliss.com</span><span class="dot">●</span></div>
  </div>
</body></html>`;
}

/* ── Lauf ───────────────────────────────────────────────────────────── */

const langs = process.argv[2] ? [process.argv[2]] : ["de", "en"];

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  for (const lang of langs) {
    const dir = join(OUT, lang);
    mkdirSync(dir, { recursive: true });

    for (const tile of TILES) {
      // NICHT "networkidle0": die per preconnect offen gehaltene Verbindung zu
      // Google Fonts wird nie ruhig, das Warten lief in den Zeitablauf. Wir
      // warten stattdessen ausdruecklich auf das, worauf es ankommt.
      await page.setContent(html(tile, lang), { waitUntil: "load" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))),
        );
      });
      const raw = await page.screenshot({ type: "png" });
      // Unkomprimiert waren die Kacheln bis 950 kB — im Material-Reiter liegen
      // sechs davon nebeneinander als Vorschau. Die Farbpalette reicht hier,
      // weil auf der Kachel kaum Fotografie steht.
      const buf = await sharp(raw).png({ palette: true, quality: 92, effort: 8 }).toBuffer();
      const file = join(dir, `${tile.key}.png`);
      writeFileSync(file, buf);
      console.log(`  ${lang}/${tile.key}.png  ${Math.round(buf.length / 1024)} kB`);
    }
  }
} finally {
  await browser.close();
}

console.log(`\nFertig — ${langs.length * TILES.length} Kacheln unter public/press/story/`);
