import { useEffect, useRef } from 'react';
import { localSeats, type OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import { nextLocalGuesser, type GuessLike } from './guest-turns';

/**
 * Host phone, Karte / Street View: which seat on THIS phone sets its pin now
 * (own seat first, then each 🔁 guest after a handover). Reports the seat to
 * FindItGame, which owns the handover (TV + overlay). Other phones: always null.
 */
export function useGuestGuesser(online: OnlineGameProps | undefined, active: boolean, players: readonly { id: string }[],
  guesses: readonly GuessLike[], onLocalSeat?: (seat: string | null) => void): string | null {
  const guesser = online?.isHost ? nextLocalGuesser(localSeats(online), players, guesses) : null;
  const report = useRef(onLocalSeat);
  report.current = onLocalSeat;
  const seat = active ? guesser : null;
  useEffect(() => { report.current?.(seat); }, [seat]);
  useEffect(() => () => report.current?.(null), []);
  return guesser;
}
