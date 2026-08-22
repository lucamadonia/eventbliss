/**
 * scoring.ts — Platzierungspunkte für den Party-Modus.
 *
 * Warum nicht einfach die Rohpunkte addieren: Jedes der 21 Spiele hat eine
 * eigene Zahlenwelt. OHRWURM zählt Karten (5–10), DRÜCK DAS WORT zählt Treffer
 * (bis 200). Wer einmal DRÜCK DAS WORT spielt, hätte im Gesamt-Ranking für
 * immer gewonnen. Deshalb zählt für die Party-Tabelle nur der PLATZ im
 * jeweiligen Spiel, nie die Rohpunktzahl.
 *
 * Punkte nach Platz: 1. → 10, 2. → 7, 3. → 5, 4. → 3, 5. → 2, ab 6. → 1.
 *
 * Gleichstand teilt sich den HÖHEREN Wert (Standard-Konkurrenzrang, 1-1-3):
 * zwei Erste bekommen beide 10, der nächste ist Dritter und bekommt 5.
 *
 * Reine Funktionen — kein React, kein localStorage, keine Seiteneffekte.
 */

/** Punkte für Platz 1…6. Ab Platz 6 gilt {@link TRAILING_POINTS}. */
export const PLACEMENT_POINTS: readonly number[] = [10, 7, 5, 3, 2, 1];

/** Trostpunkt für jeden Platz ab 6 — Mitspielen wird nie mit 0 bestraft. */
export const TRAILING_POINTS = 1;

/** Ein gewerteter Teilnehmer: Rohpunkte, Platz und daraus die Party-Punkte. */
export interface RankedPlayer {
  /** Frei wählbarer Schlüssel — Spielername oder Spieler-ID. */
  key: string;
  /** Rohpunktzahl aus dem Spiel (höher = besser). */
  raw: number;
  /** 1-basierter Platz, Gleichstände teilen sich den kleineren Platz. */
  rank: number;
  /** Party-Punkte für diesen Platz. */
  points: number;
}

/**
 * Party-Punkte für einen 1-basierten Platz.
 * Ungültige Plätze (0, negativ, NaN) ergeben 0 statt zu werfen — ein kaputter
 * Wert darf niemals die Gesamttabelle mit Fantasiepunkten verfälschen.
 */
export function pointsForRank(rank: number): number {
  if (!Number.isFinite(rank) || rank < 1) return 0;
  const index = Math.floor(rank) - 1;
  return index < PLACEMENT_POINTS.length ? PLACEMENT_POINTS[index] : TRAILING_POINTS;
}

/**
 * Sortiert die Rohpunkte absteigend und vergibt Plätze + Party-Punkte.
 *
 * Gleichstände bekommen denselben Platz und damit denselben (höheren) Wert;
 * der darauffolgende Platz wird übersprungen (1, 1, 3, 4 …).
 * Nicht-endliche Rohwerte werden als 0 gewertet.
 */
export function rankScores(raw: Record<string, number>): RankedPlayer[] {
  const entries = Object.keys(raw).map((key) => {
    const value = raw[key];
    return { key, raw: typeof value === "number" && Number.isFinite(value) ? value : 0 };
  });

  // Stabile Reihenfolge auch bei Gleichstand: sonst wechselt der angezeigte
  // "Sieger" bei identischer Punktzahl von Render zu Render.
  entries.sort((a, b) => b.raw - a.raw || a.key.localeCompare(b.key));

  const ranked: RankedPlayer[] = [];
  let rank = 0;
  let previous: number | null = null;

  entries.forEach((entry, index) => {
    if (previous === null || entry.raw !== previous) {
      rank = index + 1;
      previous = entry.raw;
    }
    ranked.push({ key: entry.key, raw: entry.raw, rank, points: pointsForRank(rank) });
  });

  return ranked;
}

/** Kurzform von {@link rankScores}: nur die Zuordnung Schlüssel → Party-Punkte. */
export function placementPoints(raw: Record<string, number>): Record<string, number> {
  const points: Record<string, number> = {};
  for (const entry of rankScores(raw)) points[entry.key] = entry.points;
  return points;
}
