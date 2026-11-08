import { describe, expect, it } from 'vitest';
import { resolveGameRules } from '../ui/game-rules';
import ar from '@/i18n/locales/ar.json';
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';
import itLocale from '@/i18n/locales/it.json';
import nl from '@/i18n/locales/nl.json';
import pl from '@/i18n/locales/pl.json';
import pt from '@/i18n/locales/pt.json';
import tr from '@/i18n/locales/tr.json';

const locales = { ar, de, en, es, fr, it: itLocale, nl, pl, pt, tr };

describe('Hit-Buzzer rules shared by phone and TV', () => {
  it.each(Object.entries(locales))('has a complete instruction in %s', (_, bundle) => {
    const t = (key: string, fallback = '') => {
      const value = key.split('.').reduce<unknown>((node, part) => node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined, bundle);
      return typeof value === 'string' ? value : fallback;
    };
    const rules = resolveGameRules('hitbuzzer', t);
    expect(rules?.title).toBeTruthy();
    expect(rules?.tagline).toBeTruthy();
    expect(rules?.steps).toHaveLength(5);
    expect(rules?.steps.every(Boolean)).toBe(true);
    expect(rules?.tip).toBeTruthy();
  });
});
