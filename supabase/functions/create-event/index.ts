import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${random}`;
}

// =============================================================================
// TEMPLATE DEFINITIONS (embedded for Edge Function)
// =============================================================================
interface TemplateOption {
  value: string;
  label: string;
  emoji?: string;
  category?: string;
}

interface TemplateConfig {
  budget_options?: TemplateOption[];
  destination_options?: TemplateOption[];
  activity_options?: TemplateOption[];
  duration_options?: TemplateOption[];
}

const TEMPLATES: Record<string, TemplateConfig> = {
  'jga-classic': {
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
  'jga-adventure': {
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
  'jga-chill': {
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
  'bachelorette-glam': {
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
  'bachelorette-adventure': {
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
  'birthday-party': {
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
  'birthday-experience': {
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
  'family-trip': {
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
  'friends-trip': {
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
  'team-event': {
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
  'flexible': {
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
};

// Default fallback settings (for events without template)
const DEFAULT_SETTINGS: {
  form_locked: boolean;
  date_blocks: Record<string, unknown>;
  date_warnings: Record<string, unknown>;
  no_gos: string[];
  focus_points: string[];
  budget_options: TemplateOption[];
  destination_options: TemplateOption[];
  activity_options: TemplateOption[];
  duration_options: TemplateOption[];
  travel_options: TemplateOption[];
  fitness_options: TemplateOption[];
  alcohol_options: TemplateOption[];
  attendance_options: TemplateOption[];
  branding: { primary_color: string; accent_color: string; background_style: string };
} = {
  form_locked: false,
  date_blocks: {},
  date_warnings: {},
  no_gos: [],
  focus_points: [],
  
  budget_options: [
    { value: "80-150", label: "80–150 €" },
    { value: "150-250", label: "150–250 €" },
    { value: "250-400", label: "250–400 €" },
    { value: "400+", label: "400 €+" },
  ],
  
  destination_options: [
    { value: "de_city", label: "templates.destinations.deCity" },
    { value: "barcelona", label: "templates.destinations.barcelona", emoji: "🇪🇸" },
    { value: "lisbon", label: "templates.destinations.lisbon", emoji: "🇵🇹" },
    { value: "prague", label: "templates.destinations.prague", emoji: "🇨🇿" },
    { value: "budapest", label: "templates.destinations.budapest", emoji: "🇭🇺" },
    { value: "flexible", label: "templates.destinations.flexible" },
  ],
  
  activity_options: [
    { value: "karting", label: "templates.activities.karting", emoji: "🏎️", category: "action" },
    { value: "escape_room", label: "templates.activities.escapeRoom", emoji: "🔐", category: "action" },
    { value: "lasertag", label: "templates.activities.lasertag", emoji: "🔫", category: "action" },
    { value: "axe_throwing", label: "templates.activities.axeThrowing", emoji: "🪓", category: "action" },
    { value: "vr_arena", label: "templates.activities.vrArena", emoji: "🎮", category: "action" },
    { value: "climbing", label: "templates.activities.climbing", emoji: "🧗", category: "outdoor" },
    { value: "bubble_soccer", label: "templates.activities.bubbleSoccer", emoji: "⚽", category: "action" },
    { value: "outdoor", label: "templates.activities.outdoor", emoji: "🏕️", category: "outdoor" },
    { value: "wellness", label: "templates.activities.spaWellness", emoji: "🧖", category: "chill" },
    { value: "food", label: "templates.activities.food", emoji: "🍽️", category: "food" },
    { value: "mixed", label: "templates.activities.mixed", emoji: "🎯", category: "other" },
  ],
  
  duration_options: [
    { value: "day", label: "templates.duration.dayTrip" },
    { value: "weekend", label: "templates.duration.weekend" },
    { value: "flexible", label: "templates.duration.flexible" },
  ],
  
  travel_options: [
    { value: "daytrip", label: "templates.travel.daytrip" },
    { value: "one_night", label: "templates.travel.oneNight" },
    { value: "two_nights", label: "templates.travel.twoNights" },
    { value: "flexible", label: "templates.travel.flexible" },
  ],
  
  fitness_options: [
    { value: "chill", label: "templates.fitness.chill", emoji: "🛋️" },
    { value: "normal", label: "templates.fitness.normal", emoji: "🚶" },
    { value: "sporty", label: "templates.fitness.sporty", emoji: "💪" },
  ],
  
  alcohol_options: [
    { value: "yes", label: "templates.alcohol.yes", emoji: "🍻" },
    { value: "no", label: "templates.alcohol.no" },
    { value: "flexible", label: "templates.alcohol.flexible" },
  ],
  
  attendance_options: [
    { value: "yes", label: "templates.attendance.yes", emoji: "🎉" },
    { value: "maybe", label: "templates.attendance.maybe" },
    { value: "no", label: "templates.attendance.no", emoji: "😔" },
  ],
  
  branding: {
    primary_color: "#8B5CF6",
    accent_color: "#06B6D4",
    background_style: "gradient",
  },
};

// =============================================================================
// MESSAGE TEMPLATES BY EVENT TYPE AND LOCALE
// =============================================================================
interface MessageTemplateConfig {
  event_id: string;
  template_key: string;
  title: string;
  emoji_prefix: string;
  content_template: string;
  sort_order: number;
  locale: string;
}

type EventType = 'bachelor' | 'bachelorette' | 'birthday' | 'trip' | 'other';

// Localized message templates per event type
const MESSAGE_TEMPLATES: Record<string, Record<EventType, {
  kickoff: string;
  budget_poll: string;
  accommodation: string;
  packing_list: string;
  travel_info: string;
  countdown: string;
  gifts: string;
  motivation: string;
  payment: string;
  date_locked: string;
}>> = {
  de: {
    bachelor: {
      kickoff: `Hey Männer! 🎉\n\nEs ist soweit - wir planen den JGA für {{honoree_name}}! 🥳\n\nDamit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!\n\n👉 Bitte füllt diese kurze Umfrage aus:\n{{link}}\n\n🔑 Zugangscode: {{code}}\n\nDie Umfrage dauert nur 2-3 Minuten und hilft uns bei:\n📅 Terminfindung\n💰 Budget-Planung\n🎯 Aktivitäten-Auswahl\n📍 Reiseziel-Wahl\n\nJe schneller alle antworten, desto schneller können wir loslegen! 🚀`,
      budget_poll: `Männer, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?\n\n🔘 bis 100 € – Team Sparfuchs\n🔘 150–200 € – Team realistisch\n🔘 250 €+ – Team Eskalation\n\nBitte ehrlich stimmen!`,
      accommodation: `Wir brauchen ein Bett – oder wenigstens einen Boden.\n\nLieber:\n🔘 Hotel (bequem, aber teurer)\n🔘 Airbnb (mehr Platz & Chaos)\n🔘 Hostel (weniger Komfort, mehr Abenteuer)\n\nWer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben.`,
      packing_list: `Jungs, bitte einpacken:\n✅ Ausweis\n✅ Bargeld\n✅ Handy & Ladegerät\n✅ Kopfschmerztabletten (ihr wisst wieso)\n✅ Wechselshirt (für alle Fälle)\n✅ gute Laune`,
      travel_info: `Anreiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt mit wem? Bitte in die Gruppe schreiben:\n„Fahre selbst + Platz für X Leute"\noder\n„Suche Mitfahrgelegenheit aus [Ort]"`,
      countdown: `Männer!\nNoch 3 Tage bis zum JGA für {{honoree_name}}. Jetzt nochmal kurz checken:\n✅ Geld überwiesen\n✅ Outfit klar\n✅ Zimmerverteilung verstanden\n✅ Gruppe gemutet – sonst wird der Chat wild\n\nDer Countdown läuft… und keiner kommt raus!`,
      gifts: `Wer bringt was für {{honoree_name}}?\n🔹 Eine peinliche Aufgabe\n🔹 Ein Geschenk mit Erinnerungswert\n🔹 Ein Shot aus seiner Vergangenheit\n\nBitte kurz in die Gruppe schreiben – damit es nicht 5 Flachmänner und kein Plan gibt 😅`,
      motivation: `Jungs, ab jetzt wird nicht mehr diskutiert – sondern eskaliert.\nJeder hat heute eine Aufgabe:\n🔸 Spaß haben\n🔸 Bräutigam feiern\n🔸 Nicht verloren gehen\n🔸 Und: Wer meckert, muss 'nen Shot trinken 🍻`,
      payment: `Kleines Finanz-Update:\nBitte überweist bis {{deadline}} auf folgendes Konto/Link:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nOhne Moos = kein Los. Wer nicht zahlt, wird mit Karaoke bestraft. 😬`,
      date_locked: `Der Termin steht!\n\n📅 {{locked_date}}\n\nBitte alle vormerken und keine Ausreden mehr! 🎉`,
    },
    bachelorette: {
      kickoff: `Hey Mädels! 🎉\n\nEs ist soweit - wir planen den JGA für {{honoree_name}}! 👰✨\n\nDamit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!\n\n👉 Bitte füllt diese kurze Umfrage aus:\n{{link}}\n\n🔑 Zugangscode: {{code}}\n\nDie Umfrage dauert nur 2-3 Minuten und hilft uns bei:\n📅 Terminfindung\n💰 Budget-Planung\n🎯 Aktivitäten-Auswahl\n📍 Reiseziel-Wahl\n\nJe schneller alle antworten, desto schneller können wir loslegen! 💕`,
      budget_poll: `Ladies, damit keiner am Ende pleite ist – was darf der Spaß kosten (pro Person)?\n\n🔘 bis 100 € – Team Sparfuchs\n🔘 150–200 € – Team realistisch\n🔘 250 €+ – Team Eskalation\n\nBitte ehrlich stimmen! 💖`,
      accommodation: `Wir brauchen ein Bett – oder wenigstens einen Boden.\n\nLieber:\n🔘 Hotel (bequem, aber teurer)\n🔘 Airbnb (mehr Platz & Girls Night)\n🔘 Hostel (weniger Komfort, mehr Abenteuer)\n\nWer mit einer Luftmatratze glücklich wird – einfach „Ich bin flexibel" schreiben. 💅`,
      packing_list: `Mädels, bitte einpacken:\n✅ Ausweis\n✅ Bargeld\n✅ Handy & Ladegerät\n✅ Party-Outfit\n✅ Bequeme Schuhe (für später)\n✅ gute Laune 💄✨`,
      travel_info: `Anreiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt mit wem? Bitte in die Gruppe schreiben:\n„Fahre selbst + Platz für X Mädels"\noder\n„Suche Mitfahrgelegenheit aus [Ort]" 🚗`,
      countdown: `Ladies!\nNoch 3 Tage bis zum JGA für {{honoree_name}}. Jetzt nochmal kurz checken:\n✅ Geld überwiesen\n✅ Outfit klar\n✅ Zimmerverteilung verstanden\n✅ Accessoires für die Braut eingepackt\n\nDer Countdown läuft! 💍✨`,
      gifts: `Wer bringt was für {{honoree_name}}?\n💝 Ein peinliches Accessoire\n💝 Ein Geschenk mit Erinnerungswert\n💝 Eine lustige Aufgabe\n\nBitte kurz in die Gruppe schreiben – damit wir nichts vergessen! 🎀`,
      motivation: `Mädels, ab jetzt wird gefeiert!\nJede hat heute eine Aufgabe:\n🌸 Spaß haben\n🌸 Die Braut feiern\n🌸 Zusammenbleiben\n🌸 Und: Wer meckert, kauft 'ne Runde Prosecco 🥂`,
      payment: `Kleines Finanz-Update:\nBitte überweist bis {{deadline}} auf folgendes Konto/Link:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nOhne Moos = kein Los. Wer nicht zahlt, muss Karaoke singen! 🎤`,
      date_locked: `Der Termin steht!\n\n📅 {{locked_date}}\n\nBitte alle vormerken und keine Ausreden mehr! 🎉💕`,
    },
    birthday: {
      kickoff: `Hey Leute! 🎉\n\nWir planen eine Überraschungsfeier für {{honoree_name}}! 🎂\n\nDamit wir das perfekte Event organisieren können, brauchen wir eure Hilfe!\n\n👉 Bitte füllt diese kurze Umfrage aus:\n{{link}}\n\n🔑 Zugangscode: {{code}}\n\nDie Umfrage dauert nur 2-3 Minuten und hilft uns bei:\n📅 Terminfindung\n💰 Budget-Planung\n🎯 Aktivitäten-Auswahl\n📍 Location-Wahl\n\nJe schneller alle antworten, desto schneller können wir loslegen! 🚀`,
      budget_poll: `Damit keiner am Ende pleite ist – was darf die Feier kosten (pro Person)?\n\n🔘 bis 50 € – Klein aber fein\n🔘 50–100 € – Realistisch\n🔘 100 €+ – Richtig feiern\n\nBitte ehrlich stimmen!`,
      accommodation: `Falls wir länger feiern oder weiter weg fahren – wo übernachten?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Bei jemandem zu Hause\n🔘 Keine Übernachtung nötig`,
      packing_list: `Bitte mitbringen:\n✅ Geschenk für {{honoree_name}}\n✅ Gute Laune\n✅ Bequeme Kleidung\n✅ Evtl. Handyladegerät\n✅ Bargeld für spontane Ausgaben`,
      travel_info: `Anreiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt mit wem? Bitte in die Gruppe schreiben:\n„Fahre selbst + Platz für X Leute"\noder\n„Suche Mitfahrgelegenheit aus [Ort]"`,
      countdown: `Nur noch 3 Tage bis zur Feier für {{honoree_name}}! 🎂\n\n✅ Geschenk besorgt?\n✅ Outfit klar?\n✅ Treffpunkt notiert?\n\nWir sehen uns bald! 🎉`,
      gifts: `Wer bringt was für {{honoree_name}}?\n🎁 Hauptgeschenk (Sammelaktion?)\n🎁 Karte unterschreiben\n🎁 Deko mitbringen\n\nBitte kurz in die Gruppe schreiben, damit wir koordiniert sind!`,
      motivation: `Heute feiern wir {{honoree_name}}!\n\n🎈 Spaß haben\n🎈 Das Geburtstagskind feiern\n🎈 Gute Stimmung verbreiten\n\nLos geht's! 🎉`,
      payment: `Kurzes Finanz-Update:\nBitte überweist bis {{deadline}} für Geschenk/Location/Essen:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nDanke euch! 🙏`,
      date_locked: `Der Termin steht!\n\n📅 {{locked_date}}\n\nBitte alle vormerken – {{honoree_name}} wird sich riesig freuen! 🎂🎉`,
    },
    trip: {
      kickoff: `Hey Leute! 🌍\n\nWir planen einen gemeinsamen Trip! ✈️\n\nDamit wir das perfekte Abenteuer organisieren können, brauchen wir eure Hilfe!\n\n👉 Bitte füllt diese kurze Umfrage aus:\n{{link}}\n\n🔑 Zugangscode: {{code}}\n\nDie Umfrage dauert nur 2-3 Minuten und hilft uns bei:\n📅 Terminfindung\n💰 Budget-Planung\n🎯 Aktivitäten-Auswahl\n📍 Reiseziel-Wahl\n\nJe schneller alle antworten, desto schneller können wir buchen! 🚀`,
      budget_poll: `Damit wir planen können – was darf der Trip kosten (pro Person, inkl. Unterkunft)?\n\n🔘 bis 200 € – Budget-Reise\n🔘 200–500 € – Mittelklasse\n🔘 500–1000 € – Komfortabel\n🔘 1000 €+ – Luxus\n\nBitte ehrlich stimmen!`,
      accommodation: `Wo übernachten wir am liebsten?\n\n🔘 Hotel (bequem)\n🔘 Airbnb (gemeinsame Unterkunft)\n🔘 Hostel (günstig & social)\n🔘 Camping (Abenteuer)\n\nSchreibt eure Präferenz!`,
      packing_list: `Packliste für den Trip:\n✅ Ausweis/Reisepass\n✅ Handy & Ladegerät\n✅ Powerbank\n✅ Wetterangepasste Kleidung\n✅ Bequeme Schuhe\n✅ Kamera\n✅ Gute Laune 🌟`,
      travel_info: `Reiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt/fliegt mit wem?\nBitte in die Gruppe schreiben:\n„Fahre selbst + Platz für X Leute"\noder\n„Suche Reisepartner von [Ort]"`,
      countdown: `Nur noch 3 Tage bis zum Trip! 🌍\n\n✅ Koffer gepackt?\n✅ Tickets gesichert?\n✅ Reisedokumente bereit?\n✅ Unterkunft bestätigt?\n\nDer Countdown läuft! ✈️`,
      gifts: `Organisatorisches für die Gruppe:\n📋 Wer übernimmt welche Buchung?\n📋 Gemeinsame Kasse einrichten?\n📋 Notfallnummern austauschen\n\nBitte kurz abstimmen!`,
      motivation: `Es geht los! 🌍✈️\n\nWas wir heute vorhaben:\n🗺️ Abenteuer erleben\n🗺️ Neue Orte entdecken\n🗺️ Gemeinsam Spaß haben\n\nAuf geht's! 🚀`,
      payment: `Finanz-Update für den Trip:\nBitte überweist bis {{deadline}} auf folgendes Konto/Link:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nDanke fürs prompte Überweisen! 🙏`,
      date_locked: `Der Reisetermin steht!\n\n📅 {{locked_date}}\n\nBitte alle Urlaub nehmen und Tickets buchen! ✈️🌍`,
    },
    other: {
      kickoff: `Hey zusammen! 🎉\n\nWir planen ein gemeinsames Event!\n\nDamit wir das perfekt organisieren können, brauchen wir eure Hilfe!\n\n👉 Bitte füllt diese kurze Umfrage aus:\n{{link}}\n\n🔑 Zugangscode: {{code}}\n\nDie Umfrage dauert nur 2-3 Minuten und hilft uns bei:\n📅 Terminfindung\n💰 Budget-Planung\n🎯 Aktivitäten-Auswahl\n📍 Location-Wahl\n\nJe schneller alle antworten, desto schneller können wir loslegen! 🚀`,
      budget_poll: `Was darf das Event kosten (pro Person)?\n\n🔘 bis 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nBitte ehrlich stimmen!`,
      accommodation: `Brauchen wir eine Übernachtung?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Keine Übernachtung nötig`,
      packing_list: `Bitte mitbringen:\n✅ Gute Laune\n✅ Handy & Ladegerät\n✅ Bargeld\n✅ Bequeme Kleidung`,
      travel_info: `Anreiseplan:\nTreffpunkt: {{meeting_point}}\nUhrzeit: {{meeting_time}}\n\nWer fährt mit wem? Bitte in die Gruppe schreiben!`,
      countdown: `Nur noch 3 Tage! 🎉\n\n✅ Alles vorbereitet?\n✅ Treffpunkt klar?\n\nWir sehen uns bald!`,
      gifts: `Organisatorisches:\n📋 Wer bringt was mit?\n📋 Wer übernimmt was?\n\nBitte kurz abstimmen!`,
      motivation: `Heute ist es soweit! 🎉\n\nEinfach Spaß haben und die Zeit genießen!`,
      payment: `Finanz-Update:\nBitte überweist bis {{deadline}}:\n{{payment_link}}\n\nBetrag: {{amount}}\n\nDanke! 🙏`,
      date_locked: `Der Termin steht!\n\n📅 {{locked_date}}\n\nBitte alle vormerken! 🎉`,
    },
  },
  en: {
    bachelor: {
      kickoff: `Hey guys! 🎉\n\nIt's time to plan the bachelor party for {{honoree_name}}! 🥳\n\nTo organize the perfect event, we need your help!\n\n👉 Please fill out this quick survey:\n{{link}}\n\n🔑 Access code: {{code}}\n\nThe survey takes only 2-3 minutes and helps us with:\n📅 Finding the right date\n💰 Budget planning\n🎯 Activity selection\n📍 Destination choice\n\nThe faster everyone responds, the faster we can get started! 🚀`,
      budget_poll: `Guys, so nobody goes broke – what should the party cost per person?\n\n🔘 up to €100 – Budget team\n🔘 €150–200 – Realistic team\n🔘 €250+ – Go big team\n\nPlease vote honestly!`,
      accommodation: `We need a place to sleep – or at least a floor.\n\nPreference:\n🔘 Hotel (comfortable, pricier)\n🔘 Airbnb (more space & chaos)\n🔘 Hostel (less comfort, more adventure)\n\nFlexible? Just write "I'm easy"`,
      packing_list: `Guys, please pack:\n✅ ID\n✅ Cash\n✅ Phone & charger\n✅ Headache pills (you know why)\n✅ Change of clothes\n✅ Good vibes`,
      travel_info: `Travel plan:\nMeeting point: {{meeting_point}}\nTime: {{meeting_time}}\n\nWho's riding with whom? Please share in the group:\n"Driving + space for X people"\nor\n"Need a ride from [location]"`,
      countdown: `Guys!\n3 days until the bachelor party for {{honoree_name}}. Quick checklist:\n✅ Money transferred\n✅ Outfit ready\n✅ Room assignments clear\n✅ Group chat muted – things might get wild\n\nCountdown is on!`,
      gifts: `Who's bringing what for {{honoree_name}}?\n🔹 An embarrassing task\n🔹 A memorable gift\n🔹 Something from his past\n\nPlease share in the group! 😅`,
      motivation: `Guys, time to party!\nToday's mission:\n🔸 Have fun\n🔸 Celebrate the groom\n🔸 Don't get lost\n🔸 Complainers take a shot 🍻`,
      payment: `Quick finance update:\nPlease transfer by {{deadline}} to:\n{{payment_link}}\n\nAmount: {{amount}}\n\nNo money = no fun. Non-payers get karaoke duty! 😬`,
      date_locked: `The date is set!\n\n📅 {{locked_date}}\n\nMark your calendars – no excuses! 🎉`,
    },
    bachelorette: {
      kickoff: `Hey ladies! 🎉\n\nIt's time to plan the bachelorette party for {{honoree_name}}! 👰✨\n\nTo organize the perfect event, we need your help!\n\n👉 Please fill out this quick survey:\n{{link}}\n\n🔑 Access code: {{code}}\n\nThe survey takes only 2-3 minutes! 💕`,
      budget_poll: `Ladies, what should the party cost per person?\n\n🔘 up to €100 – Budget-friendly\n🔘 €150–200 – Realistic\n🔘 €250+ – Go all out\n\nPlease vote honestly! 💖`,
      accommodation: `Where should we stay?\n\n🔘 Hotel (comfortable)\n🔘 Airbnb (girls night vibes)\n🔘 Hostel (adventure mode)\n\nFlexible? Let us know! 💅`,
      packing_list: `Ladies, please pack:\n✅ ID\n✅ Cash\n✅ Phone & charger\n✅ Party outfit\n✅ Comfy shoes (for later)\n✅ Good vibes 💄✨`,
      travel_info: `Travel plan:\nMeeting point: {{meeting_point}}\nTime: {{meeting_time}}\n\nWho's riding with whom? Share in the group! 🚗`,
      countdown: `Ladies!\n3 days until the bachelorette for {{honoree_name}}!\n✅ Money transferred\n✅ Outfit ready\n✅ Accessories for the bride packed\n\nCountdown is on! 💍✨`,
      gifts: `Who's bringing what for {{honoree_name}}?\n💝 Funny accessories\n💝 Memorable gift\n💝 Fun challenges\n\nShare in the group! 🎀`,
      motivation: `Ladies, let's celebrate!\n🌸 Have fun\n🌸 Celebrate the bride\n🌸 Stick together\n🌸 Complainers buy prosecco 🥂`,
      payment: `Finance update:\nPlease transfer by {{deadline}} to:\n{{payment_link}}\n\nAmount: {{amount}}\n\nNon-payers get karaoke! 🎤`,
      date_locked: `The date is set!\n\n📅 {{locked_date}}\n\nMark your calendars! 🎉💕`,
    },
    birthday: {
      kickoff: `Hey everyone! 🎉\n\nWe're planning a surprise party for {{honoree_name}}! 🎂\n\n👉 Please fill out this quick survey:\n{{link}}\n\n🔑 Access code: {{code}}\n\nThe survey takes only 2-3 minutes! 🚀`,
      budget_poll: `What should the party cost per person?\n\n🔘 up to €50\n🔘 €50–100\n🔘 €100+\n\nPlease vote honestly!`,
      accommodation: `Do we need overnight accommodation?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Someone's place\n🔘 Not needed`,
      packing_list: `Please bring:\n✅ Gift for {{honoree_name}}\n✅ Good vibes\n✅ Comfy clothes\n✅ Cash for extras`,
      travel_info: `Travel plan:\nMeeting point: {{meeting_point}}\nTime: {{meeting_time}}\n\nShare your travel plans in the group!`,
      countdown: `3 days until {{honoree_name}}'s party! 🎂\n✅ Gift ready?\n✅ Outfit picked?\n\nSee you soon! 🎉`,
      gifts: `Who's bringing what for {{honoree_name}}?\n🎁 Main gift (group collection?)\n🎁 Sign the card\n🎁 Bring decorations\n\nCoordinate in the group!`,
      motivation: `Today we celebrate {{honoree_name}}!\n\n🎈 Have fun\n🎈 Celebrate the birthday person\n🎈 Spread good vibes\n\nLet's go! 🎉`,
      payment: `Finance update:\nPlease transfer by {{deadline}}:\n{{payment_link}}\n\nAmount: {{amount}}\n\nThanks! 🙏`,
      date_locked: `The date is set!\n\n📅 {{locked_date}}\n\n{{honoree_name}} will be so happy! 🎂🎉`,
    },
    trip: {
      kickoff: `Hey everyone! 🌍\n\nWe're planning a group trip! ✈️\n\n👉 Please fill out this quick survey:\n{{link}}\n\n🔑 Access code: {{code}}\n\nThe survey takes only 2-3 minutes! 🚀`,
      budget_poll: `What should the trip cost per person (incl. accommodation)?\n\n🔘 up to €200 – Budget\n🔘 €200–500 – Mid-range\n🔘 €500–1000 – Comfortable\n🔘 €1000+ – Luxury\n\nVote honestly!`,
      accommodation: `Where should we stay?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Hostel\n🔘 Camping\n\nShare your preference!`,
      packing_list: `Packing list:\n✅ ID/Passport\n✅ Phone & charger\n✅ Power bank\n✅ Weather-appropriate clothes\n✅ Comfy shoes\n✅ Camera\n✅ Good vibes 🌟`,
      travel_info: `Travel plan:\nMeeting point: {{meeting_point}}\nTime: {{meeting_time}}\n\nWho's traveling with whom? Share in the group!`,
      countdown: `3 days until our trip! 🌍\n\n✅ Packed?\n✅ Tickets ready?\n✅ Documents set?\n\nCountdown is on! ✈️`,
      gifts: `Organizational stuff:\n📋 Who's handling which booking?\n📋 Set up a group fund?\n📋 Share emergency contacts\n\nPlease coordinate!`,
      motivation: `Let's go! 🌍✈️\n\n🗺️ Experience adventures\n🗺️ Discover new places\n🗺️ Have fun together\n\nHere we go! 🚀`,
      payment: `Trip finance update:\nPlease transfer by {{deadline}}:\n{{payment_link}}\n\nAmount: {{amount}}\n\nThanks! 🙏`,
      date_locked: `The travel date is set!\n\n📅 {{locked_date}}\n\nBook your time off and tickets! ✈️🌍`,
    },
    other: {
      kickoff: `Hey everyone! 🎉\n\nWe're planning an event together!\n\n👉 Please fill out this quick survey:\n{{link}}\n\n🔑 Access code: {{code}}\n\nThe survey takes only 2-3 minutes! 🚀`,
      budget_poll: `What should the event cost per person?\n\n🔘 up to €50\n🔘 €50–100\n🔘 €100–200\n🔘 €200+\n\nVote honestly!`,
      accommodation: `Do we need accommodation?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Not needed`,
      packing_list: `Please bring:\n✅ Good vibes\n✅ Phone & charger\n✅ Cash\n✅ Comfy clothes`,
      travel_info: `Travel plan:\nMeeting point: {{meeting_point}}\nTime: {{meeting_time}}\n\nShare in the group!`,
      countdown: `3 days to go! 🎉\n\n✅ Ready?\n✅ Meeting point clear?\n\nSee you soon!`,
      gifts: `Organizational stuff:\n📋 Who's bringing what?\n📋 Who's handling what?\n\nPlease coordinate!`,
      motivation: `Today's the day! 🎉\n\nHave fun and enjoy!`,
      payment: `Finance update:\nPlease transfer by {{deadline}}:\n{{payment_link}}\n\nAmount: {{amount}}\n\nThanks! 🙏`,
      date_locked: `The date is set!\n\n📅 {{locked_date}}\n\nMark your calendars! 🎉`,
    },
  },
};

function getMessageTemplates(
  eventId: string,
  eventType: string,
  locale: string,
  honoreeName: string
): MessageTemplateConfig[] {
  // Fallback to 'en' if locale not found, and to 'other' if event type not found
  const localeTemplates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES['en'] || MESSAGE_TEMPLATES['de'];
  const eventTemplates = localeTemplates[eventType as EventType] || localeTemplates['other'];
  
  const templateTitles: Record<string, { title: string; emoji: string }> = {
    kickoff: { title: 'Kickoff Message', emoji: '🎉' },
    budget_poll: { title: 'Budget Poll', emoji: '💸' },
    accommodation: { title: 'Accommodation Poll', emoji: '🏨' },
    packing_list: { title: 'Packing List', emoji: '🧳' },
    travel_info: { title: 'Travel Info', emoji: '🗺️' },
    countdown: { title: 'Countdown Reminder', emoji: '📢' },
    gifts: { title: 'Gift Coordination', emoji: '🎁' },
    motivation: { title: 'Motivation', emoji: '🎤' },
    payment: { title: 'Payment Request', emoji: '🧾' },
    date_locked: { title: 'Date Confirmed', emoji: '✅' },
  };

  const templates: MessageTemplateConfig[] = [];
  let sortOrder = 1;

  for (const [key, content] of Object.entries(eventTemplates)) {
    const info = templateTitles[key];
    if (info && content) {
      templates.push({
        event_id: eventId,
        template_key: key,
        title: info.title,
        emoji_prefix: info.emoji,
        content_template: content.replace(/\{\{honoree_name\}\}/g, honoreeName),
        sort_order: sortOrder++,
        locale: locale,
      });
    }
  }

  return templates;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user from Authorization header
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
        userEmail = user.email || null;
        console.log("Authenticated user:", userId);
      }
    }

    const body = await req.json();
    const {
      name,
      honoree_name,
      event_type = "bachelor",
      event_date,
      description,
      date_blocks,
      no_gos,
      focus_points,
      organizer_name,
      organizer_email,
      participants = [],
      locale = "de",
      currency = "EUR",
      timezone = "Europe/Berlin",
      template_id,
      custom_template,
    } = body;

    console.log("Creating event:", { name, honoree_name, event_type, template_id });

    // Generate unique slug and access code
    const slug = generateSlug(name);
    const access_code = generateAccessCode();

    // Build survey settings - start with defaults
    let surveySettings = {
      ...DEFAULT_SETTINGS,
      date_blocks: date_blocks || {},
      no_gos: no_gos || [],
      focus_points: focus_points || [],
    };

    // Apply template settings if template_id is provided
    if (template_id && TEMPLATES[template_id]) {
      const template = TEMPLATES[template_id];
      console.log("Applying template:", template_id);
      
      surveySettings = {
        ...surveySettings,
        budget_options: template.budget_options || surveySettings.budget_options,
        destination_options: template.destination_options || surveySettings.destination_options,
        activity_options: template.activity_options || surveySettings.activity_options,
        duration_options: template.duration_options || surveySettings.duration_options,
      };
    }

    // Apply custom (AI-generated) template if provided - this overrides template settings
    if (custom_template) {
      console.log("Applying custom AI template");
      surveySettings = {
        ...surveySettings,
        ...(custom_template.budget_options && { budget_options: custom_template.budget_options }),
        ...(custom_template.destination_options && { destination_options: custom_template.destination_options }),
        ...(custom_template.activity_options && { activity_options: custom_template.activity_options }),
        ...(custom_template.duration_options && { duration_options: custom_template.duration_options }),
        ...(custom_template.travel_options && { travel_options: custom_template.travel_options }),
        ...(custom_template.fitness_options && { fitness_options: custom_template.fitness_options }),
        ...(custom_template.alcohol_options && { alcohol_options: custom_template.alcohol_options }),
      };
    }

    // Create event with created_by set to authenticated user
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        name,
        honoree_name,
        event_type,
        event_date,
        description,
        slug,
        access_code,
        locale,
        currency,
        timezone,
        status: "planning",
        settings: surveySettings,
        created_by: userId,
        theme: {
          primary_color: "#8B5CF6",
          accent_color: "#06B6D4",
        },
      })
      .select()
      .single();

    if (eventError) {
      console.error("Error creating event:", eventError);
      throw new Error(`Failed to create event: ${eventError.message}`);
    }

    console.log("Event created:", event.id, "with template:", template_id || "none");

    // Add organizer as first participant with user_id
    if (organizer_name) {
      const { error: organizerError } = await supabase
        .from("participants")
        .insert({
          event_id: event.id,
          name: organizer_name,
          email: organizer_email || userEmail,
          role: "organizer",
          status: "confirmed",
          user_id: userId,
          can_access_dashboard: true,
          dashboard_permissions: {
            can_view_responses: true,
            can_add_expenses: true,
            can_view_all_expenses: true,
            can_edit_settings: true,
          },
        });

      if (organizerError) {
        console.error("Error adding organizer:", organizerError);
      }
    }

    // Add other participants
    if (participants.length > 0) {
      const participantRecords = participants.map((p: { name: string; email?: string }) => ({
        event_id: event.id,
        name: p.name,
        email: p.email,
        role: "guest",
        status: "invited",
      }));

      const { error: participantsError } = await supabase
        .from("participants")
        .insert(participantRecords);

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
      }
    }

    // Create event-type specific message templates
    const messageTemplates = getMessageTemplates(event.id, event_type, locale, honoree_name);

    const { error: templatesError } = await supabase
      .from("message_templates")
      .insert(messageTemplates);

    if (templatesError) {
      console.error("Error creating templates:", templatesError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: event.id,
          slug: event.slug,
          access_code: event.access_code,
          name: event.name,
          honoree_name: event.honoree_name,
        },
        share_link: `${req.headers.get("origin")}/e/${event.slug}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-event:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
