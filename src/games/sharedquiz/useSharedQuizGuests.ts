/**
 * Steuert die Weitergabe des Host-Handys in GETEILT GEQUIZZT (guest-roles.ts).
 *
 * - Trio: Zuerst sieht der eigene Platz seine Rolle, danach geht das Handy
 *   der Reihe nach verdeckt an jeden Gast mit Rolle. Wer gesehen hat, steht in
 *   `seen`; danach kann jede Rolle ueber `review(seat)` erneut aufgerufen werden.
 * - Kette / Alles-oder-nichts: Ist ein Gast mit Antworten dran, geht das
 *   Handy verdeckt an ihn — folgt direkt ein weiterer Gast, „Weiter an …“.
 *
 * Laeuft nur auf dem Geraet mit Gaesten (dem Host); sonst ist alles leer.
 */
import { useCallback, useEffect, useState } from "react";

import type { GuestHandover } from "../ui/useGuestHandover";
import { currentAnswerer, localRoleSeats, pendingTrioViews, type SharedMode } from "./guest-roles";

export interface SharedQuizGuests {
  /** Lokale Plaetze mit Rolle (eigener zuerst). */
  roleSeats: string[];
  seen: string[];
  markSeen: (seat: string) => void;
  /** Rolle erneut ansehen: eigener Platz sofort, Gast ueber Weitergabe. */
  review: (seat: string) => void;
}

export function useSharedQuizGuests(args: {
  handover: GuestHandover;
  active: boolean;
  mode: SharedMode;
  round: number;
  players: readonly { id: string }[];
  roleIndices: readonly number[];
  answered: number;
  localSeats: readonly string[];
  ownSeat: string | undefined;
}): SharedQuizGuests {
  const { handover, active, mode, round, players, roleIndices, answered, localSeats, ownSeat } = args;
  const [seen, setSeen] = useState<string[]>([]);
  const roleSeats = localRoleSeats(players, roleIndices, localSeats);

  // Neue Runde = neue Rollen: niemand hat sie schon gesehen.
  useEffect(() => { setSeen([]); }, [round]);

  const markSeen = useCallback((seat: string) => setSeen((s) => (s.includes(seat) ? s : [...s, seat])), []);

  // Trio: nach dem eigenen Platz die Gaeste der Reihe nach.
  const pendingKey = pendingTrioViews(roleSeats, seen).join(",");
  useEffect(() => {
    if (!active || mode !== "trio" || handover.state.status !== "idle") return;
    const pending = pendingKey ? pendingKey.split(",") : [];
    if (!pending.length || pending[0] === ownSeat) return;
    handover.request(pending.filter((seat) => handover.isGuest(seat)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, pendingKey, ownSeat, handover.state.status]);

  // Kette / Alles-oder-nichts: Gast ist mit Antworten dran.
  const answerer = active && mode !== "trio" ? currentAnswerer(players, roleIndices, answered) : null;
  useEffect(() => {
    if (!answerer || !handover.isGuest(answerer)) return;
    if (handover.activeGuest === answerer || handover.recipient === answerer) return;
    const st = handover.state;
    if (st.status === "idle" || (st.status === "return" && st.to === null)) handover.request([answerer]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerer, handover.state, handover.activeGuest, handover.recipient]);

  const review = useCallback((seat: string) => {
    if (handover.isGuest(seat)) handover.request([seat]);
  }, [handover]);

  return { roleSeats, seen, markSeen, review };
}
