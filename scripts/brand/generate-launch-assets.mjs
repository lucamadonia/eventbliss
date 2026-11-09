import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const sourceIcon = path.join(root, 'src/assets/eventbliss-app-icon-v2.png');
const sourceMark = path.join(root, 'src/assets/eventbliss-icon.png');
const dark = '#1a1625';
const light = '#fafafa';

const target = (...segments) => path.join(root, ...segments);
const save = async (file, buffer) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
};

const mark = await sharp(sourceMark).trim({ threshold: 5 }).png().toBuffer();
await save(target('src/assets/eventbliss-splash-mark-v2.png'), mark);
const wordmarkCrop = await sharp(target('src/assets/eventbliss-logo.png'))
  .extract({ left: 136, top: 188, width: 330, height: 125 })
  .png()
  .toBuffer();
const wordmark = await sharp(wordmarkCrop)
  .trim({ threshold: 5 })
  .png()
  .toBuffer();
await save(target('src/assets/eventbliss-wordmark-v2.png'), wordmark);

const fullIcon = async (size) => sharp(sourceIcon)
  .resize(size, size, { fit: 'cover' })
  .flatten({ background: dark })
  .png()
  .toBuffer();

const stage = async (width, height, background, markWidth) => {
  const symbol = await sharp(mark).resize({ width: Math.round(markWidth) }).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: symbol, gravity: 'centre' }])
    .png()
    .toBuffer();
};

await save(target('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), await fullIcon(1024));
await save(target('public/apple-touch-icon.png'), await fullIcon(180));
await save(target('public/favicon.png'), await fullIcon(128));
const faviconSizes = [16, 32, 48, 64];
const faviconFrames = await Promise.all(faviconSizes.map(fullIcon));
const directory = Buffer.alloc(6 + faviconFrames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(faviconFrames.length, 4);
let offset = directory.length;
faviconFrames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  directory[entry] = faviconSizes[index];
  directory[entry + 1] = faviconSizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await save(target('public/favicon.ico'), Buffer.concat([directory, ...faviconFrames]));
await save(target('public/pwa-192x192.png'), await fullIcon(192));
await save(target('public/pwa-512x512.png'), await fullIcon(512));
await save(target('public/press/eventbliss-app-icon-v2.png'), await fullIcon(1024));
await save(target('public/pwa-512-maskable.png'), await stage(512, 512, dark, 318));

const splashSet = target('ios/App/App/Assets.xcassets/Splash.imageset');
for (const file of await readdir(splashSet)) {
  if (!/^Default@\dx~universal~anyany(?:-dark)?\.png$/.test(file)) continue;
  await save(path.join(splashSet, file), await stage(2732, 2732, file.includes('-dark') ? dark : light, 700));
}

const publicSplash = target('public/splash');
for (const file of await readdir(publicSplash)) {
  const match = /^apple-splash-(\d+)x(\d+)\.png$/.exec(file);
  if (!match) continue;
  const width = Number(match[1]);
  const height = Number(match[2]);
  await save(path.join(publicSplash, file), await stage(width, height, dark, Math.min(width, height) * 0.46));
}

const androidRes = target('android/app/src/main/res');
const densitySizes = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(densitySizes)) {
  const dir = path.join(androidRes, `mipmap-${density}`);
  const launcher = await fullIcon(size);
  await save(path.join(dir, 'ic_launcher.png'), launcher);
  await save(path.join(dir, 'ic_launcher_round.png'), launcher);
  await save(path.join(dir, 'ic_launcher_background.png'), await sharp({ create: { width: size, height: size, channels: 4, background: dark } }).png().toBuffer());
  const foreground = await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: await sharp(mark).resize({ width: Math.round(size * 0.6) }).png().toBuffer(), gravity: 'centre' }])
    .png()
    .toBuffer();
  await save(path.join(dir, 'ic_launcher_foreground.png'), foreground);
}

for (const dirName of await readdir(androidRes)) {
  if (!dirName.startsWith('drawable')) continue;
  const file = path.join(androidRes, dirName, 'splash.png');
  let meta;
  try { meta = await sharp(file).metadata(); } catch { continue; }
  await save(file, await stage(meta.width, meta.height, dirName.includes('night') ? dark : light, Math.min(meta.width, meta.height) * 0.46));
}

console.log('Generated EventBliss v2 launcher icons and static launch assets.');
