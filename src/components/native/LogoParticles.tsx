/**
 * LogoParticles — Funken rund um das Splash-Logo. Pure framer-motion, kein
 * Canvas, keine neuen Abhaengigkeiten.
 *
 * Zwei Auftritte, ein Bauplan:
 *   "burst" — der Einschlagsfunke: alle Teilchen fliegen einmal radial nach
 *             aussen und verloeschen. Fuer den Moment, in dem das Logo zuendet.
 *   "rise"  — die geloesten Funken danach: sie treiben langsam nach oben weg,
 *             in Schleife, bis die Szene sie mit aufloest (kein eigenes Ende).
 *
 * Die Farben sind dieselben Akzente wie auf der Nacht-Route der App
 * (src/games/tv/tv-tokens.ts ACCENT) — bewusst hier dupliziert statt
 * importiert, weil tv-tokens.ts fuer die TV-Spielszenen gehoert und der
 * Splash keine Abhaengigkeit zu einem Feature-Modul aufbauen soll.
 */
import { motion } from "framer-motion";
import { useMemo } from "react";

const ACCENT = ["#df8eff", "#ff6b98", "#f9ca24"];

interface Props {
  delay?: number;
  count?: number;
  /** Wie weit die Teilchen beim Burst nach aussen fliegen (px). */
  spread?: number;
  variant?: "burst" | "rise";
}

export function LogoParticles({ delay = 0, count = 24, spread = 120, variant = "burst" }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = spread + Math.random() * (spread * 0.35);
        const size = 2 + Math.random() * 4;
        const dur = 0.6 + Math.random() * 0.3;
        const color = ACCENT[i % ACCENT.length];
        return {
          id: i,
          // "rise" braucht kein radiales x — es treibt nur ueber driftX.
          x: variant === "burst" ? Math.cos(angle) * distance : 0,
          // "rise": leicht seitlicher Drift statt radialem Kreis — Funken
          // die aufsteigen, streuen nicht gleichmaessig, sie treiben.
          y: variant === "burst" ? Math.sin(angle) * distance : -(distance * 0.9 + Math.random() * 80),
          driftX: (Math.random() - 0.5) * 60,
          size,
          dur,
          color,
          // Jeder Funke startet leicht versetzt und mit eigener Pause, sonst
          // pulsiert die ganze Wolke sichtbar im Takt statt organisch zu wirken.
          loopDelay: Math.random() * 1.2,
        };
      }),
    [count, spread, variant]
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={
            variant === "burst"
              ? {
                  x: p.x,
                  y: p.y,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.3],
                }
              : {
                  x: [0, p.driftX],
                  y: [0, p.y],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.4],
                }
          }
          transition={
            variant === "burst"
              ? {
                  delay,
                  duration: p.dur,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.2, 0.7, 1],
                }
              : {
                  delay: delay + p.loopDelay,
                  duration: 1.8 + p.dur,
                  ease: "easeOut",
                  times: [0, 0.15, 0.7, 1],
                  repeat: Infinity,
                  repeatDelay: 0.4 + Math.random() * 0.6,
                }
          }
        />
      ))}
    </div>
  );
}
