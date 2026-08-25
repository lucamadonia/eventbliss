/**
 * BrewAtmosphere — die Welt hinter dem Spiel.
 *
 * Drei Regeln, uebernommen aus CloseEnoughAtmosphere:
 *  1. Nie ueber der Bedienung. Alles hier ist `pointer-events-none` und `z-0`.
 *  2. Nur `transform` und `opacity` animieren.
 *  3. Bewegungsarmut respektieren — und zwar ueber `useAmbientMotion`, nicht
 *     `useReducedMotion`: Dauerschleifen sind auf dem Fernseher und nativ aus
 *     (siehe Kopfkommentar in BrewFX.tsx).
 *
 * Das Hintergrundbild ist OPTIONAL. Fehlt es, bleibt seine Ebene auf
 * `opacity: 0` und niemand merkt etwas — es traegt der Verlauf.
 *
 * Der Lesbarkeitsschleier darueber ist NICHT verhandelbar: die Kopfzeile und
 * alle Beschriftungen liegen frei auf dem Bild. Wird es zu hell, sinkt die
 * Bild-Deckkraft — die Textfarbe steigt nicht.
 */
import { motion } from "framer-motion";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { useOptionalImage } from "@/lib/useOptionalImage";
import type { Skin } from "./brew-content";

const ACCENT: Record<Skin, string> = { brew: "#8B5CF6", bar: "#F59E0B" };

export interface BrewAtmosphereProps {
  skin: Skin;
  variant: "phone" | "tv";
}

export function BrewAtmosphere({ skin, variant }: BrewAtmosphereProps) {
  const src = `/images/brew/bg-${skin}-${variant}.webp`;
  const loaded = useOptionalImage(src);
  const ambient = useAmbientMotion();
  const accent = ACCENT[skin];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      {/* 1 — Grundfarbe. Liegt immer, auch ohne Bild. */}
      <div className="absolute inset-0" style={{ background: "#0B0F1A" }} />

      {/* 2 — Das Bild. Kuer, nicht Pflicht. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${src})`,
          opacity: loaded ? 0.32 : 0,
          transition: "opacity 700ms ease-out",
        }}
      />

      {/* 3 — Lesbarkeitsschleier plus Vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,15,26,0.55) 0%, rgba(11,15,26,0.80) 42%, #0B0F1A 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 80% at 50% 15%, transparent, rgba(11,15,26,0.85))",
        }}
      />

      {/* 4 — Ein einzelner driftender Farbschleier in der Gewandfarbe. */}
      <motion.div
        className="absolute -top-[20%] left-1/2 w-[80vmax] h-[80vmax] rounded-full"
        style={{
          x: "-50%",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 62%)`,
          filter: "blur(40px)",
        }}
        animate={ambient ? { y: [0, 28, 0], opacity: [0.55, 0.85, 0.55] } : undefined}
        transition={ambient ? { duration: 18, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
    </div>
  );
}
