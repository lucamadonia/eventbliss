import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Real activity slugs the AI may choose from (mirror of src/lib/activities-library.ts).
// The model MUST pick from these; server-side we drop anything not in this set.
const ACTIVITY_SLUGS = new Set([
  "karting","escape_room","lasertag","paintball","axe_throwing","archery","vr_arena","sim_racing","bubble_soccer","trampoline_park","ninja_warrior","quad_tour","segway_tour","jetski","wakeboarding","indoor_skydiving","shooting_range","crossfit_challenge","hovercraft","bumper_cars","drift_course","nerf_battle","combat_archery","rage_room","zorbing",
  "climbing","hiking","canoeing","rafting","sup","mtb_tour","zipline","high_ropes","survival_training","geocaching","sailing","fishing","camping","beach_volleyball","golf","disc_golf","outdoor_cinema","tree_climbing","stargazing","hot_air_balloon",
  "spa","sauna","thermal_bath","massage","yoga","boat_trip","picnic","beach_day","pool_party","hammam","float_tank","sound_bath","ice_bath","rooftop_lounge","sunset_cruise",
  "dinner_experience","bbq_event","tapas_tour","street_food_tour","brunch","cocktail_course","barista_workshop","sushi_course","pizza_making","chocolate_workshop","wine_tasting","whisky_tasting","gin_tasting","beer_brewing","brewery_tour","cheese_tasting","cooking_class","grill_course","fine_dining","food_truck_rally",
  "comedy_show","concert","musical","club","karaoke","casino","poker_tournament","quiz_night","cinema","bowling","billiards","darts","theater","opera","variete","magic_show","drag_show","improv_theater","murder_mystery","silent_disco",
  "graffiti_workshop","pottery","painting_class","blacksmithing","candle_making","leather_workshop","watchmaking","perfume_making","tshirt_printing","photoshoot","music_production","neon_sign_making","terrarium_building","jewelry_making","glassblowing","ceramic_painting","resin_art","flower_arrangement","calligraphy","macrame","tie_dye","matcha_workshop","pasta_making",
  "city_tour","food_tour","museum","local_festival","bar_hopping",
]);

const CORE_KEYS = ["attendance","duration","date_blocks","budget","destination","travel","activities","fitness","alcohol"] as const;
const CUSTOM_TYPES = new Set(["text","textarea","select","radio","checkbox","toggle","rating","number","date"]);
const ACTIVITY_CATEGORIES = new Set(["action","chill","food","outdoor","other"]);

const LANG = {
  de: "Antworte ausschließlich mit dem JSON. Alle Labels, Fragen, No-Gos und Fokuspunkte auf Deutsch.",
  en: "Respond with the JSON only. All labels, questions, no-gos and focus points in English.",
  es: "Responde solo con el JSON. Etiquetas y textos en español.",
  fr: "Réponds uniquement avec le JSON. Libellés et textes en français.",
  it: "Rispondi solo con il JSON. Etichette e testi in italiano.",
  nl: "Antwoord alleen met de JSON. Labels en teksten in het Nederlands.",
  pl: "Odpowiedz tylko JSON-em. Etykiety i teksty po polsku.",
  pt: "Responde apenas com o JSON. Rótulos e textos em português.",
  tr: "Sadece JSON ile yanıt ver. Etiketler ve metinler Türkçe.",
  ar: "أجب بـ JSON فقط. جميع التسميات والنصوص بالعربية.",
} as const;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event_type = "other", description, language = "en", context = {} } = await req.json();
    if (!description || String(description).trim().length < 3) {
      return json({ success: false, error: "description is required" }, 400, corsHeaders);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Auth + credit gate (same model as generate-event-template) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Authentication required for AI features" }, 401, corsHeaders);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ success: false, error: "Authentication required for AI features" }, 401, corsHeaders);
    const userId = user.id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { count: usedCredits } = await supabase.from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", startOfMonth.toISOString());
    const { data: subscription } = await supabase.from("subscriptions").select("plan").eq("user_id", userId).single();
    const { data: planConfig } = await supabase.from("plan_configs")
      .select("ai_credits_monthly").eq("plan_key", subscription?.plan || "free").single();
    const creditLimit = planConfig?.ai_credits_monthly ?? 0; // free = 0 → premium-gated
    if ((usedCredits || 0) >= creditLimit) {
      return json({ success: false, error: "No credits remaining", code: "no_credits" }, 402, corsHeaders);
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const langLine = LANG[language as keyof typeof LANG] || LANG.en;
    const ctxLine = [
      context.honoree_name ? `Honoree: ${context.honoree_name}` : "",
      context.guest_count ? `Group size: ${context.guest_count}` : "",
      context.event_date ? `Date: ${context.event_date}` : "",
    ].filter(Boolean).join(" · ");

    const systemPrompt = `You configure a guest survey ("form") for a group event. Read the organizer's description, ideas and wishes, and decide which questions the guests should answer, their answer options, and the matching activities. ${langLine}

Respond with ONLY one valid JSON object (no markdown, no prose):
{
  "question_config": {
    "attendance": { "enabled": true, "multiSelect": false },
    "duration": { "enabled": true|false, "multiSelect": true|false },
    "date_blocks": { "enabled": true|false, "multiSelect": true },
    "budget": { "enabled": true|false, "multiSelect": true|false },
    "destination": { "enabled": true|false, "multiSelect": true|false },
    "travel": { "enabled": true|false, "multiSelect": false },
    "activities": { "enabled": true|false, "multiSelect": true },
    "fitness": { "enabled": true|false, "multiSelect": false },
    "alcohol": { "enabled": true|false, "multiSelect": false }
  },
  "budget_options": [ { "value": "slug", "label": "80–150 €" } ],
  "destination_options": [ { "value": "slug", "label": "Barcelona", "emoji": "🇪🇸" } ],
  "duration_options": [ { "value": "slug", "label": "Weekend" } ],
  "activity_options": [ { "value": "activity_slug", "label": "Karting", "emoji": "🏎️", "category": "action" } ],
  "custom_questions": [ { "id": "song", "type": "text", "label": "Song wish?", "required": false } ],
  "no_gos": ["3-5 things the group clearly does NOT want"],
  "focus_points": ["3-5 main wishes / priorities"]
}

HARD RULES:
- attendance is ALWAYS { "enabled": true, "multiSelect": false }.
- multiSelect is only meaningful for duration, budget, destination. For every other question set multiSelect exactly as shown (date_blocks/activities = true, the rest = false).
- Enable/disable questions to fit the event: local events (birthday/other) usually disable "destination" and "travel". A relaxed dinner may disable "fitness". Only enable what fits the description.
- Do NOT output option arrays for attendance/travel/fitness/alcohol — their answers are fixed; you only decide their enabled flag.
- budget/destination/duration: give 3-6 options, short lowercase "value" slugs (a-z, 0-9, _), human "label" in the target language, emoji optional.
- activity_options: choose 8-12 items whose "value" is EXACTLY one of these real slugs (do not invent): ${[...ACTIVITY_SLUGS].join(", ")}. category ∈ action|chill|food|outdoor|other.
- custom_questions: 0-3 only. Add one ONLY if the description clearly implies it (e.g. dietary needs → textarea, song wishes → text, t-shirt size → select). "id" = short slug. "type" ∈ text|textarea|select|radio|checkbox|toggle|rating|number|date. select/radio/checkbox need "options": ["…"].
- Keep it tasteful and specific to the description — no filler.`;

    const userPrompt = `Event type: ${event_type}
${ctxLine ? ctxLine + "\n" : ""}Organizer's description / ideas / wishes:
"""${String(description).slice(0, 1500)}"""

Configure the perfect guest form for this event.`;

    const model = Deno.env.get("OPENROUTER_MODEL_PRIMARY") ?? "anthropic/claude-haiku-4.5";
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://event-bliss.com",
        "X-Title": "EventBliss",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ success: false, error: "Rate limit exceeded. Please try again." }, 429, corsHeaders);
      if (aiRes.status === 402) return json({ success: false, error: "AI credits exhausted." }, 402, corsHeaders);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const content = (await aiRes.json())?.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(String(content).replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      throw new Error("Invalid AI response format");
    }

    const settings = sanitizeOutput(raw);

    await supabase.from("ai_usage").insert({ user_id: userId, request_type: "form_generation", tokens_used: 0 });

    return json({ success: true, settings, is_ai_generated: true }, 200, corsHeaders);
  } catch (error) {
    console.error("generate-event-form error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500, corsHeaders);
  }
});

// ── Server-side guardrails: never trust the model's structure ──
function sanitizeOutput(raw: Record<string, unknown>) {
  const qcIn = (raw.question_config ?? {}) as Record<string, { enabled?: boolean; multiSelect?: boolean }>;
  const question_config: Record<string, { enabled: boolean; multiSelect: boolean }> = {};
  const forcedMulti: Record<string, boolean> = { date_blocks: true, activities: true };
  const multiCapable = new Set(["duration", "budget", "destination"]);
  for (const key of CORE_KEYS) {
    const src = qcIn[key] ?? {};
    if (key === "attendance") { question_config[key] = { enabled: true, multiSelect: false }; continue; }
    const enabled = src.enabled !== false;
    const multiSelect = key in forcedMulti ? forcedMulti[key]
      : multiCapable.has(key) ? !!src.multiSelect
      : false;
    question_config[key] = { enabled, multiSelect };
  }

  const cleanOptions = (arr: unknown, max: number) =>
    (Array.isArray(arr) ? arr : [])
      .filter((o): o is Record<string, unknown> => !!o && typeof (o as { value?: unknown }).value === "string" && typeof (o as { label?: unknown }).label === "string")
      .slice(0, max)
      .map((o) => ({
        value: slug(String(o.value)),
        label: String(o.label).slice(0, 60),
        ...(typeof o.emoji === "string" && o.emoji ? { emoji: String(o.emoji).slice(0, 8) } : {}),
      }))
      .filter((o) => o.value.length > 0);

  const activity_options = (Array.isArray(raw.activity_options) ? raw.activity_options : [])
    .filter((o): o is Record<string, unknown> => !!o && typeof (o as { value?: unknown }).value === "string")
    .map((o) => ({ ...o, value: String(o.value) }))
    .filter((o) => ACTIVITY_SLUGS.has(o.value)) // drop invented slugs
    .slice(0, 12)
    .map((o) => ({
      value: o.value,
      label: typeof o.label === "string" ? o.label.slice(0, 60) : o.value,
      emoji: typeof o.emoji === "string" ? o.emoji.slice(0, 8) : "🎯",
      category: ACTIVITY_CATEGORIES.has(String(o.category)) ? String(o.category) : "other",
    }));

  const custom_questions = (Array.isArray(raw.custom_questions) ? raw.custom_questions : [])
    .filter((q): q is Record<string, unknown> => !!q && typeof (q as { label?: unknown }).label === "string" && String((q as { label: unknown }).label).trim().length > 0)
    .slice(0, 3)
    .map((q, i) => {
      const type = CUSTOM_TYPES.has(String(q.type)) ? String(q.type) : "text";
      const base = {
        id: typeof q.id === "string" && q.id ? slug(String(q.id)) : `ai_${i}`,
        type,
        label: String(q.label).slice(0, 100),
        required: !!q.required,
        ...(typeof q.placeholder === "string" ? { placeholder: String(q.placeholder).slice(0, 80) } : {}),
      };
      if (["select", "radio", "checkbox"].includes(type)) {
        const opts = (Array.isArray(q.options) ? q.options : []).filter((x) => typeof x === "string").slice(0, 8).map((x) => String(x).slice(0, 40));
        return { ...base, options: opts.length ? opts : ["Option 1", "Option 2"] };
      }
      return base;
    });

  const strList = (v: unknown) => (Array.isArray(v) ? v : []).filter((x) => typeof x === "string" && x.trim()).slice(0, 6).map((x) => String(x).slice(0, 120));

  return {
    question_config,
    budget_options: cleanOptions(raw.budget_options, 6),
    destination_options: cleanOptions(raw.destination_options, 6),
    duration_options: cleanOptions(raw.duration_options, 4),
    activity_options,
    custom_questions,
    no_gos: strList(raw.no_gos),
    focus_points: strList(raw.focus_points),
  };
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
