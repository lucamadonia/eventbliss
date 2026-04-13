/**
 * generate-sql.cjs — Generates SQL INSERT files for all game content.
 * Reads static TypeScript content files, merges 10 languages per entry,
 * and writes ready-to-execute SQL files for Supabase.
 *
 * Usage: node scripts/generate-sql.cjs
 */
const fs = require('fs');
const path = require('path');

const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];
const SQL_DIR = path.join(__dirname, 'sql');

// Helper: extract exported array from .ts file content
function extractArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove TypeScript types and interface declarations
  content = content.replace(/export\s+interface\s+\w+\s*\{[^}]*\}/g, '');
  content = content.replace(/export\s+type\s+[^;]+;/g, '');
  content = content.replace(/:\s*(string|number|boolean|1\s*\|\s*2\s*\|\s*3|'[^']*'(\s*\|\s*'[^']*')*)\s*;/g, ',');
  content = content.replace(/:\s*(string|number|boolean)\[\]\s*;/g, ',');
  content = content.replace(/:\s*\w+\[\]\s*=/g, ' =');
  content = content.replace(/:\s*\w+\s*=/g, ' =');
  content = content.replace(/export const \w+/g, 'const _arr');

  // Find the array content
  const match = content.match(/const\s+_arr\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    // Try string array (story starters)
    const strMatch = content.match(/const\s+_arr\s*=\s*(\[[\s\S]*?\]);/);
    if (!strMatch) return [];
  }

  try {
    // Use eval with some safety — these are known static files
    const arrStr = match[1]
      .replace(/'/g, '"')  // Convert single to double quotes
      .replace(/,\s*\]/g, ']')  // Remove trailing commas
      .replace(/,\s*\}/g, '}')
      .replace(/(\w+)\s*:/g, '"$1":')  // Quote keys
      .replace(/"(\w+)""/g, '"$1"')  // Fix double-quoted
      .replace(/\\\'/g, "'");

    return JSON.parse(arrStr);
  } catch (e) {
    // Fallback: regex-based extraction
    return extractWithRegex(match[1]);
  }
}

function extractWithRegex(arrStr) {
  const items = [];
  // Match objects like { key: 'val', key2: 'val2' }
  const objRegex = /\{\s*([^}]+)\s*\}/g;
  let m;
  while ((m = objRegex.exec(arrStr)) !== null) {
    const obj = {};
    const propRegex = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\d+(?:\.\d+)?)|(\[[^\]]*\])|(true|false))/g;
    let pm;
    while ((pm = propRegex.exec(m[1])) !== null) {
      const key = pm[1];
      const val = pm[2] || pm[3] || pm[4] || pm[5] || pm[6];
      if (pm[5]) {
        // Array value
        const arrItems = pm[5].replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        obj[key] = arrItems;
      } else if (pm[4]) {
        obj[key] = parseFloat(pm[4]);
      } else if (pm[6]) {
        obj[key] = pm[6] === 'true';
      } else {
        obj[key] = val;
      }
    }
    if (Object.keys(obj).length > 0) items.push(obj);
  }

  // If no objects found, try string array
  if (items.length === 0) {
    const strRegex = /(?:'([^']*)'|"([^"]*)")/g;
    let sm;
    while ((sm = strRegex.exec(arrStr)) !== null) {
      const val = sm[1] || sm[2];
      if (val && val.length > 5) items.push(val);
    }
  }

  return items;
}

function escSQL(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function contentToJSON(langData) {
  const obj = {};
  for (const [lang, data] of Object.entries(langData)) {
    if (data && Object.keys(data).length > 0) {
      const clean = {};
      for (const [k, v] of Object.entries(data)) {
        clean[k] = v;
      }
      obj[lang] = clean;
    }
  }
  return JSON.stringify(obj).replace(/'/g, "''");
}

function writeSQL(filename, gameId, contentType, entries) {
  const fp = path.join(SQL_DIR, filename);
  let sql = `-- ${filename} — ${entries.length} entries\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Languages: ${LANGS.join(', ')}\n\n`;
  sql += `DELETE FROM game_content WHERE game_id = '${gameId}' AND content_type = '${contentType}';\n\n`;

  for (const entry of entries) {
    const jsonStr = contentToJSON(entry.content);
    sql += `INSERT INTO game_content (game_id, content_type, content, difficulty, category, is_active) VALUES ('${gameId}', '${contentType}', '${jsonStr}', '${escSQL(entry.difficulty)}', '${escSQL(entry.category)}', true);\n`;
  }

  fs.writeFileSync(fp, sql, 'utf8');
  console.log(`  ✅ ${filename}: ${entries.length} entries`);
}

// ═══════════════════════════════════════════════════════════════════
//  GAME GENERATORS
// ═══════════════════════════════════════════════════════════════════

function generateQuestions() {
  const entries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', 'content', `questions-${lang}.ts`);
    langFiles[lang] = extractArray(fp);
  }
  const deItems = langFiles.de;
  for (let i = 0; i < deItems.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const q = (langFiles[lang] || [])[i];
      if (q) {
        content[lang] = {
          question: q.question,
          answer1: Array.isArray(q.answers) ? q.answers[0] : q.answer1 || '',
          answer2: Array.isArray(q.answers) ? q.answers[1] : q.answer2 || '',
          answer3: Array.isArray(q.answers) ? q.answers[2] : q.answer3 || '',
          answer4: Array.isArray(q.answers) ? q.answers[3] : q.answer4 || '',
          correctIndex: String(q.correctIndex || 0),
        };
      }
    }
    entries.push({ content, difficulty: deItems[i].difficulty || 'medium', category: deItems[i].category || 'general' });
  }
  writeSQL('01_bomb.sql', 'bomb', 'question', entries);
}

function generateTaboo() {
  const entries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', 'content', `taboo-words-${lang}.ts`);
    langFiles[lang] = extractArray(fp);
  }
  const deItems = langFiles.de;
  for (let i = 0; i < deItems.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const c = (langFiles[lang] || [])[i];
      if (c) {
        const forbidden = Array.isArray(c.forbidden) ? c.forbidden : [c.forbidden1, c.forbidden2, c.forbidden3, c.forbidden4, c.forbidden5].filter(Boolean);
        content[lang] = { term: c.term, forbidden1: forbidden[0] || '', forbidden2: forbidden[1] || '', forbidden3: forbidden[2] || '', forbidden4: forbidden[3] || '', forbidden5: forbidden[4] || '' };
      }
    }
    entries.push({ content, difficulty: deItems[i].difficulty || 'medium', category: deItems[i].category || 'general' });
  }
  writeSQL('02_taboo.sql', 'taboo', 'taboo_card', entries);
}

function generateHeadUp() {
  const entries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', 'content', `headup-words-${lang}.ts`);
    langFiles[lang] = extractArray(fp);
  }
  const deItems = langFiles.de;
  for (let i = 0; i < deItems.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const cat = (langFiles[lang] || [])[i];
      if (cat) {
        const words = Array.isArray(cat.words) ? cat.words.join(', ') : (cat.words || '');
        content[lang] = { word: cat.name || cat.id, category: cat.name || cat.id, words };
      }
    }
    entries.push({ content, difficulty: 'medium', category: (deItems[i].name || deItems[i].id || 'general') });
  }
  writeSQL('03_headup.sql', 'headup', 'headup_word', entries);
}

function generateSimpleGame(num, gameId, contentType, folder, filePrefix, exportPrefix, mapFn, catFn) {
  const entries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', folder, `${filePrefix}-${lang}.ts`);
    langFiles[lang] = extractArray(fp);
  }
  const deItems = langFiles.de;
  if (deItems.length === 0) {
    console.log(`  ⚠️  ${num}_${gameId}.sql: No DE content found`);
    return;
  }
  for (let i = 0; i < deItems.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const item = (langFiles[lang] || [])[i];
      if (item) content[lang] = mapFn(item);
    }
    entries.push({ content, difficulty: deItems[i].difficulty || deItems[i].intensity || 'medium', category: catFn(deItems[i]) });
  }
  writeSQL(`${num}_${gameId}.sql`, gameId, contentType, entries);
}

// ═══════════════════════════════════════════════════════════════════

console.log('\n🎮 Generating SQL files for all games...\n');

// 01: Bomb (Questions)
generateQuestions();

// 02: Taboo
generateTaboo();

// 03: HeadUp
generateHeadUp();

// 04: Categories
generateSimpleGame('04', 'category', 'category', 'content', 'categories', 'GAME_CATEGORIES',
  (c) => ({ name: c.name || c.category, terms: Array.isArray(c.terms) ? c.terms.join(', ') : (c.terms || '') }),
  (c) => c.name || 'general'
);

// 05: Emoji Guess
generateSimpleGame('05', 'emojiguess', 'emoji_puzzle', 'emojiguess', 'emoji-content', 'EMOJI',
  (p) => ({ emojis: p.emojis, answer: p.answer }),
  (p) => p.category || 'general'
);

// 06: Fake or Fact (DE only likely)
generateSimpleGame('06', 'fakeorfact', 'fact', 'fakeorfact', 'fakeorfact-content', 'FACTS',
  (f) => ({ statement: f.statement, isTrue: String(f.isTrue), explanation: f.explanation || '' }),
  (f) => f.category || 'general'
);

// 07: Truth or Dare — needs special handling (2 content types)
{
  const truthEntries = [];
  const dareEntries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', 'truthdare', `truthdare-content-${lang}.ts`);
    const content = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
    // Extract TRUTH and DARE arrays separately
    const truthMatch = content.match(/(?:TRUTH_QUESTIONS|TRUTHS)\s*(?::\s*\w+\[\])?\s*=\s*(\[[\s\S]*?\]);/);
    const dareMatch = content.match(/(?:DARE_CHALLENGES|DARES)\s*(?::\s*\w+\[\])?\s*=\s*(\[[\s\S]*?\]);/);
    langFiles[lang] = {
      truths: truthMatch ? extractWithRegex(truthMatch[1]) : [],
      dares: dareMatch ? extractWithRegex(dareMatch[1]) : [],
    };
  }
  const deTruths = langFiles.de.truths;
  const deDares = langFiles.de.dares;
  for (let i = 0; i < deTruths.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const t = (langFiles[lang].truths || [])[i];
      if (t) content[lang] = { text: t.text };
    }
    truthEntries.push({ content, difficulty: String(deTruths[i].intensity || 1), category: deTruths[i].category || 'general' });
  }
  for (let i = 0; i < deDares.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const d = (langFiles[lang].dares || [])[i];
      if (d) content[lang] = { text: d.text };
    }
    dareEntries.push({ content, difficulty: String(deDares[i].intensity || 1), category: deDares[i].category || 'general' });
  }
  // Write combined file
  const fp = path.join(SQL_DIR, '07_truthdare.sql');
  let sql = `-- 07_truthdare.sql — ${truthEntries.length} truths + ${dareEntries.length} dares\n`;
  sql += `DELETE FROM game_content WHERE game_id = 'truthdare';\n\n`;
  sql += `-- TRUTHS\n`;
  for (const e of truthEntries) {
    sql += `INSERT INTO game_content (game_id, content_type, content, difficulty, category, is_active) VALUES ('truthdare', 'truth', '${contentToJSON(e.content)}', '${e.difficulty}', '${escSQL(e.category)}', true);\n`;
  }
  sql += `\n-- DARES\n`;
  for (const e of dareEntries) {
    sql += `INSERT INTO game_content (game_id, content_type, content, difficulty, category, is_active) VALUES ('truthdare', 'dare', '${contentToJSON(e.content)}', '${e.difficulty}', '${escSQL(e.category)}', true);\n`;
  }
  fs.writeFileSync(fp, sql, 'utf8');
  console.log(`  ✅ 07_truthdare.sql: ${truthEntries.length} truths + ${dareEntries.length} dares`);
}

// 08: This or That
generateSimpleGame('08', 'thisorthat', 'pair', 'thisorthat', 'thisorthat-content', 'THISORTHAT',
  (p) => ({ optionA: p.optionA, optionB: p.optionB }),
  (p) => p.category || 'general'
);

// 09: Who Am I
generateSimpleGame('09', 'whoami', 'character', 'whoami', 'whoami-content', 'WHOAMI',
  (c) => ({ name: c.name, category: c.category }),
  (c) => c.category || 'general'
);

// 10: Bottlespin
generateSimpleGame('10', 'bottlespin', 'bottle_card', 'bottlespin', 'bottlespin-content', 'BOTTLE',
  (c) => ({ text: c.text, type: c.type || 'frage' }),
  (c) => c.category || 'spass'
);

// 11: Story Builder
{
  const entries = [];
  const langFiles = {};
  for (const lang of LANGS) {
    const fp = path.join(__dirname, '..', 'src', 'games', 'storybuilder', `story-prompts-${lang}.ts`);
    if (!fs.existsSync(fp)) { langFiles[lang] = []; continue; }
    const content = fs.readFileSync(fp, 'utf8');
    const match = content.match(/STORY_STARTERS(?:_\w+)?\s*(?::\s*string\[\])?\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      const strs = [];
      const strRegex = /(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)")/g;
      let sm;
      while ((sm = strRegex.exec(match[1])) !== null) {
        const val = (sm[1] || sm[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"');
        if (val.length > 5) strs.push(val);
      }
      langFiles[lang] = strs;
    } else {
      langFiles[lang] = [];
    }
  }
  const deStarters = langFiles.de;
  for (let i = 0; i < deStarters.length; i++) {
    const content = {};
    for (const lang of LANGS) {
      const s = (langFiles[lang] || [])[i];
      if (s) content[lang] = { text: s };
    }
    entries.push({ content, difficulty: 'medium', category: 'general' });
  }
  writeSQL('11_storybuilder.sql', 'storybuilder', 'starter', entries);
}

// 12: Shared Quiz
generateSimpleGame('12', 'sharedquiz', 'shared_question', 'sharedquiz', 'sharedquiz-content', 'SHARED_QUIZ',
  (q) => ({ question: q.question, answer1: Array.isArray(q.answers) ? q.answers[0] : '', answer2: Array.isArray(q.answers) ? q.answers[1] : '', answer3: Array.isArray(q.answers) ? q.answers[2] : '', answer4: Array.isArray(q.answers) ? q.answers[3] : '', correctIndex: String(q.correctIndex || 0), hint: q.hint || '' }),
  (q) => q.category || 'general'
);

// 13: Quick Draw
generateSimpleGame('13', 'quickdraw', 'draw_word', 'quickdraw', 'quickdraw-words', 'DRAW_WORDS',
  (w) => ({ word: w.word || w }),
  (w) => w.category || 'general'
);

// 14: Split Quiz — same as bomb questions
{
  const fp = path.join(SQL_DIR, '14_splitquiz.sql');
  fs.writeFileSync(fp, `-- 14_splitquiz.sql\n-- Split Quiz uses the same questions as Bomb (01_bomb.sql)\n-- No separate content needed — the game reads from content_type = 'question'\n-- If you want separate entries, copy 01_bomb.sql and change game_id to 'splitquiz'\n`, 'utf8');
  console.log(`  ℹ️  14_splitquiz.sql: References bomb questions`);
}

// 15: Hochstapler
{
  const fp2 = path.join(__dirname, '..', 'src', 'games', 'impostor', 'impostor-words.ts');
  if (fs.existsSync(fp2)) {
    const content = fs.readFileSync(fp2, 'utf8');
    const langArrays = {};
    for (const lang of LANGS) {
      const suffix = lang.toUpperCase();
      const regex = new RegExp(`IMPOSTOR_WORDS_${suffix}\\s*(?::\\s*\\w+\\[\\])?\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
      const match = content.match(regex);
      langArrays[lang] = match ? extractWithRegex(match[1]) : [];
    }
    const deWords = langArrays.de;
    const entries = [];
    for (let i = 0; i < deWords.length; i++) {
      const langContent = {};
      for (const lang of LANGS) {
        const w = (langArrays[lang] || [])[i];
        if (w) langContent[lang] = { word: w.word, category: w.category };
      }
      entries.push({ content: langContent, difficulty: 'medium', category: deWords[i].category || 'general' });
    }
    writeSQL('15_hochstapler.sql', 'hochstapler', 'word_set', entries);
  } else {
    console.log(`  ⚠️  15_hochstapler.sql: impostor-words.ts not found`);
  }
}

// 16: Wo ist was
{
  const entries = [];
  const geoFp = path.join(__dirname, '..', 'src', 'games', 'findit', 'geo-locations.ts');
  const svFp = path.join(__dirname, '..', 'src', 'games', 'findit', 'streetview-locations.ts');

  if (fs.existsSync(geoFp)) {
    const geoItems = extractWithRegex(fs.readFileSync(geoFp, 'utf8'));
    for (const loc of geoItems) {
      if (loc.name && loc.lat && loc.lng) {
        entries.push({
          content: { de: { name: loc.name, lat: String(loc.lat), lng: String(loc.lng), type: loc.type || 'city' } },
          difficulty: 'medium',
          category: loc.type === 'country' ? 'Länder' : 'Städte',
        });
      }
    }
  }
  if (fs.existsSync(svFp)) {
    const svItems = extractWithRegex(fs.readFileSync(svFp, 'utf8'));
    for (const loc of svItems) {
      if (loc.city && loc.lat && loc.lng) {
        entries.push({
          content: { de: { name: `${loc.city}, ${loc.country}`, lat: String(loc.lat), lng: String(loc.lng), type: 'streetview' } },
          difficulty: 'medium',
          category: 'Sehenswürdigkeiten',
        });
      }
    }
  }
  writeSQL('16_wo-ist-was.sql', 'wo-ist-was', 'location', entries);
}

// 17: Flaschendrehen = bottlespin
{
  const fp = path.join(SQL_DIR, '17_flaschendrehen.sql');
  fs.writeFileSync(fp, `-- 17_flaschendrehen.sql\n-- Flaschendrehen uses the same content as Bottlespin (10_bottlespin.sql)\n-- If you want separate entries, copy 10_bottlespin.sql and change game_id to 'flaschendrehen'\n`, 'utf8');
  console.log(`  ℹ️  17_flaschendrehen.sql: References bottlespin`);
}

console.log('\n✅ Done! SQL files generated in scripts/sql/\n');
