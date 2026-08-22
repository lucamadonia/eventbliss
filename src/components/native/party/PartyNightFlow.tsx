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

  const handleContinue = useCallback(
    (nextGameId: string) => {
      markSeen();
      // Der Rueckgabewert von `advancePlaylist` ist massgeblich — er kennt den
      // frisch geschriebenen Zustand, die uebergebene Kennung nur den alten.
      const next = party.advancePlaylist() ?? nextGameId;
      goToGame(next);
    },
    [markSeen, party, goToGame]
  );

  /** Letztes Spiel gespielt: Playlist schliessen und die Zeremonie oeffnen. */
  const handleFinish = useCallback(() => {
    markSeen();
    party.advancePlaylist();
    navigate("/party?finale=1");
  }, [markSeen, party, navigate]);

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
    />
  );
}
