// 100+ kategorisierte Aktivitäten für Events

export type ActivityCategory = 
  | 'action' 
  | 'outdoor' 
  | 'chill' 
  | 'food' 
  | 'entertainment' 
  | 'creative' 
  | 'sport' 
  | 'nightlife'
  | 'culture'
  | 'adventure';

export interface ActivityItem {
  value: string;
  label: string;
  emoji: string;
  category: ActivityCategory;
  description?: string;
  tags?: string[];
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; emoji: string; color: string }> = {
  action: { label: 'Action', emoji: '🏎️', color: 'destructive' },
  outdoor: { label: 'Outdoor', emoji: '🏕️', color: 'success' },
  chill: { label: 'Chill & Wellness', emoji: '🧖', color: 'accent' },
  food: { label: 'Food & Drinks', emoji: '🍽️', color: 'warning' },
  entertainment: { label: 'Entertainment', emoji: '🎭', color: 'primary' },
  creative: { label: 'Kreativ', emoji: '🎨', color: 'neon-pink' },
  sport: { label: 'Sport', emoji: '🏆', color: 'success' },
  nightlife: { label: 'Nightlife', emoji: '🌙', color: 'primary' },
  culture: { label: 'Kultur', emoji: '🏛️', color: 'muted' },
  adventure: { label: 'Abenteuer', emoji: '🪂', color: 'destructive' },
};

export const ACTIVITIES_LIBRARY: ActivityItem[] = [
  // 🏎️ ACTION (25+)
  { value: 'karting', label: 'Karting', emoji: '🏎️', category: 'action', tags: ['speed', 'racing'] },
  { value: 'escape_room', label: 'Escape Room', emoji: '🔐', category: 'action', tags: ['puzzle', 'team'] },
  { value: 'lasertag', label: 'Lasertag', emoji: '🔫', category: 'action', tags: ['team', 'competitive'] },
  { value: 'paintball', label: 'Paintball', emoji: '🎯', category: 'action', tags: ['outdoor', 'team'] },
  { value: 'axe_throwing', label: 'Axtwerfen', emoji: '🪓', category: 'action', tags: ['skill'] },
  { value: 'archery', label: 'Bogenschießen', emoji: '🏹', category: 'action', tags: ['skill', 'focus'] },
  { value: 'vr_arena', label: 'VR Arena', emoji: '🥽', category: 'action', tags: ['tech', 'immersive'] },
  { value: 'sim_racing', label: 'Sim-Racing', emoji: '🎮', category: 'action', tags: ['racing', 'tech'] },
  { value: 'bubble_soccer', label: 'Bubble Soccer', emoji: '⚽', category: 'action', tags: ['fun', 'team'] },
  { value: 'trampoline_park', label: 'Trampolin-Park', emoji: '🦘', category: 'action', tags: ['fun', 'fitness'] },
  { value: 'ninja_warrior', label: 'Ninja Warrior Parcours', emoji: '🥷', category: 'action', tags: ['fitness', 'challenge'] },
  { value: 'quad_tour', label: 'Quad Tour', emoji: '🏍️', category: 'action', tags: ['outdoor', 'adventure'] },
  { value: 'segway_tour', label: 'Segway Tour', emoji: '🛴', category: 'action', tags: ['tour', 'fun'] },
  { value: 'jetski', label: 'Jetski', emoji: '🚤', category: 'action', tags: ['water', 'speed'] },
  { value: 'wakeboarding', label: 'Wakeboarding', emoji: '🏄', category: 'action', tags: ['water', 'sport'] },
  { value: 'indoor_skydiving', label: 'Indoor Skydiving', emoji: '💨', category: 'action', tags: ['extreme', 'unique'] },
  { value: 'shooting_range', label: 'Schießstand', emoji: '🎯', category: 'action', tags: ['skill', 'focus'] },
  { value: 'crossfit_challenge', label: 'Crossfit Challenge', emoji: '🏋️', category: 'action', tags: ['fitness', 'team'] },
  { value: 'hovercraft', label: 'Hovercraft fahren', emoji: '🛸', category: 'action', tags: ['unique', 'fun'] },
  { value: 'bumper_cars', label: 'Autoscooter', emoji: '🚗', category: 'action', tags: ['fun', 'classic'] },
  { value: 'drift_course', label: 'Drift-Kurs', emoji: '🏎️', category: 'action', tags: ['driving', 'skill'] },
  { value: 'nerf_battle', label: 'Nerf Battle', emoji: '🔫', category: 'action', tags: ['team', 'fun'] },
  { value: 'combat_archery', label: 'Combat Archery', emoji: '🏹', category: 'action', tags: ['team', 'sport'] },
  { value: 'rage_room', label: 'Rage Room', emoji: '🔨', category: 'action', tags: ['stress-relief', 'unique'] },
  { value: 'zorbing', label: 'Zorbing', emoji: '🔵', category: 'action', tags: ['fun', 'outdoor'] },

  // 🏕️ OUTDOOR (20+)
  { value: 'climbing', label: 'Klettern/Bouldern', emoji: '🧗', category: 'outdoor', tags: ['fitness', 'skill'] },
  { value: 'hiking', label: 'Wandern', emoji: '🥾', category: 'outdoor', tags: ['nature', 'fitness'] },
  { value: 'canoeing', label: 'Kanu/Kajak', emoji: '🛶', category: 'outdoor', tags: ['water', 'team'] },
  { value: 'rafting', label: 'Rafting', emoji: '🚣', category: 'outdoor', tags: ['water', 'adventure'] },
  { value: 'sup', label: 'Stand-Up Paddling', emoji: '🏄', category: 'outdoor', tags: ['water', 'chill'] },
  { value: 'mtb_tour', label: 'Mountainbike Tour', emoji: '🚵', category: 'outdoor', tags: ['fitness', 'adventure'] },
  { value: 'zipline', label: 'Zipline', emoji: '🎢', category: 'outdoor', tags: ['adventure', 'thrill'] },
  { value: 'high_ropes', label: 'Hochseilgarten', emoji: '🌲', category: 'outdoor', tags: ['adventure', 'team'] },
  { value: 'survival_training', label: 'Survival Training', emoji: '🔥', category: 'outdoor', tags: ['skills', 'unique'] },
  { value: 'geocaching', label: 'Geocaching', emoji: '🗺️', category: 'outdoor', tags: ['exploration', 'team'] },
  { value: 'sailing', label: 'Segeln', emoji: '⛵', category: 'outdoor', tags: ['water', 'skill'] },
  { value: 'fishing', label: 'Angeln', emoji: '🎣', category: 'outdoor', tags: ['chill', 'nature'] },
  { value: 'camping', label: 'Camping', emoji: '🏕️', category: 'outdoor', tags: ['nature', 'overnight'] },
  { value: 'beach_volleyball', label: 'Beach Volleyball', emoji: '🏐', category: 'outdoor', tags: ['sport', 'team'] },
  { value: 'golf', label: 'Golf', emoji: '⛳', category: 'outdoor', tags: ['sport', 'skill'] },
  { value: 'disc_golf', label: 'Disc Golf', emoji: '🥏', category: 'outdoor', tags: ['sport', 'fun'] },
  { value: 'outdoor_cinema', label: 'Open Air Kino', emoji: '🎬', category: 'outdoor', tags: ['chill', 'culture'] },
  { value: 'tree_climbing', label: 'Baumklettern', emoji: '🌳', category: 'outdoor', tags: ['adventure', 'nature'] },
  { value: 'stargazing', label: 'Sternbeobachtung', emoji: '⭐', category: 'outdoor', tags: ['chill', 'romantic'] },
  { value: 'hot_air_balloon', label: 'Heißluftballon', emoji: '🎈', category: 'outdoor', tags: ['unique', 'scenic'] },

  // 🧖 CHILL & WELLNESS (15+)
  { value: 'spa', label: 'Wellness/Spa', emoji: '🧖', category: 'chill', tags: ['relaxation'] },
  { value: 'sauna', label: 'Sauna', emoji: '🔥', category: 'chill', tags: ['relaxation', 'health'] },
  { value: 'thermal_bath', label: 'Thermalbad', emoji: '♨️', category: 'chill', tags: ['relaxation', 'water'] },
  { value: 'massage', label: 'Massage', emoji: '💆', category: 'chill', tags: ['relaxation'] },
  { value: 'yoga', label: 'Yoga Session', emoji: '🧘', category: 'chill', tags: ['fitness', 'mindfulness'] },
  { value: 'boat_trip', label: 'Bootsfahrt', emoji: '🚢', category: 'chill', tags: ['scenic', 'relaxation'] },
  { value: 'picnic', label: 'Picknick', emoji: '🧺', category: 'chill', tags: ['outdoor', 'food'] },
  { value: 'beach_day', label: 'Strand-Tag', emoji: '🏖️', category: 'chill', tags: ['outdoor', 'relaxation'] },
  { value: 'pool_party', label: 'Pool Party', emoji: '🏊', category: 'chill', tags: ['party', 'water'] },
  { value: 'hammam', label: 'Hammam', emoji: '🛁', category: 'chill', tags: ['relaxation', 'culture'] },
  { value: 'float_tank', label: 'Float Tank', emoji: '🌊', category: 'chill', tags: ['unique', 'relaxation'] },
  { value: 'sound_bath', label: 'Klangschalen-Meditation', emoji: '🔔', category: 'chill', tags: ['mindfulness'] },
  { value: 'ice_bath', label: 'Eisbaden', emoji: '🧊', category: 'chill', tags: ['extreme', 'health'] },
  { value: 'rooftop_lounge', label: 'Rooftop Lounge', emoji: '🌆', category: 'chill', tags: ['drinks', 'scenic'] },
  { value: 'sunset_cruise', label: 'Sunset Cruise', emoji: '🌅', category: 'chill', tags: ['scenic', 'romantic'] },

  // 🍽️ FOOD & DRINKS (20+)
  { value: 'dinner_experience', label: 'Dinner Experience', emoji: '🍽️', category: 'food', tags: ['premium'] },
  { value: 'bbq_event', label: 'BBQ Event', emoji: '🍖', category: 'food', tags: ['cooking', 'outdoor'] },
  { value: 'tapas_tour', label: 'Tapas Tour', emoji: '🍤', category: 'food', tags: ['tour', 'spanish'] },
  { value: 'street_food_tour', label: 'Street Food Tour', emoji: '🌮', category: 'food', tags: ['tour', 'diverse'] },
  { value: 'brunch', label: 'Brunch', emoji: '🥐', category: 'food', tags: ['morning', 'chill'] },
  { value: 'cocktail_course', label: 'Cocktail Kurs', emoji: '🍸', category: 'food', tags: ['drinks', 'skill'] },
  { value: 'barista_workshop', label: 'Barista Workshop', emoji: '☕', category: 'food', tags: ['coffee', 'skill'] },
  { value: 'sushi_course', label: 'Sushi Kurs', emoji: '🍣', category: 'food', tags: ['cooking', 'japanese'] },
  { value: 'pizza_making', label: 'Pizza Making', emoji: '🍕', category: 'food', tags: ['cooking', 'fun'] },
  { value: 'chocolate_workshop', label: 'Schokoladen Workshop', emoji: '🍫', category: 'food', tags: ['sweet', 'skill'] },
  { value: 'wine_tasting', label: 'Weinprobe', emoji: '🍷', category: 'food', tags: ['drinks', 'culture'] },
  { value: 'whisky_tasting', label: 'Whisky Tasting', emoji: '🥃', category: 'food', tags: ['drinks', 'premium'] },
  { value: 'gin_tasting', label: 'Gin Tasting', emoji: '🍸', category: 'food', tags: ['drinks'] },
  { value: 'beer_brewing', label: 'Bier Braukurs', emoji: '🍺', category: 'food', tags: ['drinks', 'skill'] },
  { value: 'brewery_tour', label: 'Brauereibesichtigung', emoji: '🏭', category: 'food', tags: ['tour', 'drinks'] },
  { value: 'cheese_tasting', label: 'Käse Tasting', emoji: '🧀', category: 'food', tags: ['food', 'culture'] },
  { value: 'cooking_class', label: 'Kochkurs', emoji: '👨‍🍳', category: 'food', tags: ['cooking', 'skill'] },
  { value: 'grill_course', label: 'Grillkurs', emoji: '🔥', category: 'food', tags: ['cooking', 'outdoor'] },
  { value: 'fine_dining', label: 'Fine Dining', emoji: '✨', category: 'food', tags: ['premium', 'experience'] },
  { value: 'food_truck_rally', label: 'Food Truck Festival', emoji: '🚚', category: 'food', tags: ['diverse', 'outdoor'] },

  // 🎭 ENTERTAINMENT (20+)
  { value: 'comedy_show', label: 'Comedy Show', emoji: '😂', category: 'entertainment', tags: ['funny', 'show'] },
  { value: 'concert', label: 'Konzert', emoji: '🎵', category: 'entertainment', tags: ['music', 'live'] },
  { value: 'musical', label: 'Musical', emoji: '🎭', category: 'entertainment', tags: ['theater', 'music'] },
  { value: 'club', label: 'Club/Disco', emoji: '🪩', category: 'entertainment', tags: ['nightlife', 'dancing'] },
  { value: 'karaoke', label: 'Karaoke', emoji: '🎤', category: 'entertainment', tags: ['singing', 'fun'] },
  { value: 'casino', label: 'Casino Abend', emoji: '🎰', category: 'entertainment', tags: ['gambling', 'nightlife'] },
  { value: 'poker_tournament', label: 'Poker Turnier', emoji: '🃏', category: 'entertainment', tags: ['cards', 'competition'] },
  { value: 'quiz_night', label: 'Quiz Night', emoji: '🧠', category: 'entertainment', tags: ['team', 'competition'] },
  { value: 'cinema', label: 'Kino', emoji: '🎬', category: 'entertainment', tags: ['movies', 'chill'] },
  { value: 'bowling', label: 'Bowling', emoji: '🎳', category: 'entertainment', tags: ['classic', 'fun'] },
  { value: 'billiards', label: 'Billard', emoji: '🎱', category: 'entertainment', tags: ['classic', 'skill'] },
  { value: 'darts', label: 'Darts', emoji: '🎯', category: 'entertainment', tags: ['classic', 'skill'] },
  { value: 'theater', label: 'Theater', emoji: '🎭', category: 'entertainment', tags: ['culture', 'show'] },
  { value: 'opera', label: 'Oper', emoji: '🎼', category: 'entertainment', tags: ['culture', 'music'] },
  { value: 'variete', label: 'Varieté', emoji: '🎪', category: 'entertainment', tags: ['show', 'acrobatics'] },
  { value: 'magic_show', label: 'Zaubershow', emoji: '🎩', category: 'entertainment', tags: ['magic', 'show'] },
  { value: 'drag_show', label: 'Drag Show', emoji: '👠', category: 'entertainment', tags: ['show', 'fabulous'] },
  { value: 'improv_theater', label: 'Impro-Theater', emoji: '🎭', category: 'entertainment', tags: ['comedy', 'interactive'] },
  { value: 'murder_mystery', label: 'Murder Mystery Dinner', emoji: '🔍', category: 'entertainment', tags: ['interactive', 'dinner'] },
  { value: 'silent_disco', label: 'Silent Disco', emoji: '🎧', category: 'entertainment', tags: ['dancing', 'unique'] },

  // 🎨 KREATIV (15+)
  { value: 'graffiti_workshop', label: 'Graffiti Workshop', emoji: '🎨', category: 'creative', tags: ['art', 'urban'] },
  { value: 'pottery', label: 'Töpfern', emoji: '🏺', category: 'creative', tags: ['craft', 'relaxing'] },
  { value: 'painting_class', label: 'Malkurs', emoji: '🖼️', category: 'creative', tags: ['art', 'relaxing'] },
  { value: 'blacksmithing', label: 'Schmieden', emoji: '⚒️', category: 'creative', tags: ['craft', 'unique'] },
  { value: 'candle_making', label: 'Kerzenziehen', emoji: '🕯️', category: 'creative', tags: ['craft', 'relaxing'] },
  { value: 'leather_workshop', label: 'Leder Workshop', emoji: '👜', category: 'creative', tags: ['craft', 'skill'] },
  { value: 'watchmaking', label: 'Uhrmacher Workshop', emoji: '⌚', category: 'creative', tags: ['craft', 'precision'] },
  { value: 'perfume_making', label: 'Parfüm kreieren', emoji: '🧴', category: 'creative', tags: ['scent', 'unique'] },
  { value: 'tshirt_printing', label: 'T-Shirt bedrucken', emoji: '👕', category: 'creative', tags: ['design', 'fun'] },
  { value: 'photoshoot', label: 'Fotoshooting', emoji: '📸', category: 'creative', tags: ['memories', 'fun'] },
  { value: 'music_production', label: 'Musik-Produktion', emoji: '🎹', category: 'creative', tags: ['music', 'tech'] },
  { value: 'neon_sign_making', label: 'Neon-Schild basteln', emoji: '💡', category: 'creative', tags: ['craft', 'unique'] },
  { value: 'terrarium_building', label: 'Terrarium bauen', emoji: '🌱', category: 'creative', tags: ['plants', 'craft'] },
  { value: 'jewelry_making', label: 'Schmuck basteln', emoji: '💎', category: 'creative', tags: ['craft', 'fashion'] },
  { value: 'glassblowing', label: 'Glasbläserei', emoji: '🔥', category: 'creative', tags: ['craft', 'unique'] },
  { value: 'ceramic_painting', label: 'Keramik bemalen', emoji: '🎨', category: 'creative', tags: ['craft', 'relaxing', 'trendy'] },
  { value: 'resin_art', label: 'Resin Art / Epoxidharz', emoji: '💎', category: 'creative', tags: ['craft', 'unique', 'trendy'] },
  { value: 'flower_arrangement', label: 'Blumen binden', emoji: '💐', category: 'creative', tags: ['craft', 'relaxing', 'romantic'] },
  { value: 'calligraphy', label: 'Kalligraphie Workshop', emoji: '✒️', category: 'creative', tags: ['art', 'skill', 'relaxing'] },
  { value: 'macrame', label: 'Makramee knüpfen', emoji: '🧶', category: 'creative', tags: ['craft', 'boho', 'relaxing'] },
  { value: 'embroidery', label: 'Stickerei / Punch Needle', emoji: '🪡', category: 'creative', tags: ['craft', 'trendy'] },
  { value: 'tie_dye', label: 'Batik / Tie-Dye', emoji: '🌈', category: 'creative', tags: ['craft', 'fun', 'fashion'] },

  // 🍵 FOOD & DRINKS — Workshops (additional)
  { value: 'matcha_workshop', label: 'Matcha Kurs', emoji: '🍵', category: 'food', tags: ['tea', 'wellness', 'trendy'] },
  { value: 'sushi_course', label: 'Sushi Kurs', emoji: '🍣', category: 'food', tags: ['cooking', 'japanese'] },
  { value: 'pasta_making', label: 'Pasta selber machen', emoji: '🍝', category: 'food', tags: ['cooking', 'italian'] },
  { value: 'chocolate_workshop', label: 'Schokoladen Workshop', emoji: '🍫', category: 'food', tags: ['sweet', 'craft'] },
  { value: 'cheese_tasting', label: 'Käse-Tasting', emoji: '🧀', category: 'food', tags: ['tasting', 'gourmet'] },
  { value: 'beer_brewing', label: 'Bier brauen', emoji: '🍺', category: 'food', tags: ['craft', 'drinks'] },
  { value: 'gin_tasting', label: 'Gin Tasting', emoji: '🍸', category: 'food', tags: ['tasting', 'drinks'] },
  { value: 'barista_course', label: 'Barista Kurs', emoji: '☕', category: 'food', tags: ['coffee', 'skill'] },
  { value: 'cake_decorating', label: 'Torten dekorieren', emoji: '🎂', category: 'food', tags: ['baking', 'craft'] },
  { value: 'dumpling_workshop', label: 'Dumpling Workshop', emoji: '🥟', category: 'food', tags: ['cooking', 'asian'] },
  { value: 'bread_baking', label: 'Brot backen', emoji: '🍞', category: 'food', tags: ['baking', 'traditional'] },

  // 🧖 CHILL & WELLNESS — additional
  { value: 'yoga_class', label: 'Yoga Kurs', emoji: '🧘', category: 'chill', tags: ['wellness', 'relaxing'] },
  { value: 'meditation', label: 'Meditation Session', emoji: '🕯️', category: 'chill', tags: ['wellness', 'mindfulness'] },
  { value: 'sound_bath', label: 'Klangschalen-Bad', emoji: '🔔', category: 'chill', tags: ['wellness', 'unique'] },
  { value: 'forest_bathing', label: 'Waldbaden', emoji: '🌲', category: 'chill', tags: ['nature', 'wellness'] },
  { value: 'ice_bath', label: 'Eisbaden / Wim Hof', emoji: '🧊', category: 'chill', tags: ['wellness', 'extreme', 'trendy'] },

  // 🏆 SPORT (15+)
  { value: 'football', label: 'Fußball', emoji: '⚽', category: 'sport', tags: ['team', 'classic'] },
  { value: 'tennis', label: 'Tennis', emoji: '🎾', category: 'sport', tags: ['skill', 'fitness'] },
  { value: 'squash', label: 'Squash', emoji: '🎾', category: 'sport', tags: ['fitness', 'intense'] },
  { value: 'badminton', label: 'Badminton', emoji: '🏸', category: 'sport', tags: ['fun', 'fitness'] },
  { value: 'table_tennis', label: 'Tischtennis', emoji: '🏓', category: 'sport', tags: ['fun', 'skill'] },
  { value: 'basketball', label: 'Basketball', emoji: '🏀', category: 'sport', tags: ['team', 'fitness'] },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐', category: 'sport', tags: ['team', 'fun'] },
  { value: 'swimming', label: 'Schwimmen', emoji: '🏊', category: 'sport', tags: ['fitness', 'water'] },
  { value: 'ice_skating', label: 'Eislaufen', emoji: '⛸️', category: 'sport', tags: ['fun', 'winter'] },
  { value: 'skiing', label: 'Skifahren', emoji: '⛷️', category: 'sport', tags: ['winter', 'adventure'] },
  { value: 'boxing_class', label: 'Boxkurs', emoji: '🥊', category: 'sport', tags: ['fitness', 'intense'] },
  { value: 'surfing', label: 'Surfen', emoji: '🏄', category: 'sport', tags: ['water', 'skill'] },
  { value: 'padel', label: 'Padel', emoji: '🎾', category: 'sport', tags: ['fun', 'trending'] },
  { value: 'mini_golf', label: 'Minigolf', emoji: '⛳', category: 'sport', tags: ['fun', 'chill'] },
  { value: 'go_kart', label: 'E-Kart', emoji: '🏎️', category: 'sport', tags: ['racing', 'eco'] },

  // 🌙 NIGHTLIFE (10+)
  { value: 'bar_hopping', label: 'Bar Hopping', emoji: '🍻', category: 'nightlife', tags: ['drinks', 'social'] },
  { value: 'rooftop_bar', label: 'Rooftop Bar', emoji: '🌃', category: 'nightlife', tags: ['drinks', 'view'] },
  { value: 'speakeasy', label: 'Speakeasy Bar', emoji: '🕵️', category: 'nightlife', tags: ['drinks', 'unique'] },
  { value: 'jazz_club', label: 'Jazz Club', emoji: '🎷', category: 'nightlife', tags: ['music', 'classy'] },
  { value: 'techno_club', label: 'Techno Club', emoji: '🔊', category: 'nightlife', tags: ['music', 'dancing'] },
  { value: 'salsa_night', label: 'Salsa Night', emoji: '💃', category: 'nightlife', tags: ['dancing', 'latin'] },
  { value: 'pub_crawl', label: 'Pub Crawl', emoji: '🍺', category: 'nightlife', tags: ['drinks', 'social'] },
  { value: 'cocktail_bar', label: 'Cocktail Bar', emoji: '🍹', category: 'nightlife', tags: ['drinks', 'classy'] },
  { value: 'wine_bar', label: 'Weinbar', emoji: '🍷', category: 'nightlife', tags: ['drinks', 'relaxed'] },
  { value: 'live_music_bar', label: 'Live Music Bar', emoji: '🎸', category: 'nightlife', tags: ['music', 'drinks'] },

  // 🪂 ABENTEUER / EXTREME (10+)
  { value: 'skydiving', label: 'Fallschirmspringen', emoji: '🪂', category: 'adventure', tags: ['extreme', 'unique'] },
  { value: 'bungee_jumping', label: 'Bungee Jumping', emoji: '🏗️', category: 'adventure', tags: ['extreme', 'thrill'] },
  { value: 'paragliding', label: 'Paragliding', emoji: '🪂', category: 'adventure', tags: ['flying', 'scenic'] },
  { value: 'helicopter_ride', label: 'Helikopterflug', emoji: '🚁', category: 'adventure', tags: ['flying', 'premium'] },
  { value: 'supercar_experience', label: 'Supercar Experience', emoji: '🏎️', category: 'adventure', tags: ['driving', 'premium'] },
  { value: 'tank_driving', label: 'Panzer fahren', emoji: '🪖', category: 'adventure', tags: ['unique', 'extreme'] },
  { value: 'shark_diving', label: 'Hai-Tauchen', emoji: '🦈', category: 'adventure', tags: ['extreme', 'water'] },
  { value: 'canyoning', label: 'Canyoning', emoji: '🏞️', category: 'adventure', tags: ['water', 'adventure'] },
  { value: 'via_ferrata', label: 'Klettersteig', emoji: '🧗', category: 'adventure', tags: ['climbing', 'adventure'] },
  { value: 'cave_exploration', label: 'Höhlenbegehung', emoji: '🕳️', category: 'adventure', tags: ['exploration', 'unique'] },

  // 🏛️ KULTUR (10+)
  { value: 'museum', label: 'Museum', emoji: '🏛️', category: 'culture', tags: ['art', 'history'] },
  { value: 'city_tour', label: 'Stadtführung', emoji: '🗺️', category: 'culture', tags: ['tour', 'history'] },
  { value: 'architecture_tour', label: 'Architektur-Tour', emoji: '🏗️', category: 'culture', tags: ['tour', 'design'] },
  { value: 'gallery_visit', label: 'Galerie-Besuch', emoji: '🖼️', category: 'culture', tags: ['art', 'chill'] },
  { value: 'historic_site', label: 'Historische Stätte', emoji: '🏰', category: 'culture', tags: ['history', 'tour'] },
  { value: 'street_art_tour', label: 'Street Art Tour', emoji: '🎨', category: 'culture', tags: ['art', 'urban'] },
  { value: 'food_market', label: 'Food Market', emoji: '🥘', category: 'culture', tags: ['food', 'local'] },
  { value: 'local_festival', label: 'Lokales Festival', emoji: '🎉', category: 'culture', tags: ['party', 'local'] },
  { value: 'antique_market', label: 'Antiquitäten-Markt', emoji: '🏺', category: 'culture', tags: ['shopping', 'unique'] },
  { value: 'haunted_tour', label: 'Geister-Tour', emoji: '👻', category: 'culture', tags: ['scary', 'unique'] },
];

// Helper function to get activities by category
export function getActivitiesByCategory(category: ActivityCategory): ActivityItem[] {
  return ACTIVITIES_LIBRARY.filter(a => a.category === category);
}

// Helper function to search activities
export function searchActivities(query: string): ActivityItem[] {
  const lowerQuery = query.toLowerCase();
  return ACTIVITIES_LIBRARY.filter(a => 
    a.label.toLowerCase().includes(lowerQuery) ||
    a.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
    a.category.toLowerCase().includes(lowerQuery)
  );
}

// Get popular/recommended activities for an event type
export function getRecommendedActivities(eventType: string): ActivityItem[] {
  const recommendations: Record<string, string[]> = {
    bachelor: ['karting', 'escape_room', 'lasertag', 'paintball', 'bubble_soccer', 'bar_hopping', 'club'],
    bachelorette: ['spa', 'cocktail_course', 'karaoke', 'drag_show', 'photoshoot', 'wine_tasting'],
    birthday: ['escape_room', 'dinner_experience', 'bowling', 'karaoke', 'comedy_show'],
    trip: ['city_tour', 'food_tour', 'museum', 'hiking', 'local_festival'],
    other: ['escape_room', 'dinner_experience', 'bowling', 'quiz_night'],
  };
  
  const recommendedValues = recommendations[eventType] || recommendations.other;
  return ACTIVITIES_LIBRARY.filter(a => recommendedValues.includes(a.value));
}
