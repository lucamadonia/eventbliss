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
  'Animaux', 'Pays', 'Villes', 'Métiers', 'Sports', 'Films',
  'Séries', 'Marques', 'Fruits', 'Légumes', 'Marques automobiles',
  'Couleurs', 'Instruments de musique', 'Boissons', 'Confiseries',
  'Matières scolaires', 'Langues', 'Fleurs', 'Arbres', 'Épices',
  'Vêtements', 'Meubles', 'Parties du corps', 'Outils',
  'Groupes de musique', 'Personnages de BD', 'Super-héros', 'Personnages Disney',
  'Appareils de cuisine', 'Sports de ballon', 'Sports nautiques',
  'Sports d\'hiver', 'Mammifères', 'Oiseaux', 'Poissons',
  'Insectes', 'Capitales européennes', 'Villes françaises',
  'Garnitures de pizza', 'Cocktails', 'Types de pain', 'Types de fromage',
  'Styles de danse', 'Jeux de cartes', 'Jeux de société', 'Jeux vidéo',
  'Herbes', 'Noix', 'Minéraux', 'Types de tissu',
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
    terms: ['Chien', 'Chat', 'Cheval', 'Vache', 'Cochon', 'Poule', 'Mouton', 'Chèvre', 'Éléphant', 'Lion', 'Tigre', 'Ours', 'Singe', 'Dauphin', 'Aigle', 'Serpent', 'Grenouille', 'Lapin', 'Hérisson', 'Écureuil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Pays',
    terms: ['France', 'Allemagne', 'Italie', 'Espagne', 'Angleterre', 'États-Unis', 'Japon', 'Brésil', 'Australie', 'Canada', 'Mexique', 'Inde', 'Chine', 'Russie', 'Égypte', 'Afrique du Sud', 'Argentine', 'Suède', 'Grèce', 'Portugal'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Villes',
    terms: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Londres', 'New York', 'Tokyo', 'Rome', 'Berlin', 'Bruxelles', 'Montréal', 'Genève', 'Barcelone', 'Istanbul', 'Dubaï', 'Sydney', 'Amsterdam', 'Prague', 'Lisbonne'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Marques automobiles',
    terms: ['Renault', 'Peugeot', 'Citroën', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ferrari', 'Lamborghini', 'Toyota', 'Honda', 'Ford', 'Tesla', 'Volvo', 'Fiat', 'Porsche', 'Hyundai', 'Mazda', 'Jaguar', 'Alpine'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Fruits',
    terms: ['Pomme', 'Banane', 'Orange', 'Fraise', 'Cerise', 'Raisin', 'Pastèque', 'Ananas', 'Mangue', 'Kiwi', 'Poire', 'Pêche', 'Prune', 'Framboise', 'Myrtille', 'Citron', 'Citron vert', 'Noix de coco', 'Grenade', 'Figue'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Métiers',
    terms: ['Médecin', 'Professeur', 'Policier', 'Pompier', 'Cuisinier', 'Pilote', 'Avocat', 'Ingénieur', 'Mécanicien', 'Infirmière', 'Architecte', 'Électricien', 'Boulanger', 'Boucher', 'Jardinier', 'Journaliste', 'Photographe', 'Juge', 'Pharmacien', 'Dentiste'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Films',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Le Seigneur des Anneaux', 'Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'Le Parrain', 'Gladiator', 'Le Monde de Nemo', 'La Reine des Neiges', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Pirates des Caraïbes', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'Séries',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'Lupin', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Dix pour cent', 'The Crown', 'Narcos', 'Emily in Paris', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Marseille'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sports',
    terms: ['Football', 'Tennis', 'Basketball', 'Natation', 'Athlétisme', 'Volleyball', 'Handball', 'Hockey sur glace', 'Golf', 'Boxe', 'Ski', 'Snowboard', 'Surf', 'Escalade', 'Aviron', 'Escrime', 'Judo', 'Gymnastique', 'Équitation', 'Tennis de table'],
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
    terms: ['Pizza', 'Pâtes', 'Hamburger', 'Sushi', 'Boeuf bourguignon', 'Croque-monsieur', 'Ratatouille', 'Lasagne', 'Tacos', 'Curry', 'Frites', 'Kebab', 'Steak', 'Soupe', 'Salade', 'Baguette', 'Croissant', 'Crêpes', 'Quiche Lorraine', 'Coq au vin'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Genres musicaux',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classique', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Chanson française', 'Variété', 'Latin', 'Indie', 'EDM', 'Funk', 'Gospel'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Jeux vidéo',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokémon', 'Tetris', 'Pac-Man', 'Les Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
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
    terms: ['Guitare', 'Piano', 'Batterie', 'Violon', 'Flûte', 'Trompette', 'Saxophone', 'Harpe', 'Violoncelle', 'Clarinette', 'Hautbois', 'Trombone', 'Accordéon', 'Ukulélé', 'Tuba', 'Contrebasse', 'Cornemuse', 'Harmonica', 'Triangle', 'Xylophone'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Vêtements',
    terms: ['T-Shirt', 'Jean', 'Robe', 'Costume', 'Pull', 'Veste', 'Manteau', 'Chaussures', 'Bottes', 'Bonnet', 'Écharpe', 'Gants', 'Jupe', 'Chemisier', 'Chemise', 'Chaussettes', 'Ceinture', 'Cravate', 'Short', 'Maillot de bain'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Meubles',
    terms: ['Table', 'Chaise', 'Canapé', 'Lit', 'Armoire', 'Étagère', 'Commode', 'Bureau', 'Fauteuil', 'Tabouret', 'Vitrine', 'Table de nuit', 'Portemanteau', 'Coffre', 'Banc', 'Buffet', 'Hamac', 'Bibliothèque', 'Table à manger', 'Table basse'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Outils',
    terms: ['Marteau', 'Tournevis', 'Pince', 'Scie', 'Perceuse', 'Clé à molette', 'Niveau', 'Burin', 'Lime', 'Papier de verre', 'Mètre ruban', 'Fer à souder', 'Hache', 'Rabot', 'Gouge', 'Pinceau', 'Spatule', 'Truelle', 'Clé Allen', 'Pince multiprise'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Fleurs',
    terms: ['Rose', 'Tulipe', 'Tournesol', 'Lys', 'Orchidée', 'Marguerite', 'Oeillet', 'Violette', 'Lavande', 'Géranium', 'Dahlia', 'Coquelicot', 'Iris', 'Jonquille', 'Chrysanthème', 'Hibiscus', 'Jasmin', 'Magnolia', 'Crocus', 'Primevère'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Épices',
    terms: ['Sel', 'Poivre', 'Paprika', 'Cannelle', 'Curcuma', 'Origan', 'Basilic', 'Romarin', 'Thym', 'Noix de muscade', 'Gingembre', 'Ail', 'Safran', 'Piment', 'Vanille', 'Coriandre', 'Cumin', 'Anis', 'Aneth', 'Persil'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Boissons',
    terms: ['Eau', 'Café', 'Thé', 'Bière', 'Vin', 'Cola', 'Limonade', 'Jus d\'orange', 'Lait', 'Chocolat chaud', 'Smoothie', 'Cocktail', 'Champagne', 'Whisky', 'Vodka', 'Gin', 'Cidre', 'Thé glacé', 'Espresso', 'Vin chaud'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'Matières scolaires',
    terms: ['Mathématiques', 'Français', 'Anglais', 'Biologie', 'Physique', 'Chimie', 'Histoire', 'Géographie', 'Arts plastiques', 'Musique', 'Éducation physique', 'Informatique', 'Espagnol', 'Éducation civique', 'Philosophie', 'Sciences économiques', 'Latin', 'Allemand', 'Technologie', 'Sciences de la vie'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Langues',
    terms: ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais', 'Russe', 'Chinois', 'Japonais', 'Arabe', 'Turc', 'Coréen', 'Hindi', 'Polonais', 'Néerlandais', 'Suédois', 'Grec', 'Tchèque', 'Hongrois', 'Finnois'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Objets célestes',
    terms: ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune', 'Lune', 'Soleil', 'Pluton', 'Comète', 'Astéroïde', 'Voie lactée', 'Trou noir', 'Nébuleuse', 'Naine rouge', 'Supernova', 'Météorite', 'Galaxie'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Parties du corps',
    terms: ['Tête', 'Main', 'Pied', 'Oeil', 'Nez', 'Bouche', 'Oreille', 'Bras', 'Jambe', 'Doigt', 'Orteil', 'Genou', 'Coude', 'Épaule', 'Dos', 'Ventre', 'Cou', 'Front', 'Lèvre', 'Langue'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Personnages de contes',
    terms: ['Le Petit Chaperon rouge', 'Cendrillon', 'Blanche-Neige', 'Raiponce', 'Hansel', 'Gretel', 'La Belle au bois dormant', 'Le Chat botté', 'Le Petit Poucet', 'Les Trois Petits Cochons', 'Le Prince Grenouille', 'Boucle d\'Or', 'La Reine des Neiges', 'Barbe-Bleue', 'Le Grand Méchant Loup', 'La Belle et la Bête', 'Pinocchio', 'Peter Pan', 'Robin des Bois', 'Aladin'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Super-héros',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Captain America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Green Lantern', 'Hawkeye', 'Black Widow', 'Vision', 'Scarlet Witch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Décrire des emojis',
    terms: ['Visage riant', 'Coeur', 'Pouce en l\'air', 'Feu', 'Pleurer de rire', 'Bisou', 'Clin d\'oeil', 'Pensif', 'Visage triste', 'En colère', 'Fête', 'Fantome', 'Clown', 'Robot', 'Singe', 'Licorne', 'Arc-en-ciel', 'Fusée', 'Couronne', 'Diamant'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Jeux de société',
    terms: ['Échecs', 'Monopoly', 'Risk', 'Scrabble', 'Cluedo', 'Jeu de l\'oie', 'Catane', 'Dames', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Petits chevaux', 'Moulin', 'Pictionary', 'Tabou', 'Jenga', 'Stratego', 'Puissance 4', 'Memory', 'Loup-garou'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Clubs de football',
    terms: ['Paris Saint-Germain', 'Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco', 'LOSC Lille', 'Real Madrid', 'FC Barcelona', 'Manchester United', 'Liverpool', 'Bayern Munich', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Ajax Amsterdam', 'Borussia Dortmund', 'Benfica', 'FC Porto', 'Atlético Madrid'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    terms: ['Gâteau au chocolat', 'Tiramisu', 'Crème brûlée', 'Glace', 'Panna Cotta', 'Tarte Tatin', 'Brownie', 'Cheesecake', 'Mousse au chocolat', 'Gaufres', 'Crêpes', 'Crème caramel', 'Madeleine', 'Macaron', 'Paris-Brest', 'Mille-feuille', 'Profiterole', 'Éclair', 'Tarte aux fraises', 'Opéra'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Phénomènes météorologiques',
    terms: ['Pluie', 'Neige', 'Orage', 'Grêle', 'Brouillard', 'Vent', 'Tempête', 'Tornade', 'Ouragan', 'Soleil', 'Arc-en-ciel', 'Gelée', 'Rosée', 'Éclair', 'Tonnerre', 'Nuages', 'Chaleur', 'Froid', 'Stalactite de glace', 'Flocon de neige'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Moyens de transport',
    terms: ['Voiture', 'Vélo', 'Bus', 'Train', 'Avion', 'Bateau', 'Moto', 'Tramway', 'Métro', 'Taxi', 'Hélicoptère', 'Trottinette', 'Canot', 'Voilier', 'Canoë', 'Montgolfière', 'Monocycle', 'Skateboard', 'Calèche', 'Gondole'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capitales',
    terms: ['Paris', 'Berlin', 'Londres', 'Madrid', 'Rome', 'Vienne', 'Berne', 'Washington', 'Tokyo', 'Pékin', 'Moscou', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Le Caire', 'Athènes', 'Varsovie', 'Prague', 'Budapest'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Fêtes et célébrations',
    terms: ['Noël', 'Pâques', 'Nouvel An', 'Carnaval', 'Saint-Valentin', 'Halloween', 'Fête des Mères', 'Fête des Pères', 'Fête nationale', 'Toussaint', 'Épiphanie', 'Mardi Gras', 'Pentecôte', 'Ascension', 'Fête de la Musique', 'Beaujolais Nouveau', 'Chandeleur', 'Poisson d\'Avril', 'Fête du Travail', 'Armistice'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Personnages célèbres',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Léonard de Vinci', 'Cléopâtre', 'Napoléon', 'Martin Luther King', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Victor Hugo', 'Pablo Picasso', 'Beethoven', 'Molière', 'Édith Piaf', 'Charles de Gaulle', 'Coco Chanel', 'Antoine de Saint-Exupéry'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Légumes',
    terms: ['Tomate', 'Concombre', 'Carotte', 'Brocoli', 'Chou-fleur', 'Poivron', 'Oignon', 'Ail', 'Épinard', 'Courgette', 'Aubergine', 'Petits pois', 'Haricots', 'Maïs', 'Céleri', 'Radis', 'Chou-rave', 'Citrouille', 'Asperge', 'Choux de Bruxelles'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insectes et petites bêtes',
    terms: ['Fourmi', 'Abeille', 'Papillon', 'Coccinelle', 'Araignée', 'Moustique', 'Mouche', 'Guêpe', 'Sauterelle', 'Libellule', 'Scarabée', 'Chenille', 'Grillon', 'Bourdon', 'Escargot', 'Ver de terre', 'Cafard', 'Perce-oreille', 'Tique', 'Puce'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Monuments célèbres',
    terms: ['Tour Eiffel', 'Colisée', 'Grande Muraille de Chine', 'Taj Mahal', 'Statue de la Liberté', 'Big Ben', 'Porte de Brandebourg', 'Pyramides de Gizeh', 'Acropole', 'Basilique Saint-Pierre', 'Burj Khalifa', 'Opéra de Sydney', 'Sagrada Familia', 'Tower Bridge', 'Château de Neuschwanstein', 'Stonehenge', 'Machu Picchu', 'Christ Rédempteur', 'Golden Gate Bridge', 'Alhambra'],
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
    terms: ['Camembert', 'Brie', 'Roquefort', 'Comté', 'Reblochon', 'Mozzarella', 'Parmesan', 'Gouda', 'Feta', 'Gorgonzola', 'Emmental', 'Raclette', 'Chèvre', 'Munster', 'Gruyère', 'Maroilles', 'Beaufort', 'Cantal', 'Saint-Nectaire', 'Pont-l\'Évêque'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_FR = CATEGORY_NAMES;
