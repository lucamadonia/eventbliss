/**
 * usePartyResume — gibt es eine unterbrochene Set-Liste?
 *
 * Bewusst eine eigene Datei: Sichtbarkeit UND Ausblenden liegen hier, damit
 * der Einhaengeort mit demselben Wert zwischen Fortsetzen-Hinweis und seinem
 * Standard-Knopf umschaltet. Laege der Zustand in der Komponente, entstuende
 * beim Ausblenden ein Loch statt der Rueckkehr zum Standard-Knopf.
 */
import { useCallback, useState } from "react";

import { usePartySession } from "@/hooks/usePartySession";

const DISMISS_KEY = "eventbliss_party_resume_dismissed";

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(token: string): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, token);
  } catch {
    // Speicher nicht verfuegbar — der Hinweis bleibt eben sichtbar.
  }
}

export interface PartyResumeState {
  /** true = den Fortsetzen-Hinweis statt des Standard-Knopfs zeigen. */
  visible: boolean;
  /** Das faellige Spiel; `null`, solange nichts fortzusetzen ist. */
  gameId: string | null;
  dismiss: () => void;
}

/**
 * Gibt es eine unterbrochene Set-Liste?
 *
 * An GENAU EINER Stelle aufrufen — dort, wo der Hinweis auch gerendert wird.
 * Der Ausblend-Zustand lebt in diesem Hook; zwei Aufrufer haetten zwei
 * getrennte Zustaende.
 */
export function usePartyResumeState(): PartyResumeState {
  const { session } = usePartySession();
  const [dismissedToken, setDismissedToken] = useState<string | null>(readDismissed);

  const token = session ? `${session.id}:${session.playlistIndex}` : null;
  const gameId =
    session && session.playlistActive ? session.playlist[session.playlistIndex] ?? null : null;

  const dismiss = useCallback(() => {
    if (!token) return;
    writeDismissed(token);
    setDismissedToken(token);
  }, [token]);

  return {
    visible: gameId !== null && token !== null && token !== dismissedToken,
    gameId,
    dismiss,
  };
}
