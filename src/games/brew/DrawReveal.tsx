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
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing } from "lucide-react";
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
  holdBust: 900,
  out: 220,
  reducedTotal: 420,
} as const;

export function drawRevealDuration(isBust: boolean, reduced: boolean): number {
  if (reduced) return DRAW_BEATS.reducedTotal;
  return DRAW_BEATS.flip + (isBust ? DRAW_BEATS.holdBust : DRAW_BEATS.hold) + DRAW_BEATS.out;
}

export function DrawReveal({ card, skin, reduced = false, label, verdictLabel, onDone }: DrawRevealProps) {
  const [phase, setPhase] = useState<"flip" | "hold" | "out" | null>(null);
  const [bustAssetReady, setBustAssetReady] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!card) { setPhase(null); return; }
    const isBust = card.id === null;
    setPhase("flip");
    // Beim ersten Bust startet die Reveal-Uhr erst, wenn das Hero-Asset da ist.
    // Sonst kann eine langsame Verbindung den kompletten Effekt verschlucken.
    if (isBust && !bustAssetReady) return;
    const timers: number[] = [];
    if (reduced) {
      timers.push(window.setTimeout(() => setPhase("out"), DRAW_BEATS.reducedTotal * 0.6));
      timers.push(window.setTimeout(() => { setPhase(null); onDoneRef.current(); }, DRAW_BEATS.reducedTotal));
    } else {
      const hold = isBust ? DRAW_BEATS.holdBust : DRAW_BEATS.hold;
      timers.push(window.setTimeout(() => setPhase("hold"), DRAW_BEATS.flip));
      timers.push(window.setTimeout(() => setPhase("out"), DRAW_BEATS.flip + hold));
      timers.push(window.setTimeout(() => { setPhase(null); onDoneRef.current(); }, drawRevealDuration(isBust, false)));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [bustAssetReady, card, reduced]);

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
              style={{ background: isBust ? "rgba(40,6,14,0.78)" : "rgba(4,7,16,0.68)" }}
            />
            {!reduced && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="absolute h-44 w-44 rounded-full border-2"
                    style={{ borderColor: `${color}${i === 0 ? "cc" : "66"}`, boxShadow: `0 0 38px ${color}55` }}
                    initial={{ scale: 0.25, opacity: 0.9 }}
                    animate={{ scale: 2.2 + i * 0.6, opacity: 0, rotate: i % 2 ? -55 : 55 }}
                    transition={{ duration: 0.75, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }} />
                ))}
                {Array.from({ length: isBust ? 18 : 12 }).map((_, i) => {
                  const angle = (Math.PI * 2 * i) / (isBust ? 18 : 12);
                  const distance = isBust ? 230 : 155;
                  return <motion.span key={`ray-${i}`} className="absolute h-1.5 w-12 origin-left rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, transparent)`, boxShadow: `0 0 10px ${color}` }}
                    initial={{ x: 0, y: 0, rotate: angle * 180 / Math.PI, scaleX: 0, opacity: 0 }}
                    animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, scaleX: [0, 1.3, 0.2], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.72, delay: 0.08 + (i % 3) * 0.025, ease: "easeOut" }} />;
                })}
              </>
            )}
            <motion.div
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem]"
              style={{
                width: isBust ? "min(78vw, 304px)" : 190,
                height: isBust ? "min(92vw, 364px)" : 232,
                ...ingredientPlate(color),
                // Der Schein traegt die Stimmung: Zutat ruhig, Bust hart.
                boxShadow: `inset 0 0 0 2px ${color}, inset 0 0 42px ${color}35, 0 0 ${isBust ? 90 : 62}px ${color}`,
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
                      : isBust
                        ? { rotateY: 0, scale: [0.96, 1.035, 1], rotate: [0, -1.4, 1.2, 0], opacity: 1, y: 0 }
                        : { rotateY: 0, scale: isHit ? [0.96, 1.055, 1] : 1, opacity: 1, y: 0 }
              }
              transition={{
                duration: (phase === "out" ? DRAW_BEATS.out : DRAW_BEATS.flip) / 1000,
                ease: phase === "out" ? ease.in : ease.snap,
              }}
            >
              {isBust && (
                <>
                  <motion.span
                    aria-hidden
                    className="absolute h-[80%] w-[80%] rounded-full border border-[#FB7185]/28"
                    animate={reduced ? undefined : { rotate: 360, scale: [0.94, 1.04, 0.94] }}
                    transition={{ rotate: { duration: 9, repeat: Infinity, ease: "linear" }, scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
                  />
                  <motion.span
                    aria-hidden
                    className="absolute h-[62%] w-[62%] rounded-full border border-dashed border-[#8ff5ff]/25"
                    animate={reduced ? undefined : { rotate: -360 }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  />
                  <div aria-hidden className="absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-[#8ff5ff] to-transparent" />
                </>
              )}
              {card.id ? (
                <IngredientIcon id={card.id} skin={skin} className="w-24 h-24" emojiSize="4rem" />
              ) : skin === "brew" ? (
                <motion.div className="relative z-10 h-52 w-52" initial={false}>
                  <motion.span
                    aria-hidden
                    className="absolute inset-[20%] rounded-full bg-[#FB7185]/35 blur-2xl"
                    animate={reduced ? undefined : { scale: [0.72, 1.32, 0.72], opacity: [0.25, 0.78, 0.25] }}
                    transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.img
                    src="/images/brew/bust-eruption-v2.webp"
                    alt=""
                    onLoad={() => setBustAssetReady(true)}
                    onError={() => setBustAssetReady(true)}
                    className="relative h-full w-full object-contain drop-shadow-[0_0_24px_rgba(251,113,133,.8)]"
                    initial={reduced ? false : { opacity: 0, scale: 0.22, y: 34 }}
                    animate={phase === "out"
                      ? { opacity: 0, scale: 1.36, y: -20 }
                      : { opacity: 1, scale: phase === "flip" && !reduced ? [0.22, 1.13, 0.96] : 1, y: 0 }}
                    transition={{ duration: phase === "out" ? 0.22 : 0.48, ease: [0.16, 1, 0.3, 1] }}
                  />
                </motion.div>
              ) : (
                <motion.span
                  className="grid h-24 w-24 place-items-center rounded-full border border-[#FBBF24]/35 bg-[#FBBF24]/10 text-[#FBBF24] shadow-[0_0_42px_rgba(251,191,36,.28)]"
                  animate={reduced ? undefined : { rotate: [0, -9, 9, -5, 5, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.72, ease: "easeInOut" }}
                >
                  <BellRing className="h-12 w-12" strokeWidth={2.4} aria-hidden />
                </motion.span>
              )}
              <span
                className={`relative z-10 px-4 text-center font-black leading-tight ${isBust ? "text-lg" : "text-sm"}`}
                style={{ color: isBust ? "#FFE4E6" : "rgba(255,255,255,0.95)" }}
              >
                {label}
              </span>
              {isBust && verdictLabel && phase === "hold" && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 mt-1 rounded-full border border-[#FB7185]/35 bg-[#FB7185]/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#fecdd3]"
                >
                  {verdictLabel}
                </motion.span>
              )}
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
