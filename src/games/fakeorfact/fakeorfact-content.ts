// Auto-generated language loader — selects content by current i18next language.
import i18n from 'i18next';
import * as de from './fakeorfact-content-de';
import * as en from './fakeorfact-content-en';
import * as es from './fakeorfact-content-es';
import * as fr from './fakeorfact-content-fr';
import * as it from './fakeorfact-content-it';
import * as nl from './fakeorfact-content-nl';
import * as pl from './fakeorfact-content-pl';
import * as pt from './fakeorfact-content-pt';
import * as tr from './fakeorfact-content-tr';
import * as ar from './fakeorfact-content-ar';
export type { Fact, ThreeStatements } from './fakeorfact-content-de';

const FACTS_BY_LANG: Record<string, typeof de.FACTS> = {
  de: de.FACTS,
  en: en.FACTS_EN,
  es: es.FACTS_ES,
  fr: fr.FACTS_FR,
  it: it.FACTS_IT,
  nl: nl.FACTS_NL,
  pl: pl.FACTS_PL,
  pt: pt.FACTS_PT,
  tr: tr.FACTS_TR,
  ar: ar.FACTS_AR,
};
export const getFACTS = () => FACTS_BY_LANG[i18n.language?.split("-")[0] ?? "de"] ?? de.FACTS;
const THREE_STATEMENTS_BY_LANG: Record<string, typeof de.THREE_STATEMENTS> = {
  de: de.THREE_STATEMENTS,
  en: de.THREE_STATEMENTS,
  es: de.THREE_STATEMENTS,
  fr: de.THREE_STATEMENTS,
  it: de.THREE_STATEMENTS,
  nl: de.THREE_STATEMENTS,
  pl: de.THREE_STATEMENTS,
  pt: de.THREE_STATEMENTS,
  tr: de.THREE_STATEMENTS,
  ar: de.THREE_STATEMENTS,
};
export const getTHREE_STATEMENTS = (): typeof de.THREE_STATEMENTS => {
  if ((i18n.language?.split('-')[0] ?? 'de') === 'de') return de.THREE_STATEMENTS;
  const facts = getFACTS();
  const truths = facts.filter(f => f.isTrue);
  const lies = facts.filter(f => !f.isTrue);
  if (!truths.length || lies.length < 2) return [];
  return truths.map((fact, i) => {
    const statements = [fact.statement, lies[(i * 2) % lies.length].statement, lies[(i * 2 + 1) % lies.length].statement];
    const trueIndex = i % 3;
    [statements[0], statements[trueIndex]] = [statements[trueIndex], statements[0]];
    return { statements: statements as [string, string, string], trueIndex, category: fact.category };
  });
};
