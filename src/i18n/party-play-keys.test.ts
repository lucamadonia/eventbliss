/**
 * Party-Play-Texte in allen zehn Sprachen.
 *
 * `dead-keys.test.ts` prueft nur en.json und kennt keine Pluralformen;
 * `locale-integrity.test.ts` vergleicht nur gegen Deutsch. Hier wird jeder
 * `t('tvLobby.…')`, `t('handover.…')` und `t('partyPlay.…')` im Quelltext gegen
 * JEDE Sprachdatei aufgeloest — ein fehlender Key zeigte sonst auf dem
 * Fernseher still den deutschen Notnagel (so geschehen bei QA-Szenario H05).
 *
 * Plural: Ein Aufruf mit `count` darf statt des Grundschluessels auch nur
 * `<key>_other` haben — so sucht i18next selbst.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');
const LOCALES = path.join(SRC, 'i18n/locales');
const CODES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar'];
const NAMESPACES = ['tvLobby', 'handover', 'partyPlay', 'tvCinema'];
/**
 * Namensraeume, deren Texte gerade zusammengetragen werden. Bewusst sichtbar
 * statt still ausgelassen — sobald die Liste steht, hier entfernen.
 */
const PENDING = new Set<string>();

const T_CALL = new RegExp(`\\bt\\(\\s*(['"\`])((?:${NAMESPACES.join('|')})\\.[\\w.]+)\\1`, 'g');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(T_CALL)) {
      if (!keys.has(match[2])) keys.set(match[2], path.relative(SRC, file).replace(/\\/g, '/'));
    }
  }
  return keys;
}

function resolves(tree: unknown, key: string): boolean {
  const get = (k: string) => k.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree);
  return typeof get(key) === 'string' || typeof get(`${key}_other`) === 'string';
}

const KEYS = usedKeys();

describe('Party-Play i18n — jeder benutzte Key in allen Sprachen', () => {
  it('findet ueberhaupt Party-Play-Keys im Quelltext', () => {
    expect([...KEYS.keys()].some((k) => k.startsWith('tvLobby.'))).toBe(true);
  });

  it.each(CODES)('%s.json kennt jeden tvLobby/handover/partyPlay-Key', (code) => {
    const tree = JSON.parse(fs.readFileSync(path.join(LOCALES, `${code}.json`), 'utf8'));
    const missing = [...KEYS]
      .filter(([key]) => !PENDING.has(key.split('.')[0]))
      .filter(([key]) => !resolves(tree, key))
      .map(([key, file]) => `${key}   <- ${file}`);
    expect(missing, `${code}.json fehlen ${missing.length} Party-Play-Keys:\n${missing.join('\n')}`).toEqual([]);
  });
});
