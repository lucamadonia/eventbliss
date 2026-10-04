/**
 * SceneCountdown — 3-2-1-Los! aus der Szenenuhr (Masterplan T05, T-4).
 *
 * Die Ziffer wird aus `startsAt` (Serverzeit) und der gemeinsamen Uhr
 * GERECHNET, nicht mit setInterval gezaehlt: Alle Geraete zeigen dieselbe
 * Zahl, und wer spaet dazukommt, steigt bei der richtigen Ziffer ein.
 * Bewegungsarmut kappt nur Skalierung/Unschaerfe, nicht das Timing.
 */
import { useEffect, useReducer, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useHaptics } from "@/hooks/useHaptics";
import { partyMotion } from "@/lib/party-motion";
import { serverClock } from "@/games/party/scene-clock";
import { countdownState, type Scene, type SceneClock } from "@/games/party/scene-schedule";
import { useScene } from "@/games/party/useScene";

export type SceneCountdownProps = SceneCountdownBase &
  (
    /** Geplante Szene (planScene) — schreibt zusaetzlich den Trace-Eintrag (T-1…T-3). */
    | { scene: Scene; startsAt?: never }
    /** Nur Startzeit (Serverzeit, erste Ziffer) — ohne Trace. */
    | { startsAt: number; scene?: never }
  );

interface SceneCountdownBase {
  digits?: number;
  clock?: SceneClock;
  /** Einmal, wenn „Los!“ erreicht ist. */
  onGo?: () => void;
  className?: string;
}

export function SceneCountdown({ scene, startsAt: startsAtProp, digits = 3, clock = serverClock, onGo, className }: SceneCountdownProps) {
  // Szene durch useScene fuehren: Re-Render zum Start + genau ein Trace-Eintrag.
  useScene(scene ?? null, clock);
  const startsAt = scene ? scene.startsAt : startsAtProp!;
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduce = !!useReducedMotion();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const state = countdownState(startsAt, clock, digits);

  // Wer schon nach „Los!“ ankommt, sieht das Endbild ohne Animation.
  const arrivedAfterGo = useRef(state.phase === "go");
  const lastValue = useRef<number | null>(null);
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  useEffect(() => {
    if (state.phase === "go") return;
    const id = setTimeout(rerender, Math.max(16, state.msUntilNext + 5));
    return () => clearTimeout(id);
  });

  useEffect(() => {
    if (state.value === lastValue.current) return;
    lastValue.current = state.value;
    if (state.value === null) return;
    if (state.value === 0) {
      if (!arrivedAfterGo.current) haptics.success();
      onGoRef.current?.();
    } else {
      haptics.countdown();
    }
  }, [state.value, haptics]);

  if (state.phase === "pending") return null;
  const label = state.value === 0 ? t("handover.countdownGo", "Los!") : String(state.value);

  return (
    <div
      data-testid="scene-countdown"
      data-scene-id={scene?.sceneId}
      data-value={state.value ?? undefined}
      className={`pointer-events-none flex items-center justify-center ${className ?? ""}`}
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout" initial={!arrivedAfterGo.current}>
        <motion.span
          key={state.value}
          variants={partyMotion("countdownTick", reduce)}
          initial="initial"
          animate="animate"
          exit="exit"
          className="font-game text-[clamp(5rem,28vw,12rem)] font-black leading-none text-white tabular-nums"
          style={{ textShadow: "0 0 48px rgba(255,255,255,0.35)" }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default SceneCountdown;
