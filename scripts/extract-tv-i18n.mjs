import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/games/tv';
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dir).filter((f) => /\.(tsx|ts)$/.test(f));

const map = {};
const keysSeen = new Set();
// t('tv.x', 'default')  /  t('tv.x', "default")  /  t('tv.x', `default`)
const reDef = /t\(\s*['"](tv\.[A-Za-z0-9_.]+)['"]\s*,\s*['"`]([^'"`]*)['"`]/g;
// t('tv.x', { ..., defaultValue: 'default' })
const reObj = /t\(\s*['"](tv\.[A-Za-z0-9_.]+)['"]\s*,\s*\{[^}]*?defaultValue:\s*['"`]([^'"`]*)['"`]/g;
// any t('tv.x'  (to detect keys with no default)
const reKey = /t\(\s*['"](tv\.[A-Za-z0-9_.]+)['"]/g;

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = reObj.exec(s))) map[m[1]] = m[2];
  while ((m = reDef.exec(s))) { if (!(m[1] in map)) map[m[1]] = m[2]; }
  while ((m = reKey.exec(s))) keysSeen.add(m[1]);
}
for (const k of keysSeen) if (!(k in map)) map[k] = '';

const keys = Object.keys(map).sort();
fs.writeFileSync('scripts/tv-i18n-de.json', JSON.stringify(map, null, 2));
console.log('total keys:', keys.length);
console.log('with German default:', keys.filter((k) => map[k]).length);
const missing = keys.filter((k) => !map[k]);
console.log('WITHOUT default (render the key path!):', missing.length);
if (missing.length) console.log(missing.join('\n'));
