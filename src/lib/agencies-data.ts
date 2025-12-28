// JGA Agencies Data - Organized by Country and City

export interface Agency {
  id: number;
  country: string;
  countryCode: string;
  city: string;
  name: string;
  website: string;
  phone: string;
  email: string;
  description: string;
}

export const AGENCIES: Agency[] = [
  // Deutschland
  { id: 1, country: "Deutschland", countryCode: "DE", city: "Berlin", name: "JaJoCo GmbH (JGA Berlin)", website: "https://www.jga-berlin.com/", phone: "030 50154408", email: "info@jajoco.com", description: "Spezialist für unvergessliche Junggesellen- und Junggesellinnenabschiede in Berlin mit Fokus auf Aktivitäten und Planung." },
  { id: 2, country: "Deutschland", countryCode: "DE", city: "Berlin", name: "Pissup Reisen", website: "https://www.pissup.de/junggesellenabschied-berlin/", phone: "+49-800-723-7979", email: "hallo@pissup.de", description: "Deutschlands Nr. 1 JGA-Agentur, organisiert Partyreisen und bietet über 60 Aktivitäten in Berlin an." },
  { id: 3, country: "Deutschland", countryCode: "DE", city: "Berlin", name: "JGA Buddies", website: "https://jga-buddies.de/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Bietet abwechslungsreiche Stadtrallyes und Aktivitäten für JGAs in Berlin und über 180 Städten in Europa." },
  { id: 4, country: "Deutschland", countryCode: "DE", city: "Hamburg", name: "jga.hamburg", website: "https://www.jga.hamburg/", phone: "030 50154408", email: "info@jajoco.com", description: "Eventagentur, die JGA in Hamburg organisiert mit Aktivitäten wie Axtwerfen, Barkassenfahrten und Bubble Soccer." },
  { id: 5, country: "Deutschland", countryCode: "DE", city: "Hamburg", name: "JGA Hamburg / Eventsport Hamburg", website: "https://j-g-a-hamburg.de/", phone: "04018033273", email: "info@eventsport-hamburg.de", description: "Spezialisiert auf JGA-Aktivitäten in Hamburg mit Fokus auf sportliche Events wie Bubble Ball Soccer." },
  { id: 6, country: "Deutschland", countryCode: "DE", city: "Hamburg", name: "JGA-Party.com", website: "https://hamburg.jga-party.com/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Spezialist für JGA in Hamburg mit Partybooten, Partypaketen und Transfer-Optionen." },
  { id: 7, country: "Deutschland", countryCode: "DE", city: "München", name: "JGA-Party.com München", website: "https://muenchen.jga-party.com/index.php/de/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Agentur für individuelle JGA in München mit Fokus auf Party-Aktivitäten und Paketen." },
  { id: 8, country: "Deutschland", countryCode: "DE", city: "München", name: "Munich Stag Do", website: "https://munichstagdo.com/de/", phone: "+447466471756", email: "info@munichstagdo.com", description: "Spezialist für Junggesellenabschiede in München mit Fokus auf Aktivitäten und Party-Paketen." },
  { id: 9, country: "Deutschland", countryCode: "DE", city: "München", name: "Junggesellenabschied München", website: "https://junggesellenabschiedmuenchen.de/", phone: "", email: "info@junggesellenabschiedmuenchen.de", description: "Agentur für kreative, kulinarische und actionreiche Events für JGAs in München." },
  { id: 10, country: "Deutschland", countryCode: "DE", city: "Köln", name: "Pissup Reisen Köln", website: "https://www.pissup.de/junggesellenabschied-koeln/", phone: "0322-218-50015", email: "hallo@pissup.de", description: "Deutschlands Nr. 1 Agentur für JGA-Reisen und Aktivitäten in Köln mit über 80 Aktivitäten." },
  { id: 11, country: "Deutschland", countryCode: "DE", city: "Köln", name: "JaJoCo GmbH Köln", website: "https://www.junggesellenabschied-koeln.com/", phone: "030 50154408", email: "info@jajoco.com", description: "Eventagentur für JGA in Köln, betrieben von JaJoCo GmbH." },
  { id: 12, country: "Deutschland", countryCode: "DE", city: "Köln", name: "Herzbluttiger Events", website: "https://herzbluttigerevents.de/junggesellenabschied/", phone: "+49 (0) 228 929 826 27", email: "info@herzbluttigerevents.de", description: "Rheinische Eventagentur für JGA-Events in Köln und Umgebung." },
  { id: 13, country: "Deutschland", countryCode: "DE", city: "Frankfurt", name: "Mister Neo Frankfurt", website: "https://junggesellenabschiedfrankfurt.de/", phone: "", email: "info@junggesellenabschiedfrankfurt.de", description: "Organisation von JGA in Frankfurt mit Tastings, Sport- & Action-Events und Party-Touren." },
  { id: 14, country: "Deutschland", countryCode: "DE", city: "Frankfurt", name: "UnserJGA.de", website: "https://unserjga.de/jga-frankfurt/", phone: "0228/97663", email: "info@unserjga.de", description: "Deutschlandweite JGA Agentur mit Rallyes, Touren und Events in Frankfurt." },
  { id: 15, country: "Deutschland", countryCode: "DE", city: "Frankfurt", name: "CityGames Frankfurt", website: "https://citygamesfrankfurt.de/fun-touren/", phone: "+49 (0) 69 / 977611990", email: "info@citygamesfrankfurt.de", description: "Spezialisiert auf interaktive JGA Touren und Rallyes in Frankfurt." },
  { id: 16, country: "Deutschland", countryCode: "DE", city: "Düsseldorf", name: "Pissup Düsseldorf", website: "https://www.pissup.de/junggesellenabschied-duesseldorf/", phone: "+49-800-723-7979", email: "hallo@pissup.de", description: "Internationale Agentur für JGA in Düsseldorf mit über 50 Aktivitäten." },
  { id: 17, country: "Deutschland", countryCode: "DE", city: "Düsseldorf", name: "JGA Düsseldorf (R-Events)", website: "https://www.xn--jga-dsseldorf-0ob.de/", phone: "+492362 9748965", email: "Info@krasse-events.de", description: "Lokaler Anbieter für JGA-Aktivitäten mit Limousinen und Partybussen." },
  { id: 18, country: "Deutschland", countryCode: "DE", city: "Düsseldorf", name: "JGA-Duesseldorf.com", website: "https://www.jga-duesseldorf.com/", phone: "0221/17044704", email: "info@jga-duesseldorf.com", description: "JGA-Aktivitäten in Düsseldorf mit Fokus auf Altstadt und Nachtleben." },
  { id: 19, country: "Deutschland", countryCode: "DE", city: "Stuttgart", name: "Pissup Stuttgart", website: "https://www.pissup.de/junggesellenabschied-stuttgart/", phone: "+49-800-723-7979", email: "hallo@pissup.de", description: "Führender Veranstalter für JGA in Stuttgart mit Top-Aktivitäten." },
  { id: 20, country: "Deutschland", countryCode: "DE", city: "Stuttgart", name: "SCity Events", website: "https://scity-events-stuttgart.de/", phone: "0176/31582244", email: "kontakt@scity-events-stuttgart.de", description: "Eventagentur in Stuttgart für Partybus, Bierbike und PubCrawl." },
  { id: 21, country: "Deutschland", countryCode: "DE", city: "Stuttgart", name: "JGA Buddies Stuttgart", website: "https://jga-buddies.de/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Experten für JGA Planung mit Stadtrallyes und Workshops." },
  { id: 22, country: "Deutschland", countryCode: "DE", city: "Dresden", name: "Pissup Dresden", website: "https://www.pissup.de/junggesellenabschied-dresden/", phone: "+49-800-723-7979", email: "hallo@pissup.de", description: "Deutschlands Nr. 1 Agentur für JGA mit lokalem Team in Dresden." },
  { id: 23, country: "Deutschland", countryCode: "DE", city: "Dresden", name: "Emmerich Events", website: "https://emmerich-events.de/jga-junggesellenabschied-junggesellinnenabschied/", phone: "0176 - 30321092", email: "info@emmerich-events.de", description: "Agentur für besondere Events mit originellen JGA-Programmen." },
  { id: 24, country: "Deutschland", countryCode: "DE", city: "Dresden", name: "Stag Party Germany", website: "https://www.stagpartygermany.de/stag-party-germany/stag-party-in-dresden", phone: "015159876447", email: "support@pubcrawl.team", description: "Spezialisiert auf PubCrawl-Touren in Dresden." },
  { id: 25, country: "Deutschland", countryCode: "DE", city: "Leipzig", name: "JGA-Party.com Leipzig", website: "https://www.jga-party.com/", phone: "+49 160 96613191", email: "info@jgaparty.com", description: "Spezialist für JGA in Deutschland und Europa." },
  { id: 26, country: "Deutschland", countryCode: "DE", city: "Leipzig", name: "CityGames Leipzig", website: "https://citygames-leipzig.de/", phone: "+49 (0) 341/33203360", email: "info@citygames-leipzig.de", description: "Veranstalter von interaktiven Stadtrallyes und City Games." },
  { id: 27, country: "Deutschland", countryCode: "DE", city: "Leipzig", name: "Mister Neo Leipzig", website: "https://misterneo.com/leipzig/", phone: "03055574177", email: "hello@misterneo.com", description: "Agentur für Trend-Events wie Bubble Soccer und Arrow Tag." },
  { id: 28, country: "Deutschland", countryCode: "DE", city: "Hannover", name: "Pissup Hannover", website: "https://www.pissup.de/", phone: "+49 (0) 30 56795839", email: "info@pissup.de", description: "Spezialisiert auf JGA und Partyreisen." },
  { id: 29, country: "Deutschland", countryCode: "DE", city: "Hannover", name: "Mister Neo Hannover", website: "https://misterneo.com/hannover/junggesellenabschied/", phone: "03055574177", email: "hello@misterneo.com", description: "Organisation von JGA in Hannover mit Gin-Tasting, Pub Crawl und Action-Events." },
  { id: 30, country: "Deutschland", countryCode: "DE", city: "Hannover", name: "JGA-Party.com Hannover", website: "https://hannover.jga-party.com/index.php/de/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Spezialist für individuelle JGA in Hannover." },
  { id: 31, country: "Deutschland", countryCode: "DE", city: "Nürnberg", name: "JGA-Party.com Nürnberg", website: "https://nuernberg.jga-party.com/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Agentur für JGA in Nürnberg mit Partypaketen und Transport." },
  { id: 32, country: "Deutschland", countryCode: "DE", city: "Nürnberg", name: "JGA Buddies Nürnberg", website: "https://jga-buddies.de/jga-nuernberg/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Anbieter von interaktiven Stadtrallyes für JGAs." },
  { id: 33, country: "Deutschland", countryCode: "DE", city: "Nürnberg", name: "Formula Nürnberg", website: "https://www.formula.de/junggesellenabschied/", phone: "0911-3663030", email: "info@formula.de", description: "JGA auf der Kartbahn mit Rennpaketen und Siegerehrung." },
  { id: 34, country: "Deutschland", countryCode: "DE", city: "Bremen", name: "Emmerich Events Bremen", website: "https://emmerich-events.de/", phone: "0176 - 30321092", email: "info@emmerich-events.de", description: "Agentur für besondere Events mit Detektivevents und Action Missionen." },
  { id: 35, country: "Deutschland", countryCode: "DE", city: "Bremen", name: "JGA Buddies Bremen", website: "https://jga-buddies.de/jga-bremen/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Flexible JGA Stadtrallyes in Bremen mit App-Steuerung." },
  { id: 36, country: "Deutschland", countryCode: "DE", city: "Bremen", name: "Hirschfeld.de", website: "https://www.hirschfeld.de/junggesellenabschied/bremen/", phone: "0049-361-5581180", email: "info@hirschfeld.de", description: "Event-Agentur mit originellen JGA-Programmen in Bremen." },
  { id: 37, country: "Deutschland", countryCode: "DE", city: "Dortmund", name: "More Than Words", website: "https://morethanwords.de/junggesellenabschied-dortmund", phone: "+49 231 7900416", email: "info@morethanwords.de", description: "Kreative Graffiti-Workshops für JGA in Dortmund." },
  { id: 38, country: "Deutschland", countryCode: "DE", city: "Dortmund", name: "Roda-Events", website: "https://www.roda-events.de/jga/junggesellenabschied-dortmund/", phone: "+49 2362 9748965", email: "anfragen@roda-events.de", description: "Professionelle Agentur für JGA mit Limousinen und Paintball." },
  { id: 39, country: "Deutschland", countryCode: "DE", city: "Dortmund", name: "Emmerich Events Dortmund", website: "https://emmerich-events.de/jga-junggesellenabschied-junggesellinnenabschied/", phone: "0176 - 30321092", email: "info@emmerich-events.de", description: "Bundesweite JGA-Events mit Abenteuer- und Horror-Szenarien." },
  { id: 40, country: "Deutschland", countryCode: "DE", city: "Essen", name: "UnserJGA.de Essen", website: "https://unserjga.de/", phone: "+49 (0)228/97663070", email: "info@unserjga.de", description: "Agentur für interaktive Rallyes und DIY-Boxen." },
  { id: 41, country: "Deutschland", countryCode: "DE", city: "Essen", name: "Roda-Events Essen", website: "https://www.roda-events.de/jga/junggesellenabschied-essen/", phone: "+49 2362 9748965", email: "anfragen@roda-events.de", description: "Eventagentur für JGAs in Essen mit Partybussen und Paintball." },
  { id: 42, country: "Deutschland", countryCode: "DE", city: "Essen", name: "JGA Buddies Essen", website: "https://jga-buddies.de/jga-essen/", phone: "", email: "hallo@jga-buddies.de", description: "Stadtrallyes in Essen mit Aufgaben und Spielen." },

  // Österreich
  { id: 43, country: "Österreich", countryCode: "AT", city: "Wien", name: "JGA-Party.com Wien", website: "https://wien.jga-party.com/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Experte für JGA in Wien mit Limousinen, Partybussen und Show Dinner." },
  { id: 44, country: "Österreich", countryCode: "AT", city: "Wien", name: "Pissup Reisen Wien", website: "https://www.pissup.de/junggesellenabschied-wien/", phone: "+49-800-723-7979", email: "hallo@pissup.de", description: "Europas Nr. 1 JGA-Agentur mit Bubble Fußball und Bierbike-Touren." },
  { id: 45, country: "Österreich", countryCode: "AT", city: "Wien", name: "planit!", website: "https://planit.eu/de/jga-manner/wien", phone: "", email: "support@planit.eu", description: "Einzigartige Gruppenaktivitäten für JGA in Wien." },
  { id: 46, country: "Österreich", countryCode: "AT", city: "Salzburg", name: "Salzburg Adventures", website: "https://www.salzburgadventures.com/de/gruppen/junggesellenabschied", phone: "+43 680 32 66 767", email: "booking@salzburgadventures.com", description: "JGA-Aktivitäten in Salzburg mit Rafting und Canyoning." },
  { id: 47, country: "Österreich", countryCode: "AT", city: "Salzburg", name: "Nightlife Tours", website: "https://nightlife-salzburg.com/perfekter-junggesellenabschied/", phone: "+43 650 654 1995", email: "nightlife.salzburg@gmail.com", description: "Bar-Touren und Party-Planung für JGAs in Salzburg." },
  { id: 48, country: "Österreich", countryCode: "AT", city: "Salzburg", name: "Mister Neo Salzburg", website: "https://misterneo.com/salzburg/junggesellenabschied-salzburg/", phone: "0800 5080707", email: "hello@misterneo.com", description: "JGA in Salzburg mit Action, Kulinarik und Partys." },
  { id: 49, country: "Österreich", countryCode: "AT", city: "Graz", name: "Landventure", website: "https://www.thelandventure.com/at/de/graz-jga-frauen", phone: "", email: "info@thelandventure.com", description: "Outdoor-Smartphone-Schnitzeljagden für JGA in Graz." },
  { id: 50, country: "Österreich", countryCode: "AT", city: "Graz", name: "Agentur Stella", website: "https://www.agentur-stella.at/limousinen", phone: "+43 1343 836060", email: "office@agentur-stella.at", description: "Limousinen- und Partybus-Vermietung in Graz." },
  { id: 51, country: "Österreich", countryCode: "AT", city: "Graz", name: "JGA-Buddies Graz", website: "https://jga-buddies.de/jga-graz/", phone: "", email: "hallo@jga-buddies.de", description: "JGA Stadtrallyes in Graz mit Partybus und Tonstudio." },
  { id: 52, country: "Österreich", countryCode: "AT", city: "Innsbruck", name: "Mister Neo Innsbruck", website: "https://misterneo.com/innsbruck/", phone: "+49 30 555 741 77", email: "hello@misterneo.com", description: "City Touren, Party-Aktivitäten und Action-Events in Innsbruck." },
  { id: 53, country: "Österreich", countryCode: "AT", city: "Innsbruck", name: "JGA Buddies Innsbruck", website: "https://jga-buddies.de/jga-innsbruck/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Flexible JGA Stadtrallyes über Smartphone App." },
  { id: 54, country: "Österreich", countryCode: "AT", city: "Innsbruck", name: "EscapeGame Innsbruck", website: "https://www.escapegame-innsbruck.at/", phone: "+43 512 55 24 61", email: "info@escapegame-innsbruck.at", description: "Escape Rooms für JGA in verschiedenen Schwierigkeitsgraden." },
  { id: 55, country: "Österreich", countryCode: "AT", city: "Linz", name: "Mister Neo Linz", website: "https://misterneo.com/linz/", phone: "03055574177", email: "HELLO@MISTERNEO.COM", description: "City Touren, Party-Erlebnisse und Action-Aktivitäten in Linz." },
  { id: 56, country: "Österreich", countryCode: "AT", city: "Linz", name: "JGA Buddies Linz", website: "https://jga-buddies.de/jga-linz/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Interaktive JGA Stadtrallyes mit App-Navigation." },
  { id: 57, country: "Österreich", countryCode: "AT", city: "Linz", name: "Poltern.events", website: "https://www.poltern.events/", phone: "+43 699 140 40 400", email: "info@poltern.events", description: "Polterabend-Pakete für Frauen und Männer in Linz." },
  { id: 58, country: "Österreich", countryCode: "AT", city: "Linz", name: "Polter Buddies", website: "https://polter-buddies.at/poltern-linz/", phone: "+49 7142 – 999 84 50", email: "hallo@polter-buddies.at", description: "Stadtrallyes für Polterabende in Linz." },

  // Schweiz
  { id: 59, country: "Schweiz", countryCode: "CH", city: "Zürich", name: "Mister Neo Zürich", website: "https://misterneo.com/zuerich/", phone: "03055574177", email: "hello@misterneo.com", description: "Individuelle Events für JGA in Zürich." },
  { id: 60, country: "Schweiz", countryCode: "CH", city: "Zürich", name: "JGA-Party.com Zürich", website: "https://zuerich.jga-party.com/index.php/de/", phone: "+49 (0) 30 50154408", email: "info@jga-party.com", description: "Spezialist für JGA-Partys in der Schweiz." },
  { id: 61, country: "Schweiz", countryCode: "CH", city: "Zürich", name: "Polter-Buddies Zürich", website: "https://polter-buddies.ch/ueber-uns/", phone: "+49 7142 999 8430", email: "hallo@polter-buddies.ch", description: "Exklusive JGA Stadtrallyes für Frauen und Männer." },
  { id: 62, country: "Schweiz", countryCode: "CH", city: "Genf", name: "Events-geneve.ch", website: "https://events-geneve.ch/organisation-evg-geneve", phone: "+41 76 818 38 81", email: "contact@events-geneve.ch", description: "Eventagentur für EVG/EVJF in Genf." },
  { id: 63, country: "Schweiz", countryCode: "CH", city: "Genf", name: "KALAYAN", website: "https://www.kalayan.ch/evjf-evg", phone: "+41 22 320 17 70", email: "event@kalayan.ch", description: "Originelle Aktivitäten wie Quiz Room und Escape Games." },
  { id: 64, country: "Schweiz", countryCode: "CH", city: "Genf", name: "Wedidit.ch", website: "https://www.wedidit.ch/nos-activites/evjf/enterrement-de-vie-de-jeune-fille-suisse/evjf-geneve/", phone: "+41 32 841 41 46", email: "info@citygames.ch", description: "Geolokalisierte Stadtspiele und Challenges." },
  { id: 65, country: "Schweiz", countryCode: "CH", city: "Basel", name: "CityGames Basel", website: "https://www.wedidit.ch/de/villes/Veranstaltungen-in-Basel/", phone: "+41 32 841 41 46", email: "info@citygames.ch", description: "Digitale Spiele wie Schatzsuchen und Fluchtspiele." },
  { id: 66, country: "Schweiz", countryCode: "CH", city: "Basel", name: "JGA Buddies Basel", website: "https://jga-buddies.de/polterabend-basel/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "JGA Stadtrallyes über Smartphone App." },
  { id: 67, country: "Schweiz", countryCode: "CH", city: "Basel", name: "Erlebniscenter Basel", website: "https://www.paradiesgolf.ch/", phone: "+41 61 536 99 71", email: "info@erlebniscenter.ch", description: "Schwarzlicht-Minigolf und VR Games." },
  { id: 68, country: "Schweiz", countryCode: "CH", city: "Bern", name: "JGA Buddies Bern", website: "https://jga-buddies.de/polterabend-bern/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Interaktive Stadtrallyes in Bern." },
  { id: 69, country: "Schweiz", countryCode: "CH", city: "Bern", name: "BePrep GmbH", website: "https://www.beprep.ch/", phone: "+41 323971766", email: "ready@beprep.ch", description: "Survival-Themen-JGA-Events in der Region Berner Jura." },
  { id: 70, country: "Schweiz", countryCode: "CH", city: "Bern", name: "Adventure Dome", website: "https://www.adventuredome.ch/jga/", phone: "", email: "info@kiddydome.ch", description: "Actionreiche JGA-Events im Game Show-Format." },
  { id: 71, country: "Schweiz", countryCode: "CH", city: "Lausanne", name: "Helvetic Events", website: "https://helvetic-events-services.ch/", phone: "+41 79 206 54 63", email: "helvetic.events@gmail.com", description: "Ungewöhnliche und hochwertige Erlebnisse in Lausanne." },
  { id: 72, country: "Schweiz", countryCode: "CH", city: "Lausanne", name: "ES Wedding Planner", website: "https://www.esweddingplanner.ch/", phone: "+41 76 733 16 47", email: "contact-eswp@bluewin.ch", description: "Wedding Planner mit EVG/EVJF-Organisation." },
  { id: 73, country: "Schweiz", countryCode: "CH", city: "Lausanne", name: "Polter Buddies Lausanne", website: "https://polter-buddies.ch/fr/evjf-evg-lausanne/", phone: "+49 7142 999 8430", email: "hallo@polter-buddies.ch", description: "Flexible Stadtrallyes als EVG/EVJF-Aktivität." },

  // Niederlande
  { id: 74, country: "Niederlande", countryCode: "NL", city: "Amsterdam", name: "Amsterdam Bachelor", website: "https://www.amsterdambachelor.com/", phone: "+31 20 737 2619", email: "info@amsterdambachelor.com", description: "Spezialisiert auf JGA in Amsterdam seit 2010." },
  { id: 75, country: "Niederlande", countryCode: "NL", city: "Amsterdam", name: "Fun Amsterdam", website: "https://funamsterdam.com/", phone: "+31 6 45601732", email: "book@funamsterdam.com", description: "Nummer 1 Organisator für Stag und Hen Partys." },
  { id: 76, country: "Niederlande", countryCode: "NL", city: "Amsterdam", name: "Amsterdam Bachelorette", website: "https://www.amsterdambachelorette.com/", phone: "+31207372619", email: "info@amsterdambachelorette.com", description: "Spezialisiert auf Hen Party/Bachelorette Party seit 2012." },
  { id: 77, country: "Niederlande", countryCode: "NL", city: "Rotterdam", name: "Wild Weddings & Events", website: "https://wildweddingsandevents.nl/bachelor-party/", phone: "+316 44 09 28 52", email: "info@wildweddingsandevents.nl", description: "Persönliche Eventplanung für JGA in Rotterdam." },
  { id: 78, country: "Niederlande", countryCode: "NL", city: "Rotterdam", name: "Flitz-Events", website: "https://flitz-events.com/group-outings/rotterdam", phone: "070 - 2501429", email: "info@flitz-events.nl", description: "Gruppen-Events in Rotterdam mit über 200 Aktivitäten." },
  { id: 79, country: "Niederlande", countryCode: "NL", city: "Rotterdam", name: "Onemotion Rotterdam", website: "https://www.onemotion.nl/vrijgezellenfeest-rotterdam/", phone: "", email: "", description: "Aktivitäten und Konzepte für JGA in Rotterdam." },
  { id: 80, country: "Niederlande", countryCode: "NL", city: "Den Haag", name: "Flitz-Events Den Haag", website: "https://flitz-events.nl/vrijgezellenfeest/den-haag", phone: "070 - 2501429", email: "info@flitz-events.nl", description: "Vrijgezellenfeesten mit breitem Aktivitäten-Spektrum." },
  { id: 81, country: "Niederlande", countryCode: "NL", city: "Den Haag", name: "The Activity Company", website: "https://www.denhaag.activitycompany.nl/vrijgezellenfeest-den-haag", phone: "088-2322477", email: "algemeen@activitycompany.nl", description: "Über dreißig Aktivitäten für JGA in Den Haag." },
  { id: 82, country: "Niederlande", countryCode: "NL", city: "Den Haag", name: "Vrijgezellenfeest-DenHaag", website: "https://www.vrijgezellenfeest-denhaag.nl/", phone: "070-3561998", email: "mail@vrijgezellenfeest-denhaag.nl", description: "Kreative Workshops für JGA in Den Haag." },
  { id: 83, country: "Niederlande", countryCode: "NL", city: "Utrecht", name: "Domstad Evenementen", website: "https://domstadevenementen.nl/vrijgezellenfeest-utrecht/", phone: "030 214 50 45", email: "info@domstadevenementen.nl", description: "Maßgeschneiderte JGA mit über 80 Aktivitäten." },
  { id: 84, country: "Niederlande", countryCode: "NL", city: "Utrecht", name: "Vrijgezellenfeest.nl", website: "https://www.vrijgezellenfeest.nl/locaties/utrecht/", phone: "", email: "info@vrijgezellenfeest.nl", description: "Breite Palette von JGA-Aktivitäten in Utrecht." },
  { id: 85, country: "Niederlande", countryCode: "NL", city: "Utrecht", name: "TB Events Nederland", website: "https://www.tbevents.nl/vrijgezellenfeest-utrecht", phone: "+31 314-741741", email: "info@tbevents.nl", description: "Maßgeschneiderte JGA mit Crazy 88 und The Hangover." },
  { id: 86, country: "Niederlande", countryCode: "NL", city: "Eindhoven", name: "Doe-Eindhoven", website: "https://www.doe-eindhoven.nl/", phone: "040 231 90 52", email: "info@doe-eindhoven.nl", description: "Gruppenaktivitäten und JGA in Eindhoven." },
  { id: 87, country: "Niederlande", countryCode: "NL", city: "Eindhoven", name: "1001activiteiten", website: "https://www.1001activiteiten.nl/vrijgezellenfeest/eindhoven", phone: "+31 (0)30 657 94 45", email: "info@1001activiteiten.nl", description: "Über 470 Aktivitäten für JGA in Eindhoven." },
  { id: 88, country: "Niederlande", countryCode: "NL", city: "Eindhoven", name: "Onemotion Eindhoven", website: "https://www.onemotion.nl/vrijgezellenfeest-eindhoven/", phone: "", email: "", description: "Originelle Aktivitäten und Citygames." },

  // Belgien
  { id: 89, country: "Belgien", countryCode: "BE", city: "Brüssel", name: "EVG.fr Brüssel", website: "https://www.evg.fr/bruxelles/", phone: "+33 2 57 88 00 08", email: "contact@evg.fr", description: "Organisation von JGA in Brüssel." },
  { id: 90, country: "Belgien", countryCode: "BE", city: "Brüssel", name: "Crazy EVG Brüssel", website: "https://www.crazy-evg.com/enterrement-de-vie-de-garcon-bruxelles", phone: "01 76 21 57 30", email: "contact@crazy-evg.com", description: "Führender Anbieter für JGA in Brüssel." },
  { id: 91, country: "Belgien", countryCode: "BE", city: "Brüssel", name: "EVGDREAM Brüssel", website: "https://www.evgdream.com/destination/enterrement-de-vie-de-garcon-bruxelles", phone: "07 56 81 84 54", email: "contact@evgdream.com", description: "JGA-Pakete mit Beer Bike und Battle Kart." },
  { id: 92, country: "Belgien", countryCode: "BE", city: "Antwerpen", name: "Antwerpen Excursies", website: "https://antwerpenexcursies.be/vrijgezellenfeesten/", phone: "+32 3 808 15 58", email: "info@antwerpenexcursies.be", description: "Über 200 Gruppenaktivitäten in Antwerpen." },
  { id: 93, country: "Belgien", countryCode: "BE", city: "Antwerpen", name: "JOYT Antwerpen", website: "https://www.joyt.eu/antwerpen/vrijgezellenfeest/", phone: "", email: "antwerpen@joyt.be", description: "Karaoke-Boxen und Workshops." },
  { id: 94, country: "Belgien", countryCode: "BE", city: "Antwerpen", name: "iChallenge", website: "https://ichallenge.be/en/event/bachelor-or-bachelorette-party/", phone: "+32 478 07 66 79", email: "info@ichallenge.be", description: "GPS-gestützte City Games und Stadtrallyes." },
  { id: 95, country: "Belgien", countryCode: "BE", city: "Brügge", name: "BeauBelge-Events", website: "https://beaubelge.be/", phone: "+32 (0) 492 22 88 88", email: "Hello@beaubelge.be", description: "Eventagentur in Brügge für Teambuilding." },
  { id: 96, country: "Belgien", countryCode: "BE", city: "Brügge", name: "Vrijgezellenfeest.nl Brügge", website: "https://www.vrijgezellenfeest.nl/locaties/brugge/", phone: "", email: "info@vrijgezellenfeest.nl", description: "Aktivitäten und Ideen für JGA in Brügge." },
  { id: 97, country: "Belgien", countryCode: "BE", city: "Brügge", name: "Onemotion Brügge", website: "https://www.onemotion.be/vrijgezellenfeest-brugge/", phone: "", email: "", description: "Aktivitäten und Workshops für JGA." },
  { id: 98, country: "Belgien", countryCode: "BE", city: "Gent", name: "Gent Excursies", website: "https://gentexcursies.be/vrijgezellenfeesten/", phone: "+32 9 298 08 02", email: "info@gentexcursies.be", description: "Maßgeschneiderte JGA in Gent." },
  { id: 99, country: "Belgien", countryCode: "BE", city: "Gent", name: "Vrijgezellen@Gent", website: "http://www.vrijgezellenatgent.be/", phone: "+32 483 66 49 23", email: "info@vrijgezellenatgent.be", description: "Workshops und City-Games in Gent." },
  { id: 100, country: "Belgien", countryCode: "BE", city: "Gent", name: "Next Level Games", website: "https://nextlevelgames.be/formules/", phone: "+32 469 24 25 24", email: "Hello@nextlevelgames.be", description: "Spiele und Aktivitäten für JGA." },

  // Frankreich
  { id: 101, country: "Frankreich", countryCode: "FR", city: "Paris", name: "EVGDREAM Paris", website: "https://www.evgdream.com/", phone: "07 56 81 84 54", email: "contact@evgdream.com", description: "Spezialisiert auf EVG in Frankreich und Europa." },
  { id: 102, country: "Frankreich", countryCode: "FR", city: "Paris", name: "Crazy EVG Paris", website: "https://www.crazy-evg.com/", phone: "01 76 21 57 30", email: "contact@crazy-evg.com", description: "Agence française n°1 für EVG seit 2009." },
  { id: 103, country: "Frankreich", countryCode: "FR", city: "Paris", name: "EVG.fr Paris", website: "https://www.evg.fr/", phone: "+33257880008", email: "contact@evg.fr", description: "Nummer 1 der EVG-Agenturen in Europa seit 2001." },
  { id: 104, country: "Frankreich", countryCode: "FR", city: "Lyon", name: "EVG LYON", website: "https://www.evglyon.com/", phone: "", email: "evg@weareports.fr", description: "10.000 m² Indoor-Freizeitfläche mit iCombat und Archery Tag." },
  { id: 105, country: "Frankreich", countryCode: "FR", city: "Lyon", name: "EVG.fr Lyon", website: "https://www.evg.fr/lyon/", phone: "+33 9 87 67 55 16", email: "contact@evg.fr", description: "JGA in Lyon mit Olympiaden, Karting und Stripshows." },
  { id: 106, country: "Frankreich", countryCode: "FR", city: "Lyon", name: "Productions Rino Baldi", website: "https://rinobaldi.com/organisation-evenement-particulier-lyon/organisation-evjf-evg-lyon/", phone: "04 78 75 09 46", email: "", description: "Maßgeschneiderte EVJF/EVG in Lyon." },
  { id: 107, country: "Frankreich", countryCode: "FR", city: "Marseille", name: "Memory Voyage", website: "https://www.memoryvoyage.com/destinations/france-marseille", phone: "+33 (0)7 49 22 29 00", email: "contact@memoryvoyage.com", description: "EVG/EVJF-Wochenenden in Marseille." },
  { id: 108, country: "Frankreich", countryCode: "FR", city: "Marseille", name: "Planetazur", website: "https://planetazur.com/fr/enterrement-de-vie-de-garcon/", phone: "+33 783 61 64 93", email: "contact@planetazur.com", description: "Authentische Abenteuer in der Provence." },
  { id: 109, country: "Frankreich", countryCode: "FR", city: "Marseille", name: "Bleu Evasion", website: "https://www.bleuevasion.fr/enterrement-vie-jeune-fille-garcon", phone: "+33 4 91 06 18 87", email: "partir@bleuevasion.fr", description: "EVJF/EVG auf dem Boot in den Calanques." },
  { id: 110, country: "Frankreich", countryCode: "FR", city: "Nizza", name: "French Riviera Parties", website: "https://frenchrivieraparties.com/evg-nice-cote-dazur/", phone: "+33 973 889 721", email: "contact@frenchrivieraparties.com", description: "EVG/EVJF an der Côte d'Azur." },
  { id: 111, country: "Frankreich", countryCode: "FR", city: "Nizza", name: "My EVJF Nizza", website: "https://evjf.org/nice/", phone: "06 80 88 03 06", email: "contact@myevjf.fr", description: "Trendige EVJF in Nizza." },
  { id: 112, country: "Frankreich", countryCode: "FR", city: "Nizza", name: "Crazy EVJF", website: "https://www.crazy-evjf.com/", phone: "01 76 21 57 31", email: "contact@crazy-voyages.com", description: "Maßgeschneiderte EVJF-Reisen." },
  { id: 113, country: "Frankreich", countryCode: "FR", city: "Bordeaux", name: "EVG.fr Bordeaux", website: "https://www.evg.fr/bordeaux/", phone: "+33257880008", email: "contact@evg.fr", description: "Über 40 Aktivitäten in Bordeaux." },
  { id: 114, country: "Frankreich", countryCode: "FR", city: "Bordeaux", name: "Les Mariages de Mademoiselle L", website: "https://www.lesmariagesdemademoisellel.fr/", phone: "06 33 43 64 17", email: "contact@lesmariagesdemademoisellel.com", description: "Maßgeschneiderte EVJF/EVG in Bordeaux." },
  { id: 115, country: "Frankreich", countryCode: "FR", city: "Bordeaux", name: "My EVJF Bordeaux", website: "https://evjf.org/bordeaux/", phone: "06 80 88 03 06", email: "contact@myevjf.fr", description: "Trendige EVJF in Bordeaux." },
  { id: 116, country: "Frankreich", countryCode: "FR", city: "Toulouse", name: "AL events", website: "https://al-events.fr/EVG_EVJF", phone: "06 84 10 83 67", email: "contact@al-events.fr", description: "Maßgeschneiderte EVG/EVJF in Toulouse." },
  { id: 117, country: "Frankreich", countryCode: "FR", city: "Toulouse", name: "Agence ELA", website: "https://www.agence-ela.com/evenements-prives/", phone: "06 99 08 88 21", email: "", description: "Private Veranstaltungen in Toulouse." },
  { id: 118, country: "Frankreich", countryCode: "FR", city: "Toulouse", name: "Hunting Town", website: "https://www.hunting-town.com/evjf/toulouse/", phone: "07 64 55 35 62", email: "toulouse@hunting-town.com", description: "Outdoor Escape Games in Toulouse." },
  { id: 119, country: "Frankreich", countryCode: "FR", city: "Straßburg", name: "Pissup Straßburg", website: "https://www.evg.fr/strasbourg/", phone: "+33 2 57 88 00 08", email: "contact@evg.fr", description: "Über 30 Aktivitäten wie Paintball und Bubble Football." },
  { id: 120, country: "Frankreich", countryCode: "FR", city: "Straßburg", name: "Mister Neo Straßburg", website: "https://misterneo.com/strassburg/junggesellenabschied/", phone: "030 555 741 77", email: "hello@misterneo.com", description: "Wein-Tasting, Escape Games und Partynächte." },
  { id: 121, country: "Frankreich", countryCode: "FR", city: "Straßburg", name: "JGA Buddies Straßburg", website: "https://jga-buddies.de/jga-strassburg/", phone: "+49 7142 999 8440", email: "hallo@jga-buddies.de", description: "Interaktive JGA Stadtrallyes." },
  { id: 122, country: "Frankreich", countryCode: "FR", city: "Lille", name: "My EVJF Lille", website: "https://evjflille.com/", phone: "+33 6 71 83 27 80", email: "contact@my-evjf.com", description: "Trendige EVJF in Lille." },
  { id: 123, country: "Frankreich", countryCode: "FR", city: "Lille", name: "EVG.fr Lille", website: "https://www.evg.fr/lille/", phone: "+33 2 57 88 00 08", email: "contact@evg.fr", description: "Über 20 Aktivitäten für EVG in Lille." },
  { id: 124, country: "Frankreich", countryCode: "FR", city: "Lille", name: "Team Square Lille", website: "https://enterrementviecelibataire-lille.fr/", phone: "03 74 83 02 02", email: "contact@teamsquare.fr", description: "Multi-Aktivitätskomplex bei Lille." },

  // Spanien
  { id: 125, country: "Spanien", countryCode: "ES", city: "Madrid", name: "Dexconecta", website: "https://dexconectamadrid.es/", phone: "648 000 605", email: "madrid@dexconecta.com", description: "JGA mit Multiaventura-Aktivitäten in Madrid." },
  { id: 126, country: "Spanien", countryCode: "ES", city: "Madrid", name: "Despedidas Big", website: "https://www.despedidasbig.com/", phone: "687 67 62 82", email: "info@bigeventos.es", description: "Breite Palette an Aktivitäten in Madrid." },
  { id: 127, country: "Spanien", countryCode: "ES", city: "Madrid", name: "Organizatudespedida", website: "https://www.organizatudespedida.com/", phone: "916094803", email: "reservas@organizatudespedida.com", description: "JGA in Madrid und Toledo." },
  { id: 128, country: "Spanien", countryCode: "ES", city: "Barcelona", name: "Despidalia", website: "https://www.despedidasdesolterabarcelona.net/", phone: "646 381 279", email: "info@emg.online", description: "Über 400 Aktivitäten in Barcelona." },
  { id: 129, country: "Spanien", countryCode: "ES", city: "Barcelona", name: "Barcelona Bachelors", website: "https://www.barcelonabachelors.com/", phone: "+34627553227", email: "contact@barcelonabachelors.com", description: "Lokale Partyplaner und Nightlife-Experten." },
  { id: 130, country: "Spanien", countryCode: "ES", city: "Barcelona", name: "La Ultima Farra", website: "https://www.laultimafarra.com/despedidas-de-soltero-en-barcelona/", phone: "933 589 711", email: "comercial@laultimafarra.com", description: "Maßgeschneiderte JGA an der Costa del Sol." },
  { id: 131, country: "Spanien", countryCode: "ES", city: "Valencia", name: "Espectáculos As de Picas", website: "https://www.espectaculosasdepicas.es/", phone: "961 041 015", email: "info@fiestasbarcovalencia.es", description: "Führende Agentur in Valencia seit 2007." },
  { id: 132, country: "Spanien", countryCode: "ES", city: "Valencia", name: "Isla Despedidas", website: "https://isladespedidas.com/", phone: "963 111 999", email: "valencia@isladespedidas.com", description: "Thematische Restaurants und Bootsfahrten." },
  { id: 133, country: "Spanien", countryCode: "ES", city: "Valencia", name: "Despedidas y Fiestas Valencia", website: "https://despedidasyfiestasvalencia.com/", phone: "652 96 54 64", email: "bizzancio@bizzancio.com", description: "Über 10 Jahre Erfahrung in Valencia." },
  { id: 134, country: "Spanien", countryCode: "ES", city: "Sevilla", name: "Eclipse Eventos Sevilla", website: "https://www.eclipsesevilla.com/", phone: "+34 954 043 707", email: "info@eclipsesevilla.com", description: "Kreative Erlebnisse und Team Building." },
  { id: 135, country: "Spanien", countryCode: "ES", city: "Sevilla", name: "Eventos Deluxe", website: "https://www.despedidadesolterasevilla.es/", phone: "+34 605 241 765", email: "info@capeasevilla.com", description: "Luxuriöse JGA mit Shows und Limousinen." },
  { id: 136, country: "Spanien", countryCode: "ES", city: "Sevilla", name: "Eventos Emagic", website: "https://www.eventosemagic.com/despedidas/", phone: "+34 636 617 604", email: "info@eventosemagic.com", description: "Shows, Aktivitäten und Unterkunftspakete." },
  { id: 137, country: "Spanien", countryCode: "ES", city: "Málaga", name: "Despedidas de Soltero Málaga", website: "https://www.despedidasdesolterosmalaga.com/", phone: "+34 722266993", email: "info@despedidasdesolterosmalaga.com", description: "JGA an der Costa del Sol." },
  { id: 138, country: "Spanien", countryCode: "ES", city: "Málaga", name: "Málaga Despedidas", website: "https://malagadespedidas.com/", phone: "633449007", email: "info@malagadespedidas.com", description: "Boat Partys und Beach Clubs." },
  { id: 139, country: "Spanien", countryCode: "ES", city: "Málaga", name: "Ultra Despedidas Málaga", website: "https://despedidadesolteramalaga.com/", phone: "+34 640 136 639", email: "info@ultradespedidas.com", description: "Einzigartige und personalisierte JGA." },
  { id: 140, country: "Spanien", countryCode: "ES", city: "Bilbao", name: "Despedida Total", website: "https://www.despedidatotal.com/", phone: "94 422 02 29", email: "info@despedidatotal.es", description: "JGA im gesamten Baskenland." },
  { id: 141, country: "Spanien", countryCode: "ES", city: "Bilbao", name: "RVZeventos", website: "https://www.rvzeventosydespedidasdesolteros.com/", phone: "656 762 245", email: "rvzeventos@hotmail.com", description: "Personalisierte Pakete mit Humor Amarillo." },
  { id: 142, country: "Spanien", countryCode: "ES", city: "Zaragoza", name: "Despedidas Bestias", website: "https://despedidasbestias.com/", phone: "652 97 21 41", email: "info@despedidasbestias.com", description: "Karting, Paintball und Limousinen-Packs." },
  { id: 143, country: "Spanien", countryCode: "ES", city: "Zaragoza", name: "Eventos y Despedidas", website: "https://eventosydespedidas.es/", phone: "675 92 48 84", email: "info@eventosydespedidas.es", description: "JGA seit 2003 mit Gymkanas." },
  { id: 144, country: "Spanien", countryCode: "ES", city: "Zaragoza", name: "PlanAventura", website: "https://planaventura.es/", phone: "661 32 77 07", email: "info@planaventura.es", description: "Outdoor-Aktivitäten auf 20.000 m² Gelände." },
  { id: 145, country: "Spanien", countryCode: "ES", city: "Ibiza", name: "Avana Agency", website: "https://avana-agency.com/", phone: "+34 642 428 677", email: "office@avana-agency.com", description: "Luxury Events und VIP-Services." },
  { id: 146, country: "Spanien", countryCode: "ES", city: "Ibiza", name: "Espectáculos As de Picas Ibiza", website: "https://www.espectaculosasdepicas.es/", phone: "961 041 015", email: "info@grupoasdepicas.es", description: "JGA in Ibiza mit Booten und Restaurants." },
  { id: 147, country: "Spanien", countryCode: "ES", city: "Ibiza", name: "Ibiza Fiesta", website: "https://ibizafiesta.es/", phone: "605 902 902", email: "hola@grupofiesta.es", description: "Boat Partys und Beach Clubs." },
  { id: 148, country: "Spanien", countryCode: "ES", city: "Mallorca", name: "Luxury Event Mallorca", website: "https://www.luxury-event-mallorca.com", phone: "0034 634 30 85 45", email: "hello@luxury-event-mallorca.com", description: "Full-Service Eventagentur mit JGA-Paketen." },
  { id: 149, country: "Spanien", countryCode: "ES", city: "Mallorca", name: "Despedidas Big Mallorca", website: "https://www.despedidasbig.com/mallorca/es", phone: "652978095", email: "mallorca@bigeventos.es", description: "Ganzheitliche JGA-Organisation." },
  { id: 150, country: "Spanien", countryCode: "ES", city: "Mallorca", name: "Pissup Mallorca", website: "https://www.pissup.de/junggesellenabschied-mallorca/", phone: "+49 322 218 50015", email: "hallo@pissup.de", description: "JGA-Reisen nach Mallorca." },
  { id: 151, country: "Spanien", countryCode: "ES", city: "Marbella", name: "Despedidas Exclusive", website: "https://despedidasexclusive.com/despedidas-de-soltera-en-marbella/", phone: "(+34) 653 320 334", email: "info@despedidasexclusive.com", description: "Bicibirra, Paintball und Discobus." },
  { id: 152, country: "Spanien", countryCode: "ES", city: "Marbella", name: "Marbella Parties", website: "https://marbellaparties.com/", phone: "+34 609 574 555", email: "info@marbellaparties.com", description: "Event-Unternehmen an der Costa del Sol." },
  { id: 153, country: "Spanien", countryCode: "ES", city: "Marbella", name: "Marbella Experiences", website: "https://es.marbella-experiences.com/despedida-de-solteros", phone: "0034-619987093", email: "info@marbella-experiences.com", description: "Abenteueraktivitäten im Freien." },

  // Portugal
  { id: 154, country: "Portugal", countryCode: "PT", city: "Lissabon", name: "VIP Party Portugal", website: "https://despedidasdesolteiro.pt/", phone: "+351 214 054 100", email: "info@vipparty.pt", description: "Private Feiern und JGA in Portugal." },
  { id: 155, country: "Portugal", countryCode: "PT", city: "Lissabon", name: "Lisbon Stag Do", website: "https://lisbonstagdo.com/de/", phone: "+44 7466 471756", email: "info@lisbonstagdo.com", description: "JGA in Lissabon mit Aktivitäten." },
  { id: 156, country: "Portugal", countryCode: "PT", city: "Lissabon", name: "Pissup Lissabon", website: "https://www.pissup.de/junggesellenabschied-lissabon/", phone: "0322-218-50015", email: "", description: "JGA mit lokalem Team und 24/7-Service." },
  { id: 157, country: "Portugal", countryCode: "PT", city: "Porto", name: "At Porto Events", website: "https://atportoevents.com/", phone: "+351 962 563 709", email: "atportoevents@gmail.com", description: "Events und JGA in Porto." },
  { id: 158, country: "Portugal", countryCode: "PT", city: "Porto", name: "Mundial Eventos", website: "https://mundialeventos.com/", phone: "", email: "info@mundialeventos.com", description: "Pionier für JGA in Portugal." },
  { id: 159, country: "Portugal", countryCode: "PT", city: "Porto", name: "Porto Walkers", website: "https://www.portowalkers.pt/bachelorparty", phone: "", email: "portowalkers@gmail.com", description: "Pubcrawls und Weinproben in Porto." },
  { id: 160, country: "Portugal", countryCode: "PT", city: "Faro", name: "Social Algarve", website: "https://social-algarve.com/despedida-de-solteira/", phone: "+351 919 665 293", email: "info@social-algarve.com", description: "Premium-Services im Algarve." },
  { id: 161, country: "Portugal", countryCode: "PT", city: "Faro", name: "Vip Party Portugal Algarve", website: "https://vippartyportugal.com/", phone: "+351 214 054 100", email: "info@vipparty.pt", description: "Party-Boote und Limousinen." },

  // Italien
  { id: 162, country: "Italien", countryCode: "IT", city: "Rom", name: "Notte da Leoni", website: "https://www.nottedaleoni.it/", phone: "(+39) 055 06 20 887", email: "info@nottedaleoni.it", description: "Erste italienische JGA-Agentur." },
  { id: 163, country: "Italien", countryCode: "IT", city: "Rom", name: "Crazy-Addioalcelibato Rom", website: "https://www.crazy-addioalcelibato.com/a-roma", phone: "+33 1 76 46 18 78", email: "contatto@crazy-addioalcelibato.com", description: "Breite Palette von Aktivitäten in Rom." },
  { id: 164, country: "Italien", countryCode: "IT", city: "Rom", name: "Sogno Reale Eventi", website: "https://sognorealeventi.it/addio-al-celibato-a-roma-sogno-reale-eventi/", phone: "06 56 54 83 87", email: "info@sognorealeventi.it", description: "Unvergessliche JGA in Rom." },
  { id: 165, country: "Italien", countryCode: "IT", city: "Mailand", name: "Crazy-Addioalcelibato Mailand", website: "https://www.crazy-addioalcelibato.com/a-milano", phone: "+33 1 76 46 18 78", email: "contatto@crazy-addioalcelibato.com", description: "Breite Palette an Aktivitäten in Mailand." },
  { id: 166, country: "Italien", countryCode: "IT", city: "Mailand", name: "Notte da Leoni Mailand", website: "https://www.nottedaleoni.it/it/list.php?c=celibato", phone: "(+39) 055 06 20 887", email: "info@nottedaleoni.it", description: "Themenpakete für JGA in Mailand." },
  { id: 167, country: "Italien", countryCode: "IT", city: "Mailand", name: "Arara Azul Events", website: "https://www.ararazulevents.com/addio-al-nubilato-milano/", phone: "+39 351 3500590", email: "info@ararazulevents.com", description: "Spezialisiert auf Junggesellinnenabschiede." },
  { id: 168, country: "Italien", countryCode: "IT", city: "Venedig", name: "VivoVenetia", website: "https://www.vivovenetia.it/attivita-addio-nubilato/", phone: "+39 041 877 9125", email: "info@vivovenetia.com", description: "Schatzsuchen und Bootstouren in Venedig." },
  { id: 169, country: "Italien", countryCode: "IT", city: "Venedig", name: "Notte da Leoni Venedig", website: "https://www.nottedaleoni.it/", phone: "(+39) 055 06 20 887", email: "info@nottedaleoni.it", description: "JGA in Venedig und ganz Italien." },
  { id: 170, country: "Italien", countryCode: "IT", city: "Venedig", name: "San Marco Events & Tours", website: "https://www.organizzazioneeventivenezia.com/en/event-planner-venice/bachelorette-bachelor-parties-venice/", phone: "+39 041 5138296", email: "info@organizzazioneeventivenezia.com", description: "Boutique-Agentur für JGA in Venedig." },
];

// Country metadata with flag emojis
export const COUNTRIES: Record<string, { name: string; emoji: string; cities: string[] }> = {
  DE: { name: "Deutschland", emoji: "🇩🇪", cities: [] },
  AT: { name: "Österreich", emoji: "🇦🇹", cities: [] },
  CH: { name: "Schweiz", emoji: "🇨🇭", cities: [] },
  NL: { name: "Niederlande", emoji: "🇳🇱", cities: [] },
  BE: { name: "Belgien", emoji: "🇧🇪", cities: [] },
  FR: { name: "Frankreich", emoji: "🇫🇷", cities: [] },
  ES: { name: "Spanien", emoji: "🇪🇸", cities: [] },
  PT: { name: "Portugal", emoji: "🇵🇹", cities: [] },
  IT: { name: "Italien", emoji: "🇮🇹", cities: [] },
};

// Populate cities dynamically
AGENCIES.forEach(agency => {
  if (COUNTRIES[agency.countryCode] && !COUNTRIES[agency.countryCode].cities.includes(agency.city)) {
    COUNTRIES[agency.countryCode].cities.push(agency.city);
  }
});

// Sort cities alphabetically
Object.values(COUNTRIES).forEach(country => {
  country.cities.sort();
});

// Helper functions
export function getAgenciesByCountry(countryCode: string): Agency[] {
  return AGENCIES.filter(a => a.countryCode === countryCode);
}

export function getAgenciesByCity(city: string): Agency[] {
  return AGENCIES.filter(a => a.city === city);
}

export function searchAgencies(query: string): Agency[] {
  const lowerQuery = query.toLowerCase();
  return AGENCIES.filter(a => 
    a.name.toLowerCase().includes(lowerQuery) ||
    a.city.toLowerCase().includes(lowerQuery) ||
    a.country.toLowerCase().includes(lowerQuery) ||
    a.description.toLowerCase().includes(lowerQuery)
  );
}

export function getUniqueCountries(): string[] {
  return [...new Set(AGENCIES.map(a => a.countryCode))];
}

export function getCitiesForCountry(countryCode: string): string[] {
  return COUNTRIES[countryCode]?.cities || [];
}
