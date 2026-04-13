/**
 * seedGameContent — imports ALL static game content into the Supabase game_content table.
 * Uses explicit static imports (not dynamic paths) for Vite compatibility.
 * Merges languages by matching content (emojis, term, name) not by array index.
 */
import { supabase } from '@/integrations/supabase/client';
import { clearGameContentCache } from '@/hooks/useGameContentCached';

type Item = {
  game_id: string;
  content_type: string;
  content: Record<string, Record<string, string>>;
  difficulty: string;
  category: string;
  tags: string[];
  is_active: true;
};

function getExport(mod: any, prefix: string): any[] {
  if (!mod) return [];
  const key = Object.keys(mod).find(k => k.toUpperCase().startsWith(prefix.toUpperCase()));
  return key ? mod[key] : [];
}

/**
 * Merge arrays by a key field instead of index. This prevents mismatches
 * when language files have items in different order or different counts.
 */
function mergeByKey(
  langMods: Record<string, any>,
  prefix: string,
  keyFn: (item: any) => string,
  mapFn: (item: any) => Record<string, string>,
  metaFn: (item: any) => { game_id: string; content_type: string; difficulty: string; category: string },
): Item[] {
  // Build map: key → { lang: data }
  const merged = new Map<string, { meta: ReturnType<typeof metaFn>; content: Record<string, Record<string, string>> }>();

  for (const [lang, mod] of Object.entries(langMods)) {
    const arr = getExport(mod, prefix);
    for (const item of arr) {
      const k = keyFn(item);
      if (!merged.has(k)) {
        merged.set(k, { meta: metaFn(item), content: {} });
      }
      merged.get(k)!.content[lang] = mapFn(item);
    }
  }

  return Array.from(merged.values()).map(({ meta, content }) => ({
    ...meta, content, tags: [], is_active: true as const,
  }));
}

export async function seedAllGameContent(
  onProgress: (msg: string) => void,
): Promise<number> {
  const items: Item[] = [];

  // ── 1. Questions (Bomb) ────────────────────────────────────────
  onProgress('Lade Fragen...');
  const qMods: Record<string, any> = {};
  qMods.de = await import('../../games/content/questions-de').catch(() => null);
  qMods.en = await import('../../games/content/questions-en').catch(() => null);
  qMods.es = await import('../../games/content/questions-es').catch(() => null);
  qMods.fr = await import('../../games/content/questions-fr').catch(() => null);
  qMods.it = await import('../../games/content/questions-it').catch(() => null);
  qMods.nl = await import('../../games/content/questions-nl').catch(() => null);
  qMods.pl = await import('../../games/content/questions-pl').catch(() => null);
  qMods.pt = await import('../../games/content/questions-pt').catch(() => null);
  qMods.tr = await import('../../games/content/questions-tr').catch(() => null);
  qMods.ar = await import('../../games/content/questions-ar').catch(() => null);
  items.push(...mergeByKey(qMods, 'QUIZ_QUESTIONS_',
    (q) => q.id,
    (q) => ({ question: q.question, answer1: q.answers[0], answer2: q.answers[1], answer3: q.answers[2], answer4: q.answers[3], correctIndex: String(q.correctIndex) }),
    (q) => ({ game_id: 'bomb', content_type: 'question', difficulty: q.difficulty || 'medium', category: q.category || 'general' }),
  ));

  // ── 2. Taboo ───────────────────────────────────────────────────
  onProgress('Lade Tabu-Karten...');
  const tMods: Record<string, any> = {};
  tMods.de = await import('../../games/content/taboo-words-de').catch(() => null);
  tMods.en = await import('../../games/content/taboo-words-en').catch(() => null);
  tMods.es = await import('../../games/content/taboo-words-es').catch(() => null);
  tMods.fr = await import('../../games/content/taboo-words-fr').catch(() => null);
  tMods.it = await import('../../games/content/taboo-words-it').catch(() => null);
  tMods.nl = await import('../../games/content/taboo-words-nl').catch(() => null);
  tMods.pl = await import('../../games/content/taboo-words-pl').catch(() => null);
  tMods.pt = await import('../../games/content/taboo-words-pt').catch(() => null);
  tMods.tr = await import('../../games/content/taboo-words-tr').catch(() => null);
  tMods.ar = await import('../../games/content/taboo-words-ar').catch(() => null);
  // Taboo uses index-based merge since term changes per language, but the DE term is the key
  const deTaboo = getExport(tMods.de, 'TABOO_CARDS_');
  for (let idx = 0; idx < deTaboo.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(tMods)) {
      const arr = getExport(mod, 'TABOO_CARDS_');
      const c = arr[idx];
      if (c) content[lang] = { term: c.term, forbidden1: c.forbidden[0], forbidden2: c.forbidden[1], forbidden3: c.forbidden[2], forbidden4: c.forbidden[3], forbidden5: c.forbidden[4] };
    }
    items.push({ game_id: 'taboo', content_type: 'taboo_card', content, difficulty: deTaboo[idx].difficulty || 'medium', category: deTaboo[idx].category || 'general', tags: [], is_active: true });
  }

  // ── 3. HeadUp ──────────────────────────────────────────────────
  onProgress('Lade Stirnraten...');
  const hMods: Record<string, any> = {};
  hMods.de = await import('../../games/content/headup-words-de').catch(() => null);
  hMods.en = await import('../../games/content/headup-words-en').catch(() => null);
  hMods.es = await import('../../games/content/headup-words-es').catch(() => null);
  hMods.fr = await import('../../games/content/headup-words-fr').catch(() => null);
  hMods.it = await import('../../games/content/headup-words-it').catch(() => null);
  hMods.nl = await import('../../games/content/headup-words-nl').catch(() => null);
  hMods.pl = await import('../../games/content/headup-words-pl').catch(() => null);
  hMods.pt = await import('../../games/content/headup-words-pt').catch(() => null);
  hMods.tr = await import('../../games/content/headup-words-tr').catch(() => null);
  hMods.ar = await import('../../games/content/headup-words-ar').catch(() => null);
  items.push(...mergeByKey(hMods, 'HEADUP_CATEGORIES_',
    (cat) => cat.id,
    (cat) => ({ word: cat.name, words: (cat.words || []).join(', ') }),
    (cat) => ({ game_id: 'headup', content_type: 'headup_word', difficulty: 'medium', category: cat.name || 'general' }),
  ));

  // ── 4. Categories ──────────────────────────────────────────────
  onProgress('Lade Kategorien...');
  const cMods: Record<string, any> = {};
  cMods.de = await import('../../games/content/categories-de').catch(() => null);
  cMods.en = await import('../../games/content/categories-en').catch(() => null);
  cMods.es = await import('../../games/content/categories-es').catch(() => null);
  cMods.fr = await import('../../games/content/categories-fr').catch(() => null);
  cMods.it = await import('../../games/content/categories-it').catch(() => null);
  cMods.nl = await import('../../games/content/categories-nl').catch(() => null);
  cMods.pl = await import('../../games/content/categories-pl').catch(() => null);
  cMods.pt = await import('../../games/content/categories-pt').catch(() => null);
  cMods.tr = await import('../../games/content/categories-tr').catch(() => null);
  cMods.ar = await import('../../games/content/categories-ar').catch(() => null);
  items.push(...mergeByKey(cMods, 'GAME_CATEGORIES_',
    (cat) => cat.id || cat.name,
    (cat) => ({ name: cat.name || cat.category, terms: (cat.terms || []).join(', ') }),
    (cat) => ({ game_id: 'category', content_type: 'category', difficulty: cat.difficulty || 'medium', category: cat.name || 'general' }),
  ));

  // ── 5. Emoji Guess ─────────────────────────────────────────────
  onProgress('Lade Emoji-Raten...');
  const eMods: Record<string, any> = {};
  eMods.de = await import('../../games/emojiguess/emoji-content-de').catch(() => null);
  eMods.en = await import('../../games/emojiguess/emoji-content-en').catch(() => null);
  eMods.es = await import('../../games/emojiguess/emoji-content-es').catch(() => null);
  eMods.fr = await import('../../games/emojiguess/emoji-content-fr').catch(() => null);
  eMods.it = await import('../../games/emojiguess/emoji-content-it').catch(() => null);
  eMods.nl = await import('../../games/emojiguess/emoji-content-nl').catch(() => null);
  eMods.pl = await import('../../games/emojiguess/emoji-content-pl').catch(() => null);
  eMods.pt = await import('../../games/emojiguess/emoji-content-pt').catch(() => null);
  eMods.tr = await import('../../games/emojiguess/emoji-content-tr').catch(() => null);
  eMods.ar = await import('../../games/emojiguess/emoji-content-ar').catch(() => null);
  items.push(...mergeByKey(eMods, 'EMOJI_PUZZLES',
    (p) => p.emojis, // emojis are the same across all languages — perfect key
    (p) => ({ emojis: p.emojis, answer: p.answer }),
    (p) => ({ game_id: 'emojiguess', content_type: 'emoji_puzzle', difficulty: String(p.difficulty || 1), category: p.category || 'general' }),
  ));

  // ── 6. Bottlespin ──────────────────────────────────────────────
  onProgress('Lade Flaschendrehen...');
  const bMods: Record<string, any> = {};
  bMods.de = await import('../../games/bottlespin/bottlespin-content-de').catch(() => null);
  bMods.en = await import('../../games/bottlespin/bottlespin-content-en').catch(() => null);
  bMods.es = await import('../../games/bottlespin/bottlespin-content-es').catch(() => null);
  bMods.fr = await import('../../games/bottlespin/bottlespin-content-fr').catch(() => null);
  bMods.it = await import('../../games/bottlespin/bottlespin-content-it').catch(() => null);
  bMods.nl = await import('../../games/bottlespin/bottlespin-content-nl').catch(() => null);
  bMods.pl = await import('../../games/bottlespin/bottlespin-content-pl').catch(() => null);
  bMods.pt = await import('../../games/bottlespin/bottlespin-content-pt').catch(() => null);
  bMods.tr = await import('../../games/bottlespin/bottlespin-content-tr').catch(() => null);
  bMods.ar = await import('../../games/bottlespin/bottlespin-content-ar').catch(() => null);
  // Bottlespin text differs per language — index merge with DE as anchor
  const deBottle = getExport(bMods.de, 'BOTTLE_');
  for (let idx = 0; idx < deBottle.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(bMods)) {
      const arr = getExport(mod, 'BOTTLE_');
      if (arr[idx]) content[lang] = { text: arr[idx].text, type: arr[idx].type || 'frage' };
    }
    items.push({ game_id: 'bottlespin', content_type: 'bottle_card', content, difficulty: 'medium', category: deBottle[idx].category || 'spass', tags: [], is_active: true });
  }

  // ── 7. Truth or Dare ───────────────────────────────────────────
  onProgress('Lade Wahrheit/Pflicht...');
  const tdMods: Record<string, any> = {};
  tdMods.de = await import('../../games/truthdare/truthdare-content-de').catch(() => null);
  tdMods.en = await import('../../games/truthdare/truthdare-content-en').catch(() => null);
  tdMods.es = await import('../../games/truthdare/truthdare-content-es').catch(() => null);
  tdMods.fr = await import('../../games/truthdare/truthdare-content-fr').catch(() => null);
  tdMods.it = await import('../../games/truthdare/truthdare-content-it').catch(() => null);
  tdMods.nl = await import('../../games/truthdare/truthdare-content-nl').catch(() => null);
  tdMods.pl = await import('../../games/truthdare/truthdare-content-pl').catch(() => null);
  tdMods.pt = await import('../../games/truthdare/truthdare-content-pt').catch(() => null);
  tdMods.tr = await import('../../games/truthdare/truthdare-content-tr').catch(() => null);
  tdMods.ar = await import('../../games/truthdare/truthdare-content-ar').catch(() => null);
  // Truths and Dares — index merge
  const deTruths = getExport(tdMods.de, 'TRUTH_');
  for (let idx = 0; idx < deTruths.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(tdMods)) {
      const arr = getExport(mod, 'TRUTH_');
      if (arr[idx]) content[lang] = { text: arr[idx].text };
    }
    items.push({ game_id: 'truthdare', content_type: 'truth', content, difficulty: String(deTruths[idx].intensity || 1), category: deTruths[idx].category || 'general', tags: [], is_active: true });
  }
  const deDares = getExport(tdMods.de, 'DARE_');
  for (let idx = 0; idx < deDares.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(tdMods)) {
      const arr = getExport(mod, 'DARE_');
      if (arr[idx]) content[lang] = { text: arr[idx].text };
    }
    items.push({ game_id: 'truthdare', content_type: 'dare', content, difficulty: String(deDares[idx].intensity || 1), category: deDares[idx].category || 'general', tags: [], is_active: true });
  }

  // ── 8. This or That ────────────────────────────────────────────
  onProgress('Lade This or That...');
  const totMods: Record<string, any> = {};
  totMods.de = await import('../../games/thisorthat/thisorthat-content-de').catch(() => null);
  totMods.en = await import('../../games/thisorthat/thisorthat-content-en').catch(() => null);
  totMods.es = await import('../../games/thisorthat/thisorthat-content-es').catch(() => null);
  totMods.fr = await import('../../games/thisorthat/thisorthat-content-fr').catch(() => null);
  totMods.it = await import('../../games/thisorthat/thisorthat-content-it').catch(() => null);
  totMods.nl = await import('../../games/thisorthat/thisorthat-content-nl').catch(() => null);
  totMods.pl = await import('../../games/thisorthat/thisorthat-content-pl').catch(() => null);
  totMods.pt = await import('../../games/thisorthat/thisorthat-content-pt').catch(() => null);
  totMods.tr = await import('../../games/thisorthat/thisorthat-content-tr').catch(() => null);
  totMods.ar = await import('../../games/thisorthat/thisorthat-content-ar').catch(() => null);
  // Index merge — pairs correspond by position
  const dePairs = getExport(totMods.de, 'THISORTHAT_');
  for (let idx = 0; idx < dePairs.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(totMods)) {
      const arr = getExport(mod, 'THISORTHAT_');
      if (arr[idx]) content[lang] = { optionA: arr[idx].optionA, optionB: arr[idx].optionB };
    }
    items.push({ game_id: 'thisorthat', content_type: 'pair', content, difficulty: 'medium', category: dePairs[idx].category || 'general', tags: [], is_active: true });
  }

  // ── 9. Who Am I ────────────────────────────────────────────────
  onProgress('Lade Wer bin ich...');
  const wMods: Record<string, any> = {};
  wMods.de = await import('../../games/whoami/whoami-content-de').catch(() => null);
  wMods.en = await import('../../games/whoami/whoami-content-en').catch(() => null);
  wMods.es = await import('../../games/whoami/whoami-content-es').catch(() => null);
  wMods.fr = await import('../../games/whoami/whoami-content-fr').catch(() => null);
  wMods.it = await import('../../games/whoami/whoami-content-it').catch(() => null);
  wMods.nl = await import('../../games/whoami/whoami-content-nl').catch(() => null);
  wMods.pl = await import('../../games/whoami/whoami-content-pl').catch(() => null);
  wMods.pt = await import('../../games/whoami/whoami-content-pt').catch(() => null);
  wMods.tr = await import('../../games/whoami/whoami-content-tr').catch(() => null);
  wMods.ar = await import('../../games/whoami/whoami-content-ar').catch(() => null);
  // Character names are often the same across languages — use name as key
  items.push(...mergeByKey(wMods, 'WHOAMI_',
    (c) => c.name,
    (c) => ({ name: c.name }),
    (c) => ({ game_id: 'whoami', content_type: 'character', difficulty: 'medium', category: c.category || 'general' }),
  ));

  // ── 10. Quick Draw ─────────────────────────────────────────────
  onProgress('Lade Schnellzeichner...');
  const qdMods: Record<string, any> = {};
  qdMods.de = await import('../../games/quickdraw/quickdraw-words-de').catch(() => null);
  qdMods.en = await import('../../games/quickdraw/quickdraw-words-en').catch(() => null);
  qdMods.es = await import('../../games/quickdraw/quickdraw-words-es').catch(() => null);
  qdMods.fr = await import('../../games/quickdraw/quickdraw-words-fr').catch(() => null);
  qdMods.it = await import('../../games/quickdraw/quickdraw-words-it').catch(() => null);
  qdMods.nl = await import('../../games/quickdraw/quickdraw-words-nl').catch(() => null);
  qdMods.pl = await import('../../games/quickdraw/quickdraw-words-pl').catch(() => null);
  qdMods.pt = await import('../../games/quickdraw/quickdraw-words-pt').catch(() => null);
  qdMods.tr = await import('../../games/quickdraw/quickdraw-words-tr').catch(() => null);
  qdMods.ar = await import('../../games/quickdraw/quickdraw-words-ar').catch(() => null);
  // Index merge for draw words
  const deDrawWords = getExport(qdMods.de, 'DRAW_WORDS');
  for (let idx = 0; idx < deDrawWords.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(qdMods)) {
      const arr = getExport(mod, 'DRAW_WORDS');
      if (arr[idx]) content[lang] = { word: arr[idx].word };
    }
    items.push({ game_id: 'quickdraw', content_type: 'draw_word', content, difficulty: String(deDrawWords[idx].difficulty || 1), category: deDrawWords[idx].category || 'general', tags: [], is_active: true });
  }

  // ── 11. Story Builder ──────────────────────────────────────────
  onProgress('Lade Story Builder...');
  const sbMods: Record<string, any> = {};
  sbMods.de = await import('../../games/storybuilder/story-prompts-de').catch(() => null);
  sbMods.en = await import('../../games/storybuilder/story-prompts-en').catch(() => null);
  sbMods.es = await import('../../games/storybuilder/story-prompts-es').catch(() => null);
  sbMods.fr = await import('../../games/storybuilder/story-prompts-fr').catch(() => null);
  sbMods.it = await import('../../games/storybuilder/story-prompts-it').catch(() => null);
  sbMods.nl = await import('../../games/storybuilder/story-prompts-nl').catch(() => null);
  sbMods.pl = await import('../../games/storybuilder/story-prompts-pl').catch(() => null);
  sbMods.pt = await import('../../games/storybuilder/story-prompts-pt').catch(() => null);
  sbMods.tr = await import('../../games/storybuilder/story-prompts-tr').catch(() => null);
  sbMods.ar = await import('../../games/storybuilder/story-prompts-ar').catch(() => null);
  const deStarters = sbMods.de?.STORY_STARTERS || getExport(sbMods.de, 'STORY_STARTERS') || [];
  for (let idx = 0; idx < deStarters.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(sbMods)) {
      const starters = mod?.STORY_STARTERS || getExport(mod, 'STORY_STARTERS') || [];
      const s = starters[idx];
      if (s) content[lang] = { text: typeof s === 'string' ? s : s.text };
    }
    items.push({ game_id: 'storybuilder', content_type: 'starter', content, difficulty: 'medium', category: 'general', tags: [], is_active: true });
  }

  // ── 12. Shared Quiz ────────────────────────────────────────────
  onProgress('Lade Geteilt & Gequizzt...');
  const sqMods: Record<string, any> = {};
  sqMods.de = await import('../../games/sharedquiz/sharedquiz-content-de').catch(() => null);
  sqMods.en = await import('../../games/sharedquiz/sharedquiz-content-en').catch(() => null);
  sqMods.es = await import('../../games/sharedquiz/sharedquiz-content-es').catch(() => null);
  sqMods.fr = await import('../../games/sharedquiz/sharedquiz-content-fr').catch(() => null);
  sqMods.it = await import('../../games/sharedquiz/sharedquiz-content-it').catch(() => null);
  sqMods.nl = await import('../../games/sharedquiz/sharedquiz-content-nl').catch(() => null);
  sqMods.pl = await import('../../games/sharedquiz/sharedquiz-content-pl').catch(() => null);
  sqMods.pt = await import('../../games/sharedquiz/sharedquiz-content-pt').catch(() => null);
  sqMods.tr = await import('../../games/sharedquiz/sharedquiz-content-tr').catch(() => null);
  sqMods.ar = await import('../../games/sharedquiz/sharedquiz-content-ar').catch(() => null);
  const deSQ = getExport(sqMods.de, 'SHARED_QUIZ_');
  for (let idx = 0; idx < deSQ.length; idx++) {
    const content: Record<string, Record<string, string>> = {};
    for (const [lang, mod] of Object.entries(sqMods)) {
      const arr = getExport(mod, 'SHARED_QUIZ_');
      const q = arr[idx];
      if (q) content[lang] = { question: q.question, answer1: q.answers?.[0] || '', answer2: q.answers?.[1] || '', answer3: q.answers?.[2] || '', answer4: q.answers?.[3] || '', correctIndex: String(q.correctIndex || 0), hint: q.hint || '' };
    }
    items.push({ game_id: 'sharedquiz', content_type: 'shared_question', content, difficulty: 'medium', category: deSQ[idx].category || 'general', tags: [], is_active: true });
  }

  // ── 13. Fake or Fact (DE only) ─────────────────────────────────
  onProgress('Lade Fake or Fact...');
  try {
    const ffMod = await import('../../games/fakeorfact/fakeorfact-content-de');
    const facts = ffMod.FACTS || getExport(ffMod, 'FACTS') || [];
    for (const f of facts) {
      items.push({
        game_id: 'fakeorfact', content_type: 'fact',
        content: { de: { statement: f.statement, isTrue: String(f.isTrue), explanation: f.explanation || '' } },
        difficulty: 'medium', category: f.category || 'general', tags: [], is_active: true,
      });
    }
  } catch { /* no fakeorfact */ }

  // ── 14. Wo ist was? (Geo + StreetView Locations) ────────────────
  onProgress('Lade Wo ist was?...');
  try {
    const geoMod = await import('../../games/findit/geo-locations');
    const svMod = await import('../../games/findit/streetview-locations');

    // Geo locations
    for (const loc of (geoMod.GEO_LOCATIONS || [])) {
      items.push({
        game_id: 'wo-ist-was', content_type: 'location',
        content: { de: { name: loc.name, lat: String(loc.lat), lng: String(loc.lng), type: loc.type } },
        difficulty: 'medium', category: loc.type === 'city' ? 'Städte' : 'Länder',
        tags: [], is_active: true,
      });
    }

    // StreetView locations
    for (const loc of (svMod.STREETVIEW_LOCATIONS || [])) {
      items.push({
        game_id: 'wo-ist-was', content_type: 'location',
        content: { de: { name: `${loc.city}, ${loc.country}`, lat: String(loc.lat), lng: String(loc.lng), type: 'streetview' } },
        difficulty: 'medium', category: 'Sehenswürdigkeiten',
        tags: loc.hint ? [loc.hint] : [], is_active: true,
      });
    }
  } catch { /* no findit content */ }

  onProgress(`${items.length} Einträge werden gespeichert...`);

  // Insert in batches
  const BATCH = 50;
  let ok = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { error } = await (supabase.from as any)('game_content').insert(batch);
    if (!error) ok += batch.length;
    else console.warn(`Batch ${Math.floor(i / BATCH) + 1}:`, error.message);
  }

  clearGameContentCache();
  return ok;
}
