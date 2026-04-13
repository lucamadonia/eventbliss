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
  'Tiere', 'Länder', 'Staedte', 'Berufe', 'Sportarten', 'Filme',
  'Serien', 'Marken', 'Obstsorten', 'Gemüsesorten', 'Automarken',
  'Farben', 'Musikinstrumente', 'Getränke', 'Süßigkeiten',
  'Schulfaecher', 'Sprachen', 'Blumen', 'Baeume', 'Gewürze',
  'Kleidungsstücke', 'Moebelstücke', 'Körperteile', 'Werkzeuge',
  'Musikbands', 'Comicfiguren', 'Superhelden', 'Disney-Figuren',
  'Kuechengeraete', 'Ballsportarten', 'Wassersportarten',
  'Wintersportarten', 'Säugetiere', 'Vögel', 'Fische',
  'Insekten', 'Europaeische Hauptstaedte', 'Deutsche Staedte',
  'Pizzabelaege', 'Cocktails', 'Brotsorten', 'Käsesorten',
  'Tanzstile', 'Kartenspiele', 'Brettspiele', 'Videospiele',
  'Kraeuter', 'Nüsse', 'Minerale', 'Stoffarten',
  'Hunderassen', 'Dinosaurier', 'Erfindungen', 'Cocktails',
  'Computerbegriffe', 'Mythologie', 'Brotsorten', 'Säugetiere',
  'Vögel', 'Fische', 'Süßigkeiten', 'Deutsche Staedte',
  'Europaeische Hauptstaedte', 'Gemüsesorten', 'Musikinstrumente',
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
    terms: ['Hund', 'Katze', 'Pferd', 'Kuh', 'Schwein', 'Huhn', 'Schaf', 'Ziege', 'Elefant', 'Löwe', 'Tiger', 'Baer', 'Affe', 'Delfin', 'Adler', 'Schlange', 'Frosch', 'Hase', 'Igel', 'Eichhörnchen'],
    difficulty: 'easy',
  },
  {
    id: 'cat-länder',
    name: 'Länder',
    terms: ['Deutschland', 'Frankreich', 'Italien', 'Spanien', 'England', 'USA', 'Japan', 'Brasilien', 'Australien', 'Kanada', 'Mexiko', 'Indien', 'China', 'Russland', 'Ägypten', 'Suedafrika', 'Argentinien', 'Schweden', 'Griechenland', 'Portugal'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Staedte',
    terms: ['Berlin', 'Paris', 'London', 'Rom', 'Madrid', 'New York', 'Tokio', 'Wien', 'Zürich', 'Amsterdam', 'Prag', 'Barcelona', 'Istanbul', 'Dubai', 'Sydney', 'München', 'Hamburg', 'Köln', 'Stockholm', 'Lissabon'],
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
    terms: ['Arzt', 'Lehrer', 'Polizist', 'Feuerwehrmann', 'Koch', 'Pilot', 'Anwalt', 'Ingenieur', 'Mechaniker', 'Krankenschwester', 'Architekt', 'Elektriker', 'Bäcker', 'Metzger', 'Gärtner', 'Journalist', 'Fotograf', 'Richter', 'Apotheker', 'Zahnarzt'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filme',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Der Herr der Ringe', 'Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'Der Pate', 'Gladiator', 'Findet Nemo', 'Die Eiskönigin', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Fluch der Karibik', 'Pulp Fiction'],
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
    terms: ['Fußball', 'Tennis', 'Basketball', 'Schwimmen', 'Leichtathletik', 'Volleyball', 'Handball', 'Eishockey', 'Golf', 'Boxen', 'Ski', 'Snowboard', 'Surfen', 'Klettern', 'Rudern', 'Fechten', 'Judo', 'Turnen', 'Reiten', 'Tischtennis'],
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
    terms: ['Pizza', 'Pasta', 'Burger', 'Sushi', 'Schnitzel', 'Bratwurst', 'Kartoffelsalat', 'Lasagne', 'Tacos', 'Curry', 'Pommes', 'Döner', 'Steak', 'Suppe', 'Salat', 'Brezel', 'Croissant', 'Pfannkuchen', 'Knoedel', 'Rouladen'],
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
    name: 'Gewürze',
    terms: ['Salz', 'Pfeffer', 'Paprika', 'Zimt', 'Kurkuma', 'Oregano', 'Basilikum', 'Rosmarin', 'Thymian', 'Muskatnuss', 'Ingwer', 'Knoblauch', 'Safran', 'Chili', 'Vanille', 'Koriander', 'Kreuzkuemmel', 'Anis', 'Dill', 'Petersilie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Getränke',
    terms: ['Wasser', 'Kaffee', 'Tee', 'Bier', 'Wein', 'Cola', 'Limonade', 'Orangensaft', 'Milch', 'Kakao', 'Smoothie', 'Cocktail', 'Champagner', 'Whisky', 'Wodka', 'Gin', 'Apfelschorle', 'Eistee', 'Espresso', 'Glühwein'],
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
    terms: ['Merkur', 'Venus', 'Erde', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptun', 'Mond', 'Sonne', 'Pluto', 'Komet', 'Asteroid', 'Milchstraße', 'Schwarzes Loch', 'Nebel', 'Roter Zwerg', 'Supernova', 'Meteorit', 'Galaxie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-körperteile',
    name: 'Körperteile',
    terms: ['Kopf', 'Hand', 'Fuss', 'Auge', 'Nase', 'Mund', 'Ohr', 'Arm', 'Bein', 'Finger', 'Zehe', 'Knie', 'Ellbogen', 'Schulter', 'Rücken', 'Bauch', 'Hals', 'Stirn', 'Lippe', 'Zunge'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Märchenfiguren',
    terms: ['Rotkappchen', 'Aschenputtel', 'Schneewittchen', 'Rapunzel', 'Haensel', 'Gretel', 'Dornroeschen', 'Rumpelstilzchen', 'Frau Holle', 'Der gestiefelte Kater', 'Hans im Glück', 'Bremer Stadtmusikanten', 'Froschkönig', 'Sterntaler', 'Schneekönigin', 'Goldloeckchen', 'Daeumling', 'Der Wolf', 'Die boese Stiefmutter', 'Pinocchio'],
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
    terms: ['Schach', 'Monopoly', 'Risiko', 'Scrabble', 'Cluedo', 'Mensch ärgere dich nicht', 'Siedler von Catan', 'Dame', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Halma', 'Muehlespiel', 'Activity', 'Tabu', 'Pictionary', 'Jenga', 'Stratego', 'Vier gewinnt', 'Memory'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fußballvereine',
    name: 'Fußballvereine',
    terms: ['Bayern München', 'Borussia Dortmund', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Paris Saint-Germain', 'Juventus', 'AC Mailand', 'Inter Mailand', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Benfica Lissabon', 'FC Porto', 'Atletico Madrid', 'RB Leipzig', 'Bayer Leverkusen', 'Schalke 04', 'Eintracht Frankfurt'],
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
    terms: ['Auto', 'Fahrrad', 'Bus', 'Zug', 'Flugzeug', 'Schiff', 'Motorrad', 'Straßenbahn', 'U-Bahn', 'Taxi', 'Hubschrauber', 'Roller', 'Boot', 'Segelboot', 'Kanu', 'Heissluftballon', 'Einrad', 'Skateboard', 'Kutsche', 'Gondel'],
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
    terms: ['Weihnachten', 'Ostern', 'Silvester', 'Karneval', 'Valentinstag', 'Halloween', 'Muttertag', 'Vatertag', 'Erntedankfest', 'Tag der Deutschen Einheit', 'Nikolaus', 'Fasching', 'Pfingsten', 'Himmelfahrt', 'Allerheiligen', 'Reformationstag', 'Fronleichnam', 'Advent', 'Dreikönig', 'Oktoberfest'],
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
    name: 'Gemüse',
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
    name: 'Käsesorten',
    terms: ['Gouda', 'Emmentaler', 'Camembert', 'Brie', 'Mozzarella', 'Parmesan', 'Cheddar', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Edamer', 'Tilsiter', 'Mascarpone', 'Raclette', 'Ziegenkaese', 'Manchego', 'Pecorino', 'Havarti', 'Bergkaese'],
    difficulty: 'hard',
  },
  {
    id: 'cat-cocktails',
    name: 'Cocktails',
    terms: ['Mojito', 'Caipirinha', 'Margarita', 'Pina Colada', 'Cosmopolitan', 'Mai Tai', 'Daiquiri', 'Negroni', 'Manhattan', 'Old Fashioned', 'Martini', 'Aperol Spritz', 'Bloody Mary', 'Moscow Mule', 'Long Island Iced Tea', 'Cuba Libre', 'Tequila Sunrise', 'Sex on the Beach', 'Gin Tonic', 'Hugo'],
    difficulty: 'medium',
  },
  {
    id: 'cat-dinosaurier',
    name: 'Dinosaurier',
    terms: ['Tyrannosaurus Rex', 'Triceratops', 'Velociraptor', 'Stegosaurus', 'Brachiosaurus', 'Pteranodon', 'Ankylosaurus', 'Diplodocus', 'Spinosaurus', 'Parasaurolophus', 'Allosaurus', 'Iguanodon', 'Pachycephalosaurus', 'Archaeopteryx', 'Plesiosaurus', 'Megalosaurus', 'Oviraptor', 'Deinonychus', 'Mosasaurus', 'Apatosaurus'],
    difficulty: 'hard',
  },
  {
    id: 'cat-erfindungen',
    name: 'Erfindungen',
    terms: ['Buchdruck', 'Gluehbirne', 'Telefon', 'Dampfmaschine', 'Automobil', 'Flugzeug', 'Kompass', 'Schiesspulver', 'Penicillin', 'Internet', 'Rad', 'Fernseher', 'Kugelschreiber', 'Reissverschluss', 'Dynamit', 'Roentgenstrahlen', 'Mikroskop', 'Thermometer', 'Streichholz', 'Toilettenspuelung'],
    difficulty: 'medium',
  },
  {
    id: 'cat-computerbegriffe',
    name: 'Computerbegriffe',
    terms: ['Browser', 'Festplatte', 'Prozessor', 'Arbeitsspeicher', 'Betriebssystem', 'Firewall', 'Cloud', 'Algorithmus', 'Pixel', 'Server', 'Datenbank', 'Backup', 'Router', 'Virus', 'Download', 'Upload', 'Cursor', 'Desktop', 'Spam', 'Trojaner'],
    difficulty: 'medium',
  },
  {
    id: 'cat-mythologie',
    name: 'Mythologie',
    terms: ['Zeus', 'Odin', 'Thor', 'Aphrodite', 'Poseidon', 'Hades', 'Athene', 'Apollo', 'Herkules', 'Medusa', 'Minotaurus', 'Pegasus', 'Phoenix', 'Loki', 'Freya', 'Anubis', 'Ra', 'Artemis', 'Achilles', 'Odysseus'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brotsorten',
    name: 'Brotsorten',
    terms: ['Vollkornbrot', 'Weissbrot', 'Roggenbrot', 'Pumpernickel', 'Baguette', 'Ciabatta', 'Focaccia', 'Fladenbrot', 'Sauerteigbrot', 'Toastbrot', 'Dinkelbrot', 'Bauernbrot', 'Mehrkornbrot', 'Nussbrot', 'Schwarzbrot', 'Brioche', 'Knäckebrot', 'Laugenbrot', 'Mischbrot', 'Kartoffelbrot'],
    difficulty: 'medium',
  },
  {
    id: 'cat-stoffarten',
    name: 'Stoffarten',
    terms: ['Baumwolle', 'Seide', 'Wolle', 'Leinen', 'Polyester', 'Denim', 'Kaschmir', 'Samt', 'Satin', 'Nylon', 'Fleece', 'Tweed', 'Cord', 'Spitze', 'Taft', 'Organza', 'Viskose', 'Chiffon', 'Filz', 'Jute'],
    difficulty: 'hard',
  },
  {
    id: 'cat-kartenspiele',
    name: 'Kartenspiele',
    terms: ['Skat', 'Poker', 'Rommee', 'Bridge', 'Mau-Mau', 'Canasta', 'Doppelkopf', 'Schafkopf', 'Blackjack', 'UNO', 'Patience', 'Schwimmen', 'Wizard', 'Phase 10', 'Hearts', 'Snap', 'Elfer raus', 'Skip-Bo', 'Bohnanza', 'Durak'],
    difficulty: 'medium',
  },
  {
    id: 'cat-minerale',
    name: 'Minerale und Edelsteine',
    terms: ['Diamant', 'Rubin', 'Smaragd', 'Saphir', 'Amethyst', 'Topas', 'Opal', 'Jade', 'Granat', 'Turmalin', 'Aquamarin', 'Perle', 'Bernstein', 'Obsidian', 'Quarz', 'Lapislazuli', 'Malachit', 'Mondstein', 'Onyx', 'Tigerauge'],
    difficulty: 'hard',
  },
  {
    id: 'cat-nuesse',
    name: 'Nüsse',
    terms: ['Walnuss', 'Haselnuss', 'Mandel', 'Cashew', 'Pistazie', 'Erdnuss', 'Macadamia', 'Pekanuss', 'Paranuss', 'Kokosnuss', 'Pinienkern', 'Maroni', 'Muskatnuss', 'Sonnenblumenkern', 'Sesam', 'Kuerbiskern', 'Chiasamen', 'Leinsamen', 'Hanfsamen', 'Mohnsamen'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kraeuter',
    name: 'Kraeuter',
    terms: ['Basilikum', 'Petersilie', 'Schnittlauch', 'Minze', 'Rosmarin', 'Thymian', 'Oregano', 'Salbei', 'Dill', 'Koriander', 'Estragon', 'Majoran', 'Liebstoeckel', 'Kerbel', 'Zitronenmelisse', 'Bohnenkraut', 'Lorbeer', 'Brunnenkresse', 'Baerlauch', 'Borretsch'],
    difficulty: 'medium',
  },
  {
    id: 'cat-baeume',
    name: 'Baeume',
    terms: ['Eiche', 'Buche', 'Birke', 'Kiefer', 'Fichte', 'Tanne', 'Ahorn', 'Linde', 'Kastanie', 'Weide', 'Pappel', 'Erle', 'Esche', 'Ulme', 'Platane', 'Zeder', 'Mammutbaum', 'Olivenbaum', 'Palme', 'Eukalyptus'],
    difficulty: 'medium',
  },
  {
    id: 'cat-saeugetiere',
    name: 'Säugetiere',
    terms: ['Wal', 'Fledermaus', 'Delfin', 'Elefant', 'Giraffe', 'Nilpferd', 'Nashorn', 'Gepard', 'Gorilla', 'Orang-Utan', 'Luchs', 'Otter', 'Dachs', 'Hermelin', 'Murmeltier', 'Lemur', 'Okapi', 'Tapir', 'Schnabeltier', 'Seekuh'],
    difficulty: 'medium',
  },
  {
    id: 'cat-voegel',
    name: 'Vögel',
    terms: ['Adler', 'Falke', 'Specht', 'Eule', 'Papagei', 'Kolibri', 'Flamingo', 'Pelikan', 'Pfau', 'Strauss', 'Albatros', 'Rabe', 'Kuckuck', 'Schwalbe', 'Storch', 'Amsel', 'Rotkehlchen', 'Elster', 'Eisvogel', 'Kranich'],
    difficulty: 'medium',
  },
  {
    id: 'cat-fische',
    name: 'Fische',
    terms: ['Lachs', 'Forelle', 'Thunfisch', 'Hai', 'Karpfen', 'Hecht', 'Barsch', 'Kabeljau', 'Hering', 'Sardine', 'Makrele', 'Stör', 'Aal', 'Seepferdchen', 'Kugelfisch', 'Schwertfisch', 'Rochen', 'Clownfisch', 'Goldfisch', 'Piranha'],
    difficulty: 'medium',
  },
  {
    id: 'cat-pizzabelaege',
    name: 'Pizzabelaege',
    terms: ['Salami', 'Schinken', 'Pilze', 'Paprika', 'Oliven', 'Zwiebel', 'Ananas', 'Thunfisch', 'Mozzarella', 'Parmesan', 'Rucola', 'Artischocken', 'Sardellen', 'Mais', 'Jalapenos', 'Spinat', 'Gorgonzola', 'Knoblauch', 'Peperoni', 'Kapern'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wintersportarten',
    name: 'Wintersportarten',
    terms: ['Skifahren', 'Snowboarden', 'Eislaufen', 'Eishockey', 'Rodeln', 'Biathlon', 'Langlauf', 'Skispringen', 'Curling', 'Eisschnelllauf', 'Bobfahren', 'Eiskunstlauf', 'Freestyle-Ski', 'Skeleton', 'Nordische Kombination', 'Eisstockschiessen', 'Schneeschuhwandern', 'Eisklettern', 'Hundeschlitten', 'Skicross'],
    difficulty: 'medium',
  },
  {
    id: 'cat-wassersportarten',
    name: 'Wassersportarten',
    terms: ['Schwimmen', 'Surfen', 'Tauchen', 'Segeln', 'Rudern', 'Kanu', 'Wasserball', 'Wasserski', 'Kitesurfen', 'Windsurfen', 'Wakeboarden', 'Stand-Up-Paddeln', 'Schnorcheln', 'Rafting', 'Kajak', 'Jet-Ski', 'Synchronschwimmen', 'Klippenspringen', 'Turmspringen', 'Wildwasserfahren'],
    difficulty: 'medium',
  },
  {
    id: 'cat-ballsportarten',
    name: 'Ballsportarten',
    terms: ['Fußball', 'Basketball', 'Tennis', 'Volleyball', 'Handball', 'Baseball', 'Rugby', 'Cricket', 'Golf', 'Tischtennis', 'Badminton', 'Bowling', 'Squash', 'Lacrosse', 'Wasserball', 'Hockey', 'Polo', 'Boccia', 'Billard', 'Footvolley'],
    difficulty: 'easy',
  },
  {
    id: 'cat-comicfiguren',
    name: 'Comicfiguren',
    terms: ['Mickey Mouse', 'Donald Duck', 'Asterix', 'Obelix', 'Tim und Struppi', 'Lucky Luke', 'Garfield', 'Snoopy', 'Die Schluempfe', 'SpongeBob', 'Bart Simpson', 'Homer Simpson', 'Bugs Bunny', 'Tom und Jerry', 'Popeye', 'Werner', 'Fix und Foxi', 'Wickie', 'Biene Maja', 'Benjamin Bluemchen'],
    difficulty: 'easy',
  },
  {
    id: 'cat-disneyfiguren',
    name: 'Disney-Figuren',
    terms: ['Micky Maus', 'Donald Duck', 'Goofy', 'Pluto', 'Elsa', 'Anna', 'Rapunzel', 'Arielle', 'Simba', 'Bambi', 'Dumbo', 'Cinderella', 'Mulan', 'Pocahontas', 'Aladdin', 'Moana', 'Buzz Lightyear', 'Woody', 'Nemo', 'Stitch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kuechengeraete',
    name: 'Kuechengeraete',
    terms: ['Mixer', 'Toaster', 'Wasserkocher', 'Kaffeemaschine', 'Mikrowelle', 'Backofen', 'Herd', 'Kuehlschrank', 'Geschirrspueler', 'Pfanne', 'Topf', 'Nudelholz', 'Schneebesen', 'Sieb', 'Reibe', 'Dosenöffner', 'Brotmaschine', 'Waffeleisen', 'Entsafter', 'Thermomix'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikbands',
    name: 'Musikbands',
    terms: ['Rammstein', 'Die Toten Hosen', 'Die Ärzte', 'Scorpions', 'Kraftwerk', 'The Beatles', 'Queen', 'ABBA', 'Rolling Stones', 'Pink Floyd', 'Nirvana', 'AC/DC', 'U2', 'Coldplay', 'Linkin Park', 'Metallica', 'Guns N Roses', 'Foo Fighters', 'Imagine Dragons', 'Red Hot Chili Peppers'],
    difficulty: 'medium',
  },
  {
    id: 'cat-suessigkeiten',
    name: 'Süßigkeiten',
    terms: ['Gummibärchen', 'Schokolade', 'Lakritz', 'Lutscher', 'Bonbon', 'Kaugummi', 'Maoam', 'Smarties', 'M&Ms', 'Skittles', 'Haribo', 'Milka', 'Kinderschokolade', 'Snickers', 'Twix', 'Mars', 'Bounty', 'Kit Kat', 'Toblerone', 'Nimm 2'],
    difficulty: 'easy',
  },
  {
    id: 'cat-deutsche-staedte',
    name: 'Deutsche Staedte',
    terms: ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dresden', 'Leipzig', 'Hannover', 'Nürnberg', 'Bremen', 'Dortmund', 'Essen', 'Bonn', 'Freiburg', 'Heidelberg', 'Potsdam', 'Rostock', 'Luebeck'],
    difficulty: 'easy',
  },
  {
    id: 'cat-europaeische-hauptstaedte',
    name: 'Europaeische Hauptstaedte',
    terms: ['Berlin', 'Paris', 'London', 'Madrid', 'Rom', 'Wien', 'Bern', 'Bruessel', 'Amsterdam', 'Kopenhagen', 'Stockholm', 'Oslo', 'Helsinki', 'Prag', 'Warschau', 'Budapest', 'Athen', 'Lissabon', 'Dublin', 'Bukarest'],
    difficulty: 'easy',
  },
  {
    id: 'cat-gemuesesorten',
    name: 'Gemüsesorten',
    terms: ['Tomate', 'Gurke', 'Karotte', 'Brokkoli', 'Blumenkohl', 'Paprika', 'Zwiebel', 'Spinat', 'Zucchini', 'Aubergine', 'Erbsen', 'Bohnen', 'Mais', 'Sellerie', 'Radieschen', 'Kohlrabi', 'Kuerbis', 'Spargel', 'Rosenkohl', 'Fenchel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikinstrumente',
    name: 'Musikinstrumente',
    terms: ['Gitarre', 'Klavier', 'Schlagzeug', 'Geige', 'Floete', 'Trompete', 'Saxophon', 'Harfe', 'Cello', 'Klarinette', 'Oboe', 'Posaune', 'Akkordeon', 'Ukulele', 'Tuba', 'Kontrabass', 'Dudelsack', 'Mundharmonika', 'Triangel', 'Xylophon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hunderassen',
    name: 'Hunderassen',
    terms: ['Labrador', 'Dackel', 'Schaeferhund', 'Golden Retriever', 'Pudel', 'Chihuahua', 'Bulldogge', 'Husky', 'Dalmatiner', 'Beagle', 'Boxer', 'Rottweiler', 'Dobermann', 'Mops', 'Collie', 'Bernhardiner', 'Cocker Spaniel', 'Yorkshire Terrier', 'Corgi', 'Shiba Inu'],
    difficulty: 'medium',
  },
];

export const CATEGORIES_DE = CATEGORY_NAMES;
