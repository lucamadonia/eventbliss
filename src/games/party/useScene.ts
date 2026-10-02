/**
 * useScene — rendert eine geplante Szene genau zu ihrem `startsAt` neu.
 *
 * Getrennt von scene-schedule.ts, damit die reinen Helfer ohne React
 * importierbar bleiben (Host-Logik, Tests, TV).
 *
 * `elapsedMs` ist der Stand beim Rendern — gedacht zum Vorspulen einer
 * Einstiegsanimation, nicht als laufender Zaehler. Fuer Countdowns
 * `countdownState` / `remainingMs(deadline)` im eigenen Takt abfragen.
 *
 * Sobald die Szene sichtbar ist (erster Frame nach startsAt), schreibt der
 * Hook genau EINEN `scene`-Eintrag in `window.__partyPlayTrace` (party-trace.ts).
 */
import { useEffect, useReducer, useRef } from "react";

import { serverClock, type ServerClock } from "./scene-clock";
import { sceneLocalTime, sceneProgress, type Scene, type SceneClock, type SceneProgress } from "./scene-schedule";
import { partyTraceDevice, pushPartyTrace, wallClockNow, type PartyTraceDevice } from "./party-trace";

export interface UseSceneResult<T> extends SceneProgress {
  scene: Scene<T> | null;
  /** Szene kam erst nach ihrem Start an (Animation vorspulen). */
  late: boolean;
}

export interface UseSceneOptions {
  /** Geraet fuer den Trace; Standard: `setPartyTraceDevice`. */
  device?: PartyTraceDevice;
}

type SubscribableClock = SceneClock & Partial<Pick<ServerClock, "subscribe" | "offset">>;

export function useScene<T>(
  scene: Scene<T> | null | undefined,
  clock: SubscribableClock = serverClock,
  opts: UseSceneOptions = {},
): UseSceneResult<T> {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const startsAt = scene?.startsAt;
  const sceneId = scene?.sceneId;

  // Erster Blick auf eine Szene: lief sie da schon? → late.
  const seen = useRef<{ id: string; late: boolean } | null>(null);
  const traced = useRef<string | null>(null);
  const progress = scene ? sceneProgress(scene, clock) : null;
  if (scene && seen.current?.id !== scene.sceneId) {
    seen.current = { id: scene.sceneId, late: progress!.phase === "running" && progress!.elapsedMs > 0 };
  }
  const late = !!scene && seen.current?.id === scene.sceneId && seen.current.late;

  // Neuer Uhrabgleich verschiebt den lokalen Startzeitpunkt → neu planen.
  useEffect(() => clock.subscribe?.(rerender), [clock]);

  useEffect(() => {
    if (startsAt === undefined) return;
    const wait = sceneLocalTime(startsAt, clock) - Date.now();
    if (wait <= 0) return;
    const id = setTimeout(rerender, wait);
    return () => clearTimeout(id);
  });

  const running = progress?.phase === "running";
  const device = opts.device;
  useEffect(() => {
    if (!scene || !running || traced.current === scene.sceneId) return;
    traced.current = scene.sceneId;
    const entry = { sceneId: scene.sceneId, scene: scene.scene, startsAt: scene.startsAt, late };
    const push = () =>
      pushPartyTrace({
        kind: "scene",
        ...entry,
        device: device ?? partyTraceDevice(),
        shownAt: wallClockNow(),
        localNow: Date.now(),
        offsetMs: clock.offset?.() ?? clock.now() - Date.now(),
      });
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(push);
    else push();
    // Nur einmal pro Szene, sobald sie laeuft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, running]);

  if (!scene || !progress) return { scene: null, phase: "pending", msUntilStart: 0, elapsedMs: 0, late: false };
  return { scene, ...progress, late };
}
