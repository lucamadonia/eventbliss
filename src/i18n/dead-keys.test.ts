/**
 * Tote i18n-Keys aufspueren.
 *
 * WARUM ES DIESEN TEST GIBT
 * `locale-integrity.test.ts` prueft die eine Richtung: Hat jede Sprache alle
 * Keys, die Deutsch hat? Die andere Richtung war blind — ein `t('foo.bar')`,
 * dessen Key in KEINER Sprachdatei steht, faellt dort nicht auf.
 *
 * Genau so blieb `dashboard.form.valuesLocked` unentdeckt: Der Aufruf trug
 * einen deutschen Inline-Notnagel, i18next lieferte brav diesen Notnagel aus,
 * und der Nutzer sah auf Englisch deutschen Text — waehrend alle Sprachtests
 * gruen blieben. Dasselbe traf den kompletten Namensraum `tv.partyNight.*`,
 * der ausgeliefert wurde, ohne dass je ein Key existierte.
 *
 * Der Notnagel ist das Tarnnetz: Ohne ihn zeigte i18next den nackten Key und
 * jeder haette es sofort gesehen. Deshalb prueft dieser Test die Keys selbst
 * und nicht das sichtbare Ergebnis.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");
const EN = path.join(SRC, "i18n/locales/en.json");

/**
 * Nur String-Literale. Dynamisch gebaute Keys (`t(variable)`, Template-Strings
 * mit `${}`) sind statisch nicht aufloesbar — die werden bewusst uebersprungen.
 * Lieber ein paar Faelle verpassen als Fehlalarme erzeugen, denn ein Test, dem
 * man nicht traut, wird abgeschaltet.
 */
const T_CALL = /\bt\(\s*(['"`])([a-zA-Z0-9_.]+)\1/g;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

/** Loest einen punktgetrennten Pfad im Uebersetzungsbaum auf. */
function resolves(tree: unknown, key: string): boolean {
  let cur: unknown = tree;
  for (const part of key.split(".")) {
    if (cur == null || typeof cur !== "object") return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur != null;
}

describe("i18n — keine toten Keys", () => {
  it("jeder t('…')-Aufruf hat einen Key in en.json", () => {
    const en = JSON.parse(fs.readFileSync(EN, "utf8"));
    const files = collectSourceFiles(SRC);

    const missing: string[] = [];
    const seen = new Set<string>();

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      let match: RegExpExecArray | null;
      while ((match = T_CALL.exec(source))) {
        const key = match[2];
        // Ohne Punkt ist es kein Namensraum-Key, sondern fast immer ein
        // Funktionsaufruf, der zufaellig `t` heisst.
        if (!key.includes(".")) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!resolves(en, key)) {
          missing.push(`${key}   <- ${path.relative(SRC, file).replace(/\\/g, "/")}`);
        }
      }
    }

    expect(
      missing,
      `Diese Keys werden im Code benutzt, existieren aber in en.json nicht.\n` +
        `Bei einem Aufruf mit deutschem Notnagel sieht der Nutzer deutschen Text —\n` +
        `in JEDER Sprache, ohne dass ein anderer Test anschlaegt.\n\n` +
        missing.join("\n") +
        "\n",
    ).toEqual([]);
  });
});
