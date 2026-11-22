import { useEffect, useSyncExternalStore } from 'react';
import i18n from 'i18next';
import { chartSongCount, subscribeSongs } from './ohrwurm-content';
import { loadExtraSongs } from './ohrwurm-extra-songs';

/**
 * How many chart songs are ready in the current language. The setup screens
 * offer the "Charts" area only while this is above zero, so nobody can pick an
 * empty deck. `load` fetches the song pool for screens that do not already.
 */
export function useChartSongCount(options: { load?: boolean } = {}): number {
  const { load = false } = options;
  useEffect(() => {
    if (load && chartSongCount() === 0) void loadExtraSongs(i18n.language?.split('-')[0] || 'de');
  }, [load]);
  return useSyncExternalStore(subscribeSongs, chartSongCount, chartSongCount);
}
