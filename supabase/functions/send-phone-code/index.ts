import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mega API credentials — set these as Supabase Edge Function secrets
const WHATSAPP_HOST     = Deno.env.get("WHATSAPP_HOST")     ?? "";
const WHATSAPP_INSTANCE = Deno.env.get("WHATSAPP_INSTANCE") ?? "";
const WHATSAPP_TOKEN    = Deno.env.get("WHATSAPP_TOKEN")    ?? "";

async function sendWhatsAppCode(phone: string, code: string): Promise<void> {
  if (!WHATSAPP_HOST || !WHATSAPP_INSTANCE) {
    console.log("[send-phone-code] Mega API not configured (dev mode). Code:", phone, code);
    return;
  }

  const message = `🔐 *Sua Vida é um Jogo*\n\nSeu código de verificação é: *${code}*\n\nVálido por 10 minutos. Não compartilhe com ninguém.`;

  // Mega API: Authorization header sem "Bearer"
  const endpoint = `https://${WHATSAPP_HOST}/message/sendText/${WHATSAPP_INSTANCE}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": WHATSAPP_TOKEN,
    },
    body: JSON.stringify({
      number: phone,
      textMessage: { text: message },
    }),
  });

  const responseBody = await res.text();
  console.log(`[send-phone-code] Mega API response ${res.status}:`, responseBody);

  if (!res.ok) {
    throw new Error(`Mega API error ${res.status}: ${responseBody}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { phone } = await req.json();
    if (!phone) throw new Error("phone required");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("phone_verification_codes").insert({
      phone_e164: phone,
      code,
      expires_at: expiresAt,
    });

    await sendWhatsAppCode(phone, code);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-phone-code] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
