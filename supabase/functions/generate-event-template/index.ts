import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, description, language = 'en' } = await req.json();

    if (!event_type || !description) {
      return new Response(
        JSON.stringify({ error: 'event_type and description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInstructions = {
      de: 'Antworte auf Deutsch.',
      en: 'Respond in English.',
      es: 'Responde en español.',
      fr: 'Réponds en français.',
      it: 'Rispondi in italiano.',
      nl: 'Antwoord in het Nederlands.',
      pl: 'Odpowiedz po polsku.',
      pt: 'Responda em português.',
      tr: 'Türkçe cevap ver.',
      ar: 'أجب بالعربية.',
    };

    const langInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    const systemPrompt = `You are an expert event planner. Generate a customized survey configuration for an event based on the user's description.

${langInstruction}

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, just JSON) with this exact structure:
{
  "budget_options": [
    { "value": "range_key", "label": "Display Label (with currency)" }
  ],
  "destination_options": [
    { "value": "destination_key", "label": "Display Label", "emoji": "optional_emoji" }
  ],
  "activity_options": [
    { "value": "activity_key", "label": "Display Label", "emoji": "emoji", "category": "action|chill|food|outdoor|other" }
  ],
  "duration_options": [
    { "value": "duration_key", "label": "Display Label" }
  ],
  "recommended_design": "design_template_id"
}

Guidelines:
- Generate 4-5 budget options appropriate for the event type
- Generate 4-6 destination options based on the description
- Generate 8-12 activity options that match the event style
- Generate 3-4 duration options
- recommended_design should be one of: "neon-nights", "beach-vibes", "garden-party", "elegant-dark", "modern-minimal", "sunset-glow", "mountain-escape"
- All labels should be in the user's language (${language})
- Make options specific to the event description, not generic
- Use appropriate emojis for destinations and activities`;

    const userPrompt = `Event type: ${event_type}
User description: "${description}"

Generate a custom survey configuration that matches this event perfectly.`;

    console.log('Generating template for:', { event_type, language, description: description.substring(0, 100) });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response content:', content.substring(0, 200));

    // Parse the JSON from the AI response
    let template;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      template = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate the template structure
    if (!template.budget_options || !template.destination_options || 
        !template.activity_options || !template.duration_options) {
      console.error('Invalid template structure:', template);
      throw new Error('AI response missing required fields');
    }

    console.log('Successfully generated template with', {
      budgets: template.budget_options.length,
      destinations: template.destination_options.length,
      activities: template.activity_options.length,
      durations: template.duration_options.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        template: {
          ...template,
          is_ai_generated: true,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-event-template:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
