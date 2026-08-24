/**
 * Tests der Set-Listen-Logik.
 *
 * Zwei Dinge duerfen nie kaputtgehen: die Reihenfolge (ein Off-by-one macht
 * aus "Spiel 3 nach oben" ein anderes Spiel) und die Premium-Pruefung — sie
 * ist der Unterschied zwischen einem geplanten Abend und einer Bezahlschranke
 * um 23 Uhr.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  estimateGameMinutes,
  estimateSetlistMinutes,
  findExcessSetlistEntries,
  findLockedSetlistEntries,
  findUnfitSetlistEntries,
  FREE_SETLIST_LIMIT,
  isSetlistEntryLocked,
  isSetlistLengthLocked,
  playerFitFor,
  nextFittingIndex,
  moveSetlistEntry,
  toggleSetlistEntry,
} from "./setlist";
import { recordFreePlay } from "@/games/premium/gameConfig";

const PREMIUM_GAME = "hochstapler"; // tier: premium, freeRoundsLimit: 2
const FREE_GAME = "bomb";

/** Minimaler localStorage-Ersatz — die Tests laufen ohne Browser. */
function makeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("Reihenfolge der Set-Liste", () => {
  it("legt beim ersten Tippen an und entfernt beim zweiten", () => {
    expect(toggleSetlistEntry([], "bomb")).toEqual(["bomb"]);
    expect(toggleSetlistEntry(["bomb", "taboo"], "bomb")).toEqual(["taboo"]);
  });

  it("nimmt dasselbe Spiel nie zweimal auf", () => {
    const once = toggleSetlistEntry(["bomb"], "taboo");
    expect(toggleSetlistEntry(once, "taboo")).toEqual(["bomb"]);
  });

  it("tauscht einen Eintrag mit seinem Nachbarn", () => {
    const list = ["a", "b", "c"];
    expect(moveSetlistEntry(list, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveSetlistEntry(list, 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("laesst die Liste an den Raendern unveraendert", () => {
    const list = ["a", "b", "c"];
    expect(moveSetlistEntry(list, 0, -1)).toBe(list);
    expect(moveSetlistEntry(list, 2, 1)).toBe(list);
    expect(moveSetlistEntry(list, 9, -1)).toBe(list);
  });

  it("veraendert die Vorlage nicht", () => {
    const list = ["a", "b"];
    moveSetlistEntry(list, 0, 1);
    toggleSetlistEntry(list, "c");
    expect(list).toEqual(["a", "b"]);
  });
});

describe("Dauerschaetzung", () => {
  it("waechst mit der Spielerzahl, aber erst ab dem fuenften", () => {
    const four = estimateGameMinutes("taboo", 4);
    expect(estimateGameMinutes("taboo", 2)).toBe(four);
    expect(estimateGameMinutes("taboo", 8)).toBeGreaterThan(four);
  });

  it("gibt unbekannten Kennungen einen Standardwert statt null", () => {
    expect(estimateGameMinutes("gibt-es-nicht", 4)).toBeGreaterThan(0);
  });

  it("summiert die ganze Liste", () => {
    const total = estimateSetlistMinutes(["bomb", "taboo"], 4);
    expect(total).toBe(estimateGameMinutes("bomb", 4) + estimateGameMinutes("taboo", 4));
  });

  it("ist fuer eine leere Liste null", () => {
    expect(estimateSetlistMinutes([], 6)).toBe(0);
  });
});

describe("Premium-Pruefung", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeStorage());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const free = { isPremium: false, premiumUnknown: false };

  it("sperrt ein Premium-Spiel erst, wenn die Gratis-Runden weg sind", () => {
    expect(isSetlistEntryLocked(PREMIUM_GAME, free)).toBe(false);
    recordFreePlay(PREMIUM_GAME);
    expect(isSetlistEntryLocked(PREMIUM_GAME, free)).toBe(false);
    recordFreePlay(PREMIUM_GAME);
    expect(isSetlistEntryLocked(PREMIUM_GAME, free)).toBe(true);
  });

  it("sperrt freie Spiele nie", () => {
    recordFreePlay(FREE_GAME);
    recordFreePlay(FREE_GAME);
    recordFreePlay(FREE_GAME);
    expect(isSetlistEntryLocked(FREE_GAME, free)).toBe(false);
  });

  it("sperrt fuer Premium-Kunden nichts", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    expect(isSetlistEntryLocked(PREMIUM_GAME, { isPremium: true, premiumUnknown: false })).toBe(false);
  });

  it("sperrt nichts, solange der Premium-Status unbekannt ist", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    expect(isSetlistEntryLocked(PREMIUM_GAME, { isPremium: false, premiumUnknown: true })).toBe(false);
  });

  it("oeffnet die Sperre beim Tageswechsel wieder", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    expect(isSetlistEntryLocked(PREMIUM_GAME, free)).toBe(true);
    vi.setSystemTime(new Date("2026-06-13T00:30:00Z"));
    expect(isSetlistEntryLocked(PREMIUM_GAME, free)).toBe(false);
  });

  it("findet in einem Durchlauf genau die gesperrten Eintraege", () => {
    recordFreePlay(PREMIUM_GAME);
    recordFreePlay(PREMIUM_GAME);
    const list = [FREE_GAME, PREMIUM_GAME, "taboo"];
    expect(findLockedSetlistEntries(list, free)).toEqual([PREMIUM_GAME]);
    expect(findLockedSetlistEntries(list, { isPremium: true, premiumUnknown: false })).toEqual([]);
  });
});

/**
 * Ein Abend fasst gratis drei Spiele (FREE_SETLIST_LIMIT). Anders als die
 * Spiel-Sperre oben geht es hier nicht um EIN Spiel, sondern um die Laenge
 * der ganzen Liste — und darum, dass eine bereits laengere Liste dadurch
 * nicht rueckwirkend gekuerzt wird.
 */
describe("Laengen-Grenze der Set-Liste", () => {
  const free = { isPremium: false, premiumUnknown: false };
  const listOf = (n: number) => Array.from({ length: n }, (_, i) => `spiel-${i}`);

  it("blockiert das Hinzufuegen NICHT, solange die Liste unter der Grenze liegt", () => {
    expect(isSetlistLengthLocked(listOf(FREE_SETLIST_LIMIT - 1), free)).toBe(false);
  });

  it("blockiert das Hinzufuegen genau an der Grenze — das naechste Spiel waere das vierte", () => {
    expect(isSetlistLengthLocked(listOf(FREE_SETLIST_LIMIT), free)).toBe(true);
  });

  it("bleibt blockiert, wenn die Liste schon darueber liegt", () => {
    expect(isSetlistLengthLocked(listOf(FREE_SETLIST_LIMIT + 2), free)).toBe(true);
  });

  it("Premium hebt die Grenze komplett auf", () => {
    expect(isSetlistLengthLocked(listOf(FREE_SETLIST_LIMIT + 5), { isPremium: true, premiumUnknown: false })).toBe(
      false
    );
  });

  it("sperrt nichts, solange der Premium-Status unbekannt ist", () => {
    expect(
      isSetlistLengthLocked(listOf(FREE_SETLIST_LIMIT + 5), { isPremium: false, premiumUnknown: true })
    ).toBe(false);
  });

  it("findet an der Grenze selbst keine ueberzaehligen Spiele — genau so viele sind ja gratis erlaubt", () => {
    expect(findExcessSetlistEntries(listOf(FREE_SETLIST_LIMIT), free)).toEqual([]);
  });

  it("nennt bei einer bereits laengeren Liste genau die ueberzaehligen Spiele", () => {
    const list = listOf(FREE_SETLIST_LIMIT + 2);
    expect(findExcessSetlistEntries(list, free)).toEqual(list.slice(FREE_SETLIST_LIMIT));
  });

  it("laesst eine bereits laengere Liste unangetastet — reine Abfrage, kein Kuerzen", () => {
    const list = listOf(FREE_SETLIST_LIMIT + 2);
    const snapshot = [...list];
    findExcessSetlistEntries(list, free);
    isSetlistLengthLocked(list, free);
    expect(list).toEqual(snapshot);
  });

  it("eine bereits laengere Liste bleibt fuer Premium-Kunden ohne ueberzaehlige Spiele", () => {
    const list = listOf(FREE_SETLIST_LIMIT + 4);
    expect(findExcessSetlistEntries(list, { isPremium: true, premiumUnknown: false })).toEqual([]);
  });

  it("nennt fuer eine laengere Liste nichts ueberzaehliges, solange der Premium-Status unbekannt ist", () => {
    const list = listOf(FREE_SETLIST_LIMIT + 4);
    expect(findExcessSetlistEntries(list, { isPremium: false, premiumUnknown: true })).toEqual([]);
  });
});

/**
 * Nicht jedes Spiel passt zu jeder Runde. Ohne diese Regel liess sich zu zweit
 * ein Spiel einplanen, das vier Leute braucht — auffallen wuerde es erst
 * mitten im Abend, wenn es nicht startet.
 */
describe("playerFitFor", () => {
  const game = (minPlayers: number, maxPlayers: number) =>
    ({ minPlayers, maxPlayers } as Parameters<typeof playerFitFor>[0]);

  it("laesst passende Gruppengroessen durch", () => {
    expect(playerFitFor(game(2, 8), 2)).toBe("ok");
    expect(playerFitFor(game(2, 8), 5)).toBe("ok");
    expect(playerFitFor(game(2, 8), 8)).toBe("ok");
  });

  it("erkennt zu kleine Runden", () => {
    expect(playerFitFor(game(4, 15), 2)).toBe("tooFew");
    expect(playerFitFor(game(3, 10), 2)).toBe("tooFew");
  });

  it("erkennt zu grosse Runden — OHRWURM ist auf vier Personen ausgelegt", () => {
    expect(playerFitFor(game(2, 4), 8)).toBe("tooMany");
    expect(playerFitFor(game(2, 4), 5)).toBe("tooMany");
    expect(playerFitFor(game(2, 4), 4)).toBe("ok");
  });

  it("sperrt nichts, solange niemand eingetragen ist", () => {
    // Beim Planen ist die Liste zuerst leer — dann waere sonst alles grau.
    expect(playerFitFor(game(4, 15), 0)).toBe("ok");
  });
});

describe("findUnfitSetlistEntries", () => {
  it("nennt zu zweit genau die Spiele, die mehr Leute brauchen", () => {
    const list = ["taboo", "hochstapler", "pantomime", "bomb"];
    expect(findUnfitSetlistEntries(list, 2).sort()).toEqual(["hochstapler", "pantomime"]);
  });

  /**
   * Die erste Fassung sperrte auch nach oben. Im Geraetetest konnte eine
   * Runde mit neun Gaesten daraufhin vier Spiele nicht mehr waehlen, die alle
   * laufen wuerden. Das Maximum ist eine Bedien-Obergrenze: `PlayerSetup`
   * deaktiviert damit nur den Hinzufuegen-Knopf, OHRWURM kuerzt eine zu
   * grosse Party. Kein Spiel bricht darueber ab.
   */
  it("sperrt NICHT, wenn die Runde zu gross ist", () => {
    // ohrwurm ist auf hoechstens vier ausgelegt — mit acht spielt man
    // trotzdem, dann schauen eben vier zu.
    expect(findUnfitSetlistEntries(["taboo", "ohrwurm"], 8)).toEqual([]);
  });

  it("gibt nichts zurueck, solange niemand eingetragen ist", () => {
    expect(findUnfitSetlistEntries(["hochstapler"], 0)).toEqual([]);
  });

  it("ignoriert unbekannte Kennungen statt zu werfen", () => {
    expect(findUnfitSetlistEntries(["gibtsnicht"], 2)).toEqual([]);
  });
});

/**
 * Die Lobby bot bis hierher stur `playlist[playlistIndex]` an — bei zwei
 * verbliebenen Gaesten startete ihr grosser Knopf damit IMPOSTOR, das vier
 * Personen braucht und gar nicht erst beginnt.
 */
describe("nextFittingIndex", () => {
  // Echte Kennungen, damit der Test die Registry mitprueft und nicht nur sich
  // selbst: hochstapler = ab 4, ohrwurm = bis 4, bomb = 2-x.
  const LIST = ["bomb", "hochstapler", "taboo", "ohrwurm"];

  it("nimmt den faelligen Eintrag, wenn er passt", () => {
    expect(nextFittingIndex(LIST, 0, 4)).toBe(0);
  });

  it("ueberspringt ein Spiel, fuer das die Runde zu klein ist", () => {
    // Zwei Personen: hochstapler (ab 4) faellt raus, taboo kommt dran.
    expect(nextFittingIndex(LIST, 1, 2)).toBe(2);
  });

  it("ueberspringt ein zu grosses Spiel NICHT", () => {
    // Acht Personen, ohrwurm (bis 4) an Position 3: Der Abend laeuft trotzdem
    // hinein. Nur zu wenige Leute sind ein Hindernis — siehe
    // `findUnfitSetlistEntries`.
    expect(nextFittingIndex(LIST, 3, 8)).toBe(3);
  });

  it("liefert -1, wenn ab hier gar nichts mehr passt", () => {
    expect(nextFittingIndex(["hochstapler", "hochstapler"], 0, 2)).toBe(-1);
  });

  it("findet auch den letzten Eintrag", () => {
    expect(nextFittingIndex(["hochstapler", "bomb"], 0, 2)).toBe(1);
  });

  it("sperrt nichts, solange noch niemand eingetragen ist", () => {
    expect(nextFittingIndex(LIST, 0, 0)).toBe(0);
  });

  it("verschluckt eine unbekannte Kennung nicht", () => {
    // Lieber ein Spiel starten, das es nicht gibt (und den Fehler sehen), als
    // einen Eintrag stillschweigend aus der Set-Liste verschwinden zu lassen.
    expect(nextFittingIndex(["gibtesnicht"], 0, 2)).toBe(0);
  });

  it("faengt einen Index jenseits der Liste ab", () => {
    expect(nextFittingIndex(LIST, 99, 4)).toBe(-1);
    expect(nextFittingIndex(LIST, -5, 4)).toBe(0);
  });
});
