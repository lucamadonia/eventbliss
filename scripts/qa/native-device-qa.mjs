import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const adb = 'C:/Users/luca/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const device = 'emulator-5554';
const output = 'scripts/tmp/native-device-qa';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const run = (...args) => execFileSync(adb, ['-s', device, ...args], { encoding: 'utf8', timeout: 30000 }).trim();
const screenshot = async name => fs.writeFile(`${output}/${name}.png`, execFileSync(adb, ['-s', device, 'exec-out', 'screencap', '-p'], { timeout: 30000, maxBuffer: 12 * 1024 * 1024 }));
await fs.mkdir(output, { recursive: true });
const room = JSON.parse(await fs.readFile('scripts/tmp/controller-native-room.json', 'utf8'));
assert.match(room.code, /^[A-Z0-9]{4,12}$/);
const accounts = JSON.parse(await fs.readFile('scripts/tmp/controller-native-accounts.json', 'utf8'));
const guest = accounts.find(account => account.role === 'guest');
const report = { checks: [], errors: [], code: room.code, testedAt: new Date().toISOString(), apkSha256: createHash('sha256').update(await fs.readFile('android/app/build/outputs/apk/debug/app-debug.apk')).digest('hex') };
let browser;
let page;
async function attach() {
  let pid;
  for (let i = 0; i < 6; i++) {
    try { pid = run('shell', 'pidof', 'app.eventbliss'); } catch { pid = ''; }
    if (pid) {
      try {
        run('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
        const targets = await fetch('http://127.0.0.1:9223/json', { signal: AbortSignal.timeout(5000) }).then(response => response.json());
        const target = targets.find(value => value.type === 'page');
        if (target) {
          browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223', defaultViewport: null, protocolTimeout: 15000 });
          [page] = await browser.pages();
          page.setDefaultTimeout(30000);
          console.log('Attached native WebView');
          return;
        }
      } catch (error) {
        if (browser) { await browser.disconnect(); browser = null; }
        report.attachError = error.message;
        console.log('Native attach retry', i + 1, error.message);
      }
    }
    await pause(1000);
  }
  throw new Error('No debug WebView found for local app');
}
async function clickText(pattern) {
  const handle = await page.evaluateHandle(source => [...document.querySelectorAll('button')].find(button => new RegExp(source, 'i').test(button.textContent)), pattern);
  assert.ok(handle.asElement(), `Missing button: ${pattern}`);
  await handle.evaluate(element => element.scrollIntoView({ block: 'center' }));
  const label = await handle.evaluate(element => element.textContent.trim());
  run('shell', 'uiautomator', 'dump', '/sdcard/eventbliss-qa-ui.xml');
  const xml = run('shell', 'cat', '/sdcard/eventbliss-qa-ui.xml');
  const escaped = label.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const node = [...xml.matchAll(/<node\b[^>]*>/g)].map(match => match[0])
    .find(value => value.includes(`text="${escaped}"`) || value.includes(`content-desc="${escaped}"`));
  const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert.ok(bounds, `Native accessibility button missing: ${label}`);
  run('shell', 'input', 'tap', String(Math.round((Number(bounds[1]) + Number(bounds[3])) / 2)),
    String(Math.round((Number(bounds[2]) + Number(bounds[4])) / 2)));
  await pause(700);
}
async function dismissNotificationPrompt() {
  run('shell', 'uiautomator', 'dump', '/sdcard/eventbliss-qa-ui.xml');
  const xml = run('shell', 'cat', '/sdcard/eventbliss-qa-ui.xml');
  const deny = [...xml.matchAll(/<node\b[^>]*>/g)].map(match => match[0])
    .find(node => node.includes('permissioncontroller:id/permission_deny_button'));
  const bounds = deny?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!bounds) return;
  run('shell', 'input', 'tap', String(Math.round((Number(bounds[1]) + Number(bounds[3])) / 2)),
    String(Math.round((Number(bounds[2]) + Number(bounds[4])) / 2)));
  report.checks.push('Native notification prompt dismissed through Android touch input');
  await pause(700);
}
try {
  run('shell', 'am', 'force-stop', 'app.eventbliss');
  run('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `eventbliss://party/join/${room.code}`, 'app.eventbliss');
  await attach();
  report.plugins = await page.evaluate(() => window.Capacitor?.PluginHeaders?.map(plugin => plugin.name));
  console.log('Registered native plugins:', report.plugins);
  for (const name of ['App', 'Keyboard', 'Preferences', 'PushNotifications', 'OhrwurmSpotify']) assert.ok(report.plugins?.includes(name), `Native plugin ${name} must be registered`);
  page.on('pageerror', error => report.errors.push(error.message));
  // Android permission sheets can suspend the WebView animation-frame loop.
  // Dismiss the native sheet before waiting on DOM animation-frame polling.
  await dismissNotificationPrompt();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => /überspringen|skip|anmelden|log.?in|sign.?in/i.test(button.textContent)));
  const onboarding = await page.evaluate(() => [...document.querySelectorAll('button')].some(button => /überspringen|skip/i.test(button.textContent)));
  if (onboarding) await clickText('überspringen|skip');
  await pause(2000);
  await dismissNotificationPrompt();
  report.beforeLogin = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText }));
  await screenshot('cold-invitation');
  assert.equal(report.beforeLogin.path, `/party/join/${room.code}`);
  if (!await page.$('input[type="email"]')) await clickText('anmelden|log.?in|sign.?in');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', guest.email);
  await page.type('input[type="password"]', guest.password);
  await clickText('^anmelden$|^log.?in$|^sign.?in$');
  await page.waitForFunction(code => location.pathname === `/party/join/${code}`, {}, room.code);
  await pause(6000);
  report.afterLogin = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText }));
  await screenshot('joined-lobby');
  assert.ok(report.afterLogin.text.includes(room.code), 'Authenticated invitation returns to joined lobby');
  report.checks.push('Android cold custom-scheme launch keeps invitation through password login');
  run('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `eventbliss://party/join/${room.code}`, 'app.eventbliss');
  await pause(1500);
  assert.equal(await page.evaluate(() => location.pathname), `/party/join/${room.code}`);
  report.checks.push('Android warm custom-scheme launch delivers to existing singleTask activity');
  await browser.disconnect(); browser = null;
  run('shell', 'am', 'force-stop', 'app.eventbliss');
  run('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `eventbliss://party/join/${room.code}`, 'app.eventbliss');
  await attach(); await pause(7000);
  report.restored = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText }));
  assert.equal(report.restored.path, `/party/join/${room.code}`);
  assert.ok(report.restored.text.includes(room.code));
  await screenshot('cold-restored');
  report.checks.push('Android cold relaunch restores native persisted login and invited controller lobby');
} catch (error) {
  report.failure = error.stack;
  if (page) {
    report.lastView = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText })).catch(() => null);
    await screenshot('failure').catch(() => {});
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.disconnect();
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
