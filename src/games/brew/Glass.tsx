/**
 * Glass — das Herzstueck von GEBRAEU: ein echtes Gefaess, das sich schichtweise
 * fuellt. Im Bar-Gewand liefert GPT Image das hochwertige Gefaessmaterial;
 * die Fuellung bleibt SVG, damit jede Zutat einzeln sichtbar und animierbar
 * bleibt. Der Kessel nutzt dasselbe Prinzip mit seiner eigenen Bildkomposition.
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
import { BREW_PALETTES, layerColor, mixLiquidColors, type BrewPalette } from "./brew-palette";
import {
  DEFAULT_SHAPE, GLASS_SHAPES, bandBoundaries, hwInnerAt, hwOuterAt, unitHeight,
  type GlassShape, type GlassShapeId,
} from "./glass-shapes";
import { PourStream, Splash, FinishSparkle } from "./BrewFX";
import { BAR_GLASS_ASSETS, BAR_GLASS_ASSET_FRAMES } from "./glass-assets";

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
  /** Freie CSS-Hoehe. Ideal fuer Slots, in denen keine Form abgeschnitten werden darf. */
  height?: string | number;
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
  /** Material- und Effektbudget je Einsatzort. */
  quality?: "hero" | "compact" | "tv";
  /** 0..3: visuelle Spannung des aktuell gefaehrdeten Tabletts. */
  intensity?: 0 | 1 | 2 | 3;
  /** Aktives Gefaess bekommt gerichtetes Licht statt nur mehr Helligkeit. */
  active?: boolean;
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
  recipeNeeds, filled, skin, size = "md", width, height, shape, palette,
  bubbles = false, fxScale, className, arrivalDelay = 0, layerStagger = 70,
  quality = size === "lg" ? "hero" : "compact", intensity = 0, active = false,
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
    typeof width === "number" ? width : typeof height === "number" ? height / form.aspect : LEGACY_PX[size]);
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
  }, [width, height]);
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
  const mixtureColor = filled.length
    ? mixLiquidColors(filled.slice(0, total).map((id) => INGREDIENTS[id].color))
    : null;
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
      const added = filled.length - prevCountRef.current;
      const pourMs = skin === "bar"
        ? Math.min(1800, Math.max(650, arrivalDelay + 480 + added * layerStagger))
        : 500;
      const id = window.setTimeout(() => setPouring(false), pourMs);
      prevCountRef.current = filled.length;
      return () => window.clearTimeout(id);
    }
    prevCountRef.current = filled.length;
  }, [filled.length, arrivalDelay, layerStagger, skin]);

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
  const premium = quality === "hero";
  const showSurfaceMotion = premium && ambient && !reduceMotion && fillCount > 0;
  const tensionGlow = intensity === 3
    ? pal.bad
    : skin === "bar" ? mixtureColor ?? topColor ?? pal.accent : topColor ?? pal.accent;
  const generatedAsset = skin === "bar"
    ? BAR_GLASS_ASSETS[form.id as keyof typeof BAR_GLASS_ASSETS]
    : undefined;
  const generatedFrame = skin === "bar"
    ? BAR_GLASS_ASSET_FRAMES[form.id as keyof typeof BAR_GLASS_ASSET_FRAMES]
    : undefined;
  const generatedPlacement = generatedFrame ? {
    x: (-generatedFrame.x / generatedFrame.width) * 100,
    y: (-generatedFrame.y / generatedFrame.height) * H,
    width: (generatedFrame.sourceWidth / generatedFrame.width) * 100,
    height: (generatedFrame.sourceHeight / generatedFrame.height) * H,
  } : null;
  const sizing = height != null
    ? { height, width: "auto", aspectRatio: `1 / ${form.aspect}`, display: "inline-block" }
    : { width: width ?? SIZE_WIDTH[size], aspectRatio: `1 / ${form.aspect}` };

  /**
   * Der Kessel ist kein aus dem Glasprofil abgeleitetes SVG mehr. Seine alte
   * Silhouette (zwei dicke Henkelpfade plus Schale) war technisch korrekt,
   * aber sichtbar gezeichnet. Das neue GPT-Image-Asset liefert Material,
   * Licht und echte Tiefe; Fluessigkeit, Dampf und Gameplay-Reaktionen bleiben
   * echte UI-Layer und koennen deshalb weiterhin dynamisch animieren.
   */
  if (form.id === "kessel") {
    const surface = topColor ?? "#24112f";
    return (
      <motion.div
        ref={boxRef}
        className={className}
        style={{
          ...sizing,
          aspectRatio: "1 / 1",
          position: "relative",
          filter: premium
            ? `drop-shadow(0 20px 26px rgba(0,0,0,.58)) drop-shadow(0 0 ${14 + intensity * 8}px ${tensionGlow}4f)`
            : `drop-shadow(0 12px 16px rgba(0,0,0,.5)) drop-shadow(0 0 9px ${tensionGlow}38)`,
        }}
        animate={{
          y: complete && !reduceMotion ? -5 : 0,
          scale: active && premium && !reduceMotion ? [1, 1.012, 1] : 1,
        }}
        transition={{
          y: { type: "spring", stiffness: 200, damping: 14 },
          scale: active && premium && !reduceMotion
            ? { duration: 1.9, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
        }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-[55%] h-[42%] w-[82%] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.span
            className="block h-full w-full rounded-full blur-2xl"
            style={{ background: `${surface}${fillCount > 0 ? "36" : "16"}` }}
            animate={showSurfaceMotion ? { opacity: [0.42, 0.78, 0.42], scale: [0.92, 1.06, 0.92] } : { opacity: 0.46, scale: 1 }}
            transition={{ duration: 2.8, repeat: showSurfaceMotion ? Infinity : 0, ease: "easeInOut" }}
          />
        </div>

        <img
          src="/images/brew/cauldron-premium-v2.webp"
          alt=""
          aria-hidden="true"
          className="relative z-10 h-full w-full object-contain"
        />

        {/* Sichtbare Trankoberflaeche innerhalb der generierten Muendung. */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[20.2%] z-20 h-[7.4%] w-[52%] -translate-x-1/2"
        >
          <motion.span
            className="block h-full w-full rounded-[50%]"
            style={{
              background: fillCount > 0
                ? `radial-gradient(ellipse at 38% 30%, rgba(255,255,255,.96) 0%, ${surface} 11%, ${surface} 56%, rgba(14,4,22,.98) 100%)`
                : "radial-gradient(ellipse,rgba(28,16,39,.92),rgba(3,2,7,.98))",
              boxShadow: fillCount > 0
                ? `inset 0 7px 15px rgba(255,255,255,.14), 0 0 16px ${surface}aa, 0 0 42px ${surface}66`
                : "inset 0 7px 15px rgba(255,255,255,.04)",
            }}
            animate={showSurfaceMotion
              ? { scaleX: [0.97, 1.035, 0.985, 0.97], scaleY: [1, 0.86, 1.06, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }
              : { scaleX: 1, scaleY: 1 }}
            transition={{ duration: 2.1, repeat: showSurfaceMotion ? Infinity : 0, ease: "easeInOut" }}
          />
        </div>

        {/* Jede gesicherte Zutat leuchtet als kleine Rune am Kesselband. */}
        {fillCount > 0 && (
          <div className="absolute left-1/2 top-[43%] z-30 flex max-w-[58%] -translate-x-1/2 items-center justify-center gap-[3%]" aria-hidden>
            {layers.map((layer, index) => (
              <motion.span
                key={layer.id}
                className="aspect-square min-w-[5px] flex-1 rounded-full border border-white/45"
                style={{ maxWidth: premium ? 13 : 8, background: layer.color, boxShadow: `0 0 ${premium ? 12 : 7}px ${layer.color}` }}
                initial={index >= newFrom && !reduceMotion ? { opacity: 0, scale: 0.25, y: 6 } : false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: index >= newFrom ? (arrivalDelay + (index - newFrom) * layerStagger) / 1000 : 0 }}
              />
            ))}
          </div>
        )}

        {premium && ambient && !reduceMotion && fillCount > 0 && [0, 1, 2].map((wisp) => (
          <motion.span
            key={wisp}
            aria-hidden
            className="absolute left-1/2 top-[16%] z-30 h-[26%] w-[7%] rounded-full blur-[6px]"
            style={{ background: `linear-gradient(to top,${surface}a8,${pal.accent}35,transparent)` }}
            initial={{ x: `${(wisp - 1) * 42 - 50}%`, y: 10, opacity: 0, scaleY: 0.55 }}
            animate={{ x: [`${(wisp - 1) * 42 - 50}%`, `${(wisp - 1) * 28 - 50}%`], y: [10, -pxH * 0.32], opacity: [0, 0.68, 0], scaleY: [0.55, 1.3] }}
            transition={{ duration: 2.25 + wisp * 0.25, repeat: Infinity, delay: wisp * 0.48, ease: "easeOut" }}
          />
        ))}

        <div className="pointer-events-none absolute left-1/2 z-40" style={{ top: -pxH * 0.35, transform: "translateX(-50%)" }}>
          <PourStream color={surface} active={pouring} skin={skin} size={fx} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-[23%] z-40" style={{ transform: "translate(-50%, -50%)" }}>
          <Splash color={surface} trigger={splashTrigger} skin={skin} size={fx} />
        </div>
        {complete && (
          <div className="pointer-events-none absolute left-1/2 top-[35%] z-40" style={{ transform: "translate(-50%, -50%)" }}>
            <FinishSparkle color={surface} trigger={finishTrigger} skin={skin} size={fx} />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={boxRef}
      className={className}
      style={{
        ...sizing, position: "relative",
        filter: premium
          ? `drop-shadow(0 18px 22px rgba(0,0,0,.46)) drop-shadow(0 0 ${12 + intensity * 7}px ${tensionGlow}44)`
          : undefined,
      }}
      animate={{
        y: complete && !reduceMotion ? -5 : 0,
        scale: active && premium && !reduceMotion ? [1, 1.008, 1] : 1,
      }}
      transition={{
        y: { type: "spring", stiffness: 200, damping: 14 },
        scale: active && premium && !reduceMotion
          ? { duration: 1.9, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 },
      }}
    >
      <svg viewBox={`0 0 100 ${H}`} width="100%" height="100%" role="img" aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}>
        <defs>
          {layers.map((l, i) => {
            const oben = i < layers.length - 1 ? layers[i + 1].color : l.color;
            const unten = i > 0 ? layers[i - 1].color : l.color;
            return (
              <radialGradient key={l.gradId} id={l.gradId} cx="32%" cy="20%" r="92%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
                <stop offset="13%" stopColor={oben} />
                <stop offset="48%" stopColor={l.color} />
                <stop offset="72%" stopColor={mixtureColor ?? l.color} />
                <stop offset="84%" stopColor={unten} />
                <stop offset="100%" stopColor="rgba(0,0,0,0.62)" />
              </radialGradient>
            );
          })}
          {/* Glaskoerper: oben heller, unten dunkler, damit das Gefaess Tiefe
              bekommt statt eine flache Flaeche zu sein. */}
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.34)" />
            <stop offset="0.18" stopColor="rgba(210,225,255,0.09)" />
            <stop offset="0.58" stopColor="rgba(255,255,255,0.025)" />
            <stop offset="0.84" stopColor="rgba(135,110,185,0.12)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.22)" />
          </linearGradient>
          <linearGradient id={`front-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0.24)" />
            <stop offset="0.16" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="0.56" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.86" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.26)" />
          </linearGradient>
          <linearGradient id={`rim-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.98)" />
            <stop offset="0.48" stopColor="rgba(210,220,255,0.36)" />
            <stop offset="1" stopColor="rgba(35,24,55,0.88)" />
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
              <stop offset="0" stopColor={mixtureColor ?? topColor} stopOpacity={pal.glowAlpha} />
              <stop offset="0.5" stopColor={mixtureColor ?? topColor} stopOpacity={pal.glowAlpha * 0.4} />
              <stop offset="1" stopColor={mixtureColor ?? topColor} stopOpacity="0" />
            </radialGradient>
          )}
          {mixtureColor && (
            <radialGradient id={`mix-${uid}`} cx="50%" cy="58%" r="68%">
              <stop offset="0" stopColor="rgba(255,255,255,.58)" />
              <stop offset="0.24" stopColor={topColor ?? mixtureColor} />
              <stop offset="0.72" stopColor={mixtureColor} />
              <stop offset="1" stopColor={mixtureColor} stopOpacity="0" />
            </radialGradient>
          )}
          <clipPath id={`clip-${uid}`}><path d={innen} /></clipPath>
          {generatedAsset && generatedPlacement && (
            <mask
              id={`generated-alpha-${uid}`}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="100"
              height={H}
              style={{ maskType: "luminance" }}
            >
              <rect x="0" y="0" width="100" height={H} fill="black" />
              <image
                href={generatedAsset}
                {...generatedPlacement}
                preserveAspectRatio="none"
              />
            </mask>
          )}
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

        {/* Kessel-Henkel und Standfuesse liegen hinter dem Koerper. Erst diese
            Silhouette macht aus einer runden Schale einen echten Kessel. */}
        {form.id === "kessel" && (
          <>
            <path d={`M 9 ${H * 0.24} C -8 ${H * 0.26}, -7 ${H * 0.58}, 14 ${H * 0.62}`}
              fill="none" stroke="rgba(18,13,25,.96)" strokeWidth="7" strokeLinecap="round" />
            <path d={`M 91 ${H * 0.24} C 108 ${H * 0.26}, 107 ${H * 0.58}, 86 ${H * 0.62}`}
              fill="none" stroke="rgba(18,13,25,.96)" strokeWidth="7" strokeLinecap="round" />
            <path d={`M 30 ${H * 0.82} L 23 ${H * 1.01}`} stroke="rgba(13,9,19,.98)" strokeWidth="8" strokeLinecap="round" />
            <path d={`M 70 ${H * 0.82} L 77 ${H * 1.01}`} stroke="rgba(13,9,19,.98)" strokeWidth="8" strokeLinecap="round" />
          </>
        )}

        {/* 4. Der technische Glaskoerper ist nur noch der Rueckfall fuer
            Gewaender ohne GPT-Gefaess. Zwei Koerper zugleich erzeugen das in
            der iPhone-QA sichtbare "Glas im Glas". */}
        {!generatedAsset && (
          <>
            <path d={aussen} fill="rgba(18,12,31,0.34)" stroke="rgba(255,255,255,0.12)" strokeWidth="2.8" />
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
          </>
        )}

        {/* 5. Fluessigkeit, an den Innenraum geklippt. */}
        <g clipPath={`url(#clip-${uid})`}>
          {layers.map((l, i) => {
            const ziel = bandPath(form, H, l.yTop, l.yBottom);
            // Schluessel NUR die Zutatenkennung: `sortGlassOrder` zieht die
            // Basiszutat nach vorn. Mit `id + y` mounteten sonst ALLE
            // Schichten neu und liefen von unten wieder hoch.
            return reduceMotion ? (
              <path key={l.id} data-liquid-layer={l.id} d={ziel} fill={`url(#${l.gradId})`} />
            ) : (
              <motion.path
                key={l.id}
                data-liquid-layer={l.id}
                d={ziel}
                fill={`url(#${l.gradId})`}
                style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                initial={{ scaleY: 0.02, opacity: 0.58 }}
                animate={{ scaleY: 1, opacity: 1 }}
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

          {/* Langsame Lichtwalze nur am Heldenglas: sie macht aus Farbbalken
              eine zaehe, lebendige Fluessigkeit, ohne die Geometrie zu bewegen. */}
          {premium && fillCount > 0 && (
            <motion.rect
              x="18" y={pegel} width="28" height={Math.max(0, grenzen[0] - pegel)}
              rx="14" fill="rgba(255,255,255,0.11)"
              initial={false}
              animate={showSurfaceMotion ? { x: [10, 48, 10], opacity: [0.04, 0.2, 0.04] } : { x: 18, opacity: 0.08 }}
              transition={{ duration: 4.8, repeat: showSurfaceMotion ? Infinity : 0, ease: "easeInOut" }}
            />
          )}

          {/* Beim Eingiessen ziehen sich neue Farbe und bestehende Mischung
              sichtbar ineinander. Die Schichten bleiben darunter lesbar. */}
          {premium && mixtureColor && fillCount > 1 && (
            <motion.ellipse
              cx="50"
              rx={Math.max(5, hwInnerAt(form, pegel / H) * 0.34)}
              ry={Math.max(8, (grenzen[0] - pegel) * 0.42)}
              fill={`url(#mix-${uid})`}
              style={{ mixBlendMode: "screen" }}
              initial={false}
              animate={pouring && !reduceMotion
                ? { cy: [pegel, (pegel + grenzen[0]) / 2, pegel], x: [-10, 12, -6], scaleX: [0.55, 1.25, 0.72], opacity: [0.15, 0.72, 0.22] }
                : { cy: (pegel + grenzen[0]) / 2, x: 0, scaleX: 0.8, opacity: 0.16 }}
              transition={pouring && !reduceMotion
                ? { duration: 0.9, repeat: 1, ease: "easeInOut" }
                : { duration: 0.3 }}
            />
          )}

          {/* Kurzzeitige Luftblasen bei jedem Guss; Kohlensaeure-Perlen
              darunter bleiben als eigener, dauerhafter Effekt erhalten. */}
          {premium && pouring && !reduceMotion && [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.circle
              key={`pour-bubble-${splashTrigger}-${i}`}
              cx={50 + ((i % 4) - 1.5) * 8}
              r={1.1 + (i % 3) * 0.55}
              fill="rgba(255,255,255,.68)"
              stroke={mixtureColor ?? topColor ?? "#fff"}
              strokeWidth="0.55"
              initial={{ cy: Math.min(grenzen[0] - 2, pegel + 18 + (i % 3) * 9), opacity: 0, scale: 0.4 }}
              animate={{ cy: pegel + 1, opacity: [0, 0.9, 0], scale: [0.4, 1.15, 0.75] }}
              transition={{ duration: 0.65 + (i % 3) * 0.16, delay: i * 0.055, ease: "easeOut" }}
            />
          ))}
        </g>

        {/* 7. Meniskus: die Ellipse auf der Oberflaeche. Ohne sie sieht die
            Fuellung aus wie ein Balken, nicht wie Fluessigkeit. */}
        {topColor && fillCount > 0 && (
          <motion.ellipse
            cx="50" rx={hwInnerAt(form, pegel / H)} ry={Math.max(1.2, hwInnerAt(form, pegel / H) * 0.16)}
            fill={mixtureColor ?? topColor} stroke="rgba(255,255,255,0.45)" strokeWidth="0.7"
            initial={false}
            animate={{
              cy: pegel,
              scaleX: showSurfaceMotion ? [1, 0.97, 1.025, 1] : 1,
              opacity: [0.88, 1],
            }}
            transition={reduceMotion
              ? { duration: 0 }
              : {
                  cy: { type: "spring", stiffness: 140, damping: 12, delay: arrivalDelay / 1000 },
                  scaleX: showSurfaceMotion
                    ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 },
                  opacity: { duration: 0.24 },
                }}
          />
        )}

        {/* 8. Bodenellipse — nur bei flachem Boden. */}
        {form.flatFloor && !generatedAsset && (
          <ellipse cx="50" cy={form.cavity.bottom * H}
            rx={hwInnerAt(form, form.cavity.bottom)} ry={hwInnerAt(form, form.cavity.bottom) * 0.13}
            fill="rgba(0,0,0,0.3)" />
        )}

        {/* 9. Wandkontur und Muendung. Die Muendungsellipse ist der Rand, der
            ein Glas ueberhaupt erst als Glas lesbar macht — vorher war dort
            eine gerade Linie. */}
        {/* Vorderwand liegt ueber der Fluessigkeit und erzeugt echte
            Materialtiefe statt einer blossen Konturlinie. */}
        {!generatedAsset && (
          <>
            <path d={aussen} fill={`url(#front-${uid})`} opacity={premium ? 0.72 : 0.52} />
            <path d={aussen} fill="none" stroke="rgba(225,232,255,0.62)" strokeWidth={premium ? 1.45 : 1.1} strokeLinejoin="round" />
            <ellipse cx="50" cy={bowlTop * H} rx={muendungHw} ry={Math.max(1.4, muendungHw * 0.17)}
              fill="rgba(10,7,18,0.46)" stroke={`url(#rim-${uid})`}
              strokeWidth={premium ? 2.1 : 1.4} />
            <ellipse cx="50" cy={bowlTop * H + 0.8} rx={Math.max(1, muendungHw - form.wall * 0.65)}
              ry={Math.max(0.8, muendungHw * 0.105)} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" />
          </>
        )}

        {/* 10. Glanzstreifen an der linken Wand — das eine Detail, das aus
            einer Flaeche ein Glas macht. Folgt der Kontur der Form. */}
        {!generatedAsset && (
          <>
            <path
              d={wallPath(form, H, form.cavity.top + 0.04, form.cavity.bottom - 0.06,
                (s, t) => hwOuterAt(s, t) * 0.2, 10)}
              transform={`translate(${-muendungHw * 0.52} 0)`}
              fill={premium ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.14)"}
            />
            {premium && (
              <path
                d={wallPath(form, H, form.cavity.top + 0.1, form.cavity.bottom - 0.14,
                  (s, t) => hwOuterAt(s, t) * 0.085, 8)}
                transform={`translate(${muendungHw * 0.63} 0)`}
                fill="rgba(185,205,255,0.12)"
              />
            )}
          </>
        )}

        {/* Das GPT-Rendering ist die EINZIGE sichtbare Glaswand. Die
            Luminanzmaske entfernt die schwarze Studioflaeche; dadurch bleibt
            die SVG-Fluessigkeit im echten Innenraum sichtbar. */}
        {generatedAsset && generatedPlacement && (
          <image
            data-testid={`brew-generated-glass-${form.id}`}
            href={generatedAsset}
            {...generatedPlacement}
            preserveAspectRatio="none"
            opacity={premium ? 1 : quality === "tv" ? 0.96 : 0.92}
            mask={`url(#generated-alpha-${uid})`}
          />
        )}
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
