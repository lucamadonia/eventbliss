/**
 * OHNE WORTE — die Herausforderungen.
 *
 * Vor jeder Runde bietet das Spiel EINE Herausforderung an. Nimmt der
 * Darsteller sie an, wird die Runde schwerer und alle Treffer zählen doppelt.
 * Lehnt er ab, passiert nichts. Scheitern kostet nichts.
 *
 * Warum kein Einsatz, kein Abzug: Eine Wette mit Risiko führt dazu, dass
 * vorsichtige Gruppen grundsätzlich ablehnen — und dann kommt der Kochlöffel
 * nie zum Einsatz, also genau das, wofür es die Herausforderungen gibt. Ohne
 * Abzug kann Annehmen nur gewinnen, und man nimmt an.
 *
 * Fünf Sorten, damit es nicht nach drei Runden durch ist. Die Sorte wechselt
 * garantiert von Runde zu Runde: zweimal hintereinander „nur eine Hand" fühlt
 * sich nach einem kaputten Spiel an, auch wenn es Zufall war.
 *
 * Die Texte stehen NICHT hier, sondern als i18n-Schlüssel in den zehn
 * Sprachdateien. Hier steht nur, WAS wann gezogen wird.
 */

export type ExtraKind = 'requisit' | 'handicap' | 'stil' | 'tempo' | 'duo';

export interface Extra {
  kind: ExtraKind;
  /** i18n-Schlüssel des Textes: `games.pantomime.extras.<key>`. */
  key: string;
  /** Nur bei `requisit`: `games.pantomime.props.<propKey>`. */
  propKey?: string;
  /** Die Rundenzeit wird halbiert. */
  halfTime: boolean;
  /**
   * Der Darsteller braucht Zeit, den Gegenstand zu holen.
   *
   * Ohne diese Pause liefe die Uhr, während jemand in die Küche rennt — und
   * beim zweiten Mal nimmt dann niemand mehr an.
   */
  needsFetch: boolean;
  /** Ein zweites Teammitglied spielt stumm mit. */
  needsPartner: boolean;
}

/** Treffer zählen bei angenommener Herausforderung doppelt. */
export const EXTRA_MULTIPLIER = 2;

/** Sekunden, um den Gegenstand zu holen. Die Uhr steht so lange. */
export const FETCH_SECONDS = 10;

/**
 * Gegenstände für die Requisit-Herausforderung.
 *
 * Einziges Auswahlkriterium: Das Ding liegt in JEDEM Haushalt. Ein Spiel, das
 * nach einem Cocktailshaker verlangt, hat die Runde verloren, bevor sie
 * beginnt. Deshalb steht hier kein einziger Gegenstand, den man kaufen müsste.
 */
export const PANTOMIME_PROPS = [
  'kochloeffel', 'handtuch', 'kissen', 'socke', 'klopapierrolle',
  'besen', 'schluesselbund', 'wasserflasche', 'buch', 'regenschirm',
  'kleiderbuegel', 'zahnbuerste', 'topfdeckel', 'tasse', 'stift',
  'brille', 'muetze', 'schal', 'decke', 'waescheklammer',
  'zeitung', 'karton', 'sieb', 'nudelholz', 'foehn',
  'gummiband', 'teller', 'gabel', 'kerze', 'pfanne',
] as const;

/** Körperliche Einschränkungen. */
export const PANTOMIME_HANDICAPS = [
  'oneHand', 'sitting', 'handsBehindBack', 'backTurned',
  'faceOnly', 'oneLeg', 'noJumping',
] as const;

/** Spielweisen. */
export const PANTOMIME_STYLES = [
  'slowMotion', 'robot', 'fastForward', 'ballet',
  'actionMovie', 'puppet', 'silentFilm',
] as const;

/**
 * Wie oft welche Sorte gezogen wird.
 *
 * Requisite haben das größte Gewicht: Sie sind das Erkennungszeichen des
 * Spiels und der einzige Typ, der die Leute vom Sofa hochbekommt. `duo` und
 * `tempo` sind selten, weil beide den Ablauf spürbar verändern — als Würze
 * gut, als Regel ermüdend.
 */
const WEIGHTS: Record<ExtraKind, number> = {
  requisit: 40,
  handicap: 22,
  stil: 22,
  tempo: 8,
  duo: 8,
};

const ALL_KINDS = Object.keys(WEIGHTS) as ExtraKind[];

function pick<T>(list: readonly T[], rng: () => number): T {
  const i = Math.floor(rng() * list.length);
  return list[Math.min(Math.max(i, 0), list.length - 1)];
}

export interface DrawOptions {
  /** Sorte der VORIGEN Runde — wird nicht wiederholt. */
  previousKind?: ExtraKind;
  /**
   * Wie viele Leute im Team sind. Unter zwei gibt es kein `duo` — sonst
   * verlangt das Spiel einen Mitspieler, den es nicht gibt.
   */
  teamSize: number;
  /** Einspeisbar, damit sich die Ziehung testen lässt. */
  rng?: () => number;
}

/**
 * Eine Herausforderung ziehen.
 *
 * Liefert immer eine — die Entscheidung, ob überhaupt eine angeboten wird,
 * trifft das Spiel (Schalter „Herausforderungen" in der Einrichtung).
 */
export function drawExtra({ previousKind, teamSize, rng = Math.random }: DrawOptions): Extra {
  const allowed = ALL_KINDS.filter((k) => {
    if (k === previousKind) return false;
    if (k === 'duo' && teamSize < 2) return false;
    return true;
  });

  // Sollte nie leer sein (fünf Sorten, höchstens zwei fallen weg), aber ein
  // leeres Feld ergäbe NaN statt Absturz — und damit eine Runde mit einer
  // Herausforderung, die niemand erklären kann.
  const pool = allowed.length > 0 ? allowed : ALL_KINDS.filter((k) => k !== 'duo');

  const total = pool.reduce((sum, k) => sum + WEIGHTS[k], 0);
  let ticket = rng() * total;
  let kind: ExtraKind = pool[pool.length - 1];
  for (const k of pool) {
    ticket -= WEIGHTS[k];
    if (ticket < 0) {
      kind = k;
      break;
    }
  }

  switch (kind) {
    case 'requisit':
      return {
        kind,
        key: 'requisit',
        propKey: pick(PANTOMIME_PROPS, rng),
        halfTime: false,
        needsFetch: true,
        needsPartner: false,
      };
    case 'handicap':
      return {
        kind,
        key: pick(PANTOMIME_HANDICAPS, rng),
        halfTime: false,
        needsFetch: false,
        needsPartner: false,
      };
    case 'stil':
      return {
        kind,
        key: pick(PANTOMIME_STYLES, rng),
        halfTime: false,
        needsFetch: false,
        needsPartner: false,
      };
    case 'tempo':
      return {
        kind,
        key: 'halfTime',
        halfTime: true,
        needsFetch: false,
        needsPartner: false,
      };
    case 'duo':
    default:
      return {
        kind: 'duo',
        key: 'duo',
        halfTime: false,
        needsFetch: false,
        needsPartner: true,
      };
  }
}

/**
 * Punkte einer Runde.
 *
 * Getrennt von der Oberfläche, weil ein Rechenfehler hier niemandem auffällt —
 * ein falscher Punktestand stürzt nicht ab, er ärgert nur, und zwar erst,
 * wenn jemand nachrechnet.
 */
export function scoreTurn(correctCount: number, extraAccepted: boolean): number {
  return correctCount * (extraAccepted ? EXTRA_MULTIPLIER : 1);
}
