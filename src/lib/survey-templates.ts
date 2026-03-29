import type { EventSettings } from "./survey-config";

export interface SurveyTemplate {
  id: string;
  name: string;
  nameDE: string;
  description: string;
  descriptionDE: string;
  category: string;
  iconName: string;
  gradient: string;
  accentColor: string;
  primaryColor: string;
  settings: Partial<EventSettings>;
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "jga-classic",
    name: "JGA Classic",
    nameDE: "JGA Klassisch",
    description: "Classic bachelor party with city trips and adventure activities",
    descriptionDE: "Klassischer JGA mit Städtetrip und Abenteuer-Aktivitäten",
    category: "bachelor",
    iconName: "PartyPopper",
    gradient: "from-violet-600 to-purple-600",
    accentColor: "#8B5CF6",
    primaryColor: "#7C3AED",
    settings: {
      budget_options: [
        { value: "80-150", label: "80–150€" },
        { value: "150-250", label: "150–250€" },
        { value: "250-400", label: "250–400€" },
        { value: "400+", label: "400+€" },
      ],
      destination_options: [
        { value: "de_city", label: "Deutsche Stadt" },
        { value: "prague", label: "Prag" },
        { value: "amsterdam", label: "Amsterdam" },
        { value: "budapest", label: "Budapest" },
      ],
      activity_options: [
        { value: "paintball", label: "Paintball", emoji: "🎯", category: "action" },
        { value: "escape_room", label: "Escape Room", emoji: "🔐", category: "action" },
        { value: "beer_bike", label: "Bierbike", emoji: "🍺", category: "other" },
        { value: "karting", label: "Go-Kart", emoji: "🏎️", category: "action" },
        { value: "axe_throwing", label: "Axtwerfen", emoji: "🪓", category: "action" },
        { value: "bar_crawl", label: "Kneipentour", emoji: "🍻", category: "food" },
      ],
      no_gos: ["No strippers", "No embarrassing tasks"],
      focus_points: ["Action & fun", "Shared experiences", "Cool, not embarrassing"],
    },
  },
  {
    id: "jga-deluxe",
    name: "JGA Deluxe",
    nameDE: "JGA Premium",
    description: "Premium bachelor experience with luxury activities",
    descriptionDE: "Premium JGA mit exklusiven Erlebnissen",
    category: "bachelor",
    iconName: "Crown",
    gradient: "from-amber-500 to-yellow-500",
    accentColor: "#F59E0B",
    primaryColor: "#D97706",
    settings: {
      budget_options: [
        { value: "250-400", label: "250–400€" },
        { value: "400-600", label: "400–600€" },
        { value: "600-1000", label: "600–1.000€" },
        { value: "1000+", label: "1.000+€" },
      ],
      destination_options: [
        { value: "barcelona", label: "Barcelona" },
        { value: "lisbon", label: "Lissabon" },
        { value: "ibiza", label: "Ibiza" },
        { value: "dubai", label: "Dubai" },
      ],
      activity_options: [
        { value: "yacht", label: "Yacht Charter", emoji: "🛥️", category: "chill" },
        { value: "spa", label: "Wellness & Spa", emoji: "🧖", category: "chill" },
        { value: "fine_dining", label: "Fine Dining", emoji: "🍷", category: "food" },
        { value: "helicopter", label: "Helikopter-Rundflug", emoji: "🚁", category: "action" },
        { value: "vip_club", label: "VIP Club", emoji: "🎵", category: "other" },
      ],
      no_gos: ["No cheap venues", "No embarrassing costumes"],
      focus_points: ["Luxury experience", "Once in a lifetime", "Premium quality"],
    },
  },
  {
    id: "bachelorette",
    name: "Bachelorette Party",
    nameDE: "JGA für Sie",
    description: "Spa, brunch, dancing, and unforgettable moments",
    descriptionDE: "Spa, Brunch, Tanzen und unvergessliche Momente",
    category: "bachelorette",
    iconName: "Heart",
    gradient: "from-pink-500 to-rose-500",
    accentColor: "#EC4899",
    primaryColor: "#DB2777",
    settings: {
      budget_options: [
        { value: "80-150", label: "80–150€" },
        { value: "150-250", label: "150–250€" },
        { value: "250-400", label: "250–400€" },
      ],
      destination_options: [
        { value: "de_city", label: "Deutsche Stadt" },
        { value: "vienna", label: "Wien" },
        { value: "paris", label: "Paris" },
        { value: "mallorca", label: "Mallorca" },
      ],
      activity_options: [
        { value: "spa_day", label: "Spa Day", emoji: "🧖‍♀️", category: "chill" },
        { value: "cocktail_workshop", label: "Cocktail Workshop", emoji: "🍸", category: "food" },
        { value: "dance_class", label: "Tanzkurs", emoji: "💃", category: "action" },
        { value: "photo_shooting", label: "Fotoshooting", emoji: "📸", category: "other" },
        { value: "wine_tour", label: "Weinverkostung", emoji: "🍷", category: "food" },
        { value: "brunch", label: "Champagner-Brunch", emoji: "🥂", category: "food" },
      ],
      no_gos: ["No strippers", "No penis-shaped accessories"],
      focus_points: ["Elegant & classy", "Quality time", "Instagram-worthy"],
    },
  },
  {
    id: "birthday-bash",
    name: "Birthday Bash",
    nameDE: "Geburtstagsfeier",
    description: "Flexible and fun birthday celebration",
    descriptionDE: "Flexible und spaßige Geburtstagsfeier",
    category: "birthday",
    iconName: "Cake",
    gradient: "from-amber-500 to-orange-500",
    accentColor: "#F59E0B",
    primaryColor: "#EA580C",
    settings: {
      budget_options: [
        { value: "30-50", label: "30–50€" },
        { value: "50-100", label: "50–100€" },
        { value: "100-200", label: "100–200€" },
        { value: "200+", label: "200+€" },
      ],
      activity_options: [
        { value: "dinner", label: "Abendessen", emoji: "🍽️", category: "food" },
        { value: "bowling", label: "Bowling", emoji: "🎳", category: "action" },
        { value: "karaoke", label: "Karaoke", emoji: "🎤", category: "action" },
        { value: "bbq", label: "BBQ & Grillen", emoji: "🥩", category: "food" },
        { value: "escape_room", label: "Escape Room", emoji: "🔐", category: "action" },
        { value: "cinema", label: "Kino", emoji: "🎬", category: "chill" },
      ],
      focus_points: ["Fun for everyone", "Celebrate together", "Memorable moments"],
    },
  },
  {
    id: "adventure-trip",
    name: "Adventure Trip",
    nameDE: "Abenteuerreise",
    description: "Outdoor adventures, hiking, and adrenaline",
    descriptionDE: "Outdoor-Abenteuer, Wandern und Adrenalin",
    category: "trip",
    iconName: "Mountain",
    gradient: "from-cyan-500 to-teal-500",
    accentColor: "#06B6D4",
    primaryColor: "#0891B2",
    settings: {
      budget_options: [
        { value: "100-200", label: "100–200€" },
        { value: "200-400", label: "200–400€" },
        { value: "400-700", label: "400–700€" },
        { value: "700+", label: "700+€" },
      ],
      destination_options: [
        { value: "alps", label: "Alpen" },
        { value: "black_forest", label: "Schwarzwald" },
        { value: "dolomites", label: "Dolomiten" },
        { value: "norway", label: "Norwegen" },
      ],
      activity_options: [
        { value: "hiking", label: "Wandern", emoji: "🥾", category: "outdoor" },
        { value: "rafting", label: "Rafting", emoji: "🚣", category: "action" },
        { value: "climbing", label: "Klettern", emoji: "🧗", category: "action" },
        { value: "zipline", label: "Zip-Line", emoji: "🏔️", category: "action" },
        { value: "camping", label: "Camping", emoji: "⛺", category: "outdoor" },
        { value: "canyoning", label: "Canyoning", emoji: "🏞️", category: "action" },
      ],
      focus_points: ["Nature & adventure", "Push your limits", "Team bonding"],
    },
  },
  {
    id: "city-break",
    name: "City Break",
    nameDE: "Städtetrip",
    description: "Culture, food, and sightseeing in a vibrant city",
    descriptionDE: "Kultur, Essen und Sightseeing in einer lebendigen Stadt",
    category: "trip",
    iconName: "Building2",
    gradient: "from-indigo-500 to-blue-500",
    accentColor: "#6366F1",
    primaryColor: "#4F46E5",
    settings: {
      budget_options: [
        { value: "150-300", label: "150–300€" },
        { value: "300-500", label: "300–500€" },
        { value: "500-800", label: "500–800€" },
        { value: "800+", label: "800+€" },
      ],
      destination_options: [
        { value: "berlin", label: "Berlin" },
        { value: "amsterdam", label: "Amsterdam" },
        { value: "prague", label: "Prag" },
        { value: "barcelona", label: "Barcelona" },
        { value: "lisbon", label: "Lissabon" },
        { value: "vienna", label: "Wien" },
      ],
      activity_options: [
        { value: "food_tour", label: "Food Tour", emoji: "🍕", category: "food" },
        { value: "museum", label: "Museum", emoji: "🏛️", category: "chill" },
        { value: "street_art", label: "Street Art Tour", emoji: "🎨", category: "other" },
        { value: "nightlife", label: "Nachtleben", emoji: "🌃", category: "other" },
        { value: "boat_tour", label: "Bootstour", emoji: "🚢", category: "chill" },
      ],
      focus_points: ["Explore & discover", "Local experiences", "Great food"],
    },
  },
  {
    id: "wedding-rsvp",
    name: "Wedding RSVP",
    nameDE: "Hochzeit RSVP",
    description: "Elegant wedding response with dietary and accommodation",
    descriptionDE: "Elegante Hochzeitsantwort mit Diätwünschen und Unterkunft",
    category: "wedding",
    iconName: "Gem",
    gradient: "from-rose-400 to-pink-500",
    accentColor: "#F43F5E",
    primaryColor: "#E11D48",
    settings: {
      budget_options: [
        { value: "gift_50", label: "Geschenk ~50€" },
        { value: "gift_100", label: "Geschenk ~100€" },
        { value: "gift_200", label: "Geschenk ~200€" },
        { value: "surprise", label: "Überraschung" },
      ],
      activity_options: [
        { value: "ceremony", label: "Trauung", emoji: "💒", category: "other" },
        { value: "dinner", label: "Abendessen", emoji: "🍽️", category: "food" },
        { value: "party", label: "Party", emoji: "🎉", category: "action" },
        { value: "brunch", label: "Brunch am nächsten Tag", emoji: "☕", category: "food" },
      ],
      focus_points: ["Celebrate love", "Elegant & memorable", "Family & friends"],
    },
  },
  {
    id: "corporate-retreat",
    name: "Corporate Retreat",
    nameDE: "Firmen-Retreat",
    description: "Team building, workshops, and professional networking",
    descriptionDE: "Teambuilding, Workshops und professionelles Networking",
    category: "corporate",
    iconName: "Briefcase",
    gradient: "from-slate-500 to-slate-700",
    accentColor: "#64748B",
    primaryColor: "#475569",
    settings: {
      budget_options: [
        { value: "company_paid", label: "Firma zahlt" },
        { value: "50-100", label: "Eigenanteil 50–100€" },
        { value: "100-200", label: "Eigenanteil 100–200€" },
      ],
      activity_options: [
        { value: "workshop", label: "Workshop", emoji: "📋", category: "other" },
        { value: "team_building", label: "Teambuilding", emoji: "🤝", category: "action" },
        { value: "dinner", label: "Team-Dinner", emoji: "🍽️", category: "food" },
        { value: "keynote", label: "Keynote/Vortrag", emoji: "🎤", category: "other" },
        { value: "networking", label: "Networking", emoji: "🔗", category: "other" },
        { value: "outdoor", label: "Outdoor-Aktivität", emoji: "🌲", category: "outdoor" },
      ],
      focus_points: ["Team spirit", "Professional growth", "Work-life balance"],
    },
  },
];

export const getTemplatesByCategory = (category: string) =>
  category === "all" ? SURVEY_TEMPLATES : SURVEY_TEMPLATES.filter(t => t.category === category);

export const getTemplateById = (id: string) =>
  SURVEY_TEMPLATES.find(t => t.id === id);
