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
  'Zwierzęta', 'Kraje', 'Miasta', 'Zawody', 'Sporty', 'Filmy',
  'Seriale', 'Marki', 'Owoce', 'Warzywa', 'Marki samochodów',
  'Kolory', 'Instrumenty muzyczne', 'Napoje', 'Słodycze',
  'Przedmioty szkolne', 'Języki', 'Kwiaty', 'Drzewa', 'Przyprawy',
  'Ubrania', 'Meble', 'Części ciała', 'Narzędzia',
  'Zespoły muzyczne', 'Postacie komiksowe', 'Superbohaterowie', 'Postacie Disneya',
  'Sprzęt kuchenny', 'Sporty piłkowe', 'Sporty wodne',
  'Sporty zimowe', 'Ssaki', 'Ptaki', 'Ryby',
  'Owady', 'Stolice europejskie', 'Polskie miasta',
  'Dodatki do pizzy', 'Koktajle', 'Rodzaje chleba', 'Rodzaje sera',
  'Style tańca', 'Gry karciane', 'Gry planszowe', 'Gry wideo',
  'Zioła', 'Orzechy', 'Minerały', 'Rodzaje tkanin',
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
    name: 'Zwierzęta',
    terms: ['Pies', 'Kot', 'Koń', 'Krowa', 'Świnia', 'Kura', 'Owca', 'Koza', 'Słoń', 'Lew', 'Tygrys', 'Niedźwiedź', 'Małpa', 'Delfin', 'Orzeł', 'Wąż', 'Żaba', 'Królik', 'Jeż', 'Wiewiórka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Kraje',
    terms: ['Polska', 'Niemcy', 'Francja', 'Włochy', 'Hiszpania', 'Anglia', 'USA', 'Japonia', 'Brazylia', 'Australia', 'Kanada', 'Meksyk', 'Indie', 'Chiny', 'Rosja', 'Egipt', 'RPA', 'Argentyna', 'Szwecja', 'Grecja'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Miasta',
    terms: ['Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź', 'Paryż', 'Londyn', 'Nowy Jork', 'Tokio', 'Berlin', 'Rzym', 'Madryt', 'Barcelona', 'Stambol', 'Dubaj', 'Sydney', 'Wiedeń', 'Praga', 'Amsterdam'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marki samochodów',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Opel', 'Skoda', 'Hyundai', 'Mazda', 'Polonez'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Owoce',
    terms: ['Jabłko', 'Banan', 'Pomarańcza', 'Truskawka', 'Wiśnia', 'Winogrono', 'Arbuz', 'Ananas', 'Mango', 'Kiwi', 'Gruszka', 'Brzoskwinia', 'Śliwka', 'Malina', 'Borówka', 'Cytryna', 'Limonka', 'Kokos', 'Granat', 'Figa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Zawody',
    terms: ['Lekarz', 'Nauczyciel', 'Policjant', 'Strażak', 'Kucharz', 'Pilot', 'Prawnik', 'Inżynier', 'Mechanik', 'Pielęgniarka', 'Architekt', 'Elektryk', 'Piekarz', 'Rzeźnik', 'Ogrodnik', 'Dziennikarz', 'Fotograf', 'Sędzia', 'Aptekarz', 'Dentysta'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmy',
    terms: ['Titanic', 'Avatar', 'Gwiezdne Wojny', 'Harry Potter', 'Władca Pierścieni', 'Matrix', 'Incepcja', 'Park Jurajski', 'Forrest Gump', 'Ojciec Chrzestny', 'Gladiator', 'Gdzie jest Nemo', 'Kraina Lodu', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Piraci z Karaibów', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Seriale',
    terms: ['Breaking Bad', 'Gra o Tron', 'Przyjaciele', 'Stranger Things', 'The Office', 'Dom z Papieru', 'Dark', 'Squid Game', 'Wiedźmin', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Wednesday', 'The Mandalorian', 'Wikingowie', 'Sherlock', 'Czarne Lustro', 'Lupin', '1983'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sporty',
    terms: ['Piłka nożna', 'Tenis', 'Koszykówka', 'Pływanie', 'Lekkoatletyka', 'Siatkówka', 'Piłka ręczna', 'Hokej', 'Golf', 'Boks', 'Narciarstwo', 'Snowboard', 'Surfing', 'Wspinaczka', 'Wioślarstwo', 'Szermierka', 'Judo', 'Gimnastyka', 'Jeździectwo', 'Tenis stołowy'],
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
    terms: ['Pizza', 'Makaron', 'Hamburger', 'Sushi', 'Pierogi', 'Bigos', 'Żurek', 'Lasagne', 'Tacos', 'Curry', 'Frytki', 'Kebab', 'Stek', 'Zupa', 'Sałatka', 'Bajgiel', 'Rogalik', 'Naleśniki', 'Kotlet schabowy', 'Gołąbki'],
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
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'Wiedźmin 3', 'Cyberpunk 2077'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Kolory',
    terms: ['Czerwony', 'Niebieski', 'Zielony', 'Żółty', 'Pomarańczowy', 'Fioletowy', 'Różowy', 'Biały', 'Czarny', 'Brązowy', 'Szary', 'Turkusowy', 'Złoty', 'Srebrny', 'Beżowy', 'Bordowy', 'Miętowy', 'Koralowy', 'Indygo', 'Khaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instrumenty muzyczne',
    terms: ['Gitara', 'Pianino', 'Perkusja', 'Skrzypce', 'Flet', 'Trąbka', 'Saksofon', 'Harfa', 'Wiolonczela', 'Klarnet', 'Obój', 'Puzon', 'Akordeon', 'Ukulele', 'Tuba', 'Kontrabas', 'Dudy', 'Harmonijka', 'Trójkąt', 'Ksylofon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Ubrania',
    terms: ['Koszulka', 'Dżinsy', 'Sukienka', 'Garnitur', 'Sweter', 'Kurtka', 'Płaszcz', 'Buty', 'Kozaki', 'Czapka', 'Szalik', 'Rękawiczki', 'Spódnica', 'Bluzka', 'Koszula', 'Skarpetki', 'Pasek', 'Krawat', 'Szorty', 'Kostium kąpielowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Meble',
    terms: ['Stół', 'Krzesło', 'Kanapa', 'Łóżko', 'Szafa', 'Regał', 'Komoda', 'Biurko', 'Fotel', 'Taboret', 'Witryna', 'Szafka nocna', 'Wieszak', 'Kufer', 'Ławka', 'Kredens', 'Hamak', 'Biblioteczka', 'Stół jadalny', 'Stolik kawowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Narzędzia',
    terms: ['Młotek', 'Srubokrert', 'Szczypce', 'Piła', 'Wiertarka', 'Klucz', 'Poziomnica', 'Dłuto', 'Pilnik', 'Papier ścierny', 'Taśma miernicza', 'Lutownica', 'Siekiera', 'Strug', 'Dłutko', 'Pędzel', 'Szpachla', 'Kielnia', 'Klucz imbusowy', 'Klucz do rur'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Kwiaty',
    terms: ['Róża', 'Tulipan', 'Słonecznik', 'Lilia', 'Orchidea', 'Stokrotka', 'Goździk', 'Fiołek', 'Lawenda', 'Pelargonia', 'Dalia', 'Mak', 'Irys', 'Narcyz', 'Chryzantema', 'Hibiskus', 'Jaśmin', 'Magnolia', 'Krokus', 'Pierwiosnek'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Przyprawy',
    terms: ['Sól', 'Pieprz', 'Papryka', 'Cynamon', 'Kurkuma', 'Oregano', 'Bazylia', 'Rozmaryn', 'Tymianek', 'Gałka muszkatołowa', 'Imbir', 'Czosnek', 'Szafran', 'Chili', 'Wanilia', 'Kolendra', 'Kminek', 'Anyż', 'Koper', 'Pietruszka'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Napoje',
    terms: ['Woda', 'Kawa', 'Herbata', 'Piwo', 'Wino', 'Cola', 'Lemoniada', 'Sok pomarańczowy', 'Mleko', 'Kakao', 'Koktajl', 'Szampan', 'Whisky', 'Wódka', 'Gin', 'Kompot', 'Herbata mrozowa', 'Espresso', 'Grzaniec', 'Sok jabłkowy'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Przedmioty szkolne',
    terms: ['Matematyka', 'Polski', 'Angielski', 'Biologia', 'Fizyka', 'Chemia', 'Historia', 'Geografia', 'Plastyka', 'Muzyka', 'Wychowanie fizyczne', 'Informatyka', 'Niemiecki', 'Religia', 'Etyka', 'WOS', 'Ekonomia', 'Łacina', 'Filozofia', 'Francuski'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Języki',
    terms: ['Polski', 'Angielski', 'Francuski', 'Niemiecki', 'Hiszpański', 'Włoski', 'Portugalski', 'Rosyjski', 'Chiński', 'Japoński', 'Arabski', 'Turecki', 'Koreański', 'Hindi', 'Czeski', 'Holenderski', 'Szwedzki', 'Grecki', 'Węgierski', 'Fiński'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Obiekty niebieskie',
    terms: ['Merkury', 'Wenus', 'Ziemia', 'Mars', 'Jowisz', 'Saturn', 'Uran', 'Neptun', 'Księżyc', 'Słońce', 'Pluton', 'Kometa', 'Asteroida', 'Droga Mleczna', 'Czarna dziura', 'Mgławica', 'Czerwony karlel', 'Supernowa', 'Meteoryt', 'Galaktyka'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Części ciała',
    terms: ['Głowa', 'Ręka', 'Stopa', 'Oko', 'Nos', 'Usta', 'Ucho', 'Ramię', 'Noga', 'Palec', 'Palec u nogi', 'Kolano', 'Łokieć', 'Bark', 'Plecy', 'Brzuch', 'Szyja', 'Czoło', 'Warga', 'Język'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Postacie z baśni',
    terms: ['Czerwony Kapturek', 'Kopciuszek', 'Królewna Śnieżka', 'Roszpunka', 'Jaś', 'Małgosia', 'Śpiąca Królewna', 'Kot w Butach', 'Calineczka', 'Trzy Świnki', 'Zaklęty Książę', 'Złotowłosa', 'Królowa Śniegu', 'Zły Wilk', 'Zła Macocha', 'Pinokio', 'Piotruś Pan', 'Robin Hood', 'Aladyn', 'Mała Syrenka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superbohaterowie',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Kapitan Ameryka', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Zielona Latarnia', 'Sokolookie', 'Czarna Wdowa', 'Wizja', 'Szkarłatna Czarownica'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Opisz emoji',
    terms: ['Roześmiana twarz', 'Serce', 'Kciuk w górę', 'Ogień', 'Płacz ze śmiechu', 'Buziak', 'Mrugnięcie', 'Zamyślony', 'Smutna twarz', 'Wściekły', 'Impreza', 'Duch', 'Klaun', 'Robot', 'Małpa', 'Jednorożec', 'Tęcza', 'Rakieta', 'Korona', 'Diament'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Gry planszowe',
    terms: ['Szachy', 'Monopoly', 'Ryzyko', 'Scrabble', 'Cluedo', 'Chińczyk', 'Osadnicy z Catanu', 'Warcaby', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Halma', 'Młynek', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Czwórki', 'Memory', 'Dixit'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Kluby piłkarskie',
    terms: ['Legia Warszawa', 'Lech Poznań', 'Wisła Kraków', 'Górnik Zabrze', 'Jagiellonia Białystok', 'Real Madryt', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Monachium', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Mediolan', 'Chelsea', 'Arsenal', 'Borussia Dortmund', 'Ajax Amsterdam', 'Benfica', 'Atletico Madryt'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desery',
    terms: ['Tort czekoladowy', 'Tiramisu', 'Creme brulee', 'Lody', 'Panna Cotta', 'Szarlotka', 'Brownie', 'Sernik', 'Mus czekoladowy', 'Gofry', 'Naleśniki', 'Budyń', 'Muffin', 'Macaron', 'Pączek', 'Baklawa', 'Makowiec', 'Kremówka', 'Racuchy', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Zjawiska pogodowe',
    terms: ['Deszcz', 'Śnieg', 'Burza', 'Grad', 'Mgła', 'Wiatr', 'Sztorm', 'Tornado', 'Huragan', 'Słońce', 'Tęcza', 'Mróz', 'Rosa', 'Błyskawica', 'Grzmot', 'Chmury', 'Upał', 'Zimo', 'Sopel', 'Płatek śniegu'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Środki transportu',
    terms: ['Samochód', 'Rower', 'Autobus', 'Pociąg', 'Samolot', 'Statek', 'Motocykl', 'Tramwaj', 'Metro', 'Taksówka', 'Helikopter', 'Hulajnoga', 'Łódź', 'Żaglówka', 'Kajak', 'Balon', 'Monocykl', 'Deskorolka', 'Powóz', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Stolice',
    terms: ['Warszawa', 'Berlin', 'Paryż', 'Londyn', 'Madryt', 'Rzym', 'Wiedeń', 'Berno', 'Waszyngton', 'Tokio', 'Pekin', 'Moskwa', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Kair', 'Ateny', 'Praga', 'Budapeszt'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Święta i uroczystości',
    terms: ['Boże Narodzenie', 'Wielkanoc', 'Sylwester', 'Karnawał', 'Walentynki', 'Halloween', 'Dzień Matki', 'Dzień Ojca', 'Święto Niepodległości', 'Dzień Wszystkich Świętych', 'Mikołajki', 'Andrzejki', 'Tłusty Czwartek', 'Wielki Piątek', 'Zielone Świątki', 'Boże Ciało', 'Dzień Kobiet', 'Święto Pracy', 'Trzech Króli', 'Noc Kupały'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Sławne osoby',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Kleopatra', 'Napoleon', 'Martin Luther King', 'Maria Skłodowska-Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Karol Darwin', 'Nikola Tesla', 'Fryderyk Chopin', 'Jan Paweł II', 'Mikołaj Kopernik', 'Adam Mickiewicz', 'Robert Lewandowski', 'Lech Wałęsa', 'Wisława Szymborska', 'Henryk Sienkiewicz'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Warzywa',
    terms: ['Pomidor', 'Ogórek', 'Marchew', 'Brokuł', 'Kalafior', 'Papryka', 'Cebula', 'Czosnek', 'Szpinak', 'Cukinia', 'Bakłażan', 'Groszek', 'Fasola', 'Kukurydza', 'Seler', 'Rzodkiewka', 'Kalarepa', 'Dynia', 'Szparag', 'Brukselka'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Owady i robaki',
    terms: ['Mrówka', 'Pszczoła', 'Motyl', 'Biedronka', 'Pająk', 'Komar', 'Mucha', 'Osa', 'Konik polny', 'Ważka', 'Chrząszcz', 'Gąsienica', 'Świerszcz', 'Trzmiel', 'Ślimak', 'Dżdżownica', 'Karaluch', 'Skorek', 'Kleszcz', 'Pchla'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Sławne budowle',
    terms: ['Wieża Eiffla', 'Koloseum', 'Wielki Mur Chiński', 'Tadż Mahal', 'Statua Wolności', 'Big Ben', 'Brama Brandenburska', 'Piramidy w Gizie', 'Akropol', 'Bazylika św. Piotra', 'Burdż Chalifa', 'Opera w Sydney', 'Sagrada Familia', 'Tower Bridge', 'Zamek Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Chrystus Odkupiciel', 'Most Golden Gate', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Style tańca',
    terms: ['Walc', 'Tango', 'Salsa', 'Balet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Fokstrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Polonez', 'Jazz', 'Współczesny', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Rodzaje sera',
    terms: ['Gouda', 'Mozzarella', 'Parmezan', 'Brie', 'Camembert', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmentaler', 'Cheddar', 'Mascarpone', 'Oscypek', 'Bundz', 'Tylżycki', 'Koryciński', 'Manchego', 'Pecorino', 'Havarti', 'Edamski'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_PL = CATEGORY_NAMES;
