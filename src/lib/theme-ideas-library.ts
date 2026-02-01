// Comprehensive Theme Ideas Library
// 50+ party themes and mottos for all event types

export type ThemeCategory = 
  | 'retro'
  | 'elegant'
  | 'casual'
  | 'adventure'
  | 'cultural'
  | 'seasonal'
  | 'costume'
  | 'relaxation';

export type EventType = 'bachelor' | 'bachelorette' | 'wedding' | 'birthday' | 'family' | 'team' | 'trip' | 'other';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemeItem {
  id: string;
  nameKey: string;
  descriptionKey: string;
  tipsKey: string;
  emoji: string;
  category: ThemeCategory;
  eventTypes: EventType[];
  colorPalette: ColorPalette;
  suggestedActivities: string[];
  decorationTips: string[];
  dressCode?: string;
  musicStyle?: string;
  tags: string[];
}

export const themeIdeas: ThemeItem[] = [
  // RETRO THEMES
  {
    id: '80s_retro',
    nameKey: 'gamesLibrary.themes.80s_retro.name',
    descriptionKey: 'gamesLibrary.themes.80s_retro.description',
    tipsKey: 'gamesLibrary.themes.80s_retro.tips',
    emoji: '🕺',
    category: 'retro',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FF00FF', secondary: '#00FFFF', accent: '#FFFF00' },
    suggestedActivities: ['karaoke_battle', 'dance_off', 'lip_sync_battle'],
    decorationTips: ['Neonlichter', 'Diskokugel', 'Cassetten-Deko', 'Polaroid-Ecke'],
    dressCode: 'Neonfarben, Schulterpolster, Stirnbänder, Leg Warmers',
    musicStyle: 'Synthie-Pop, Disco, New Wave',
    tags: ['party', 'nostalgia', 'colorful']
  },
  {
    id: '90s_throwback',
    nameKey: 'gamesLibrary.themes.90s_throwback.name',
    descriptionKey: 'gamesLibrary.themes.90s_throwback.description',
    tipsKey: 'gamesLibrary.themes.90s_throwback.tips',
    emoji: '📼',
    category: 'retro',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#9B59B6', secondary: '#3498DB', accent: '#2ECC71' },
    suggestedActivities: ['karaoke_battle', 'dance_off', 'trivia'],
    decorationTips: ['VHS-Kassetten', 'Boy-Band-Poster', 'Scrunchies', 'Lava-Lampen'],
    dressCode: 'Baggy Jeans, Plateauschuhe, Bandshirts',
    musicStyle: 'Grunge, Pop, Hip-Hop, Eurodance',
    tags: ['party', 'nostalgia', 'fun']
  },
  {
    id: 'disco_fever',
    nameKey: 'gamesLibrary.themes.disco_fever.name',
    descriptionKey: 'gamesLibrary.themes.disco_fever.description',
    tipsKey: 'gamesLibrary.themes.disco_fever.tips',
    emoji: '🪩',
    category: 'retro',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FFD700', secondary: '#C0C0C0', accent: '#FF69B4' },
    suggestedActivities: ['dance_off', 'limbo_competition', 'karaoke_battle'],
    decorationTips: ['Diskokugeln', 'Glitzer überall', 'Lichttanzboden', 'Afro-Perücken'],
    dressCode: 'Schlaghosen, Plateauschuhe, Glitzer, Jumpsuits',
    musicStyle: 'Disco, Funk, Soul',
    tags: ['dance', 'glamour', 'sparkle']
  },
  {
    id: 'gatsby_20s',
    nameKey: 'gamesLibrary.themes.gatsby_20s.name',
    descriptionKey: 'gamesLibrary.themes.gatsby_20s.description',
    tipsKey: 'gamesLibrary.themes.gatsby_20s.tips',
    emoji: '🎩',
    category: 'elegant',
    eventTypes: ['wedding', 'birthday', 'bachelorette'],
    colorPalette: { primary: '#C9A227', secondary: '#1C1C1C', accent: '#FFFFFF' },
    suggestedActivities: ['casino_night', 'murder_mystery', 'cocktail_contest'],
    decorationTips: ['Art-Deco-Muster', 'Federboas', 'Champagner-Türme', 'Jazz-Band'],
    dressCode: 'Fransen-Kleider, Anzüge, Perlenketten, Stirnbänder',
    musicStyle: 'Jazz, Swing, Charleston',
    tags: ['elegant', 'glamour', 'roaring']
  },

  // ELEGANT THEMES
  {
    id: 'casino_royale',
    nameKey: 'gamesLibrary.themes.casino_royale.name',
    descriptionKey: 'gamesLibrary.themes.casino_royale.description',
    tipsKey: 'gamesLibrary.themes.casino_royale.tips',
    emoji: '🎰',
    category: 'elegant',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#B22222', secondary: '#000000', accent: '#FFD700' },
    suggestedActivities: ['casino_night', 'cocktail_contest', 'murder_mystery'],
    decorationTips: ['Spieltische', 'Poker-Chips', 'Karten-Deko', 'Roter Teppich'],
    dressCode: 'Black Tie, Abendkleider, James-Bond-Style',
    musicStyle: 'Jazz, Lounge, Film-Soundtracks',
    tags: ['glamour', 'games', 'sophisticated']
  },
  {
    id: 'white_party',
    nameKey: 'gamesLibrary.themes.white_party.name',
    descriptionKey: 'gamesLibrary.themes.white_party.description',
    tipsKey: 'gamesLibrary.themes.white_party.tips',
    emoji: '⚪',
    category: 'elegant',
    eventTypes: ['wedding', 'bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FFFFFF', secondary: '#F5F5F5', accent: '#C0C0C0' },
    suggestedActivities: ['photo_booth', 'dance_off', 'cocktail_contest'],
    decorationTips: ['Weiße Blumen', 'Lichter', 'Minimalistische Deko', 'Weiße Möbel'],
    dressCode: 'Komplett weiß',
    musicStyle: 'House, Lounge, Chill',
    tags: ['chic', 'summer', 'clean']
  },
  {
    id: 'black_tie',
    nameKey: 'gamesLibrary.themes.black_tie.name',
    descriptionKey: 'gamesLibrary.themes.black_tie.description',
    tipsKey: 'gamesLibrary.themes.black_tie.tips',
    emoji: '🖤',
    category: 'elegant',
    eventTypes: ['wedding', 'birthday'],
    colorPalette: { primary: '#000000', secondary: '#FFFFFF', accent: '#C0C0C0' },
    suggestedActivities: ['casino_night', 'wine_tasting', 'talent_show'],
    decorationTips: ['Kristall-Kronleuchter', 'Kerzen', 'Elegante Tischdecken'],
    dressCode: 'Smoking und Abendkleid',
    musicStyle: 'Jazz, Klassik, Ballroom',
    tags: ['formal', 'elegant', 'classy']
  },
  {
    id: 'hollywood_glam',
    nameKey: 'gamesLibrary.themes.hollywood_glam.name',
    descriptionKey: 'gamesLibrary.themes.hollywood_glam.description',
    tipsKey: 'gamesLibrary.themes.hollywood_glam.tips',
    emoji: '⭐',
    category: 'elegant',
    eventTypes: ['wedding', 'birthday', 'bachelorette'],
    colorPalette: { primary: '#FFD700', secondary: '#000000', accent: '#FF0000' },
    suggestedActivities: ['photo_booth', 'lip_sync_battle', 'talent_show'],
    decorationTips: ['Walk of Fame Sterne', 'Roter Teppich', 'Paparazzi-Ecke', 'Oscar-Statuen'],
    dressCode: 'Glamouröse Abendgarderobe, Sonnenbrille',
    musicStyle: 'Film-Soundtracks, Pop, Jazz',
    tags: ['celebrity', 'glamour', 'star']
  },
  {
    id: 'masquerade_ball',
    nameKey: 'gamesLibrary.themes.masquerade_ball.name',
    descriptionKey: 'gamesLibrary.themes.masquerade_ball.description',
    tipsKey: 'gamesLibrary.themes.masquerade_ball.tips',
    emoji: '🎭',
    category: 'elegant',
    eventTypes: ['wedding', 'bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#800020', secondary: '#FFD700', accent: '#000000' },
    suggestedActivities: ['murder_mystery', 'dance_off', 'casino_night'],
    decorationTips: ['Venezianische Masken', 'Kerzen', 'Samt-Deko', 'Federn'],
    dressCode: 'Formelle Kleidung mit Masken',
    musicStyle: 'Klassik, Walzer, Mysterious',
    tags: ['mysterious', 'elegant', 'romantic']
  },

  // CASUAL/FUN THEMES
  {
    id: 'tropical_beach',
    nameKey: 'gamesLibrary.themes.tropical_beach.name',
    descriptionKey: 'gamesLibrary.themes.tropical_beach.description',
    tipsKey: 'gamesLibrary.themes.tropical_beach.tips',
    emoji: '🌴',
    category: 'casual',
    eventTypes: ['bachelor', 'bachelorette', 'birthday', 'wedding', 'trip'],
    colorPalette: { primary: '#00CED1', secondary: '#FF6347', accent: '#32CD32' },
    suggestedActivities: ['limbo_competition', 'cocktail_contest', 'water_balloon'],
    decorationTips: ['Palmen', 'Lei-Ketten', 'Tiki-Fackeln', 'Flamingos', 'Kokosnüsse'],
    dressCode: 'Hawaii-Hemden, Blumenkränze, Flip-Flops',
    musicStyle: 'Reggae, Tropical House, Beach Vibes',
    tags: ['summer', 'relaxed', 'colorful']
  },
  {
    id: 'oktoberfest',
    nameKey: 'gamesLibrary.themes.oktoberfest.name',
    descriptionKey: 'gamesLibrary.themes.oktoberfest.description',
    tipsKey: 'gamesLibrary.themes.oktoberfest.tips',
    emoji: '🥨',
    category: 'cultural',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#0066CC', secondary: '#FFFFFF', accent: '#F4A460' },
    suggestedActivities: ['beer_pong', 'flunkyball', 'team_olympiad'],
    decorationTips: ['Blau-weiße Rauten', 'Maßkrüge', 'Brezeln', 'Holzbänke'],
    dressCode: 'Dirndl und Lederhosen',
    musicStyle: 'Volksmusik, Schlager, Blasmusik',
    tags: ['bavarian', 'beer', 'traditional']
  },
  {
    id: 'mexican_fiesta',
    nameKey: 'gamesLibrary.themes.mexican_fiesta.name',
    descriptionKey: 'gamesLibrary.themes.mexican_fiesta.description',
    tipsKey: 'gamesLibrary.themes.mexican_fiesta.tips',
    emoji: '🌮',
    category: 'cultural',
    eventTypes: ['birthday', 'bachelor', 'bachelorette'],
    colorPalette: { primary: '#FF4500', secondary: '#FFD700', accent: '#228B22' },
    suggestedActivities: ['pinata', 'limbo_competition', 'cocktail_contest'],
    decorationTips: ['Sombreros', 'Piñatas', 'Papel Picado', 'Kakteen', 'Bunte Wimpel'],
    dressCode: 'Bunte Kleidung, Sombreros, Ponchos',
    musicStyle: 'Mariachi, Latin Pop, Salsa',
    tags: ['colorful', 'festive', 'spicy']
  },
  {
    id: 'festival_style',
    nameKey: 'gamesLibrary.themes.festival_style.name',
    descriptionKey: 'gamesLibrary.themes.festival_style.description',
    tipsKey: 'gamesLibrary.themes.festival_style.tips',
    emoji: '🎪',
    category: 'casual',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#FFE66D' },
    suggestedActivities: ['dance_off', 'photo_booth', 'tshirt_design'],
    decorationTips: ['Festival-Armbänder', 'Boho-Deko', 'Lichter', 'Zelte', 'Flower Crowns'],
    dressCode: 'Festival-Style, Boho, Glitzer',
    musicStyle: 'Indie, Electronic, Pop',
    tags: ['boho', 'outdoor', 'music']
  },
  {
    id: 'bbq_grill',
    nameKey: 'gamesLibrary.themes.bbq_grill.name',
    descriptionKey: 'gamesLibrary.themes.bbq_grill.description',
    tipsKey: 'gamesLibrary.themes.bbq_grill.tips',
    emoji: '🍖',
    category: 'casual',
    eventTypes: ['family', 'birthday', 'team'],
    colorPalette: { primary: '#8B4513', secondary: '#228B22', accent: '#FF4500' },
    suggestedActivities: ['kubb', 'boccia', 'team_olympiad', 'frisbee'],
    decorationTips: ['Karierte Tischdecken', 'Mason Jars', 'Lichterketten', 'Holz-Elemente'],
    dressCode: 'Casual, Sommersachen',
    musicStyle: 'Country, Rock, Pop',
    tags: ['outdoor', 'food', 'relaxed']
  },
  {
    id: 'garden_party',
    nameKey: 'gamesLibrary.themes.garden_party.name',
    descriptionKey: 'gamesLibrary.themes.garden_party.description',
    tipsKey: 'gamesLibrary.themes.garden_party.tips',
    emoji: '🌸',
    category: 'casual',
    eventTypes: ['wedding', 'birthday', 'family', 'bachelorette'],
    colorPalette: { primary: '#FFB6C1', secondary: '#90EE90', accent: '#FFFFFF' },
    suggestedActivities: ['boccia', 'scavenger_hunt', 'croquet'],
    decorationTips: ['Blumen überall', 'Vintage-Möbel', 'Pastellfarben', 'Pavillons'],
    dressCode: 'Sommerkleider, Pastellfarben, Strohhüte',
    musicStyle: 'Acoustic, Jazz, Indie',
    tags: ['romantic', 'spring', 'elegant']
  },
  {
    id: 'game_night',
    nameKey: 'gamesLibrary.themes.game_night.name',
    descriptionKey: 'gamesLibrary.themes.game_night.description',
    tipsKey: 'gamesLibrary.themes.game_night.tips',
    emoji: '🎮',
    category: 'casual',
    eventTypes: ['bachelor', 'bachelorette', 'birthday', 'family', 'team'],
    colorPalette: { primary: '#4169E1', secondary: '#32CD32', accent: '#FF4500' },
    suggestedActivities: ['activity', 'taboo', 'pictionary', 'cards_against'],
    decorationTips: ['Spielbrett-Deko', 'Würfel', 'Controller', 'Arcade-Lichter'],
    dressCode: 'Casual, Gaming-Shirts',
    musicStyle: 'Videospiel-Soundtracks, Electronic',
    tags: ['fun', 'competitive', 'indoor']
  },
  {
    id: 'cocktail_party',
    nameKey: 'gamesLibrary.themes.cocktail_party.name',
    descriptionKey: 'gamesLibrary.themes.cocktail_party.description',
    tipsKey: 'gamesLibrary.themes.cocktail_party.tips',
    emoji: '🍸',
    category: 'elegant',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FF6B6B', secondary: '#FFFFFF', accent: '#FFD700' },
    suggestedActivities: ['cocktail_contest', 'never_have_i_ever', 'two_truths_lie'],
    decorationTips: ['Bar-Setup', 'Cocktail-Gläser', 'Zitronen/Limetten', 'Elegante Beleuchtung'],
    dressCode: 'Cocktail-Kleidung, schick',
    musicStyle: 'Lounge, Jazz, Deep House',
    tags: ['sophisticated', 'drinks', 'social']
  },
  {
    id: 'wine_cheese',
    nameKey: 'gamesLibrary.themes.wine_cheese.name',
    descriptionKey: 'gamesLibrary.themes.wine_cheese.description',
    tipsKey: 'gamesLibrary.themes.wine_cheese.tips',
    emoji: '🧀',
    category: 'elegant',
    eventTypes: ['birthday', 'bachelorette', 'team'],
    colorPalette: { primary: '#722F37', secondary: '#F5DEB3', accent: '#2F4F4F' },
    suggestedActivities: ['wine_tasting', 'two_truths_lie', 'trivia'],
    decorationTips: ['Weinflaschen', 'Käseplatten', 'Trauben', 'Holzbrettchen'],
    dressCode: 'Smart Casual',
    musicStyle: 'Klassik, Jazz, French Cafe',
    tags: ['sophisticated', 'tasting', 'relaxed']
  },

  // ADVENTURE THEMES
  {
    id: 'spa_day',
    nameKey: 'gamesLibrary.themes.spa_day.name',
    descriptionKey: 'gamesLibrary.themes.spa_day.description',
    tipsKey: 'gamesLibrary.themes.spa_day.tips',
    emoji: '💆',
    category: 'relaxation',
    eventTypes: ['bachelorette', 'birthday'],
    colorPalette: { primary: '#E6E6FA', secondary: '#FFFFFF', accent: '#98FB98' },
    suggestedActivities: ['yoga', 'meditation', 'beauty_treatments'],
    decorationTips: ['Kerzen', 'Orchideen', 'Bambus', 'Weiche Textilien', 'Entspannungsmusik'],
    dressCode: 'Bademantel, bequeme Kleidung',
    musicStyle: 'Spa, Ambient, Nature Sounds',
    tags: ['relaxation', 'wellness', 'pampering']
  },
  {
    id: 'adventure_theme',
    nameKey: 'gamesLibrary.themes.adventure_theme.name',
    descriptionKey: 'gamesLibrary.themes.adventure_theme.description',
    tipsKey: 'gamesLibrary.themes.adventure_theme.tips',
    emoji: '🧗',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'team', 'trip'],
    colorPalette: { primary: '#228B22', secondary: '#8B4513', accent: '#4169E1' },
    suggestedActivities: ['boot_camp', 'team_olympiad', 'scavenger_hunt'],
    decorationTips: ['Outdoor-Equipment', 'Karten', 'Kompasse', 'Abenteuer-Deko'],
    dressCode: 'Outdoor-Kleidung, praktisch',
    musicStyle: 'Epic, Indie, Adventure Soundtracks',
    tags: ['active', 'outdoor', 'challenge']
  },
  {
    id: 'camping',
    nameKey: 'gamesLibrary.themes.camping.name',
    descriptionKey: 'gamesLibrary.themes.camping.description',
    tipsKey: 'gamesLibrary.themes.camping.tips',
    emoji: '⛺',
    category: 'adventure',
    eventTypes: ['family', 'bachelor', 'bachelorette', 'trip'],
    colorPalette: { primary: '#228B22', secondary: '#8B4513', accent: '#FF4500' },
    suggestedActivities: ['campfire_stories', 'scavenger_hunt', 'stargazing'],
    decorationTips: ['Zelte', 'Lagerfeuer', 'Laternen', 'Naturmaterialien'],
    dressCode: 'Outdoor-Kleidung, praktisch',
    musicStyle: 'Folk, Acoustic, Campfire Songs',
    tags: ['nature', 'outdoor', 'bonding']
  },
  {
    id: 'road_trip',
    nameKey: 'gamesLibrary.themes.road_trip.name',
    descriptionKey: 'gamesLibrary.themes.road_trip.description',
    tipsKey: 'gamesLibrary.themes.road_trip.tips',
    emoji: '🚗',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'trip'],
    colorPalette: { primary: '#4169E1', secondary: '#FF6347', accent: '#FFD700' },
    suggestedActivities: ['photo_scavenger_hunt', 'trivia', 'singalong'],
    decorationTips: ['Vintage-Koffer', 'Straßenkarten', 'Route-66-Schilder', 'Automodelle'],
    dressCode: 'Casual, bequem',
    musicStyle: 'Rock, Pop, Road Trip Classics',
    tags: ['freedom', 'journey', 'adventure']
  },
  {
    id: 'city_break',
    nameKey: 'gamesLibrary.themes.city_break.name',
    descriptionKey: 'gamesLibrary.themes.city_break.description',
    tipsKey: 'gamesLibrary.themes.city_break.tips',
    emoji: '🏙️',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'trip'],
    colorPalette: { primary: '#333333', secondary: '#FFFFFF', accent: '#FF4500' },
    suggestedActivities: ['city_rally', 'photo_scavenger_hunt', 'bingo_tasks'],
    decorationTips: ['Stadtplan-Deko', 'Skyline-Poster', 'Wahrzeichen-Modelle'],
    dressCode: 'Smart Casual, stadtfein',
    musicStyle: 'Urban, Pop, Hip-Hop',
    tags: ['urban', 'exploration', 'culture']
  },
  {
    id: 'beach_house',
    nameKey: 'gamesLibrary.themes.beach_house.name',
    descriptionKey: 'gamesLibrary.themes.beach_house.description',
    tipsKey: 'gamesLibrary.themes.beach_house.tips',
    emoji: '🏖️',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'trip'],
    colorPalette: { primary: '#00CED1', secondary: '#FFFFFF', accent: '#F4A460' },
    suggestedActivities: ['water_balloon', 'frisbee', 'cocktail_contest'],
    decorationTips: ['Muscheln', 'Treibholz', 'Maritim-Deko', 'Hängematten'],
    dressCode: 'Strandkleidung',
    musicStyle: 'Tropical, Chill, Beach Vibes',
    tags: ['beach', 'relaxed', 'summer']
  },
  {
    id: 'ski_lodge',
    nameKey: 'gamesLibrary.themes.ski_lodge.name',
    descriptionKey: 'gamesLibrary.themes.ski_lodge.description',
    tipsKey: 'gamesLibrary.themes.ski_lodge.tips',
    emoji: '⛷️',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'trip', 'family'],
    colorPalette: { primary: '#FFFFFF', secondary: '#8B0000', accent: '#228B22' },
    suggestedActivities: ['trivia', 'campfire_stories', 'game_night'],
    decorationTips: ['Tannen', 'Kerzen', 'Holz-Elemente', 'Felle', 'Kamine'],
    dressCode: 'Après-Ski, kuschelig',
    musicStyle: 'Alpine, Chill, Après-Ski',
    tags: ['winter', 'cozy', 'mountains']
  },
  {
    id: 'lake_house',
    nameKey: 'gamesLibrary.themes.lake_house.name',
    descriptionKey: 'gamesLibrary.themes.lake_house.description',
    tipsKey: 'gamesLibrary.themes.lake_house.tips',
    emoji: '🏡',
    category: 'adventure',
    eventTypes: ['family', 'bachelor', 'bachelorette'],
    colorPalette: { primary: '#4682B4', secondary: '#228B22', accent: '#F4A460' },
    suggestedActivities: ['frisbee', 'boccia', 'campfire_stories'],
    decorationTips: ['Naturmaterialien', 'Laternen', 'Kajaks', 'Fischernetze'],
    dressCode: 'Casual, Outdoor',
    musicStyle: 'Acoustic, Folk, Chill',
    tags: ['nature', 'relaxed', 'outdoor']
  },
  {
    id: 'cabin_woods',
    nameKey: 'gamesLibrary.themes.cabin_woods.name',
    descriptionKey: 'gamesLibrary.themes.cabin_woods.description',
    tipsKey: 'gamesLibrary.themes.cabin_woods.tips',
    emoji: '🌲',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'family'],
    colorPalette: { primary: '#228B22', secondary: '#8B4513', accent: '#FFD700' },
    suggestedActivities: ['campfire_stories', 'murder_mystery', 'scavenger_hunt'],
    decorationTips: ['Holz', 'Kamine', 'Laternen', 'Wildtier-Deko', 'Karos'],
    dressCode: 'Outdoor, warm',
    musicStyle: 'Folk, Acoustic, Campfire',
    tags: ['cozy', 'nature', 'rustic']
  },

  // COSTUME THEMES
  {
    id: 'superhero',
    nameKey: 'gamesLibrary.themes.superhero.name',
    descriptionKey: 'gamesLibrary.themes.superhero.description',
    tipsKey: 'gamesLibrary.themes.superhero.tips',
    emoji: '🦸',
    category: 'costume',
    eventTypes: ['birthday', 'family'],
    colorPalette: { primary: '#FF0000', secondary: '#0000FF', accent: '#FFD700' },
    suggestedActivities: ['team_olympiad', 'scavenger_hunt', 'photo_booth'],
    decorationTips: ['Comic-Poster', 'Capes', 'Masken', 'Superhelden-Logos'],
    dressCode: 'Superhelden-Kostüme',
    musicStyle: 'Film-Soundtracks, Epic',
    tags: ['fun', 'costume', 'kids']
  },
  {
    id: 'pirates',
    nameKey: 'gamesLibrary.themes.pirates.name',
    descriptionKey: 'gamesLibrary.themes.pirates.description',
    tipsKey: 'gamesLibrary.themes.pirates.tips',
    emoji: '🏴‍☠️',
    category: 'costume',
    eventTypes: ['bachelor', 'birthday', 'family'],
    colorPalette: { primary: '#000000', secondary: '#8B0000', accent: '#FFD700' },
    suggestedActivities: ['treasure_hunt', 'scavenger_hunt', 'limbo_competition'],
    decorationTips: ['Totenschädel', 'Schatzkisten', 'Piratenflaggen', 'Seile', 'Fässer'],
    dressCode: 'Piraten-Kostüme',
    musicStyle: 'Piraten-Shanties, Film-Soundtracks',
    tags: ['adventure', 'costume', 'treasure']
  },
  {
    id: 'murder_mystery_theme',
    nameKey: 'gamesLibrary.themes.murder_mystery_theme.name',
    descriptionKey: 'gamesLibrary.themes.murder_mystery_theme.description',
    tipsKey: 'gamesLibrary.themes.murder_mystery_theme.tips',
    emoji: '🔍',
    category: 'costume',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#800000', secondary: '#000000', accent: '#FFD700' },
    suggestedActivities: ['murder_mystery', 'escape_room_diy', 'wine_tasting'],
    decorationTips: ['Kerzen', 'Alte Bücher', 'Magnolien', 'Vintage-Requisiten'],
    dressCode: 'Historische Kostüme je nach Szenario',
    musicStyle: 'Mystery, Jazz, Vintage',
    tags: ['mystery', 'roleplay', 'immersive']
  },
  {
    id: 'neon_glow',
    nameKey: 'gamesLibrary.themes.neon_glow.name',
    descriptionKey: 'gamesLibrary.themes.neon_glow.description',
    tipsKey: 'gamesLibrary.themes.neon_glow.tips',
    emoji: '💡',
    category: 'costume',
    eventTypes: ['bachelor', 'bachelorette', 'birthday'],
    colorPalette: { primary: '#FF00FF', secondary: '#00FF00', accent: '#00FFFF' },
    suggestedActivities: ['dance_off', 'limbo_competition', 'photo_booth'],
    decorationTips: ['UV-Lichter', 'Neon-Farben', 'Schwarzlicht', 'Leuchtarmbänder'],
    dressCode: 'Weiß und Neonfarben',
    musicStyle: 'EDM, Dance, House',
    tags: ['party', 'glow', 'dance']
  },

  // CULTURAL THEMES
  {
    id: 'french_riviera',
    nameKey: 'gamesLibrary.themes.french_riviera.name',
    descriptionKey: 'gamesLibrary.themes.french_riviera.description',
    tipsKey: 'gamesLibrary.themes.french_riviera.tips',
    emoji: '🇫🇷',
    category: 'cultural',
    eventTypes: ['bachelorette', 'wedding', 'birthday'],
    colorPalette: { primary: '#0055A4', secondary: '#FFFFFF', accent: '#EF4135' },
    suggestedActivities: ['wine_tasting', 'boccia', 'cocktail_contest'],
    decorationTips: ['Lavendel', 'Baguettes', 'Französische Flaggen', 'Café-Stühle'],
    dressCode: 'Chic, gestreift, Baskenmützen',
    musicStyle: 'Chanson, Jazz, Café',
    tags: ['elegant', 'romantic', 'french']
  },
  {
    id: 'italian_dolce_vita',
    nameKey: 'gamesLibrary.themes.italian_dolce_vita.name',
    descriptionKey: 'gamesLibrary.themes.italian_dolce_vita.description',
    tipsKey: 'gamesLibrary.themes.italian_dolce_vita.tips',
    emoji: '🇮🇹',
    category: 'cultural',
    eventTypes: ['bachelor', 'bachelorette', 'wedding'],
    colorPalette: { primary: '#009246', secondary: '#FFFFFF', accent: '#CE2B37' },
    suggestedActivities: ['cooking_together', 'wine_tasting', 'boccia'],
    decorationTips: ['Vespa-Deko', 'Olivenzweige', 'Chianti-Flaschen', 'Sonnenblumen'],
    dressCode: 'Elegant casual, italienisch chic',
    musicStyle: 'Italian Pop, Opera, Amore',
    tags: ['romantic', 'food', 'italian']
  },
  {
    id: 'greek_island',
    nameKey: 'gamesLibrary.themes.greek_island.name',
    descriptionKey: 'gamesLibrary.themes.greek_island.description',
    tipsKey: 'gamesLibrary.themes.greek_island.tips',
    emoji: '🇬🇷',
    category: 'cultural',
    eventTypes: ['bachelor', 'bachelorette', 'wedding'],
    colorPalette: { primary: '#0D5EAF', secondary: '#FFFFFF', accent: '#F5DEB3' },
    suggestedActivities: ['dance_off', 'cocktail_contest', 'photo_booth'],
    decorationTips: ['Weiß-blaue Deko', 'Olivenzweige', 'Amphoren', 'Griechische Säulen'],
    dressCode: 'Weiß, fließende Stoffe',
    musicStyle: 'Greek Pop, Bouzouki, Mediterranean',
    tags: ['mediterranean', 'romantic', 'blue']
  },
  {
    id: 'spanish_flamenco',
    nameKey: 'gamesLibrary.themes.spanish_flamenco.name',
    descriptionKey: 'gamesLibrary.themes.spanish_flamenco.description',
    tipsKey: 'gamesLibrary.themes.spanish_flamenco.tips',
    emoji: '💃',
    category: 'cultural',
    eventTypes: ['bachelorette', 'birthday'],
    colorPalette: { primary: '#FF0000', secondary: '#000000', accent: '#FFD700' },
    suggestedActivities: ['dance_off', 'cocktail_contest', 'talent_show'],
    decorationTips: ['Fächer', 'Rote Rosen', 'Polka Dots', 'Flamenco-Kleider'],
    dressCode: 'Rot und schwarz, Rüschen',
    musicStyle: 'Flamenco, Spanish Pop, Latin',
    tags: ['passionate', 'dance', 'spanish']
  },
  {
    id: 'irish_pub',
    nameKey: 'gamesLibrary.themes.irish_pub.name',
    descriptionKey: 'gamesLibrary.themes.irish_pub.description',
    tipsKey: 'gamesLibrary.themes.irish_pub.tips',
    emoji: '☘️',
    category: 'cultural',
    eventTypes: ['bachelor', 'birthday'],
    colorPalette: { primary: '#009A44', secondary: '#FFFFFF', accent: '#FF8C00' },
    suggestedActivities: ['trivia', 'karaoke_battle', 'beer_pong'],
    decorationTips: ['Kleeblätter', 'Guinness-Deko', 'Irische Flaggen', 'Holzfässer'],
    dressCode: 'Grün, Leprechaun-Hüte',
    musicStyle: 'Irish Folk, Celtic, Pub Songs',
    tags: ['pub', 'fun', 'irish']
  },
  {
    id: 'british_royal',
    nameKey: 'gamesLibrary.themes.british_royal.name',
    descriptionKey: 'gamesLibrary.themes.british_royal.description',
    tipsKey: 'gamesLibrary.themes.british_royal.tips',
    emoji: '👑',
    category: 'cultural',
    eventTypes: ['wedding', 'birthday', 'bachelorette'],
    colorPalette: { primary: '#012169', secondary: '#FFFFFF', accent: '#CF142B' },
    suggestedActivities: ['trivia', 'croquet', 'photo_booth'],
    decorationTips: ['Union Jack', 'Kronen', 'Teeservice', 'Rote Telefonzellen'],
    dressCode: 'Elegant, Hüte, Fascinators',
    musicStyle: 'British Pop, Classical, Beatles',
    tags: ['royal', 'elegant', 'british']
  },
  {
    id: 'asian_zen',
    nameKey: 'gamesLibrary.themes.asian_zen.name',
    descriptionKey: 'gamesLibrary.themes.asian_zen.description',
    tipsKey: 'gamesLibrary.themes.asian_zen.tips',
    emoji: '🎋',
    category: 'relaxation',
    eventTypes: ['bachelorette', 'birthday'],
    colorPalette: { primary: '#228B22', secondary: '#FFFFFF', accent: '#FF69B4' },
    suggestedActivities: ['yoga', 'meditation', 'tea_ceremony'],
    decorationTips: ['Bambus', 'Kirschblüten', 'Laternen', 'Zen-Gärten', 'Koi-Teich-Deko'],
    dressCode: 'Kimonos, fließende Stoffe',
    musicStyle: 'Asian Ambient, Zen, Nature',
    tags: ['peaceful', 'zen', 'spiritual']
  },

  // SEASONAL THEMES
  {
    id: 'under_the_stars',
    nameKey: 'gamesLibrary.themes.under_the_stars.name',
    descriptionKey: 'gamesLibrary.themes.under_the_stars.description',
    tipsKey: 'gamesLibrary.themes.under_the_stars.tips',
    emoji: '⭐',
    category: 'seasonal',
    eventTypes: ['wedding', 'birthday', 'bachelorette'],
    colorPalette: { primary: '#191970', secondary: '#C0C0C0', accent: '#FFD700' },
    suggestedActivities: ['stargazing', 'campfire_stories', 'dance_off'],
    decorationTips: ['Lichterketten', 'Sterne', 'Monde', 'Teleskope', 'Decken'],
    dressCode: 'Elegant casual, glitzernd',
    musicStyle: 'Romantic, Acoustic, Ambient',
    tags: ['romantic', 'night', 'magical']
  },
  {
    id: 'vintage_tea_party',
    nameKey: 'gamesLibrary.themes.vintage_tea_party.name',
    descriptionKey: 'gamesLibrary.themes.vintage_tea_party.description',
    tipsKey: 'gamesLibrary.themes.vintage_tea_party.tips',
    emoji: '☕',
    category: 'elegant',
    eventTypes: ['bachelorette', 'birthday'],
    colorPalette: { primary: '#FFB6C1', secondary: '#FFFFFF', accent: '#DDA0DD' },
    suggestedActivities: ['trivia', 'photo_booth', 'crafting'],
    decorationTips: ['Vintage-Teekannen', 'Blumen', 'Spitze', 'Pastell-Deko'],
    dressCode: 'Vintage-Kleider, Hüte, Handschuhe',
    musicStyle: 'Jazz, Classical, Vintage',
    tags: ['elegant', 'feminine', 'vintage']
  },
  {
    id: 'art_deco',
    nameKey: 'gamesLibrary.themes.art_deco.name',
    descriptionKey: 'gamesLibrary.themes.art_deco.description',
    tipsKey: 'gamesLibrary.themes.art_deco.tips',
    emoji: '🎨',
    category: 'elegant',
    eventTypes: ['wedding'],
    colorPalette: { primary: '#C9A227', secondary: '#000000', accent: '#FFFFFF' },
    suggestedActivities: ['cocktail_contest', 'casino_night', 'dance_off'],
    decorationTips: ['Geometrische Muster', 'Gold', 'Schwarz', 'Art-Deco-Rahmen'],
    dressCode: 'Art-Deco-inspiriert, elegant',
    musicStyle: 'Jazz, Big Band, Swing',
    tags: ['geometric', 'glamour', 'artistic']
  },
  {
    id: 'boho_chic',
    nameKey: 'gamesLibrary.themes.boho_chic.name',
    descriptionKey: 'gamesLibrary.themes.boho_chic.description',
    tipsKey: 'gamesLibrary.themes.boho_chic.tips',
    emoji: '🪶',
    category: 'casual',
    eventTypes: ['wedding', 'bachelorette'],
    colorPalette: { primary: '#DEB887', secondary: '#228B22', accent: '#FF6347' },
    suggestedActivities: ['crafting', 'photo_booth', 'yoga'],
    decorationTips: ['Makramee', 'Federn', 'Traumfänger', 'Wildblumen', 'Teppiche'],
    dressCode: 'Boho, fließend, natürliche Farben',
    musicStyle: 'Indie Folk, Acoustic',
    tags: ['free-spirited', 'natural', 'bohemian']
  },
  {
    id: 'rustic_farm',
    nameKey: 'gamesLibrary.themes.rustic_farm.name',
    descriptionKey: 'gamesLibrary.themes.rustic_farm.description',
    tipsKey: 'gamesLibrary.themes.rustic_farm.tips',
    emoji: '🌾',
    category: 'casual',
    eventTypes: ['wedding', 'family'],
    colorPalette: { primary: '#8B4513', secondary: '#F5DEB3', accent: '#228B22' },
    suggestedActivities: ['scavenger_hunt', 'boccia', 'kubb'],
    decorationTips: ['Holzfässer', 'Heu', 'Sonnenblumen', 'Mason Jars', 'Lichterketten'],
    dressCode: 'Casual elegant, ländlich',
    musicStyle: 'Country, Folk, Acoustic',
    tags: ['country', 'rustic', 'charming']
  },
  {
    id: 'minimalist_modern',
    nameKey: 'gamesLibrary.themes.minimalist_modern.name',
    descriptionKey: 'gamesLibrary.themes.minimalist_modern.description',
    tipsKey: 'gamesLibrary.themes.minimalist_modern.tips',
    emoji: '⬜',
    category: 'elegant',
    eventTypes: ['wedding', 'birthday'],
    colorPalette: { primary: '#FFFFFF', secondary: '#000000', accent: '#C0C0C0' },
    suggestedActivities: ['wine_tasting', 'photo_booth', 'cocktail_contest'],
    decorationTips: ['Klare Linien', 'Einzelne Statement-Stücke', 'Weiße Blumen', 'Geometrisch'],
    dressCode: 'Minimalistisch elegant, monochromatisch',
    musicStyle: 'Electronic, Minimal, Ambient',
    tags: ['clean', 'modern', 'sleek']
  },
  {
    id: 'bohemian_sunset',
    nameKey: 'gamesLibrary.themes.bohemian_sunset.name',
    descriptionKey: 'gamesLibrary.themes.bohemian_sunset.description',
    tipsKey: 'gamesLibrary.themes.bohemian_sunset.tips',
    emoji: '🌻',
    category: 'casual',
    eventTypes: ['wedding', 'bachelorette'],
    colorPalette: { primary: '#FF6347', secondary: '#FFD700', accent: '#8B4513' },
    suggestedActivities: ['photo_booth', 'dance_off', 'campfire_stories'],
    decorationTips: ['Sonnenblumen', 'Terrakotta', 'Kissen', 'Bohemian-Teppiche'],
    dressCode: 'Erdtöne, fließend, Boho',
    musicStyle: 'Indie, Folk, Acoustic',
    tags: ['warm', 'bohemian', 'sunset']
  },
  {
    id: 'industrial_chic',
    nameKey: 'gamesLibrary.themes.industrial_chic.name',
    descriptionKey: 'gamesLibrary.themes.industrial_chic.description',
    tipsKey: 'gamesLibrary.themes.industrial_chic.tips',
    emoji: '⚙️',
    category: 'elegant',
    eventTypes: ['wedding'],
    colorPalette: { primary: '#2F4F4F', secondary: '#C0C0C0', accent: '#FF6347' },
    suggestedActivities: ['cocktail_contest', 'photo_booth', 'murder_mystery'],
    decorationTips: ['Metall', 'Edison-Lampen', 'Beton', 'Holz', 'Rohre'],
    dressCode: 'Urban chic, modern',
    musicStyle: 'Electronic, Indie, Industrial',
    tags: ['urban', 'edgy', 'modern']
  },
  {
    id: 'karibik',
    nameKey: 'gamesLibrary.themes.karibik.name',
    descriptionKey: 'gamesLibrary.themes.karibik.description',
    tipsKey: 'gamesLibrary.themes.karibik.tips',
    emoji: '🏝️',
    category: 'adventure',
    eventTypes: ['bachelor', 'bachelorette', 'trip'],
    colorPalette: { primary: '#00CED1', secondary: '#FFD700', accent: '#FF6347' },
    suggestedActivities: ['limbo_competition', 'cocktail_contest', 'dance_off'],
    decorationTips: ['Palmen', 'Muscheln', 'Hängematten', 'Tiki-Deko', 'Rum-Flaschen'],
    dressCode: 'Karibisch bunt, leicht',
    musicStyle: 'Reggae, Calypso, Caribbean',
    tags: ['tropical', 'relaxed', 'caribbean']
  },
  {
    id: 'sports_day',
    nameKey: 'gamesLibrary.themes.sports_day.name',
    descriptionKey: 'gamesLibrary.themes.sports_day.description',
    tipsKey: 'gamesLibrary.themes.sports_day.tips',
    emoji: '⚽',
    category: 'casual',
    eventTypes: ['team', 'family', 'bachelor'],
    colorPalette: { primary: '#FF4500', secondary: '#FFFFFF', accent: '#000000' },
    suggestedActivities: ['team_olympiad', 'relay_race', 'tug_of_war'],
    decorationTips: ['Wimpel', 'Pokale', 'Medaillen', 'Sportequipment'],
    dressCode: 'Sportkleidung, Team-Trikots',
    musicStyle: 'Upbeat Pop, Sports Anthems',
    tags: ['active', 'competition', 'team']
  }
];

// Helper functions
export const getThemesByCategory = (category: ThemeCategory): ThemeItem[] => {
  return themeIdeas.filter(theme => theme.category === category);
};

export const getThemesByEventType = (eventType: EventType): ThemeItem[] => {
  return themeIdeas.filter(theme => theme.eventTypes.includes(eventType));
};

export const getThemeById = (id: string): ThemeItem | undefined => {
  return themeIdeas.find(theme => theme.id === id);
};

export const searchThemes = (query: string): ThemeItem[] => {
  const lowerQuery = query.toLowerCase();
  return themeIdeas.filter(theme => 
    theme.id.includes(lowerQuery) ||
    theme.tags.some(tag => tag.includes(lowerQuery))
  );
};

export const getRandomTheme = (filters?: {
  category?: ThemeCategory;
  eventType?: EventType;
}): ThemeItem | undefined => {
  let filteredThemes = [...themeIdeas];
  
  if (filters?.category) {
    filteredThemes = filteredThemes.filter(t => t.category === filters.category);
  }
  if (filters?.eventType) {
    filteredThemes = filteredThemes.filter(t => t.eventTypes.includes(filters.eventType!));
  }
  
  if (filteredThemes.length === 0) return undefined;
  
  return filteredThemes[Math.floor(Math.random() * filteredThemes.length)];
};

export const themeCategories: { id: ThemeCategory; labelKey: string; emoji: string }[] = [
  { id: 'retro', labelKey: 'gamesLibrary.themeCategories.retro', emoji: '📼' },
  { id: 'elegant', labelKey: 'gamesLibrary.themeCategories.elegant', emoji: '✨' },
  { id: 'casual', labelKey: 'gamesLibrary.themeCategories.casual', emoji: '🎉' },
  { id: 'adventure', labelKey: 'gamesLibrary.themeCategories.adventure', emoji: '🧗' },
  { id: 'cultural', labelKey: 'gamesLibrary.themeCategories.cultural', emoji: '🌍' },
  { id: 'seasonal', labelKey: 'gamesLibrary.themeCategories.seasonal', emoji: '🌸' },
  { id: 'costume', labelKey: 'gamesLibrary.themeCategories.costume', emoji: '🎭' },
  { id: 'relaxation', labelKey: 'gamesLibrary.themeCategories.relaxation', emoji: '🧘' }
];
