// OHRWURM — Spotify-URI-Batch-Resolver (Hitster-Modell)
// -----------------------------------------------------------------------------
// Löst für ALLE Songs aus ohrwurm-content.ts einmalig die Spotify-Track-URI auf
// und schreibt sie nach src/games/ohrwurm/spotify-uris.json (id → "spotify:track:…").
// Danach braucht die App zur Laufzeit KEINE Spotify-Suche mehr.
//
// Auth: dieses Script braucht EINEN funktionierenden Spotify-Such-Zugang.
//   Variante A (empfohlen): ein User-Access-Token eines Premium-Accounts.
//     -> Token in die Umgebung legen:  SPOTIFY_TOKEN=BQ...   node scripts/resolve-spotify-uris.mjs
//        (PowerShell:  $env:SPOTIFY_TOKEN="BQ..."; node scripts/resolve-spotify-uris.mjs)
//   Variante B: keine Variable gesetzt -> es wird die deployte Edge-Function
//     (App-Token/Client-Credentials) genutzt. Funktioniert nur, wenn der
//     App-Besitzer Premium hat bzw. die App in Extended Quota Mode ist.
//
// Idempotent/Resumable: bereits aufgelöste IDs werden übersprungen. Einfach
// erneut starten, falls abgebrochen.
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/games/ohrwurm/ohrwurm-content.ts');
const OUT = join(ROOT, 'src/games/ohrwurm/spotify-uris.json');

const SUPABASE_URL = 'https://kiyokpawmabodmrmhvev.supabase.co';
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeW9rcGF3bWFib2Rtcm1odmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDUwODgsImV4cCI6MjA5MDI4MTA4OH0.fS3T58AYDTYXSuivwpt8In0aLf2W1EWpSw_wgtA5Sa8';

const USER_TOKEN = process.env.SPOTIFY_TOKEN || null;
const MARKET = process.env.SPOTIFY_MARKET || 'DE';

/** Songs aus dem gepackten String der Content-Datei extrahieren. */
function loadSongs() {
  const src = readFileSync(CONTENT, 'utf8');
  const m = src.match(/const PACKED = `([\s\S]*?)`/);
  if (!m) throw new Error('PACKED-Block in ohrwurm-content.ts nicht gefunden');
  return m[1]
    .trim()
    .split(/\r?\n/)
    .map((line, i) => {
      const [year, artist, title] = line.split('~');
      return { id: 'ow-' + String(i + 1).padStart(4, '0'), year: Number(year), artist, title };
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Eine Track-URI über die Spotify-Web-API (User-Token) auflösen. */
async function resolveViaSpotify(song) {
  const tries = [
    `track:${song.title} artist:${song.artist}`,
    `${song.artist} ${song.title}`,
  ];
  for (const q of tries) {
    const url =
      'https://api.spotify.com/v1/search?' +
      new URLSearchParams({ q, type: 'track', limit: '1', market: MARKET });
    const res = await fetch(url, { headers: { Authorization: `Bearer ${USER_TOKEN}` } });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') || '2') * 1000 + 250;
      await sleep(wait);
      return resolveViaSpotify(song);
    }
    if (res.status === 401) throw new Error('AUTH: Token ungültig/abgelaufen (401)');
    if (res.status === 403) throw new Error('FORBIDDEN: ' + (await res.text()).slice(0, 200));
    if (!res.ok) continue;
    const data = await res.json();
    const hit = data?.tracks?.items?.[0];
    if (hit?.uri) return hit.uri;
  }
  return null;
}

/** Fallback: über die deployte Edge-Function (App-Token). */
async function resolveViaEdge(song) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ohrwurm-spotify-track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({ artist: song.artist, title: song.title, market: MARKET }),
  });
  const data = await res.json().catch(() => ({}));
  if (data?.reason === 'search_403') throw new Error('FORBIDDEN(edge): ' + (data.detail || ''));
  return data?.uri ?? null;
}

async function main() {
  const songs = loadSongs();
  const out = JSON.parse(readFileSync(OUT, 'utf8'));
  const resolver = USER_TOKEN ? resolveViaSpotify : resolveViaEdge;
  console.log(`Songs: ${songs.length} · Modus: ${USER_TOKEN ? 'User-Token' : 'Edge-Function'} · bereits: ${Object.keys(out).length}`);

  let done = 0, hit = 0, miss = 0;
  for (const song of songs) {
    if (out[song.id]) { done++; continue; }
    try {
      const uri = await resolver(song);
      if (uri) { out[song.id] = uri; hit++; }
      else { miss++; }
    } catch (e) {
      console.error(`\nAbbruch bei ${song.id} (${song.artist} – ${song.title}): ${e.message}`);
      writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
      console.error(`Zwischenstand gespeichert (${Object.keys(out).length} URIs). Script erneut starten zum Fortsetzen.`);
      process.exit(1);
    }
    done++;
    if (done % 25 === 0) {
      writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
      process.stdout.write(`\r${done}/${songs.length}  ✓${hit} ·${miss}  `);
    }
    await sleep(USER_TOKEN ? 90 : 160); // sanftes Rate-Limit
  }
  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n');
  console.log(`\nFertig. ${Object.keys(out).length} URIs in spotify-uris.json (${miss} ohne Treffer).`);
}

main();
