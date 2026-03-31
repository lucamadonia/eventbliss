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
  'Animaux', 'Pays', 'Villes', 'Metiers', 'Sports', 'Films',
  'Series', 'Marques', 'Fruits', 'Legumes', 'Marques automobiles',
  'Couleurs', 'Instruments de musique', 'Boissons', 'Confiseries',
  'Matieres scolaires', 'Langues', 'Fleurs', 'Arbres', 'Epices',
  'Vetements', 'Meubles', 'Parties du corps', 'Outils',
  'Groupes de musique', 'Personnages de BD', 'Super-heros', 'Personnages Disney',
  'Appareils de cuisine', 'Sports de ballon', 'Sports nautiques',
  'Sports d\'hiver', 'Mammiferes', 'Oiseaux', 'Poissons',
  'Insectes', 'Capitales europeennes', 'Villes francaises',
  'Garnitures de pizza', 'Cocktails', 'Types de pain', 'Types de fromage',
  'Styles de danse', 'Jeux de cartes', 'Jeux de societe', 'Jeux video',
  'Herbes', 'Noix', 'Mineraux', 'Types de tissu',
];

const LETTERS = 'ABCDEFGHILMNOPRSTUVZ'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_FR: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Animaux',
    terms: ['Chien', 'Chat', 'Cheval', 'Vache', 'Cochon', 'Poule', 'Mouton', 'Chevre', 'Elephant', 'Lion', 'Tigre', 'Ours', 'Singe', 'Dauphin', 'Aigle', 'Serpent', 'Grenouille', 'Lapin', 'Herisson', 'Ecureuil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Pays',
    terms: ['France', 'Allemagne', 'Italie', 'Espagne', 'Angleterre', 'Etats-Unis', 'Japon', 'Bresil', 'Australie', 'Canada', 'Mexique', 'Inde', 'Chine', 'Russie', 'Egypte', 'Afrique du Sud', 'Argentine', 'Suede', 'Grece', 'Portugal'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Villes',
    terms: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Londres', 'New York', 'Tokyo', 'Rome', 'Berlin', 'Bruxelles', 'Montreal', 'Geneve', 'Barcelone', 'Istanbul', 'Dubai', 'Sydney', 'Amsterdam', 'Prague', 'Lisbonne'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marques automobiles',
    terms: ['Renault', 'Peugeot', 'Citroen', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Porsche', 'Hyundai', 'Mazda', 'Jaguar', 'Alpine'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Fruits',
    terms: ['Pomme', 'Banane', 'Orange', 'Fraise', 'Cerise', 'Raisin', 'Pasteque', 'Ananas', 'Mangue', 'Kiwi', 'Poire', 'Peche', 'Prune', 'Framboise', 'Myrtille', 'Citron', 'Citron vert', 'Noix de coco', 'Grenade', 'Figue'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Metiers',
    terms: ['Medecin', 'Professeur', 'Policier', 'Pompier', 'Cuisinier', 'Pilote', 'Avocat', 'Ingenieur', 'Mecanicien', 'Infirmiere', 'Architecte', 'Electricien', 'Boulanger', 'Boucher', 'Jardinier', 'Journaliste', 'Photographe', 'Juge', 'Pharmacien', 'Dentiste'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Films',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Le Seigneur des Anneaux', 'Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'Le Parrain', 'Gladiator', 'Le Monde de Nemo', 'La Reine des Neiges', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Pirates des Caraibes', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Series',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'Lupin', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Dix pour cent', 'The Crown', 'Narcos', 'Emily in Paris', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Marseille'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sports',
    terms: ['Football', 'Tennis', 'Basketball', 'Natation', 'Athletisme', 'Volleyball', 'Handball', 'Hockey sur glace', 'Golf', 'Boxe', 'Ski', 'Snowboard', 'Surf', 'Escalade', 'Aviron', 'Escrime', 'Judo', 'Gymnastique', 'Equitation', 'Tennis de table'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Marques',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Louis Vuitton', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Cuisine',
    terms: ['Pizza', 'Pates', 'Hamburger', 'Sushi', 'Boeuf bourguignon', 'Croque-monsieur', 'Ratatouille', 'Lasagne', 'Tacos', 'Curry', 'Frites', 'Kebab', 'Steak', 'Soupe', 'Salade', 'Baguette', 'Croissant', 'Crepes', 'Quiche Lorraine', 'Coq au vin'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Genres musicaux',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classique', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Chanson francaise', 'Variete', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Jeux video',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'Les Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Couleurs',
    terms: ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 'Rose', 'Blanc', 'Noir', 'Marron', 'Gris', 'Turquoise', 'Or', 'Argent', 'Beige', 'Bordeaux', 'Menthe', 'Corail', 'Indigo', 'Kaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instruments',
    terms: ['Guitare', 'Piano', 'Batterie', 'Violon', 'Flute', 'Trompette', 'Saxophone', 'Harpe', 'Violoncelle', 'Clarinette', 'Hautbois', 'Trombone', 'Accordeon', 'Ukulele', 'Tuba', 'Contrebasse', 'Cornemuse', 'Harmonica', 'Triangle', 'Xylophone'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Vetements',
    terms: ['T-Shirt', 'Jean', 'Robe', 'Costume', 'Pull', 'Veste', 'Manteau', 'Chaussures', 'Bottes', 'Bonnet', 'Echarpe', 'Gants', 'Jupe', 'Chemisier', 'Chemise', 'Chaussettes', 'Ceinture', 'Cravate', 'Short', 'Maillot de bain'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Meubles',
    terms: ['Table', 'Chaise', 'Canape', 'Lit', 'Armoire', 'Etagere', 'Commode', 'Bureau', 'Fauteuil', 'Tabouret', 'Vitrine', 'Table de nuit', 'Portemanteau', 'Coffre', 'Banc', 'Buffet', 'Hamac', 'Bibliotheque', 'Table a manger', 'Table basse'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Outils',
    terms: ['Marteau', 'Tournevis', 'Pince', 'Scie', 'Perceuse', 'Cle a molette', 'Niveau', 'Burin', 'Lime', 'Papier de verre', 'Metre ruban', 'Fer a souder', 'Hache', 'Rabot', 'Gouge', 'Pinceau', 'Spatule', 'Truelle', 'Cle Allen', 'Pince multiprise'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Fleurs',
    terms: ['Rose', 'Tulipe', 'Tournesol', 'Lys', 'Orchidee', 'Marguerite', 'Oeillet', 'Violette', 'Lavande', 'Geranium', 'Dahlia', 'Coquelicot', 'Iris', 'Jonquille', 'Chrysantheme', 'Hibiscus', 'Jasmin', 'Magnolia', 'Crocus', 'Primevere'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Epices',
    terms: ['Sel', 'Poivre', 'Paprika', 'Cannelle', 'Curcuma', 'Origan', 'Basilic', 'Romarin', 'Thym', 'Noix de muscade', 'Gingembre', 'Ail', 'Safran', 'Piment', 'Vanille', 'Coriandre', 'Cumin', 'Anis', 'Aneth', 'Persil'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Boissons',
    terms: ['Eau', 'Cafe', 'The', 'Biere', 'Vin', 'Cola', 'Limonade', 'Jus d\'orange', 'Lait', 'Chocolat chaud', 'Smoothie', 'Cocktail', 'Champagne', 'Whisky', 'Vodka', 'Gin', 'Cidre', 'The glace', 'Espresso', 'Vin chaud'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Matieres scolaires',
    terms: ['Mathematiques', 'Francais', 'Anglais', 'Biologie', 'Physique', 'Chimie', 'Histoire', 'Geographie', 'Arts plastiques', 'Musique', 'Education physique', 'Informatique', 'Espagnol', 'Education civique', 'Philosophie', 'Sciences economiques', 'Latin', 'Allemand', 'Technologie', 'Sciences de la vie'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Langues',
    terms: ['Francais', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais', 'Russe', 'Chinois', 'Japonais', 'Arabe', 'Turc', 'Coreen', 'Hindi', 'Polonais', 'Neerlandais', 'Suedois', 'Grec', 'Tcheque', 'Hongrois', 'Finnois'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objets celestes',
    terms: ['Mercure', 'Venus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Lune', 'Soleil', 'Pluton', 'Comete', 'Asteroide', 'Voie lactee', 'Trou noir', 'Nebuleuse', 'Naine rouge', 'Supernova', 'Meteorite', 'Galaxie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Parties du corps',
    terms: ['Tete', 'Main', 'Pied', 'Oeil', 'Nez', 'Bouche', 'Oreille', 'Bras', 'Jambe', 'Doigt', 'Orteil', 'Genou', 'Coude', 'Epaule', 'Dos', 'Ventre', 'Cou', 'Front', 'Levre', 'Langue'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personnages de contes',
    terms: ['Le Petit Chaperon rouge', 'Cendrillon', 'Blanche-Neige', 'Raiponce', 'Hansel', 'Gretel', 'La Belle au bois dormant', 'Le Chat botte', 'Le Petit Poucet', 'Les Trois Petits Cochons', 'Le Prince Grenouille', 'Boucle d\'Or', 'La Reine des Neiges', 'Barbe-Bleue', 'Le Grand Mechant Loup', 'La Belle et la Bete', 'Pinocchio', 'Peter Pan', 'Robin des Bois', 'Aladin'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Super-heros',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Captain America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Green Lantern', 'Hawkeye', 'Black Widow', 'Vision', 'Scarlet Witch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Decrire des emojis',
    terms: ['Visage riant', 'Coeur', 'Pouce en l\'air', 'Feu', 'Pleurer de rire', 'Bisou', 'Clin d\'oeil', 'Pensif', 'Visage triste', 'En colere', 'Fete', 'Fantome', 'Clown', 'Robot', 'Singe', 'Licorne', 'Arc-en-ciel', 'Fusee', 'Couronne', 'Diamant'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Jeux de societe',
    terms: ['Echecs', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Jeu de l\'oie', 'Catane', 'Dames', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Petits chevaux', 'Moulin', 'Pictionary', 'Tabou', 'Jenga', 'Stratego', 'Puissance 4', 'Memory', 'Loup-garou'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubs de football',
    terms: ['Paris Saint-Germain', 'Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco', 'LOSC Lille', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Munich', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Borussia Dortmund', 'Benfica', 'FC Porto', 'Atletico Madrid'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    terms: ['Gateau au chocolat', 'Tiramisu', 'Creme brulee', 'Glace', 'Panna Cotta', 'Tarte Tatin', 'Brownie', 'Cheesecake', 'Mousse au chocolat', 'Gaufres', 'Crepes', 'Creme caramel', 'Madeleine', 'Macaron', 'Paris-Brest', 'Mille-feuille', 'Profiterole', 'Eclair', 'Tarte aux fraises', 'Opera'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Phenomenes meteorologiques',
    terms: ['Pluie', 'Neige', 'Orage', 'Grele', 'Brouillard', 'Vent', 'Tempete', 'Tornade', 'Ouragan', 'Soleil', 'Arc-en-ciel', 'Gelee', 'Rosee', 'Eclair', 'Tonnerre', 'Nuages', 'Chaleur', 'Froid', 'Stalactite de glace', 'Flocon de neige'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Moyens de transport',
    terms: ['Voiture', 'Velo', 'Bus', 'Train', 'Avion', 'Bateau', 'Moto', 'Tramway', 'Metro', 'Taxi', 'Helicoptere', 'Trottinette', 'Canot', 'Voilier', 'Canoe', 'Montgolfiere', 'Monocycle', 'Skateboard', 'Caleche', 'Gondole'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitales',
    terms: ['Paris', 'Berlin', 'Londres', 'Madrid', 'Rome', 'Vienne', 'Berne', 'Washington', 'Tokyo', 'Pekin', 'Moscou', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Le Caire', 'Athenes', 'Varsovie', 'Prague', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Fetes et celebrations',
    terms: ['Noel', 'Paques', 'Nouvel An', 'Carnaval', 'Saint-Valentin', 'Halloween', 'Fete des Meres', 'Fete des Peres', 'Fete nationale', 'Toussaint', 'Epiphanie', 'Mardi Gras', 'Pentecote', 'Ascension', 'Fete de la Musique', 'Beaujolais Nouveau', 'Chandeleur', 'Poisson d\'Avril', 'Fete du Travail', 'Armistice'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Personnages celebres',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonard de Vinci', 'Cleopatre', 'Napoleon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Victor Hugo', 'Pablo Picasso', 'Beethoven', 'Moliere', 'Edith Piaf', 'Charles de Gaulle', 'Coco Chanel', 'Antoine de Saint-Exupery'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Legumes',
    terms: ['Tomate', 'Concombre', 'Carotte', 'Brocoli', 'Chou-fleur', 'Poivron', 'Oignon', 'Ail', 'Epinard', 'Courgette', 'Aubergine', 'Petits pois', 'Haricots', 'Mais', 'Celeri', 'Radis', 'Chou-rave', 'Citrouille', 'Asperge', 'Choux de Bruxelles'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insectes et petites betes',
    terms: ['Fourmi', 'Abeille', 'Papillon', 'Coccinelle', 'Araignee', 'Moustique', 'Mouche', 'Guepe', 'Sauterelle', 'Libellule', 'Scarabee', 'Chenille', 'Grillon', 'Bourdon', 'Escargot', 'Ver de terre', 'Cafard', 'Perce-oreille', 'Tique', 'Puce'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Monuments celebres',
    terms: ['Tour Eiffel', 'Colisee', 'Grande Muraille de Chine', 'Taj Mahal', 'Statue de la Liberte', 'Big Ben', 'Porte de Brandebourg', 'Pyramides de Gizeh', 'Acropole', 'Basilique Saint-Pierre', 'Burj Khalifa', 'Opera de Sydney', 'Sagrada Familia', 'Tower Bridge', 'Chateau de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Christ Redempteur', 'Golden Gate Bridge', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Styles de danse',
    terms: ['Valse', 'Tango', 'Salsa', 'Ballet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Danse folklorique', 'Jazz', 'Contemporain', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Types de fromage',
    terms: ['Camembert', 'Brie', 'Roquefort', 'Comte', 'Reblochon', 'Mozzarella', 'Parmesan', 'Gouda', 'Feta', 'Gorgonzola', 'Emmental', 'Raclette', 'Chevre', 'Munster', 'Gruyere', 'Maroilles', 'Beaufort', 'Cantal', 'Saint-Nectaire', 'Pont-l\'Eveque'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_FR = CATEGORY_NAMES;
