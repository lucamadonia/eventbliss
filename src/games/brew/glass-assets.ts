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
