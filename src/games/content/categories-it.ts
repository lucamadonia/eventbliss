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
  'Animali', 'Paesi', 'Citta', 'Professioni', 'Sport', 'Film',
  'Serie TV', 'Marchi', 'Frutta', 'Verdura', 'Marche automobilistiche',
  'Colori', 'Strumenti musicali', 'Bevande', 'Dolciumi',
  'Materie scolastiche', 'Lingue', 'Fiori', 'Alberi', 'Spezie',
  'Abbigliamento', 'Mobili', 'Parti del corpo', 'Attrezzi',
  'Band musicali', 'Personaggi dei fumetti', 'Supereroi', 'Personaggi Disney',
  'Elettrodomestici', 'Sport con la palla', 'Sport acquatici',
  'Sport invernali', 'Mammiferi', 'Uccelli', 'Pesci',
  'Insetti', 'Capitali europee', 'Citta italiane',
  'Condimenti per pizza', 'Cocktail', 'Tipi di pane', 'Tipi di formaggio',
  'Stili di ballo', 'Giochi di carte', 'Giochi da tavolo', 'Videogiochi',
  'Erbe', 'Noci', 'Minerali', 'Tipi di tessuto',
];

const LETTERS = 'ABCDEFGHILMNOPRSTUVZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_IT: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Animali',
    terms: ['Cane', 'Gatto', 'Cavallo', 'Mucca', 'Maiale', 'Gallina', 'Pecora', 'Capra', 'Elefante', 'Leone', 'Tigre', 'Orso', 'Scimmia', 'Delfino', 'Aquila', 'Serpente', 'Rana', 'Coniglio', 'Riccio', 'Scoiattolo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Paesi',
    terms: ['Italia', 'Francia', 'Germania', 'Spagna', 'Inghilterra', 'Stati Uniti', 'Giappone', 'Brasile', 'Australia', 'Canada', 'Messico', 'India', 'Cina', 'Russia', 'Egitto', 'Sudafrica', 'Argentina', 'Svezia', 'Grecia', 'Portogallo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Citta',
    terms: ['Roma', 'Milano', 'Napoli', 'Firenze', 'Venezia', 'Parigi', 'Londra', 'New York', 'Tokyo', 'Berlino', 'Madrid', 'Barcellona', 'Istanbul', 'Dubai', 'Sydney', 'Vienna', 'Amsterdam', 'Praga', 'Lisbona', 'Torino'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marche automobilistiche',
    terms: ['Ferrari', 'Lamborghini', 'Fiat', 'Alfa Romeo', 'Maserati', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Renault', 'Peugeot', 'Hyundai', 'Jaguar', 'Lancia'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Frutta',
    terms: ['Mela', 'Banana', 'Arancia', 'Fragola', 'Ciliegia', 'Uva', 'Anguria', 'Ananas', 'Mango', 'Kiwi', 'Pera', 'Pesca', 'Prugna', 'Lampone', 'Mirtillo', 'Limone', 'Lime', 'Cocco', 'Melograno', 'Fico'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Professioni',
    terms: ['Medico', 'Insegnante', 'Poliziotto', 'Vigile del fuoco', 'Cuoco', 'Pilota', 'Avvocato', 'Ingegnere', 'Meccanico', 'Infermiera', 'Architetto', 'Elettricista', 'Panettiere', 'Macellaio', 'Giardiniere', 'Giornalista', 'Fotografo', 'Giudice', 'Farmacista', 'Dentista'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Film',
    terms: ['Titanic', 'Avatar', 'Guerre Stellari', 'Harry Potter', 'Il Signore degli Anelli', 'Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'Il Padrino', 'Il Gladiatore', 'Alla ricerca di Nemo', 'Frozen', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Pirati dei Caraibi', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Serie TV',
    terms: ['Breaking Bad', 'Il Trono di Spade', 'Friends', 'Stranger Things', 'The Office', 'La Casa di Carta', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Gomorra', 'The Crown', 'Narcos', 'Mare Fuori', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Suburra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sport',
    terms: ['Calcio', 'Tennis', 'Pallacanestro', 'Nuoto', 'Atletica', 'Pallavolo', 'Pallamano', 'Hockey su ghiaccio', 'Golf', 'Pugilato', 'Sci', 'Snowboard', 'Surf', 'Arrampicata', 'Canottaggio', 'Scherma', 'Judo', 'Ginnastica', 'Equitazione', 'Tennis da tavolo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marchi',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Cucina',
    terms: ['Pizza', 'Pasta', 'Hamburger', 'Sushi', 'Risotto', 'Lasagne', 'Gnocchi', 'Tacos', 'Curry', 'Patatine fritte', 'Kebab', 'Bistecca', 'Minestrone', 'Insalata', 'Focaccia', 'Croissant', 'Tiramisù', 'Ravioli', 'Ossobuco', 'Carbonara'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Generi musicali',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classica', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Musica italiana', 'Opera', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Videogiochi',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Colori',
    terms: ['Rosso', 'Blu', 'Verde', 'Giallo', 'Arancione', 'Viola', 'Rosa', 'Bianco', 'Nero', 'Marrone', 'Grigio', 'Turchese', 'Oro', 'Argento', 'Beige', 'Bordeaux', 'Menta', 'Corallo', 'Indaco', 'Cachi'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Strumenti musicali',
    terms: ['Chitarra', 'Pianoforte', 'Batteria', 'Violino', 'Flauto', 'Tromba', 'Sassofono', 'Arpa', 'Violoncello', 'Clarinetto', 'Oboe', 'Trombone', 'Fisarmonica', 'Ukulele', 'Tuba', 'Contrabbasso', 'Cornamusa', 'Armonica', 'Triangolo', 'Xilofono'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Abbigliamento',
    terms: ['Maglietta', 'Jeans', 'Vestito', 'Completo', 'Maglione', 'Giacca', 'Cappotto', 'Scarpe', 'Stivali', 'Cappello', 'Sciarpa', 'Guanti', 'Gonna', 'Camicetta', 'Camicia', 'Calzini', 'Cintura', 'Cravatta', 'Pantaloncini', 'Costume da bagno'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Mobili',
    terms: ['Tavolo', 'Sedia', 'Divano', 'Letto', 'Armadio', 'Scaffale', 'Cassettiera', 'Scrivania', 'Poltrona', 'Sgabello', 'Vetrina', 'Comodino', 'Appendiabiti', 'Baule', 'Panca', 'Credenza', 'Amaca', 'Libreria', 'Tavolo da pranzo', 'Tavolino'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Attrezzi',
    terms: ['Martello', 'Cacciavite', 'Pinza', 'Sega', 'Trapano', 'Chiave inglese', 'Livella', 'Scalpello', 'Lima', 'Carta vetrata', 'Metro a nastro', 'Saldatore', 'Ascia', 'Pialla', 'Sgorbia', 'Pennello', 'Spatola', 'Cazzuola', 'Chiave a brugola', 'Pinza per tubi'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Fiori',
    terms: ['Rosa', 'Tulipano', 'Girasole', 'Giglio', 'Orchidea', 'Margherita', 'Garofano', 'Violetta', 'Lavanda', 'Geranio', 'Dalia', 'Papavero', 'Iris', 'Narciso', 'Crisantemo', 'Ibisco', 'Gelsomino', 'Magnolia', 'Croco', 'Primula'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Spezie',
    terms: ['Sale', 'Pepe', 'Paprica', 'Cannella', 'Curcuma', 'Origano', 'Basilico', 'Rosmarino', 'Timo', 'Noce moscata', 'Zenzero', 'Aglio', 'Zafferano', 'Peperoncino', 'Vaniglia', 'Coriandolo', 'Cumino', 'Anice', 'Aneto', 'Prezzemolo'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Bevande',
    terms: ['Acqua', 'Caffe', 'Te', 'Birra', 'Vino', 'Cola', 'Limonata', 'Succo d\'arancia', 'Latte', 'Cioccolata calda', 'Frullato', 'Cocktail', 'Champagne', 'Whisky', 'Vodka', 'Gin', 'Spritz', 'Te freddo', 'Espresso', 'Grappa'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Materie scolastiche',
    terms: ['Matematica', 'Italiano', 'Inglese', 'Biologia', 'Fisica', 'Chimica', 'Storia', 'Geografia', 'Arte', 'Musica', 'Educazione fisica', 'Informatica', 'Francese', 'Religione', 'Filosofia', 'Diritto', 'Economia', 'Latino', 'Scienze', 'Spagnolo'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Lingue',
    terms: ['Italiano', 'Inglese', 'Francese', 'Spagnolo', 'Tedesco', 'Portoghese', 'Russo', 'Cinese', 'Giapponese', 'Arabo', 'Turco', 'Coreano', 'Hindi', 'Polacco', 'Olandese', 'Svedese', 'Greco', 'Ceco', 'Ungherese', 'Finlandese'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Oggetti celesti',
    terms: ['Mercurio', 'Venere', 'Terra', 'Marte', 'Giove', 'Saturno', 'Urano', 'Nettuno', 'Luna', 'Sole', 'Plutone', 'Cometa', 'Asteroide', 'Via Lattea', 'Buco nero', 'Nebulosa', 'Nana rossa', 'Supernova', 'Meteorite', 'Galassia'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Parti del corpo',
    terms: ['Testa', 'Mano', 'Piede', 'Occhio', 'Naso', 'Bocca', 'Orecchio', 'Braccio', 'Gamba', 'Dito', 'Dito del piede', 'Ginocchio', 'Gomito', 'Spalla', 'Schiena', 'Pancia', 'Collo', 'Fronte', 'Labbro', 'Lingua'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personaggi delle fiabe',
    terms: ['Cappuccetto Rosso', 'Cenerentola', 'Biancaneve', 'Raperonzolo', 'Hansel', 'Gretel', 'La Bella Addormentata', 'Il Gatto con gli Stivali', 'Pollicino', 'I Tre Porcellini', 'Il Principe Ranocchio', 'Riccioli d\'Oro', 'La Regina delle Nevi', 'Il Lupo Cattivo', 'La Matrigna', 'Pinocchio', 'Peter Pan', 'Robin Hood', 'Aladino', 'La Sirenetta'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Supereroi',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Capitan America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Lanterna Verde', 'Occhio di Falco', 'Vedova Nera', 'Visione', 'Scarlet Witch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Descrivere emoji',
    terms: ['Faccina che ride', 'Cuore', 'Pollice in su', 'Fuoco', 'Piangere dal ridere', 'Bacio', 'Occhiolino', 'Pensieroso', 'Faccina triste', 'Arrabbiato', 'Festa', 'Fantasma', 'Pagliaccio', 'Robot', 'Scimmia', 'Unicorno', 'Arcobaleno', 'Razzo', 'Corona', 'Diamante'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Giochi da tavolo',
    terms: ['Scacchi', 'Monopoly', 'Risiko', 'Scarabeo', 'Cluedo', 'Gioco dell\'Oca', 'I Coloni di Catan', 'Dama', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Tria', 'Mulino', 'Pictionary', 'Tabu', 'Jenga', 'Stratego', 'Forza Quattro', 'Memory', 'Tombola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Squadre di calcio',
    terms: ['Juventus', 'AC Milan', 'Inter Milano', 'AS Roma', 'SSC Napoli', 'Lazio', 'Fiorentina', 'Atalanta', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Monaco', 'Paris Saint-Germain', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Borussia Dortmund', 'Benfica', 'Atletico Madrid'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Dolci',
    terms: ['Torta al cioccolato', 'Tiramisu', 'Creme brulee', 'Gelato', 'Panna Cotta', 'Strudel di mele', 'Brownie', 'Cheesecake', 'Mousse al cioccolato', 'Waffle', 'Crepe', 'Budino', 'Muffin', 'Macaron', 'Ciambella', 'Baklava', 'Cannoli', 'Profiterole', 'Zuppa inglese', 'Crostata'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Fenomeni meteorologici',
    terms: ['Pioggia', 'Neve', 'Temporale', 'Grandine', 'Nebbia', 'Vento', 'Tempesta', 'Tornado', 'Uragano', 'Sole', 'Arcobaleno', 'Gelo', 'Rugiada', 'Fulmine', 'Tuono', 'Nuvole', 'Caldo', 'Freddo', 'Ghiacciolo', 'Fiocco di neve'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Mezzi di trasporto',
    terms: ['Auto', 'Bicicletta', 'Autobus', 'Treno', 'Aereo', 'Nave', 'Moto', 'Tram', 'Metropolitana', 'Taxi', 'Elicottero', 'Monopattino', 'Barca', 'Barca a vela', 'Canoa', 'Mongolfiera', 'Monociclo', 'Skateboard', 'Carrozza', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitali',
    terms: ['Roma', 'Parigi', 'Londra', 'Madrid', 'Berlino', 'Vienna', 'Berna', 'Washington', 'Tokyo', 'Pechino', 'Mosca', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Il Cairo', 'Atene', 'Varsavia', 'Praga', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Feste e celebrazioni',
    terms: ['Natale', 'Pasqua', 'Capodanno', 'Carnevale', 'San Valentino', 'Halloween', 'Festa della Mamma', 'Festa del Papa', 'Ferragosto', 'Festa della Repubblica', 'Epifania', 'Liberazione', 'Ognissanti', 'Immacolata', 'Festa del Lavoro', 'Santo Stefano', 'Venerdi Santo', 'Domenica delle Palme', 'Festa di San Giovanni', 'Palio di Siena'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Personaggi famosi',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleone', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Galileo Galilei', 'Pablo Picasso', 'Beethoven', 'Dante Alighieri', 'Michelangelo', 'Marco Polo', 'Giuseppe Verdi', 'Sophia Loren'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Verdura',
    terms: ['Pomodoro', 'Cetriolo', 'Carota', 'Broccolo', 'Cavolfiore', 'Peperone', 'Cipolla', 'Aglio', 'Spinaci', 'Zucchina', 'Melanzana', 'Piselli', 'Fagioli', 'Mais', 'Sedano', 'Ravanello', 'Cavolo rapa', 'Zucca', 'Asparago', 'Cavolini di Bruxelles'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insetti e animaletti',
    terms: ['Formica', 'Ape', 'Farfalla', 'Coccinella', 'Ragno', 'Zanzara', 'Mosca', 'Vespa', 'Cavalletta', 'Libellula', 'Scarafaggio', 'Bruco', 'Grillo', 'Bombo', 'Lumaca', 'Lombrico', 'Scarafaggio', 'Forbicina', 'Zecca', 'Pulce'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Monumenti famosi',
    terms: ['Torre Eiffel', 'Colosseo', 'Grande Muraglia Cinese', 'Taj Mahal', 'Statua della Liberta', 'Big Ben', 'Porta di Brandeburgo', 'Piramidi di Giza', 'Acropoli', 'Basilica di San Pietro', 'Burj Khalifa', 'Opera di Sydney', 'Sagrada Familia', 'Tower Bridge', 'Castello di Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Cristo Redentore', 'Golden Gate Bridge', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Stili di ballo',
    terms: ['Valzer', 'Tango', 'Salsa', 'Balletto', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Tarantella', 'Jazz', 'Contemporaneo', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Tipi di formaggio',
    terms: ['Parmigiano Reggiano', 'Mozzarella', 'Gorgonzola', 'Pecorino', 'Mascarpone', 'Ricotta', 'Fontina', 'Taleggio', 'Asiago', 'Provolone', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Cheddar', 'Gruyere', 'Emmental', 'Burrata', 'Stracchino', 'Caciocavallo'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_IT = CATEGORY_NAMES;
