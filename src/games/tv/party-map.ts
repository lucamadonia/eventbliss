/**
 * party-map — die Geometrie der Nacht-Route.
 *
 * Der Abend als Brettspiel-Pfad: jedes Spiel der Set-Liste ist ein Feld, die
 * Gruppe wandert von Feld zu Feld. Weil eine Party zwischen 1 und 12 Spielen
 * hat, kann die Route KEINE gemalte Landkarte mit festen Feldern sein — sie
 * wird hier gerechnet und legt sich über die (feste) Hintergrundlandschaft.
 *
 * Bewusst ohne React und ohne DOM: keine `getPointAtLength`-Messung, keine
 * `offsetPath`-Abhaengigkeit vom Browser. Dadurch ist die Reise der Figuren
 * deterministisch und mit Vitest pruefbar — dasselbe Muster wie `setlist.ts`,
 * `partyAwards.ts` und `withPartyContext.ts` in diesem Ordner.
 *
 * Koordinaten sind Einheiten im viewBox-Raum, nicht Pixel. Die Darstellung
 * skaliert die viewBox; die Zahlen hier bleiben stabil.
 */

export interface MapPoint {
  x: number;
  y: number;
}

export interface Route {
  /** SVG-Pfad-Daten fuer das `d`-Attribut. */
  d: string;
  /** Ein Punkt je Spiel, in Spielreihenfolge. */
  stations: MapPoint[];
  /** Breite/Hoehe des viewBox-Raums, fuer den gerechnet wurde. */
  width: number;
  height: number;
  /**
   * Position auf der Route. `t = 0` ist Feld 0, `t = 1` das letzte Feld;
   * dazwischen wird entlang der Kurve interpoliert. Fuer die Reise der
   * Figuren zwischen zwei Feldern.
   */
  pointAt(t: number): MapPoint;
  /** Der `t`-Wert, an dem Feld `index` liegt. */
  tAt(index: number): number;
}

/**
 * Randabstand als ANTEIL, damit Medaillons und Gluehen bei jeder viewBox
 * gleich weit vom Bildrand bleiben.
 */
const MARGIN_X_RATIO = 0.075;

/**
 * Oben und unten BEWUSST verschieden.
 *
 * Mit einem gemeinsamen Rand von 20 % landete die zweite Feldreihe bei 80 %
 * der Hoehe — mitten im Titelband, das schon bei 62 % beginnt. Im Geraetetest
 * mit dreizehn Spielen lagen PIXELJAGD und OHNE WORTE deshalb unter dem
 * Verlauf und wirkten ausgegraut. Der Test hier war trotzdem gruen, weil er
 * nur einen festen Randabstand prueft und 864 innerhalb von 930 liegt.
 *
 * Unten muss also Platz fuer Titel und Verlauf bleiben, oben nicht.
 */
const MARGIN_TOP_RATIO = 0.19;
const MARGIN_BOTTOM_RATIO = 0.46;

/**
 * Oberhalb dieses Anteils der Hoehe muss JEDES Feld liegen — samt Medaillon
 * und Beschriftung darunter. Der Wert ist die Obergrenze fuer den Test und
 * zugleich die Begruendung fuer `MARGIN_BOTTOM_RATIO`.
 */
export const CONTENT_BOTTOM_RATIO = 0.62;

/**
 * Wie stark die Route zwischen den Feldern ausschwingt. Ohne Ausschlag waere
 * sie eine Zickzacklinie, mit zu viel wirkt sie unruhig. Als Anteil der Hoehe
 * formuliert, damit der Eindruck bei jeder viewBox derselbe ist.
 */
const SWING = 0.22;

/**
 * Serpentine: die Felder laufen zeilenweise hin und her, wie ein Brettspiel,
 * das sich ueber die Flaeche schlaengelt. Bis 5 Spiele reicht eine Zeile,
 * danach zwei — mehr Zeilen wuerden die Medaillons zu klein machen.
 */
function rowsFor(count: number): number {
  return count <= 5 ? 1 : 2;
}

/** Feldmittelpunkte in Serpentinen-Anordnung. */
function layout(count: number, width: number, height: number): MapPoint[] {
  if (count <= 0) return [];
  if (count === 1) {
    // In der nutzbaren Flaeche zentrieren, nicht im ganzen Bild — sonst steht
    // das einzige Feld im Titelband.
    const top = height * MARGIN_TOP_RATIO;
    const bottom = height * (1 - MARGIN_BOTTOM_RATIO);
    return [{ x: width / 2, y: (top + bottom) / 2 }];
  }

  const rows = rowsFor(count);
  const perRow = Math.ceil(count / rows);
  const marginX = width * MARGIN_X_RATIO;
  const marginTop = height * MARGIN_TOP_RATIO;
  const marginBottom = height * MARGIN_BOTTOM_RATIO;
  const usableW = width - marginX * 2;
  const usableH = height - marginTop - marginBottom;

  const points: MapPoint[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // Ungerade Zeilen laufen rueckwaerts — das ergibt die Schlangenlinie statt
    // eines Sprungs von rechts aussen zurueck nach links aussen.
    const dir = row % 2 === 0 ? col : perRow - 1 - col;
    const tx = perRow === 1 ? 0.5 : dir / (perRow - 1);
    const ty = rows === 1 ? 0.5 : row / (rows - 1);
    points.push({ x: marginX + tx * usableW, y: marginTop + ty * usableH });
  }
  return points;
}

/**
 * Kubische Bezier zwischen zwei Feldern. Die Kontrollpunkte weichen
 * abwechselnd nach oben und unten aus, damit die Route atmet.
 */
function controls(a: MapPoint, b: MapPoint, index: number, height: number) {
  const swing = height * SWING * (index % 2 === 0 ? -1 : 1);
  return {
    c1: { x: a.x + (b.x - a.x) * 0.35, y: a.y + swing },
    c2: { x: a.x + (b.x - a.x) * 0.65, y: b.y + swing },
  };
}

function cubic(a: MapPoint, c1: MapPoint, c2: MapPoint, b: MapPoint, u: number): MapPoint {
  const v = 1 - u;
  const w0 = v * v * v;
  const w1 = 3 * v * v * u;
  const w2 = 3 * v * u * u;
  const w3 = u * u * u;
  return {
    x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x,
    y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y,
  };
}

/**
 * Baut die Route fuer `count` Spiele.
 *
 * Vorgabe ist 16:9 — die GANZE Route liegt im Bild. Eine mitfahrende Kamera
 * war der erste Entwurf, hat aber die Haelfte des Abends aus dem Bild
 * geschoben und Luecken in die Hintergrundebenen gerissen. Auf einem Fernseher
 * ist ohnehin richtig, den kompletten Abend zu sehen: auch bei zwoelf Spielen
 * bleiben die Medaillons gross genug.
 */
export function buildRoute(count: number, width = 1920, height = 1080): Route {
  const stations = layout(count, width, height);

  const segments = stations.slice(0, -1).map((a, i) => {
    const b = stations[i + 1];
    const { c1, c2 } = controls(a, b, i, height);
    return { a, b, c1, c2 };
  });

  const d = stations.length
    ? `M ${stations[0].x} ${stations[0].y}` +
      segments
        .map((s) => ` C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`)
        .join("")
    : "";

  const tAt = (index: number): number => {
    if (segments.length === 0) return 0;
    const clamped = Math.max(0, Math.min(stations.length - 1, index));
    return clamped / segments.length;
  };

  const pointAt = (t: number): MapPoint => {
    if (stations.length === 0) return { x: width / 2, y: height / 2 };
    if (segments.length === 0) return stations[0];
    const clamped = Math.max(0, Math.min(1, t));
    const scaled = clamped * segments.length;
    // Genau am Ende darf der Index nicht ueber das letzte Segment laufen.
    const i = Math.min(segments.length - 1, Math.floor(scaled));
    const s = segments[i];
    return cubic(s.a, s.c1, s.c2, s.b, scaled - i);
  };

  return { d, stations, width, height, pointAt, tAt };
}
