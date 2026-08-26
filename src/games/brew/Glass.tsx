/**
 * Glass — das Herzstueck von GEBRAEU: ein echtes Gefaess, das sich schichtweise
 * fuellt. Bewusst SVG statt Bilddatei: 30 Rezepte x 2 Gewaender als Grafiken
 * waeren nicht wartbar, ein paar Pfade mit Farbverlaeufen schon.
 *
 * ZEHN FORMEN, EIN VERFAHREN: Die Geometrie steht in `glass-shapes.ts` als
 * Profil. Hier wird nur gezeichnet, nicht entschieden. Aussenkontur und
 * Innenraum entstehen aus DEMSELBEN Profil, deshalb kann die Fuellung
 * prinzipiell nicht aus dem Glas laufen.
 *
 * EINHEITSRAUM STATT PIXELGROESSEN: Vorher gab es drei feste Groessen, und der
 * Fernseher nahm die kleinste — 56x72 px. Das Hero-Objekt des Spiels war auf
 * dem groessten Bildschirm das kleinste Element. Jetzt bestimmt allein die
 * CSS-Breite, wie gross das Glas wird.
 *
 * FILTERBUDGET NULL: Alle Weichzeichnungen sind `radialGradient`-Ellipsen,
 * kein `feGaussianBlur`. Ein SVG-Filter rastert pro Glas eine eigene
 * Filterregion — bei acht Glaesern nebeneinander ist das der Unterschied
 * zwischen fluessig und ruckelig.
 *
 * Die Basis-Zutat liegt immer UNTEN. `filled` kommt von BrewGame bereits in
 * dieser Reihenfolge an; hier wird nicht sortiert.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { INGREDIENTS, type IngredientId, type Skin } from "./brew-content";
import { BREW_PALETTES, layerColor, type BrewPalette } from "./brew-palette";
import {
  DEFAULT_SHAPE, GLASS_SHAPES, bandBoundaries, hwInnerAt, hwOuterAt, unitHeight,
  type GlassShape, type GlassShapeId,
} from "./glass-shapes";
import { PourStream, Splash, FinishSparkle } from "./BrewFX";

/**
 * Wo der Glashals liegt, als Anteil der Gesamthoehe.
 *
 * @deprecated Rueckfall fuer Aufrufer ohne Form. Wer die Form kennt, nimmt
 * `glassMouthT(shape)` — die Muendungen laufen von 0.03 (Highball) bis 0.19
 * (Flakon), ein fester Wert trifft keinen davon.
 */
export const GLASS_MOUTH_T = 0.14;

/** Breite je Groessenstufe. `size` ist nur noch eine CSS-Vorgabe. */
const SIZE_WIDTH: Record<"sm" | "md" | "lg", string> = {
  sm: "clamp(44px, 5.5vw, 92px)",
  md: "clamp(96px, 26vw, 148px)",
  lg: "clamp(148px, 34vw, 220px)",
};

/**
 * Bezugsbreite der BrewFX-Effekte. So gewaehlt, dass die drei alten
 * FX_SCALE-Werte (0.42 / 0.70 / 1.05) auf drei Prozent genau herauskommen —
 * BrewFX merkt vom Umbau nichts.
 */
const FX_REF_W = 137;
const LEGACY_PX: Record<"sm" | "md" | "lg", number> = { sm: 56, md: 96, lg: 148 };

export interface GlassProps {
  /** Zutaten des Rezepts — teilt die Fuellhoehe auf. */
  recipeNeeds: IngredientId[];
  /** Bereits gesicherte Zutaten, Basis zuerst. */
  filled: IngredientId[];
  skin: Skin;
  /** Groessenvorgabe. Wird von `width` geschlagen. */
  size?: "sm" | "md" | "lg";
  /** Freie CSS-Breite, z. B. `clamp(56px,7.4vw,132px)`. */
  width?: string | number;
  /** Gefaessform. Ohne Angabe die Standardform des Gewands. */
  shape?: GlassShapeId;
  /** Ohne Angabe die Palette des Gewands. */
  palette?: BrewPalette;
  /**
   * Perlen aufsteigen lassen, wenn das Rezept `fizz` enthaelt.
   * Der Fernseher setzt das NIE: acht Glaeser mit Dauerschleife sind acht
   * Dauerschleifen. `useAmbientMotion` allein reicht als Riegel nicht — es
   * liefert nur nativ `false`, ein Browser-Cast bekommt `true`.
   */
  bubbles?: boolean;
  /** Notausgang, falls die Messung einmal nicht greift. */
  fxScale?: number;
  className?: string;
  /** Millisekunden, bis die erste NEUE Schicht zu entstehen beginnt. */
  arrivalDelay?: number;
  /** Versatz zwischen zwei neuen Schichten. */
  layerStagger?: number;
}

// ---------------------------------------------------------------------------
// Pfade — alle aus dem Profil abgeleitet, keiner von Hand geschrieben
// ---------------------------------------------------------------------------

/** Geschlossener Pfad entlang einer Kontur zwischen zwei Hoehenanteilen. */
function wallPath(
  shape: GlassShape, H: number, tTop: number, tBottom: number,
  halfWidth: (s: GlassShape, t: number) => number, steps = 20,
): string {
  const links: string[] = [];
  const rechts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = tTop + ((tBottom - tTop) * i) / steps;
    const hw = halfWidth(shape, t);
    const y = t * H;
    links.push(`${(50 - hw).toFixed(2)} ${y.toFixed(2)}`);
    rechts.push(`${(50 + hw).toFixed(2)} ${y.toFixed(2)}`);
  }
  rechts.reverse();
  return `M ${links[0]} ${links.slice(1).map((p) => `L ${p}`).join(" ")} ${rechts.map((p) => `L ${p}`).join(" ")} Z`;
}

/** Ein flaches Band an der Wand entlang — eine Zutatenschicht. */
function bandPath(shape: GlassShape, H: number, yTop: number, yBottom: number): string {
  return wallPath(shape, H, yTop / H, yBottom / H, hwInnerAt, 8);
}

export function Glass({
  recipeNeeds, filled, skin, size = "md", width, shape, palette,
  bubbles = false, fxScale, className, arrivalDelay = 0, layerStagger = 70,
}: GlassProps) {
  const reduceMotion = useReducedMotion();
  const ambient = useAmbientMotion();
  const uid = useId().replace(/:/g, "");
  const pal = palette ?? BREW_PALETTES[skin];
  const form = GLASS_SHAPES[shape ?? DEFAULT_SHAPE[skin]];
  const H = unitHeight(form);

  const total = Math.max(1, recipeNeeds.length);
  const fillCount = Math.min(filled.length, total);
  const complete = fillCount >= total;
  const grenzen = useMemo(() => bandBoundaries(form, total), [form, total]);

  // Gemessene Breite fuer die BrewFX-Overlays. Startwert aus der
  // Groessenvorgabe, damit Giessstrahl und Splash nicht einen Frame lang auf
  // Groesse null rendern.
  const boxRef = useRef<HTMLDivElement>(null);
  const [pxW, setPxW] = useState<number>(() =>
    typeof width === "number" ? width : LEGACY_PX[size]);
  useEffect(() => {
    if (typeof width === "number") { setPxW(width); return; }
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((eintraege) => {
      const w = eintraege[0]?.contentRect.width;
      if (w && w > 0) setPxW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const fx = fxScale ?? pxW / FX_REF_W;
  const pxH = pxW * form.aspect;

  const layers = useMemo(() => filled.slice(0, total).map((id, i) => ({
    id,
    color: layerColor(INGREDIENTS[id].color, skin, i, total),
    gradId: `bl-${uid}-${i}`,
    yBottom: grenzen[i],
    yTop: grenzen[i + 1],
  })), [filled, total, skin, uid, grenzen]);

  const topColor = layers.length ? layers[layers.length - 1].color : null;
  /** Hoehe des Pegels im Einheitsraum. */
  const pegel = grenzen[fillCount];

  // Splash + Giessstrahl, sobald eine Schicht dazukommt. `useRef` fuer den
  // Vorwert: loest keinen Extra-Render aus.
  const [splashTrigger, setSplashTrigger] = useState(0);
  const [pouring, setPouring] = useState(false);
  const prevCountRef = useRef(filled.length);
  const [newFrom, setNewFrom] = useState(filled.length);
  useEffect(() => {
    if (filled.length > prevCountRef.current) {
      setNewFrom(prevCountRef.current);
      setSplashTrigger((n) => n + 1);
      setPouring(true);
      const id = window.setTimeout(() => setPouring(false), 500);
      prevCountRef.current = filled.length;
      return () => window.clearTimeout(id);
    }
    prevCountRef.current = filled.length;
  }, [filled.length]);

  // Funkeln genau EINMAL beim Uebergang zu "fertig".
  const [finishTrigger, setFinishTrigger] = useState(0);
  const wasCompleteRef = useRef(complete);
  useEffect(() => {
    if (complete && !wasCompleteRef.current) setFinishTrigger((n) => n + 1);
    wasCompleteRef.current = complete;
  }, [complete]);

  const bowlTop = form.bowl[0].y;
  const bowlBottom = form.bowl[form.bowl.length - 1].y;
  const aussen = wallPath(form, H, bowlTop, bowlBottom, hwOuterAt, 22);
  const innen = wallPath(form, H, form.cavity.top, form.cavity.bottom, hwInnerAt, 22);
  const muendungHw = hwOuterAt(form, bowlTop);
  const zeigePerlen = bubbles && ambient && !reduceMotion && recipeNeeds.includes("fizz");

  return (
    <motion.div
      ref={boxRef}
      className={className}
      style={{ width: width ?? SIZE_WIDTH[size], position: "relative" }}
      animate={{ y: complete && !reduceMotion ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 14 }}
    >
      <svg viewBox={`0 0 100 ${H}`} width="100%" height="100%" role="img" aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}>
        <defs>
          {layers.map((l, i) => {
            const oben = i < layers.length - 1 ? layers[i + 1].color : l.color;
            const unten = i > 0 ? layers[i - 1].color : l.color;
            return (
              <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={oben} />
                <stop offset="18%" stopColor={l.color} />
                <stop offset="82%" stopColor={l.color} />
                <stop offset="100%" stopColor={unten} />
              </linearGradient>
            );
          })}
          {/* Glaskoerper: oben heller, unten dunkler, damit das Gefaess Tiefe
              bekommt statt eine flache Flaeche zu sein. */}
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.13)" />
            <stop offset="0.45" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.10)" />
          </linearGradient>
          {/* Kanten dunkler — das laesst die Wand als Material lesen. */}
          <linearGradient id={`kante-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(0,0,0,0.32)" />
            <stop offset="0.22" stopColor="rgba(0,0,0,0)" />
            <stop offset="0.78" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.32)" />
          </linearGradient>
          <radialGradient id={`schatten-${uid}`}>
            <stop offset="0" stopColor="#000" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          {topColor && (
            <radialGradient id={`aura-${uid}`}>
              <stop offset="0" stopColor={topColor} stopOpacity={pal.glowAlpha} />
              <stop offset="0.5" stopColor={topColor} stopOpacity={pal.glowAlpha * 0.4} />
              <stop offset="1" stopColor={topColor} stopOpacity="0" />
            </radialGradient>
          )}
          <clipPath id={`clip-${uid}`}><path d={innen} /></clipPath>
        </defs>

        {/* 1. Aufsetzschatten — ohne ihn schwebt das Glas im Nichts. */}
        <ellipse cx="50" cy={H * 0.985}
          rx={(form.foot?.rx ?? hwOuterAt(form, bowlBottom)) * 1.25} ry={H * 0.022}
          fill={`url(#schatten-${uid})`} />

        {/* 2. Kaustik: das Licht, das die Fluessigkeit auf die Theke wirft.
            Jetzt in BEIDEN Gewaendern — vorher hatte die Bar gar kein Leuchten. */}
        {topColor && fillCount > 0 && (
          <ellipse cx="50" cy={H * 0.965} rx="52" ry={H * 0.05}
            fill={`url(#aura-${uid})`} opacity={0.7} />
        )}

        {/* 3. Aura der Fluessigkeit, auf Pegelhoehe. */}
        {topColor && fillCount > 0 && (
          <ellipse cx="50" cy={(pegel + grenzen[0]) / 2} rx="48" ry={H * 0.3}
            fill={`url(#aura-${uid})`} />
        )}

        {/* 4. Glaskoerper: Schale, Stiel, Knoten, Fuss. */}
        <path d={aussen} fill={`url(#body-${uid})`} />
        <path d={aussen} fill={`url(#kante-${uid})`} />
        {form.stem && (
          <rect x={50 - form.stem.hw} y={form.stem.top * H}
            width={form.stem.hw * 2} height={(form.stem.bottom - form.stem.top) * H}
            rx={form.stem.hw} fill={`url(#body-${uid})`} />
        )}
        {form.stem?.knob && (
          <ellipse cx="50" cy={form.stem.knob.y * H} rx={form.stem.knob.rx} ry={form.stem.knob.ry}
            fill={`url(#body-${uid})`} />
        )}
        {form.foot && (
          <ellipse cx="50" cy={form.foot.cy * H} rx={form.foot.rx} ry={form.foot.ry}
            fill={`url(#body-${uid})`} stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
        )}

        {/* 5. Fluessigkeit, an den Innenraum geklippt. */}
        <g clipPath={`url(#clip-${uid})`}>
          {layers.map((l, i) => {
            const ziel = bandPath(form, H, l.yTop, l.yBottom);
            const flach = bandPath(form, H, l.yBottom, l.yBottom);
            // Schluessel NUR die Zutatenkennung: `sortGlassOrder` zieht die
            // Basiszutat nach vorn. Mit `id + y` mounteten sonst ALLE
            // Schichten neu und liefen von unten wieder hoch.
            return reduceMotion ? (
              <path key={l.id} d={ziel} fill={`url(#${l.gradId})`} />
            ) : (
              <motion.path
                key={l.id}
                fill={`url(#${l.gradId})`}
                initial={{ d: flach }}
                animate={{ d: ziel }}
                transition={{
                  type: "spring", stiffness: 140, damping: 12,
                  delay: i >= newFrom ? (arrivalDelay + (i - newFrom) * layerStagger) / 1000 : 0,
                }}
              />
            );
          })}

          {/* 6. Perlen — nur bei Kohlensaeure, nur am Telefon. */}
          {zeigePerlen && fillCount > 0 && [0, 1, 2, 3, 4, 5].map((i) => (
            <motion.circle key={i} cx={50 + (i % 3) * 9 - 9} r={0.9 + (i % 2) * 0.7}
              fill="rgba(255,255,255,0.55)"
              initial={{ cy: grenzen[0] }}
              animate={{ cy: [grenzen[0], pegel], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.6 + (i % 3) * 0.8, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
            />
          ))}
        </g>

        {/* 7. Meniskus: die Ellipse auf der Oberflaeche. Ohne sie sieht die
            Fuellung aus wie ein Balken, nicht wie Fluessigkeit. */}
        {topColor && fillCount > 0 && (
          <motion.ellipse
            cx="50" rx={hwInnerAt(form, pegel / H)} ry={Math.max(1.2, hwInnerAt(form, pegel / H) * 0.16)}
            fill={topColor} stroke="rgba(255,255,255,0.45)" strokeWidth="0.7"
            initial={false}
            animate={{ cy: pegel }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 12, delay: arrivalDelay / 1000 }}
          />
        )}

        {/* 8. Bodenellipse — nur bei flachem Boden. */}
        {form.flatFloor && (
          <ellipse cx="50" cy={form.cavity.bottom * H}
            rx={hwInnerAt(form, form.cavity.bottom)} ry={hwInnerAt(form, form.cavity.bottom) * 0.13}
            fill="rgba(0,0,0,0.3)" />
        )}

        {/* 9. Wandkontur und Muendung. Die Muendungsellipse ist der Rand, der
            ein Glas ueberhaupt erst als Glas lesbar macht — vorher war dort
            eine gerade Linie. */}
        <path d={aussen} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.1" strokeLinejoin="round" />
        <ellipse cx="50" cy={bowlTop * H} rx={muendungHw} ry={Math.max(1.4, muendungHw * 0.17)}
          fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" />

        {/* 10. Glanzstreifen an der linken Wand — das eine Detail, das aus
            einer Flaeche ein Glas macht. Folgt der Kontur der Form. */}
        <path
          d={wallPath(form, H, form.cavity.top + 0.04, form.cavity.bottom - 0.06,
            (s, t) => hwOuterAt(s, t) * 0.2, 10)}
          transform={`translate(${-muendungHw * 0.52} 0)`}
          fill="rgba(255,255,255,0.14)"
        />
      </svg>

      {/* Giessstrahl: laeuft kurz von oben in den Hals. */}
      <div className="pointer-events-none absolute left-1/2"
        style={{ top: -pxH * 0.42, transform: "translateX(-50%)" }}>
        <PourStream color={topColor ?? "#ffffff"} active={pouring} skin={skin} size={fx} />
      </div>

      {/* Aufprallwelle an der Pegel-Oberflaeche. */}
      <div className="pointer-events-none absolute left-1/2"
        style={{ top: (pegel / H) * pxH, transform: "translate(-50%, -50%)" }}>
        <Splash color={topColor ?? "#ffffff"} trigger={splashTrigger} skin={skin} size={fx} />
      </div>

      {/* Fertig-Funkeln. */}
      {complete && (
        <div className="pointer-events-none absolute left-1/2"
          style={{ top: (form.cavity.top + 0.3 * (form.cavity.bottom - form.cavity.top)) * pxH, transform: "translate(-50%, -50%)" }}>
          <FinishSparkle color={topColor ?? "#ffffff"} trigger={finishTrigger} skin={skin} size={fx} />
        </div>
      )}
    </motion.div>
  );
}
