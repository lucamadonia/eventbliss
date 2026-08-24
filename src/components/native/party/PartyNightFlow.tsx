/**
 * PartyNightFlow — schaltet den Uebergang zwischen zwei Playlist-Spielen.
 *
 * Warum diese Komponente im AEUSSEREN `GamesHub`-Rahmen haengt und nicht neben
 * dem laufenden Spiel: Alle Spiele verlassen sich am Ende mit einem schlichten
 * `navigate('/games')`. Damit verschwindet der ganze `/games/:gameId`-Teilbaum
 * genau in dem Augenblick, in dem der Uebergang erscheinen muesste. Der
 * aeussere Rahmen ueberlebt diesen Wechsel.
 *
 * Erkennung: `usePartySession` ist ein Modul-Store, also sieht diese
 * Komponente den Eintrag aus `reportGameResult` sofort — ohne dass irgendjemand
 * Zustand durchreichen muss.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePartySession } from "@/hooks/usePartySession";

import { PartyInterstitial } from "./PartyInterstitial";
import { useTVContext } from "@/contexts/TVBroadcastContext";
import { buildPartyNightState } from "@/games/party/standings";
import { playerFitFor } from "./setlist";
import { playableGames } from "@/lib/playable-games";
import { partyGameName } from "@/hooks/useTVGameBridge";
import { useTranslation } from "react-i18next";

/**
 * Was bereits gezeigt wurde — in `localStorage`, nicht in `sessionStorage`.
 *
 * Nach einem App-Kill soll NICHT der Uebergang aufpoppen, sondern der
 * Fortsetzen-Hinweis im Spiele-Tab. Ein Marker, der den Neustart ueberlebt,
 * haelt diese beiden Wege sauber getrennt.
 */
const SEEN_KEY = "eventbliss_party_interstitial_seen";

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen(token: string): void {
  try {
    localStorage.setItem(SEEN_KEY, token);
  } catch {
    // Speicher nicht verfuegbar — dann erscheint der Uebergang eben erneut.
  }
}

export function PartyNightFlow() {
  const navigate = useNavigate();
  const party = usePartySession();
  const tv = useTVContext();
  const { i18n } = useTranslation();
  const session = party.session;
  const [seenToken, setSeenToken] = useState<string | null>(readSeen);

  /**
   * Der Uebergang gehoert genau dann auf den Schirm, wenn das zuletzt
   * beendete Spiel DAS Spiel der laufenden Playlist war.
   *
   * Die Pruefung auf die Kennung ist der Unterschied zwischen "Spiel 4 von 8
   * ist durch" und einer Zwischenrunde, die jemand nebenbei ad hoc gestartet
   * hat — letztere darf die Playlist nicht weiterschieben.
   */
  const lastEntry =
    session && session.gameHistory.length > 0
      ? session.gameHistory[session.gameHistory.length - 1]
      : null;
  const currentPlaylistGame = session?.playlist[session.playlistIndex] ?? null;
  const finishedPlaylistGame =
    !!session &&
    session.playlistActive &&
    !!lastEntry &&
    !!currentPlaylistGame &&
    lastEntry.gameId === currentPlaylistGame;

  /** Kennzeichnet genau diesen Spielausgang; die Laenge der Historie zaehlt mit. */
  const token =
    session && finishedPlaylistGame
      ? `${session.id}:${session.playlistIndex}:${session.gameHistory.length}`
      : null;

  const open = token !== null && token !== seenToken;

  const markSeen = useCallback(() => {
    if (!token) return;
    writeSeen(token);
    setSeenToken(token);
  }, [token]);

  // Ein beendetes Playlist-Spiel ohne sichtbaren Uebergang (Spiel abgebrochen,
  // Seite neu geladen) darf den Marker nicht dauerhaft blockieren: Sobald sich
  // die Historie wieder aendert, entsteht ein neuer Token.
  useEffect(() => {
    if (!session) setSeenToken(null);
  }, [session]);

  const goToGame = useCallback(
    (gameId: string) => {
      party.startGame(gameId);
      // `?party=true` ist das Signal fuer GameBackTarget: Der Zurueck-Weg
      // fuehrt in die Party-Lobby, nicht in den Spiele-Hub.
      navigate(`/games/${gameId}?party=true`);
    },
    [party, navigate]
  );

  /**
   * Ueberspringt Eintraege, die zur aktuellen Runde nicht mehr passen.
   *
   * Die Set-Liste wird zu Beginn geplant, aber Leute kommen und gehen. Ohne
   * das hier liefe der Abend in ein Spiel, das mit der jetzigen Gruppengroesse
   * gar nicht startet. Bewusst UEBERSPRINGEN statt loeschen: Kommt die Person
   * zurueck, ist das Spiel wieder da.
   */
  const fits = useCallback(
    (gameId: string) => {
      const count = session?.players.length ?? 0;
      const game = playableGames.find((g) => g.id === gameId);
      return !game || playerFitFor(game, count) === "ok";
    },
    [session?.players.length]
  );

  const handleContinue = useCallback(
    (nextGameId: string) => {
      markSeen();
      // Der Rueckgabewert von `advancePlaylist` ist massgeblich — er kennt den
      // frisch geschriebenen Zustand, die uebergebene Kennung nur den alten.
      let next = party.advancePlaylist() ?? nextGameId;
      // Hoechstens so viele Schritte wie Eintraege — nie eine Endlosschleife,
      // auch wenn gar kein Spiel mehr passt.
      let guard = party.session?.playlist.length ?? 0;
      while (next && !fits(next) && guard-- > 0) {
        const after = party.advancePlaylist();
        if (!after) { navigate("/party?finale=1"); return; }
        next = after;
      }
      if (!next || !fits(next)) { navigate("/party?finale=1"); return; }
      goToGame(next);
    },
    [markSeen, party, goToGame, fits, navigate]
  );

  /** Letztes Spiel gespielt: Playlist schliessen und die Zeremonie oeffnen. */
  const handleFinish = useCallback(() => {
    markSeen();
    party.advancePlaylist();
    navigate("/party?finale=1");
  }, [markSeen, party, navigate]);

  /**
   * Den Zwischenstand bewusst auf den Fernseher holen.
   *
   * Zwischen zwei Spielen laeuft keine Spiel-Bruecke mehr — der Zustand muss
   * also von hier aus auf die Leitung. `phase: 'between'` loest drueben die
   * Nacht-Route aus.
   */
  const handleShowOnTv = useCallback(() => {
    if (!tv?.isActive || !session) return;
    const partyNight = buildPartyNightState(
      session,
      (id) => partyGameName(id, i18n.language),
      "between",
    );
    tv.broadcastTV("tv-state", {
      game: "lobby",
      phase: "idle",
      lang: i18n.language,
      players: partyNight.standings.map((p) => ({
        name: p.name, score: p.points, color: p.color, avatar: p.avatar,
      })),
      gameHistory: session.gameHistory,
      partyNight,
    });
  }, [tv, session, i18n.language]);

  const handlePause = useCallback(() => {
    markSeen();
    navigate("/party");
  }, [markSeen, navigate]);

  /** Das naechste Spiel ist inzwischen gesperrt — ueberspringen. */
  const handleSkipNext = useCallback(() => {
    markSeen();
    party.advancePlaylist();
    const after = party.advancePlaylist();
    if (after) goToGame(after);
    else navigate("/party?finale=1");
  }, [markSeen, party, goToGame, navigate]);

  if (!session || !open) return null;

  return (
    <PartyInterstitial
      open
      session={session}
      onContinue={handleContinue}
      onPause={handlePause}
      onFinish={handleFinish}
      onSkipNext={handleSkipNext}
      onShowOnTv={handleShowOnTv}
    />
  );
}
