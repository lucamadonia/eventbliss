import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const origin = process.argv[2] ?? 'http://127.0.0.1:4187';
const immediateSession = process.argv[3] === 'immediate';
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 120000 });
let signupRedirect = '';
let claimCalls = 0;

try {
  const page = await browser.newPage();
  page.on('pageerror', error => console.error('Page error:', error.message));
  page.on('console', message => { if (message.type() === 'error') console.error('Console error:', message.text()); });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info,x-supabase-api-version' };
    if (url.includes('example.supabase.co') && request.method() === 'OPTIONS') {
      void request.respond({ status: 204, headers });
    } else
    if (url.includes('/functions/v1/verify-invite-token')) {
      void request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({
        success: true, invite: { participant_id: 'guest-1', participant_name: 'Anna', event_name: 'Testevent', event_slug: 'test-event', already_claimed: false },
      }) });
    } else if (url.includes('/auth/v1/signup')) {
      signupRedirect = new URL(url).searchParams.get('redirect_to') ?? '';
      const user = { id: 'new-user', aud: 'authenticated', email: 'anna@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      void request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(immediateSession
        ? { access_token: 'local-test-token', refresh_token: 'local-test-refresh', expires_in: 3600, token_type: 'bearer', user }
        : user) });
    } else if (url.includes('/functions/v1/claim-invite')) {
      claimCalls += 1;
      void request.respond({ status: immediateSession ? 200 : 401, contentType: 'application/json', headers,
        body: immediateSession ? '{"success":true}' : '{"success":false,"error":"Anmeldung erforderlich"}' });
    } else {
      void request.continue();
    }
  });

  await page.goto(`${origin}/scripts/qa/invite-claim-browser.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  try { await page.waitForSelector('input#email', { timeout: 20000 }); }
  catch (error) { console.error('Page content:', (await page.$eval('body', element => element.innerText)).slice(0, 500)); throw error; }
  await page.type('input#email', 'anna@example.test');
  await page.type('input#password', 'Aa1!password#123');
  await page.type('input#confirmPassword', 'Aa1!password#123');
  await page.click('button[type="submit"]');
  await page.waitForFunction((expected) => document.body.textContent?.includes(expected), { timeout: 15000 },
    immediateSession ? 'Event-Dashboard geöffnet' : 'Bestätige deine E-Mail');
  assert.equal(claimCalls, immediateSession ? 1 : 0, 'claim-invite must run exactly once and only with a session');
  assert.equal(signupRedirect, `${origin}/e/test-event/claim/test-token`, 'confirmation must return to invite');
  console.log(`Invite ${immediateSession ? 'immediate-session' : 'confirmation'} flow: PASS`);
} finally {
  await browser.close();
}
