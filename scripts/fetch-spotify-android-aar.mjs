/**
 * Vendors the Spotify App Remote AAR into the ohrwurm-spotify plugin.
 *
 * The binary is deliberately not committed (node_modules is ephemeral), so a
 * fresh `npm install` loses it and Android release builds fail with
 * "Could not find :spotify-app-remote-release-0.8.0:". Run this before any
 * Android build: `node scripts/fetch-spotify-android-aar.mjs`
 * (mirrors the "Fetch Spotify iOS SDK" step in .github/workflows/ios-testflight.yml).
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "0.8.0";
const TAG = "v0.8.0-appremote_v2.1.0-auth";
const URL = `https://github.com/spotify/android-sdk/releases/download/${TAG}/spotify-app-remote-release-${VERSION}.aar`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// The app module resolves the AAR via its own flatDir (android/app/libs), the
// plugin module via node_modules/ohrwurm-spotify/android/libs — vendor both.
const dests = [
  join(root, "node_modules", "ohrwurm-spotify", "android", "libs"),
  join(root, "android", "app", "libs"),
];
const name = `spotify-app-remote-release-${VERSION}.aar`;

let buf = null;
for (const dest of dests) {
  const file = join(dest, name);
  if (existsSync(file)) {
    console.log(`Already vendored: ${file}`);
    continue;
  }
  if (!buf) {
    console.log(`Fetching ${URL} …`);
    const res = await fetch(URL, { redirect: "follow" });
    if (!res.ok) {
      console.error(`Download failed: HTTP ${res.status}`);
      process.exit(1);
    }
    buf = Buffer.from(await res.arrayBuffer());
  }
  mkdirSync(dest, { recursive: true });
  writeFileSync(file, buf);
  console.log(`Vendored ${file} (${buf.length} bytes)`);
}
