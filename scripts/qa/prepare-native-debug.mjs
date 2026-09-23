import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Builds a debug-only overlay. Never overwrites production dist or Capacitor config.
const root = process.cwd();
const config = JSON.parse(await fs.readFile('scripts/tmp/controller-native-public.json', 'utf8'));
if (new URL(config.url).hostname !== '10.0.2.2') throw new Error('Native QA requires the Android emulator local backend');
const base = path.resolve('scripts/tmp/native-qa');
const assets = path.join(base, 'assets');
await fs.mkdir(assets, { recursive: true });
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', path.join(assets, 'public')], {
  cwd: root, stdio: 'inherit', env: {
    ...process.env, CAPACITOR_BUILD: 'true', VITE_SUPABASE_URL: config.url, VITE_SUPABASE_PUBLISHABLE_KEY: config.anonKey,
    VITE_REVENUECAT_ANDROID_KEY: '', VITE_REVENUECAT_IOS_KEY: '', VITE_GOOGLE_WEB_CLIENT_ID: '', VITE_GOOGLE_IOS_CLIENT_ID: '', VITE_SPOTIFY_CLIENT_ID: '',
  },
});
if (build.status !== 0) process.exit(build.status ?? 1);
const capacitor = JSON.parse(await fs.readFile('android/app/src/main/assets/capacitor.config.json', 'utf8'));
capacitor.android = { ...capacitor.android, allowMixedContent: true };
await fs.writeFile(path.join(assets, 'capacitor.config.json'), JSON.stringify(capacitor, null, 2));
await fs.writeFile(path.join(base, 'AndroidManifest.xml'), '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:usesCleartextTraffic="true" /></manifest>');
const gradlePath = value => value.replaceAll('\\', '/').replaceAll("'", "\\'");
await fs.writeFile(path.join(base, 'overlay.gradle'), `allprojects { project ->\n  project.afterEvaluate {\n    if (project.name == 'app') {\n      android.sourceSets.debug.assets.srcDir '${gradlePath(assets)}'\n      android.sourceSets.debug.manifest.srcFile '${gradlePath(path.join(base, 'AndroidManifest.xml'))}'\n    }\n  }\n}\n`);
console.log('Local native debug overlay prepared:', base);
