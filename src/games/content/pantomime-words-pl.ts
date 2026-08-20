/**
 * OHNE WORTE — Begriffe auf Polnisch.
 *
 * Das hier ist eine ANPASSUNG, keine Übersetzung. Ein Begriff taugt nur dann,
 * wenn er sich OHNE Ton und OHNE Requisit darstellen lässt UND im polnischen
 * Kulturraum bekannt ist. Wörtlich übersetzte deutsche Begriffe erfüllen
 * regelmäßig nur die erste Hälfte davon.
 *
 * Konkret heißt das:
 * - Redewendungen (`sprichwoerter`) sind KEINE Übersetzungen der deutschen
 *   Vorlage, sondern 50 gängige polnische Redewendungen — „Rzucać grochem o
 *   ścianę" oder „Mieć muchy w nosie" statt einer sinnfreien Wort-für-Wort-
 *   Fassung von „Schwein haben".
 * - Filmtitel (`filme`) stehen in der ortsüblichen Fassung („Król Lew", nicht
 *   „Der König der Löwen"). Titel ohne Bekanntheit in Polen sind ersetzt:
 *   statt „Tatort" steht hier „Świat według Kiepskich".
 * - Märchen (`maerchen`) sind lokal geläufige Figuren.
 * - Bei `tiere`, `berufe`, `alltag`, `sport` und `gefuehle` trägt meist die
 *   direkte Entsprechung, geprüft wurde trotzdem die Darstellbarkeit.
 *
 * Achtung bei Homonymen: „Meduza" heißt auf Polnisch sowohl Qualle als auch
 * Gorgone. Die Qualle steht bei `tiere`, in `maerchen` steht deshalb der
 * Minotaur.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel, keine Anzeige.
 * Apostrophe sind bewusst vermieden, damit die Strings ohne Maskierung
 * auskommen.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_PL: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Zwierzęta',
    emoji: '🐘',
    words: [
      'Słoń', 'Żyrafa', 'Pingwin', 'Kangur', 'Wąż',
      'Orzeł', 'Żaba', 'Krokodyl', 'Małpa', 'Lew',
      'Pszczoła', 'Motyl', 'Pająk', 'Krab', 'Rekin',
      'Wieloryb', 'Delfin', 'Jeż', 'Sowa', 'Bocian',
      'Paw', 'Leniwiec', 'Surykatka', 'Wielbłąd', 'Nosorożec',
      'Flaming', 'Żółw', 'Nietoperz', 'Kret', 'Homar',
      'Meduza', 'Konik morski', 'Szop pracz', 'Wiewiórka', 'Koliber',
      'Struś', 'Goryl', 'Wilk', 'Lis', 'Zając',
      'Krowa', 'Świnia', 'Kura', 'Koń', 'Kot',
      'Pies', 'Kaczka', 'Koza', 'Owca', 'Mysz',
    ],
  },
  {
    id: 'berufe',
    name: 'Zawody',
    emoji: '👷',
    words: [
      'Strażak', 'Kucharz', 'Dentysta', 'Pilot', 'Fryzjer',
      'Policjant', 'Nauczyciel', 'Robotnik budowlany', 'Kelner', 'Ogrodnik',
      'Fotograf', 'Dyrygent', 'Klaun', 'Astronauta', 'Nurek',
      'Piekarz', 'Rzeźnik', 'Malarz', 'Spawacz', 'Listonosz',
      'Śmieciarz', 'Kierowca autobusu', 'Sędzia', 'Adwokat', 'Chirurg',
      'Pielęgniarz', 'Weterynarz', 'Bibliotekarz', 'Kasjerka', 'Barman',
      'DJ', 'Aktor', 'Trener piłkarski', 'Sędzia piłkarski', 'Przewodnik górski',
      'Pszczelarz', 'Pasterz', 'Rybak', 'Rolnik', 'Mechanik',
      'Elektryk', 'Hydraulik', 'Dekarz', 'Kominiarz', 'Sekretarka',
      'Modelka', 'Kaskader', 'Magik', 'Handlarz na targu', 'Dozorca',
    ],
  },
  {
    id: 'filme',
    name: 'Filmy i seriale',
    emoji: '🎬',
    words: [
      'Titanic', 'Ojciec chrzestny', 'Gwiezdne wojny', 'Park Jurajski', 'Król Lew',
      'Rocky', 'Terminator', 'Matrix', 'Piraci z Karaibów', 'Władca Pierścieni',
      'Harry Potter', 'E.T.', 'Szczęki', 'Pogromcy duchów', 'Powrót do przyszłości',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Zakonnica w przebraniu', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'Czarnoksiężnik z Krainy Oz', 'Mary Poppins', 'Kraina lodu',
      'Gdzie jest Nemo', 'Shrek', 'Epoka lodowcowa', 'Toy Story', 'Księga dżungli',
      'Aladyn', 'Zwierzogród', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Simpsonowie', 'Gra o tron', 'Breaking Bad', 'Stranger Things', 'Przyjaciele',
      'Sherlock', 'Słoneczny patrol', 'Świat według Kiepskich', 'Dark', 'Squid Game',
      'Dom z papieru', 'Grawitacja', 'Marsjanin', 'Avatar', 'Egzorcysta',
    ],
  },
  {
    id: 'alltag',
    name: 'Codzienność',
    emoji: '🪥',
    words: [
      'Mycie zębów', 'Parzenie kawy', 'Wieszanie prania', 'Odkurzanie', 'Mycie okien',
      'Wiązanie butów', 'Rozkładanie parasola', 'Mycie samochodu', 'Koszenie trawy', 'Wynoszenie śmieci',
      'Ścielenie łóżka', 'Zmywanie naczyń', 'Prasowanie', 'Suszenie włosów', 'Obcinanie paznokci',
      'Smarowanie chleba', 'Rozbijanie jajka', 'Odcedzanie makaronu', 'Zamawianie pizzy', 'Pchanie wózka sklepowego',
      'Stanie w kolejce', 'Spóźnienie na autobus', 'Łatanie roweru', 'Wymiana opony', 'Składanie regału',
      'Wbijanie gwoździa', 'Wymiana żarówki', 'Rozpakowanie paczki', 'Pakowanie prezentu', 'Wrzucanie listu do skrzynki',
      'Szukanie kluczy', 'Ładowanie telefonu', 'Robienie selfie', 'Przełączanie kanałów', 'Wyłączanie budzika',
      'Zaspanie', 'Pakowanie walizki', 'Rozbijanie namiotu', 'Grillowanie', 'Lepienie bałwana',
      'Podlewanie kwiatów', 'Wyprowadzanie psa', 'Przewijanie niemowlaka', 'Nitkowanie zębów', 'Kichanie',
      'Ziewanie', 'Czkawka', 'Żucie gumy', 'Czekanie na windę', 'Zgubienie drogi',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Piłka nożna', 'Koszykówka', 'Tenis', 'Golf', 'Boks',
      'Pływanie', 'Nurkowanie', 'Narciarstwo', 'Snowboard', 'Łyżwiarstwo',
      'Gimnastyka', 'Skok wzwyż', 'Skok w dal', 'Skok o tyczce', 'Rzut oszczepem',
      'Pchnięcie kulą', 'Bieg przez płotki', 'Maraton', 'Kolarstwo', 'Wioślarstwo',
      'Żeglarstwo', 'Surfing', 'Wspinaczka', 'Alpinizm', 'Jazda konna',
      'Łucznictwo', 'Szermierka', 'Judo', 'Karate', 'Zapasy',
      'Podnoszenie ciężarów', 'Tenis stołowy', 'Badminton', 'Siatkówka', 'Piłka ręczna',
      'Hokej na trawie', 'Hokej na lodzie', 'Rugby', 'Baseball', 'Krykiet',
      'Kręgle', 'Rzutki', 'Bilard', 'Deskorolka', 'Wrotki',
      'Skoki na trampolinie', 'Joga', 'Skakanka', 'Wędkarstwo', 'Formuła 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Uczucia',
    emoji: '😤',
    words: [
      'Złość', 'Radość', 'Strach', 'Smutek', 'Obrzydzenie',
      'Zaskoczenie', 'Nuda', 'Zdenerwowanie', 'Duma', 'Wstyd',
      'Zazdrość', 'Zawiść', 'Zakochanie', 'Tęsknota za domem', 'Zmęczenie',
      'Wyczerpanie', 'Panika', 'Ulga', 'Rozczarowanie', 'Zakłopotanie',
      'Złośliwa radość', 'Tęsknota', 'Zadowolenie', 'Niecierpliwość', 'Nieufność',
      'Ciekawość', 'Zachwyt', 'Frustracja', 'Szok', 'Bojaźń',
      'Wdzięczność', 'Nadzieja', 'Rozpacz', 'Spokój', 'Podekscytowanie',
      'Upór', 'Współczucie', 'Podziw', 'Zdezorientowanie', 'Sceptycyzm',
      'Irytacja', 'Nieśmiałość', 'Odwaga', 'Tchórzostwo', 'Skrucha',
      'Triumf', 'Samotność', 'Poczucie bezpieczeństwa', 'Chęć podróży', 'Radosne oczekiwanie',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Powiedzenia',
    emoji: '💬',
    words: [
      'Rzucać grochem o ścianę', 'Mieć muchy w nosie', 'Robić z igły widły', 'Trzymać kciuki', 'Rzucić ręcznik na ring',
      'Trafić w dziesiątkę', 'Kupować kota w worku', 'Wpaść jak śliwka w kompot', 'Mieć węża w kieszeni', 'Chodzić jak kot wokół gorącej kaszy',
      'Przymknąć oko', 'Chować głowę w piasek', 'Dolewać oliwy do ognia', 'Przełamać lody', 'Upiec dwie pieczenie na jednym ogniu',
      'Stracić wątek', 'Robić dobrą minę do złej gry', 'Kręcić nosem', 'Nadstawiać uszu', 'Być czarną owcą',
      'Słoń w składzie porcelany', 'Wziąć nogi za pas', 'Wpaść z deszczu pod rynnę', 'Zamienić się w słuch', 'Spaść z księżyca',
      'Wiercić dziurę w brzuchu', 'Nabrać wody w usta', 'Głowa do góry', 'Trzymać rękę na pulsie', 'Zaciskać zęby',
      'Bujać w obłokach', 'Skakać z radości', 'Mieć duszę na ramieniu', 'Zbijać bąki', 'Lać wodę',
      'Wyjść jak Zabłocki na mydle', 'Iść spać z kurami', 'Mieć dwie lewe ręce', 'Wpaść komuś w oko', 'Uderzyć w stół',
      'Rzucać się z motyką na słońce', 'Machnąć ręką', 'Wpuścić kogoś w maliny', 'Włos się jeży na głowie', 'Rwać włosy z głowy',
      'Wziąć byka za rogi', 'Wyskoczyć jak filip z konopi', 'Robić słodkie oczy', 'Szukać igły w stogu siana', 'Rzucać kłody pod nogi',
    ],
  },
  {
    id: 'maerchen',
    name: 'Baśnie i postacie',
    emoji: '🧚',
    words: [
      'Czerwony Kapturek', 'Królewna Śnieżka', 'Kopciuszek', 'Śpiąca Królewna', 'Roszpunka',
      'Jaś i Małgosia', 'Żabi Król', 'Rumpelsztyk', 'Muzykanci z Bremy', 'Kot w butach',
      'Pinokio', 'Piotruś Pan', 'Alicja w Krainie Czarów', 'Robin Hood', 'Król Artur',
      'Herkules', 'Zeus', 'Posejdon', 'Minotaur', 'Ikar',
      'Frankenstein', 'Drakula', 'Święty Mikołaj', 'Zajączek wielkanocny', 'Wróżka zębuszka',
      'Jednorożec', 'Smok', 'Krasnolud', 'Olbrzym', 'Wiedźma',
      'Czarodziej', 'Rycerz', 'Pirat', 'Syrenka', 'Wampir',
      'Wilkołak', 'Zombie', 'Duch', 'Robot', 'Kosmita',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'Grinch', 'Sindbad', 'Ali Baba',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptiz', 'Pocałunek z języczkiem', 'Randka w ciemno', 'Prezerwatywa', 'Bielizna',
      'Taniec na rurze', 'Taniec brzucha', 'Lap dance', 'Kajdanki', 'Kamasutra',
      'Wieczór kawalerski', 'Randka z Tindera', 'Tekst na podryw', 'Dostać kosza', 'Flirtowanie',
      'Malinka na szyi', 'List miłosny', 'Bicie serca', 'Uwodzenie', 'Zasłanianie oczu',
      'Masaż', 'Kąpiel z pianą', 'Płatki róż', 'Blask świec', 'Noc poślubna',
      'Miesiąc miodowy', 'Test ciążowy', 'Kłótnia w związku', 'Scena zazdrości', 'Rozstanie',
      'Były partner', 'Zdrada', 'Wstydliwe zdjęcie', 'Spowiedź', 'Wykrywacz kłamstw',
      'Kieliszek wódki', 'Kac o poranku', 'Pijany taniec', 'Karaoke o trzeciej w nocy', 'Piwny brzuch',
      'Kąpiel nago', 'Plaża nudystów', 'Sauna', 'Robienie tatuażu', 'Kolczyk w ciele',
      'Pokazywanie mięśni brzucha', 'Prężenie muskułów', 'Podziwianie się w lustrze', 'Skradanie się do domu nocą', 'Dzielenie rachunku',
    ],
  },
];
