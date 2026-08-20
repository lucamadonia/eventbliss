/**
 * CLOSE ENOUGH — Vergleichsanker für den Tipp-Knopf.
 *
 * „2 500 000 Liter" sagt niemandem etwas. „In eine Badewanne passen 150 Liter"
 * macht daraus eine Rechnung, die man im Kopf anstellen kann.
 *
 * EIN ANKER JE FRAGERAHMEN, nicht je Einheit. Eine Einheit ist zu grob: Meter
 * deckt Bauwerkshöhen (15–1100), Berghöhen (200–8900) und Tunnellängen bis
 * 60 000 ab. „Ein Wohnhaus ist 10 Meter hoch" hilft beim Kölner Dom und ist
 * beim Gotthard-Basistunnel wertlos. Der Rahmen legt die Größenordnung fest.
 *
 * ZWEI REGELN, ohne die der Anker schadet:
 *
 * 1. Er hängt allein am Rahmen, NIE an der Antwort. Würde er nach der
 *    Größenordnung der Lösung gewählt, verriete er genau die — man wüsste
 *    sofort, ob man bei Tausend oder bei Millionen liegt.
 * 2. Er darf sich nicht selbst verraten. Lautet die Frage „Wie hoch ist der
 *    Brocken?", wäre „Der Brocken ist 1141 Meter hoch" die Lösung, nicht ein
 *    Tipp. Bei Namensgleichheit entfällt der Tipp.
 *
 * Die Sätze selbst stehen als i18n-Schlüssel `games.closeenough.anchors.<key>`
 * in den Sprachdateien — 42 Sätze decken alle 864 Fragen ab.
 */

/**
 * Der Gegenstand, über den der jeweilige Anker spricht — auf Deutsch, klein
 * geschrieben. Dient allein dem Selbstverrats-Abgleich, nicht der Anzeige.
 *
 * Leerer String heißt: Der Anker nennt keinen benannten Gegenstand
 * („ein Wohnhaus", „ein Kinosaal") und kann deshalb nie kollidieren.
 */
export const ANCHOR_SUBJECTS: Record<string, string> = {
  // Länder & Städte
  population: 'münchen',
  area: 'saarland',
  gdp: 'österreich',
  gdp_per_capita: 'polen',
  life_expectancy: 'japan',
  speakers: 'niederländische sprache',
  mains_voltage: '',
  unemployment: 'spanien',
  // Bauwerke
  height_structure: '',
  built_year: 'kölner dom',
  floors: '',
  visitors_year: 'kölner dom',
  cost_project: 'elbphilharmonie',
  length_object: '',
  diameter: '',
  // Natur
  height_mountain: 'brocken',
  length_river: 'main',
  discharge: 'rhein',
  basin_area: 'elbe',
  height_waterfall: 'rheinfall',
  depth: 'bodensee',
  // Tierwelt
  mass_animal: '',
  length_animal: '',
  height_animal: '',
  wingspan_animal: '',
  speed_animal: '',
  // Sport
  capacity_seats: '',
  founded_year: 'fc bayern münchen',
  members: 'adac',
  goals: '',
  matches: '',
  body_height: '',
  track_length: 'nürburgring',
  participants: '',
  // Technik
  released_year: 'iphone',
  units_produced: 'vw käfer',
  speed_vehicle: '',
  range: '',
  mass_object: '',
  wingspan_aircraft: 'airbus a320',
  employees: 'volkswagen',
  revenue: 'apple',
};

const normalise = (s: string) =>
  s.toLowerCase().replace(/[.,'"„“()-]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * i18n-Schlüssel des Ankers — oder `null`, wenn es keinen gibt oder er die
 * Antwort verraten würde.
 *
 * @param frameKey  `frame_key` der Frage; `'custom'` hat keinen Anker.
 * @param questionNameDe  `name_i18n.de` der Frage, für den Abgleich.
 */
export function anchorKeyFor(frameKey: string, questionNameDe?: string): string | null {
  const subject = ANCHOR_SUBJECTS[frameKey];
  if (subject === undefined) return null;

  if (subject && questionNameDe) {
    const a = normalise(subject);
    const q = normalise(questionNameDe);
    // Beide Richtungen prüfen: „München" gegen „München" ebenso wie „Main"
    // gegen „Main-Donau-Kanal". Lieber ein Tipp zu wenig als einer, der die
    // Antwort ausplaudert.
    if (a && q && (a === q || a.includes(q) || q.includes(a))) return null;
  }

  return `games.closeenough.anchors.${frameKey}`;
}
