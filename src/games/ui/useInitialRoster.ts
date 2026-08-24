import { useSyncExternalStore } from "react";
import { getOnlineRoomPlayers } from "@/games/multiplayer/useGameRoom";
import { getActivePartySession, subscribePartySession } from "@/hooks/usePartySession";

/**
 * useInitialRoster — woher ein Spiel seine Startbesetzung nimmt.
 *
 * Diese Reihenfolge steckte bisher nur inline in `GameSetup.tsx` und war in
 * neun weiteren Spielen von Hand kopiert. Die sechs Spiele mit eigenem
 * Setup-Bildschirm (ohrwurm, thisorthat, whoami, pantomime, closeenough,
 * pixeljagd) hatten sie GAR NICHT — dort blieben zwei Platzhalter stehen,
 * obwohl die Party nebenan acht Leute kannte. Genau das war der gemeldete
 * Fehler, und er trat bei jedem dieser Spiele auf, nicht nur bei den
 * gemeldeten.
 *
 * Rangfolge, absichtlich streng:
 *   1. `onlinePlayers` (Prop) — wir stecken in einem Online-Raum, der gewinnt.
 *   2. `getOnlineRoomPlayers()` — ein Raum ohne durchgereichte Prop.
 *   3. Die Party-Sitzung.
 * Unter der Mindestzahl zaehlt eine Quelle nicht: ein einzelner Party-Gast
 * ergibt keine Besetzung, und das Spiel soll dann seine eigenen Vorgaben
 * behalten statt eine halbe Liste zu erben.
 *
 * Ueber `useSyncExternalStore` an der Party-Sitzung: Wer waehrend des Setups
 * noch jemanden hinzufuegt, sieht das sofort. Das einmalige Lesen in
 * `GameSetup.tsx:79-90` verpasst genau diesen Fall.
 */

export interface RosterPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface InitialRosterOptions {
  /** Besetzung aus einem OnlineGameWrapper. Hat immer Vorrang. */
  onlinePlayers?: { id: string; name: string; color?: string; avatar?: string }[];
  /** Ab wie vielen Personen eine Quelle als Besetzung zaehlt. */
  min?: number;
}

const FALLBACK_COLOR = "#df8eff";

/** Im Prerender gibt es nie eine Party — stabile Funktion fuer den Store. */
function noSession() {
  return null;
}

function normalise(
  list: { id: string; name: string; color?: string; avatar?: string }[]
): RosterPlayer[] {
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color || FALLBACK_COLOR,
    avatar: p.avatar || p.name.charAt(0),
  }));
}

/**
 * Liefert die Startbesetzung, oder `undefined`, wenn keine Quelle genug
 * Personen hat — dann behaelt das Spiel seine eigenen Vorgaben.
 */
export function useInitialRoster(options: InitialRosterOptions = {}): RosterPlayer[] | undefined {
  const { onlinePlayers, min = 2 } = options;

  const session = useSyncExternalStore(subscribePartySession, getActivePartySession, noSession);

  if (onlinePlayers && onlinePlayers.length >= min) return normalise(onlinePlayers);

  const room = getOnlineRoomPlayers();
  if (room.length >= min) return normalise(room);

  if (session?.players && session.players.length >= min) return normalise(session.players);

  return undefined;
}
