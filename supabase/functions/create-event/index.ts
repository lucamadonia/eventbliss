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
  fr: {
    bachelor: {
      kickoff: `Salut les gars ! 🎉\n\nC'est parti - on organise l'enterrement de vie de garçon de {{honoree_name}} ! 🥳\n\nPour organiser l'événement parfait, on a besoin de votre aide !\n\n👉 Merci de remplir ce court sondage :\n{{link}}\n\n🔑 Code d'accès : {{code}}\n\nLe sondage ne prend que 2-3 minutes ! 🚀`,
      budget_poll: `Les gars, pour que personne ne soit ruiné – combien par personne ?\n\n🔘 jusqu'à 100 € – Économe\n🔘 150–200 € – Réaliste\n🔘 250 €+ – On se fait plaisir\n\nVotez honnêtement !`,
      accommodation: `Il nous faut un lit – ou au moins un sol.\n\n🔘 Hôtel (confortable)\n🔘 Airbnb (plus d'espace)\n🔘 Auberge (aventure)\n\nFlexible ? Dites-le nous !`,
      packing_list: `Les gars, à mettre dans le sac :\n✅ Pièce d'identité\n✅ Argent liquide\n✅ Téléphone & chargeur\n✅ Aspirine\n✅ Vêtement de rechange\n✅ Bonne humeur`,
      travel_info: `Plan de voyage :\nPoint de RDV : {{meeting_point}}\nHeure : {{meeting_time}}\n\nQui voyage avec qui ? Partagez dans le groupe !`,
      countdown: `Les gars !\nPlus que 3 jours jusqu'à l'EVG de {{honoree_name}}. Checklist :\n✅ Argent transféré\n✅ Tenue prête\n✅ Chambres attribuées\n\nLe compte à rebours est lancé !`,
      gifts: `Qui apporte quoi pour {{honoree_name}} ?\n🔹 Un défi embarrassant\n🔹 Un cadeau mémorable\n\nPartagez dans le groupe ! 😅`,
      motivation: `Les gars, c'est parti pour la fête !\n🔸 S'amuser\n🔸 Célébrer le futur marié\n🔸 Ne pas se perdre\n🔸 Celui qui râle boit un shot 🍻`,
      payment: `Mise à jour finances :\nMerci de transférer avant le {{deadline}} à :\n{{payment_link}}\n\nMontant : {{amount}}\n\nPas d'argent = pas de fun ! 😬`,
      date_locked: `La date est fixée !\n\n📅 {{locked_date}}\n\nNotez dans vos agendas ! 🎉`,
    },
    bachelorette: {
      kickoff: `Salut les filles ! 🎉\n\nC'est parti - on organise l'EVJF de {{honoree_name}} ! 👰✨\n\n👉 Merci de remplir ce court sondage :\n{{link}}\n\n🔑 Code d'accès : {{code}}\n\nÇa ne prend que 2-3 minutes ! 💕`,
      budget_poll: `Les filles, combien par personne ?\n\n🔘 jusqu'à 100 € – Économe\n🔘 150–200 € – Réaliste\n🔘 250 €+ – On se fait plaisir\n\nVotez honnêtement ! 💖`,
      accommodation: `Où dormir ?\n\n🔘 Hôtel (confortable)\n🔘 Airbnb (soirée pyjama)\n🔘 Auberge (aventure)\n\nFlexible ? Dites-le nous ! 💅`,
      packing_list: `Les filles, à mettre dans le sac :\n✅ Pièce d'identité\n✅ Argent liquide\n✅ Téléphone & chargeur\n✅ Tenue de soirée\n✅ Chaussures confortables\n✅ Bonne humeur 💄✨`,
      travel_info: `Plan de voyage :\nPoint de RDV : {{meeting_point}}\nHeure : {{meeting_time}}\n\nQui voyage avec qui ? Partagez dans le groupe ! 🚗`,
      countdown: `Les filles !\nPlus que 3 jours jusqu'à l'EVJF de {{honoree_name}} !\n✅ Argent transféré\n✅ Tenue prête\n✅ Accessoires pour la mariée\n\nLe compte à rebours est lancé ! 💍✨`,
      gifts: `Qui apporte quoi pour {{honoree_name}} ?\n💝 Un accessoire drôle\n💝 Un cadeau mémorable\n💝 Un défi amusant\n\nPartagez dans le groupe ! 🎀`,
      motivation: `Les filles, c'est la fête !\n🌸 S'amuser\n🌸 Célébrer la mariée\n🌸 Rester ensemble\n🌸 Celle qui râle paie le prosecco 🥂`,
      payment: `Mise à jour finances :\nMerci de transférer avant le {{deadline}} à :\n{{payment_link}}\n\nMontant : {{amount}}\n\nLes mauvais payeurs font du karaoké ! 🎤`,
      date_locked: `La date est fixée !\n\n📅 {{locked_date}}\n\nNotez dans vos agendas ! 🎉💕`,
    },
    birthday: {
      kickoff: `Salut tout le monde ! 🎉\n\nOn organise une fête surprise pour {{honoree_name}} ! 🎂\n\n👉 Merci de remplir ce court sondage :\n{{link}}\n\n🔑 Code d'accès : {{code}}\n\nÇa ne prend que 2-3 minutes ! 🚀`,
      budget_poll: `Combien par personne pour la fête ?\n\n🔘 jusqu'à 50 €\n🔘 50–100 €\n🔘 100 €+\n\nVotez honnêtement !`,
      accommodation: `Besoin d'hébergement ?\n\n🔘 Hôtel\n🔘 Airbnb\n🔘 Chez quelqu'un\n🔘 Pas nécessaire`,
      packing_list: `Merci d'apporter :\n✅ Cadeau pour {{honoree_name}}\n✅ Bonne humeur\n✅ Tenue confortable\n✅ Chargeur de téléphone`,
      travel_info: `Plan de voyage :\nPoint de RDV : {{meeting_point}}\nHeure : {{meeting_time}}\n\nPartagez vos plans dans le groupe !`,
      countdown: `Plus que 3 jours avant la fête de {{honoree_name}} ! 🎂\n\n✅ Cadeau prêt ?\n✅ Tenue choisie ?\n\nÀ bientôt ! 🎉`,
      gifts: `Qui apporte quoi pour {{honoree_name}} ?\n🎁 Cadeau principal (cagnotte ?)\n🎁 Carte à signer\n🎁 Décorations\n\nCoordonnez-vous dans le groupe !`,
      motivation: `Aujourd'hui on fête {{honoree_name}} !\n\n🎈 S'amuser\n🎈 Fêter l'anniversaire\n🎈 Bonne ambiance\n\nC'est parti ! 🎉`,
      payment: `Mise à jour finances :\nMerci de transférer avant le {{deadline}} :\n{{payment_link}}\n\nMontant : {{amount}}\n\nMerci ! 🙏`,
      date_locked: `La date est fixée !\n\n📅 {{locked_date}}\n\n{{honoree_name}} va être ravi(e) ! 🎂🎉`,
    },
    trip: {
      kickoff: `Salut tout le monde ! 🌍\n\nOn organise un voyage ensemble ! ✈️\n\n👉 Merci de remplir ce court sondage :\n{{link}}\n\n🔑 Code d'accès : {{code}}\n\nÇa ne prend que 2-3 minutes ! 🚀`,
      budget_poll: `Combien par personne (hébergement inclus) ?\n\n🔘 jusqu'à 200 € – Budget\n🔘 200–500 € – Intermédiaire\n🔘 500–1000 € – Confortable\n🔘 1000 €+ – Luxe\n\nVotez honnêtement !`,
      accommodation: `Où dormir ?\n\n🔘 Hôtel\n🔘 Airbnb\n🔘 Auberge\n🔘 Camping\n\nPartagez vos préférences !`,
      packing_list: `Liste de voyage :\n✅ Pièce d'identité/Passeport\n✅ Téléphone & chargeur\n✅ Batterie externe\n✅ Vêtements adaptés\n✅ Chaussures confortables\n✅ Appareil photo\n✅ Bonne humeur 🌟`,
      travel_info: `Plan de voyage :\nPoint de RDV : {{meeting_point}}\nHeure : {{meeting_time}}\n\nQui voyage avec qui ? Partagez dans le groupe !`,
      countdown: `Plus que 3 jours avant le voyage ! 🌍\n\n✅ Valise prête ?\n✅ Billets ?\n✅ Documents de voyage ?\n\nLe compte à rebours est lancé ! ✈️`,
      gifts: `Organisation :\n📋 Qui s'occupe de quoi ?\n📋 Caisse commune ?\n📋 Numéros d'urgence\n\nCoordonnez-vous !`,
      motivation: `C'est parti ! 🌍✈️\n\n🗺️ Vivre des aventures\n🗺️ Découvrir de nouveaux endroits\n🗺️ S'amuser ensemble\n\nEn route ! 🚀`,
      payment: `Mise à jour finances :\nMerci de transférer avant le {{deadline}} :\n{{payment_link}}\n\nMontant : {{amount}}\n\nMerci ! 🙏`,
      date_locked: `Les dates du voyage sont fixées !\n\n📅 {{locked_date}}\n\nPrenez vos congés et réservez vos billets ! ✈️🌍`,
    },
    other: {
      kickoff: `Salut tout le monde ! 🎉\n\nOn organise un événement ensemble !\n\n👉 Merci de remplir ce court sondage :\n{{link}}\n\n🔑 Code d'accès : {{code}}\n\nÇa ne prend que 2-3 minutes ! 🚀`,
      budget_poll: `Combien par personne ?\n\n🔘 jusqu'à 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nVotez honnêtement !`,
      accommodation: `Besoin d'hébergement ?\n\n🔘 Hôtel\n🔘 Airbnb\n🔘 Pas nécessaire`,
      packing_list: `Merci d'apporter :\n✅ Bonne humeur\n✅ Téléphone & chargeur\n✅ Argent liquide\n✅ Tenue confortable`,
      travel_info: `Plan :\nPoint de RDV : {{meeting_point}}\nHeure : {{meeting_time}}\n\nPartagez dans le groupe !`,
      countdown: `Plus que 3 jours ! 🎉\n\n✅ Tout est prêt ?\n✅ Point de RDV clair ?\n\nÀ bientôt !`,
      gifts: `Organisation :\n📋 Qui apporte quoi ?\n📋 Qui fait quoi ?\n\nCoordonnez-vous !`,
      motivation: `C'est le jour J ! 🎉\n\nAmusez-vous et profitez !`,
      payment: `Mise à jour finances :\nMerci de transférer avant le {{deadline}} :\n{{payment_link}}\n\nMontant : {{amount}}\n\nMerci ! 🙏`,
      date_locked: `La date est fixée !\n\n📅 {{locked_date}}\n\nNotez dans vos agendas ! 🎉`,
    },
  },
  es: {
    bachelor: {
      kickoff: `¡Hola chicos! 🎉\n\n¡Es hora de planear la despedida de soltero de {{honoree_name}}! 🥳\n\n👉 Por favor completen esta encuesta:\n{{link}}\n\n🔑 Código de acceso: {{code}}\n\n¡Solo toma 2-3 minutos! 🚀`,
      budget_poll: `Chicos, ¿cuánto por persona?\n\n🔘 hasta 100 € – Económico\n🔘 150–200 € – Realista\n🔘 250 €+ – A lo grande\n\n¡Voten honestamente!`,
      accommodation: `Necesitamos donde dormir.\n\n🔘 Hotel (cómodo)\n🔘 Airbnb (más espacio)\n🔘 Hostal (aventura)\n\n¿Flexible? ¡Avísennos!`,
      packing_list: `Chicos, empacar:\n✅ ID\n✅ Efectivo\n✅ Teléfono y cargador\n✅ Pastillas para el dolor de cabeza\n✅ Ropa de cambio\n✅ Buena onda`,
      travel_info: `Plan de viaje:\nPunto de encuentro: {{meeting_point}}\nHora: {{meeting_time}}\n\n¿Quién va con quién? ¡Compartan en el grupo!`,
      countdown: `¡Chicos!\n3 días para la despedida de {{honoree_name}}.\n✅ Dinero transferido\n✅ Outfit listo\n✅ Habitaciones asignadas\n\n¡La cuenta regresiva comenzó!`,
      gifts: `¿Quién trae qué para {{honoree_name}}?\n🔹 Un reto vergonzoso\n🔹 Un regalo memorable\n\n¡Compartan en el grupo! 😅`,
      motivation: `¡Chicos, a celebrar!\n🔸 Divertirse\n🔸 Celebrar al novio\n🔸 No perderse\n🔸 El que se queja toma un shot 🍻`,
      payment: `Actualización de finanzas:\nTransferir antes del {{deadline}} a:\n{{payment_link}}\n\nMonto: {{amount}}\n\n¡Sin dinero no hay diversión! 😬`,
      date_locked: `¡La fecha está definida!\n\n📅 {{locked_date}}\n\n¡Márcenla en sus calendarios! 🎉`,
    },
    bachelorette: {
      kickoff: `¡Hola chicas! 🎉\n\n¡Es hora de planear la despedida de soltera de {{honoree_name}}! 👰✨\n\n👉 Por favor completen esta encuesta:\n{{link}}\n\n🔑 Código de acceso: {{code}}\n\n¡Solo toma 2-3 minutos! 💕`,
      budget_poll: `Chicas, ¿cuánto por persona?\n\n🔘 hasta 100 € – Económico\n🔘 150–200 € – Realista\n🔘 250 €+ – A lo grande\n\n¡Voten honestamente! 💖`,
      accommodation: `¿Dónde dormimos?\n\n🔘 Hotel (cómodo)\n🔘 Airbnb (noche de chicas)\n🔘 Hostal (aventura)\n\n¿Flexible? ¡Avísennos! 💅`,
      packing_list: `Chicas, empacar:\n✅ ID\n✅ Efectivo\n✅ Teléfono y cargador\n✅ Outfit de fiesta\n✅ Zapatos cómodos\n✅ Buena onda 💄✨`,
      travel_info: `Plan de viaje:\nPunto de encuentro: {{meeting_point}}\nHora: {{meeting_time}}\n\n¿Quién va con quién? ¡Compartan en el grupo! 🚗`,
      countdown: `¡Chicas!\n3 días para la despedida de {{honoree_name}}!\n✅ Dinero transferido\n✅ Outfit listo\n✅ Accesorios para la novia empacados\n\n¡La cuenta regresiva comenzó! 💍✨`,
      gifts: `¿Quién trae qué para {{honoree_name}}?\n💝 Un accesorio divertido\n💝 Un regalo memorable\n💝 Un reto gracioso\n\n¡Compartan en el grupo! 🎀`,
      motivation: `¡Chicas, a celebrar!\n🌸 Divertirse\n🌸 Celebrar a la novia\n🌸 Mantenerse juntas\n🌸 La que se queja paga el prosecco 🥂`,
      payment: `Actualización de finanzas:\nTransferir antes del {{deadline}} a:\n{{payment_link}}\n\nMonto: {{amount}}\n\n¡Los que no pagan hacen karaoke! 🎤`,
      date_locked: `¡La fecha está definida!\n\n📅 {{locked_date}}\n\n¡Márcenla en sus calendarios! 🎉💕`,
    },
    birthday: {
      kickoff: `¡Hola a todos! 🎉\n\n¡Estamos planeando una fiesta sorpresa para {{honoree_name}}! 🎂\n\n👉 Por favor completen esta encuesta:\n{{link}}\n\n🔑 Código de acceso: {{code}}\n\n¡Solo toma 2-3 minutos! 🚀`,
      budget_poll: `¿Cuánto por persona para la fiesta?\n\n🔘 hasta 50 €\n🔘 50–100 €\n🔘 100 €+\n\n¡Voten honestamente!`,
      accommodation: `¿Necesitamos alojamiento?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Casa de alguien\n🔘 No necesario`,
      packing_list: `Por favor traigan:\n✅ Regalo para {{honoree_name}}\n✅ Buena onda\n✅ Ropa cómoda\n✅ Cargador de teléfono`,
      travel_info: `Plan de viaje:\nPunto de encuentro: {{meeting_point}}\nHora: {{meeting_time}}\n\n¡Compartan sus planes en el grupo!`,
      countdown: `¡3 días para la fiesta de {{honoree_name}}! 🎂\n\n✅ ¿Regalo listo?\n✅ ¿Outfit elegido?\n\n¡Nos vemos pronto! 🎉`,
      gifts: `¿Quién trae qué para {{honoree_name}}?\n🎁 Regalo principal (¿colecta?)\n🎁 Firmar tarjeta\n🎁 Traer decoraciones\n\n¡Coordinen en el grupo!`,
      motivation: `¡Hoy celebramos a {{honoree_name}}!\n\n🎈 Divertirse\n🎈 Celebrar al cumpleañero\n🎈 Buen ambiente\n\n¡Vamos! 🎉`,
      payment: `Actualización de finanzas:\nTransferir antes del {{deadline}}:\n{{payment_link}}\n\nMonto: {{amount}}\n\n¡Gracias! 🙏`,
      date_locked: `¡La fecha está definida!\n\n📅 {{locked_date}}\n\n¡{{honoree_name}} estará muy feliz! 🎂🎉`,
    },
    trip: {
      kickoff: `¡Hola a todos! 🌍\n\n¡Estamos planeando un viaje juntos! ✈️\n\n👉 Por favor completen esta encuesta:\n{{link}}\n\n🔑 Código de acceso: {{code}}\n\n¡Solo toma 2-3 minutos! 🚀`,
      budget_poll: `¿Cuánto por persona (incluyendo alojamiento)?\n\n🔘 hasta 200 € – Económico\n🔘 200–500 € – Intermedio\n🔘 500–1000 € – Cómodo\n🔘 1000 €+ – Lujo\n\n¡Voten honestamente!`,
      accommodation: `¿Dónde dormimos?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Hostal\n🔘 Camping\n\n¡Compartan sus preferencias!`,
      packing_list: `Lista de equipaje:\n✅ ID/Pasaporte\n✅ Teléfono y cargador\n✅ Batería externa\n✅ Ropa adecuada\n✅ Zapatos cómodos\n✅ Cámara\n✅ Buena onda 🌟`,
      travel_info: `Plan de viaje:\nPunto de encuentro: {{meeting_point}}\nHora: {{meeting_time}}\n\n¿Quién viaja con quién? ¡Compartan en el grupo!`,
      countdown: `¡3 días para el viaje! 🌍\n\n✅ ¿Maleta lista?\n✅ ¿Boletos?\n✅ ¿Documentos?\n\n¡La cuenta regresiva comenzó! ✈️`,
      gifts: `Organización:\n📋 ¿Quién se encarga de qué?\n📋 ¿Fondo común?\n📋 Números de emergencia\n\n¡Coordinen!`,
      motivation: `¡Vámonos! 🌍✈️\n\n🗺️ Vivir aventuras\n🗺️ Descubrir nuevos lugares\n🗺️ Divertirnos juntos\n\n¡En marcha! 🚀`,
      payment: `Actualización de finanzas:\nTransferir antes del {{deadline}}:\n{{payment_link}}\n\nMonto: {{amount}}\n\n¡Gracias! 🙏`,
      date_locked: `¡Las fechas del viaje están definidas!\n\n📅 {{locked_date}}\n\n¡Pidan días libres y reserven boletos! ✈️🌍`,
    },
    other: {
      kickoff: `¡Hola a todos! 🎉\n\n¡Estamos planeando un evento juntos!\n\n👉 Por favor completen esta encuesta:\n{{link}}\n\n🔑 Código de acceso: {{code}}\n\n¡Solo toma 2-3 minutos! 🚀`,
      budget_poll: `¿Cuánto por persona?\n\n🔘 hasta 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\n¡Voten honestamente!`,
      accommodation: `¿Necesitamos alojamiento?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 No necesario`,
      packing_list: `Por favor traigan:\n✅ Buena onda\n✅ Teléfono y cargador\n✅ Efectivo\n✅ Ropa cómoda`,
      travel_info: `Plan:\nPunto de encuentro: {{meeting_point}}\nHora: {{meeting_time}}\n\n¡Compartan en el grupo!`,
      countdown: `¡Faltan 3 días! 🎉\n\n✅ ¿Todo listo?\n✅ ¿Punto de encuentro claro?\n\n¡Nos vemos!`,
      gifts: `Organización:\n📋 ¿Quién trae qué?\n📋 ¿Quién hace qué?\n\n¡Coordinen!`,
      motivation: `¡Es el día! 🎉\n\n¡Diviértanse y disfruten!`,
      payment: `Actualización de finanzas:\nTransferir antes del {{deadline}}:\n{{payment_link}}\n\nMonto: {{amount}}\n\n¡Gracias! 🙏`,
      date_locked: `¡La fecha está definida!\n\n📅 {{locked_date}}\n\n¡Márcenla en sus calendarios! 🎉`,
    },
  },
  it: {
    bachelor: {
      kickoff: `Ciao ragazzi! 🎉\n\nÈ ora di organizzare l'addio al celibato di {{honoree_name}}! 🥳\n\n👉 Per favore compilate questo breve sondaggio:\n{{link}}\n\n🔑 Codice di accesso: {{code}}\n\nCi vogliono solo 2-3 minuti! 🚀`,
      budget_poll: `Ragazzi, quanto a persona?\n\n🔘 fino a 100 € – Economico\n🔘 150–200 € – Realistico\n🔘 250 €+ – Alla grande\n\nVotate onestamente!`,
      accommodation: `Ci serve un posto dove dormire.\n\n🔘 Hotel (comodo)\n🔘 Airbnb (più spazio)\n🔘 Ostello (avventura)\n\nFlessibili? Fateci sapere!`,
      packing_list: `Ragazzi, da portare:\n✅ Documento\n✅ Contanti\n✅ Telefono e caricatore\n✅ Antidolorifici\n✅ Cambio vestiti\n✅ Buon umore`,
      travel_info: `Piano di viaggio:\nPunto d'incontro: {{meeting_point}}\nOra: {{meeting_time}}\n\nChi viaggia con chi? Condividete nel gruppo!`,
      countdown: `Ragazzi!\n3 giorni all'addio al celibato di {{honoree_name}}.\n✅ Soldi trasferiti\n✅ Outfit pronto\n✅ Stanze assegnate\n\nIl conto alla rovescia è iniziato!`,
      gifts: `Chi porta cosa per {{honoree_name}}?\n🔹 Una sfida imbarazzante\n🔹 Un regalo memorabile\n\nCondividete nel gruppo! 😅`,
      motivation: `Ragazzi, si festeggia!\n🔸 Divertirsi\n🔸 Festeggiare lo sposo\n🔸 Non perdersi\n🔸 Chi si lamenta beve uno shot 🍻`,
      payment: `Aggiornamento finanze:\nTrasferire entro il {{deadline}} a:\n{{payment_link}}\n\nImporto: {{amount}}\n\nSenza soldi niente festa! 😬`,
      date_locked: `La data è fissata!\n\n📅 {{locked_date}}\n\nSegnatevela! 🎉`,
    },
    bachelorette: {
      kickoff: `Ciao ragazze! 🎉\n\nÈ ora di organizzare l'addio al nubilato di {{honoree_name}}! 👰✨\n\n👉 Per favore compilate questo breve sondaggio:\n{{link}}\n\n🔑 Codice di accesso: {{code}}\n\nCi vogliono solo 2-3 minuti! 💕`,
      budget_poll: `Ragazze, quanto a persona?\n\n🔘 fino a 100 € – Economico\n🔘 150–200 € – Realistico\n🔘 250 €+ – Alla grande\n\nVotate onestamente! 💖`,
      accommodation: `Dove dormiamo?\n\n🔘 Hotel (comodo)\n🔘 Airbnb (serata tra ragazze)\n🔘 Ostello (avventura)\n\nFlessibili? Fateci sapere! 💅`,
      packing_list: `Ragazze, da portare:\n✅ Documento\n✅ Contanti\n✅ Telefono e caricatore\n✅ Outfit da festa\n✅ Scarpe comode\n✅ Buon umore 💄✨`,
      travel_info: `Piano di viaggio:\nPunto d'incontro: {{meeting_point}}\nOra: {{meeting_time}}\n\nChi viaggia con chi? Condividete nel gruppo! 🚗`,
      countdown: `Ragazze!\n3 giorni all'addio al nubilato di {{honoree_name}}!\n✅ Soldi trasferiti\n✅ Outfit pronto\n✅ Accessori per la sposa pronti\n\nIl conto alla rovescia è iniziato! 💍✨`,
      gifts: `Chi porta cosa per {{honoree_name}}?\n💝 Un accessorio divertente\n💝 Un regalo memorabile\n💝 Una sfida divertente\n\nCondividete nel gruppo! 🎀`,
      motivation: `Ragazze, si festeggia!\n🌸 Divertirsi\n🌸 Festeggiare la sposa\n🌸 Rimanere insieme\n🌸 Chi si lamenta paga il prosecco 🥂`,
      payment: `Aggiornamento finanze:\nTrasferire entro il {{deadline}} a:\n{{payment_link}}\n\nImporto: {{amount}}\n\nChi non paga fa karaoke! 🎤`,
      date_locked: `La data è fissata!\n\n📅 {{locked_date}}\n\nSegnatevela! 🎉💕`,
    },
    birthday: {
      kickoff: `Ciao a tutti! 🎉\n\nStiamo organizzando una festa a sorpresa per {{honoree_name}}! 🎂\n\n👉 Per favore compilate questo breve sondaggio:\n{{link}}\n\n🔑 Codice di accesso: {{code}}\n\nCi vogliono solo 2-3 minuti! 🚀`,
      budget_poll: `Quanto a persona per la festa?\n\n🔘 fino a 50 €\n🔘 50–100 €\n🔘 100 €+\n\nVotate onestamente!`,
      accommodation: `Serve alloggio?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 A casa di qualcuno\n🔘 Non necessario`,
      packing_list: `Da portare:\n✅ Regalo per {{honoree_name}}\n✅ Buon umore\n✅ Vestiti comodi\n✅ Caricatore telefono`,
      travel_info: `Piano di viaggio:\nPunto d'incontro: {{meeting_point}}\nOra: {{meeting_time}}\n\nCondividete i vostri piani nel gruppo!`,
      countdown: `3 giorni alla festa di {{honoree_name}}! 🎂\n\n✅ Regalo pronto?\n✅ Outfit scelto?\n\nCi vediamo presto! 🎉`,
      gifts: `Chi porta cosa per {{honoree_name}}?\n🎁 Regalo principale (colletta?)\n🎁 Firmare il biglietto\n🎁 Portare decorazioni\n\nCoordinatevi nel gruppo!`,
      motivation: `Oggi festeggiamo {{honoree_name}}!\n\n🎈 Divertirsi\n🎈 Festeggiare il festeggiato\n🎈 Buona atmosfera\n\nVia! 🎉`,
      payment: `Aggiornamento finanze:\nTrasferire entro il {{deadline}}:\n{{payment_link}}\n\nImporto: {{amount}}\n\nGrazie! 🙏`,
      date_locked: `La data è fissata!\n\n📅 {{locked_date}}\n\n{{honoree_name}} sarà felicissimo/a! 🎂🎉`,
    },
    trip: {
      kickoff: `Ciao a tutti! 🌍\n\nStiamo organizzando un viaggio insieme! ✈️\n\n👉 Per favore compilate questo breve sondaggio:\n{{link}}\n\n🔑 Codice di accesso: {{code}}\n\nCi vogliono solo 2-3 minuti! 🚀`,
      budget_poll: `Quanto a persona (incluso alloggio)?\n\n🔘 fino a 200 € – Economico\n🔘 200–500 € – Intermedio\n🔘 500–1000 € – Comodo\n🔘 1000 €+ – Lusso\n\nVotate onestamente!`,
      accommodation: `Dove dormiamo?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Ostello\n🔘 Campeggio\n\nCondividete le vostre preferenze!`,
      packing_list: `Lista bagagli:\n✅ Documento/Passaporto\n✅ Telefono e caricatore\n✅ Power bank\n✅ Vestiti adatti\n✅ Scarpe comode\n✅ Macchina fotografica\n✅ Buon umore 🌟`,
      travel_info: `Piano di viaggio:\nPunto d'incontro: {{meeting_point}}\nOra: {{meeting_time}}\n\nChi viaggia con chi? Condividete nel gruppo!`,
      countdown: `3 giorni al viaggio! 🌍\n\n✅ Valigia pronta?\n✅ Biglietti?\n✅ Documenti?\n\nIl conto alla rovescia è iniziato! ✈️`,
      gifts: `Organizzazione:\n📋 Chi si occupa di cosa?\n📋 Cassa comune?\n📋 Numeri di emergenza\n\nCoordinatevi!`,
      motivation: `Si parte! 🌍✈️\n\n🗺️ Vivere avventure\n🗺️ Scoprire nuovi posti\n🗺️ Divertirci insieme\n\nAndiamo! 🚀`,
      payment: `Aggiornamento finanze:\nTrasferire entro il {{deadline}}:\n{{payment_link}}\n\nImporto: {{amount}}\n\nGrazie! 🙏`,
      date_locked: `Le date del viaggio sono fissate!\n\n📅 {{locked_date}}\n\nPrendete ferie e prenotate i biglietti! ✈️🌍`,
    },
    other: {
      kickoff: `Ciao a tutti! 🎉\n\nStiamo organizzando un evento insieme!\n\n👉 Per favore compilate questo breve sondaggio:\n{{link}}\n\n🔑 Codice di accesso: {{code}}\n\nCi vogliono solo 2-3 minuti! 🚀`,
      budget_poll: `Quanto a persona?\n\n🔘 fino a 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nVotate onestamente!`,
      accommodation: `Serve alloggio?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Non necessario`,
      packing_list: `Da portare:\n✅ Buon umore\n✅ Telefono e caricatore\n✅ Contanti\n✅ Vestiti comodi`,
      travel_info: `Piano:\nPunto d'incontro: {{meeting_point}}\nOra: {{meeting_time}}\n\nCondividete nel gruppo!`,
      countdown: `Mancano 3 giorni! 🎉\n\n✅ Tutto pronto?\n✅ Punto d'incontro chiaro?\n\nCi vediamo!`,
      gifts: `Organizzazione:\n📋 Chi porta cosa?\n📋 Chi fa cosa?\n\nCoordinatevi!`,
      motivation: `È il giorno! 🎉\n\nDivertitevi e godetevela!`,
      payment: `Aggiornamento finanze:\nTrasferire entro il {{deadline}}:\n{{payment_link}}\n\nImporto: {{amount}}\n\nGrazie! 🙏`,
      date_locked: `La data è fissata!\n\n📅 {{locked_date}}\n\nSegnatevela! 🎉`,
    },
  },
  nl: {
    bachelor: {
      kickoff: `Hoi mannen! 🎉\n\nHet is tijd om het vrijgezellenfeest van {{honoree_name}} te plannen! 🥳\n\n👉 Vul alsjeblieft deze korte enquête in:\n{{link}}\n\n🔑 Toegangscode: {{code}}\n\nHet duurt maar 2-3 minuten! 🚀`,
      budget_poll: `Mannen, hoeveel per persoon?\n\n🔘 tot €100 – Budget\n🔘 €150–200 – Realistisch\n🔘 €250+ – Groot uitpakken\n\nStem eerlijk!`,
      accommodation: `We hebben een slaapplek nodig.\n\n🔘 Hotel (comfortabel)\n🔘 Airbnb (meer ruimte)\n🔘 Hostel (avontuur)\n\nFlexibel? Laat het weten!`,
      packing_list: `Mannen, inpakken:\n✅ ID\n✅ Contant geld\n✅ Telefoon & oplader\n✅ Pijnstillers\n✅ Extra kleren\n✅ Goede zin`,
      travel_info: `Reisplan:\nVerzamelpunt: {{meeting_point}}\nTijd: {{meeting_time}}\n\nWie rijdt met wie? Deel in de groep!`,
      countdown: `Mannen!\nNog 3 dagen tot het vrijgezellenfeest van {{honoree_name}}.\n✅ Geld overgemaakt\n✅ Outfit klaar\n✅ Kamers verdeeld\n\nDe aftelling is begonnen!`,
      gifts: `Wie brengt wat voor {{honoree_name}}?\n🔹 Een gênante opdracht\n🔹 Een memorabel cadeau\n\nDeel in de groep! 😅`,
      motivation: `Mannen, tijd om te feesten!\n🔸 Plezier maken\n🔸 De bruidegom vieren\n🔸 Niet verdwalen\n🔸 Klagers doen een shot 🍻`,
      payment: `Financiële update:\nMaak over vóór {{deadline}} naar:\n{{payment_link}}\n\nBedrag: {{amount}}\n\nGeen geld = geen feest! 😬`,
      date_locked: `De datum staat vast!\n\n📅 {{locked_date}}\n\nZet het in je agenda! 🎉`,
    },
    bachelorette: {
      kickoff: `Hoi meiden! 🎉\n\nHet is tijd om het vrijgezellenfeest van {{honoree_name}} te plannen! 👰✨\n\n👉 Vul alsjeblieft deze korte enquête in:\n{{link}}\n\n🔑 Toegangscode: {{code}}\n\nHet duurt maar 2-3 minuten! 💕`,
      budget_poll: `Meiden, hoeveel per persoon?\n\n🔘 tot €100 – Budget\n🔘 €150–200 – Realistisch\n🔘 €250+ – Groot uitpakken\n\nStem eerlijk! 💖`,
      accommodation: `Waar slapen we?\n\n🔘 Hotel (comfortabel)\n🔘 Airbnb (meidenfeest vibes)\n🔘 Hostel (avontuur)\n\nFlexibel? Laat het weten! 💅`,
      packing_list: `Meiden, inpakken:\n✅ ID\n✅ Contant geld\n✅ Telefoon & oplader\n✅ Feestoutfit\n✅ Comfortabele schoenen\n✅ Goede zin 💄✨`,
      travel_info: `Reisplan:\nVerzamelpunt: {{meeting_point}}\nTijd: {{meeting_time}}\n\nWie rijdt met wie? Deel in de groep! 🚗`,
      countdown: `Meiden!\nNog 3 dagen tot het vrijgezellenfeest van {{honoree_name}}!\n✅ Geld overgemaakt\n✅ Outfit klaar\n✅ Accessoires voor de bruid ingepakt\n\nDe aftelling is begonnen! 💍✨`,
      gifts: `Wie brengt wat voor {{honoree_name}}?\n💝 Een grappig accessoire\n💝 Een memorabel cadeau\n💝 Een leuke opdracht\n\nDeel in de groep! 🎀`,
      motivation: `Meiden, tijd om te feesten!\n🌸 Plezier maken\n🌸 De bruid vieren\n🌸 Bij elkaar blijven\n🌸 Klagers kopen prosecco 🥂`,
      payment: `Financiële update:\nMaak over vóór {{deadline}} naar:\n{{payment_link}}\n\nBedrag: {{amount}}\n\nNiet-betalers doen karaoke! 🎤`,
      date_locked: `De datum staat vast!\n\n📅 {{locked_date}}\n\nZet het in je agenda! 🎉💕`,
    },
    birthday: {
      kickoff: `Hoi allemaal! 🎉\n\nWe plannen een verrassingsfeest voor {{honoree_name}}! 🎂\n\n👉 Vul alsjeblieft deze korte enquête in:\n{{link}}\n\n🔑 Toegangscode: {{code}}\n\nHet duurt maar 2-3 minuten! 🚀`,
      budget_poll: `Hoeveel per persoon voor het feest?\n\n🔘 tot €50\n🔘 €50–100\n🔘 €100+\n\nStem eerlijk!`,
      accommodation: `Overnachting nodig?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Bij iemand thuis\n🔘 Niet nodig`,
      packing_list: `Meenemen:\n✅ Cadeau voor {{honoree_name}}\n✅ Goede zin\n✅ Comfortabele kleding\n✅ Telefoonoplader`,
      travel_info: `Reisplan:\nVerzamelpunt: {{meeting_point}}\nTijd: {{meeting_time}}\n\nDeel je plannen in de groep!`,
      countdown: `Nog 3 dagen tot het feest van {{honoree_name}}! 🎂\n\n✅ Cadeau klaar?\n✅ Outfit gekozen?\n\nTot snel! 🎉`,
      gifts: `Wie brengt wat voor {{honoree_name}}?\n🎁 Hoofdcadeau (gezamenlijk?)\n🎁 Kaart tekenen\n🎁 Decoratie meenemen\n\nCoördineer in de groep!`,
      motivation: `Vandaag vieren we {{honoree_name}}!\n\n🎈 Plezier maken\n🎈 De jarige vieren\n🎈 Goede sfeer\n\nLet's go! 🎉`,
      payment: `Financiële update:\nMaak over vóór {{deadline}}:\n{{payment_link}}\n\nBedrag: {{amount}}\n\nBedankt! 🙏`,
      date_locked: `De datum staat vast!\n\n📅 {{locked_date}}\n\n{{honoree_name}} gaat zo blij zijn! 🎂🎉`,
    },
    trip: {
      kickoff: `Hoi allemaal! 🌍\n\nWe plannen samen een reis! ✈️\n\n👉 Vul alsjeblieft deze korte enquête in:\n{{link}}\n\n🔑 Toegangscode: {{code}}\n\nHet duurt maar 2-3 minuten! 🚀`,
      budget_poll: `Hoeveel per persoon (incl. accommodatie)?\n\n🔘 tot €200 – Budget\n🔘 €200–500 – Midden\n🔘 €500–1000 – Comfortabel\n🔘 €1000+ – Luxe\n\nStem eerlijk!`,
      accommodation: `Waar slapen we?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Hostel\n🔘 Kamperen\n\nDeel je voorkeur!`,
      packing_list: `Paklijst:\n✅ ID/Paspoort\n✅ Telefoon & oplader\n✅ Powerbank\n✅ Geschikte kleding\n✅ Comfortabele schoenen\n✅ Camera\n✅ Goede zin 🌟`,
      travel_info: `Reisplan:\nVerzamelpunt: {{meeting_point}}\nTijd: {{meeting_time}}\n\nWie reist met wie? Deel in de groep!`,
      countdown: `Nog 3 dagen tot de reis! 🌍\n\n✅ Koffer ingepakt?\n✅ Tickets?\n✅ Documenten?\n\nDe aftelling is begonnen! ✈️`,
      gifts: `Organisatie:\n📋 Wie regelt wat?\n📋 Gezamenlijke pot?\n📋 Noodnummers uitwisselen\n\nCoördineer!`,
      motivation: `We gaan! 🌍✈️\n\n🗺️ Avonturen beleven\n🗺️ Nieuwe plekken ontdekken\n🗺️ Samen plezier maken\n\nLet's go! 🚀`,
      payment: `Financiële update:\nMaak over vóór {{deadline}}:\n{{payment_link}}\n\nBedrag: {{amount}}\n\nBedankt! 🙏`,
      date_locked: `De reisdata staan vast!\n\n📅 {{locked_date}}\n\nNeem vrij en boek tickets! ✈️🌍`,
    },
    other: {
      kickoff: `Hoi allemaal! 🎉\n\nWe plannen samen een evenement!\n\n👉 Vul alsjeblieft deze korte enquête in:\n{{link}}\n\n🔑 Toegangscode: {{code}}\n\nHet duurt maar 2-3 minuten! 🚀`,
      budget_poll: `Hoeveel per persoon?\n\n🔘 tot €50\n🔘 €50–100\n🔘 €100–200\n🔘 €200+\n\nStem eerlijk!`,
      accommodation: `Overnachting nodig?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Niet nodig`,
      packing_list: `Meenemen:\n✅ Goede zin\n✅ Telefoon & oplader\n✅ Contant geld\n✅ Comfortabele kleding`,
      travel_info: `Plan:\nVerzamelpunt: {{meeting_point}}\nTijd: {{meeting_time}}\n\nDeel in de groep!`,
      countdown: `Nog 3 dagen! 🎉\n\n✅ Alles klaar?\n✅ Verzamelpunt duidelijk?\n\nTot dan!`,
      gifts: `Organisatie:\n📋 Wie brengt wat?\n📋 Wie doet wat?\n\nCoördineer!`,
      motivation: `Het is zover! 🎉\n\nGeniet en heb plezier!`,
      payment: `Financiële update:\nMaak over vóór {{deadline}}:\n{{payment_link}}\n\nBedrag: {{amount}}\n\nBedankt! 🙏`,
      date_locked: `De datum staat vast!\n\n📅 {{locked_date}}\n\nZet het in je agenda! 🎉`,
    },
  },
  pl: {
    bachelor: {
      kickoff: `Hej chłopaki! 🎉\n\nCzas zaplanować wieczór kawalerski dla {{honoree_name}}! 🥳\n\n👉 Wypełnijcie tę krótką ankietę:\n{{link}}\n\n🔑 Kod dostępu: {{code}}\n\nTo zajmie tylko 2-3 minuty! 🚀`,
      budget_poll: `Chłopaki, ile na osobę?\n\n🔘 do 100 € – Budżetowo\n🔘 150–200 € – Realistycznie\n🔘 250 €+ – Na bogato\n\nGłosujcie szczerze!`,
      accommodation: `Potrzebujemy miejsca do spania.\n\n🔘 Hotel (wygodny)\n🔘 Airbnb (więcej miejsca)\n🔘 Hostel (przygoda)\n\nElastyczni? Dajcie znać!`,
      packing_list: `Chłopaki, spakować:\n✅ Dowód\n✅ Gotówkę\n✅ Telefon i ładowarkę\n✅ Tabletki na ból głowy\n✅ Zmianę ubrań\n✅ Dobry humor`,
      travel_info: `Plan podróży:\nMiejsce zbiórki: {{meeting_point}}\nGodzina: {{meeting_time}}\n\nKto jedzie z kim? Napiszcie w grupie!`,
      countdown: `Chłopaki!\n3 dni do wieczoru kawalerskiego {{honoree_name}}.\n✅ Pieniądze przelane\n✅ Outfit gotowy\n✅ Pokoje przydzielone\n\nOdliczanie rozpoczęte!`,
      gifts: `Kto przynosi co dla {{honoree_name}}?\n🔹 Żenujące wyzwanie\n🔹 Pamiątkowy prezent\n\nNapiszcie w grupie! 😅`,
      motivation: `Chłopaki, czas na imprezę!\n🔸 Bawić się\n🔸 Świętować z panem młodym\n🔸 Nie zgubić się\n🔸 Kto marudzi, pije shota 🍻`,
      payment: `Aktualizacja finansów:\nPrzelej do {{deadline}} na:\n{{payment_link}}\n\nKwota: {{amount}}\n\nBez kasy nie ma zabawy! 😬`,
      date_locked: `Data ustalona!\n\n📅 {{locked_date}}\n\nZapiszcie w kalendarzach! 🎉`,
    },
    bachelorette: {
      kickoff: `Hej dziewczyny! 🎉\n\nCzas zaplanować wieczór panieński dla {{honoree_name}}! 👰✨\n\n👉 Wypełnijcie tę krótką ankietę:\n{{link}}\n\n🔑 Kod dostępu: {{code}}\n\nTo zajmie tylko 2-3 minuty! 💕`,
      budget_poll: `Dziewczyny, ile na osobę?\n\n🔘 do 100 € – Budżetowo\n🔘 150–200 € – Realistycznie\n🔘 250 €+ – Na bogato\n\nGłosujcie szczerze! 💖`,
      accommodation: `Gdzie śpimy?\n\n🔘 Hotel (wygodny)\n🔘 Airbnb (dziewczyńska noc)\n🔘 Hostel (przygoda)\n\nElastyczne? Dajcie znać! 💅`,
      packing_list: `Dziewczyny, spakować:\n✅ Dowód\n✅ Gotówkę\n✅ Telefon i ładowarkę\n✅ Imprezowy outfit\n✅ Wygodne buty\n✅ Dobry humor 💄✨`,
      travel_info: `Plan podróży:\nMiejsce zbiórki: {{meeting_point}}\nGodzina: {{meeting_time}}\n\nKto jedzie z kim? Napiszcie w grupie! 🚗`,
      countdown: `Dziewczyny!\n3 dni do wieczoru panieńskiego {{honoree_name}}!\n✅ Pieniądze przelane\n✅ Outfit gotowy\n✅ Akcesoria dla panny młodej spakowane\n\nOdliczanie rozpoczęte! 💍✨`,
      gifts: `Kto przynosi co dla {{honoree_name}}?\n💝 Zabawny dodatek\n💝 Pamiątkowy prezent\n💝 Zabawne wyzwanie\n\nNapiszcie w grupie! 🎀`,
      motivation: `Dziewczyny, czas świętować!\n🌸 Bawić się\n🌸 Świętować z panną młodą\n🌸 Trzymać się razem\n🌸 Kto marudzi, stawia prosecco 🥂`,
      payment: `Aktualizacja finansów:\nPrzelej do {{deadline}} na:\n{{payment_link}}\n\nKwota: {{amount}}\n\nNiepłacący śpiewają karaoke! 🎤`,
      date_locked: `Data ustalona!\n\n📅 {{locked_date}}\n\nZapiszcie w kalendarzach! 🎉💕`,
    },
    birthday: {
      kickoff: `Hej wszyscy! 🎉\n\nPlanujemy przyjęcie-niespodziankę dla {{honoree_name}}! 🎂\n\n👉 Wypełnijcie tę krótką ankietę:\n{{link}}\n\n🔑 Kod dostępu: {{code}}\n\nTo zajmie tylko 2-3 minuty! 🚀`,
      budget_poll: `Ile na osobę na imprezę?\n\n🔘 do 50 €\n🔘 50–100 €\n🔘 100 €+\n\nGłosujcie szczerze!`,
      accommodation: `Potrzebny nocleg?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 U kogoś\n🔘 Nie potrzebny`,
      packing_list: `Przynieście:\n✅ Prezent dla {{honoree_name}}\n✅ Dobry humor\n✅ Wygodne ubrania\n✅ Ładowarkę do telefonu`,
      travel_info: `Plan podróży:\nMiejsce zbiórki: {{meeting_point}}\nGodzina: {{meeting_time}}\n\nNapiszcie swoje plany w grupie!`,
      countdown: `3 dni do imprezy {{honoree_name}}! 🎂\n\n✅ Prezent gotowy?\n✅ Outfit wybrany?\n\nDo zobaczenia! 🎉`,
      gifts: `Kto przynosi co dla {{honoree_name}}?\n🎁 Główny prezent (zrzutka?)\n🎁 Podpisać kartkę\n🎁 Przynieść dekoracje\n\nKoordynujcie się w grupie!`,
      motivation: `Dziś świętujemy {{honoree_name}}!\n\n🎈 Bawić się\n🎈 Świętować urodziny\n🎈 Dobra atmosfera\n\nJedziemy! 🎉`,
      payment: `Aktualizacja finansów:\nPrzelej do {{deadline}}:\n{{payment_link}}\n\nKwota: {{amount}}\n\nDziękujemy! 🙏`,
      date_locked: `Data ustalona!\n\n📅 {{locked_date}}\n\n{{honoree_name}} będzie zachwycony/a! 🎂🎉`,
    },
    trip: {
      kickoff: `Hej wszyscy! 🌍\n\nPlanujemy wspólną podróż! ✈️\n\n👉 Wypełnijcie tę krótką ankietę:\n{{link}}\n\n🔑 Kod dostępu: {{code}}\n\nTo zajmie tylko 2-3 minuty! 🚀`,
      budget_poll: `Ile na osobę (z noclegiem)?\n\n🔘 do 200 € – Budżetowo\n🔘 200–500 € – Średnio\n🔘 500–1000 € – Komfortowo\n🔘 1000 €+ – Luksusowo\n\nGłosujcie szczerze!`,
      accommodation: `Gdzie śpimy?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Hostel\n🔘 Camping\n\nNapiszcie swoje preferencje!`,
      packing_list: `Lista rzeczy:\n✅ Dowód/Paszport\n✅ Telefon i ładowarkę\n✅ Powerbank\n✅ Odpowiednie ubrania\n✅ Wygodne buty\n✅ Aparat\n✅ Dobry humor 🌟`,
      travel_info: `Plan podróży:\nMiejsce zbiórki: {{meeting_point}}\nGodzina: {{meeting_time}}\n\nKto jedzie z kim? Napiszcie w grupie!`,
      countdown: `3 dni do wyjazdu! 🌍\n\n✅ Walizka spakowana?\n✅ Bilety?\n✅ Dokumenty?\n\nOdliczanie rozpoczęte! ✈️`,
      gifts: `Organizacja:\n📋 Kto co załatwia?\n📋 Wspólna kasa?\n📋 Wymiana numerów alarmowych\n\nKoordynujcie się!`,
      motivation: `Jedziemy! 🌍✈️\n\n🗺️ Przeżywać przygody\n🗺️ Odkrywać nowe miejsca\n🗺️ Bawić się razem\n\nStart! 🚀`,
      payment: `Aktualizacja finansów:\nPrzelej do {{deadline}}:\n{{payment_link}}\n\nKwota: {{amount}}\n\nDziękujemy! 🙏`,
      date_locked: `Daty podróży ustalone!\n\n📅 {{locked_date}}\n\nWeźcie wolne i rezerwujcie bilety! ✈️🌍`,
    },
    other: {
      kickoff: `Hej wszyscy! 🎉\n\nPlanujemy wspólne wydarzenie!\n\n👉 Wypełnijcie tę krótką ankietę:\n{{link}}\n\n🔑 Kod dostępu: {{code}}\n\nTo zajmie tylko 2-3 minuty! 🚀`,
      budget_poll: `Ile na osobę?\n\n🔘 do 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nGłosujcie szczerze!`,
      accommodation: `Potrzebny nocleg?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Nie potrzebny`,
      packing_list: `Przynieście:\n✅ Dobry humor\n✅ Telefon i ładowarkę\n✅ Gotówkę\n✅ Wygodne ubrania`,
      travel_info: `Plan:\nMiejsce zbiórki: {{meeting_point}}\nGodzina: {{meeting_time}}\n\nNapiszcie w grupie!`,
      countdown: `Jeszcze 3 dni! 🎉\n\n✅ Wszystko gotowe?\n✅ Miejsce zbiórki jasne?\n\nDo zobaczenia!`,
      gifts: `Organizacja:\n📋 Kto przynosi co?\n📋 Kto robi co?\n\nKoordynujcie się!`,
      motivation: `To dziś! 🎉\n\nBawcie się dobrze!`,
      payment: `Aktualizacja finansów:\nPrzelej do {{deadline}}:\n{{payment_link}}\n\nKwota: {{amount}}\n\nDziękujemy! 🙏`,
      date_locked: `Data ustalona!\n\n📅 {{locked_date}}\n\nZapiszcie w kalendarzach! 🎉`,
    },
  },
  pt: {
    bachelor: {
      kickoff: `Olá pessoal! 🎉\n\nÉ hora de planear a despedida de solteiro do {{honoree_name}}! 🥳\n\n👉 Por favor preencham este questionário:\n{{link}}\n\n🔑 Código de acesso: {{code}}\n\nDemora apenas 2-3 minutos! 🚀`,
      budget_poll: `Pessoal, quanto por pessoa?\n\n🔘 até 100 € – Económico\n🔘 150–200 € – Realista\n🔘 250 €+ – À grande\n\nVotem honestamente!`,
      accommodation: `Precisamos de onde dormir.\n\n🔘 Hotel (confortável)\n🔘 Airbnb (mais espaço)\n🔘 Hostel (aventura)\n\nFlexíveis? Digam-nos!`,
      packing_list: `Pessoal, levar:\n✅ Documento\n✅ Dinheiro\n✅ Telemóvel e carregador\n✅ Analgésicos\n✅ Roupa extra\n✅ Boa disposição`,
      travel_info: `Plano de viagem:\nPonto de encontro: {{meeting_point}}\nHora: {{meeting_time}}\n\nQuem viaja com quem? Partilhem no grupo!`,
      countdown: `Pessoal!\n3 dias para a despedida do {{honoree_name}}.\n✅ Dinheiro transferido\n✅ Outfit pronto\n✅ Quartos atribuídos\n\nA contagem começou!`,
      gifts: `Quem traz o quê para {{honoree_name}}?\n🔹 Um desafio embaraçoso\n🔹 Um presente memorável\n\nPartilhem no grupo! 😅`,
      motivation: `Pessoal, hora de festejar!\n🔸 Divertir-se\n🔸 Celebrar o noivo\n🔸 Não se perderem\n🔸 Quem reclamar bebe um shot 🍻`,
      payment: `Atualização financeira:\nTransferir até {{deadline}} para:\n{{payment_link}}\n\nValor: {{amount}}\n\nSem dinheiro não há festa! 😬`,
      date_locked: `A data está definida!\n\n📅 {{locked_date}}\n\nMarquem nas agendas! 🎉`,
    },
    bachelorette: {
      kickoff: `Olá meninas! 🎉\n\nÉ hora de planear a despedida de solteira da {{honoree_name}}! 👰✨\n\n👉 Por favor preencham este questionário:\n{{link}}\n\n🔑 Código de acesso: {{code}}\n\nDemora apenas 2-3 minutos! 💕`,
      budget_poll: `Meninas, quanto por pessoa?\n\n🔘 até 100 € – Económico\n🔘 150–200 € – Realista\n🔘 250 €+ – À grande\n\nVotem honestamente! 💖`,
      accommodation: `Onde dormimos?\n\n🔘 Hotel (confortável)\n🔘 Airbnb (noite de meninas)\n🔘 Hostel (aventura)\n\nFlexíveis? Digam-nos! 💅`,
      packing_list: `Meninas, levar:\n✅ Documento\n✅ Dinheiro\n✅ Telemóvel e carregador\n✅ Outfit de festa\n✅ Sapatos confortáveis\n✅ Boa disposição 💄✨`,
      travel_info: `Plano de viagem:\nPonto de encontro: {{meeting_point}}\nHora: {{meeting_time}}\n\nQuem viaja com quem? Partilhem no grupo! 🚗`,
      countdown: `Meninas!\n3 dias para a despedida da {{honoree_name}}!\n✅ Dinheiro transferido\n✅ Outfit pronto\n✅ Acessórios para a noiva prontos\n\nA contagem começou! 💍✨`,
      gifts: `Quem traz o quê para {{honoree_name}}?\n💝 Um acessório divertido\n💝 Um presente memorável\n💝 Um desafio engraçado\n\nPartilhem no grupo! 🎀`,
      motivation: `Meninas, hora de festejar!\n🌸 Divertir-se\n🌸 Celebrar a noiva\n🌸 Ficarem juntas\n🌸 Quem reclamar paga o prosecco 🥂`,
      payment: `Atualização financeira:\nTransferir até {{deadline}} para:\n{{payment_link}}\n\nValor: {{amount}}\n\nQuem não pagar faz karaoke! 🎤`,
      date_locked: `A data está definida!\n\n📅 {{locked_date}}\n\nMarquem nas agendas! 🎉💕`,
    },
    birthday: {
      kickoff: `Olá a todos! 🎉\n\nEstamos a planear uma festa surpresa para {{honoree_name}}! 🎂\n\n👉 Por favor preencham este questionário:\n{{link}}\n\n🔑 Código de acesso: {{code}}\n\nDemora apenas 2-3 minutos! 🚀`,
      budget_poll: `Quanto por pessoa para a festa?\n\n🔘 até 50 €\n🔘 50–100 €\n🔘 100 €+\n\nVotem honestamente!`,
      accommodation: `Precisamos de alojamento?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Casa de alguém\n🔘 Não é necessário`,
      packing_list: `Tragam:\n✅ Presente para {{honoree_name}}\n✅ Boa disposição\n✅ Roupa confortável\n✅ Carregador de telemóvel`,
      travel_info: `Plano de viagem:\nPonto de encontro: {{meeting_point}}\nHora: {{meeting_time}}\n\nPartilhem os planos no grupo!`,
      countdown: `3 dias para a festa do {{honoree_name}}! 🎂\n\n✅ Presente pronto?\n✅ Outfit escolhido?\n\nAté já! 🎉`,
      gifts: `Quem traz o quê para {{honoree_name}}?\n🎁 Presente principal (vaquinha?)\n🎁 Assinar cartão\n🎁 Trazer decorações\n\nCoordenem no grupo!`,
      motivation: `Hoje celebramos {{honoree_name}}!\n\n🎈 Divertir-se\n🎈 Celebrar o aniversariante\n🎈 Boa atmosfera\n\nVamos! 🎉`,
      payment: `Atualização financeira:\nTransferir até {{deadline}}:\n{{payment_link}}\n\nValor: {{amount}}\n\nObrigado! 🙏`,
      date_locked: `A data está definida!\n\n📅 {{locked_date}}\n\n{{honoree_name}} vai ficar muito feliz! 🎂🎉`,
    },
    trip: {
      kickoff: `Olá a todos! 🌍\n\nEstamos a planear uma viagem juntos! ✈️\n\n👉 Por favor preencham este questionário:\n{{link}}\n\n🔑 Código de acesso: {{code}}\n\nDemora apenas 2-3 minutos! 🚀`,
      budget_poll: `Quanto por pessoa (incluindo alojamento)?\n\n🔘 até 200 € – Económico\n🔘 200–500 € – Intermédio\n🔘 500–1000 € – Confortável\n🔘 1000 €+ – Luxo\n\nVotem honestamente!`,
      accommodation: `Onde dormimos?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Hostel\n🔘 Campismo\n\nPartilhem as preferências!`,
      packing_list: `Lista de bagagem:\n✅ Documento/Passaporte\n✅ Telemóvel e carregador\n✅ Powerbank\n✅ Roupa adequada\n✅ Sapatos confortáveis\n✅ Câmara\n✅ Boa disposição 🌟`,
      travel_info: `Plano de viagem:\nPonto de encontro: {{meeting_point}}\nHora: {{meeting_time}}\n\nQuem viaja com quem? Partilhem no grupo!`,
      countdown: `3 dias para a viagem! 🌍\n\n✅ Mala feita?\n✅ Bilhetes?\n✅ Documentos?\n\nA contagem começou! ✈️`,
      gifts: `Organização:\n📋 Quem trata de quê?\n📋 Fundo comum?\n📋 Trocar números de emergência\n\nCoordenem!`,
      motivation: `Vamos! 🌍✈️\n\n🗺️ Viver aventuras\n🗺️ Descobrir novos lugares\n🗺️ Divertir-nos juntos\n\nPartida! 🚀`,
      payment: `Atualização financeira:\nTransferir até {{deadline}}:\n{{payment_link}}\n\nValor: {{amount}}\n\nObrigado! 🙏`,
      date_locked: `As datas da viagem estão definidas!\n\n📅 {{locked_date}}\n\nPeçam folga e reservem bilhetes! ✈️🌍`,
    },
    other: {
      kickoff: `Olá a todos! 🎉\n\nEstamos a planear um evento juntos!\n\n👉 Por favor preencham este questionário:\n{{link}}\n\n🔑 Código de acesso: {{code}}\n\nDemora apenas 2-3 minutos! 🚀`,
      budget_poll: `Quanto por pessoa?\n\n🔘 até 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nVotem honestamente!`,
      accommodation: `Precisamos de alojamento?\n\n🔘 Hotel\n🔘 Airbnb\n🔘 Não é necessário`,
      packing_list: `Tragam:\n✅ Boa disposição\n✅ Telemóvel e carregador\n✅ Dinheiro\n✅ Roupa confortável`,
      travel_info: `Plano:\nPonto de encontro: {{meeting_point}}\nHora: {{meeting_time}}\n\nPartilhem no grupo!`,
      countdown: `Faltam 3 dias! 🎉\n\n✅ Tudo pronto?\n✅ Ponto de encontro claro?\n\nAté já!`,
      gifts: `Organização:\n📋 Quem traz o quê?\n📋 Quem faz o quê?\n\nCoordenem!`,
      motivation: `É hoje! 🎉\n\nDivirtam-se e aproveitem!`,
      payment: `Atualização financeira:\nTransferir até {{deadline}}:\n{{payment_link}}\n\nValor: {{amount}}\n\nObrigado! 🙏`,
      date_locked: `A data está definida!\n\n📅 {{locked_date}}\n\nMarquem nas agendas! 🎉`,
    },
  },
  tr: {
    bachelor: {
      kickoff: `Merhaba beyler! 🎉\n\n{{honoree_name}} için bekarlığa veda partisi planlama zamanı! 🥳\n\n👉 Lütfen bu kısa anketi doldurun:\n{{link}}\n\n🔑 Erişim kodu: {{code}}\n\nSadece 2-3 dakika sürer! 🚀`,
      budget_poll: `Beyler, kişi başı ne kadar?\n\n🔘 100 €'ya kadar – Bütçe\n🔘 150–200 € – Gerçekçi\n🔘 250 €+ – Büyük oyna\n\nDürüstçe oy verin!`,
      accommodation: `Uyuyacak yer lazım.\n\n🔘 Otel (konforlu)\n🔘 Airbnb (daha geniş)\n🔘 Hostel (macera)\n\nEsnek misiniz? Bildirin!`,
      packing_list: `Beyler, hazırlayın:\n✅ Kimlik\n✅ Nakit\n✅ Telefon ve şarj\n✅ Ağrı kesici\n✅ Yedek kıyafet\n✅ İyi moral`,
      travel_info: `Seyahat planı:\nBuluşma noktası: {{meeting_point}}\nSaat: {{meeting_time}}\n\nKim kiminle gidiyor? Grupta paylaşın!`,
      countdown: `Beyler!\n{{honoree_name}}'in bekarlığa veda partisine 3 gün kaldı.\n✅ Para transfer edildi\n✅ Kıyafet hazır\n✅ Odalar dağıtıldı\n\nGeri sayım başladı!`,
      gifts: `{{honoree_name}} için kim ne getiriyor?\n🔹 Utanç verici bir görev\n🔹 Hatıra değeri olan hediye\n\nGrupta paylaşın! 😅`,
      motivation: `Beyler, parti zamanı!\n🔸 Eğlenmek\n🔸 Damadı kutlamak\n🔸 Kaybolmamak\n🔸 Şikayet eden shot içer 🍻`,
      payment: `Finansal güncelleme:\n{{deadline}} tarihine kadar transfer edin:\n{{payment_link}}\n\nTutar: {{amount}}\n\nPara yok = eğlence yok! 😬`,
      date_locked: `Tarih belirlendi!\n\n📅 {{locked_date}}\n\nTakvimlerinize not edin! 🎉`,
    },
    bachelorette: {
      kickoff: `Merhaba kızlar! 🎉\n\n{{honoree_name}} için bekarlığa veda partisi planlama zamanı! 👰✨\n\n👉 Lütfen bu kısa anketi doldurun:\n{{link}}\n\n🔑 Erişim kodu: {{code}}\n\nSadece 2-3 dakika sürer! 💕`,
      budget_poll: `Kızlar, kişi başı ne kadar?\n\n🔘 100 €'ya kadar – Bütçe\n🔘 150–200 € – Gerçekçi\n🔘 250 €+ – Büyük oyna\n\nDürüstçe oy verin! 💖`,
      accommodation: `Nerede uyuyoruz?\n\n🔘 Otel (konforlu)\n🔘 Airbnb (kız kızah)\n🔘 Hostel (macera)\n\nEsnek misiniz? Bildirin! 💅`,
      packing_list: `Kızlar, hazırlayın:\n✅ Kimlik\n✅ Nakit\n✅ Telefon ve şarj\n✅ Parti kıyafeti\n✅ Rahat ayakkabı\n✅ İyi moral 💄✨`,
      travel_info: `Seyahat planı:\nBuluşma noktası: {{meeting_point}}\nSaat: {{meeting_time}}\n\nKim kiminle gidiyor? Grupta paylaşın! 🚗`,
      countdown: `Kızlar!\n{{honoree_name}}'in bekarlığa veda partisine 3 gün!\n✅ Para transfer edildi\n✅ Kıyafet hazır\n✅ Gelin aksesuarları hazır\n\nGeri sayım başladı! 💍✨`,
      gifts: `{{honoree_name}} için kim ne getiriyor?\n💝 Eğlenceli aksesuar\n💝 Hatıra hediye\n💝 Komik görev\n\nGrupta paylaşın! 🎀`,
      motivation: `Kızlar, kutlama zamanı!\n🌸 Eğlenmek\n🌸 Gelini kutlamak\n🌸 Birlikte kalmak\n🌸 Şikayet eden prosecco ısmarlar 🥂`,
      payment: `Finansal güncelleme:\n{{deadline}} tarihine kadar transfer edin:\n{{payment_link}}\n\nTutar: {{amount}}\n\nÖdemeyenler karaoke yapar! 🎤`,
      date_locked: `Tarih belirlendi!\n\n📅 {{locked_date}}\n\nTakvimlerinize not edin! 🎉💕`,
    },
    birthday: {
      kickoff: `Herkese merhaba! 🎉\n\n{{honoree_name}} için sürpriz parti planlıyoruz! 🎂\n\n👉 Lütfen bu kısa anketi doldurun:\n{{link}}\n\n🔑 Erişim kodu: {{code}}\n\nSadece 2-3 dakika sürer! 🚀`,
      budget_poll: `Parti için kişi başı ne kadar?\n\n🔘 50 €'ya kadar\n🔘 50–100 €\n🔘 100 €+\n\nDürüstçe oy verin!`,
      accommodation: `Konaklama gerekli mi?\n\n🔘 Otel\n🔘 Airbnb\n🔘 Birinin evi\n🔘 Gerekli değil`,
      packing_list: `Getirin:\n✅ {{honoree_name}} için hediye\n✅ İyi moral\n✅ Rahat kıyafet\n✅ Telefon şarjı`,
      travel_info: `Seyahat planı:\nBuluşma noktası: {{meeting_point}}\nSaat: {{meeting_time}}\n\nPlanlarınızı grupta paylaşın!`,
      countdown: `{{honoree_name}}'in partisine 3 gün kaldı! 🎂\n\n✅ Hediye hazır mı?\n✅ Kıyafet seçildi mi?\n\nGörüşürüz! 🎉`,
      gifts: `{{honoree_name}} için kim ne getiriyor?\n🎁 Ana hediye (ortak mı?)\n🎁 Kartı imzala\n🎁 Dekorasyon getir\n\nGrupta koordine olun!`,
      motivation: `Bugün {{honoree_name}}'i kutluyoruz!\n\n🎈 Eğlenmek\n🎈 Doğum gününü kutlamak\n🎈 İyi atmosfer\n\nHaydi! 🎉`,
      payment: `Finansal güncelleme:\n{{deadline}} tarihine kadar transfer edin:\n{{payment_link}}\n\nTutar: {{amount}}\n\nTeşekkürler! 🙏`,
      date_locked: `Tarih belirlendi!\n\n📅 {{locked_date}}\n\n{{honoree_name}} çok mutlu olacak! 🎂🎉`,
    },
    trip: {
      kickoff: `Herkese merhaba! 🌍\n\nBirlikte seyahat planlıyoruz! ✈️\n\n👉 Lütfen bu kısa anketi doldurun:\n{{link}}\n\n🔑 Erişim kodu: {{code}}\n\nSadece 2-3 dakika sürer! 🚀`,
      budget_poll: `Kişi başı ne kadar (konaklama dahil)?\n\n🔘 200 €'ya kadar – Bütçe\n🔘 200–500 € – Orta\n🔘 500–1000 € – Konforlu\n🔘 1000 €+ – Lüks\n\nDürüstçe oy verin!`,
      accommodation: `Nerede kalıyoruz?\n\n🔘 Otel\n🔘 Airbnb\n🔘 Hostel\n🔘 Kamp\n\nTercihlerinizi paylaşın!`,
      packing_list: `Bavul listesi:\n✅ Kimlik/Pasaport\n✅ Telefon ve şarj\n✅ Powerbank\n✅ Uygun kıyafet\n✅ Rahat ayakkabı\n✅ Kamera\n✅ İyi moral 🌟`,
      travel_info: `Seyahat planı:\nBuluşma noktası: {{meeting_point}}\nSaat: {{meeting_time}}\n\nKim kiminle gidiyor? Grupta paylaşın!`,
      countdown: `Seyahate 3 gün kaldı! 🌍\n\n✅ Bavul hazır mı?\n✅ Biletler?\n✅ Belgeler?\n\nGeri sayım başladı! ✈️`,
      gifts: `Organizasyon:\n📋 Kim neyi hallediyor?\n📋 Ortak kasa mı?\n📋 Acil numaraları paylaşın\n\nKoordine olun!`,
      motivation: `Gidiyoruz! 🌍✈️\n\n🗺️ Macera yaşamak\n🗺️ Yeni yerler keşfetmek\n🗺️ Birlikte eğlenmek\n\nHaydi! 🚀`,
      payment: `Finansal güncelleme:\n{{deadline}} tarihine kadar transfer edin:\n{{payment_link}}\n\nTutar: {{amount}}\n\nTeşekkürler! 🙏`,
      date_locked: `Seyahat tarihleri belirlendi!\n\n📅 {{locked_date}}\n\nİzin alın ve bilet ayırtın! ✈️🌍`,
    },
    other: {
      kickoff: `Herkese merhaba! 🎉\n\nBirlikte etkinlik planlıyoruz!\n\n👉 Lütfen bu kısa anketi doldurun:\n{{link}}\n\n🔑 Erişim kodu: {{code}}\n\nSadece 2-3 dakika sürer! 🚀`,
      budget_poll: `Kişi başı ne kadar?\n\n🔘 50 €'ya kadar\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nDürüstçe oy verin!`,
      accommodation: `Konaklama gerekli mi?\n\n🔘 Otel\n🔘 Airbnb\n🔘 Gerekli değil`,
      packing_list: `Getirin:\n✅ İyi moral\n✅ Telefon ve şarj\n✅ Nakit\n✅ Rahat kıyafet`,
      travel_info: `Plan:\nBuluşma noktası: {{meeting_point}}\nSaat: {{meeting_time}}\n\nGrupta paylaşın!`,
      countdown: `3 gün kaldı! 🎉\n\n✅ Her şey hazır mı?\n✅ Buluşma noktası net mi?\n\nGörüşürüz!`,
      gifts: `Organizasyon:\n📋 Kim ne getiriyor?\n📋 Kim ne yapıyor?\n\nKoordine olun!`,
      motivation: `Bugün gün! 🎉\n\nEğlenin ve keyfini çıkarın!`,
      payment: `Finansal güncelleme:\n{{deadline}} tarihine kadar transfer edin:\n{{payment_link}}\n\nTutar: {{amount}}\n\nTeşekkürler! 🙏`,
      date_locked: `Tarih belirlendi!\n\n📅 {{locked_date}}\n\nTakvimlerinize not edin! 🎉`,
    },
  },
  ar: {
    bachelor: {
      kickoff: `مرحباً يا شباب! 🎉\n\nحان وقت التخطيط لحفلة العزوبية لـ {{honoree_name}}! 🥳\n\n👉 يرجى ملء هذا الاستبيان القصير:\n{{link}}\n\n🔑 رمز الوصول: {{code}}\n\nيستغرق 2-3 دقائق فقط! 🚀`,
      budget_poll: `يا شباب، كم للشخص؟\n\n🔘 حتى 100 € – اقتصادي\n🔘 150–200 € – واقعي\n🔘 250 €+ – بدون حدود\n\nصوّتوا بصدق!`,
      accommodation: `نحتاج مكان للنوم.\n\n🔘 فندق (مريح)\n🔘 Airbnb (مساحة أكبر)\n🔘 نزل (مغامرة)\n\nمرنون؟ أخبرونا!`,
      packing_list: `يا شباب، جهّزوا:\n✅ هوية\n✅ نقد\n✅ هاتف وشاحن\n✅ مسكنات\n✅ ملابس إضافية\n✅ روح معنوية عالية`,
      travel_info: `خطة السفر:\nنقطة اللقاء: {{meeting_point}}\nالوقت: {{meeting_time}}\n\nمن يسافر مع من؟ شاركوا في المجموعة!`,
      countdown: `يا شباب!\n3 أيام لحفلة العزوبية لـ {{honoree_name}}.\n✅ المال تم تحويله\n✅ الملابس جاهزة\n✅ الغرف موزعة\n\nالعد التنازلي بدأ!`,
      gifts: `من يحضر ماذا لـ {{honoree_name}}؟\n🔹 تحدي محرج\n🔹 هدية تذكارية\n\nشاركوا في المجموعة! 😅`,
      motivation: `يا شباب، وقت الحفلة!\n🔸 استمتعوا\n🔸 احتفلوا بالعريس\n🔸 لا تضيعوا\n🔸 من يشتكي يشرب شوت 🍻`,
      payment: `تحديث مالي:\nحوّلوا قبل {{deadline}} إلى:\n{{payment_link}}\n\nالمبلغ: {{amount}}\n\nبدون فلوس = بدون متعة! 😬`,
      date_locked: `التاريخ محدد!\n\n📅 {{locked_date}}\n\nسجّلوه في التقويم! 🎉`,
    },
    bachelorette: {
      kickoff: `مرحباً يا بنات! 🎉\n\nحان وقت التخطيط لحفلة العزوبية لـ {{honoree_name}}! 👰✨\n\n👉 يرجى ملء هذا الاستبيان القصير:\n{{link}}\n\n🔑 رمز الوصول: {{code}}\n\nيستغرق 2-3 دقائق فقط! 💕`,
      budget_poll: `يا بنات، كم للشخص؟\n\n🔘 حتى 100 € – اقتصادي\n🔘 150–200 € – واقعي\n🔘 250 €+ – بدون حدود\n\nصوّتن بصدق! 💖`,
      accommodation: `أين ننام؟\n\n🔘 فندق (مريح)\n🔘 Airbnb (سهرة بناتية)\n🔘 نزل (مغامرة)\n\nمرنات؟ أخبرنا! 💅`,
      packing_list: `يا بنات، جهّزن:\n✅ هوية\n✅ نقد\n✅ هاتف وشاحن\n✅ ملابس الحفلة\n✅ أحذية مريحة\n✅ روح معنوية عالية 💄✨`,
      travel_info: `خطة السفر:\nنقطة اللقاء: {{meeting_point}}\nالوقت: {{meeting_time}}\n\nمن تسافر مع من؟ شاركن في المجموعة! 🚗`,
      countdown: `يا بنات!\n3 أيام لحفلة العزوبية لـ {{honoree_name}}!\n✅ المال تم تحويله\n✅ الملابس جاهزة\n✅ إكسسوارات العروس جاهزة\n\nالعد التنازلي بدأ! 💍✨`,
      gifts: `من تحضر ماذا لـ {{honoree_name}}؟\n💝 إكسسوار مضحك\n💝 هدية تذكارية\n💝 تحدي ممتع\n\nشاركن في المجموعة! 🎀`,
      motivation: `يا بنات، وقت الاحتفال!\n🌸 استمتعن\n🌸 احتفلن بالعروس\n🌸 ابقين معاً\n🌸 من تشتكي تدفع البروسيكو 🥂`,
      payment: `تحديث مالي:\nحوّلن قبل {{deadline}} إلى:\n{{payment_link}}\n\nالمبلغ: {{amount}}\n\nمن لا تدفع تغني كاريوكي! 🎤`,
      date_locked: `التاريخ محدد!\n\n📅 {{locked_date}}\n\nسجّلنه في التقويم! 🎉💕`,
    },
    birthday: {
      kickoff: `مرحباً بالجميع! 🎉\n\nنخطط لحفلة مفاجأة لـ {{honoree_name}}! 🎂\n\n👉 يرجى ملء هذا الاستبيان القصير:\n{{link}}\n\n🔑 رمز الوصول: {{code}}\n\nيستغرق 2-3 دقائق فقط! 🚀`,
      budget_poll: `كم للشخص للحفلة؟\n\n🔘 حتى 50 €\n🔘 50–100 €\n🔘 100 €+\n\nصوّتوا بصدق!`,
      accommodation: `نحتاج إقامة؟\n\n🔘 فندق\n🔘 Airbnb\n🔘 بيت أحد\n🔘 غير مطلوب`,
      packing_list: `أحضروا:\n✅ هدية لـ {{honoree_name}}\n✅ روح معنوية عالية\n✅ ملابس مريحة\n✅ شاحن هاتف`,
      travel_info: `خطة السفر:\nنقطة اللقاء: {{meeting_point}}\nالوقت: {{meeting_time}}\n\nشاركوا خططكم في المجموعة!`,
      countdown: `3 أيام لحفلة {{honoree_name}}! 🎂\n\n✅ الهدية جاهزة؟\n✅ الملابس مختارة؟\n\nنراكم قريباً! 🎉`,
      gifts: `من يحضر ماذا لـ {{honoree_name}}؟\n🎁 الهدية الرئيسية (جماعية؟)\n🎁 التوقيع على البطاقة\n🎁 إحضار الزينة\n\nنسّقوا في المجموعة!`,
      motivation: `اليوم نحتفل بـ {{honoree_name}}!\n\n🎈 استمتعوا\n🎈 احتفلوا بصاحب العيد\n🎈 أجواء رائعة\n\nهيا! 🎉`,
      payment: `تحديث مالي:\nحوّلوا قبل {{deadline}}:\n{{payment_link}}\n\nالمبلغ: {{amount}}\n\nشكراً! 🙏`,
      date_locked: `التاريخ محدد!\n\n📅 {{locked_date}}\n\n{{honoree_name}} سيكون سعيداً جداً! 🎂🎉`,
    },
    trip: {
      kickoff: `مرحباً بالجميع! 🌍\n\nنخطط لرحلة معاً! ✈️\n\n👉 يرجى ملء هذا الاستبيان القصير:\n{{link}}\n\n🔑 رمز الوصول: {{code}}\n\nيستغرق 2-3 دقائق فقط! 🚀`,
      budget_poll: `كم للشخص (شامل الإقامة)؟\n\n🔘 حتى 200 € – اقتصادي\n🔘 200–500 € – متوسط\n🔘 500–1000 € – مريح\n🔘 1000 €+ – فاخر\n\nصوّتوا بصدق!`,
      accommodation: `أين نقيم؟\n\n🔘 فندق\n🔘 Airbnb\n🔘 نزل\n🔘 تخييم\n\nشاركوا تفضيلاتكم!`,
      packing_list: `قائمة الأمتعة:\n✅ هوية/جواز سفر\n✅ هاتف وشاحن\n✅ باوربانك\n✅ ملابس مناسبة\n✅ أحذية مريحة\n✅ كاميرا\n✅ روح معنوية عالية 🌟`,
      travel_info: `خطة السفر:\nنقطة اللقاء: {{meeting_point}}\nالوقت: {{meeting_time}}\n\nمن يسافر مع من؟ شاركوا في المجموعة!`,
      countdown: `3 أيام للرحلة! 🌍\n\n✅ الحقيبة جاهزة؟\n✅ التذاكر؟\n✅ الوثائق؟\n\nالعد التنازلي بدأ! ✈️`,
      gifts: `التنظيم:\n📋 من يتولى ماذا؟\n📋 صندوق مشترك؟\n📋 تبادل أرقام الطوارئ\n\nنسّقوا!`,
      motivation: `هيا بنا! 🌍✈️\n\n🗺️ عيش المغامرات\n🗺️ اكتشاف أماكن جديدة\n🗺️ الاستمتاع معاً\n\nانطلاق! 🚀`,
      payment: `تحديث مالي:\nحوّلوا قبل {{deadline}}:\n{{payment_link}}\n\nالمبلغ: {{amount}}\n\nشكراً! 🙏`,
      date_locked: `تواريخ السفر محددة!\n\n📅 {{locked_date}}\n\nخذوا إجازة واحجزوا التذاكر! ✈️🌍`,
    },
    other: {
      kickoff: `مرحباً بالجميع! 🎉\n\nنخطط لحدث معاً!\n\n👉 يرجى ملء هذا الاستبيان القصير:\n{{link}}\n\n🔑 رمز الوصول: {{code}}\n\nيستغرق 2-3 دقائق فقط! 🚀`,
      budget_poll: `كم للشخص؟\n\n🔘 حتى 50 €\n🔘 50–100 €\n🔘 100–200 €\n🔘 200 €+\n\nصوّتوا بصدق!`,
      accommodation: `نحتاج إقامة؟\n\n🔘 فندق\n🔘 Airbnb\n🔘 غير مطلوب`,
      packing_list: `أحضروا:\n✅ روح معنوية عالية\n✅ هاتف وشاحن\n✅ نقد\n✅ ملابس مريحة`,
      travel_info: `الخطة:\nنقطة اللقاء: {{meeting_point}}\nالوقت: {{meeting_time}}\n\nشاركوا في المجموعة!`,
      countdown: `باقي 3 أيام! 🎉\n\n✅ كل شيء جاهز؟\n✅ نقطة اللقاء واضحة؟\n\nنراكم!`,
      gifts: `التنظيم:\n📋 من يحضر ماذا؟\n📋 من يفعل ماذا؟\n\nنسّقوا!`,
      motivation: `اليوم هو اليوم! 🎉\n\nاستمتعوا!`,
      payment: `تحديث مالي:\nحوّلوا قبل {{deadline}}:\n{{payment_link}}\n\nالمبلغ: {{amount}}\n\nشكراً! 🙏`,
      date_locked: `التاريخ محدد!\n\n📅 {{locked_date}}\n\nسجّلوه في التقويم! 🎉`,
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
        // Use AI-generated no_gos and focus_points if available
        ...(custom_template.no_gos && custom_template.no_gos.length > 0 && { no_gos: custom_template.no_gos }),
        ...(custom_template.focus_points && custom_template.focus_points.length > 0 && { focus_points: custom_template.focus_points }),
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
