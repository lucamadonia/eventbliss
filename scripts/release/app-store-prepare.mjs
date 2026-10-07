import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const release = JSON.parse(readFileSync(new URL('../../release/app-store-1.6.1.json', import.meta.url), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(release.version) || !/^\d+$/.test(release.buildNumber) || !release.bundleId) {
  throw new Error('Invalid App Store release configuration.');
}
for (const [locale, whatsNew] of Object.entries(release.whatsNew)) {
  if (!locale || typeof whatsNew !== 'string' || !whatsNew.trim() || whatsNew.length > 4000) {
    throw new Error(`Invalid App Store What's New for ${locale}.`);
  }
}
if (process.argv.includes('--dry-run')) {
  console.log(`Ready: ${release.bundleId} ${release.version} (${release.buildNumber}), ${Object.keys(release.whatsNew).length} localizations.`);
  process.exit(0);
}

const issuer = process.env.APP_STORE_CONNECT_ISSUER_ID;
const keyId = process.env.APP_STORE_CONNECT_KEY_ID;
const secret = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
if (!issuer || !keyId || !secret) throw new Error('App Store Connect API credentials are missing.');
const privateKey = createPrivateKey(secret.includes('BEGIN PRIVATE KEY') ? secret : Buffer.from(secret, 'base64').toString('utf8'));
const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const body = `${base64url({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${base64url({ iss: issuer, iat: now, exp: now + 300, aud: 'appstoreconnect-v1' })}`;
  return `${body}.${sign('sha256', Buffer.from(body), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
}
async function api(path, method = 'GET', data) {
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json', ...(data ? { 'Content-Type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = result.errors?.map(({ code, detail }) => `${code}: ${detail}`).join('; ') || response.statusText;
    throw new Error(`App Store Connect ${method} ${path.split('?')[0]}: HTTP ${response.status} ${details}`);
  }
  return result;
}

const apps = await api(`apps?filter[bundleId]=${encodeURIComponent(release.bundleId)}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== release.bundleId) {
  throw new Error(`Expected exactly one App Store Connect app for ${release.bundleId}.`);
}
const appId = apps.data[0].id;
const builds = await api(`builds?filter[app]=${appId}&filter[version]=${release.buildNumber}&limit=20`);
const build = builds.data?.find((entry) => entry.attributes?.version === release.buildNumber);
if (!build || build.attributes?.processingState !== 'VALID') throw new Error(`Build ${release.buildNumber} is not VALID.`);
const prerelease = await api(`builds/${build.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== release.version || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${release.buildNumber} is not iOS ${release.version}.`);
}

const versions = await api(`apps/${appId}/appStoreVersions?limit=200`);
const iosVersions = (versions.data ?? []).filter((entry) => entry.attributes?.platform === 'IOS');
const previous = iosVersions.find((entry) => entry.attributes?.versionString === release.previousVersion);
if (!previous) throw new Error(`Previous App Store version ${release.previousVersion} was not found.`);
const previousLocalizations = await api(`appStoreVersions/${previous.id}/appStoreVersionLocalizations?limit=200`);
const previousByLocale = new Map((previousLocalizations.data ?? []).map((entry) => [entry.attributes?.locale, entry.attributes]));
const expectedLocales = Object.keys(release.whatsNew).sort();
const actualLocales = [...previousByLocale.keys()].sort();
if (JSON.stringify(expectedLocales) !== JSON.stringify(actualLocales)) {
  throw new Error(`Store locale mismatch: expected ${expectedLocales.join(', ')}, found ${actualLocales.join(', ')}.`);
}

const matches = iosVersions.filter((entry) => entry.attributes?.versionString === release.version);
if (matches.length > 1) throw new Error(`More than one iOS ${release.version} App Store version exists.`);
let version = matches[0];
if (!version) {
  const attributes = { platform: 'IOS', versionString: release.version, releaseType: 'MANUAL' };
  if (previous.attributes?.copyright) attributes.copyright = previous.attributes.copyright;
  const created = await api('appStoreVersions', 'POST', {
    data: { type: 'appStoreVersions', attributes, relationships: { app: { data: { type: 'apps', id: appId } } } },
  });
  version = created.data;
  console.log(`Created iOS App Store version ${release.version}.`);
}
if (version.attributes?.appVersionState !== 'PREPARE_FOR_SUBMISSION' && version.attributes?.appStoreState !== 'PREPARE_FOR_SUBMISSION') {
  throw new Error(`iOS ${release.version} is not editable: ${version.attributes?.appVersionState ?? version.attributes?.appStoreState}.`);
}

const attached = await api(`appStoreVersions/${version.id}/build`);
if (attached.data?.id !== build.id) {
  await api(`appStoreVersions/${version.id}/relationships/build`, 'PATCH', { data: { type: 'builds', id: build.id } });
  console.log(`Attached build ${release.buildNumber}.`);
}

const current = await api(`appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`);
const currentByLocale = new Map((current.data ?? []).map((entry) => [entry.attributes?.locale, entry]));
for (const locale of expectedLocales) {
  const whatsNew = release.whatsNew[locale];
  const existing = currentByLocale.get(locale);
  if (existing?.attributes?.whatsNew === whatsNew) continue;
  if (existing) {
    await api(`appStoreVersionLocalizations/${existing.id}`, 'PATCH', {
      data: { type: 'appStoreVersionLocalizations', id: existing.id, attributes: { whatsNew } },
    });
  } else {
    const source = previousByLocale.get(locale);
    const attributes = { locale, whatsNew };
    for (const field of ['description', 'keywords', 'marketingUrl', 'promotionalText', 'supportUrl']) {
      if (source[field] != null) attributes[field] = source[field];
    }
    await api('appStoreVersionLocalizations', 'POST', {
      data: { type: 'appStoreVersionLocalizations', attributes, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } },
    });
  }
  console.log(`${locale}: What's New updated.`);
}

const verifiedBuild = await api(`appStoreVersions/${version.id}/build`);
if (verifiedBuild.data?.id !== build.id) throw new Error(`Could not verify build ${release.buildNumber} on ${release.version}.`);
const verifiedLocales = await api(`appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`);
for (const locale of expectedLocales) {
  const entry = verifiedLocales.data?.find((item) => item.attributes?.locale === locale);
  if (entry?.attributes?.whatsNew !== release.whatsNew[locale]) throw new Error(`Could not verify ${locale} What's New.`);
}
console.log(`Verified ${release.bundleId} iOS ${release.version} (${release.buildNumber}) Store draft with ${expectedLocales.length} localizations.`);
