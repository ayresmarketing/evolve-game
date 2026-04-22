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

async function upsertSubscriber(data: {
  email: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  status: string;
  trial_end?: string | null;
  subscription_end?: string | null;
  cancel_at_period_end?: boolean;
}) {
  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { ...data, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
  if (error) logStep("DB upsert error", { error: error.message });
  else logStep("DB upserted", { email: data.email, status: data.status });
}

async function getEmailFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).email ?? null;
  } catch {
    return null;
  }
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const email = session.customer_email ?? (await getEmailFromCustomer(customerId));
        if (!email) { logStep("No email from checkout session"); break; }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriber({
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: sub.status,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(customerId);
        if (!email) { logStep("No email for subscription event"); break; }

        await upsertSubscriber({
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const email = await getEmailFromCustomer(customerId);
        if (!email) break;

        await upsertSubscriber({
          email,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: "canceled",
          trial_end: null,
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;

        await upsertSubscriber({
          email,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          status: "active",
          trial_end: null,
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;

        await upsertSubscriber({
          email,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          status: "past_due",
          subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          customer: charge.customer,
        });
        // Refund is logged; subscription status is handled by subscription events
        break;
      }

      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Trial ending soon", {
          subscriptionId: sub.id,
          trialEnd: sub.trial_end,
        });
        // Extensibility point: send email reminder here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    logStep("Handler error", { err: String(err) });
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
