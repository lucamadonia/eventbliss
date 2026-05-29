/**
 * Stag Do city data for /stag-do/[city] — English-language SEO/GEO pages
 * targeting UK, Ireland, US, AU and English-speaking expat audiences in DACH.
 *
 * Each English city has a counterpart in JGA_CITIES (same slug → hreflang).
 * Content is independently written for the English-speaking market with
 * stag-do / hen-do terminology and UK pricing conventions where relevant.
 */

import type { JgaCity } from "./jga-cities";
import { JGA_CITIES } from "./jga-cities";

export interface StagDoCity {
  slug: string;
  name: string;
  countryName: string;
  region: string;
  vibe: string;
  intro: string;
  paragraphs: string[];
  topActivitySlugs: string[];
  neighborhoods: { name: string; tagline: string }[];
  budget: {
    weekend: string;
    activity: string;
    party: string;
  };
  bestSeasons: string[];
  insiderTips: string[];
  faqs: { q: string; a: string }[];
  /** Cross-references the JGA_CITIES entry for shared metadata (coords, wikidataId). */
  jgaCity: JgaCity;
}

function jga(slug: string): JgaCity {
  const c = JGA_CITIES.find((x) => x.slug === slug);
  if (!c) throw new Error(`JGA city '${slug}' not found — required for stag-do cross-ref`);
  return c;
}

export const STAG_DO_CITIES: StagDoCity[] = [
  {
    slug: "london",
    name: "London",
    countryName: "United Kingdom",
    region: "England",
    vibe: "Pubs, the Thames, world-class cocktail bars — stag do royalty",
    intro:
      "London is the cocktail-bar capital of Europe and a top stag do destination for crews willing to trade budget for variety. Brexit made it pricier, but the bar density, world-class venues, and stag-do infrastructure remain unmatched in continental Europe.",
    paragraphs: [
      "London's edge as a stag do city is variety — you can drink from a no-frills Backstreet pub, slide into Lyaness for a £18 cocktail, then close at a 35th-floor Sky Garden in one night. The Tube makes a 12-person crew genuinely mobile, and stag-do operators here pioneered the format decades ago.",
      "Daytime works on three legs: classic tourism (Tower, Eye, Borough Market), activities (TeamSport karting, Yonder bouldering, Boom Battle Bar for axe-throwing), and Thames experiences (private boat charters from £400 for 12 guests, 2 hours). Camden Market for a Saturday hangover.",
      "Evenings split between Soho (touristy but alive), Shoreditch (hipster cocktail mecca), Camden (rough crowd, live music) and Covent Garden (theatre + drinks). Cocktail bars like Connaught Bar, Tayer + Elementary, and Lyaness consistently land in global Top-10 lists.",
    ],
    topActivitySlugs: ["karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena", "shooting_range", "indoor_skydiving"],
    neighborhoods: [
      { name: "Soho", tagline: "Touristy bar cluster, classic stag-do main artery" },
      { name: "Shoreditch", tagline: "Cocktail bars at world-class level, hipster crowd" },
      { name: "Camden", tagline: "Rough-edged crowd, live music venues, market by day" },
      { name: "Covent Garden", tagline: "Theatre district plus compact bars and restaurants" },
    ],
    budget: {
      weekend: "£480–£900 per person including flights",
      activity: "£35–£130 per person",
      party: "£70–£140 per person per night (pint £6–£8, cocktail £12–£18)",
    },
    bestSeasons: ["May–July (warm, rooftop bar season)", "December (Christmas markets, festive)"],
    insiderTips: [
      "Sky Garden is free with online reservation — best London skyline view, mandatory stag-do photo op.",
      "Use contactless on the Tube — capped at £8.10/day for Zones 1–2. Don't buy paper tickets.",
      "Pub etiquette: order at the bar, no table service in 95% of pubs. Tipping not expected.",
      "Flights from continental Europe £30–£150 round-trip; Eurostar from Paris/Brussels for hangover-friendly arrival.",
    ],
    faqs: [
      {
        q: "Is London worth the cost for a stag do?",
        a: "For groups with a £600+ per-person budget and an appetite for top-tier cocktail bars, yes — London bar quality has no European peer. Budget-focused crews get more from Prague or Krakow.",
      },
      {
        q: "How do we get a group of lads into top London clubs?",
        a: "Reservations with bottle service bypass door selection entirely. All-male groups face strict door policies at top venues like Fabric or Printworks — splitting into smaller groups of 3–4 also works.",
      },
      {
        q: "What does a stag do weekend in London actually cost?",
        a: "£480–£800 per head for a three-night trip including flights, mid-range hotel, one activity and two nights out. Hotels are the biggest variable — AirBnB in Shoreditch or Camden often beats hotel pricing for 8+ groups.",
      },
      {
        q: "How early to book a London stag do?",
        a: "8–12 weeks for May–September dates, longer for December (Christmas markets + corporate parties compete for venues). Karting and axe-throwing slots fill earliest on Saturday afternoons.",
      },
    ],
    jgaCity: jga("london"),
  },
  {
    slug: "dublin",
    name: "Dublin",
    countryName: "Ireland",
    region: "Leinster",
    vibe: "Guinness, Temple Bar, the spiritual home of the stag do",
    intro:
      "Dublin is where the stag do was perfected. Temple Bar as the central artery, Guinness Storehouse as mandatory pilgrimage, and a pub culture that treats stag groups as standard inventory rather than nuisance. For English-speaking groups, the most welcoming European destination.",
    paragraphs: [
      "Dublin is the only European city where every pub crew is immediately recognised as a stag party and seamlessly absorbed into the room. That's cultural infrastructure other cities can't fake. Temple Bar (touristy but alive), Camden Street (local-authentic) and Smithfield (hipster) form the three stag-do main axes.",
      "Daytime: Guinness Storehouse (Storehouse tour + Gravity Bar pint, €30 per head, mandatory), Jameson Distillery, day trips to Howth or Dalkey, or karting and bowling for active stags. Trinity College Library for the rare cultural moment.",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "bubble_soccer", "shooting_range", "rage_room"],
    neighborhoods: [
      { name: "Temple Bar", tagline: "Tourist pub artery, compulsory stag-do photo stop" },
      { name: "Camden Street", tagline: "More authentic, local Irish pubs, where Dubliners drink" },
      { name: "Smithfield", tagline: "Hipster district, creative bars, distillery proximity" },
    ],
    budget: {
      weekend: "€480–€820 per person including flights",
      activity: "€40–€120 per person",
      party: "€60–€120 per person per night (pint €7–€9)",
    },
    bestSeasons: ["May–September (pub garden weather)", "March (St. Patrick's Day — book 6 months ahead)"],
    insiderTips: [
      "St. Patrick's Day (March 17) is the legendary stag-do date — but accommodation triples, plan 6+ months ahead.",
      "Guinness Storehouse rooftop pint is the standard stag-do photo. Book ahead or wait 60+ minutes.",
      "Round-buying is tradition. If a mate skips a round, they sit out the next one quietly.",
      "Flights from UK £30–£80 round-trip, from continental Europe €60–€150 round-trip. Bus from airport €7.",
    ],
    faqs: [
      {
        q: "Is Dublin still the best stag do city in Europe?",
        a: "For English-speaking, pub-focused groups: yes. The pub culture is uniquely accommodating to stag parties, and the Guinness ritual is irreplaceable. For bar variety or cheap booze, Prague wins.",
      },
      {
        q: "St. Patrick's Day stag do — yay or nay?",
        a: "Spectacular but logistically hard. Hotels triple in price, queues are everywhere, group separation is real risk. If you go: book 6+ months ahead, have meet-up plans, brace for chaos.",
      },
      {
        q: "What's the typical Dublin stag do budget?",
        a: "€480–€800 per person for three nights including flight. Pints at €7–€9, hotels from €130 per night — one of Europe's more expensive stag destinations.",
      },
      {
        q: "Best Temple Bar alternative?",
        a: "Camden Street for honest Dublin pubs (The Bernard Shaw, Hogan's, Camden Quarter). Smithfield for craft beer and distillery proximity. Temple Bar still mandatory for at least one drink.",
      },
    ],
    jgaCity: jga("dublin"),
  },
  {
    slug: "edinburgh",
    name: "Edinburgh",
    countryName: "United Kingdom",
    region: "Scotland",
    vibe: "Castle, whisky, the Royal Mile — the Scottish stag-do alternative to Dublin",
    intro:
      "Edinburgh is Dublin's Scottish counterpart: medieval old town with the castle as backdrop, whisky tradition instead of Guinness, and a compact stag-do infrastructure in Cowgate and Grassmarket. For crews with whisky affinity, the best UK destination.",
    paragraphs: [
      "Edinburgh works as a stag do city for three reasons: a compact medieval old town where everything is walkable, whisky culture as the distinctive feature, and the Edinburgh Festival in August as a once-a-year mega event backdrop. Cowgate and Grassmarket form the main stag-do bar axes.",
      "Daytime: Scotch Whisky Experience on the Royal Mile (£25 per head, classic intro), Highland day tour (Stirling Castle, Loch Lomond — £60–£80 per head), Arthur's Seat hike for free panoramic photos.",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "bubble_soccer", "shooting_range", "climbing"],
    neighborhoods: [
      { name: "Cowgate / Grassmarket", tagline: "Stag-do pub axis, bar cluster in medieval alleys" },
      { name: "Royal Mile", tagline: "Tourist artery, castle, classic pubs" },
      { name: "Leith", tagline: "Harbour district, hipper bars, Trainspotting filming location" },
    ],
    budget: {
      weekend: "£440–£780 per person including flights",
      activity: "£40–£150 per person",
      party: "£55–£110 per person per night",
    },
    bestSeasons: ["May–September", "August (Edinburgh Fringe Festival — book 9 months ahead)"],
    insiderTips: [
      "Whisky tasting at Holyrood Distillery or the Scotch Malt Whisky Society — £30–£50 per person for a serious tasting.",
      "Arthur's Seat is a free stag-do hike with panoramic photos — 1 hour up, mandatory.",
      "Edinburgh Fringe Festival (August) is the world's largest cultural festival — incredible stag-do backdrop, but 9+ months lead time.",
    ],
    faqs: [
      {
        q: "Edinburgh or Dublin for a UK stag do?",
        a: "Dublin for Guinness pub culture and stag-do tradition. Edinburgh for whisky, castle backdrop, and Highland day trips. Both pricey, both unique. Edinburgh edges out for serious whisky drinkers.",
      },
      {
        q: "Is a Highland day trip worth it?",
        a: "Yes — mandatory for an Edinburgh stag do. Operators like Rabbie's or Heart of Scotland run 12-hour tours covering Stirling and Loch Lomond from £60–£80 per head.",
      },
      {
        q: "Edinburgh stag do typical cost?",
        a: "£440–£750 per person for three nights including flight. Similar pricing to Dublin, often slightly cheaper outside festival season.",
      },
    ],
    jgaCity: jga("edinburgh"),
  },
  {
    slug: "amsterdam",
    name: "Amsterdam",
    countryName: "Netherlands",
    region: "Noord-Holland",
    vibe: "Canals, coffeeshops, the red light district — the international stag-do classic",
    intro:
      "Amsterdam is the international stag-do classic: one-hour flight from most UK and German cities, everything bookable in English, with canal tours and coffeeshop culture as instant landmarks. Pricier now than its reputation suggests, but no other city carries this vibe.",
    paragraphs: [
      "Amsterdam earns its stag-do status from three things: liberal drug laws (cannabis in coffeeshops, magic truffles as legal alternatives), the red light district as cultural-anthropological stop, and a compact centre with hundreds of bars in a 2 km radius.",
      "Daytime is water-led: private canal cruises (£180–£250 for 12 guests, 2 hours, BYO drinks), pedal-boat tours, SUP on the canals, or bike tours through the city (mandatory). Heineken Brewery and Anne Frank House cover the cultural side, tonally adjusted by crew.",
    ],
    topActivitySlugs: ["sup", "sailing", "escape_room", "karting", "lasertag", "axe_throwing", "vr_arena", "shooting_range"],
    neighborhoods: [
      { name: "Centrum / Red Light District", tagline: "Mandatory tourist stop, bars, coffeeshops" },
      { name: "Jordaan", tagline: "Charming bars and cafés, more honest crowd" },
      { name: "De Pijp", tagline: "Hipster district south of Centrum, Brouwerij 't IJ, Albert Cuyp Market" },
      { name: "Leidseplein", tagline: "Bar cluster, disco focus, younger crowd" },
    ],
    budget: {
      weekend: "£380–£680 per person including flights",
      activity: "£35–£130 per person",
      party: "£60–£120 per person per night (beer £6–£8)",
    },
    bestSeasons: ["April–June (tulip season, warm)", "King's Day (April 27 — special booking)"],
    insiderTips: [
      "Private canal cruise with skipper and BYO drinks: £180–£250 for 12 guests over 2 hours — cheaper and better than any commercial tour.",
      "Coffeeshop standards: Greenhouse, Bulldog, Grey Area in Centrum, all stag-friendly.",
      "Red Light District walk-through is free and always packed — no photos (security enforces).",
      "Beer prices: £6–£8 in tourist bars, £4–£5 in Jordaan or De Pijp. A 30-minute walk saves £80 per crew per evening.",
    ],
    faqs: [
      {
        q: "Is Amsterdam still good for a stag do?",
        a: "Yes if the experience (canals, coffeeshops, international vibe) ranks above pure cost optimisation. For pure budget play, Prague or Krakow beat it.",
      },
      {
        q: "Cannabis laws — what's actually allowed?",
        a: "Legal to buy and consume in coffeeshops, up to 5g per person. Public street consumption officially banned, in practice tolerated. Magic truffles legal. All other drugs illegal. Stick to coffeeshops.",
      },
      {
        q: "Where should we stay?",
        a: "Centrum for compact bar access; Jordaan or De Pijp for quieter sleep after late nights. AirBnB in Jordaan is usually optimal for 8–10-person crews.",
      },
    ],
    jgaCity: jga("amsterdam"),
  },
  {
    slug: "prague",
    name: "Prague",
    countryName: "Czech Republic",
    region: "Hlavní město Praha",
    vibe: "Golden City, cheap pints, dense bar scene — Europe's most-booked stag do destination",
    intro:
      "Prague isn't accidentally Europe's stag-do capital: 90-minute flights from most UK and German cities, half the prices of Western European destinations, one of Europe's most beautiful old towns, and a bar density unmatched in the East. Mandatory stop for any abroad stag do that wants more than beach.",
    paragraphs: [
      "Prague delivers the unbeaten price-experience ratio: half a litre of Pilsner Urquell at £2–£3, a cocktail in a top bar at £4–£6, hotel rooms from £35 per head in the old town. A three-day stag do costs £200 per head including flights — impossible elsewhere.",
      "Daytime: Beer Spa (bathe in warm beer, drink unlimited pilsner — real and legendary), karting in industrial halls, lasertag, the famous shooting range scene (AK-47, Glock, M16 legal experiences), pedalo on the Vltava, brewery tours, U-Boat experience at Stalag.",
      "Evenings split three ways: tourist classic Charles Bridge + Old Town Square (overpriced but mandatory), authentic Pilsner pubs in Vinohrady or Žižkov, or Karlovy Lazne (five-storey club in the centre) for mass stag-party mode.",
    ],
    topActivitySlugs: ["shooting_range", "karting", "lasertag", "escape_room", "axe_throwing", "vr_arena", "bubble_soccer", "rage_room"],
    neighborhoods: [
      { name: "Old Town / Staré Město", tagline: "Charles Bridge, Astronomical Clock, mandatory bar crawl" },
      { name: "Nové Město", tagline: "Wenceslas Square, clubs, Karlovy Lazne mega-club" },
      { name: "Vinohrady", tagline: "Hipster district, creative cocktail bars, less tourist pressure" },
      { name: "Žižkov", tagline: "Student-led, cheapest bars, local authenticity" },
    ],
    budget: {
      weekend: "£190–£400 per person including flights",
      activity: "£15–£70 per person",
      party: "£25–£60 per person per night",
    },
    bestSeasons: ["April–June (warm, less crowded)", "September–October (golden autumn)", "December (Christmas markets)"],
    insiderTips: [
      "Beer Spa is the signature Prague stag-do highlight: £45–£70 per person for 60 minutes in a warm beer bath with unlimited Pilsner. Book Bernard Beer Spa specifically.",
      "Skip Wenceslas Square tourist bars — same prices as home. Vinohrady or Žižkov: U Sadu, Vzorkovna, Bukowski's are the real spots.",
      "Shooting range with AK-47, Glock, M16 etc is legal and safe — Prague Shooting offers group packages from £70 per head for 4 weapons.",
      "Travel: flights from UK £40–£100 round-trip. Bus from continental Europe an underrated option for crews who want to pre-game en route.",
    ],
    faqs: [
      {
        q: "Why is Prague the top stag do destination in Europe?",
        a: "Price-experience ratio. €2–€3 beers, €50 hotel nights, compact old town, dense bar scene, 90-minute flights from most of Western Europe. No comparable destination offers this much for the price.",
      },
      {
        q: "Three-day Prague stag do budget?",
        a: "£190–£350 per person all-in including flights, hotel, two activities and bars. With train arrival and an AirBnB for the crew, drops to £150 per head — beats every Western European option.",
      },
      {
        q: "Beer Spa — cliché or actual highlight?",
        a: "Genuine highlight. 60 minutes in a warm beer bath with Pilsner Urquell on tap. Cliché yes, stag-do story material guaranteed. From £55 per head, 90 minutes total.",
      },
      {
        q: "Is English enough in Prague?",
        a: "Yes — universally in stag-do relevant venues. Even Czech menus usually have an English version. Locals in tourist zones often speak some German too.",
      },
    ],
    jgaCity: jga("prag"),
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    countryName: "Spain",
    region: "Catalonia",
    vibe: "Beach, tapas, Gaudí, late-night clubs — Mediterranean stag-do with culture bonus",
    intro:
      "Barcelona combines what Amsterdam and the Spanish islands separate: Mediterranean beach in the city, world-class architecture (Sagrada Família, Park Güell), tapas culture, and clubs on the beach strip. For stag dos that want culture and escalation without choosing one.",
    paragraphs: [
      "Barcelona's stag-do appeal is compression. Sagrada Família in the morning, tapas at Mercat de Sant Antoni for lunch, Barceloneta beach in the afternoon, bar crawl in the Gothic Quarter at night, Opium or Pacha on the beach at 2 AM. No other European destination compresses such varied vibes into 5 square kilometres.",
      "Daytime mixes beach and architecture: Barceloneta sand, SUP, jetski, beach volleyball; tapas tour through Born or El Raval; Gaudí walking tour as the cultural counterweight. Boat charters from Port Vell for 6–8 people start at €300 for 4 hours including snorkelling and onboard bar.",
      "Evenings: Barri Gòtic is the bar-crawl axis, Gràcia and El Born the hipper alternatives, beach promenade (Port Olímpic) for club escalation. Spanish crews don't go out until after midnight — bars get busy 23:00, clubs 01:00, last till 06:00.",
    ],
    topActivitySlugs: ["sup", "sailing", "jetski", "beach_volleyball", "wakeboarding", "karting", "escape_room", "lasertag"],
    neighborhoods: [
      { name: "Barri Gòtic / El Born", tagline: "Old town, medieval alleys, mandatory bar crawl" },
      { name: "Barceloneta", tagline: "City beach, beach bars, all-day beach programme" },
      { name: "Gràcia", tagline: "Hipster district, plazas with local bars" },
      { name: "El Raval", tagline: "Multicultural, cheaper bars, rough-charm district" },
    ],
    budget: {
      weekend: "€320–€580 per person including flights",
      activity: "€35–€120 per person",
      party: "€50–€100 per person per night",
    },
    bestSeasons: ["May–June (warm, pre-peak)", "September (beach still warm, locals back)"],
    insiderTips: [
      "Tapas tour through El Born or Sant Antoni with a local guide: €50–€70 per person, 4–5 stops with wine — best dinner alternative.",
      "Pre-book Sagrada Família tickets online — skip the 2-hour queue.",
      "Beach bars (chiringuitos) open from 11 AM in summer — perfect bridge from brunch to beach day.",
      "Flights from UK £40–£120 round-trip, from Germany €60–€150. Metro from airport to centre in 30 minutes.",
    ],
    faqs: [
      {
        q: "Barcelona or the Spanish islands for a stag do?",
        a: "Islands (Ibiza, Mallorca) for escalation-focused crews wanting beach and clubs. Barcelona for crews wanting culture + tapas + clubs in one city. Similar cost; Barcelona is culturally richer, islands are group-logistics-optimised.",
      },
      {
        q: "What does a Barcelona stag do cost?",
        a: "€320–€580 per person for three nights including flights and a mid-range hotel. AirBnB for 8–10 people drops it to €270–€420 per head.",
      },
      {
        q: "When does Spanish nightlife actually start?",
        a: "Tapas bars 19:00–23:00, regular bars 22:00–02:00, clubs 00:00–06:00. Arriving at a club at 21:00 means drinking alone. Adjust your tempo.",
      },
      {
        q: "Is the city beach actually usable?",
        a: "Yes — Barceloneta is 10 minutes from the centre by metro. Crowded in summer but lively and stag-do friendly. Quieter beaches: 30 minutes to Castelldefels or Sitges.",
      },
    ],
    jgaCity: jga("barcelona"),
  },

  // ──────────────────────────────────────────────────────────────────
  // DACH cities (14) — for English-speaking expats in DACH + UK groups
  // visiting Germany / Austria / Switzerland
  // ──────────────────────────────────────────────────────────────────

  {
    slug: "berlin",
    name: "Berlin",
    countryName: "Germany",
    region: "Berlin",
    vibe: "No curfew, every subculture, Späti pints and Berghain queues",
    intro:
      "Berlin is the capital of unrestrained stag dos. No closing times, every subculture within reach, and enough venues to never repeat a night across three trips. Whether techno marathon, Spree boat cruise with crew, or karaoke in Mitte — Berlin delivers the friction that separates a stag from an ordinary weekend.",
    paragraphs: [
      "Berlin's edge as a stag do city is variety without homogeneity. Friedrichshain for raw club energy, Mitte for slicker bars, Neukölln for pop-up underground, Kreuzberg for everything in between. The U-Bahn runs through the night, so a 12-person crew genuinely moves without burning €100 in taxis per evening.",
      "Daytime works as an XL playground: Spree boat charters with private bar, Trabi tours through the East, shooting range, karting in the Tempelhof hangar, escape rooms, or SUP on Rummelsburger Bucht. Cheap Spätis (corner shops) double as makeshift bars between venues. For door selection at Berghain, smaller groups (3–4) have better odds — large stag crews are routinely turned away.",
    ],
    topActivitySlugs: ["karting", "escape_room", "lasertag", "sup", "shooting_range", "axe_throwing", "vr_arena", "rage_room"],
    neighborhoods: [
      { name: "Friedrichshain", tagline: "Raw club vibe, RAW-Gelände, Berghain nearby" },
      { name: "Mitte", tagline: "Slicker bars, rooftops, Hackescher Markt after-work crowd" },
      { name: "Kreuzberg", tagline: "Späti-hopping in Bergmannkiez and along Maybachufer" },
      { name: "Neukölln", tagline: "Pop-up underground, cheapest bars, gritty cool" },
    ],
    budget: {
      weekend: "€300–€550 per person",
      activity: "€25–€80 per person",
      party: "€40–€80 per person per club night",
    },
    bestSeasons: ["May–September (open-air season)", "December (Christmas market crawls)"],
    insiderTips: [
      "Späti bar crawl beats commercial pub crawls: 8 stops, everyone buys a round, costs a third of what a tour does.",
      "Berghain queueing with 10 mates is hopeless — smaller clubs (Renate, Sisyphos, RSO) actually let groups in.",
      "Trabi Safari through East Berlin is the day highlight that even the in-laws love.",
      "AirBnB in Friedrichshain beats a hotel in Mitte: shorter walks at night, better breakfast spots, no quiet hours.",
    ],
    faqs: [
      {
        q: "What does a Berlin stag weekend cost per head?",
        a: "Realistic €300–€550 per person for two nights, two activities and one club night. AirBnB plus Spätis instead of bars drops it under €250.",
      },
      {
        q: "Which activity works best for a mixed-fitness crew?",
        a: "SUP on the Spree or an escape room followed by pizza — both work for sporty and less-sporty mates, unlike karting or paintball.",
      },
      {
        q: "Best Berghain alternative for stag groups?",
        a: "Renate (smaller, eclectic), Sisyphos (outdoor, more relaxed door) or RSO (newer, harder techno). All accept groups more readily than Berghain.",
      },
      {
        q: "When to book?",
        a: "May–September: 8–12 weeks ahead for accommodation and popular activities (karting, escape rooms). Clubs require no booking.",
      },
    ],
    jgaCity: jga("berlin"),
  },
  {
    slug: "hamburg",
    name: "Hamburg",
    countryName: "Germany",
    region: "Hamburg",
    vibe: "Reeperbahn, harbour, Alster — North German stag classic with maritime backdrop",
    intro:
      "Hamburg is the quiet champion of German stag dos: less hype than Berlin, compact centre, and a Reeperbahn that's been hosting stag parties for a century. Water everywhere — private harbour tours with onboard bar, SUP on the Alster, beach bars on the Elbe.",
    paragraphs: [
      "Hamburg compresses every stag-do need into a 4-km radius. Hauptbahnhof to Reeperbahn is 15 minutes on the U-Bahn, Schanze to the harbour 20 minutes on foot. A 10-person group loses less time in taxis here than in any other German city.",
      "Daytime is led by water: private harbour barge charters (€250–€450 for 12 people, 2 hours, BYO drinks), SUP on Außenalster, dragon boat racing as a team Olympics. For indoor crews: dense escape rooms, lasertag and indoor skydiving. Evenings split between Reeperbahn (classic stag energy) and Schanze/Karoviertel (less touristy, hipper).",
    ],
    topActivitySlugs: ["sup", "sailing", "karting", "escape_room", "lasertag", "indoor_skydiving", "axe_throwing", "shooting_range"],
    neighborhoods: [
      { name: "St. Pauli / Reeperbahn", tagline: "Classic stag night — karaoke, live music, mini-golf bars" },
      { name: "Schanzenviertel", tagline: "Hipper bar crawls, smaller clubs, mixed crowd" },
      { name: "HafenCity", tagline: "Rooftops with Elbphilharmonie views, stylish pre-drinks" },
      { name: "Karoviertel", tagline: "Independent bars between Schanze and Reeperbahn" },
    ],
    budget: {
      weekend: "€320–€580 per person including hostel/hotel",
      activity: "€30–€90 per person",
      party: "€45–€80 per person on the Reeperbahn",
    },
    bestSeasons: ["May–September (water activities)", "December (Christmas market + harbour fireworks)"],
    insiderTips: [
      "Private harbour barge beats the standard tourist boat: from €250 for 2 hours, your own drinks, photos to keep.",
      "Sankt-Pauli home match plus stag do is nuclear — if a fixture fits, build the trip around it.",
      "Fischmarkt breakfast (Sundays from 5 AM) is Hamburg tradition — perfect for crews who pulled an all-nighter.",
      "Skip Reeperbahn hotels (loud at night). Book in Schanze or Karoviertel, two U-Bahn stops away.",
    ],
    faqs: [
      {
        q: "Is the Reeperbahn still worth it for stag dos?",
        a: "Yes, selectively. Karaoke bars and live music venues still work; classic tourist discos are overpriced. Combine Reeperbahn night with Schanze pre-drinks.",
      },
      {
        q: "What does a private harbour tour cost?",
        a: "Barges for 10–12 people: €250–€450 for 2 hours, BYO drinks usually permitted. Best programme slot after brunch on day two.",
      },
      {
        q: "How many days for Hamburg?",
        a: "Two nights is the sweet spot. Friday arrival + Reeperbahn, Saturday harbour + activity + night out, Sunday Fischmarkt and home.",
      },
      {
        q: "Mandatory activity?",
        a: "Something on water. A Hamburg stag without harbour or Alster feels like a Bavarian trip without beer.",
      },
    ],
    jgaCity: jga("hamburg"),
  },
  {
    slug: "munich",
    name: "Munich",
    countryName: "Germany",
    region: "Bavaria",
    vibe: "Beer gardens, Oktoberfest, Alpine day trips — substance over flash",
    intro:
      "Munich is the anti-Berlin among stag do cities: better groomed, clearer structure, with the Alps as a back-pocket day trip. For crews who want beer with tradition rather than beer with irony, this is the first address.",
    paragraphs: [
      "Munich works two ways for stag dos: city-focused with beer gardens, Hofbräuhaus, karaoke on Sonnenstraße — or as a base for Bavarian day trips with hiking in the Karwendel range, surfing the Eisbach wave, and back to the city for the night.",
      "Hofbräuhaus is the obligatory cliché, but the best beer pours at Augustiner-Keller and Hirschgarten — both have self-service sections where 10 people don't need a reservation. In summer, the English Garden is the largest stag-do playground in Europe: watch Eisbach surfers, drink at the Chinese Tower, swim if you dare. For action: top-tier karts, one of Germany's best high-ropes courses (Vaterstetten), sim-racing studios, Isar rafting (Bad Tölz, 1 hour out).",
    ],
    topActivitySlugs: ["karting", "rafting", "high_ropes", "sim_racing", "escape_room", "axe_throwing", "lasertag", "climbing"],
    neighborhoods: [
      { name: "Glockenbachviertel", tagline: "Best bars, mixed crowd, creative cocktail spots" },
      { name: "Maxvorstadt", tagline: "Student-friendly, cheaper, good pre-drinks district" },
      { name: "Schwabing", tagline: "Classic Munich bar culture, near the English Garden" },
      { name: "Altstadt", tagline: "Hofbräuhaus, Marienplatz, touristy but compact" },
    ],
    budget: {
      weekend: "€380–€650 per person (Munich is pricier than Berlin/Hamburg)",
      activity: "€35–€100 per person",
      party: "€50–€90 per person inner-city night",
    },
    bestSeasons: ["May–August (beer gardens)", "October (Oktoberfest — 12 months lead time)", "December (Christmas markets)"],
    insiderTips: [
      "Oktoberfest stag do means 12+ months lead time for tent reservations. Walk-ins on weekends require queueing from 8 AM.",
      "Eisbach surf wave is free entertainment — watch the locals, cheer for your bravest mate. Mandatory stop.",
      "Day trip to Tegernsee or Walchensee by S-Bahn/BOB: beer boat charters from €200 for the crew.",
      "Hofbräuhaus reservations for stag groups are impossible. Augustiner or Paulaner am Nockherberg are easier alternatives.",
    ],
    faqs: [
      {
        q: "Munich during Oktoberfest — good idea?",
        a: "Spectacular but expensive and logistically hard. Hotel prices double, tent reservations 12 months ahead. Without reservations: queue from 8 AM for table access.",
      },
      {
        q: "Best beer garden for a stag crew?",
        a: "Augustiner-Keller (central, huge, self-service), Hirschgarten (year-round Wiesn beer, families OK but stags fit in), or Seehaus in the English Garden for the vibe.",
      },
      {
        q: "Realistic Munich budget?",
        a: "€400+ per person. Munich is the most expensive German stag destination, especially for hotels. AirBnB usually wins from 6 people upwards.",
      },
      {
        q: "Day trips that work without a rental car?",
        a: "Isar rafting (Bad Tölz, 1h), Karwendel via ferrata (1.5h), boat tours on Tegernsee or Starnberger See (45min by S-Bahn). All reachable on public transport.",
      },
    ],
    jgaCity: jga("muenchen"),
  },
  {
    slug: "cologne",
    name: "Cologne",
    countryName: "Germany",
    region: "North Rhine-Westphalia",
    vibe: "Kölsch, Karneval, karaoke — Germany's friendliest stag-do city",
    intro:
      "Cologne is the sympathy champion: nobody complains about a rowdy crew, every pub welcomes you in, and Karneval is essentially a city-wide stag party. For groups who find Berlin too edgy and Munich too expensive, this is home.",
    paragraphs: [
      "Cologne understands stag dos instinctively. A brewery tour — Päffgen, Früh, Sion, Reissdorf — works with any group size, no reservations needed. The Köbesse (waiters) are professionally rude, Kölsch flows in 0.2-litre glasses on a near-constant timer, every pub has its own quirks.",
      "Daytime: karting, climbing halls (Cologne South), lasertag, SUP on the Rhine, KölnTriangle observation deck, Belgian Quarter for a stroll. Food highlight: a 4-brewery crawl with Halver Hahn (cheese and rye bread) as the traditional snack stop.",
    ],
    topActivitySlugs: ["karting", "climbing", "escape_room", "lasertag", "sup", "axe_throwing", "bubble_soccer", "vr_arena"],
    neighborhoods: [
      { name: "Belgian Quarter", tagline: "Hipper cocktail bars, creative crowd" },
      { name: "Zülpicher Straße", tagline: "Breweries, pizza joints, Karneval stronghold" },
      { name: "Ehrenfeld", tagline: "Indie bars, live music, Cologne's alternative scene" },
      { name: "Altstadt", tagline: "Classic breweries, near the cathedral, touristy but mandatory" },
    ],
    budget: {
      weekend: "€280–€500 per person (cheaper than Munich or Hamburg)",
      activity: "€25–€80 per person",
      party: "€35–€70 per person on a brewery tour",
    },
    bestSeasons: ["February/March (Karneval — extreme)", "May–September (Rhine activities)", "July (Pride)"],
    insiderTips: [
      "Brewery tour as the early programme: 4 breweries 18:00–22:00, then Belgian Quarter — cheaper and better than commercial pub crawls.",
      "Karneval stag do means 9 months of lead time for accommodation. Hotel prices triple, but the vibe is incomparable.",
      "FC Köln home match plus stag is folk-festival territory. Official ticket vendor only — scalpers at the stadium are risky.",
      "Cologne to Düsseldorf: 25 min by ICE. An Alt-vs-Kölsch crawl is the local power-twist.",
    ],
    faqs: [
      {
        q: "Karneval stag do — pros and cons?",
        a: "Pros: once-in-a-lifetime atmosphere, every bar is rammed, your costumes go unnoticed. Cons: hotel prices triple, getting around is chaos, group separation is a real risk.",
      },
      {
        q: "Self-organise the brewery tour or book?",
        a: "Self-organise — 4 breweries within 800 metres, no reservations needed for most. Guided tours cost €40 per head and add little value.",
      },
      {
        q: "Cologne outside Karneval — still worth it?",
        a: "Yes. Rhine promenade, Cologne Pride in July, SUP, beer gardens. Actually more relaxed and cheaper than Karneval season.",
      },
      {
        q: "How many breweries on a single tour?",
        a: "Three to five. Classic route: Päffgen → Früh → Sion → Reissdorf. 30–45 minutes per stop, one 0.2L Kölsch per round.",
      },
    ],
    jgaCity: jga("koeln"),
  },
  {
    slug: "frankfurt",
    name: "Frankfurt",
    countryName: "Germany",
    region: "Hesse",
    vibe: "Skyline, Apfelwein, Bahnhofsviertel — compact stag city with a dual personality",
    intro:
      "Frankfurt is an underrated stag destination — and that's precisely the advantage: fewer tourist crews, shorter walks, and skyline rooftop drinks at half the price of Munich. The Main metropolis has two faces and both work for stag dos.",
    paragraphs: [
      "Frankfurt is the most compact major city in Germany: three U-Bahn stops from the central station to the skyline, then ten minutes on foot over the Main to the Sachsenhausen Apfelwein strip. A group can cover both worlds in one weekend without spending €5 per head on transport.",
      "Daytime: Main Tower SkyLounge (mandatory photo), bouldering at the Boulderwald (huge, group-friendly), karting at Frankfurt Karting Center, Mainufer SUP, or a Main ferry as a cheap harbour-tour alternative. Evening: Sachsenhausen (Apfelwein crawl) or Bahnhofsviertel (gritty, honest, top cocktails). Bornheim and Nordend for crews who want to skip the tourist programme.",
    ],
    topActivitySlugs: ["karting", "climbing", "escape_room", "indoor_skydiving", "sup", "lasertag", "axe_throwing", "vr_arena"],
    neighborhoods: [
      { name: "Sachsenhausen", tagline: "Apfelwein strip — classic stag night with tradition" },
      { name: "Bahnhofsviertel", tagline: "Cocktail bars, rough edge, best bars in town" },
      { name: "Bornheim", tagline: "Berger Straße, local pubs, less touristy" },
      { name: "Nordend", tagline: "Café vibe by day, good bars by night, pre-drinks district" },
    ],
    budget: {
      weekend: "€300–€520 per person",
      activity: "€30–€85 per person",
      party: "€40–€80 per person Apfelwein or bar crawl",
    },
    bestSeasons: ["May–September (Main promenade season)", "December (Christmas market)"],
    insiderTips: [
      "Apfelwein tours run themselves: 4 places in Sachsenhausen within 600 metres. Wagner is tourist-classic, Lorsbacher Thal more authentic.",
      "Bahnhofsviertel hostels are cheap, but the district gets rough at night. For mixed crews, book in Bornheim or Sachsenhausen.",
      "Main Tower SkyLounge costs €9 entry — best skyline photo spot in Germany for stag group portraits.",
      "Frankfurt is an airport city — perfect for stag dos with scattered crew. Direct flights from every DACH hub.",
    ],
    faqs: [
      {
        q: "Is Frankfurt too small for a stag weekend?",
        a: "On the contrary — the compactness is the advantage. Two nights is enough, three needs a day trip. Heidelberg, Mainz or Wiesbaden as a Day-2 booster work well.",
      },
      {
        q: "Apfelwein mandatory for tourists?",
        a: "Mandatory in the cliché sense, yes. Even non-fans try it once — then it's back to beer or cocktails. Sachsenhausen places always carry beer too.",
      },
      {
        q: "Bahnhofsviertel safe for a stag?",
        a: "Safe for the bars, especially on the main streets. Hotels in the district are functional but the surrounding area is rough at night — mixed crews sleep better in Bornheim or Sachsenhausen.",
      },
      {
        q: "Year-round activity?",
        a: "Bouldering at Boulderwald (huge hall, group-friendly), indoor karting, escape rooms. Main SUP and skyline picnics are summer only.",
      },
    ],
    jgaCity: jga("frankfurt"),
  },
  {
    slug: "stuttgart",
    name: "Stuttgart",
    countryName: "Germany",
    region: "Baden-Württemberg",
    vibe: "The Kessel, vineyards, cars — Swabian stag-do efficiency with surprisingly strong bars",
    intro:
      "Stuttgart is an insider tip for stag crews tired of 'Berlin or Cologne'. The valley creates an extremely compact city, with one of southern Germany's best karting scenes and the Cannstatter Volksfest as Munich's underrated cousin.",
    paragraphs: [
      "Stuttgart works better than its reputation suggests. The Kessel (valley) keeps everything tight: Theodor-Heuss-Straße (bar strip), Hans-im-Glück fountain, Marienplatz bars, Schlossplatz — all walkable in 15 minutes. The bar scene is surprisingly creative, with Galao, Sansibar and Jigger & Spoon hitting national top-bar lists.",
      "Stuttgart is a karting stronghold (Daimler DNA): indoor karts, drift courses, sim-racing studios, and the Porsche/Mercedes museums as the auto-fan day programme. For escape from the city: vineyards on the Neckar 30 minutes away — SUP on Max-Eyth-See, wine walks through Untertürkheim or Esslingen.",
    ],
    topActivitySlugs: ["karting", "sim_racing", "drift_course", "escape_room", "climbing", "sup", "axe_throwing", "lasertag"],
    neighborhoods: [
      { name: "Theodor-Heuss-Straße", tagline: "Classic bar strip, multiple bars in 200 m" },
      { name: "Bohnenviertel", tagline: "More creative cocktail bars, smaller venues" },
      { name: "Stuttgart-West", tagline: "Student-led, cheaper bars, pre-drinks district" },
      { name: "Bad Cannstatt", tagline: "Volksfest quarter, hotels cheaper than the city" },
    ],
    budget: {
      weekend: "€280–€500 per person (outside Volksfest)",
      activity: "€30–€95 per person",
      party: "€40–€75 per person bar tour",
    },
    bestSeasons: ["May–August (vineyards, open-air)", "Late September–October (Cannstatter Volksfest)"],
    insiderTips: [
      "Cannstatter Volksfest is a cheaper Oktoberfest alternative — 6 months lead time for tent reservations.",
      "Porsche and Mercedes museums make a perfect auto-crew day programme: €12 each, both doable in a day.",
      "Wine walk in Untertürkheim or Bad Cannstatt: 3–5 wineries in a half day, 8–12 Württemberg wines per person.",
      "Stuttgart is a hill city — comfortable shoes essential, Stäffele (staircases) replace some U-Bahn stops.",
    ],
    faqs: [
      {
        q: "Cannstatter Volksfest vs Oktoberfest for a stag?",
        a: "Cannstatter is cheaper, less crowded, with the same tent atmosphere. For a first Volksfest experience it's actually better — less entry stress, more spontaneity possible.",
      },
      {
        q: "Enough programme for 2 days in Stuttgart?",
        a: "Plenty if you combine one activity (karting or auto museum), a vineyard tour and a bar night. Three nights gets long unless you're in Volksfest season.",
      },
      {
        q: "Top cocktail bar for the crew?",
        a: "Jigger & Spoon in the Bohnenviertel is nationally known. For a whole group: Galao (bigger, group-friendly) or Paul & George as a pre-drink spot.",
      },
      {
        q: "Getting to Stuttgart from the north?",
        a: "ICE direct from Berlin (5.5h), Hamburg (5h), Cologne (2.5h). Flights only really pay off from Hamburg/Berlin. The compact centre means you can skip the rental car.",
      },
    ],
    jgaCity: jga("stuttgart"),
  },
  {
    slug: "dusseldorf",
    name: "Düsseldorf",
    countryName: "Germany",
    region: "North Rhine-Westphalia",
    vibe: "Altbier, the longest bar in the world, Königsallee — Rhineland elegance",
    intro:
      "Düsseldorf is Cologne's better-dressed sister: more polished, slightly pricier, with the 'longest bar in the world' as a flexible stag axis. For crews who prefer Altbier over Kölsch and designer cocktails over brewery clichés, this is the call.",
    paragraphs: [
      "The Altstadt — 250 pubs in 0.5 km² — is the stag-do hardware of choice. A crew rolls through Füchschen, Uerige, Schumacher, Schlüssel, and ends at the Rhine promenade with the Medienhafen as backdrop. No taxis needed, no reservations required.",
      "Daytime is less about sights, more about activities and shopping: Königsallee walk (even just to gawk), Medienhafen architecture, Rhine promenade, karting at Düsseldorf Karting, climbing halls, or a quick ICE to Cologne (25 min) for the Kölsch-vs-Alt comparison crawl.",
    ],
    topActivitySlugs: ["karting", "climbing", "escape_room", "lasertag", "sup", "axe_throwing", "vr_arena", "rage_room"],
    neighborhoods: [
      { name: "Altstadt", tagline: "The longest bar in the world — 250 pubs, mandatory base" },
      { name: "Medienhafen", tagline: "Architecture spectacle, rooftop bars, photo spot" },
      { name: "Flingern", tagline: "Hipper alternative to the Altstadt, indie bars" },
      { name: "Carlstadt", tagline: "Cocktail bars and restaurants beside the Altstadt" },
    ],
    budget: {
      weekend: "€310–€560 per person",
      activity: "€30–€85 per person",
      party: "€40–€80 per person Altstadt night",
    },
    bestSeasons: ["May–September (Rhine promenade)", "July (Largest Rhine Fair)", "November (Karneval kickoff)"],
    insiderTips: [
      "Altbier tour: 4 breweries in the Altstadt, organise it yourself — Füchschen, Schumacher, Uerige, Schlüssel. 30 min per brewery, one 0.25L Alt per round.",
      "Largest Rhine Fair (July) is a riverside funfair at stag scale — Ferris wheel, beer tents, Currywurst stands.",
      "Cologne vs Düsseldorf for stag: Düsseldorf wins on cocktails and elegance, Cologne wins on volume and brewery atmosphere. Both in one weekend is doable (25 min ICE).",
      "Medienhafen rooftops are mandatory photos but pricey — pre-drinks only, then back to the Altstadt.",
    ],
    faqs: [
      {
        q: "How many breweries on an Altbier tour?",
        a: "Three to four. Classic route: Uerige → Schumacher → Füchschen → Schlüssel. 30–40 minutes per stop, one or two 0.25L Alts.",
      },
      {
        q: "Düsseldorf or Cologne for a stag?",
        a: "Cologne for loud, traditional brewery noise with Karneval DNA. Düsseldorf for slicker cocktails, a more compact Altstadt and Medienhafen as a highlight. Doing both: Cologne Friday, Düsseldorf Saturday.",
      },
      {
        q: "Where does a 10-person crew sleep cheaply?",
        a: "Flingern or Oberbilk have cheaper hotels and are 5 U-Bahn minutes from the Altstadt. AirBnB in Friedrichstadt is often the sweet spot.",
      },
      {
        q: "Does Düsseldorf work alcohol-free?",
        a: "Medienhafen walk, Königsallee, Aqua Zoo, Rheinturm — yes, but the city's strength is its bar culture. Alcohol-free crews fit better in Hamburg or Munich.",
      },
    ],
    jgaCity: jga("duesseldorf"),
  },
  {
    slug: "vienna",
    name: "Vienna",
    countryName: "Austria",
    region: "Vienna",
    vibe: "Coffeehouse, Beisl, Danube Island — imperial culture meets underground",
    intro:
      "Vienna is the most underrated stag city in the German-speaking world: compact, culturally dense, cheaper than Munich, with a nightlife scene that oscillates between 1900s coffeehouse and 2020s techno bunker. For crews who want some depth and not just Reeperbahn rinse-and-repeat.",
    paragraphs: [
      "Vienna runs in two modes: imperial (Hofburg, Schönbrunn, coffeehouse tour) or underground (Naschmarkt bars, Gürtel clubs, Donaukanal summer days). A good stag mixes both. Sissi-era sights and Sacher cake by day, the honest underground scene by night.",
      "Daytime is surprisingly rich: Danube Island as a 21 km natural park with SUP, beach bars and open-air concerts in summer; Prater as XL playground with Riesenrad, karts, ghost trains; Lainzer Tiergarten for hiking, Wachau wineries 1h out. Bar creativity sits clearly above Munich: Loos American Bar (200 years old, world-famous), Heuriger Sirbu (wine at the vineyard), Donaukanal bars (free, alive, no entry).",
    ],
    topActivitySlugs: ["sup", "karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena", "shooting_range"],
    neighborhoods: [
      { name: "1st district (Innere Stadt)", tagline: "Imperial sights, classic bars" },
      { name: "Naschmarkt / 4th + 6th districts", tagline: "Hipper bars, wine pubs, cocktail scene" },
      { name: "Donaukanal", tagline: "Summer open-air bars, free hang-out, lively" },
      { name: "Gürtel (8th + 16th districts)", tagline: "Indie clubs, underground, less touristy" },
    ],
    budget: {
      weekend: "€280–€500 per person (cheaper than Munich)",
      activity: "€25–€80 per person",
      party: "€35–€70 per person bar tour",
    },
    bestSeasons: ["May–September (Danube Island, open-air)", "November–December (Christmas markets)"],
    insiderTips: [
      "Heuriger in Grinzing or Stammersdorf beats the tourist Heuriger in the centre: twice the wine quality at half the price.",
      "Avoid the Bermuda Triangle (1st district) — overpriced cocktails, mass stag-do processing. Go to the Naschmarkt area instead.",
      "Praterstern is the fastest trick: 3 stops from the central station, Ferris wheel + sausage stand + karaoke bar within 500 m.",
      "Donaukanal bars in summer are free and honest — no entry fees, BYO drinks allowed.",
    ],
    faqs: [
      {
        q: "Vienna vs Munich for a stag do from Germany?",
        a: "Vienna is cheaper, culturally denser, with better bar creativity. Munich has beer-garden classics and Oktoberfest. If your stag prefers wine and cocktails to beer: Vienna.",
      },
      {
        q: "How to get to Vienna?",
        a: "Direct flights from most German cities (1–1.5h), ICE from Munich (4h); Berlin is 8h by train — fly. Nightjet from Hamburg or Düsseldorf is a comfortable option.",
      },
      {
        q: "Schönbrunn worth it for a stag crew?",
        a: "Quick garden walk yes (free), interior tour no. A Vienna stag lives on bars and Heuriger, not palaces.",
      },
      {
        q: "Realistic Vienna budget?",
        a: "€280 lean, €400–€500 standard, €600+ luxurious. Vienna sits in the middle of DACH capitals; AirBnB in the 6th or 7th district is especially good value.",
      },
    ],
    jgaCity: jga("wien"),
  },
  {
    slug: "zurich",
    name: "Zurich",
    countryName: "Switzerland",
    region: "Zurich",
    vibe: "Lake, mountains, banking — Swiss precision at honestly Swiss prices",
    intro:
      "Zurich is the priciest, cleanest, most organised stag city in the German-speaking world. For crews with the budget and a taste for Swiss precision plus Alps within 30 minutes — unique. Niederdorf, Lake Zurich, mountains by train.",
    paragraphs: [
      "Zurich is small, and that's the trick. Within one tram zone you can hit Niederdorf (old town), Lake Zurich, Stadelhofen station, Langstrasse (the bar strip). A crew never walks a step that doesn't pay off.",
      "Daytime is led by water and mountain: SUP on the lake, swimming in the Limmat river (in summer, the local hack — let the current carry you through town), Uetliberg hike (20 min by train), day trips to Pilatus or Rigi by direct rail. Action crews: karting in Spreitenbach, river rafting on the Aare, paragliding in the Bernese Oberland 90 minutes away.",
    ],
    topActivitySlugs: ["sup", "rafting", "hiking", "karting", "escape_room", "climbing", "lasertag", "shooting_range"],
    neighborhoods: [
      { name: "Niederdorf", tagline: "Old town, classic bars, touristy but mandatory" },
      { name: "Langstrasse", tagline: "Bar strip, lively, creative — main stag base" },
      { name: "Zurich-West", tagline: "Former industrial area, now hipster bars, clubs, creative restaurants" },
      { name: "Seefeld", tagline: "Premium lakeside district, quieter, pre-drinks with a view" },
    ],
    budget: {
      weekend: "CHF 500–1000 per person (highest in DACH)",
      activity: "CHF 50–150 per person",
      party: "CHF 80–150 per person bar night",
    },
    bestSeasons: ["June–August (lake, swimming)", "September (Knabenschiessen)", "December (Christmas market)"],
    insiderTips: [
      "Limmat swimming in summer: hop in at the Frauenbad, float 3 km through town with the current — free, iconic, story material.",
      "Day trip to Uetliberg or Rigi: group rail passes from 6+ people. Photo at 1300 m, evening back in town.",
      "Restaurant lunch menus (CHF 25–35) beat the evening menu — even top venues run group-friendly lunches.",
      "Day-card for the group transport: a 9 AM day pass saves significantly on tours — CHF 9 per person instead of CHF 4 per leg.",
    ],
    faqs: [
      {
        q: "Is Zurich too expensive for a stag?",
        a: "For lean-budget crews yes. Beer CHF 8–12, burger CHF 25, hotels from CHF 180/night. For a premium stag with lake, mountains and Swiss cuisine: unbeatable.",
      },
      {
        q: "Mandatory Zurich activity?",
        a: "Summer: Limmat swim. Winter: Uetliberg or Rigi day trip for mountain panorama. Neither exists in this form anywhere else in DACH.",
      },
      {
        q: "Where do locals actually go out?",
        a: "Langstrasse for an honest bar night, Zurich-West (Frau Gerold's Garden, Hive) for the hipper crowd, Niederdorf only as a tourist photo stop. Not Glashof or banker bars for a stag.",
      },
      {
        q: "Day trip to the mountains without a rental car?",
        a: "Uetliberg (in the city, 20 min train), Rigi (1h train + boat), Pilatus (1h train). All bookable as a stag mountain operation, trains are comfortable and group-friendly.",
      },
    ],
    jgaCity: jga("zuerich"),
  },
  {
    slug: "hannover",
    name: "Hannover",
    countryName: "Germany",
    region: "Lower Saxony",
    vibe: "Steintor, Maschsee, Schützenfest — the most honest stag city in Northern Germany",
    intro:
      "Hannover is the honest mid-tier among stag cities: cheaper than Hamburg, less touristy than Berlin, with the Steintor as a proven bar axis and the largest Schützenfest in the world as a seasonal highlight. For crews who skip the self-promotion.",
    paragraphs: [
      "Hannover works for stags for two reasons: a compact centre with a dense bar scene at the Steintor and its sister Limmerstraße in Linden, plus one of the best activity infrastructures for a city its size (karting, lasertag, climbing, GOP Varieté for a show night).",
      "Daytime: SUP on Maschsee or the Mittelland canal, climbing at the Hannover Boulderhalle, karting at RACE-INN, leisure pools, Hannover Adventure Zoo (special programmes for relaxed stag crews). Day trip to Steinhuder Meer (45 min) for water without the urban hustle.",
    ],
    topActivitySlugs: ["karting", "climbing", "escape_room", "lasertag", "sup", "axe_throwing", "vr_arena", "bubble_soccer"],
    neighborhoods: [
      { name: "Steintor", tagline: "Classic stag bar strip, compact, everything in 200 m" },
      { name: "Linden / Limmerstraße", tagline: "Hipper district, creative bars, indie clubs" },
      { name: "Maschsee", tagline: "Daytime water activities, evening beach bars in summer" },
      { name: "Calenberger Neustadt", tagline: "Cocktail bars, quieter, pre-drinks district" },
    ],
    budget: {
      weekend: "€240–€450 per person (one of the cheapest German cities)",
      activity: "€25–€75 per person",
      party: "€30–€60 per person Steintor night",
    },
    bestSeasons: ["July (Schützenfest — special lead time)", "May–September (Maschsee season)", "December (Christmas market)"],
    insiderTips: [
      "Schützenfest (late June–early July) is Oktoberfest-level at half the price: 6 festival tents, 5 million visitors, stags are standard inventory.",
      "Steintor is the no-frills stag mile — no reservations, bars feed off each other's crowd.",
      "Hannover Messe weeks (April) explode hotel prices — avoid, or use Bremen/Hamburg as alternatives.",
      "Bouldering at Boulderhaus Hannover as a day activity for any fitness level — €11 entry, shoe rental, three hours of programme.",
    ],
    faqs: [
      {
        q: "What does a Hannover weekend actually cost?",
        a: "€240–€400 per person — Hannover is one of Germany's cheapest cities. AirBnB in Linden or List beats almost everywhere on price.",
      },
      {
        q: "Schützenfest stag — when to book?",
        a: "Four months lead time for accommodation (prices double). Tents don't need reservations but fill up after 18:00.",
      },
      {
        q: "Enough programme for 3 days?",
        a: "Three days work with a Steinhuder Meer day trip or Schützenfest. Standard two nights: Friday arrival + Steintor, Saturday activity + night, Sunday home.",
      },
      {
        q: "Steintor or Limmerstraße for the evening?",
        a: "Steintor is the classic stag bar strip, honest, loud, group-friendly. Limmerstraße in Linden is hipper, more creative, less cliché. Crews choose by vibe.",
      },
    ],
    jgaCity: jga("hannover"),
  },
  {
    slug: "dresden",
    name: "Dresden",
    countryName: "Germany",
    region: "Saxony",
    vibe: "Florence on the Elbe, Frauenkirche, Neustadt — culture meets calculated escalation",
    intro:
      "Dresden is the underrated mix of Baroque grandeur and alternative bar scene. Frauenkirche and Zwinger as classic day programme, the Neustadt with over 200 bars in 1 km² as the stag-do main base.",
    paragraphs: [
      "Dresden works for stags on two tracks: by day a cultural trip with Frauenkirche, Semperoper, Zwinger and Elbe SUP — by night the Äußere Neustadt as one of Germany's densest bar strips. Over 200 bars between Albertplatz and Bautzner Straße, all walkable.",
      "Strong activity side: karting in Coswig (20 min), castle tours with wine tasting at the Saxon wineries, Elbe SUP, climbing, shooting range. Dresden is cheaper than Berlin or Munich and more relaxed for mixed crews.",
    ],
    topActivitySlugs: ["karting", "escape_room", "sup", "climbing", "axe_throwing", "lasertag", "shooting_range", "vr_arena"],
    neighborhoods: [
      { name: "Äußere Neustadt", tagline: "Over 200 bars in 1 km² — the stag-do main base" },
      { name: "Innere Altstadt", tagline: "Frauenkirche, Zwinger — tourist + cultural programme" },
      { name: "Innere Neustadt", tagline: "Cocktail bars between tourist and hipster" },
    ],
    budget: {
      weekend: "€230–€420 per person",
      activity: "€25–€80 per person",
      party: "€30–€60 per person Neustadt tour",
    },
    bestSeasons: ["May–September (Elbe season)", "December (Striezelmarkt — mandatory Christmas market)"],
    insiderTips: [
      "Bunte Republik Neustadt (BRN) in June — street festival with the whole bar strip as an open-air party, stag goldmine.",
      "Schloss Wackerbarth (15 min out): sparkling wine tasting as upscale day programme from €35 per head.",
      "Elbe SUP from Pieschen to Blaues Wunder as a half-day tour — rental at the harbour, €25 per head.",
    ],
    faqs: [
      {
        q: "Dresden or Leipzig for a stag?",
        a: "Dresden is culturally denser and the Neustadt is more established as a stag axis. Leipzig has a hipper crowd and the bigger indie scene. Both cheap and relaxed.",
      },
      {
        q: "What does a Dresden stag cost per head?",
        a: "€230–€400 for a weekend including hotel, one activity and a bar tour. Clearly cheaper than Berlin or Munich.",
      },
      {
        q: "Which Neustadt bars?",
        a: "Classics: Combo, Lebowski Bar, Down Town, Reisekader. 200+ options within 1 km — a crawl writes itself.",
      },
    ],
    jgaCity: jga("dresden"),
  },
  {
    slug: "leipzig",
    name: "Leipzig",
    countryName: "Germany",
    region: "Saxony",
    vibe: "Hypezig, Karli, Plagwitz — the alternative stag city without the fuss",
    intro:
      "Leipzig is the cheaper, hipper Berlin of the east: Karl-Liebknecht-Straße (Karli) and Plagwitz as bar axes, Cospudener and Markkleeberger lakes for water activities, Bach-city tradition for the cultural crews.",
    paragraphs: [
      "Leipzig combines Berlin vibe with Dresden pricing: lively indie scene, creative cocktail bars, alternative clubs (Distillery, Conne Island), and a lake region 30 minutes outside the city. Karli and Südvorstadt are the main stag-do bar axes, Plagwitz the hipper alternative.",
      "Day programme: SUP or wakeboarding at Cospudener See, walking tour of Plagwitz (former industry, now indie bars and workshops), Auerbachs Keller as Goethe-tourist obligation, or karting/lasertag in the industrial halls.",
    ],
    topActivitySlugs: ["sup", "wakeboarding", "karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena"],
    neighborhoods: [
      { name: "Karli (Karl-Liebknecht-Straße)", tagline: "Bar mile of choice, densest stag axis" },
      { name: "Plagwitz", tagline: "Hipster district, indie bars, ex-industrial" },
      { name: "Centre", tagline: "Auerbachs Keller, tourist classic, cocktail bars" },
    ],
    budget: {
      weekend: "€220–€400 per person",
      activity: "€25–€80 per person",
      party: "€30–€55 per person Karli tour",
    },
    bestSeasons: ["May–September (lake season)", "August (Wave-Gotik-Treffen for subculture crews)"],
    insiderTips: [
      "Cospudener See for wakeboarding: former coal mine, now 4 km² of water — wake park from €30 per head.",
      "Plagwitz tour: Spinnerei (art galleries), Werk 2 (bar/club), Westwerk — former industrial area as a stag playground.",
      "Reserve Auerbachs Keller — Goethe-tourist obligation, honestly good food, stag-friendly.",
    ],
    faqs: [
      {
        q: "Is Leipzig worth a stag do?",
        a: "Yes, especially for crews who want a Berlin vibe without Berlin prices. Slightly less density but more relaxed and cheaper.",
      },
      {
        q: "What makes the Karli special?",
        a: "1 km of bar mile from beer pubs to cocktail bars in 200-metre spacings. Mandatory stag axis.",
      },
      {
        q: "Getting to Leipzig?",
        a: "ICE from Berlin in 1h, Munich 3h, Hamburg 3.5h. Leipzig/Halle airport rarely used — train is better.",
      },
    ],
    jgaCity: jga("leipzig"),
  },
  {
    slug: "nuremberg",
    name: "Nuremberg",
    countryName: "Germany",
    region: "Bavaria",
    vibe: "Castle, Bratwurst, Bardentreffen — Franconian stag-do tradition with medieval backdrop",
    intro:
      "Nuremberg is the Franconian alternative to Munich: cheaper, more compact, with the medieval castle as a daytime backdrop and a dense bar scene in the Lorenzer Altstadt. Bratwurst, Franconian beer, and the Bardentreffen festival as the summer highlight.",
    paragraphs: [
      "Nuremberg surprises stag crews with a compact old town (15 minutes on foot anywhere), good bar density on the Hauptmarkt and in the Gostenhof scene (Franconian indie quarter), and with Franconian beer (Tucher, Schanzenbräu) as a meaningful alternative to Bavarian Helles. Castle, Hauptmarkt and Albrecht Dürer's house as cultural day-programme staples.",
      "Day activities: karting at the Karting Center, high-ropes course in Stein (15 min), day trip to Rothenburg ob der Tauber (45 min, medieval cliché in its purest form), shooting range, climbing halls.",
    ],
    topActivitySlugs: ["karting", "escape_room", "high_ropes", "climbing", "lasertag", "axe_throwing", "shooting_range", "vr_arena"],
    neighborhoods: [
      { name: "Lorenzer Altstadt", tagline: "Hauptmarkt, classic bars, breweries" },
      { name: "Gostenhof", tagline: "Franconian hipster district, indie bars, creative crowd" },
      { name: "Sebalder Altstadt", tagline: "Castle district, tourist classic, upscale restaurants" },
    ],
    budget: {
      weekend: "€240–€420 per person",
      activity: "€25–€80 per person",
      party: "€35–€60 per person bar tour",
    },
    bestSeasons: ["May–September", "July–August (Bardentreffen)", "December (Christkindlesmarkt — Germany's most famous)"],
    insiderTips: [
      "Drei-im-Weggla: three Nuremberg sausages in a bun — mandatory snack between bars for €4–€5.",
      "Schanzenbräu in Gostenhof: Franconian indie craft beer, beer garden plus brewery tour as a stag programme.",
      "Day trip to Rothenburg ob der Tauber: 45 min by train, perfect medieval backdrop, free photos.",
    ],
    faqs: [
      {
        q: "Nuremberg or Munich for a stag?",
        a: "Nuremberg is more compact, significantly cheaper and less touristy. Munich has more activity density and the Wiesn tradition. For crews who want a Franconian flavour: Nuremberg.",
      },
      {
        q: "What does a Nuremberg stag cost?",
        a: "€240–€400 per person for a weekend. One of the cheaper southern German cities.",
      },
      {
        q: "Christkindlesmarkt stag?",
        a: "Late November to December 24: legendary market, stags work as Christkindle-elf themes. Slightly higher hotel prices, atmosphere unique.",
      },
    ],
    jgaCity: jga("nuernberg"),
  },
  {
    slug: "salzburg",
    name: "Salzburg",
    countryName: "Austria",
    region: "Salzburg",
    vibe: "Mozart, fortress, festival — stag do with Alpine backdrop and Austrian elegance",
    intro:
      "Salzburg is the most compact Austrian stag city: Mozart's birthplace, Hohensalzburg Fortress, Salzach promenade, and the Salzkammergut lakes 30 minutes away. Culturally elegant, with a bar scene around the Linzer Gasse.",
    paragraphs: [
      "Salzburg works for stags as a blend of cultural trip and active programme: Hohensalzburg Fortress, Mozart's birthplace and Schloss Mirabell by day, Linzer Gasse and Steingasse for bar crawls by night, with Salzach rafting or Kapuzinerberg hiking in between.",
      "Highlight: day trip to Wolfgangsee or Königssee (each 45 min), boat tour with beer onboard, or the Bavarian back country for a via ferrata + Alpine hut combo. Salzburg is the best base for crews wanting both city and mountains.",
    ],
    topActivitySlugs: ["rafting", "hiking", "high_ropes", "karting", "escape_room", "climbing", "sup", "vr_arena"],
    neighborhoods: [
      { name: "Old town left of the Salzach", tagline: "Mozart tourist axis, restaurants, classic bars" },
      { name: "Linzer Gasse / Steingasse", tagline: "Bar axis, stag-do main base" },
      { name: "Lehen", tagline: "Hipper district, more alternative bars, cheaper" },
    ],
    budget: {
      weekend: "€320–€550 per person (Salzburg isn't cheap)",
      activity: "€30–€100 per person",
      party: "€45–€80 per person bar tour",
    },
    bestSeasons: ["May–September (outdoor season)", "July–August (Festival — hotel prices explode)", "December (Christmas market)"],
    insiderTips: [
      "Wolfgangsee day trip: 45 min by train, boat tour, brunch in St. Wolfgang, evening back in town.",
      "Avoid Festival season (July/August) for a stag — hotels double, atmosphere too formal for stag groups.",
      "Stiegl-Brauwelt for a brewery tour with tasting — Austrian beer programme.",
    ],
    faqs: [
      {
        q: "Does Salzburg fit a stag?",
        a: "For culturally minded crews who want mountains plus city, ideal. Pure escalation stags fit better in Vienna or Munich.",
      },
      {
        q: "Best day trip from Salzburg?",
        a: "Wolfgangsee (lake, brunch, boat) or Königssee (lake, hike, Bavaria). Both 45 min, both highlight programme.",
      },
      {
        q: "What does a Salzburg stag cost?",
        a: "€320–€500 per person outside Festival season. During the Festival, hotel prices double — avoid.",
      },
    ],
    jgaCity: jga("salzburg"),
  },

  // ──────────────────────────────────────────────────────────────────
  // International cities (18) — remaining destinations for English-speaking audiences
  // ──────────────────────────────────────────────────────────────────

  {
    slug: "mallorca",
    name: "Mallorca",
    countryName: "Spain",
    region: "Balearic Islands",
    vibe: "Ballermann, beaches, sangria buckets — Europe's most honest stag-do classic",
    intro:
      "Mallorca is the mother of all stag-do trips: direct flights from £50, hotels that love stag groups, the Ballermann strip as a calibrated escalation boulevard, and beaches where you can sleep off the hangover undisturbed.",
    paragraphs: [
      "Mallorca works for stags because of its reputation, not despite it. Megapark, Bierkönig, Oberbayern — these venues are not tourist traps but professionally choreographed stag arenas with security, live music and party vibe until 6 AM.",
      "Daytime is surprisingly rich: yacht charter with skipper from Palma (€200–€500 per day for the crew), cala-hopping to Cala Mondrago or Cala Varques, Tramuntana hiking, quad tours, or pool with sangria service. Palma old town for crews needing cultural justification.",
    ],
    topActivitySlugs: ["sailing", "sup", "jetski", "quad_tour", "hiking", "escape_room", "karting", "shooting_range"],
    neighborhoods: [
      { name: "Playa de Palma / Ballermann", tagline: "Schinkenstraße, Megapark, Bierkönig — mandatory stag axis" },
      { name: "Palma Old Town", tagline: "Cocktail bars, tapas, cathedral — day programme" },
      { name: "Santa Catalina", tagline: "Hip district, foodie bars, Mallorca's Williamsburg" },
      { name: "Cala Ratjada", tagline: "Quieter eastern alternative, less tourist mania" },
    ],
    budget: {
      weekend: "€350–€650 per person including flights",
      activity: "€30–€120 per person",
      party: "€40–€80 per person Ballermann night",
    },
    bestSeasons: ["May–June (before high season)", "September (warm but quieter)", "Avoid: August (overpriced, packed)"],
    insiderTips: [
      "Yacht charter with skipper from Palma: €250–€400 for 6 hours, 8 guests — cheaper per head than a Mallorca night out, far better photos.",
      "Book flights for Tuesday/Wednesday: 50–70% cheaper than weekend slots. In Wed, out Sun/Mon saves €100–€200 per head.",
      "Schinkenstraße bulk discounts: sangria buckets for €30 split among 6 people — cheaper per head than a beer in Berlin.",
      "Riu Concordia, Bellevue or Tropic Garden hotels are classic stag-friendly — no families, no complaints, infrastructure dialled in.",
    ],
    faqs: [
      {
        q: "Is a Mallorca stag still relevant?",
        a: "Yes, if you don't need curated anti-mass-tourism. For a crew that wants to escalate once and sleep off on the beach, Mallorca is Europe's most efficient option: direct flight, everything in German/English, group infrastructure perfected.",
      },
      {
        q: "Realistic Mallorca stag cost per head?",
        a: "€350–€650 per person for 4 days including flight, hotel, one boat tour, two Ballermann nights, food. July/August doubles. May or September halves vs August.",
      },
      {
        q: "Yacht charter vs organised boat?",
        a: "Direct charter at Palma harbour is cheaper and more flexible. Providers like Click&Boat, Sailogy, or local skippers at the Paseo Marítimo — from €250 for 8 people.",
      },
      {
        q: "Which hotel for a stag?",
        a: "Directly on Ballermann: Hotel Riu San Francisco or Bellevue (stag-tolerant, close to action). Quieter: Palma old town with AirBnB for the whole crew. Avoid family hotels — complaints guaranteed.",
      },
    ],
    jgaCity: jga("mallorca"),
  },
  {
    slug: "krakow",
    name: "Krakow",
    countryName: "Poland",
    region: "Lesser Poland",
    vibe: "Vodka, Kazimierz, salt mine — Prague's Polish sister, even cheaper",
    intro:
      "Krakow is Prague's quiet alternative that's already an open secret: similarly cheap, one of Europe's most beautiful old towns, a lively student city with a dense bar scene, plus Auschwitz and the Wieliczka salt mine as cultural day trips. Mandatory for crews who've already done Prague.",
    paragraphs: [
      "Krakow is Poland's answer to Prague — slightly quieter, more authentic, with the huge Rynek Główny as market-square stage. Half a litre of Polish beer £2–£3, vodka shots from £1.30, hotel rooms in the old town from £30 per head. Even Prague looks expensive next to it.",
      "Day programmes: Wieliczka Salt Mine (UNESCO, 30 min outside, underground chapel, £30 per head), karting, shooting range with AK-47 experiences, kayaking on the Vistula, pierogi cooking class, or day trip to Auschwitz (for crews with reflective duty).",
    ],
    topActivitySlugs: ["shooting_range", "karting", "escape_room", "lasertag", "axe_throwing", "vr_arena", "rage_room", "canoeing"],
    neighborhoods: [
      { name: "Old Town / Stare Miasto", tagline: "Rynek Główny, classic tourist axis, beautiful restaurants" },
      { name: "Kazimierz", tagline: "Jewish quarter, bar cluster Plac Nowy — the real main base" },
      { name: "Podgórze", tagline: "Hipster district south of the Vistula, indie bars" },
      { name: "Kleparz", tagline: "Student-led, cheap bars, creative nightlife" },
    ],
    budget: {
      weekend: "£160–£330 per person including flights",
      activity: "£15–£60 per person",
      party: "£18–£45 per person bar tour",
    },
    bestSeasons: ["May–June", "September–October", "December (Christmas markets on Rynek)"],
    insiderTips: [
      "Vodka tasting at one of the vodka bars: 8–10 varieties with explanation for £13 per head — better story than any home whisky tasting.",
      "Wieliczka Salt Mine is mandatory half-day: 700 years of salt mining, underground cathedral, perfect brunch alternative before escalation.",
      "Pierogi cooking class (£40–£55 per head) for crews wanting something different — ends with shared eating + vodka.",
      "Flights: Ryanair and Wizzair from most UK/DE airports from £35. Airport close to centre, taxi to old town £8.",
    ],
    faqs: [
      {
        q: "Krakow or Prague for a stag?",
        a: "Krakow is cheaper, less tourist-saturated, with Wieliczka and Auschwitz as day trips Prague can't match. Prague has denser nightlife and broader recognition. First stag: Prague. Second: Krakow.",
      },
      {
        q: "Three-night Krakow stag cost?",
        a: "£160–£300 per head including flight, hotel, two activities, bars. One of Europe's cheapest abroad-stag options.",
      },
      {
        q: "Auschwitz during a stag — appropriate?",
        a: "A matter of crew consensus. If everyone responds with reflection, it's one of the most intense European experiences and a sober counterweight to the escalation weekend. Half a day, clean break to the night programme.",
      },
      {
        q: "Where do locals drink in Krakow?",
        a: "Kazimierz, not the Old Town. Plac Nowy is the central bar axis, Singer and Alchemia are the classics. In the Old Town drinks cost double what they do 800 metres south.",
      },
    ],
    jgaCity: jga("krakau"),
  },
  {
    slug: "budapest",
    name: "Budapest",
    countryName: "Hungary",
    region: "Pest",
    vibe: "Thermal baths, ruin pubs, the Danube — Europe's most underrated stag-do city",
    intro:
      "Budapest is the open secret that's not so secret anymore. What makes it unique: thermal baths as a stag playground, ruin pubs as a globally one-of-a-kind bar format, Danube cruises with Parliament as backdrop, and prices like Prague a decade ago.",
    paragraphs: [
      "Budapest is the only European capital where a stag do can start in a 100-year-old thermal bath and end in a crumbling Soviet-era house bar. These two poles — Belle Époque cultural treasure and underground bar scene — are the distinctive feature.",
      "Daytime works on three tracks: thermal baths (Széchenyi for mainstream, Gellért for Belle Époque, Rudas for underground — entry £18–£30), Danube cruises with private bar or hot-tub boats (surreal but legendary), activities from karting and shooting range to bouldering in the Buda-side industrial halls.",
      "Evenings are about the ruin pubs (Romkocsmák): Szimpla Kert is the famous one, Instant Fogas the mega-format with 6 rooms, Mazel Tov for a Mediterranean spin. These bars are derelict courtyards and townhouses with 80s furniture, multiple bars per complex, open-air zones — nothing like it elsewhere in Europe.",
    ],
    topActivitySlugs: ["karting", "escape_room", "shooting_range", "lasertag", "axe_throwing", "vr_arena", "rage_room", "sup"],
    neighborhoods: [
      { name: "Jewish Quarter / District VII", tagline: "Ruin pub cluster, Szimpla Kert, Instant Fogas — stag main base" },
      { name: "Belváros (District V)", tagline: "Inner city, classic bars, restaurants" },
      { name: "Erzsébetváros", tagline: "Hipper, cocktail bars, boutique hotels" },
      { name: "Buda (District I)", tagline: "Castle district, viewpoints, quieter daytime" },
    ],
    budget: {
      weekend: "£170–£360 per person including flights",
      activity: "£17–£70 per person",
      party: "£22–£48 per person ruin-pub tour",
    },
    bestSeasons: ["May–June", "September (Sziget Festival nearby)", "December (Christmas markets + thermal baths even better)"],
    insiderTips: [
      "Széchenyi on Saturday for Sparty (party in the thermal bath with DJ, from £42 per head) — surreal, iconic, top-tier stag photo material.",
      "Ruin pub crawl: Szimpla Kert (touristy but mandatory) → Instant Fogas (mega-format) → Mazel Tov (youngest crowd) → Kőleves (classic). 200 metres between them all.",
      "Night-time Danube cruise: Parliament + Castle lit up, 90 min, with onboard bar from £22 per head. Mandatory programme despite tourist image.",
      "Flights: Wizzair and Ryanair from UK/DE £45–£100 round-trip. Airport 30 min to centre by bus or £22 taxi.",
    ],
    faqs: [
      {
        q: "What's a ruin pub and why does it matter for a stag?",
        a: "Bars in derelict tenement courtyards in the 7th district. Multiple bars per complex, mixed crowds, open-air sections, 1980s charity-shop furniture. Nowhere else in Europe — perfect stag-stop sequence.",
      },
      {
        q: "Thermal bath during a stag — appropriate?",
        a: "Very. Best brunch alternative in the city: 3 hours in 38°C outdoor pools, beer at the edge, world-class hangover therapy. Széchenyi is classic, Rudas has a rooftop pool highlight.",
      },
      {
        q: "Realistic Budapest cost?",
        a: "£170–£340 per person for 3 days including flight, hotel, two activities, bars, thermal bath. One of Europe's best price-experience ratios.",
      },
      {
        q: "Is a weekend enough for Budapest?",
        a: "Tight. Three nights is ideal: Day 1 thermal bath + ruin pubs, Day 2 activity + Danube cruise + late bar, Day 3 castle district + home. Two nights work but skip the castle.",
      },
    ],
    jgaCity: jga("budapest"),
  },
  {
    slug: "paris",
    name: "Paris",
    countryName: "France",
    region: "Île-de-France",
    vibe: "Eiffel Tower, wine, Pigalle — stag do for style crews who want more than beer",
    intro:
      "Paris is the stag city for crews who want elegance and escalation together. Wine over beer, cocktails over sangria, wine bars in Le Marais over Schinkenstraße, and then Pigalle as the obligatory tourist stop. Pricier than Prague but unbeatable for higher-end grooms.",
    paragraphs: [
      "Paris works differently from the typical stag market: less loud, less group-party infrastructure, but with a bar and restaurant scene at world-class level. A Paris stag is more a culinary-cultural trip with escalation options than a mass escalation weekend.",
      "Daytime: Eiffel Tower photo (mandatory, brief), Louvre or Musée d'Orsay (one hour, then enough), Seine cruise with your own Champagne (private boats from €400 for the crew), wine tasting at Caves du Louvre or in Le Marais. For active crews: karting at Funkart Paris, escape rooms in Le Marais, climbing at Climbing District.",
    ],
    topActivitySlugs: ["karting", "escape_room", "climbing", "axe_throwing", "vr_arena", "lasertag", "shooting_range", "indoor_skydiving"],
    neighborhoods: [
      { name: "Le Marais", tagline: "Cocktail bars, hipper atmosphere — stag-do main base" },
      { name: "Pigalle", tagline: "Tourist classic, ex-red-light tradition, bar cluster" },
      { name: "Bastille / Oberkampf", tagline: "Younger crowd, lively bar strips, cheaper" },
      { name: "Montmartre", tagline: "Sacré-Cœur, touristy but picturesque, day programme" },
    ],
    budget: {
      weekend: "€500–€900 per person including travel",
      activity: "€45–€150 per person",
      party: "€80–€150 per person bar tour (cocktail €14–€18)",
    },
    bestSeasons: ["May–June (pre-peak)", "September (locals back, lively)", "December (Christmas market)"],
    insiderTips: [
      "Champagne bar Le Bar du Caviar Kaspia or Bisou for a pre-drinks moment — €18 per glass, memento photo included.",
      "TGV/ICE from Frankfurt/Cologne/Munich in 4–6 hours direct to city centre — more relaxed than flying, similar price from €80.",
      "Wine tasting at Caves du Louvre: €45–€60 per head for 3 hours, 5–7 wines, English explanation. Anti-hangover brunch alternative.",
      "Pigalle is now far more bar-focused than its reputation suggests — Le Carmen, Dirty Dick, Glass deliver a top-tier cocktail crawl.",
    ],
    faqs: [
      {
        q: "Is Paris worth it for a stag?",
        a: "For escalation-focused stags, Prague or Mallorca. For crews wanting style, wine, cocktails and a cultural trip with bar programme: Paris has no peer. The groom profile decides.",
      },
      {
        q: "3-night Paris stag cost?",
        a: "€500–€800 per person including travel, mid-range hotel, one activity and two bar nights. AirBnB in Le Marais drops it to €380–€550 per head.",
      },
      {
        q: "Parisian door selectors and male groups?",
        a: "Tough. All-male crews of 6+ are routinely turned away at top clubs (Concrete, Rex). Recommendation: stay in bars, or target Wanderlust and smaller clubs specifically. Reservation with bottle service avoids the issue.",
      },
      {
        q: "Train or plane to Paris?",
        a: "Train from West Germany clearly better: door-to-door faster than flying, the crew can pre-drink on the way, no luggage stress. From Berlin/Hamburg, fly. Otherwise ICE/TGV.",
      },
    ],
    jgaCity: jga("paris"),
  },
  {
    slug: "lisbon",
    name: "Lisbon",
    countryName: "Portugal",
    region: "Lisboa",
    vibe: "Hills, Fado, Bairro Alto — the insider stag with the Atlantic as a bonus",
    intro:
      "Lisbon is Barcelona's undiscovered sister: cheaper, slightly quieter, with the Atlantic 30 minutes by train and a Bairro Alto bar scene that competes with Europe's best. For crews who want a bit less cliché and a bit more real.",
    paragraphs: [
      "Lisbon works as a stag do for three reasons: Atlantic beach 30 minutes by train (Cascais, Estoril), a compact centre with hilly tram tours, and Bairro Alto — a whole district that is a bar. Hundreds of bars within 800 metres, drinks served to take away, the street as the stage, alive until 4 AM.",
      "Daytime: Tram 28 as the touristy hill loop (€1 per ride), day trip to Sintra (Pena Palace, Quinta da Regaleira — fairytale backdrops) or Cascais (beach, surfing, Atlantic coast), surfing lessons in Costa da Caparica or Ericeira. Tasca bar crawls in Alfama as the cultural duty.",
    ],
    topActivitySlugs: ["sup", "sailing", "wakeboarding", "karting", "escape_room", "lasertag", "axe_throwing", "indoor_skydiving"],
    neighborhoods: [
      { name: "Bairro Alto", tagline: "Hundreds of bars in 800 m — the real stag main base" },
      { name: "Alfama", tagline: "Oldest district, Fado bars, hilly, romantic" },
      { name: "Chiado", tagline: "Cocktail bars, smarter, shopping district" },
      { name: "LX Factory", tagline: "Former factory, now bars + restaurants + market hall" },
    ],
    budget: {
      weekend: "€280–€520 per person including flights",
      activity: "€30–€100 per person",
      party: "€30–€70 per person bar tour",
    },
    bestSeasons: ["April–June (warm, pre-peak)", "September–October (surf, quieter)"],
    insiderTips: [
      "Sintra as a half-day tour: 1h train, Pena Palace + Quinta da Regaleira, then back to Lisbon. Perfect Day-2 brunch alternative.",
      "Bairro Alto: take-away drinks are legal local tradition. Cocktails €4–€6 — cheaper than in any bar.",
      "Pastéis de Belém: the originals at the namesake bakery in Belém (original recipe since 1837). Mandatory snack.",
      "Flights: from DE €60–€180 round-trip with TAP, Ryanair, easyJet. Airport 15 min to centre by metro.",
    ],
    faqs: [
      {
        q: "Lisbon or Barcelona for a stag?",
        a: "Barcelona is better known, louder, with denser club options. Lisbon is cheaper, more authentic, with the Atlantic as a surf bonus. Crews on a second abroad stag pick Lisbon.",
      },
      {
        q: "What does a Lisbon stag cost?",
        a: "€280–€500 per person for 3 nights. Hotels well below Barcelona, Bairro Alto drinks extremely cheap, activities priced similarly to Mallorca.",
      },
      {
        q: "How does Bairro Alto actually work?",
        a: "A whole district as open-air bar. Order at bar counters, take a plastic cup outside, drink on the street. Several bars on each street, all open at the same times, all with outside crowds. No reservations possible.",
      },
      {
        q: "Surf lessons for beginners?",
        a: "Costa da Caparica or Ericeira: group classes €35–€55 per person for 2 hours including equipment. Best crash-course activity for stags wanting something different from karting.",
      },
    ],
    jgaCity: jga("lissabon"),
  },
  {
    slug: "istanbul",
    name: "Istanbul",
    countryName: "Türkiye",
    region: "Istanbul",
    vibe: "Bosphorus, Bazaar, Beyoğlu — Oriental-European stag with unique geography",
    intro:
      "Istanbul is the stag city for crews who want something truly different: a 15-million-person metropolis across two continents, the Bosphorus as a water artery, Hagia Sophia as backdrop, Beyoğlu as a European-leaning bar quarter. With the current Lira rate, prices often below Prague.",
    paragraphs: [
      "Istanbul combines two worlds: the touristic cultural side with Hagia Sophia, Blue Mosque, Grand Bazaar (Sultanahmet) and the secular, European-leaning bar world (Beyoğlu, Karaköy, Kadıköy). A stag here is the most contrast-rich trip you can take within easy reach.",
      "Daytime: Bosphorus cruise (from €5 for the standard route, €30 for private charter), Kapali Çarşı (Grand Bazaar) with souvenir haggling, Hagia Sophia and Blue Mosque (free), or the Princes' Islands (1h ferry, no cars, horse carriages, beach). Turkish bath (hammam) as hangover therapy — Çemberlitaş or Cağaloğlu Hamam from €25 per head.",
      "Evenings: Beyoğlu (around İstiklal Caddesi) is the bar axis: Mikla with skyline views, Karabatak in Karaköy, 360 Istanbul as tourist classic. Kadıköy on the Asian side is the hipster alternative — cheaper, more authentic, livelier.",
    ],
    topActivitySlugs: ["sup", "sailing", "escape_room", "karting", "lasertag", "axe_throwing", "vr_arena", "shooting_range"],
    neighborhoods: [
      { name: "Beyoğlu / İstiklal", tagline: "European-leaning bar axis, cocktail bars, stag-do main base" },
      { name: "Karaköy", tagline: "Hipster district, world-class cocktail bars" },
      { name: "Kadıköy", tagline: "Asian side, authentic, cheaper" },
      { name: "Sultanahmet", tagline: "Tourist axis, Hagia Sophia, Bazaar, cultural programme" },
    ],
    budget: {
      weekend: "€250–€500 per person including flights",
      activity: "€15–€80 per person",
      party: "€25–€80 per person bar tour (cocktail €4–€10)",
    },
    bestSeasons: ["April–June (mild, less crowded)", "September–October (golden autumn, clear Bosphorus)"],
    insiderTips: [
      "Bosphorus cruise: standard tour from Eminönü for €5–€8 as the tourist obligation. Private yacht charter for 6–10 people from €130 — best stag tour in the city.",
      "Hammam experience: €25–€55 per person for a classic Turkish bath with foam treatment. Best hangover therapy worldwide.",
      "Asian side (Kadıköy) by ferry — 30 min on the public ferry, 30% cheaper bars, more authentic crowd, less tourist pressure.",
      "Check the Lira rate — extreme swings. Restaurant and bar prices have effectively halved in recent years. Exchange to Lira, don't pay card on small amounts.",
    ],
    faqs: [
      {
        q: "Is Istanbul safe for a stag?",
        a: "In tourist districts (Sultanahmet, Beyoğlu, Karaköy) very safe. Standard precautions like any big city. Check foreign ministry guidance before travel and avoid political demonstrations.",
      },
      {
        q: "Alcohol in Istanbul — issues?",
        a: "Alcohol in secular districts (Beyoğlu, Karaköy, Kadıköy) is no problem. In Sultanahmet more restrained (mandatory sights). Beer €3–€5, cocktails €6–€10. Turkish raki as cultural obligation.",
      },
      {
        q: "What does an Istanbul stag cost?",
        a: "€250–€500 per person for 3 nights including flight. With the current Lira weakness, one of the cheapest abroad stags in reach — with bar quality on European level.",
      },
      {
        q: "Is a weekend enough?",
        a: "Tight. Three nights ideal: Day 1 Sultanahmet + Bosphorus, Day 2 Bazaar + hammam + Beyoğlu bars, Day 3 Kadıköy + home. The city is huge — plan ruthlessly.",
      },
    ],
    jgaCity: jga("istanbul"),
  },
  {
    slug: "madrid",
    name: "Madrid",
    countryName: "Spain",
    region: "Community of Madrid",
    vibe: "Tapas, late-night bars, royal elegance — the honest Spanish stag beyond beach clichés",
    intro:
      "Madrid is Barcelona's Spanish sister without the tourist beach pressure: more compact, denser bar scene in Malasaña and Chueca, tapas tradition as the main cultural programme. Spaniards party here without the tourism filter of Barcelona.",
    paragraphs: [
      "Madrid works as a stag city because Spanish nightlife starts when other cities close. Tapas until 23:00, bars until 03:00, clubs until 06:00 as standard. Malasaña, Chueca and La Latina are the stag main bases, all within 15 minutes' walk of Sol.",
      "Day programme: Prado Museum for cultural points, Retiro Park, Mercado de San Miguel for the tapas obligation, or a day trip to Toledo (30 min by AVE). Karting, lasertag and escape rooms as dense, cheap activities.",
    ],
    topActivitySlugs: ["karting", "escape_room", "lasertag", "axe_throwing", "vr_arena", "rage_room", "bubble_soccer", "shooting_range"],
    neighborhoods: [
      { name: "Malasaña", tagline: "Hipster district, indie bars, stag-do main base" },
      { name: "La Latina", tagline: "Tapas tradition, Sunday brunch classic" },
      { name: "Chueca", tagline: "Cocktail bars, lively, mixed crowd" },
    ],
    budget: {
      weekend: "€300–€550 per person including flights",
      activity: "€30–€80 per person",
      party: "€40–€80 per person bar tour",
    },
    bestSeasons: ["April–June", "September–October", "Avoid: August (Madrid empties out and is very hot)"],
    insiderTips: [
      "Tapas tour through La Latina on a Sunday morning: traditional programme, stags blend in, best authenticity.",
      "Joy Eslava and Kapital are the tourist mega-clubs (7 storeys). Spaniards prefer Mondo Disko or Hotel Patriotic.",
      "AVE to Toledo: 30 min, half-day UNESCO city with medieval backdrop.",
    ],
    faqs: [
      {
        q: "Madrid or Barcelona for a stag?",
        a: "Barcelona for beach and international crowd. Madrid for authentic Spanish nightlife without tourist pressure.",
      },
      {
        q: "Spanish bars — when to start?",
        a: "Before 22:00 you're alone. Tapas from 20:00, bars busy from 23:00, clubs from 01:00. Adjust your tempo.",
      },
      {
        q: "What does a Madrid stag cost?",
        a: "€300–€500 per person including flight for 3 nights. Comparable with Barcelona, often slightly cheaper.",
      },
    ],
    jgaCity: jga("madrid"),
  },
  {
    slug: "valencia",
    name: "Valencia",
    countryName: "Spain",
    region: "Valencian Community",
    vibe: "Beach, paella, La Tomatina — Barcelona's family-friendly alternative",
    intro:
      "Valencia is Barcelona without the tourist crush: 7 km of city beach, paella's home, the futuristic City of Arts and Sciences architecture, and the El Cabanyal port district as a bar axis.",
    paragraphs: [
      "Valencia has Barcelona's beach vibe without the prices and mass tourism. El Cabanyal directly on the beach for beach stags, El Carmen as the old-town bar cluster, Ruzafa as the hipster district.",
      "Daytime is beach-led, with La Tomatina (August) as a surreal day-trip option, paella cooking class (€40 per head), harbour boat tour, or a day trip to the Albufera lake for sunset cruises.",
    ],
    topActivitySlugs: ["sup", "sailing", "jetski", "beach_volleyball", "karting", "escape_room", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "El Carmen", tagline: "Old-town bar cluster, medieval alleys" },
      { name: "Ruzafa", tagline: "Hipster district, cocktail bars" },
      { name: "El Cabanyal / beach", tagline: "Beach front, beach bars, stag beach programme" },
    ],
    budget: {
      weekend: "€260–€460 per person including flights",
      activity: "€30–€90 per person",
      party: "€35–€70 per person bar tour",
    },
    bestSeasons: ["May–June", "September", "March (Las Fallas)"],
    insiderTips: [
      "Paella cooking class is mandatory — Valencia is the home. Providers from €40 per head for 4h including market tour.",
      "Las Fallas (15–19 March): 1 million visitors, fireworks, stags welcome as falleras — special 6-month lead time.",
      "La Tomatina (last Wednesday in August) in Buñol: day trip, tomato-throwing festival, surreal.",
    ],
    faqs: [
      {
        q: "Valencia or Barcelona — how do they differ?",
        a: "Valencia is quieter, cheaper, with a better beach and more honest atmosphere. Barcelona is livelier and more tourist-saturated.",
      },
      {
        q: "When to go to Valencia?",
        a: "May–June and September for beach weather without peak season. March for the brave: Las Fallas, one of Europe's most unique festivals.",
      },
      {
        q: "What does Valencia cost?",
        a: "€260–€450 per person including flight for 3 nights. One of the cheapest beach options in Western Europe.",
      },
    ],
    jgaCity: jga("valencia"),
  },
  {
    slug: "ibiza",
    name: "Ibiza",
    countryName: "Spain",
    region: "Balearic Islands",
    vibe: "Pacha, Amnesia, the Sunset Strip — electronic escalation island par excellence",
    intro:
      "Ibiza is the premium stag for electronic music crews: Pacha, Amnesia, Ushuaïa as iconic clubs, the Sunset Strip in San Antonio, hippie markets as a daytime breather. Pricier than Mallorca but unmatched for techno/house-oriented grooms.",
    paragraphs: [
      "Ibiza only works for a specific crew: electronic music as primary motivation, budget over €500 per head, May–September season. Outside the season Ibiza is a quiet island with no stag infrastructure.",
      "Day programme: boat charter around Formentera (€300–€600 per day for 8–10 people, best stag tour option), beach day at Cala Comte or Es Vedrà, Sunset Strip at Café del Mar or Mambo. Pacha entry €60–€80 per head, drinks from €15.",
    ],
    topActivitySlugs: ["sailing", "sup", "jetski", "wakeboarding", "beach_volleyball", "escape_room", "karting", "vr_arena"],
    neighborhoods: [
      { name: "Playa d'en Bossa", tagline: "Beach clubs Ushuaïa, Hï Ibiza — stag main axis" },
      { name: "San Antonio", tagline: "Sunset Strip, younger crowd, cheaper" },
      { name: "Ibiza Town (Eivissa)", tagline: "Old town, Pacha, smarter restaurants" },
    ],
    budget: {
      weekend: "€600–€1200 per person (premium season)",
      activity: "€80–€250 per person (boat trip = main cost)",
      party: "€150–€300 per person club night (entry + drinks)",
    },
    bestSeasons: ["May (season start, cheaper)", "September (closing parties)", "Avoid: July–August (premium prices)"],
    insiderTips: [
      "Boat charter to Formentera for 8–10 people: €400–€700 for 6h — cheapest per-head price for an Ibiza escalation programme.",
      "Closing Parties in early September: legendary, tickets 6 months ahead.",
      "Hotel strategy: AirBnB in the middle of the island (Santa Gertrudis) much cheaper than beach hotels, with a hire car for flexibility.",
    ],
    faqs: [
      {
        q: "Is an Ibiza stag worth the money?",
        a: "Only for electronic-music crews with budgets over €700 per head. For standard stags, Mallorca or Magaluf are cheaper and similarly escalation-capable.",
      },
      {
        q: "Pacha or Amnesia?",
        a: "Pacha for the classic and a smarter crowd, Amnesia for rougher and techno-focused. Both pantheon, once-in-a-lifetime.",
      },
      {
        q: "What does one Pacha night cost?",
        a: "Entry €60–€80, beer €12, cocktail €18–€22. One Pacha night = €200 per head all-in. Plan realistically.",
      },
    ],
    jgaCity: jga("ibiza"),
  },
  {
    slug: "rome",
    name: "Rome",
    countryName: "Italy",
    region: "Lazio",
    vibe: "Colosseum, pasta, aperitivo — stag with antique backdrop and Roman drinking culture",
    intro:
      "Rome is the stag city with the most spectacular tourist backdrop in Europe. Colosseum, Vatican, Trevi Fountain by day — Trastevere, Monti, Testaccio by night for aperitivo, pasta and bar crawls off the tourist axis.",
    paragraphs: [
      "Rome works for stags on two tracks: by day a condensed world-culture trip (Colosseum, Vatican, Roman Forum), by night a bar-and-pasta tour through Trastevere and Monti. Italians drink aperitivo between 19:00–21:00 with free snack buffets — Europe's cheapest pre-drinks.",
      "Day activities: Vespa tour through the city (€60–€80 per head for 3h), wine tasting in Frascati (45 min south), karting, day trip to Tivoli (Villa d'Este).",
    ],
    topActivitySlugs: ["karting", "escape_room", "axe_throwing", "vr_arena", "lasertag", "shooting_range", "bubble_soccer", "rage_room"],
    neighborhoods: [
      { name: "Trastevere", tagline: "Touristy but alive, stag bar axis, trattoria obligation" },
      { name: "Monti", tagline: "Hipper, cocktail bars, creative crowd" },
      { name: "Testaccio", tagline: "Authentically Roman, less tourist, pasta tradition" },
    ],
    budget: {
      weekend: "€380–€650 per person including flights",
      activity: "€40–€100 per person",
      party: "€50–€100 per person bar tour",
    },
    bestSeasons: ["April–June", "September–October", "Avoid high summer (hot, tourist mania)"],
    insiderTips: [
      "Aperitivo tradition: 19:00–21:00, €8–€12 cocktail with free buffet (salami, cheese, pasta salad). Mandatory pre-drink.",
      "Vespa tour: €60 per head for 3h through Rome, Colosseum photo guaranteed.",
      "Visit the Vatican before 9 AM — after that, 2h queues. Book tickets online.",
    ],
    faqs: [
      {
        q: "Does Rome fit a stag?",
        a: "For culturally minded crews with tolerance for tourist obligations, yes. For pure escalation, Milan or Mallorca.",
      },
      {
        q: "What is an aperitivo?",
        a: "Italian tradition: cocktail (€8–€12) between 19:00–21:00 including free snack buffet. Best pre-drink option in Europe.",
      },
      {
        q: "What does a Rome stag cost?",
        a: "€380–€600 per person for 3 nights including flight. Pricier than Milan, cheaper than Paris.",
      },
    ],
    jgaCity: jga("rom"),
  },
  {
    slug: "milan",
    name: "Milan",
    countryName: "Italy",
    region: "Lombardy",
    vibe: "Fashion, aperitivo, Navigli — Italy's smarter stag city with cocktail tradition",
    intro:
      "Milan is the stag city for style-aware crews. Italy's fashion capital, with the Navigli canals as the bar axis, aperitivo tradition at the highest level, and cocktail bars (Camparino, Bar Basso) at world-class level.",
    paragraphs: [
      "Milan works differently from Rome: less cultural trip, more bar and aperitivo tour. Navigli (canals in the south) and Brera (artist district) are the stag bar clusters, Duomo and Galleria only as quick tourist stops.",
      "Day programme: Milan Cathedral + Galleria (1h is enough), boat tour on the Navigli, day trip to Lake Como (45 min by train — George Clooney villa backdrop, iconic). Karting and escape rooms as dense activities.",
    ],
    topActivitySlugs: ["karting", "escape_room", "sailing", "lasertag", "axe_throwing", "vr_arena", "bubble_soccer", "shooting_range"],
    neighborhoods: [
      { name: "Navigli", tagline: "Canals, bar cluster, aperitivo main axis" },
      { name: "Brera", tagline: "Artist district, smarter bars, upscale aperitivo" },
      { name: "Porta Romana", tagline: "Younger crowd, lively bars, less touristy" },
    ],
    budget: {
      weekend: "€420–€720 per person including flights",
      activity: "€45–€120 per person",
      party: "€60–€120 per person bar tour (cocktail €12–€18)",
    },
    bestSeasons: ["April–June", "September–October", "Avoid high summer (hot, locals flee)"],
    insiderTips: [
      "Aperitivo at Naviglio Grande: Spritz €8 + free buffet. Stag goldstandard for 3h pre-drinks session.",
      "Lake Como as a half-day trip: Bellagio, Como, George Clooney villa from the ferry — Milan cliché in pure form.",
      "Bar Basso: invented the Negroni Sbagliato. Stag pilgrimage for cocktail crews.",
    ],
    faqs: [
      {
        q: "Milan or Rome for a stag?",
        a: "Milan for cocktail tradition, style and Lake Como as bonus. Rome for historic backdrop and pasta authenticity. Milan pricier, more compact, more stag-friendly.",
      },
      {
        q: "What makes Milan's aperitivo special?",
        a: "Best buffets, longest tradition (invented on the Navigli), cocktail bars at world-class level. Milanese aperitivo is its own discipline.",
      },
      {
        q: "What does Milan cost?",
        a: "€420–€700 per person for 3 nights. One of the pricier Italian options, but cocktail quality is premium.",
      },
    ],
    jgaCity: jga("mailand"),
  },
  {
    slug: "florence",
    name: "Florence",
    countryName: "Italy",
    region: "Tuscany",
    vibe: "Renaissance, Chianti, Ponte Vecchio — stag for cultural crews with a wine focus",
    intro:
      "Florence is the stag city for stylish crews: Renaissance backdrop, Chianti vineyards 30 min by car, bar scene around Piazza Santo Spirito. Small, compact, with a tourist density that forces stags to position themselves cleverly.",
    paragraphs: [
      "Florence works for stags as a combination of Renaissance day programme (Uffizi, Duomo, Michelangelo's David) and Chianti winery tour (45 min south, from €80 per head for a half-day programme including lunch). At night, Piazza Santo Spirito and Oltrarno as the more honest alternative to the tourist axis.",
      "Activity-wise lighter than Italian metropolises, but with winery tours as the top activity. Day trips to Pisa, Lucca or Siena all reachable in 1h.",
    ],
    topActivitySlugs: ["karting", "escape_room", "climbing", "lasertag", "axe_throwing", "vr_arena", "shooting_range", "bubble_soccer"],
    neighborhoods: [
      { name: "Oltrarno / Santo Spirito", tagline: "Left bank of the Arno, bar cluster, honestly Tuscan" },
      { name: "Centro Storico", tagline: "Tourist main axis, Duomo, classic restaurants" },
      { name: "Sant'Ambrogio", tagline: "Market district, local bars, less tourist" },
    ],
    budget: {
      weekend: "€400–€680 per person including flights",
      activity: "€40–€120 per person",
      party: "€50–€90 per person bar tour",
    },
    bestSeasons: ["April–May", "September–October", "Avoid high summer (tourist mania)"],
    insiderTips: [
      "Chianti winery tour: €80–€120 per head for half-day programme including lunch + 4–5 wines — top Italian stag highlight.",
      "Piazzale Michelangelo at sunset: free panoramic stage. Mandatory photo.",
      "Centro Storico for tourist-duty hours, then over the Arno for honest evening bars.",
    ],
    faqs: [
      {
        q: "Florence for a stag — too small?",
        a: "Tight. Two nights ideal, three with Chianti tour on Day 2. Four nights drag.",
      },
      {
        q: "Tuscany wine tour — worth it?",
        a: "Mandatory programme. Best Italian stag memory. Operators with bus + guide from €80 per head for 5h including lunch.",
      },
      {
        q: "What does Florence cost?",
        a: "€400–€650 per person for 3 nights. One of the pricier Italian options, especially in peak season.",
      },
    ],
    jgaCity: jga("florenz"),
  },
  {
    slug: "porto",
    name: "Porto",
    countryName: "Portugal",
    region: "Norte",
    vibe: "Port wine, Douro, azulejos — Portugal's wine stag capital",
    intro:
      "Porto is the Portuguese wine stag: Port wine cellars on the Douro bank, hilly old town with azulejo facades, lively nightlife along the Galerias axis. Lisbon's more authentic, honest sister.",
    paragraphs: [
      "Porto works for stags for three reasons: Port wine tour with tastings in Vila Nova de Gaia (cellars like Sandeman, Cálem, Graham's — €15–€25 per head including 3 wines), Douro cruise, and Galerias de Paris as the bar cluster with outdoor drinking until 03:00.",
      "Day trip: Douro Valley as wine region (train accessible, 1h), surf lessons in Matosinhos (beach 20 min out), or a city walking tour along the historic axis.",
    ],
    topActivitySlugs: ["sailing", "sup", "karting", "escape_room", "axe_throwing", "lasertag", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "Ribeira / Vila Nova de Gaia", tagline: "Douro bank, Port wine cellars, touristy but mandatory" },
      { name: "Galerias de Paris", tagline: "Bar cluster, outdoor drinking, stag-do main axis" },
      { name: "Cedofeita", tagline: "Hipper district, creative crowd, indie bars" },
    ],
    budget: {
      weekend: "€280–€500 per person including flights",
      activity: "€25–€80 per person",
      party: "€30–€65 per person bar tour",
    },
    bestSeasons: ["April–June", "September–October"],
    insiderTips: [
      "Port wine cellar tour: 3 cellars in one afternoon — Cálem, Sandeman, Taylor's. Each €15–€25 entry + tasting.",
      "Galerias de Paris street: 10+ bars in 200 m, outdoor drinking legal, stag-friendly.",
      "Douro Valley day trip: 1h by train (one of Europe's most beautiful rail routes), wine tasting in Pinhão.",
    ],
    faqs: [
      {
        q: "Porto or Lisbon for a stag?",
        a: "Lisbon is bigger, livelier, with Bairro Alto as the main axis. Porto is more authentic, with Port wine as the distinctive feature. First Portugal stag: Lisbon. Second: Porto.",
      },
      {
        q: "Port wine cellars mandatory?",
        a: "Definitely. Three in one afternoon, stag photo on the Douro guaranteed.",
      },
      {
        q: "What does Porto cost?",
        a: "€280–€480 per person for 3 nights including flight. One of the cheapest western European options.",
      },
    ],
    jgaCity: jga("porto"),
  },
  {
    slug: "warsaw",
    name: "Warsaw",
    countryName: "Poland",
    region: "Masovia",
    vibe: "Praga, vodka, post-war rebuild — Poland's underrated capital stag",
    intro:
      "Warsaw is Krakow's bigger, louder, more modern sister: Praga as bar district, vodka bar tradition, rebuilt UNESCO old town. Cheaper than Krakow, denser nightlife.",
    paragraphs: [
      "Warsaw beats Krakow on size and club density: Praga (right of the Vistula) as indie bar cluster, old town for tourist programme, Nowy Świat as main bar axis. Vodka bars like Pijalnia Wódki i Piwa as stag standard.",
      "Day programme: Warsaw Uprising Museum (for reflective crews), Łazienki Park, karting, escape rooms (Warsaw invented the modern escape room format).",
    ],
    topActivitySlugs: ["karting", "escape_room", "shooting_range", "lasertag", "axe_throwing", "vr_arena", "rage_room", "bubble_soccer"],
    neighborhoods: [
      { name: "Praga (right of the Vistula)", tagline: "Indie bar cluster, creative crowd, authentic" },
      { name: "Nowy Świat", tagline: "Main bar axis, classic pubs, stag-friendly" },
      { name: "Old Town (Stare Miasto)", tagline: "Rebuilt UNESCO backdrop, tourist obligation" },
    ],
    budget: {
      weekend: "€180–€400 per person including flights",
      activity: "€15–€70 per person",
      party: "€20–€50 per person bar tour (vodka shot €1.50)",
    },
    bestSeasons: ["May–September"],
    insiderTips: [
      "Pijalnia Wódki i Piwa as a vodka bar chain: €1.50 vodka, €1.50 beer, local snacks, stag standard stop.",
      "Escape rooms in Warsaw are world-class — the city invented the modern format.",
      "Praga (the bar district, not Prague) as an insider tip — 10 min by tram from the old town.",
    ],
    faqs: [
      {
        q: "Warsaw or Krakow?",
        a: "Krakow is more compact, culturally denser, with Wieliczka and Auschwitz as day trips. Warsaw has denser nightlife and is cheaper.",
      },
      {
        q: "Vodka bar tradition?",
        a: "Polish mandatory culture: €1.50 per shot, with local pickles as accompaniment. Pijalnia Wódki i Piwa as a chain with 10+ locations.",
      },
      {
        q: "What does Warsaw cost?",
        a: "€180–€380 per person for 3 nights. One of Europe's cheapest capitals.",
      },
    ],
    jgaCity: jga("warschau"),
  },
  {
    slug: "athens",
    name: "Athens",
    countryName: "Greece",
    region: "Attica",
    vibe: "Acropolis, Plaka, Tsipouro — Greek stag with antique backdrop and Mediterranean nightlife",
    intro:
      "Athens is the most underrated Mediterranean stag city: Acropolis as spectacular backdrop, Psiri and Gazi as lively bar districts, Tsipouro and Ouzo as the cultural alcohol tradition. Cheaper than Lisbon, similarly warm.",
    paragraphs: [
      "Athens works for stags for two reasons: a unique antique backdrop (Acropolis, Plaka as free photo backgrounds) and a lively bar district in Gazi and Psiri that runs until 04:00. Tsipouro bars as mandatory culture, cocktail bars in Kolonaki for upscale pre-drinks.",
      "Day programme: Acropolis in the morning (before 10:00), day trip to Cape Sounion temple or the Saronic Islands (Aegina, Poros), beach day in Glyfada or Vouliagmeni.",
    ],
    topActivitySlugs: ["sup", "sailing", "karting", "escape_room", "axe_throwing", "vr_arena", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Psiri", tagline: "Lively bar axis, live music, stag-do main base" },
      { name: "Gazi", tagline: "Club district, industrial backdrop, younger crowd" },
      { name: "Plaka", tagline: "Tourist district under the Acropolis, classic tavernas" },
    ],
    budget: {
      weekend: "€280–€500 per person including flights",
      activity: "€25–€80 per person",
      party: "€30–€70 per person bar tour",
    },
    bestSeasons: ["April–June", "September–October (high summer is extremely hot, avoid)"],
    insiderTips: [
      "Visit the Acropolis before 10:00 (heat, tourist masses) — then Plaka for Greek breakfast.",
      "Tsipouro bar in Psiri: Greek pomace brandy, mandatory cultural duty.",
      "Saronic Islands day trip by ferry: Aegina, Poros, Hydra in one day, €90 per head.",
    ],
    faqs: [
      {
        q: "Does Athens fit a stag?",
        a: "For culturally minded crews with Mediterranean vibe and antique affinity, yes. Pure escalation stags, Mallorca.",
      },
      {
        q: "Athens in high summer?",
        a: "Avoid. July/August 40°C+, the city half-empty, locals flee. May–June or September optimal.",
      },
      {
        q: "What does Athens cost?",
        a: "€280–€480 per person for 3 nights including flight. One of the cheapest Mediterranean capitals.",
      },
    ],
    jgaCity: jga("athen"),
  },
  {
    slug: "copenhagen",
    name: "Copenhagen",
    countryName: "Denmark",
    region: "Capital Region",
    vibe: "Hygge, Nyhavn, craft beer — Danish elegance stag with designer bar tradition",
    intro:
      "Copenhagen is the stag city for Scandinavian-stylish crews. Nyhavn as postcard backdrop, Vesterbro as the bar district, with Danish craft beer tradition (Mikkeller, To Øl) and cocktail bars at world-class level. Pricey like London but more compact.",
    paragraphs: [
      "Copenhagen works for stags for two reasons: a high-quality bar scene (craft beer + cocktails at international top level) and a compact centre with cycling culture — a crew moves around faster by bike than by taxi. Vesterbro and Nørrebro as stag main axes.",
      "Day programme: Nyhavn photo walk, Tivoli (amusement park as stag playground), Christiania (alternative city-within-city), day trip to Frederiksborg Castle or Helsingør.",
    ],
    topActivitySlugs: ["sup", "sailing", "karting", "escape_room", "climbing", "axe_throwing", "vr_arena", "lasertag"],
    neighborhoods: [
      { name: "Vesterbro", tagline: "Hipper district, craft beer bars, Mikkeller home" },
      { name: "Nørrebro", tagline: "Multicultural, lively, stag bar alternative" },
      { name: "Indre By (Centrum)", tagline: "Tourist main axis, Nyhavn, classic bars" },
    ],
    budget: {
      weekend: "€550–€900 per person including flights (Denmark is very expensive)",
      activity: "€50–€150 per person",
      party: "€80–€150 per person bar tour (beer €8–€10)",
    },
    bestSeasons: ["May–September (long days, bar garden season)"],
    insiderTips: [
      "Mikkeller bar tour: Danish craft beer empire, 5+ locations in Copenhagen, mandatory stag programme.",
      "Bike rental: cheapest transport, the crew splits up easily — Copenhagen is Europe's bike capital.",
      "Christiania walk: alternative self-governed city-within-city, free, culturally unique.",
    ],
    faqs: [
      {
        q: "Is Copenhagen worth the cost?",
        a: "For crews with budgets over €600 per head and an affinity for craft beer / cocktail bars, yes. For budget crews, Prague or Budapest.",
      },
      {
        q: "Beer prices really that high?",
        a: "Yes. €8–€10 per beer in bars, €4–€6 at supermarkets. Plan stag budget realistically.",
      },
      {
        q: "What does a Copenhagen stag cost?",
        a: "€550–€850 per person for 3 nights including flight. One of Europe's most expensive options.",
      },
    ],
    jgaCity: jga("kopenhagen"),
  },
  {
    slug: "stockholm",
    name: "Stockholm",
    countryName: "Sweden",
    region: "Stockholm County",
    vibe: "Archipelago, Gamla Stan, clubs — Swedish premium stag with island landscape",
    intro:
      "Stockholm is the stag city for crews wanting Scandinavian design plus premium club culture. 14 islands, Gamla Stan as tourist backdrop, Södermalm as hipster district, Stureplan as the upscale bar quarter. Pricey like Copenhagen.",
    paragraphs: [
      "Stockholm works because of its unique geography: 14 islands linked by bridges and ferries, archipelago islands as a day trip. Södermalm (the SoFo neighbourhood) as hipster stag main base, Stureplan for a smarter bar crawl, Östermalm for upscale pre-drinks.",
      "Day programme: archipelago boat tour (Vaxholm or Sandhamn — best Sweden experience), ABBA Museum (tourist obligation for 80s lovers), Vasa Museum.",
    ],
    topActivitySlugs: ["sailing", "sup", "karting", "escape_room", "climbing", "axe_throwing", "vr_arena", "wakeboarding"],
    neighborhoods: [
      { name: "Södermalm (SoFo)", tagline: "Hipster district, indie bars, stag-do main base" },
      { name: "Stureplan", tagline: "Smarter bar quarter, clubs, upscale crowd" },
      { name: "Gamla Stan", tagline: "Old-town island, touristy but picturesque" },
    ],
    budget: {
      weekend: "€600–€1000 per person including flights",
      activity: "€60–€180 per person",
      party: "€90–€180 per person bar tour",
    },
    bestSeasons: ["May–August (midsummer, archipelago season)", "December (snow stag as special)"],
    insiderTips: [
      "Archipelago boat tour to Vaxholm: 1h ferry northeast, island-hopping, stag photo on rocks by the sea.",
      "Stureplan clubs (Sturecompagniet, Hell's Kitchen) are expensive but stag-do tourist obligation.",
      "Midsummer (June): sun barely sets, long bar evenings possible.",
    ],
    faqs: [
      {
        q: "Stockholm or Copenhagen?",
        a: "Stockholm has the archipelago as a unique bonus. Copenhagen is more compact, with better craft beer bars. Similar prices.",
      },
      {
        q: "Archipelago day trip — worth it?",
        a: "Mandatory programme. Best Sweden stag story. Ferries from Strandvägen, from €30 per head for day passes.",
      },
      {
        q: "What does Stockholm cost?",
        a: "€600–€900 per person for 3 nights including flight. One of Europe's most expensive options.",
      },
    ],
    jgaCity: jga("stockholm"),
  },
  {
    slug: "tallinn",
    name: "Tallinn",
    countryName: "Estonia",
    region: "Harju County",
    vibe: "Medieval, Telliskivi, sauna — the Baltic insider with Prague prices",
    intro:
      "Tallinn is the Baltic insider tip: UNESCO medieval old town, Telliskivi hipster district, traditional Estonian sauna culture, and prices on a Krakow level. Direct flights from major DACH cities in 2h.",
    paragraphs: [
      "Tallinn combines two worlds: one of Europe's best-preserved medieval old towns and Telliskivi — a former industrial site that has become one of Northern Europe's most vibrant hipster quarters. Bar density high, prices low, crowd locally authentic.",
      "Day programme: old town walk (1–2h is enough), sauna experience (Estonian tradition, from €25 per head), day trip to Helsinki (2h ferry).",
    ],
    topActivitySlugs: ["karting", "escape_room", "shooting_range", "axe_throwing", "vr_arena", "rage_room", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Telliskivi", tagline: "Hipster industrial site, indie bars, stag-do main base" },
      { name: "Old Town (Vanalinn)", tagline: "UNESCO medieval, classic bars, tourist duty" },
      { name: "Kalamaja", tagline: "Wooden-house district, alternative crowd" },
    ],
    budget: {
      weekend: "€230–€420 per person including flights",
      activity: "€20–€80 per person",
      party: "€25–€55 per person bar tour",
    },
    bestSeasons: ["May–September", "December (Christmas market — best-known in Northeastern Europe)"],
    insiderTips: [
      "Estonian sauna experience: traditional smoke sauna (Suitsusaun), a stag programme unique in Europe.",
      "Telliskivi: old railway works, now 30+ bars and restaurants in former factory halls.",
      "Helsinki day trip: 2h ferry, same-day return possible, double-capital bonus.",
    ],
    faqs: [
      {
        q: "Tallinn for a stag — really?",
        a: "Yes, one of Europe's most underrated insider tips. Prices like Krakow, bar quality like Copenhagen, unique sauna tradition.",
      },
      {
        q: "Is English enough?",
        a: "No problem. Estonians have high English proficiency, Tallinn is internationally oriented.",
      },
      {
        q: "What does Tallinn cost?",
        a: "€230–€400 per person for 3 nights including flight. One of Europe's cheapest capitals.",
      },
    ],
    jgaCity: jga("tallinn"),
  },
  {
    slug: "bucharest",
    name: "Bucharest",
    countryName: "Romania",
    region: "Bucharest",
    vibe: "Little Paris, Old Town, shooting range — Eastern Europe's growing stag city with wild-west bar scene",
    intro:
      "Bucharest is the growing stag destination: Old Town (Lipscani) as the bar axis, shooting-range and activity infrastructure that competes with Prague, prices even cheaper. For crews who want real off-the-beaten-path energy.",
    paragraphs: [
      "Bucharest combines a wild-west bar scene with surprisingly developed activity infrastructure: shooting-range experiences (much more relaxed than DE), karting, escape rooms. Lipscani (Old Town) as stag-do main axis, with bars like Old City Bar, Shoteria, Bordello's.",
      "Day programme: Palace of the Parliament (world's second-largest building, tourist duty), Therme București (mega thermal complex 30 min outside), day trip to Sinaia (Peles Castle in the Carpathians, 2h by train).",
    ],
    topActivitySlugs: ["shooting_range", "karting", "escape_room", "axe_throwing", "vr_arena", "rage_room", "lasertag", "bubble_soccer"],
    neighborhoods: [
      { name: "Lipscani (Old Town)", tagline: "Bar axis, tourist classic, stag-do main base" },
      { name: "Calea Victoriei", tagline: "Smarter bars, upscale restaurants" },
      { name: "Floreasca", tagline: "Local bar scene, less tourist" },
    ],
    budget: {
      weekend: "€180–€380 per person including flights",
      activity: "€15–€70 per person",
      party: "€20–€50 per person bar tour",
    },
    bestSeasons: ["May–September"],
    insiderTips: [
      "Therme București: mega wellness complex with 16 pools, stag-friendly, €35 per head for a day card.",
      "Shooting range experience with AK-47, Glock, M4: from €70 per head for 4 weapons — Prague level.",
      "Sinaia day trip: Peles Castle, Carpathian backdrop, 2h by train, perfect brunch alternative.",
    ],
    faqs: [
      {
        q: "Bucharest safe for a stag?",
        a: "Safe in the Old Town and touristy areas. Standard precautions like any big city.",
      },
      {
        q: "Bucharest or Sofia?",
        a: "Bucharest has more stag infrastructure and Old-Town density. Sofia is cheaper and culturally more distinctive.",
      },
      {
        q: "What does Bucharest cost?",
        a: "€180–€350 per person for 3 nights including flight. One of Europe's cheapest capitals.",
      },
    ],
    jgaCity: jga("bukarest"),
  },
  {
    slug: "brussels",
    name: "Brussels",
    countryName: "Belgium",
    region: "Brussels-Capital",
    vibe: "Beer, frites, Atomium — Belgium's beer-stag capital with European mainstream vibe",
    intro:
      "Brussels is the stag capital for beer crews: Delirium Café (over 2000 beer varieties, Guinness record), monastery beer tradition, compact centre with bar cluster around the Grand Place. Limited activity density, but unique beer culture.",
    paragraphs: [
      "Brussels works for beer-oriented stags: Delirium Café as the iconic destination, monastery beer specialty bars like Moeder Lambic, A la Mort Subite. Grand Place as the tourist backdrop, Saint-Géry district as the bar main axis.",
      "Day trips: Bruges (1h by train — one of Europe's most beautiful cities), Antwerp (45 min, diamond district + bars), brewery tours nearby.",
    ],
    topActivitySlugs: ["karting", "escape_room", "lasertag", "axe_throwing", "vr_arena", "bubble_soccer", "shooting_range", "rage_room"],
    neighborhoods: [
      { name: "Saint-Géry / Sainte-Catherine", tagline: "Bar main axis, cocktails, beer specialty bars" },
      { name: "Grand Place", tagline: "Tourist backdrop, Delirium Café, classic restaurants" },
      { name: "Ixelles", tagline: "Hipster district, creative bars, less tourist" },
    ],
    budget: {
      weekend: "€320–€560 per person including train/flight",
      activity: "€30–€90 per person",
      party: "€45–€90 per person bar tour",
    },
    bestSeasons: ["April–September"],
    insiderTips: [
      "Delirium Café: 2000+ beer varieties, Guinness record, mandatory photo stop.",
      "Bruges day trip: 1h by train, one of Europe's most beautiful cities, perfect Sunday brunch alternative.",
      "Frites tour: Belgian frite stalls (Maison Antoine, Frit Flagey) as cultural obligation between bars.",
    ],
    faqs: [
      {
        q: "Brussels or Amsterdam for a beer stag?",
        a: "Brussels for monastery beer and specialty brews (Delirium Café unmatched). Amsterdam for general beer + coffeeshop mix.",
      },
      {
        q: "How to get to Brussels?",
        a: "Thalys from Cologne/Aachen in 2h. Flights from DE €50–€150. Eurostar from London.",
      },
      {
        q: "What does Brussels cost?",
        a: "€320–€550 per person for 3 nights. Mid-tier European pricing.",
      },
    ],
    jgaCity: jga("bruessel"),
  },
  {
    slug: "nice",
    name: "Nice",
    countryName: "France",
    region: "Provence-Alpes-Côte d'Azur",
    vibe: "Promenade des Anglais, Provence, Monaco day trips — stag do with Riviera glamour",
    intro:
      "Nice is the stag city for Mediterranean glamour: Promenade des Anglais, Vieux Nice with lively bars, Côte d'Azur weather, Monaco and Cannes as day trips. Pricier than Barcelona but unrivalled for premium beach crews.",
    paragraphs: [
      "Nice works for stags for two reasons: the Côte d'Azur location with beach in the city, and the day trip options (Monaco 25 min, Cannes 30 min, Antibes 20 min). Vieux Nice as the bar cluster with hundreds of bars in the medieval old town.",
      "Day programme: beach on the Promenade des Anglais, day trip to Monaco (casino, yacht harbour — stag photo spots), day trip to Cannes (Croisette, promenade), boat charter from the harbour.",
    ],
    topActivitySlugs: ["sup", "sailing", "jetski", "beach_volleyball", "karting", "escape_room", "wakeboarding", "vr_arena"],
    neighborhoods: [
      { name: "Vieux Nice", tagline: "Medieval old town, bar cluster, stag-do main base" },
      { name: "Promenade des Anglais", tagline: "Beach front, tourist axis, beach bars" },
      { name: "Harbour district", tagline: "Yachts, upscale bars, smarter" },
    ],
    budget: {
      weekend: "€450–€800 per person including flights (Côte d'Azur is premium)",
      activity: "€50–€150 per person",
      party: "€70–€130 per person bar tour",
    },
    bestSeasons: ["May–June", "September (locals back, lively)"],
    insiderTips: [
      "Monaco day trip: 25 min by train, casino photo, harbour walk, same-day programme.",
      "Boat charter from Nice harbour: 8–10 people, half day, from €400 — best Côte d'Azur stag photo opportunity.",
      "Cours Saleya market in the morning, Vieux Nice in the evening — perfect stag day flow.",
    ],
    faqs: [
      {
        q: "Nice or Barcelona for a beach stag?",
        a: "Barcelona is cheaper and livelier. Nice has Riviera glamour, Monaco and Cannes as bonus. Premium crews pick Nice.",
      },
      {
        q: "Monaco day trip — worth it?",
        a: "Definitely. 25 min train, casino photo, yacht harbour — best Côte d'Azur stag photo material.",
      },
      {
        q: "What does Nice cost?",
        a: "€450–€750 per person for 3 nights including flight. One of Europe's pricier beach options.",
      },
    ],
    jgaCity: jga("nizza"),
  },
];

export function getStagDoCityBySlug(slug: string): StagDoCity | undefined {
  return STAG_DO_CITIES.find((c) => c.slug === slug.toLowerCase());
}
