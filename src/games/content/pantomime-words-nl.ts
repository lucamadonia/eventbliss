/**
 * OHNE WORTE — Begriffe auf Niederländisch.
 *
 * Das hier ist eine ANPASSUNG, keine Übersetzung. Ein Begriff taugt nur dann,
 * wenn er sich OHNE Ton und OHNE Requisit darstellen lässt UND im
 * niederländischen Kulturraum bekannt ist. Wörtlich übersetzte deutsche
 * Begriffe erfüllen regelmäßig nur die erste Hälfte davon.
 *
 * Konkret heißt das:
 * - Redewendungen (`sprichwoerter`) sind KEINE Übersetzungen der deutschen
 *   Vorlage, sondern 50 gängige niederländische Redewendungen — „Met de deur
 *   in huis vallen" oder „Een appeltje voor de dorst" statt einer sinnfreien
 *   Wort-für-Wort-Fassung von „Schwein haben".
 * - Filmtitel (`filme`) stehen in der ortsüblichen Fassung; in den
 *   Niederlanden laufen Filme meist unter dem englischen Originaltitel.
 *   Titel ohne Bekanntheit dort sind ersetzt: statt „Tatort" steht hier
 *   „Flikken Maastricht".
 * - Märchen (`maerchen`) sind lokal geläufige Figuren, inklusive Sinterklaas.
 * - Bei `tiere`, `berufe`, `alltag`, `sport` und `gefuehle` trägt meist die
 *   direkte Entsprechung, geprüft wurde trotzdem die Darstellbarkeit.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel, keine Anzeige.
 * Apostrophe sind bewusst vermieden, damit die Strings ohne Maskierung
 * auskommen.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_NL: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Dieren',
    emoji: '🐘',
    words: [
      'Olifant', 'Giraf', 'Pinguïn', 'Kangoeroe', 'Slang',
      'Adelaar', 'Kikker', 'Krokodil', 'Aap', 'Leeuw',
      'Bij', 'Vlinder', 'Spin', 'Krab', 'Haai',
      'Walvis', 'Dolfijn', 'Egel', 'Uil', 'Ooievaar',
      'Pauw', 'Luiaard', 'Stokstaartje', 'Kameel', 'Neushoorn',
      'Flamingo', 'Schildpad', 'Vleermuis', 'Mol', 'Kreeft',
      'Kwal', 'Zeepaardje', 'Wasbeer', 'Eekhoorn', 'Kolibrie',
      'Struisvogel', 'Gorilla', 'Wolf', 'Vos', 'Haas',
      'Koe', 'Varken', 'Kip', 'Paard', 'Kat',
      'Hond', 'Eend', 'Geit', 'Schaap', 'Muis',
    ],
  },
  {
    id: 'berufe',
    name: 'Beroepen',
    emoji: '👷',
    words: [
      'Brandweerman', 'Kok', 'Tandarts', 'Piloot', 'Kapper',
      'Politieagent', 'Leraar', 'Bouwvakker', 'Ober', 'Tuinman',
      'Fotograaf', 'Dirigent', 'Clown', 'Astronaut', 'Duiker',
      'Bakker', 'Slager', 'Schilder', 'Lasser', 'Postbode',
      'Vuilnisman', 'Buschauffeur', 'Rechter', 'Advocaat', 'Chirurg',
      'Verpleegkundige', 'Dierenarts', 'Bibliothecaris', 'Caissière', 'Barman',
      'DJ', 'Acteur', 'Voetbaltrainer', 'Scheidsrechter', 'Berggids',
      'Imker', 'Herder', 'Visser', 'Boer', 'Monteur',
      'Elektricien', 'Loodgieter', 'Dakdekker', 'Schoorsteenveger', 'Secretaresse',
      'Fotomodel', 'Stuntman', 'Goochelaar', 'Marktkoopman', 'Conciërge',
    ],
  },
  {
    id: 'filme',
    name: 'Films en series',
    emoji: '🎬',
    words: [
      'Titanic', 'The Godfather', 'Star Wars', 'Jurassic Park', 'The Lion King',
      'Rocky', 'Terminator', 'The Matrix', 'Pirates of the Caribbean', 'The Lord of the Rings',
      'Harry Potter', 'E.T.', 'Jaws', 'Ghostbusters', 'Back to the Future',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'The Wizard of Oz', 'Mary Poppins', 'Frozen',
      'Finding Nemo', 'Shrek', 'Ice Age', 'Toy Story', 'The Jungle Book',
      'Aladdin', 'Mulan', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'The Simpsons', 'Game of Thrones', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Baywatch', 'Flikken Maastricht', 'Dark', 'Squid Game',
      'La Casa de Papel', 'Gravity', 'The Martian', 'Avatar', 'The Exorcist',
    ],
  },
  {
    id: 'alltag',
    name: 'Dagelijks leven',
    emoji: '🪥',
    words: [
      'Tanden poetsen', 'Koffie zetten', 'Was ophangen', 'Stofzuigen', 'Ramen lappen',
      'Veters strikken', 'Paraplu opendoen', 'Auto wassen', 'Gras maaien', 'Vuilnis buitenzetten',
      'Bed opmaken', 'Afwassen', 'Strijken', 'Haren föhnen', 'Nagels knippen',
      'Boterham smeren', 'Ei breken', 'Pasta afgieten', 'Pizza bestellen', 'Winkelwagen duwen',
      'In de rij staan', 'De bus missen', 'Band plakken', 'Band verwisselen', 'Kast in elkaar zetten',
      'Spijker inslaan', 'Lamp vervangen', 'Pakketje uitpakken', 'Cadeau inpakken', 'Brief posten',
      'Sleutels zoeken', 'Telefoon opladen', 'Selfie maken', 'Zappen', 'Wekker uitzetten',
      'Verslapen', 'Koffer pakken', 'Tent opzetten', 'Barbecueën', 'Sneeuwpop maken',
      'Planten water geven', 'Hond uitlaten', 'Baby verschonen', 'Flossen', 'Niezen',
      'Gapen', 'De hik', 'Kauwgom kauwen', 'Wachten op de lift', 'Verdwalen',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Voetbal', 'Basketbal', 'Tennis', 'Golf', 'Boksen',
      'Zwemmen', 'Duiken', 'Skiën', 'Snowboarden', 'Schaatsen',
      'Turnen', 'Hoogspringen', 'Verspringen', 'Polsstokhoogspringen', 'Speerwerpen',
      'Kogelstoten', 'Hordenlopen', 'Marathon', 'Wielrennen', 'Roeien',
      'Zeilen', 'Surfen', 'Klimmen', 'Bergbeklimmen', 'Paardrijden',
      'Boogschieten', 'Schermen', 'Judo', 'Karate', 'Worstelen',
      'Gewichtheffen', 'Tafeltennis', 'Badminton', 'Volleybal', 'Handbal',
      'Hockey', 'IJshockey', 'Rugby', 'Honkbal', 'Cricket',
      'Bowlen', 'Darts', 'Biljart', 'Skateboarden', 'Rolschaatsen',
      'Trampolinespringen', 'Yoga', 'Touwtjespringen', 'Vissen', 'Formule 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Gevoelens',
    emoji: '😤',
    words: [
      'Woede', 'Vreugde', 'Angst', 'Verdriet', 'Walging',
      'Verrassing', 'Verveling', 'Nervositeit', 'Trots', 'Schaamte',
      'Jaloezie', 'Afgunst', 'Verliefdheid', 'Heimwee', 'Vermoeidheid',
      'Uitputting', 'Paniek', 'Opluchting', 'Teleurstelling', 'Gêne',
      'Leedvermaak', 'Verlangen', 'Tevredenheid', 'Ongeduld', 'Wantrouwen',
      'Nieuwsgierigheid', 'Enthousiasme', 'Frustratie', 'Schok', 'Ontzag',
      'Dankbaarheid', 'Hoop', 'Wanhoop', 'Kalmte', 'Opwinding',
      'Koppigheid', 'Medelijden', 'Bewondering', 'Verwarring', 'Scepsis',
      'Ergernis', 'Verlegenheid', 'Moed', 'Lafheid', 'Spijt',
      'Triomf', 'Eenzaamheid', 'Geborgenheid', 'Reislust', 'Voorpret',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Spreekwoorden',
    emoji: '💬',
    words: [
      'Met de deur in huis vallen', 'Een appeltje voor de dorst', 'Twee vliegen in een klap', 'De kat uit de boom kijken', 'Een kat in de zak kopen',
      'De handdoek in de ring gooien', 'De spijker op de kop slaan', 'Uit je dak gaan', 'Een oogje dichtknijpen', 'Op je tandvlees lopen',
      'De kop in het zand steken', 'Olie op het vuur gooien', 'Het ijs breken', 'Boter bij de vis', 'Nu komt de aap uit de mouw',
      'De draad kwijt zijn', 'In de roos schieten', 'Je neus ophalen', 'Met een mond vol tanden staan', 'Duimen drukken',
      'Op je neus kijken', 'Als een olifant in een porseleinkast', 'Het zwarte schaap zijn', 'Iemand op de kast jagen', 'Je oren spitsen',
      'Van een mug een olifant maken', 'Ergens geen kaas van gegeten hebben', 'Als een kip zonder kop', 'Met de handen in het haar zitten', 'Een pak van je hart',
      'De benen nemen', 'In het diepe springen', 'Iemand in de maling nemen', 'Op de vuist gaan', 'Zijn hart luchten',
      'Er met de pet naar gooien', 'Op hete kolen zitten', 'Een blok aan het been', 'Door het lint gaan', 'Zich in het zweet werken',
      'De klok horen luiden', 'Handen uit de mouwen steken', 'Iemand de oren wassen', 'Van de hak op de tak springen', 'Een steekje los hebben',
      'Iemand het hoofd op hol brengen', 'Uit de lucht komen vallen', 'Op zeker spelen', 'Een storm in een glas water', 'Zand in de ogen strooien',
    ],
  },
  {
    id: 'maerchen',
    name: 'Sprookjes en figuren',
    emoji: '🧚',
    words: [
      'Roodkapje', 'Sneeuwwitje', 'Assepoester', 'Doornroosje', 'Rapunzel',
      'Hans en Grietje', 'De kikkerkoning', 'Repelsteeltje', 'De Bremer stadsmuzikanten', 'De gelaarsde kat',
      'Pinokkio', 'Peter Pan', 'Alice in Wonderland', 'Robin Hood', 'Koning Arthur',
      'Hercules', 'Zeus', 'Poseidon', 'Medusa', 'Icarus',
      'Frankenstein', 'Dracula', 'De Kerstman', 'Sinterklaas', 'De tandenfee',
      'Een eenhoorn', 'Een draak', 'Een dwerg', 'Een reus', 'Een heks',
      'Een tovenaar', 'Een ridder', 'Een piraat', 'Een zeemeermin', 'Een vampier',
      'Een weerwolf', 'Een zombie', 'Een spook', 'Een robot', 'Een buitenaards wezen',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollem', 'De Grinch', 'Sinbad', 'Ali Baba',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptease', 'Tongzoen', 'Blind date', 'Condoom', 'Lingerie',
      'Paaldansen', 'Buikdansen', 'Lapdance', 'Handboeien', 'Kamasutra',
      'Vrijgezellenfeest', 'Tinderdate', 'Versierzin', 'Een blauwtje lopen', 'Flirten',
      'Zuigzoen', 'Liefdesbrief', 'Hartkloppingen', 'Verleiding', 'Ogen dichthouden',
      'Massage', 'Schuimbad', 'Rozenblaadjes', 'Kaarslicht', 'Huwelijksnacht',
      'Huwelijksreis', 'Zwangerschapstest', 'Relatieruzie', 'Jaloeziescène', 'Scheiding',
      'De ex', 'Vreemdgaan', 'Gênante foto', 'Bekentenis', 'Leugendetector',
      'Wodkashot', 'Kater in de ochtend', 'Dronken dansen', 'Karaoke midden in de nacht', 'Bierbuik',
      'Naaktzwemmen', 'Naaktstrand', 'Sauna', 'Tattoo laten zetten', 'Piercing',
      'Sixpack showen', 'Spierballen tonen', 'Jezelf in de spiegel bewonderen', 'Stiekem naar huis sluipen', 'De rekening delen',
    ],
  },
];
