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
 * WAS SICH GEAENDERT HAT UND WARUM: Der Schleier lief vorher nach unten auf
 * volle Deckung aus. Die untere Bildhaelfte war damit schwarz — und genau
 * dort stehen auf dem Fernseher die Glaeser. Von "Lounge" blieb nichts. Jetzt
 * ist der Schleier OBEN UND UNTEN stark und in der MITTE schwach: Text sitzt
 * in den starken Zonen, die Glaeser in der Mitte, wo der Raum sichtbar
 * bleibt.
 *
 * Die Bild-Deckkraft steigt dafuer von 0,32 auf 0,60. Das geht nur, weil die
 * neuen Bilder von Haus aus low-key sind (Ruhezone unter 40/255, von
 * `scripts/brew-images.mjs` nachgemessen). Mit einem hellen Bild waere es
 * falsch — dann sinkt die Deckkraft, die Textfarbe steigt nicht.
 */
import { motion } from "framer-motion";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { useOptionalImage } from "@/lib/useOptionalImage";
import type { Skin } from "./brew-content";
import { BREW_PALETTES } from "./brew-palette";

export interface BrewAtmosphereProps {
  skin: Skin;
  variant: "phone" | "tv";
}

/** Hex plus Alpha-Suffix — spart eine rgba-Umrechnung im Markup. */
const a = (hex: string, suffix: string) => `${hex}${suffix}`;

export function BrewAtmosphere({ skin, variant }: BrewAtmosphereProps) {
  const src = `/images/brew/bg-${skin}-${variant}.webp`;
  const loaded = useOptionalImage(src);
  const ambient = useAmbientMotion();
  const p = BREW_PALETTES[skin];
  const istTv = variant === "tv";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      {/* 1 — Grundfarbe. Liegt immer, auch ohne Bild. Jetzt je Gewand: die
          Bar ist braunschwarz, das Labor blauschwarz. */}
      <div className="absolute inset-0" style={{ background: p.bg }} />

      {/* 2 — Das Bild. Kuer, nicht Pflicht. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${src})`,
          opacity: loaded ? (istTv ? 0.6 : 0.46) : 0,
          transition: "opacity 700ms ease-out",
        }}
      />

      {/* 3 — Bodenlicht: der warme Rueckwurf der Theke. Auf dem Fernseher
          stehen die Glaeser darauf, statt in einem schwarzen Loch. */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(0deg, ${a(p.accent3, "2E")} 0%, transparent 34%)` }}
      />

      {/* 4 — Lesbarkeitsschleier: stark oben und unten, schwach in der Mitte. */}
      <div
        className="absolute inset-0"
        style={{
          background: istTv
            ? `linear-gradient(180deg, ${a(p.bg, "D6")} 0%, ${a(p.bg, "57")} 26%, ${a(p.bg, "47")} 62%, ${a(p.bg, "B8")} 100%)`
            : `linear-gradient(180deg, ${a(p.bg, "B8")} 0%, ${a(p.bg, "6B")} 22%, ${a(p.bg, "9E")} 58%, ${a(p.bg, "E6")} 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(115% 78% at 50% 32%, transparent 38%, ${a(p.bgDeep, "CC")})` }}
      />

      {/* 5 — Zwei statische Farbwaeschen. Vorbild TVOhrwurmView: Farbe ohne
          Bewegung kostet nichts und traegt die Stimmung. */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[34rem] h-[34rem] rounded-full"
        style={{ background: a(p.accent, "1F"), filter: "blur(90px)" }}
      />
      <div
        className="absolute -bottom-[14%] -right-[12%] w-[34rem] h-[34rem] rounded-full"
        style={{ background: a(p.accent3, "17"), filter: "blur(90px)" }}
      />

      {/* 6 — Ein einzelner driftender Farbschleier in der Gewandfarbe.
          Animiert nur `scaleY` und `opacity`: `y` auf einem 80vmax grossen
          Element laesst den Compositor eine sehr grosse Flaeche schieben. */}
      <motion.div
        className="absolute -top-[20%] left-1/2 w-[80vmax] h-[80vmax] rounded-full"
        style={{
          x: "-50%",
          background: `radial-gradient(circle, ${a(p.accent, "1F")} 0%, transparent 62%)`,
          filter: "blur(40px)",
        }}
        animate={ambient ? { scaleY: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] } : undefined}
        transition={ambient ? { duration: 18, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
    </div>
  );
}
