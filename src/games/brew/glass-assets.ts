import type { GlassShapeId } from "./glass-shapes";

/**
 * GPT-Image-Renderings fuer die Cocktail-Gefaesse.
 *
 * Das Bild liefert Material, Ornamente und Licht. Die eigentliche Fuellung
 * bleibt SVG und wird in `Glass` daruebergelegt, damit jede Zutat weiterhin
 * als eigene Schicht sichtbar und animierbar ist.
 */
export const BAR_GLASS_ASSETS = {
  martini: "/images/brew/glass-martini-gpt.webp",
  coupe: "/images/brew/glass-coupe-gpt.webp",
  highball: "/images/brew/glass-highball-gpt.webp",
  tumbler: "/images/brew/glass-tumbler-gpt.webp",
  sour: "/images/brew/glass-sour-gpt.webp",
} as const satisfies Partial<Record<GlassShapeId, string>>;

/**
 * Sichtbarer Bildausschnitt der GPT-Renderings in Quellpixeln.
 *
 * Die Dateien haben bewusst eine schwarze Studioflaeche. Das eigentliche Glas
 * nimmt darin je nach Silhouette unterschiedlich viel Platz ein (besonders
 * das Highball-Glas ist schmal). `Glass` zieht genau diesen Ausschnitt auf
 * seine Einheitsflaeche. So wird das Bild weder verzerrt noch als kleines Glas
 * in eine zweite, groessere SVG-Silhouette gesetzt.
 */
export const BAR_GLASS_ASSET_FRAMES = {
  martini: { sourceWidth: 800, sourceHeight: 982, x: 62, y: 43, width: 677, height: 908 },
  coupe: { sourceWidth: 800, sourceHeight: 980, x: 63, y: 79, width: 675, height: 849 },
  highball: { sourceWidth: 800, sourceHeight: 1000, x: 214, y: 33, width: 370, height: 937 },
  tumbler: { sourceWidth: 800, sourceHeight: 800, x: 147, y: 118, width: 506, height: 571 },
  sour: { sourceWidth: 800, sourceHeight: 982, x: 125, y: 95, width: 547, height: 826 },
} as const satisfies Partial<Record<GlassShapeId, {
  sourceWidth: number;
  sourceHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}>>;
