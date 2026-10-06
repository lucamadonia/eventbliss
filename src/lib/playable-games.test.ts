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

import { AVAILABILITY_TONE_HEX, availabilityChip, gameAvailability, joinNames, qaForcedSharedDevice, guestPolicy, playableGames, startBlockReason } from "./playable-games";

const GAMES_DIR = path.resolve(__dirname, "../games");

const withDisabledGuestSupport = <T,>(id: string, run: () => T): T => {
  const game = playableGames.find((candidate) => candidate.id === id)!;
  const previous = game.sharedDeviceSupported;
  game.sharedDeviceSupported = false;
  try { return run(); } finally { game.sharedDeviceSupported = previous; }
};

/**
 * Kennung → Spielordner. Gelesen werden ALLE Quellen des Ordners (ohne Tests):
 * Setup-Bildschirme wandern beim Aufraeumen in eigene Dateien (CategorySetup,
 * BrewSetup …) — ein fester Dateiname liess den Test still ins Leere laufen.
 */
const SETUP_FILE: Record<string, string> = {
  bomb: "bomb",
  headup: "headup",
  taboo: "taboo",
  category: "category",
  "this-or-that": "thisorthat",
  hochstapler: "impostor",
  "wer-bin-ich": "whoami",
  "split-quiz": "splitquiz",
  "geteilt-gequizzt": "sharedquiz",
  "wo-ist-was": "findit",
  "drueck-das-wort": "wordpress",
  schnellzeichner: "quickdraw",
  ohrwurm: "ohrwurm",
  pixeljagd: "pixeljagd",
  closeenough: "closeenough",
  pantomime: "pantomime",
  brew: "brew",
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
  const dir = path.join(GAMES_DIR, rel);
  const src = fs.readdirSync(dir)
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
    .join(String.fromCharCode(10));

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

describe("playable-games — geteiltes Handy (Party-Play 7)", () => {
  const MODES = ["turns", "sequential", "secret", "team", "sitout"];

  it("jedes Spiel deklariert sharedDevice", () => {
    const missing = playableGames.filter((g) => !MODES.includes(g.sharedDevice)).map((g) => g.id);
    expect(missing, "Neues Spiel ohne gueltiges sharedDevice").toEqual([]);
  });

  it("alle 22 Party-Spiele fuehren Gaeste am geteilten Handy", () => {
    expect(playableGames).toHaveLength(22);
    expect(playableGames.filter((g) => !g.sharedDeviceSupported || g.sharedDevice === "sitout").map((g) => g.id)).toEqual([]);
  });

  it("nicht angepasste und unbekannte Spiele → Gaeste setzen aus", () => {
    for (const game of playableGames) {
      expect(guestPolicy(game.id)).toBe(game.sharedDeviceSupported ? game.sharedDevice : "sitout");
    }
    expect(guestPolicy("gibt-es-nicht")).toBe("sitout");
  });

  it("angepasste Spiele bekommen ihre eigene Regel", () => {
    const game = playableGames.find((g) => g.sharedDevice === "turns")!;
    const before = game.sharedDeviceSupported;
    try {
      game.sharedDeviceSupported = true;
      expect(guestPolicy(game.id)).toBe("turns");
    } finally {
      game.sharedDeviceSupported = before;
    }
  });
});

describe("gameAvailability — planbar vs. startklar", () => {
  type Ctx = Parameters<typeof gameAvailability>[1];
  const ctx = (over: Partial<Ctx> = {}): Ctx => ({
    mode: "controller-party", phonePlayers: 3, guestPlayers: 0, hostPlays: true, hostPremium: true, ...over,
  });
  const withSupport = <T,>(id: string, fn: () => T): T => {
    const game = playableGames.find((g) => g.id === id)!;
    const before = game.sharedDeviceSupported;
    game.sharedDeviceSupported = true;
    try { return fn(); } finally { game.sharedDeviceSupported = before; }
  };

  it("passende Runde: planbar und startklar", () => {
    expect(gameAvailability("bomb", ctx())).toEqual({
      plannable: true, startable: true, selectable: true, activePlayers: 4, sittingOut: 0, reason: null, missingPlayers: 0,
    });
  });

  it("Premium fehlt: weder planbar noch startklar", () => {
    expect(gameAvailability("hochstapler", ctx({ hostPremium: false }))).toMatchObject({
      plannable: false, startable: false, reason: "premium", missingPlayers: 0,
    });
    expect(gameAvailability("bomb", ctx({ hostPremium: false })).startable).toBe(true);
    // Premium wird vor der Spielerzahl gemeldet
    expect(gameAvailability("hochstapler", ctx({ phonePlayers: 0, hostPremium: false })).reason).toBe("premium");
  });

  it("zu wenige: planbar (es kommen noch Leute), aber nicht startklar", () => {
    expect(gameAvailability("taboo", ctx({ phonePlayers: 1 }))).toMatchObject({
      plannable: true, startable: false, selectable: false, reason: "too_few", activePlayers: 2, missingPlayers: 2,
      reasonParams: { min: 4, count: 2 },
    });
    expect(gameAvailability("taboo", ctx({ phonePlayers: 3 })).startable).toBe(true);
  });

  it("Party-Minimum 2 gilt auch fuer Spiele, die allein liefen", () => {
    expect(gameAvailability("wo-ist-was", ctx({ phonePlayers: 0 }))).toMatchObject({
      plannable: true, startable: false, reason: "too_few", missingPlayers: 1, reasonParams: { min: 2, count: 1 },
    });
  });

  it("zu viele: gesperrt (OHRWURM max. 4)", () => {
    expect(gameAvailability("ohrwurm", ctx({ phonePlayers: 4 }))).toMatchObject({
      plannable: false, startable: false, reason: "too_many", missingPlayers: 0, reasonParams: { max: 4, count: 5 },
    });
  });

  it("Server-Partys sind auf 12 gedeckelt, die lokale Party nicht", () => {
    expect(gameAvailability("bomb", ctx({ phonePlayers: 12 }))).toMatchObject({ reason: "too_many", reasonParams: { max: 12, count: 13 } });
    expect(gameAvailability("bomb", ctx({ phonePlayers: 12, mode: "online-room" })).reason).toBe("too_many");
    expect(gameAvailability("bomb", ctx({ mode: "local-party", phonePlayers: 0, guestPlayers: 12 })).startable).toBe(true);
    expect(gameAvailability("bomb", ctx({ mode: "local-party", phonePlayers: 0, guestPlayers: 20 })).reason).toBe("too_many");
  });

  it("lokale Party: alle zaehlen, niemand setzt aus", () => {
    expect(gameAvailability("pixeljagd", ctx({ mode: "local-party", phonePlayers: 0, guestPlayers: 3 })))
      .toMatchObject({ startable: true, activePlayers: 4, sittingOut: 0 });
  });

  it("Joystick-Party: freigegebene Gaeste spielen auch bei Headup mit", () => {
    expect(gameAvailability("headup", ctx({ phonePlayers: 2, guestPlayers: 3 })))
      .toMatchObject({ startable: true, activePlayers: 6, sittingOut: 0 });
  });

  it("Bombe: Gaeste am Host-Handy spielen mit", () => {
    expect(gameAvailability("bomb", ctx({ phonePlayers: 2, guestPlayers: 3 })))
      .toMatchObject({ startable: true, activePlayers: 6, sittingOut: 0 });
  });

  it("zu wenige, WEIL Gaeste aussetzen — Rueckfall fuer nicht freigegebene Spiele", () => {
    withDisabledGuestSupport("taboo", () => {
      expect(gameAvailability("taboo", ctx({ phonePlayers: 1, guestPlayers: 3 }))).toEqual({
        plannable: true, startable: false, selectable: false, activePlayers: 2, sittingOut: 3,
        reason: "guests_sit_out_too_few", missingPlayers: 2, reasonParams: { min: 4, count: 2, sittingOut: 3 },
      });
      // Auch mit allen Gaesten zu wenige → schlicht too_few
      expect(gameAvailability("taboo", ctx({ phonePlayers: 0, guestPlayers: 1 }))).toMatchObject({ reason: "too_few", missingPlayers: 3 });
    });
  });

  it("angepasstes Spiel: Gaeste spielen mit und zaehlen", () => {
    withSupport("taboo", () => {
      expect(gameAvailability("taboo", ctx({ phonePlayers: 1, guestPlayers: 3 })))
        .toMatchObject({ startable: true, activePlayers: 5, sittingOut: 0 });
    });
  });

  it("Host spielt nicht mit → zaehlt nicht", () => {
    expect(gameAvailability("bomb", ctx({ phonePlayers: 1, hostPlays: false })).reason).toBe("too_few");
    expect(gameAvailability("bomb", ctx({ phonePlayers: 2, hostPlays: false })).activePlayers).toBe(2);
  });

  it("unbekanntes Spiel: eigener Grund, gesperrt", () => {
    expect(gameAvailability("gibt-es-nicht", ctx())).toMatchObject({ plannable: false, startable: false, reason: "unknown_game" });
  });

  it("unsinnige Zahlen werden als 0 gelesen", () => {
    expect(gameAvailability("bomb", ctx({ phonePlayers: -3, guestPlayers: Number.NaN })))
      .toMatchObject({ activePlayers: 1, sittingOut: 0, reason: "too_few", missingPlayers: 1 });
  });

  it("selectable (veraltet) == startable in jeder Lage", () => {
    for (const g of playableGames) {
      for (let n = 0; n <= 14; n++) {
        const a = gameAvailability(g.id, ctx({ phonePlayers: n, hostPremium: n % 2 === 0 }));
        expect(a.selectable, `${g.id}@${n}`).toBe(a.startable);
        expect(a.startable && !a.plannable, `${g.id}@${n}`).toBe(false);
      }
    }
  });

  it("Grenzen je Spiel: planbar ab 1, startklar von Minimum bis Maximum, darueber gesperrt", () => {
    for (const g of playableGames) {
      const min = Math.max(2, g.minPlayers);
      const max = Math.min(g.maxPlayers, 12);
      const at = (n: number) => gameAvailability(g.id, ctx({ phonePlayers: n - 1 }));
      for (let n = 1; n < min; n++) {
        expect(at(n), `${g.id}@${n}`).toMatchObject({ plannable: true, startable: false, missingPlayers: min - n });
      }
      expect(at(min), g.id).toMatchObject({ plannable: true, startable: true, missingPlayers: 0 });
      expect(at(max), g.id).toMatchObject({ plannable: true, startable: true });
      expect(at(max + 1), g.id).toMatchObject({ plannable: false, startable: false, reason: "too_many" });
    }
  });
});

describe("startBlockReason / availabilityChip (Design §4.1)", () => {
  type Ctx = Parameters<typeof gameAvailability>[1];
  const ctx = (over: Partial<Ctx> = {}): Ctx => ({
    mode: "controller-party", phonePlayers: 3, guestPlayers: 0, hostPlays: true, hostPremium: true, ...over,
  });

  it("startBlockReason", () => {
    expect(startBlockReason(gameAvailability("bomb", ctx()))).toBeNull();
    expect(startBlockReason(gameAvailability("taboo", ctx({ phonePlayers: 1 })))).toBe("too_few");
    expect(startBlockReason(gameAvailability("hochstapler", ctx({ hostPremium: false })))).toBe("premium");
  });

  it("passt: cyan, Check", () => {
    expect(availabilityChip(gameAvailability("bomb", ctx()))).toEqual({
      kind: "ok", variant: "fits", tone: "cyan", locked: false, icon: "Check", key: "partyPlay.availability.ready", params: { count: 4 },
    });
  });

  it("Gaeste setzen aus: cyan, Users, mit Namen oder Anzahl", () => {
    withDisabledGuestSupport("headup", () => {
      const a = gameAvailability("headup", ctx({ phonePlayers: 2, guestPlayers: 2 }));
      expect(availabilityChip(a, { sittingOutNames: ["Max", " Gerda "], locale: "de" })).toEqual({
        kind: "ok", variant: "sitout", tone: "cyan", locked: false, icon: "Users",
        key: "partyPlay.availability.sitout", params: { names: "Max und Gerda", count: 2 },
      });
      expect(availabilityChip(a, { sittingOutNames: ["Max", "Gerda", "Ute"], locale: "de" }).params.names).toBe("Max, Gerda und Ute");
      expect(availabilityChip(a)).toMatchObject({ variant: "sitout", key: "partyPlay.availability.sitoutCount", params: { count: 2 } });
    });
  });

  it("zu wenige: amber, Hourglass, nicht gesperrt (nur Start)", () => {
    expect(availabilityChip(gameAvailability("taboo", ctx({ phonePlayers: 1 })))).toEqual({
      kind: "waiting", variant: "waiting", tone: "amber", locked: false, icon: "Hourglass",
      key: "partyPlay.availability.waiting", params: { count: 2, min: 4 },
    });
    withDisabledGuestSupport("taboo", () => {
      const sit = gameAvailability("taboo", ctx({ phonePlayers: 1, guestPlayers: 3 }));
      expect(availabilityChip(sit)).toMatchObject({
        variant: "waiting", tone: "amber", key: "partyPlay.availability.guestsSitOut", params: { count: 2, sittingOut: 3, min: 4 },
      });
      expect(availabilityChip(sit, { sittingOutNames: ["Max", "Gerda", "Ute"], locale: "en" })).toMatchObject({
        key: "partyPlay.availability.guestsSitOutNames", params: { names: "Max, Gerda, and Ute", count: 2 },
      });
    });
  });

  it("zu viele: pink, Ban, gesperrt", () => {
    expect(availabilityChip(gameAvailability("ohrwurm", ctx({ phonePlayers: 4 })))).toEqual({
      kind: "locked", variant: "too_many", tone: "pink", locked: true, icon: "Ban",
      key: "partyPlay.availability.tooMany", params: { max: 4, count: 5 },
    });
  });

  it("Premium: lila, Crown, gesperrt; unbekannt: pink", () => {
    expect(availabilityChip(gameAvailability("hochstapler", ctx({ hostPremium: false })))).toEqual({
      kind: "locked", variant: "premium", tone: "purple", locked: true, icon: "Crown", key: "partyPlay.availability.premium", params: {},
    });
    expect(availabilityChip(gameAvailability("nope", ctx()))).toMatchObject({ variant: "unknown", tone: "pink", locked: true });
  });

  it("Tonfarben aus §4.1", () => {
    expect(AVAILABILITY_TONE_HEX).toEqual({ cyan: "#8ff5ff", amber: "#fbbf24", pink: "#ff6b98", purple: "#df8eff" });
  });

  it("Chip folgt immer den Flags (alle Spiele × Rundengroessen × Gaeste)", () => {
    for (const g of playableGames) {
      for (let n = 0; n <= 13; n++) {
        const a = gameAvailability(g.id, ctx({ phonePlayers: n, guestPlayers: n % 3, hostPremium: n % 2 === 0 }));
        const chip = availabilityChip(a);
        expect(chip.kind, `${g.id}@${n}`).toBe(a.startable ? "ok" : a.plannable ? "waiting" : "locked");
        expect(chip.locked, `${g.id}@${n}`).toBe(!a.plannable);
        expect(chip.variant === "sitout", `${g.id}@${n}`).toBe(a.startable && a.sittingOut > 0);
        expect(chip.key.startsWith("partyPlay.availability."), g.id).toBe(true);
      }
    }
  });
});

describe("joinNames — Namensliste in der Sprache der Oberflaeche", () => {
  it("de / en / ar", () => {
    expect(joinNames(["Max", "Gerda"], "de")).toBe("Max und Gerda");
    expect(joinNames(["Max", "Gerda"], "en")).toBe("Max and Gerda");
    expect(joinNames(["Max", "Gerda", "Ute"], "en")).toBe("Max, Gerda, and Ute");
    const ar = joinNames(["ماكس", "غيردا"], "ar");
    expect(ar).toContain("ماكس");
    expect(ar).toContain("غيردا");
    expect(ar).toMatch(/\sو\s?/); // arabische Konjunktion „و“
    expect(ar).not.toContain("&");
  });

  it("einzelne, leere und ungueltige Eingaben", () => {
    expect(joinNames([], "de")).toBe("");
    expect(joinNames([" Max "], "de")).toBe("Max");
    expect(joinNames(["Max", " ", "Gerda"], "de")).toBe("Max und Gerda");
    expect(joinNames(["Max", "Gerda"], "!!kaputt!!")).toBe("Max & Gerda");
  });

  it("ohne Intl.ListFormat (alte TV-Browser): neutraler Rueckfall", () => {
    const intl = Intl as { ListFormat?: unknown };
    const saved = intl.ListFormat;
    intl.ListFormat = undefined;
    try {
      expect(joinNames(["Max", "Gerda", "Ute"], "de")).toBe("Max, Gerda & Ute");
    } finally {
      intl.ListFormat = saved;
    }
  });
});

describe("availabilityChip — jeder Schluessel existiert in allen 10 Sprachen", () => {
  type Ctx = Parameters<typeof gameAvailability>[1];
  const LOCALES_DIR = path.resolve(__dirname, "../i18n/locales");
  const base: Ctx = { mode: "controller-party", phonePlayers: 3, guestPlayers: 0, hostPlays: true, hostPremium: true };

  /** Alle Varianten, die der Chip ausgeben kann — mit und ohne Namen. */
  const chips = [
    availabilityChip(gameAvailability("bomb", base)),
    withDisabledGuestSupport("headup", () => availabilityChip(gameAvailability("headup", { ...base, guestPlayers: 2 }))),
    withDisabledGuestSupport("headup", () => availabilityChip(gameAvailability("headup", { ...base, guestPlayers: 2 }), { sittingOutNames: ["Max", "Gerda"], locale: "de" })),
    availabilityChip(gameAvailability("taboo", { ...base, phonePlayers: 1 })),
    withDisabledGuestSupport("taboo", () => availabilityChip(gameAvailability("taboo", { ...base, phonePlayers: 1, guestPlayers: 3 }))),
    withDisabledGuestSupport("taboo", () => availabilityChip(gameAvailability("taboo", { ...base, phonePlayers: 1, guestPlayers: 3 }), { sittingOutNames: ["Max"], locale: "de" })),
    availabilityChip(gameAvailability("ohrwurm", { ...base, phonePlayers: 4 })),
    availabilityChip(gameAvailability("hochstapler", { ...base, hostPremium: false })),
    availabilityChip(gameAvailability("gibt-es-nicht", base)),
  ];

  it("deckt alle Varianten ab", () => {
    expect(new Set(chips.map((c) => c.variant))).toEqual(new Set(["fits", "sitout", "waiting", "too_many", "premium", "unknown"]));
  });

  const get = (obj: unknown, dotted: string): unknown =>
    dotted.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);

  const locales = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));

  it("10 Sprachdateien gefunden", () => {
    expect(locales.length).toBe(10);
  });

  it.each(locales)("%s", (file) => {
    const json = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"));
    const missing: string[] = [];
    for (const chip of chips) {
      // Mit `count` sucht i18next erst _one/_other, sonst den Grundschluessel.
      const plain = typeof get(json, chip.key) === "string";
      const plural = typeof get(json, `${chip.key}_one`) === "string" && typeof get(json, `${chip.key}_other`) === "string";
      if (!plain && !plural) missing.push(chip.key);
    }
    expect([...new Set(missing)], `Chip zeigt sonst den rohen Schluessel (${file})`).toEqual([]);
  });
});

describe("guestPolicy — QA-Schalter fuer noch nicht freigegebene Spiele", () => {
  it("nur mit gesetztem Schalter, nur fuer genannte Spiele", () => {
    const g = globalThis as { __partyPlayForceShared?: unknown };
    const unsupported = playableGames.find((x) => x.sharedDevice !== "sitout")!;
    const previous = unsupported.sharedDeviceSupported;
    unsupported.sharedDeviceSupported = false;
    try {
      expect(guestPolicy(unsupported.id)).toBe("sitout");
      g.__partyPlayForceShared = [unsupported.id];
      expect(guestPolicy(unsupported.id)).toBe(unsupported.sharedDevice);
      expect(guestPolicy("gibt-es-nicht")).toBe("sitout");
      g.__partyPlayForceShared = "kein-array";
      expect(guestPolicy(unsupported.id)).toBe("sitout");
    } finally {
      unsupported.sharedDeviceSupported = previous;
      delete g.__partyPlayForceShared;
    }
  });
});

describe("qaForcedSharedDevice — im Produktions-Build wirkungslos", () => {
  it("Prod (DEV false, kein VITE_QA_HARNESS) ignoriert den Schalter, Dev/QA nicht", () => {
    const g = globalThis as { __partyPlayForceShared?: unknown };
    try {
      g.__partyPlayForceShared = ["headup"];
      expect(qaForcedSharedDevice("headup", { DEV: false })).toBe(false);
      expect(qaForcedSharedDevice("headup", { DEV: false, VITE_QA_HARNESS: "" })).toBe(false);
      expect(qaForcedSharedDevice("headup", { DEV: true })).toBe(true);
      expect(qaForcedSharedDevice("headup", { DEV: false, VITE_QA_HARNESS: "1" })).toBe(true);
    } finally {
      delete g.__partyPlayForceShared;
    }
  });
});

describe("sharedDevice — festgelegte Einordnung je Spiel", () => {
  // Bewusste Liste: Aendert sich ein Modus, muss das hier nachgezogen werden —
  // der Laufzeit-Ablauf fuer Gaeste haengt direkt daran.
  const EXPECTED: Record<string, string> = {
    bomb: "turns", headup: "turns", taboo: "turns", category: "turns", "this-or-that": "sequential",
    hochstapler: "secret", "wahrheit-pflicht": "turns", "wer-bin-ich": "secret", flaschendrehen: "turns",
    "emoji-raten": "turns", "fake-or-fact": "turns", schnellzeichner: "turns", "split-quiz": "secret",
    "geteilt-gequizzt": "secret", "story-builder": "turns", "wo-ist-was": "sequential", "drueck-das-wort": "turns",
    ohrwurm: "turns", pixeljagd: "team", closeenough: "sequential", pantomime: "turns", brew: "turns",
  };
  it("jedes Spiel hat den abgestimmten Modus", () => {
    expect(Object.fromEntries(playableGames.map((g) => [g.id, g.sharedDevice]))).toEqual(EXPECTED);
  });
});
