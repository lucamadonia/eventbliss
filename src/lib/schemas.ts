import { z } from "zod";
import { PARTICIPANTS, DATE_BLOCKS, ACTIVITY_OPTIONS } from "./constants";

const participantValues = PARTICIPANTS as unknown as readonly [string, ...string[]];
const dateBlockKeys = Object.keys(DATE_BLOCKS) as [string, ...string[]];
const activityValues = ACTIVITY_OPTIONS.map(a => a.value) as unknown as [string, ...string[]];

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

// Admin Login Schema
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;
