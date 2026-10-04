/**
 * useGuestHandover — 🔁-Gaeste am Host-Handy in einem Online-Spiel.
 *
 *   const h = useGuestHandover(online, { secret: true });
 *   // Gast ist dran → h.request([id]); nach seinem Zug → h.done()
 *   return <>{h.overlay}{h.activeGuest === id && <Zug fuer id />}</>;
 *
 * Entfernte Mitspielende (`online.removedPlayerIds`) fallen automatisch aus
 * der Weitergabe. `isPaused` → Spieluhr anhalten. `tv` gehoert in den
 * TV-Zustand (`handover`), damit der Fernseher „Max spielt am Host-Handy“ zeigt.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import type { OnlineGameProps } from "../multiplayer/OnlineGameTypes";
import { activeGuest as activeGuestOf, handoverReducer, initialHandoverState, isClockPaused, handoverRecipient, type HandoverState } from "./handover-machine";
import { HandoverScreen } from "./HandoverScreen";
import { handoverScreenProps, localGuestIds, nextDoneIds, seatLookup, tvHandover, type TvHandover } from "./guest-handover";

export interface GuestHandover {
  state: HandoverState;
  /** Gaeste, die dieses Geraet spielt. */
  guests: string[];
  isGuest: (id: string | null | undefined) => boolean;
  /** Gast, der das Handy gerade hat und bestaetigt hat — nur dann seinen Zug zeigen. */
  activeGuest: string | null;
  /** Handy ist unterwegs → Uhr anhalten, nichts anderes anzeigen. */
  isPaused: boolean;
  /** Wer das Handy gleich bekommt (`null` = Host, `undefined` = keine Weitergabe). */
  recipient: string | null | undefined;
  request: (ids: readonly string[]) => void;
  confirm: () => void;
  done: () => void;
  cancel: () => void;
  /** HandoverScreen, solange weitergegeben wird — sonst null. */
  overlay: ReactNode;
  tv: TvHandover | null;
}

export function useGuestHandover(online: OnlineGameProps | undefined, opts: { secret?: boolean; clockPaused?: boolean } = {}): GuestHandover {
  const [state, dispatch] = useReducer(handoverReducer, initialHandoverState);
  // Fertige Gaeste der laufenden Kette (TV-Fortschritt) — im Rendern mitgefuehrt.
  const chain = useRef<{ state: HandoverState; done: string[] }>({ state, done: [] });
  if (chain.current.state !== state) chain.current = { state, done: nextDoneIds(chain.current.state, state, chain.current.done) };
  const guests = useMemo(() => localGuestIds(online), [online]);
  const seatOf = useMemo(() => seatLookup(online?.players ?? []), [online?.players]);
  const hostSeat = online ? seatOf(online.myPlayerId) ?? { id: online.myPlayerId, name: "Host", avatar: "👑", color: "#df8eff" } : undefined;

  const removedKey = (online?.removedPlayerIds ?? []).join(",");
  useEffect(() => {
    for (const id of online?.removedPlayerIds ?? []) dispatch({ type: "remove", playerId: id });
    // Nur bei geaenderter Liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedKey]);

  const request = useCallback((ids: readonly string[]) => dispatch({ type: "request", playerIds: ids }), []);
  const confirm = useCallback(() => dispatch({ type: "confirm" }), []);
  const done = useCallback(() => dispatch({ type: "done" }), []);
  const cancel = useCallback(() => dispatch({ type: "cancel" }), []);

  const screen = handoverScreenProps(state, seatOf, hostSeat);
  const overlay = screen ? (
    <HandoverScreen {...screen} secret={opts.secret} clockPaused={opts.clockPaused ?? true} onConfirm={confirm} />
  ) : null;

  return {
    state,
    guests,
    isGuest: (id) => !!id && guests.includes(id),
    activeGuest: activeGuestOf(state),
    isPaused: isClockPaused(state),
    recipient: handoverRecipient(state),
    request,
    confirm,
    done,
    cancel,
    overlay,
    tv: tvHandover(state, seatOf, chain.current.done),
  };
}
