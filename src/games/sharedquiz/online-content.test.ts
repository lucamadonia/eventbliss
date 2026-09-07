import { describe, it, expect } from 'vitest';
import i18n from 'i18next';
import { getFACTS, getTHREE_STATEMENTS } from '../fakeorfact/fakeorfact-content';
import { getEMOJI_PUZZLES } from '../emojiguess/emoji-content';
import { getSHARED_QUIZ_QUESTIONS } from './sharedquiz-content';
import { getTRUTH_QUESTIONS, getDARE_CHALLENGES } from '../truthdare/truthdare-content';

describe('online game content in every supported language', () => {
  for (const lang of ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar']) {
    it(`${lang}: has playable decks and complete question shapes`, async () => {
      await i18n.init({ lng: lang, fallbackLng: 'de', resources: {} });
      expect(getFACTS().length).toBeGreaterThan(0);
      expect(getTHREE_STATEMENTS().length).toBeGreaterThan(0);
      expect(getEMOJI_PUZZLES().every(p => p.answer && p.emojis && p.category)).toBe(true);
      expect(getEMOJI_PUZZLES().length).toBeGreaterThan(0);
      expect(getSHARED_QUIZ_QUESTIONS().every(q => q.answers.length === 4 && q.hint && q.question)).toBe(true);
      expect(getTRUTH_QUESTIONS().every(q => q.text && q.intensity)).toBe(true);
      expect(getDARE_CHALLENGES().every(q => q.text && q.intensity)).toBe(true);
    });
  }
});
