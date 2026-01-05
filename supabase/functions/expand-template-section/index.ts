import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const sectionPrompts: Record<string, string> = {
      budget: `Generate 2-3 ADDITIONAL budget range options that complement the existing ones.
        Look at the existing items and suggest different price ranges that aren't covered yet.
        Each should have a value (like "budget_100_200"), label (like "€100-200"), and optionally an emoji.`,
      destination: `Generate 2-3 ADDITIONAL destination options that complement the existing ones.
        Look at the existing items and suggest different types of destinations.
        Each should have a value (like "barcelona"), label (like "Barcelona"), and an emoji.`,
      activity: `Generate 3-5 ADDITIONAL activity options that complement the existing ones.
        Look at the existing items and suggest activities from different categories that aren't well represented.
        Each should have a value, label, emoji, and category (action, chill, food, outdoor, or other).`,
      duration: `Generate 1-2 ADDITIONAL duration options that complement the existing ones.
        Look at the existing items and suggest different lengths that aren't covered.
        Each should have a value (like "one_week"), label (like "One Week").`,
    };

    const eventType = eventContext?.eventType || 'event';
    const honoreeName = eventContext?.honoreeName || '';
    
    let systemPrompt = `You are an event planning assistant. Generate ADDITIONAL options (not replacements) for a ${eventType}${honoreeName ? ` for ${honoreeName}` : ''}.`;
    
    if (feedback) {
      systemPrompt += ` The user has requested: "${feedback}". Please incorporate this feedback when generating new items.`;
    }

    const currentItemsContext = currentItems?.length > 0 
      ? `Existing items (DO NOT repeat these, generate DIFFERENT ones): ${JSON.stringify(currentItems)}`
      : '';

    console.log(`Expanding section: ${section} for user: ${userId || 'anonymous'}`);

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
            content: `${sectionPrompts[section] || 'Generate additional options for this section.'}\n\n${currentItemsContext}\n\nRespond with a JSON array of NEW items only (not existing ones).`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_items',
              description: 'Provide the additional generated items for the event template section',
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
        request_type: 'template_expansion',
        tokens_used: 0,
      });
      console.log(`Deducted 1 credit from user: ${userId}`);
    }

    console.log(`Generated ${items.length} additional items for section: ${section}`);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in expand-template-section:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
