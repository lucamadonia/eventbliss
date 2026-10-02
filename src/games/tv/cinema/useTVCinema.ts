import { useCallback, useMemo } from 'react';
import type { PartySound } from '@/lib/party-motion';
import type { useTVAudio } from '../TVAudioManager';
import type { TVState } from '../useTVConnection';
import type { TVCueApi } from './tv-cue-context';
import { CUE_GAMES, phaseCueFor } from './tv-phase-cues';

/**
 * Ton- und Szenen-Verdrahtung des Fernsehers an einer Stelle:
 * - `playSound`: PartySound → TV-Ton (Wartebereich, Szenen-Cues)
 * - `cueApi`: fuer Spielansichten (Kontext)
 * - `phaseCue`/`phaseStartsAt`: Titelkarte der Pilotspiele, an der Szenenuhr
 * - `cueGame`: dieses Spiel bekommt seine Phasen-Toene aus den Cues
 */
export function useTVCinema(audio: ReturnType<typeof useTVAudio>, gameState: TVState | null, showGame: boolean) {
  const playSound = useCallback((sound: PartySound) => {
    if (sound === 'chime') audio.playChime();
    else if (sound === 'tick') audio.playTick();
    else if (sound === 'reveal') audio.playReveal();
    else if (sound === 'correct') audio.playCorrect();
    else if (sound === 'wrong') audio.playWrong();
    else if (sound === 'fanfare') audio.playFanfare();
  }, [audio]);

  const cueApi = useMemo<TVCueApi>(() => ({ play: playSound, drumroll: () => audio.playDrumroll() }), [playSound, audio]);

  const game = String(gameState?.game ?? '');
  const phaseCue = useMemo(
    () => (showGame ? phaseCueFor(game, gameState as Record<string, unknown> | null) : null),
    [showGame, game, gameState],
  );
  const raw = gameState?.phaseStartsAt;
  const phaseStartsAt = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
  return { playSound, cueApi, phaseCue, phaseStartsAt, cueGame: CUE_GAMES.has(game) };
}
