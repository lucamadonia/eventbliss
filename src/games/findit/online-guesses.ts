import { haversineKm } from '../engine/haversine';

export interface OnlineGuess { playerId: string; playerName: string; playerColor: string; lat: number; lng: number; distanceKm: number }
/** First valid submission wins, identically for the host and guests. */
export function appendOnlineGuess(previous: OnlineGuess[], players: { id: string; name: string; color: string }[], playerId: string, lat: number, lng: number, target: { lat: number; lng: number }, submitted = true): OnlineGuess[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return previous;
  const player = players.find(p => p.id === playerId);
  if (!player || previous.some(g => g.playerId === playerId)) return previous;
  return [...previous, { playerId, playerName: player.name, playerColor: player.color, lat, lng, distanceKm: submitted ? haversineKm(lat, lng, target.lat, target.lng) : 20000 }];
}

/** While guesses are open, publish completion only, never pins or distances. */
export function publicGuessRound<T extends { phase: string; guesses: OnlineGuess[]; location: unknown }>(state: T) {
  return { ...state, guesses: state.phase === 'result' ? state.guesses : [],
    location: state.phase === 'result' ? state.location : null,
    submittedIds: state.guesses.map(guess => guess.playerId) };
}
