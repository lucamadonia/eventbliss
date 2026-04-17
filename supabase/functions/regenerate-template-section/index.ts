import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, currentItems, feedback, eventContext } = await req.json();
    
    // Get user from auth header for credit tracking
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Check and deduct credits if user is authenticated
    if (userId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get current usage
      const { count: usedCredits } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      // Get user's plan limit from plan_configs
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .single();

      const planKey = subscription?.plan || 'free';
      console.log('User plan:', planKey, 'Used credits this month:', usedCredits);
      
      const { data: planConfig, error: planError } = await supabase
        .from('plan_configs')
        .select('ai_credits_monthly')
        .eq('plan_key', planKey)
        .single();

      if (planError) {
        console.log('Plan config error:', planError.message);
      }

      // Default to 5 credits for free plan if config not found
      const creditLimit = planConfig?.ai_credits_monthly ?? 5;
      console.log('Credit check:', { usedCredits, creditLimit });

      if ((usedCredits || 0) >= creditLimit) {
        console.log('No credits remaining');
        return new Response(
          JSON.stringify({ error: 'No credits remaining' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Require authentication for AI features
      console.log('User not authenticated - requiring login');
      return new Response(
        JSON.stringify({ error: 'Authentication required for AI features' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
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

    console.log(`Regenerating section: ${section}`);

    const model = Deno.env.get('OPENROUTER_MODEL_FAST') ?? 'anthropic/claude-haiku-4.5';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://event-bliss.com',
        'X-Title': 'EventBliss',
      },
      body: JSON.stringify({
        model,
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

    // Record credit usage if user is authenticated
    if (userId) {
      await supabase.from('ai_usage').insert({
        user_id: userId,
        request_type: 'section_regeneration',
        tokens_used: 0,
      });
      console.log('Credit deducted');
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
