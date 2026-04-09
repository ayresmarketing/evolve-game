import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Function invoked", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    const { action, email, password, displayName, whatsappNormalized } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!serviceKey);

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // ── confirm-only: confirma email de usuário existente ──────────────
    if (action === "confirm") {
      console.log("Action: confirm, email:", email);
      if (!email) throw new Error("email required");

      const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) throw listErr;

      const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        console.log("User not found for email:", email);
        return new Response(JSON.stringify({ error: "Usuário não encontrado." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      console.log("Found user:", existing.id, "confirming email...");
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
      });
      if (updateErr) throw updateErr;

      console.log("Email confirmed for user:", existing.id);
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

    console.log("Action: create, email:", email);

    const { data: list } = await adminClient.auth.admin.listUsers();
    const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      console.log("User already exists:", existing.id);
      await adminClient.auth.admin.updateUserById(existing.id, { email_confirm: true });
      return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Creating new user...");
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

    if (createErr) {
      console.log("Create user error:", createErr.message);
      throw createErr;
    }

    const userId = created.user?.id;
    console.log("User created:", userId);

    if (userId && whatsappNormalized) {
      console.log("Saving WhatsApp config...");
      const { error: upsertErr } = await adminClient.from("user_whatsapp_config").upsert({
        user_id: userId,
        whatsapp_phone: whatsappNormalized,
        whatsapp_phone_raw: whatsappNormalized,
        whatsapp_phone_normalized: whatsappNormalized,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      
      if (upsertErr) {
        console.log("Upsert error:", upsertErr.message);
        // Não falha o cadastro se o WhatsApp não salvar
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
