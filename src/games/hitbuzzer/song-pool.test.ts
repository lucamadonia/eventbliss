import { afterEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ range: () => ({ overlaps: () => query() }) }) }) }) },
}));

import { getAllSongs, setBaseSongs, setExtraSongs } from '../ohrwurm/ohrwurm-content';
import { loadHitBuzzerDeck } from './song-pool';

afterEach(() => { setBaseSongs(null); setExtraSongs([]); query.mockReset(); });

describe('shared Ohrwurm song pool', () => {
  it('includes a newly administered song in the next Hit-Buzzer deck', async () => {
    query.mockResolvedValue({ data: [{ id: 'new-1', base_id: null, year: 2025, artist: 'New Artist', title: 'New Song', country: '🌍', genre: 'Pop', language: 'de', languages: ['de'], spotify_uri: null, preview_url: 'https://example.test/preview.mp3' }], error: null });
    const deck = await loadHitBuzzerDeck();
    expect(deck.some(song => song.id === 'db-new-1' && song.previewUrl === 'https://example.test/preview.mp3')).toBe(true);
  });

  it('does not resurrect disabled base songs when the database returns no active songs', async () => {
    query.mockResolvedValue({ data: [], error: null });
    expect(await loadHitBuzzerDeck()).toEqual([]);
    expect(getAllSongs()).toEqual([]);
  });

  it('uses the offline catalogue if the database is unreachable', async () => {
    query.mockResolvedValue({ data: null, error: new Error('offline') });
    expect((await loadHitBuzzerDeck()).length).toBeGreaterThan(0);
  });
});
