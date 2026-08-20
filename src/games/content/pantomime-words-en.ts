/**
 * OHNE WORTE — Begriffe auf Englisch.
 *
 * Das ist eine ANPASSUNG der deutschen Liste, keine Übersetzung. Maßstab bleibt
 * derselbe wie in `pantomime-words-de.ts`: Jeder Begriff muss sich OHNE Ton und
 * OHNE Requisit darstellen lassen. Zusätzlich muss er im englischsprachigen
 * Raum überhaupt bekannt sein — ein perfekt übersetztes Wort nützt nichts, wenn
 * niemand am Tisch es kennt.
 *
 * Zwei Kategorien werden deshalb NICHT übersetzt, sondern neu besetzt:
 *
 * - `sprichwoerter`: Wörtlich übersetzte deutsche Redewendungen ergeben im
 *   Englischen Unsinn („Tomatoes on the eyes"). Hier stehen daher 50 gängige
 *   englische Idiome, die eine darstellbare Szene haben („Spill the beans",
 *   „Cold feet", „Break the ice").
 * - `filme`: Titel in der ortsüblichen Fassung; Titel ohne Bekanntheit im
 *   Zielraum (z. B. „Tatort") sind durch dort geläufige Filme und Serien
 *   ersetzt.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel und müssen über alle
 * Sprachdateien hinweg identisch sein. Übersetzt wird nur `name`.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_EN: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Animals',
    emoji: '🐘',
    words: [
      'Elephant', 'Giraffe', 'Penguin', 'Kangaroo', 'Snake',
      'Eagle', 'Frog', 'Crocodile', 'Monkey', 'Lion',
      'Bee', 'Butterfly', 'Spider', 'Crab', 'Shark',
      'Whale', 'Dolphin', 'Hedgehog', 'Owl', 'Stork',
      'Peacock', 'Sloth', 'Meerkat', 'Camel', 'Rhino',
      'Flamingo', 'Turtle', 'Bat', 'Mole', 'Lobster',
      'Jellyfish', 'Seahorse', 'Raccoon', 'Squirrel', 'Hummingbird',
      'Ostrich', 'Gorilla', 'Wolf', 'Fox', 'Rabbit',
      'Cow', 'Pig', 'Chicken', 'Horse', 'Cat',
      'Dog', 'Duck', 'Goat', 'Sheep', 'Mouse',
    ],
  },
  {
    id: 'berufe',
    name: 'Jobs',
    emoji: '👷',
    words: [
      'Firefighter', 'Chef', 'Dentist', 'Pilot', 'Hairdresser',
      'Police officer', 'Teacher', 'Construction worker', 'Waiter', 'Gardener',
      'Photographer', 'Conductor', 'Clown', 'Astronaut', 'Diver',
      'Baker', 'Butcher', 'Painter', 'Welder', 'Mail carrier',
      'Garbage collector', 'Bus driver', 'Judge', 'Lawyer', 'Surgeon',
      'Nurse', 'Vet', 'Librarian', 'Cashier', 'Bartender',
      'DJ', 'Actor', 'Soccer coach', 'Referee', 'Mountain guide',
      'Beekeeper', 'Shepherd', 'Fisherman', 'Farmer', 'Mechanic',
      'Electrician', 'Plumber', 'Roofer', 'Chimney sweep', 'Secretary',
      'Model', 'Stuntman', 'Magician', 'Auctioneer', 'Janitor',
    ],
  },
  {
    id: 'filme',
    name: 'Movies & Series',
    emoji: '🎬',
    words: [
      'Titanic', 'The Godfather', 'Star Wars', 'Jurassic Park', 'The Lion King',
      'Rocky', 'Terminator', 'The Matrix', 'Pirates of the Caribbean', 'The Lord of the Rings',
      'Harry Potter', 'E.T.', 'Jaws', 'Ghostbusters', 'Back to the Future',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'The Wizard of Oz', 'Mary Poppins', 'Frozen',
      'Finding Nemo', 'Shrek', 'Ice Age', 'Toy Story', 'The Jungle Book',
      'Aladdin', 'Beauty and the Beast', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'The Simpsons', 'Game of Thrones', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Baywatch', 'The Office', 'Top Gun', 'Squid Game',
      'Money Heist', 'Gravity', 'The Martian', 'Avatar', 'The Exorcist',
    ],
  },
  {
    id: 'alltag',
    name: 'Everyday Life',
    emoji: '🪥',
    words: [
      'Brushing teeth', 'Making coffee', 'Hanging up laundry', 'Vacuuming', 'Cleaning windows',
      'Tying shoelaces', 'Opening an umbrella', 'Washing the car', 'Mowing the lawn', 'Taking out the trash',
      'Making the bed', 'Washing the dishes', 'Ironing', 'Blow-drying hair', 'Cutting nails',
      'Buttering bread', 'Cracking an egg', 'Draining pasta', 'Ordering pizza', 'Pushing a shopping cart',
      'Waiting in line', 'Missing the bus', 'Patching a bike tube', 'Changing a tire', 'Assembling a shelf',
      'Hammering a nail', 'Changing a light bulb', 'Unpacking a parcel', 'Wrapping a gift', 'Posting a letter',
      'Looking for keys', 'Charging the phone', 'Taking a selfie', 'Channel surfing', 'Turning off the alarm clock',
      'Oversleeping', 'Packing a suitcase', 'Pitching a tent', 'Barbecuing', 'Building a snowman',
      'Watering the flowers', 'Walking the dog', 'Changing a diaper', 'Flossing', 'Sneezing',
      'Yawning', 'Hiccups', 'Chewing gum', 'Waiting for the elevator', 'Getting lost',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Soccer', 'Basketball', 'Tennis', 'Golf', 'Boxing',
      'Swimming', 'Diving', 'Skiing', 'Snowboarding', 'Ice skating',
      'Gymnastics', 'High jump', 'Long jump', 'Pole vault', 'Javelin throw',
      'Shot put', 'Hurdles', 'Marathon', 'Cycling', 'Rowing',
      'Sailing', 'Surfing', 'Climbing', 'Mountaineering', 'Horse riding',
      'Archery', 'Fencing', 'Judo', 'Karate', 'Wrestling',
      'Weightlifting', 'Table tennis', 'Badminton', 'Volleyball', 'Handball',
      'Hockey', 'Ice hockey', 'Rugby', 'Baseball', 'Cricket',
      'Bowling', 'Darts', 'Billiards', 'Skateboarding', 'Roller skating',
      'Trampolining', 'Yoga', 'Jump rope', 'Fishing', 'Formula 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Emotions',
    emoji: '😤',
    words: [
      'Anger', 'Joy', 'Fear', 'Sadness', 'Disgust',
      'Surprise', 'Boredom', 'Nervousness', 'Pride', 'Shame',
      'Jealousy', 'Envy', 'Being in love', 'Homesickness', 'Tiredness',
      'Exhaustion', 'Panic', 'Relief', 'Disappointment', 'Embarrassment',
      'Gloating', 'Longing', 'Contentment', 'Impatience', 'Suspicion',
      'Curiosity', 'Excitement', 'Frustration', 'Shock', 'Awe',
      'Gratitude', 'Hope', 'Despair', 'Calmness', 'Thrill',
      'Defiance', 'Pity', 'Admiration', 'Confusion', 'Skepticism',
      'Annoyance', 'Shyness', 'Courage', 'Cowardice', 'Regret',
      'Triumph', 'Loneliness', 'Feeling safe', 'Wanderlust', 'Anticipation',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Sayings',
    emoji: '💬',
    words: [
      'Break the ice', 'Spill the beans', 'Piece of cake', 'Cold feet', 'Hit the nail on the head',
      'Bite the bullet', 'Under the weather', 'Butterflies in the stomach', 'Head in the clouds', 'Bury your head in the sand',
      'Throw in the towel', 'Kill two birds with one stone', 'Let the cat out of the bag', 'Raining cats and dogs', 'Pulling your leg',
      'Elephant in the room', 'Barking up the wrong tree', 'Cry over spilled milk', 'Break a leg', 'Cost an arm and a leg',
      'Sweep it under the rug', 'Hold your horses', 'Chip on your shoulder', 'Cat got your tongue', 'Blow off steam',
      'Sit on the fence', 'Twist my arm', 'Face the music', 'Jump on the bandwagon', 'Add fuel to the fire',
      'Give the cold shoulder', 'Turn a blind eye', 'Go the extra mile', 'Tighten your belt', 'Roll up your sleeves',
      'Put your foot in your mouth', 'Walking on eggshells', 'All ears', 'See eye to eye', 'Keep your fingers crossed',
      'Zip your lips', 'Wrapped around your finger', 'Hit the sack', 'Burn the midnight oil', 'Break the bank',
      'Pull the plug', 'Beat around the bush', 'On thin ice', 'Rock the boat', 'Bend over backwards',
    ],
  },
  {
    id: 'maerchen',
    name: 'Fairy Tales & Characters',
    emoji: '🧚',
    words: [
      'Little Red Riding Hood', 'Snow White', 'Cinderella', 'Sleeping Beauty', 'Rapunzel',
      'Hansel and Gretel', 'The Frog Prince', 'Rumpelstiltskin', 'The Three Little Pigs', 'Puss in Boots',
      'Pinocchio', 'Peter Pan', 'Alice in Wonderland', 'Robin Hood', 'King Arthur',
      'Hercules', 'Zeus', 'Poseidon', 'Medusa', 'Icarus',
      'Frankenstein', 'Dracula', 'Santa Claus', 'The Easter Bunny', 'The Tooth Fairy',
      'A unicorn', 'A dragon', 'A dwarf', 'A giant', 'A witch',
      'A wizard', 'A knight', 'A pirate', 'A mermaid', 'A vampire',
      'A werewolf', 'A zombie', 'A ghost', 'A robot', 'An alien',
      'Superman', 'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'The Grinch', 'Sinbad', 'Ali Baba',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptease', 'French kiss', 'Blind date', 'Condom', 'Lingerie',
      'Pole dance', 'Belly dance', 'Lap dance', 'Handcuffs', 'Kama Sutra',
      'Bachelor party', 'Tinder date', 'Pickup line', 'Getting rejected', 'Flirting',
      'Hickey', 'Love letter', 'Racing heartbeat', 'Seduction', 'Covering your eyes',
      'Massage', 'Bubble bath', 'Rose petals', 'Candlelight', 'Wedding night',
      'Honeymoon', 'Pregnancy test', 'Couple argument', 'Jealous scene', 'Breakup',
      'The ex', 'Cheating', 'Embarrassing photo', 'Confession', 'Lie detector',
      'Vodka shot', 'Hangover', 'Drunk dancing', 'Karaoke at three in the morning', 'Beer belly',
      'Skinny dipping', 'Nudist beach', 'Sauna', 'Getting a tattoo', 'Piercing',
      'Showing a six-pack', 'Flexing muscles', 'Admiring yourself in the mirror', 'Sneaking home at night', 'Splitting the bill',
    ],
  },
];
