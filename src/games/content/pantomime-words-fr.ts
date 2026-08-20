/**
 * OHNE WORTE — Begriffe auf Französisch.
 *
 * Das ist eine ANPASSUNG der deutschen Liste, keine Übersetzung. Maßstab bleibt
 * derselbe wie in `pantomime-words-de.ts`: Jeder Begriff muss sich OHNE Ton und
 * OHNE Requisit darstellen lassen — und im französischsprachigen Raum bekannt
 * sein. Ein sauber übersetztes Wort nützt nichts, wenn es am Tisch niemand
 * kennt.
 *
 * Zwei Kategorien werden deshalb NICHT übersetzt, sondern neu besetzt:
 *
 * - `sprichwoerter`: Wörtlich übersetzte deutsche Redewendungen ergeben im
 *   Französischen Unsinn. Hier stehen 50 gängige französische Ausdrücke mit
 *   einer darstellbaren Szene („Avoir le cafard", „Poser un lapin",
 *   „Tomber dans les pommes").
 * - `filme`: Titel in der ortsüblichen Fassung („Le Roi Lion"); Titel ohne
 *   Bekanntheit im Zielraum (z. B. „Tatort") sind durch dort geläufige Filme
 *   und Serien ersetzt.
 *
 * Bewusst ohne Apostroph formuliert (also „Les Visiteurs" statt
 * „Le Magicien d'Oz"), damit die Strings ohne Escaping auskommen.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel und müssen über alle
 * Sprachdateien hinweg identisch sein. Übersetzt wird nur `name`.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_FR: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Animaux',
    emoji: '🐘',
    words: [
      'Éléphant', 'Girafe', 'Pingouin', 'Kangourou', 'Serpent',
      'Aigle', 'Grenouille', 'Crocodile', 'Singe', 'Lion',
      'Abeille', 'Papillon', 'Araignée', 'Crabe', 'Requin',
      'Baleine', 'Dauphin', 'Hérisson', 'Chouette', 'Cigogne',
      'Paon', 'Paresseux', 'Suricate', 'Chameau', 'Rhinocéros',
      'Flamant rose', 'Tortue', 'Chauve-souris', 'Taupe', 'Homard',
      'Pieuvre', 'Hippocampe', 'Raton laveur', 'Écureuil', 'Colibri',
      'Autruche', 'Gorille', 'Loup', 'Renard', 'Lapin',
      'Vache', 'Cochon', 'Poule', 'Cheval', 'Chat',
      'Chien', 'Canard', 'Chèvre', 'Mouton', 'Souris',
    ],
  },
  {
    id: 'berufe',
    name: 'Métiers',
    emoji: '👷',
    words: [
      'Pompier', 'Cuisinier', 'Dentiste', 'Pilote', 'Coiffeur',
      'Policier', 'Professeur', 'Maçon', 'Serveur', 'Jardinier',
      'Photographe', 'Violoniste', 'Clown', 'Astronaute', 'Plongeur',
      'Boulanger', 'Boucher', 'Peintre', 'Soudeur', 'Facteur',
      'Éboueur', 'Chauffeur de bus', 'Juge', 'Avocat', 'Chirurgien',
      'Infirmier', 'Vétérinaire', 'Bibliothécaire', 'Caissière', 'Barman',
      'DJ', 'Acteur', 'Entraîneur de foot', 'Arbitre', 'Guide de montagne',
      'Apiculteur', 'Berger', 'Pêcheur', 'Agriculteur', 'Mécanicien',
      'Électricien', 'Plombier', 'Couvreur', 'Ramoneur', 'Secrétaire',
      'Mannequin', 'Cascadeur', 'Magicien', 'Fleuriste', 'Concierge',
    ],
  },
  {
    id: 'filme',
    name: 'Films et séries',
    emoji: '🎬',
    words: [
      'Titanic', 'Le Parrain', 'Star Wars', 'Jurassic Park', 'Le Roi Lion',
      'Rocky', 'Terminator', 'Matrix', 'Pirates des Caraïbes', 'Le Seigneur des Anneaux',
      'Harry Potter', 'E.T.', 'Les Dents de la mer', 'SOS Fantômes', 'Retour vers le futur',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'Les Visiteurs', 'Mary Poppins', 'La Reine des Neiges',
      'Le Monde de Nemo', 'Shrek', 'Les Minions', 'Toy Story', 'Le Livre de la Jungle',
      'Aladdin', 'La Belle et la Bête', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Les Simpson', 'Game of Thrones', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Alerte à Malibu', 'Amélie Poulain', 'La Casa de Papel', 'Gravity',
      'Seul sur Mars', 'Avatar', 'Intouchables', 'Astérix et Obélix', 'Bienvenue chez les Chtis',
    ],
  },
  {
    id: 'alltag',
    name: 'Vie quotidienne',
    emoji: '🪥',
    words: [
      'Se brosser les dents', 'Faire du café', 'Étendre le linge', 'Passer le balai', 'Nettoyer les vitres',
      'Lacer ses chaussures', 'Ouvrir un parapluie', 'Laver la voiture', 'Tondre la pelouse', 'Sortir les poubelles',
      'Faire le lit', 'Faire la vaisselle', 'Repasser', 'Se sécher les cheveux', 'Se couper les ongles',
      'Beurrer une tartine', 'Casser un oeuf', 'Égoutter les pâtes', 'Commander une pizza', 'Pousser un caddie',
      'Faire la queue', 'Rater le bus', 'Réparer un pneu de vélo', 'Changer une roue', 'Monter une étagère',
      'Planter un clou', 'Changer une ampoule', 'Ouvrir un colis', 'Emballer un cadeau', 'Poster une lettre',
      'Chercher ses clés', 'Recharger son téléphone', 'Faire un selfie', 'Zapper à la télé', 'Éteindre le réveil',
      'Se réveiller en retard', 'Faire sa valise', 'Monter une tente', 'Faire un barbecue', 'Faire un bonhomme de neige',
      'Arroser les plantes', 'Promener le chien', 'Changer une couche', 'Utiliser du fil dentaire', 'Éternuer',
      'Bâiller', 'Avoir le hoquet', 'Mâcher un chewing-gum', 'Prendre les escaliers', 'Se perdre en chemin',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Football', 'Basket', 'Tennis', 'Golf', 'Boxe',
      'Natation', 'Plongée', 'Ski', 'Snowboard', 'Patinage sur glace',
      'Gymnastique', 'Saut en hauteur', 'Saut en longueur', 'Saut à la perche', 'Lancer du javelot',
      'Lancer du poids', 'Course de haies', 'Marathon', 'Cyclisme', 'Aviron',
      'Voile', 'Surf', 'Escalade', 'Alpinisme', 'Équitation',
      'Pétanque', 'Escrime', 'Judo', 'Karaté', 'Lutte',
      'Haltérophilie', 'Tennis de table', 'Badminton', 'Volley', 'Handball',
      'Hockey', 'Hockey sur glace', 'Rugby', 'Baseball', 'Cricket',
      'Bowling', 'Fléchettes', 'Billard', 'Skateboard', 'Roller',
      'Trampoline', 'Yoga', 'Corde à sauter', 'Pêche', 'Formule 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Émotions',
    emoji: '😤',
    words: [
      'Colère', 'Joie', 'Peur', 'Tristesse', 'Dégoût',
      'Surprise', 'Ennui', 'Nervosité', 'Fierté', 'Honte',
      'Jalousie', 'Convoitise', 'Amour', 'Mal du pays', 'Fatigue',
      'Épuisement', 'Panique', 'Soulagement', 'Déception', 'Gêne',
      'Moquerie', 'Nostalgie', 'Satisfaction', 'Impatience', 'Méfiance',
      'Curiosité', 'Enthousiasme', 'Frustration', 'Choc', 'Émerveillement',
      'Gratitude', 'Espoir', 'Désespoir', 'Sérénité', 'Excitation',
      'Entêtement', 'Pitié', 'Admiration', 'Confusion', 'Scepticisme',
      'Agacement', 'Timidité', 'Courage', 'Lâcheté', 'Regret',
      'Triomphe', 'Solitude', 'Réconfort', 'Envie de voyager', 'Hâte',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Expressions',
    emoji: '💬',
    words: [
      'Avoir le cafard', 'Poser un lapin', 'Tomber dans les pommes', 'Avoir un chat dans la gorge', 'Donner sa langue au chat',
      'Avoir la tête dans les nuages', 'Mettre les pieds dans le plat', 'Casser les pieds', 'Se serrer la ceinture', 'Prendre ses jambes à son cou',
      'Avoir les yeux plus gros que le ventre', 'Mettre son grain de sel', 'Couper la poire en deux', 'Tourner autour du pot', 'Jeter un froid',
      'Avoir le bras long', 'Se creuser la tête', 'Broyer du noir', 'Prendre la mouche', 'Faire la sourde oreille',
      'Passer un savon', 'Mettre la main à la pâte', 'Dormir comme un loir', 'Manger sur le pouce', 'Avoir un poil dans la main',
      'Faire la grasse matinée', 'Chercher midi à quatorze heures', 'Le doigt dans le nez', 'Ne pas y aller de main morte', 'Rire aux éclats',
      'Pleurer comme une madeleine', 'Rouge comme une tomate', 'Avoir la chair de poule', 'Croiser les doigts', 'Tomber de haut',
      'Sauter au plafond', 'Faire le pied de grue', 'Perdre le fil', 'Mettre les bouchées doubles', 'Avoir une faim de loup',
      'Se lever du pied gauche', 'Faire des pieds et des mains', 'Tirer son chapeau', 'Prendre le taureau par les cornes', 'Faire la tête',
      'Mener par le bout du nez', 'Marcher sur des oeufs', 'Avoir la main verte', 'Retourner sa veste', 'Peigner la girafe',
    ],
  },
  {
    id: 'maerchen',
    name: 'Contes et personnages',
    emoji: '🧚',
    words: [
      'Le Petit Chaperon rouge', 'Blanche-Neige', 'Cendrillon', 'La Belle au bois dormant', 'Raiponce',
      'Hansel et Gretel', 'Le Roi Grenouille', 'Les Trois Petits Cochons', 'Le Chat botté', 'Le Petit Poucet',
      'Pinocchio', 'Peter Pan', 'Alice au pays des merveilles', 'Robin des Bois', 'Le Roi Arthur',
      'Hercule', 'Zeus', 'Poséidon', 'Méduse', 'Icare',
      'Frankenstein', 'Dracula', 'Le Père Noël', 'Le Lapin de Pâques', 'La Petite Souris',
      'Une licorne', 'Un dragon', 'Un nain', 'Un géant', 'Une sorcière',
      'Un sorcier', 'Un chevalier', 'Un pirate', 'Une sirène', 'Un vampire',
      'Un loup-garou', 'Un zombie', 'Un fantôme', 'Un robot', 'Un extraterrestre',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'Le Grinch', 'Sindbad', 'Ali Baba',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptease', 'Baiser langoureux', 'Rendez-vous arrangé', 'Préservatif', 'Lingerie',
      'Pole dance', 'Danse du ventre', 'Lap dance', 'Menottes', 'Kamasutra',
      'Enterrement de vie de garçon', 'Rencard Tinder', 'Drague lourde', 'Se prendre un râteau', 'Draguer',
      'Suçon', 'Lettre enflammée', 'Coeur qui bat la chamade', 'Séduction', 'Cacher les yeux',
      'Massage', 'Bain moussant', 'Pétales de rose', 'Dîner aux chandelles', 'Nuit de noces',
      'Lune de miel', 'Test de grossesse', 'Dispute de couple', 'Scène de jalousie', 'Rupture',
      'Son ex', 'Infidélité', 'Photo compromettante', 'Confession', 'Détecteur de mensonges',
      'Shot de vodka', 'Gueule de bois', 'Danser ivre', 'Karaoké à trois heures du matin', 'Bedaine de bière',
      'Baignade nue', 'Plage naturiste', 'Sauna', 'Se faire tatouer', 'Piercing',
      'Montrer ses abdos', 'Gonfler les muscles', 'Se mirer dans la glace', 'Rentrer en douce la nuit', 'Partager la note',
    ],
  },
];
