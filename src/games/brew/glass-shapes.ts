/**
 * GEBRAEU — Glasformen.
 *
 * WARUM PROFILE UND KEINE PFADE: Aus EINEM Profil entstehen beide Pfade — die
 * Aussenkontur (`hw`) und der Innenraum (`hw - wall`). Waeren es zwei
 * handgeschriebene Pfade, koennte die Fuellung irgendwann aus dem Glas laufen.
 * So ist das ausgeschlossen.
 *
 * EINHEITSRAUM: x laeuft 0..100 (Mitte bei 50), y laeuft 0..100*aspect. Die
 * `y`-Werte in den Tabellen sind ANTEILE der Gesamthoehe, damit man eine Form
 * beim Lesen vor sich sieht. Keine Pixelgroesse taucht hier auf — die
 * Darstellungsbreite entscheidet allein das CSS.
 *
 * STIEL UND FUSS WERDEN NIE GEFUELLT. `cavity.bottom` endet bei Stielformen
 * VOR dem Stiel. Genau das macht ein Martiniglas als Martiniglas lesbar; ein
 * bis in den Fuss gefuelltes Glas sieht aus wie ein Fehler.
 */
import type { Skin } from "./brew-content";

export type GlassShapeId =
  | "martini" | "coupe" | "highball" | "tumbler" | "sour"
  | "erlenmeyer" | "kessel" | "phiole" | "kelch" | "flakon";

/** Ein Stuetzpunkt der Aussenkontur. `y` = Anteil der Hoehe, `hw` = Halbbreite (50 = Rand). */
export interface BowlPoint { y: number; hw: number }

export interface GlassShape {
  id: GlassShapeId;
  skin: Skin;
  /** Hoehe geteilt durch Breite. */
  aspect: number;
  /** Wandstaerke in Einheiten. */
  wall: number;
  /** Aussenkontur der Schale, Mund -> Schalenboden. */
  bowl: readonly BowlPoint[];
  /** Fuellbarer Bereich als Anteil der Hoehe. */
  cavity: { top: number; bottom: number };
  stem?: { top: number; bottom: number; hw: number; knob?: { y: number; rx: number; ry: number } };
  foot?: { cy: number; rx: number; ry: number };
  /**
   * Stielformen fassen bei gleicher Hoehe weniger — sie wirken sonst leer.
   * Ausgleich ueber die Breite, NICHT ueber einen gefaelschten Innenraum.
   */
  displayScale: number;
  /** Flacher Boden -> Bodenellipse zeichnen. */
  flatFloor: boolean;
}

export const GLASS_SHAPES: Record<GlassShapeId, GlassShape> = {
  martini: {
    id: "martini", skin: "bar", aspect: 1.30, wall: 3.0,
    bowl: [{ y: 0.06, hw: 46 }, { y: 0.25, hw: 25 }, { y: 0.44, hw: 3 }],
    cavity: { top: 0.085, bottom: 0.425 },
    stem: { top: 0.44, bottom: 0.88, hw: 2.5 },
    foot: { cy: 0.90, rx: 26, ry: 4.5 },
    displayScale: 1.15, flatFloor: false,
  },
  coupe: {
    id: "coupe", skin: "bar", aspect: 1.24, wall: 3.0,
    bowl: [{ y: 0.07, hw: 44 }, { y: 0.18, hw: 40 }, { y: 0.28, hw: 30 }, { y: 0.36, hw: 12 }, { y: 0.38, hw: 6 }],
    cavity: { top: 0.095, bottom: 0.365 },
    stem: { top: 0.38, bottom: 0.86, hw: 2.2 },
    foot: { cy: 0.885, rx: 24, ry: 4.2 },
    displayScale: 1.15, flatFloor: false,
  },
  highball: {
    id: "highball", skin: "bar", aspect: 2.05, wall: 3.2,
    bowl: [{ y: 0.03, hw: 34 }, { y: 0.50, hw: 33 }, { y: 0.965, hw: 32 }],
    cavity: { top: 0.06, bottom: 0.94 },
    displayScale: 1.0, flatFloor: true,
  },
  tumbler: {
    id: "tumbler", skin: "bar", aspect: 1.10, wall: 3.6,
    bowl: [{ y: 0.05, hw: 44 }, { y: 0.60, hw: 42 }, { y: 0.955, hw: 40 }],
    // Der dicke Massivboden ist das Kennzeichen eines Tumblers — deshalb
    // endet der Innenraum deutlich ueber dem Glasboden.
    cavity: { top: 0.05, bottom: 0.82 },
    displayScale: 1.0, flatFloor: true,
  },
  sour: {
    id: "sour", skin: "bar", aspect: 1.55, wall: 3.0,
    bowl: [{ y: 0.06, hw: 32 }, { y: 0.24, hw: 38 }, { y: 0.40, hw: 32 }, { y: 0.52, hw: 10 }],
    cavity: { top: 0.085, bottom: 0.505 },
    stem: { top: 0.52, bottom: 0.88, hw: 2.0 },
    foot: { cy: 0.90, rx: 23, ry: 4.0 },
    displayScale: 1.12, flatFloor: false,
  },

  erlenmeyer: {
    id: "erlenmeyer", skin: "brew", aspect: 1.35, wall: 3.0,
    bowl: [{ y: 0.03, hw: 16 }, { y: 0.30, hw: 15 }, { y: 0.55, hw: 28 }, { y: 0.94, hw: 44 }],
    cavity: { top: 0.06, bottom: 0.92 },
    displayScale: 1.0, flatFloor: true,
  },
  kessel: {
    id: "kessel", skin: "brew", aspect: 0.95, wall: 3.4,
    bowl: [{ y: 0.10, hw: 48 }, { y: 0.45, hw: 50 }, { y: 0.75, hw: 44 }, { y: 0.92, hw: 30 }],
    cavity: { top: 0.14, bottom: 0.88 },
    displayScale: 1.0, flatFloor: false,
  },
  phiole: {
    id: "phiole", skin: "brew", aspect: 2.30, wall: 2.6,
    bowl: [{ y: 0.10, hw: 17 }, { y: 0.88, hw: 17 }, { y: 0.95, hw: 12 }],
    cavity: { top: 0.13, bottom: 0.93 },
    displayScale: 0.92, flatFloor: false,
  },
  kelch: {
    id: "kelch", skin: "brew", aspect: 1.45, wall: 3.0,
    bowl: [{ y: 0.05, hw: 40 }, { y: 0.20, hw: 34 }, { y: 0.40, hw: 42 }, { y: 0.58, hw: 10 }],
    cavity: { top: 0.075, bottom: 0.565 },
    stem: { top: 0.58, bottom: 0.86, hw: 2.6, knob: { y: 0.68, rx: 7.5, ry: 5 } },
    foot: { cy: 0.925, rx: 28, ry: 4.5 },
    displayScale: 1.15, flatFloor: false,
  },
  flakon: {
    id: "flakon", skin: "brew", aspect: 1.20, wall: 3.2,
    bowl: [{ y: 0.02, hw: 13 }, { y: 0.16, hw: 13 }, { y: 0.30, hw: 42 }, { y: 0.94, hw: 40 }],
    // Der Hals bleibt leer: gefuellt wird erst ab der Schulter.
    cavity: { top: 0.19, bottom: 0.92 },
    displayScale: 1.0, flatFloor: true,
  },
};

export const BAR_SHAPES = ["martini", "coupe", "highball", "tumbler", "sour"] as const;
// Im Zaubertrank-Gewand ist der KESSEL das Spielobjekt. Unterschiedliche
// Cocktail-Silhouetten gehoeren ausschliesslich in den Bar-Modus; sonst
// widersprechen Bild und Regeltext einander.
export const BREW_SHAPES = ["kessel"] as const;

/** Standardform, wenn ein Aufrufer keine nennt. */
export const DEFAULT_SHAPE: Record<Skin, GlassShapeId> = { bar: "tumbler", brew: "erlenmeyer" };

/** Streuung fuer fremde Kennungen — siehe `shapeForRecipe`. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Welches Gefaess zu einem Rezept gehoert.
 *
 * WARUM DIE ZIFFER UND KEINE HANDTABELLE: Die Kennungen sind bereits
 * s1..s10 / m1..m10 / l1..l10. `(n-1) % 5` verteilt die zehn Rezepte einer
 * Laenge exakt zweimal auf jede Form — bei acht Spielern stehen damit
 * garantiert vier bis fuenf verschiedene Glaeser nebeneinander. Eine
 * Handtabelle waere die naechste Stelle, die von RECIPES_BY_LENGTH wegdriftet.
 *
 * TOTAL, NICHT PARTIELL: Ein Online-Schnappschuss kann eine Kennung
 * mitbringen, die dieses Buendel nicht kennt. `undefined` wuerde hier den
 * ganzen Fernseher schwaerzen — laut Kopf von TVBrewView ist das schon
 * einmal passiert. Deshalb der Streuwert als Rueckfall.
 */
export function shapeForRecipe(recipeId: string, skin: Skin): GlassShapeId {
  if (skin === "brew") return "kessel";
  const family = skin === "bar" ? BAR_SHAPES : BREW_SHAPES;
  const raw = String(recipeId ?? "");
  const digits = raw.replace(/^\D+/, "");
  const n = parseInt(digits, 10);
  const idx = Number.isFinite(n) && n > 0
    ? (n - 1) % family.length
    : fnv1a(raw) % family.length;
  return family[idx];
}

/** Gesamthoehe im Einheitsraum. */
export function unitHeight(shape: GlassShape): number {
  return 100 * shape.aspect;
}

/** Wo der Glashals liegt, als Anteil der Hoehe — Flugziel fuer PourFlight. */
export function glassMouthT(shape: GlassShape): number {
  return shape.cavity.top;
}

/** Aussere Halbbreite an einer Hoehe (Anteil 0..1), stueckweise linear. */
export function hwOuterAt(shape: GlassShape, t: number): number {
  const pts = shape.bowl;
  if (t <= pts[0].y) return pts[0].hw;
  const last = pts[pts.length - 1];
  if (t >= last.y) return last.hw;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (t <= b.y) {
      const f = b.y === a.y ? 0 : (t - a.y) / (b.y - a.y);
      return a.hw + (b.hw - a.hw) * f;
    }
  }
  return last.hw;
}

/** Innere Halbbreite — dieselbe Kontur, um die Wandstaerke eingerueckt. */
export function hwInnerAt(shape: GlassShape, t: number): number {
  return Math.max(0.8, hwOuterAt(shape, t) - shape.wall);
}

const SAMPLES = 64;

/**
 * Die Hoehen, an denen die Zutatenschichten aneinanderstossen.
 *
 * WARUM NICHT EINFACH GLEICHE HOEHEN: Im Martini-Kegel ist unten fast keine
 * Breite mehr. Fuenf gleich hohe Baender hiessen: die unterste Zutat ist ein
 * unsichtbarer Strich, die oberste ein Drittel des Glases. Stattdessen
 * bekommt jede Zutat dieselbe FLAECHE — das ist das, was das Auge als
 * "gleich viel" liest.
 *
 * Ein Codepfad fuer alle zehn Formen: beim geraden Rohr faellt das Verfahren
 * von selbst auf gleiche Hoehen zurueck.
 *
 * Rueckgabe: `total + 1` y-Werte im Einheitsraum, Index 0 = Boden (groesstes
 * y), Index `total` = Oberkante bei vollem Glas.
 */
export function bandBoundaries(shape: GlassShape, total: number): number[] {
  const n = Math.max(1, Math.floor(total));
  const h = unitHeight(shape);
  const bottom = shape.cavity.bottom;
  const span = bottom - shape.cavity.top;

  // Flaeche von unten aufwaerts aufsummieren (Trapezregel).
  const cum: number[] = [0];
  const step = span / SAMPLES;
  let acc = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const tA = bottom - i * step;
    const tB = bottom - (i + 1) * step;
    acc += ((hwInnerAt(shape, tA) + hwInnerAt(shape, tB)) / 2) * step;
    cum.push(acc);
  }
  const totalArea = acc;

  const out: number[] = [bottom * h];
  for (let k = 1; k <= n; k++) {
    const want = (totalArea * k) / n;
    // Binaere Suche im kumulierten Feld, dann linear zwischen zwei Stuetzen.
    let lo = 0, hi = SAMPLES;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < want) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const a = cum[i - 1], b = cum[i];
    const f = b === a ? 0 : (want - a) / (b - a);
    const t = bottom - (i - 1 + f) * step;
    out.push(t * h);
  }
  return out;
}
