/**
 * guest-handover — reine Helfer, um 🔁-Gaeste am Host-Handy durch ein
 * Online-Spiel zu fuehren (Masterplan 3.5, 7). Gemeinsam fuer alle Spiele,
 * die `sharedDeviceSupported` setzen; der Zustand selbst lebt in
 * handover-machine.ts, das React-Drumherum in useGuestHandover.ts.
 */
import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { localSeats } from "../multiplayer/OnlineGameTypes";
import type { HandoverState } from "./handover-machine";
import type { HandoverPlayer, HandoverScreenProps } from "./HandoverScreen";

type SeatSource = Pick<OnlineGameProps, "myPlayerId" | "localPlayerIds" | "players">;

/** Gaeste, die DIESES Geraet spielt: lokale Plaetze ohne den eigenen, nur aktive Mitspielende. */
export function localGuestIds(online: SeatSource | undefined): string[] {
  if (!online) return [];
  const active = new Set(online.players.map((p) => p.id));
  return localSeats(online).filter((id) => id !== online.myPlayerId && active.has(id));
}

/** Alle Plaetze dieses Geraets, die im Spiel sind (eigener zuerst, falls er mitspielt). */
export function localActiveSeats(online: SeatSource | undefined): string[] {
  if (!online) return [];
  const active = new Set(online.players.map((p) => p.id));
  return localSeats(online).filter((id) => active.has(id));
}

export type SeatLookup = (id: string) => HandoverPlayer | undefined;

/** Platz-Lookup aus der Spielerliste des Raums. */
export function seatLookup(players: readonly { id: string; name: string; avatar?: string; color?: string }[]): SeatLookup {
  return (id) => {
    const p = players.find((candidate) => candidate.id === id);
    return p ? { id: p.id, name: p.name, avatar: p.avatar || p.name.slice(0, 1).toUpperCase(), color: p.color || "#df8eff" } : undefined;
  };
}

/**
 * Was HandoverScreen gerade zeigen soll — `null`, wenn nichts weitergegeben
 * wird. `hostSeat` ist der Besitzer des Handys (fuer „Zurueck an Luca“).
 */
export function handoverScreenProps(
  state: HandoverState,
  seatOf: SeatLookup,
  hostSeat: HandoverPlayer | undefined,
): Omit<HandoverScreenProps, "onConfirm" | "secret" | "clockPaused"> | null {
  if (state.status === "handover") {
    const player = seatOf(state.playerId);
    return player ? { player, kind: "handover" } : null;
  }
  if (state.status === "return") {
    const from = seatOf(state.from) ?? hostSeat;
    if (!from) return null;
    if (state.to === null) return { player: from, kind: "return", returnTo: hostSeat ? { ...hostSeat, isHost: true } : undefined };
    const to = seatOf(state.to);
    return { player: from, kind: "return", returnTo: to ?? (hostSeat ? { ...hostSeat, isHost: true } : undefined) };
  }
  return null;
}

/** Oeffentlicher TV-Hinweis „🎸 Max spielt am Host-Handy“ — nie geheime Infos. */
export interface TvHandover {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
}

export function tvHandover(state: HandoverState, seatOf: SeatLookup): TvHandover | null {
  const id = state.status === "handover" || state.status === "revealed" ? state.playerId
    : state.status === "return" ? state.to : null;
  const seat = id ? seatOf(id) : undefined;
  return seat ? { playerId: seat.id, name: seat.name, avatar: seat.avatar, color: seat.color } : null;
}
