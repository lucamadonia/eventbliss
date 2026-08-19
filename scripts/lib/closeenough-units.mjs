/**
 * CLOSE ENOUGH — Einheiten aus Wikidata normalisieren.
 *
 * Wikidata liefert Mengen als `{ amount: "+1620343", unit: ".../Q11573" }`.
 * Die Einheit ist eine Q-Kennung, und dieselbe Eigenschaft kann je Eintrag in
 * einer anderen Einheit stehen — Höhen mal in Metern, mal in Fuß.
 *
 * Jede Dimension hat eine Basiseinheit; `f` rechnet auf diese Basis um.
 *
 * WICHTIG — unbekannte Einheiten werden VERWORFEN, nicht geraten. Ein als
 * Meter gelesener Fuß-Wert erzeugt eine Frage mit falscher Antwort, und die
 * Antwort ist bei diesem Spiel das ganze Produkt. Der Probelauf sammelt
 * unbekannte Kennungen, die dann von Hand ergänzt werden.
 */

/** Q-Kennung → Dimension und Faktor auf die Basiseinheit. */
export const UNITS = {
  // Länge → Basis Meter
  Q11573: { dim: 'length', f: 1 },                 // Meter
  Q828224: { dim: 'length', f: 1000 },             // Kilometer
  Q174728: { dim: 'length', f: 0.01 },             // Zentimeter
  Q174789: { dim: 'length', f: 0.001 },            // Millimeter
  Q253276: { dim: 'length', f: 1609.344 },         // Meile
  Q93318: { dim: 'length', f: 1852 },              // Seemeile
  Q3710: { dim: 'length', f: 0.3048 },             // Fuß
  Q218593: { dim: 'length', f: 0.0254 },           // Zoll
  Q482798: { dim: 'length', f: 0.9144 },           // Yard

  // Fläche → Basis Quadratmeter
  Q25343: { dim: 'area', f: 1 },                   // m²
  Q712226: { dim: 'area', f: 1e6 },                // km²
  Q35852: { dim: 'area', f: 1e4 },                 // Hektar
  Q232291: { dim: 'area', f: 2589988.110336 },     // Quadratmeile
  Q81292: { dim: 'area', f: 4046.8564224 },        // Acre

  // Masse → Basis Kilogramm
  Q11570: { dim: 'mass', f: 1 },                   // Kilogramm
  Q41803: { dim: 'mass', f: 0.001 },               // Gramm
  Q191118: { dim: 'mass', f: 1000 },               // Tonne
  Q100995: { dim: 'mass', f: 0.45359237 },         // Pfund (avoirdupois)
  Q6942: { dim: 'mass', f: 0.028349523125 },       // Unze

  // Geschwindigkeit → Basis km/h
  Q180154: { dim: 'speed', f: 1 },                 // km/h
  Q182429: { dim: 'speed', f: 3.6 },               // m/s
  Q128822: { dim: 'speed', f: 1.852 },             // Knoten
  Q180969: { dim: 'speed', f: 1.609344 },          // mph

  // Volumen → Basis Kubikmeter
  Q25517: { dim: 'volume', f: 1 },                 // m³
  Q11582: { dim: 'volume', f: 0.001 },             // Liter

  // Durchfluss → Basis m³/s
  Q794261: { dim: 'flow', f: 1 },                  // m³/s

  // Spannung, Anteil
  Q25250: { dim: 'voltage', f: 1 },                // Volt
  Q11229: { dim: 'ratio', f: 1 },                  // Prozent

  // Geld → Basis EUR. Feste Kurse; bei Toleranzen von 25-30 % verschwindet
  // der Kursfehler darin. Historische Baukosten werden ohnehin verworfen.
  Q4916: { dim: 'money', f: 1 },                   // Euro
  Q4917: { dim: 'money', f: 0.92 },                // US-Dollar
  Q25224: { dim: 'money', f: 1.17 },               // Pfund Sterling

  // Dimensionslos — Wikidata schreibt hier "1" statt einer URI.
  1: { dim: 'count', f: 1 },
};

/**
 * Zieleinheiten: i18n-Schlüssel → Dimension und Wert in Basiseinheiten.
 * Geteilt wird, nicht multipliziert: 1 km = 1000 m, also `km: { f: 1000 }`.
 */
export const TARGETS = {
  m: { dim: 'length', f: 1 },
  km: { dim: 'length', f: 1000 },
  cm: { dim: 'length', f: 0.01 },
  km2: { dim: 'area', f: 1e6 },
  kg: { dim: 'mass', f: 1 },
  t: { dim: 'mass', f: 1000 },
  kmh: { dim: 'speed', f: 1 },
  liter: { dim: 'volume', f: 0.001 },
  m3s: { dim: 'flow', f: 1 },
  volt: { dim: 'voltage', f: 1 },
  percent: { dim: 'ratio', f: 1 },
  usd: { dim: 'money', f: 0.92 },
  mrd_usd: { dim: 'money', f: 0.92e9 },
  mio_eur: { dim: 'money', f: 1e6 },
  // Zählgrößen: keine Umrechnung, nur eine sprechende Einheit für die Anzeige.
  people: { dim: 'count', f: 1 },
  seats: { dim: 'count', f: 1 },
  floors: { dim: 'count', f: 1 },
  pieces: { dim: 'count', f: 1 },
  members: { dim: 'count', f: 1 },
  goals: { dim: 'count', f: 1 },
  matches: { dim: 'count', f: 1 },
  count: { dim: 'count', f: 1 },
  // Jahre sind eine Zeitdauer, keine Zaehlgroesse: Wikidata liefert die
  // Lebenserwartung mit der Einheit Q577 (Jahr), die in der Dimension
  // 'duration' liegt. Als 'count' eingetragen schlug die Dimensionspruefung
  // fehl und life_expectancy lieferte null Treffer.
  years: { dim: 'duration', f: 31557600 },
  // Jahreszahlen kommen aus dem time-Zweig, nicht aus quantity.
  year: { dim: 'time', f: 1 },
};

/** Unbekannte Einheiten, die ein Lauf gesehen hat: Q-Kennung → Anzahl. */
export const unknownUnits = new Map();

/**
 * Wikidata-Mengenwert auf die Zieleinheit umrechnen.
 * Liefert `null`, wenn die Einheit unbekannt ist oder die Dimension nicht passt.
 */
export function toTarget(amount, unitUri, unitKey) {
  const target = TARGETS[unitKey];
  if (!target) return null;

  // "http://www.wikidata.org/entity/Q11573" → "Q11573"; "1" bleibt "1".
  const qid = String(unitUri ?? '1').split('/').pop();
  const unit = UNITS[qid];
  if (!unit) {
    unknownUnits.set(qid, (unknownUnits.get(qid) ?? 0) + 1);
    return null;
  }
  // Dimensionsprüfung fängt Datenfehler in Wikidata ab: eine Länge, die dort
  // als Fläche steht, ergäbe sonst eine Frage mit absurder Antwort.
  if (unit.dim !== target.dim) return null;

  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  return (value * unit.f) / target.f;
}
