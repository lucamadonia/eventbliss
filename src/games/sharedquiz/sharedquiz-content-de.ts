export interface SharedQuizQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  hint: string;
  category: string;
}

export const SHARED_QUIZ_QUESTIONS: SharedQuizQuestion[] = [
  // Geografie (10)
  { question: 'Welche Stadt hat mehr Brücken als Venedig?', answers: ['Amsterdam', 'Hamburg', 'St. Petersburg', 'Stockholm'], correctIndex: 1, hint: 'Diese Stadt liegt in Norddeutschland und hat einen großen Hafen.', category: 'Geografie' },
  { question: 'Welches Land hat die Form eines Stiefels?', answers: ['Griechenland', 'Kroatien', 'Italien', 'Portugal'], correctIndex: 2, hint: 'Denkt an Pizza, Pasta und den Papst.', category: 'Geografie' },
  { question: 'In welchem Land liegt die Sahara hauptsächlich?', answers: ['Ägypten', 'Algerien', 'Libyen', 'Marokko'], correctIndex: 1, hint: 'Das flächenmäßig größte Land Afrikas.', category: 'Geografie' },
  { question: 'Welcher ist der längste Fluss Europas?', answers: ['Donau', 'Rhein', 'Wolga', 'Elbe'], correctIndex: 2, hint: 'Er fließt durch Russland und mündet ins Kaspische Meer.', category: 'Geografie' },
  { question: 'Wie heißt die Hauptstadt von Australien?', answers: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2, hint: 'Es ist NICHT die größte Stadt des Landes.', category: 'Geografie' },
  { question: 'Welches Meer liegt zwischen Europa und Afrika?', answers: ['Rotes Meer', 'Mittelmeer', 'Schwarzes Meer', 'Nordsee'], correctIndex: 1, hint: 'Touristen fahren hierhin für Sonne und Strand.', category: 'Geografie' },
  { question: 'In welchem Land steht die Freiheitsstatue?', answers: ['Frankreich', 'USA', 'England', 'Kanada'], correctIndex: 1, hint: 'Sie war ein Geschenk aus Frankreich an dieses Land.', category: 'Geografie' },
  { question: 'Welcher Kontinent ist am kältesten?', answers: ['Arktis', 'Antarktis', 'Grönland', 'Sibirien'], correctIndex: 1, hint: 'Pinguine leben dort, aber keine Eisbären.', category: 'Geografie' },
  { question: 'Welches ist das kleinste Bundesland Deutschlands?', answers: ['Hamburg', 'Saarland', 'Bremen', 'Berlin'], correctIndex: 2, hint: 'Diese Hansestadt liegt im Nordwesten.', category: 'Geografie' },
  { question: 'In welchem Land liegt Angkor Wat?', answers: ['Thailand', 'Vietnam', 'Kambodscha', 'Myanmar'], correctIndex: 2, hint: 'Die Tempelanlage ist auf der Flagge dieses Landes.', category: 'Geografie' },

  // Geschichte (10)
  { question: 'Wer schrieb die Neunte Sinfonie?', answers: ['Mozart', 'Bach', 'Beethoven', 'Schubert'], correctIndex: 2, hint: 'Er wurde taub und komponierte trotzdem weiter.', category: 'Geschichte' },
  { question: 'In welchem Jahr wurde die Titanic versenkt?', answers: ['1910', '1912', '1914', '1916'], correctIndex: 1, hint: 'Zwei Jahre vor dem Ersten Weltkrieg.', category: 'Geschichte' },
  { question: 'Wer war der erste deutsche Bundeskanzler?', answers: ['Willy Brandt', 'Konrad Adenauer', 'Ludwig Erhard', 'Helmut Schmidt'], correctIndex: 1, hint: 'Er regierte von 1949 bis 1963.', category: 'Geschichte' },
  { question: 'Welches Bauwerk wurde 1889 in Paris errichtet?', answers: ['Arc de Triomphe', 'Louvre', 'Eiffelturm', 'Notre-Dame'], correctIndex: 2, hint: 'Es wurde für eine Weltausstellung gebaut und ist aus Eisen.', category: 'Geschichte' },
  { question: 'Wer erfand die Glühbirne?', answers: ['Nikola Tesla', 'Thomas Edison', 'Alexander Bell', 'Benjamin Franklin'], correctIndex: 1, hint: 'Er gründete auch General Electric.', category: 'Geschichte' },
  { question: 'Welches Tier war Kleopatras Lieblingshaustier?', answers: ['Hund', 'Katze', 'Schlange', 'Papagei'], correctIndex: 1, hint: 'Diese Tiere wurden im alten Ägypten als heilig verehrt.', category: 'Geschichte' },
  { question: 'Wann wurde das Internet öffentlich zugänglich?', answers: ['1985', '1991', '1995', '2000'], correctIndex: 1, hint: 'Tim Berners-Lee veröffentlichte das World Wide Web.', category: 'Geschichte' },
  { question: 'Welche Sprache sprach man im Römischen Reich?', answers: ['Griechisch', 'Latein', 'Aramäisch', 'Keltisch'], correctIndex: 1, hint: 'Viele medizinische Fachbegriffe stammen aus dieser Sprache.', category: 'Geschichte' },
  { question: 'Wer war der erste Mensch im Weltraum?', answers: ['Neil Armstrong', 'Juri Gagarin', 'Buzz Aldrin', 'John Glenn'], correctIndex: 1, hint: 'Er kam aus der Sowjetunion und flog 1961.', category: 'Geschichte' },
  { question: 'Welches Spiel wurde 1903 erfunden?', answers: ['Schach', 'Monopoly', 'Mensch ärgere dich nicht', 'Scrabble'], correctIndex: 2, hint: 'Ein Brettspiel mit Würfeln und bunten Figuren aus Deutschland.', category: 'Geschichte' },

  // Wissenschaft (10)
  { question: 'Woraus bestehen Diamanten?', answers: ['Silizium', 'Kohlenstoff', 'Quarz', 'Kalzium'], correctIndex: 1, hint: 'Das gleiche Element findet man in Bleistiftminen.', category: 'Wissenschaft' },
  { question: 'Welcher Planet ist der Sonne am nächsten?', answers: ['Venus', 'Merkur', 'Mars', 'Erde'], correctIndex: 1, hint: 'Er ist auch der kleinste Planet unseres Sonnensystems.', category: 'Wissenschaft' },
  { question: 'Wie viele Zähne hat ein Erwachsener normalerweise?', answers: ['28', '30', '32', '34'], correctIndex: 2, hint: 'Inklusive der vier Weisheitszähne.', category: 'Wissenschaft' },
  { question: 'Was ist schwerer: ein Kilo Federn oder ein Kilo Stahl?', answers: ['Federn', 'Stahl', 'Gleich schwer', 'Kommt auf die Menge an'], correctIndex: 2, hint: 'Denkt genau nach — es steht schon in der Frage.', category: 'Wissenschaft' },
  { question: 'Welches Tier hat drei Herzen?', answers: ['Krake', 'Qualle', 'Hai', 'Schildkröte'], correctIndex: 0, hint: 'Es hat auch acht Arme und blaues Blut.', category: 'Wissenschaft' },
  { question: 'Wie heißt das Gas, das wir einatmen?', answers: ['Stickstoff', 'CO2', 'Sauerstoff', 'Wasserstoff'], correctIndex: 2, hint: 'Ohne dieses Gas könnten wir nicht überleben — Formel O2.', category: 'Wissenschaft' },
  { question: 'Welches Organ verbraucht die meiste Energie?', answers: ['Herz', 'Gehirn', 'Leber', 'Muskeln'], correctIndex: 1, hint: 'Es wiegt nur 1,5 kg, braucht aber 20% des Sauerstoffs.', category: 'Wissenschaft' },
  { question: 'Wie schnell ist der Schall ungefähr?', answers: ['340 m/s', '1.200 m/s', '3.000 m/s', '100 m/s'], correctIndex: 0, hint: 'Donner kommt nach dem Blitz — pro 3 Sekunden ca. 1 km.', category: 'Wissenschaft' },
  { question: 'Welches Metall ist flüssig bei Raumtemperatur?', answers: ['Blei', 'Quecksilber', 'Zink', 'Aluminium'], correctIndex: 1, hint: 'Es wurde früher in Thermometern verwendet.', category: 'Wissenschaft' },
  { question: 'Wie heißt der größte Knochen im menschlichen Körper?', answers: ['Schienenbein', 'Oberschenkelknochen', 'Oberarmknochen', 'Becken'], correctIndex: 1, hint: 'Er befindet sich im Oberschenkel — lateinisch: Femur.', category: 'Wissenschaft' },

  // Unterhaltung & Popkultur (10)
  { question: 'Welche Band sang "Bohemian Rhapsody"?', answers: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'], correctIndex: 1, hint: 'Der Sänger hieß Freddie und kam aus Sansibar.', category: 'Unterhaltung' },
  { question: 'In welchem Film gibt es einen Ring der Macht?', answers: ['Harry Potter', 'Narnia', 'Herr der Ringe', 'Game of Thrones'], correctIndex: 2, hint: 'Ein Hobbit muss ihn zum Schicksalsberg bringen.', category: 'Unterhaltung' },
  { question: 'Welches Tier ist Simba?', answers: ['Tiger', 'Löwe', 'Leopard', 'Gepard'], correctIndex: 1, hint: 'Disney-Film — „König der …"', category: 'Unterhaltung' },
  { question: 'Wie heißt der Zauberer bei Harry Potter mit Vor- und Nachnamen?', answers: ['Harry Potter', 'Albus Dumbledore', 'Gandalf der Graue', 'Merlin'], correctIndex: 1, hint: 'Er ist der Schulleiter von Hogwarts.', category: 'Unterhaltung' },
  { question: 'Welche Farbe hat das Monster von Loch Ness angeblich?', answers: ['Grün', 'Blau', 'Schwarz', 'Grau-grün'], correctIndex: 3, hint: 'Nessie — angeblich ein Seeungeheuer in Schottland.', category: 'Unterhaltung' },
  { question: 'Welcher Superheld ist Bruce Wayne?', answers: ['Superman', 'Spider-Man', 'Batman', 'Iron Man'], correctIndex: 2, hint: 'Er lebt in Gotham City und hat kein Superkraft — nur Geld.', category: 'Unterhaltung' },
  { question: 'Welche Serie spielt in Hawkins, Indiana?', answers: ['Breaking Bad', 'Stranger Things', 'The Walking Dead', 'Dark'], correctIndex: 1, hint: 'Kinder kämpfen gegen Monster aus dem Upside Down.', category: 'Unterhaltung' },
  { question: 'Wer singt "Shape of You"?', answers: ['Justin Bieber', 'Ed Sheeran', 'Bruno Mars', 'The Weeknd'], correctIndex: 1, hint: 'Ein rothaariger britischer Singer-Songwriter.', category: 'Unterhaltung' },
  { question: 'In welchem Spiel baut man mit Blöcken?', answers: ['Fortnite', 'Roblox', 'Minecraft', 'Terraria'], correctIndex: 2, hint: 'Es hat Creeper, Endermen und Diamanten.', category: 'Unterhaltung' },
  { question: 'Welche Farbe hat Pikachus Schwanz?', answers: ['Gelb', 'Schwarz', 'Braun', 'Gelb mit schwarzer Spitze'], correctIndex: 3, hint: 'Es ist ein elektrisches Pokémon mit roten Wangen.', category: 'Unterhaltung' },

  // Sport (10)
  { question: 'Wie viele Spieler hat eine Fußballmannschaft?', answers: ['10', '11', '12', '9'], correctIndex: 1, hint: 'Inklusive Torwart auf dem Feld.', category: 'Sport' },
  { question: 'In welchem Land wurde Judo erfunden?', answers: ['China', 'Korea', 'Japan', 'Thailand'], correctIndex: 2, hint: 'Die Kampfkunst wurde 1882 von Jigoro Kano gegründet.', category: 'Sport' },
  { question: 'Welcher Tennisplatz ist aus rotem Sand?', answers: ['Wimbledon', 'Roland Garros', 'US Open', 'Australian Open'], correctIndex: 1, hint: 'Dieses Turnier findet in Paris statt.', category: 'Sport' },
  { question: 'Wie viele Ringe hat das olympische Symbol?', answers: ['4', '5', '6', '7'], correctIndex: 1, hint: 'Jeder Ring steht für einen Kontinent.', category: 'Sport' },
  { question: 'Welches Land gewann die Fußball-WM 2014?', answers: ['Argentinien', 'Brasilien', 'Deutschland', 'Spanien'], correctIndex: 2, hint: 'Mario Götze schoss das Tor im Finale.', category: 'Sport' },
  { question: 'Wie heißt die höchste Punktzahl beim Bowling?', answers: ['200', '250', '300', '350'], correctIndex: 2, hint: 'Alle 12 Würfe müssen Strikes sein.', category: 'Sport' },
  { question: 'Welche Sportart wird auf Eis mit einem Puck gespielt?', answers: ['Curling', 'Eishockey', 'Eiskunstlauf', 'Eisschnelllauf'], correctIndex: 1, hint: 'Spieler tragen Schlittschuhe und Helme.', category: 'Sport' },
  { question: 'Wie lang ist ein Marathonlauf?', answers: ['40 km', '42,195 km', '45 km', '38 km'], correctIndex: 1, hint: 'Die Distanz geht auf eine Legende aus dem antiken Griechenland zurück.', category: 'Sport' },
  { question: 'In welcher Sportart gibt es einen „Slam Dunk"?', answers: ['Volleyball', 'Handball', 'Basketball', 'Tennis'], correctIndex: 2, hint: 'Der Ball wird von oben in den Korb gestopft.', category: 'Sport' },
  { question: 'Welches Tier ist das Symbol des Ferrari-Logos?', answers: ['Stier', 'Löwe', 'Pferd', 'Adler'], correctIndex: 2, hint: 'Ein aufbäumendes Tier auf gelbem Hintergrund.', category: 'Sport' },

  // Allgemeinwissen (12)
  { question: 'Wie viele Farben hat ein Regenbogen?', answers: ['5', '6', '7', '8'], correctIndex: 2, hint: 'Rot, Orange, Gelb, Grün, Blau, Indigo und …', category: 'Allgemeinwissen' },
  { question: 'Was ist das häufigste Element im Universum?', answers: ['Helium', 'Sauerstoff', 'Wasserstoff', 'Kohlenstoff'], correctIndex: 2, hint: 'Die Sonne besteht hauptsächlich aus diesem Gas.', category: 'Allgemeinwissen' },
  { question: 'Welches Instrument hat 88 Tasten?', answers: ['Orgel', 'Klavier', 'Akkordeon', 'Synthesizer'], correctIndex: 1, hint: 'Schwarz und weiße Tasten — Klassiker im Musikunterricht.', category: 'Allgemeinwissen' },
  { question: 'In welcher Einheit misst man elektrischen Strom?', answers: ['Volt', 'Watt', 'Ampere', 'Ohm'], correctIndex: 2, hint: 'Benannt nach dem französischen Physiker André-Marie.', category: 'Allgemeinwissen' },
  { question: 'Wie viele Bundesländer hat Deutschland?', answers: ['14', '15', '16', '17'], correctIndex: 2, hint: 'Drei davon sind Stadtstaaten: Berlin, Hamburg und Bremen.', category: 'Allgemeinwissen' },
  { question: 'Welche Blutgruppe ist der universelle Spender?', answers: ['A', 'B', 'AB', '0 negativ'], correctIndex: 3, hint: 'Diese Blutgruppe hat keine Antigene auf den roten Blutkörperchen.', category: 'Allgemeinwissen' },
  { question: 'Wie heißt die Währung in Japan?', answers: ['Yuan', 'Won', 'Yen', 'Baht'], correctIndex: 2, hint: 'Das Symbol ist ¥.', category: 'Allgemeinwissen' },
  { question: 'Welcher Tag ist Valentinstag?', answers: ['14. Januar', '14. Februar', '14. März', '14. April'], correctIndex: 1, hint: 'Der Tag der Liebenden — mit Rosen und Schokolade.', category: 'Allgemeinwissen' },
  { question: 'Wie viele Sekunden hat eine Stunde?', answers: ['3.000', '3.600', '4.200', '6.000'], correctIndex: 1, hint: '60 Minuten mal 60 Sekunden.', category: 'Allgemeinwissen' },
  { question: 'Welches Vitamin produziert der Körper durch Sonnenlicht?', answers: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin B12'], correctIndex: 2, hint: 'Es ist wichtig für Knochen und wird oft im Winter supplementiert.', category: 'Allgemeinwissen' },
  { question: 'Wie viele Nullen hat eine Million?', answers: ['5', '6', '7', '8'], correctIndex: 1, hint: '1.000 mal 1.000.', category: 'Allgemeinwissen' },
  { question: 'Welches Tier kann seinen Kopf um 270 Grad drehen?', answers: ['Chamäleon', 'Eule', 'Flamingo', 'Papagei'], correctIndex: 1, hint: 'Nachtaktiver Vogel mit großen Augen.', category: 'Allgemeinwissen' },
];
