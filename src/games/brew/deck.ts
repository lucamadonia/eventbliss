/**
 * deck.ts — reine Spiellogik fuer GEBRAEU (Zutaten austeilen, Stapel bauen,
 * Bust-Karten verteilen, Rezept-Fortschritt pruefen).
 *
 * Bewusst ohne React und ohne DOM, nach dem Muster von
 * `src/components/native/party/setlist.ts` und `src/games/tv/party-map.ts`:
 * Zustandsuebergaenge und Zufall gehoeren in reine, mit Vitest pruefbare
 * Funktionen, nicht in eine Render-Funktion.
 *
 * DER KRITISCHE PUNKT: `buildDeck` erzeugt den Stapel AUS den tatsaechlich
 * ausgeteilten Rezepten, nicht aus einer festen Liste. Brauchen drei Spieler
 * dieselbe Zutat und liegen nur zwei im Stapel, endet die Partie nie — genau
 * das soll hier unmoeglich sein (siehe `deck.test.ts`, Simulationstest).
 *
 * ZWEITER KRITISCHER PUNKT, per Simulation gefunden: Ein Bust vernichtet
 * nicht nur die zuletzt gezogene Karte, sondern das GANZE Tablett samt
 * bereits gesammelter Treffer. Ein erster Entwurf hat das mit einem riesigen
 * Puffer (das Vierfache des Bedarfs) aufgefangen — das macht aber JEDE Zutat
 * reichlich vorhanden und nimmt der Theke ihren Sinn: Ihr Reiz lebt davon,
 * dass genau die gebrauchte Zutat knapp ist und es weh tut, sie liegen zu
 * lassen. Die richtige Loesung ist NACHMISCHEN statt AUFBLAEHEN (siehe
 * `drawCard`): vernichtete Karten wandern auf einen Ablagestapel und kommen
 * zurueck, sobald der Ziehstapel leerlaeuft. `buildDeck` braucht dadurch nur
 * noch eine kleine Reserve, keine grosse.
 */
import {
  INGREDIENTS,
  RECIPES_BY_LENGTH,
  type IngredientId,
  type RecipeLength,
} from "./brew-content";

export type DeckCard = { kind: "ingredient"; id: IngredientId } | { kind: "bust" };

/** Zufallsquelle, injizierbar fuer reproduzierbare Tests. Vorgabe: `Math.random`. */
export type Rng = () => number;

export interface DealtRecipe {
  id: string;
  needs: IngredientId[];
}

/**
 * Fisher-Yates auf einer Kopie — die einzige Mischfunktion in dieser Datei,
 * damit `dealRecipes` und `buildDeck` dieselbe (getestete) Verteilung nutzen.
 */
function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Teilt `playerCount` Rezepte der gewuenschten Laenge aus.
 *
 * ALLE VERSCHIEDEN: Ziehen ohne Zuruecklegen aus `RECIPES_BY_LENGTH[length]`
 * reicht dafuer, weil der Vorrat selbst keine zwei gleichen Rezepte enthaelt.
 * Waeren zwei Rezepte gleich, waere die Theke fuer den zweiten Spieler nutzlos
 * — mein Abfall waere auch fuer ihn Abfall.
 *
 * ALLE GLEICH LANG: automatisch erfuellt, weil alle Rezepte in EINEM
 * Laengen-Eimer per Definition dieselbe Zutatenzahl haben (siehe
 * `brew-content.test.ts`).
 *
 * Mit hoechstens 8 Spielern (Registry-Obergrenze) und 10 Rezepten je Laenge
 * in `brew-content.ts` geht der Vorrat nie aus.
 */
export function dealRecipes(
  playerCount: number,
  length: RecipeLength,
  rng: Rng = Math.random
): DealtRecipe[] {
  const pool = RECIPES_BY_LENGTH[length];
  return shuffled(pool, rng)
    .slice(0, playerCount)
    .map((blueprint) => ({ id: blueprint.id, needs: [...blueprint.needs] }));
}

/**
 * Baut den Ziehstapel (noch OHNE Bust-Karten, siehe `insertBusts`) aus den
 * tatsaechlich ausgeteilten Rezepten.
 *
 * Menge je Zutat = wie oft sie gebraucht wird — KEIN grosser Puffer mehr.
 * Die Loesbarkeits-Garantie kommt vollstaendig vom Nachmischen in `drawCard`:
 * vernichtete Karten kommen zurueck, sobald der Stapel leerlaeuft. Ein
 * zusaetzlicher Puffer wuerde daran nichts mehr retten, sondern nur jede
 * Zutat reichlicher machen und der Theke ihren Reiz nehmen — genau das
 * Problem, das die alte 4x-Formel hatte (siehe Kommentar oben im Datei-Kopf).
 *
 * `RESERVE_PER_INGREDIENT = 0` ist kein Reflex, sondern das Ergebnis der
 * Simulation in `deck.test.ts`: Sie misst, wie oft `drawCard` je Partie
 * nachmischen muss, und 0 traf den gewuenschten Bereich (typischerweise 1-3
 * Nachmischungen je Partie bei 8 Spielern/Laenge 7) am besten — schon eine
 * Reserve von 1 druecke das im Test auf unter 1, also spuerbar Richtung
 * "nie", was wieder zu viel Vorrat bedeutet haette.
 */
export function buildDeck(recipes: DealtRecipe[], rng: Rng = Math.random): DeckCard[] {
  const needed = new Map<IngredientId, number>();
  for (const recipe of recipes) {
    for (const id of recipe.needs) {
      needed.set(id, (needed.get(id) ?? 0) + 1);
    }
  }

  const RESERVE_PER_INGREDIENT = 0;
  const cards: DeckCard[] = [];
  for (const [id, count] of needed) {
    for (let i = 0; i < count + RESERVE_PER_INGREDIENT; i++) {
      cards.push({ kind: "ingredient", id });
    }
  }

  return shuffled(cards, rng);
}

/** Zielabstand zwischen zwei Bust-Karten. */
const BUST_SECTION = 7;

/**
 * Mischt Bust-Karten VERTEILT in einen fertig gemischten Zutatenstapel.
 *
 * BEWUSST NICHT rein zufaellig eingestreut: Bei echtem Zufall haeufen sich
 * Busts erfahrungsgemaess (Gesetz der kleinen Zahlen) — mal ist die halbe
 * Partie harmlos, dann kommen vier Busts hintereinander und ein Spieler
 * verliert reihenweise Tabletts. Stattdessen wird der Stapel in etwa
 * gleich grosse Abschnitte (~`BUST_SECTION` Karten) geteilt, und JEDER
 * Abschnitt bekommt GENAU eine Bust-Karte an einer zufaelligen Position
 * darin — das verteilt das Risiko gleichmaessig, ohne vorhersagbar zu
 * werden (die Position variiert ja weiterhin pro Abschnitt und Partie).
 */
export function insertBusts(cards: DeckCard[], rng: Rng = Math.random): DeckCard[] {
  const n = cards.length;
  if (n === 0) return [];

  // Nie mehr Abschnitte als Karten, sonst gaebe es leere Abschnitte, die
  // ihre Bust-Karte nur direkt an die des Vorgaengers anhaengen koennten.
  const bustCount = Math.max(1, Math.min(n, Math.round(n / BUST_SECTION)));
  const result: DeckCard[] = [];

  for (let i = 0; i < bustCount; i++) {
    const chunkStart = Math.round((i * n) / bustCount);
    const chunkEnd = Math.round(((i + 1) * n) / bustCount);
    const chunk = cards.slice(chunkStart, chunkEnd);

    if (chunk.length === 0) {
      // Praktisch nur bei winzigen Stapeln moeglich. Lieber diesen
      // Abschnitt ohne eigene Bust-Karte lassen, als das Risiko
      // einzugehen, sie direkt an die vorherige anzuschliessen.
      continue;
    }

    // Zufaelliger Startversatz PRO Abschnitt (nicht nur beim ersten) —
    // sonst waeren z. B. immer genau die letzten Karten jedes Abschnitts
    // sicher, und die Position waere nach der ersten Runde durchschaubar.
    let pos = Math.floor(rng() * (chunk.length + 1));

    // Nie direkt an eine Bust-Karte aus dem vorigen Abschnitt anschliessen
    // — sonst koennten zwei Busts hintereinander liegen und ein einziger
    // Zug wuerde ueber halbe Partien entscheiden.
    if (pos === 0 && result[result.length - 1]?.kind === "bust") {
      pos = 1;
    }

    result.push(...chunk.slice(0, pos), { kind: "bust" }, ...chunk.slice(pos));
  }

  return result;
}

/** Ergebnis eines Zugs vom Stapel — siehe `drawCard`. */
export interface DrawResult {
  card: DeckCard;
  /** Der Ziehstapel NACH diesem Zug. */
  drawPile: DeckCard[];
  /** Der Ablagestapel NACH diesem Zug. */
  discardPile: DeckCard[];
  /** true, genau wenn fuer DIESEN Zug nachgemischt werden musste. */
  reshuffled: boolean;
}

/**
 * Zieht die oberste Karte vom Ziehstapel.
 *
 * NACHMISCHEN STATT AUFBLAEHEN: Ist der Ziehstapel leer, wird zuerst der
 * Ablagestapel — die durch Busts vernichteten Karten, BUST-KARTEN
 * EINGESCHLOSSEN — gemischt und wird selbst zum neuen Ziehstapel. Die
 * Bust-Karten muessen mit zurueck: sonst waere die zweite Haelfte einer
 * langen Partie gefahrlos, weil alle Bust-Karten schon aus dem ersten
 * Durchgang verbraucht sind.
 *
 * Die Funktion prueft und mischt selbst — der Aufrufer (`BrewGame`) muss
 * weder wissen noch selbst berechnen, WANN nachgemischt werden muss. Er
 * muss nur `card.kind === "bust"` behandeln (Tablett + die gezogene
 * Bust-Karte selbst auf `discardPile` legen) und sonst die zurueckgegebenen
 * `drawPile`/`discardPile` als neuen Zustand uebernehmen.
 *
 * `null` heisst: auch der Ablagestapel ist leer — ueberhaupt keine Karte
 * mehr im Umlauf. Das darf laut Spielregeln nie vorkommen (jede Zutat
 * steckt immer irgendwo: Stapel, Ablage, Theke oder ein Glas), aber eine
 * reine Funktion darf dafuer nicht werfen — `BrewGame` kann `null` als
 * "gerade nichts zu ziehen" behandeln, statt abzustuerzen.
 */
export function drawCard(
  drawPile: DeckCard[],
  discardPile: DeckCard[],
  rng: Rng = Math.random
): DrawResult | null {
  if (drawPile.length > 0) {
    const [card, ...rest] = drawPile;
    return { card, drawPile: rest, discardPile, reshuffled: false };
  }

  if (discardPile.length === 0) return null;

  const [card, ...rest] = shuffled(discardPile, rng);
  return { card, drawPile: rest, discardPile: [], reshuffled: true };
}

/** Rezept-Zutaten, die im Glas noch fehlen. Dubletten im Glas zaehlen nur einmal. */
export function missingFor(recipe: DealtRecipe, glass: IngredientId[]): IngredientId[] {
  const have = new Set(glass);
  return recipe.needs.filter((id) => !have.has(id));
}

/** Ist das Rezept mit diesem Glasinhalt fertig? */
export function isComplete(recipe: DealtRecipe, glass: IngredientId[]): boolean {
  return missingFor(recipe, glass).length === 0;
}

// Re-Export, damit `import type { IngredientId } from "./deck"` in Tests und
// spaeter in BrewGame.tsx funktioniert, ohne zusaetzlich `brew-content`
// importieren zu muessen.
export type { IngredientId };
export { INGREDIENTS };
