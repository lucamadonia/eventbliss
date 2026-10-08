import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const release = JSON.parse(readFileSync(new URL('../../release/app-store-1.6.1.json', import.meta.url), 'utf8'));
if (release.bundleId !== 'app.eventbliss' || release.version !== '1.6.1' || release.buildNumber !== '304') {
  throw new Error('Expected EventBliss iOS 1.6.1 build 304.');
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
async function api(path, method = 'GET') {
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = result.errors?.map(({ code, detail }) => `${code}: ${detail}`).join('; ') || response.statusText;
    throw new Error(`App Store Connect ${method} ${path.split('?')[0]}: HTTP ${response.status} ${details}`);
  }
  return result;
}

const apps = await api(`apps?filter[bundleId]=${release.bundleId}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== release.bundleId) throw new Error('Expected one EventBliss app.');
const appId = apps.data[0].id;
const versions = await api(`apps/${appId}/appStoreVersions?limit=200`);
const matches = (versions.data ?? []).filter(({ attributes }) => attributes?.platform === 'IOS' && attributes?.versionString === release.version);
if (matches.length !== 1) throw new Error('Expected one iOS 1.6.1 version.');
const version = matches[0];
const state = version.attributes?.appVersionState ?? version.attributes?.appStoreState;
const attached = await api(`appStoreVersions/${version.id}/build`);
const attachedBuild = attached.data?.attributes?.version;
const builds = await api(`builds?filter[app]=${appId}&filter[version]=304&limit=20`);
const target = builds.data?.find(({ attributes }) => attributes?.version === '304');
if (!target || target.attributes?.processingState !== 'VALID') throw new Error('Build 304 is not VALID.');
const prerelease = await api(`builds/${target.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== release.version || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error('Build 304 is not iOS 1.6.1.');
}

if (state === 'DEVELOPER_REJECTED' && ['303', '304'].includes(attachedBuild)) {
  console.log(`iOS 1.6.1 is already DEVELOPER_REJECTED with build ${attachedBuild}; continue with build 304 preparation.`);
  process.exit(0);
}
if (state !== 'PENDING_DEVELOPER_RELEASE' || attachedBuild !== '303') {
  throw new Error(`Refusing to replace unexpected iOS state ${state} with build ${attachedBuild ?? 'none'}.`);
}
const legacySubmission = await api(`appStoreVersions/${version.id}/relationships/appStoreVersionSubmission`);
if (legacySubmission.data?.type !== 'appStoreVersionSubmissions' || legacySubmission.data?.id !== version.id) {
  throw new Error('Unexpected App Store version submission relationship.');
}
const reviews = await api(`apps/${appId}/reviewSubmissions?limit=200`);
const matching = [];
for (const review of reviews.data ?? []) {
  const items = await api(`reviewSubmissions/${review.id}/items?limit=200&include=appStoreVersion`);
  const item = items.data?.find(({ relationships }) => relationships?.appStoreVersion?.data?.id === version.id);
  if (item) matching.push({ review, item });
}
if (matching.length !== 1 || matching[0].review.attributes?.state !== 'COMPLETE' || matching[0].item.attributes?.state !== 'APPROVED') {
  throw new Error('Expected exactly one completed, approved iOS 1.6.1 review submission.');
}

await api(`appStoreVersionSubmissions/${legacySubmission.data.id}`, 'DELETE');
console.log('Removed approved iOS 1.6.1 build 303 from the release process so build 304 can be reviewed.');
for (let attempt = 0; attempt < 12; attempt += 1) {
  const refreshed = await api(`appStoreVersions/${version.id}`);
  const current = refreshed.data?.attributes?.appVersionState ?? refreshed.data?.attributes?.appStoreState;
  if (current === 'DEVELOPER_REJECTED') {
    console.log('Verified iOS 1.6.1 state DEVELOPER_REJECTED.');
    process.exit(0);
  }
  if (attempt === 11) throw new Error(`Version removal was accepted but state is ${current}; inspect before continuing.`);
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}
