import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs helper without type declarations
import { indexExisting, planChartWrite } from '../../scripts/lib/charts-sources.mjs';

const keyOf = (artist: string, title: string) => `${artist}|${title}`.toLowerCase();
const chart = (over: Record<string, unknown> = {}) => ({
  trackId: 500, key: keyOf('Artist', 'Song'), markets: ['AT', 'DE'],
  previewUrl: 'https://clip/new.m4a', artworkUrl: 'https://art/new.jpg', ...over,
});
const row = (over: Record<string, unknown> = {}) => ({
  id: 'row-1', itunes_track_id: null, artist: 'Artist', title: 'Song', source: 'base',
  preview_url: null, artwork_url: null, ...over,
});

describe('planChartWrite', () => {
  it('inserts a title the stock does not know', () => {
    expect(planChartWrite(chart(), indexExisting([], keyOf))).toEqual({ kind: 'insert' });
  });

  it('gives a stock song without links its track id and clip', () => {
    const plan = planChartWrite(chart(), indexExisting([row()], keyOf));
    expect(plan).toMatchObject({ kind: 'update', id: 'row-1', linked: true, gainedPreview: true });
    expect(plan.patch).toEqual({
      chart_markets: ['AT', 'DE'], itunes_track_id: 500,
      preview_url: 'https://clip/new.m4a', artwork_url: 'https://art/new.jpg',
    });
  });

  it('never touches year, languages, source or the active switch of a stock song', () => {
    const plan = planChartWrite(chart(), indexExisting([row({ itunes_track_id: 500 })], keyOf));
    expect(Object.keys(plan.patch).sort()).toEqual(['artwork_url', 'chart_markets', 'preview_url']);
  });

  it('keeps id and clip of another version of the same song', () => {
    const other = row({ itunes_track_id: 77, preview_url: 'https://clip/old.m4a', artwork_url: 'https://art/old.jpg' });
    const plan = planChartWrite(chart(), indexExisting([other], keyOf));
    expect(plan.patch).toEqual({ chart_markets: ['AT', 'DE'] });
    expect(plan.linked).toBe(false);
  });

  it('prefers the row found by track id over a same-named row', () => {
    const rows = [row({ id: 'by-name' }), row({ id: 'by-track', itunes_track_id: 500, title: 'Song (Remaster)' })];
    expect(planChartWrite(chart(), indexExisting(rows, keyOf)).id).toBe('by-track');
  });

  it('leaves hand-maintained songs alone', () => {
    expect(planChartWrite(chart(), indexExisting([row({ source: 'manual' })], keyOf))).toEqual({ kind: 'manual' });
  });
});
