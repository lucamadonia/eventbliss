import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const languages = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];
const load = (language: string) => JSON.parse(readFileSync(`src/i18n/locales/${language}.json`, 'utf8'));
const placeholders = (text: string) => [...text.matchAll(/{{(.*?)}}/g)].map(match => match[1]).sort();
const extraKeys = ['tv.partyNight.champions', 'tv.partyNight.championsLine', 'games.storybuilder.emptyStory', 'games.whoami.asking.controllerHint', 'games.whoami.result.tryAgain', 'games.emojiguess.balancedTeamPoints'];
const english = load('en');

describe('controller party localization', () => {
  it.each(languages)('%s provides all labels, interpolation variables and plural forms', language => {
    const locale = load(language);
    const labels = locale.partyControllers;
    for (const [key, value] of Object.entries(english.partyControllers)) {
      if (key.startsWith('players_')) continue;
      expect(labels[key], `${language}.${key}`).toBeTypeOf('string');
      expect(labels[key].trim()).not.toBe('');
      expect(placeholders(labels[key])).toEqual(placeholders(value as string));
      expect(labels[key]).not.toContain('\uFFFD');
    }
    for (const category of new Intl.PluralRules(language).resolvedOptions().pluralCategories) {
      const text = labels[`players_${category}`];
      expect(text, `${language}.players_${category}`).toBeTypeOf('string');
      expect(placeholders(text)).toEqual(['count']);
    }
    for (const path of extraKeys) {
      const value = path.split('.').reduce((obj, key) => obj?.[key], locale);
      expect(value, `${language}.${path}`).toBeTypeOf('string');
      expect(value.length).toBeGreaterThan(5);
    }
  });
});
