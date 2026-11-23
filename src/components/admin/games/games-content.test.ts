import { describe, it, expect } from 'vitest';
import { playableGames } from '@/lib/playable-games';
import { detectDelimiter, parseCsv, toCsv } from './csv';
import {
  buildFilterOps, buildMissingLangExpr, buildSearchExpr, pageCount, pageRange, sanitizeSearchTerm,
} from './query-builder';
import {
  CONTENT_TYPES_BY_DB_ID, EDITOR_ROUTES, LEGACY_ID_MAP, LIVE_PAIRS, allContentPairs, appIdForDbId,
  buildHubGames, canCreateContent, contentTypesForApp, dbIdForAppId, filterHubGames, isLivePair, resolveGameStatus,
} from './game-registry';
import { buildImportPreview, buildTemplateCsv, detectFormat, primaryKey } from './import-rows';
import { hasErrors, normalizeContent, toEditableContent, validateContent } from './validation';
import { FIELD_CONFIGS, langCoverage, previewText } from './field-configs';
import {
  EMPTY_FILTERS, LIST_PARAM_KEYS, activeFilterCount, listStateFromParams, listStateToParams,
} from './list-filters';
import {
  buildDefaultItems, hasDefaultContent, mergeQuestions, mergeTaboo, selectMissing,
} from '@/pages/admin/seedGameContent';

const BOM = String.fromCharCode(0xfeff);

describe('csv', () => {
  it('liest Anführungszeichen, eingebettete Trenner, doppelte Quotes und Zeilenumbrüche im Feld', () => {
    const { rows } = parseCsv('a;b;c\r\n"x;1";"sagt ""hi""";"zeile1\nzeile2"\r\n');
    expect(rows).toEqual([['a', 'b', 'c'], ['x;1', 'sagt "hi"', 'zeile1\nzeile2']]);
  });

  it('entfernt das BOM und kommt mit CRLF, LF und CR zurecht', () => {
    expect(parseCsv(`${BOM}a,b\r\n1,2\n3,4\r5,6`).rows).toEqual([['a', 'b'], ['1', '2'], ['3', '4'], ['5', '6']]);
  });

  it('erkennt das Trennzeichen an der Kopfzeile und ignoriert Trenner in Quotes', () => {
    expect(detectDelimiter('"a,b,c,d";x;y')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('nur-eine-spalte')).toBe(',');
  });

  it('behält leere Felder und überspringt völlig leere Zeilen', () => {
    expect(parseCsv('a;b;c\n;;\n\n1;;3\n').rows).toEqual([['a', 'b', 'c'], ['', '', ''], ['1', '', '3']]);
  });

  it('ein Anführungszeichen mitten im Feld ist ein normales Zeichen', () => {
    expect(parseCsv('a;b\n5" Zoll;x').rows[1]).toEqual(['5" Zoll', 'x']);
  });

  it('toCsv und parseCsv sind zueinander invers', () => {
    const data = [['wort', 'text'], ['a;b', 'mit "quote"'], ['zeile\num', '']];
    expect(parseCsv(toCsv(data)).rows).toEqual(data);
  });
});

describe('query-builder', () => {
  it('entschärft Platzhalter und Quoting-Zeichen im Suchwort', () => {
    expect(sanitizeSearchTerm('  50%  *rabatt* "x" \\ ')).toBe('50 rabatt x');
    expect(sanitizeSearchTerm('%%%')).toBe('');
    expect(sanitizeSearchTerm('a'.repeat(200))).toHaveLength(80);
  });

  it('baut die JSONB-Suche je Sprache und Feld und quotet den Wert', () => {
    expect(buildSearchExpr('Berlin', ['en', 'de'], ['question', 'answer1'], false)).toBe(
      'content->en->>question.ilike."*Berlin*",content->en->>answer1.ilike."*Berlin*",'
      + 'content->de->>question.ilike."*Berlin*",content->de->>answer1.ilike."*Berlin*"',
    );
  });

  it('Kommas und Klammern im Suchwort bleiben innerhalb der Anführungszeichen', () => {
    const expr = buildSearchExpr('a,b) or (id.gt.0', ['de'], ['word'], false);
    expect(expr).toBe('content->de->>word.ilike."*a,b) or (id.gt.0*"');
  });

  it('lässt keine fremden Sprachen oder Feldnamen in den Ausdruck', () => {
    const expr = buildSearchExpr('x', ['de', 'xx);drop'], ['word', 'bad.key', 'a->b'], false);
    expect(expr).toBe('content->de->>word.ilike."*x*"');
    expect(buildMissingLangExpr('xx')).toBeNull();
  });

  it('leeres Suchwort ergibt keinen Filter', () => {
    expect(buildSearchExpr('   ')).toBeNull();
    expect(buildFilterOps({ dbGameId: 'bomb', contentType: 'question', search: ' % ' })).toHaveLength(2);
  });

  it('setzt alle Filter als Server-Filter', () => {
    const ops = buildFilterOps({
      dbGameId: 'truthdare', contentType: 'truth', difficulty: '2', category: 'Lustig',
      active: 'inactive', missingLang: 'ar', search: 'kuss', searchFields: ['text'],
    });
    expect(ops).toEqual([
      { op: 'eq', column: 'game_id', value: 'truthdare' },
      { op: 'eq', column: 'content_type', value: 'truth' },
      { op: 'eq', column: 'difficulty', value: '2' },
      { op: 'eq', column: 'category', value: 'Lustig' },
      { op: 'eq', column: 'is_active', value: false },
      { op: 'or', expr: 'content->de->>text.ilike."*kuss*",category.ilike."*kuss*"' },
      { op: 'or', expr: 'content->>ar.is.null,content->>ar.eq."{}"' },
    ]);
  });

  it('rechnet Seitenbereich und Seitenzahl', () => {
    expect(pageRange(0, 25)).toEqual([0, 24]);
    expect(pageRange(3, 25)).toEqual([75, 99]);
    expect(pageRange(-2, 25)).toEqual([0, 24]);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(25)).toBe(1);
    expect(pageCount(26)).toBe(2);
  });
});

describe('game-registry', () => {
  const appIds = new Set(playableGames.map((g) => g.id));

  it('jede alte Kennung zeigt auf ein Spiel der App und umgekehrt', () => {
    for (const [legacy, app] of Object.entries(LEGACY_ID_MAP)) {
      expect(appIds.has(app), `${legacy} → ${app}`).toBe(true);
      expect(appIds.has(legacy), `${legacy} ist selbst eine App-Kennung`).toBe(false);
      expect(dbIdForAppId(app)).toBe(legacy);
      expect(appIdForDbId(legacy)).toBe(app);
    }
    expect(dbIdForAppId('bomb')).toBe('bomb');
    expect(appIdForDbId('unbekannt')).toBe('unbekannt');
  });

  it('jede Kennung mit Inhaltstypen gehört zu einem Spiel der App und hat Felddefinitionen', () => {
    for (const [dbId, types] of Object.entries(CONTENT_TYPES_BY_DB_ID)) {
      expect(appIds.has(appIdForDbId(dbId)), dbId).toBe(true);
      for (const type of types) expect(FIELD_CONFIGS[type], type).toBeDefined();
    }
  });

  it('Live- und Editor-Spiele existieren in der App und überschneiden sich nicht', () => {
    const groups = [Object.keys(LIVE_PAIRS), Object.keys(EDITOR_ROUTES)];
    const all = groups.flat();
    for (const id of all) expect(appIds.has(id), id).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });

  it('Pantomime, Bombe, Tabu und Stirnraten sind live — aber nur mit ihrem angeschlossenen Inhaltstyp', () => {
    expect(Object.keys(LIVE_PAIRS).sort()).toEqual(['bomb', 'headup', 'pantomime', 'taboo']);
    for (const id of ['pantomime', 'bomb', 'taboo', 'headup']) {
      expect(resolveGameStatus(id), id).toBe('live');
      expect(canCreateContent(id, LIVE_PAIRS[id][0]), id).toBe(true);
    }
    expect(isLivePair('bomb', 'question')).toBe(true);
    // Die Bomben-Kategorien liest die App nicht aus der Datenbank.
    expect(isLivePair('bomb', 'category')).toBe(false);
    expect(canCreateContent('bomb', 'category')).toBe(false);
  });

  it('Spiele mit eigenem Editor und fest eingebaute Spiele bekommen ihren Status', () => {
    for (const id of ['ohrwurm', 'hitbuzzer', 'pixeljagd', 'closeenough']) expect(resolveGameStatus(id), id).toBe('editor');
    expect(resolveGameStatus('this-or-that')).toBe('static');
    expect(contentTypesForApp('this-or-that')).toEqual(['pair']);
    expect(contentTypesForApp('wahrheit-pflicht')).toEqual(['truth', 'dare']);
    expect(contentTypesForApp('brew')).toEqual([]);
    expect(canCreateContent('this-or-that', 'pair')).toBe(false);
  });

  it('der Hub zeigt jedes Spiel der App genau einmal; Editor-Spiele haben keine Paare', () => {
    const hub = buildHubGames();
    expect(hub.map((h) => h.game.id)).toEqual(playableGames.map((g) => g.id));
    const pairs = allContentPairs();
    expect(pairs.some((p) => EDITOR_ROUTES[p.appId])).toBe(false);
    expect(pairs).toContainEqual({ appId: 'wahrheit-pflicht', dbId: 'truthdare', contentType: 'dare' });
  });

  it('filtert den Hub nach Name, Status und Tarif', () => {
    const hub = buildHubGames();
    const nameOf = (g: { id: string }) => (g.id === 'bomb' ? 'Tickende Bombe' : g.id);
    expect(filterHubGames(hub, { query: 'tick', status: 'all', tier: 'all' }, nameOf).map((h) => h.game.id)).toEqual(['bomb']);
    expect(filterHubGames(hub, { query: '', status: 'live', tier: 'all' }, nameOf).map((h) => h.game.id).sort())
      .toEqual(['bomb', 'headup', 'pantomime', 'taboo']);
    const premium = filterHubGames(hub, { query: '', status: 'all', tier: 'premium' }, nameOf);
    expect(premium.length).toBeGreaterThan(0);
    expect(premium.every((h) => h.game.tier === 'premium')).toBe(true);
  });
});

describe('validation', () => {
  it('Deutsch ist Pflicht; leere Fremdsprachen sind erlaubt, halbe nicht', () => {
    expect(validateContent('pair', { de: {} })).toEqual({ de: { optionA: 'required', optionB: 'required' } });
    expect(hasErrors(validateContent('pair', { de: { optionA: 'A', optionB: 'B' }, en: {} }))).toBe(false);
    expect(validateContent('pair', { de: { optionA: 'A', optionB: 'B' }, en: { optionA: 'A' } }))
      .toEqual({ en: { optionB: 'required' } });
  });

  it('prüft Zahlenfelder und Koordinatenbereich', () => {
    const base = { name: 'Ort', lat: '48,1', lng: '11.5' };
    expect(hasErrors(validateContent('location', { de: base }))).toBe(false);
    expect(validateContent('location', { de: { ...base, lat: 'abc' } }).de.lat).toBe('number');
    expect(validateContent('location', { de: { ...base, lng: '181' } }).de.lng).toBe('range');
  });

  it('normalisiert: leere Sprachen fallen weg, Auswahlfelder bekommen 0, Unbekanntes bleibt', () => {
    const out = normalizeContent('question', {
      de: { question: ' Frage? ', answer1: 'a', answer2: 'b', answer3: 'c', answer4: 'd', legacy: 'x' },
      en: { correctIndex: '2' },
    });
    expect(out).toEqual({
      de: { question: 'Frage?', answer1: 'a', answer2: 'b', answer3: 'c', answer4: 'd', legacy: 'x', correctIndex: '0' },
    });
  });

  it('macht alte Zeilen (Zahlen, fehlende Sprachen) editierbar', () => {
    const editable = toEditableContent({ de: { text: 'x', intensity: 2 }, zz: { text: 'fremd' } });
    expect(editable.de).toEqual({ text: 'x', intensity: '2' });
    expect(editable.en).toEqual({});
    expect(editable.zz).toBeUndefined();
    expect(langCoverage('truth', editable).de).toBe(true);
    expect(langCoverage('truth', editable).en).toBe(false);
    expect(previewText('truth', editable, 'en')).toBe('x');
  });
});

describe('import-rows', () => {
  it('erkennt das Format', () => {
    expect(detectFormat('  [{"a":1}]')).toBe('json');
    expect(detectFormat(`${BOM}{"a":1}`)).toBe('json');
    expect(detectFormat('term;forbidden1')).toBe('csv');
  });

  it('baut aus CSV eine Vorschau mit Gründen für übersprungene Zeilen', () => {
    const csv = [
      'term;forbidden1;forbidden2;difficulty;category;lang;extra',
      'Fußball;Ball;Tor;easy;Sport;de;x',
      '"Kino; groß";Film;Popcorn;;;;',
      'fussball doppelt;;;;;;',
      'Fußball;Ball;Tor;;;;',
      'Schon da;A;B;;;;',
      'Hello;A;B;;;en;',
      'Salut;A;B;;;xx;',
      ';;;;;;',
    ].join('\r\n');
    const p = buildImportPreview(csv, 'csv', 'taboo_card', { existingKeys: new Set(['schon da']) });
    expect(p.totalRows).toBe(8);
    expect(p.items.map((i) => i.content.de.term)).toEqual(['Fußball', 'Kino; groß']);
    expect(p.items[0]).toMatchObject({ line: 2, difficulty: 'easy', category: 'Sport', is_active: true });
    expect(p.items[1]).toMatchObject({ difficulty: 'medium', category: 'Sport' });
    expect(p.ignoredColumns).toEqual(['extra']);
    expect(p.skipped).toEqual([
      { line: 4, reason: 'required', detail: 'de:forbidden1' },
      { line: 5, reason: 'duplicateInFile', detail: 'fußball' },
      { line: 6, reason: 'duplicateInDb', detail: 'schon da' },
      { line: 7, reason: 'missingBase' },
      { line: 8, reason: 'unknownLang', detail: 'xx' },
      { line: 9, reason: 'empty' },
    ]);
  });

  it('liest mehrsprachiges JSON und meldet kaputtes JSON', () => {
    const json = JSON.stringify([
      { content: { de: { word: 'Katze' }, en: { word: 'Cat' }, zz: { word: '?' } }, category: 'tiere', is_active: false },
      { content: { en: { word: 'Dog' } }, category: 'tiere' },
      { word: 'Hund', category: 'unbekannt' },
    ]);
    const p = buildImportPreview(json, 'json', 'pantomime_word');
    expect(p.items).toEqual([{
      line: 1, content: { de: { word: 'Katze' }, en: { word: 'Cat' } }, difficulty: 'medium', category: 'tiere', is_active: false,
    }]);
    expect(p.skipped).toEqual([
      { line: 2, reason: 'missingBase' },
      { line: 3, reason: 'badCategory', detail: 'unbekannt' },
    ]);
    expect(buildImportPreview('{kaputt', 'json', 'pantomime_word').fatal).toBe('badJson');
  });

  it('Auswahlfelder nehmen Index oder Beschriftung', () => {
    const csv = 'question;answer1;answer2;answer3;answer4;correctIndex\nF1;a;b;c;d;Antwort 3\nF2;a;b;c;d;1\n';
    const p = buildImportPreview(csv, 'csv', 'question');
    expect(p.items.map((i) => i.content.de.correctIndex)).toEqual(['2', '1']);
  });

  it('die CSV-Vorlage lässt sich selbst wieder importieren', () => {
    const tpl = buildTemplateCsv('taboo_card');
    expect(tpl.charCodeAt(0)).toBe(0xfeff);
    expect(buildImportPreview(tpl, 'csv', 'taboo_card').items).toHaveLength(1);
  });

  it('der Dubletten-Schlüssel ist der deutsche Haupttext, klein geschrieben', () => {
    expect(primaryKey('question', { de: { question: ' Was? ' } })).toBe('was?');
    expect(primaryKey('question', { en: { question: 'What?' } })).toBe('');
  });
});

describe('seedGameContent', () => {
  it('bietet für angeschlossene Spiele kein Kopieren des Grundstocks an (wäre reine Dublette)', () => {
    expect(hasDefaultContent('bomb', 'question')).toBe(false);
    expect(hasDefaultContent('taboo', 'taboo_card')).toBe(false);
    expect(hasDefaultContent('headup', 'headup_word')).toBe(false);
    expect(hasDefaultContent('pantomime', 'pantomime_word')).toBe(false);
    expect(hasDefaultContent('truthdare', 'truth')).toBe(false);
    expect(hasDefaultContent('wahrheit-pflicht', 'truth')).toBe(false);
  });

  it('führt Fragen über die id zusammen und schreibt sie flach', () => {
    const q = (id: string, question: string) => ({
      id, question, answers: ['a', 'b', 'c', 'd'], correctIndex: 2, category: 'Geo', difficulty: 'easy' as const,
    });
    const items = mergeQuestions({ de: [q('1', 'Eins?'), q('2', 'Zwei?')], en: [q('2', 'Two?')] });
    expect(items).toHaveLength(2);
    expect(items[0].content).toEqual({
      de: { question: 'Eins?', answer1: 'a', answer2: 'b', answer3: 'c', answer4: 'd', correctIndex: '2' },
    });
    expect(items[1].content.en.question).toBe('Two?');
    expect(items[1]).toMatchObject({ difficulty: 'easy', category: 'Geo' });
  });

  it('Tabu: eine Sprache mit abweichender Länge wird nicht über die Position zugeordnet', () => {
    const c = (term: string) => ({ term, forbidden: ['x', 'y'], category: 'A', difficulty: 'medium' as const });
    const items = mergeTaboo({ de: [c('eins'), c('zwei')], en: [c('one'), c('two')], tr: [c('bir')] });
    expect(Object.keys(items[1].content)).toEqual(['de', 'en']);
    expect(items[1].content.en).toEqual({ term: 'two', forbidden1: 'x', forbidden2: 'y' });
  });

  it('selectMissing liefert nur, was in der Datenbank fehlt, und keine Dubletten', () => {
    const item = (term: string) => ({ content: { de: { term } }, difficulty: 'medium', category: 'A' });
    const missing = selectMissing([item('Eins'), item('Zwei'), item('zwei'), item('Drei')], new Set(['eins']), 'taboo_card');
    expect(missing.map((m) => m.content.de.term)).toEqual(['Zwei', 'Drei']);
  });

  it('der echte Grundstock besteht die Validierung des Editors', async () => {
    for (const [appId, type] of [['bomb', 'question'], ['taboo', 'taboo_card'], ['headup', 'headup_word']] as const) {
      const items = await buildDefaultItems(appId, type);
      expect(items.length, `${appId}/${type}`).toBeGreaterThan(10);
      const broken = items.filter((i) => hasErrors(validateContent(type, i.content)));
      expect(broken.map((b) => primaryKey(type, b.content)), `${appId}/${type}`).toEqual([]);
    }
    expect(await buildDefaultItems('pantomime', 'pantomime_word')).toEqual([]);
    // Lädt 30 Sprachdateien — unter Last reicht das Standardlimit von 5 s nicht.
  }, 30_000);
});

describe('list-filters (Zustand in der URL)', () => {
  it('liest Filter, Sprache und Seite aus der URL und verwirft Ungültiges', () => {
    const s = listStateFromParams(new URLSearchParams('game=bomb&q=berlin&state=inactive&diff=easy&cat=Geo&missing=ar&lang=en&page=3'));
    expect(s).toEqual({
      filters: { search: 'berlin', difficulty: 'easy', category: 'Geo', active: 'inactive', missingLang: 'ar' },
      viewLang: 'en',
      page: 2,
    });
    const bad = listStateFromParams(new URLSearchParams('state=kaputt&missing=xx&lang=zz&page=-4'));
    expect(bad).toEqual({ filters: EMPTY_FILTERS, viewLang: 'de', page: 0 });
  });

  it('schreibt nur Abweichungen vom Standard und lässt fremde Parameter stehen', () => {
    const base = new URLSearchParams('game=bomb&type=question&q=alt&page=9');
    const next = listStateToParams(base, {
      filters: { ...EMPTY_FILTERS, search: ' neu ', active: 'active' }, viewLang: 'de', page: 0,
    });
    expect(next.toString()).toBe('game=bomb&type=question&q=neu&state=active');
    expect(listStateFromParams(listStateToParams(new URLSearchParams(), {
      filters: { ...EMPTY_FILTERS, category: 'A & B' }, viewLang: 'tr', page: 4,
    }))).toEqual({ filters: { ...EMPTY_FILTERS, category: 'A & B' }, viewLang: 'tr', page: 4 });
  });

  it('zählt aktive Filter; die Anzeigesprache ist keiner', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, search: '  ', active: 'inactive', missingLang: 'ar' })).toBe(2);
    expect(LIST_PARAM_KEYS).not.toContain('game');
  });
});
