/**
 * GEBRAEU — Darstellungspaletten.
 *
 * WARUM EIGENE DATEI UND NICHT brew-content.ts: Deren Kopfkommentar sagt es
 * selbst — die Farbe gehoert zur ZUTAT, nicht zur Darstellung. Genau deshalb
 * stehen die Paletten hier. `INGREDIENTS[].color` bleibt unberuehrt: sie
 * haengt an Karte, Flug und Aufdeckung und ist die Bedeutungstraegerin.
 *
 * ZWEI WELTEN, ZWEI PALETTEN: Die Bar ist warm (Bernstein, Gold, Kupfer auf
 * Braunschwarz), das Labor kalt (Violett, Tuerkis, Magenta auf Blauschwarz).
 * Vorher liefen beide auf demselben Blauschwarz und der einzige warme Ton war
 * ein 13-%-Schleier — die Lounge sah aus wie das Labor mit anderen Emoji.
 */
import type { Skin } from "./brew-content";

export interface BrewPalette {
  key: Skin;
  /** Grundflaeche der Atmosphaere. */
  bg: string;
  /** Tiefster Ton — Vignette, Schattenkanten. */
  bgDeep: string;
  /** Panel-Flaeche. */
  surface: string;
  /** Angehobenes Panel (Theke, aktives Element). */
  surfaceRaised: string;
  accent: string;
  accent2: string;
  accent3: string;
  text: string;
  dim: string;
  /** Bust, Strafe, Warnkante. */
  bad: string;
  /** Grundton der Zutatenplatte. */
  plateBase: string;
  /** Farbe des Neon-Schriftzugs. */
  wordmark: string;
  /** Wie kraeftig Fluessigkeit und Gefaess leuchten. */
  glowAlpha: number;
  /** Ringfarben der Spieler, Index = Sitzplatz. */
  players: string[];
}

export const BREW_PALETTES: Record<Skin, BrewPalette> = {
  bar: {
    key: "bar",
    bg: "#1A0F08",
    bgDeep: "#0C0704",
    surface: "#241408",
    surfaceRaised: "#33200F",
    accent: "#FFB347",
    accent2: "#FFD98E",
    accent3: "#E0724A",
    text: "#FFF6EA",
    dim: "#C8A882",
    bad: "#FF7A5C",
    plateBase: "#1E1208",
    wordmark: "#FFD98E",
    glowAlpha: 0.22,
    // ZWEI KALTE TOENE MIT ABSICHT: acht Ockerabstufungen waeren auf drei
    // Metern nicht auseinanderzuhalten, und die Ringfarbe ist das einzige,
    // was den aktiven Spieler ausweist.
    players: ["#FFB347", "#FF7A5C", "#FFD98E", "#7ED8A0", "#8FD0FF", "#FF9FC4", "#E0724A", "#C7B3FF"],
  },
  brew: {
    key: "brew",
    bg: "#0B0F1A",
    bgDeep: "#05070E",
    surface: "#120E1C",
    surfaceRaised: "#1B1430",
    accent: "#C77DFF",
    accent2: "#7AF5FF",
    accent3: "#FF5FA2",
    text: "#EDF2FF",
    dim: "#9FA8C4",
    bad: "#FF6E84",
    plateBase: "#120E1C",
    wordmark: "#7AF5FF",
    glowAlpha: 0.38,
    players: ["#df8eff", "#8ff5ff", "#ffd23f", "#ff6e84", "#7af5a8", "#ffa552", "#a78bfa", "#4dd4ff"],
  },
};

/** Eine Radienskala statt der sechs, die vorher nebeneinander liefen. */
export const brewRadius = { xs: 8, sm: 12, md: 18, lg: 24, xl: 32 } as const;

// ---------------------------------------------------------------------------
// Farbwerkzeug
// ---------------------------------------------------------------------------

interface Hsl { h: number; s: number; l: number }

interface Rgb { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 128, g: 128, b: 128 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function hexToHsl(hex: string): Hsl {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { h: 0, s: 0, l: 0.5 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hh = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return s === 0
    ? `#${to(l)}${to(l)}${to(l)}`
    : `#${to(ch(hh + 1 / 3))}${to(ch(hh))}${to(ch(hh - 1 / 3))}`;
}

/** Kuerzester Weg zwischen zwei Winkeln, damit 350 -> 10 nicht rueckwaerts laeuft. */
function mixHue(from: number, to: number, weight: number): number {
  const d = ((to - from + 540) % 360) - 180;
  return from + d * weight;
}

/** Helligkeitsband des Stapels: unten schwer und dunkel, oben leicht und hell. */
const L_BOTTOM = 0.28;
const L_TOP = 0.74;
/** Wie weit eine Zutat von ihrer Bandhelligkeit abweichen darf. */
const L_EIGEN = 0.012;

/**
 * Farbe EINER Fluessigkeitsschicht.
 *
 * WARUM UEBERHAUPT: Sieben der sechzehn Zutatenfarben sind nahezu weiss
 * (#F3E7D3 #E8EEF5 #DCEFF7 #E3D18A #F7F1E4 #CFE9F5 #BBE3F2). Uebereinander
 * gestapelt ergaben sie einen milchigen Turm, in dem keine Schicht mehr von
 * ihrer Nachbarin zu unterscheiden war — auf drei Metern erst recht nicht.
 *
 * WARUM DIE HELLIGKEIT DIE POSITION TRAEGT UND NICHT DIE ZUTAT: Bei sieben
 * Schichten reicht das Helligkeitsband nicht fuer beides. Behielte jede Zutat
 * ihre eigene Helligkeit, laegen Zucker (#F3E7D3) und Kokoscreme (#F7F1E4)
 * nach dem Klemmen beide bei 0,72 — nebeneinander ununterscheidbar. Also
 * bestimmt die TIEFE die Helligkeit, wie in einem echten geschichteten Drink,
 * und die Zutat traegt sich ueber FARBTON und SAETTIGUNG. Ein Rest von
 * `L_EIGEN` bleibt, damit zwei gleich tiefe Schichten in verschiedenen
 * Glaesern nicht voellig identisch aussehen.
 *
 * `depth` zaehlt von unten: 0 ist die Basiszutat am Boden.
 */
export function layerColor(base: string, skin: Skin, depth: number, total: number): string {
  const p = BREW_PALETTES[skin];
  const c = hexToHsl(base);
  const a = hexToHsl(p.accent);
  const h = mixHue(c.h, a.h, 0.18);
  const s = Math.max(c.s, 0.38);
  const stufen = Math.max(1, total - 1);
  const band = L_BOTTOM + (L_TOP - L_BOTTOM) * (Math.min(depth, stufen) / stufen);
  const eigen = (Math.min(0.9, Math.max(0.2, c.l)) - 0.55) * L_EIGEN * 2;
  return hslToHex({ h, s, l: Math.min(0.82, Math.max(0.14, band + eigen)) });
}

/**
 * Sichtbare Mischfarbe aller bereits eingefuellten Zutaten.
 *
 * Jede Kennung zaehlt einmal; mehrfach vorkommende Farben wirken damit wie
 * ein echtes Mischverhaeltnis. Die Mischung erfolgt kanalweise in sRGB:
 * reines Rot + reines Blau ergibt #800080, eine weitere orange Portion zieht
 * denselben Drink nachvollziehbar in Richtung Orange. Die einzelnen
 * Schichten bleiben in `Glass` dennoch erhalten und werden nicht zu einer
 * einzigen Flaeche nivelliert.
 */
export function mixLiquidColors(colors: readonly string[]): string {
  if (colors.length === 0) return "#000000";
  const sum = colors.reduce((acc, color) => {
    const rgb = hexToRgb(color);
    return { r: acc.r + rgb.r, g: acc.g + rgb.g, b: acc.b + rgb.b };
  }, { r: 0, g: 0, b: 0 });
  return rgbToHex({ r: sum.r / colors.length, g: sum.g / colors.length, b: sum.b / colors.length });
}

/** Helligkeit 0..1 — fuer die Kontrastzusage im Test. */
export function luminanceOf(hex: string): number {
  return hexToHsl(hex).l;
}

/** Farbwinkel 0..360 — fuer die Kontrastzusage im Test. */
export function hueOf(hex: string): number {
  return hexToHsl(hex).h;
}
