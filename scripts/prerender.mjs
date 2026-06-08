/**
 * Post-build prerenderer for the static public pages.
 *
 * Boots `vite preview` over the built dist/, drives a headless Chromium
 * (Puppeteer) to each static route, waits for the SPA to render + useSEO to
 * apply, then writes the fully-rendered HTML to dist/<route>/index.html.
 * Vercel serves these static files before the SPA rewrite, so crawlers /
 * AI engines / social scrapers get real HTML + per-page meta.
 *
 * The home route "/" is intentionally NOT prerendered: it maps to the SPA
 * fallback index.html whose default meta already equals the homepage meta.
 *
 * Resilient by design: any failure (e.g. no Chromium in CI) logs a warning
 * and exits 0 so deploys never break — the app simply stays client-rendered.
 *
 * Skipped for native (Capacitor) builds.
 *
 * ACTIVATION: requires `puppeteer` as a devDependency and re-adding
 * `&& node scripts/prerender.mjs` to the "build" script. NOTE: at time of
 * writing, `npm i -D puppeteer` fails locally due to a project tree issue
 * (a transitive `link:` dependency that npm's re-resolver chokes on). Resolve
 * that (or install via pnpm / pin a version) before wiring this into the build,
 * so the Vercel `npm install` is not put at risk. Until then this is a manual
 * `npm run prerender` step and the app stays client-rendered (Google renders JS;
 * per-page meta + sitemaps already cover ranking).
 */
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const PORT = 41739;
const BASE = `http://localhost:${PORT}`;

const ROUTES = [
  "/games",
  "/marketplace",
  "/agency/pricing",
  "/legal/imprint",
  "/legal/privacy",
  "/legal/terms",
  "/legal/disclaimer",
  "/legal/agency-agreement",
];

if (process.env.CAPACITOR_BUILD) {
  console.log("prerender: skipped (CAPACITOR_BUILD).");
  process.exit(0);
}

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("vite preview did not start in time")), 30000);
    const onData = (buf) => {
      if (buf.toString().includes(`localhost:${PORT}`)) {
        clearTimeout(timer);
        resolve();
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (code) => reject(new Error(`vite preview exited early (${code})`)));
  });
}

let preview;
let browser;
try {
  const puppeteer = (await import("puppeteer")).default;

  preview = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: ROOT, env: process.env },
  );
  await waitForServer(preview);

  browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  let ok = 0;
  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0", timeout: 45000 });
      await page.waitForFunction(
        () => {
          const r = document.querySelector("#root");
          return r && r.children.length > 0;
        },
        { timeout: 20000 },
      );
      // give useSEO effects a tick to set title/meta/canonical
      await new Promise((r) => setTimeout(r, 800));
      const html = "<!doctype html>\n" + (await page.content()).replace(/^<!doctype html>/i, "");
      const dir = join(DIST, route);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), html);
      ok++;
      console.log(`prerender ✓ ${route}`);
    } catch (e) {
      console.warn(`prerender ✗ ${route}: ${e?.message ?? e}`);
    } finally {
      await page.close();
    }
  }
  console.log(`prerender: ${ok}/${ROUTES.length} routes written.`);
} catch (e) {
  console.warn(`prerender skipped (${e?.message ?? e}). App stays client-rendered.`);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (preview) preview.kill();
}
process.exit(0);
