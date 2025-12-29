import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  type: "trip_ideas" | "activities" | "day_plan" | "budget_estimate" | "chat" | "message_enhance";
  context: {
    event_type: string;
    honoree_name: string;
    participant_count: number;
    avg_budget?: string;
    top_activities?: string[];
    restrictions?: string[];
    destination_pref?: string;
    date_info?: string;
    fitness_level?: string;
    duration?: string;
    // For message_enhance
    original_text?: string;
    enhancement_type?: "casual" | "formal" | "shorter" | "detailed" | "custom";
    custom_instruction?: string;
    template_type?: string;
  };
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { type, context, message } = body;

    console.log("AI Assistant request:", type, context);

    // Build system prompt based on request type
    let systemPrompt = `Du bist ein erfahrener Event-Planer, spezialisiert auf JGAs (Junggesellenabschiede), Geburtstagsfeiern und Gruppenreisen.
Du gibst kreative, praktische und umsetzbare Vorschläge.
Antworte immer auf Deutsch und in einem lockeren, aber professionellen Ton.
Formatiere deine Antworten mit Emojis und klaren Abschnitten.`;

    let userPrompt = "";

    const contextInfo = `
Event-Typ: ${context.event_type === "bachelor" ? "Junggesellenabschied (JGA)" : context.event_type === "bachelorette" ? "JGA (Braut)" : context.event_type === "birthday" ? "Geburtstag" : "Gruppenreise"}
Ehrengast: ${context.honoree_name}
Teilnehmer: ${context.participant_count} Personen
${context.avg_budget ? `Budget pro Person: ${context.avg_budget}` : ""}
${context.destination_pref ? `Destination-Präferenz: ${context.destination_pref}` : ""}
${context.top_activities?.length ? `Bevorzugte Aktivitäten: ${context.top_activities.join(", ")}` : ""}
${context.restrictions?.length ? `Einschränkungen: ${context.restrictions.join(", ")}` : ""}
${context.fitness_level ? `Fitness-Level: ${context.fitness_level}` : ""}
${context.duration ? `Dauer: ${context.duration}` : ""}
${context.date_info ? `Zeitraum: ${context.date_info}` : ""}`;

    switch (type) {
      case "trip_ideas":
        userPrompt = `${contextInfo}

Schlage 3-4 passende Trip-Ideen vor. Für jede Idee:
1. 🎯 Name/Titel des Trips
2. 📍 Destination/Ort
3. 💡 Kurzbeschreibung (2-3 Sätze)
4. 💰 Geschätzte Kosten pro Person
5. ✅ Warum es passt (basierend auf den Präferenzen)

Sei kreativ aber realistisch!`;
        break;

      case "activities":
        userPrompt = `${contextInfo}

Schlage 5-6 passende Aktivitäten vor, die zur Gruppe passen. Für jede Aktivität:
1. 🎯 Name der Aktivität
2. ⏱️ Dauer (z.B. 2h)
3. 💰 Kosten pro Person
4. 💪 Fitness-Anforderung (leicht/mittel/anspruchsvoll)
5. 📝 Kurze Beschreibung

Mische verschiedene Arten: Action, Entspannung, Essen/Trinken, Erlebnis.`;
        break;

      case "day_plan":
        userPrompt = `${contextInfo}

Erstelle einen detaillierten Tagesablauf für das Event. Struktur:

⏰ Zeitplan mit Uhrzeiten
🚗 Transport zwischen Aktivitäten
🍽️ Essen & Trinken Empfehlungen
💡 Pro-Tipps für die Organisation
⚠️ Was man beachten sollte

Der Plan sollte realistisch und durchführbar sein.`;
        break;

      case "budget_estimate":
        userPrompt = `${contextInfo}

Erstelle eine detaillierte Budget-Schätzung für das Event:

📊 Aufschlüsselung nach Kategorien:
- Transport
- Unterkunft (falls mehrtägig)
- Aktivitäten
- Essen & Trinken
- Extras/Überraschungen

💰 Gesamtkosten pro Person
💡 Spartipps
⚠️ Versteckte Kosten, die man einplanen sollte`;
        break;

      case "chat":
        userPrompt = `${contextInfo}

Benutzer-Frage: ${message || "Wie kann ich dir helfen?"}

Beantworte die Frage basierend auf dem Event-Kontext.`;
        break;

      case "message_enhance":
        const enhancementInstructions: Record<string, string> = {
          casual: "Mache den Text lockerer, freundlicher und informeller. Nutze mehr Emojis und eine persönlichere Ansprache.",
          formal: "Mache den Text formeller und professioneller. Reduziere Emojis und verwende eine höflichere Ansprache.",
          shorter: "Kürze den Text auf das Wesentliche. Behalte die wichtigsten Informationen, aber mache ihn kompakter.",
          detailed: "Füge mehr Details und hilfreiche Informationen hinzu. Erweitere den Text sinnvoll.",
          custom: context.custom_instruction || "Passe den Text an.",
        };
        
        const enhanceType = context.enhancement_type || "casual";
        
        userPrompt = `Du bist ein Experte für Event-Kommunikation.

ORIGINAL-NACHRICHT (Template-Typ: ${context.template_type || "allgemein"}):
${context.original_text}

ANWEISUNG: ${enhancementInstructions[enhanceType]}

EVENT-KONTEXT:
- Event-Typ: ${context.event_type === "bachelor" ? "Junggesellenabschied (JGA)" : context.event_type === "bachelorette" ? "JGA (Braut)" : context.event_type === "birthday" ? "Geburtstag" : "Gruppenreise"}
- Ehrengast: ${context.honoree_name}
- Teilnehmer: ${context.participant_count} Personen

Gib NUR die verbesserte Nachricht zurück, ohne zusätzliche Erklärungen. Behalte wichtige Platzhalter wie {{honoree}}, {{surveyLink}}, {{accessCode}} etc. bei.`;
        break;

      default:
        userPrompt = message || "Wie kann ich bei der Event-Planung helfen?";
    }

    console.log("Calling Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Zu viele Anfragen. Bitte warte einen Moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI-Kontingent erschöpft." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Keine Antwort erhalten.";

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: content,
        type 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-assistant:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
