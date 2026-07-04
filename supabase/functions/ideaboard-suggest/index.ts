import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// AI idea suggestions for the collaborative Ideenboard. Mirrors the auth +
// credit-gate + OpenRouter pattern of generate-event-form. Returns a short list
// of pinnable ideas ({ title, note, category }) tailored to the event.

const CATEGORIES = new Set([
  "deko", "outfit", "food", "drinks", "activity", "location", "gift", "playlist", "other",
]);

const LANG: Record<string, string> = {
  de: "Antworte ausschließlich mit dem JSON. Alle Titel und Notizen auf Deutsch.",
  en: "Respond with the JSON only. All titles and notes in English.",
  es: "Responde solo con el JSON. Títulos y notas en español.",
  fr: "Réponds uniquement avec le JSON. Titres et notes en français.",
  it: "Rispondi solo con il JSON. Titoli e note in italiano.",
  nl: "Antwoord alleen met de JSON. Titels en notities in het Nederlands.",
  pl: "Odpowiedz tylko JSON-em. Tytuły i notatki po polsku.",
  pt: "Responde apenas com o JSON. Títulos e notas em português.",
  tr: "Sadece JSON ile yanıt ver. Başlıklar ve notlar Türkçe.",
  ar: "أجب بـ JSON فقط. جميع العناوين والملاحظات بالعربية.",
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      event_type = "other",
      theme,
      category = "any",
      honoree_name,
      guest_count,
      language = "en",
      count = 6,
    } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Auth + monthly AI credit gate (same as generate-event-form) ──
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

    const n = Math.min(Math.max(Number(count) || 6, 3), 10);
    const langLine = LANG[language] || LANG.en;
    const wantCat = CATEGORIES.has(String(category)) ? String(category) : "any";
    const ctxLine = [
      theme ? `Theme/vibe: ${theme}` : "",
      honoree_name ? `Honoree: ${honoree_name}` : "",
      guest_count ? `Group size: ${guest_count}` : "",
    ].filter(Boolean).join(" · ");

    const systemPrompt = `You are a creative party-planning assistant filling a shared inspiration board ("Ideenboard") for a group event. Suggest ${n} concrete, specific, inspiring ideas the group can pin. ${langLine}

Each idea is ONE tangible thing (a décor idea, an outfit/dress-code, a dish, a signature drink, an activity, a venue vibe, a gift, or a playlist theme) — not generic advice.

Categories: deko, outfit, food, drinks, activity, location, gift, playlist, other.
${wantCat === "any" ? "Spread the ideas across a few fitting categories." : `Focus ALL ideas on the "${wantCat}" category.`}

Respond with ONLY one valid JSON object (no markdown, no prose):
{ "ideas": [ { "title": "short punchy name (max 6 words)", "note": "one vivid sentence describing it", "category": "one of the categories above" } ] }

Keep it tasteful, on-theme and specific. No filler, no duplicates.`;

    const userPrompt = `Event type: ${event_type}${ctxLine ? "\n" + ctxLine : ""}\nGive ${n} board-ready ideas${wantCat === "any" ? "" : ` for the ${wantCat} category`}.`;

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
        max_tokens: 900,
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

    const ideas = (Array.isArray(raw.ideas) ? raw.ideas : [])
      .filter((i): i is Record<string, unknown> => !!i && typeof (i as { title?: unknown }).title === "string")
      .slice(0, n)
      .map((i) => ({
        title: String(i.title).slice(0, 80),
        note: typeof i.note === "string" ? String(i.note).slice(0, 240) : "",
        category: CATEGORIES.has(String(i.category)) ? String(i.category)
          : wantCat !== "any" ? wantCat : "other",
      }));

    await supabase.from("ai_usage").insert({ user_id: userId, request_type: "ideaboard_suggest", tokens_used: 0 });

    return json({ success: true, ideas }, 200, corsHeaders);
  } catch (error) {
    console.error("ideaboard-suggest error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
