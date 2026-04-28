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

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#04080f;font-family:'Inter',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .outer{padding:48px 20px}
  .wrap{max-width:520px;margin:0 auto}
  /* Header */
  .header{text-align:center;margin-bottom:36px}
  .logo-ring{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#00e879,#06d6e8);box-shadow:0 0 40px rgba(0,232,121,.45),0 0 80px rgba(0,232,121,.15)}
  .logo-bolt{font-size:28px;line-height:1}
  .brand-tag{display:inline-block;margin-top:14px;font-size:9px;letter-spacing:.32em;color:rgba(0,232,121,.75);text-transform:uppercase}
  /* Card */
  .card{background:linear-gradient(160deg,#0b1628 0%,#0d1a30 100%);border:1px solid rgba(0,232,121,.14);border-radius:20px;padding:40px 36px;position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:-80px;right:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(0,232,121,.06) 0%,transparent 70%);pointer-events:none}
  /* Badge */
  .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(0,232,121,.10);border:1px solid rgba(0,232,121,.20);border-radius:100px;padding:5px 12px;margin-bottom:22px}
  .badge-dot{width:6px;height:6px;border-radius:50%;background:#00e879;box-shadow:0 0 6px rgba(0,232,121,.8)}
  .badge-text{font-size:10px;letter-spacing:.18em;color:rgba(0,232,121,.9);text-transform:uppercase;font-weight:600}
  /* Typography */
  h1{font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-.01em;margin-bottom:14px}
  h1 span{background:linear-gradient(135deg,#00e879,#06d6e8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .subtitle{font-size:14px;color:rgba(255,255,255,.50);line-height:1.65;margin-bottom:28px;font-weight:400}
  /* Divider */
  .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(0,232,121,.18),transparent);margin:24px 0}
  /* Credential block */
  .cred-label{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(0,232,121,.65);font-weight:600;margin-bottom:8px}
  .cred-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 20px;margin-bottom:12px}
  .cred-value{font-size:15px;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:.08em;font-weight:500;word-break:break-all}
  .password-highlight{background:rgba(0,232,121,.12);border:1px solid rgba(0,232,121,.28);border-radius:12px;padding:18px 20px;margin-bottom:12px}
  .password-value{font-size:22px;color:#00e879;font-family:'Courier New',monospace;letter-spacing:.15em;font-weight:700;text-shadow:0 0 20px rgba(0,232,121,.4)}
  /* CTA */
  .cta-wrap{margin:28px 0 8px}
  .cta{display:block;background:linear-gradient(135deg,#00e879,#06d6e8);color:#04080f!important;text-decoration:none;font-weight:700;text-align:center;padding:16px 28px;border-radius:12px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 0 28px rgba(0,232,121,.35),0 4px 16px rgba(0,0,0,.3)}
  /* Note */
  .note{font-size:12px;color:rgba(255,255,255,.28);line-height:1.6;text-align:center;margin-top:20px}
  .note strong{color:rgba(255,255,255,.45);font-weight:500}
  /* Footer */
  .footer{text-align:center;margin-top:28px}
  .footer p{font-size:11px;color:rgba(255,255,255,.18);line-height:1.7}
  .footer a{color:rgba(0,232,121,.5);text-decoration:none}
</style>
</head>
<body>
<div class="outer">
<div class="wrap">

  <!-- Header -->
  <div class="header">
    <div class="logo-ring"><span class="logo-bolt">&#9889;</span></div>
    <span class="brand-tag">Sua Vida &eacute; um Jogo</span>
  </div>

  <!-- Card -->
  <div class="card">
    <div class="badge">
      <div class="badge-dot"></div>
      <span class="badge-text">Acesso liberado</span>
    </div>

    <h1>Parab&eacute;ns pela<br>sua <span>decis&atilde;o!</span></h1>

    <p class="subtitle">
      Sua jornada de evolu&ccedil;&atilde;o come&ccedil;a agora. Preparamos tudo para que voc&ecirc; tenha acesso imediato ao sistema &mdash; abaixo est&atilde;o suas credenciais de entrada.
    </p>

    <div class="divider"></div>

    <p class="cred-label">Seu e-mail de acesso</p>
    <div class="cred-card">
      <p class="cred-value">${email}</p>
    </div>

    <p class="cred-label" style="margin-top:16px">Senha gerada para voc&ecirc;</p>
    <div class="password-highlight">
      <p class="password-value">${password}</p>
    </div>

    <p class="subtitle" style="margin-bottom:0;font-size:13px">
      Esta &eacute; a senha gerada para que voc&ecirc; tenha acesso &agrave; sua conta. Se quiser, pode trocá-la a qualquer momento diretamente no sistema, na aba de <strong style="color:rgba(255,255,255,.55)">Configura&ccedil;&otilde;es</strong>.
    </p>

    <div class="cta-wrap">
      <a class="cta" href="${siteUrl}/auth">Entrar no Sistema &rarr;</a>
    </div>

    <p class="note">
      <strong>Guarde este e-mail.</strong> Ele cont&eacute;m suas credenciais de acesso.<br>
      N&atilde;o compartilhe sua senha com ningu&eacute;m.
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>&copy; 2026 Sua Vida &eacute; um Jogo &nbsp;&middot;&nbsp; Todos os direitos reservados</p>
    <p style="margin-top:4px">D&uacute;vidas? Entre em contato pelo suporte.</p>
  </div>

</div>
</div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: "Parabéns pela sua decisão! Aqui estão seus acessos 🎮", html }),
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
