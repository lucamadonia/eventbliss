/**
 * Regenerates src/lib/europe-map-paths.ts from public-domain Natural Earth data
 * (world-atlas@2 countries-50m, ISO 3166-1 numeric ids). Mercator-projected and
 * fitted to a fixed viewBox; overseas territories / far islands are clipped to a
 * European bounding box so the projection isn't zoomed out by them.
 *
 * One-time tooling — deps are NOT in package.json. Run with:
 *   npm i -D topojson-client d3-geo
 *   node scripts/gen-europe.mjs
 *   npm un topojson-client d3-geo
 */
import fs from "fs";
import path from "path";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";

const DATA_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const OUT = path.resolve("src/lib/europe-map-paths.ts");

// ISO numeric -> ISO alpha-2 for the partner-agency countries
const WANT = { "276": "DE", "040": "AT", "756": "CH", "528": "NL", "056": "BE", "250": "FR", "724": "ES", "620": "PT", "380": "IT" };
const ORDER = ["DE", "AT", "CH", "NL", "BE", "FR", "ES", "PT", "IT"];

const topo = JSON.parse(await (await fetch(DATA_URL)).text());
const fc = feature(topo, topo.objects.countries);

const inEurope = ([lon, lat]) => lon >= -11 && lon <= 30 && lat >= 34 && lat <= 71.5;
function clip(f) {
  if (f.geometry.type === "Polygon") return f;
  const coordinates = f.geometry.coordinates.filter((poly) => poly[0].some(inEurope));
  return { ...f, geometry: { type: "MultiPolygon", coordinates } };
}

const feats = {};
for (const f of fc.features) {
  const id = WANT[String(f.id).padStart(3, "0")];
  if (id) feats[id] = clip(f);
}

const W = 1000, H = 820;
const collection = { type: "FeatureCollection", features: ORDER.map((c) => feats[c]) };
const projection = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], collection);
const pathGen = geoPath(projection);

const paths = {};
const centroids = {};
for (const c of ORDER) {
  paths[c] = pathGen(feats[c]);
  const [cx, cy] = pathGen.centroid(feats[c]);
  centroids[c] = [Math.round(cx), Math.round(cy)];
}

const out = `// AUTO-GENERATED from Natural Earth (public domain) via world-atlas@2 countries-50m.
// Mercator projection fitted to a ${W}x${H} viewBox; overseas territories clipped.
// Regenerate with scripts/gen-europe.mjs if the country set changes. Do not edit by hand.

export const EUROPE_VIEWBOX = "0 0 ${W} ${H}";

export const COUNTRY_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 2)};

/** Projected label anchor (path centroid) per country, in viewBox units. */
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = ${JSON.stringify(centroids)};
`;

fs.writeFileSync(OUT, out);
console.log(`wrote ${OUT}`);
