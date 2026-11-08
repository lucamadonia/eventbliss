import { createPrivateKey, sign } from 'node:crypto';

const bundleId = 'app.eventbliss';
const targetVersion = '1.6.1';
const targetBuild = '304';
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

const apps = await api(`apps?filter[bundleId]=${bundleId}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== bundleId) throw new Error(`Expected one ${bundleId} app.`);
const appId = apps.data[0].id;
const versions = await api(`apps/${appId}/appStoreVersions?limit=200`);
const matches = (versions.data ?? []).filter(({ attributes }) => attributes?.platform === 'IOS' && attributes?.versionString === targetVersion);
if (matches.length !== 1) throw new Error(`Expected one iOS ${targetVersion} version.`);
const version = matches[0];
const attached = await api(`appStoreVersions/${version.id}/build`);
const builds = await api(`builds?filter[app]=${appId}&filter[version]=${targetBuild}&limit=20`);
const build = builds.data?.find(({ attributes }) => attributes?.version === targetBuild);
if (!build || build.attributes?.processingState !== 'VALID') throw new Error(`iOS build ${targetBuild} is not VALID.`);
const prerelease = await api(`builds/${build.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== targetVersion || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${targetBuild} does not belong to iOS ${targetVersion}.`);
}
const legacySubmission = await api(`appStoreVersions/${version.id}/relationships/appStoreVersionSubmission`);
const reviewSubmissions = await api(`apps/${appId}/reviewSubmissions?limit=200`);
const matchingReviews = [];
for (const review of reviewSubmissions.data ?? []) {
  const items = await api(`reviewSubmissions/${review.id}/items?limit=200&include=appStoreVersion`);
  const item = items.data?.find(({ relationships }) => relationships?.appStoreVersion?.data?.id === version.id);
  if (item) matchingReviews.push({ id: review.id, state: review.attributes?.state, itemId: item.id, itemState: item.attributes?.state });
}
console.log(JSON.stringify({
  appId,
  versionId: version.id,
  versionState: version.attributes?.appVersionState ?? version.attributes?.appStoreState,
  attachedBuild: attached.data?.attributes?.version ?? null,
  targetBuild,
  targetBuildId: build.id,
  targetBuildState: build.attributes?.processingState,
  legacySubmissionId: legacySubmission.data?.id ?? null,
  matchingReviews,
}, null, 2));
