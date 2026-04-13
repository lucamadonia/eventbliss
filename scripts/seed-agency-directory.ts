/**
 * Seed script: Import agencies from agencies-data.ts into agency_directory table.
 *
 * Usage:
 *   npx tsx scripts/seed-agency-directory.ts
 *
 * Or run the generated SQL directly in Supabase SQL Editor.
 * This script outputs INSERT statements to stdout.
 */

import { AGENCIES } from "../src/lib/agencies-data";

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

console.log("-- Seed agency_directory from agencies-data.ts");
console.log(`-- Total: ${AGENCIES.length} agencies`);
console.log("");
console.log("INSERT INTO public.agency_directory (country, country_code, city, name, website, phone, email, description, status)");
console.log("VALUES");

const values = AGENCIES.map((a, i) => {
  const isLast = i === AGENCIES.length - 1;
  return `  ('${escapeSQL(a.country)}', '${escapeSQL(a.countryCode)}', '${escapeSQL(a.city)}', '${escapeSQL(a.name)}', '${escapeSQL(a.website)}', '${escapeSQL(a.phone)}', '${escapeSQL(a.email)}', '${escapeSQL(a.description)}', 'active')${isLast ? ";" : ","}`;
});

values.forEach(v => console.log(v));

console.log("");
console.log(`-- Done: ${AGENCIES.length} agencies inserted`);
