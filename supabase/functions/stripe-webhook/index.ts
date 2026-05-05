import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

/** Convida usuário via Supabase: recebe e-mail → define senha → faz login */
async function createUserFromSubscription(email: string, name?: string): Promise<void> {
  try {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      logStep("User already exists, skipping", { email });
      return;
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://suavidaeumjogo.ayresmarketing.com";
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { display_name: name || '', created_via: 'stripe_subscription' },
      redirectTo: `${siteUrl}/reset-password`,
    });
    if (error) logStep("Error inviting user", { email, error: error.message });
    else logStep("User invited", { email });
  } catch (err) {
    logStep("createUserFromSubscription error", { err: String(err) });
  }
}

async function upsertSubscriber(data: {
  email: string; stripe_customer_id: string; stripe_subscription_id?: string;
  status: string; trial_end?: string | null; subscription_end?: string | null; cancel_at_period_end?: boolean;
}) {
  try {
    const { error } = await supabase.from("subscribers").upsert(
      { ...data, updated_at: new Date().toISOString() }, { onConflict: "email" }
    );
    if (error) logStep("DB upsert error", { error: error.message });
    else logStep("DB upserted", { email: data.email, status: data.status });
  } catch (err) { logStep("upsertSubscriber error", { err: String(err) }); }
}

async function getEmailFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).email ?? null;
  } catch { return null; }
}

function toISO(ts: number | null | undefined): string | null {
  if (!ts) return null;
  try { return new Date(ts * 1000).toISOString(); } catch { return null; }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !webhookSecret) {
    logStep("Missing signature or webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Webhook signature verification failed", { err: String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  switch (event.type) {

    case "checkout.session.completed": {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (!customerId || !subscriptionId) { logStep("Missing customer or subscription"); break; }
        const email = session.customer_email ?? (await getEmailFromCustomer(customerId));
        if (!email) { logStep("No email from checkout session"); break; }
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriber({ email, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, status: sub.status, trial_end: toISO(sub.trial_end), subscription_end: toISO(sub.current_period_end), cancel_at_period_end: sub.cancel_at_period_end ?? false });
        let customerName: string | undefined;
        try { const c = await stripe.customers.retrieve(customerId); if (!c.deleted) customerName = (c as any).name || undefined; } catch { }
        await createUserFromSubscription(email, customerName);
      } catch (err) { logStep("checkout.session.completed error", { err: String(err) }); }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      try {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        if (!customerId) break;
        const email = await getEmailFromCustomer(customerId);
        if (!email) { logStep("No email for subscription event"); break; }
        await upsertSubscriber({ email, stripe_customer_id: customerId, stripe_subscription_id: sub.id, status: sub.status, trial_end: toISO(sub.trial_end), subscription_end: toISO(sub.current_period_end), cancel_at_period_end: sub.cancel_at_period_end ?? false });
      } catch (err) { logStep(`${event.type} error`, { err: String(err) }); }
      break;
    }

    case "customer.subscription.deleted": {
      try {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        if (!customerId) break;
        const email = await getEmailFromCustomer(customerId);
        if (!email) break;
        await upsertSubscriber({ email, stripe_customer_id: customerId, stripe_subscription_id: sub.id, status: "canceled", trial_end: null, subscription_end: toISO(sub.current_period_end), cancel_at_period_end: false });
      } catch (err) { logStep("customer.subscription.deleted error", { err: String(err) }); }
      break;
    }

    case "invoice.payment_succeeded": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;
        await upsertSubscriber({ email, stripe_customer_id: sub.customer as string, stripe_subscription_id: sub.id, status: "active", trial_end: null, subscription_end: toISO(sub.current_period_end), cancel_at_period_end: sub.cancel_at_period_end ?? false });
      } catch (err) { logStep("invoice.payment_succeeded error", { err: String(err) }); }
      break;
    }

    case "invoice.payment_failed": {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;
        await upsertSubscriber({ email, stripe_customer_id: sub.customer as string, stripe_subscription_id: sub.id, status: "past_due", subscription_end: toISO(sub.current_period_end), cancel_at_period_end: sub.cancel_at_period_end ?? false });
      } catch (err) { logStep("invoice.payment_failed error", { err: String(err) }); }
      break;
    }

    case "charge.refunded":
      logStep("Charge refunded", { chargeId: (event.data.object as Stripe.Charge).id });
      break;

    case "customer.subscription.trial_will_end":
      logStep("Trial ending soon", { subscriptionId: (event.data.object as Stripe.Subscription).id });
      break;

    default:
      logStep("Unhandled event type", { type: event.type });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }, status: 200,
  });
});
