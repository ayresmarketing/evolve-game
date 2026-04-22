import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    // 1. Check DB first (fast path — updated by webhook)
    const { data: dbRecord } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (dbRecord) {
      logStep("DB record found", { status: dbRecord.status });

      // If DB says active or trialing and not expired, trust it
      const isActiveOrTrial = ["active", "trialing"].includes(dbRecord.status);
      const notExpired = dbRecord.subscription_end
        ? new Date(dbRecord.subscription_end) > new Date()
        : true;

      if (isActiveOrTrial && notExpired) {
        return new Response(JSON.stringify({
          subscribed: true,
          trial: dbRecord.status === "trialing",
          subscription_end: dbRecord.subscription_end,
          trial_end: dbRecord.trial_end,
          status: dbRecord.status,
          cancel_at_period_end: dbRecord.cancel_at_period_end,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // If DB says canceled/past_due but record is recent (< 5 min), trust it
      const updatedAt = new Date(dbRecord.updated_at);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (updatedAt > fiveMinAgo) {
        return new Response(JSON.stringify({
          subscribed: false,
          trial: false,
          subscription_end: dbRecord.subscription_end,
          trial_end: null,
          status: dbRecord.status,
          cancel_at_period_end: dbRecord.cancel_at_period_end,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // 2. Fallback: query Stripe directly and sync to DB
    logStep("Falling back to Stripe API");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false, trial: false, status: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const activeSubs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const trialSubs = await stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 });
    const pastDueSubs = await stripe.subscriptions.list({ customer: customerId, status: "past_due", limit: 1 });

    const subscription = activeSubs.data[0] || trialSubs.data[0] || pastDueSubs.data[0];

    if (!subscription) {
      // Sync canceled state to DB
      if (dbRecord) {
        await supabaseClient.from("subscribers").update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        }).eq("email", user.email);
      }
      logStep("No active subscription in Stripe");
      return new Response(JSON.stringify({ subscribed: false, trial: false, status: "canceled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const isTrial = subscription.status === "trialing";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;

    // Sync to DB
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      trial_end: trialEnd,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    logStep("Synced to DB from Stripe", { status: subscription.status });

    return new Response(JSON.stringify({
      subscribed: true,
      trial: isTrial,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
