import { z } from "zod";
import { PARTICIPANTS, DATE_BLOCKS, ACTIVITY_OPTIONS } from "./constants";

const participantValues = PARTICIPANTS as unknown as readonly [string, ...string[]];
const dateBlockKeys = Object.keys(DATE_BLOCKS) as [string, ...string[]];
const activityValues = ACTIVITY_OPTIONS.map(a => a.value) as unknown as [string, ...string[]];

// Static schema for legacy SurveyForm component
export const responseSchema = z.object({
  // Pflichtfelder
  participant: z.enum(participantValues, {
    required_error: "Bitte wähle deinen Namen aus",
  }),
  
  attendance: z.enum(["yes", "maybe", "no"], {
    required_error: "Bitte gib an, ob du dabei sein kannst",
  }),
  
  duration_pref: z.enum(["day", "weekend", "either"], {
    required_error: "Bitte wähle deine bevorzugte Dauer",
  }),
  
  date_blocks: z.array(z.enum(dateBlockKeys))
    .min(1, "Bitte wähle mindestens einen Terminblock aus"),
  
  budget: z.enum(["80-150", "150-250", "250-400", "400+"], {
    required_error: "Bitte wähle dein Budget",
  }),
  
  destination: z.enum(["de_city", "barcelona", "lisbon", "either"], {
    required_error: "Bitte wähle eine Destination",
  }),
  
  travel_pref: z.enum(["daytrip", "one_night", "two_nights", "either"], {
    required_error: "Bitte wähle deine Reisebereitschaft",
  }),
  
  preferences: z.array(z.enum(activityValues))
    .min(1, "Bitte wähle mindestens eine Aktivität"),
  
  fitness_level: z.enum(["chill", "normal", "sporty"], {
    required_error: "Bitte wähle dein Fitness-Level",
  }),
  
  group_code: z.string()
    .min(1, "Gruppencode ist erforderlich")
    .max(50, "Gruppencode zu lang"),
  
  // Optionale Felder
  partial_days: z.string().max(500, "Maximal 500 Zeichen").optional(),
  
  alcohol: z.enum(["yes", "no", "either"]).optional(),
  
  restrictions: z.string().max(500, "Maximal 500 Zeichen").optional(),
  
  suggestions: z.string().max(1000, "Maximal 1000 Zeichen").optional(),
  
  de_city: z.string().max(100, "Maximal 100 Zeichen").optional(),
});

export type ResponseFormData = z.infer<typeof responseSchema>;

// Dynamic schema for DynamicSurveyForm component - supports both single and multi-select
export const dynamicResponseSchema = z.object({
  participant: z.string().min(1, "Bitte wähle deinen Namen aus"),
  
  attendance: z.string().min(1, "Bitte gib an, ob du dabei sein kannst"),
  
  // Duration can be string (single) or array (multi)
  duration_pref: z.union([
    z.string().min(1, "Bitte wähle deine bevorzugte Dauer"),
    z.array(z.string()).min(1, "Bitte wähle mindestens eine Dauer")
  ]),
  
  date_blocks: z.array(z.string()).min(1, "Bitte wähle mindestens einen Terminblock aus"),
  
  // Budget can be string (single) or array (multi)
  budget: z.union([
    z.string().min(1, "Bitte wähle dein Budget"),
    z.array(z.string()).min(1, "Bitte wähle mindestens ein Budget")
  ]),
  
  // Destination can be string (single) or array (multi)
  destination: z.union([
    z.string().min(1, "Bitte wähle eine Destination"),
    z.array(z.string()).min(1, "Bitte wähle mindestens eine Destination")
  ]),
  
  travel_pref: z.string().min(1, "Bitte wähle deine Reisebereitschaft"),
  
  preferences: z.array(z.string()).min(1, "Bitte wähle mindestens eine Aktivität"),
  
  fitness_level: z.string().min(1, "Bitte wähle dein Fitness-Level"),
  
  group_code: z.string().min(1, "Gruppencode ist erforderlich").max(50, "Gruppencode zu lang"),
  
  // Optional fields
  partial_days: z.string().max(500, "Maximal 500 Zeichen").optional(),
  alcohol: z.string().optional(),
  restrictions: z.string().max(500, "Maximal 500 Zeichen").optional(),
  suggestions: z.string().max(1000, "Maximal 1000 Zeichen").optional(),
  de_city: z.string().max(100, "Maximal 100 Zeichen").optional(),
});

export type DynamicResponseFormData = z.infer<typeof dynamicResponseSchema>;

// Admin Login Schema
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;
