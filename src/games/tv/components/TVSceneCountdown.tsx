import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SceneCountdown } from '@/games/ui/SceneCountdown';
import { serverClock } from '@/games/party/scene-clock';
import { countdownState, type Scene } from '@/games/party/scene-schedule';

/** Wie lange „Los!“ nach dem Countdown stehen bleibt, bevor das Spielbild frei wird. */
const GO_HOLD_MS = 900;
const DIGITS = 3;

/** Prueft eine Szene von der Leitung (tv-state / game-start). */
export function parseWireScene(value: unknown): Scene | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.sceneId !== 'string' || !raw.sceneId || raw.sceneId.length > 128) return null;
  if (typeof raw.scene !== 'string' || !raw.scene) return null;
  if (typeof raw.startsAt !== 'number' || !Number.isFinite(raw.startsAt)) return null;
  return { sceneId: raw.sceneId, scene: raw.scene, startsAt: raw.startsAt, ...(raw.data !== undefined ? { data: raw.data } : {}) };
}

/**
 * 3-2-1-Los! auf dem Fernseher (T05) — dieselbe Szene, dieselbe `startsAt`
 * wie Host und Handys, also derselbe Moment. `SceneCountdown` schreibt den
 * Trace-Eintrag mit derselben `sceneId` (Timing-Tests T-1…T-3).
 *
 * Die Szene wird hier festgehalten: Der naechste Spielzustand traegt sie nicht
 * mehr, der Countdown soll trotzdem bis „Los!“ durchlaufen.
 */
export default function TVSceneCountdown({ scene: incoming }: { scene: Scene | null }) {
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (!incoming || incoming.scene !== 'game-start') return;
    setScene((current) => (current?.sceneId === incoming.sceneId ? current : incoming));
  }, [incoming]);

  // Nach „Los!“ + kurzer Haltezeit wieder abbauen (in lokaler Zeit gerechnet).
  useEffect(() => {
    if (!scene) return;
    const endLocal = serverClock.toLocal(scene.startsAt + DIGITS * 1000 + GO_HOLD_MS);
    const id = window.setTimeout(() => setScene(null), Math.max(0, endLocal - Date.now()));
    return () => window.clearTimeout(id);
  }, [scene]);

  // Dieselbe Ziffer wie auf den Handys, auch am Huellelement (T-4 tastet alle 150 ms ab).
  const [digit, setDigit] = useState<number | null>(null);
  useEffect(() => {
    if (!scene) { setDigit(null); return; }
    const tick = () => setDigit(countdownState(scene.startsAt, serverClock, DIGITS).value);
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [scene]);

  return (
    <AnimatePresence>
      {scene && (
        <motion.div
          key={scene.sceneId}
          data-testid="tv-scene-countdown"
          data-scene-id={scene.sceneId}
          data-value={digit ?? undefined}
          className="fixed inset-0 z-[180] grid place-items-center bg-[#060810]/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <SceneCountdown scene={scene} digits={DIGITS} className="[&>span]:!text-[min(40vh,22vw)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
