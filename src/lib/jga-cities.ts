/**
 * JGA-Stadt-Daten für /jga/[stadt] Landingpages.
 *
 * SEO-Strategie: Jede Stadt = eigene Page mit High-Intent-Keyword
 * ("JGA Berlin", "Junggesellenabschied Hamburg" etc.). Long-Tail-Traffic
 * + interner Link-Pool. Activities referenzieren src/lib/activities-library.ts
 * via value-slug, damit nichts dupliziert wird.
 */

import type { ActivityCategory } from "./activities-library";

export type CountryCode =
  | "DE"
  | "AT"
  | "CH"
  | "ES"
  | "FR"
  | "IT"
  | "NL"
  | "PT"
  | "PL"
  | "GB"
  | "IE"
  | "CZ"
  | "HU"
  | "TR"
  | "BE"
  | "DK"
  | "SE"
  | "GR"
  | "RO"
  | "EE";

export interface JgaCity {
  slug: string;
  name: string;
  nameLocative: string; // "in Berlin", "in München" — für natürliche Headlines
  country: CountryCode;
  countryName: string;
  region: string;
  vibe: string; // 1-Satz-Charakter der Stadt
  intro: string; // 2–3 Sätze SEO-Intro
  paragraphs: string[]; // Body-Content für SEO-Tiefe
  topActivitySlugs: string[]; // Verweise auf activities-library
  neighborhoods: { name: string; tagline: string }[];
  budget: {
    weekend: string; // "350–600 € pro Person"
    activity: string;
    party: string;
  };
  bestSeasons: string[];
  insiderTips: string[];
  faqs: { q: string; a: string }[];
  coordinates: { lat: number; lng: number };
  population: number;
  monthlySearchVolume?: number; // optional, falls bekannt — fürs Prioritising
  /** Wikidata-QID — verlinkt Stadt mit dem Knowledge Graph (GEO/AI-Discovery). */
  wikidataId?: string;
  /** Internationale Reisekategorie — hilft AI-Suchmaschinen beim Verstehen. */
  isAbroad?: boolean;
}

export const JGA_CITIES: JgaCity[] = [
  {
    slug: "berlin",
    name: "Berlin",
    nameLocative: "in Berlin",
    country: "DE",
    countryName: "Deutschland",
    region: "Berlin",
    vibe: "Hauptstadt-Eskalation zwischen Späti-Bier und Berghain-Schlange",
    intro:
      "Ein JGA in Berlin heißt: keine Sperrstunde, jede Subkultur greifbar und genug Locations, um drei Wochenenden nicht zu wiederholen. Egal ob Techno-Marathon, Spreefahrt mit Crew oder Karaoke in Mitte — Berlin liefert die Reibung, die einen Junggesellenabschied von einem normalen Wochenende unterscheidet.",
    paragraphs: [
      "Berlin ist die unangefochtene Nummer eins für JGAs in Deutschland — nicht wegen Sehenswürdigkeiten, sondern wegen der Nächte. Die Stadt hat keinen einheitlichen Vibe, sondern dutzende parallele: Friedrichshain für rauen Club-Spaß, Mitte für glattere Bars, Neukölln für Pop-up-Underground, Kreuzberg für alles dazwischen.",
      "Tagsüber funktioniert Berlin als XXL-Spielplatz: Spreefahrten mit eigener Bar, Trabi-Touren durch den Osten, Schießstand, Karting im Tempelhof-Hangar, Escape Rooms oder Stand-Up-Paddling auf der Rummelsburger Bucht. Abends übernehmen Rooftop-Bars in Mitte, Karaoke in Friedrichshain oder die ikonischen Spätis als kostenfreie Bar zwischen den Locations.",
      "Wer einen JGA in Berlin plant, sollte zwei Dinge wissen: Türsteher entscheiden, nicht der Gästeliste-Anspruch, und Taxis werden teuer, wenn die Gruppe wächst — U-Bahn fährt nachts durch, das spart hundert Euro pro Nacht.",
    ],
    topActivitySlugs: [
      "karting",
      "escape_room",
      "lasertag",
      "sup",
      "shooting_range",
      "axe_throwing",
      "vr_arena",
      "rage_room",
      "segway_tour",
      "bubble_soccer",
    ],
    neighborhoods: [
      { name: "Friedrichshain", tagline: "Rauer Club-Vibe, RAW-Gelände, Berghain um die Ecke" },
      { name: "Mitte", tagline: "Schickere Bars, Rooftops, Hackescher Markt für After-Work-Crowds" },
      { name: "Kreuzberg", tagline: "Späti-Hopping zwischen Bergmannkiez und Maybachufer" },
      { name: "Prenzlauer Berg", tagline: "Brunch am Mauerpark, entspanntere Abende für gemischte Gruppen" },
    ],
    budget: {
      weekend: "300–550 € pro Person für ein Wochenende inkl. Übernachtung",
      activity: "25–80 € pro Person und Aktivität",
      party: "40–80 € pro Person an einem Club-Abend (Eintritt + Getränke)",
    },
    bestSeasons: ["Mai–September (Open-Air-Saison)", "Dezember (Weihnachtsmarkt-Crawls)"],
    insiderTips: [
      "Späti-Bar-Crawl statt teurer Pub-Crawl: 8 Spätis in Neukölln, jede:r zahlt eine Runde — günstiger, lustiger, sehr Berlin.",
      "Berghain-Anstellen mit 10 Leuten ist ein No-Go: kleinere Clubs (Renate, Sisyphos, RSO) sind gruppenfreundlicher.",
      "Trabi-Safari oder Hop-on-Hop-off-Trabi durch Ost-Berlin als Tages-Highlight — bringt selbst Schwiegerväter zum Lachen.",
      "Ferienwohnung in Friedrichshain statt Hotel in Mitte: nachts kurze Wege, tagsüber besseres Frühstück.",
    ],
    faqs: [
      {
        q: "Was kostet ein JGA-Wochenende in Berlin pro Person?",
        a: "Realistisch zwischen 300 und 550 € pro Person für zwei Übernachtungen, zwei Aktivitäten und eine Clubnacht. Mit AirBnB statt Hotel und Spätis statt Bars geht es unter 250 €.",
      },
      {
        q: "Welche Aktivität funktioniert am besten für gemischte Gruppen?",
        a: "Stand-Up-Paddling auf der Spree oder ein Escape-Room mit Pizza danach — beides taugt für sportliche und weniger sportliche Crews, anders als Karting oder Paintball.",
      },
      {
        q: "Wo schläft man am besten als 8er-Gruppe?",
        a: "Eine AirBnB-Wohnung in Friedrichshain oder Kreuzberg ist meist günstiger als Mehrbettzimmer im Hostel und gibt euch eine Pre-Party-Location ohne Sperrstunde.",
      },
      {
        q: "Wann sollte man buchen?",
        a: "Für Mai–September: 8–12 Wochen Vorlauf für Unterkunft und beliebte Aktivitäten wie Karting oder Escape Rooms. Clubs braucht man nicht buchen.",
      },
    ],
    coordinates: { lat: 52.52, lng: 13.405 },
    population: 3700000,
    monthlySearchVolume: 12000,
  },
  {
    slug: "hamburg",
    name: "Hamburg",
    nameLocative: "in Hamburg",
    country: "DE",
    countryName: "Deutschland",
    region: "Hamburg",
    vibe: "Hafenkante, Reeperbahn, Alster — JGA-Klassiker mit norddeutschem Understatement",
    intro:
      "Hamburg ist der unauffällige Champion für JGAs: weniger Hype als Berlin, kompaktere Innenstadt, dafür die Reeperbahn als bewiesener Party-Stresstest. Dazu Wasser an jeder Ecke — Hafenrundfahrt mit eigener Bar, Alster-SUP, Strandbar an der Elbe.",
    paragraphs: [
      "Was Hamburg für einen JGA besonders macht, ist die Dichte: Vom Hauptbahnhof zur Reeperbahn sind es 15 Minuten U-Bahn, vom Schanzenviertel zum Hafen 20 Minuten zu Fuß. Eine 10er-Gruppe verliert hier weniger Zeit in Taxis als in jeder anderen deutschen Großstadt.",
      "Tagsüber ist Wasser die DNA: Hafenrundfahrt mit Privat-Barkasse (10–12 Leute, eigene Getränke an Bord), Stand-Up-Paddling auf der Außenalster, Drachenbootfahren als Team-Olympiade. Wem Wasser zu zahm ist, hat in Hamburg dichteres Escape-Room-, Lasertag- und Indoor-Skydiving-Netz als Berlin.",
      "Abends übernimmt die Reeperbahn die Regie: Karaoke in der Großen Freiheit, Live-Musik im Hans-Albers-Eck, Schmidt Tivoli für eine Show, danach Mini-Golf in der Bernhard-Nocht-Straße. Wer es weniger touristisch will, geht in die Schanze oder ins Karoviertel.",
    ],
    topActivitySlugs: [
      "sup",
      "sailing",
      "karting",
      "escape_room",
      "lasertag",
      "indoor_skydiving",
      "axe_throwing",
      "shooting_range",
      "rage_room",
      "vr_arena",
    ],
    neighborhoods: [
      { name: "St. Pauli / Reeperbahn", tagline: "Klassischer JGA-Abend, Karaoke, Live-Musik, Mini-Golf-Bars" },
      { name: "Schanzenviertel", tagline: "Hippere Bar-Crawls, kleinere Clubs, gemischte Crowd" },
      { name: "HafenCity", tagline: "Rooftops mit Elbphilharmonie-Blick, Pre-Drinks mit Style" },
      { name: "Karoviertel", tagline: "Independent-Bars zwischen Schanze und Reeperbahn" },
    ],
    budget: {
      weekend: "320–580 € pro Person inkl. Hostel/Hotel",
      activity: "30–90 € pro Person und Aktivität",
      party: "45–80 € pro Person Reeperbahn-Abend",
    },
    bestSeasons: ["Mai–September (Wasser-Aktivitäten)", "Dezember (Weihnachtsmarkt + Hafenfeuerwerk)"],
    insiderTips: [
      "Barkassen-Hafenrundfahrt buchen, nicht die Standard-Touri-Tour: privat ab 250 € für eure Crew, eigene Getränke erlaubt.",
      "Sankt-Pauli-Heimspiel + JGA = nuklear. Wenn ein Heimspiel passt, integriert es als Hauptpunkt, nicht als Beiwerk.",
      "Frühstück am Fischmarkt (sonntags ab 5 Uhr) ist Hamburger Tradition — perfekt für JGAs, die durchmachen.",
      "Reeperbahn-Hotels sind nachts laut. Buche in der Schanze oder Karoviertel, das ist 2 U-Bahn-Stationen entfernt.",
    ],
    faqs: [
      {
        q: "Lohnt sich die Reeperbahn für JGAs noch?",
        a: "Ja, aber selektiv. Karaoke-Bars und Live-Musik-Locations funktionieren weiterhin, klassische Touri-Discos sind teuer und uninspiriert. Kombiniert Reeperbahn-Abend mit Schanze-Vor-Drinks.",
      },
      {
        q: "Was kostet eine private Hafenrundfahrt für eine Gruppe?",
        a: "Barkassen für 10–12 Personen liegen bei 250–450 € für 2 Stunden, eigene Getränke meist erlaubt. Für JGAs der beste Programmpunkt nach dem Brunch.",
      },
      {
        q: "Wie viele Tage braucht man für Hamburg?",
        a: "Zwei Nächte reichen. Freitag Anreise + Reeperbahn, Samstag Hafenrundfahrt + Aktivität + Abend, Sonntag Fischmarkt-Frühstück und Abreise.",
      },
      {
        q: "Welche Aktivität ist Pflicht?",
        a: "Etwas auf dem Wasser. Eine JGA in Hamburg ohne Hafen oder Alster fühlt sich an wie ein Bayern-Trip ohne Bier.",
      },
    ],
    coordinates: { lat: 53.5511, lng: 9.9937 },
    population: 1900000,
    monthlySearchVolume: 8100,
  },
  {
    slug: "muenchen",
    name: "München",
    nameLocative: "in München",
    country: "DE",
    countryName: "Deutschland",
    region: "Bayern",
    vibe: "Biergarten, Olympiapark, Alpenrand — JGA mit Substanz und etwas Tracht",
    intro:
      "München ist das Anti-Berlin unter den JGA-Städten: gepflegter, klarer strukturiert, mit Alpen-Hinterland für Tagesausflüge. Für Crews, die Bier mit Tradition statt Bier mit Ironie wollen, ist es die erste Adresse.",
    paragraphs: [
      "München funktioniert für JGAs auf zwei Wegen: city-fokussiert mit Biergärten, Hofbräuhaus, Karaoke in der Sonnenstraße — oder als Basis für Bayern-Trips mit Wandertag im Karwendel, Surf-Session am Eisbach und Abend zurück in der Stadt.",
      "Das Hofbräuhaus ist Pflicht-Klischee, das beste Bier wird aber im Augustiner-Keller und im Hirschgarten ausgeschenkt — beide haben Selbstbedienungsbereiche, in denen 10 Leute keine Reservierung brauchen. Im Sommer ist der Englische Garten der größte JGA-Spielplatz Europas: Eisbach-Surfen anschauen, Bier am Chinesischen Turm, Schwimmen im Eisbach für Mutige.",
      "Aktivitätsseitig hat München starke Karts, einen der besten Hochseilgärten Deutschlands (Vaterstetten), Sim-Racing-Studios und Rafting auf der Isar (Bad Tölz, 1 Stunde raus). Abends dünner als Berlin oder Hamburg, aber Glockenbach- und Maxvorstadt liefern gute Bar-Crawls.",
    ],
    topActivitySlugs: [
      "karting",
      "rafting",
      "high_ropes",
      "sim_racing",
      "escape_room",
      "axe_throwing",
      "lasertag",
      "climbing",
      "vr_arena",
      "shooting_range",
    ],
    neighborhoods: [
      { name: "Glockenbachviertel", tagline: "Beste Bars, gemischte Crowd, kreative Cocktail-Spots" },
      { name: "Maxvorstadt", tagline: "Studentisch, günstiger, gute Pre-Drinks vor Innenstadt-Touren" },
      { name: "Schwabing", tagline: "Klassische Münchner Bar-Kultur, näher zum Englischen Garten" },
      { name: "Altstadt", tagline: "Hofbräuhaus, Marienplatz, touristisch aber kompakt" },
    ],
    budget: {
      weekend: "380–650 € pro Person (München ist teurer als Hamburg/Berlin)",
      activity: "35–100 € pro Person",
      party: "50–90 € pro Person Innenstadt-Abend",
    },
    bestSeasons: ["Mai–August (Biergarten)", "Oktober (Wiesn — Sondervorlauf 12 Monate!)", "Dezember (Christkindlmarkt)"],
    insiderTips: [
      "Wiesn-JGA = mindestens 12 Monate Vorlauf für Zeltreservierung. Ohne Reservierung am Wochenende nur bei Glück Zugang.",
      "Eisbach-Welle ist gratis Entertainment: Surfer beobachten, eigene Crew anfeuern. Pflicht-Stopp.",
      "Tagesausflug Tegernsee oder Walchensee mit S-Bahn/BOB: Bier-Boat-Touren ab 200 € für eine Gruppe.",
      "Hofbräuhaus reservieren ist unmöglich für JGAs. Lieber Augustiner oder Paulaner am Nockherberg.",
    ],
    faqs: [
      {
        q: "JGA in München während der Wiesn — gute Idee?",
        a: "Spektakulär, aber teuer und logistisch hart. Hotelpreise verdoppeln sich, Zeltreservierung 12 Monate vorher. Wenn ihr es ohne Reservierung versucht: morgens um 8 Uhr anstehen.",
      },
      {
        q: "Welcher Biergarten für eine JGA-Gruppe?",
        a: "Augustiner-Keller (Innenstadt, riesig, Selbstbedienung), Hirschgarten (Wiesn-Bier ganzjährig, Familien-OK, JGAs gehen unter), oder Seehaus im Englischen Garten für den Vibe.",
      },
      {
        q: "Was kostet ein Wochenende in München realistisch?",
        a: "Rechnet 400 € pro Person aufwärts. München ist die teuerste deutsche JGA-Stadt, vor allem bei Hotels. AirBnB-Wohnungen sind oft die wirtschaftlichste Wahl ab 6 Personen.",
      },
      {
        q: "Welche Tagestouren raus aus der Stadt sind machbar?",
        a: "Rafting an der Isar (Bad Tölz, 1h), Klettersteig im Karwendel (1,5h), Bootstouren am Tegernsee oder Starnberger See (45min mit S-Bahn). Alles ohne Mietwagen erreichbar.",
      },
    ],
    coordinates: { lat: 48.1351, lng: 11.582 },
    population: 1500000,
    monthlySearchVolume: 6600,
  },
  {
    slug: "koeln",
    name: "Köln",
    nameLocative: "in Köln",
    country: "DE",
    countryName: "Deutschland",
    region: "Nordrhein-Westfalen",
    vibe: "Kölsch, Karneval, Karaoke — die freundlichste JGA-Stadt Deutschlands",
    intro:
      "Köln ist der Sympathie-Champion: Niemand stört sich an grölenden Gruppen, jede Kneipe begrüßt euch, der Karneval ist als kollektive JGA-Pille fest im DNA. Wer Berlin zu schroff und München zu teuer findet, landet hier.",
    paragraphs: [
      "Köln versteht JGAs intuitiv. Brauhaus-Tour als Pflichtprogramm — Päffgen, Früh, Sion, Reissdorf — funktioniert mit jeder Gruppengröße ohne Reservierung. Die Köbesse (Kellner) sind professionell ruppig, Kölsch in 0,2l-Stangen kommt im Sekundentakt, jede Kneipe hat ihre eigene Spielregel.",
      "Tagsüber bietet Köln Karting, Boulder-Hallen (Köln Süd), Lasertag, Stand-Up-Paddling auf dem Rhein, KölnTriangle-Aussichtsplattform, Belgisches Viertel zum Bummeln. Highlight für Foodies: ein 4-Brauhäuser-Crawl mit Halver Hahn als Snack-Tradition.",
      "Abends teilen sich Belgisches Viertel (hipper) und Zülpicher Straße (studentisch-kalibriert) die Crowd. Karneval (Februar/März) und Pride (Juli) sind Sondervorlauf — sonst funktioniert Köln spontan besser als jede andere DE-Stadt.",
    ],
    topActivitySlugs: [
      "karting",
      "climbing",
      "escape_room",
      "lasertag",
      "sup",
      "axe_throwing",
      "bubble_soccer",
      "vr_arena",
      "shooting_range",
      "rage_room",
    ],
    neighborhoods: [
      { name: "Belgisches Viertel", tagline: "Hippere Cocktail-Bars, kreative Crowd" },
      { name: "Zülpicher Straße", tagline: "Brauhäuser, Pizza-Buden, Karneval-Hochburg" },
      { name: "Ehrenfeld", tagline: "Indie-Bars, Live-Musik, Kölner Alternative-Szene" },
      { name: "Altstadt", tagline: "Klassische Brauhäuser, Dom-Nähe, touristisch aber pflichtig" },
    ],
    budget: {
      weekend: "280–500 € pro Person (eine der günstigsten Großstädte)",
      activity: "25–80 € pro Person",
      party: "35–70 € pro Person Brauhaus-Tour",
    },
    bestSeasons: ["Februar/März (Karneval — extrem)", "Mai–September (Rhein-Aktivitäten)", "Juli (Pride)"],
    insiderTips: [
      "Brauhaus-Tour als Frühprogramm: 4 Brauhäuser zwischen 18 und 22 Uhr, danach Belgisches Viertel — billiger und besser als jede Pub-Crawl-Tour.",
      "Karneval-JGA = 9 Monate Vorlauf für Unterkunft. Preise verdreifachen sich, aber Stimmung ist unvergleichlich.",
      "FC-Köln-Heimspiel mit JGA = Volksfest-Pflicht. Tickets über offiziellen Anbieter, Schwarzmarkt am Stadion riskant.",
      "Köln zu Düsseldorf: 25 min mit ICE. Eine 'Alt vs. Kölsch'-Bar-Crawl ist regional ein perfekter Twist.",
    ],
    faqs: [
      {
        q: "Karneval-JGA in Köln — Pro/Contra?",
        a: "Pro: einmaliges Erlebnis, kein Mensch bemerkt eure Verkleidung, jede Bar ist voll. Contra: Hotelpreise verdreifachen sich, Anreise schwierig, kein Wiederfinden bei Trennung der Gruppe.",
      },
      {
        q: "Brauhaus-Tour selbst organisieren oder buchen?",
        a: "Selbst organisieren — 4 Brauhäuser im Umkreis von 800 Metern, keine Reservierung nötig für die meisten. Geführte Touren kosten 40 € pro Person und bieten kaum Mehrwert.",
      },
      {
        q: "Köln im Sommer ohne Karneval — lohnt es sich?",
        a: "Definitiv. Rhein-Promenade, Cologne Pride im Juli, SUP, Brauhäuser mit Außengastronomie. Tatsächlich entspannter und günstiger als zur Karnevalszeit.",
      },
      {
        q: "Wie viele Brauhäuser sollte eine Tour beinhalten?",
        a: "Drei bis fünf, abhängig vom Zeitplan. Klassiker: Päffgen → Früh → Sion → Reissdorf. Pro Stop 30–45 Minuten, ein 0,2l-Kölsch reicht.",
      },
    ],
    coordinates: { lat: 50.9375, lng: 6.9603 },
    population: 1100000,
    monthlySearchVolume: 5400,
  },
  {
    slug: "frankfurt",
    name: "Frankfurt",
    nameLocative: "in Frankfurt",
    country: "DE",
    countryName: "Deutschland",
    region: "Hessen",
    vibe: "Skyline, Apfelwein, Bahnhofsviertel — kompakte JGA-Stadt mit Doppelgesicht",
    intro:
      "Frankfurt wird als JGA-Stadt unterschätzt — und das ist genau der Vorteil: weniger Touri-Gruppen, kürzere Wege, Skyline-Drinks zum halben Preis von München. Die Mainmetropole hat zwei Gesichter, und beide funktionieren für JGAs.",
    paragraphs: [
      "Frankfurt ist die kompakteste deutsche Großstadt: Vom Hauptbahnhof zur Hochhaus-Skyline drei Stationen, von dort zur Sachsenhausener Apfelwein-Meile zehn Minuten zu Fuß über den Main. Eine Gruppe kann in einem Wochenende beide Welten erleben — Bankenviertel-Rooftops und Apfelweinkneipen — ohne mehr als 5 € fürs ÖPNV pro Person auszugeben.",
      "Tagsüber: SkyLounge im Main Tower (Pflicht-Foto), Bouldern im Boulderwald (groß und gruppenfreundlich), Karting im Frankfurt Karting Center, Mainufer-SUP, oder eine Mainfähre als günstige Hafenrundfahrt. Frankfurt hat zudem das beste Indoor-Skydiving Deutschlands (Bottrop ist nicht weit) und mit Heidelberg + Mainz Tagesausflugs-Optionen.",
      "Abends teilen sich Sachsenhausen (Äppler-Pflichttour: Wagner, Lorsbacher Thal, Affentor) und Bahnhofsviertel (raue, ehrliche Bars, weniger Tourismus, gute Cocktails) die Crowd. Bornheim und Nordend sind die hippen Alternativen für Crews, die das Touri-Programm überspringen wollen.",
    ],
    topActivitySlugs: [
      "karting",
      "climbing",
      "escape_room",
      "indoor_skydiving",
      "sup",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "bubble_soccer",
      "shooting_range",
    ],
    neighborhoods: [
      { name: "Sachsenhausen", tagline: "Apfelwein-Meile, Klassiker für JGA-Abend mit Tradition" },
      { name: "Bahnhofsviertel", tagline: "Cocktail-Bars, raue Kante, beste Bars der Stadt" },
      { name: "Bornheim", tagline: "Berger Straße, lokale Kneipen, weniger touristisch" },
      { name: "Nordend", tagline: "Café-Vibe tagsüber, gute Bars abends, Pre-Drinks-Viertel" },
    ],
    budget: {
      weekend: "300–520 € pro Person",
      activity: "30–85 € pro Person",
      party: "40–80 € pro Person Apfelwein- oder Bar-Tour",
    },
    bestSeasons: ["Mai–September (Mainufer-Saison)", "September (IAA wenn relevant)", "Dezember (Weihnachtsmarkt)"],
    insiderTips: [
      "Äppler-Touren als Selbstläufer: 4 Lokale in Sachsenhausen, alle im Umkreis von 600 Metern. Wagner ist Touri-Klassiker, Lorsbacher Thal authentischer.",
      "Hostels in Bahnhofsviertel sind günstig — aber das Viertel ist nachts rau. Für gemischte Gruppen lieber Bornheim oder Sachsenhausen.",
      "Main Tower SkyLounge: kostet 9 € Eintritt, Skyline-Foto inklusive. Für JGA-Gruppenfotos der beste Spot Deutschlands.",
      "Frankfurt ist Flughafen-Stadt — perfekt für JGAs mit verstreuter Crew. Direktflüge aus jeder DACH-Stadt.",
    ],
    faqs: [
      {
        q: "Ist Frankfurt zu klein für ein JGA-Wochenende?",
        a: "Im Gegenteil — die Kompaktheit ist der Vorteil. Zwei Nächte reichen, drei werden ohne Tagesausflug zu lang. Heidelberg, Mainz oder Wiesbaden als Tag-2-Booster funktionieren gut.",
      },
      {
        q: "Apfelwein-Pflicht für JGA-Touristen?",
        a: "Pflicht im Sinne des Klischees, ja. Selbst Crews ohne Apfelwein-Fans probieren ihn einmal — danach geht es schnell zurück auf Bier oder Cocktails. Sachsenhausener Lokale haben immer auch Bier.",
      },
      {
        q: "Bahnhofsviertel sicher für eine JGA?",
        a: "Für die Bars ja, vor allem in den Hauptstraßen. Hotels im Bahnhofsviertel sind funktional, aber das Umfeld ist nachts rau — gemischte Gruppen schlafen besser in Bornheim oder Sachsenhausen.",
      },
      {
        q: "Welche Aktivität funktioniert das ganze Jahr?",
        a: "Bouldern im Boulderwald (riesige Halle, gruppenfreundlich), Karting indoor, Escape Rooms. Mainufer-SUP und Skyline-Picknick sind Sommerprogramm.",
      },
    ],
    coordinates: { lat: 50.1109, lng: 8.6821 },
    population: 760000,
    monthlySearchVolume: 4400,
  },
  {
    slug: "stuttgart",
    name: "Stuttgart",
    nameLocative: "in Stuttgart",
    country: "DE",
    countryName: "Deutschland",
    region: "Baden-Württemberg",
    vibe: "Kessel, Weinberge, Autos — JGA mit schwäbischer Effizienz und überraschend guten Bars",
    intro:
      "Stuttgart ist Geheimtipp für JGAs, die das Klischee 'Berlin oder Köln' satthaben. Der Kessel hat eine dichte Bar-Szene, beste Karts Süddeutschlands, und mit dem Cannstatter Volksfest eine zweite Saison neben der Wiesn.",
    paragraphs: [
      "Stuttgart funktioniert für JGAs besser als sein Ruf suggeriert. Der Kessel sorgt für extrem kompakte Wege: Theodor-Heuss-Straße (Bar-Meile), Hans-im-Glück-Brunnen, Marienplatz-Bars, Schlossplatz — alles in 15 Gehminuten erreichbar. Die Bar-Szene ist überraschend kreativ, mit Cocktail-Bars wie der Galao, dem Sansibar oder dem Jigger & Spoon auf nationalem Niveau.",
      "Aktivitätsseitig ist Stuttgart eine Karting-Hochburg (Daimler-Mentalität): Indoor-Karts, Drift-Kurse, Sim-Racing-Studios und Bosch-/Porsche-Museum als Männer-Pflichtprogramm. Wer raus will, ist in 30 Minuten in den Weinbergen am Neckar — SUP auf dem Max-Eyth-See, Weinwanderung mit Verkostung in Untertürkheim oder Esslingen.",
      "Abends übernimmt entweder die Theodor-Heuss-Straße (klassischer Crawl) oder das Bohnenviertel (kreativere Bars, kleinere Locations). Das Cannstatter Volksfest im September/Oktober ist die unterschätzte Schwester der Wiesn — gleiche Zelte-Atmosphäre, halbe Übernachtungspreise.",
    ],
    topActivitySlugs: [
      "karting",
      "sim_racing",
      "drift_course",
      "escape_room",
      "climbing",
      "sup",
      "axe_throwing",
      "lasertag",
      "shooting_range",
      "vr_arena",
    ],
    neighborhoods: [
      { name: "Theodor-Heuss-Straße", tagline: "Bar-Meile Klassiker, mehrere Bars in 200m" },
      { name: "Bohnenviertel", tagline: "Kreativere Cocktail-Bars, kleine Locations" },
      { name: "Stuttgart-West", tagline: "Studentisch, günstigere Bars, Pre-Drinks-Viertel" },
      { name: "Bad Cannstatt", tagline: "Volksfest-Quartier, Hotels günstiger als in der City" },
    ],
    budget: {
      weekend: "280–500 € pro Person (außerhalb Volksfest-Zeit)",
      activity: "30–95 € pro Person",
      party: "40–75 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–August (Weinberge, Open-Air)", "Ende September–Oktober (Cannstatter Volksfest)"],
    insiderTips: [
      "Cannstatter Volksfest = günstigerer Wiesn-Ersatz, mindestens 6 Monate Vorlauf für Zeltreservierung.",
      "Porsche-Museum und Mercedes-Museum als Tages-Programm für Auto-Crews — Eintritt jeweils 12 €, beide an einem Tag machbar.",
      "Weinwanderung Untertürkheim oder Bad Cannstatt: 3–5 Weingüter in einem Halbtag, jede Person trinkt sich durch 8–12 Württemberger Weine.",
      "Stuttgart ist eine Hügelstadt — flache Schuhe wichtig, Stäffele (Treppen) statt U-Bahn-Stationen.",
    ],
    faqs: [
      {
        q: "Cannstatter Volksfest oder Wiesn für JGA?",
        a: "Cannstatter ist günstiger, weniger überlaufen, gleiche Zelte-Atmosphäre. Für eine erste JGA-Volksfest-Erfahrung sogar besser — weniger Stress beim Eingang, mehr Spontaneität möglich.",
      },
      {
        q: "Genug Programm für 2 Tage in Stuttgart?",
        a: "Locker, wenn ihr eine Aktivität (Karting oder Karts-Museum), eine Weinberg-Tour und einen Bar-Abend kombiniert. Drei Nächte werden zäh, außer ihr seid in Volksfest-Saison.",
      },
      {
        q: "Welche Bar für Cocktails der Spitzenklasse?",
        a: "Jigger & Spoon im Bohnenviertel ist national bekannt. Für eine ganze Gruppe besser die Galao (größer, gruppenfreundlicher) oder Paul & George als Pre-Drink-Spot.",
      },
      {
        q: "Anreise nach Stuttgart aus Norden?",
        a: "ICE direkt aus Berlin (5,5h), Hamburg (5h), Köln (2,5h). Flug nur sinnvoll aus Hamburg/Berlin. Die kompakte Innenstadt erspart Mietwagen.",
      },
    ],
    coordinates: { lat: 48.7758, lng: 9.1829 },
    population: 635000,
    monthlySearchVolume: 2900,
  },
  {
    slug: "duesseldorf",
    name: "Düsseldorf",
    nameLocative: "in Düsseldorf",
    country: "DE",
    countryName: "Deutschland",
    region: "Nordrhein-Westfalen",
    vibe: "Altbier, längste Theke der Welt, Königsallee — JGA mit rheinischer Eleganz",
    intro:
      "Düsseldorf ist die schickere Schwester von Köln: gepflegter, etwas teurer, mit der 'längsten Theke der Welt' als wandelbare JGA-Achse. Wer Altbier statt Kölsch und Designer-Bars statt Brauhaus-Klischee will, ist hier richtig.",
    paragraphs: [
      "Die Altstadt — 250 Kneipen auf 0,5 Quadratkilometern — ist die JGA-Hardware schlechthin. Eine Crew zieht abends durch Füchschen, Uerige, Schumacher, Schlüssel, und am Ende stehen alle am Rheinufer mit Blick auf den Medienhafen. Niemand braucht Taxis, niemand braucht Reservierungen — das ist Düsseldorfs ehrliches Versprechen.",
      "Tagsüber funktioniert Düsseldorf weniger über Sehenswürdigkeiten als über Aktivitäten und Shopping: Königsallee-Walk (auch nur zum Schauen), Medienhafen-Architektur, Rheinufer-Promenade, Karting im Düsseldorf Karting, Boulder-Hallen, oder ein Trip nach Köln (25 min ICE) für die Kölsch-vs-Alt-Vergleichstour.",
      "Abends gewinnt Düsseldorf gegen Köln in der Cocktail-Liga: Bars wie Sub Rosa, Et Kabüffke (versteckt!) oder das Rooftop des Capricorn-Hotels sind nationale Top-Adressen. Die Altstadt bleibt die Pflichtbasis, aber das Pre-Drink-Spiel ist in Düsseldorf reifer.",
    ],
    topActivitySlugs: [
      "karting",
      "climbing",
      "escape_room",
      "lasertag",
      "sup",
      "axe_throwing",
      "vr_arena",
      "bubble_soccer",
      "shooting_range",
      "rage_room",
    ],
    neighborhoods: [
      { name: "Altstadt", tagline: "Die längste Theke der Welt — 250 Kneipen, Pflicht-Basis" },
      { name: "Medienhafen", tagline: "Architektur-Spektakel, Rooftop-Bars, Foto-Spot" },
      { name: "Flingern", tagline: "Hippere Alternative zur Altstadt, Indie-Bars" },
      { name: "Carlstadt", tagline: "Cocktail-Bars und Restaurants direkt neben der Altstadt" },
    ],
    budget: {
      weekend: "310–560 € pro Person",
      activity: "30–85 € pro Person",
      party: "40–80 € pro Person Altstadt-Abend",
    },
    bestSeasons: ["Mai–September (Rheinufer)", "Juli (Größte Kirmes am Rhein)", "November (Karneval-Beginn)"],
    insiderTips: [
      "Altbier-Tour: 4 Brauereien in der Altstadt selbst organisieren — Füchschen, Schumacher, Uerige, Schlüssel. Pro Brauerei 30 min, eine 0,25l Stange genug.",
      "Größte Kirmes am Rhein (Juli): Ehrenfeld-ähnlich, aber im JGA-Maßstab — Riesenrad, Festzelte, Currywurst-Buden.",
      "Düsseldorf vs. Köln für JGA: Düsseldorf gewinnt bei Cocktails und Eleganz, Köln gewinnt bei Lautstärke und Brauhaus-Atmosphäre. Beide an einem Wochenende ist machbar (25 min ICE).",
      "Medienhafen-Rooftops sind Pflicht-Fotos, aber teuer — Pre-Drinks nur, danach zurück in die Altstadt.",
    ],
    faqs: [
      {
        q: "Wie viele Brauhäuser sollte eine Altbier-Tour beinhalten?",
        a: "Drei bis vier reichen. Klassiker: Uerige → Schumacher → Füchschen → Schlüssel. Pro Stop 30–40 Minuten, ein bis zwei 0,25l-Alt.",
      },
      {
        q: "Düsseldorf oder Köln für einen JGA?",
        a: "Köln für laute, traditionelle Brauhaus-Stimmung mit Karneval-DNA. Düsseldorf für schickere Cocktails, kompaktere Altstadt und Medienhafen als Highlight. Wer beides will: Köln Freitag, Düsseldorf Samstag.",
      },
      {
        q: "Wo schläft eine 10er-Gruppe günstig?",
        a: "Flingern oder Oberbilk haben günstigere Hotels und sind 5 U-Bahn-Minuten von der Altstadt. AirBnB-Wohnungen in Friedrichstadt sind oft das Optimum.",
      },
      {
        q: "Funktioniert Düsseldorf auch ohne Alkohol?",
        a: "Medienhafen-Spaziergang, Königsallee, Aqua-Zoo, Rheinturm — ja, aber die Stärke der Stadt ist die Bar-Kultur. Für komplett alkoholfreie Crews gibt es bessere Optionen wie Hamburg oder München.",
      },
    ],
    coordinates: { lat: 51.2277, lng: 6.7735 },
    population: 620000,
    monthlySearchVolume: 3600,
  },
  {
    slug: "wien",
    name: "Wien",
    nameLocative: "in Wien",
    country: "AT",
    countryName: "Österreich",
    region: "Wien",
    vibe: "Kaffeehaus, Beisl, Donauinsel — JGA zwischen Imperium und Underground",
    intro:
      "Wien ist die wohl unterschätzteste JGA-Stadt im deutschsprachigen Raum: kompakt, kulturell, günstiger als München, mit einer Nachtszene, die zwischen 1900er-Kaffeehaus und 2020er-Techno-Bunker oszilliert. Für Crews, die etwas Tiefe wollen und nicht nur Reeperbahn-Schema, perfekt.",
    paragraphs: [
      "Wien funktioniert in zwei Modi: imperial (Hofburg, Schönbrunn, Kaffeehaus-Tour) oder underground (Naschmarkt-Bars, Gürtel-Clubs, Donaukanal-Sommertage). Eine gute JGA mischt beide. Tagsüber Sissi-Schauplätze und Sachertorte als Klischee-Erfüllung, abends die ehrliche Underground-Szene.",
      "Aktivitätsseitig ist Wien überraschend reich: Donauinsel als 21-km-Naturoase mit SUP, Beachbars und Open-Air-Konzerten im Sommer; Prater als XXL-Spielplatz mit Riesenrad, Karts, Geisterbahnen; Lainzer Tiergarten für Wandern, Wachau für Weinverkostungen 1h raus. Karting, Escape Rooms, Boulder-Hallen sind Standard.",
      "Abends gewinnt Wien deutlich gegen München bei Bar-Kreativität: Loos American Bar (200 Jahre alt, weltberühmt), Heuriger Sirbu (Wein direkt am Weingut), Donaukanal-Bars im Sommer (gratis, lebendig), und die Volksgarten-Club-Achse für Tanzabende. Bermudadreieck ist Touri-Trap — vermeiden.",
    ],
    topActivitySlugs: [
      "sup",
      "karting",
      "escape_room",
      "climbing",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "shooting_range",
      "indoor_skydiving",
      "bubble_soccer",
    ],
    neighborhoods: [
      { name: "1. Bezirk (Innere Stadt)", tagline: "Imperiale Sehenswürdigkeiten, klassische Bars" },
      { name: "Naschmarkt / 4.+ 6. Bezirk", tagline: "Hippere Bars, Weinlokale, Cocktail-Szene" },
      { name: "Donaukanal", tagline: "Sommer-Open-Air-Bars, gratis Aufenthalt, lebendig" },
      { name: "Gürtel (8.+ 16. Bezirk)", tagline: "Indie-Clubs, Underground, weniger Tourismus" },
    ],
    budget: {
      weekend: "280–500 € pro Person (günstiger als München)",
      activity: "25–80 € pro Person",
      party: "35–70 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–September (Donauinsel, Open-Air)", "November–Dezember (Christkindlmärkte)", "März (Opernball-Saison, kein JGA-Spot, nur Atmosphäre)"],
    insiderTips: [
      "Heurigen in Grinzing oder Stammersdorf statt Tourist-Heuriger in der Innenstadt: doppelt so guter Wein, halber Preis.",
      "Bermudadreieck (1. Bezirk) wirklich vermeiden — überteuerte Cocktails, JGA-Massenabfertigung. Stattdessen Naschmarkt-Umgebung.",
      "Praterstern ist der schnellste Trick: vom Hauptbahnhof 3 Stationen, Riesenrad + Würstelbude + Karaoke-Bar im Umkreis von 500m.",
      "Donaukanal-Bars sind im Sommer gratis und ehrlich — keine Eintritte, eigene Getränke möglich.",
    ],
    faqs: [
      {
        q: "Wien oder München für einen JGA aus Deutschland?",
        a: "Wien ist günstiger, kulturell dichter, mit besserer Bar-Kreativität. München hat Biergarten-Klassik und Wiesn als Special. Wenn euer Bräutigam Wein und Cocktails statt Bier liebt, Wien.",
      },
      {
        q: "Anreise aus Deutschland?",
        a: "Direktflüge ab fast jeder DE-Stadt (1–1,5h), ICE aus München (4h), Berlin braucht 8h Zug — Flug besser. ÖBB-Nightjet aus Hamburg oder Düsseldorf ist eine gemütliche Anreise-Option.",
      },
      {
        q: "Lohnt sich Schönbrunn für eine JGA-Crew?",
        a: "Eine schnelle Gartenrunde ja (gratis), die kostenpflichtige Innenführung nein. Eine JGA in Wien lebt nicht von Schlössern, sondern von Bars und Heurigern.",
      },
      {
        q: "Wieviel kostet ein Wochenende realistisch?",
        a: "280 € lean, 400–500 € Standard, 600+ € luxuriös. Wien ist im Mittelfeld der DACH-Hauptstädte, mit AirBnB im 6. oder 7. Bezirk besonders wirtschaftlich.",
      },
    ],
    coordinates: { lat: 48.2082, lng: 16.3738 },
    population: 1900000,
    monthlySearchVolume: 4000,
  },
  {
    slug: "zuerich",
    name: "Zürich",
    nameLocative: "in Zürich",
    country: "CH",
    countryName: "Schweiz",
    region: "Zürich",
    vibe: "See, Berge, Banking — JGA mit Schweizer Präzision und ehrlich teuren Preisen",
    intro:
      "Zürich ist die teuerste, sauberste, organisierteste JGA-Stadt im deutschsprachigen Raum. Für Crews, die bezahlen können und das Erlebnis 'schweizer Genauigkeit + Schweizer Berge' wollen, einzigartig. Niederdorf, Zürichsee, Berge in 30 Minuten Bahn.",
    paragraphs: [
      "Zürich ist klein — und genau das ist der Trick. Innerhalb einer Tram-Zone erreicht ihr Niederdorf (Altstadt), Zürichsee, Bahnhof Stadelhofen, Langstrasse (Bar-Meile). Eine Crew muss keinen Meter laufen, der nicht sinnvoll ist.",
      "Tagsüber dominiert Wasser und Berg: Zürichsee mit SUP, Schwimmen im Limmatfluss (im Sommer der Trick — Strömung trägt euch durch die Stadt), Uetliberg-Wanderung mit Bahn (20 min), Tagesausflug Pilatus oder Rigi mit Direktbahn. Für Action-Crews: Karting in Spreitenbach, River-Rafting auf der Aare, Paragliding im Berner Oberland mit 90 min Anfahrt.",
      "Abends ist die Langstrasse die einzige ehrliche Bar-Meile — kreativer und rauer, als der Schweiz-Klischee glauben lässt. Niederdorf ist Touri-Klassiker (Pflicht, aber teuer), Zürich-West (ehemals Industrie, jetzt Bar-Szene) ist die spätere Tanzfront. Ein normales Bier kostet 8–12 CHF — plant Budget ehrlich.",
    ],
    topActivitySlugs: [
      "sup",
      "rafting",
      "hiking",
      "paragliding",
      "karting",
      "escape_room",
      "climbing",
      "lasertag",
      "shooting_range",
      "axe_throwing",
    ],
    neighborhoods: [
      { name: "Niederdorf", tagline: "Altstadt, klassische Bars, touristisch aber pflichtig" },
      { name: "Langstrasse", tagline: "Bar-Meile, lebendig, kreativ — Hauptbasis für JGA-Abende" },
      { name: "Zürich-West", tagline: "Ehemalige Industrie, Hipster-Bars, Clubs, kreative Restaurants" },
      { name: "Seefeld", tagline: "Premium-Viertel am See, ruhiger, Pre-Drinks mit Aussicht" },
    ],
    budget: {
      weekend: "500–1000 € pro Person (höchste DACH-Preise)",
      activity: "50–150 € pro Person",
      party: "80–150 € pro Person Bar-Abend",
    },
    bestSeasons: ["Juni–August (See, Schwimmen)", "September (Knabenschiessen-Volksfest)", "Dezember (Christkindlmarkt)"],
    insiderTips: [
      "Limmat-Schwimmen im Sommer: vom Frauenbad aus reinhüpfen, mit der Strömung 3 km durch die Stadt schwimmen — gratis, ikonisch, JGA-Story-Material.",
      "Tagesausflug Uetliberg oder Rigi: Bahn-Pässe für Gruppen ab 6 Personen vergünstigt. Foto auf 1300m Höhe, danach abends zurück in der Stadt.",
      "Restaurant-Mittagsmenüs (CHF 25–35) statt Abendkarte — selbst Spitzenrestaurants haben gruppenfreundliche Lunches.",
      "Tageskarten ÖV für Gruppe: 9-Uhr-Tagespass spart bei Touren extreme Beträge — pro Person CHF 9 statt CHF 4 pro Strecke.",
    ],
    faqs: [
      {
        q: "Ist Zürich zu teuer für JGA?",
        a: "Für Lean-Budget-Crews ja. Bier 8–12 CHF, Burger 25 CHF, Hotel ab 180 CHF/Nacht. Für eine Premium-JGA mit See, Bergen und schweizer Kulinarik aber unschlagbar.",
      },
      {
        q: "Welche Aktivität ist Pflicht in Zürich?",
        a: "Im Sommer: Limmat-Schwimmen. Im Winter: Tagesausflug Uetliberg oder Rigi für Bergpanorama. Beide Aktivitäten gibt es nirgends sonst im DACH-Raum in dieser Form.",
      },
      {
        q: "Wo gehen Schweizer selbst zum Ausgehen?",
        a: "Langstrasse für eine ehrliche Bar-Nacht, Zürich-West (Frau Gerolds Garten, Hive) für Hipper-Crowd, Niederdorf nur als Pflicht-Touri-Snippet. Nicht in den Glashof oder andere Banker-Bars für JGAs.",
      },
      {
        q: "Tagestour Berge — was geht ohne Mietwagen?",
        a: "Uetliberg (in der Stadt, 20 min Bahn), Rigi (1h Bahn + Schiff), Pilatus (1h Bahn). Alles als JGA-Bergaktion buchbar, Bahnen sind komfortabel und gruppentauglich.",
      },
    ],
    coordinates: { lat: 47.3769, lng: 8.5417 },
    population: 425000,
    monthlySearchVolume: 1900,
  },
  {
    slug: "hannover",
    name: "Hannover",
    nameLocative: "in Hannover",
    country: "DE",
    countryName: "Deutschland",
    region: "Niedersachsen",
    vibe: "Steintor, Maschsee, Schützenfest — die ehrlichste JGA-Stadt Norddeutschlands",
    intro:
      "Hannover ist der ehrliche Mittelständler unter den JGA-Städten: günstiger als Hamburg, weniger touristisch als Berlin, mit dem Steintor als bewährter JGA-Achse und dem größten Schützenfest der Welt als Saison-Highlight. Für Crews, die keine Selbstinszenierung wollen.",
    paragraphs: [
      "Hannover funktioniert für JGAs aus zwei Gründen: kompakte Innenstadt mit dichter Bar-Szene am Steintor und Schwesterviertel Limmerstraße in Linden, plus eine der besten Aktivitäten-Infrastrukturen für seine Größe (Karting, Lasertag, Bouldern, GOP Varieté für Show-Abende).",
      "Tagsüber: SUP auf dem Maschsee oder Mittellandkanal, Bouldern in der Hannover Boulderhalle (groß und gruppenfreundlich), Karting im RACE-INN, Erlebnisbäder, Erlebnis-Zoo Hannover (Sonderprogramm für Crews mit lockerer Stimmung). Tagesausflug zum Steinhuder Meer (45 min) für Wasser ohne Großstadttrubel.",
      "Abends ist das Steintor (klassisch JGA, mit allem was dazugehört) die Hauptbasis. Die Limmerstraße in Linden ist die kreativere, weniger touristische Alternative. Schützenfest (Juli) ist das größte der Welt — eigene JGA-Ökonomie wie Wiesn oder Cannstatter Volksfest.",
    ],
    topActivitySlugs: [
      "karting",
      "climbing",
      "escape_room",
      "lasertag",
      "sup",
      "axe_throwing",
      "vr_arena",
      "bubble_soccer",
      "shooting_range",
      "rage_room",
    ],
    neighborhoods: [
      { name: "Steintor", tagline: "Klassische JGA-Bar-Meile, kompakt, alles in 200m" },
      { name: "Linden / Limmerstraße", tagline: "Hipper Stadtteil, kreativere Bars, Indie-Clubs" },
      { name: "Maschsee", tagline: "Tagsüber Wasseraktivitäten, abends Strandbars im Sommer" },
      { name: "Calenberger Neustadt", tagline: "Cocktail-Bars, ruhiger, Pre-Drinks-Viertel" },
    ],
    budget: {
      weekend: "240–450 € pro Person (eine der günstigsten Großstädte DE)",
      activity: "25–75 € pro Person",
      party: "30–60 € pro Person Steintor-Abend",
    },
    bestSeasons: ["Juli (Schützenfest — Sondervorlauf)", "Mai–September (Maschsee-Saison)", "Dezember (Weihnachtsmarkt)"],
    insiderTips: [
      "Schützenfest (Ende Juni–Anfang Juli) ist Wiesn-Niveau zu halben Preisen: 6 Festzelte, 5 Millionen Besucher, JGAs gehören zum Inventar.",
      "Steintor ist die ehrliche JGA-Meile — keine Reservierung nötig, Bars wechseln sich gegenseitig die Crowd zu.",
      "Hannover Messe-Zeiten (April) Hotelpreise explodieren — vermeiden, sonst Bremen oder Hamburg als Alternative.",
      "Bouldern im Boulderhaus Hannover als Tages-Aktivität für Crews jeder Sportlichkeit — 11 € Eintritt, Schuhe ausleihen, 3h Programm.",
    ],
    faqs: [
      {
        q: "Was kostet ein Wochenende in Hannover wirklich?",
        a: "Realistisch 240–400 € pro Person — Hannover ist eine der günstigsten deutschen Großstädte. AirBnB in Linden oder List ist preislich kaum zu schlagen.",
      },
      {
        q: "Schützenfest-JGA — wann buchen?",
        a: "Mindestens 4 Monate Vorlauf für Unterkunft (Preise verdoppeln sich), Festzelte brauchen keine Reservierung, sind aber nach 18 Uhr knackevoll.",
      },
      {
        q: "Genug Programm für 3 Tage?",
        a: "Drei Tage funktionieren mit Steinhuder-Meer-Tagestour oder Schützenfest. Klassisch zwei Nächte: Anreise Freitag + Steintor, Samstag Aktivität + Abend, Sonntag Abreise.",
      },
      {
        q: "Steintor oder Limmerstraße für den Abend?",
        a: "Steintor ist die klassische JGA-Bar-Meile, ehrlich, laut, gruppenfreundlich. Limmerstraße in Linden ist hipper, kreativer, weniger Klischee. Crews entscheiden nach Vibe.",
      },
    ],
    coordinates: { lat: 52.3759, lng: 9.732 },
    population: 530000,
    monthlySearchVolume: 1800,
  },

  // ──────────────────────────────────────────────────────────────────
  // Internationale Top-Destinationen für DACH-JGA-Markt
  // ──────────────────────────────────────────────────────────────────

  {
    slug: "mallorca",
    name: "Mallorca",
    nameLocative: "auf Mallorca",
    country: "ES",
    countryName: "Spanien",
    region: "Balearen",
    vibe: "Ballermann, Strand, Sangria-Eimer — der ehrlichste JGA-Klassiker Europas",
    intro:
      "Mallorca ist die Mutter aller Auslands-JGAs für deutsche Crews: Direktflüge ab 50 €, Hotels die JGA-Gruppen lieben, der Ballermann als kalkulierter Eskalations-Boulevard, und Strände, an denen ihr ungestört verkatert liegen könnt. Wer einmal pro Leben einen JGA-Auslandsbock haben möchte, geht hier hin.",
    paragraphs: [
      "Mallorca funktioniert für JGAs nicht trotz, sondern wegen seines Rufs. Der Megapark, das Bierkönig, der Oberbayern — diese Locations sind keine Touri-Falle, sondern professionell durchchoreographierte JGA-Arenen mit Sicherheit, Live-Musik und Pärchen-Stimmung bis 6 Uhr morgens. Wer das einmal mitnimmt, hat eine Story für jeden Stammtisch.",
      "Tagsüber ist Mallorca überraschend reich: Bootscharter mit Skipper ab Palma (200–500 € pro Tag für eine Gruppe), Cala-Hopping zur Cala Mondrago oder Cala Varques, Tramuntana-Wanderungen, Quad-Touren, oder einfach Pool im Hotel mit Sangria-Service. Palma-Altstadt für Crews, die kulturelle Selbstrechtfertigung brauchen.",
      "Abends teilt sich die Insel in zwei Welten: Ballermann/Schinkenstraße für das klassische JGA-Erlebnis, oder Santa Catalina/Palma-Altstadt für eine schickere Bar-Crawl-Variante. Beide funktionieren, aber niemand fliegt nach Mallorca für ein ruhiges Wein-Wochenende.",
    ],
    topActivitySlugs: [
      "sailing",
      "sup",
      "jetski",
      "quad_tour",
      "hiking",
      "escape_room",
      "karting",
      "shooting_range",
      "vr_arena",
      "bubble_soccer",
    ],
    neighborhoods: [
      { name: "Playa de Palma / Ballermann", tagline: "Schinkenstraße, Megapark, Bierkönig — JGA-Pflicht-Achse" },
      { name: "Palma-Altstadt", tagline: "Cocktail-Bars, Tapas, Kathedrale — Tagesprogramm" },
      { name: "Santa Catalina", tagline: "Hipper Stadtteil, Foodie-Bars, Mallorcas Williamsburg" },
      { name: "Cala Ratjada", tagline: "Etwas ruhigere Alternative im Osten, weniger Touri-Wahn" },
    ],
    budget: {
      weekend: "350–650 € pro Person inkl. Flug, Hotel, Drinks (außerhalb Hochsommer)",
      activity: "30–120 € pro Person (Bootstour der teuerste Spaß)",
      party: "40–80 € pro Person Ballermann-Abend",
    },
    bestSeasons: ["Mai–Juni (vor Hochpreissaison)", "September (warm aber leerer)", "Vermeiden: August (überteuert, überfüllt)"],
    insiderTips: [
      "Bootscharter mit Skipper ab Palma: 250–400 € für 6 Stunden inkl. Crew bis 8 Personen — günstiger als ein Mallorca-Abend pro Kopf, viel besseres Foto-Material.",
      "Flüge auf Dienstag/Mittwoch buchen: 50–70 % günstiger als Wochenend-Slots. Hin Mittwoch, zurück Sonntag/Montag spart pro Person 100–200 €.",
      "Schinkenstraße-Mengenrabatt: Eimer-Sangria für 30 € werden auf 6 Personen verteilt — pro Kopf günstiger als Bier in Berlin.",
      "Hotel Riu Concordia, Bellevue oder Tropic Garden sind klassische JGA-Hotels — keine Familien, keine Beschwerden, alles inklusive.",
    ],
    faqs: [
      {
        q: "Ist Mallorca-JGA noch zeitgemäß?",
        a: "Ja, wenn ihr keinen kuratierten Anti-Massentourismus-JGA wollt. Für eine Crew, die einmal komplett eskalieren und am Strand ausschlafen will, bleibt Mallorca die effizienteste Wahl in Europa: Direktflug, alles auf Deutsch, Infrastruktur für Gruppen perfekt eingespielt.",
      },
      {
        q: "Was kostet ein Mallorca-JGA realistisch pro Person?",
        a: "350–650 € pro Person für 4 Tage inkl. Flug, Hotel, 1 Bootstour, 2 Ballermann-Abenden, Verpflegung. Im Juli/August Verdopplung. Mai oder September halbieren die Preise gegenüber August.",
      },
      {
        q: "Bootstour selbst chartern oder buchen?",
        a: "Direkt-Charter mit Skipper am Hafen Palma ist günstiger und flexibler als organisierte Boats. Anbieter wie Click&Boat, Sailogy oder lokale Skipper am Paseo Marítimo — für 8 Personen ab 250 €.",
      },
      {
        q: "Welches Hotel für JGA?",
        a: "Direkt am Ballermann: Hotel Riu San Francisco oder Bellevue (JGA-tolerant, nahe Action). Etwas ruhiger: Palma-Altstadt mit AirBnB für die ganze Crew. Familienhotels bewusst meiden — Beschwerden vorprogrammiert.",
      },
    ],
    coordinates: { lat: 39.5696, lng: 2.6502 },
    population: 920000,
    monthlySearchVolume: 8100,
    wikidataId: "Q5765",
    isAbroad: true,
  },
  {
    slug: "prag",
    name: "Prag",
    nameLocative: "in Prag",
    country: "CZ",
    countryName: "Tschechien",
    region: "Hlavní město Praha",
    vibe: "Goldene Stadt, billiges Pils, lebendige Bar-Szene — die meistgebuchte JGA-Auslandsstadt Europas",
    intro:
      "Prag ist nicht zufällig die JGA-Hauptstadt Europas: 90 Minuten Flug ab Frankfurt oder München, halbe Preise gegenüber DACH-Großstädten, eine der schönsten Altstädte Europas und eine Bar-Dichte, die nirgends im Osten erreicht wird. Pflichtstation für jede Auslands-JGA, die mehr will als Strand.",
    paragraphs: [
      "Prag liefert das ungeschlagene Preis-Erlebnis-Verhältnis: Ein halber Liter Pilsner Urquell kostet 2–3 €, ein Cocktail in einer Top-Bar 5–7 €, eine Übernachtung in der Altstadt ab 50 € pro Person. Für ein 3-Tages-JGA reichen 250 € pro Person inklusive Flug — undenkbar für eine vergleichbare Stadt in DACH.",
      "Tagsüber ist Prag ein XXL-JGA-Spielplatz: Beer Spa (im warmen Bierbad baden, dabei Bier trinken — kein Witz, real und legendär), Karting in der Industrie-Halle, Lasertag, Schießstand (deutlich entspanntere Waffen-Gesetze, AK-47-Erlebnisse legal buchbar), Moldau-Tretboot, Prag-Bier-Tour mit Brauereiführung, U-Boot-Erlebnis im Stalag.",
      "Abends drei Modi: Touri-Klassiker Karlsbrücke + Altstädter Ring (überteuert, aber pflichtfähig), authentische Pilsner-Stuben in Vinohrady oder Žižkov, oder Karlovy Lazne (fünf Stockwerke Club im Stadtkern) für JGA-Mass-Party. Roxy, SaSaZu und KU Lounge sind die etablierten JGA-Clubs.",
    ],
    topActivitySlugs: [
      "shooting_range",
      "karting",
      "lasertag",
      "escape_room",
      "axe_throwing",
      "vr_arena",
      "bubble_soccer",
      "rage_room",
      "indoor_skydiving",
      "sup",
    ],
    neighborhoods: [
      { name: "Altstadt / Staré Město", tagline: "Karlsbrücke, Astronomische Uhr, Pflicht-Bar-Crawl" },
      { name: "Nové Město", tagline: "Wenzelsplatz, Clubs, Karlovy Lazne" },
      { name: "Vinohrady", tagline: "Hipster-Viertel, kreative Cocktail-Bars, weniger Touri-Druck" },
      { name: "Žižkov", tagline: "Studentisch, billigste Bars, lokal authentisch" },
    ],
    budget: {
      weekend: "220–450 € pro Person inkl. Flug, Hotel, Aktivitäten",
      activity: "15–80 € pro Person",
      party: "25–60 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni (warm, nicht überfüllt)", "September–Oktober (Goldener Herbst)", "Dezember (Weihnachtsmärkte)"],
    insiderTips: [
      "Beer Spa als JGA-Highlight: 50–80 € pro Person für 60 Minuten im warmen Bierbad mit unbegrenzt Pilsner. Spezifisch Bernard Beer Spa oder Beer Spa Bernard buchen.",
      "Touri-Bars am Wenzelsplatz vermeiden — gleicher Preis wie in Deutschland. Stattdessen Vinohrady oder Žižkov: U Sadu, Vzorkovna, Bukowski's.",
      "Schießstand mit AK-47, Glock, M16 etc. legal und sicher — Top-Anbieter wie Prague Shooting bieten Gruppenpakete ab 80 € pro Person für 4 Waffen.",
      "Anreise: Flüge ab DE 60–120 € roundtrip. Zug ab Berlin/München günstiger und entspannter (4–6 h), gerade für Crews die unterwegs vorglühen wollen.",
    ],
    faqs: [
      {
        q: "Warum gehen so viele JGAs nach Prag?",
        a: "Preis-Leistung. 2–3 € pro Bier, 50 € pro Hotelnacht, kompakte Altstadt, dichte Bar-Szene, 90 Min Flug ab DE. Kein vergleichbares Reiseziel in Europa bietet so viel Programm zum Preis.",
      },
      {
        q: "Was kostet ein 3-Tages-Prag-JGA?",
        a: "Etwa 250–400 € pro Person inkl. Flug, Hotel, 2 Aktivitäten und Bars. Mit Zug-Anreise und AirBnB-Wohnung ab 180 € pro Person möglich — schlägt jede deutsche Großstadt.",
      },
      {
        q: "Beer Spa — Klischee oder echtes Highlight?",
        a: "Echtes Highlight. 60 Minuten in warmem Bierbad mit Pilsner Urquell on tap. Klischee ja, JGA-Story-Stoff garantiert. Ab 60 € pro Person, in 90 Minuten durch.",
      },
      {
        q: "Reicht Englisch in Prag?",
        a: "In allen JGA-relevanten Bars, Hotels und Tour-Anbietern problemlos. Selbst Tschechisch-Speisekarten haben fast überall eine englische Version. Deutsch in Touri-Zonen meist auch verständlich.",
      },
    ],
    coordinates: { lat: 50.0755, lng: 14.4378 },
    population: 1310000,
    monthlySearchVolume: 4400,
    wikidataId: "Q1085",
    isAbroad: true,
  },
  {
    slug: "krakau",
    name: "Krakau",
    nameLocative: "in Krakau",
    country: "PL",
    countryName: "Polen",
    region: "Małopolskie",
    vibe: "Polnische Schwester Prags — günstig, voller Wodka-Bars, mit Salzbergwerk als Bonus",
    intro:
      "Krakau ist der Prag-Alternative-Geheimtipp, der schon längst keiner mehr ist: ähnlich günstig, eine der schönsten Altstädte Europas, lebendige Studentenstadt mit dichter Bar-Szene, und mit Auschwitz und dem Salzbergwerk Wieliczka als kulturelle Tagesausflüge. Pflicht für Crews, die Prag schon abgehakt haben.",
    paragraphs: [
      "Krakau ist die polnische Antwort auf Prag — etwas leiser, etwas authentischer, mit dem riesigen Rynek Główny als Marktplatz-Bühne. Ein halber Liter polnisches Bier 2–3 €, Wodka-Shots ab 1,50 €, Hotelübernachtung in der Altstadt ab 35 € pro Person. Selbst Prag wirkt dagegen teuer.",
      "Tagsüber Programme: Salzbergwerk Wieliczka (UNESCO, 30 min außerhalb der Stadt, unterirdische Kapelle, 35 € pro Person), Karting, Schießstand mit AK-47-Erlebnis, Kajakfahren auf der Weichsel, Pierogi-Kochkurs, oder Tagesausflug Auschwitz (für Crews mit reflektiertem Pflichtgefühl, 60 € pro Person).",
      "Abends ist Kazimierz (das ehemalige jüdische Viertel) die heimliche Hauptachse: Plac Nowy als Bar-Cluster, Singer als Klassiker, Alchemia für Atmosphäre. Hauptmarkt für Touri-Drinks, Stara Synagoga-Umgebung für reife Bar-Crawls. Wodka-Bars wie der Wodka Cafe Bar auf der ul. Mikołajska sind Pflichtprogramm.",
    ],
    topActivitySlugs: [
      "shooting_range",
      "karting",
      "escape_room",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "rage_room",
      "canoeing",
      "bubble_soccer",
      "indoor_skydiving",
    ],
    neighborhoods: [
      { name: "Altstadt / Stare Miasto", tagline: "Rynek Główny, klassische Touri-Achse, schöne Restaurants" },
      { name: "Kazimierz", tagline: "Jüdisches Viertel, Bar-Cluster Plac Nowy — heimliche Hauptbasis" },
      { name: "Podgórze", tagline: "Hipster-Viertel südlich der Weichsel, Indie-Bars" },
      { name: "Kleparz", tagline: "Studentisch, günstige Bars, kreatives Nachtleben" },
    ],
    budget: {
      weekend: "180–380 € pro Person inkl. Flug, Hotel, Aktivitäten",
      activity: "15–70 € pro Person",
      party: "20–50 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–Juni", "September–Oktober", "Dezember (Weihnachtsmärkte am Rynek)"],
    insiderTips: [
      "Wodka-Tasting in einer der Wodka-Bars: 8–10 Sorten mit Erklärung für 15 € pro Person — bessere Story als jedes deutsche Whisky-Tasting.",
      "Salzbergwerk Wieliczka unbedingt als Halbtagestour einplanen — 700 Jahre Salzabbau, unterirdische Kathedrale, perfektes Brunch-Programm vor der Eskalation.",
      "Pierogi-Kochkurs (45–60 € pro Person) für Crews die mal etwas anderes wollen — endet mit gemeinsamem Essen + Wodka.",
      "Flüge: Ryanair und Wizzair ab fast jedem DE-Flughafen ab 40 €. Stadtnaher Flughafen, Taxis in die Altstadt 10 €.",
    ],
    faqs: [
      {
        q: "Krakau oder Prag für einen JGA?",
        a: "Krakau ist günstiger, weniger touristisch überlaufen, mit Wieliczka und Auschwitz als Tagesausflüge, die Prag nicht hat. Prag hat dichteres Nightlife und mehr Bekanntheit. Erste JGA: Prag. Zweite: Krakau.",
      },
      {
        q: "Was kostet ein 3-Tages-JGA in Krakau?",
        a: "180–350 € pro Person inkl. Flug, Hotel, 2 Aktivitäten, Bars. Eine der günstigsten Auslands-JGA-Optionen in Europa.",
      },
      {
        q: "Auschwitz-Besuch während JGA — angemessen?",
        a: "Eine Frage des Crew-Konsenses. Wenn alle reflektiert reagieren, ist es einer der eindringlichsten Erlebnisse Europas und ein anderes Gegengewicht zum Eskalations-Wochenende. Halber Tag, danach saubere Trennung zum Nachtprogramm.",
      },
      {
        q: "Wo gehen Locals in Krakau aus?",
        a: "Kazimierz, nicht Altstadt. Plac Nowy ist die zentrale Bar-Achse, Singer und Alchemia sind die Klassiker. In der Altstadt kosten Drinks doppelt so viel wie 800 Meter weiter südlich.",
      },
    ],
    coordinates: { lat: 50.0647, lng: 19.945 },
    population: 780000,
    monthlySearchVolume: 1900,
    wikidataId: "Q31487",
    isAbroad: true,
  },
  {
    slug: "budapest",
    name: "Budapest",
    nameLocative: "in Budapest",
    country: "HU",
    countryName: "Ungarn",
    region: "Pest",
    vibe: "Thermalbäder, Ruin-Pubs, Donau — die unterschätzteste JGA-Stadt Europas",
    intro:
      "Budapest ist der Geheimtipp, der gerade kein Geheimtipp mehr ist. Was die Stadt einzigartig macht: Thermalbäder als JGA-Spielplatz, Ruin-Pubs als weltweit einmaliges Bar-Format, Donau-Schifffahrt mit Parlament als Kulisse, und Preise wie Prag vor 10 Jahren.",
    paragraphs: [
      "Budapest ist die einzige europäische Hauptstadt, in der ein JGA in einem 100 Jahre alten Thermalbad starten und in einem zerfallenen Ostblock-Haus-Bar enden kann. Diese beiden Pole — Belle-Époque-Kulturschatz und Underground-Bar-Szene — sind das Allein­stellungsmerkmal.",
      "Tagsüber funktioniert Budapest dreigleisig: Thermalbäder (Széchenyi für Mainstream, Gellért für Belle Époque, Rudas für Underground, jeweils 20–35 € Eintritt), Donau-Schifffahrt mit eigener Bar oder Hot-Tub-Boats (skurril aber legendär), und Aktivitäten von Karting über Schießstand bis Bouldern in den Industrie-Hallen Buda-Seite.",
      "Abends sind die Ruin-Pubs (Romkocsmák) Pflicht: Szimpla Kert ist der berühmteste, Instant Fogas das Mega-Format mit 6 Räumen, Mazel Tov für mediterranen Ableger. Diese Bars sind zerfallene Höfe und Wohnhäuser, mit Möbeln aus den 80ern, mehreren Bars pro Komplex, Open-Air-Bereichen — nichts Vergleichbares gibt es sonst in Europa.",
    ],
    topActivitySlugs: [
      "karting",
      "escape_room",
      "shooting_range",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "rage_room",
      "bubble_soccer",
      "sup",
      "indoor_skydiving",
    ],
    neighborhoods: [
      { name: "Jüdisches Viertel / District VII", tagline: "Ruin-Pubs-Cluster, Szimpla Kert, Instant Fogas — JGA-Hauptbasis" },
      { name: "Belváros (District V)", tagline: "Innenstadt, klassische Bars, Restaurants" },
      { name: "Erzsébetváros", tagline: "Hipper, Cocktail-Bars, Boutique-Hotels" },
      { name: "Buda (District I)", tagline: "Burgviertel, Aussichtspunkte, ruhigeres Tagesprogramm" },
    ],
    budget: {
      weekend: "200–420 € pro Person inkl. Flug, Hotel, Bars",
      activity: "20–80 € pro Person",
      party: "25–55 € pro Person Ruin-Pub-Tour",
    },
    bestSeasons: ["Mai–Juni", "September (Sziget-Festival-Ableger)", "Dezember (Weihnachtsmärkte, Thermalbäder noch besser)"],
    insiderTips: [
      "Széchenyi am Samstag-Abend zum Sparty (Party im Thermalbad mit DJ, ab 50 € pro Person) — skurril, ikonisch, JGA-Foto-Material erster Klasse.",
      "Ruin-Pub-Crawl: Szimpla Kert (touristisch aber Pflicht) → Instant Fogas (Mega-Format) → Mazel Tov (jüngste Crowd) → Kőleves (Klassiker). 200 Meter zwischen allen.",
      "Donau-Schifffahrt nachts: Parlament + Burg beleuchtet, 90 Min, mit Bar an Bord ab 25 € pro Person. Pflicht-Programm trotz Touri-Image.",
      "Flüge: Wizzair und Ryanair ab DE 50–120 € roundtrip. Flughafen 30 min ins Zentrum mit Bus oder 25 € Taxi.",
    ],
    faqs: [
      {
        q: "Was sind Ruin-Pubs und warum sind sie für JGA relevant?",
        a: "Bars in zerfallenen alten Wohnhäusern und Höfen im 7. Bezirk. Mehrere Bars pro Komplex, gemischte Crowd, Open-Air-Bereiche, Möbel aus dem Sperrmüll der 80er. Nirgends sonst in Europa existiert dieses Format — perfekte JGA-Stop-Reihe.",
      },
      {
        q: "Thermalbad während JGA — passend?",
        a: "Sehr. Beste Brunch-Alternative der Stadt: 3 Stunden im warmen Außenbecken bei 38 °C, Bier am Beckenrand, Hangover-Behandlung erster Klasse. Széchenyi ist klassisch, Rudas mit Rooftop-Pool als Highlight.",
      },
      {
        q: "Wieviel kostet Budapest realistisch?",
        a: "200–400 € pro Person für 3 Tage inkl. Flug, Hotel, 2 Aktivitäten, Bars, Thermalbad. Eines der besten Preis-Leistungs-Verhältnisse in Europa.",
      },
      {
        q: "Reicht ein Wochenende für Budapest?",
        a: "Knapp. Drei Nächte ideal: Tag 1 Thermalbad + Ruin-Pubs, Tag 2 Aktivität + Donau-Schifffahrt + Spätbar, Tag 3 Burgviertel + Heimflug. Zwei Nächte funktionieren, aber ohne Burgviertel.",
      },
    ],
    coordinates: { lat: 47.4979, lng: 19.0402 },
    population: 1750000,
    monthlySearchVolume: 2400,
    wikidataId: "Q1781",
    isAbroad: true,
  },
  {
    slug: "amsterdam",
    name: "Amsterdam",
    nameLocative: "in Amsterdam",
    country: "NL",
    countryName: "Niederlande",
    region: "Noord-Holland",
    vibe: "Grachten, Coffeeshops, rotes Licht — der internationale JGA-Klassiker mit Liberalitäts-Bonus",
    intro:
      "Amsterdam ist der internationale Klassiker schlechthin: 1 Stunde Flug oder 5 Stunden Auto ab Berlin, alles auf Englisch oder Deutsch buchbar, mit Grachten-Bootstour und Coffeeshop-Kultur als unverkennbare Wahrzeichen. Etwas teurer geworden, aber dafür hat keine andere Stadt diesen Vibe.",
    paragraphs: [
      "Amsterdam funktioniert für JGAs aus drei Gründen: liberale Drogengesetze (Cannabis im Coffeeshop legal, Pilze als 'Truffles' verkauft), das Rotlichtviertel als Touri-Pflichtschauplatz (kein Witz mehr, einfach kulturell-anthropologisches Vorbeischauen), und eine kompakte Innenstadt mit Hunderten von Bars in 2 km Umkreis.",
      "Tagsüber dominiert Wasser: Grachten-Bootstour mit eigener Bar (private Charters ab 200 € für 2 Stunden, 10–12 Personen, eigene Getränke), Pedalboot-Touren, SUP auf den Grachten, oder Fahrradtouren durch die Stadt (Pflicht). Heineken-Brauerei und Anne-Frank-Haus als kulturelle Pflichtprogramme, je nach Tonalität der Crew.",
      "Abends drei Hauptzonen: Leidseplein (Touri-Klassiker, lebendig aber teuer), Rembrandtplein (Disco-Schwerpunkt), Jordaan (charmante Bars, ehrlicher) und De Pijp (Hipster-Viertel, alternative Crowd). Clubs wie Paradiso, Melkweg, Shelter — alle international anerkannt.",
    ],
    topActivitySlugs: [
      "sup",
      "sailing",
      "escape_room",
      "karting",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "shooting_range",
      "bubble_soccer",
      "indoor_skydiving",
    ],
    neighborhoods: [
      { name: "Centrum / Rotlichtviertel", tagline: "Touri-Pflicht, Bars, Coffeeshops — die JGA-Achse" },
      { name: "Jordaan", tagline: "Charmante Bars, Cafés mit Charakter, ehrlichere Crowd" },
      { name: "De Pijp", tagline: "Hipster-Viertel südlich Centrum, Brouwerij 't IJ, Albert-Cuyp-Markt" },
      { name: "Leidseplein", tagline: "Bar-Cluster, Disco-Schwerpunkt, junge Crowd" },
    ],
    budget: {
      weekend: "380–700 € pro Person inkl. Flug, Hotel, Aktivitäten (Amsterdam ist teuer)",
      activity: "35–120 € pro Person",
      party: "60–120 € pro Person Bar-Tour (Bier 7–9 €)",
    },
    bestSeasons: ["April–Juni (Tulpen-Saison + warm)", "September (King's Day im April als Sonderhighlight)"],
    insiderTips: [
      "Private Grachten-Tour mit Skipper und eigenen Getränken ab 200 € für 8–12 Personen, 2 Stunden — günstiger und besser als jede organisierte Tour.",
      "Coffeeshops im Centrum sind Touri-Standard. Greenhouse, Bulldog, Grey Area sind die etablierten Adressen, alle JGA-tolerant.",
      "Rotlichtviertel-Spaziergang als kulturelles Programmpunkt: kostenlos, immer überfüllt, Fotos verboten (Sicherheitspersonal achtet darauf).",
      "Bier-Preise: in Touri-Bars 7–9 €, in lokalen Bars im Jordaan oder De Pijp 4–5 €. 30 Minuten Fußweg sparen 100 € pro Abend für die Gruppe.",
    ],
    faqs: [
      {
        q: "Lohnt sich Amsterdam für JGA trotz hoher Preise?",
        a: "Wenn das Erlebnis (Grachten, Coffeeshops, internationaler Vibe) für eure Crew zählt, ja. Wenn Budget Priorität hat, eher Prag oder Krakau. Für eine erste Auslands-JGA mit Eindruck: Amsterdam.",
      },
      {
        q: "Cannabis legal — was darf eine JGA wirklich tun?",
        a: "In Coffeeshops legal kaufen und konsumieren bis 5g pro Person. Auf der Straße offiziell verboten, in der Praxis toleriert. Pilze als 'Truffles' legal verkauft, andere Drogen illegal. JGAs sollten sich auf Coffeeshop-Konsum beschränken.",
      },
      {
        q: "Welcher Stadtteil als Basis?",
        a: "Centrum für Touri-Pflicht und Bar-Dichte, Jordaan oder De Pijp für ruhigeren Schlaf nach langen Abenden. AirBnB im Jordaan ist meist optimal für 8–10er-Gruppen.",
      },
      {
        q: "Wie kommt man am besten hin?",
        a: "Flug ab DE 60–150 € (Berlin, München, Frankfurt direkt). ICE ab Köln/Düsseldorf 3,5–4 h. Mit Auto ab West-DE 4–6 h, Parken in Amsterdam aber Albtraum — Park&Ride am Stadtrand nutzen.",
      },
    ],
    coordinates: { lat: 52.3676, lng: 4.9041 },
    population: 920000,
    monthlySearchVolume: 3600,
    wikidataId: "Q727",
    isAbroad: true,
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    nameLocative: "in Barcelona",
    country: "ES",
    countryName: "Spanien",
    region: "Katalonien",
    vibe: "Strand, Tapas, Clubs — der mediterrane JGA-Klassiker mit Gaudí als Bonus",
    intro:
      "Barcelona vereint alles, was Amsterdam und Mallorca trennen: Mittelmeer-Strand mitten in der Stadt, weltklasse Architektur (Sagrada Família, Park Güell), Tapas-Kultur, Clubs an der Strandpromenade. Für JGAs, die Kultur und Eskalation nicht trennen wollen.",
    paragraphs: [
      "Barcelona funktioniert für JGAs, weil die Stadt komprimiert alles bietet: Vormittags Sagrada Família, mittags Tapas am Mercat de Sant Antoni, nachmittags am Strand der Barceloneta, abends im Gòtic auf einem Bar-Crawl, nachts im Opium oder Pacha direkt am Strand. Kein anderes europäisches Ziel verdichtet so unterschiedliche Vibes in 5 Quadratkilometer.",
      "Tagsüber dominiert die Mischung aus Strand und Architektur: Strand-Aktivitäten (SUP, Jetski, Beach Volleyball), Tapas-Tour durch den Born oder El Raval, Gaudí-Walking-Tour als Hangover-Pflichtprogramm. Bootsausflüge ab Port Vell für 6–8 Personen ab 300 € für 4 Stunden, mit Schnorcheln und Bord-Bar.",
      "Abends ist Barri Gòtic die Bar-Crawl-Achse, Gràcia und El Born die hipperen Alternativen, die Strandpromenade (Port Olímpic) für Klub-Eskalation. Spanische Crowd geht erst nach Mitternacht raus — Pre-Drinks bis 0 Uhr, Bars bis 2 Uhr, Clubs bis 5–6 Uhr.",
    ],
    topActivitySlugs: [
      "sup",
      "sailing",
      "jetski",
      "beach_volleyball",
      "wakeboarding",
      "karting",
      "escape_room",
      "lasertag",
      "vr_arena",
      "shooting_range",
    ],
    neighborhoods: [
      { name: "Barri Gòtic / El Born", tagline: "Altstadt, mittelalterliche Gassen, Bar-Crawl-Pflicht" },
      { name: "Barceloneta", tagline: "Stadtstrand, Strandbars, Beach-Programm" },
      { name: "Gràcia", tagline: "Hipster-Viertel, Plätze mit lokalen Bars" },
      { name: "El Raval", tagline: "Multikulti, günstigere Bars, raues Charme-Viertel" },
    ],
    budget: {
      weekend: "350–620 € pro Person inkl. Flug, Hotel, Programm",
      activity: "35–120 € pro Person",
      party: "50–100 € pro Person Bar-Tour + Club",
    },
    bestSeasons: ["Mai–Juni (warm, nicht überfüllt)", "September (Strand noch warm, Locals zurück)"],
    insiderTips: [
      "Tapas-Tour durch El Born oder Sant Antoni mit lokalen Guide: 50–70 € pro Person für 4–5 Stationen mit Wein. Bessere Story als jeder Steak-Abend in DE.",
      "Sagrada Família-Tickets online vorbuchen, nicht spontan — sonst 2 h Anstehen statt 10 min Eingang.",
      "Strandbars 'Chiringuitos' im Sommer ab 11 Uhr offen — perfekt für Brunch + Strandtag-Übergang.",
      "Flüge ab DE 50–150 € roundtrip mit Vueling, Ryanair, Lufthansa. Flughafen 30 min mit Metro ins Zentrum.",
    ],
    faqs: [
      {
        q: "Barcelona oder Mallorca für JGA?",
        a: "Mallorca für eskalations-fokussierte Crews mit Strand und Ballermann. Barcelona für Crews, die Kultur, Tapas und Clubs in einer Stadt wollen. Beide Kosten ähnlich; Barcelona ist kulturell befriedigender, Mallorca ist gruppen-optimierter.",
      },
      {
        q: "Wie viel kostet ein Barcelona-JGA?",
        a: "350–600 € pro Person für 3 Nächte inkl. Flug, Mittelklasse-Hotel, 1 Aktivität, Bars. Mit AirBnB für 8–10er-Gruppe lässt sich auf 280–400 € pro Person drücken.",
      },
      {
        q: "Spanische Sperrstunden — wann beginnt was?",
        a: "Tapas-Bars: 19–23 Uhr. Bars: 22–2 Uhr. Clubs: 0–6 Uhr. Wer um 21 Uhr in einen Club geht, ist allein. Die spanische JGA-Crew beginnt erst nach Mitternacht ernsthaft.",
      },
      {
        q: "Strand mitten in der Stadt — wirklich brauchbar?",
        a: "Ja, Barceloneta ist 10 min vom Zentrum mit Metro. Im Sommer überfüllt, aber lebendig und JGA-tauglich. Für ruhigere Strände 30 min nach Castelldefels oder Sitges fahren.",
      },
    ],
    coordinates: { lat: 41.3851, lng: 2.1734 },
    population: 1640000,
    monthlySearchVolume: 4400,
    wikidataId: "Q1492",
    isAbroad: true,
  },
  {
    slug: "paris",
    name: "Paris",
    nameLocative: "in Paris",
    country: "FR",
    countryName: "Frankreich",
    region: "Île-de-France",
    vibe: "Eiffelturm, Wein, Pigalle — JGA für Stil-Crews, die mehr als Bier wollen",
    intro:
      "Paris ist die JGA-Stadt für Crews, die Eleganz und Eskalation kombinieren wollen. Wein statt Bier, Cocktails statt Sangria, Bar à Vin im Marais statt Schinkenstraße, und dann doch der Pigalle als Pflicht-Touri-Stop. Teurer als Prag, aber konkurrenzlos für gehobene Bräutigams-Crews.",
    paragraphs: [
      "Paris funktioniert anders als der typische JGA-Markt: weniger laut, weniger Gruppenfeier-Infrastruktur, dafür mit einer Bar- und Restaurant-Szene auf Weltklasse-Niveau. Eine JGA in Paris ist eher eine kulinarisch-kulturelle Reise mit Eskalations-Optionen, weniger ein Massen-Eskalations-Wochenende.",
      "Tagsüber Programm: Eiffelturm-Foto (Pflicht, kurz), Louvre oder Musée d'Orsay (eine Stunde, dann genug), Seine-Schifffahrt mit eigenem Glas Champagner (private Bateau ab 400 € für eine Crew), Wein-Tasting in den Caves du Louvre oder Marais. Für aktive Crews: Karting im Funkart Paris, Escape Rooms im Le Marais, Bouldern in der Climbing District.",
      "Abends teilt sich Paris in drei Pole: Le Marais (Cocktail-Bars, gemischte Crowd, hippe Atmosphäre), Pigalle (Touri-Klassiker, einst Rotlicht, heute Bar-Cluster Sex-Pistols), Bastille (junge Crowd, lebendige Bar-Meilen). Clubs wie Wanderlust, Concrete, Rex sind etablierte Adressen — Türsteher streng, gemischte Gruppen bevorzugt.",
    ],
    topActivitySlugs: [
      "karting",
      "escape_room",
      "climbing",
      "axe_throwing",
      "vr_arena",
      "lasertag",
      "shooting_range",
      "indoor_skydiving",
      "bubble_soccer",
      "rage_room",
    ],
    neighborhoods: [
      { name: "Le Marais", tagline: "Cocktail-Bars, hippe Atmosphäre — JGA-Hauptbasis" },
      { name: "Pigalle", tagline: "Touri-Klassiker, Sex-Pistols-Tradition, Bar-Cluster" },
      { name: "Bastille / Oberkampf", tagline: "Junge Crowd, lebendige Bar-Meilen, günstiger" },
      { name: "Montmartre", tagline: "Sacré-Cœur, Touri aber pittoresk, Tagesprogramm" },
    ],
    budget: {
      weekend: "500–900 € pro Person inkl. Flug/Zug, Hotel, Programm",
      activity: "45–150 € pro Person",
      party: "80–150 € pro Person Bar-Tour (Cocktail 14–18 €)",
    },
    bestSeasons: ["Mai–Juni (vor Hochpreissaison)", "September (Locals zurück, lebendig)", "Dezember (Weihnachtsmarkt)"],
    insiderTips: [
      "Champagner-Bar 'Le Bar du Caviar Kaspia' oder 'Bisou' für ein einmaliges Pre-Drinks-Erlebnis — 18 € pro Glas, aber Memorabilien-Foto inklusive.",
      "TGV/ICE ab Frankfurt/Köln/München in 4–6 Stunden ins Stadtzentrum — entspannter als Fliegen, gleicher Preis ab 80 €.",
      "Wein-Tasting in den Caves du Louvre: 45–60 € pro Person für 3 Stunden, 5–7 Weine, Erklärung auf Englisch. Anti-Hangover-Brunch-Variante.",
      "Pigalle ist heute deutlich bar-fokussierter als sein Ruf — Le Carmen, Dirty Dick, Glass für Cocktail-Crawl auf hohem Niveau.",
    ],
    faqs: [
      {
        q: "Lohnt sich Paris für eine klassische JGA?",
        a: "Für Eskalations-fokussierte JGAs eher Prag oder Mallorca. Für Crews, die Stil, Wein, Cocktails und eine Kulturreise mit Bar-Programm kombinieren wollen, ist Paris konkurrenzlos. Bräutigam-Profil entscheidend.",
      },
      {
        q: "Was kostet ein 3-Tages-Paris-JGA?",
        a: "500–800 € pro Person inkl. Anreise, Mittelklasse-Hotel, 1 Aktivität, 2 Bar-Abenden. Mit AirBnB-Wohnung im Marais lässt sich auf 380–550 € pro Person drücken.",
      },
      {
        q: "Türsteher in Pariser Clubs — wie kommt eine Männer-Gruppe rein?",
        a: "Schwierig. Reine Männergruppen ab 6 Personen werden in den Top-Clubs (Concrete, Rex) abgewiesen. Empfehlung: in Bars bleiben, oder Wanderlust und kleinere Clubs gezielt anvisieren. Reservierung mit Bottle-Service umgeht das Problem.",
      },
      {
        q: "Bahn oder Flug nach Paris?",
        a: "Bahn aus West-DE klar besser: Tür-zu-Tür schneller als Flug, Crew kann auf der Hinfahrt vorglühen, kein Gepäck-Stress. Aus Berlin/Hamburg Flug, sonst ICE/TGV.",
      },
    ],
    coordinates: { lat: 48.8566, lng: 2.3522 },
    population: 2160000,
    monthlySearchVolume: 2400,
    wikidataId: "Q90",
    isAbroad: true,
  },
  {
    slug: "london",
    name: "London",
    nameLocative: "in London",
    country: "GB",
    countryName: "Vereinigtes Königreich",
    region: "England",
    vibe: "Pubs, Themse, weltbeste Cocktail-Bars — JGA für Crews mit Budget und Englischkenntnissen",
    intro:
      "London ist die Bar-Hauptstadt Europas und ein JGA-Ziel für Crews, die Vielfalt und Cocktail-Qualität über Budget stellen. Mit Brexit teurer, mit dem Pfund schwieriger zu kalkulieren, aber unschlagbar bei Bar-Dichte und Stag-Do-Infrastruktur (Briten haben den Stag Do erfunden).",
    paragraphs: [
      "London hat als JGA-Stadt einen einzigartigen Vorteil: Briten haben den 'Stag Do' kulturell perfektioniert. Pub-Crawls sind Standardware, Bars wissen, wie sie eine 10er-Gruppe abfertigen, Aktivitätsanbieter haben fertige JGA-Pakete. Die Stadt liefert vom Backstein-Pub bis zur Sky-Bar im 30. Stock alles.",
      "Tagsüber Programm: Themse-Cruise (vom touristischen Standard bis zum privaten Charter), Karting bei TeamSport (mehrere Standorte), Schießstand (eingeschränkter als in Prag, aber legal), Escape Rooms, Bouldern bei Yonder oder The Castle, oder Foot-Golf in Crystal Palace. Touri-Pflicht: Tower of London, London Eye, Camden Market.",
      "Abends teilt sich London grob in Zonen: Soho (touristisch aber lebendig), Shoreditch (Hipster und Cocktail-Bars Weltklasse), Camden (raue Crowd, Live-Musik), Covent Garden (Theater, danach Drinks). Cocktail-Bars wie Connaught Bar, Lyaness, Tayer + Elementary stehen auf weltweiten Top-10-Listen.",
    ],
    topActivitySlugs: [
      "karting",
      "escape_room",
      "climbing",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "shooting_range",
      "indoor_skydiving",
      "bubble_soccer",
      "rage_room",
    ],
    neighborhoods: [
      { name: "Soho", tagline: "Bar-Cluster, touristisch aber lebendig — klassische JGA-Achse" },
      { name: "Shoreditch", tagline: "Hipster-Viertel, Weltklasse-Cocktail-Bars, kreative Crowd" },
      { name: "Camden", tagline: "Raue Crowd, Live-Musik, Camden Market tagsüber" },
      { name: "Covent Garden", tagline: "Theater-Viertel, danach Drinks, kompakt" },
    ],
    budget: {
      weekend: "550–1000 € pro Person inkl. Flug, Hotel, Programm (London ist Premium)",
      activity: "40–150 € pro Person",
      party: "80–160 € pro Person Bar-Tour (Cocktail 12–18 £)",
    },
    bestSeasons: ["Mai–Juli (warm, Rooftop-Bars)", "Dezember (Weihnachtsmarkt, schickste Saison)"],
    insiderTips: [
      "Sky Garden im 35. Stock — kostenlos, mit Reservierung, beste London-Panorama-Bar. JGA-Pflicht-Foto.",
      "Oyster Card oder kontaktloses Bezahlen für Tube — nicht versuchen, Einzelfahrkarten zu kaufen. £8 Cap pro Tag in Zone 1–2.",
      "Pub-Etikette: an der Bar bestellen, nicht am Tisch warten. Trinkgeld nicht erwartet wie in den USA. Pints 5–8 £.",
      "Flüge: ab DE 30–150 € roundtrip mit Ryanair, easyJet, BA. Anreise mit Eurostar ab Brüssel/Paris möglich, aber teuer.",
    ],
    faqs: [
      {
        q: "London ist teuer — lohnt es sich trotzdem?",
        a: "Für eine erste Auslands-JGA mit höherem Budget, ja. London bietet Bar-Qualität, die nirgends in Europa erreicht wird. Für Eskalations-Crews mit knappem Budget eher Prag oder Krakau.",
      },
      {
        q: "Brauchen wir Englisch für die JGA?",
        a: "Ja, mindestens Grundlagen. London ist nicht touristisch genug, um auf Deutsch durchzukommen. Hotelpersonal manchmal, Bars und Pubs eher nicht. Für Crews ohne Englisch-Niveau eher Amsterdam wählen.",
      },
      {
        q: "Was kostet eine Pub-Crawl in London?",
        a: "Organisierte Crawls 25–40 £ pro Person mit 4 Pubs. Selbst organisiert geht es günstiger, aber Bier ist 5–8 £ pro Pint. Rechnet 80–120 £ pro Person für einen Abend mit 5–7 Drinks.",
      },
      {
        q: "Kann man von London aus Tagesausflüge machen?",
        a: "Oxford (1h Bus), Brighton (1h Zug, Strand-Pubs), Stonehenge (Tagestour). Für JGAs aber meist überflüssig — London hat genug für 3 Tage.",
      },
    ],
    coordinates: { lat: 51.5074, lng: -0.1278 },
    population: 9000000,
    monthlySearchVolume: 1300,
    wikidataId: "Q84",
    isAbroad: true,
  },
  {
    slug: "lissabon",
    name: "Lissabon",
    nameLocative: "in Lissabon",
    country: "PT",
    countryName: "Portugal",
    region: "Lisboa",
    vibe: "Hügel, Fado, Bairro Alto — der Geheimtipp-JGA mit Atlantik als Bonus",
    intro:
      "Lissabon ist die unentdeckte Schwester Barcelonas: günstiger, etwas ruhiger, mit dem Atlantik in 30 Minuten Bahn und einer Bar-Szene im Bairro Alto, die mit den besten Europas mithält. Für Crews, die etwas weniger Klischee und etwas mehr Echtheit wollen.",
    paragraphs: [
      "Lissabon funktioniert als JGA-Ziel aus drei Gründen: Atlantik-Strand in 30 Min mit der Bahn (Cascais, Estoril), kompakte Innenstadt mit hügeligen Straßenbahn-Touren, und der Bairro Alto — ein ganzes Viertel mit Hunderten von Bars in 800 Metern Umkreis, mit Drinks im Außenbereich, lebendig bis 4 Uhr.",
      "Tagsüber drei Hauptaktivitäten: Tram 28 als touristische Hügel-Rundfahrt (1 € pro Fahrt), Tagestour Sintra (Pena-Palast, Quinta da Regaleira — Märchenkulisse) oder Cascais (Strand, Surfen, Atlantikküste), Surfunterricht in Costa da Caparica oder Ericeira. Tasca-Bar-Crawls im Alfama als kulturelle Pflicht.",
      "Abends ist der Bairro Alto die heimliche Hauptachse: nicht eine Bar, sondern ein ganzes Viertel als Bar. Drinks werden zum Mitnehmen verkauft, die Straße ist die Bühne, Crowds vermischen sich. Pink Street (Rua Nova do Carvalho) für jüngere Crowd. Lux Frágil ist der etablierte JGA-Club am Hafen.",
    ],
    topActivitySlugs: [
      "sup",
      "sailing",
      "wakeboarding",
      "karting",
      "escape_room",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "bubble_soccer",
      "indoor_skydiving",
    ],
    neighborhoods: [
      { name: "Bairro Alto", tagline: "Hunderte Bars in 800 m — die heimliche Hauptachse für JGAs" },
      { name: "Alfama", tagline: "Älteste Stadtteil, Fado-Bars, hügelig, romantisch" },
      { name: "Chiado", tagline: "Cocktail-Bars, schicker, Shopping-Viertel" },
      { name: "LX Factory", tagline: "Ehemalige Fabrik, jetzt Bars + Restaurants + Markthalle" },
    ],
    budget: {
      weekend: "280–520 € pro Person inkl. Flug, Hotel, Programm",
      activity: "30–100 € pro Person",
      party: "30–70 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni (warm, vor Hochsaison)", "September–Oktober (Surfen, leerer)"],
    insiderTips: [
      "Sintra als Halbtagestour: 1h Bahn, Pena-Palast + Quinta da Regaleira, danach zurück nach Lissabon. Perfekte Brunch-Alternative für Tag 2.",
      "Bairro Alto: Drinks zum Mitnehmen kaufen und auf der Straße trinken ist legal, lokale Tradition. Pro Cocktail 4–6 € — günstiger als in jeder Bar.",
      "Pastéis de Belém: die echten in der gleichnamigen Bäckerei in Belém (Original-Rezept seit 1837). Pflicht-Snack für jeden JGA.",
      "Flüge: ab DE 60–180 € roundtrip mit TAP, Ryanair, Easyjet. Flughafen 15 min mit Metro ins Zentrum.",
    ],
    faqs: [
      {
        q: "Lissabon oder Barcelona für JGA?",
        a: "Barcelona ist bekannter, lauter, mit dichterem Klub-Angebot. Lissabon ist günstiger, authentischer, mit dem Atlantik als Surfing-Bonus. Crews mit zweitem Auslands-JGA wählen Lissabon.",
      },
      {
        q: "Was kostet ein Lissabon-JGA realistisch?",
        a: "280–500 € pro Person für 3 Nächte. Hotelpreise deutlich unter Barcelona, Drinks im Bairro Alto extrem günstig, Aktivitäten preislich mit Mallorca vergleichbar.",
      },
      {
        q: "Wie funktioniert der Bairro Alto wirklich?",
        a: "Ein ganzes Viertel als Open-Air-Bar. Drinks an Bar-Theken bestellen, mit Plastikbecher rausgehen, auf der Straße trinken. Mehrere Bars in jeder Straße, alle gleich offen, alle mit Außen-Crowd. Keine Reservierung möglich.",
      },
      {
        q: "Surfunterricht für Anfänger?",
        a: "Costa da Caparica oder Ericeira: Gruppenkurse 35–55 € pro Person für 2 Stunden inkl. Equipment. Beste Crash-Course-Aktivität für JGAs, die etwas anderes wollen als Karting.",
      },
    ],
    coordinates: { lat: 38.7223, lng: -9.1393 },
    population: 545000,
    monthlySearchVolume: 880,
    wikidataId: "Q597",
    isAbroad: true,
  },
  {
    slug: "istanbul",
    name: "Istanbul",
    nameLocative: "in Istanbul",
    country: "TR",
    countryName: "Türkei",
    region: "İstanbul",
    vibe: "Bosporus, Bazar, Beyoğlu — die orientalisch-europäische JGA-Stadt mit einzigartiger Geographie",
    intro:
      "Istanbul ist die JGA-Stadt für Crews, die etwas wirklich anderes wollen: 15-Millionen-Metropole auf zwei Kontinenten, Bosporus als Wasserader, Hagia Sophia als Kulisse, Beyoğlu als europäisch geprägtes Bar-Viertel. Mit Lira-Kurs aktuell extrem günstig — Preise oft niedriger als Prag.",
    paragraphs: [
      "Istanbul vereint zwei Welten: die touristische, kulturelle Seite mit Hagia Sophia, Blauer Moschee, Grand Bazar (Sultanahmet) und die europäisch geprägte, säkulare Bar-Welt (Beyoğlu, Karaköy, Kadıköy). Eine JGA hier ist die kontrastreichste Reise, die du in Europa-Nähe machen kannst.",
      "Tagsüber Programm: Bosporus-Schifffahrt (ab 5 € für die Standardroute, 30 € für private Charter), Kapali Çarşı (Grand Bazar) mit Verhandeln um Souvenirs, Hagia Sophia und Blaue Moschee (Pflicht-Stop, kostenlos), oder die Prinzeninseln (1h Fähre, autofrei, Pferdekutschen, Strand). Türkisches Bad (Hamam) als Hangover-Therapie — Çemberlitaş oder Cağaloğlu Hamam ab 30 € pro Person.",
      "Abends ist Beyoğlu (rund um die İstiklal Caddesi) die Bar-Achse: Mikla mit Skyline-Blick, Karabatak im Karaköy, 360 Istanbul für Touri-Klassiker. Kadıköy auf der asiatischen Seite ist die Hipster-Alternative — günstiger, authentischer, lebendiger. Clubs wie Reina, Sortie am Bosporus für Premium-Erlebnis.",
    ],
    topActivitySlugs: [
      "sup",
      "sailing",
      "escape_room",
      "karting",
      "lasertag",
      "axe_throwing",
      "vr_arena",
      "shooting_range",
      "indoor_skydiving",
      "bubble_soccer",
    ],
    neighborhoods: [
      { name: "Beyoğlu / İstiklal", tagline: "Europäisch geprägte Bar-Achse, Cocktail-Bars, JGA-Hauptbasis" },
      { name: "Karaköy", tagline: "Hipster-Viertel, Cocktail-Bars Weltklasse" },
      { name: "Kadıköy", tagline: "Asiatische Seite, authentisch, günstiger" },
      { name: "Sultanahmet", tagline: "Touri-Achse, Hagia Sophia, Bazar, kulturelles Programm" },
    ],
    budget: {
      weekend: "250–500 € pro Person inkl. Flug, Hotel, Programm",
      activity: "15–80 € pro Person",
      party: "25–80 € pro Person Bar-Tour (Cocktail 4–10 €)",
    },
    bestSeasons: ["April–Juni (mild, nicht überfüllt)", "September–Oktober (Goldener Herbst, Bosporus klar)"],
    insiderTips: [
      "Bosporus-Schifffahrt: Standard-Tour ab Eminönü für 5–8 € als touristisches Pflichtprogramm. Privater Yacht-Charter für 6–10 Personen ab 150 € — beste JGA-Tour in der Stadt.",
      "Hamam-Erlebnis: 30–60 € pro Person für klassisches türkisches Bad mit Schaum-Behandlung. Beste Hangover-Therapie weltweit.",
      "Asiatische Seite (Kadıköy) per Fähre erkunden — 30 Min mit der Stadtfähre, 30 % günstigere Bars, authentischere Crowd, weniger Touri-Druck.",
      "Lira-Kurs prüfen — extreme Schwankungen. In den letzten Jahren wurden Restaurant- und Bar-Preise effektiv halbiert. Geld in Lira tauschen, nicht mit Karte zahlen bei kleinen Beträgen.",
    ],
    faqs: [
      {
        q: "Ist Istanbul für JGAs sicher?",
        a: "In touristischen Vierteln (Sultanahmet, Beyoğlu, Karaköy) sehr sicher. Standardvorsichtsmaßnahmen wie in jeder Großstadt. Politische Demonstrationen meiden, Außenministerium-Hinweise vor Reiseantritt prüfen.",
      },
      {
        q: "Alkohol in Istanbul — Probleme?",
        a: "Alkohol in säkular geprägten Vierteln (Beyoğlu, Karaköy, Kadıköy) problemlos. In Sultanahmet eher zurückhaltend (Pflicht-Sehenswürdigkeiten). Bier 3–5 €, Cocktails 6–10 €. Türkischer Raki als kulturelle Pflicht.",
      },
      {
        q: "Was kostet ein Istanbul-JGA?",
        a: "250–500 € pro Person für 3 Nächte inkl. Flug. Mit aktueller Lira-Schwäche eines der günstigsten Auslands-JGAs in Reichweite, mit Premium-Bar-Qualität auf europäischem Niveau.",
      },
      {
        q: "Reicht ein Wochenende für Istanbul?",
        a: "Knapp. Drei Nächte ideal: Tag 1 Sultanahmet + Bosporus, Tag 2 Bazar + Hamam + Beyoğlu-Bars, Tag 3 Kadıköy + Heimflug. Die Stadt ist riesig — kompromisslos planen.",
      },
    ],
    coordinates: { lat: 41.0082, lng: 28.9784 },
    population: 15500000,
    monthlySearchVolume: 720,
    wikidataId: "Q406",
    isAbroad: true,
  },

  // ──────────────────────────────────────────────────────────────────
  // Tier 2 — weitere deutsche Städte
  // ──────────────────────────────────────────────────────────────────

  {
    slug: "dresden",
    name: "Dresden",
    nameLocative: "in Dresden",
    country: "DE",
    countryName: "Deutschland",
    region: "Sachsen",
    vibe: "Elbflorenz, Frauenkirche, Neustadt — kulturell-elegant mit kalkuliertem Eskalations-Kern",
    intro:
      "Dresden ist die unterschätzte Mischung aus barocker Pracht und alternativer Bar-Szene. Frauenkirche und Zwinger als Tagesprogramm-Klassiker, die Neustadt mit über 200 Bars in 1 km² als JGA-Hauptbasis.",
    paragraphs: [
      "Dresden funktioniert für JGAs zweigleisig: tagsüber als Kulturreise mit Frauenkirche, Semperoper, Zwinger und Elbradweg-SUP — abends in der Äußeren Neustadt als eine der dichtesten Bar-Meilen Deutschlands. Über 200 Bars zwischen Albert- und Bautzner Straße, alle in Fußnähe.",
      "Aktivitätsseitig stark: Karting in Coswig (20 min), Schloss-Tour mit Wein-Verkostung in den Sächsischen Schlössern, Elbe-SUP, Bouldern, Schießstand. Dresden ist günstiger als Berlin oder München und entspannter für gemischte Gruppen.",
    ],
    topActivitySlugs: ["karting", "escape_room", "sup", "climbing", "axe_throwing", "lasertag", "shooting_range", "vr_arena"],
    neighborhoods: [
      { name: "Äußere Neustadt", tagline: "Über 200 Bars in 1 km² — die JGA-Hauptbasis" },
      { name: "Innere Altstadt", tagline: "Frauenkirche, Zwinger — Touri-Pflicht und kulturelles Programm" },
      { name: "Innere Neustadt", tagline: "Cocktail-Bars zwischen Touri und Hipster" },
    ],
    budget: {
      weekend: "230–420 € pro Person",
      activity: "25–80 € pro Person",
      party: "30–60 € pro Person Neustadt-Tour",
    },
    bestSeasons: ["Mai–September (Elbufer-Saison)", "Dezember (Striezelmarkt — Pflicht-Weihnachtsmarkt)"],
    insiderTips: [
      "Bunte Republik Neustadt (BRN) im Juni — Straßenfest mit kompletter Bar-Meile als Open-Air-Festival, JGA-Goldgrube.",
      "Schloss Wackerbarth (15 min außerhalb): Sekt-Verkostung als gehobenes Tagesprogramm ab 35 € pro Person.",
      "Elbe-SUP von Pieschen bis Blaues Wunder als Halbtagstour — Verleih am Hafen, 25 € pro Person.",
    ],
    faqs: [
      {
        q: "Dresden oder Leipzig für JGA?",
        a: "Dresden ist kulturell dichter und mit der Neustadt etwas etablierter als JGA-Achse. Leipzig hat hippere Crowd und die größere Indie-Szene. Beide günstig und entspannt.",
      },
      {
        q: "Was kostet ein Dresden-JGA pro Person?",
        a: "230–400 € für ein Wochenende inkl. Hotel, Aktivität, Bar-Tour. Deutlich günstiger als Berlin oder München.",
      },
      {
        q: "Welche Bars in der Neustadt?",
        a: "Klassiker: Combo, Lebowski Bar, Down Town, Reisekader. Über 200 Optionen in 1 km — Crawl ergibt sich von selbst.",
      },
    ],
    coordinates: { lat: 51.0504, lng: 13.7373 },
    population: 555000,
    monthlySearchVolume: 1600,
    wikidataId: "Q1731",
  },
  {
    slug: "leipzig",
    name: "Leipzig",
    nameLocative: "in Leipzig",
    country: "DE",
    countryName: "Deutschland",
    region: "Sachsen",
    vibe: "Hypezig, Karli, Plagwitz — die alternative JGA-Stadt für Crews ohne Schickimicki",
    intro:
      "Leipzig ist das günstigere, hippere Berlin im Osten: Karl-Liebknecht-Straße (Karli) und Plagwitz als Bar-Achsen, Cospudener und Markkleeberger See für Wasser-Aktivitäten, Bach-Stadt-Tradition für Kultur-Crews.",
    paragraphs: [
      "Leipzig vereint Berlin-Vibe und Dresden-Preise: Lebendige Indie-Szene, kreative Cocktail-Bars, alternative Clubs (Distillery, Conne Island), und ein Seengebiet 30 Minuten außerhalb. Karli und Südvorstadt sind die JGA-Bar-Achsen, Plagwitz die hippere Alternative.",
      "Tagesprogramm: SUP oder Wakeboarden am Cospudener See, Tour durch Plagwitz (ehemalige Industrie, jetzt Indie-Bars und Werkstätten), Auerbachs Keller als Goethe-Touri-Pflicht, oder Karting/Lasertag in den Industriehallen.",
    ],
    topActivitySlugs: ["sup", "wakeboarding", "karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena"],
    neighborhoods: [
      { name: "Karli (Karl-Liebknecht-Straße)", tagline: "Bar-Meile schlechthin, dichteste JGA-Achse" },
      { name: "Plagwitz", tagline: "Hipster-Viertel, Indie-Bars, ehemaliges Industriegebiet" },
      { name: "Innenstadt", tagline: "Auerbachs Keller, Touri-Klassiker, Cocktail-Bars" },
    ],
    budget: {
      weekend: "220–400 € pro Person",
      activity: "25–80 € pro Person",
      party: "30–55 € pro Person Karli-Tour",
    },
    bestSeasons: ["Mai–September (See-Saison)", "August (Wave-Gotik-Treffen für Subkultur-Crews)"],
    insiderTips: [
      "Cospudener See zum Wakeboarden: ehemaliger Tagebau, jetzt 4 km² Wassergebiet — Wake-Park ab 30 € pro Person.",
      "Plagwitz-Tour: Spinnerei (Kunstgalerien), Werk 2 (Bar/Club), Westwerk — ehemaliges Industrieviertel als JGA-Spielplatz.",
      "Auerbachs Keller-Reservierung empfohlen — Goethe-Touri-Pflicht, ehrlich gutes Essen, JGA-tauglich.",
    ],
    faqs: [
      {
        q: "Leipzig für eine JGA — lohnt es sich?",
        a: "Ja, vor allem für Crews die Berlin-Vibe ohne Berlin-Preise wollen. Etwas weniger Dichte, dafür entspannter und günstiger.",
      },
      {
        q: "Was macht die Karli besonders?",
        a: "1 km Bar-Meile mit allem von Bierkneipe bis Cocktail-Bar in 200m-Abständen. Pflicht-JGA-Achse.",
      },
      {
        q: "Anreise nach Leipzig?",
        a: "ICE ab Berlin in 1h, ab München 3h, ab Hamburg 3,5h. Flughafen Leipzig/Halle kaum genutzt — Bahn besser.",
      },
    ],
    coordinates: { lat: 51.3397, lng: 12.3731 },
    population: 600000,
    monthlySearchVolume: 1500,
    wikidataId: "Q2079",
  },
  {
    slug: "nuernberg",
    name: "Nürnberg",
    nameLocative: "in Nürnberg",
    country: "DE",
    countryName: "Deutschland",
    region: "Bayern",
    vibe: "Burg, Bratwurst, Bardentreffen — fränkische JGA-Tradition mit Mittelalter-Kulisse",
    intro:
      "Nürnberg ist die fränkische Alternative zu München: günstiger, kompakter, mit der mittelalterlichen Burg als Tageskulisse und einer dichten Bar-Szene in der Lorenzer Altstadt. Bratwurst, fränkisches Bier, und mit dem Bardentreffen als Sommer-Highlight.",
    paragraphs: [
      "Nürnberg überrascht JGA-Crews mit kompakter Altstadt (15 Min Fußweg überall), guter Bar-Dichte am Hauptmarkt und in der Gostenhof-Szene (Fränkisches Indie-Viertel), und mit fränkischem Bier (Tucher, Schanzenbräu) als Alternative zu bayrischem Helles. Burg, Hauptmarkt und Albrecht-Dürer-Haus als kulturelle Pflicht-Tagesprogramm.",
      "Tagesaktivitäten: Karting im Karting Center, Hochseilgarten Stein (15 min), Tagesausflug nach Rothenburg ob der Tauber (45 min, Mittelalter-Klischee in Reinform), Schießstand, Bouldern.",
    ],
    topActivitySlugs: ["karting", "escape_room", "high_ropes", "climbing", "lasertag", "axe_throwing", "shooting_range", "vr_arena"],
    neighborhoods: [
      { name: "Lorenzer Altstadt", tagline: "Hauptmarkt, klassische Bars, Brauhäuser" },
      { name: "Gostenhof", tagline: "Fränkisches Hipster-Viertel, Indie-Bars, kreative Crowd" },
      { name: "Sebalder Altstadt", tagline: "Burg-Viertel, Touri-Klassiker, gehobenere Restaurants" },
    ],
    budget: {
      weekend: "240–420 € pro Person",
      activity: "25–80 € pro Person",
      party: "35–60 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–September", "Juli–August (Bardentreffen)", "Dezember (Christkindlesmarkt — der bekannteste Deutschlands)"],
    insiderTips: [
      "Drei-im-Weggla: 3 Nürnberger Bratwürste im Brötchen — Pflicht-Snack zwischen Bars für 4–5 €.",
      "Schanzenbräu in Gostenhof — fränkisches Indie-Craft-Bier, Biergarten + Brauerei-Tour als JGA-Programm.",
      "Tagestour Rothenburg ob der Tauber: 45 min mit Bahn, perfekte Mittelalter-Kulisse, kostenlose Fotos.",
    ],
    faqs: [
      {
        q: "Nürnberg oder München für JGA?",
        a: "Nürnberg ist kompakter, deutlich günstiger und weniger touristisch. München hat mehr Aktivitätsdichte und Wiesn-Tradition. Für Crews, die fränkische Eigenheit erleben wollen: Nürnberg.",
      },
      {
        q: "Was kostet ein Nürnberg-JGA?",
        a: "240–400 € pro Person für ein Wochenende. Eine der günstigeren süddeutschen Großstädte.",
      },
      {
        q: "Christkindlesmarkt-JGA?",
        a: "Ende November bis 24. Dezember: legendärer Markt, JGAs als Christkindle-Wichtel-Idee möglich. Hotelpreise leicht erhöht, Atmosphäre einmalig.",
      },
    ],
    coordinates: { lat: 49.4521, lng: 11.0767 },
    population: 525000,
    monthlySearchVolume: 1300,
    wikidataId: "Q2090",
  },
  {
    slug: "salzburg",
    name: "Salzburg",
    nameLocative: "in Salzburg",
    country: "AT",
    countryName: "Österreich",
    region: "Salzburg",
    vibe: "Mozart, Festung, Festspiele — JGA mit Alpenkulisse und österreichischer Eleganz",
    intro:
      "Salzburg ist die kompakteste österreichische JGA-Stadt: Mozart-Stadt, Festung Hohensalzburg, Salzach-Promenade, und mit dem Salzkammergut in 30 Minuten Bahn als Tagesausflug. Kulturell-elegant, mit Bar-Szene in der Linzer Gasse.",
    paragraphs: [
      "Salzburg funktioniert für JGAs als Mischung aus Kulturreise und Aktiv-Programm: Festung Hohensalzburg, Mozarts Geburtshaus und Schloss Mirabell tagsüber, abends Linzer Gasse und Steingasse für Bar-Crawls, dazwischen Salzach-Rafting oder Wandern auf den Kapuzinerberg.",
      "Highlight: Tagesausflug zum Wolfgangsee oder Königssee (jeweils 45 min), Bootstour mit Bier an Bord, oder Bayerisches Hinterland für Klettersteig + Almhütte. Salzburg ist der beste Standort für Crews, die Stadt + Berge kombinieren wollen.",
    ],
    topActivitySlugs: ["rafting", "hiking", "high_ropes", "karting", "escape_room", "climbing", "sup", "vr_arena"],
    neighborhoods: [
      { name: "Altstadt links der Salzach", tagline: "Mozart-Touri-Achse, Restaurants, klassische Bars" },
      { name: "Linzer Gasse / Steingasse", tagline: "Bar-Achse, JGA-Hauptbasis" },
      { name: "Lehen", tagline: "Hipper Stadtteil, alternativere Bars, günstiger" },
    ],
    budget: {
      weekend: "320–550 € pro Person (Salzburg ist nicht billig)",
      activity: "30–100 € pro Person",
      party: "45–80 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–September (Outdoor-Saison)", "Juli–August (Festspiele — Hotelpreise explodieren)", "Dezember (Christkindlmarkt)"],
    insiderTips: [
      "Wolfgangsee-Tagestour: 45 min mit Bahn, Schiff-Rundfahrt, Brunch in St. Wolfgang, abends zurück.",
      "Festspielzeit (Juli/August) für JGA meiden — Hotels verdoppelt, Atmosphäre überzeitlich, nicht JGA-tauglich.",
      "Stiegl-Brauwelt für Brauerei-Tour mit Verkostung — österreichisches Bier-Programm.",
    ],
    faqs: [
      {
        q: "Salzburg für JGA — passt das?",
        a: "Für kulturell-orientierte Crews die Berge + Stadt kombinieren wollen, ideal. Reine Eskalations-JGAs eher Wien oder München.",
      },
      {
        q: "Beste Tagestour ab Salzburg?",
        a: "Wolfgangsee (See, Brunch, Schiff) oder Königssee (See, Wandern, Bayern). Beide 45 min, beide Highlight-Programm.",
      },
      {
        q: "Was kostet ein Salzburg-JGA?",
        a: "320–500 € pro Person außerhalb Festspielzeit. Während Festspielen verdoppelt sich der Hotelpreis — vermeiden.",
      },
    ],
    coordinates: { lat: 47.8095, lng: 13.055 },
    population: 155000,
    monthlySearchVolume: 880,
    wikidataId: "Q1773",
  },

  // ──────────────────────────────────────────────────────────────────
  // Tier 2 — weitere internationale Destinationen
  // ──────────────────────────────────────────────────────────────────

  {
    slug: "madrid",
    name: "Madrid",
    nameLocative: "in Madrid",
    country: "ES",
    countryName: "Spanien",
    region: "Comunidad de Madrid",
    vibe: "Tapas, Late-Night-Bars, Königliche Eleganz — der ehrliche spanische JGA jenseits der Strand-Klischees",
    intro:
      "Madrid ist Barcelonas spanische Schwester ohne Strand-Touri-Druck: kompakteres Zentrum, dichtere Bar-Szene in Malasaña und Chueca, Tapas-Tradition als kulturelles Hauptprogramm. Spanier feiern hier ohne den Tourismus-Filter Barcelonas.",
    paragraphs: [
      "Madrid funktioniert als JGA-Stadt, weil das Nachtleben in Spanien beginnt, wenn andere Städte schließen. Tapas bis 23 Uhr, Bars bis 3 Uhr, Clubs bis 6 Uhr Standard. Malasaña, Chueca und La Latina sind die JGA-Hauptbasen, alle in 15 Min Fußweg vom Sol.",
      "Tagesprogramm: Prado-Museum für Kultur-Punkte, Retiro-Park, Mercado de San Miguel für Tapas-Pflicht, oder Tagesausflug nach Toledo (30 min mit AVE). Karting, Lasertag und Escape Rooms als Aktivitäten dicht und günstig.",
    ],
    topActivitySlugs: ["karting", "escape_room", "lasertag", "axe_throwing", "vr_arena", "rage_room", "bubble_soccer", "shooting_range"],
    neighborhoods: [
      { name: "Malasaña", tagline: "Hipster-Viertel, Indie-Bars, JGA-Hauptbasis" },
      { name: "La Latina", tagline: "Tapas-Tradition, Sonntag-Brunch-Klassiker" },
      { name: "Chueca", tagline: "Cocktail-Bars, lebendig, gemischte Crowd" },
    ],
    budget: {
      weekend: "300–550 € pro Person inkl. Flug",
      activity: "30–80 € pro Person",
      party: "40–80 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni", "September–Oktober", "Hochsommer vermeiden (Madrid ist im August leer und sehr heiß)"],
    insiderTips: [
      "Tapas-Tour durch La Latina an einem Sonntagvormittag: traditionelles Programm, JGAs gehen unter, beste Authentizität.",
      "Joy Eslava und Kapital als Touri-Mega-Clubs (7 Stockwerke). Spanier gehen lieber zu Mondo Disko oder Hotel Patriotic.",
      "AVE nach Toledo: 30 min, halbtägige UNESCO-Stadt mit mittelalterlicher Kulisse.",
    ],
    faqs: [
      {
        q: "Madrid oder Barcelona für JGA?",
        a: "Barcelona für Strand und internationale Crowd. Madrid für authentisch-spanisches Nachtleben ohne Touri-Druck.",
      },
      {
        q: "Spanische Bars — wann anfangen?",
        a: "Vor 22 Uhr seid ihr allein. Tapas ab 20 Uhr, Bars füllen sich ab 23 Uhr, Clubs ab 1 Uhr. Auf das Tempo einstellen.",
      },
      {
        q: "Was kostet ein Madrid-JGA?",
        a: "300–500 € pro Person inkl. Flug für 3 Nächte. Vergleichbar mit Barcelona, oft etwas günstiger.",
      },
    ],
    coordinates: { lat: 40.4168, lng: -3.7038 },
    population: 3260000,
    monthlySearchVolume: 720,
    wikidataId: "Q2807",
    isAbroad: true,
  },
  {
    slug: "valencia",
    name: "Valencia",
    nameLocative: "in Valencia",
    country: "ES",
    countryName: "Spanien",
    region: "Comunitat Valenciana",
    vibe: "Strand, Paella, La Tomatina — die familienfreundliche Alternative zu Barcelona",
    intro:
      "Valencia ist Barcelona ohne den Touri-Druck: 7 km Stadtstrand, Paella als Originalheimat, futuristische Architektur der Ciudad de las Artes y las Ciencias und Hafenviertel El Cabanyal als Bar-Achse.",
    paragraphs: [
      "Valencia hat den Strand-Vibe Barcelonas ohne die Preise und den Massentourismus. El Cabanyal direkt am Strand für Beach-JGAs, El Carmen als Altstadt-Bar-Cluster, Ruzafa als Hipster-Viertel.",
      "Tagsüber Strand-Pflicht, La Tomatina (August) als surreale Tagestour-Option, Paella-Kochkurs (45 € pro Person), Hafen-Bootstour, oder Tagesausflug Albufera-See für Sonnenuntergangs-Bootstouren.",
    ],
    topActivitySlugs: ["sup", "sailing", "jetski", "beach_volleyball", "karting", "escape_room", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "El Carmen", tagline: "Altstadt-Bar-Cluster, mittelalterliche Gassen" },
      { name: "Ruzafa", tagline: "Hipster-Viertel, Cocktail-Bars" },
      { name: "El Cabanyal / Strand", tagline: "Beach-Front, Strandbars, JGA-Beach-Programm" },
    ],
    budget: {
      weekend: "260–460 € pro Person inkl. Flug",
      activity: "30–90 € pro Person",
      party: "35–70 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–Juni", "September", "März (Las Fallas)"],
    insiderTips: [
      "Paella-Kochkurs ist Pflichtprogramm — Valencia ist die Heimat. Anbieter ab 40 € pro Person für 4h inkl. Markt-Tour.",
      "Las Fallas (15.–19. März): 1 Million Besucher, Feuerwerke, JGAs als Fallera willkommen — Spezialvorlauf 6 Monate.",
      "La Tomatina (letzter Mittwoch im August) in Buñol: Tagestour, Tomatenwurf-Festival, surreal.",
    ],
    faqs: [
      {
        q: "Valencia oder Barcelona — wie unterscheiden sie sich?",
        a: "Valencia ist ruhiger, günstiger, mit besserem Strand und ehrlicherer Atmosphäre. Barcelona ist lebendiger und touristisch dichter.",
      },
      {
        q: "Wann nach Valencia?",
        a: "Mai–Juni und September für Strand-Wetter ohne Hochsaison. März bei Mut: Las Fallas, eines der einzigartigsten Festivals Europas.",
      },
      {
        q: "Was kostet Valencia?",
        a: "260–450 € pro Person inkl. Flug für 3 Nächte. Eine der günstigsten Strand-Optionen in West-Europa.",
      },
    ],
    coordinates: { lat: 39.4699, lng: -0.3763 },
    population: 800000,
    monthlySearchVolume: 320,
    wikidataId: "Q8818",
    isAbroad: true,
  },
  {
    slug: "ibiza",
    name: "Ibiza",
    nameLocative: "auf Ibiza",
    country: "ES",
    countryName: "Spanien",
    region: "Balearen",
    vibe: "Pacha, Amnesia, Sunset-Strip — die Elektro-Eskalations-Insel par excellence",
    intro:
      "Ibiza ist der Premium-JGA für elektronische-Musik-Crews: Pacha, Amnesia, Ushuaïa als ikonische Clubs, Sunset Strip in San Antonio, Hippie-Märkte als Tagespause. Teurer als Mallorca, aber unschlagbar für Techno/House-orientierte Bräutigams.",
    paragraphs: [
      "Ibiza funktioniert nur für eine bestimmte Crew: elektronische Musik als Hauptmotor, Budget über 500 € pro Person, Mai–September-Saison. Außerhalb der Saison ist Ibiza eine ruhige Insel ohne JGA-Infrastruktur.",
      "Tagesprogramm: Boots-Charter um Formentera (300–600 € pro Tag für 8–10 Personen, beste JGA-Tour-Option), Strandtag in Cala Comte oder Es Vedrà, Sunset Strip im Cafe del Mar oder Mambo. Pacha-Eintritt 60–80 € pro Person, Drink ab 15 €.",
    ],
    topActivitySlugs: ["sailing", "sup", "jetski", "wakeboarding", "beach_volleyball", "escape_room", "karting", "vr_arena"],
    neighborhoods: [
      { name: "Playa d'en Bossa", tagline: "Beach-Clubs Ushuaïa, Hï Ibiza — JGA-Hauptachse" },
      { name: "San Antonio", tagline: "Sunset Strip, jüngere Crowd, günstiger" },
      { name: "Ibiza-Stadt (Eivissa)", tagline: "Altstadt, Pacha, schickere Restaurants" },
    ],
    budget: {
      weekend: "600–1200 € pro Person (Premium-Saison)",
      activity: "80–250 € pro Person (Bootstour Hauptkosten)",
      party: "150–300 € pro Person Club-Nacht (Eintritt + Drinks)",
    },
    bestSeasons: ["Mai (Saisonbeginn, günstiger)", "September (Closing Parties)", "Vermeiden: Juli–August (Premium-Preise)"],
    insiderTips: [
      "Bootscharter nach Formentera für 8–10 Personen: 400–700 € für 6h — günstigster Pro-Kopf-Preis pro Eskalation auf Ibiza.",
      "Closing Parties Anfang September: legendär, Tickets 6 Monate vorher buchen.",
      "Hotel-Strategie: AirBnB in der Inselmitte (Santa Gertrudis) deutlich günstiger als Strand-Hotels, mit Mietwagen flexibler.",
    ],
    faqs: [
      {
        q: "Ist Ibiza-JGA das Geld wert?",
        a: "Nur für elektronische-Musik-orientierte Crews mit Budget über 700 € pro Person. Für Standard-JGAs ist Mallorca oder Mallorca-Magaluf günstiger und ähnlich eskalations-tauglich.",
      },
      {
        q: "Pacha oder Amnesia?",
        a: "Pacha für Klassiker und schickere Crowd, Amnesia für rauer und Techno-fokussiert. Beide im JGA-Pantheon, einmal-im-Leben-Erlebnis.",
      },
      {
        q: "Was kostet eine Pacha-Nacht?",
        a: "Eintritt 60–80 €, Bier 12 €, Cocktail 18–22 €. Eine Nacht im Pacha = 200 € pro Person inkl. allem. Realistisch kalkulieren.",
      },
    ],
    coordinates: { lat: 38.9067, lng: 1.4206 },
    population: 50000,
    monthlySearchVolume: 1300,
    wikidataId: "Q3851",
    isAbroad: true,
  },
  {
    slug: "rom",
    name: "Rom",
    nameLocative: "in Rom",
    country: "IT",
    countryName: "Italien",
    region: "Lazio",
    vibe: "Kolosseum, Pasta, Aperitivo — JGA mit antiker Kulisse und römischer Trinkkultur",
    intro:
      "Rom ist die JGA-Stadt mit der spektakulärsten Touri-Kulisse Europas. Kolosseum, Vatikan, Trevi-Brunnen tagsüber — Trastevere, Monti, Testaccio abends für Aperitivo, Pasta und Bar-Crawls jenseits der Touri-Achse.",
    paragraphs: [
      "Rom funktioniert für JGAs zweigleisig: tagsüber als kondensierte Welt-Kultur-Reise (Kolosseum, Vatikan, Forum Romanum), abends als Bar- und Pasta-Tour durch Trastevere und Monti. Italiener trinken Aperitivo zwischen 19–21 Uhr mit kostenlosem Snack-Buffet — günstigste Pre-Drinks Europas.",
      "Tagesaktivitäten: Vespa-Tour durch die Stadt (60–80 € pro Person für 3h), Wein-Verkostung in Frascati (45 min südlich), Karting, Tagesausflug Tivoli (Villa d'Este).",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "vr_arena", "lasertag", "shooting_range", "bubble_soccer", "rage_room"],
    neighborhoods: [
      { name: "Trastevere", tagline: "Touristisch aber lebendig, JGA-Bar-Achse, Trattoria-Pflicht" },
      { name: "Monti", tagline: "Hipper, Cocktail-Bars, kreative Crowd" },
      { name: "Testaccio", tagline: "Authentisch römisch, weniger Touri, Pasta-Tradition" },
    ],
    budget: {
      weekend: "380–650 € pro Person inkl. Flug",
      activity: "40–100 € pro Person",
      party: "50–100 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni", "September–Oktober", "Hochsommer vermeiden (heiß, Touristen-Wahn)"],
    insiderTips: [
      "Aperitivo-Tradition: 19–21 Uhr, 8–12 € Cocktail mit kostenlosem Buffet (Salami, Käse, Pasta-Salat). Pflicht-Pre-Drink.",
      "Vespa-Tour: 60 € pro Person für 3h durch Rom, Foto am Kolosseum garantiert.",
      "Vatikan vor 9 Uhr besuchen — danach 2h Schlange. Tickets online vorbuchen.",
    ],
    faqs: [
      {
        q: "Rom für JGA — passt das?",
        a: "Für kulturell-orientierte Crews mit Touristen-Pflichtprogramm-Toleranz, ja. Für reine Eskalations-JGAs eher Mailand oder Mallorca.",
      },
      {
        q: "Was ist ein Aperitivo?",
        a: "Italienische Tradition: Cocktail (8–12 €) zwischen 19–21 Uhr inkl. kostenlosem Snack-Buffet. Beste Pre-Drink-Option Europas.",
      },
      {
        q: "Was kostet ein Rom-JGA?",
        a: "380–600 € pro Person für 3 Nächte inkl. Flug. Teurer als Mailand, billiger als Paris.",
      },
    ],
    coordinates: { lat: 41.9028, lng: 12.4964 },
    population: 2870000,
    monthlySearchVolume: 720,
    wikidataId: "Q220",
    isAbroad: true,
  },
  {
    slug: "mailand",
    name: "Mailand",
    nameLocative: "in Mailand",
    country: "IT",
    countryName: "Italien",
    region: "Lombardei",
    vibe: "Mode, Aperitivo, Navigli — Italiens schickere JGA-Stadt mit Cocktail-Tradition",
    intro:
      "Mailand ist die JGA-Stadt für stilbewusste Crews. Mode-Hauptstadt Italiens, mit den Navigli-Kanälen als Bar-Achse, Aperitivo-Tradition auf höchstem Niveau und Cocktail-Bars (Camparino, Bar Basso) auf Weltklasse-Niveau.",
    paragraphs: [
      "Mailand funktioniert anders als Rom: weniger Kulturreise, mehr Bar- und Aperitivo-Tour. Navigli (Kanäle im Süden) und Brera (Künstlerviertel) sind die JGA-Bar-Cluster, Duomo und Galleria nur als kurzer Touri-Stopp.",
      "Tagesprogramm: Mailänder Dom + Galleria (1h reicht), Bootstour auf den Naviglis, Tagesausflug Comer See (45 min mit Bahn — George-Clooney-Villen-Kulisse, ikonisch). Karting und Escape Rooms als Aktivitäten dicht.",
    ],
    topActivitySlugs: ["karting", "escape_room", "sailing", "lasertag", "axe_throwing", "vr_arena", "bubble_soccer", "shooting_range"],
    neighborhoods: [
      { name: "Navigli", tagline: "Kanäle, Bar-Cluster, Aperitivo-Hauptachse" },
      { name: "Brera", tagline: "Künstlerviertel, schickere Bars, gehobenes Aperitivo" },
      { name: "Porta Romana", tagline: "Junge Crowd, lebendige Bars, weniger Touri" },
    ],
    budget: {
      weekend: "420–720 € pro Person inkl. Flug",
      activity: "45–120 € pro Person",
      party: "60–120 € pro Person Bar-Tour (Cocktail 12–18 €)",
    },
    bestSeasons: ["April–Juni", "September–Oktober", "Hochsommer vermeiden (heiß, Mailänder fliehen)"],
    insiderTips: [
      "Aperitivo am Naviglio Grande: Spritz 8 € + kostenloses Buffet. JGA-Goldstandard für 3-h-Pre-Drinks-Session.",
      "Comer See als Halbtagestour: Bellagio, Como, George-Clooney-Villa von der Fähre — Mailand-Klischee in Reinform.",
      "Bar Basso: erfand den Negroni Sbagliato. JGA-Pilgerstätte für Cocktail-Crews.",
    ],
    faqs: [
      {
        q: "Mailand oder Rom für JGA?",
        a: "Mailand für Cocktail-Tradition, Stil und Comer See als Bonus. Rom für historische Kulisse und Pasta-Authentizität. Mailand teurer, kompakter, JGA-tauglicher.",
      },
      {
        q: "Was macht Mailand-Aperitivo besonders?",
        a: "Beste Buffets, längste Tradition (Navigli erfunden), Cocktail-Bars auf Weltklasse-Niveau. Mailänder Aperitivo ist eine eigene Disziplin.",
      },
      {
        q: "Was kostet Mailand?",
        a: "420–700 € pro Person für 3 Nächte. Eine der teureren italienischen Optionen, aber Cocktail-Qualität ist Premium.",
      },
    ],
    coordinates: { lat: 45.4642, lng: 9.19 },
    population: 1380000,
    monthlySearchVolume: 320,
    wikidataId: "Q490",
    isAbroad: true,
  },
  {
    slug: "florenz",
    name: "Florenz",
    nameLocative: "in Florenz",
    country: "IT",
    countryName: "Italien",
    region: "Toskana",
    vibe: "Renaissance, Chianti, Ponte Vecchio — JGA für kulturelle Crews mit Wein-Schwerpunkt",
    intro:
      "Florenz ist die JGA-Stadt für stilvolle Crews: Renaissance-Kulisse, Chianti-Weingüter in 30 min Auto, Bar-Szene rund um die Piazza Santo Spirito. Klein, kompakt, mit einer Touri-Dichte die JGAs zwingt, sich klug zu positionieren.",
    paragraphs: [
      "Florenz funktioniert für JGAs als Kombination aus Renaissance-Tagesprogramm (Uffizien, Duomo, Michelangelos David) und Chianti-Weingüter-Tour (45 min südlich, ab 80 € pro Person für Halbtags-Programm mit Mittagessen). Abends Piazza Santo Spirito und Oltrarno als ehrlichere Alternative zur Touri-Achse.",
      "Aktivitätsseitig dünner als italienische Großstädte, aber mit Weingut-Touren als Top-Aktivität. Tagesausflug nach Pisa, Lucca oder Siena alle in 1h erreichbar.",
    ],
    topActivitySlugs: ["karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena", "shooting_range", "bubble_soccer"],
    neighborhoods: [
      { name: "Oltrarno / Santo Spirito", tagline: "Linkes Arno-Ufer, Bar-Cluster, ehrlich-toskanisch" },
      { name: "Centro Storico", tagline: "Touri-Hauptachse, Duomo, klassische Restaurants" },
      { name: "Sant'Ambrogio", tagline: "Markt-Viertel, lokale Bars, weniger Touri" },
    ],
    budget: {
      weekend: "400–680 € pro Person inkl. Flug",
      activity: "40–120 € pro Person",
      party: "50–90 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Mai", "September–Oktober", "Hochsommer vermeiden (Touristen-Wahn)"],
    insiderTips: [
      "Chianti-Weingut-Tour: 80–120 € pro Person für Halbtagsprogramm mit Mittagessen + 4–5 Weinen — JGA-Highlight schlechthin.",
      "Piazzale Michelangelo bei Sonnenuntergang: kostenlose Panorama-Bühne. Pflicht-Foto.",
      "Centro Storico für Touri-Pflicht-Stunden, dann übern Arno für ehrliche Abend-Bars.",
    ],
    faqs: [
      {
        q: "Florenz für JGA — zu klein?",
        a: "Knapp. Zwei Nächte ideal, drei mit Chianti-Tour als Tag 2. Vier Nächte zäh.",
      },
      {
        q: "Toskana-Wein-Tour — wert?",
        a: "Pflichtprogramm. Beste JGA-Erinnerung in Italien. Anbieter mit Bus + Guide ab 80 €/Person für 5h inkl. Mittagessen.",
      },
      {
        q: "Was kostet Florenz?",
        a: "400–650 € pro Person für 3 Nächte. Eine der teureren italienischen Optionen, vor allem in der Hochsaison.",
      },
    ],
    coordinates: { lat: 43.7696, lng: 11.2558 },
    population: 365000,
    monthlySearchVolume: 210,
    wikidataId: "Q2044",
    isAbroad: true,
  },
  {
    slug: "dublin",
    name: "Dublin",
    nameLocative: "in Dublin",
    country: "IE",
    countryName: "Irland",
    region: "Leinster",
    vibe: "Guinness, Temple Bar, Stag Do — die irische Heimat des Junggesellenabschieds",
    intro:
      "Dublin hat den Stag Do als Konzept perfektioniert. Temple Bar als JGA-Achse, Guinness Storehouse als Touri-Pflicht, eine Pub-Kultur die JGAs als Standard-Inventar akzeptiert. Für englischsprachige Crews oder Bier-orientierte Bräutigams ideal.",
    paragraphs: [
      "Dublin ist die einzige europäische Stadt, in der jede Pub-Crew sofort als JGA erkannt und in das Lokal integriert wird. Das ist Kultur. Temple Bar (touristisch aber lebendig), Camden Street (lokal-authentisch) und Smithfield (Hipster) sind die drei JGA-Hauptachsen.",
      "Tagesprogramm: Guinness Storehouse (Tour + Pint im Rooftop-Pub ab 30 € pro Person), Jameson Distillery, Tagesausflug nach Howth oder Dalkey, oder Karting / Bowling für aktivere Crews.",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "bubble_soccer", "shooting_range", "rage_room"],
    neighborhoods: [
      { name: "Temple Bar", tagline: "Touristische Pub-Achse, Pflicht-JGA-Stopp" },
      { name: "Camden Street", tagline: "Authentischer, lokal-irische Pubs" },
      { name: "Smithfield", tagline: "Hipster-Viertel, kreative Bars" },
    ],
    budget: {
      weekend: "480–820 € pro Person inkl. Flug (Dublin ist teuer)",
      activity: "40–120 € pro Person",
      party: "60–120 € pro Person Pub-Crawl (Pint 7–9 €)",
    },
    bestSeasons: ["Mai–September (Pub-Garten-Saison)", "März (St. Patrick's Day — Sondervorlauf)"],
    insiderTips: [
      "St. Patrick's Day (17. März) als JGA-Termin: ganze Stadt feiert, JGAs gehen unter — Sondervorlauf 6 Monate für Hotels.",
      "Guinness Storehouse mit Rooftop-Pint als Touri-Pflicht inkl. JGA-Foto am Gravity Bar.",
      "Pub-Etikette: Runden ausgeben ist Tradition. Wer eine Runde nicht ausgibt, bleibt vor der nächsten still.",
    ],
    faqs: [
      {
        q: "Dublin für JGA — lohnt es sich?",
        a: "Für englischsprachige, Pub-orientierte Crews ja. Sehr teuer, aber Pub-Kultur einzigartig in Europa.",
      },
      {
        q: "St. Patrick's Day als JGA-Termin?",
        a: "Spektakulär, aber chaotisch und überteuert. Hotelpreise verdreifachen sich. Lieber andere Termine.",
      },
      {
        q: "Was kostet Dublin?",
        a: "480–800 € pro Person für 3 Nächte inkl. Flug. Pint 7–9 €, Hotel ab 130 € pro Nacht — eine der teureren Optionen in Europa.",
      },
    ],
    coordinates: { lat: 53.3498, lng: -6.2603 },
    population: 1170000,
    monthlySearchVolume: 880,
    wikidataId: "Q1761",
    isAbroad: true,
  },
  {
    slug: "edinburgh",
    name: "Edinburgh",
    nameLocative: "in Edinburgh",
    country: "GB",
    countryName: "Vereinigtes Königreich",
    region: "Schottland",
    vibe: "Castle, Whisky, Royal Mile — die schottische Stag-Do-Hauptstadt mit Mittelalter-Kulisse",
    intro:
      "Edinburgh ist die schottische Alternative zu Dublin: mittelalterliche Altstadt mit dem Schloss als Kulisse, Whisky-Tradition statt Guinness, eine kompakte Stag-Do-Infrastruktur in der Cowgate und Grassmarket. Für Crews mit Whisky-Affinität die beste UK-Option.",
    paragraphs: [
      "Edinburgh funktioniert für JGAs aus drei Gründen: kompakte mittelalterliche Altstadt (alles fußläufig), die Whisky-Kultur als Distinktionsmerkmal und das Edinburgh Festival im August als Mega-Event-Hintergrund. Cowgate und Grassmarket als JGA-Bar-Achsen.",
      "Tagesprogramm: Whisky-Distillery-Tour (Scotch Whisky Experience auf der Royal Mile ab 25 €), Highland-Tagestour (Stirling, Loch Lomond — 60–80 € pro Person), Edinburgh Castle als Touri-Pflicht.",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "bubble_soccer", "shooting_range", "climbing"],
    neighborhoods: [
      { name: "Cowgate / Grassmarket", tagline: "JGA-Pub-Achse, Bar-Cluster in mittelalterlichen Gassen" },
      { name: "Royal Mile", tagline: "Touri-Hauptachse, Schloss, klassische Pubs" },
      { name: "Leith", tagline: "Hafen-Viertel, hippere Bars, Trainspotting-Drehort" },
    ],
    budget: {
      weekend: "440–780 € pro Person inkl. Flug",
      activity: "40–150 € pro Person",
      party: "55–110 € pro Person Pub-Crawl",
    },
    bestSeasons: ["Mai–September", "August (Edinburgh Fringe Festival — Sondervorlauf)"],
    insiderTips: [
      "Whisky-Tasting in Holyrood Distillery oder Scotch Malt Whisky Society: 30–50 € pro Person für 5–7 Sorten.",
      "Arthur's Seat (Stadthügel, 1h Wandern): kostenlose Panorama-Plattform, Pflicht-Foto.",
      "Edinburgh Fringe Festival (August): größtes Kulturfestival der Welt, JGA-Hintergrund einmalig — aber Sondervorlauf 9 Monate.",
    ],
    faqs: [
      {
        q: "Edinburgh oder Dublin für UK-JGA?",
        a: "Dublin für Guinness-Pub-Kultur und Stag-Do-Tradition. Edinburgh für Whisky, Schloss-Kulisse und Highland-Tagestour. Beide teuer, beide einzigartig.",
      },
      {
        q: "Highland-Tour — wert?",
        a: "Pflichtprogramm für JGAs. Anbieter wie Rabbie's oder Heart of Scotland 60–80 € pro Person für 12h Tagestour Stirling/Loch Lomond.",
      },
      {
        q: "Was kostet Edinburgh?",
        a: "440–750 € pro Person für 3 Nächte inkl. Flug. Ähnlich teuer wie Dublin.",
      },
    ],
    coordinates: { lat: 55.9533, lng: -3.1883 },
    population: 540000,
    monthlySearchVolume: 320,
    wikidataId: "Q23436",
    isAbroad: true,
  },
  {
    slug: "porto",
    name: "Porto",
    nameLocative: "in Porto",
    country: "PT",
    countryName: "Portugal",
    region: "Norte",
    vibe: "Portwein, Douro, Azulejos — die portugiesische Wein-JGA-Hauptstadt",
    intro:
      "Porto ist die portugiesische Wein-JGA: Portwein-Kellereien am Douro-Ufer, hügelige Altstadt mit Azulejo-Fassaden, lebendiges Nachtleben in der Galerias-Achse. Lissabons authentischere, ehrlichere Schwester.",
    paragraphs: [
      "Porto funktioniert für JGAs aus drei Gründen: Portwein-Tour mit Verkostung in Vila Nova de Gaia (Kellereien wie Sandeman, Cálem, Graham's — 15–25 € pro Person inkl. 3 Weinen), Douro-Schifffahrt, und die Galerias de Paris als Bar-Cluster mit Outdoor-Trinken bis 3 Uhr.",
      "Tagesausflug: Douro-Tal als Weinregion (zugfähig, 1h), Surf-Unterricht in Matosinhos (Strand 20 min außerhalb), oder Stadt-Walking-Tour entlang der historischen Achse.",
    ],
    topActivitySlugs: ["sailing", "sup", "karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "Ribeira / Vila Nova de Gaia", tagline: "Douro-Ufer, Portwein-Kellereien, touristisch aber pflichtig" },
      { name: "Galerias de Paris", tagline: "Bar-Cluster, Outdoor-Drinken, JGA-Hauptachse" },
      { name: "Cedofeita", tagline: "Hipper Stadtteil, kreative Crowd, Indie-Bars" },
    ],
    budget: {
      weekend: "280–500 € pro Person inkl. Flug",
      activity: "25–80 € pro Person",
      party: "30–65 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni", "September–Oktober"],
    insiderTips: [
      "Portwein-Kellereien-Tour: 3 Kellereien an einem Nachmittag — Cálem, Sandeman, Taylor's. Jeweils 15–25 € Eintritt + Verkostung.",
      "Galerias de Paris-Straße: 10+ Bars in 200m, Outdoor-Trinken legal, JGA-tauglich.",
      "Douro-Tal-Tagestour: 1h mit der Bahn (eine der schönsten Strecken Europas), Wein-Verkostung in Pinhão.",
    ],
    faqs: [
      {
        q: "Porto oder Lissabon für JGA?",
        a: "Lissabon ist größer, lebendiger, mit Bairro Alto als Hauptachse. Porto ist authentischer, mit Portwein als Distinktion. Erste Portugal-JGA: Lissabon. Zweite: Porto.",
      },
      {
        q: "Portwein-Kellereien Pflicht?",
        a: "Definitiv. Drei in einem Nachmittag, JGA-Foto am Douro garantiert.",
      },
      {
        q: "Was kostet Porto?",
        a: "280–480 € pro Person für 3 Nächte inkl. Flug. Eine der günstigsten west-europäischen Optionen.",
      },
    ],
    coordinates: { lat: 41.1579, lng: -8.6291 },
    population: 240000,
    monthlySearchVolume: 480,
    wikidataId: "Q36433",
    isAbroad: true,
  },
  {
    slug: "warschau",
    name: "Warschau",
    nameLocative: "in Warschau",
    country: "PL",
    countryName: "Polen",
    region: "Masowien",
    vibe: "Praga, Wodka, Wiederaufbau — Polens unterschätzte Hauptstadt-JGA",
    intro:
      "Warschau ist Krakaus größere, lauter, moderner Schwester: Praga als Bar-Viertel, Wodka-Bar-Tradition, Wiederaufgebaute Altstadt als UNESCO-Pflicht. Günstiger als Krakau, dichteres Nachtleben.",
    paragraphs: [
      "Warschau gewinnt gegen Krakau bei Größe und Klub-Dichte: Praga (rechts der Weichsel) als Indie-Bar-Cluster, Altstadt für Touri-Programm, Nowy Świat als Bar-Hauptachse. Wodka-Bars wie Pijalnia Wódki i Piwa als JGA-Standard.",
      "Tagesprogramm: Warschauer Aufstand Museum (für reflektierende Crews), Łazienki-Park, Karting, Escape Rooms (Warschau erfand das moderne Escape-Room-Format).",
    ],
    topActivitySlugs: ["karting", "escape_room", "shooting_range", "lasertag", "axe_throwing", "vr_arena", "rage_room", "bubble_soccer"],
    neighborhoods: [
      { name: "Praga (rechts der Weichsel)", tagline: "Indie-Bar-Cluster, kreative Crowd, authentisch" },
      { name: "Nowy Świat", tagline: "Bar-Hauptachse, klassische Pubs, JGA-tauglich" },
      { name: "Altstadt (Stare Miasto)", tagline: "Wiederaufgebaute UNESCO-Kulisse, Touri-Pflicht" },
    ],
    budget: {
      weekend: "180–400 € pro Person inkl. Flug",
      activity: "15–70 € pro Person",
      party: "20–50 € pro Person Bar-Tour (Wodka-Shot 1,50 €)",
    },
    bestSeasons: ["Mai–September"],
    insiderTips: [
      "Pijalnia Wódki i Piwa als Wodka-Bar-Kette: 1,50 € Wodka, 1,50 € Bier, lokale Snacks, JGA-Standardstation.",
      "Escape Rooms in Warschau Weltklasse — die Stadt erfand das moderne Format.",
      "Praga (das Bar-Viertel, nicht Prag) als Geheimtipp — 10 min Tram von der Altstadt.",
    ],
    faqs: [
      {
        q: "Warschau oder Krakau?",
        a: "Krakau ist kompakter, kulturell dichter, mit Wieliczka und Auschwitz als Tagesausflüge. Warschau hat dichteres Nachtleben und ist günstiger.",
      },
      {
        q: "Wodka-Bar-Tradition?",
        a: "Polnische Pflichtkultur: 1,50 € pro Shot, mit lokalen Pickles als Begleiter. Pijalnia Wódki i Piwa als Kette mit 10+ Standorten.",
      },
      {
        q: "Was kostet Warschau?",
        a: "180–380 € pro Person für 3 Nächte. Eine der günstigsten europäischen Hauptstädte.",
      },
    ],
    coordinates: { lat: 52.2297, lng: 21.0122 },
    population: 1790000,
    monthlySearchVolume: 320,
    wikidataId: "Q270",
    isAbroad: true,
  },
  {
    slug: "athen",
    name: "Athen",
    nameLocative: "in Athen",
    country: "GR",
    countryName: "Griechenland",
    region: "Attika",
    vibe: "Akropolis, Plaka, Tsipouro — griechische JGA mit antiker Kulisse und mediterranem Nachtleben",
    intro:
      "Athen ist die unterschätzteste mediterrane JGA-Stadt: Akropolis als spektakuläre Kulisse, Psiri und Gazi als lebendige Bar-Viertel, Tsipouro und Ouzo als kulturelle Alkohol-Tradition. Günstiger als Lissabon, ähnlich warm.",
    paragraphs: [
      "Athen funktioniert für JGAs aus zwei Gründen: einmalige antike Kulisse (Akropolis, Plaka als kostenlose Foto-Hintergründe) und ein lebendiges Bar-Viertel in Gazi und Psiri, das bis 4 Uhr morgens läuft. Tsipouro-Bars als kulturelle Pflicht, Cocktail-Bars in Kolonaki für gehobenes Pre-Drinks.",
      "Tagesprogramm: Akropolis am Morgen (vor 10 Uhr), Tagesausflug Sounion-Tempel oder Saronische Inseln (Aegina, Poros), Strandtag in Glyfada oder Vouliagmeni.",
    ],
    topActivitySlugs: ["sup", "sailing", "karting", "escape_room", "axe_throwing", "vr_arena", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Psiri", tagline: "Lebendige Bar-Achse, Live-Musik, JGA-Hauptbasis" },
      { name: "Gazi", tagline: "Klub-Viertel, Industrie-Kulisse, junge Crowd" },
      { name: "Plaka", tagline: "Touri-Viertel unter Akropolis, klassische Tavernen" },
    ],
    budget: {
      weekend: "280–500 € pro Person inkl. Flug",
      activity: "25–80 € pro Person",
      party: "30–70 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–Juni", "September–Oktober (Hochsommer extrem heiß, vermeiden)"],
    insiderTips: [
      "Akropolis vor 10 Uhr besuchen (Hitze, Touri-Massen) — danach Plaka für griechisches Frühstück.",
      "Tsipouro-Bar in Psiri: griechischer Tresterbrand, Pflicht-Kulturpflicht.",
      "Saronische-Inseln-Tagestour mit Fähre: Aegina, Poros, Hydra in 1 Tag, 90 € pro Person.",
    ],
    faqs: [
      {
        q: "Athen für JGA — passt das?",
        a: "Für kulturell-orientierte Crews mit mediterranem Vibe und Antike-Affinität, ja. Für reine Eskalations-JGAs eher Mallorca.",
      },
      {
        q: "Hochsommer-Athen?",
        a: "Vermeiden. Juli/August 40°C+, Stadt halb leer, Locals fliehen. Mai–Juni oder September optimal.",
      },
      {
        q: "Was kostet Athen?",
        a: "280–480 € pro Person für 3 Nächte inkl. Flug. Eine der günstigsten mediterranen Hauptstädte.",
      },
    ],
    coordinates: { lat: 37.9838, lng: 23.7275 },
    population: 660000,
    monthlySearchVolume: 260,
    wikidataId: "Q1524",
    isAbroad: true,
  },
  {
    slug: "kopenhagen",
    name: "Kopenhagen",
    nameLocative: "in Kopenhagen",
    country: "DK",
    countryName: "Dänemark",
    region: "Hovedstaden",
    vibe: "Hygge, Nyhavn, Craft Beer — die dänische Eleganz-JGA mit Designer-Bar-Tradition",
    intro:
      "Kopenhagen ist die JGA-Stadt für skandinavisch-stilbewusste Crews. Nyhavn als Postkarten-Kulisse, Vesterbro als Bar-Viertel, mit dänischer Craft-Beer-Tradition (Mikkeller, To Øl) und Cocktail-Bars auf Weltklasse-Niveau. Teuer wie London, aber kompakter.",
    paragraphs: [
      "Kopenhagen funktioniert für JGAs aus zwei Gründen: hochqualitative Bar-Szene (Craft Beer + Cocktails auf internationalem Top-Niveau) und kompakte Innenstadt mit Fahrrad-Kultur — eine Crew bewegt sich per Mietrad effizienter als mit Taxi. Vesterbro und Nørrebro als JGA-Hauptachsen.",
      "Tagesprogramm: Nyhavn-Foto-Spaziergang, Tivoli (Vergnügungspark als JGA-Spielplatz), Christiania (alternative Stadt-im-Stadt), Tagesausflug Schloss Frederiksborg oder Helsingør.",
    ],
    topActivitySlugs: ["sup", "sailing", "karting", "escape_room", "climbing", "axe_throwing", "vr_arena", "lasertag"],
    neighborhoods: [
      { name: "Vesterbro", tagline: "Hipper Stadtteil, Craft-Beer-Bars, Mikkeller-Heimat" },
      { name: "Nørrebro", tagline: "Multikulti, lebendig, JGA-Bar-Alternative" },
      { name: "Indre By (Centrum)", tagline: "Touri-Hauptachse, Nyhavn, klassische Bars" },
    ],
    budget: {
      weekend: "550–900 € pro Person inkl. Flug (Dänemark ist sehr teuer)",
      activity: "50–150 € pro Person",
      party: "80–150 € pro Person Bar-Tour (Bier 8–10 €)",
    },
    bestSeasons: ["Mai–September (lange Tage, Bar-Garten-Saison)"],
    insiderTips: [
      "Mikkeller-Bar-Tour: dänisches Craft-Beer-Imperium, 5+ Standorte in Kopenhagen, JGA-Pflichtprogramm.",
      "Fahrrad-Mietservice: günstigste Fortbewegung, Crew kann sich überall hin teilen — Kopenhagen ist die Fahrrad-Hauptstadt Europas.",
      "Christiania-Spaziergang: alternative selbstverwaltete Stadt-im-Stadt, kostenlos, kulturell einzigartig.",
    ],
    faqs: [
      {
        q: "Ist Kopenhagen das Geld wert?",
        a: "Für Crews mit Budget über 600 € pro Person und Affinität für Craft Beer / Cocktail-Bars, ja. Für Budget-Crews eher Prag oder Budapest.",
      },
      {
        q: "Bier-Preise wirklich so hoch?",
        a: "Ja. 8–10 € pro Bier in Bars, 4–6 € im Supermarkt. JGA-Budget realistisch kalkulieren.",
      },
      {
        q: "Was kostet ein Kopenhagen-JGA?",
        a: "550–850 € pro Person für 3 Nächte inkl. Flug. Eine der teuersten europäischen Optionen.",
      },
    ],
    coordinates: { lat: 55.6761, lng: 12.5683 },
    population: 660000,
    monthlySearchVolume: 210,
    wikidataId: "Q1748",
    isAbroad: true,
  },
  {
    slug: "stockholm",
    name: "Stockholm",
    nameLocative: "in Stockholm",
    country: "SE",
    countryName: "Schweden",
    region: "Stockholms län",
    vibe: "Schären, Gamla Stan, Klubs — schwedische Premium-JGA mit Insellandschaft",
    intro:
      "Stockholm ist die JGA-Stadt für Crews, die Skandinavien-Design und Premium-Klub-Kultur kombinieren wollen. 14 Inseln, Gamla Stan als Touri-Kulisse, Södermalm als Hipster-Viertel, Stureplan als gehobenes Bar-Quartier. Teuer wie Kopenhagen.",
    paragraphs: [
      "Stockholm funktioniert wegen seiner einzigartigen Geographie: 14 Inseln verbunden mit Brücken und Fähren, Schären-Inseln als Tagesausflug. Södermalm (SoFo-Viertel) als hipster JGA-Hauptbasis, Stureplan für schickeren Bar-Crawl, Östermalm für gehobenes Pre-Drinks.",
      "Tagesprogramm: Schären-Bootstour (Vaxholm oder Sandhamn — beste Schweden-Erfahrung), ABBA-Museum (Touri-Pflicht für 80er-Liebhaber), Vasa-Museum.",
    ],
    topActivitySlugs: ["sailing", "sup", "karting", "escape_room", "climbing", "axe_throwing", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "Södermalm (SoFo)", tagline: "Hipster-Viertel, Indie-Bars, JGA-Hauptbasis" },
      { name: "Stureplan", tagline: "Schickeres Bar-Quartier, Klubs, gehobene Crowd" },
      { name: "Gamla Stan", tagline: "Altstadt-Insel, touristisch aber pittoresk" },
    ],
    budget: {
      weekend: "600–1000 € pro Person inkl. Flug",
      activity: "60–180 € pro Person",
      party: "90–180 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–August (Mittsommer, Schären-Saison)", "Dezember (Schnee-JGA als Special)"],
    insiderTips: [
      "Schären-Bootstour Vaxholm: 1h Fähre nordöstlich, Inselhüpfen, JGA-Foto auf Felsen am Meer.",
      "Stureplan-Klubs (Sturecompagniet, Hell's Kitchen) sind teuer aber JGA-Touri-Pflicht.",
      "Mittsommer (Juni): Sonne geht praktisch nicht unter, lange Bar-Abende möglich.",
    ],
    faqs: [
      {
        q: "Stockholm oder Kopenhagen?",
        a: "Stockholm hat die Schären als unique Bonus. Kopenhagen ist kompakter, mit besseren Craft-Beer-Bars. Beide ähnlich teuer.",
      },
      {
        q: "Schären-Tagestour — wert?",
        a: "Pflichtprogramm. Beste JGA-Story aus Schweden. Fähren ab Strandvägen, ab 30 € pro Person für Tagestickets.",
      },
      {
        q: "Was kostet Stockholm?",
        a: "600–900 € pro Person für 3 Nächte inkl. Flug. Eine der teuersten Optionen in Europa.",
      },
    ],
    coordinates: { lat: 59.3293, lng: 18.0686 },
    population: 980000,
    monthlySearchVolume: 170,
    wikidataId: "Q1754",
    isAbroad: true,
  },
  {
    slug: "tallinn",
    name: "Tallinn",
    nameLocative: "in Tallinn",
    country: "EE",
    countryName: "Estland",
    region: "Harju maakond",
    vibe: "Mittelalter, Telliskivi, Sauna — der baltische Geheimtipp mit JGA-Preisen wie Prag",
    intro:
      "Tallinn ist der baltische Geheimtipp: UNESCO-Mittelalter-Altstadt, Telliskivi-Hipster-Viertel, traditionelle estnische Sauna-Kultur und Preise auf Krakau-Niveau. Direktflüge ab DE-Hauptstädten in 2h.",
    paragraphs: [
      "Tallinn vereint zwei Welten: eine der besterhaltenen mittelalterlichen Altstädte Europas und Telliskivi — ein ehemaliges Industriegelände, das zu einem der lebendigsten Hipster-Quartiere Nordeuropas geworden ist. Bar-Dichte hoch, Preise niedrig, Crowd lokal-authentisch.",
      "Tagesprogramm: Altstadt-Spaziergang (1–2h reichen), Sauna-Erlebnis (estnische Tradition, ab 25 € pro Person), Tagesausflug nach Helsinki (2h Fähre).",
    ],
    topActivitySlugs: ["karting", "escape_room", "shooting_range", "axe_throwing", "vr_arena", "rage_room", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Telliskivi", tagline: "Hipster-Industriegelände, Indie-Bars, JGA-Hauptbasis" },
      { name: "Altstadt (Vanalinn)", tagline: "UNESCO-Mittelalter, klassische Bars, Touri-Pflicht" },
      { name: "Kalamaja", tagline: "Holzhaus-Viertel, alternative Crowd" },
    ],
    budget: {
      weekend: "230–420 € pro Person inkl. Flug",
      activity: "20–80 € pro Person",
      party: "25–55 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–September", "Dezember (Weihnachtsmarkt — bekanntester in Nordosteuropa)"],
    insiderTips: [
      "Estnisches Sauna-Erlebnis: traditionell rauchig (Suitsusaun), als JGA-Programm einmalig in Europa.",
      "Telliskivi: alte Eisenbahnwerkstatt, jetzt 30+ Bars und Restaurants in ehemaligen Fabrikhallen.",
      "Helsinki-Tagestour: 2h Fähre, gleicher Tag hin und zurück, doppelter Hauptstadt-Bonus.",
    ],
    faqs: [
      {
        q: "Tallinn für JGA — wirklich?",
        a: "Ja, einer der unterschätztesten Geheimtipps Europas. Preise wie Krakau, Bar-Qualität wie Kopenhagen, einzigartige Sauna-Tradition.",
      },
      {
        q: "Reicht Englisch?",
        a: "Problemlos. Esten haben hohe Englisch-Kenntnisse, Tallinn ist international ausgerichtet.",
      },
      {
        q: "Was kostet Tallinn?",
        a: "230–400 € pro Person für 3 Nächte inkl. Flug. Eine der günstigsten Hauptstädte Europas.",
      },
    ],
    coordinates: { lat: 59.437, lng: 24.7536 },
    population: 440000,
    monthlySearchVolume: 90,
    wikidataId: "Q1770",
    isAbroad: true,
  },
  {
    slug: "bukarest",
    name: "Bukarest",
    nameLocative: "in Bukarest",
    country: "RO",
    countryName: "Rumänien",
    region: "București",
    vibe: "Klein-Paris, Old Town, Schießstand — Osteuropas wachsende JGA-Stadt mit Wild-West-Bar-Szene",
    intro:
      "Bukarest ist die wachsende JGA-Destination: Old Town (Lipscani) als Bar-Achse, Schießstand- und Aktivitäten-Infrastruktur die mit Prag konkurriert, Preise sogar günstiger. Für Crews, die echte Off-The-Beaten-Path-Energie wollen.",
    paragraphs: [
      "Bukarest vereint Wild-West-Bar-Szene mit erstaunlich entwickelter Aktivitäten-Infrastruktur: Schießstand-Erlebnisse (deutlich entspannter als in DE), Karting, Escape Rooms. Lipscani (Altstadt) als JGA-Hauptachse, mit Bars wie Old City Bar, Shoteria, Bordello's.",
      "Tagesprogramm: Volkspalast (zweitgrößtes Gebäude der Welt, Touri-Pflicht), Therme București (Mega-Thermenkomplex 30 min außerhalb), Tagesausflug Sinaia (Schloss Peles in den Karpaten, 2h Bahn).",
    ],
    topActivitySlugs: ["shooting_range", "karting", "escape_room", "axe_throwing", "vr_arena", "rage_room", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Lipscani (Old Town)", tagline: "Bar-Achse, Touri-Klassiker, JGA-Hauptbasis" },
      { name: "Calea Victoriei", tagline: "Schickere Bars, gehobenere Restaurants" },
      { name: "Floreasca", tagline: "Lokale Bar-Szene, weniger Touri" },
    ],
    budget: {
      weekend: "180–380 € pro Person inkl. Flug",
      activity: "15–70 € pro Person",
      party: "20–50 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–September"],
    insiderTips: [
      "Therme București: Mega-Wellnesskomplex mit 16 Pools, JGA-tauglich, 35 € pro Person für Tageskarte.",
      "Schießstand-Erlebnis mit AK-47, Glock, M4: ab 70 € pro Person für 4 Waffen — Prag-Niveau.",
      "Sinaia-Tagestour: Schloss Peles, Karpaten-Kulisse, 2h Bahn, perfekte Brunch-Alternative.",
    ],
    faqs: [
      {
        q: "Bukarest sicher für JGA?",
        a: "Im Old Town und touristischen Vierteln problemlos. Standardvorsichtsmaßnahmen wie in jeder Großstadt.",
      },
      {
        q: "Bukarest oder Sofia?",
        a: "Bukarest hat mehr JGA-Infrastruktur und Old-Town-Dichte. Sofia ist günstiger und kulturell distinktiver.",
      },
      {
        q: "Was kostet Bukarest?",
        a: "180–350 € pro Person für 3 Nächte inkl. Flug. Eine der günstigsten europäischen Hauptstädte.",
      },
    ],
    coordinates: { lat: 44.4268, lng: 26.1025 },
    population: 1830000,
    monthlySearchVolume: 70,
    wikidataId: "Q19660",
    isAbroad: true,
  },
  {
    slug: "bruessel",
    name: "Brüssel",
    nameLocative: "in Brüssel",
    country: "BE",
    countryName: "Belgien",
    region: "Brussels-Capital",
    vibe: "Bier, Pommes, Atomium — die belgische Bier-JGA-Hauptstadt mit europäischem Mainstream-Vibe",
    intro:
      "Brüssel ist die JGA-Hauptstadt für Bier-Crews: Delirium Café (über 2000 Biersorten, Guinness-Buch-Rekord), Klosterbier-Tradition, kompakte Innenstadt mit Bar-Cluster rund um die Grand Place. Etwas wenig Aktivitäten-Dichte, aber Bier-Kultur einzigartig.",
    paragraphs: [
      "Brüssel funktioniert für Bier-orientierte JGAs: Delirium Café als ikonisches Ziel, Klosterbier-Spezialbars wie Moeder Lambic, A la Mort Subite. Grand Place als Touri-Kulisse, Saint-Géry-Viertel als Bar-Hauptachse.",
      "Tagesausflüge: Brügge (1h mit Bahn — eine der schönsten Städte Europas), Antwerpen (45 min, Diamantenviertel + Bars), Brauerei-Touren in der Umgebung.",
    ],
    topActivitySlugs: ["karting", "escape_room", "lasertag", "axe_throwing", "vr_arena", "bubble_soccer", "shooting_range", "rage_room"],
    neighborhoods: [
      { name: "Saint-Géry / Sainte-Catherine", tagline: "Bar-Hauptachse, Cocktails, Bier-Spezialbars" },
      { name: "Grand Place", tagline: "Touri-Kulisse, Delirium Café, klassische Restaurants" },
      { name: "Ixelles", tagline: "Hipster-Viertel, kreative Bars, weniger Touri" },
    ],
    budget: {
      weekend: "320–560 € pro Person inkl. Bahn/Flug",
      activity: "30–90 € pro Person",
      party: "45–90 € pro Person Bar-Tour",
    },
    bestSeasons: ["April–September"],
    insiderTips: [
      "Delirium Café: über 2000 Bier-Sorten, Guinness-Buch-Rekord, Pflicht-Foto-Stop.",
      "Brügge-Tagestour: 1h Zug nach Brügge, eine der schönsten Städte Europas, perfekte Sonntag-Brunch-Alternative.",
      "Pommes-Tour: belgische Pommes-Buden (Maison Antoine, Frit Flagey) als kulturelle Pflicht zwischen Bars.",
    ],
    faqs: [
      {
        q: "Brüssel oder Amsterdam für Bier-JGA?",
        a: "Brüssel für Klosterbier und Spezialbiere (Delirium Café konkurrenzlos). Amsterdam für allgemeines Bier + Coffeeshop-Mix.",
      },
      {
        q: "Wie kommt man nach Brüssel?",
        a: "Thalys ab Köln/Aachen in 2h. Flug ab DE 50–150 €. Eurostar aus London.",
      },
      {
        q: "Was kostet Brüssel?",
        a: "320–550 € pro Person für 3 Nächte. Mittlere europäische Preisklasse.",
      },
    ],
    coordinates: { lat: 50.8503, lng: 4.3517 },
    population: 1200000,
    monthlySearchVolume: 110,
    wikidataId: "Q239",
    isAbroad: true,
  },
  {
    slug: "nizza",
    name: "Nizza",
    nameLocative: "in Nizza",
    country: "FR",
    countryName: "Frankreich",
    region: "Provence-Alpes-Côte d'Azur",
    vibe: "Promenade des Anglais, Provence, Monaco-Trip — JGA mit Riviera-Glamour",
    intro:
      "Nizza ist die JGA-Stadt für mediterranen Glamour: Promenade des Anglais, Vieux Nice mit lebendigen Bars, Côte d'Azur-Wetter, Monaco und Cannes als Tagesausflüge. Teurer als Barcelona, aber konkurrenzlos für Premium-Strand-Crews.",
    paragraphs: [
      "Nizza funktioniert für JGAs aus zwei Gründen: die Lage an der Côte d'Azur mit Strand mitten in der Stadt, und die Tagesausflugs-Optionen (Monaco 25 min, Cannes 30 min, Antibes 20 min). Vieux Nice als Bar-Cluster mit hunderten Bars in der mittelalterlichen Altstadt.",
      "Tagesprogramm: Strand auf der Promenade des Anglais, Tagesausflug Monaco (Casino, Yacht-Hafen — JGA-Foto-Spots), Tagesausflug Cannes (Croisette, Promenade), Bootscharter ab Hafen.",
    ],
    topActivitySlugs: ["sup", "sailing", "jetski", "beach_volleyball", "karting", "escape_room", "wakeboarding", "vr_arena"],
    neighborhoods: [
      { name: "Vieux Nice", tagline: "Mittelalterliche Altstadt, Bar-Cluster, JGA-Hauptbasis" },
      { name: "Promenade des Anglais", tagline: "Strand-Front, Touri-Achse, Strandbars" },
      { name: "Hafenviertel", tagline: "Yachten, gehobene Bars, schicker" },
    ],
    budget: {
      weekend: "450–800 € pro Person inkl. Flug (Côte d'Azur ist Premium)",
      activity: "50–150 € pro Person",
      party: "70–130 € pro Person Bar-Tour",
    },
    bestSeasons: ["Mai–Juni", "September (Locals zurück, lebendig)"],
    insiderTips: [
      "Monaco-Tagestour: 25 min mit Bahn, Casino-Pflicht-Foto, Hafenrundgang, gleiches Tag-Programm.",
      "Bootscharter ab Hafen Nizza: 8–10 Personen, halber Tag, ab 400 € — beste JGA-Foto-Möglichkeit der Côte d'Azur.",
      "Cours Saleya-Markt am Morgen, Vieux Nice am Abend — perfekter JGA-Tagesablauf.",
    ],
    faqs: [
      {
        q: "Nizza oder Barcelona für Strand-JGA?",
        a: "Barcelona ist günstiger und lebendiger. Nizza hat Riviera-Glamour, Monaco und Cannes als Bonus. Premium-Crews wählen Nizza.",
      },
      {
        q: "Monaco-Tagestour — wert?",
        a: "Definitiv. 25 min Bahn, Casino-Foto, Yacht-Hafen — bestes JGA-Foto-Material der Côte d'Azur.",
      },
      {
        q: "Was kostet Nizza?",
        a: "450–750 € pro Person für 3 Nächte inkl. Flug. Eine der teureren Strand-Optionen in Europa.",
      },
    ],
    coordinates: { lat: 43.7102, lng: 7.262 },
    population: 340000,
    monthlySearchVolume: 110,
    wikidataId: "Q33959",
    isAbroad: true,
  },
];

export function getCityBySlug(slug: string): JgaCity | undefined {
  return JGA_CITIES.find((c) => c.slug === slug.toLowerCase());
}

export function getCitySlugs(): string[] {
  return JGA_CITIES.map((c) => c.slug);
}
