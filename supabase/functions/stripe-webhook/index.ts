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
  body,table,td,p,a,span{margin:0;padding:0;font-family:Helvetica,Arial,sans-serif}
  body{background:#000000}
</style>
</head>
<body style="margin:0;padding:0;background:#000000">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000">
<tr><td align="center" style="padding:40px 20px;background:#000000">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" width="64" height="64"
        style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#00e879,#06d6e8);font-size:28px;line-height:64px;text-align:center;color:#000000">
        &#9889;
      </td></tr>
      <tr><td align="center" style="padding-top:10px;font-size:9px;letter-spacing:4px;color:#00e879;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;font-weight:700">
        SUA VIDA &Eacute; UM JOGO
      </td></tr>
    </table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#0d0d0d;border:1px solid #1a3a2a;border-radius:18px;padding:36px 32px">

    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px">
      <tr>
        <td width="8" height="8" style="width:8px;height:8px;background:#00e879;border-radius:50%;vertical-align:middle">&nbsp;</td>
        <td style="padding-left:8px;font-size:10px;letter-spacing:3px;color:#00e879;text-transform:uppercase;font-weight:700;vertical-align:middle;font-family:Helvetica,Arial,sans-serif">
          ACESSO LIBERADO
        </td>
      </tr>
    </table>

    <!-- Title -->
    <p style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 12px 0;font-family:Helvetica,Arial,sans-serif">
      Parab&eacute;ns pela sua <span style="color:#00e879">decis&atilde;o!</span>
    </p>

    <!-- Subtitle -->
    <p style="font-size:13px;color:#888888;line-height:1.65;margin:0 0 24px 0;font-family:Helvetica,Arial,sans-serif">
      Sua assinatura foi confirmada. Use as credenciais abaixo para acessar o sistema.
    </p>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td height="1" bgcolor="#1a3a2a" style="font-size:0;line-height:0">&nbsp;</td></tr>
    </table>

    <!-- Email label -->
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#00a855;font-weight:700;margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif">
      SEU E-MAIL DE ACESSO
    </p>
    <!-- Email box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td style="background:#161616;border:1px solid #2a2a2a;border-radius:10px;padding:14px 18px">
        <p style="font-size:14px;color:#ffffff;font-family:'Courier New',Courier,monospace;word-break:break-all;margin:0">
          ${email}
        </p>
      </td></tr>
    </table>

    <!-- Password label -->
    <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#00a855;font-weight:700;margin:0 0 8px 0;font-family:Helvetica,Arial,sans-serif">
      SENHA GERADA PARA VOC&Ecirc;
    </p>
    <!-- Password box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td style="background:#0a1f14;border:1px solid #00e87940;border-radius:10px;padding:18px;text-align:center">
        <p style="font-size:24px;color:#00e879;font-family:'Courier New',Courier,monospace;letter-spacing:5px;font-weight:700;margin:0">
          ${password}
        </p>
      </td></tr>
    </table>

    <!-- Note -->
    <p style="font-size:13px;color:#777777;line-height:1.6;margin:0 0 24px 0;font-family:Helvetica,Arial,sans-serif">
      Guarde essa senha. Voc&ecirc; pode trocá-la quando quiser nas <strong style="color:#aaaaaa">Configura&ccedil;&otilde;es</strong> do app ap&oacute;s fazer login.
    </p>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
      <tr><td align="center" style="border-radius:12px;background:linear-gradient(135deg,#00e879,#06d6e8)">
        <a href="${siteUrl}/auth"
          style="display:block;padding:16px 28px;color:#000000;font-weight:700;text-decoration:none;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif">
          ENTRAR NO SISTEMA &rarr;
        </a>
      </td></tr>
    </table>

    <!-- Bottom note -->
    <p style="font-size:11px;color:#555555;text-align:center;line-height:1.6;font-family:Helvetica,Arial,sans-serif">
      N&atilde;o compartilhe sua senha com ningu&eacute;m.
    </p>

  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-top:24px">
    <p style="font-size:11px;color:#444444;font-family:Helvetica,Arial,sans-serif">&copy; 2026 Sua Vida &eacute; um Jogo</p>
  </td></tr>

</table>
</td></tr>
</table>
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

    const siteUrl = Deno.env.get("SITE_URL") || "https://suavidaeumjogo.netlify.app";
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      // Com Resend: cria com senha aleatória e manda e-mail customizado com credenciais
      const password = generatePassword();
      const { error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { display_name: name || '', created_via: 'stripe_subscription' },
      });
      if (error) { logStep("Error creating user", { email, error: error.message }); return; }
      logStep("User created with random password", { email });
      await sendWelcomeEmail(email, password, siteUrl);
    } else {
      // Sem Resend: usa o e-mail de convite nativo do Supabase (chega sempre)
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { display_name: name || '', created_via: 'stripe_subscription' },
        redirectTo: `${siteUrl}/reset-password`,
      });
      if (error) logStep("Error inviting user", { email, error: error.message });
      else logStep("User invited via Supabase native email", { email });
    }
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
