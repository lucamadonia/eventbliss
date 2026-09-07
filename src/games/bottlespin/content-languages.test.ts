import { describe, expect, it, vi } from 'vitest';
vi.mock('i18next', () => ({ default: { language: 'de', t: (_key: string, options: { defaultValue: string }) => options.defaultValue } }));
import i18n from 'i18next';
import { getBOTTLE_CARDS, getCATEGORY_META, getBottleCardById, localizeBottleCard } from './bottlespin-content';
import { EDITORIAL_LANGUAGES, EDITORIAL_PACKS, editorialLanguage } from './editorial-packs';
import { SPECIAL_TEXTS } from './special-packs';
import { BOTTLE_CARDS as specialSource } from './legacy-special-de';
import { BOTTLE_CARDS as german } from './bottlespin-content-de';
import { filterBottleCards } from './deck';

describe('complete localized editorial collection', () => {
  it.each(EDITORIAL_LANGUAGES)('%s contains every translated question and task with identical semantic IDs', language => {
    i18n.language = language;
    const cards = getBOTTLE_CARDS().filter(card => card.id && !card.id.startsWith('special:'));
    expect(cards).toHaveLength(600);
    expect(cards.filter(card => card.type === 'frage')).toHaveLength(500);
    expect(cards.filter(card => card.type === 'aufgabe')).toHaveLength(100);
    expect(cards.map(card => card.id)).toEqual(german.map(card => card.id));
    expect(new Set(cards.map(card => card.text.trim().toLocaleLowerCase())).size).toBe(600);
    expect(Object.keys(EDITORIAL_PACKS[language].QUESTIONS)).toHaveLength(10);
    for (const category of Object.keys(EDITORIAL_PACKS.de.QUESTIONS)) {
      expect(cards.filter(card => card.category === category && card.type === 'frage')).toHaveLength(50);
      expect(cards.filter(card => card.category === category && card.type === 'aufgabe')).toHaveLength(10);
    }
    cards.forEach((card, index) => {
      expect(card.text.trim().length).toBeGreaterThan(10);
      if (language !== 'de') expect(card.text).not.toBe(german[index].text);
      expect(localizeBottleCard(german[index])).toEqual(card);
    });
  });
  it.each(['en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'])('preserves the existing separately labelled %s special categories', language => {
    i18n.language = language;
    const cards = getBOTTLE_CARDS();
    expect(cards.length).toBeGreaterThan(0);
    expect(cards).not.toBe(german);
    expect(cards.some(card => card.category === 'erwachsene')).toBe(true);
    expect(getCATEGORY_META().erwachsene.name).toBeTruthy();
    expect(filterBottleCards(cards, ['eisbrecher'], 'frage').length).toBeGreaterThan(0);
    expect(filterBottleCards(cards, ['eisbrecher'], 'aufgabe').length).toBeGreaterThan(0);
    // A guest can render the category of a German-speaking host without crashing.
    expect(getCATEGORY_META().kreativ.name).toBeTruthy();
  });
  it('selects German regional locales correctly', () => {
    i18n.language = 'de-CH';
    expect(getBOTTLE_CARDS().filter(card => !card.id?.startsWith('special:'))).toEqual(german);
    expect(getCATEGORY_META().eisbrecher.name).toBe('Eisbrecher');
  });
  it('handles mixed-language guests, regional tags and older card payloads', () => {
    i18n.language = 'FR-ca';
    expect(getBottleCardById('eisbrecher:frage:0')?.text).toBe(EDITORIAL_PACKS.fr.QUESTIONS.eisbrecher[0]);
    expect(editorialLanguage('pt_BR')).toBe('pt');
    const legacy = { category: 'jga' as const, type: 'frage' as const, text: 'An older host question' };
    expect(localizeBottleCard(legacy)).toBe(legacy);
    expect(getBottleCardById('missing:frage:0')).toBeUndefined();
  });
  it.each(EDITORIAL_LANGUAGES)('%s translates all canonical special cards without positional drift', language => {
    i18n.language = language;
    expect(getBOTTLE_CARDS()).toHaveLength(722);
    expect(new Set(getBOTTLE_CARDS().map(card => card.id)).size).toBe(722);
    expect(SPECIAL_TEXTS[language]).toHaveLength(122);
    for (let index = 0; index < 122; index++) {
      const card = getBottleCardById(`special:${index}`)!;
      expect(card.text).toBe(SPECIAL_TEXTS[language][index]);
      expect(card.text.trim().length).toBeGreaterThan(10);
      expect(card.category).toBe(specialSource[index].category);
      expect(card.type).toBe(specialSource[index].type);
      if (language !== 'de') expect(card.text).not.toBe(SPECIAL_TEXTS.de[index]);
    }
  });
  it.each(['it', 'es', 'pt'] as const)('%s preserves accents through the file-writing pipeline', language => {
    const pack = EDITORIAL_PACKS[language];
    const texts = [...Object.values(pack.QUESTIONS).flat(), ...Object.values(pack.TASKS).flat(), ...SPECIAL_TEXTS[language]];
    const joined = texts.join('\n');
    expect(joined).not.toMatch(/\p{L}\?\p{L}/u);
    expect((joined.match(/[àáèéêìíòóôùúãõçñ¿]/gu) ?? []).length).toBeGreaterThan(100);
    if (language === 'es') expect(texts.filter(text => text.startsWith('¿')).length).toBeGreaterThan(450);
  });
});
