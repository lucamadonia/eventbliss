/**
 * Der ganze Aufnahmelauf: Inhalte umstellen, aufnehmen, Bilder ableiten.
 *
 *   npx vite preview --port 8080        (in einem zweiten Fenster laufen lassen)
 *   EB_EMAIL=... EB_PASS=... node scripts/capture-localized.mjs
 *   EB_EMAIL=... EB_PASS=... node scripts/capture-localized.mjs de en
 *
 * WAS ES LOEST: `_capture_native.mjs` schaltet die Oberflaeche um, aber nicht
 * den Inhalt. Die englischen Store-Bilder zeigten deshalb "Welcome-BBQ an der
 * Finca" unter englischen Reitern. Hier wird vor jeder Sprache erst das
 * Demo-Ereignis umgeschrieben, dann aufgenommen.
 *
 * AM ENDE STEHT DAS EREIGNIS WIEDER AUF DEUTSCH — auch wenn der Lauf
 * abbricht. Ohne das bliebe die Demo im Konto in, sagen wir, Polnisch stehen,
 * und der Naechste, der sie oeffnet, haelt das fuer einen Fehler.
 *
 * PORT 8080 IST PFLICHT. Die CORS-Allowlist der Edge Functions kennt nur 5173
 * und 8080; von 4173 aus verwirft der Browser jeden Aufruf und die App zeigt
 * "Event nicht gefunden" — auf jedem Bildschirm, der ein Ereignis laedt.
 */
import { spawnSync } from "node:child_process";
import { localizeDemo } from "./localize-demo.mjs";
import { DEMO_LANGS } from "./demo-content.mjs";

const BASE = process.env.BASE || "http://localhost:8080";
const langs = process.argv.slice(2).length ? process.argv.slice(2) : DEMO_LANGS;

for (const lang of langs) {
  if (!DEMO_LANGS.includes(lang)) {
    console.error(`Unbekannte Sprache "${lang}" — bekannt: ${DEMO_LANGS.join(", ")}`);
    process.exit(1);
  }
}

/* ── Vorabpruefung ───────────────────────────────────────────────
 *
 * Lieber hier abbrechen als nach zwanzig Minuten 220 Bilder mit einem
 * Fehlerbildschirm darauf zu haben.
 */
try {
  const res = await fetch(BASE, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (e) {
  console.error(
    `\nKein Server auf ${BASE} (${e.message}).\n` +
      "Bitte in einem zweiten Fenster starten:\n" +
      "  npm run build && npx vite preview --port 8080\n",
  );
  process.exit(1);
}

console.log(`Server auf ${BASE} erreichbar.`);
console.log(`Sprachen: ${langs.join(", ")}\n`);

let failed = null;

try {
  for (const lang of langs) {
    console.log(`── ${lang} ───────────────────────────────────`);
    await localizeDemo(lang);

    const run = spawnSync(process.execPath, ["scripts/_capture_native.mjs"], {
      stdio: "inherit",
      env: { ...process.env, LANGS: lang },
    });
    if (run.status !== 0) {
      failed = `Aufnahme fuer "${lang}" fehlgeschlagen (Code ${run.status}).`;
      break;
    }
    console.log("");
  }
} finally {
  // IMMER zurueck auf Deutsch, auch nach einem Abbruch.
  try {
    console.log("── zurueck auf Deutsch ──────────────────────");
    await localizeDemo("de", { quiet: true });
    console.log("  ok\n");
  } catch (e) {
    console.error(
      `\nACHTUNG: Das Demo-Ereignis konnte nicht auf Deutsch zurueckgestellt werden (${e.message}).\n` +
        "Bitte von Hand nachholen:  node scripts/localize-demo.mjs de\n",
    );
  }
}

if (failed) {
  console.error(failed);
  process.exit(1);
}

/* ── Abgeleitete Bilder ──────────────────────────────────────────
 *
 * Die Tour im Influencer-Bereich und die Story-Kacheln rechnen sich aus den
 * Aufnahmen. Wer sie hier vergisst, hat neue Store-Bilder und einen
 * Influencer-Bereich, der weiter den alten Stand zeigt.
 */
for (const script of ["scripts/generate-tour-shots.mjs", "scripts/generate-story-tiles.mjs"]) {
  console.log(`── ${script} ──`);
  const run = spawnSync(process.execPath, [script], { stdio: "inherit" });
  if (run.status !== 0) {
    console.error(`${script} fehlgeschlagen (Code ${run.status}).`);
    process.exit(1);
  }
}

console.log("\nFertig. Bitte die Bilder ansehen, bevor sie ausgeliefert werden.");
