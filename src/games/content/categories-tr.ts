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
  'Hayvanlar', 'Ülkeler', 'Şehirler', 'Meslekler', 'Sporlar', 'Filmler',
  'Diziler', 'Markalar', 'Meyveler', 'Sebzeler', 'Araba markaları',
  'Renkler', 'Müzik aletleri', 'İçecekler', 'Tatlılar',
  'Okul dersleri', 'Diller', 'Çiçekler', 'Ağaçlar', 'Baharatlar',
  'Giysiler', 'Mobilyalar', 'Vücut parçaları', 'Aletler',
  'Müzik grupları', 'Çizgi film karakterleri', 'Süperkahramanlar', 'Disney karakterleri',
  'Mutfak aletleri', 'Top sporları', 'Su sporları',
  'Kış sporları', 'Memeliler', 'Kuşlar', 'Balıklar',
  'Böcekler', 'Avrupa başkentleri', 'Türk şehirleri',
  'Pizza malzemeleri', 'Kokteyller', 'Ekmek çeşitleri', 'Peynir çeşitleri',
  'Dans stilleri', 'Kart oyunları', 'Masa oyunları', 'Video oyunları',
  'Otlar', 'Kuruyemişler', 'Mineraller', 'Kumaş çeşitleri',
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
    terms: ['Köpek', 'Kedi', 'At', 'İnek', 'Domuz', 'Tavuk', 'Koyun', 'Keçi', 'Fil', 'Aslan', 'Kaplan', 'Ayı', 'Maymun', 'Yunus', 'Kartal', 'Yılan', 'Kurbağa', 'Tavşan', 'Kirpi', 'Sincap'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Ülkeler',
    terms: ['Türkiye', 'Almanya', 'Fransa', 'İtalya', 'İspanya', 'İngiltere', 'ABD', 'Japonya', 'Brezilya', 'Avustralya', 'Kanada', 'Meksika', 'Hindistan', 'Çin', 'Rusya', 'Mısır', 'Güney Afrika', 'Arjantin', 'İsveç', 'Yunanistan'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Şehirler',
    terms: ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Paris', 'Londra', 'New York', 'Tokyo', 'Berlin', 'Roma', 'Barselona', 'Dubai', 'Sidney', 'Amsterdam', 'Prag', 'Viyana', 'Trabzon', 'Konya', 'Gaziantep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Araba markaları',
    terms: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Renault', 'Peugeot', 'Hyundai', 'Mazda', 'Togg', 'Opel', 'Skoda'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Meyveler',
    terms: ['Elma', 'Muz', 'Portakal', 'Çilek', 'Kiraz', 'Üzüm', 'Karpuz', 'Ananas', 'Mango', 'Kivi', 'Armut', 'Şeftali', 'Erik', 'Ahududu', 'Yaban mersini', 'Limon', 'Misket limonu', 'Hindistancevizi', 'Nar', 'İncir'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Meslekler',
    terms: ['Doktor', 'Öğretmen', 'Polis', 'İtfaiyeci', 'Aşçı', 'Pilot', 'Avukat', 'Mühendis', 'Tamirci', 'Hemşire', 'Mimar', 'Elektrikçi', 'Fırıncı', 'Kasap', 'Bahçıvan', 'Gazeteci', 'Fotoğrafçı', 'Hâkim', 'Eczacı', 'Diş hekimi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Filmler',
    terms: ['Titanic', 'Avatar', 'Yıldız Savaşları', 'Harry Potter', 'Yüzüklerin Efendisi', 'Matrix', 'Başlangıç', 'Jurassic Park', 'Forrest Gump', 'Baba', 'Gladyatör', 'Kayıp Balık Nemo', 'Karlar Ülkesi', 'Shrek', 'Batman', 'Joker', 'Yıldızlararası', 'Oyuncak Hikayesi', 'Karayip Korsanları', 'Ucuz Roman'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Diziler',
    terms: ['Breaking Bad', 'Taht Oyunları', 'Friends', 'Stranger Things', 'The Office', 'La Casa de Papel', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Kurtlar Vadisi', 'The Crown', 'Narcos', 'Muhteşem Yüzyıl', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Hercai'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sporlar',
    terms: ['Futbol', 'Tenis', 'Basketbol', 'Yüzme', 'Atletizm', 'Voleybol', 'Hentbol', 'Buz hokeyi', 'Golf', 'Boks', 'Kayak', 'Snowboard', 'Sörf', 'Tırmanma', 'Kürek', 'Eskrim', 'Judo', 'Jimnastik', 'Binicilik', 'Masa tenisi'],
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
    terms: ['Pizza', 'Makarna', 'Hamburger', 'Sushi', 'Kebap', 'Döner', 'Lahmacun', 'Lazanya', 'Taco', 'Köfte', 'Patates kızartması', 'Pide', 'Biftek', 'Çorba', 'Salata', 'Simit', 'Börek', 'Mantı', 'Baklava', 'İskender'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Müzik türleri',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Caz', 'Klasik', 'Tekno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Arabesk', 'Punk', 'Türk Halk Müziği', 'Türk Sanat Müziği', 'Latin', 'Indie', 'EDM', 'Funk', 'Rap'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Video oyunları',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Renkler',
    terms: ['Kırmızı', 'Mavi', 'Yeşil', 'Sarı', 'Turuncu', 'Mor', 'Pembe', 'Beyaz', 'Siyah', 'Kahverengi', 'Gri', 'Turkuaz', 'Altın', 'Gümüş', 'Bej', 'Bordo', 'Nane', 'Mercan', 'Lacivert', 'Haki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Müzik aletleri',
    terms: ['Gitar', 'Piyano', 'Davul', 'Keman', 'Flüt', 'Trompet', 'Saksafon', 'Arp', 'Cello', 'Klarnet', 'Obua', 'Trombon', 'Akordiyon', 'Ukulele', 'Tuba', 'Kontrabas', 'Gayda', 'Mızıka', 'Üçgen', 'Ksilofon'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Giysiler',
    terms: ['Tişört', 'Kot pantolon', 'Elbise', 'Takım elbise', 'Kazak', 'Ceket', 'Mont', 'Ayakkabı', 'Çizme', 'Şapka', 'Atkı', 'Eldiven', 'Etek', 'Bluz', 'Gömlek', 'Çorap', 'Kemer', 'Kravat', 'Şort', 'Mayo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Mobilyalar',
    terms: ['Masa', 'Sandalye', 'Koltuk', 'Yatak', 'Dolap', 'Raf', 'Şifonyer', 'Çalışma masası', 'Berjer', 'Tabure', 'Vitrin', 'Komodin', 'Askılı', 'Sandık', 'Bank', 'Konsol', 'Hamak', 'Kitaplık', 'Yemek masası', 'Sehpa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Aletler',
    terms: ['Çekiç', 'Tornavida', 'Pense', 'Testere', 'Matkap', 'Anahtar', 'Su terazisi', 'Keski', 'Eğe', 'Zımpara', 'Metre', 'Havya', 'Balta', 'Rende', 'Oluklu keski', 'Fırça', 'Spatula', 'Malaçekiç', 'Allen anahtarı', 'Boru anahtarı'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Çiçekler',
    terms: ['Gül', 'Lale', 'Ayçiçeği', 'Zambak', 'Orkide', 'Papatya', 'Karanfil', 'Menekşe', 'Lavanta', 'Sardunya', 'Yıldız çiçeği', 'Gelincik', 'Süsen', 'Nergis', 'Kasımpatı', 'Hatmi', 'Yasemin', 'Manolya', 'Ciger', 'Cimurigu'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Baharatlar',
    terms: ['Tuz', 'Karabiber', 'Kırmızı biber', 'Tarçın', 'Zerdeçal', 'Kekik', 'Fesleğen', 'Biberiye', 'Kekik', 'Muskat', 'Zencefil', 'Sarımsak', 'Safran', 'Acı biber', 'Vanilya', 'Kişniş', 'Kimyon', 'Anason', 'Dereotu', 'Maydanoz'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'İçecekler',
    terms: ['Su', 'Kahve', 'Çay', 'Bira', 'Şarap', 'Kola', 'Limonata', 'Portakal suyu', 'Süt', 'Sıcak çikolata', 'Smoothie', 'Kokteyl', 'Şampanya', 'Viski', 'Votka', 'Rakı', 'Ayran', 'Buzlu çay', 'Türk kahvesi', 'Salep'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Okul dersleri',
    terms: ['Matematik', 'Türkçe', 'İngilizce', 'Biyoloji', 'Fizik', 'Kimya', 'Tarih', 'Coğrafya', 'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi', 'Bilişim', 'Almanca', 'Din Kültürü', 'Felsefe', 'Sosyoloji', 'Ekonomi', 'Latince', 'Psikoloji', 'Fransızca'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Diller',
    terms: ['Türkçe', 'İngilizce', 'Fransızca', 'Almanca', 'İspanyolca', 'İtalyanca', 'Portekizce', 'Rusça', 'Çince', 'Japonca', 'Arapça', 'Korece', 'Hintçe', 'Lehçe', 'Felemenkce', 'İsveççe', 'Yunanca', 'Çekçe', 'Macarca', 'Fince'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Gök cisimleri',
    terms: ['Merkür', 'Venüs', 'Dünya', 'Mars', 'Jüpiter', 'Satürn', 'Uranüs', 'Neptun', 'Ay', 'Güneş', 'Plüton', 'Kuyruklu yıldız', 'Asteroit', 'Samanyolu', 'Kara delik', 'Bulutsu', 'Kırmızı cucce', 'Supernova', 'Göktaşı', 'Galaksi'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Vücut parçaları',
    terms: ['Baş', 'El', 'Ayak', 'Göz', 'Burun', 'Ağız', 'Kulak', 'Kol', 'Bacak', 'Parmak', 'Ayak parmağı', 'Diz', 'Dirsek', 'Omuz', 'Sırt', 'Karın', 'Boyun', 'Alın', 'Dudak', 'Dil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Masal kahramanları',
    terms: ['Kırmızı Başlıklı Kız', 'Sindirella', 'Pamuk Prenses', 'Rapunzel', 'Keloğlan', 'Nasreddin Hoca', 'Uyuyan Güzel', 'Çizmeli Kedi', 'Parmak Çocuk', 'Üç Küçük Domuz', 'Kurbağa Prens', 'Altinsaklilar', 'Kar Kraliçesi', 'Büyük Kötü Kurt', 'Kötü Kalpli Üvey Anne', 'Pinokyo', 'Peter Pan', 'Robin Hood', 'Alaaddin', 'Deniz Kızı'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Süperkahramanlar',
    terms: ['Superman', 'Batman', 'Örümcek Adam', 'Demir Adam', 'Thor', 'Hulk', 'Kaptan Amerika', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Kara Panter', 'Deadpool', 'Doktor Strange', 'Karınca Adam', 'Yeşil Fener', 'Hawkeye', 'Kara Dul', 'Vision', 'Kızıl Cadı'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Emoji tanımla',
    terms: ['Gülen yüz', 'Kalp', 'Başparmak yukarı', 'Ateş', 'Gülme ağlama', 'Öpücük', 'Göz kırpma', 'Düşünceli', 'Üzgün yüz', 'Kızgın', 'Parti', 'Hayalet', 'Paylaco', 'Robot', 'Maymun', 'Tek boynuzlu at', 'Gökkuşağı', 'Roket', 'Taç', 'Elmas'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Masa oyunları',
    terms: ['Satranç', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Kızma Birader', 'Catan', 'Dama', 'Tavla', 'Trivial Pursuit', 'Uno', 'Halma', 'Dokuz taş', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Dört Bağla', 'Hafıza Oyunu', 'Mangala'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Futbol kuluplerifbol',
    terms: ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'Başakşehir', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Münih', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Borussia Dortmund', 'Benfica', 'Atletico Madrid'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Tatlılar',
    terms: ['Çikolatalı pasta', 'Tiramisu', 'Creme brulee', 'Dondurma', 'Panna Cotta', 'Elma turtası', 'Brownie', 'Cheesecake', 'Çikolata musu', 'Waffle', 'Krep', 'Muhallebi', 'Muffin', 'Macaron', 'Donut', 'Baklava', 'Künefe', 'Sütlaç', 'Kazandibi', 'Tulumba'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Hava olayları',
    terms: ['Yağmur', 'Kar', 'Fırtına', 'Dolu', 'Sis', 'Rüzgâr', 'Kasırga', 'Tornado', 'Hortum', 'Güneş', 'Gökkuşağı', 'Don', 'Çiy', 'Şimşek', 'Gök gürültüsü', 'Bulut', 'Sıcaklık', 'Soğuk', 'Buz sarkıtı', 'Kar tanesi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Ulaşım araçları',
    terms: ['Araba', 'Bisiklet', 'Otobüs', 'Tren', 'Uçak', 'Gemi', 'Motosiklet', 'Tramvay', 'Metro', 'Taksi', 'Helikopter', 'Scooter', 'Tekne', 'Yelkenli', 'Kano', 'Sıcak hava balonu', 'Tek tekerlek', 'Kaykay', 'Fayton', 'Gondol'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Başkentler',
    terms: ['Ankara', 'Berlin', 'Paris', 'Londra', 'Madrid', 'Roma', 'Viyana', 'Bern', 'Washington', 'Tokyo', 'Pekin', 'Moskova', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Kahire', 'Atina', 'Varşova', 'Prag'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Bayramlar ve kutlamalar',
    terms: ['Ramazan Bayramı', 'Kurban Bayramı', 'Yılbaşı', 'Cumhuriyet Bayramı', 'Sevgililer Günü', 'Halloween', 'Anneler Günü', 'Babalar Günü', 'Zafer Bayramı', '23 Nisan', 'Çocuk Bayramı', '19 Mayıs', '30 Ağustos', 'Hıdırellez', 'Nevruz', '15 Temmuz', 'Kadir Gecesi', 'Noel', 'Regaip Kandili', 'Mevlid Kandili'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Ünlü kişiler',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Kleopatra', 'Napolyon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Mustafa Kemal Atatürk', 'Mevlana', 'Yunus Emre', 'Fatih Sultan Mehmet', 'Nazım Hikmet', 'Orhan Pamuk', 'Tarkan', 'Barış Manço', 'Aziz Sancar', 'Hakan Şükür'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Sebzeler',
    terms: ['Domates', 'Salatalık', 'Havuç', 'Brokoli', 'Karnabahar', 'Biber', 'Soğan', 'Sarımsak', 'Ispanak', 'Kabak', 'Patlıcan', 'Bezelye', 'Fasulye', 'Mısır', 'Kereviz', 'Turp', 'Alabildiğine', 'Balkabağı', 'Kuşkonmaz', 'Brüksel lahanası'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Böcekler ve sürüngenler',
    terms: ['Karınca', 'Arı', 'Kelebek', 'Ucusbocegi', 'Örümcek', 'Sivrisinek', 'Sinek', 'Eşek arısı', 'Çekirge', 'Yusufçuk', 'Böcek', 'Tırtıl', 'Cirsil bocegi', 'Yabanarısı', 'Salyangoz', 'Solucani', 'Hamam böceği', 'Kulağa kaçan', 'Kene', 'Pire'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Ünlü yapılar',
    terms: ['Eyfel Kulesi', 'Kolezyum', 'Çin Seddi', 'Tac Mahal', 'Özgürlük Heykeli', 'Big Ben', 'Brandenburg Kapısı', 'Giza Piramitleri', 'Akropolis', 'Aziz Petrus Bazilikası', 'Burç Halife', 'Sidney Opera Binası', 'Sagrada Familia', 'Tower Bridge', 'Neuschwanstein Şatosu', 'Stonehenge', 'Machu Picchu', 'Kurtuluş İsa Heykeli', 'Golden Gate Köprüsü', 'Ayasofya'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Dans stilleri',
    terms: ['Vals', 'Tango', 'Salsa', 'Bale', 'Hip-Hop', 'Breakdans', 'Flamenko', 'Samba', 'Cha-Cha-Cha', 'Fokstrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Zeybek', 'Caz dansı', 'Çağdaş dans', 'Disko', 'Horon'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Peynir çeşitleri',
    terms: ['Beyaz peynir', 'Kaşar', 'Tulum', 'Ezine', 'Van Otlu', 'Mozzarella', 'Parmesan', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Gruyere', 'Emmental', 'Cheddar', 'Mascarpone', 'Lor', 'Mihaliç', 'Çeçil'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_TR = CATEGORY_NAMES;
