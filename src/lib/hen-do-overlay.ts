/**
 * Hen-Do vertical overlay — applies hen-party-specific activity focus,
 * intro adjustments and insider tips on top of the existing 41 cities.
 *
 * Strategy: reuse JGA_CITIES base data (coords, vibe, neighborhoods, budget)
 * and override the activity focus + add hen-specific tips and FAQ slant.
 */

import { JGA_CITIES, type JgaCity } from "./jga-cities";

// Hen-do activity priority — wellness, creative, cocktail, brunch over action
const HEN_DO_ACTIVITY_PRIORITY = [
  "spa",
  "thermal_bath",
  "cocktail_course",
  "pottery",
  "brunch",
  "wine_tasting",
  "yoga",
  "yoga_class",
  "sup",
  "pizza_making",
  "chocolate_workshop",
  "candle_making",
  "flower_arrangement",
  "painting_class",
  "ceramic_painting",
  "perfume_making",
  "jewelry_making",
  "macrame",
  "calligraphy",
  "tie_dye",
  "matcha_workshop",
  "sushi_course",
  "pasta_making",
  "cake_decorating",
  "cocktail_bar",
  "rooftop_bar",
  "rooftop_lounge",
  "salsa_night",
  "tapas_tour",
  "boat_trip",
  "sunset_cruise",
  "sailing",
  "karaoke",
  "escape_room",
  "axe_throwing",
  "drag_show",
  "comedy_show",
  "hammam",
  "massage",
  "sauna",
  "beach_volleyball",
  "beach_day",
  "city_tour",
  "wine_bar",
];

export interface HenDoCityOverlay {
  slug: string;
  /** Hen-specific top activities, picked from HEN_DO_ACTIVITY_PRIORITY ∩ city.topActivitySlugs ∪ HEN_DO_ACTIVITY_PRIORITY. */
  topActivitySlugs: string[];
  /** Hen-specific vibe override (DE). */
  vibeDe: string;
  /** Hen-specific vibe override (EN). */
  vibeEn: string;
  /** Extra hen-specific insider tip (DE). */
  henTipDe: string;
  /** Extra hen-specific insider tip (EN). */
  henTipEn: string;
}

// Per-city overlays — focused, hen-specific touches
const OVERLAYS: HenDoCityOverlay[] = [
  { slug: "berlin", topActivitySlugs: ["spa", "cocktail_course", "pottery", "sup", "rooftop_bar", "brunch", "wine_tasting", "axe_throwing"],
    vibeDe: "Spa-Wochenende, Späti-Pärchen-Selfie und Berliner Cocktail-Bars",
    vibeEn: "Spa weekend, Späti selfies and Berlin cocktail bars",
    henTipDe: "Rooftop-Brunch im 25hours Bikini Berlin oder im House of Small Wonder — beste Hen-Do-Foto-Spots der Stadt.",
    henTipEn: "Rooftop brunch at 25hours Bikini Berlin or House of Small Wonder — best hen-do photo spots in town." },

  { slug: "hamburg", topActivitySlugs: ["spa", "sup", "sailing", "cocktail_course", "rooftop_bar", "brunch", "boat_trip", "sunset_cruise"],
    vibeDe: "Hafenrundfahrt mit Prosecco, Strandbar an der Elbe, Spa in der Hafencity",
    vibeEn: "Prosecco harbour tour, Elbe beach bars, HafenCity spa",
    henTipDe: "Private Barkassen-Tour bei Sonnenuntergang mit eigenem Prosecco an Bord — Pflicht-Hen-Programm in Hamburg.",
    henTipEn: "Private sunset harbour cruise with your own Prosecco onboard — mandatory Hamburg hen programme." },

  { slug: "muenchen", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "rooftop_lounge", "pottery", "yoga", "boat_trip"],
    vibeDe: "Englischer Garten, Tegernsee-Boots-Brunch und bayrisches Spa-Programm",
    vibeEn: "English Garden, Tegernsee boat brunch, Bavarian spa programme",
    henTipDe: "Tagesausflug Tegernsee mit Bootstour + Brunch + Therme Erding (im Winter): perfekte Hen-Day-Kombi.",
    henTipEn: "Day trip to Tegernsee with boat tour + brunch + Therme Erding (winter): perfect hen-day combo." },

  { slug: "koeln", topActivitySlugs: ["brunch", "cocktail_course", "spa", "rooftop_bar", "wine_bar", "pottery", "sup", "city_tour"],
    vibeDe: "Rheinpromenade-Brunch, Belgisches Viertel und Kölner Cocktail-Bars",
    vibeEn: "Rhine promenade brunch, Belgian Quarter, Cologne cocktail bars",
    henTipDe: "Frühstücks-Brauhaus 'Päffgen' am Morgen, Pottery-Workshop nachmittags, Belgisches Viertel abends — die Drei-Akt-Hen-Tour.",
    henTipEn: "Breakfast brewery 'Päffgen', pottery in the afternoon, Belgian Quarter at night — the three-act hen tour." },

  { slug: "frankfurt", topActivitySlugs: ["rooftop_lounge", "cocktail_course", "spa", "brunch", "wine_tasting", "city_tour", "sup", "pottery"],
    vibeDe: "Skyline-Rooftops, Apfelweinprobe und Spa im Hessen-Stil",
    vibeEn: "Skyline rooftops, Apfelwein tasting, Hessian-style spa",
    henTipDe: "Apfelwein-Verkostung in Sachsenhausen am Nachmittag, Skybar im Main Tower zum Sonnenuntergang.",
    henTipEn: "Afternoon Apfelwein tasting in Sachsenhausen, sunset at the Main Tower Sky Lounge." },

  { slug: "stuttgart", topActivitySlugs: ["wine_tasting", "spa", "cocktail_course", "brunch", "rooftop_bar", "pottery", "yoga", "city_tour"],
    vibeDe: "Weinprobe in den Weinbergen, Mineraltherme und schwäbische Cocktail-Bars",
    vibeEn: "Vineyard wine tasting, mineral therme, Swabian cocktail bars",
    henTipDe: "Weinwanderung Untertürkheim mit 4 Weingütern — Hen-Programm und gleichzeitig Foto-Material.",
    henTipEn: "Untertürkheim wine walk with 4 vineyards — hen programme plus photo material in one." },

  { slug: "duesseldorf", topActivitySlugs: ["spa", "cocktail_course", "rooftop_bar", "brunch", "wine_tasting", "city_tour", "pottery", "boat_trip"],
    vibeDe: "Königsallee-Shopping, Cocktail-Bars im Medienhafen und Spa am Rhein",
    vibeEn: "Königsallee shopping, Medienhafen cocktail bars, Rhine spa",
    henTipDe: "Königsallee am Vormittag, Spa-Mittag, Cocktails im Frankenheim Brauhaus abends — der Duftcocktail-Trick zwischendurch.",
    henTipEn: "Königsallee morning, spa lunch, cocktails at Frankenheim in the evening — perfume bar in between." },

  { slug: "wien", topActivitySlugs: ["wine_tasting", "cocktail_course", "spa", "brunch", "rooftop_lounge", "pottery", "city_tour", "boat_trip"],
    vibeDe: "Wiener Heuriger, Café-Hopping und Cocktail-Bars in der Innenstadt",
    vibeEn: "Viennese Heuriger, café-hopping, downtown cocktail bars",
    henTipDe: "Heurigen-Brunch in Grinzing am Sonntag + Loos American Bar abends = die Wiener Hen-Klassiker-Kombi.",
    henTipEn: "Sunday Heuriger brunch in Grinzing + Loos American Bar at night = the classic Vienna hen combo." },

  { slug: "zuerich", topActivitySlugs: ["spa", "sup", "wine_tasting", "rooftop_lounge", "boat_trip", "cocktail_course", "yoga", "brunch"],
    vibeDe: "Zürichsee-SUP, Alpenspa und Schweizer Cocktail-Bars",
    vibeEn: "Lake Zurich SUP, Alpine spa, Swiss cocktail bars",
    henTipDe: "Frauenbad-Limmat-Schwimmen im Sommer als Insider-Hen-Programm — wirklich nur Frauen, ikonisches Foto.",
    henTipEn: "Frauenbad Limmat swimming in summer is a women-only insider hen programme — iconic photo." },

  { slug: "hannover", topActivitySlugs: ["spa", "sup", "cocktail_course", "brunch", "pottery", "wine_tasting", "rooftop_bar", "yoga"],
    vibeDe: "Maschsee-SUP, Spa und entspannte Cocktail-Bars",
    vibeEn: "Maschsee SUP, spa, relaxed cocktail bars",
    henTipDe: "Maschsee-SUP am Morgen + Restaurant Boulevard zum Abendessen + Cocktails in der Lister Meile.",
    henTipEn: "Morning Maschsee SUP + dinner at Restaurant Boulevard + cocktails at Lister Meile." },

  { slug: "dresden", topActivitySlugs: ["spa", "cocktail_course", "rooftop_bar", "brunch", "wine_tasting", "sup", "pottery", "city_tour"],
    vibeDe: "Frauenkirche-Brunch, Spa und Neustadt-Cocktail-Bars",
    vibeEn: "Frauenkirche brunch, spa, Neustadt cocktail bars",
    henTipDe: "Schloss Wackerbarth-Sektprobe am Nachmittag + Cocktails im Lebowski Bar abends — Dresdens beste Hen-Kombi.",
    henTipEn: "Schloss Wackerbarth sparkling-wine tasting + cocktails at Lebowski Bar — best Dresden hen combo." },

  { slug: "leipzig", topActivitySlugs: ["sup", "cocktail_course", "spa", "brunch", "wine_tasting", "pottery", "yoga", "city_tour"],
    vibeDe: "Cospudener See, Plagwitz-Cocktail-Bars und Spa-Wellness",
    vibeEn: "Cospudener See, Plagwitz cocktail bars, spa wellness",
    henTipDe: "SUP am Cospudener See + Brunch in Plagwitz + Karli-Cocktail-Tour — Leipziger Hen-Programm pur.",
    henTipEn: "Cospudener SUP + Plagwitz brunch + Karli cocktail tour — Leipzig hen programme in full." },

  { slug: "nuernberg", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "rooftop_bar", "pottery", "city_tour", "yoga"],
    vibeDe: "Burgaussicht, fränkische Weinprobe und mittelalterliche Cocktail-Bars",
    vibeEn: "Castle view, Franconian wine tasting, medieval cocktail bars",
    henTipDe: "Mittelalter-Kostüm-Foto auf der Burg + fränkische Weinprobe + Cocktail-Bars in der Lorenzer Altstadt.",
    henTipEn: "Medieval costume photo at the castle + Franconian wine tasting + Lorenzer Altstadt cocktail bars." },

  { slug: "salzburg", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "yoga", "boat_trip", "city_tour", "pottery"],
    vibeDe: "Alpenspa, Wolfgangsee-Bootstour und Mozart-Cocktails",
    vibeEn: "Alpine spa, Wolfgangsee boat tour, Mozart cocktails",
    henTipDe: "Wolfgangsee-Schiff + Brunch in St. Wolfgang + Therme Aqua Salza nachmittags = der Premium-Hen-Day.",
    henTipEn: "Wolfgangsee boat + St. Wolfgang brunch + Therme Aqua Salza in the afternoon = premium hen day." },

  { slug: "mallorca", topActivitySlugs: ["spa", "sailing", "sup", "beach_day", "cocktail_course", "yoga", "brunch", "boat_trip"],
    vibeDe: "Bootscharter mit Champagner, Strandtag und Spa am Meer",
    vibeEn: "Champagne boat charter, beach day, seaside spa",
    henTipDe: "Privater Yacht-Charter ab Palma mit Bar an Bord + Strandtag in Cala Mondrago = Mallorcas Hen-Klassiker.",
    henTipEn: "Private Palma yacht charter with onboard bar + beach day at Cala Mondrago = classic Mallorca hen." },

  { slug: "prag", topActivitySlugs: ["spa", "cocktail_course", "pottery", "wine_tasting", "brunch", "rooftop_bar", "city_tour", "boat_trip"],
    vibeDe: "Beer Spa, Cocktail-Bars in Vinohrady und Brunch in der Altstadt",
    vibeEn: "Beer spa, Vinohrady cocktail bars, Old Town brunch",
    henTipDe: "Beer Spa nicht nur für Männer — funktioniert hervorragend als Hen-Programm mit Sekt statt Bier.",
    henTipEn: "Beer Spa works equally well as a hen programme — many spas offer Prosecco instead of beer." },

  { slug: "krakau", topActivitySlugs: ["spa", "cocktail_course", "wine_tasting", "pottery", "brunch", "city_tour", "yoga", "rooftop_bar"],
    vibeDe: "Spa im Wieliczka-Stil, Cocktail-Bars in Kazimierz und polnische Brunch-Kultur",
    vibeEn: "Wieliczka-style spa, Kazimierz cocktail bars, Polish brunch culture",
    henTipDe: "Wodka-Tasting + Pottery in Kazimierz + Brunch im Charlotte: Krakaus alternative Hen-Day-Sequenz.",
    henTipEn: "Vodka tasting + pottery in Kazimierz + brunch at Charlotte: Krakow's alternative hen-day sequence." },

  { slug: "budapest", topActivitySlugs: ["thermal_bath", "spa", "cocktail_course", "boat_trip", "brunch", "wine_tasting", "rooftop_bar", "pottery"],
    vibeDe: "Széchenyi-Bad, Donau-Schifffahrt und Ruin-Pub-Cocktails",
    vibeEn: "Széchenyi baths, Danube cruise, ruin pub cocktails",
    henTipDe: "Thermalbad Széchenyi am Morgen + Brunch in Mazel Tov + abends Cocktails in Erzsébetváros.",
    henTipEn: "Morning Széchenyi thermal bath + brunch at Mazel Tov + evening cocktails in Erzsébetváros." },

  { slug: "amsterdam", topActivitySlugs: ["spa", "sup", "boat_trip", "cocktail_course", "brunch", "rooftop_bar", "wine_tasting", "pottery"],
    vibeDe: "Grachten-Bootstour, Spa und Hipster-Brunch in De Pijp",
    vibeEn: "Canal boat tour, spa, hipster brunch in De Pijp",
    henTipDe: "Private Grachten-Tour mit Champagner und Erdbeeren — eine der schönsten Hen-Programme Europas.",
    henTipEn: "Private canal tour with Champagne and strawberries — one of Europe's loveliest hen programmes." },

  { slug: "barcelona", topActivitySlugs: ["spa", "sup", "sailing", "beach_day", "cocktail_course", "tapas_tour", "yoga", "boat_trip"],
    vibeDe: "Barceloneta-Beach, Tapas-Tour und Cocktail-Bars in El Born",
    vibeEn: "Barceloneta beach, tapas tour, El Born cocktail bars",
    henTipDe: "Tapas-Tour durch El Born mit Wein + Strandtag in Barceloneta + Sunset-Bootstour — Barcelonas Hen-Hits.",
    henTipEn: "Tapas tour through El Born with wine + Barceloneta beach + sunset boat trip — Barcelona hen hits." },

  { slug: "paris", topActivitySlugs: ["spa", "cocktail_course", "wine_tasting", "brunch", "perfume_making", "rooftop_lounge", "boat_trip", "pottery"],
    vibeDe: "Champagner-Bars, Parfüm-Workshop und Seine-Cruise",
    vibeEn: "Champagne bars, perfume workshop, Seine cruise",
    henTipDe: "Parfüm-Workshop bei Candora + Champagner-Bar Le Bisou + Seine-Cruise = Parisien Hen-Day Premium.",
    henTipEn: "Perfume workshop at Candora + Champagne bar Le Bisou + Seine cruise = premium Parisian hen day." },

  { slug: "london", topActivitySlugs: ["spa", "cocktail_course", "brunch", "rooftop_bar", "wine_tasting", "city_tour", "pottery", "comedy_show"],
    vibeDe: "Afternoon Tea, Sky Garden und Cocktail-Bars in Shoreditch",
    vibeEn: "Afternoon tea, Sky Garden, Shoreditch cocktail bars",
    henTipDe: "Afternoon Tea im Sketch oder im Connaught + Sky Garden bei Sonnenuntergang + Lyaness Cocktail-Bar.",
    henTipEn: "Afternoon tea at Sketch or Connaught + Sky Garden sunset + Lyaness cocktail bar." },

  { slug: "lissabon", topActivitySlugs: ["spa", "sup", "sailing", "cocktail_course", "brunch", "wine_tasting", "tapas_tour", "boat_trip"],
    vibeDe: "Bairro Alto-Cocktails, Atlantik-SUP und Pastel-de-Nata-Brunch",
    vibeEn: "Bairro Alto cocktails, Atlantic SUP, pastel-de-nata brunch",
    henTipDe: "Surfen-light in Cascais + Pastel-de-Nata-Tour + Bairro Alto-Bars: Lissabons Hen-Tagesablauf.",
    henTipEn: "Light surfing in Cascais + pastel-de-nata tour + Bairro Alto bars: Lisbon's hen day flow." },

  { slug: "istanbul", topActivitySlugs: ["hammam", "spa", "boat_trip", "cocktail_course", "brunch", "rooftop_lounge", "tapas_tour", "yoga"],
    vibeDe: "Klassischer Hamam, Bosporus-Yacht und Cocktail-Bars in Karaköy",
    vibeEn: "Classic hammam, Bosphorus yacht, Karaköy cocktail bars",
    henTipDe: "Cağaloğlu Hamam (500 Jahre alt) + Bosporus-Yacht-Charter + Karaköy-Rooftop = orientalisches Hen-Premium.",
    henTipEn: "Cağaloğlu Hamam (500 years old) + Bosphorus yacht charter + Karaköy rooftop = oriental hen premium." },

  { slug: "madrid", topActivitySlugs: ["spa", "tapas_tour", "cocktail_course", "wine_tasting", "brunch", "rooftop_bar", "yoga", "city_tour"],
    vibeDe: "Tapas-Tour, La Latina-Brunch und Cocktail-Bars in Malasaña",
    vibeEn: "Tapas tour, La Latina brunch, Malasaña cocktail bars",
    henTipDe: "La Latina-Tapas-Brunch am Sonntag + Salamanca-Spa + Cocktails im Hotel Patriotic — Madrids Hen-Klassiker.",
    henTipEn: "Sunday La Latina tapas brunch + Salamanca spa + cocktails at Hotel Patriotic — Madrid hen classics." },

  { slug: "valencia", topActivitySlugs: ["beach_day", "sup", "spa", "cocktail_course", "tapas_tour", "brunch", "boat_trip", "sailing"],
    vibeDe: "Strand-Yoga, Paella-Kochkurs und mediterrane Cocktail-Bars",
    vibeEn: "Beach yoga, paella cooking class, Mediterranean cocktail bars",
    henTipDe: "Paella-Kochkurs am Strand + Yoga-Session + Cocktails in Ruzafa = Valencias Mediterran-Hen-Day.",
    henTipEn: "Beachside paella class + yoga session + cocktails in Ruzafa = Valencia Mediterranean hen day." },

  { slug: "ibiza", topActivitySlugs: ["spa", "sailing", "beach_day", "yoga", "sunset_cruise", "cocktail_course", "boat_trip", "brunch"],
    vibeDe: "Sunset-Boat, Yoga-Retreat und Beachclub-Cocktails",
    vibeEn: "Sunset boat, yoga retreat, beach club cocktails",
    henTipDe: "Yoga-Sonnenaufgang in Cala Comte + Sunset-Boat-Tour zur Formentera + Ushuaïa-Pool-Party — Ibizas Hen-Hochpunkt.",
    henTipEn: "Sunrise yoga at Cala Comte + sunset boat to Formentera + Ushuaïa pool party — Ibiza hen peak." },

  { slug: "rom", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "pasta_making", "rooftop_lounge", "city_tour", "tapas_tour"],
    vibeDe: "Aperitivo, Pasta-Workshop und Cocktail-Bars in Trastevere",
    vibeEn: "Aperitivo, pasta workshop, Trastevere cocktail bars",
    henTipDe: "Pasta-Kochkurs bei einer Nonna + Aperitivo am Tiber + Rooftop-Bar im Hotel de Russie — Roms Hen-Klassiker.",
    henTipEn: "Pasta class with a nonna + Aperitivo on the Tiber + rooftop bar at Hotel de Russie — Rome hen classics." },

  { slug: "mailand", topActivitySlugs: ["spa", "cocktail_course", "wine_tasting", "brunch", "rooftop_lounge", "pasta_making", "city_tour", "boat_trip"],
    vibeDe: "Aperitivo-Naviglio, Comer-See-Tagestour und Cocktail-Bars in Brera",
    vibeEn: "Naviglio aperitivo, Lake Como day trip, Brera cocktail bars",
    henTipDe: "Comer-See-Tagestour mit Bellagio-Brunch + Aperitivo am Naviglio Grande + Bar Basso für den Negroni-Sbagliato.",
    henTipEn: "Lake Como day trip with Bellagio brunch + aperitivo on the Naviglio Grande + Bar Basso for the Negroni Sbagliato." },

  { slug: "florenz", topActivitySlugs: ["wine_tasting", "spa", "cocktail_course", "pasta_making", "brunch", "city_tour", "rooftop_lounge", "pottery"],
    vibeDe: "Chianti-Weinprobe, Pasta-Workshop und Cocktail-Bars in Oltrarno",
    vibeEn: "Chianti wine tasting, pasta workshop, Oltrarno cocktail bars",
    henTipDe: "Chianti-Halbtagestour mit Weingut-Brunch + Pasta-Kochkurs in der Stadt + Piazzale Michelangelo zum Sonnenuntergang.",
    henTipEn: "Half-day Chianti tour with winery brunch + pasta class in town + Piazzale Michelangelo at sunset." },

  { slug: "dublin", topActivitySlugs: ["spa", "cocktail_course", "brunch", "rooftop_bar", "wine_tasting", "city_tour", "pottery", "comedy_show"],
    vibeDe: "Afternoon Tea, Cocktail-Bars in Smithfield und Spa im Merrion Hotel",
    vibeEn: "Afternoon tea, Smithfield cocktail bars, Merrion Hotel spa",
    henTipDe: "Merrion-Hotel-Afternoon-Tea + Cocktails im Vintage Cocktail Club + Comedy-Show im Laughter Lounge.",
    henTipEn: "Merrion Hotel afternoon tea + cocktails at Vintage Cocktail Club + comedy at Laughter Lounge." },

  { slug: "edinburgh", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "city_tour", "rooftop_bar", "pottery", "comedy_show"],
    vibeDe: "Whisky-Tasting, Spa im Balmoral und Cocktail-Bars im Old Town",
    vibeEn: "Whisky tasting, Balmoral spa, Old Town cocktail bars",
    henTipDe: "Balmoral-Spa + Holyrood-Whisky-Tasting + Cocktails in Bramble — Edinburghs schickste Hen-Sequenz.",
    henTipEn: "Balmoral spa + Holyrood whisky tasting + cocktails at Bramble — Edinburgh's smartest hen sequence." },

  { slug: "porto", topActivitySlugs: ["spa", "wine_tasting", "cocktail_course", "brunch", "sup", "boat_trip", "tapas_tour", "rooftop_bar"],
    vibeDe: "Portwein-Kellerei, Douro-Bootstour und Cocktail-Bars in Galerias",
    vibeEn: "Port wine cellars, Douro boat tour, Galerias cocktail bars",
    henTipDe: "Portwein-Kellerei-Tour mit Verkostung + Douro-Schifffahrt + Cocktails am Galerias-Strip.",
    henTipEn: "Port wine cellar tour with tasting + Douro boat cruise + Galerias strip cocktails." },

  { slug: "warschau", topActivitySlugs: ["spa", "cocktail_course", "wine_tasting", "brunch", "city_tour", "pottery", "rooftop_bar", "yoga"],
    vibeDe: "Spa im Raffles Europejski, Praga-Cocktails und Brunch in Mokotów",
    vibeEn: "Raffles Europejski spa, Praga cocktails, Mokotów brunch",
    henTipDe: "Raffles-Spa + Vodka-Tasting im Pijalnia + Cocktails im Bar 23 in Praga.",
    henTipEn: "Raffles spa + vodka tasting at Pijalnia + cocktails at Bar 23 in Praga." },

  { slug: "athen", topActivitySlugs: ["spa", "sup", "sailing", "cocktail_course", "wine_tasting", "brunch", "boat_trip", "tapas_tour"],
    vibeDe: "Akropolis-Spaziergang, Saronische-Inseln-Bootstour und Cocktail-Bars in Kolonaki",
    vibeEn: "Acropolis walk, Saronic Islands boat tour, Kolonaki cocktail bars",
    henTipDe: "Saronische-Insel-Tagestour Aegina + Akropolis-Sundown-Foto + Cocktails in Kolonaki.",
    henTipEn: "Saronic Aegina day trip + Acropolis sundown photo + Kolonaki cocktails." },

  { slug: "kopenhagen", topActivitySlugs: ["spa", "cocktail_course", "brunch", "wine_tasting", "rooftop_bar", "city_tour", "pottery", "yoga"],
    vibeDe: "Hygge-Brunch, Spa im Hotel d'Angleterre und Cocktail-Bars in Vesterbro",
    vibeEn: "Hygge brunch, Hotel d'Angleterre spa, Vesterbro cocktail bars",
    henTipDe: "Hotel d'Angleterre Spa + Brunch im Apollo Bar + Cocktails in Lidkoeb Bar.",
    henTipEn: "Hotel d'Angleterre spa + Apollo Bar brunch + Lidkoeb Bar cocktails." },

  { slug: "stockholm", topActivitySlugs: ["spa", "sailing", "sup", "cocktail_course", "brunch", "boat_trip", "wine_tasting", "yoga"],
    vibeDe: "Schären-Bootstour, Sturebadet-Spa und Cocktail-Bars im Östermalm",
    vibeEn: "Archipelago boat tour, Sturebadet spa, Östermalm cocktail bars",
    henTipDe: "Sturebadet-Spa + Schären-Bootstour + Cocktails im Linje Tio.",
    henTipEn: "Sturebadet spa + archipelago boat tour + Linje Tio cocktails." },

  { slug: "tallinn", topActivitySlugs: ["spa", "sauna", "cocktail_course", "brunch", "pottery", "city_tour", "wine_tasting", "yoga"],
    vibeDe: "Estnische Sauna, Telliskivi-Brunch und Mittelalter-Cocktail-Bars",
    vibeEn: "Estonian sauna, Telliskivi brunch, medieval cocktail bars",
    henTipDe: "Traditionelle Suitsusaun (Rauchsauna) + Brunch in Telliskivi + Cocktails im St. Vitus.",
    henTipEn: "Traditional Suitsusaun (smoke sauna) + Telliskivi brunch + St. Vitus cocktails." },

  { slug: "bukarest", topActivitySlugs: ["spa", "thermal_bath", "cocktail_course", "brunch", "wine_tasting", "city_tour", "rooftop_bar", "pottery"],
    vibeDe: "Therme București, Lipscani-Cocktails und rumänischer Spa-Tag",
    vibeEn: "Therme București, Lipscani cocktails, Romanian spa day",
    henTipDe: "Therme București Tageskarte + Cocktails in der Eden Bar + Brunch in Origo.",
    henTipEn: "Therme București day pass + Eden Bar cocktails + Origo brunch." },

  { slug: "bruessel", topActivitySlugs: ["spa", "cocktail_course", "wine_tasting", "brunch", "chocolate_workshop", "city_tour", "rooftop_bar", "pottery"],
    vibeDe: "Schokoladen-Workshop, Brüsseler Bistro-Brunch und belgische Cocktail-Bars",
    vibeEn: "Chocolate workshop, Brussels bistro brunch, Belgian cocktail bars",
    henTipDe: "Schokoladen-Workshop + Spa im Steigenberger + Cocktails im Brussels Cocktail Club.",
    henTipEn: "Chocolate workshop + Steigenberger spa + Brussels Cocktail Club drinks." },

  { slug: "nizza", topActivitySlugs: ["spa", "beach_day", "sup", "cocktail_course", "wine_tasting", "boat_trip", "brunch", "sailing"],
    vibeDe: "Promenade des Anglais, Côte-d'Azur-Bootscharter und Cocktail-Bars im Vieux Nice",
    vibeEn: "Promenade des Anglais, Côte d'Azur boat charter, Vieux Nice cocktail bars",
    henTipDe: "Bootscharter Côte d'Azur + Spa im Negresco + Cocktails in Le Bar du Negresco.",
    henTipEn: "Côte d'Azur boat charter + Negresco spa + Le Bar du Negresco cocktails." },
];

const overlayMap = new Map(OVERLAYS.map((o) => [o.slug, o]));

export interface HenDoCityData {
  city: JgaCity;
  overlay: HenDoCityOverlay;
}

export function getHenDoCity(slug: string): HenDoCityData | undefined {
  const overlay = overlayMap.get(slug.toLowerCase());
  if (!overlay) return undefined;
  const city = JGA_CITIES.find((c) => c.slug === overlay.slug);
  if (!city) return undefined;
  return { city, overlay };
}

export function getAllHenDoCities(): HenDoCityData[] {
  return OVERLAYS.map((overlay) => {
    const city = JGA_CITIES.find((c) => c.slug === overlay.slug)!;
    return { city, overlay };
  });
}

/** English slug mapping — hen-do uses anglicised slugs like /hen-do/munich. */
const EN_SLUG_MAP: Record<string, string> = {
  muenchen: "munich",
  koeln: "cologne",
  duesseldorf: "dusseldorf",
  wien: "vienna",
  zuerich: "zurich",
  nuernberg: "nuremberg",
  krakau: "krakow",
  prag: "prague",
  lissabon: "lisbon",
  rom: "rome",
  mailand: "milan",
  florenz: "florence",
  warschau: "warsaw",
  athen: "athens",
  kopenhagen: "copenhagen",
  bukarest: "bucharest",
  bruessel: "brussels",
  nizza: "nice",
};

const DE_FROM_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_SLUG_MAP).map(([de, en]) => [en, de])
);

export function deSlugFromEn(enSlug: string): string {
  return DE_FROM_EN[enSlug.toLowerCase()] ?? enSlug.toLowerCase();
}

export function enSlugFromDe(deSlug: string): string {
  return EN_SLUG_MAP[deSlug.toLowerCase()] ?? deSlug.toLowerCase();
}
