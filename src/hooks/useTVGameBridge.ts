/**
 * useTVGameBridge — automatically broadcasts game state to the TV channel.
 *
 * Call this hook inside any game component. It reads game state from props
 * and forwards it to the TV via TVBroadcastContext.
 *
 * This is the bridge between offline games and the TV screen.
 * Games don't need to know about TV — they just play normally,
 * and this hook observes their state and broadcasts it.
 *
 * Usage inside a game:
 *   useTVGameBridge('taboo', { phase, round, players, timeLeft, ... });
 */
import { useEffect, useRef } from "react";
import { useTVContext } from "@/contexts/TVBroadcastContext";

export function useTVGameBridge(
  gameId: string,
  state: Record<string, unknown>,
  /** Only broadcast when these deps change (prevents spam) */
  deps: unknown[] = []
) {
  const tv = useTVContext();
  const prevStateRef = useRef<string>("");

  useEffect(() => {
    if (!tv?.isActive) return;

    // Serialize current state to detect actual changes
    const serialized = JSON.stringify(state);
    if (serialized === prevStateRef.current) return;
    prevStateRef.current = serialized;

    // Broadcast to TV
    tv.broadcastTV("tv-state", {
      game: gameId,
      ...state,
    });
  }, [tv, gameId, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast game-start when the game first enters a playing phase
  const startedRef = useRef(false);
  useEffect(() => {
    if (!tv?.isActive) return;
    const phase = state.phase as string | undefined;
    if (phase && phase !== "setup" && phase !== "lobby" && !startedRef.current) {
      startedRef.current = true;
      tv.broadcastTV("game-start", { game: gameId, ...state });
    }
  }, [tv, gameId, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast game-end when phase becomes gameOver/result/finished
  const endedRef = useRef(false);
  useEffect(() => {
    if (!tv?.isActive) return;
    const phase = state.phase as string | undefined;
    if (phase && ["gameOver", "result", "finished", "ended"].includes(phase) && !endedRef.current) {
      endedRef.current = true;
      tv.broadcastTV("game-end", { game: gameId, ...state });

      // Also broadcast leaderboard data if players with scores are available
      const players = state.players as { name: string; score: number; color: string }[] | undefined;
      if (players) {
        tv.broadcastTV("tv-leaderboard", {
          scores: players
            .map((p) => ({ name: p.name, score: p.score, color: p.color }))
            .sort((a, b) => b.score - a.score),
        });
      }
    }
  }, [tv, gameId, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return tv;
}
