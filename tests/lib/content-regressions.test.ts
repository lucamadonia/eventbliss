import { beforeAll, describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { getCategories, getQuestions } from '../../src/games/content';
import { getSTORY_STARTERS, getSTORY_PROMPTS } from '../../src/games/storybuilder/story-prompts';
import { parseAIResponse, parseDayPlan, parseTripIdeas } from '../../src/lib/ai-response-parser';

beforeAll(async () => { await i18n.init({ lng: 'de', fallbackLng: 'de', resources: {} }); });

describe('localized content module contracts', () => {
  it.each(['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'])('loads playable category/question/story arrays for %s', async language => {
    await i18n.changeLanguage(language);
    const categories = await getCategories();
    expect(categories.categories.length).toBeGreaterThan(0);
    expect(categories.generateCategoryPrompt().category).toEqual(expect.any(String));
    const questions = await getQuestions();
    expect(questions.length).toBeGreaterThan(0);
    expect(getSTORY_STARTERS().length).toBeGreaterThan(0);
    expect(getSTORY_PROMPTS().length).toBeGreaterThan(0);
  });
});

describe('Unicode emoji in AI content', () => {
  it.each(['🏎️', '🏖️', '⛰️', '🎉'])('parses %s as a whole header emoji without leaking a variation selector into the title', emoji => {
    const result = parseAIResponse(`### ${emoji} Group activity\nA fun activity for the entire group.`);
    expect(result.activities[0].title).toBe('Group activity');
    expect(result.activities[0].emoji).toBe(emoji);
  });
  it('removes the whole transport and warning emoji from itinerary field values', () => {
    const result = parseDayPlan('### 17:00 Arrival\n🚗 Transport: Taxi to hotel\n⚠️ Wichtig: Bring tickets');
    const block = result.days[0].timeBlocks[0];
    expect(block.transport).toBe('Taxi to hotel');
    expect(block.warnings).toContain('Bring tickets');
  });
  it.each(['✈️', '🗓️'])('strips a complete %s travel-time prefix', emoji => {
    const result = parseTripIdeas(`### 🎉 City weekend\n${emoji} Reisezeit: 2 hours`);
    expect(result.ideas[0].travelTime).toBe('2 hours');
  });
});
