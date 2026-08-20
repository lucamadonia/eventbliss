/**
 * OHNE WORTE — Begriffe auf Deutsch.
 *
 * Auswahlkriterium für jeden Begriff: Er muss sich OHNE Ton und OHNE Requisit
 * darstellen lassen. Das klingt selbstverständlich, ist es aber nicht — die
 * Hälfte aller schönen Wörter fällt daran durch. „Demokratie" ist ein prima
 * Wort und eine miserable Pantomime.
 *
 * Deshalb stehen hier vor allem Dinge mit einer typischen BEWEGUNG (Pinguin,
 * Boxen, Zähneputzen), einer typischen FORM (Giraffe, Regenschirm) oder einer
 * typischen SZENE (Titanic, Ins Fettnäpfchen treten). Abstrakte Begriffe stehen
 * nur dort, wo sie ein Gesicht haben — die Kategorie „Gefühle" lebt genau davon.
 *
 * Aufbau übernommen von `headup-words-de.ts`: Kategoriename und Emoji stehen
 * mit in der Sprachdatei, weil die Datei ohnehin je Sprache existiert.
 */

export type PantomimeCategoryId =
  | 'tiere'
  | 'berufe'
  | 'filme'
  | 'alltag'
  | 'sport'
  | 'gefuehle'
  | 'sprichwoerter'
  | 'maerchen'
  | 'ab18';

export interface PantomimeCategory {
  id: PantomimeCategoryId;
  name: string;
  emoji: string;
  /**
   * Nur sichtbar, wenn der 18+-Bereich freigeschaltet ist
   * (`useDrinkingMode().isActivated`). Ohne Freischaltung erscheint die
   * Kategorie nicht in der Auswahl und ihre Begriffe kommen auch nicht in die
   * Mischung.
   */
  adult?: boolean;
  words: string[];
}

export const PANTOMIME_CATEGORIES_DE: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Tiere',
    emoji: '🐘',
    words: [
      'Elefant', 'Giraffe', 'Pinguin', 'Känguru', 'Schlange',
      'Adler', 'Frosch', 'Krokodil', 'Affe', 'Löwe',
      'Biene', 'Schmetterling', 'Spinne', 'Krabbe', 'Hai',
      'Wal', 'Delfin', 'Igel', 'Eule', 'Storch',
      'Pfau', 'Faultier', 'Erdmännchen', 'Kamel', 'Nashorn',
      'Flamingo', 'Schildkröte', 'Fledermaus', 'Maulwurf', 'Hummer',
      'Qualle', 'Seepferdchen', 'Waschbär', 'Eichhörnchen', 'Kolibri',
      'Strauß', 'Gorilla', 'Wolf', 'Fuchs', 'Hase',
      'Kuh', 'Schwein', 'Huhn', 'Pferd', 'Katze',
      'Hund', 'Ente', 'Ziege', 'Schaf', 'Maus',
    ],
  },
  {
    id: 'berufe',
    name: 'Berufe',
    emoji: '👷',
    words: [
      'Feuerwehrmann', 'Koch', 'Zahnarzt', 'Pilot', 'Friseur',
      'Polizist', 'Lehrer', 'Bauarbeiter', 'Kellner', 'Gärtner',
      'Fotograf', 'Dirigent', 'Clown', 'Astronaut', 'Taucher',
      'Bäcker', 'Metzger', 'Maler', 'Schweißer', 'Briefträger',
      'Müllmann', 'Busfahrer', 'Richter', 'Anwalt', 'Chirurg',
      'Krankenpfleger', 'Tierarzt', 'Bibliothekar', 'Kassiererin', 'Barkeeper',
      'DJ', 'Schauspieler', 'Fußballtrainer', 'Schiedsrichter', 'Bergführer',
      'Imker', 'Schäfer', 'Fischer', 'Bauer', 'Mechaniker',
      'Elektriker', 'Klempner', 'Dachdecker', 'Schornsteinfeger', 'Sekretärin',
      'Model', 'Stuntman', 'Zauberer', 'Marktschreier', 'Hausmeister',
    ],
  },
  {
    id: 'filme',
    name: 'Filme & Serien',
    emoji: '🎬',
    words: [
      'Titanic', 'Der Pate', 'Star Wars', 'Jurassic Park', 'Der König der Löwen',
      'Rocky', 'Terminator', 'Matrix', 'Fluch der Karibik', 'Herr der Ringe',
      'Harry Potter', 'E.T.', 'Der weiße Hai', 'Ghostbusters', 'Zurück in die Zukunft',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'Der Zauberer von Oz', 'Mary Poppins', 'Die Eiskönigin',
      'Findet Nemo', 'Shrek', 'Ice Age', 'Toy Story', 'Das Dschungelbuch',
      'Aladdin', 'Cinderella', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Die Simpsons', 'Game of Thrones', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Baywatch', 'Tatort', 'Dark', 'Squid Game',
      'Haus des Geldes', 'Gravity', 'Der Marsianer', 'Avatar', 'Der Exorzist',
    ],
  },
  {
    id: 'alltag',
    name: 'Alltag',
    emoji: '🪥',
    words: [
      'Zähneputzen', 'Kaffee kochen', 'Wäsche aufhängen', 'Staubsaugen', 'Fenster putzen',
      'Schuhe binden', 'Regenschirm aufspannen', 'Auto waschen', 'Rasen mähen', 'Müll rausbringen',
      'Bett machen', 'Geschirr spülen', 'Bügeln', 'Haare föhnen', 'Nägel schneiden',
      'Brot schmieren', 'Ei aufschlagen', 'Nudeln abgießen', 'Pizza bestellen', 'Einkaufswagen schieben',
      'Schlange stehen', 'Den Bus verpassen', 'Fahrrad flicken', 'Reifen wechseln', 'Regal aufbauen',
      'Nagel einschlagen', 'Glühbirne wechseln', 'Paket auspacken', 'Geschenk einpacken', 'Brief einwerfen',
      'Schlüssel suchen', 'Handy laden', 'Selfie machen', 'Durch die Kanäle zappen', 'Wecker ausschalten',
      'Verschlafen', 'Koffer packen', 'Zelt aufbauen', 'Grillen', 'Schneemann bauen',
      'Blumen gießen', 'Hund ausführen', 'Baby wickeln', 'Zahnseide benutzen', 'Niesen',
      'Gähnen', 'Schluckauf', 'Kaugummi kauen', 'Auf den Aufzug warten', 'Sich verlaufen',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Fußball', 'Basketball', 'Tennis', 'Golf', 'Boxen',
      'Schwimmen', 'Tauchen', 'Skifahren', 'Snowboarden', 'Eislaufen',
      'Turnen', 'Hochsprung', 'Weitsprung', 'Stabhochsprung', 'Speerwurf',
      'Kugelstoßen', 'Hürdenlauf', 'Marathon', 'Radfahren', 'Rudern',
      'Segeln', 'Surfen', 'Klettern', 'Bergsteigen', 'Reiten',
      'Bogenschießen', 'Fechten', 'Judo', 'Karate', 'Ringen',
      'Gewichtheben', 'Tischtennis', 'Badminton', 'Volleyball', 'Handball',
      'Hockey', 'Eishockey', 'Rugby', 'Baseball', 'Cricket',
      'Bowling', 'Darts', 'Billard', 'Skateboard', 'Rollschuhlaufen',
      'Trampolinspringen', 'Yoga', 'Seilspringen', 'Angeln', 'Formel 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Gefühle',
    emoji: '😤',
    words: [
      'Wut', 'Freude', 'Angst', 'Trauer', 'Ekel',
      'Überraschung', 'Langeweile', 'Nervosität', 'Stolz', 'Scham',
      'Eifersucht', 'Neid', 'Verliebtheit', 'Heimweh', 'Müdigkeit',
      'Erschöpfung', 'Panik', 'Erleichterung', 'Enttäuschung', 'Verlegenheit',
      'Schadenfreude', 'Sehnsucht', 'Zufriedenheit', 'Ungeduld', 'Misstrauen',
      'Neugier', 'Begeisterung', 'Frust', 'Schock', 'Ehrfurcht',
      'Dankbarkeit', 'Hoffnung', 'Verzweiflung', 'Gelassenheit', 'Aufregung',
      'Trotz', 'Mitleid', 'Bewunderung', 'Verwirrung', 'Skepsis',
      'Genervtheit', 'Schüchternheit', 'Mut', 'Feigheit', 'Reue',
      'Triumph', 'Einsamkeit', 'Geborgenheit', 'Fernweh', 'Vorfreude',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Sprichwörter',
    emoji: '💬',
    words: [
      'Da steppt der Bär', 'Tomaten auf den Augen haben', 'Die Nase voll haben', 'Auf dem Schlauch stehen', 'Ins Fettnäpfchen treten',
      'Aus einer Mücke einen Elefanten machen', 'Die Katze im Sack kaufen', 'Da liegt der Hund begraben', 'Hals über Kopf', 'Daumen drücken',
      'Den Nagel auf den Kopf treffen', 'Ins kalte Wasser springen', 'Zwei Fliegen mit einer Klappe', 'Alles in Butter', 'Schnee von gestern',
      'Das Handtuch werfen', 'Auf großem Fuß leben', 'Die Kuh vom Eis holen', 'Schwein haben', 'Auf Wolke sieben schweben',
      'Eulen nach Athen tragen', 'Perlen vor die Säue werfen', 'Der Groschen fällt', 'Butter bei die Fische', 'Klar wie Kloßbrühe',
      'Einen Frosch im Hals haben', 'Das schwarze Schaf sein', 'Wie ein Elefant im Porzellanladen', 'Jemandem auf den Keks gehen', 'Die Ohren spitzen',
      'Ein Auge zudrücken', 'Über den Tellerrand schauen', 'Den Kopf in den Sand stecken', 'Öl ins Feuer gießen', 'Das Eis brechen',
      'Sich ein Bein ausreißen', 'Auf dem Holzweg sein', 'Jemanden auf den Arm nehmen', 'Die Flinte ins Korn werfen', 'Alle Hände voll zu tun',
      'Etwas aus dem Ärmel schütteln', 'Den Faden verlieren', 'Ins Schwarze treffen', 'Die Nase rümpfen', 'Bauklötze staunen',
      'Ein Brett vor dem Kopf haben', 'Die Beine in die Hand nehmen', 'Jemandem den Kopf verdrehen', 'Auf Nummer sicher gehen', 'Aus allen Wolken fallen',
    ],
  },
  {
    id: 'maerchen',
    name: 'Märchen & Figuren',
    emoji: '🧚',
    words: [
      'Rotkäppchen', 'Schneewittchen', 'Aschenputtel', 'Dornröschen', 'Rapunzel',
      'Hänsel und Gretel', 'Der Froschkönig', 'Rumpelstilzchen', 'Die Bremer Stadtmusikanten', 'Der gestiefelte Kater',
      'Pinocchio', 'Peter Pan', 'Alice im Wunderland', 'Robin Hood', 'König Artus',
      'Herkules', 'Zeus', 'Poseidon', 'Medusa', 'Ikarus',
      'Frankenstein', 'Dracula', 'Der Weihnachtsmann', 'Der Osterhase', 'Die Zahnfee',
      'Ein Einhorn', 'Ein Drache', 'Ein Zwerg', 'Ein Riese', 'Eine Hexe',
      'Ein Zauberer', 'Ein Ritter', 'Ein Pirat', 'Eine Meerjungfrau', 'Ein Vampir',
      'Ein Werwolf', 'Ein Zombie', 'Ein Gespenst', 'Ein Roboter', 'Ein Außerirdischer',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'Der Grinch', 'Sindbad', 'Ali Baba',
    ],
  },
  {
    id: 'ab18',
    name: 'Ab 18',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptease', 'Zungenkuss', 'Blind Date', 'Kondom', 'Dessous',
      'Poledance', 'Bauchtanz', 'Lapdance', 'Handschellen', 'Kamasutra',
      'Junggesellenabschied', 'Tinder-Date', 'Anmachspruch', 'Einen Korb bekommen', 'Flirten',
      'Knutschfleck', 'Liebesbrief', 'Herzklopfen', 'Verführung', 'Augen zuhalten',
      'Massage', 'Schaumbad', 'Rosenblätter', 'Kerzenlicht', 'Hochzeitsnacht',
      'Flitterwochen', 'Schwangerschaftstest', 'Beziehungsstreit', 'Eifersuchtsszene', 'Trennung',
      'Der Ex-Partner', 'Seitensprung', 'Peinliches Foto', 'Beichte', 'Lügendetektor',
      'Wodka-Shot', 'Kater am Morgen', 'Betrunken tanzen', 'Karaoke um drei Uhr nachts', 'Bierbauch',
      'Nacktbaden', 'FKK-Strand', 'Sauna', 'Tattoo stechen lassen', 'Piercing',
      'Sixpack zeigen', 'Muskeln spielen lassen', 'Sich im Spiegel bewundern', 'Nachts heimschleichen', 'Die Rechnung teilen',
    ],
  },
];
