import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing Stripe configuration" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // Create Supabase client with service role for database updates
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR", { message: "No signature provided" });
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR", { message: "Webhook signature verification failed", error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        const customerId = session.customer as string;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const planType = session.metadata?.plan_type || "monthly";
        const userId = session.metadata?.user_id;

        if (!userId) {
          logStep("ERROR", { message: "No user_id in session metadata" });
          break;
        }

        // Determine subscription details based on plan type
        if (planType === "lifetime") {
          // Lifetime purchase - no expiration
          logStep("Processing lifetime purchase", { userId, customerId });
          
          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan: "premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: null, // No subscription for one-time payments
              expires_at: null, // Lifetime = no expiration
              started_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
          
          logStep("Lifetime subscription created", { userId });
        } else if (session.subscription) {
          // Monthly subscription
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          logStep("Processing monthly subscription", { userId, subscriptionId });
          
          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: userId,
              plan: "premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              started_at: new Date(subscription.start_date * 1000).toISOString(),
            }, { onConflict: "user_id" });
          
          logStep("Monthly subscription created", { userId, subscriptionId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Find user by stripe_subscription_id
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .maybeSingle();

        if (existingSub) {
          if (subscription.status === "active") {
            await supabaseClient
              .from("subscriptions")
              .update({
                plan: "premium",
                expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);
            
            logStep("Subscription renewed", { userId: existingSub.user_id });
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            await supabaseClient
              .from("subscriptions")
              .update({
                plan: "free",
                expires_at: null,
              })
              .eq("stripe_subscription_id", subscription.id);
            
            logStep("Subscription canceled", { userId: existingSub.user_id });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        await supabaseClient
          .from("subscriptions")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            expires_at: null,
          })
          .eq("stripe_subscription_id", subscription.id);
        
        logStep("User downgraded to free");
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          logStep("Invoice paid, updating subscription", { subscriptionId: subscription.id });
          
          await supabaseClient
            .from("subscriptions")
            .update({
              plan: "premium",
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, customerId: invoice.customer });
        // Optionally mark subscription as past_due or send notification
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
