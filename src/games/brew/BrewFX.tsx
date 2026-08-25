/**
 * BrewFX — die Bewegungseffekte rund um GEBRAEU.
 *
 * Vier eigenstaendige Bauteile, die Glass.tsx und die TV-Ansicht als
 * Ueberzug einbetten: PourStream (Gießstrahl), Splash (Aufprall einer neuen
 * Schicht), TrayTip (der Bust-Moment) und FinishSparkle (fertiges Rezept).
 * Diese Datei kennt weder das Gefaess noch den Spielzustand — sie zeichnet
 * nur, was ihr per Prop gesagt wird. Platzierung uebernimmt die aufrufende
 * Stelle per `className` (z.B. `absolute` über dem Glasrand).
 *
 * ZWEI GROESSEN STATT ZWEI IMPLEMENTIERUNGEN: Jedes Bauteil zeichnet in
 * einem festen Referenzrahmen und skaliert ihn per CSS-`transform: scale()`
 * auf die gewuenschte Groesse (`size`-Prop). Das ist auf dem Fernseher mit
 * bis zu acht Glaesern nebeneinander wichtig — eine reine Transform-Skalierung
 * kostet den Compositor nichts, waehrend neu berechnete Pixelmasse pro Glas
 * das nicht taeten.
 *
 * BEWEGUNGSARMUT, ZWEIGETEILT (siehe motion.ts-Kopfkommentar):
 *   - `useReducedMotion()` fuer zweckgebundene Einzelbewegungen (Aufprall,
 *     Kippen, Funkeln) — genau EINMAL, nicht schleifend.
 *   - `useAmbientMotion()` ausschliesslich fuer die Dauerschleife des
 *     Gießstrahls (Schwanken + abspritzende Tropfen), solange gegossen wird.
 *     Diese Schleife ist auf dem Fernseher (nativ) und bei abgeschalteter
 *     Bewegung aus — der Strahl selbst bleibt trotzdem sichtbar, nur ruhig.
 *
 * Keine dieser Effekte ist alleiniger Traeger einer Information: Der
 * steigende Pegel steht in Glass.tsx, das leere Tablett und das fertige
 * Rezept im Spielzustand von BrewGame.tsx. Einzige Ausnahme ist TrayTip,
 * siehe dessen Kommentar.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { duration, ease } from "@/lib/motion";
import type { Skin } from "./brew-content";

// ── Hilfsfunktionen ──────────────────────────────────────────────────────

/**
 * "#rrggbb" -> "rgba(r,g,b,a)". Zutatenfarben in brew-content.ts sind opake
 * Hex-Werte, Glueh-Schatten und Farbverlaeufe brauchen aber Transparenz —
 * deshalb die Umwandlung hier statt an jeder Aufrufstelle neu.
 */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Feuert fuer `ms` Millisekunden `true`, sobald sich `trigger` aendert —
 * ausdruecklich NICHT beim ersten Rendern. Ohne die Sperre wuerden alle drei
 * Puls-Effekte schon beim Betreten des Spiels einmal abspielen, bevor
 * ueberhaupt eine Karte gezogen wurde.
 */
function useTriggerPulse(trigger: number, ms: number): boolean {
  const [on, setOn] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setOn(true);
    const id = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(id);
  }, [trigger, ms]);
  return on;
}

interface FxSkinProps {
  /** Zwei Gewaender: "brew" (Standard) leuchtet und steigt auf, "bar" ist nuechterner und faellt. */
  skin?: Skin;
  /** Groessenfaktor: 1 = Telefon-Referenzgroesse, kleiner fuer den Fernseher. */
  size?: number;
  className?: string;
}

// ── 1. PourStream ────────────────────────────────────────────────────────

const POUR_W = 40;
const POUR_H = 120;

/**
 * PourStream — der Strahl, der von oben ins Gefaess laeuft.
 *
 * Traegt selbst keine Information, die beim Abschalten von Bewegung
 * verlorenginge: Der eigentliche Pegel steht in Glass.tsx. Faellt der Strahl
 * unter Bewegungsarmut ruhig (kein Schwanken, keine Tropfen), sieht man den
 * Guss trotzdem — nur ohne die Reise dorthin.
 */
export function PourStream({
  color,
  active,
  skin = "brew",
  size = 1,
  className,
}: { color: string; active: boolean } & FxSkinProps) {
  const reduce = useReducedMotion();
  const ambient = useAmbientMotion();
  const rising = skin === "brew"; // Ein Trank steigt auf, ein Getraenk faellt.

  return (
    <div
      className={className}
      style={{ position: "relative", width: POUR_W * size, height: POUR_H * size, pointerEvents: "none" }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: POUR_W,
          height: POUR_H,
          transform: `scale(${size})`,
          transformOrigin: "top center",
        }}
      >
        <AnimatePresence>
          {active && (
            <motion.div
              key="stream"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
              animate={{
                opacity: 1,
                scaleY: 1,
                // Das leichte Schwanken ist eine Dauerschleife — deshalb an
                // `ambient` gebunden, NICHT an `reduce` allein (siehe Kopfkommentar).
                x: ambient ? [-2, 2, -2] : 0,
              }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.4 }}
              transition={
                reduce
                  ? { duration: duration.instant }
                  : {
                      opacity: { duration: duration.quick, ease: ease.out },
                      scaleY: { duration: duration.quick, ease: ease.out },
                      x: ambient ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0 },
                    }
              }
              style={{
                position: "absolute",
                left: POUR_W / 2 - 3,
                top: 0,
                width: 6,
                height: POUR_H,
                borderRadius: 3,
                transformOrigin: "top center",
                background: `linear-gradient(to bottom, ${withAlpha(color, 0)}, ${withAlpha(color, 0.9)} 14%, ${color})`,
                filter: skin === "brew" ? `drop-shadow(0 0 ${6 * size}px ${withAlpha(color, 0.7)})` : undefined,
              }}
            />
          )}
        </AnimatePresence>

        {/*
          Tropfen, die seitlich abspritzen. Nur in der Dauerschleife (ambient) —
          ein einzelner eingefrorener Tropfen sieht nach Grafikfehler aus,
          nicht nach Fluessigkeit, deshalb lieber ganz weglassen als still
          stehen lassen.
        */}
        {active &&
          ambient &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: (i - 1) * 10,
                y: rising ? [POUR_H * 0.5, POUR_H * 0.5 - 26] : [POUR_H * 0.5, POUR_H * 0.5 + 26],
              }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.24, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: POUR_W / 2 - 2,
                top: 0,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: color,
                boxShadow: skin === "brew" ? `0 0 6px ${withAlpha(color, 0.8)}` : undefined,
              }}
            />
          ))}
      </div>
    </div>
  );
}

// ── 2. Splash ────────────────────────────────────────────────────────────

const SPLASH_SIZE = 64;

/**
 * Splash — die kurze Krone, wenn eine neue Schicht auf der Oberflaeche
 * auftrifft. `trigger` ist ein Zaehler: jede Aenderung loest genau einen
 * Aufprall aus, auch wenn zwei Zutaten kurz hintereinander eingegossen
 * werden. Absichtlich unter 400ms — laenger wirkt klebrig statt kurz.
 *
 * Rein feierlich: Der Pegelsprung im Glas zeigt den Aufprall ohnehin, daher
 * bei Bewegungsarmut ganz weg (wie `BullseyeBurst` in
 * CloseEnoughAtmosphere.tsx es fuer denselben Fall vormacht).
 */
export function Splash({
  color,
  trigger,
  skin = "brew",
  size = 1,
  className,
}: { color: string; trigger: number } & FxSkinProps) {
  const reduce = useReducedMotion();
  const on = useTriggerPulse(trigger, 380);
  const glow = skin === "brew";

  if (reduce) return null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: SPLASH_SIZE * size, height: SPLASH_SIZE * size, pointerEvents: "none" }}
      aria-hidden
    >
      <div style={{ position: "absolute", inset: 0, transform: `scale(${size})`, transformOrigin: "center" }}>
        <AnimatePresence>
          {on && (
            <motion.div key="splash" style={{ position: "absolute", inset: 0 }}>
              {/* Die Ringwelle an der Oberflaeche. */}
              <motion.div
                initial={{ scaleX: 0.3, opacity: 0.9 }}
                animate={{ scaleX: 1.5, opacity: 0 }}
                transition={{ duration: 0.35, ease: ease.out }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 36,
                  height: 10,
                  marginLeft: -18,
                  marginTop: -5,
                  borderRadius: "50%",
                  border: `2px solid ${withAlpha(color, 0.8)}`,
                }}
              />
              {/* Die Zacken der Krone — fest verteilt, damit jeder Aufprall gleich aussieht. */}
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i / 5) * Math.PI - Math.PI / 2 + Math.PI / 10;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos(angle) * 16,
                      y: -Math.abs(Math.sin(angle) * 16) - 4,
                      scale: 1,
                    }}
                    transition={{ duration: 0.32, delay: i * 0.02, ease: ease.out }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: glow ? `0 0 8px ${withAlpha(color, 0.9)}` : undefined,
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── 3. TrayTip ───────────────────────────────────────────────────────────

const TRAY_W = 160;
const TRAY_H = 90;
/**
 * Deckt sich mit der laengsten Rezeptstufe (RECIPES_BY_LENGTH[7] in
 * brew-content.ts) — im echten Spiel wird hier nie etwas abgeschnitten,
 * die Grenze existiert nur als Schutz gegen falsch uebergebene Werte.
 */
const MAX_CARDS = 7;

/**
 * TrayTip — der Bust-Moment: das Tablett kippt, die Karten rutschen ab und
 * fallen aus dem Bild.
 *
 * Das ist die visuelle Erklaerung der wichtigsten Regel des Spiels: nur das
 * UNGESICHERTE geht verloren. Deshalb deutlich (~700ms), nicht beilaeufig —
 * und deshalb als EINZIGER der vier Effekte bei Bewegungsarmut nicht
 * stillschweigend weggelassen. Statt Kippen+Rutschen zeigt er dann einen
 * knappen Opacity-Sprung auf den Endzustand (Tablett leer), damit die Regel
 * auch ohne Bewegung ankommt.
 */
export function TrayTip({
  cards,
  trigger,
  skin = "brew",
  size = 1,
  className,
}: { cards: number; trigger: number } & FxSkinProps) {
  const reduce = useReducedMotion();
  const on = useTriggerPulse(trigger, reduce ? duration.instant * 1000 : 700);
  const count = Math.max(0, Math.min(cards, MAX_CARDS));
  const brew = skin === "brew";

  return (
    <div
      className={className}
      style={{ position: "relative", width: TRAY_W * size, height: TRAY_H * size, pointerEvents: "none" }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: TRAY_W,
          height: TRAY_H,
          transform: `scale(${size})`,
          transformOrigin: "top center",
        }}
      >
        <AnimatePresence>
          {on && (
            <motion.div key="tray" style={{ position: "absolute", inset: 0 }}>
              {/* Das Tablett selbst — kippt kurz und faengt sich wieder leer und gerade. */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={reduce ? { rotate: 0 } : { rotate: [0, -20, -20, 0] }}
                transition={reduce ? { duration: 0 } : { duration: 0.7, times: [0, 0.25, 0.75, 1], ease: ease.inOut }}
                style={{
                  position: "absolute",
                  left: TRAY_W / 2 - 55,
                  top: TRAY_H - 14,
                  width: 110,
                  height: 8,
                  borderRadius: 4,
                  transformOrigin: "50% 50%",
                  background: brew ? "rgba(180,140,255,0.5)" : "rgba(120,90,60,0.7)",
                  boxShadow: brew ? "0 0 14px rgba(180,140,255,0.5)" : "0 6px 12px rgba(0,0,0,0.4)",
                }}
              />
              {/* Die Karten — rutschen ab (brew: schwerelos auseinander, bar: geradewegs nach unten). */}
              {Array.from({ length: count }, (_, i) => {
                const spread = 100 / Math.max(1, count - 1 || 1);
                const startX = TRAY_W / 2 - 50 + i * spread;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, x: startX, y: TRAY_H - 30, rotate: 0 }}
                    animate={
                      reduce
                        ? { opacity: 0 }
                        : {
                            opacity: [1, 1, 0],
                            x: startX + (brew ? (i % 2 === 0 ? -30 : 30) : -40 - i * 4),
                            y: brew ? TRAY_H - 90 : TRAY_H + 50,
                            rotate: brew ? (i % 2 === 0 ? -50 : 50) : -70,
                          }
                    }
                    transition={
                      reduce
                        ? { duration: duration.instant }
                        : { duration: 0.55, delay: 0.15 + i * 0.035, ease: brew ? ease.out : ease.in }
                    }
                    style={{
                      position: "absolute",
                      width: 22,
                      height: 30,
                      borderRadius: 4,
                      background: brew
                        ? "linear-gradient(160deg, #caa8ff, #7a5cff)"
                        : "linear-gradient(160deg, #fff8ec, #e6d5b8)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── 4. FinishSparkle ─────────────────────────────────────────────────────

const SPARK_SIZE = 90;

/**
 * FinishSparkle — kurzes Funkeln ueber dem Gefaess, wenn ein Rezept fertig
 * ist. Rein feierlich, keine Information, die sonst verlorenginge — das
 * fertige Rezept steht laengst im Ergebnis. Deshalb bei Bewegungsarmut
 * komplett weg, wie `BullseyeBurst` es fuer denselben Fall vormacht.
 */
export function FinishSparkle({
  color,
  trigger,
  skin = "brew",
  size = 1,
  className,
}: { color: string; trigger: number } & FxSkinProps) {
  const reduce = useReducedMotion();
  const on = useTriggerPulse(trigger, 900);
  const glow = skin === "brew";

  if (reduce) return null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: SPARK_SIZE * size, height: SPARK_SIZE * size, pointerEvents: "none" }}
      aria-hidden
    >
      <div style={{ position: "absolute", inset: 0, transform: `scale(${size})`, transformOrigin: "center" }}>
        <AnimatePresence>
          {on && (
            <motion.div key="sparkle" style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const angle = (i / 7) * Math.PI * 2;
                const r = 22 + (i % 2) * 14;
                const baseY = Math.sin(angle) * r * 0.6;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.3, x: Math.cos(angle) * r, y: baseY }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.5], y: [baseY, baseY - 18] }}
                    transition={{ duration: 0.8, delay: i * 0.06, ease: ease.out }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.9)",
                      boxShadow: `0 0 ${glow ? 10 : 5}px ${withAlpha(color, 0.9)}`,
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
