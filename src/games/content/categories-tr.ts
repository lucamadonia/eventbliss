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
  'Hayvanlar', 'Ulkeler', 'Sehirler', 'Meslekler', 'Sporlar', 'Filmler',
  'Diziler', 'Markalar', 'Meyveler', 'Sebzeler', 'Araba markalari',
  'Renkler', 'Muzik aletleri', 'Icecekler', 'Tatlilar',
  'Okul dersleri', 'Diller', 'Cicekler', 'Agaclar', 'Baharatlar',
  'Giysiler', 'Mobilyalar', 'Vucut parcalari', 'Aletler',
  'Muzik gruplari', 'Cizgi film karakterleri', 'Superkahramanlar', 'Disney karakterleri',
  'Mutfak aletleri', 'Top sporlari', 'Su sporlari',
  'Kis sporlari', 'Memeliler', 'Kuslar', 'Baliklar',
  'Bocekler', 'Avrupa baskentleri', 'Turk sehirleri',
  'Pizza malzemeleri', 'Kokteyller', 'Ekmek cesitleri', 'Peynir cesitleri',
  'Dans stilleri', 'Kart oyunlari', 'Masa oyunlari', 'Video oyunlari',
  'Otlar', 'Kuruyemisler', 'Mineraller', 'Kumas cesitleri',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUVYZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_TR: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Hayvanlar',
    terms: ['Kopek', 'Kedi', 'At', 'Inek', 'Domuz', 'Tavuk', 'Koyun', 'Keci', 'Fil', 'Aslan', 'Kaplan', 'Ayi', 'Maymun', 'Yunus', 'Kartal', 'Yilan', 'Kurbaga', 'Tavsan', 'Kirpi', 'Sincap'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Ulkeler',
    terms: ['Turkiye', 'Almanya', 'Fransa', 'Italya', 'Ispanya', 'Ingiltere', 'ABD', 'Japonya', 'Brezilya', 'Avustralya', 'Kanada', 'Meksika', 'Hindistan', 'Cin', 'Rusya', 'Misir', 'Guney Afrika', 'Arjantin', 'Isvec', 'Yunanistan'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Sehirler',
    terms: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Paris', 'Londra', 'New York', 'Tokyo', 'Berlin', 'Roma', 'Barselona', 'Dubai', 'Sidney', 'Amsterdam', 'Prag', 'Viyana', 'Trabzon', 'Konya', 'Gaziantep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Araba markalari',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Hyundai', 'Mazda', 'Togg', 'Opel', 'Skoda'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Meyveler',
    terms: ['Elma', 'Muz', 'Portakal', 'Cilek', 'Kiraz', 'Uzum', 'Karpuz', 'Ananas', 'Mango', 'Kivi', 'Armut', 'Seftali', 'Erik', 'Ahududu', 'Yaban mersini', 'Limon', 'Misket limonu', 'Hindistancevizi', 'Nar', 'Incir'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Meslekler',
    terms: ['Doktor', 'Ogretmen', 'Polis', 'Itfaiyeci', 'Asci', 'Pilot', 'Avukat', 'Muhendis', 'Tamirci', 'Hemsire', 'Mimar', 'Elektrikci', 'Firinci', 'Kasap', 'Bahcivan', 'Gazeteci', 'Fotografci', 'Hakim', 'Eczaci', 'Dis hekimi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmler',
    terms: ['Titanic', 'Avatar', 'Yildiz Savaslari', 'Harry Potter', 'Yuzuklerin Efendisi', 'Matrix', 'Baslangiç', 'Jurassic Park', 'Forrest Gump', 'Baba', 'Gladyator', 'Kayip Balik Nemo', 'Karlar Ulkesi', 'Shrek', 'Batman', 'Joker', 'Yildizlararasi', 'Oyuncak Hikayesi', 'Karayip Korsanlari', 'Ucuz Roman'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Diziler',
    terms: ['Breaking Bad', 'Taht Oyunlari', 'Friends', 'Stranger Things', 'The Office', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Kurtlar Vadisi', 'The Crown', 'Narcos', 'Muhtesem Yuzyil', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Hercai'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sporlar',
    terms: ['Futbol', 'Tenis', 'Basketbol', 'Yuzme', 'Atletizm', 'Voleybol', 'Hentbol', 'Buz hokeyi', 'Golf', 'Boks', 'Kayak', 'Snowboard', 'Sorf', 'Tirmanma', 'Kurek', 'Eskrim', 'Judo', 'Jimnastik', 'Binicilik', 'Masa tenisi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Markalar',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'LC Waikiki', 'Disney', 'Red Bull', 'Turkish Airlines'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Yemekler',
    terms: ['Pizza', 'Makarna', 'Hamburger', 'Sushi', 'Kebap', 'Doner', 'Lahmacun', 'Lazanya', 'Taco', 'Kofte', 'Patates kizartmasi', 'Pide', 'Biftek', 'Corba', 'Salata', 'Simit', 'Borek', 'Manti', 'Baklava', 'Iskender'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Muzik turleri',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Caz', 'Klasik', 'Tekno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Arabesk', 'Punk', 'Turk Halk Muzigi', 'Turk Sanat Muzigi', 'Latin', 'Indie', 'EDM', 'Funk', 'Rap'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Video oyunlari',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Renkler',
    terms: ['Kirmizi', 'Mavi', 'Yesil', 'Sari', 'Turuncu', 'Mor', 'Pembe', 'Beyaz', 'Siyah', 'Kahverengi', 'Gri', 'Turkuaz', 'Altin', 'Gumus', 'Bej', 'Bordo', 'Nane', 'Mercan', 'Lacivert', 'Haki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Muzik aletleri',
    terms: ['Gitar', 'Piyano', 'Davul', 'Keman', 'Flut', 'Trompet', 'Saksafon', 'Arp', 'Cello', 'Klarnet', 'Obua', 'Trombon', 'Akordiyon', 'Ukulele', 'Tuba', 'Kontrabas', 'Gayda', 'Mizika', 'Ucgen', 'Ksilofon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Giysiler',
    terms: ['Tisort', 'Kot pantolon', 'Elbise', 'Takim elbise', 'Kazak', 'Ceket', 'Mont', 'Ayakkabi', 'Cizme', 'Sapka', 'Atki', 'Eldiven', 'Etek', 'Bluz', 'Gomlek', 'Corap', 'Kemer', 'Kravat', 'Sort', 'Mayo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Mobilyalar',
    terms: ['Masa', 'Sandalye', 'Koltuk', 'Yatak', 'Dolap', 'Raf', 'Sifonyer', 'Calisma masasi', 'Berjer', 'Tabure', 'Vitrin', 'Komodin', 'Askili', 'Sandik', 'Bank', 'Konsol', 'Hamak', 'Kitaplik', 'Yemek masasi', 'Sehpa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Aletler',
    terms: ['Cekic', 'Tornavida', 'Pense', 'Testere', 'Matkap', 'Anahtar', 'Su terazisi', 'Keskı', 'Ege', 'Zimpara', 'Metre', 'Havya', 'Balta', 'Rende', 'Oluklu keski', 'Firca', 'Spatula', 'Malacekic', 'Allen anahtari', 'Boru anahtari'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Cicekler',
    terms: ['Gul', 'Lale', 'Aycicegi', 'Zambak', 'Orkide', 'Papatya', 'Karanfil', 'Menekse', 'Lavanta', 'Sardunya', 'Yildiz cicegi', 'Gelincik', 'Susen', 'Nergis', 'Kasimpati', 'Hatmi', 'Yasemin', 'Manolya', 'Ciger', 'Cimurigu'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Baharatlar',
    terms: ['Tuz', 'Karabiber', 'Kirmizi biber', 'Tarcin', 'Zerdecal', 'Kekik', 'Fesleğen', 'Biberiye', 'Kekik', 'Muskat', 'Zencefil', 'Sarimsak', 'Safran', 'Aci biber', 'Vanilya', 'Kisnis', 'Kimyon', 'Anason', 'Dereotu', 'Maydanoz'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Icecekler',
    terms: ['Su', 'Kahve', 'Cay', 'Bira', 'Sarap', 'Kola', 'Limonata', 'Portakal suyu', 'Sut', 'Sicak cikolata', 'Smoothie', 'Kokteyl', 'Sampanya', 'Viski', 'Votka', 'Raki', 'Ayran', 'Buzlu cay', 'Turk kahvesi', 'Salep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Okul dersleri',
    terms: ['Matematik', 'Turkce', 'Ingilizce', 'Biyoloji', 'Fizik', 'Kimya', 'Tarih', 'Cografya', 'Gorsel Sanatlar', 'Muzik', 'Beden Egitimi', 'Bilisim', 'Almanca', 'Din Kulturu', 'Felsefe', 'Sosyoloji', 'Ekonomi', 'Latince', 'Psikoloji', 'Fransizca'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Diller',
    terms: ['Turkce', 'Ingilizce', 'Fransizca', 'Almanca', 'Ispanyolca', 'Italyanca', 'Portekizce', 'Rusca', 'Cince', 'Japonca', 'Arapca', 'Korece', 'Hintce', 'Lehce', 'Felemenkce', 'Isvecce', 'Yunanca', 'Cekce', 'Macarca', 'Fince'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Gok cisimleri',
    terms: ['Merkur', 'Venus', 'Dunya', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptun', 'Ay', 'Gunes', 'Pluton', 'Kuyruklu yildiz', 'Asteroit', 'Samanyolu', 'Kara delik', 'Bulutsu', 'Kirmizi cucce', 'Supernova', 'Goktasi', 'Galaksi'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Vucut parcalari',
    terms: ['Bas', 'El', 'Ayak', 'Goz', 'Burun', 'Agiz', 'Kulak', 'Kol', 'Bacak', 'Parmak', 'Ayak parmagi', 'Diz', 'Dirsek', 'Omuz', 'Sirt', 'Karin', 'Boyun', 'Alin', 'Dudak', 'Dil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Masal kahramanlari',
    terms: ['Kirmizi Baslikli Kiz', 'Sindirella', 'Pamuk Prenses', 'Rapunzel', 'Keloglan', 'Nasreddin Hoca', 'Uyuyan Guzel', 'Cizmeli Kedi', 'Parmak Cocuk', 'Uc Kucuk Domuz', 'Kurbaga Prens', 'Altinsaklilar', 'Kar Kraliçesi', 'Buyuk Kotu Kurt', 'Kotu Kalpli Uvey Anne', 'Pinokyo', 'Peter Pan', 'Robin Hood', 'Alaaddin', 'Deniz Kizi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superkahramanlar',
    terms: ['Superman', 'Batman', 'Orumcek Adam', 'Demir Adam', 'Thor', 'Hulk', 'Kaptan Amerika', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Kara Panter', 'Deadpool', 'Doktor Strange', 'Karinca Adam', 'Yesil Fener', 'Hawkeye', 'Kara Dul', 'Vision', 'Kizil Cadi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Emoji tanimla',
    terms: ['Gulen yuz', 'Kalp', 'Basparmak yukari', 'Ates', 'Gulme aglama', 'Opucuk', 'Goz kirpma', 'Dusunceli', 'Uzgun yuz', 'Kizgin', 'Parti', 'Hayalet', 'Paylaco', 'Robot', 'Maymun', 'Tek boynuzlu at', 'Gokkusagi', 'Roket', 'Tac', 'Elmas'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Masa oyunlari',
    terms: ['Satranc', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Kizma Birader', 'Catan', 'Dama', 'Tavla', 'Trivial Pursuit', 'Uno', 'Halma', 'Dokuz tas', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Dort Bağla', 'Hafiza Oyunu', 'Mangala'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Futbol kuluplerifbol',
    terms: ['Galatasaray', 'Fenerbahce', 'Besiktas', 'Trabzonspor', 'Basaksehir', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Munih', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Borussia Dortmund', 'Benfica', 'Atletico Madrid'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Tatlilar',
    terms: ['Cikolatali pasta', 'Tiramisu', 'Creme brulee', 'Dondurma', 'Panna Cotta', 'Elma turtasi', 'Brownie', 'Cheesecake', 'Cikolata musu', 'Waffle', 'Krep', 'Muhallebi', 'Muffin', 'Macaron', 'Donut', 'Baklava', 'Kunefe', 'Sutlac', 'Kazandibi', 'Tulumba'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Hava olaylari',
    terms: ['Yagmur', 'Kar', 'Firtina', 'Dolu', 'Sis', 'Ruzgar', 'Kasirga', 'Tornado', 'Hortum', 'Guneş', 'Gokkusagi', 'Don', 'Ciy', 'Simsek', 'Gok gurultusu', 'Bulut', 'Sicaklik', 'Soguk', 'Buz sarkiti', 'Kar tanesi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Ulasim araclari',
    terms: ['Araba', 'Bisiklet', 'Otobus', 'Tren', 'Ucak', 'Gemi', 'Motosiklet', 'Tramvay', 'Metro', 'Taksi', 'Helikopter', 'Scooter', 'Tekne', 'Yelkenli', 'Kano', 'Sicak hava balonu', 'Tek tekerlek', 'Kaykay', 'Fayton', 'Gondol'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Baskentler',
    terms: ['Ankara', 'Berlin', 'Paris', 'Londra', 'Madrid', 'Roma', 'Viyana', 'Bern', 'Washington', 'Tokyo', 'Pekin', 'Moskova', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Kahire', 'Atina', 'Varsova', 'Prag'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Bayramlar ve kutlamalar',
    terms: ['Ramazan Bayrami', 'Kurban Bayrami', 'Yilbasi', 'Cumhuriyet Bayrami', 'Sevgililer Gunu', 'Halloween', 'Anneler Gunu', 'Babalar Gunu', 'Zafer Bayrami', '23 Nisan', 'Cocuk Bayrami', '19 Mayis', '30 Agustos', 'Hidirellez', 'Nevruz', '15 Temmuz', 'Kadir Gecesi', 'Noel', 'Regaip Kandili', 'Mevlid Kandili'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Unlu kisiler',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Kleopatra', 'Napolyon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Mustafa Kemal Ataturk', 'Mevlana', 'Yunus Emre', 'Fatih Sultan Mehmet', 'Nazim Hikmet', 'Orhan Pamuk', 'Tarkan', 'Barıs Manco', 'Aziz Sancar', 'Hakan Sukur'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Sebzeler',
    terms: ['Domates', 'Salatalik', 'Havuc', 'Brokoli', 'Karnabahar', 'Biber', 'Sogan', 'Sarimsak', 'Ispanak', 'Kabak', 'Patlican', 'Bezelye', 'Fasulye', 'Misir', 'Kereviz', 'Turp', 'Alabildiğine', 'Balkabagi', 'Kuşkonmaz', 'Brüksel lahanasi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Bocekler ve surüngenler',
    terms: ['Karinca', 'Ari', 'Kelebek', 'Ucusbocegi', 'Orumcek', 'Sivrisinek', 'Sinek', 'Esek arisi', 'Cekirge', 'Yusufcuk', 'Bocek', 'Tirtil', 'Cirsil bocegi', 'Yabanarisi', 'Salyangoz', 'Solucani', 'Hamam bocegi', 'Kulaga kacan', 'Kene', 'Pire'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Unlu yapilar',
    terms: ['Eyfel Kulesi', 'Kolezyum', 'Cin Seddi', 'Tac Mahal', 'Ozgurluk Heykeli', 'Big Ben', 'Brandenburg Kapisi', 'Giza Piramitleri', 'Akropolis', 'Aziz Petrus Bazilikasi', 'Burç Halife', 'Sidney Opera Binası', 'Sagrada Familia', 'Tower Bridge', 'Neuschwanstein Satosu', 'Stonehenge', 'Machu Picchu', 'Kurtulus Isa Heykeli', 'Golden Gate Koprusu', 'Ayasofya'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Dans stilleri',
    terms: ['Vals', 'Tango', 'Salsa', 'Bale', 'Hip-Hop', 'Breakdans', 'Flamenko', 'Samba', 'Cha-Cha-Cha', 'Fokstrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Zeybek', 'Caz dansi', 'Cagdas dans', 'Disko', 'Horon'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Peynir cesitleri',
    terms: ['Beyaz peynir', 'Kasar', 'Tulum', 'Ezine', 'Van Otlu', 'Mozzarella', 'Parmesan', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmental', 'Cheddar', 'Mascarpone', 'Lor', 'Mihaliç', 'Cecil'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_TR = CATEGORY_NAMES;
