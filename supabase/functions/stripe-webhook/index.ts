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

/** Gera senha aleatória de 12 chars sem caracteres ambíguos */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

/** Envia e-mail de boas-vindas com credenciais via Resend */
async function sendWelcomeEmail(email: string, password: string, siteUrl: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    logStep("RESEND_API_KEY not set — credentials (dev only):", { email, password });
    return;
  }

  const from = Deno.env.get("RESEND_FROM") || "Sua Vida é um Jogo <onboarding@resend.dev>";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{margin:0;padding:0;background:#040a17;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
.wrap{max-width:480px;margin:40px auto;padding:0 20px}
.header{text-align:center;padding-bottom:24px}
.logo{width:56px;height:56px;background:linear-gradient(135deg,#00e879,#06d6e8);border-radius:14px;display:inline-block;line-height:56px;font-size:26px;text-align:center}
.brand{font-size:9px;letter-spacing:.28em;color:rgba(0,232,121,.8);text-transform:uppercase;margin:8px 0 0;display:block}
.card{background:#0d1526;border:1px solid rgba(0,232,121,.18);border-radius:16px;padding:32px}
h1{font-size:20px;color:#fff;margin:0 0 8px;letter-spacing:.03em}
p{font-size:13px;color:rgba(255,255,255,.55);line-height:1.6;margin:0 0 16px}
.box{background:rgba(0,232,121,.08);border:1px solid rgba(0,232,121,.22);border-radius:10px;padding:16px 18px;margin:12px 0}
.lbl{font-size:9px;text-transform:uppercase;letter-spacing:.2em;color:rgba(0,232,121,.7);margin:0 0 4px}
.val{font-size:15px;color:#fff;letter-spacing:.06em;font-family:monospace;margin:0}
.btn{display:block;background:linear-gradient(135deg,#00e879,#06d6e8);color:#040a17!important;text-decoration:none;font-weight:700;text-align:center;padding:14px 24px;border-radius:10px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin:24px 0 8px}
.note{font-size:11px;color:rgba(255,255,255,.30);border-top:1px solid rgba(255,255,255,.07);padding-top:16px;margin-top:16px}
.footer{text-align:center;font-size:10px;color:rgba(255,255,255,.20);margin-top:20px}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div class="logo">⚡</div>
    <span class="brand">Sua Vida é um Jogo</span>
  </div>
  <div class="card">
    <h1>Bem-vindo ao Sistema! 🎮</h1>
    <p>Sua assinatura foi confirmada. Use as credenciais abaixo para acessar o app:</p>
    <div class="box"><p class="lbl">Email</p><p class="val">${email}</p></div>
    <div class="box"><p class="lbl">Senha temporária</p><p class="val">${password}</p></div>
    <a class="btn" href="${siteUrl}/auth">Acessar o Sistema →</a>
    <p class="note">💡 Guarde essa senha. Você pode alterá-la quando quiser nas Configurações do app após fazer login.</p>
  </div>
  <div class="footer">© 2026 Sua Vida é um Jogo · Não compartilhe suas credenciais</div>
</div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: "Bem-vindo! Suas credenciais de acesso 🎮", html }),
    });
    if (!res.ok) {
      const body = await res.text();
      logStep("Resend error", { status: res.status, body });
    } else {
      logStep("Welcome email sent", { email });
    }
  } catch (err) {
    logStep("sendWelcomeEmail exception", { err: String(err) });
  }
}

/** Cria usuário Supabase com senha aleatória e envia e-mail com credenciais */
async function createUserFromSubscription(email: string, name?: string): Promise<void> {
  try {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      logStep("User already exists, skipping", { email });
      return;
    }

    const password = generatePassword();
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name || '', created_via: 'stripe_subscription' },
    });

    if (error) {
      logStep("Error creating user", { email, error: error.message });
      return;
    }

    logStep("User created with random password", { email });

    const siteUrl = Deno.env.get("SITE_URL") || "https://suavidaeumjogo.netlify.app";
    await sendWelcomeEmail(email, password, siteUrl);
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
