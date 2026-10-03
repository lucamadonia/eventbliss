import type { PartyPlaylistItem } from '../party-types';

/** Wie gut ein geplantes Spiel zur aktuellen Runde passt — reine Personenzahl. */
export type SetlistFit = 'ok' | 'tooFew' | 'tooMany' | 'unknown';

export interface SetlistRow {
  gameId: string;
  name: string;
  /** 1-basierte Position im Abend */
  position: number;
  state: 'done' | 'next' | 'later';
  fit: SetlistFit;
  min: number;
  max: number;
}

export interface SetlistView {
  rows: SetlistRow[];
  /** Eintraege, die nicht mehr in die Liste passen */
  hiddenLater: number;
  done: number;
  total: number;
}

export function setlistFit(min: number, max: number, players: number): SetlistFit {
  if (!(min > 0) || !(max > 0)) return 'unknown';
  if (players < min) return 'tooFew';
  if (players > max) return 'tooMany';
  return 'ok';
}

/**
 * Die Set-Liste fuer den Wartebereich: Gespieltes bleibt als kurzer Rueckblick
 * (nur das letzte), dann das naechste Spiel, dann was noch kommt — begrenzt auf
 * `maxRows`, damit die Liste nie aus dem Bild laeuft.
 */
export function buildSetlist(
  playlist: readonly PartyPlaylistItem[],
  players: number,
  range: (gameId: string) => { min: number; max: number } | null,
  maxRows = 6,
): SetlistView {
  const nextIndex = playlist.findIndex((item) => !item.done);
  const done = playlist.filter((item) => item.done).length;
  const all: SetlistRow[] = playlist.map((item, i) => {
    const r = range(item.gameId);
    const min = r?.min ?? 0;
    const max = r?.max ?? 0;
    return {
      gameId: item.gameId,
      name: item.name,
      position: i + 1,
      state: item.done ? 'done' : i === nextIndex ? 'next' : 'later',
      fit: item.done ? 'unknown' : setlistFit(min, max, players),
      min,
      max,
    };
  });
  const lastDone = nextIndex === -1 ? all.length - 1 : nextIndex - 1;
  const start = Math.max(0, Math.min(lastDone, all.length - maxRows));
  const rows = all.slice(start, start + maxRows);
  const hiddenLater = Math.max(0, all.length - (start + rows.length));
  return { rows, hiddenLater, done, total: all.length };
}
