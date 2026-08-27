/**
 * scoring.ts — Punktevergabe fuer GEBRAEU.
 *
 * Reine Funktion, keine React/DOM-Abhaengigkeit (siehe `deck.ts`-Kopf fuer
 * die Begruendung). Das Ergebnis ist absichtlich `{ name, score }`-foermig:
 * genau die Form, die `extractGameResult` in
 * `src/games/party/extractResult.ts:178-207` ueber `state.players` automatisch
 * ausliest — die Party-Wertung braucht also keinen Sonderfall fuer dieses
 * Spiel.
 */
import { isComplete, type DealtRecipe, type IngredientId } from "./deck";

export interface BrewScoreInput {
  name: string;
  recipe: DealtRecipe;
  glass: IngredientId[];
  /** Mut-/Praezisionsboni dieser Runde, hart auf drei begrenzt. */
  brewBonus?: number;
}

export interface BrewScore {
  name: string;
  score: number;
}

/**
 * Bonus fuers Fertigwerden.
 *
 * Die Runde endet in dem Moment, in dem EIN Glas komplett ist — alle anderen
 * Spieler behalten also hoechstens (Rezeptlaenge − 1) Zutaten im Glas, weil
 * sie sonst selbst schon fertig gewesen waeren. 5 Punkte reichen darum schon
 * bei der kuerzesten Rezeptlaenge (5) sicher aus, damit "fertig geworden"
 * IMMER mehr zaehlt als "fast fertig, aber nicht mehr dran gewesen" — ohne
 * den Punktestand unnoetig aufzublasen (die Rezepte selbst sind ja schon 5
 * bis 7 Punkte wert).
 */
const FINISH_BONUS = 5;

/**
 * Punkte fuer ein Glas: Anzahl VERSCHIEDENER Rezept-Zutaten darin, plus
 * Bonus bei Fertigstellung.
 *
 * Dubletten zaehlen bewusst nur einmal (`isComplete`/`missingFor` in
 * `deck.ts` folgen derselben Regel) — sonst waere endloses Nachziehen
 * derselben leicht verfuegbaren Zutat eine bessere Strategie als das Risiko,
 * das Rezept tatsaechlich fertigzustellen.
 */
export function scoreFor(input: BrewScoreInput): BrewScore {
  const uniqueInGlass = new Set(input.glass).size;
  const finished = isComplete(input.recipe, input.glass);
  const brewBonus = Math.min(3, Math.max(0, input.brewBonus ?? 0));
  return {
    name: input.name,
    score: uniqueInGlass + brewBonus + (finished ? FINISH_BONUS : 0),
  };
}

/** Bequemlichkeitsfunktion fuer die ganze Runde — Reihenfolge bleibt erhalten. */
export function scoreAll(inputs: BrewScoreInput[]): BrewScore[] {
  return inputs.map(scoreFor);
}
