/**
 * Seed Script: Agency Directory (177 Agenturen) + FAMBLISS Test-Services
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY="your-key" npx tsx scripts/seed-all.ts
 *
 * Or copy the SQL from the console output and paste into the Supabase SQL Editor.
 */

import { createClient } from "@supabase/supabase-js";
import { AGENCIES } from "../src/lib/agencies-data";

const SUPABASE_URL = "https://kiyokpawmabodmrmhvev.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.log("⚠️  Kein SUPABASE_SERVICE_ROLE_KEY gefunden. Generiere SQL stattdessen:\n");
  generateSQL();
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🚀 Seeding starten...\n");

  // 1. Seed Agency Directory
  console.log(`📋 ${AGENCIES.length} Agenturen ins Verzeichnis einfügen...`);
  const dirRows = AGENCIES.map((a) => ({
    country: a.country,
    country_code: a.countryCode,
    city: a.city,
    name: a.name,
    website: a.website,
    phone: a.phone,
    email: a.email,
    description: a.description,
    status: "active",
  }));

  // Insert in batches of 50
  for (let i = 0; i < dirRows.length; i += 50) {
    const batch = dirRows.slice(i, i + 50);
    const { error } = await supabase.from("agency_directory").insert(batch);
    if (error) {
      console.error(`❌ Batch ${i}-${i + batch.length}: ${error.message}`);
    } else {
      console.log(`✅ Batch ${i + 1}-${i + batch.length} eingefügt`);
    }
  }

  // 2. Find FAMBLISS agency
  console.log("\n🔍 FAMBLISS Agency suchen...");
  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, name, slug")
    .or("slug.eq.fambliss,name.ilike.%fambliss%");

  if (!agencies?.length) {
    console.error("❌ FAMBLISS Agency nicht gefunden! Überspringe Services.");
    return;
  }

  const fambliss = agencies[0];
  console.log(`✅ Gefunden: ${fambliss.name} (${fambliss.id})`);

  // 3. Create Test Services for FAMBLISS
  console.log("\n🎯 Erstelle actionreiche Services für FAMBLISS in Freiburg...\n");

  const services = [
    {
      slug: "kajak-tour-dreisam-" + Math.random().toString(36).slice(2, 6),
      category: "sport",
      price_cents: 4900,
      price_type: "per_person",
      min_participants: 4,
      max_participants: 16,
      duration_minutes: 180,
      location_type: "outdoor",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "moderate",
      auto_confirm: false,
      advance_booking_days: 3,
      title: "Kajak-Tour auf der Dreisam",
      short_description: "Paddelt gemeinsam durch Freiburg — Action pur auf dem Wasser mit professionellem Guide!",
      description: "Erlebt Freiburg von der Wasserseite! Unsere geführte Kajak-Tour führt euch über die Dreisam durch die schönsten Ecken der Stadt. Inklusive Equipment, Einweisung und wasserdichtem Beutel für eure Sachen. Perfekt für JGA, Teamevents oder Geburtstage.",
      includes: ["Kajak + Paddel + Schwimmweste", "Professioneller Guide", "Wasserdichter Packsack", "Gruppenfotos", "Erfrischungsgetränke nach der Tour"],
      requirements: ["Schwimmkenntnisse erforderlich", "Mindestalter 16 Jahre", "Sportliche Kleidung die nass werden darf"],
    },
    {
      slug: "schwarzwald-quad-tour-" + Math.random().toString(36).slice(2, 6),
      category: "sport",
      price_cents: 8900,
      price_type: "per_person",
      min_participants: 2,
      max_participants: 12,
      duration_minutes: 240,
      location_type: "outdoor",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "strict",
      auto_confirm: false,
      advance_booking_days: 7,
      title: "Schwarzwald Quad-Tour Adrenalin",
      short_description: "Offroad durch den Schwarzwald — 4 Stunden Quad-Action auf wilden Trails!",
      description: "Pure Adrenalin-Action im Schwarzwald! Mit unseren leistungsstarken Quads geht es über Wald- und Feldwege durch die atemberaubende Landschaft rund um Freiburg. Inklusive Einweisung, Schutzausrüstung und einer Pause an einer Schwarzwald-Hütte mit Vesper.",
      includes: ["Quad inkl. Benzin", "Helm + Schutzausrüstung", "Professioneller Tourguide", "Schwarzwald-Vesper an der Hütte", "Action-Fotos der Tour"],
      requirements: ["Führerschein Klasse B erforderlich", "Mindestalter 18 Jahre", "Wetterfeste Kleidung"],
    },
    {
      slug: "kletter-abenteuer-schauinsland-" + Math.random().toString(36).slice(2, 6),
      category: "sport",
      price_cents: 5500,
      price_type: "per_person",
      min_participants: 4,
      max_participants: 20,
      duration_minutes: 180,
      location_type: "outdoor",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "moderate",
      auto_confirm: true,
      advance_booking_days: 2,
      title: "Kletterpark Schauinsland Adventure",
      short_description: "Hochseilgarten am Schauinsland — 7 Parcours von Easy bis Extrem!",
      description: "Der ultimative Kletterpark am Freiburger Hausberg! 7 verschiedene Parcours in bis zu 15 Meter Höhe. Von Anfänger bis Adrenalin-Junkie ist für jeden was dabei. Inklusive Flying Fox, Tarzan-Sprung und Team-Challenges.",
      includes: ["Klettergurt + Sicherung", "Einweisung durch Trainer", "Alle 7 Parcours", "Flying Fox (120m)", "Tarzan-Sprung"],
      requirements: ["Mindestalter 12 Jahre", "Sportliche Kleidung", "Geschlossene Schuhe"],
    },
    {
      slug: "rafting-tour-wild-" + Math.random().toString(36).slice(2, 6),
      category: "sport",
      price_cents: 6900,
      price_type: "per_person",
      min_participants: 6,
      max_participants: 24,
      duration_minutes: 240,
      location_type: "outdoor",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "moderate",
      auto_confirm: false,
      advance_booking_days: 5,
      title: "Wildwasser-Rafting Schwarzwald",
      short_description: "Schlauchboot-Action auf wildem Wasser — Teamwork und Adrenalin pur!",
      description: "Stürzt euch als Team ins wilde Wasser! Unsere Rafting-Tour führt euch durch aufregende Stromschnellen in der Umgebung von Freiburg. Perfekt für Gruppen die gemeinsam Grenzen überwinden wollen. Professionelle Guides sorgen für Sicherheit und maximalen Spaß.",
      includes: ["Schlauchboot + Paddel", "Neoprenanzug + Schwimmweste + Helm", "Professioneller Raftguide", "Umkleidemöglichkeit", "Gruppenfoto"],
      requirements: ["Schwimmkenntnisse", "Mindestalter 14 Jahre", "Badekleidung mitbringen"],
    },
    {
      slug: "bubble-soccer-turnier-" + Math.random().toString(36).slice(2, 6),
      category: "entertainment",
      price_cents: 3500,
      price_type: "per_person",
      min_participants: 8,
      max_participants: 30,
      duration_minutes: 120,
      location_type: "own_venue",
      location_city: "Freiburg",
      location_address: "Sportpark Freiburg",
      location_country: "DE",
      cancellation_policy: "flexible",
      auto_confirm: true,
      advance_booking_days: 2,
      title: "Bubble Soccer Turnier",
      short_description: "Fußball mal anders — in aufblasbaren Bällen gegeneinander antreten!",
      description: "Das ultimative Spaß-Event! Schlüpft in riesige aufblasbare Blasen und spielt Fußball wie noch nie. Garantiert der lustigste Sport den ihr je erlebt habt. Inklusive Turnier-Modus mit Pokal für das Gewinnerteam.",
      includes: ["Bubble Suits für alle", "Spielfeld + Tore", "Schiedsrichter", "Turnier-Organisation", "Siegerpokal + Urkunden"],
      requirements: ["Sportschuhe mitbringen", "Bequeme Sportkleidung"],
    },
    {
      slug: "axtwerfen-freiburg-" + Math.random().toString(36).slice(2, 6),
      category: "entertainment",
      price_cents: 3900,
      price_type: "per_person",
      min_participants: 4,
      max_participants: 16,
      duration_minutes: 90,
      location_type: "own_venue",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "moderate",
      auto_confirm: true,
      advance_booking_days: 2,
      title: "Axtwerfen Challenge Freiburg",
      short_description: "Werft Äxte wie ein Wikinger — der neue Trend-Sport mit Turnier-Modus!",
      description: "Axtwerfen ist der ultimative Adrenalinkick! In unserer Indoor-Arena lernt ihr die Technik und tretet dann im Turnier-Modus gegeneinander an. Inklusive Einweisung, Turnier und einem Getränk. Perfekt für JGA und Teamevents.",
      includes: ["Professionelle Einweisung", "Alle Äxte + Equipment", "Turnier mit Rangliste", "1 Getränk pro Person", "Siegerurkunde"],
      requirements: ["Mindestalter 18 Jahre", "Geschlossene Schuhe", "Kein Alkohol vor dem Werfen"],
    },
    {
      slug: "escape-outdoor-freiburg-" + Math.random().toString(36).slice(2, 6),
      category: "entertainment",
      price_cents: 2900,
      price_type: "per_person",
      min_participants: 4,
      max_participants: 30,
      duration_minutes: 120,
      location_type: "outdoor",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "flexible",
      auto_confirm: true,
      advance_booking_days: 1,
      title: "Outdoor Escape Game Freiburg Altstadt",
      short_description: "Löst Rätsel durch die Freiburger Altstadt — das Escape Room Erlebnis an der frischen Luft!",
      description: "Freiburgs Altstadt wird zum riesigen Escape Room! In Teams löst ihr knifflige Rätsel, entschlüsselt Codes und entdeckt versteckte Hinweise an historischen Orten. Vom Münster über die Bächle bis zum Schwabentor — ein Abenteuer das Teamwork und Köpfchen erfordert.",
      includes: ["Spiel-Equipment + App", "Spielleiter per Funk", "Alle Rätsel + Hinweise", "Siegerehrung", "Erinnerungsfoto"],
      requirements: ["Smartphone mitbringen", "Bequeme Schuhe zum Laufen"],
    },
    {
      slug: "cocktail-masterclass-freiburg-" + Math.random().toString(36).slice(2, 6),
      category: "workshop",
      price_cents: 4500,
      price_type: "per_person",
      min_participants: 6,
      max_participants: 20,
      duration_minutes: 150,
      location_type: "own_venue",
      location_city: "Freiburg",
      location_country: "DE",
      cancellation_policy: "moderate",
      auto_confirm: false,
      advance_booking_days: 3,
      title: "Cocktail Masterclass Freiburg",
      short_description: "Mixt eure eigenen Signature Cocktails — mit professionellem Barkeeper!",
      description: "Werdet zum Cocktail-Profi! In unserer Masterclass lernt ihr die Kunst des Mixens von einem erfahrenen Barkeeper. Von Klassikern bis zu euren eigenen Kreationen — inklusive 4 Cocktails, Rezeptkarten und jede Menge Spaß.",
      includes: ["4 Cocktails pro Person", "Alle Zutaten + Equipment", "Professioneller Barkeeper", "Rezeptkarten zum Mitnehmen", "Snackplatte"],
      requirements: ["Mindestalter 18 Jahre"],
    },
  ];

  for (const svc of services) {
    const { title, short_description, description, includes, requirements, ...serviceFields } = svc;

    const { data, error } = await supabase
      .from("marketplace_services")
      .insert({
        agency_id: fambliss.id,
        status: "approved",
        ...serviceFields,
        is_featured: false,
        avg_rating: 0,
        review_count: 0,
        booking_count: 0,
        gallery_urls: [],
        requires_deposit: false,
        deposit_percent: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`❌ ${title}: ${error.message}`);
      continue;
    }

    // Insert translation
    await supabase.from("marketplace_service_translations").insert({
      service_id: data.id,
      locale: "de",
      title,
      short_description,
      description,
      includes: includes || [],
      requirements: requirements || [],
    });

    console.log(`✅ ${title} (${serviceFields.price_cents / 100}€)`);
  }

  console.log("\n🎉 Fertig! Alle Services erstellt.");
}

function generateSQL() {
  console.log("-- ============================================");
  console.log("-- KOPIERE DIESES SQL in den Supabase SQL Editor");
  console.log("-- ============================================\n");

  // Agency directory seed
  console.log("-- 1) Agency Directory seeden");
  console.log("INSERT INTO public.agency_directory (country, country_code, city, name, website, phone, email, description, status) VALUES");
  const esc = (s: string) => s.replace(/'/g, "''");
  AGENCIES.forEach((a, i) => {
    const comma = i < AGENCIES.length - 1 ? "," : ";";
    console.log(`  ('${esc(a.country)}', '${esc(a.countryCode)}', '${esc(a.city)}', '${esc(a.name)}', '${esc(a.website)}', '${esc(a.phone)}', '${esc(a.email)}', '${esc(a.description)}', 'active')${comma}`);
  });

  console.log("\n-- 2) FAMBLISS Test-Services");
  console.log("-- ⚠️  Ersetze 'FAMBLISS_AGENCY_ID' mit der echten UUID aus der agencies Tabelle!\n");
  console.log("-- Finde die ID mit: SELECT id FROM agencies WHERE slug = 'fambliss';");
  console.log("-- Dann ersetze unten alle Vorkommen von FAMBLISS_AGENCY_ID\n");
}

main().catch(console.error);
