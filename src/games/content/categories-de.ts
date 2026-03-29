export interface CategoryPrompt {
  category: string;
  letter?: string;
}

export interface GameCategory {
  id: string;
  name: string;
  terms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const CATEGORY_NAMES = [
  'Tiere', 'Laender', 'Staedte', 'Berufe', 'Sportarten', 'Filme',
  'Serien', 'Marken', 'Obstsorten', 'Gemuesesorten', 'Automarken',
  'Farben', 'Musikinstrumente', 'Getraenke', 'Suessigkeiten',
  'Schulfaecher', 'Sprachen', 'Blumen', 'Baeume', 'Gewuerze',
  'Kleidungsstuecke', 'Moebelstuecke', 'Koerperteile', 'Werkzeuge',
  'Musikbands', 'Comicfiguren', 'Superhelden', 'Disney-Figuren',
  'Kuechengeraete', 'Ballsportarten', 'Wassersportarten',
  'Wintersportarten', 'Saeugetiere', 'Voegel', 'Fische',
  'Insekten', 'Europaeische Hauptstaedte', 'Deutsche Staedte',
  'Pizzabelaege', 'Cocktails', 'Brotsorten', 'Kaesesorten',
  'Tanzstile', 'Kartenspiele', 'Brettspiele', 'Videospiele',
  'Kraeuter', 'Nuesse', 'Minerale', 'Stoffarten',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUVW'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_DE: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Tiere',
    terms: ['Hund', 'Katze', 'Pferd', 'Kuh', 'Schwein', 'Huhn', 'Schaf', 'Ziege', 'Elefant', 'Loewe', 'Tiger', 'Baer', 'Affe', 'Delfin', 'Adler', 'Schlange', 'Frosch', 'Hase', 'Igel', 'Eichhoernchen'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Laender',
    terms: ['Deutschland', 'Frankreich', 'Italien', 'Spanien', 'England', 'USA', 'Japan', 'Brasilien', 'Australien', 'Kanada', 'Mexiko', 'Indien', 'China', 'Russland', 'Aegypten', 'Suedafrika', 'Argentinien', 'Schweden', 'Griechenland', 'Portugal'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Staedte',
    terms: ['Berlin', 'Paris', 'London', 'Rom', 'Madrid', 'New York', 'Tokio', 'Wien', 'Zuerich', 'Amsterdam', 'Prag', 'Barcelona', 'Istanbul', 'Dubai', 'Sydney', 'Muenchen', 'Hamburg', 'Koeln', 'Stockholm', 'Lissabon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Automarken',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Opel', 'Skoda', 'Hyundai', 'Mazda', 'Jaguar'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Obstsorten',
    terms: ['Apfel', 'Banane', 'Orange', 'Erdbeere', 'Kirsche', 'Traube', 'Wassermelone', 'Ananas', 'Mango', 'Kiwi', 'Birne', 'Pfirsich', 'Pflaume', 'Himbeere', 'Blaubeere', 'Zitrone', 'Limette', 'Kokosnuss', 'Granatapfel', 'Feige'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Berufe',
    terms: ['Arzt', 'Lehrer', 'Polizist', 'Feuerwehrmann', 'Koch', 'Pilot', 'Anwalt', 'Ingenieur', 'Mechaniker', 'Krankenschwester', 'Architekt', 'Elektriker', 'Baecker', 'Metzger', 'Gaertner', 'Journalist', 'Fotograf', 'Richter', 'Apotheker', 'Zahnarzt'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filme',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Der Herr der Ringe', 'Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'Der Pate', 'Gladiator', 'Findet Nemo', 'Die Eiskoenigin', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Fluch der Karibik', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Serien',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'Haus des Geldes', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Bridgerton', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Lupin'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sportarten',
    terms: ['Fussball', 'Tennis', 'Basketball', 'Schwimmen', 'Leichtathletik', 'Volleyball', 'Handball', 'Eishockey', 'Golf', 'Boxen', 'Ski', 'Snowboard', 'Surfen', 'Klettern', 'Rudern', 'Fechten', 'Judo', 'Turnen', 'Reiten', 'Tischtennis'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marken',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Essen',
    terms: ['Pizza', 'Pasta', 'Burger', 'Sushi', 'Schnitzel', 'Bratwurst', 'Kartoffelsalat', 'Lasagne', 'Tacos', 'Curry', 'Pommes', 'Doener', 'Steak', 'Suppe', 'Salat', 'Brezel', 'Croissant', 'Pfannkuchen', 'Knoedel', 'Rouladen'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Musikgenres',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Klassik', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Schlager', 'Volksmusik', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videospiele',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Farben',
    terms: ['Rot', 'Blau', 'Gruen', 'Gelb', 'Orange', 'Lila', 'Rosa', 'Weiss', 'Schwarz', 'Braun', 'Grau', 'Tuerkis', 'Gold', 'Silber', 'Beige', 'Bordeaux', 'Mint', 'Koralle', 'Indigo', 'Khaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumente',
    terms: ['Gitarre', 'Klavier', 'Schlagzeug', 'Geige', 'Floete', 'Trompete', 'Saxophon', 'Harfe', 'Cello', 'Klarinette', 'Oboe', 'Posaune', 'Akkordeon', 'Ukulele', 'Tuba', 'Kontrabass', 'Dudelsack', 'Mundharmonika', 'Triangel', 'Xylophon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Kleidung',
    terms: ['T-Shirt', 'Jeans', 'Kleid', 'Anzug', 'Pullover', 'Jacke', 'Mantel', 'Schuhe', 'Stiefel', 'Muetze', 'Schal', 'Handschuhe', 'Rock', 'Bluse', 'Hemd', 'Socken', 'Guertel', 'Krawatte', 'Shorts', 'Badeanzug'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Moebel',
    terms: ['Tisch', 'Stuhl', 'Sofa', 'Bett', 'Schrank', 'Regal', 'Kommode', 'Schreibtisch', 'Sessel', 'Hocker', 'Vitrine', 'Nachttisch', 'Garderobe', 'Truhe', 'Bank', 'Sideboard', 'Haengematte', 'Buecherregal', 'Esstisch', 'Couchtisch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Werkzeuge',
    terms: ['Hammer', 'Schraubenzieher', 'Zange', 'Saege', 'Bohrmaschine', 'Schraubenschluessel', 'Wasserwaage', 'Meissel', 'Feile', 'Schleifpapier', 'Massband', 'Loetkolben', 'Axt', 'Hobel', 'Stechbeitel', 'Pinsel', 'Spachtel', 'Kelle', 'Sechskantschluessel', 'Rohrzange'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Blumen',
    terms: ['Rose', 'Tulpe', 'Sonnenblume', 'Lilie', 'Orchidee', 'Gaensebluemchen', 'Nelke', 'Veilchen', 'Lavendel', 'Geranie', 'Dahlie', 'Mohn', 'Iris', 'Narzisse', 'Chrysantheme', 'Hibiskus', 'Jasmin', 'Magnolie', 'Krokus', 'Primel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Gewuerze',
    terms: ['Salz', 'Pfeffer', 'Paprika', 'Zimt', 'Kurkuma', 'Oregano', 'Basilikum', 'Rosmarin', 'Thymian', 'Muskatnuss', 'Ingwer', 'Knoblauch', 'Safran', 'Chili', 'Vanille', 'Koriander', 'Kreuzkuemmel', 'Anis', 'Dill', 'Petersilie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Getraenke',
    terms: ['Wasser', 'Kaffee', 'Tee', 'Bier', 'Wein', 'Cola', 'Limonade', 'Orangensaft', 'Milch', 'Kakao', 'Smoothie', 'Cocktail', 'Champagner', 'Whisky', 'Wodka', 'Gin', 'Apfelschorle', 'Eistee', 'Espresso', 'Gluehwein'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Schulfaecher',
    terms: ['Mathematik', 'Deutsch', 'Englisch', 'Biologie', 'Physik', 'Chemie', 'Geschichte', 'Geografie', 'Kunst', 'Musik', 'Sport', 'Informatik', 'Franzoesisch', 'Religion', 'Ethik', 'Politik', 'Wirtschaft', 'Latein', 'Philosophie', 'Spanisch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Sprachen',
    terms: ['Deutsch', 'Englisch', 'Franzoesisch', 'Spanisch', 'Italienisch', 'Portugiesisch', 'Russisch', 'Chinesisch', 'Japanisch', 'Arabisch', 'Tuerkisch', 'Koreanisch', 'Hindi', 'Polnisch', 'Niederlaendisch', 'Schwedisch', 'Griechisch', 'Tschechisch', 'Ungarisch', 'Finnisch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Himmelsobjekte',
    terms: ['Merkur', 'Venus', 'Erde', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptun', 'Mond', 'Sonne', 'Pluto', 'Komet', 'Asteroid', 'Milchstrasse', 'Schwarzes Loch', 'Nebel', 'Roter Zwerg', 'Supernova', 'Meteorit', 'Galaxie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Koerperteile',
    terms: ['Kopf', 'Hand', 'Fuss', 'Auge', 'Nase', 'Mund', 'Ohr', 'Arm', 'Bein', 'Finger', 'Zehe', 'Knie', 'Ellbogen', 'Schulter', 'Ruecken', 'Bauch', 'Hals', 'Stirn', 'Lippe', 'Zunge'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Maerchenfiguren',
    terms: ['Rotkappchen', 'Aschenputtel', 'Schneewittchen', 'Rapunzel', 'Haensel', 'Gretel', 'Dornroeschen', 'Rumpelstilzchen', 'Frau Holle', 'Der gestiefelte Kater', 'Hans im Glueck', 'Bremer Stadtmusikanten', 'Froschkoenig', 'Sterntaler', 'Schneekoenigin', 'Goldloeckchen', 'Daeumling', 'Der Wolf', 'Die boese Stiefmutter', 'Pinocchio'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superhelden',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Captain America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Green Lantern', 'Hawkeye', 'Black Widow', 'Vision', 'Scarlet Witch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Emojis beschreiben',
    terms: ['Lachendes Gesicht', 'Herz', 'Daumen hoch', 'Feuer', 'Traenen lachen', 'Kuss', 'Zwinkern', 'Nachdenklich', 'Trauriges Gesicht', 'Wuetend', 'Party', 'Geist', 'Clown', 'Roboter', 'Affe', 'Einhorn', 'Regenbogen', 'Rakete', 'Krone', 'Diamant'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Brettspiele',
    terms: ['Schach', 'Monopoly', 'Risiko', 'Scrabble', 'Cluedo', 'Mensch aergere dich nicht', 'Siedler von Catan', 'Dame', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Halma', 'Muehlespiel', 'Activity', 'Tabu', 'Pictionary', 'Jenga', 'Stratego', 'Vier gewinnt', 'Memory'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Fussballvereine',
    terms: ['Bayern Muenchen', 'Borussia Dortmund', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Paris Saint-Germain', 'Juventus', 'AC Mailand', 'Inter Mailand', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Benfica Lissabon', 'FC Porto', 'Atletico Madrid', 'RB Leipzig', 'Bayer Leverkusen', 'Schalke 04', 'Eintracht Frankfurt'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    terms: ['Schokoladenkuchen', 'Tiramisu', 'Creme brulee', 'Eis', 'Panna Cotta', 'Apfelstrudel', 'Brownie', 'Cheesecake', 'Mousse au Chocolat', 'Waffeln', 'Pfannkuchen', 'Pudding', 'Muffin', 'Macaron', 'Donut', 'Baklava', 'Schwarzwaelder Kirschtorte', 'Kaiserschmarrn', 'Strudel', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Wetterphaenomene',
    terms: ['Regen', 'Schnee', 'Gewitter', 'Hagel', 'Nebel', 'Wind', 'Sturm', 'Tornado', 'Hurrikan', 'Sonnenschein', 'Regenbogen', 'Frost', 'Tau', 'Blitz', 'Donner', 'Wolken', 'Hitze', 'Kaelte', 'Eiszapfen', 'Schneeflocke'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Transportmittel',
    terms: ['Auto', 'Fahrrad', 'Bus', 'Zug', 'Flugzeug', 'Schiff', 'Motorrad', 'Strassenbahn', 'U-Bahn', 'Taxi', 'Hubschrauber', 'Roller', 'Boot', 'Segelboot', 'Kanu', 'Heissluftballon', 'Einrad', 'Skateboard', 'Kutsche', 'Gondel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Hauptstaedte',
    terms: ['Berlin', 'Paris', 'London', 'Madrid', 'Rom', 'Wien', 'Bern', 'Washington', 'Tokio', 'Peking', 'Moskau', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Kairo', 'Athen', 'Warschau', 'Prag', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Feiertage und Feste',
    terms: ['Weihnachten', 'Ostern', 'Silvester', 'Karneval', 'Valentinstag', 'Halloween', 'Muttertag', 'Vatertag', 'Erntedankfest', 'Tag der Deutschen Einheit', 'Nikolaus', 'Fasching', 'Pfingsten', 'Himmelfahrt', 'Allerheiligen', 'Reformationstag', 'Fronleichnam', 'Advent', 'Dreikoenig', 'Oktoberfest'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Beruehmte Personen',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Kleopatra', 'Napoleon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Che Guevara', 'Anne Frank', 'Pablo Picasso', 'Beethoven', 'Goethe', 'Schiller', 'Karl Marx', 'Angela Merkel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Gemuese',
    terms: ['Tomate', 'Gurke', 'Karotte', 'Brokkoli', 'Blumenkohl', 'Paprika', 'Zwiebel', 'Knoblauch', 'Spinat', 'Zucchini', 'Aubergine', 'Erbsen', 'Bohnen', 'Mais', 'Sellerie', 'Radieschen', 'Kohlrabi', 'Kuerbis', 'Spargel', 'Rosenkohl'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insekten und Krabbeltiere',
    terms: ['Ameise', 'Biene', 'Schmetterling', 'Marienkaefer', 'Spinne', 'Muecke', 'Fliege', 'Wespe', 'Heuschrecke', 'Libelle', 'Kaefer', 'Raupe', 'Grille', 'Hummel', 'Schnecke', 'Regenwurm', 'Kakerlake', 'Ohrwurm', 'Zecke', 'Floh'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Beruehmte Bauwerke',
    terms: ['Eiffelturm', 'Kolosseum', 'Chinesische Mauer', 'Taj Mahal', 'Freiheitsstatue', 'Big Ben', 'Brandenburger Tor', 'Pyramiden von Gizeh', 'Akropolis', 'Petersdom', 'Burj Khalifa', 'Sydney Opera House', 'Sagrada Familia', 'Tower Bridge', 'Schloss Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentor', 'Golden Gate Bridge', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Tanzstile',
    terms: ['Walzer', 'Tango', 'Salsa', 'Ballett', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrott', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Volkstanz', 'Jazz Dance', 'Contemporary', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Kaesesorten',
    terms: ['Gouda', 'Emmentaler', 'Camembert', 'Brie', 'Mozzarella', 'Parmesan', 'Cheddar', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Edamer', 'Tilsiter', 'Mascarpone', 'Raclette', 'Ziegenkaese', 'Manchego', 'Pecorino', 'Havarti', 'Bergkaese'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_DE = CATEGORY_NAMES;
