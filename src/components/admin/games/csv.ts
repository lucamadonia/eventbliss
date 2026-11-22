/**
 * csv — echter CSV-Parser (RFC-4180-nah), rein und ohne Abhängigkeiten.
 *
 * Kann: UTF-8-BOM, CRLF/LF/CR, Felder in Anführungszeichen, doppelte
 * Anführungszeichen (""), Trennzeichen und Zeilenumbrüche innerhalb von Feldern,
 * automatische Erkennung von `,` `;` und Tab.
 */

export type Delimiter = ',' | ';' | '\t';

const CANDIDATES: Delimiter[] = [';', ',', '\t'];

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Zählt Trennzeichen der ersten Zeile außerhalb von Anführungszeichen. */
export function detectDelimiter(text: string): Delimiter {
  const src = stripBom(text);
  const counts: Record<Delimiter, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === '\n' || ch === '\r')) break;
    else if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t')) counts[ch]++;
  }
  let best: Delimiter = ',';
  let bestCount = 0;
  for (const d of CANDIDATES) {
    if (counts[d] > bestCount) { best = d; bestCount = counts[d]; }
  }
  return best;
}

export interface CsvResult {
  delimiter: Delimiter;
  rows: string[][];
}

export function parseCsv(input: string, forcedDelimiter?: Delimiter): CsvResult {
  const text = stripBom(input);
  const delimiter = forcedDelimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldStarted = false;

  const endField = () => { row.push(field); field = ''; fieldStarted = false; };
  const endRow = () => {
    endField();
    // Völlig leere Zeilen (nur ein leeres Feld) überspringen.
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && !fieldStarted) { inQuotes = true; fieldStarted = true; continue; }
    if (ch === delimiter) { endField(); continue; }
    if (ch === '\r') { if (text[i + 1] === '\n') i++; endRow(); continue; }
    if (ch === '\n') { endRow(); continue; }
    field += ch;
    fieldStarted = true;
  }
  if (field !== '' || fieldStarted || row.length > 0) endRow();
  return { delimiter, rows };
}

/** Ein Feld für die Ausgabe quoten, wenn nötig. */
export function toCsvField(value: string, delimiter: Delimiter = ';'): string {
  return /["\r\n]/.test(value) || value.includes(delimiter) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][], delimiter: Delimiter = ';'): string {
  return rows.map((r) => r.map((f) => toCsvField(f, delimiter)).join(delimiter)).join('\r\n') + '\r\n';
}
