import i18n from 'i18next';
import { buildDeck, type Song } from '../ohrwurm/ohrwurm-engine';
import { loadExtraSongs } from '../ohrwurm/ohrwurm-extra-songs';

/**
 * Hit-Buzzer draws from the exact same live song pool as Ohrwurm.
 * A fresh match reloads admin changes; an ongoing match keeps its own deck.
 * There is deliberately no second song table or copied JSON catalogue.
 */
export async function loadHitBuzzerDeck(): Promise<Song[]> {
  await loadExtraSongs(i18n.language?.split('-')[0] || 'de');
  return buildDeck();
}
