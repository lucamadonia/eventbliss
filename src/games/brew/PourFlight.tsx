/**
 * PourFlight — die Zutaten wandern sichtbar ins Glas und verfluessigen sich.
 *
 * WARUM ES DAS GIBT: Das Eingiessen ist die zentrale Entscheidung von GEBRAEU
 * und lief bis hierher unsichtbar ab — man tippte, und im selben Augenblick
 * waren die Karten weg und das Glas hatte eine Schicht mehr. Damit fehlte
 * nicht nur das Schauspiel, sondern die ERKLAERUNG: Niemand sah, welche
 * Zutaten ins Glas wanderten und welche auf der Theke landeten. Genau das ist
 * die Regel des Spiels.
 *
 * Die Richtung traegt die Erklaerung: Passendes fliegt NACH OBEN ins Glas,
 * Ballast faellt NACH UNTEN auf die Theke. Deshalb darf die Reihenfolge der
 * Zonen im Spielbildschirm (Glas oben, Tablett Mitte, Theke unten) nicht
 * umsortiert werden — sie ist hier tragend.
 *
 * PORTAL, NICHT `layoutId`: `PageTransition` legt um jede Route ein
 * `motion.div` mit `transform`, und ein Element mit `transform != none` wird
 * zum Bezugsrahmen fuer `position: fixed` darunter (siehe den Kopfkommentar
 * von NativeOverlayPortal). Ohne Portal waeren alle Koordinaten falsch.
 * `layoutId` scheidet zusaetzlich aus, weil es im Glas gar kein dauerhaftes
 * Karten-Element gibt — das Ziel ist eine Fluessigkeitsschicht.
 *
 * NUR `transform` UND `opacity`: keine SVG-Filter, keine animierten Masken,
 * kein animiertes `blur`. Alles davon zwingt den Browser zu einem Repaint pro
 * Bild; bei bis zu sieben gleichzeitigen Karten faellt die Bildrate auf einem
 * Mittelklasse-Telefon sofort unter 30. Das `blur` der Fluessigkeitsebene ist
 * deshalb KONSTANT — einmal gerastert, danach nur noch verschoben.
 *
 * BEWEGUNGSARMUT HEISST EINFACHER, NICHT NICHTS. Diese Datei wurde frueher bei
 * `useReducedMotion() === true` gar nicht erst gerendert — auf einem iPhone mit
 * aktivierter Einstellung "Bewegung reduzieren" bewegte sich damit im ganzen
 * Spiel nichts, und mit der Bewegung verschwand auch die Erklaerung. Jetzt
 * laeuft die Choreografie immer: bei Bewegungsarmut auf gerader Bahn, in 45 %
 * der Zeit und ohne Verfluessigung. Wer Bewegung reduziert, will weniger
 * Bewegung — nicht weniger Information.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { ease } from "@/lib/motion";
import { INGREDIENTS, type IngredientId, type Skin } from "./brew-content";
import { IngredientIcon } from "./IngredientIcon";
import { POUR_BEATS, ingredientPlate } from "./BrewFX";

export interface PourPlan {
  /** Wer eingiesst — ONLINE die Wahrheit, nicht `activeIdx`. */
  pid: string;
  used: IngredientId[];
  leftover: IngredientId[];
}

export interface PourFlightProps {
  plan: PourPlan | null;
  /** Wo die Tablettkarten lagen, als der Guss begann. Reihenfolge = Tablett. */
  from: DOMRect[];
  /** Erst beim Abflug lesen — die Refs leben, das Layout kann sich geaendert haben. */
  glassBox: () => DOMRect | null;
  counterBox: () => DOMRect | null;
  skin: Skin;
  /**
   * Bewegungsarmut: gerade Bahn statt Bogen, kuerzer, ohne Verfluessigung.
   *
   * BEWUSST KEIN AUSSCHALTER. Vorher wurde diese Komponente bei
   * `useReducedMotion() === true` gar nicht erst gerendert — und damit fiel
   * die Erklaerung weg, welche Zutat ins Glas geht und welche auf die Theke.
   * Wer Bewegung reduziert, will weniger Bewegung, nicht weniger Information.
   */
  reduced?: boolean;
}

const CARD = 48;

/** Zusammengehoerige Flugdaten einer einzelnen Karte. */
interface Flight {
  id: IngredientId;
  key: string;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  delay: number;
  travel: number;
  up: boolean;
  /** Gerade Bahn, keine Verfluessigung — siehe `reduced` in den Props. */
  plain: boolean;
}

export function PourFlight({ plan, from, glassBox, counterBox, skin, reduced = false }: PourFlightProps) {
  const [flights, setFlights] = useState<Flight[] | null>(null);
  /**
   * Fuer welchen Plan die Fluege schon gebaut wurden.
   *
   * OHNE DIESE SPERRE bricht die Choreografie mitten drin ab: Der Effekt lief
   * bei jedem Rendern erneut, und sobald das eingefrorene Tablett nach 300 ms
   * auftaut, sind die Startpunkte leer — die Fluege wurden dann durch eine
   * leere Liste ersetzt und das Overlay verschwand, BEVOR die Verfluessigung
   * bei 720 ms ueberhaupt zu sehen war. Gemessen: Portal weg bei t=700 statt
   * bei t=1200.
   */
  const builtFor = useRef<PourPlan | null>(null);

  useEffect(() => {
    if (!plan) { builtFor.current = null; setFlights(null); return; }
    if (builtFor.current === plan) return;
    builtFor.current = plan;

    const glass = glassBox();
    const counter = counterBox();
    // Ohne Ziel kein Flug — lieber gar keine Animation als Karten, die ins
    // Nichts fliegen. Das Spiel laeuft ohnehin weiter, die Wahrheit steht
    // bereits im Zustand.
    if (!glass) { setFlights(null); return; }

    const stag = plan.used.length >= POUR_BEATS.tightFrom
      ? POUR_BEATS.staggerTight
      : POUR_BEATS.stagger;

    // Die Startpunkte laufen der Tablett-Reihenfolge nach: erst die passenden
    // in ihrer Reihenfolge, dann der Ballast.
    let cursor = 0;
    const next = (): DOMRect | undefined => from[cursor++];

    const out: Flight[] = [];
    const mouthX = glass.left + glass.width / 2;
    const mouthY = glass.top + glass.height * 0.16;

    plan.used.forEach((id, i) => {
      const r = next();
      if (!r) return;
      out.push({
        id, key: `u${i}-${id}`,
        x0: r.left, y0: r.top,
        dx: mouthX - (r.left + r.width / 2),
        dy: mouthY - (r.top + r.height / 2),
        delay: reduced ? POUR_BEATS.reducedHold : POUR_BEATS.depart + i * stag,
        travel: reduced ? POUR_BEATS.flight * 0.45 : POUR_BEATS.flight,
        up: true, plain: reduced,
      });
    });

    plan.leftover.forEach((id, i) => {
      const r = next();
      if (!r) return;
      // Ohne Theken-Ziel faellt der Ballast einfach etwas nach unten und
      // verblasst — besser als ein Sprung auf Koordinate 0,0.
      const tx = counter ? counter.left + 24 + i * (CARD + 8) + CARD / 2 : r.left + r.width / 2;
      const ty = counter ? counter.top + counter.height / 2 : r.top + 120;
      out.push({
        id, key: `l${i}-${id}`,
        x0: r.left, y0: r.top,
        dx: tx - (r.left + r.width / 2),
        dy: ty - (r.top + r.height / 2),
        delay: reduced ? POUR_BEATS.reducedHold : POUR_BEATS.depart + POUR_BEATS.leftoverGap + i * POUR_BEATS.leftoverStagger,
        travel: reduced ? POUR_BEATS.leftoverFlight * 0.45 : POUR_BEATS.leftoverFlight,
        up: false, plain: reduced,
      });
    });

    setFlights(out);
  }, [plan, from, glassBox, counterBox, reduced]);

  if (!flights || flights.length === 0) return null;

  return (
    <NativeOverlayPortal>
      <div className="pointer-events-none fixed inset-0 z-50" aria-hidden>
        {flights.map((f) => (
          <FlyingCard key={f.key} f={f} skin={skin} />
        ))}
      </div>
    </NativeOverlayPortal>
  );
}

/**
 * Eine Karte auf Reisen.
 *
 * Zwei gestapelte Ebenen: die feste Karte und darunter eine Fluessigkeitspille.
 * Beim Aufprall blendet die feste aus und schrumpft, die fluessige blendet ein
 * und laeuft flach — ein Tropfen, der auf einer Oberflaeche zerlaeuft. Das Glas
 * federt im selben Moment seine neue Schicht hoch: die Fluessigkeit wird nicht
 * dargestellt, sie wird UEBERGEBEN.
 */
function FlyingCard({ f, skin }: { f: Flight; skin: Skin }) {
  const color = INGREDIENTS[f.id].color;
  const plate = ingredientPlate(color);
  /**
   * Zwei ausdrueckliche Schaltmomente statt framer-`delay`.
   *
   * WARUM NICHT `transition.delay`: Gemessen trug die Karte 220 ms nach dem
   * geplanten Abflug noch `transform: none` — die Animation lief schlicht nicht
   * an. Ein eigener Zeitgeber, der einen Zustand umlegt, ist hier nicht nur
   * robuster, sondern auch nachvollziehbar: man kann den Zustand ablesen.
   */
  const [go, setGo] = useState(false);
  const [melting, setMelting] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setGo(true), f.delay);
    const b = f.up && !f.plain ? window.setTimeout(() => setMelting(true), f.delay + f.travel) : 0;
    return () => { window.clearTimeout(a); if (b) window.clearTimeout(b); };
  }, [f]);

  return (
    <motion.div
      className="absolute"
      style={{ left: f.x0, top: f.y0, width: CARD, height: CARD }}
      initial={false}
      animate={go
        ? {
            x: f.dx,
            y: f.dy,
            scale: f.plain ? (f.up ? 0.7 : 0.9) : (f.up ? 0.5 : 0.86),
            // Vereinfacht: die Karte blendet am Ziel aus, statt sich zu
            // verfluessigen. Der Weg bleibt sichtbar, der Schnoerkel entfaellt.
            opacity: f.plain ? 0 : (f.up ? 1 : 0),
          }
        : { x: 0, y: 0, scale: 1, opacity: 1 }}
      transition={go
        ? { duration: f.travel / 1000, ease: ease.out, opacity: { duration: f.travel / 1000, delay: f.travel / 2000 } }
        : { duration: 0 }}
    >
      {/* fest */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-center"
        style={plate}
        animate={melting ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.12, ease: ease.in }}
      >
        <IngredientIcon id={f.id} skin={skin} className="w-9 h-9" emojiSize="1.5rem" />
      </motion.div>

      {/* fluessig — `blur` ist KONSTANT, siehe Kopfkommentar */}
      {f.up && !f.plain && (
        <motion.div
          className="absolute left-0 right-0 top-1/2 rounded-full"
          style={{
            height: CARD * 0.5,
            marginTop: -CARD * 0.25,
            background: `linear-gradient(180deg, ${color}, ${color}cc)`,
            filter: "blur(2px)",
          }}
          initial={{ opacity: 0, scaleY: 0.35, scaleX: 1 }}
          animate={melting
            ? { opacity: [0, 1, 0], scaleY: [0.35, 1, 0.18], scaleX: [1, 1, 1.35] }
            : { opacity: 0, scaleY: 0.35, scaleX: 1 }}
          transition={{ duration: POUR_BEATS.melt / 1000, times: [0, 0.46, 1], ease: ease.out }}
        />
      )}
    </motion.div>
  );
}
