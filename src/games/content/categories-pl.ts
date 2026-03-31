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
  'Zwierzeta', 'Kraje', 'Miasta', 'Zawody', 'Sporty', 'Filmy',
  'Seriale', 'Marki', 'Owoce', 'Warzywa', 'Marki samochodow',
  'Kolory', 'Instrumenty muzyczne', 'Napoje', 'Slodycze',
  'Przedmioty szkolne', 'Jezyki', 'Kwiaty', 'Drzewa', 'Przyprawy',
  'Ubrania', 'Meble', 'Czesci ciala', 'Narzedzia',
  'Zespoly muzyczne', 'Postacie komiksowe', 'Superbohaterowie', 'Postacie Disneya',
  'Sprzet kuchenny', 'Sporty pilkowe', 'Sporty wodne',
  'Sporty zimowe', 'Ssaki', 'Ptaki', 'Ryby',
  'Owady', 'Stolice europejskie', 'Polskie miasta',
  'Dodatki do pizzy', 'Koktajle', 'Rodzaje chleba', 'Rodzaje sera',
  'Style tanca', 'Gry karciane', 'Gry planszowe', 'Gry wideo',
  'Ziola', 'Orzechy', 'Mineraly', 'Rodzaje tkanin',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUWZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_PL: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Zwierzeta',
    terms: ['Pies', 'Kot', 'Kon', 'Krowa', 'Swinia', 'Kura', 'Owca', 'Koza', 'Slon', 'Lew', 'Tygrys', 'Niedzwiedz', 'Malpa', 'Delfin', 'Orzel', 'Waz', 'Zaba', 'Krolik', 'Jez', 'Wiewiorka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Kraje',
    terms: ['Polska', 'Niemcy', 'Francja', 'Wlochy', 'Hiszpania', 'Anglia', 'USA', 'Japonia', 'Brazylia', 'Australia', 'Kanada', 'Meksyk', 'Indie', 'Chiny', 'Rosja', 'Egipt', 'RPA', 'Argentyna', 'Szwecja', 'Grecja'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Miasta',
    terms: ['Warszawa', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'Lodz', 'Paryz', 'Londyn', 'Nowy Jork', 'Tokio', 'Berlin', 'Rzym', 'Madryt', 'Barcelona', 'Stambol', 'Dubaj', 'Sydney', 'Wiedeń', 'Praga', 'Amsterdam'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marki samochodow',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Opel', 'Skoda', 'Hyundai', 'Mazda', 'Polonez'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Owoce',
    terms: ['Jablko', 'Banan', 'Pomarancza', 'Truskawka', 'Wisnia', 'Winogrono', 'Arbuz', 'Ananas', 'Mango', 'Kiwi', 'Gruszka', 'Brzoskwinia', 'Sliwka', 'Malina', 'Borowka', 'Cytryna', 'Limonka', 'Kokos', 'Granat', 'Figa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Zawody',
    terms: ['Lekarz', 'Nauczyciel', 'Policjant', 'Strazak', 'Kucharz', 'Pilot', 'Prawnik', 'Inzynier', 'Mechanik', 'Pielegniarka', 'Architekt', 'Elektryk', 'Piekarz', 'Rzeznik', 'Ogrodnik', 'Dziennikarz', 'Fotograf', 'Sedzia', 'Aptekarz', 'Dentysta'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmy',
    terms: ['Titanic', 'Avatar', 'Gwiezdne Wojny', 'Harry Potter', 'Wladca Pierscieni', 'Matrix', 'Incepcja', 'Park Jurajski', 'Forrest Gump', 'Ojciec Chrzestny', 'Gladiator', 'Gdzie jest Nemo', 'Kraina Lodu', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Piraci z Karaibów', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Seriale',
    terms: ['Breaking Bad', 'Gra o Tron', 'Przyjaciele', 'Stranger Things', 'The Office', 'Dom z Papieru', 'Dark', 'Squid Game', 'Wiedzmin', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Wednesday', 'The Mandalorian', 'Wikingowie', 'Sherlock', 'Czarne Lustro', 'Lupin', '1983'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sporty',
    terms: ['Pilka nozna', 'Tenis', 'Koszykowka', 'Plywanie', 'Lekkoatletyka', 'Siatkowka', 'Pilka reczna', 'Hokej', 'Golf', 'Boks', 'Narciarstwo', 'Snowboard', 'Surfing', 'Wspinaczka', 'Wioslarstwo', 'Szermierka', 'Judo', 'Gimnastyka', 'Jezdziectwo', 'Tenis stolowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marki',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Jedzenie',
    terms: ['Pizza', 'Makaron', 'Hamburger', 'Sushi', 'Pierogi', 'Bigos', 'Zurek', 'Lasagne', 'Tacos', 'Curry', 'Frytki', 'Kebab', 'Stek', 'Zupa', 'Salatka', 'Bajgiel', 'Rogalik', 'Nalesniki', 'Kotlet schabowy', 'Gołąbki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Gatunki muzyczne',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Klasyczna', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Disco Polo', 'Muzyka ludowa', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Gry wideo',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'Wiedzmin 3', 'Cyberpunk 2077'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Kolory',
    terms: ['Czerwony', 'Niebieski', 'Zielony', 'Zolty', 'Pomarańczowy', 'Fioletowy', 'Rozowy', 'Bialy', 'Czarny', 'Brazowy', 'Szary', 'Turkusowy', 'Zloty', 'Srebrny', 'Bezowy', 'Bordowy', 'Mietowy', 'Koralowy', 'Indygo', 'Khaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumenty muzyczne',
    terms: ['Gitara', 'Pianino', 'Perkusja', 'Skrzypce', 'Flet', 'Trabka', 'Saksofon', 'Harfa', 'Wiolonczela', 'Klarnet', 'Oboj', 'Puzon', 'Akordeon', 'Ukulele', 'Tuba', 'Kontrabas', 'Dudy', 'Harmonijka', 'Trojkat', 'Ksylofon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Ubrania',
    terms: ['Koszulka', 'Dzinsy', 'Sukienka', 'Garnitur', 'Sweter', 'Kurtka', 'Plaszcz', 'Buty', 'Kozaki', 'Czapka', 'Szalik', 'Rekawiczki', 'Spodnica', 'Bluzka', 'Koszula', 'Skarpetki', 'Pasek', 'Krawat', 'Szorty', 'Kostium kapielowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Meble',
    terms: ['Stol', 'Krzeslo', 'Kanapa', 'Lozko', 'Szafa', 'Regal', 'Komoda', 'Biurko', 'Fotel', 'Taboret', 'Witryna', 'Szafka nocna', 'Wieszak', 'Kufer', 'Lawka', 'Kredens', 'Hamak', 'Biblioteczka', 'Stol jadalny', 'Stolik kawowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Narzedzia',
    terms: ['Mlotek', 'Srubokrert', 'Szczypce', 'Pila', 'Wiertarka', 'Klucz', 'Poziomnica', 'Dluto', 'Pilnik', 'Papier scierny', 'Tasma miernicza', 'Lutownica', 'Siekiera', 'Strug', 'Dlutko', 'Pedzel', 'Szpachla', 'Kielnia', 'Klucz imbusowy', 'Klucz do rur'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Kwiaty',
    terms: ['Roza', 'Tulipan', 'Slonecznik', 'Lilia', 'Orchidea', 'Stokrotka', 'Gozdzik', 'Fiolek', 'Lawenda', 'Pelargonia', 'Dalia', 'Mak', 'Irys', 'Narcyz', 'Chryzantema', 'Hibiskus', 'Jasmin', 'Magnolia', 'Krokus', 'Pierwiosnek'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Przyprawy',
    terms: ['Sol', 'Pieprz', 'Papryka', 'Cynamon', 'Kurkuma', 'Oregano', 'Bazylia', 'Rozmaryn', 'Tymianek', 'Galka muszkatolowa', 'Imbir', 'Czosnek', 'Szafran', 'Chili', 'Wanilia', 'Kolendra', 'Kminek', 'Anyz', 'Koper', 'Pietruszka'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Napoje',
    terms: ['Woda', 'Kawa', 'Herbata', 'Piwo', 'Wino', 'Cola', 'Lemoniada', 'Sok pomarańczowy', 'Mleko', 'Kakao', 'Koktajl', 'Szampan', 'Whisky', 'Wodka', 'Gin', 'Kompot', 'Herbata mrozowa', 'Espresso', 'Grzaniec', 'Sok jablkowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Przedmioty szkolne',
    terms: ['Matematyka', 'Polski', 'Angielski', 'Biologia', 'Fizyka', 'Chemia', 'Historia', 'Geografia', 'Plastyka', 'Muzyka', 'Wychowanie fizyczne', 'Informatyka', 'Niemiecki', 'Religia', 'Etyka', 'WOS', 'Ekonomia', 'Lacina', 'Filozofia', 'Francuski'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Jezyki',
    terms: ['Polski', 'Angielski', 'Francuski', 'Niemiecki', 'Hiszpanski', 'Wloski', 'Portugalski', 'Rosyjski', 'Chinski', 'Japonski', 'Arabski', 'Turecki', 'Koreanski', 'Hindi', 'Czeski', 'Holenderski', 'Szwedzki', 'Grecki', 'Wegierski', 'Fiński'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Obiekty niebieskie',
    terms: ['Merkury', 'Wenus', 'Ziemia', 'Mars', 'Jowisz', 'Saturn', 'Uran', 'Neptun', 'Ksiezyc', 'Slonce', 'Pluton', 'Kometa', 'Asteroida', 'Droga Mleczna', 'Czarna dziura', 'Mgławica', 'Czerwony karlel', 'Supernowa', 'Meteoryt', 'Galaktyka'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Czesci ciala',
    terms: ['Glowa', 'Reka', 'Stopa', 'Oko', 'Nos', 'Usta', 'Ucho', 'Ramie', 'Noga', 'Palec', 'Palec u nogi', 'Kolano', 'Lokiec', 'Bark', 'Plecy', 'Brzuch', 'Szyja', 'Czolo', 'Warga', 'Jezyk'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Postacie z basni',
    terms: ['Czerwony Kapturek', 'Kopciuszek', 'Krolewna Sniezka', 'Roszpunka', 'Jas', 'Malgosia', 'Spiaca Krolewna', 'Kot w Butach', 'Calineczka', 'Trzy Swinki', 'Zaklety Ksiaze', 'Zlotowlosa', 'Krolowa Sniegu', 'Zly Wilk', 'Zla Macocha', 'Pinokio', 'Piotrus Pan', 'Robin Hood', 'Aladyn', 'Mala Syrenka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superbohaterowie',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Kapitan Ameryka', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Zielona Latarnia', 'Sokolookie', 'Czarna Wdowa', 'Wizja', 'Szkarlatna Czarownica'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Opisz emoji',
    terms: ['Roześmiana twarz', 'Serce', 'Kciuk w gore', 'Ogien', 'Placz ze smiechu', 'Buziak', 'Mrugnięcie', 'Zamyslony', 'Smutna twarz', 'Wsciekly', 'Impreza', 'Duch', 'Klaun', 'Robot', 'Malpa', 'Jednorozec', 'Tecza', 'Rakieta', 'Korona', 'Diament'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Gry planszowe',
    terms: ['Szachy', 'Monopoly', 'Ryzyko', 'Scrabble', 'Cluedo', 'Chinczyk', 'Osadnicy z Catanu', 'Warcaby', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Halma', 'Mlynek', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Czworki', 'Memory', 'Dixit'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Kluby pilkarskie',
    terms: ['Legia Warszawa', 'Lech Poznan', 'Wisla Krakow', 'Gornik Zabrze', 'Jagiellonia Bialystok', 'Real Madryt', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Monachium', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Mediolan', 'Chelsea', 'Arsenal', 'Borussia Dortmund', 'Ajax Amsterdam', 'Benfica', 'Atletico Madryt'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desery',
    terms: ['Tort czekoladowy', 'Tiramisu', 'Creme brulee', 'Lody', 'Panna Cotta', 'Szarlotka', 'Brownie', 'Sernik', 'Mus czekoladowy', 'Gofry', 'Nalesniki', 'Budyn', 'Muffin', 'Macaron', 'Paczek', 'Baklawa', 'Makowiec', 'Kremowka', 'Racuchy', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Zjawiska pogodowe',
    terms: ['Deszcz', 'Snieg', 'Burza', 'Grad', 'Mgla', 'Wiatr', 'Sztorm', 'Tornado', 'Huragan', 'Slonce', 'Tecza', 'Mroz', 'Rosa', 'Blyskawica', 'Grzmot', 'Chmury', 'Upal', 'Zimo', 'Sopel', 'Platek sniegu'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Srodki transportu',
    terms: ['Samochod', 'Rower', 'Autobus', 'Pociag', 'Samolot', 'Statek', 'Motocykl', 'Tramwaj', 'Metro', 'Taksowka', 'Helikopter', 'Hulajnoga', 'Lodz', 'Zaglowka', 'Kajak', 'Balon', 'Monocykl', 'Deskorolka', 'Powoz', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Stolice',
    terms: ['Warszawa', 'Berlin', 'Paryz', 'Londyn', 'Madryt', 'Rzym', 'Wiedeń', 'Berno', 'Waszyngton', 'Tokio', 'Pekin', 'Moskwa', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Kair', 'Ateny', 'Praga', 'Budapeszt'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Swieta i uroczystosci',
    terms: ['Boze Narodzenie', 'Wielkanoc', 'Sylwester', 'Karnawal', 'Walentynki', 'Halloween', 'Dzien Matki', 'Dzien Ojca', 'Swięto Niepodleglosci', 'Dzien Wszystkich Swietych', 'Mikolajki', 'Andrzejki', 'Tlusty Czwartek', 'Wielki Piatek', 'Zielone Swiatki', 'Boze Cialo', 'Dzień Kobiet', 'Swieto Pracy', 'Trzech Kroli', 'Noc Kupaly'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Slawne osoby',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Kleopatra', 'Napoleon', 'Martin Luther King', 'Maria Sklodowska-Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Karol Darwin', 'Nikola Tesla', 'Fryderyk Chopin', 'Jan Pawel II', 'Mikolaj Kopernik', 'Adam Mickiewicz', 'Robert Lewandowski', 'Lech Walesa', 'Wislawa Szymborska', 'Henryk Sienkiewicz'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Warzywa',
    terms: ['Pomidor', 'Ogorek', 'Marchew', 'Brokul', 'Kalafior', 'Papryka', 'Cebula', 'Czosnek', 'Szpinak', 'Cukinia', 'Baklazan', 'Groszek', 'Fasola', 'Kukurydza', 'Seler', 'Rzodkiewka', 'Kalarepa', 'Dynia', 'Szparag', 'Brukselka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Owady i robaki',
    terms: ['Mrowka', 'Pszczola', 'Motyl', 'Biedronka', 'Pajak', 'Komar', 'Mucha', 'Osa', 'Konik polny', 'Wazka', 'Chrzaszcz', 'Gasienica', 'Swierszcz', 'Trzmiel', 'Slimak', 'Dzdzownica', 'Karaluch', 'Skorek', 'Kleszcz', 'Pchla'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Slawne budowle',
    terms: ['Wieza Eiffla', 'Koloseum', 'Wielki Mur Chinski', 'Tadz Mahal', 'Statua Wolnosci', 'Big Ben', 'Brama Brandenburska', 'Piramidy w Gizie', 'Akropol', 'Bazylika sw. Piotra', 'Burdz Chalifa', 'Opera w Sydney', 'Sagrada Familia', 'Tower Bridge', 'Zamek Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Chrystus Odkupiciel', 'Most Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Style tanca',
    terms: ['Walc', 'Tango', 'Salsa', 'Balet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Fokstrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Polonez', 'Jazz', 'Wspolczesny', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Rodzaje sera',
    terms: ['Gouda', 'Mozzarella', 'Parmezan', 'Brie', 'Camembert', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmentaler', 'Cheddar', 'Mascarpone', 'Oscypek', 'Bundz', 'Tylzycki', 'Korycinski', 'Manchego', 'Pecorino', 'Havarti', 'Edamski'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_PL = CATEGORY_NAMES;
