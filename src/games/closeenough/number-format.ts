/**
 * CLOSE ENOUGH — Zahlen sprachbewusst lesen und schreiben.
 *
 * Der Grund für ein eigenes Modul: `parseFloat('2.500.000')` liefert **2**.
 * Im Deutschen sind das zweieinhalb Millionen. Wer das falsch einliest, macht
 * aus einer perfekten Schätzung den letzten Platz — ohne dass irgendwo ein
 * Fehler sichtbar würde.
 *
 * Dazu kommt Arabisch: `Intl.NumberFormat('ar')` liefert arabisch-indische
 * Ziffern (٢٥٠٠٠٠٠). Wer die nicht annimmt, macht das Spiel für arabische
 * Spieler unbedienbar — sie tippen auf ihrer Tastatur genau diese Zeichen.
 */

/** Arabisch-indische und erweiterte arabisch-indische Ziffern → ASCII. */
const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

const toAscii = (s: string) => s.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d);

/** Welches Zeichen trennt in dieser Sprache die Dezimalstellen? */
function decimalSeparator(lang: string): string {
  try {
    const parts = new Intl.NumberFormat(lang).formatToParts(1.1);
    return parts.find((p) => p.type === 'decimal')?.value ?? '.';
  } catch {
    return '.';
  }
}

/**
 * Eingabetext in eine Zahl wandeln. Liefert `null`, wenn nichts Sinnvolles
 * darin steht — der Aufrufer soll dann nicht werten, nicht raten.
 */
export function parseNumber(input: string, lang = 'de'): number | null {
  if (!input) return null;

  let s = toAscii(String(input));

  // Leerzeichen aller Art raus, auch das schmale geschützte, das
  // Intl.NumberFormat im Französischen als Tausendertrenner setzt.
  s = s.replace(/[\s   ']/g, '').trim();
  if (!s) return null;

  const dec = decimalSeparator(lang);
  const other = dec === ',' ? '.' : ',';

  // Der Trenner, der NICHT für Dezimalstellen steht, gruppiert Tausender und
  // fliegt ersatzlos raus. Der Dezimaltrenner wird zum Punkt.
  s = s.split(other).join('');
  s = s.split(dec).join('.');

  // Mehrdeutigkeit auflösen: Steht nach dem einzigen Punkt eine Dreiergruppe,
  // ist es fast sicher eine Tausendergruppierung — "2.500" heißt
  // zweitausendfünfhundert, nicht zwei Komma fünf.
  if (/^-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '');

  // Alles Übrige, was keine Ziffer, kein Punkt und kein führendes Minus ist,
  // verwerfen — Einheiten, Fragezeichen, Tippfehler.
  const negative = s.startsWith('-');
  s = s.replace(/[^\d.]/g, '');
  if (!/\d/.test(s)) return null;

  const n = Number(s) * (negative ? -1 : 1);
  return Number.isFinite(n) ? n : null;
}

/** Zahl in der Sprache des Spielers ausgeben. */
export function formatNumber(value: number, lang = 'de', maxFractionDigits = 2): string {
  try {
    return new Intl.NumberFormat(lang, { maximumFractionDigits: maxFractionDigits }).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Eingabe während des Tippens gruppieren.
 *
 * Ohne das vertippt sich jeder bei sieben Nullen — und hier ist eine
 * verrutschte Null der Unterschied zwischen erstem und letztem Platz. Eine noch
 * unfertige Nachkommastelle ("2,") bleibt stehen, sonst ließe sich das Komma
 * gar nicht tippen.
 */
export function formatWhileTyping(input: string, lang = 'de'): string {
  const dec = decimalSeparator(lang);
  const raw = toAscii(String(input));
  const n = parseNumber(input, lang);
  if (n === null) return input;

  // Nachkommastellen unangetastet lassen: Intl würde sie beim Tippen runden.
  const decIdx = raw.indexOf(dec);
  const fraction = decIdx >= 0 ? raw.slice(decIdx + 1).replace(/\D/g, '') : '';
  const trailing = decIdx >= 0 && !fraction ? dec : '';

  const whole = Math.trunc(Math.abs(n));
  const sign = n < 0 ? '-' : '';
  return sign + formatNumber(whole, lang, 0) + (fraction ? dec + fraction : trailing);
}

/**
 * Relative Abweichung eines Tipps von der Wahrheit.
 *
 * Relativ, nicht absolut: Die Fragen reichen von „8 Beine" bis „2 500 000
 * Liter". Absolut gerechnet wäre bei großen Zahlen jeder gleich weit daneben.
 * Der Nenner ist gegen Null abgesichert, sonst käme Unendlich heraus.
 */
export function relativeError(guess: number, truth: number): number {
  return Math.abs(guess - truth) / Math.max(Math.abs(truth), 1);
}
