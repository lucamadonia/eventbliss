/**
 * useHeadUpParty — Party-Play-Schicht fuer HEAD UP: Weitergabe des Host-Handys
 * an 🔁-Gaeste, gemeinsamer Phasenwechsel und TV-Zusatzdaten. Ohne `online`
 * (lokales Spiel) ist alles neutral: kein Weitergeben, kein Vorlauf, keine Sperre.
 */
import { useMemo, useState } from "react";
import { Smartphone } from "lucide-react";

import { playerGlow } from "@/lib/party-motion";
import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { useSeatHandover } from "../multiplayer/useGuestHandover";
import { localActiveSeats } from "../ui/guest-handover";
import { serverClock } from "../party/scene-clock";
import { planPhaseStart } from "../party/phase-gate";
import { usePhaseGate } from "../party/usePhaseGate";
import {
  actorControls, headUpActiveSeat, headUpInputDelayMs, headUpPhaseLeadMs, headUpTvSeats, isLocalActor, type HeadUpScreen,
} from "./party-play";

export function useHeadUpParty(online: OnlineGameProps | undefined, screen: HeadUpScreen, currentRound: number, actorId: string | false, order: string[]) {
  const seats = useMemo(() => (online ? localActiveSeats(online) : null), [online]);
  const localActor = isLocalActor(seats, actorId);
  const handover = useSeatHandover(online, headUpActiveSeat(!!online, screen, actorId));
  const controls = actorControls({
    online: !!online, myPlayerId: online?.myPlayerId, actorId, localActor,
    handoverIdle: handover.state.status === "idle", activeGuest: handover.activeGuest,
  });

  // Gemeinsamer Start jeder Phase (Serverzeit): der Host plant, Handys bekommen
  // ihn im Snapshot, der TV ueber die Bridge.
  const [remotePhaseStartsAt, setRemotePhaseStartsAt] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const planned = useMemo(() => (online ? planPhaseStart(serverClock, headUpPhaseLeadMs(screen)) : serverClock.now()), [screen, currentRound]);
  const phaseStartsAt = online && !online.isHost ? remotePhaseStartsAt : planned;
  const gate = usePhaseGate(screen, online ? phaseStartsAt : null, { inputDelayMs: headUpInputDelayMs(screen) });

  const actorSeat = online && typeof actorId === "string" ? online.players.find((p) => p.id === actorId) : undefined;
  const tvSeats = useMemo(() => (online ? headUpTvSeats(order, online.players) : []), [online, order]);
  return { handover, localActor, controls, phaseStartsAt, setRemotePhaseStartsAt, gate, actorSeat, tvSeats };
}

/** Transparente Eingabesperre waehrend des Einblend-Takts (unter der Weitergabe, z-90). */
export function PhaseInputGate({ open }: { open: boolean }) {
  return open ? null : <div data-testid="phase-input-gate" aria-hidden className="fixed inset-0 z-[80]" />;
}

/** Buehne „Bereit“ (Design §9.1): wer dran ist, gross mit eigenem Licht; lokal das bekannte Handy-Symbol. */
export function HeadUpReadyStage({ name, seat }: { name: string; seat?: { avatar?: string; color?: string } }) {
  if (!seat) {
    return <>
      <p className="text-sm font-bold text-[#df8eff]">{name}</p>
      <Smartphone className="h-20 w-20 text-[#df8eff]" strokeWidth={1} aria-hidden="true" />
    </>;
  }
  const color = seat.color || "#df8eff";
  return (
    <div className="relative flex w-full flex-col items-center gap-3 py-2" data-testid="headup-actor-stage">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-56" style={{ background: `radial-gradient(circle at 50% 40%, ${color}2e 0%, transparent 65%)` }} />
      <span className="relative flex h-24 w-24 items-center justify-center rounded-full text-5xl" style={{ background: `linear-gradient(145deg, ${color}3d, ${color}12)`, boxShadow: playerGlow(color, "active") }} aria-hidden>
        {seat.avatar || name.slice(0, 1).toUpperCase()}
      </span>
      <p className="relative font-game font-black leading-none tracking-tight text-white" style={{ fontSize: "clamp(2.25rem, 10vw, 3.5rem)" }}>{name}</p>
    </div>
  );
}
