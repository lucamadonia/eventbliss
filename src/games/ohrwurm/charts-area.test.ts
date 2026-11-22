import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDeck } from './ohrwurm-engine';
import {
  OHRWURM_CHARTS, chartSongCount, setExtraSongs, songMatchesGenre, subscribeSongs, type Song,
} from './ohrwurm-content';

const song = (id: string, genre: string, charts?: boolean): Song => ({
  id, year: 2026, artist: 'Artist ' + id, title: 'Title ' + id, flag: '🇩🇪', genre, qrPayload: '', charts,
});

describe('Charts area', () => {
  afterEach(() => setExtraSongs([]));

  it('contains chart songs of every genre and nothing else', () => {
    setExtraSongs([song('a', 'Pop', true), song('b', 'Hip-Hop', true), song('c', 'Pop')]);
    expect(buildDeck(OHRWURM_CHARTS).map((s) => s.id).sort()).toEqual(['a', 'b']);
    expect(chartSongCount()).toBe(2);
  });

  it('is empty while no chart songs are loaded', () => {
    expect(buildDeck(OHRWURM_CHARTS)).toEqual([]);
    expect(chartSongCount()).toBe(0);
  });

  it('keeps genre and "all" selections unchanged', () => {
    const pop = song('a', 'Pop', true);
    expect(songMatchesGenre(pop, null)).toBe(true);
    expect(songMatchesGenre(pop, 'Pop')).toBe(true);
    expect(songMatchesGenre(pop, 'Rock')).toBe(false);
    expect(songMatchesGenre(song('c', 'Pop'), OHRWURM_CHARTS)).toBe(false);
  });

  it('tells the setup screens when the song pool changes', () => {
    const listener = vi.fn();
    const stop = subscribeSongs(listener);
    setExtraSongs([song('a', 'Pop', true)]);
    stop();
    setExtraSongs([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
