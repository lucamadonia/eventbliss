/**
 * answer-match — Freitext-Antworten bewerten.
 *
 * Anspruch: großzügig gegenüber Tippfehlern, Groß-/Kleinschreibung, Umlaut-
 * Schreibweisen und Artikeln — aber streng genug, dass „Tiger" nicht als
 * „Löwe" durchgeht. Eine falsche Antwort kostet Punkte, also darf hier weder
 * zu viel noch zu wenig akzeptiert werden.
 */

/**
 * Vereinheitlicht eine Eingabe: Kleinschreibung, ausgeschriebene Umlaute,
 * Diakritika weg, Interpunktion weg, führende Artikel weg, Mehrfachleerzeichen
 * zusammengezogen.
 *
 * Umlaute werden bewusst VOR der NFD-Zerlegung ausgeschrieben: sonst würde aus
 * „ö" ein „o", und die deutsche Ersatzschreibweise „oe" — die Leute tatsächlich
 * tippen — käme nie auf denselben Wert.
 */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|the|a|an|le|la|les|el|los|il|lo)\s+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein-Distanz, abgebrochen sobald `max` überschritten ist. */
function distanceWithin(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1; // ganze Zeile schon zu weit weg
    prev = cur;
  }
  return prev[b.length];
}

/** Wie viel Tippfehler-Toleranz ist bei dieser Länge noch fair? */
function toleranceFor(len: number): number {
  if (len <= 4) return 0;  // bei „Uhu"/„Ufo" wäre jede Toleranz zu viel
  if (len <= 8) return 1;
  return 2;
}

/**
 * Ist die Eingabe richtig? Geprüft wird gegen die Hauptantwort und alle
 * Aliase (z. B. Übersetzungen oder gebräuchliche Zweitnamen).
 */
export function isCorrectAnswer(input: string, answer: string, aliases: string[] = []): boolean {
  const got = normalizeAnswer(input);
  if (!got) return false;

  for (const candidate of [answer, ...aliases]) {
    const want = normalizeAnswer(candidate);
    if (!want) continue;
    if (got === want) return true;
    const tol = toleranceFor(want.length);
    if (tol > 0 && distanceWithin(got, want, tol) <= tol) return true;
  }
  return false;
}
