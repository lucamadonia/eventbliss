import type { IngredientId } from "./brew-content";

export type BrewRiskTier = "calm" | "simmering" | "unstable" | "critical";

export interface BrewBonusResult {
  multi: boolean;
  perfect: boolean;
  awarded: number;
}

export const MAX_BREW_BONUS = 3;

/**
 * Beschreibt den Einsatz auf dem Tablett, nicht die Wahrscheinlichkeit der
 * naechsten Bust-Karte. So bleibt der Stapel geheim und die wachsende Beute
 * wird trotzdem als spielerisches Risiko lesbar.
 */
export function riskTierFor(traySize: number): BrewRiskTier {
  if (traySize <= 0) return "calm";
  if (traySize <= 2) return "simmering";
  if (traySize <= 4) return "unstable";
  return "critical";
}

/** Bonus eines einzelnen Gusses. Der Rundenzähler wird separat auf 3 gedeckelt. */
export function bonusForPour(used: IngredientId[], leftover: IngredientId[]): BrewBonusResult {
  const multi = used.length >= 2;
  const perfect = multi && leftover.length === 0;
  return { multi, perfect, awarded: Number(multi) + Number(perfect) };
}

export function cappedBrewBonus(current: number, awarded: number): number {
  return Math.min(MAX_BREW_BONUS, Math.max(0, current) + Math.max(0, awarded));
}

/** Intensitaet der visuellen Braukette aus den aktuell passenden Karten. */
export function chainLevelFor(hits: number): 0 | 1 | 2 | 3 {
  if (hits <= 0) return 0;
  if (hits === 1) return 1;
  if (hits === 2) return 2;
  return 3;
}
