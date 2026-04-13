/**
 * seedGameContent — imports ALL static game content (11 games × 10 languages)
 * into the Supabase game_content table. Called from AdminGames UI.
 */
import { supabase } from '@/integrations/supabase/client';
import { clearGameContentCache } from '@/hooks/useGameContentCached';

const LANG_CODES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'] as const;

type ContentItem = {
  game_id: string;
  content_type: string;
  content: Record<string, Record<string, string>>;
  difficulty: string;
  category: string;
  tags: string[];
  is_active: true;
};

function getArr(mod: any, prefix: string): any[] {
  if (!mod) return [];
  const key = Object.keys(mod).find(k => k.toUpperCase().startsWith(prefix.toUpperCase()));
  return key ? mod[key] : [];
}

async function loadLangModules(pathTemplate: string): Promise<(any | null)[]> {
  return Promise.all(LANG_CODES.map(l =>
    import(/* @vite-ignore */ pathTemplate.replace('*', l)).catch(() => null)
  ));
}

function mergeByIndex(
  mods: (any | null)[],
  prefix: string,
  mapFn: (item: any, lang: string) => Record<string, string>,
  metaFn: (deItem: any) => { game_id: string; content_type: string; difficulty: string; category: string },
): ContentItem[] {
  const deItems = getArr(mods[0], prefix);
  const items: ContentItem[] = [];
  for (let idx = 0; idx < deItems.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (let li = 0; li < LANG_CODES.length; li++) {
      const arr = getArr(mods[li], prefix);
      if (arr[idx]) content[LANG_CODES[li]] = mapFn(arr[idx], LANG_CODES[li]);
    }
    const meta = metaFn(deItems[idx]);
    items.push({ ...meta, content, tags: [], is_active: true });
  }
  return items;
}

export async function seedAllGameContent(
  onProgress: (msg: string) => void,
): Promise<number> {
  const items: ContentItem[] = [];

  // 1. Questions (Bomb + SplitQuiz)
  onProgress('Lade Fragen...');
  const qMods = await loadLangModules('../../games/content/questions-*.ts');
  items.push(...mergeByIndex(qMods, 'QUIZ_QUESTIONS_', (q) => ({
    question: q.question, answer1: q.answers[0], answer2: q.answers[1],
    answer3: q.answers[2], answer4: q.answers[3], correctIndex: String(q.correctIndex),
  }), (q) => ({ game_id: 'bomb', content_type: 'question', difficulty: q.difficulty || 'medium', category: q.category || 'general' })));

  // 2. Taboo
  onProgress('Lade Tabu-Karten...');
  const tMods = await loadLangModules('../../games/content/taboo-words-*.ts');
  items.push(...mergeByIndex(tMods, 'TABOO_CARDS_', (c) => ({
    term: c.term, forbidden1: c.forbidden[0], forbidden2: c.forbidden[1],
    forbidden3: c.forbidden[2], forbidden4: c.forbidden[3], forbidden5: c.forbidden[4],
  }), (c) => ({ game_id: 'taboo', content_type: 'taboo_card', difficulty: c.difficulty || 'medium', category: c.category || 'general' })));

  // 3. HeadUp
  onProgress('Lade Stirnraten...');
  const hMods = await loadLangModules('../../games/content/headup-words-*.ts');
  items.push(...mergeByIndex(hMods, 'HEADUP_CATEGORIES_', (cat) => ({
    word: cat.name, category: cat.name, words: (cat.words || []).join(', '),
  }), (cat) => ({ game_id: 'headup', content_type: 'headup_word', difficulty: 'medium', category: cat.name || 'general' })));

  // 4. Categories
  onProgress('Lade Kategorien...');
  const cMods = await loadLangModules('../../games/content/categories-*.ts');
  items.push(...mergeByIndex(cMods, 'GAME_CATEGORIES_', (cat) => ({
    name: cat.name || cat.category, terms: (cat.terms || []).join(', '),
  }), (cat) => ({ game_id: 'category', content_type: 'category', difficulty: cat.difficulty || 'medium', category: cat.name || 'general' })));

  // 5. Bottlespin
  onProgress('Lade Flaschendrehen...');
  const bMods = await loadLangModules('../../games/bottlespin/bottlespin-content-*.ts');
  items.push(...mergeByIndex(bMods, 'BOTTLE_', (c) => ({
    text: c.text, type: c.type || 'frage',
  }), (c) => ({ game_id: 'bottlespin', content_type: 'bottle_card', difficulty: 'medium', category: c.category || 'spass' })));

  // 6. Truth or Dare
  onProgress('Lade Wahrheit/Pflicht...');
  const tdMods = await loadLangModules('../../games/truthdare/truthdare-content-*.ts');
  for (let li = 0; li < LANG_CODES.length; li++) {
    const mod = tdMods[li]; if (!mod) continue;
    const truths = getArr(mod, 'TRUTH_');
    const dares = getArr(mod, 'DARE_');
    if (li === 0) {
      // Create items from DE
      for (const t of truths) items.push({ game_id: 'truthdare', content_type: 'truth', content: { [LANG_CODES[li]]: { text: t.text } }, difficulty: String(t.intensity || 1), category: t.category || 'general', tags: [], is_active: true });
      for (const d of dares) items.push({ game_id: 'truthdare', content_type: 'dare', content: { [LANG_CODES[li]]: { text: d.text } }, difficulty: String(d.intensity || 1), category: d.category || 'general', tags: [], is_active: true });
    } else {
      // Merge other languages by index
      const tdStart = items.findIndex(i => i.game_id === 'truthdare' && i.content_type === 'truth');
      for (let idx = 0; idx < truths.length && tdStart + idx < items.length; idx++) {
        if (items[tdStart + idx]) items[tdStart + idx].content[LANG_CODES[li]] = { text: truths[idx].text };
      }
      const dStart = items.findIndex(i => i.game_id === 'truthdare' && i.content_type === 'dare');
      for (let idx = 0; idx < dares.length && dStart + idx < items.length; idx++) {
        if (items[dStart + idx]) items[dStart + idx].content[LANG_CODES[li]] = { text: dares[idx].text };
      }
    }
  }

  // 7. This or That
  onProgress('Lade This or That...');
  const totMods = await loadLangModules('../../games/thisorthat/thisorthat-content-*.ts');
  items.push(...mergeByIndex(totMods, 'THIS_OR_THAT_', (p) => ({
    optionA: p.optionA, optionB: p.optionB,
  }), (p) => ({ game_id: 'thisorthat', content_type: 'pair', difficulty: 'medium', category: p.category || 'general' })));

  // 8. Who Am I
  onProgress('Lade Wer bin ich...');
  const wMods = await loadLangModules('../../games/whoami/whoami-content-*.ts');
  items.push(...mergeByIndex(wMods, 'WHO_AM_I_', (c) => ({
    name: c.name,
  }), (c) => ({ game_id: 'whoami', content_type: 'character', difficulty: 'medium', category: c.category || 'general' })));

  // 9. Emoji Guess
  onProgress('Lade Emoji-Raten...');
  const eMods = await loadLangModules('../../games/emojiguess/emoji-content-*.ts');
  items.push(...mergeByIndex(eMods, 'EMOJI_', (p) => ({
    emojis: p.emojis, answer: p.answer,
  }), (p) => ({ game_id: 'emojiguess', content_type: 'emoji_puzzle', difficulty: String(p.difficulty || 1), category: p.category || 'general' })));

  // 10. Quick Draw
  onProgress('Lade Schnellzeichner...');
  const qdMods = await loadLangModules('../../games/quickdraw/quickdraw-words-*.ts');
  items.push(...mergeByIndex(qdMods, 'DRAW_WORDS_', (w) => ({
    word: w.word,
  }), (w) => ({ game_id: 'quickdraw', content_type: 'draw_word', difficulty: String(w.difficulty || 1), category: w.category || 'general' })));

  // 11. Story Builder
  onProgress('Lade Story Builder...');
  const sbMods = await loadLangModules('../../games/storybuilder/story-prompts-*.ts');
  const deStarters = getArr(sbMods[0], 'STORY_STARTERS') || sbMods[0]?.STORY_STARTERS || [];
  for (let idx = 0; idx < deStarters.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (let li = 0; li < LANG_CODES.length; li++) {
      const starters = getArr(sbMods[li], 'STORY_STARTERS') || sbMods[li]?.STORY_STARTERS || [];
      if (starters[idx]) content[LANG_CODES[li]] = { text: typeof starters[idx] === 'string' ? starters[idx] : starters[idx].text };
    }
    items.push({ game_id: 'storybuilder', content_type: 'starter', content, difficulty: 'medium', category: 'general', tags: [], is_active: true });
  }

  // 12. Shared Quiz
  onProgress('Lade Geteilt & Gequizzt...');
  const sqMods = await loadLangModules('../../games/sharedquiz/sharedquiz-content-*.ts');
  items.push(...mergeByIndex(sqMods, 'SHARED_QUIZ_', (q) => ({
    question: q.question, answer1: q.answers?.[0] || '', answer2: q.answers?.[1] || '',
    answer3: q.answers?.[2] || '', answer4: q.answers?.[3] || '',
    correctIndex: String(q.correctIndex || 0), hint: q.hint || '',
  }), (q) => ({ game_id: 'sharedquiz', content_type: 'shared_question', difficulty: 'medium', category: q.category || 'general' })));

  // 13. Fake or Fact (DE only)
  onProgress('Lade Fake or Fact...');
  try {
    const ffMod = await import('../../games/fakeorfact/fakeorfact-content-de.ts');
    const facts = getArr(ffMod, 'FACTS_') || getArr(ffMod, 'FAKE_OR_FACT_');
    for (const f of facts) {
      items.push({
        game_id: 'fakeorfact', content_type: 'fact',
        content: { de: { statement: f.statement, isTrue: String(f.isTrue), explanation: f.explanation || '' } },
        difficulty: 'medium', category: f.category || 'general', tags: [], is_active: true,
      });
    }
  } catch { /* no fakeorfact content */ }

  onProgress(`${items.length} Einträge werden importiert...`);

  // Insert in batches of 50
  const BATCH = 50;
  let ok = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { error } = await (supabase.from as any)('game_content').insert(batch);
    if (!error) ok += batch.length;
    else console.warn(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
  }

  clearGameContentCache();
  return ok;
}
