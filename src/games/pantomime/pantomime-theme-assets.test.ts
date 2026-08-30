import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PANTOMIME_MIX_ASSET, PANTOMIME_THEME_ASSETS } from './pantomime-theme-assets';

const PUBLIC = path.resolve(__dirname, '../../../public');
const CATEGORY_IDS = [
  'tiere',
  'berufe',
  'filme',
  'alltag',
  'sport',
  'gefuehle',
  'sprichwoerter',
  'maerchen',
  'ab18',
] as const;

function exists(webPath: string) {
  return fs.existsSync(path.join(PUBLIC, webPath.replace(/^\//, '')));
}

describe('OHNE WORTE — Themenmotive', () => {
  it('ordnet jeder Kategorie genau ein GPT-Image-Motiv zu', () => {
    expect(Object.keys(PANTOMIME_THEME_ASSETS).sort()).toEqual([...CATEGORY_IDS].sort());
    expect(new Set(Object.values(PANTOMIME_THEME_ASSETS)).size).toBe(CATEGORY_IDS.length);
  });

  it('liefert alle referenzierten WebP-Dateien aus', () => {
    const assets = [PANTOMIME_MIX_ASSET, ...Object.values(PANTOMIME_THEME_ASSETS)];
    expect(assets.filter((asset) => !exists(asset))).toEqual([]);
    expect(assets.every((asset) => asset.endsWith('-gpt.webp'))).toBe(true);
  });
});
