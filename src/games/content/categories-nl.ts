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
  'Dieren', 'Landen', 'Steden', 'Beroepen', 'Sporten', 'Films',
  'Series', 'Merken', 'Fruitsoorten', 'Groentesoorten', 'Automerken',
  'Kleuren', 'Muziekinstrumenten', 'Dranken', 'Snoepgoed',
  'Schoolvakken', 'Talen', 'Bloemen', 'Bomen', 'Kruiden',
  'Kleding', 'Meubels', 'Lichaamsdelen', 'Gereedschap',
  'Muziekbands', 'Stripfiguren', 'Superhelden', 'Disney-figuren',
  'Keukenapparaten', 'Balsporten', 'Watersporten',
  'Wintersporten', 'Zoogdieren', 'Vogels', 'Vissen',
  'Insecten', 'Europese hoofdsteden', 'Nederlandse steden',
  'Pizzabeleg', 'Cocktails', 'Broodsoorten', 'Kaassoorten',
  'Dansstijlen', 'Kaartspellen', 'Bordspellen', 'Videospellen',
  'Kruiden', 'Noten', 'Mineralen', 'Stofsoorten',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUVWZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_NL: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Dieren',
    terms: ['Hond', 'Kat', 'Paard', 'Koe', 'Varken', 'Kip', 'Schaap', 'Geit', 'Olifant', 'Leeuw', 'Tijger', 'Beer', 'Aap', 'Dolfijn', 'Arend', 'Slang', 'Kikker', 'Konijn', 'Egel', 'Eekhoorn'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Landen',
    terms: ['Nederland', 'Belgie', 'Duitsland', 'Frankrijk', 'Spanje', 'Engeland', 'Verenigde Staten', 'Japan', 'Brazilie', 'Australie', 'Canada', 'Mexico', 'India', 'China', 'Rusland', 'Egypte', 'Zuid-Afrika', 'Argentinie', 'Zweden', 'Italie'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Steden',
    terms: ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Brussel', 'Antwerpen', 'Parijs', 'Londen', 'New York', 'Tokio', 'Berlijn', 'Barcelona', 'Istanbul', 'Dubai', 'Sydney', 'Praag', 'Wenen', 'Rome', 'Maastricht'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Automerken',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Opel', 'Skoda', 'Hyundai', 'Mazda', 'DAF'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Fruitsoorten',
    terms: ['Appel', 'Banaan', 'Sinaasappel', 'Aardbei', 'Kers', 'Druif', 'Watermeloen', 'Ananas', 'Mango', 'Kiwi', 'Peer', 'Perzik', 'Pruim', 'Framboos', 'Bosbes', 'Citroen', 'Limoen', 'Kokosnoot', 'Granaatappel', 'Vijg'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Beroepen',
    terms: ['Arts', 'Leraar', 'Politieagent', 'Brandweerman', 'Kok', 'Piloot', 'Advocaat', 'Ingenieur', 'Monteur', 'Verpleegkundige', 'Architect', 'Elektricien', 'Bakker', 'Slager', 'Tuinman', 'Journalist', 'Fotograaf', 'Rechter', 'Apotheker', 'Tandarts'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Films',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'In de Ban van de Ring', 'The Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'The Godfather', 'Gladiator', 'Finding Nemo', 'Frozen', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Pirates of the Caribbean', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Series',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Undercover', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Lupin'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sporten',
    terms: ['Voetbal', 'Tennis', 'Basketbal', 'Zwemmen', 'Atletiek', 'Volleybal', 'Handbal', 'IJshockey', 'Golf', 'Boksen', 'Skieen', 'Snowboarden', 'Surfen', 'Klimmen', 'Roeien', 'Schermen', 'Judo', 'Turnen', 'Paardrijden', 'Tafeltennis'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Merken',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Heineken'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Eten',
    terms: ['Pizza', 'Pasta', 'Hamburger', 'Sushi', 'Stamppot', 'Kroket', 'Bitterballen', 'Lasagne', 'Tacos', 'Curry', 'Patat', 'Doner', 'Biefstuk', 'Soep', 'Salade', 'Stroopwafel', 'Croissant', 'Pannenkoeken', 'Poffertjes', 'Erwtensoep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Muziekgenres',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Klassiek', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Nederlandstalig', 'Volksmuziek', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videospellen',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'De Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Kleuren',
    terms: ['Rood', 'Blauw', 'Groen', 'Geel', 'Oranje', 'Paars', 'Roze', 'Wit', 'Zwart', 'Bruin', 'Grijs', 'Turquoise', 'Goud', 'Zilver', 'Beige', 'Bordeaux', 'Mint', 'Koraal', 'Indigo', 'Kaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Muziekinstrumenten',
    terms: ['Gitaar', 'Piano', 'Drums', 'Viool', 'Fluit', 'Trompet', 'Saxofoon', 'Harp', 'Cello', 'Klarinet', 'Hobo', 'Trombone', 'Accordeon', 'Ukelele', 'Tuba', 'Contrabas', 'Doedelzak', 'Mondharmonica', 'Triangel', 'Xylofoon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Kleding',
    terms: ['T-shirt', 'Spijkerbroek', 'Jurk', 'Pak', 'Trui', 'Jas', 'Winterjas', 'Schoenen', 'Laarzen', 'Muts', 'Sjaal', 'Handschoenen', 'Rok', 'Blouse', 'Overhemd', 'Sokken', 'Riem', 'Stropdas', 'Korte broek', 'Badpak'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Meubels',
    terms: ['Tafel', 'Stoel', 'Bank', 'Bed', 'Kast', 'Rek', 'Ladekast', 'Bureau', 'Fauteuil', 'Kruk', 'Vitrine', 'Nachtkastje', 'Kapstok', 'Kist', 'Bankje', 'Dressoir', 'Hangmat', 'Boekenkast', 'Eettafel', 'Salontafel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Gereedschap',
    terms: ['Hamer', 'Schroevendraaier', 'Tang', 'Zaag', 'Boormachine', 'Moersleutel', 'Waterpas', 'Beitel', 'Vijl', 'Schuurpapier', 'Meetlint', 'Soldeerbout', 'Bijl', 'Schaaf', 'Guts', 'Kwast', 'Plamuurmes', 'Troffel', 'Inbussleutel', 'Buigtang'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Bloemen',
    terms: ['Roos', 'Tulp', 'Zonnebloem', 'Lelie', 'Orchidee', 'Madeliefje', 'Anjer', 'Viooltje', 'Lavendel', 'Geranium', 'Dahlia', 'Klaproos', 'Iris', 'Narcis', 'Chrysant', 'Hibiscus', 'Jasmijn', 'Magnolia', 'Krokus', 'Primula'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Kruiden en specerijen',
    terms: ['Zout', 'Peper', 'Paprika', 'Kaneel', 'Kurkuma', 'Oregano', 'Basilicum', 'Rozemarijn', 'Tijm', 'Nootmuskaat', 'Gember', 'Knoflook', 'Saffraan', 'Chili', 'Vanille', 'Koriander', 'Komijn', 'Anijs', 'Dille', 'Peterselie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Dranken',
    terms: ['Water', 'Koffie', 'Thee', 'Bier', 'Wijn', 'Cola', 'Limonade', 'Sinaasappelsap', 'Melk', 'Chocolademelk', 'Smoothie', 'Cocktail', 'Champagne', 'Whisky', 'Wodka', 'Jenever', 'Appelsap', 'IJsthee', 'Espresso', 'Gluhwein'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Schoolvakken',
    terms: ['Wiskunde', 'Nederlands', 'Engels', 'Biologie', 'Natuurkunde', 'Scheikunde', 'Geschiedenis', 'Aardrijkskunde', 'Kunst', 'Muziek', 'Lichamelijke opvoeding', 'Informatica', 'Frans', 'Godsdienst', 'Maatschappijleer', 'Economie', 'Latijn', 'Filosofie', 'Duits', 'Spaans'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Talen',
    terms: ['Nederlands', 'Engels', 'Frans', 'Duits', 'Spaans', 'Italiaans', 'Portugees', 'Russisch', 'Chinees', 'Japans', 'Arabisch', 'Turks', 'Koreaans', 'Hindi', 'Pools', 'Zweeds', 'Grieks', 'Tsjechisch', 'Hongaars', 'Fins'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Hemellichamen',
    terms: ['Mercurius', 'Venus', 'Aarde', 'Mars', 'Jupiter', 'Saturnus', 'Uranus', 'Neptunus', 'Maan', 'Zon', 'Pluto', 'Komeet', 'Asteroide', 'Melkweg', 'Zwart gat', 'Nevel', 'Rode dwerg', 'Supernova', 'Meteoriet', 'Sterrenstelsel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Lichaamsdelen',
    terms: ['Hoofd', 'Hand', 'Voet', 'Oog', 'Neus', 'Mond', 'Oor', 'Arm', 'Been', 'Vinger', 'Teen', 'Knie', 'Elleboog', 'Schouder', 'Rug', 'Buik', 'Nek', 'Voorhoofd', 'Lip', 'Tong'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Sprookjesfiguren',
    terms: ['Roodkapje', 'Assepoester', 'Sneeuwwitje', 'Rapunzel', 'Hans', 'Grietje', 'Doornroosje', 'De gelaarsde kat', 'Klein Duimpje', 'De drie biggetjes', 'De kikkerkoning', 'Goudhaartje', 'De sneeuwkoningin', 'De grote boze wolf', 'De boze stiefmoeder', 'Pinokkio', 'Peter Pan', 'Robin Hood', 'Aladdin', 'De kleine zeemeermin'],
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
    name: 'Emoji\'s beschrijven',
    terms: ['Lachend gezicht', 'Hart', 'Duim omhoog', 'Vuur', 'Huilen van het lachen', 'Kus', 'Knipoog', 'Nadenkend', 'Droevig gezicht', 'Boos', 'Feest', 'Spook', 'Clown', 'Robot', 'Aap', 'Eenhoorn', 'Regenboog', 'Raket', 'Kroon', 'Diamant'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Bordspellen',
    terms: ['Schaken', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Mens erger je niet', 'Kolonisten van Catan', 'Dammen', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Halma', 'Molenspel', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Vier op een rij', 'Memory', '30 Seconds'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Voetbalclubs',
    terms: ['Ajax', 'Feyenoord', 'PSV', 'AZ', 'FC Utrecht', 'FC Twente', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Munchen', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Borussia Dortmund', 'Club Brugge', 'Anderlecht'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Nagerechten',
    terms: ['Chocoladetaart', 'Tiramisu', 'Creme brulee', 'IJs', 'Panna Cotta', 'Appeltaart', 'Brownie', 'Cheesecake', 'Chocolademousse', 'Wafels', 'Pannenkoeken', 'Vla', 'Muffin', 'Macaron', 'Donut', 'Baklava', 'Stroopwafel', 'Oliebollen', 'Poffertjes', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Weerfenomenen',
    terms: ['Regen', 'Sneeuw', 'Onweer', 'Hagel', 'Mist', 'Wind', 'Storm', 'Tornado', 'Orkaan', 'Zonneschijn', 'Regenboog', 'Vorst', 'Dauw', 'Bliksem', 'Donder', 'Wolken', 'Hitte', 'Koude', 'IJspegel', 'Sneeuwvlok'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Vervoermiddelen',
    terms: ['Auto', 'Fiets', 'Bus', 'Trein', 'Vliegtuig', 'Schip', 'Motor', 'Tram', 'Metro', 'Taxi', 'Helikopter', 'Scooter', 'Boot', 'Zeilboot', 'Kano', 'Luchtballon', 'Eenwieler', 'Skateboard', 'Koets', 'Gondel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Hoofdsteden',
    terms: ['Amsterdam', 'Brussel', 'Parijs', 'Berlijn', 'Londen', 'Madrid', 'Rome', 'Wenen', 'Bern', 'Washington', 'Tokio', 'Peking', 'Moskou', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Caïro', 'Athene', 'Warschau'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Feestdagen en vieringen',
    terms: ['Kerstmis', 'Pasen', 'Oudejaarsavond', 'Carnaval', 'Valentijnsdag', 'Halloween', 'Moederdag', 'Vaderdag', 'Koningsdag', 'Bevrijdingsdag', 'Sinterklaas', 'Hemelvaartsdag', 'Pinksterdag', 'Dodenherdenking', 'Prinsjesdag', 'Oud en Nieuw', 'Driekoningen', 'Sint-Maarten', 'Luilak', 'Suikerfeest'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Beroemde personen',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Vincent van Gogh', 'Rembrandt', 'Anne Frank', 'Willem van Oranje', 'Erasmus', 'Max Verstappen', 'Johan Cruijff', 'Marco van Basten'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Groenten',
    terms: ['Tomaat', 'Komkommer', 'Wortel', 'Broccoli', 'Bloemkool', 'Paprika', 'Ui', 'Knoflook', 'Spinazie', 'Courgette', 'Aubergine', 'Doperwten', 'Bonen', 'Mais', 'Selderij', 'Radijs', 'Koolrabi', 'Pompoen', 'Asperge', 'Spruitjes'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insecten en kruipdiertjes',
    terms: ['Mier', 'Bij', 'Vlinder', 'Lieveheersbeestje', 'Spin', 'Mug', 'Vlieg', 'Wesp', 'Sprinkhaan', 'Libel', 'Kever', 'Rups', 'Krekel', 'Hommel', 'Slak', 'Regenworm', 'Kakkerlak', 'Oorwurm', 'Teek', 'Vlo'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Beroemde bouwwerken',
    terms: ['Eiffeltoren', 'Colosseum', 'Chinese Muur', 'Taj Mahal', 'Vrijheidsbeeld', 'Big Ben', 'Brandenburger Tor', 'Piramides van Gizeh', 'Akropolis', 'Sint-Pietersbasiliek', 'Burj Khalifa', 'Sydney Opera House', 'Sagrada Familia', 'Tower Bridge', 'Kasteel Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Christus de Verlosser', 'Golden Gate Bridge', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Dansstijlen',
    terms: ['Wals', 'Tango', 'Salsa', 'Ballet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Volksdans', 'Jazz', 'Modern', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Kaassoorten',
    terms: ['Gouda', 'Edammer', 'Leidse kaas', 'Boerenkaas', 'Maaslander', 'Mozzarella', 'Parmezaan', 'Brie', 'Camembert', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmentaler', 'Cheddar', 'Mascarpone', 'Geitenkaas', 'Manchego', 'Pecorino', 'Oud Amsterdam'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_NL = CATEGORY_NAMES;
