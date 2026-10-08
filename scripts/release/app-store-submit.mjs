import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const release = JSON.parse(readFileSync(new URL('../../release/app-store-1.6.1.json', import.meta.url), 'utf8'));
const { bundleId, version: targetVersion, buildNumber, whatsNew } = release;
if (!bundleId || !/^\d+\.\d+\.\d+$/.test(targetVersion) || !/^\d+$/.test(buildNumber) || !Object.keys(whatsNew).length) {
  throw new Error('Invalid App Store release configuration.');
}
if (process.argv.includes('--dry-run')) {
  console.log(`Ready to check ${bundleId} ${targetVersion} (${buildNumber}) for App Review.`);
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

const apps = await api(`apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name`);
if (apps.data?.length !== 1 || apps.data[0].attributes?.bundleId !== bundleId) throw new Error(`Expected one app for ${bundleId}.`);
const appId = apps.data[0].id;
const versions = await api(`apps/${appId}/appStoreVersions?limit=200`);
const matches = (versions.data ?? []).filter(({ attributes }) => attributes?.platform === 'IOS' && attributes?.versionString === targetVersion);
if (matches.length !== 1) throw new Error(`Expected one iOS App Store version ${targetVersion}.`);
const version = matches[0];
const versionId = version.id;
const versionState = version.attributes?.appVersionState ?? version.attributes?.appStoreState;
if (['WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'READY_FOR_DISTRIBUTION'].includes(versionState)) {
  console.log(`iOS ${targetVersion} is already ${versionState}; no duplicate submission created.`);
  process.exit(0);
}
if (!['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'READY_FOR_REVIEW'].includes(versionState)) {
  throw new Error(`iOS ${targetVersion} is not ready to submit: ${versionState}.`);
}
const builds = await api(`builds?filter[app]=${appId}&filter[version]=${buildNumber}&limit=20`);
const build = builds.data?.find(({ attributes }) => attributes?.version === buildNumber);
if (!build || build.attributes?.processingState !== 'VALID') throw new Error(`Build ${buildNumber} is not VALID.`);
const prerelease = await api(`builds/${build.id}/preReleaseVersion`);
if (prerelease.data?.attributes?.version !== targetVersion || prerelease.data?.attributes?.platform !== 'IOS') {
  throw new Error(`Build ${buildNumber} does not belong to iOS ${targetVersion}.`);
}
const attached = await api(`appStoreVersions/${versionId}/build`);
if (attached.data?.id !== build.id) throw new Error(`Build ${buildNumber} is not attached to iOS ${targetVersion}.`);
const localizations = await api(`appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=200`);
for (const locale of Object.keys(whatsNew)) {
  const entry = localizations.data?.find(({ attributes }) => attributes?.locale === locale);
  if (!entry?.attributes?.description?.trim() || entry.attributes.whatsNew !== whatsNew[locale]) {
    throw new Error(`Store text for ${locale} is incomplete or differs from release configuration.`);
  }
  const screenshots = await api(`appStoreVersionLocalizations/${entry.id}/appScreenshotSets?limit=200`);
  const types = new Set((screenshots.data ?? []).map(({ attributes }) => attributes?.screenshotDisplayType));
  if (!types.has('APP_IPHONE_65') || !types.has('APP_IPAD_PRO_3GEN_129')) {
    throw new Error(`iPhone or iPad screenshots are missing for ${locale}.`);
  }
}

const activeStates = new Set(['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES']);
const reviews = await api(`apps/${appId}/reviewSubmissions?limit=200`);
let submission;
let versionItem;
for (const candidate of reviews.data ?? []) {
  if (!activeStates.has(candidate.attributes?.state)) continue;
  const items = await api(`reviewSubmissions/${candidate.id}/items?limit=200&include=appStoreVersion`);
  const item = items.data?.find(({ relationships }) => relationships?.appStoreVersion?.data?.id === versionId);
  if (item) {
    if (submission) throw new Error(`Multiple active review submissions contain iOS ${targetVersion}.`);
    submission = candidate;
    versionItem = item;
  }
}
if (submission?.attributes?.state === 'WAITING_FOR_REVIEW' || submission?.attributes?.state === 'IN_REVIEW') {
  console.log(`iOS ${targetVersion} is already in App Review: ${submission.attributes.state}.`);
  process.exit(0);
}
if (!submission) {
  const created = await api('reviewSubmissions', 'POST', {
    data: { type: 'reviewSubmissions', relationships: { app: { data: { type: 'apps', id: appId } } } },
  });
  submission = created.data;
  console.log(`Created App Review submission ${submission.id}.`);
}
if (!versionItem) {
  const item = await api('reviewSubmissionItems', 'POST', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: { type: 'reviewSubmissions', id: submission.id } },
        appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
      },
    },
  });
  versionItem = item.data;
  console.log(`Added iOS ${targetVersion} to submission ${submission.id}.`);
}
const submitted = await api(`reviewSubmissions/${submission.id}`, 'PATCH', {
  data: { type: 'reviewSubmissions', id: submission.id, attributes: { submitted: true } },
});
const verified = await api(`reviewSubmissions/${submission.id}`);
const state = verified.data?.attributes?.state ?? submitted.data?.attributes?.state;
const submittedDate = verified.data?.attributes?.submittedDate ?? submitted.data?.attributes?.submittedDate;
if (!submittedDate || !['WAITING_FOR_REVIEW', 'IN_REVIEW', 'READY_FOR_REVIEW'].includes(state)) {
  throw new Error(`Unexpected App Review state after submission: ${state ?? 'unknown'}.`);
}
console.log(`Verified iOS ${targetVersion} (${buildNumber}) App Review submission ${submission.id}: ${state}, submitted ${submittedDate}.`);
