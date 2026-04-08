import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, displayName, whatsappNormalized } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha obrigatórios" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Admin client com service role — pode criar usuários já confirmados
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verifica se e-mail já existe
    const { data: list } = await adminClient.auth.admin.listUsers();
    const exists = list?.users?.some(u => u.email === email);
    if (exists) {
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Cria o usuário já com e-mail confirmado
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // <-- confirma imediatamente, sem e-mail
      user_metadata: {
        display_name: displayName || "",
        whatsapp_normalized: whatsappNormalized || "",
        whatsapp_raw: whatsappNormalized || "",
      },
    });

    if (createErr) throw createErr;

    const userId = created.user?.id;

    // Salva número na tabela user_whatsapp_config se fornecido
    if (userId && whatsappNormalized) {
      await adminClient.from("user_whatsapp_config").upsert({
        user_id: userId,
        whatsapp_phone: whatsappNormalized,
        whatsapp_phone_raw: whatsappNormalized,
        whatsapp_phone_normalized: whatsappNormalized,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
