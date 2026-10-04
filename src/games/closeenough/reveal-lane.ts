/**
 * Hoehe einer Marken-Zeile in der Aufloesung.
 *
 * Telefon: feste 40 px. Fernseher: aus der Bildschirmhoehe (9 %, mind. 62 px),
 * damit Kugeln und Namen aus 3 m lesbar sind — aber nie so hoch, dass viele
 * uebereinanderliegende Tipps die Achse aus dem Bild schieben: alle Zeilen
 * zusammen bekommen hoechstens 42 % der Hoehe, eine Zeile mindestens 48 px.
 */
export function revealLaneHeight({ tv, lanes, viewportH }: { tv: boolean; lanes: number; viewportH: number }): number {
  if (!tv) return 40;
  const ideal = Math.max(62, Math.round(viewportH * 0.09));
  const fit = Math.floor((viewportH * 0.42) / Math.max(1, lanes));
  return Math.max(48, Math.min(ideal, fit));
}
