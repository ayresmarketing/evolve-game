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
    const body = await req.json();
    const { action, email, password, displayName, whatsappNormalized } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ── confirm-only: confirma email de usuário existente ──────────────
    if (action === "confirm") {
      if (!email) throw new Error("email required");

      const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) throw listErr;

      const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Confirma o e-mail via updateUserById
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
      });
      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, userId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── create: cria usuário novo já confirmado ────────────────────────
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha obrigatórios" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: list } = await adminClient.auth.admin.listUsers();
    const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      // Já existe — confirma e deixa o front fazer login
      await adminClient.auth.admin.updateUserById(existing.id, { email_confirm: true });
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || "",
        whatsapp_normalized: whatsappNormalized || "",
        whatsapp_raw: whatsappNormalized || "",
      },
    });

    if (createErr) throw createErr;

    const userId = created.user?.id;

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
