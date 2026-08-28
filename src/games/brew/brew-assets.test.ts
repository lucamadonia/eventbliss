import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INGREDIENT_IDS, ingredientImage, type Skin } from './brew-content';
import { playableGames } from '@/lib/playable-games';
import { BAR_GLASS_ASSETS } from './glass-assets';
import { BAR_SHAPES } from './glass-shapes';

/**
 * Bindet die Bilddateien an den Code.
 *
 * WARUM: Die Bilder sind mit Absicht OPTIONAL — faellt eines aus, traegt das
 * Emoji, und im Spiel sieht man nichts. Genau das ist die Gefahr: eine
 * umbenannte Zutaten-Kennung oder eine vergessene Datei faellt sonst NIEMANDEM
 * auf, weil das Spiel weiterhin sauber aussieht. Dieser Test ist die einzige
 * Stelle, die das bemerkt.
 *
 * Er prueft absichtlich gegen `ingredientImage()` und gegen den Registry-Pfad,
 * nicht gegen eine zweite von Hand gepflegte Liste — die waere die naechste
 * Stelle, die auseinanderlaeuft.
 */
const PUBLIC = path.resolve(__dirname, '../../../public');
const SKINS: Skin[] = ['brew', 'bar'];

function exists(webPath: string): boolean {
  return fs.existsSync(path.join(PUBLIC, webPath.replace(/^\//, '')));
}

describe('GEBRAEU — Bildbestand', () => {
  it('hat die Spielkachel, die die Registry referenziert', () => {
    const entry = playableGames.find((g) => g.id === 'brew');
    expect(entry, 'brew fehlt in playable-games.ts').toBeTruthy();
    expect(exists(entry!.image), `${entry!.image} fehlt`).toBe(true);
  });

  it('hat fuer jede Zutat ein Bild — in beiden Gewaendern', () => {
    const fehlt: string[] = [];
    for (const skin of SKINS) {
      for (const id of INGREDIENT_IDS) {
        const p = ingredientImage(id, skin);
        if (!exists(p)) fehlt.push(p);
      }
    }
    expect(fehlt, `fehlende Zutatenbilder: ${fehlt.join(', ')}`).toEqual([]);
  });

  it('hat die vier Atmosphaere-Hintergruende', () => {
    const fehlt: string[] = [];
    for (const skin of SKINS) {
      for (const variant of ['tv', 'phone']) {
        const p = `/images/brew/bg-${skin}-${variant}.webp`;
        if (!exists(p)) fehlt.push(p);
      }
    }
    expect(fehlt, `fehlende Hintergruende: ${fehlt.join(', ')}`).toEqual([]);
  });

  it('hat fuer jede Cocktailform ein GPT-Image-Gefaess', () => {
    const fehlt = BAR_SHAPES
      .map((shape) => BAR_GLASS_ASSETS[shape])
      .filter((asset) => !exists(asset));
    expect(fehlt, `fehlende Glasrenderings: ${fehlt.join(', ')}`).toEqual([]);
  });
});
