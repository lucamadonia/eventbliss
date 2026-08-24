/**
 * WHO AM I — jede Sprache muss jede Gruppe fuellen.
 *
 * Dieser Test existiert wegen des schwersten Fehlers, den das Spiel hatte:
 * Der Code filterte die Figuren ueber die UEBERSETZTE Kategorie-Beschriftung
 * mit einer fest eingebauten deutschen Tabelle. In neun von zehn Sprachen traf
 * der Filter nichts, der Pool war leer, und der Startknopf loeste einen
 * Absturz aus, der aussah, als sei er kaputt. Kein einziger Test schlug an —
 * die Sprachtests pruefen nur die `.json`-Dateien, nie die Inhaltspakete.
 *
 * Faellt dieser Test, ist WHO AM I in der genannten Sprache unspielbar.
 */
import { describe, it, expect } from "vitest";

import {
  WHOAMI_PACKS,
  poolForPack,
  whoAmICategoryKey,
  type WhoAmICategoryKey,
} from "./whoami-content";

/** Die vier im Setup waehlbaren Gruppen (SETUP_CATEGORY_IDS in WhoAmIGame). */
const SELECTABLE: WhoAmICategoryKey[] = ["prominente", "tiere", "berufe", "filme"];

/** Unter dieser Zahl wird eine Runde langweilig — und mit 0 stuerzt sie ab. */
const MIN_POOL = 10;

const LANGS = Object.keys(WHOAMI_PACKS);

describe("WHO AM I — Inhalte in allen Sprachen", () => {
  it("kennt zehn Sprachpakete", () => {
    expect(LANGS.sort()).toEqual(
      ["ar", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr"],
    );
  });

  it("jede Beschriftung in jedem Paket hat eine Kennung", () => {
    const unknown: string[] = [];
    for (const [lang, pack] of Object.entries(WHOAMI_PACKS)) {
      for (const c of pack.WHOAMI_CHARACTERS) {
        if (whoAmICategoryKey(c.category) === null) {
          const line = `${lang}: "${c.category}"`;
          if (!unknown.includes(line)) unknown.push(line);
        }
      }
    }
    expect(
      unknown,
      "Diese Kategorie-Beschriftungen fehlen in LABEL_TO_KEY. Jede Figur " +
        "darunter ist fuer das Spiel unsichtbar. Wurde ein Paket neu erzeugt " +
        "und dabei uebersetzt, gehoert die neue Beschriftung in die Tabelle:" +
        [""].concat(unknown).join(String.fromCharCode(10)),
    ).toEqual([]);
  });

  for (const lang of LANGS) {
    for (const key of SELECTABLE) {
      it(`${lang} — Gruppe "${key}" ist spielbar`, () => {
        const pool = poolForPack(WHOAMI_PACKS[lang], key);
        expect(
          pool.length,
          `WHO AM I ist in "${lang}" mit der Gruppe "${key}" nicht spielbar: ` +
            `${pool.length} Figuren. Bei 0 stuerzt der Startknopf ab.`,
        ).toBeGreaterThanOrEqual(MIN_POOL);
      });
    }
  }
});
