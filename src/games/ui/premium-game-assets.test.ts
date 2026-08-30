import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOMB_MODE_ASSETS,
  CLOSE_ENOUGH_THEME_ASSETS,
  FINDIT_MODE_ASSETS,
  HEADUP_THEME_ASSETS,
  OHRWURM_GENRE_ASSETS,
  OHRWURM_MODE_ASSETS,
  PIXELJAGD_THEME_ASSETS,
  STORY_MODE_ASSETS,
  WORDPRESS_MODE_ASSETS,
  WORLD_FINDER_REGION_ASSETS,
} from './premium-game-assets';

describe('premium game artwork', () => {
  it('references optimized generated WebP assets that exist', () => {
    const registries = [
      BOMB_MODE_ASSETS,
      CLOSE_ENOUGH_THEME_ASSETS,
      FINDIT_MODE_ASSETS,
      HEADUP_THEME_ASSETS,
      OHRWURM_GENRE_ASSETS,
      OHRWURM_MODE_ASSETS,
      PIXELJAGD_THEME_ASSETS,
      STORY_MODE_ASSETS,
      WORDPRESS_MODE_ASSETS,
      WORLD_FINDER_REGION_ASSETS,
    ];
    const assets = [...new Set(registries.flatMap((registry) => Object.values(registry)))];

    expect(assets.length).toBeGreaterThan(20);
    for (const asset of assets) {
      expect(asset).toMatch(/^\/images\/games\/editorial-themes\//);
      expect(asset).toMatch(/-gpt\.webp$/);
      expect(fs.existsSync(path.join(process.cwd(), 'public', asset))).toBe(true);
    }
  });

  it('uses a dedicated real-world Street View motif', () => {
    expect(FINDIT_MODE_ASSETS.streetview).toBe(
      '/images/games/editorial-themes/findit-streetview-gpt.webp',
    );
    expect(FINDIT_MODE_ASSETS.streetview).not.toBe(FINDIT_MODE_ASSETS.karte);
  });
});
