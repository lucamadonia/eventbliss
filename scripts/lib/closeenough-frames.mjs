/**
 * CLOSE ENOUGH — Fragerahmen.
 *
 * Ein Rahmen bindet eine Wikidata-Eigenschaft an eine Zieleinheit, einen
 * Plausibilitätsbereich und eine Toleranz. Der Fragetext selbst steht NICHT
 * hier, sondern als i18n-Schlüssel `games.closeenough.frames.<key>` in den
 * Sprachdateien — 42 Rahmen mal zehn Sprachen sind 420 Sätze statt tausender
 * übersetzter Fragen. Jede künftige Frage kostet damit null Übersetzungsarbeit.
 *
 * `min`/`max` sind das Plausibilitätsfenster in der ZIELEINHEIT. Alles
 * außerhalb fliegt raus — das fängt Wikidata-Tippfehler ab, die sonst eine
 * Frage mit absurder Antwort ergäben.
 *
 * `tol` ist der Prozentradius für den Volltreffer-Bonus, nicht für die Wertung.
 * Gewertet wird immer der nächste Tipp, egal wie weit daneben.
 *
 * ACHTUNG bei Jahreszahlen: Ein Prozentsatz einer Jahreszahl ist riesig. 3 % von
 * 1889 sind ±57 Jahre — die Bonusgrenze läge zwischen 1832 und 1946, also
 * praktisch überall. Jahresrahmen stehen deshalb auf 0,15 %, das sind rund
 * ±3 Jahre.
 *
 * `needsDate` markiert Größen, die sich ändern: dort ist ein P585-Zeitstempel
 * Pflicht, und das Jahr erscheint im Fragetext. Ohne das wirkt jede richtige
 * Antwort falsch, weil der Spieler eine andere Jahresangabe im Kopf hat.
 */

/** Alle Fragerahmen. Schlüssel = i18n-Schlüssel = `frame_key` in der Datenbank. */
export const FRAMES = {
  // ---- Länder & Städte ---------------------------------------------------
  population: { prop: 'P1082', unit: 'people', min: 20_000, max: 1_600_000_000, tol: 15, needsDate: true },
  area: { prop: 'P2046', unit: 'km2', min: 20, max: 20_000_000, tol: 15 },
  gdp: { prop: 'P2131', unit: 'mrd_usd', min: 1, max: 30_000, tol: 25, needsDate: true },
  gdp_per_capita: { prop: 'P2132', unit: 'usd', min: 200, max: 150_000, tol: 20, needsDate: true },
  life_expectancy: { prop: 'P2250', unit: 'years', min: 45, max: 90, tol: 5, needsDate: true },
  speakers: { prop: 'P1098', unit: 'people', min: 100_000, max: 1_500_000_000, tol: 25 },
  mains_voltage: { prop: 'P2884', unit: 'volt', min: 100, max: 250, tol: 5 },
  unemployment: { prop: 'P1198', unit: 'percent', min: 0.3, max: 40, tol: 20, needsDate: true },

  // ---- Bauwerke ----------------------------------------------------------
  height_structure: { prop: 'P2048', unit: 'm', min: 15, max: 1100, tol: 10 },
  built_year: { prop: 'P571', unit: 'year', min: -3000, max: 2030, tol: 0.15, isTime: true },
  floors: { prop: 'P1101', unit: 'floors', min: 3, max: 180, tol: 10 },
  visitors_year: { prop: 'P1174', unit: 'people', min: 50_000, max: 30_000_000, tol: 25, needsDate: true },
  cost_project: { prop: 'P2130', unit: 'mio_eur', min: 1, max: 50_000, tol: 30 },
  length_object: { prop: 'P2043', unit: 'm', min: 0.5, max: 60_000, tol: 10 },
  diameter: { prop: 'P2386', unit: 'm', min: 0.5, max: 500, tol: 12 },

  // ---- Natur -------------------------------------------------------------
  height_mountain: { prop: 'P2044', unit: 'm', min: 200, max: 8900, tol: 8 },
  length_river: { prop: 'P2043', unit: 'km', min: 50, max: 7000, tol: 10 },
  discharge: { prop: 'P2225', unit: 'm3s', min: 5, max: 220_000, tol: 30 },
  basin_area: { prop: 'P2053', unit: 'km2', min: 500, max: 7_000_000, tol: 25 },
  height_waterfall: { prop: 'P2048', unit: 'm', min: 5, max: 1000, tol: 10 },
  depth: { prop: 'P4511', unit: 'm', min: 5, max: 1700, tol: 15 },

  // ---- Tierwelt ----------------------------------------------------------
  mass_animal: { prop: 'P2067', unit: 'kg', min: 0.001, max: 200_000, tol: 25 },
  length_animal: { prop: 'P2043', unit: 'cm', min: 0.5, max: 3400, tol: 20 },
  height_animal: { prop: 'P2048', unit: 'cm', min: 5, max: 600, tol: 15 },
  wingspan_animal: { prop: 'P2050', unit: 'cm', min: 5, max: 360, tol: 15 },
  speed_animal: { prop: 'P2052', unit: 'kmh', min: 0.05, max: 390, tol: 20 },

  // ---- Sport -------------------------------------------------------------
  capacity_seats: { prop: 'P1083', unit: 'seats', min: 3000, max: 160_000, tol: 10 },
  founded_year: { prop: 'P571', unit: 'year', min: 1200, max: 2030, tol: 0.15, isTime: true },
  members: { prop: 'P2124', unit: 'members', min: 1000, max: 400_000, tol: 25, needsDate: true },
  goals: { prop: 'P1351', unit: 'goals', min: 20, max: 1300, tol: 15 },
  matches: { prop: 'P1350', unit: 'matches', min: 50, max: 1400, tol: 15 },
  body_height: { prop: 'P2048', unit: 'cm', min: 140, max: 235, tol: 4 },
  track_length: { prop: 'P2043', unit: 'm', min: 1000, max: 26_000, tol: 8 },
  participants: { prop: 'P1132', unit: 'people', min: 100, max: 60_000, tol: 20 },

  // ---- Technik & Weltraum ------------------------------------------------
  released_year: { prop: 'P571', unit: 'year', min: 1750, max: 2030, tol: 0.15, isTime: true },
  units_produced: { prop: 'P1092', unit: 'pieces', min: 100, max: 3_000_000_000, tol: 30 },
  speed_vehicle: { prop: 'P2052', unit: 'kmh', min: 20, max: 30_000, tol: 12 },
  range: { prop: 'P2073', unit: 'km', min: 50, max: 20_000, tol: 20 },
  mass_object: { prop: 'P2067', unit: 't', min: 0.05, max: 3500, tol: 20 },
  wingspan_aircraft: { prop: 'P2050', unit: 'm', min: 5, max: 90, tol: 10 },
  employees: { prop: 'P1128', unit: 'people', min: 500, max: 2_500_000, tol: 25, needsDate: true },
  revenue: { prop: 'P2139', unit: 'mrd_usd', min: 0.1, max: 700, tol: 25, needsDate: true },
};

/**
 * Welche Rahmen für welche Untergruppe versucht werden — in dieser Reihenfolge.
 *
 * Die Reihenfolge entscheidet bei der Begrenzung auf zwei Fragen je Gegenstand,
 * welche gewinnt. Vorn steht deshalb die interessanteste Größe: Bei einem
 * Wolkenkratzer ist die Höhe die Frage, nicht die Stockwerkszahl.
 */
export const GROUP_FRAMES = {
  'laender.staaten': ['population', 'area', 'gdp_per_capita', 'life_expectancy', 'unemployment'],
  'laender.staedte': ['population', 'founded_year', 'area'],
  'laender.sprachen': ['speakers'],
  'bauwerke.wolkenkratzer': ['height_structure', 'floors', 'built_year'],
  'bauwerke.sakral': ['height_structure', 'built_year', 'visitors_year'],
  'bauwerke.bruecken': ['length_object', 'height_structure', 'built_year'],
  'bauwerke.denkmaeler': ['height_structure', 'built_year', 'visitors_year'],
  'bauwerke.museen': ['visitors_year', 'built_year'],
  'natur.berge': ['height_mountain'],
  'natur.fluesse': ['length_river', 'discharge', 'basin_area'],
  'natur.seen': ['area', 'depth'],
  'natur.inseln': ['area'],
  'natur.wasserfaelle': ['height_waterfall'],
  'natur.parks': ['area', 'founded_year'],
  'tierwelt.saeuger': ['mass_animal', 'speed_animal', 'height_animal', 'length_animal'],
  'tierwelt.voegel': ['wingspan_animal', 'mass_animal', 'speed_animal'],
  'tierwelt.wasser': ['length_animal', 'mass_animal', 'speed_animal'],
  'sport.stadien': ['capacity_seats', 'built_year'],
  'sport.vereine': ['founded_year', 'members'],
  'sport.athleten': ['body_height', 'goals', 'matches'],
  'sport.rennstrecken': ['track_length', 'founded_year'],
  'technik.autos': ['speed_vehicle', 'units_produced', 'released_year'],
  'technik.flugzeuge': ['wingspan_aircraft', 'speed_vehicle', 'range', 'released_year'],
  'technik.raumfahrt': ['mass_object', 'released_year', 'speed_vehicle'],
  'technik.geraete': ['released_year', 'units_produced'],
  'technik.firmen': ['employees', 'revenue', 'founded_year'],
};

/** Untergruppe → Kategorie in der Datenbank. */
export function categoryOf(group) {
  return group.split('.')[0];
}
