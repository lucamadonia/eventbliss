/**
 * removal.ts — GEBRAEU: Spieler mitten in der Partie entfernen (Kick/Verlassen,
 * Masterplan G7 / F13, F14, F19). Rein und ohne React, laeuft nur beim Gastgeber.
 *
 * Regeln:
 * - Der Entfernte verlaesst Reihenfolge und Punkteliste.
 * - Sein Glas (gesicherte Zutaten) geht als Karten auf den Ablagestapel und
 *   kommt per Nachmischen wieder in Umlauf — keine Karte verschwindet.
 * - War er dran: sein ungesichertes Tablett wandert ebenfalls auf die Ablage,
 *   offene Strafe/Aufdeckmoment/Guss enden, und der Zug geht SOFORT an die
 *   naechste Person (in Sitzreihenfolge), die noch im Raum ist.
 * - War er nicht dran: der Index der aktiven Person wird nur verschoben, damit
 *   weiterhin dieselbe Person dran ist.
 * - Steht schon ein Sieger fest (Schlussbild/Ergebnis), bleibt alles, wie es ist.
 */
import type { DeckCard, IngredientId } from "./deck";

export interface BrewRemovalState<P extends { id: string; glass: IngredientId[] }> {
  players: P[];
  activeIdx: number;
  tray: IngredientId[];
  discardPile: DeckCard[];
  winnerId: string | null;
}

export interface BrewRemovalResult<P extends { id: string; glass: IngredientId[] }> {
  players: P[];
  activeIdx: number;
  tray: IngredientId[];
  discardPile: DeckCard[];
  /** true: die aktive Person ist raus — Zug neu ausgeben, offene Eingaben schliessen. */
  activeRemoved: boolean;
}

const asCards = (ids: IngredientId[]): DeckCard[] => ids.map((id) => ({ kind: "ingredient", id }));

/**
 * `presentIds` (optional): wer laut Raum noch da ist. Der naechste Zug geht
 * bevorzugt an jemanden daraus; ohne Angabe zaehlt jeder Verbliebene.
 * Liefert `null`, wenn sich nichts aendert.
 */
export function removeBrewPlayers<P extends { id: string; glass: IngredientId[] }>(
  state: BrewRemovalState<P>,
  removedIds: string[],
  presentIds?: string[],
): BrewRemovalResult<P> | null {
  const gone = new Set(removedIds);
  if (state.winnerId !== null) return null;
  if (!state.players.some((p) => gone.has(p.id))) return null;

  const old = state.players;
  const players = old.filter((p) => !gone.has(p.id));
  const returned: DeckCard[] = old.filter((p) => gone.has(p.id)).flatMap((p) => asCards(p.glass));
  const active = old[state.activeIdx];
  const activeRemoved = !!active && gone.has(active.id);

  let activeIdx: number;
  let tray = state.tray;
  if (!activeRemoved) {
    activeIdx = active ? players.findIndex((p) => p.id === active.id) : 0;
    if (activeIdx < 0) activeIdx = 0;
  } else {
    returned.push(...asCards(state.tray));
    tray = [];
    const present = presentIds ? new Set(presentIds) : null;
    const pick = (requirePresent: boolean): string | undefined => {
      for (let step = 1; step <= old.length; step++) {
        const candidate = old[(state.activeIdx + step) % old.length];
        if (gone.has(candidate.id)) continue;
        if (requirePresent && present && !present.has(candidate.id)) continue;
        return candidate.id;
      }
      return undefined;
    };
    const nextId = pick(true) ?? pick(false);
    activeIdx = nextId ? players.findIndex((p) => p.id === nextId) : 0;
  }

  return {
    players,
    activeIdx,
    tray,
    discardPile: [...state.discardPile, ...returned],
    activeRemoved,
  };
}
