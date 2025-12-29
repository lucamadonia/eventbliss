// Event Content Templates - predefined configurations for different event types
// Each template contains survey options tailored to specific event styles

import type { SurveyConfig, SelectOption, ActivityOption } from './survey-config';

export interface EventTemplate {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  eventTypes: string[]; // Which event types this template applies to
  tags: string[];
  surveyConfig: Partial<SurveyConfig>;
  recommendedDesign?: string;
}

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export const EVENT_TEMPLATES: EventTemplate[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // BACHELOR PARTY TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'jga-classic',
    nameKey: 'templates.jgaClassic.name',
    descriptionKey: 'templates.jgaClassic.description',
    icon: '🎉',
    eventTypes: ['bachelor'],
    tags: ['action', 'party', 'city'],
    surveyConfig: {
      budget_options: [
        { value: '80-150', label: '80–150 €' },
        { value: '150-250', label: '150–250 €' },
        { value: '250-400', label: '250–400 €' },
        { value: '400+', label: '400 €+' },
      ],
      destination_options: [
        { value: 'de_city', label: 'templates.destinations.deCity' },
        { value: 'prague', label: 'templates.destinations.prague', emoji: '🇨🇿' },
        { value: 'budapest', label: 'templates.destinations.budapest', emoji: '🇭🇺' },
        { value: 'barcelona', label: 'templates.destinations.barcelona', emoji: '🇪🇸' },
        { value: 'amsterdam', label: 'templates.destinations.amsterdam', emoji: '🇳🇱' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'karting', label: 'templates.activities.karting', emoji: '🏎️', category: 'action' },
        { value: 'escape_room', label: 'templates.activities.escapeRoom', emoji: '🔐', category: 'action' },
        { value: 'lasertag', label: 'templates.activities.lasertag', emoji: '🔫', category: 'action' },
        { value: 'axe_throwing', label: 'templates.activities.axeThrowing', emoji: '🪓', category: 'action' },
        { value: 'vr_arena', label: 'templates.activities.vrArena', emoji: '🎮', category: 'action' },
        { value: 'bubble_soccer', label: 'templates.activities.bubbleSoccer', emoji: '⚽', category: 'action' },
        { value: 'paintball', label: 'templates.activities.paintball', emoji: '🎯', category: 'action' },
        { value: 'bar_tour', label: 'templates.activities.barTour', emoji: '🍻', category: 'food' },
        { value: 'casino', label: 'templates.activities.casino', emoji: '🎰', category: 'other' },
        { value: 'bbq_party', label: 'templates.activities.bbqParty', emoji: '🍖', category: 'food' },
      ],
      duration_options: [
        { value: 'day', label: 'templates.duration.dayTrip' },
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'neon-nights',
  },
  {
    id: 'jga-adventure',
    nameKey: 'templates.jgaAdventure.name',
    descriptionKey: 'templates.jgaAdventure.description',
    icon: '🏔️',
    eventTypes: ['bachelor'],
    tags: ['outdoor', 'adventure', 'sports'],
    surveyConfig: {
      budget_options: [
        { value: '150-250', label: '150–250 €' },
        { value: '250-400', label: '250–400 €' },
        { value: '400-600', label: '400–600 €' },
        { value: '600+', label: '600 €+' },
      ],
      destination_options: [
        { value: 'alps', label: 'templates.destinations.alps', emoji: '⛰️' },
        { value: 'sea_coast', label: 'templates.destinations.seaCoast', emoji: '🌊' },
        { value: 'forest_nature', label: 'templates.destinations.forestNature', emoji: '🌲' },
        { value: 'lake_region', label: 'templates.destinations.lakeRegion', emoji: '🏞️' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'rafting', label: 'templates.activities.rafting', emoji: '🚣', category: 'outdoor' },
        { value: 'canyoning', label: 'templates.activities.canyoning', emoji: '🏞️', category: 'outdoor' },
        { value: 'climbing', label: 'templates.activities.climbing', emoji: '🧗', category: 'outdoor' },
        { value: 'hiking', label: 'templates.activities.hiking', emoji: '🥾', category: 'outdoor' },
        { value: 'mountain_biking', label: 'templates.activities.mountainBiking', emoji: '🚵', category: 'outdoor' },
        { value: 'survival_training', label: 'templates.activities.survivalTraining', emoji: '🏕️', category: 'outdoor' },
        { value: 'bungee', label: 'templates.activities.bungee', emoji: '🦘', category: 'action' },
        { value: 'paragliding', label: 'templates.activities.paragliding', emoji: '🪂', category: 'action' },
        { value: 'quad_tour', label: 'templates.activities.quadTour', emoji: '🏍️', category: 'action' },
        { value: 'cabin_bbq', label: 'templates.activities.cabinBbq', emoji: '🏠', category: 'chill' },
      ],
      duration_options: [
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'long_weekend', label: 'templates.duration.longWeekend' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'mountain-escape',
  },
  {
    id: 'jga-chill',
    nameKey: 'templates.jgaChill.name',
    descriptionKey: 'templates.jgaChill.description',
    icon: '🧖',
    eventTypes: ['bachelor'],
    tags: ['relax', 'wellness', 'food'],
    surveyConfig: {
      budget_options: [
        { value: '100-200', label: '100–200 €' },
        { value: '200-350', label: '200–350 €' },
        { value: '350-500', label: '350–500 €' },
        { value: '500+', label: '500 €+' },
      ],
      destination_options: [
        { value: 'spa_hotel', label: 'templates.destinations.spaHotel', emoji: '🏨' },
        { value: 'local', label: 'templates.destinations.local', emoji: '📍' },
        { value: 'wine_region', label: 'templates.destinations.wineRegion', emoji: '🍷' },
        { value: 'lake_resort', label: 'templates.destinations.lakeResort', emoji: '🌅' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'spa_wellness', label: 'templates.activities.spaWellness', emoji: '💆', category: 'chill' },
        { value: 'wine_tasting', label: 'templates.activities.wineTasting', emoji: '🍷', category: 'food' },
        { value: 'gourmet_dinner', label: 'templates.activities.gourmetDinner', emoji: '🍽️', category: 'food' },
        { value: 'cooking_class', label: 'templates.activities.cookingClass', emoji: '👨‍🍳', category: 'food' },
        { value: 'golf', label: 'templates.activities.golf', emoji: '⛳', category: 'outdoor' },
        { value: 'cigar_whiskey', label: 'templates.activities.cigarWhiskey', emoji: '🥃', category: 'chill' },
        { value: 'brewery_tour', label: 'templates.activities.breweryTour', emoji: '🍺', category: 'food' },
        { value: 'boat_trip', label: 'templates.activities.boatTrip', emoji: '⛵', category: 'chill' },
      ],
      duration_options: [
        { value: 'day', label: 'templates.duration.halfDay' },
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'modern-minimal',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BACHELORETTE PARTY TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'bachelorette-glam',
    nameKey: 'templates.bacheloretteGlam.name',
    descriptionKey: 'templates.bacheloretteGlam.description',
    icon: '💅',
    eventTypes: ['bachelorette'],
    tags: ['glamour', 'wellness', 'party'],
    surveyConfig: {
      budget_options: [
        { value: '100-200', label: '100–200 €' },
        { value: '200-350', label: '200–350 €' },
        { value: '350-500', label: '350–500 €' },
        { value: '500+', label: '500 €+' },
      ],
      destination_options: [
        { value: 'mallorca', label: 'templates.destinations.mallorca', emoji: '🇪🇸' },
        { value: 'barcelona', label: 'templates.destinations.barcelona', emoji: '🇪🇸' },
        { value: 'amsterdam', label: 'templates.destinations.amsterdam', emoji: '🇳🇱' },
        { value: 'lisbon', label: 'templates.destinations.lisbon', emoji: '🇵🇹' },
        { value: 'spa_hotel', label: 'templates.destinations.spaHotel', emoji: '🏨' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'spa_wellness', label: 'templates.activities.spaWellness', emoji: '💆', category: 'chill' },
        { value: 'photoshoot', label: 'templates.activities.photoshoot', emoji: '📸', category: 'other' },
        { value: 'cocktail_class', label: 'templates.activities.cocktailClass', emoji: '🍹', category: 'food' },
        { value: 'yoga_retreat', label: 'templates.activities.yogaRetreat', emoji: '🧘', category: 'chill' },
        { value: 'dance_class', label: 'templates.activities.danceClass', emoji: '💃', category: 'action' },
        { value: 'brunch_party', label: 'templates.activities.brunchParty', emoji: '🥂', category: 'food' },
        { value: 'beach_club', label: 'templates.activities.beachClub', emoji: '🏖️', category: 'chill' },
        { value: 'shopping_tour', label: 'templates.activities.shoppingTour', emoji: '🛍️', category: 'other' },
        { value: 'wine_tasting', label: 'templates.activities.wineTasting', emoji: '🍷', category: 'food' },
        { value: 'karaoke', label: 'templates.activities.karaoke', emoji: '🎤', category: 'action' },
      ],
      duration_options: [
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'long_weekend', label: 'templates.duration.longWeekend' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'beach-vibes',
  },
  {
    id: 'bachelorette-adventure',
    nameKey: 'templates.bacheloretteAdventure.name',
    descriptionKey: 'templates.bacheloretteAdventure.description',
    icon: '🌿',
    eventTypes: ['bachelorette'],
    tags: ['outdoor', 'active', 'nature'],
    surveyConfig: {
      budget_options: [
        { value: '150-250', label: '150–250 €' },
        { value: '250-400', label: '250–400 €' },
        { value: '400-600', label: '400–600 €' },
        { value: '600+', label: '600 €+' },
      ],
      destination_options: [
        { value: 'alps', label: 'templates.destinations.alps', emoji: '⛰️' },
        { value: 'sea_coast', label: 'templates.destinations.seaCoast', emoji: '🌊' },
        { value: 'lake_region', label: 'templates.destinations.lakeRegion', emoji: '🏞️' },
        { value: 'vineyard', label: 'templates.destinations.vineyard', emoji: '🍇' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'hiking', label: 'templates.activities.hiking', emoji: '🥾', category: 'outdoor' },
        { value: 'yoga_retreat', label: 'templates.activities.yogaRetreat', emoji: '🧘', category: 'chill' },
        { value: 'kayaking', label: 'templates.activities.kayaking', emoji: '🛶', category: 'outdoor' },
        { value: 'horseback_riding', label: 'templates.activities.horsebackRiding', emoji: '🐴', category: 'outdoor' },
        { value: 'picnic', label: 'templates.activities.picnic', emoji: '🧺', category: 'chill' },
        { value: 'wine_tasting', label: 'templates.activities.wineTasting', emoji: '🍷', category: 'food' },
        { value: 'sunset_boat', label: 'templates.activities.sunsetBoat', emoji: '🌅', category: 'chill' },
        { value: 'outdoor_cooking', label: 'templates.activities.outdoorCooking', emoji: '🔥', category: 'food' },
      ],
      duration_options: [
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'long_weekend', label: 'templates.duration.longWeekend' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'garden-party',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BIRTHDAY TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'birthday-party',
    nameKey: 'templates.birthdayParty.name',
    descriptionKey: 'templates.birthdayParty.description',
    icon: '🎂',
    eventTypes: ['birthday'],
    tags: ['party', 'celebration', 'fun'],
    surveyConfig: {
      budget_options: [
        { value: '30-50', label: '30–50 €' },
        { value: '50-100', label: '50–100 €' },
        { value: '100-200', label: '100–200 €' },
        { value: '200+', label: '200 €+' },
      ],
      destination_options: [
        { value: 'local', label: 'templates.destinations.local', emoji: '📍' },
        { value: 'restaurant', label: 'templates.destinations.restaurant', emoji: '🍽️' },
        { value: 'event_location', label: 'templates.destinations.eventLocation', emoji: '🎪' },
        { value: 'rooftop_bar', label: 'templates.destinations.rooftopBar', emoji: '🌃' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'dinner_party', label: 'templates.activities.dinnerParty', emoji: '🍽️', category: 'food' },
        { value: 'karaoke', label: 'templates.activities.karaoke', emoji: '🎤', category: 'action' },
        { value: 'bowling', label: 'templates.activities.bowling', emoji: '🎳', category: 'action' },
        { value: 'escape_room', label: 'templates.activities.escapeRoom', emoji: '🔐', category: 'action' },
        { value: 'games_night', label: 'templates.activities.gamesNight', emoji: '🎲', category: 'chill' },
        { value: 'cocktail_party', label: 'templates.activities.cocktailParty', emoji: '🍸', category: 'food' },
        { value: 'dancing', label: 'templates.activities.dancing', emoji: '🕺', category: 'action' },
        { value: 'live_music', label: 'templates.activities.liveMusic', emoji: '🎵', category: 'other' },
      ],
      duration_options: [
        { value: 'evening', label: 'templates.duration.evening' },
        { value: 'day', label: 'templates.duration.fullDay' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'sunset-glow',
  },
  {
    id: 'birthday-experience',
    nameKey: 'templates.birthdayExperience.name',
    descriptionKey: 'templates.birthdayExperience.description',
    icon: '🎁',
    eventTypes: ['birthday'],
    tags: ['experience', 'unique', 'memorable'],
    surveyConfig: {
      budget_options: [
        { value: '50-100', label: '50–100 €' },
        { value: '100-200', label: '100–200 €' },
        { value: '200-400', label: '200–400 €' },
        { value: '400+', label: '400 €+' },
      ],
      destination_options: [
        { value: 'local', label: 'templates.destinations.local', emoji: '📍' },
        { value: 'nearby_city', label: 'templates.destinations.nearbyCity', emoji: '🏙️' },
        { value: 'nature', label: 'templates.destinations.nature', emoji: '🌳' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'cooking_class', label: 'templates.activities.cookingClass', emoji: '👨‍🍳', category: 'food' },
        { value: 'wine_tasting', label: 'templates.activities.wineTasting', emoji: '🍷', category: 'food' },
        { value: 'spa_day', label: 'templates.activities.spaDay', emoji: '💆', category: 'chill' },
        { value: 'concert', label: 'templates.activities.concert', emoji: '🎸', category: 'other' },
        { value: 'sports_event', label: 'templates.activities.sportsEvent', emoji: '🏟️', category: 'other' },
        { value: 'escape_room', label: 'templates.activities.escapeRoom', emoji: '🔐', category: 'action' },
        { value: 'art_class', label: 'templates.activities.artClass', emoji: '🎨', category: 'chill' },
        { value: 'adventure_park', label: 'templates.activities.adventurePark', emoji: '🎢', category: 'action' },
      ],
      duration_options: [
        { value: 'half_day', label: 'templates.duration.halfDay' },
        { value: 'day', label: 'templates.duration.fullDay' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'modern-minimal',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRIP TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'family-trip',
    nameKey: 'templates.familyTrip.name',
    descriptionKey: 'templates.familyTrip.description',
    icon: '👨‍👩‍👧‍👦',
    eventTypes: ['trip'],
    tags: ['family', 'kids', 'relaxed'],
    surveyConfig: {
      budget_options: [
        { value: '50-100', label: '50–100 € p.P.' },
        { value: '100-200', label: '100–200 € p.P.' },
        { value: '200-400', label: '200–400 € p.P.' },
        { value: '400+', label: '400 €+ p.P.' },
      ],
      destination_options: [
        { value: 'theme_park', label: 'templates.destinations.themePark', emoji: '🎢' },
        { value: 'zoo', label: 'templates.destinations.zoo', emoji: '🦁' },
        { value: 'beach', label: 'templates.destinations.beach', emoji: '🏖️' },
        { value: 'mountains', label: 'templates.destinations.mountains', emoji: '⛰️' },
        { value: 'farm', label: 'templates.destinations.farm', emoji: '🌾' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'theme_park', label: 'templates.activities.themePark', emoji: '🎢', category: 'action' },
        { value: 'zoo_aquarium', label: 'templates.activities.zooAquarium', emoji: '🐬', category: 'other' },
        { value: 'beach_fun', label: 'templates.activities.beachFun', emoji: '🏖️', category: 'outdoor' },
        { value: 'hiking_easy', label: 'templates.activities.hikingEasy', emoji: '🚶', category: 'outdoor' },
        { value: 'picnic', label: 'templates.activities.picnic', emoji: '🧺', category: 'chill' },
        { value: 'games', label: 'templates.activities.games', emoji: '🎲', category: 'chill' },
        { value: 'bike_tour', label: 'templates.activities.bikeTour', emoji: '🚴', category: 'outdoor' },
        { value: 'swimming', label: 'templates.activities.swimming', emoji: '🏊', category: 'outdoor' },
      ],
      duration_options: [
        { value: 'day', label: 'templates.duration.dayTrip' },
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'week', label: 'templates.duration.week' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'garden-party',
  },
  {
    id: 'friends-trip',
    nameKey: 'templates.friendsTrip.name',
    descriptionKey: 'templates.friendsTrip.description',
    icon: '✈️',
    eventTypes: ['trip'],
    tags: ['friends', 'adventure', 'travel'],
    surveyConfig: {
      budget_options: [
        { value: '200-400', label: '200–400 €' },
        { value: '400-700', label: '400–700 €' },
        { value: '700-1000', label: '700–1000 €' },
        { value: '1000+', label: '1000 €+' },
      ],
      destination_options: [
        { value: 'city_europe', label: 'templates.destinations.cityEurope', emoji: '🏛️' },
        { value: 'beach_europe', label: 'templates.destinations.beachEurope', emoji: '🏖️' },
        { value: 'adventure_europe', label: 'templates.destinations.adventureEurope', emoji: '🏔️' },
        { value: 'road_trip', label: 'templates.destinations.roadTrip', emoji: '🚗' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'sightseeing', label: 'templates.activities.sightseeing', emoji: '📸', category: 'other' },
        { value: 'nightlife', label: 'templates.activities.nightlife', emoji: '🌙', category: 'action' },
        { value: 'food_tour', label: 'templates.activities.foodTour', emoji: '🍕', category: 'food' },
        { value: 'hiking', label: 'templates.activities.hiking', emoji: '🥾', category: 'outdoor' },
        { value: 'beach', label: 'templates.activities.beach', emoji: '🏖️', category: 'chill' },
        { value: 'water_sports', label: 'templates.activities.waterSports', emoji: '🏄', category: 'outdoor' },
        { value: 'local_experiences', label: 'templates.activities.localExperiences', emoji: '🌍', category: 'other' },
        { value: 'concerts_events', label: 'templates.activities.concertsEvents', emoji: '🎤', category: 'other' },
      ],
      duration_options: [
        { value: 'long_weekend', label: 'templates.duration.longWeekend' },
        { value: 'week', label: 'templates.duration.week' },
        { value: 'two_weeks', label: 'templates.duration.twoWeeks' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'beach-vibes',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OTHER / TEAM EVENT TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'team-event',
    nameKey: 'templates.teamEvent.name',
    descriptionKey: 'templates.teamEvent.description',
    icon: '🏢',
    eventTypes: ['other'],
    tags: ['team', 'corporate', 'teambuilding'],
    surveyConfig: {
      budget_options: [
        { value: '50-100', label: '50–100 € p.P.' },
        { value: '100-200', label: '100–200 € p.P.' },
        { value: '200-400', label: '200–400 € p.P.' },
        { value: '400+', label: '400 €+ p.P.' },
      ],
      destination_options: [
        { value: 'conference_hotel', label: 'templates.destinations.conferenceHotel', emoji: '🏨' },
        { value: 'outdoor_location', label: 'templates.destinations.outdoorLocation', emoji: '🏕️' },
        { value: 'event_space', label: 'templates.destinations.eventSpace', emoji: '🎪' },
        { value: 'office', label: 'templates.destinations.office', emoji: '🏢' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'escape_room', label: 'templates.activities.escapeRoom', emoji: '🔐', category: 'action' },
        { value: 'teambuilding_games', label: 'templates.activities.teambuildingGames', emoji: '🎯', category: 'action' },
        { value: 'workshop', label: 'templates.activities.workshop', emoji: '📝', category: 'other' },
        { value: 'outdoor_challenge', label: 'templates.activities.outdoorChallenge', emoji: '🏕️', category: 'outdoor' },
        { value: 'cooking_class', label: 'templates.activities.cookingClass', emoji: '👨‍🍳', category: 'food' },
        { value: 'sports_tournament', label: 'templates.activities.sportsTournament', emoji: '🏆', category: 'action' },
        { value: 'dinner_event', label: 'templates.activities.dinnerEvent', emoji: '🍽️', category: 'food' },
        { value: 'creative_workshop', label: 'templates.activities.creativeWorkshop', emoji: '🎨', category: 'chill' },
      ],
      duration_options: [
        { value: 'half_day', label: 'templates.duration.halfDay' },
        { value: 'day', label: 'templates.duration.fullDay' },
        { value: 'overnight', label: 'templates.duration.overnight' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'modern-minimal',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FLEXIBLE TEMPLATE (for all types)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'flexible',
    nameKey: 'templates.flexible.name',
    descriptionKey: 'templates.flexible.description',
    icon: '✨',
    eventTypes: ['bachelor', 'bachelorette', 'birthday', 'trip', 'other'],
    tags: ['flexible', 'custom', 'open'],
    surveyConfig: {
      budget_options: [
        { value: '0-50', label: '0–50 €' },
        { value: '50-100', label: '50–100 €' },
        { value: '100-250', label: '100–250 €' },
        { value: '250-500', label: '250–500 €' },
        { value: '500+', label: '500 €+' },
      ],
      destination_options: [
        { value: 'local', label: 'templates.destinations.local', emoji: '📍' },
        { value: 'domestic', label: 'templates.destinations.domestic', emoji: '🏠' },
        { value: 'europe', label: 'templates.destinations.europe', emoji: '🇪🇺' },
        { value: 'worldwide', label: 'templates.destinations.worldwide', emoji: '🌍' },
        { value: 'flexible', label: 'templates.destinations.flexible' },
      ],
      activity_options: [
        { value: 'action', label: 'templates.activities.action', emoji: '⚡', category: 'action' },
        { value: 'chill', label: 'templates.activities.chill', emoji: '😌', category: 'chill' },
        { value: 'outdoor', label: 'templates.activities.outdoor', emoji: '🌲', category: 'outdoor' },
        { value: 'food', label: 'templates.activities.food', emoji: '🍽️', category: 'food' },
        { value: 'culture', label: 'templates.activities.culture', emoji: '🎭', category: 'other' },
        { value: 'party', label: 'templates.activities.party', emoji: '🎉', category: 'action' },
        { value: 'mixed', label: 'templates.activities.mixed', emoji: '🎯', category: 'other' },
      ],
      duration_options: [
        { value: 'half_day', label: 'templates.duration.halfDay' },
        { value: 'day', label: 'templates.duration.fullDay' },
        { value: 'weekend', label: 'templates.duration.weekend' },
        { value: 'week', label: 'templates.duration.week' },
        { value: 'flexible', label: 'templates.duration.flexible' },
      ],
    },
    recommendedDesign: 'elegant-dark',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get templates filtered by event type
 */
export function getTemplatesForEventType(eventType: string): EventTemplate[] {
  return EVENT_TEMPLATES.filter(t => t.eventTypes.includes(eventType));
}

/**
 * Get a template by its ID
 */
export function getTemplateById(templateId: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Merge template config into default survey config
 */
export function mergeTemplateConfig(
  defaultConfig: SurveyConfig,
  template: EventTemplate
): SurveyConfig {
  return {
    ...defaultConfig,
    ...template.surveyConfig,
    budget_options: template.surveyConfig.budget_options || defaultConfig.budget_options,
    destination_options: template.surveyConfig.destination_options || defaultConfig.destination_options,
    activity_options: template.surveyConfig.activity_options || defaultConfig.activity_options,
    duration_options: template.surveyConfig.duration_options || defaultConfig.duration_options,
  };
}
