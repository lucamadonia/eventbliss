/**
 * Glass — das Herzstück von GEBRÄU: ein echtes Gefäß, das sich schichtweise
 * füllt. Bewusst SVG statt Bilddatei: 30 Rezepte × 2 Gewänder als Grafiken
 * wären nicht wartbar, ein paar <rect>/<path>-Elemente mit Farbverläufen
 * schon.
 *
 * ZWEI GEWÄNDER, EINE GEOMETRIE:
 *  - "bar"  → ein Trinkglas (Trapez), die Flüssigkeit ist einfach nur schön.
 *  - "brew" → ein Kolben (Erlenmeyerkolben), die Flüssigkeit LEUCHTET —
 *             ein weicher, gefilterter Schein in der obersten Schichtfarbe.
 *
 * Die Basis-Zutat (isBase) liegt immer UNTEN. `filled` kommt von BrewGame.tsx
 * bereits in dieser Reihenfolge an (Basis zuerst) — Glass.tsx sortiert nicht
 * selbst, damit hier nur gezeichnet wird, nicht entschieden.
 *
 * Die Zutatenfarbe ist die einzige Bedeutungsträgerin: brew-content.ts sagt
 * es im Kommentar selbst — die Farbe gehört zur Zutat, nicht zur Darstellung.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { INGREDIENTS, type IngredientId, type Skin } from "./brew-content";
import { PourStream, Splash, FinishSparkle } from "./BrewFX";

/** Referenzgröße der BrewFX-Effekte ist das Telefon-Maß (size=1) — hier auf
 * die drei Glas-Größen umgerechnet, statt eine vierte Größenskala einzuführen. */
const FX_SCALE: Record<NonNullable<GlassProps["size"]>, number> = { sm: 0.42, md: 0.7, lg: 1.05 };

/**
 * Wo der Glashals liegt, als Anteil der Gesamthoehe.
 *
 * Exportiert, damit `PourFlight` sein Ziel nicht abschreiben muss — eine
 * abgeschriebene Zahl laeuft der echten irgendwann davon.
 */
export const GLASS_MOUTH_T = 0.14;

export interface GlassProps {
  /** Zutaten des Rezepts in der Reihenfolge, die die Gesamthöhe aufteilt. */
  recipeNeeds: IngredientId[];
  /** Bereits gesicherte Zutaten — Basis zuerst, sonst Einfüll-Reihenfolge. */
  filled: IngredientId[];
  skin: Skin;
  /** Für die kleine Wiederverwendung auf dem Fernseher. */
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * Wie viele Millisekunden vergehen, bis die erste NEUE Schicht zu entstehen
   * beginnt — die Zeit, die die fliegende Karte bis zum Glashals braucht.
   *
   * Kein Aufblitzen trotz Verzoegerung: `motion.path` hat bereits ein
   * `initial` (am Boden zusammengefallen) und haelt es waehrend der Wartezeit.
   * Die Schicht existiert also, ist aber flach, bis ihre Karte landet.
   */
  arrivalDelay?: number;
  /** Versatz zwischen zwei neuen Schichten. */
  layerStagger?: number;
}

const SIZES: Record<NonNullable<GlassProps["size"]>, { w: number; h: number }> = {
  sm: { w: 56, h: 72 },
  md: { w: 96, h: 124 },
  lg: { w: 148, h: 192 },
};

/**
 * Verlaufsstopps für EINE Schicht: oben ein Hauch der Farbe darüber, unten
 * ein Hauch der Farbe darunter. So laufen Schichten an den Rändern ineinander
 * statt als harte Streifen zu wirken — genau der Effekt, der verlangt war.
 */
function layerStops(above: string | null, own: string, below: string | null) {
  const stops: { offset: string; color: string }[] = [];
  stops.push({ offset: "0%", color: above ?? own });
  stops.push({ offset: "18%", color: own });
  stops.push({ offset: "82%", color: own });
  stops.push({ offset: "100%", color: below ?? own });
  return stops;
}

export function Glass({ recipeNeeds, filled, skin, size = "md", className, arrivalDelay = 0, layerStagger = 70 }: GlassProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const { w, h } = SIZES[size];

  const isBrew = skin === "brew";
  // Innenraum des Gefäßes — etwas Rand für Wandstärke und den Glanzrand oben.
  const pad = w * 0.1;
  const innerTop = h * GLASS_MOUTH_T;
  const innerBottom = h * 0.94;
  const innerHeight = innerBottom - innerTop;
  const innerLeftTop = isBrew ? w * 0.34 : pad;
  const innerRightTop = isBrew ? w - w * 0.34 : w - pad;
  const innerLeftBottom = pad * 0.6;
  const innerRightBottom = w - pad * 0.6;

  const total = Math.max(1, recipeNeeds.length);
  const bandHeight = innerHeight / total;
  const fillCount = Math.min(filled.length, total);
  const fillFraction = fillCount / total;
  const complete = fillCount >= total && total > 0;

  // Breite an einer Höhe h0..1 (0 = oben, 1 = unten) entlang der Gefäßwand
  // interpolieren — der Kolben ist oben eng, unten weit; das Glas ist ein
  // gleichmäßiger Trichter. Ohne das würden die Schichten im Kolben wie ein
  // Rechteck wirken statt wie Flüssigkeit in einer Flasche.
  const widthAt = (t: number) => {
    const left = innerLeftTop + (innerLeftBottom - innerLeftTop) * t;
    const right = innerRightTop + (innerRightBottom - innerRightTop) * t;
    return { left, right };
  };

  const layers = useMemo(() => {
    return filled.slice(0, total).map((id, i) => {
      const color = INGREDIENTS[id].color;
      const aboveId = i > 0 ? filled[i - 1] : null;
      const belowId = i < filled.length - 1 ? filled[i + 1] : null;
      return {
        id,
        color,
        gradId: `brewLayer-${uid}-${i}`,
        stops: layerStops(
          aboveId ? INGREDIENTS[aboveId].color : null,
          color,
          belowId ? INGREDIENTS[belowId].color : null,
        ),
        // Von unten gezählt: Schicht 0 sitzt am Boden.
        yTop: innerBottom - (i + 1) * bandHeight,
        yBottom: innerBottom - i * bandHeight,
      };
    });
  }, [filled, total, uid, innerBottom, bandHeight]);

  const topColor = layers.length ? layers[layers.length - 1].color : null;
  const glowId = `brewGlow-${uid}`;
  const fx = FX_SCALE[size];

  // Splash + kurzer Gießstrahl, sobald eine neue Schicht dazukommt — beide
  // gehören BrewFX.tsx (`Splash`/`PourStream`), Glass.tsx liefert nur das
  // "wann". `useRef` statt State für den Vorwert: löst keinen Extra-Render aus.
  const [splashTrigger, setSplashTrigger] = useState(0);
  const [pouring, setPouring] = useState(false);
  const prevCountRef = useRef(filled.length);
  /** Index der ersten Schicht, die bei der letzten Aenderung neu hinzukam. */
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

  // Funkeln genau EINMAL beim Übergang zu "fertig", nicht bei jedem Render,
  // in dem `complete` schon true ist.
  const [finishTrigger, setFinishTrigger] = useState(0);
  const wasCompleteRef = useRef(complete);
  useEffect(() => {
    if (complete && !wasCompleteRef.current) setFinishTrigger((n) => n + 1);
    wasCompleteRef.current = complete;
  }, [complete]);

  // Kolben: Dreieck von schmalem Hals zu breitem Boden. Glas: Trapez, oben
  // etwas weiter als unten (typische Tumbler-Silhouette).
  const outlinePath = isBrew
    ? `M ${w * 0.34} ${innerTop} L ${w * 0.66} ${innerTop} L ${innerRightBottom} ${innerBottom} A ${pad * 0.4} ${pad * 0.4} 0 0 1 ${innerLeftBottom} ${innerBottom} Z`
    : `M ${innerLeftTop} ${innerTop} L ${innerRightTop} ${innerTop} L ${innerRightBottom} ${innerBottom} A ${pad * 0.3} ${pad * 0.3} 0 0 1 ${innerLeftBottom} ${innerBottom} Z`;

  return (
    <motion.div
      className={className}
      style={{ width: w, position: "relative" }}
      animate={{ y: complete && !reduceMotion ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 14 }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden="true">
        <defs>
          {layers.map((l) => (
            <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="0" y2="1">
              {l.stops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          ))}
          {isBrew && topColor && (
            <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={w * 0.06} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          <clipPath id={`clip-${uid}`}>
            <path d={outlinePath} />
          </clipPath>
        </defs>

        {/* Leuchten hinter dem Kolben — nur im Zaubertrank-Gewand. Eine
            weiche, farbige Aura statt eines harten Glases mit Inhalt. */}
        {isBrew && topColor && (
          <ellipse
            cx={w / 2}
            cy={innerBottom - innerHeight * fillFraction * 0.5}
            rx={w * 0.42}
            ry={h * 0.32}
            fill={topColor}
            opacity={fillCount > 0 ? 0.35 : 0}
            filter={`url(#${glowId})`}
          />
        )}

        {/* Gefäßkontur */}
        <path
          d={outlinePath}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={w * 0.02}
        />

        {/* Füllung, an die Gefäßform geklippt. */}
        <g clipPath={`url(#clip-${uid})`}>
          {layers.map((l, i) => {
            const tTop = (l.yTop - innerTop) / innerHeight;
            const tBottom = (l.yBottom - innerTop) / innerHeight;
            const top = widthAt(tTop);
            const bottom = widthAt(tBottom);
            const targetD = `M ${top.left} ${l.yTop} L ${top.right} ${l.yTop} L ${bottom.right} ${l.yBottom} L ${bottom.left} ${l.yBottom} Z`;
            // Schluessel NUR die Zutatenkennung, NICHT zusaetzlich yTop:
            // `sortGlassOrder` zieht die Basiszutat nach vorn. Kommt sie
            // nachtraeglich dazu, verschieben sich alle Indizes, yTop aendert
            // sich — und mit `id + yTop` mounteten ALLE Schichten neu und
            // liefen von unten wieder hoch, statt sauber nachzuruecken.
            // Die Kennungen sind eindeutig: `missingFor` schliesst Vorhandenes
            // aus, `splitTray` loescht Dubletten aus dem Bedarf.
            return reduceMotion ? (
              <path key={l.id} d={targetD} fill={`url(#${l.gradId})`} />
            ) : (
              <motion.path
                key={l.id}
                fill={`url(#${l.gradId})`}
                initial={{ d: `M ${bottom.left} ${innerBottom} L ${bottom.right} ${innerBottom} L ${bottom.right} ${innerBottom} L ${bottom.left} ${innerBottom} Z` }}
                animate={{ d: targetD }}
                // Federung statt linearem Anstieg: der Pegel schwappt oben
                // kurz nach, statt wie ein Ladebalken gleichmäßig zu steigen.
                // Neue Schichten warten, bis ihre Karte oben angekommen ist.
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 12,
                  delay: i >= newFrom ? (arrivalDelay + (i - newFrom) * layerStagger) / 1000 : 0,
                }}
              />
            );
          })}
        </g>

        {/* Glanzrand — Andeutung von Glas/Kristall. */}
        <path
          d={outlinePath}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={w * 0.012}
          strokeDasharray={`${w * 0.3} ${w * 0.7}`}
          opacity={0.4}
        />
      </svg>

      {/* Gießstrahl: läuft kurz von oben in den Hals, wenn eine Schicht dazukommt. */}
      <div
        className="pointer-events-none absolute left-1/2"
        style={{ top: -h * 0.55 * fx, transform: "translateX(-50%)" }}
      >
        <PourStream color={topColor ?? "#ffffff"} active={pouring} skin={skin} size={fx} />
      </div>

      {/* Die Aufprallwelle sitzt an der aktuellen Pegel-Oberfläche. */}
      <div
        className="pointer-events-none absolute left-1/2"
        style={{
          top: innerBottom - innerHeight * fillFraction,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Splash color={topColor ?? "#ffffff"} trigger={splashTrigger} skin={skin} size={fx} />
      </div>

      {/* Fertig-Funkeln, mittig über dem Gefäß. */}
      {complete && (
        <div
          className="pointer-events-none absolute left-1/2"
          style={{ top: innerTop + innerHeight * 0.3, transform: "translate(-50%, -50%)" }}
        >
          <FinishSparkle color={topColor ?? "#ffffff"} trigger={finishTrigger} skin={skin} size={fx} />
        </div>
      )}
    </motion.div>
  );
}
