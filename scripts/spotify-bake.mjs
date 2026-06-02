// OHRWURM — Spotify-URIs backen mit deinem EIGENEN Premium-Account (PKCE-Login).
// -----------------------------------------------------------------------------
// Loggt dich einmal per Browser bei Spotify ein (Authorization Code + PKCE,
// KEIN Client-Secret nötig), holt einen User-Access-Token und löst damit ALLE
// Songs zu spotify:track:-URIs auf -> src/games/ohrwurm/spotify-uris.json.
//
// Ein User-Token eines Premium-Accounts umgeht die „owner premium"-403-Hürde
// des App-Tokens (Client-Credentials). Voraussetzung:
//   1) Im Spotify-Dashboard (Edit Settings) die Redirect-URI hinzufügen:
//          http://127.0.0.1:8888/callback
//   2) Dein Account ist unter „User Management" der App freigegeben
//      (Development Mode) UND hat Premium.
//
// Start:   node scripts/spotify-bake.mjs
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/games/ohrwurm/ohrwurm-content.ts');
const OUT = join(ROOT, 'src/games/ohrwurm/spotify-uris.json');

const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID || '370afb4c06fc4e67b5f5e7687604d5d5';
const PORT = Number(process.env.PORT || 8888);
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const MARKET = process.env.SPOTIFY_MARKET || 'DE';

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '""', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* manuell öffnen */ }
}

/** PKCE-Login -> User-Access-Token. */
async function login() {
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const state = b64url(randomBytes(8));
  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
    });

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      if (!req.url.startsWith('/callback')) { res.writeHead(404); res.end(); return; }
      const url = new URL(req.url, REDIRECT);
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body style="font-family:sans-serif;background:#16101f;color:#fff;text-align:center;padding-top:80px"><h2>OHRWURM</h2><p>Login abgeschlossen — du kannst dieses Fenster schließen.</p></body></html>');
      server.close();
      if (err || !code) return reject(new Error('Login abgebrochen: ' + (err || 'kein Code')));
      try {
        const tok = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT,
            client_id: CLIENT_ID,
            code_verifier: verifier,
          }),
        });
        const data = await tok.json();
        if (!data.access_token) return reject(new Error('Token-Tausch fehlgeschlagen: ' + JSON.stringify(data)));
        resolve(data.access_token);
      } catch (e) { reject(e); }
    });
    server.listen(PORT, () => {
      console.log('\n1) Falls der Browser sich nicht öffnet, diese URL manuell aufrufen:\n   ' + authUrl + '\n');
      openBrowser(authUrl);
    });
  });
}

function loadSongs() {
  const src = readFileSync(CONTENT, 'utf8');
  const m = src.match(/const PACKED = `([\s\S]*?)`/);
  if (!m) throw new Error('PACKED-Block nicht gefunden');
  return m[1].trim().split(/\r?\n/).map((line, i) => {
    const [year, artist, title] = line.split('~');
    return { id: 'ow-' + String(i + 1).padStart(4, '0'), year: Number(year), artist, title };
  });
}

async function search(token, song) {
  for (const q of [`track:${song.title} artist:${song.artist}`, `${song.artist} ${song.title}`]) {
    const url = 'https://api.spotify.com/v1/search?' + new URLSearchParams({ q, type: 'track', limit: '1', market: MARKET });
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) { await sleep((Number(res.headers.get('retry-after') || '2') * 1000) + 250); return search(token, song); }
    if (res.status === 401) throw new Error('401 — Token abgelaufen/ungültig');
    if (res.status === 403) throw new Error('403 — Zugriff verweigert: ' + (await res.text()).slice(0, 200));
    if (!res.ok) continue;
    const data = await res.json();
    const hit = data?.tracks?.items?.[0];
    if (hit?.uri) return hit.uri;
  }
  return null;
}

async function main() {
  console.log(`OHRWURM Spotify-Bake · Redirect: ${REDIRECT}`);
  const token = await login();
  console.log('✓ Eingeloggt. Teste Suche …');
  // Sofort-Test: scheitert der erste Call mit 403, ist es app-/dev-mode-seitig.
  const songs = loadSongs();
  const out = JSON.parse(readFileSync(OUT, 'utf8').trim() || '{}');
  let done = 0, hit = 0, miss = 0;
  for (const song of songs) {
    if (out[song.id]) { done++; continue; }
    let uri;
    try { uri = await search(token, song); }
    catch (e) {
      writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
      console.error(`\nAbbruch bei ${song.id} (${song.artist} – ${song.title}): ${e.message}`);
      console.error(`Zwischenstand gespeichert (${Object.keys(out).length}).`);
      process.exit(1);
    }
    if (uri) { out[song.id] = uri; hit++; } else miss++;
    done++;
    if (done % 25 === 0) { writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n'); process.stdout.write(`\r${done}/${songs.length}  ✓${hit} ·ohne ${miss}  `); }
    await sleep(80);
  }
  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
  console.log(`\n✓ Fertig: ${Object.keys(out).length} URIs in spotify-uris.json (${miss} ohne Treffer).`);
}

main().catch((e) => { console.error('\nFehler:', e.message); process.exit(1); });
