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

/** TV-Grenzen: so viele Kennungen je Liste, so lang je Kennung. */
export const TV_HANDOVER_MAX_IDS = 12;
export const TV_HANDOVER_MAX_ID_LENGTH = 128;

/**
 * Fortschritt der Weitergabe-Kette fuer die TV-Buehne (Design §9.3):
 * ✓ gesehen (`doneIds`) · jetzt (`currentId`) · offen (`queueIds`).
 * passing = Handy unterwegs · viewing = „Ich bin Max“ bestaetigt ·
 * covered = fertig, Handy geht zurueck an den Host. Nur Daten — keine Rolle,
 * kein Wort, keine Zeit pro Person.
 */
export interface TvHandoverProgress {
  doneIds: string[];
  currentId: string;
  queueIds: string[];
  phase: "passing" | "viewing" | "covered";
}

/** Oeffentlicher TV-Hinweis „🎸 Max spielt am Host-Handy“ — nie geheime Infos. */
export interface TvHandover {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  progress?: TvHandoverProgress;
  /** Wer das Handy danach bekommt — fuer „Als Naechstes: …“ (oeffentlich). */
  next?: { name: string; avatar: string; color: string };
}

const tvIds = (ids: readonly string[]) =>
  ids.filter((id) => typeof id === "string" && id.length > 0 && id.length <= TV_HANDOVER_MAX_ID_LENGTH).slice(0, TV_HANDOVER_MAX_IDS);

/**
 * Wer in der laufenden Kette schon fertig ist. Rein: aus altem und neuem
 * Zustand. Ein Gast ist fertig, sobald er nach seinem Zug weitergibt
 * (`revealed` → `return`); zurueck auf `idle` beginnt eine neue Kette.
 */
export function nextDoneIds(prev: HandoverState, next: HandoverState, done: readonly string[]): string[] {
  if (next.status === "idle") return [];
  if (prev.status === "revealed" && next.status === "return" && !done.includes(prev.playerId)) return [...done, prev.playerId];
  return [...done];
}

/**
 * Wer das Handy gerade hat oder gleich bekommt. Bei der Rueckgabe an den Host
 * bleibt der letzte Gast sichtbar (`covered`), bis der Host bestaetigt.
 */
export function tvHandover(state: HandoverState, seatOf: SeatLookup, doneIds: readonly string[] = []): TvHandover | null {
  let id: string | null = null;
  let phase: TvHandoverProgress["phase"] = "passing";
  if (state.status === "handover") id = state.playerId;
  else if (state.status === "revealed") { id = state.playerId; phase = "viewing"; }
  else if (state.status === "return") {
    if (state.to) id = state.to;
    else { id = state.from; phase = "covered"; }
  }
  const seat = id ? seatOf(id) : undefined;
  if (!seat) return null;
  const queue = state.status === "idle" ? [] : state.queue;
  const following = phase === "covered" ? undefined : seatOf(queue.find((q) => q !== seat.id) ?? "");
  return {
    playerId: seat.id,
    name: seat.name,
    avatar: seat.avatar,
    color: seat.color,
    progress: {
      doneIds: tvIds(doneIds.filter((d) => !!seatOf(d) && (d !== seat.id || phase === "covered"))),
      currentId: seat.id,
      queueIds: tvIds(queue.filter((q) => q !== seat.id)),
      phase,
    },
    ...(following ? { next: { name: following.name, avatar: following.avatar, color: following.color } } : {}),
  };
}
