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

function toISO(ts: number | null | undefined): string | null {
  if (!ts) return null;
  try { return new Date(ts * 1000).toISOString(); } catch { return null; }
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    // ── 1. Check DB first (fast path — no Stripe needed) ───────────────
    const { data: dbRecord } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (dbRecord) {
      logStep("DB record found", { status: dbRecord.status });

      const isActiveOrTrial = ["active", "trialing"].includes(dbRecord.status);
      const notExpired = dbRecord.subscription_end
        ? new Date(dbRecord.subscription_end) > new Date()
        : true; // null = no expiry recorded = trust status field

      if (isActiveOrTrial && notExpired) {
        logStep("Returning subscribed from DB");
        return new Response(JSON.stringify({
          subscribed: true,
          trial: dbRecord.status === "trialing",
          subscription_end: dbRecord.subscription_end,
          trial_end: dbRecord.trial_end,
          status: dbRecord.status,
          cancel_at_period_end: dbRecord.cancel_at_period_end ?? false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Recent canceled/past_due record → trust it
      const updatedAt = new Date(dbRecord.updated_at);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (updatedAt > fiveMinAgo) {
        logStep("Returning not-subscribed from recent DB record");
        return new Response(JSON.stringify({
          subscribed: false,
          trial: false,
          subscription_end: dbRecord.subscription_end,
          trial_end: null,
          status: dbRecord.status,
          cancel_at_period_end: dbRecord.cancel_at_period_end ?? false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // ── 2. Fallback: query Stripe directly ─────────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not set, no DB record — returning not subscribed");
      return new Response(JSON.stringify({ subscribed: false, trial: false, status: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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
    const [activeSubs, trialSubs, pastDueSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "past_due", limit: 1 }),
    ]);

    const subscription = activeSubs.data[0] || trialSubs.data[0] || pastDueSubs.data[0];

    if (!subscription) {
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
    const subscriptionEnd = toISO((subscription as any).current_period_end);
    const trialEnd = toISO((subscription as any).trial_end);

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      trial_end: trialEnd,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: (subscription as any).cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    logStep("Synced to DB from Stripe", { status: subscription.status });

    return new Response(JSON.stringify({
      subscribed: true,
      trial: isTrial,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      status: subscription.status,
      cancel_at_period_end: (subscription as any).cancel_at_period_end ?? false,
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
