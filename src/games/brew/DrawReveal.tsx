/**
 * DrawReveal — der Moment, in dem eine Karte aufgedeckt wird.
 *
 * WARUM ES DAS GIBT: GEBRAEU ist ein Push-your-luck-Spiel. Der Nervenkitzel
 * liegt nicht im Eingiessen, sondern im ZIEHEN — mehrmals pro Zug, und genau
 * dort schlaegt die Unglueckskarte zu. Bis hierher hatte dieser Moment keine
 * Buehne: es gab nicht einmal einen sichtbaren Stapel, und eine gezogene Karte
 * erschien einfach aus dem Nichts auf dem Tablett. Der Nutzer nannte das
 * Ergebnis "zu wenig und zu langweilig", und er hatte recht.
 *
 * Die Karte kommt jetzt gross in die Bildmitte, dreht sich aus der Rueckseite
 * heraus auf und haelt kurz an. Man SIEHT, was man gezogen hat, bevor es
 * weitergeht — und beim Bust sieht man es einen Wimpernschlag laenger.
 *
 * Wie `PourFlight`: Portal (sonst faengt der `transform` der Seitenanimation
 * das `fixed` ab), nur `transform` und `opacity`, und bei Bewegungsarmut
 * kuerzer statt gar nicht.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { ease } from "@/lib/motion";
import { INGREDIENTS, type IngredientId, type Skin } from "./brew-content";
import { IngredientIcon } from "./IngredientIcon";
import { ingredientPlate } from "./BrewFX";

/** Was gezogen wurde. `null` bei der Unglueckskarte — die hat kein Motiv. */
export interface DrawnCard {
  id: IngredientId | null;
  /** Zaehler, kein Boolean: zweimal dieselbe Karte muss zweimal feuern. */
  seq: number;
  outcome?: "hit" | "miss" | "bust";
}

export interface DrawRevealProps {
  card: DrawnCard | null;
  skin: Skin;
  reduced?: boolean;
  /** Name der Zutat, schon uebersetzt. Bei der Unglueckskarte der Bust-Titel. */
  label: string;
  verdictLabel?: string;
  onDone: () => void;
}

/** Taktzeiten in Millisekunden — volle und vereinfachte Fassung. */
export const DRAW_BEATS = {
  flip: 380,
  /** Wie lange die aufgedeckte Karte stehen bleibt. */
  hold: 420,
  /** Der Bust haelt laenger — der Schreck braucht Zeit. */
  holdBust: 620,
  out: 220,
  reducedTotal: 420,
} as const;

export function drawRevealDuration(isBust: boolean, reduced: boolean): number {
  if (reduced) return DRAW_BEATS.reducedTotal;
  return DRAW_BEATS.flip + (isBust ? DRAW_BEATS.holdBust : DRAW_BEATS.hold) + DRAW_BEATS.out;
}

export function DrawReveal({ card, skin, reduced = false, label, verdictLabel, onDone }: DrawRevealProps) {
  const [phase, setPhase] = useState<"flip" | "hold" | "out" | null>(null);

  useEffect(() => {
    if (!card) { setPhase(null); return; }
    const isBust = card.id === null;
    setPhase("flip");
    const timers: number[] = [];
    if (reduced) {
      timers.push(window.setTimeout(() => setPhase("out"), DRAW_BEATS.reducedTotal * 0.6));
      timers.push(window.setTimeout(() => { setPhase(null); onDone(); }, DRAW_BEATS.reducedTotal));
    } else {
      const hold = isBust ? DRAW_BEATS.holdBust : DRAW_BEATS.hold;
      timers.push(window.setTimeout(() => setPhase("hold"), DRAW_BEATS.flip));
      timers.push(window.setTimeout(() => setPhase("out"), DRAW_BEATS.flip + hold));
      timers.push(window.setTimeout(() => { setPhase(null); onDone(); }, drawRevealDuration(isBust, false)));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [card, reduced, onDone]);

  const isBust = card?.id === null || card?.outcome === "bust";
  const isHit = card?.outcome === "hit";
  const color = card?.id ? INGREDIENTS[card.id].color : "#FB7185";

  return (
    <NativeOverlayPortal>
      <AnimatePresence mode="wait">
        {card && phase && (
          <motion.div
            key={card.seq}
            className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
            aria-hidden
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {/* Abdunkeln, damit die Karte die Buehne ganz fuer sich hat. */}
            <div
              className="absolute inset-0"
              style={{ background: isBust ? "rgba(40,6,14,0.55)" : "rgba(11,15,26,0.45)" }}
            />
            <motion.div
              className="relative rounded-3xl flex flex-col items-center justify-center gap-2"
              style={{
                width: 168,
                height: 200,
                ...ingredientPlate(color),
                // Der Schein traegt die Stimmung: Zutat ruhig, Bust hart.
                boxShadow: `inset 0 0 0 2px ${color}, 0 0 ${isBust ? 60 : 34}px -4px ${color}`,
                transformStyle: "preserve-3d",
              }}
              initial={false}
              animate={
                phase === "out"
                  ? { scale: reduced ? 0.9 : 0.5, opacity: 0, y: reduced ? 0 : 40 }
                  : reduced
                    ? { opacity: 1, scale: 1 }
                    : phase === "flip"
                      ? { rotateY: [180, 0], scale: [0.62, 1.04, 0.96], opacity: [0, 1, 1], y: [18, 0] }
                      : { rotateY: 0, scale: isHit ? [0.96, 1.055, 1] : 1, opacity: 1, y: 0 }
              }
              transition={{
                duration: (phase === "out" ? DRAW_BEATS.out : DRAW_BEATS.flip) / 1000,
                ease: phase === "out" ? ease.in : ease.snap,
              }}
            >
              {card.id ? (
                <IngredientIcon id={card.id} skin={skin} className="w-24 h-24" emojiSize="4rem" />
              ) : (
                <span style={{ fontSize: "4rem", lineHeight: 1 }}>{skin === "brew" ? "🌋" : "🔔"}</span>
              )}
              <span
                className="px-3 text-center text-sm font-black leading-tight"
                style={{ color: isBust ? "#FFE4E6" : "rgba(255,255,255,0.95)" }}
              >
                {label}
              </span>
              {!isBust && phase === "hold" && (
                <motion.span
                  initial={false}
                  animate={{ opacity: [0, 1], y: [5, 0] }}
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: isHit ? "#A7F3D0" : "rgba(255,255,255,.56)" }}
                >
                  {isHit ? "✦ " : ""}{verdictLabel}
                </motion.span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
