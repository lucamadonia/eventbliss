/**
 * useSplitGuests — fuehrt das Host-Handy durch SPLIT-QUIZ, wenn darauf
 * 🔁-Gaeste spielen (siehe guest-teams.ts). Gibt zurueck, wer das Handy gerade
 * haelt — gerendert wird nur, was dieser Platz sehen darf.
 *
 * Ohne Gaeste (Handy-Runde, lokales Spiel) ist der Halter immer der eigene
 * Platz; es aendert sich nichts.
 */
import { useEffect, useMemo } from "react";

import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { localActiveSeats } from "../ui/guest-handover";
import { useGuestHandover } from "../ui/useGuestHandover";
import { currentHolder, desiredHolder, handoverStep, teamOf } from "./guest-teams";

export function useSplitGuests(args: {
  online: OnlineGameProps | undefined;
  teams: [string[], string[]];
  activeTeam: number;
  phase: string;
}) {
  const { online, teams, activeTeam, phase } = args;
  // Geheim: Halten zum Bestaetigen, vor dem Weitergeben zudecken.
  const handover = useGuestHandover(online, { secret: true, clockPaused: true });
  const localSeats = useMemo(() => localActiveSeats(online), [online]);
  const me = online?.myPlayerId ?? "";
  const holder = currentHolder(handover.state, me);
  const desired = online?.isHost
    ? desiredHolder({ teams, activeTeam, phase, localSeats, myPlayerId: me, holder: holder ?? "" })
    : me;

  const hasGuests = handover.guests.length > 0;
  useEffect(() => {
    if (!online?.isHost || !hasGuests) return;
    const step = handoverStep(handover.state, desired, me);
    if (step === "done" || step === "done+request") handover.done();
    if (step === "request" || step === "done+request") handover.request([desired]);
  }, [online?.isHost, hasGuests, handover, desired, me]);

  return {
    handover,
    /** Wer das Handy haelt; `null` = unterwegs (nur der Weitergabe-Bildschirm). */
    holder,
    holderTeam: teamOf(teams, holder),
  };
}
