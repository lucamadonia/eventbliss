import { describe, expect, it } from "vitest";
import { RECIPES_BY_LENGTH, type IngredientId, type RecipeLength } from "./brew-content";
import {
  buildDeck,
  dealRecipes,
  drawCard,
  insertBusts,
  isComplete,
  missingFor,
  splitTray,
  ownPlayer,
  type DealtRecipe,
  type DeckCard,
  type Rng,
} from "./deck";

/**
 * Deterministischer PRNG fuer reproduzierbare Tests (kein neues npm-Paket).
 * Mulberry32 — klein, schnell, gut genug fuer Testzwecke.
 */
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LENGTHS: RecipeLength[] = [5, 6, 7];

// ── Simulation: DER wichtigste Test ─────────────────────────────────
//
// Baut eine komplette Partie nach und spielt sie mit einer plausiblen
// Strategie durch: von der Theke nehmen, wenn dort etwas Gebrauchtes liegt,
// sonst ziehen, bis zwei Treffer im Tablett liegen, dann eingiessen. Bust
// vernichtet das Tablett — Tablett UND die gezogene Bust-Karte wandern dabei
// auf den Ablagestapel, den `drawCard` nachmischt, sobald der Ziehstapel
// leerlaeuft. Der Test behauptet: JEDE so gespielte Partie endet mit einem
// Sieger, nie in einer Endlosschleife oder einem Deadlock.
interface SimPlayer {
  recipe: DealtRecipe;
  glass: IngredientId[];
}

interface SimResult {
  finished: boolean;
  /** Wie oft `drawCard` waehrend der Partie nachmischen musste. */
  reshuffles: number;
}

function simulateGame(playerCount: number, length: RecipeLength, rng: Rng): SimResult {
  const recipes = dealRecipes(playerCount, length, rng);
  let drawPile = insertBusts(buildDeck(recipes, rng), rng);
  let discardPile: DeckCard[] = [];
  const players: SimPlayer[] = recipes.map((recipe) => ({ recipe, glass: [] }));

  let theke: IngredientId[] = [];
  let reshuffles = 0;
  // Grosszuegige Obergrenze: bei Erfolg braucht eine Partie nur einen
  // Bruchteil davon. Wird sie erreicht, ist das ein echter Fehlschlag
  // (Deadlock), kein Performance-Limit.
  const MAX_TURNS = 5000;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const player = players[turn % players.length];
    const stillMissing = new Set(missingFor(player.recipe, player.glass));
    if (stillMissing.size === 0) continue; // schon fertig, wartet auf Rundenende

    // Risikofrei von der Theke nehmen, wenn dort etwas Gebrauchtes liegt.
    const thekeHitIndex = theke.findIndex((id) => stillMissing.has(id));
    if (thekeHitIndex >= 0) {
      const [taken] = theke.splice(thekeHitIndex, 1);
      player.glass.push(taken);
    } else {
      // Ziehen, bis zwei VERSCHIEDENE fehlende Zutaten im Tablett liegen,
      // ein Bust kommt oder (theoretisch) gar keine Karte mehr im Umlauf
      // ist. Ziel ist `min(2, stillMissing.size)`, NICHT stur 2 -- fehlt nur
      // noch eine Zutat, waere ein zweiter Treffer sowieso nur ein
      // ueberzaehliges Duplikat (zaehlt laut `isComplete` nicht), und die
      // Strategie wuerde unnoetig weiterziehen und dabei riskieren, genau
      // diese eine, vielleicht knappe Zutat wieder zu verbusten.
      const tray: IngredientId[] = [];
      const hitTypes = new Set<IngredientId>();
      const targetHits = Math.min(2, stillMissing.size);
      let busted = false;
      let bustCard: DeckCard | null = null;
      while (hitTypes.size < targetHits) {
        const result = drawCard(drawPile, discardPile, rng);
        if (!result) break; // wirklich nichts mehr zu ziehen -- Zug endet hier
        drawPile = result.drawPile;
        discardPile = result.discardPile;
        if (result.reshuffled) reshuffles++;
        if (result.card.kind === "bust") {
          busted = true;
          bustCard = result.card;
          break;
        }
        tray.push(result.card.id);
        if (stillMissing.has(result.card.id)) hitTypes.add(result.card.id);
      }
      if (busted) {
        // Tablett UND Bust-Karte auf die Ablage -- sie kommen beim naechsten
        // Leerlauf des Stapels zurueck (siehe `drawCard`).
        discardPile = [
          ...discardPile,
          ...tray.map((id): DeckCard => ({ kind: "ingredient", id })),
          bustCard!,
        ];
      } else {
        // Eingiessen: Rezept-Zutaten ins Glas, der Rest offen auf die Theke.
        // WICHTIG: eine zweite Kopie einer Zutat, die im GLAS schon reicht
        // (z. B. weil `targetHits` 2 verlangt hat, aber die zweite Kopie
        // zufaellig dieselbe Sorte wie die erste war), darf NICHT ebenfalls
        // ins Glas -- sonst verschwindet sie fuer alle anderen, die sie noch
        // brauchen, obwohl sie dem eigenen Rezept nichts mehr bringt. Ein
        // schrumpfendes `remaining`-Set haelt das auseinander.
        const remaining = new Set(stillMissing);
        for (const id of tray) {
          if (remaining.has(id)) {
            player.glass.push(id);
            remaining.delete(id);
          } else {
            theke.push(id);
          }
        }
      }
    }

    if (isComplete(player.recipe, player.glass)) return { finished: true, reshuffles };
  }
  return { finished: false, reshuffles };
}

describe("simulateGame — Partie endet immer", () => {
  it("8 Spieler, Laenge 7, ueber 500 Seeds", () => {
    const seedCount = 500;
    const failures: number[] = [];
    let totalReshuffles = 0;
    for (let seed = 0; seed < seedCount; seed++) {
      const result = simulateGame(8, 7, mulberry32(seed));
      if (!result.finished) failures.push(seed);
      totalReshuffles += result.reshuffles;
    }
    expect(failures).toEqual([]);
    // Typische Nachmisch-Haeufigkeit protokolliert (siehe Bericht): bei
    // RESERVE_PER_INGREDIENT = 2 liegt der Schnitt bei 1-3 Nachmischungen
    // je Partie -- weder "nie" (Puffer zu gross) noch zweistellig (zu klein).
    console.log(`Ø Nachmischungen/Partie (8p/7l, ${seedCount} Seeds): ${(totalReshuffles / seedCount).toFixed(2)}`);
  });

  it("volle Spannweite (2..8 Spieler, Laenge 5/6/7), ueber 100 Seeds je Kombination", () => {
    const failures: string[] = [];
    for (let players = 2; players <= 8; players++) {
      for (const length of LENGTHS) {
        for (let seed = 0; seed < 100; seed++) {
          const result = simulateGame(players, length, mulberry32(seed * 97 + players * 13 + length));
          if (!result.finished) failures.push(`${players}p/${length}l seed=${seed}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// ── drawCard: Nachmischen verhindert den Stillstand ─────────────────

describe("drawCard", () => {
  it("mischt den Ablagestapel nach, wenn der Ziehstapel leerlaeuft", () => {
    const discardPile: DeckCard[] = [
      { kind: "ingredient", id: "cold" },
      { kind: "bust" },
      { kind: "ingredient", id: "sour" },
    ];
    const result = drawCard([], discardPile, mulberry32(1));
    expect(result).not.toBeNull();
    expect(result!.reshuffled).toBe(true);
    // Eine Karte wurde gezogen, der Rest bildet den neuen Ziehstapel.
    expect(result!.drawPile).toHaveLength(discardPile.length - 1);
    expect(result!.discardPile).toEqual([]);
  });

  it("normaler Zug (Ziehstapel nicht leer) mischt nicht nach", () => {
    const drawPile: DeckCard[] = [{ kind: "ingredient", id: "cold" }, { kind: "bust" }];
    const result = drawCard(drawPile, [], mulberry32(1));
    expect(result).toEqual({
      card: { kind: "ingredient", id: "cold" },
      drawPile: [{ kind: "bust" }],
      discardPile: [],
      reshuffled: false,
    });
  });

  it("ein leergelaufener Ziehstapel fuehrt NICHT zum Stillstand, solange die Ablage etwas haelt", () => {
    // Genau das Szenario aus der Simulation: der Ziehstapel ist leer,
    // waehrend Spieler noch Zutaten brauchen -- ein Zug muss trotzdem
    // moeglich bleiben, ueber beliebig viele aufeinanderfolgende Zuege.
    let drawPile: DeckCard[] = [];
    let discardPile: DeckCard[] = Array.from({ length: 12 }, (): DeckCard => ({
      kind: "ingredient",
      id: "cold",
    }));
    const rng = mulberry32(7);
    let drawnTotal = 0;
    for (let i = 0; i < 12; i++) {
      const result = drawCard(drawPile, discardPile, rng);
      expect(result).not.toBeNull();
      drawPile = result!.drawPile;
      discardPile = result!.discardPile;
      drawnTotal++;
    }
    expect(drawnTotal).toBe(12);
    expect(drawPile).toHaveLength(0);
    expect(discardPile).toHaveLength(0);
  });

  it("sind Ziehstapel UND Ablage leer, gibt es `null` statt einer Endlosschleife oder eines Absturzes", () => {
    expect(drawCard([], [], mulberry32(1))).toBeNull();
  });
});

// ── buildDeck: Vorrat reicht immer ──────────────────────────────────

describe("buildDeck", () => {
  it("jede gebrauchte Zutat liegt mindestens so oft im Stapel, wie sie gebraucht wird", () => {
    for (let players = 2; players <= 8; players++) {
      for (const length of LENGTHS) {
        const recipes = dealRecipes(players, length, mulberry32(players * 31 + length));
        const deck = buildDeck(recipes, mulberry32(players * 17 + length));

        const needed = new Map<IngredientId, number>();
        for (const recipe of recipes) {
          for (const id of recipe.needs) needed.set(id, (needed.get(id) ?? 0) + 1);
        }

        const available = new Map<IngredientId, number>();
        for (const card of deck) {
          if (card.kind === "ingredient") {
            available.set(card.id, (available.get(card.id) ?? 0) + 1);
          }
        }

        for (const [id, count] of needed) {
          expect(available.get(id) ?? 0).toBeGreaterThanOrEqual(count);
        }
      }
    }
  });

  it("enthaelt keine Zutat, die niemand braucht", () => {
    const recipes = dealRecipes(4, 6, mulberry32(1));
    const needed = new Set(recipes.flatMap((r) => r.needs));
    const deck = buildDeck(recipes, mulberry32(2));
    for (const card of deck) {
      if (card.kind === "ingredient") expect(needed.has(card.id)).toBe(true);
    }
  });
});

// ── dealRecipes: verschieden und gleich lang ────────────────────────

describe("dealRecipes", () => {
  it("alle Rezepte verschieden und exakt die geforderte Laenge, fuer 2..8 Spieler", () => {
    for (let players = 2; players <= 8; players++) {
      for (const length of LENGTHS) {
        const recipes = dealRecipes(players, length, mulberry32(players * 7 + length));
        expect(recipes).toHaveLength(players);

        const ids = recipes.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);

        for (const recipe of recipes) expect(recipe.needs).toHaveLength(length);
      }
    }
  });

  it("zieht aus RECIPES_BY_LENGTH[length]", () => {
    const recipes = dealRecipes(3, 5, mulberry32(9));
    const pool = new Set(RECIPES_BY_LENGTH[5].map((b) => b.id));
    for (const recipe of recipes) expect(pool.has(recipe.id)).toBe(true);
  });
});

// ── insertBusts: verteilt, nie zwei hintereinander ──────────────────

function makeIngredientCards(count: number): DeckCard[] {
  return Array.from({ length: count }, () => ({ kind: "ingredient", id: "sour" }));
}

/** Groesste Luecke zwischen zwei Busts (und vor dem ersten / nach dem letzten). */
function maxGapBetweenBusts(cards: DeckCard[]): number {
  const bustIndices = cards.map((c, i) => (c.kind === "bust" ? i : -1)).filter((i) => i >= 0);
  const boundaries = [-1, ...bustIndices, cards.length];
  let max = 0;
  for (let i = 1; i < boundaries.length; i++) {
    max = Math.max(max, boundaries[i] - boundaries[i - 1] - 1);
  }
  return max;
}

describe("insertBusts", () => {
  it("keine zwei Bust-Karten direkt hintereinander, ueber viele Seeds und Groessen", () => {
    for (const size of [10, 20, 35, 60, 100]) {
      for (let seed = 0; seed < 50; seed++) {
        const result = insertBusts(makeIngredientCards(size), mulberry32(seed * size + 1));
        for (let i = 1; i < result.length; i++) {
          expect(!(result[i - 1].kind === "bust" && result[i].kind === "bust")).toBe(true);
        }
      }
    }
  });

  it("kein Abschnitt bleibt ohne Bust — die groesste Luecke bleibt begrenzt", () => {
    for (const size of [20, 35, 60, 100]) {
      for (let seed = 0; seed < 50; seed++) {
        const result = insertBusts(makeIngredientCards(size), mulberry32(seed * size + 5));
        // Rechnerisches Worst-Case: ein Bust ganz am ANFANG seines Abschnitts
        // gefolgt vom naechsten Bust ganz am ENDE seines Abschnitts laesst
        // fast zwei volle Abschnittslaengen busts-frei. Bei Abschnitten von
        // ~7-8 Karten (Rundung bei groesseren Stapeln) ergibt das eine
        // Obergrenze von rund 16 — die tatsaechliche Verteilung liegt meist
        // deutlich darunter, aber "meistens" ist keine Testaussage.
        expect(maxGapBetweenBusts(result)).toBeLessThanOrEqual(16);
      }
    }
  });

  it("Kartenzahl bleibt bis auf die eingefuegten Busts erhalten", () => {
    const input = makeIngredientCards(42);
    const result = insertBusts(input, mulberry32(3));
    const bustCount = result.filter((c) => c.kind === "bust").length;
    expect(result.length - bustCount).toBe(input.length);
  });

  it("leerer Stapel bleibt leer", () => {
    expect(insertBusts([], mulberry32(1))).toEqual([]);
  });
});

// ── missingFor / isComplete: Dubletten zaehlen nur einmal ───────────

describe("missingFor / isComplete", () => {
  const recipe: DealtRecipe = { id: "test", needs: ["base1", "sour", "cold"] };

  it("fehlende Zutaten korrekt", () => {
    expect(missingFor(recipe, ["base1"])).toEqual(["sour", "cold"]);
    expect(isComplete(recipe, ["base1"])).toBe(false);
  });

  it("vollstaendiges Glas", () => {
    expect(missingFor(recipe, ["base1", "sour", "cold"])).toEqual([]);
    expect(isComplete(recipe, ["base1", "sour", "cold"])).toBe(true);
  });

  it("ein zweites Eis bringt niemanden weiter", () => {
    expect(missingFor(recipe, ["base1", "base1", "sour"])).toEqual(["cold"]);
    expect(isComplete(recipe, ["base1", "base1", "sour"])).toBe(false);
  });
});

describe("splitTray — was ins Glas wandert und was auf die Theke", () => {
  const recipe = { id: "t1", needs: ["base1", "sour", "herb"] as IngredientId[] };

  it("nimmt nur, was das Rezept noch braucht", () => {
    const r = splitTray(recipe, [], ["sour", "cold", "base1"]);
    expect(r.used).toEqual(["sour", "base1"]);
    expect(r.leftover).toEqual(["cold"]);
  });

  it("zaehlt eine Dublette nur EINMAL als gebraucht", () => {
    // Der eigentliche Grund fuer das `needed.delete`: die zweite `sour` waere
    // im Glas wertlos und muss den anderen auf der Theke zugutekommen.
    const r = splitTray(recipe, [], ["sour", "sour"]);
    expect(r.used).toEqual(["sour"]);
    expect(r.leftover).toEqual(["sour"]);
  });

  it("laesst Bereits-Gesichertes auf der Theke", () => {
    const r = splitTray(recipe, ["base1"], ["base1", "herb"]);
    expect(r.used).toEqual(["herb"]);
    expect(r.leftover).toEqual(["base1"]);
  });

  it("leeres Tablett ergibt zwei leere Listen", () => {
    const r = splitTray(recipe, [], []);
    expect(r.used).toEqual([]);
    expect(r.leftover).toEqual([]);
  });

  it("erhaelt jede Karte — nichts geht verloren, nichts entsteht", () => {
    const tray: IngredientId[] = ["sour", "cold", "sour", "base1", "bitter"];
    const r = splitTray(recipe, [], tray);
    expect([...r.used, ...r.leftover].sort()).toEqual([...tray].sort());
  });
});

describe("ownPlayer — wessen Rezept unter 'Dein Rezept' steht", () => {
  const a = { id: "a" }, b = { id: "b" }, c = { id: "c" };
  const players = [a, b, c];

  it("offline: immer die aktive Person (das Telefon wandert)", () => {
    expect(ownPlayer(players, null, b)).toBe(b);
    expect(ownPlayer(players, null, c)).toBe(c);
  });

  it("online: mein eigenes, auch wenn jemand anderes dran ist", () => {
    // Genau der Fehler, der hier behoben wurde: vorher kam `b` zurueck.
    expect(ownPlayer(players, "a", b)).toBe(a);
    expect(ownPlayer(players, "c", b)).toBe(c);
  });

  it("online und selbst dran: dieselbe Person", () => {
    expect(ownPlayer(players, "b", b)).toBe(b);
  });

  it("unbekannte eigene Kennung faellt auf die aktive Person zurueck", () => {
    // Kann bei einem unvollstaendigen Schnappschuss auftreten — dann lieber
    // ein fremdes Rezept als ein leerer Bildschirm.
    expect(ownPlayer(players, "weg", b)).toBe(b);
  });
});
