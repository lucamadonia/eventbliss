/**
 * SplashExperience — animated JS splash that seamlessly takes over from the
 * native Capacitor splash PNG, then hands off to the app.
 *
 * CRITICAL: This component's background MUST be #1a1625 (matching native
 * splash PNG) — any drift causes a visible flash during handoff.
 *
 * "Die Nacht beginnt" — dieselbe Bildsprache wie die Nacht-Route der App
 * (src/games/tv/components/TVPartyMap.tsx): eine Lichtspur zieht aus der
 * Tiefe heran, das Logo entzuendet sich daraus, der Schriftzug setzt sich,
 * Funken loesen sich und steigen auf, dann loest sich alles nach oben auf.
 *
 * Takt (siehe splashBeats in src/lib/motion.ts — EINE Quelle fuer Bild UND
 * Haptik, damit sich beides nie auseinanderlaufen kann):
 *   0ms:     mount (native splash noch sichtbar dahinter)
 *   50ms:    SplashScreen.hide() — nativer Splash blendet aus (250ms)
 *   180ms:   approach — Lichtspur zieht heran, Logo noch fern & dunkel
 *   620ms:   impact — Logo zuendet, GROSS (65% Bildbreite), Bloom faechert auf
 *   1040ms:  wordmark — "EventBliss" setzt sich
 *   1180ms:  sparks — Funken loesen sich, steigen auf
 *   1880ms:  dissolve — alles loest sich nach oben auf
 *   2300ms:  onComplete()
 *
 * Bewegungsarmut: siehe Kopfkommentar von `entrance`/`entranceReduced` in
 * motion.ts. Bei reduzierter Bewegung zeigt dieselbe Komponente sofort den
 * Endzustand (Logo gross, Schriftzug da, Hintergrund-Kunst statisch) — kein
 * zweitklassiges Erlebnis, ein stilles. onComplete feuert dafuer frueher,
 * aber genauso verlaesslich.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SplashScreen } from "@capacitor/splash-screen";
import { useHaptics } from "@/hooks/useHaptics";
import { isNative } from "@/lib/platform";
import { ease, entrance, splashBeats } from "@/lib/motion";
import eventBlissLogo from "@/assets/eventbliss-logo.png";
import { LogoParticles } from "./LogoParticles";
import { useTranslation } from "react-i18next";

interface Props {
  onComplete: () => void;
}

// Match splash bg to theme (avoids flash on handoff)
function getSplashBg(): string {
  const cls = document.documentElement.classList;
  if (cls.contains("rose")) return "#faf5f0"; // warm cream
  if (cls.contains("light") || (!cls.contains("dark") && window.matchMedia("(prefers-color-scheme: light)").matches)) return "#fafafa";
  return "#1a1625"; // dark default
}

// Dieselben Akzente wie die Nacht-Route (tv-tokens.ts ACCENT) — hier
// dupliziert statt importiert, siehe Begruendung in LogoParticles.tsx.
const ACCENT = ["#df8eff", "#ff6b98", "#f9ca24"];

// Parallax-Landschaft der Nacht-Route — optional. Fehlt eine Ebene (Bilder
// werden separat erzeugt), traegt der Verlauf darunter die Szene allein.
const LAYERS = [
  { src: "/images/splash/splash-far.webp", opacity: 0.7, fromScale: 1.12 },
  { src: "/images/splash/splash-mid.webp", opacity: 0.85, fromScale: 1.22 },
  { src: "/images/splash/splash-near.webp", opacity: 1, fromScale: 1.34 },
];

/** Laedt ein Bild leise vor; meldet nie einen Fehler nach aussen. */
function useOptionalImage(src: string): boolean {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setLoaded(true); };
    img.onerror = () => { if (!cancelled) setLoaded(false); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return loaded;
}

/**
 * Drei Stationen statt vieler `times`-Arrays: `entrance.approach/impact/
 * bloom/dissolve` sind Federn bzw. Tweens fuer je EINEN Uebergang zwischen
 * zwei Zustaenden — Federn kennen kein `times`-Array (siehe framer-motion-
 * Doku: "times... only works with duration-based animations"). Ein
 * Phasen-State ist darum der richtige Bauplan, nicht eine einzige
 * Keyframe-Kette mit hart berechneten Zeit-Anteilen.
 */
type Phase = "pre" | "ignite" | "dissolve";

export function SplashExperience({ onComplete }: Props) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const splashBg = getSplashBg();

  // `useReducedMotion()` liefert beim allerersten Render `null` (SSR-sicher)
  // und loest sich erst per Effekt auf — genau in diesem einen Frame wuerde
  // sonst kurz die volle Choreografie aufblitzen, obwohl der Nutzer
  // Bewegungsarmut eingestellt hat. Der Ref liest dieselbe Media Query
  // synchron beim Mount, damit ab dem ersten Frame der richtige Zweig steht.
  const initialReducedRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const liveReducedMotion = useReducedMotion();
  const reducedMotion = liveReducedMotion ?? initialReducedRef.current;

  const [phase, setPhase] = useState<Phase>(() => (reducedMotion ? "ignite" : "pre"));
  const [wordmarkIn, setWordmarkIn] = useState(() => reducedMotion);
  const [sparksOn, setSparksOn] = useState(false);

  // Hooks sind unbedingt (kein Array.map mit useState!), darum drei feste
  // Aufrufe statt einer Schleife ueber LAYERS.
  const farLoaded = useOptionalImage(LAYERS[0].src);
  const midLoaded = useOptionalImage(LAYERS[1].src);
  const nearLoaded = useOptionalImage(LAYERS[2].src);
  const layerLoaded = [farLoaded, midLoaded, nearLoaded];

  useEffect(() => {
    // Hide native splash immediately so JS owns the screen
    if (isNative()) {
      // Let the first paint land, then hide with a soft crossfade
      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
      });
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reducedMotion) {
      // Ein einzelner Impuls statt einer Choreografie — Bewegungsarmut heisst
      // "keine Reise", nicht "keine Rueckmeldung ueberhaupt". Phase und
      // Schriftzug stehen bereits ab dem ersten Render im Endzustand (siehe
      // die lazy useState-Initializer oben) — hier bleibt nur die Haptik.
      timers.push(setTimeout(() => haptics.medium(), 100));
      timers.push(setTimeout(onComplete, 900));
    } else {
      // Leicht beim Heranziehen, mittel beim Einschlag, feines Nachbeben beim
      // Aufblühen — dieselben drei Momente, die auch das Bild markiert.
      timers.push(setTimeout(() => haptics.light(), splashBeats.approach));
      timers.push(setTimeout(() => { setPhase("ignite"); haptics.medium(); }, splashBeats.impact));
      timers.push(setTimeout(() => haptics.light(), splashBeats.impact + 160));
      timers.push(setTimeout(() => setWordmarkIn(true), splashBeats.wordmark));
      timers.push(setTimeout(() => setSparksOn(true), splashBeats.sparks));
      timers.push(setTimeout(() => setPhase("dissolve"), splashBeats.dissolve));
      timers.push(setTimeout(onComplete, splashBeats.done));
    }

    return () => timers.forEach(clearTimeout);
  }, [haptics, onComplete, reducedMotion]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: splashBg }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3, ease: ease.out } }}
      >
        {/* ── Landschaft der Nacht-Route ─────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grundverlauf — traegt die Szene, auch wenn kein Bild laedt. */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, rgba(223,142,255,0.22) 0%, rgba(255,107,152,0.12) 38%, transparent 68%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reducedMotion ? { duration: 0.2 } : entrance.approach}
          />

          {/* Parallax-Ebenen — jede optional, jede fuer sich stumm bei Fehler.
              Zieht direkt beim Mount in ihre Endgroesse, damit die Landschaft
              im selben Atemzug heranzieht wie die Lichtspur davor. */}
          {LAYERS.map((layer, i) => (
            layerLoaded[i] && (
              <motion.div
                key={layer.src}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${layer.src})`, opacity: layer.opacity }}
                initial={reducedMotion ? { scale: 1, opacity: 0 } : { scale: layer.fromScale, opacity: 0 }}
                animate={{ scale: 1, opacity: layer.opacity }}
                transition={
                  reducedMotion
                    ? { duration: 0.2 }
                    : { ...entrance.approach, delay: i * 0.03 }
                }
              />
            )
          ))}
        </div>

        {/* ── Lichtspur, die aus der Tiefe heranzieht ────────────────── */}
        {/* Nur in der vollen Choreografie: bei Bewegungsarmut gibt es keine
            Reise, also auch keine Spur, die sie zeichnen koennte. Sie zieht
            beim Mount heran (`approach`) und zerfliesst beim Einschlag in
            den Bloom (`bloom`) — danach uebernimmt das Logo selbst. */}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "70vmin",
              height: "70vmin",
              background: `radial-gradient(circle, ${ACCENT[0]} 0%, ${ACCENT[1]} 45%, transparent 72%)`,
              filter: "blur(40px)",
            }}
            initial={{ scale: 0.05, opacity: 0 }}
            animate={phase === "pre" ? { scale: 0.85, opacity: 0.85 } : { scale: 1.6, opacity: 0 }}
            transition={phase === "pre" ? entrance.approach : entrance.bloom}
          />
        )}

        {/* ── Das Logo — Ort des Einschlags ──────────────────────────── */}
        <motion.div
          className="relative flex flex-col items-center gap-6 z-10"
          initial={{ opacity: reducedMotion ? 0 : 1, scale: 1, y: 0 }}
          animate={
            phase === "dissolve"
              ? { opacity: 0, scale: 1.06, y: -30 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={reducedMotion ? { duration: 0.2 } : entrance.dissolve}
        >
          <div className="relative">
            {/* Mehrlagiger Bloom hinter dem Logo — kein drop-shadow, weil ein
                einzelner Schatten bei 65% Bildbreite duenn wirkt. Drei
                Farbringe in den Akzenten der Nacht-Route stapeln sich zu
                einem echten Gluehen, faechern beim Einschlag auf (`bloom`)
                und loesen sich mit dem Rest auf (`dissolve`). */}
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                aria-hidden
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${ACCENT[ring]}55 0%, transparent 70%)`,
                  filter: `blur(${28 + ring * 18}px)`,
                  transform: `scale(${1.4 + ring * 0.35})`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "pre" ? 0 : phase === "dissolve" ? 0 : 0.85 - ring * 0.15 }}
                transition={
                  reducedMotion
                    ? { duration: 0.2 }
                    : phase === "dissolve"
                      ? entrance.dissolve
                      : { ...entrance.bloom, delay: ring * 0.05 }
                }
              />
            ))}

            {/* Logo-Bild: entsteht fern & dunkel, zuendet beim Einschlag GROSS
                — der harte, kurze `impact`-Spring liefert das Ueberschwingen
                von selbst, keine manuellen Overshoot-Keyframes noetig. */}
            <motion.img
              src={eventBlissLogo}
              alt="EventBliss"
              className="relative object-contain"
              style={{ width: "min(65vw, 320px)", height: "min(65vw, 320px)" }}
              /* `entranceReduced.initial` ist als `Variant` typisiert und darf auch
                 eine Funktion sein — `initial` nimmt das nicht. Derselbe Wert,
                 nur direkt hingeschrieben. */
              initial={reducedMotion ? { opacity: 0 } : { scale: 0.3, opacity: 0.12 }}
              animate={
                phase === "pre"
                  ? { scale: 0.3, opacity: 0.12 }
                  : phase === "dissolve"
                    ? { scale: 1.12, opacity: 0 }
                    : { scale: 1, opacity: 1 }
              }
              transition={
                reducedMotion
                  ? { duration: 0.2 }
                  : phase === "ignite"
                    ? entrance.impact
                    : entrance.dissolve
              }
            />

            {/* Einschlagsfunke — ein Burst genau beim Zuenden (Mount-Gate,
                nicht die Phase selbst: erst ab "ignite" gerendert). */}
            {!reducedMotion && phase !== "pre" && <LogoParticles spread={170} variant="burst" />}
            {/* Geloeste Funken — ab "sparks" bis zur Aufloesung auf. */}
            {!reducedMotion && sparksOn && <LogoParticles spread={90} count={14} variant="rise" />}
          </div>

          {/* Schriftzug — setzt sich mit einem kleinen Einrasten (`bloom`),
              nicht nur einem Fade, damit er wie eine Landung wirkt statt wie
              ein Blenden; loest sich mit `dissolve` wieder auf. */}
          <motion.div
            className="text-center"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
            animate={
              phase === "dissolve"
                ? { opacity: 0, y: -24, scale: 1 }
                : wordmarkIn
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 18, scale: 0.94 }
            }
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : phase === "dissolve"
                  ? entrance.dissolve
                  : entrance.bloom
            }
          >
            <p className="text-3xl font-display font-semibold text-foreground tracking-tight">
              EventBliss
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-body">
              {t('native.splash.tagline')}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
