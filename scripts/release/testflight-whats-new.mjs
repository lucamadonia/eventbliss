import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const notes = JSON.parse(readFileSync(new URL('../../release/testflight-1.6.0.json', import.meta.url), 'utf8'));
const buildNumber = process.argv[process.argv.indexOf('--build') + 1];
const dryRun = process.argv.includes('--dry-run');
if (!/^\d+$/.test(buildNumber ?? '')) throw new Error('Pass the iOS workflow run number with --build NUMBER.');
if (!/^\d+\.\d+\.\d+$/.test(notes.version) || !notes.bundleId || !Object.keys(notes.localizations).length) {
  throw new Error('Invalid TestFlight release notes.');
}
for (const [locale, whatsNew] of Object.entries(notes.localizations)) {
  if (!locale || typeof whatsNew !== 'string' || !whatsNew.trim() || whatsNew.length > 4000) {
    throw new Error(`Invalid TestFlight notes for ${locale}.`);
  }
}

if (dryRun) {
  console.log(`Ready: ${notes.bundleId} ${notes.version} (${buildNumber}); ${Object.entries(notes.localizations).map(([locale, value]) => `${locale}: ${value.length} characters`).join(', ')}`);
  process.exit(0);
}

const issuer = process.env.APP_STORE_CONNECT_ISSUER_ID;
const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
const secret = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
if (!issuer || !keyId || !secret) throw new Error('App Store Connect API credentials are missing.');
const privateKey = createPrivateKey(secret.includes('BEGIN PRIVATE KEY') ? secret : Buffer.from(secret, 'base64').toString('utf8'));
const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
function bearerToken() {
  const now = Math.floor(Date.now() / 1000);
  const body = `${base64url({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${base64url({ iss: issuer, iat: now, exp: now + 300, aud: 'appstoreconnect-v1' })}`;
  return `${body}.${sign('sha256', Buffer.from(body), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
}

async function api(path, method = 'GET', data) {
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${bearerToken()}`, Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.errors?.map(({ code, detail }) => `${code}: ${detail}`).join('; ') || response.statusText;
    throw new Error(`App Store Connect ${method} ${path.split('?')[0]}: HTTP ${response.status} ${message}`);
  }
  return result;
}

const apps = await api(`apps?filter[bundleId]=${encodeURIComponent(notes.bundleId)}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== notes.bundleId) {
  throw new Error(`Expected exactly one App Store Connect app for ${notes.bundleId}.`);
}
const appId = apps.data[0].id;
let build;
for (let attempt = 0; attempt < 90; attempt++) {
  const result = await api(`builds?filter[app]=${appId}&filter[version]=${buildNumber}&limit=20`);
  const matches = result.data?.filter((candidate) => candidate.attributes?.version === buildNumber) ?? [];
  if (matches.length > 1) throw new Error(`More than one ${buildNumber} build exists for ${notes.bundleId}.`);
  build = matches[0];
  if (build?.attributes?.processingState === 'VALID') break;
  if (build && ['FAILED', 'INVALID'].includes(build.attributes?.processingState)) {
    throw new Error(`Build ${buildNumber} processing failed: ${build.attributes.processingState}.`);
  }
  console.log(`Waiting for App Store Connect build ${buildNumber}: ${build?.attributes?.processingState ?? 'not listed'} (${attempt + 1}/90)`);
  await new Promise((resolve) => setTimeout(resolve, 20_000));
}
if (!build || build.attributes?.processingState !== 'VALID') throw new Error(`Build ${buildNumber} did not become VALID within 30 minutes.`);

const prerelease = await api(`builds/${build.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== notes.version || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${buildNumber} is not iOS version ${notes.version}.`);
}

const localizationsPath = `builds/${build.id}/betaBuildLocalizations?limit=200`;
const existing = await api(localizationsPath);
for (const [locale, whatsNew] of Object.entries(notes.localizations)) {
  const current = existing.data?.find((item) => item.attributes?.locale === locale);
  if (current?.attributes?.whatsNew === whatsNew) {
    console.log(`${locale}: already current`);
  } else if (current) {
    await api(`betaBuildLocalizations/${current.id}`, 'PATCH', {
      data: { type: 'betaBuildLocalizations', id: current.id, attributes: { whatsNew } },
    });
    console.log(`${locale}: updated`);
  } else {
    await api('betaBuildLocalizations', 'POST', {
      data: { type: 'betaBuildLocalizations', attributes: { locale, whatsNew }, relationships: { build: { data: { type: 'builds', id: build.id } } } },
    });
    console.log(`${locale}: created`);
  }
}

const verified = await api(localizationsPath);
for (const [locale, whatsNew] of Object.entries(notes.localizations)) {
  if (verified.data?.find((item) => item.attributes?.locale === locale)?.attributes?.whatsNew !== whatsNew) {
    throw new Error(`Could not verify ${locale} notes for build ${buildNumber}.`);
  }
}
console.log(`Verified TestFlight notes for ${notes.bundleId} ${notes.version} (${buildNumber}); build ${build.id}, processing VALID.`);
