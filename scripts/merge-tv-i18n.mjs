import fs from 'node:fs';

const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];

// One key the translators didn't have (added after extraction): the sound hint.
const tapForSound = {
  de: 'Tap für Sound', en: 'Tap for sound', es: 'Toca para el sonido',
  fr: 'Appuyez pour le son', it: "Tocca per l'audio", nl: 'Tik voor geluid',
  pl: 'Dotknij, aby włączyć dźwięk', pt: 'Toque para o som',
  tr: 'Ses için dokun', ar: 'اضغط للصوت',
};

// 4 keys whose call-sites pass NAMED i18next vars but whose extracted default
// text was a JS template literal ${...}. Rewrite ${...} → the i18next {{var}}.
const PLACEHOLDER_FIX = {
  'tv.bomb.penalties': '{{count}}',
  'tv.bomb.exploded': '{{name}}',
  'tv.headup.correctShort': '{{count}}',
  'tv.taboo.points': '{{points}}',
};

// Set a dotted path (e.g. "tv.bomb.penalties") on a nested object.
function setPath(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

// Deep-merge src into dst (src wins; objects merge, leaves overwrite).
function deepMerge(dst, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) &&
        dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) {
      deepMerge(dst[k], src[k]);
    } else {
      dst[k] = src[k];
    }
  }
  return dst;
}

let totalAdded = 0;
for (const lang of LANGS) {
  const flatPath = `scripts/tv-i18n-${lang}.json`;
  if (!fs.existsSync(flatPath)) { console.log(`SKIP ${lang}: ${flatPath} missing`); continue; }
  const flat = JSON.parse(fs.readFileSync(flatPath, 'utf8'));
  flat['tv.tapForSound'] = tapForSound[lang];
  for (const [k, ph] of Object.entries(PLACEHOLDER_FIX)) {
    if (typeof flat[k] === 'string') flat[k] = flat[k].replace(/\$\{[^}]*\}/, ph);
  }

  // Build a nested object from the flat dotted keys.
  const nested = {};
  for (const [dotted, val] of Object.entries(flat)) setPath(nested, dotted, val);

  // Merge into the locale file (only the `tv` subtree is touched).
  const localePath = `src/i18n/locales/${lang}.json`;
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  locale.tv = locale.tv && typeof locale.tv === 'object' ? locale.tv : {};
  deepMerge(locale.tv, nested.tv ?? {});

  fs.writeFileSync(localePath, JSON.stringify(locale, null, 2) + '\n');
  const count = Object.keys(flat).length;
  totalAdded += count;
  console.log(`${lang}: merged ${count} tv keys into ${localePath}`);
}
console.log(`Done. ${totalAdded} keys across locales.`);
