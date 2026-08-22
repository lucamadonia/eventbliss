/**
 * Vollständigkeit und Eigenständigkeit der zehn Sprachfassungen.
 *
 * Warum es diesen Test gibt: Im August 2026 stellte sich heraus, dass sechs
 * Sprachdateien ganze Abschnitte enthielten, die aus dem Spanischen kopiert
 * statt übersetzt worden waren — `nativeDashboard`, `nativeGuests`,
 * `nativeSchedule`, `nativeResponses`, `nativeAdmin`, `nativeDrinks`. Wer die
 * App auf Französisch stellte, bekam den kompletten Event-Bereich auf Spanisch.
 *
 * Das Tückische daran: Nichts schlug fehl. Kein fehlender Schlüssel, kein
 * Rückfall auf Englisch, keine Warnung — nur der falsche Text. Aufgefallen ist
 * es erst, als jemand Screenshots für den App Store ansah.
 *
 * Diese drei Prüfungen hätten es am Tag des Merges gestoppt.
 */
import { describe, it, expect } from 'vitest';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import itLoc from './locales/it.json';
import nl from './locales/nl.json';
import pt from './locales/pt.json';
import pl from './locales/pl.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';

type Tree = Record<string, unknown>;

const LOCALES: Record<string, Tree> = {
  de: de as Tree, en: en as Tree, es: es as Tree, fr: fr as Tree, it: itLoc as Tree,
  nl: nl as Tree, pt: pt as Tree, pl: pl as Tree, tr: tr as Tree, ar: ar as Tree,
};
const CODES = Object.keys(LOCALES);

function flatten(node: unknown, prefix = '', out: Record<string, string> = {}) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return out;
  for (const [key, value] of Object.entries(node as Tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else flatten(value, path, out);
  }
  return out;
}

const FLAT: Record<string, Record<string, string>> = {};
for (const code of CODES) FLAT[code] = flatten(LOCALES[code]);

const section = (key: string) => key.split('.')[0];

/**
 * Zeichenketten, die sprachübergreifend legitim gleich sein dürfen: Markenname,
 * Spielnamen, reine Emoji, Zahlen, Interpunktion. Sie sollen die
 * Ähnlichkeitsmessung nicht verwässern.
 */
function isNeutral(value: string): boolean {
  const v = value.trim();
  if (v.length <= 2) return true;
  if (/^[\p{Emoji}\p{Extended_Pictographic}\s\p{P}\d]+$/u.test(v)) return true;
  return /^(EventBliss|PIXELJAGD|OHRWURM|NAH DRAN|OK|TV)$/i.test(v);
}

describe('Sprachdateien — Vollständigkeit', () => {
  const deKeys = Object.keys(FLAT.de);

  it.each(CODES.filter((c) => c !== 'de'))(
    '%s hat jeden Schlüssel, den Deutsch hat',
    (code) => {
      const missing = deKeys.filter((k) => FLAT[code][k] === undefined);
      // Die Meldung nennt die Abschnitte, nicht 200 Einzelschlüssel — sonst
      // liest sie im CI niemand.
      const bySection: Record<string, number> = {};
      for (const k of missing) bySection[section(k)] = (bySection[section(k)] ?? 0) + 1;
      expect(
        missing.length,
        `${code}.json fehlen ${missing.length} Schlüssel: ` +
          Object.entries(bySection).map(([s, n]) => `${s}:${n}`).join(', ') +
          `\nBeispiele: ${missing.slice(0, 5).join(', ')}`
      ).toBe(0);
    }
  );
});

describe('Sprachdateien — keine Kopien aus anderen Sprachen', () => {
  /**
   * Der eigentliche Wächter.
   *
   * Ein Abschnitt, dessen Texte zu über 85 % Zeichen für Zeichen mit einer
   * anderen Sprache übereinstimmen, wurde kopiert und nicht übersetzt. Die
   * Schwelle ist bewusst tolerant — einzelne gleiche Wörter kommen vor, ein
   * ganzer gleicher Abschnitt nicht.
   */
  const SCHWELLE = 0.85;
  const MIN_STRINGS = 8;

  const sections = [...new Set(Object.keys(FLAT.de).map(section))];

  it.each(CODES)('%s ist in keinem Abschnitt eine Kopie', (code) => {
    const treffer: string[] = [];

    for (const sec of sections) {
      const keys = Object.keys(FLAT[code]).filter(
        (k) => section(k) === sec && !isNeutral(FLAT[code][k])
      );
      if (keys.length < MIN_STRINGS) continue;

      for (const other of CODES) {
        if (other === code) continue;
        const shared = keys.filter((k) => FLAT[other][k] !== undefined);
        if (shared.length < MIN_STRINGS) continue;
        const gleich = shared.filter((k) => FLAT[code][k] === FLAT[other][k]).length;
        if (gleich / shared.length > SCHWELLE) {
          treffer.push(
            `${sec} ist zu ${Math.round((100 * gleich) / shared.length)}% identisch mit ${other} (${gleich}/${shared.length})`
          );
        }
      }
    }

    expect(
      treffer,
      `${code}.json enthält kopierte Abschnitte:\n  ${treffer.join('\n  ')}`
    ).toEqual([]);
  });
});

describe('Sprachdateien — Platzhalter bleiben erhalten', () => {
  /**
   * Ein verlorener Platzhalter zeigt im Betrieb keinen Fehler, sondern einen
   * Satz mit einem Loch: "Willkommen, !" statt "Willkommen, Anna!".
   */
  /**
   * Verglichen wird die MENGE der Platzhalter, nicht ihre Anzahl, und geprüft
   * wird nur in eine Richtung: Der Übersetzung darf keiner fehlen.
   *
   * Beides hat einen Grund. Polnisch und Türkisch brauchen drei Pluralformen
   * ("{{count}} głos_{{count}} głosy_{{count}} głosów") wo Deutsch zwei hat —
   * ein Mengenvergleich würde diese korrekten Übersetzungen fälschlich
   * anschlagen. Und die englischen Nachrichtenvorlagen sind bewusst reicher
   * formuliert als die deutschen: Sie nennen zusätzlich {{honoree}} und
   * {{eventName}}, die der Renderer in MessagesTab.tsx beide befüllt.
   *
   * Gefährlich ist nur der umgekehrte Fall — ein verlorener Platzhalter zeigt
   * im Betrieb keinen Fehler, sondern einen Satz mit Loch: "Willkommen, !".
   */
  const platzhalter = (s: string) =>
    new Set((s.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')));

  /**
   * Bekannte, noch offene Abweichung — bewusst ausgenommen, nicht übersehen.
   *
   * Die deutschen Firmen-Vorlagen (`byType.corporate`) setzen {{honoree}}, die
   * englischen {{eventName}}. Englisch hat dabei recht: Ein Firmenevent hat
   * keinen Ehrengast, also liefert die App für {{honoree}} nichts und im Text
   * klafft eine Lücke ("Die Umfrage zu ␣ schließt am…"). Zu reparieren ist das
   * in zehn Vorlagen mal neun Sprachen — eigener Arbeitsschritt.
   *
   * Diese Ausnahme deckt AUSSCHLIESSLICH die Firmen-Vorlagen ab; jede andere
   * Stelle schlägt weiterhin an.
   */
  const BEKANNTE_ABWEICHUNG = /^messages\.templates\.[a-zA-Z]+\.byType\.corporate$/;

  it.each(CODES.filter((c) => c !== 'de'))(
    '%s verliert keinen {{platzhalter}} aus dem Deutschen',
    (code) => {
      const abweichung: string[] = [];
      for (const [key, deText] of Object.entries(FLAT.de)) {
        const text = FLAT[code][key];
        if (text === undefined) continue; // Vollständigkeit prüft der Test oben
        if (BEKANNTE_ABWEICHUNG.test(key)) continue;
        const soll = platzhalter(deText);
        const ist = platzhalter(text);
        const fehlend = [...soll].filter((p) => !ist.has(p));
        if (fehlend.length) abweichung.push(`${key}: ${fehlend.join(' ')} fehlt`);
      }
      expect(
        abweichung.length,
        `${abweichung.length} Platzhalter gehen verloren:\n  ${abweichung.slice(0, 10).join('\n  ')}`
      ).toBe(0);
    }
  );
});
