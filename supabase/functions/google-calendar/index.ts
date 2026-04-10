import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded credentials
const SUPABASE_URL = 'https://amjrbybrlphsvvfqusqh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // Pega o token do header se existir
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // ── status: funciona mesmo sem user (retorna not connected) ──────
    if (action === "status") {
      if (!userId) {
        return new Response(JSON.stringify({ connected: false, mode: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("preferences")
        .eq("user_id", userId)
        .single();

      const prefs = (profile?.preferences as any) || {};
      
      return new Response(JSON.stringify({
        connected: !!prefs.google_access_token,
        mode: prefs.google_calendar_mode || null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Demais ações precisam de autenticação ─────────────────────────
    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("preferences")
      .eq("user_id", userId)
      .single();

    const prefs = (profile?.preferences as any) || {};
    const googleToken = prefs.google_access_token;
    const selectedCalendarId = prefs.google_calendar_id || "primary";

    if (action === "save-token") {
      const newPrefs = {
        ...prefs,
        google_access_token: body.access_token,
        google_calendar_mode: body.mode || "partial",
        google_calendar_id: body.calendar_id || "primary",
      };
      await supabaseClient
        .from("profiles")
        .update({ preferences: newPrefs })
        .eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const newPrefs = { ...prefs };
      delete newPrefs.google_access_token;
      delete newPrefs.google_calendar_mode;
      delete newPrefs.google_calendar_id;
      await supabaseClient
        .from("profiles")
        .update({ preferences: newPrefs })
        .eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Not connected", connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-event") {
      const { summary, description, startDateTime, startDate, endDate } = body;
      const eventBody: any = { summary, description: description || "" };

      if (startDateTime) {
        eventBody.start = { dateTime: startDateTime, timeZone: "America/Sao_Paulo" };
        eventBody.end = { dateTime: startDateTime, timeZone: "America/Sao_Paulo" };
      } else if (startDate) {
        eventBody.start = { date: startDate };
        eventBody.end = { date: endDate || startDate };
      }

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        }
      );
      
      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        throw new Error(`Google API error: ${gcalRes.status}`);
      }
      
      const event = await gcalRes.json();
      return new Response(JSON.stringify({ success: true, eventId: event.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-events") {
      const params = new URLSearchParams({
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${googleToken}` } }
      );
      
      if (!gcalRes.ok) {
        throw new Error(`Google API error: ${gcalRes.status}`);
      }
      
      const data = await gcalRes.json();
      return new Response(JSON.stringify({ events: data.items || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
