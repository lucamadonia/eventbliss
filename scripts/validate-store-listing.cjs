#!/usr/bin/env node
/**
 * Validates appstore/store-listing.json against App Store Connect character
 * limits and regenerates appstore/ASC-COPY-PASTE.md with exact counts.
 *
 * Limits (characters): subtitle <= 30, promotionalText <= 170,
 * description <= 4000, keywords <= 100.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'appstore', 'store-listing.json');
const MD_PATH = path.join(ROOT, 'appstore', 'ASC-COPY-PASTE.md');

const LIMITS = { subtitle: 30, promotionalText: 170, description: 4000, keywords: 100 };

const LANG_ORDER = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'pl', 'tr', 'ar'];
const LANG_NAMES = {
  de: 'Deutsch',
  en: 'Englisch (UK)',
  es: 'Spanisch (Spanien)',
  fr: 'Französisch',
  it: 'Italienisch',
  nl: 'Niederländisch',
  pt: 'Portugiesisch (Portugal)',
  pl: 'Polnisch',
  tr: 'Türkisch',
  ar: 'Arabisch',
};

const len = (s) => Array.from(s).length; // code points, surrogate-safe

const raw = fs.readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(raw); // throws if invalid

let failed = false;
const rows = [];

for (const lang of LANG_ORDER) {
  const entry = data[lang];
  if (!entry) {
    console.error(`MISSING LANGUAGE: ${lang}`);
    failed = true;
    continue;
  }
  const counts = {};
  for (const field of Object.keys(LIMITS)) {
    const value = entry[field];
    if (typeof value !== 'string' || value.length === 0) {
      console.error(`${lang}.${field}: missing or empty`);
      failed = true;
      continue;
    }
    counts[field] = len(value);
    if (counts[field] > LIMITS[field]) {
      console.error(`${lang}.${field}: ${counts[field]} > ${LIMITS[field]} OVER LIMIT`);
      failed = true;
    }
  }
  // Keyword hygiene: warn if a keyword token also appears in app name or subtitle
  const norm = (s) => s.toLocaleLowerCase('en').normalize('NFC');
  const subtitleTokens = new Set(norm(entry.subtitle).split(/[\s,&+:;،]+/).filter((t) => t.length > 2));
  subtitleTokens.add('eventbliss');
  for (const kw of entry.keywords.split(',')) {
    for (const token of norm(kw).split(/\s+/)) {
      if (subtitleTokens.has(token)) {
        console.warn(`${lang}: keyword token "${token}" duplicates app name/subtitle`);
      }
    }
  }
  rows.push({ lang, counts });
}

// Print summary table
console.log('\nlang | subtitle | promo | description | keywords');
console.log('-----|----------|-------|-------------|---------');
for (const { lang, counts } of rows) {
  console.log(
    `${lang.padEnd(4)} | ${String(counts.subtitle).padStart(2)}/30    | ${String(counts.promotionalText).padStart(3)}/170 | ${String(counts.description).padStart(4)}/4000   | ${String(counts.keywords).padStart(3)}/100`
  );
}

if (failed) {
  console.error('\nValidation FAILED — ASC-COPY-PASTE.md not regenerated.');
  process.exit(1);
}

// Regenerate ASC-COPY-PASTE.md
let md = '# App Store Connect — Copy-Paste-Vorlage (Version 1.0)\n\n';
md += '## Für ALLE Sprachen gleich\n\n';
md += '- **Support-URL**: https://event-bliss.com\n';
md += '- **Marketing-URL** (optional): https://event-bliss.com\n';
md += '- **Copyright**: 2026 MYFAMBLISS GROUP LTD\n\n---\n\n';

for (const lang of LANG_ORDER) {
  const e = data[lang];
  md += `## ${LANG_NAMES[lang]}\n\n`;
  md += `**Untertitel** (${len(e.subtitle)}/30):\n${e.subtitle}\n\n`;
  md += `**Werbetext** (${len(e.promotionalText)}/170):\n${e.promotionalText}\n\n`;
  md += `**Beschreibung** (${len(e.description)}/4000):\n${e.description}\n\n`;
  md += `**Schlüsselwörter** (${len(e.keywords)}/100):\n${e.keywords}\n\n---\n\n`;
}

fs.writeFileSync(MD_PATH, md, 'utf8');
console.log(`\nOK: all limits respected. Regenerated ${path.relative(ROOT, MD_PATH)}`);
