// Withdraws an approved-but-unreleased App Store version (PENDING_DEVELOPER_RELEASE)
// and turns the same store entry into the release described in the config, so the
// newer build can go through App Review. No-op when the config names no
// supersededVersion or when the entry was already converted.
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const release = JSON.parse(readFileSync(new URL('../../release/app-store-1.6.7.json', import.meta.url), 'utf8'));
const { bundleId, version: targetVersion, buildNumber, supersededVersion, supersededBuildNumber, releaseType } = release;
if (!bundleId || !/^\d+\.\d+\.\d+$/.test(targetVersion) || !/^\d+$/.test(buildNumber)) {
  throw new Error('Invalid App Store release configuration.');
}
if (!supersededVersion) {
  console.log('No superseded version configured; nothing to replace.');
  process.exit(0);
}
if (!/^\d+\.\d+\.\d+$/.test(supersededVersion) || !/^\d+$/.test(supersededBuildNumber ?? '') || supersededVersion === targetVersion) {
  throw new Error('Invalid superseded version configuration.');
}
if (releaseType && !['MANUAL', 'AFTER_APPROVAL'].includes(releaseType)) throw new Error(`Unsupported releaseType ${releaseType}.`);
if (process.argv.includes('--dry-run')) {
  console.log(`Ready to replace approved iOS ${supersededVersion} (${supersededBuildNumber}) with ${targetVersion} (${buildNumber}).`);
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
const stateOf = (entry) => entry?.attributes?.appVersionState ?? entry?.attributes?.appStoreState;
const editable = ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED'];

const apps = await api(`apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== bundleId) throw new Error(`Expected one app for ${bundleId}.`);
const appId = apps.data[0].id;
const versions = await api(`apps/${appId}/appStoreVersions?limit=200`);
const iosVersions = (versions.data ?? []).filter(({ attributes }) => attributes?.platform === 'IOS');
const targets = iosVersions.filter(({ attributes }) => attributes?.versionString === targetVersion);
const superseded = iosVersions.filter(({ attributes }) => attributes?.versionString === supersededVersion);
if (targets.length > 1 || superseded.length > 1) throw new Error('Duplicate App Store versions found; inspect manually.');
if (targets.length === 1) {
  if (superseded.length === 1 && !['READY_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_VERSION'].includes(stateOf(superseded[0]))) {
    throw new Error(`Both iOS ${supersededVersion} (${stateOf(superseded[0])}) and ${targetVersion} exist; inspect manually.`);
  }
  console.log(`iOS ${targetVersion} already exists (${stateOf(targets[0])}); nothing to replace.`);
  process.exit(0);
}
if (superseded.length !== 1) throw new Error(`Expected one iOS ${supersededVersion} version to replace.`);
const version = superseded[0];

const builds = await api(`builds?filter[app]=${appId}&filter[version]=${buildNumber}&limit=20`);
const target = builds.data?.find(({ attributes }) => attributes?.version === buildNumber);
if (!target || target.attributes?.processingState !== 'VALID') throw new Error(`Build ${buildNumber} is not VALID.`);
const prerelease = await api(`builds/${target.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== targetVersion || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${buildNumber} is not iOS ${targetVersion}.`);
}

let state = stateOf(version);
const attached = await api(`appStoreVersions/${version.id}/build`);
const attachedBuild = attached.data?.attributes?.version;
if (state === 'PENDING_DEVELOPER_RELEASE') {
  if (attachedBuild !== supersededBuildNumber) {
    throw new Error(`Refusing to replace iOS ${supersededVersion}: attached build is ${attachedBuild ?? 'none'}, expected ${supersededBuildNumber}.`);
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
    if (item) {
      if (items.data?.length !== 1) throw new Error('Review submission contains unrelated items.');
      matching.push({ review, item });
    }
  }
  if (!matching.some(({ review, item }) => review.attributes?.state === 'COMPLETE' && item.attributes?.state === 'APPROVED')) {
    throw new Error(`Expected a completed, approved iOS ${supersededVersion} review submission.`);
  }
  await api(`appStoreVersionSubmissions/${legacySubmission.data.id}`, 'DELETE');
  console.log(`Removed approved iOS ${supersededVersion} build ${supersededBuildNumber} from the release process.`);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const refreshed = await api(`appStoreVersions/${version.id}`);
    state = stateOf(refreshed.data);
    if (state === 'DEVELOPER_REJECTED') break;
    if (attempt === 11) throw new Error(`Version removal was accepted but state is ${state}; inspect before continuing.`);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  console.log(`Verified iOS ${supersededVersion} state DEVELOPER_REJECTED.`);
} else if (!editable.includes(state)) {
  throw new Error(`Refusing to replace iOS ${supersededVersion} in unexpected state ${state}.`);
}

// Rename the editable store entry to the target version. Try version + build in one
// request first (keeps train and build consistent), then fall back to rename only —
// app-store-prepare.mjs attaches the build afterwards.
const attributes = { versionString: targetVersion, ...(releaseType ? { releaseType } : {}) };
try {
  await api(`appStoreVersions/${version.id}`, 'PATCH', {
    data: {
      type: 'appStoreVersions',
      id: version.id,
      attributes,
      relationships: { build: { data: { type: 'builds', id: target.id } } },
    },
  });
} catch (error) {
  console.log(`Combined rename failed (${error.message}); retrying rename without build.`);
  await api(`appStoreVersions/${version.id}`, 'PATCH', { data: { type: 'appStoreVersions', id: version.id, attributes } });
}
const renamed = await api(`appStoreVersions/${version.id}`);
if (renamed.data?.attributes?.versionString !== targetVersion || !editable.includes(stateOf(renamed.data))) {
  throw new Error(`Could not verify rename to iOS ${targetVersion}: ${renamed.data?.attributes?.versionString} ${stateOf(renamed.data)}.`);
}
console.log(`Verified store entry is now iOS ${targetVersion} (${stateOf(renamed.data)}), replacing ${supersededVersion}.`);
