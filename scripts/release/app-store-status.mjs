import { createPrivateKey, sign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const release = JSON.parse(readFileSync(new URL('../../release/app-store-1.6.1.json', import.meta.url), 'utf8'));
const { bundleId, previousVersion } = release;
const targetVersion = release.version;
const buildNumber = release.buildNumber;
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

async function api(path) {
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = result.errors?.map(({ code, detail }) => `${code}: ${detail}`).join('; ') || response.statusText;
    throw new Error(`App Store Connect GET ${path.split('?')[0]}: HTTP ${response.status} ${details}`);
  }
  return result;
}

const apps = await api(`apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name,primaryLocale`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== bundleId) {
  throw new Error(`Expected exactly one App Store Connect app for ${bundleId}.`);
}
const app = apps.data[0];
const builds = await api(`builds?filter[app]=${app.id}&filter[version]=${buildNumber}&limit=20`);
const build = builds.data?.find((entry) => entry.attributes?.version === buildNumber);
if (!build) throw new Error(`Build ${buildNumber} is not listed for ${bundleId}.`);
const prerelease = await api(`builds/${build.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== targetVersion || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${buildNumber} does not belong to iOS ${targetVersion}.`);
}

const versions = await api(`apps/${app.id}/appStoreVersions?limit=200`);
const iosVersions = (versions.data ?? []).filter((entry) => entry.attributes?.platform === 'IOS');
const report = {
  checkedAt: new Date().toISOString(),
  app: { bundleId, name: app.attributes?.name, primaryLocale: app.attributes?.primaryLocale },
  build: { number: buildNumber, version: targetVersion, processingState: build.attributes?.processingState },
  listedVersions: (versions.data ?? []).map(({ attributes }) => ({
    platform: attributes?.platform,
    version: attributes?.versionString,
    state: attributes?.appVersionState ?? attributes?.appStoreState,
  })),
  versions: [],
};
for (const version of iosVersions) {
  const { versionString, appVersionState, appStoreState } = version.attributes ?? {};
  if (versionString !== targetVersion && versionString !== previousVersion && !['PREPARE_FOR_SUBMISSION', 'READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE'].includes(appVersionState ?? appStoreState)) continue;
  const attached = await api(`appStoreVersions/${version.id}/build`);
  const localizations = await api(`appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`);
  const localeReport = [];
  for (const { id, attributes } of localizations.data ?? []) {
    const screenshotSets = versionString === targetVersion
      ? await api(`appStoreVersionLocalizations/${id}/appScreenshotSets?limit=200`)
      : null;
    localeReport.push({
      locale: attributes?.locale,
      hasWhatsNew: Boolean(attributes?.whatsNew?.trim()),
      hasDescription: Boolean(attributes?.description?.trim()),
      hasSupportUrl: Boolean(attributes?.supportUrl?.trim()),
      hasMarketingUrl: Boolean(attributes?.marketingUrl?.trim()),
      ...(screenshotSets ? { screenshotTypes: (screenshotSets.data ?? []).map((set) => set.attributes?.screenshotDisplayType).sort() } : {}),
    });
  }
  report.versions.push({
    version: versionString,
    state: appVersionState ?? appStoreState,
    attachedBuild: attached.data?.attributes?.version ?? null,
    localizations: localeReport.sort((a, b) => a.locale.localeCompare(b.locale)),
  });
}
mkdirSync('artifacts/app-store', { recursive: true });
writeFileSync('artifacts/app-store/status.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
