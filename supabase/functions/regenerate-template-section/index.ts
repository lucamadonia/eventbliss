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
    const { section, currentItems, feedback, eventContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const sectionPrompts: Record<string, string> = {
      budget: `Generate 4-5 budget range options for an event. 
        Each should have a value (like "budget_100_200"), label (like "€100-200"), and optionally an emoji.
        Consider different spending levels from budget-friendly to premium.`,
      destination: `Generate 4-6 destination options for an event.
        Each should have a value (like "barcelona"), label (like "Barcelona"), and an emoji representing the location.
        Mix local options with travel destinations.`,
      activity: `Generate 8-12 activity options for an event.
        Each should have a value, label, emoji, and category (action, chill, food, outdoor, or other).
        Provide a diverse mix across categories.`,
      duration: `Generate 3-4 duration options for an event.
        Each should have a value (like "weekend"), label (like "Weekend (2-3 days)").
        Include day trip, weekend, and longer options.`,
    };

    const eventType = eventContext?.eventType || 'event';
    const honoreeName = eventContext?.honoreeName || '';
    
    let systemPrompt = `You are an event planning assistant. Generate creative and appropriate options for a ${eventType}${honoreeName ? ` for ${honoreeName}` : ''}.`;
    
    if (feedback) {
      systemPrompt += ` The user has requested: "${feedback}". Please incorporate this feedback.`;
    }

    const currentItemsContext = currentItems?.length > 0 
      ? `Current items that could be replaced or improved: ${JSON.stringify(currentItems)}`
      : '';

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
          { 
            role: 'user', 
            content: `${sectionPrompts[section] || 'Generate options for this section.'}\n\n${currentItemsContext}\n\nRespond with a JSON array of items only.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_items',
              description: 'Provide the generated items for the event template section',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        value: { type: 'string', description: 'Unique identifier for the item (snake_case)' },
                        label: { type: 'string', description: 'Display label for the item' },
                        emoji: { type: 'string', description: 'Optional emoji for the item' },
                        category: { type: 'string', description: 'Category for activities (action, chill, food, outdoor, other)' }
                      },
                      required: ['value', 'label'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['items'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_items' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    
    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let items: any[] = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        items = parsed.items || [];
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }

    console.log(`Generated ${items.length} items for section: ${section}`);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regenerate-template-section:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
