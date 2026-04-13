/**
 * getTranslatedModes — returns game modes with i18n labels.
 * Falls back to the provided defaults if i18n keys don't exist.
 */
import type { GameMode } from './GameSetup';

type TFn = (key: string, fallback?: string) => string;

export function getTranslatedModes(
  gameId: string,
  modes: GameMode[],
  t: TFn,
): GameMode[] {
  return modes.map((mode) => ({
    ...mode,
    name: t(`gameModes.${gameId}.${mode.id}.name`, mode.name),
    desc: t(`gameModes.${gameId}.${mode.id}.desc`, mode.desc),
  }));
}
