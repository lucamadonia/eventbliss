import { createContext, useContext } from 'react';
import type { PartySound } from '@/lib/party-motion';

/**
 * Ton fuer Szenen innerhalb eines Spiels. Der Ton gehoert dem TVScreen (nur er
 * kennt die Audiofreigabe); Spielansichten melden nur, welcher Cue faellig ist.
 */
export interface TVCueApi {
  play: (sound: PartySound) => void;
  /** Trommelwirbel laeuft, bis die Rueckgabe aufgerufen wird. */
  drumroll: () => () => void;
}

const noop: TVCueApi = { play: () => {}, drumroll: () => () => {} };
export const TVCueContext = createContext<TVCueApi>(noop);
export const useTVCue = () => useContext(TVCueContext);
