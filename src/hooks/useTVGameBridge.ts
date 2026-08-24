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
 *
 * Seit dem Party-Modus meldet dieselbe Bruecke das Spielende ausserdem an die
 * laufende Party-Sitzung. Das passiert in einem EIGENEN Effekt, der bewusst
 * NICHT an `tv.isActive` haengt: Eine Party wird meistens ohne Fernseher
 * gespielt, und ohne diese Meldung wuerde nie ein Spiel gewertet.
 */
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import i18n from "i18next";
import { useTVContext } from "@/contexts/TVBroadcastContext";
import { extractGameResult, resolvePartyGameId } from "@/games/party/extractResult";
import { buildPartyNightState } from "@/games/party/standings";
import { getTvView, subscribeTvView, tvViewServerSnapshot } from "@/games/tv/tv-view";
import {
  getActivePartySession,
  reportGameResult,
  subscribePartySession,
} from "@/hooks/usePartySession";
import { playableGames } from "@/lib/playable-games";
import type { PartyNightState } from "@/games/tv/party-types";

/**
 * Endphasen aus Sicht der Party.
 *
 * Absichtlich eine eigene Liste, nicht die der TV-Uebertragung: HOCHSTAPLER
 * (`impostor`) endet in `'results'` — nachgeprueft in ImpostorGame.tsx, wo
 * `playAgain()` aus genau dieser Phase eine neue Runde startet und der eigene
 * Statistik-Eintrag `recordEnd('hochstapler', …)` dort ausgeloest wird. Diese
 * Phase hier zu ergaenzen darf das bestehende TV-Verhalten nicht veraendern,
 * darum bleiben beide Listen getrennt.
 */
const PARTY_END_PHASES = new Set(["gameOver", "result", "results", "finished", "ended"]);

/** Prerender/SSR sieht nie eine Party — stabile Funktion fuer den Store. */
const emptyPartySession = () => null;

/**
 * Angezeigter Spielname aus der Registry; Rueckfall ist die Kennung selbst.
 *
 * `lng` wird ausdruecklich mitgegeben, damit ein Sprachwechsel die Namen auf
 * dem Fernseher neu uebersetzt statt die zwischengespeicherten zu behalten.
 */
export function partyGameName(gameId: string, lng?: string): string {
  const game = playableGames.find((g) => g.id === gameId);
  if (!game) return gameId;
  const translated = i18n.t(game.nameKey, { lng });
  return typeof translated === "string" && translated.length > 0 && translated !== game.nameKey
    ? translated
    : gameId;
}

export function useTVGameBridge(
  gameId: string,
  state: Record<string, unknown>,
  /** Only broadcast when these deps change (prevents spam) */
  deps: unknown[] = []
) {
  const tv = useTVContext();
  const prevStateRef = useRef<string>("");
  const prevPartyRef = useRef<string>("");

  // ── Party-Night-Block fuer die laufende tv-state-Uebertragung ─────
  // Die Sitzung wird abonniert statt bei jedem Render gelesen: Ihr Objekt ist
  // referenziell stabil, solange sich nichts aendert, also laeuft die Ableitung
  // NUR wenn wirklich ein Spiel zu Ende ist — nicht bei jedem Sekundentakt der
  // Spieluhr, der die Bruecke sonst mehrmals pro Sekunde beschaeftigen wuerde.
  const partySession = useSyncExternalStore(
    subscribePartySession,
    getActivePartySession,
    emptyPartySession
  );
  const language = i18n.language;
  const nameFor = useMemo(() => (id: string) => partyGameName(id, language), [language]);
  /**
   * Die vom Gastgeber gewaehlte Erlebnis-Ansicht reist in JEDEM Broadcast mit.
   * Ohne das haette der naechste Spielzustand sie nach Millisekunden wieder
   * auf 'ingame' zurueckgesetzt — ein "zeig die Rangliste" mitten im Spiel
   * waere nie sichtbar geworden.
   */
  const tvView = useSyncExternalStore(subscribeTvView, getTvView, tvViewServerSnapshot);
  const partyNight = useMemo<PartyNightState | null>(
    () => (partySession ? buildPartyNightState(partySession, nameFor, tvView) : null),
    [partySession, nameFor, tvView]
  );
  // Vorberechnete Signatur: haelt den Vergleich unten billig und stabil.
  const partyNightJson = useMemo(
    () => (partyNight ? JSON.stringify(partyNight) : ""),
    [partyNight]
  );

  useEffect(() => {
    if (!tv?.isActive) return;

    // Serialize current state to detect actual changes
    const serialized = JSON.stringify(state);
    // Ohne Party ist `partyNightJson` immer "" — dann ist diese Bedingung
    // Zeichen fuer Zeichen die alte, und der Fernseher verhaelt sich identisch.
    if (serialized === prevStateRef.current && partyNightJson === prevPartyRef.current) return;
    prevStateRef.current = serialized;
    prevPartyRef.current = partyNightJson;

    // Broadcast to TV
    tv.broadcastTV("tv-state", {
      game: gameId,
      // Die Sprache des TELEFONS. Der Fernseher ist ein fremdes Geraet und
      // wuerde sonst seine eigene Browsersprache nehmen — bei einem deutschen
      // Fernseher also Deutsch, egal was der Gastgeber eingestellt hat.
      lang: i18n.language,
      ...state,
      // Fehlt die Party, fehlt auch der Schluessel — der Vertrag sieht ein
      // `tv-state` ohne `partyNight` ausdruecklich als unveraendert vor.
      ...(partyNight ? { partyNight } : {}),
    });
  }, [tv, gameId, partyNightJson, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast game-start when the game first enters a playing phase.
  // Both refs reset when the game returns to setup/lobby ("Play again"
  // restarts in-place, so start/end must be able to fire once per run).
  const startedRef = useRef(false);
  const endedRef = useRef(false);
  useEffect(() => {
    if (!tv?.isActive) return;
    const phase = state.phase as string | undefined;
    if (phase === "setup" || phase === "lobby") {
      startedRef.current = false;
      endedRef.current = false;
      return;
    }
    if (phase && !startedRef.current) {
      startedRef.current = true;
      endedRef.current = false;
      tv.broadcastTV("game-start", { game: gameId, ...state });
    }
  }, [tv, gameId, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast game-end when phase becomes gameOver/result/finished
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

  // ── Party-Wertung (unabhaengig vom Fernseher) ─────────────────────
  // Die Route `/games/:gameId` traegt die Registry-Kennung; die Kennung, die
  // ein Spiel an diese Bruecke gibt, weicht bei 13 Spielen davon ab. Die Route
  // gewinnt, die Bruecken-Kennung ist nur der Rueckfall.
  const { gameId: routeGameId } = useParams();
  const partyEndedRef = useRef(false);

  useEffect(() => {
    const phase = state.phase as string | undefined;
    if (!phase) return;

    // Zuruecksetzen, sobald das Spiel die Endphase verlaesst. Das deckt auch
    // Rematches ab, die gar nicht ueber `setup` laufen (HOCHSTAPLER springt
    // von `results` direkt nach `wordReveal`).
    if (!PARTY_END_PHASES.has(phase)) {
      partyEndedRef.current = false;
      return;
    }
    if (partyEndedRef.current) return;
    partyEndedRef.current = true;

    if (!getActivePartySession()) return;

    const partyGameId = resolvePartyGameId(routeGameId, gameId);
    const result = extractGameResult(partyGameId, state);
    reportGameResult({
      gameId: partyGameId,
      gameName: partyGameName(partyGameId),
      scored: result.scored,
      scoresByName: result.scores,
    });
  }, [gameId, routeGameId, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return tv;
}
