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
  'Animals', 'Countries', 'Cities', 'Professions', 'Sports', 'Movies',
  'TV Shows', 'Brands', 'Fruits', 'Vegetables', 'Car Brands',
  'Colors', 'Musical Instruments', 'Beverages', 'Sweets',
  'School Subjects', 'Languages', 'Flowers', 'Trees', 'Spices',
  'Clothing', 'Furniture', 'Body Parts', 'Tools',
  'Music Bands', 'Comic Characters', 'Superheroes', 'Disney Characters',
  'Kitchen Appliances', 'Ball Sports', 'Water Sports',
  'Winter Sports', 'Mammals', 'Birds', 'Fish',
  'Insects', 'European Capitals', 'American Cities',
  'Pizza Toppings', 'Cocktails', 'Bread Types', 'Cheese Types',
  'Dance Styles', 'Card Games', 'Board Games', 'Video Games',
  'Herbs', 'Nuts', 'Minerals', 'Fabrics',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUVW'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const GAME_CATEGORIES_EN: GameCategory[] = [
  {
    id: 'cat-tiere',
    name: 'Animals',
    terms: ['Dog', 'Cat', 'Horse', 'Cow', 'Pig', 'Chicken', 'Sheep', 'Goat', 'Elephant', 'Lion', 'Tiger', 'Bear', 'Monkey', 'Dolphin', 'Eagle', 'Snake', 'Frog', 'Rabbit', 'Hedgehog', 'Squirrel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-laender',
    name: 'Countries',
    terms: ['United States', 'United Kingdom', 'Canada', 'Australia', 'France', 'Germany', 'Japan', 'Brazil', 'Mexico', 'India', 'China', 'Russia', 'Egypt', 'South Africa', 'Argentina', 'Sweden', 'Greece', 'Portugal', 'Italy', 'Spain'],
    difficulty: 'easy',
  },
  {
    id: 'cat-staedte',
    name: 'Cities',
    terms: ['New York', 'Los Angeles', 'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto', 'Chicago', 'San Francisco', 'Miami', 'Rome', 'Barcelona', 'Istanbul', 'Dubai', 'Berlin', 'Amsterdam', 'Bangkok', 'Singapore', 'Hong Kong', 'Las Vegas'],
    difficulty: 'easy',
  },
  {
    id: 'cat-automarken',
    name: 'Car Brands',
    terms: ['Ford', 'Chevrolet', 'Tesla', 'BMW', 'Mercedes', 'Toyota', 'Honda', 'Audi', 'Porsche', 'Ferrari', 'Lamborghini', 'Volkswagen', 'Volvo', 'Jeep', 'Dodge', 'Cadillac', 'Lexus', 'Mazda', 'Subaru', 'Jaguar'],
    difficulty: 'easy',
  },
  {
    id: 'cat-obstsorten',
    name: 'Fruits',
    terms: ['Apple', 'Banana', 'Orange', 'Strawberry', 'Cherry', 'Grape', 'Watermelon', 'Pineapple', 'Mango', 'Kiwi', 'Pear', 'Peach', 'Plum', 'Raspberry', 'Blueberry', 'Lemon', 'Lime', 'Coconut', 'Pomegranate', 'Fig'],
    difficulty: 'easy',
  },
  {
    id: 'cat-berufe',
    name: 'Professions',
    terms: ['Doctor', 'Teacher', 'Police Officer', 'Firefighter', 'Chef', 'Pilot', 'Lawyer', 'Engineer', 'Mechanic', 'Nurse', 'Architect', 'Electrician', 'Baker', 'Butcher', 'Gardener', 'Journalist', 'Photographer', 'Judge', 'Pharmacist', 'Dentist'],
    difficulty: 'easy',
  },
  {
    id: 'cat-filme',
    name: 'Movies',
    terms: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'The Lord of the Rings', 'The Matrix', 'Inception', 'Jurassic Park', 'Forrest Gump', 'The Godfather', 'Gladiator', 'Finding Nemo', 'Frozen', 'Shrek', 'Batman', 'Joker', 'Interstellar', 'Toy Story', 'Pirates of the Caribbean', 'Pulp Fiction'],
    difficulty: 'easy',
  },
  {
    id: 'cat-serien',
    name: 'TV Shows',
    terms: ['Breaking Bad', 'Game of Thrones', 'Friends', 'Stranger Things', 'The Office', 'Money Heist', 'Dark', 'Squid Game', 'The Witcher', 'Peaky Blinders', 'Better Call Saul', 'The Crown', 'Narcos', 'Bridgerton', 'Wednesday', 'The Mandalorian', 'Vikings', 'Sherlock', 'Black Mirror', 'Lupin'],
    difficulty: 'medium',
  },
  {
    id: 'cat-sportarten',
    name: 'Sports',
    terms: ['Soccer', 'Tennis', 'Basketball', 'Swimming', 'Track and Field', 'Volleyball', 'Handball', 'Ice Hockey', 'Golf', 'Boxing', 'Skiing', 'Snowboarding', 'Surfing', 'Rock Climbing', 'Rowing', 'Fencing', 'Judo', 'Gymnastics', 'Horse Riding', 'Table Tennis'],
    difficulty: 'easy',
  },
  {
    id: 'cat-marken',
    name: 'Brands',
    terms: ['Apple', 'Nike', 'Adidas', 'Coca-Cola', 'Google', 'Amazon', 'Samsung', 'IKEA', 'Lego', 'Netflix', 'Spotify', 'McDonalds', 'Starbucks', 'Zara', 'H&M', 'Gucci', 'Prada', 'Disney', 'Red Bull', 'Rolex'],
    difficulty: 'easy',
  },
  {
    id: 'cat-essen',
    name: 'Food',
    terms: ['Pizza', 'Pasta', 'Burger', 'Sushi', 'Fish and Chips', 'Hot Dog', 'Mac and Cheese', 'Lasagna', 'Tacos', 'Curry', 'French Fries', 'Kebab', 'Steak', 'Soup', 'Salad', 'Pretzel', 'Croissant', 'Pancakes', 'Dumplings', 'Roast Beef'],
    difficulty: 'easy',
  },
  {
    id: 'cat-musikgenres',
    name: 'Music Genres',
    terms: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Techno', 'Reggae', 'Blues', 'Metal', 'Country', 'R&B', 'Soul', 'Punk', 'Indie', 'Folk', 'Latin', 'EDM', 'Funk', 'Gospel', 'Alternative'],
    difficulty: 'medium',
  },
  {
    id: 'cat-videospiele',
    name: 'Video Games',
    terms: ['Minecraft', 'Fortnite', 'Mario', 'Zelda', 'FIFA', 'GTA', 'Call of Duty', 'Pokemon', 'Tetris', 'Pac-Man', 'The Sims', 'Overwatch', 'League of Legends', 'Animal Crossing', 'Sonic', 'Roblox', 'Among Us', 'Elden Ring', 'God of War', 'Resident Evil'],
    difficulty: 'easy',
  },
  {
    id: 'cat-farben',
    name: 'Colors',
    terms: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'White', 'Black', 'Brown', 'Gray', 'Turquoise', 'Gold', 'Silver', 'Beige', 'Burgundy', 'Mint', 'Coral', 'Indigo', 'Khaki'],
    difficulty: 'easy',
  },
  {
    id: 'cat-instrumente',
    name: 'Instruments',
    terms: ['Guitar', 'Piano', 'Drums', 'Violin', 'Flute', 'Trumpet', 'Saxophone', 'Harp', 'Cello', 'Clarinet', 'Oboe', 'Trombone', 'Accordion', 'Ukulele', 'Tuba', 'Double Bass', 'Bagpipes', 'Harmonica', 'Triangle', 'Xylophone'],
    difficulty: 'easy',
  },
  {
    id: 'cat-kleidung',
    name: 'Clothing',
    terms: ['T-Shirt', 'Jeans', 'Dress', 'Suit', 'Sweater', 'Jacket', 'Coat', 'Shoes', 'Boots', 'Hat', 'Scarf', 'Gloves', 'Skirt', 'Blouse', 'Shirt', 'Socks', 'Belt', 'Tie', 'Shorts', 'Swimsuit'],
    difficulty: 'easy',
  },
  {
    id: 'cat-moebel',
    name: 'Furniture',
    terms: ['Table', 'Chair', 'Sofa', 'Bed', 'Wardrobe', 'Shelf', 'Dresser', 'Desk', 'Armchair', 'Stool', 'Cabinet', 'Nightstand', 'Coat Rack', 'Chest', 'Bench', 'Sideboard', 'Hammock', 'Bookshelf', 'Dining Table', 'Coffee Table'],
    difficulty: 'easy',
  },
  {
    id: 'cat-werkzeuge',
    name: 'Tools',
    terms: ['Hammer', 'Screwdriver', 'Pliers', 'Saw', 'Drill', 'Wrench', 'Level', 'Chisel', 'File', 'Sandpaper', 'Tape Measure', 'Soldering Iron', 'Axe', 'Plane', 'Gouge', 'Paintbrush', 'Putty Knife', 'Trowel', 'Allen Key', 'Pipe Wrench'],
    difficulty: 'medium',
  },
  {
    id: 'cat-blumen',
    name: 'Flowers',
    terms: ['Rose', 'Tulip', 'Sunflower', 'Lily', 'Orchid', 'Daisy', 'Carnation', 'Violet', 'Lavender', 'Geranium', 'Dahlia', 'Poppy', 'Iris', 'Daffodil', 'Chrysanthemum', 'Hibiscus', 'Jasmine', 'Magnolia', 'Crocus', 'Primrose'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gewuerze',
    name: 'Spices',
    terms: ['Salt', 'Pepper', 'Paprika', 'Cinnamon', 'Turmeric', 'Oregano', 'Basil', 'Rosemary', 'Thyme', 'Nutmeg', 'Ginger', 'Garlic', 'Saffron', 'Chili', 'Vanilla', 'Coriander', 'Cumin', 'Anise', 'Dill', 'Parsley'],
    difficulty: 'medium',
  },
  {
    id: 'cat-getraenke',
    name: 'Beverages',
    terms: ['Water', 'Coffee', 'Tea', 'Beer', 'Wine', 'Cola', 'Lemonade', 'Orange Juice', 'Milk', 'Hot Chocolate', 'Smoothie', 'Cocktail', 'Champagne', 'Whiskey', 'Vodka', 'Gin', 'Apple Juice', 'Iced Tea', 'Espresso', 'Eggnog'],
    difficulty: 'easy',
  },
  {
    id: 'cat-schulfaecher',
    name: 'School Subjects',
    terms: ['Mathematics', 'English', 'Science', 'Biology', 'Physics', 'Chemistry', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Computer Science', 'French', 'Religious Studies', 'Ethics', 'Government', 'Economics', 'Latin', 'Philosophy', 'Spanish'],
    difficulty: 'easy',
  },
  {
    id: 'cat-sprachen',
    name: 'Languages',
    terms: ['English', 'Spanish', 'French', 'Mandarin', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Japanese', 'German', 'Korean', 'Italian', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Greek', 'Czech', 'Hungarian', 'Finnish'],
    difficulty: 'easy',
  },
  {
    id: 'cat-planeten',
    name: 'Celestial Objects',
    terms: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Sun', 'Pluto', 'Comet', 'Asteroid', 'Milky Way', 'Black Hole', 'Nebula', 'Red Dwarf', 'Supernova', 'Meteorite', 'Galaxy'],
    difficulty: 'medium',
  },
  {
    id: 'cat-koerperteile',
    name: 'Body Parts',
    terms: ['Head', 'Hand', 'Foot', 'Eye', 'Nose', 'Mouth', 'Ear', 'Arm', 'Leg', 'Finger', 'Toe', 'Knee', 'Elbow', 'Shoulder', 'Back', 'Belly', 'Neck', 'Forehead', 'Lip', 'Tongue'],
    difficulty: 'easy',
  },
  {
    id: 'cat-maerchenfiguren',
    name: 'Fairy Tale Characters',
    terms: ['Little Red Riding Hood', 'Cinderella', 'Snow White', 'Rapunzel', 'Hansel', 'Gretel', 'Sleeping Beauty', 'Rumpelstiltskin', 'Mother Goose', 'Puss in Boots', 'Jack and the Beanstalk', 'Three Little Pigs', 'Frog Prince', 'Goldilocks', 'Snow Queen', 'Tom Thumb', 'The Big Bad Wolf', 'The Wicked Stepmother', 'Pinocchio', 'Peter Pan'],
    difficulty: 'easy',
  },
  {
    id: 'cat-superhelden',
    name: 'Superheroes',
    terms: ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Thor', 'Hulk', 'Captain America', 'Wonder Woman', 'Aquaman', 'Flash', 'Wolverine', 'Black Panther', 'Deadpool', 'Doctor Strange', 'Ant-Man', 'Green Lantern', 'Hawkeye', 'Black Widow', 'Vision', 'Scarlet Witch'],
    difficulty: 'easy',
  },
  {
    id: 'cat-emojis',
    name: 'Describe Emojis',
    terms: ['Laughing Face', 'Heart', 'Thumbs Up', 'Fire', 'Crying Laughing', 'Kiss', 'Wink', 'Thinking', 'Sad Face', 'Angry', 'Party', 'Ghost', 'Clown', 'Robot', 'Monkey', 'Unicorn', 'Rainbow', 'Rocket', 'Crown', 'Diamond'],
    difficulty: 'medium',
  },
  {
    id: 'cat-brettspiele',
    name: 'Board Games',
    terms: ['Chess', 'Monopoly', 'Risk', 'Scrabble', 'Clue', 'Sorry!', 'Settlers of Catan', 'Checkers', 'Backgammon', 'Trivial Pursuit', 'Uno', 'Chinese Checkers', 'Nine Men\'s Morris', 'Charades', 'Taboo', 'Pictionary', 'Jenga', 'Stratego', 'Connect Four', 'Memory'],
    difficulty: 'easy',
  },
  {
    id: 'cat-fussballvereine',
    name: 'Soccer Clubs',
    terms: ['Manchester United', 'Liverpool', 'Real Madrid', 'FC Barcelona', 'Bayern Munich', 'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter Milan', 'Chelsea', 'Arsenal', 'Manchester City', 'Tottenham', 'Ajax Amsterdam', 'Borussia Dortmund', 'Atletico Madrid', 'Benfica', 'FC Porto', 'LA Galaxy', 'New York Red Bulls'],
    difficulty: 'medium',
  },
  {
    id: 'cat-desserts',
    name: 'Desserts',
    terms: ['Chocolate Cake', 'Tiramisu', 'Creme Brulee', 'Ice Cream', 'Panna Cotta', 'Apple Pie', 'Brownie', 'Cheesecake', 'Chocolate Mousse', 'Waffles', 'Pancakes', 'Pudding', 'Muffin', 'Macaron', 'Donut', 'Baklava', 'Red Velvet Cake', 'Banana Split', 'Strudel', 'Creme Caramel'],
    difficulty: 'easy',
  },
  {
    id: 'cat-wetter',
    name: 'Weather Phenomena',
    terms: ['Rain', 'Snow', 'Thunderstorm', 'Hail', 'Fog', 'Wind', 'Storm', 'Tornado', 'Hurricane', 'Sunshine', 'Rainbow', 'Frost', 'Dew', 'Lightning', 'Thunder', 'Clouds', 'Heat', 'Cold', 'Icicle', 'Snowflake'],
    difficulty: 'easy',
  },
  {
    id: 'cat-transportmittel',
    name: 'Transportation',
    terms: ['Car', 'Bicycle', 'Bus', 'Train', 'Airplane', 'Ship', 'Motorcycle', 'Tram', 'Subway', 'Taxi', 'Helicopter', 'Scooter', 'Boat', 'Sailboat', 'Canoe', 'Hot Air Balloon', 'Unicycle', 'Skateboard', 'Carriage', 'Gondola'],
    difficulty: 'easy',
  },
  {
    id: 'cat-hauptstaedte',
    name: 'Capital Cities',
    terms: ['Washington D.C.', 'London', 'Paris', 'Madrid', 'Rome', 'Berlin', 'Bern', 'Tokyo', 'Beijing', 'Moscow', 'Canberra', 'Ottawa', 'Brasilia', 'Buenos Aires', 'Cairo', 'Athens', 'Warsaw', 'Prague', 'Budapest', 'Vienna'],
    difficulty: 'medium',
  },
  {
    id: 'cat-feiertage',
    name: 'Holidays and Celebrations',
    terms: ['Christmas', 'Easter', 'New Year\'s Eve', 'Mardi Gras', 'Valentine\'s Day', 'Halloween', 'Mother\'s Day', 'Father\'s Day', 'Thanksgiving', 'Independence Day', 'St. Patrick\'s Day', 'Memorial Day', 'Labor Day', 'Martin Luther King Day', 'Veterans Day', 'Presidents Day', 'Hanukkah', 'Kwanzaa', 'Black Friday', 'Super Bowl Sunday'],
    difficulty: 'easy',
  },
  {
    id: 'cat-beruehmt',
    name: 'Famous People',
    terms: ['Albert Einstein', 'Wolfgang Amadeus Mozart', 'Leonardo da Vinci', 'Cleopatra', 'Napoleon', 'Martin Luther King Jr.', 'Marie Curie', 'Mahatma Gandhi', 'Nelson Mandela', 'Frida Kahlo', 'Charles Darwin', 'Nikola Tesla', 'Abraham Lincoln', 'George Washington', 'Pablo Picasso', 'Beethoven', 'Shakespeare', 'Mark Twain', 'Rosa Parks', 'Oprah Winfrey'],
    difficulty: 'medium',
  },
  {
    id: 'cat-gemuese',
    name: 'Vegetables',
    terms: ['Tomato', 'Cucumber', 'Carrot', 'Broccoli', 'Cauliflower', 'Bell Pepper', 'Onion', 'Garlic', 'Spinach', 'Zucchini', 'Eggplant', 'Peas', 'Beans', 'Corn', 'Celery', 'Radish', 'Kohlrabi', 'Pumpkin', 'Asparagus', 'Brussels Sprouts'],
    difficulty: 'easy',
  },
  {
    id: 'cat-insekten',
    name: 'Insects and Creepy Crawlies',
    terms: ['Ant', 'Bee', 'Butterfly', 'Ladybug', 'Spider', 'Mosquito', 'Fly', 'Wasp', 'Grasshopper', 'Dragonfly', 'Beetle', 'Caterpillar', 'Cricket', 'Bumblebee', 'Snail', 'Earthworm', 'Cockroach', 'Earwig', 'Tick', 'Flea'],
    difficulty: 'medium',
  },
  {
    id: 'cat-bauwerke',
    name: 'Famous Landmarks',
    terms: ['Eiffel Tower', 'Colosseum', 'Great Wall of China', 'Taj Mahal', 'Statue of Liberty', 'Big Ben', 'Brandenburg Gate', 'Pyramids of Giza', 'Acropolis', "St. Peter's Basilica", 'Burj Khalifa', 'Sydney Opera House', 'Sagrada Familia', 'Tower Bridge', 'Neuschwanstein Castle', 'Stonehenge', 'Machu Picchu', 'Christ the Redeemer', 'Golden Gate Bridge', 'Alhambra'],
    difficulty: 'medium',
  },
  {
    id: 'cat-tanzstile',
    name: 'Dance Styles',
    terms: ['Waltz', 'Tango', 'Salsa', 'Ballet', 'Hip-Hop', 'Breakdance', 'Flamenco', 'Samba', 'Cha-Cha-Cha', 'Foxtrot', 'Quickstep', 'Rumba', 'Jive', 'Charleston', 'Polka', 'Line Dance', 'Jazz Dance', 'Contemporary', 'Disco', 'Bachata'],
    difficulty: 'medium',
  },
  {
    id: 'cat-kaesesorten',
    name: 'Cheese Types',
    terms: ['Cheddar', 'Mozzarella', 'Parmesan', 'Brie', 'Camembert', 'Gouda', 'Feta', 'Gorgonzola', 'Roquefort', 'Swiss', 'Provolone', 'Cream Cheese', 'Colby', 'Mascarpone', 'Monterey Jack', 'Goat Cheese', 'Manchego', 'Pecorino', 'Havarti', 'American'],
    difficulty: 'hard',
  },
];

export const CATEGORIES_EN = CATEGORY_NAMES;
