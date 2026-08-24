/**
 * Die Registry gegen die Spiele selbst halten.
 *
 * `playable-games.ts` nennt sich "single source of truth", ist es fuer die
 * Spielerzahl aber nur halb: Der Party-Modus sperrt danach, die 21
 * Setup-Bildschirme tragen ihre Grenzen weiterhin selbst. Driftet beides
 * auseinander, plant man zu zweit ein Spiel ein, das mit zwei Personen gar
 * nicht startet — genau der Fehler, den die Sperre verhindern sollte.
 *
 * Der Test liest die Grenzen aus den Setup-Quellen und vergleicht sie. Was er
 * NICHT ablesen kann, faellt nicht still durch, sondern steht in
 * `UNREADABLE` — sonst sieht ein gruener Lauf nach mehr Abdeckung aus, als er
 * hat.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { playableGames } from "./playable-games";

const GAMES_DIR = path.resolve(__dirname, "../games");

/** Kennung → Datei mit dem Setup-Bildschirm. Die Ordnernamen weichen ab. */
const SETUP_FILE: Record<string, string> = {
  bomb: "bomb/BombSetupScreen.tsx",
  headup: "headup/HeadUpGame.tsx",
  taboo: "taboo/TabooGame.tsx",
  category: "category/CategoryGame.tsx",
  "this-or-that": "thisorthat/ThisOrThatGame.tsx",
  hochstapler: "impostor/ImpostorGame.tsx",
  "wer-bin-ich": "whoami/WhoAmIGame.tsx",
  "split-quiz": "splitquiz/SplitQuizGame.tsx",
  "geteilt-gequizzt": "sharedquiz/SharedQuizGame.tsx",
  "wo-ist-was": "findit/FindItGame.tsx",
  "drueck-das-wort": "wordpress/WordPressGame.tsx",
  schnellzeichner: "quickdraw/QuickDrawGame.tsx",
  ohrwurm: "ohrwurm/OhrwurmGame.tsx",
  pixeljagd: "pixeljagd/PixeljagdGame.tsx",
  closeenough: "closeenough/CloseEnoughGame.tsx",
  pantomime: "pantomime/PantomimeGame.tsx",
};

/**
 * Spiele ohne eigene Zahlen im Setup — sie benutzen die Vorgaben von
 * `GameSetup` (2/20). Sie stehen hier, damit sichtbar bleibt, dass der Test
 * sie nicht prueft, statt sie stillschweigend zu bestehen.
 */
const UNREADABLE = [
  "wahrheit-pflicht",
  "flaschendrehen",
  "emoji-raten",
  "fake-or-fact",
  "story-builder",
];

/**
 * Die Grenzen dort ablesen, wo sie EINDEUTIG stehen: im `PlayerSetup`- bzw.
 * `GameSetup`-Element selbst.
 *
 * Die erste Fassung suchte irgendwo in der Datei nach `min={…}` — und griff in
 * `ThisOrThatGame.tsx:1179` einen RUNDEN-Regler ab (`min={5} max={30}`).
 * Ausserdem war ein Zweig nie scharf: In "\bmin=" ist \b in TypeScript ein
 * Backspace-Zeichen, keine Wortgrenze. Der Test war gruen und las trotzdem
 * fast nichts.
 */
function boundsFromSource(rel: string): { min?: number; max?: number } {
  const src = fs.readFileSync(path.join(GAMES_DIR, rel), "utf8");

  // Nur die Setup-Elemente betrachten, nicht die ganze Datei.
  const blocks: string[] = [];
  for (const tag of ["<PlayerSetup", "<GameSetup"]) {
    let i = src.indexOf(tag);
    while (i >= 0) {
      const close = src.indexOf("/>", i);
      blocks.push(src.slice(i, close > 0 ? close : i + 1200));
      i = src.indexOf(tag, i + 1);
    }
  }

  const read = (keys: string[]): number | undefined => {
    for (const block of blocks) {
      for (const key of keys) {
        const m = block.match(new RegExp(key + "=\\{([^}]*)\\}"));
        if (!m) continue;
        // Bei einem Fragezeichen-Ausdruck (`isOnline ? players.length : MAX`)
        // zaehlt der rechte Zweig — der Online-Fall friert die Liste nur ein.
        const tokens = m[1].match(/[A-Za-z_]\w*|\d+/g);
        const last = tokens?.[tokens.length - 1];
        if (!last) continue;
        if (/^\d+$/.test(last)) return Number(last);
        // Konstante aufloesen: `const MIN = 2` oder `const MIN = 2, MAX = 20`.
        const c = src.match(new RegExp("\\b" + last + "\\s*=\\s*(\\d+)"));
        if (c) return Number(c[1]);
      }
    }
    return undefined;
  };

  return { min: read(["minPlayers", "min"]), max: read(["maxPlayers", "max"]) };
}

describe("playable-games — Spielerzahl deckt sich mit den Spielen", () => {
  it("jedes Spiel steht in genau einer der beiden Listen", () => {
    const covered = new Set([...Object.keys(SETUP_FILE), ...UNREADABLE]);
    const missing = playableGames.map((g) => g.id).filter((id) => !covered.has(id));
    expect(
      missing,
      "Neues Spiel in der Registry, aber weder eine Setup-Datei noch als " +
        "unlesbar vermerkt. Ohne Eintrag prueft der Test es nicht.",
    ).toEqual([]);
  });

  it("die Grenzen im Setup entsprechen der Registry", () => {
    const drift: string[] = [];
    let read = 0;

    for (const game of playableGames) {
      const rel = SETUP_FILE[game.id];
      if (!rel) continue;
      const { min, max } = boundsFromSource(rel);
      if (min !== undefined || max !== undefined) read++;
      if (min !== undefined && min !== game.minPlayers) {
        drift.push(`${game.id}: Setup min=${min}, Registry minPlayers=${game.minPlayers}   (${rel})`);
      }
      if (max !== undefined && max !== game.maxPlayers) {
        drift.push(`${game.id}: Setup max=${max}, Registry maxPlayers=${game.maxPlayers}   (${rel})`);
      }
    }

    // Ehrliche Abdeckung: Ein gruener Lauf darf nicht nach mehr aussehen, als
    // er ist. Faellt diese Zahl, hat jemand eine Marke umbenannt und der Test
    // prueft still weniger.
    expect(
      read,
      `Der Test konnte nur bei ${read} von ${Object.keys(SETUP_FILE).length} ` +
        `Spielen ueberhaupt Grenzen ablesen. Sinkt diese Zahl, wurde eine ` +
        `Marke umbenannt und die Pruefung laeuft still ins Leere.`,
    ).toBeGreaterThanOrEqual(16);

    expect(
      drift,
      "Der Party-Modus sperrt nach der Registry, das Spiel selbst prueft " +
        "seine eigenen Zahlen. Weichen sie ab, wird entweder etwas gesperrt, " +
        "das laufen wuerde, oder etwas freigegeben, das nicht startet:" +
        [""].concat(drift).join(String.fromCharCode(10)),
    ).toEqual([]);
  });
});
