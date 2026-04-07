import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const body = await req.json();
    const { action } = body;

    // Get user's Google token from profiles preferences
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("preferences")
      .eq("user_id", userId)
      .single();

    const prefs = (profile?.preferences as any) || {};
    const googleToken = prefs.google_access_token;
    const integrationMode = prefs.google_calendar_mode; // 'partial' | 'total'

    if (action === "save-token") {
      // Save Google OAuth token to profile preferences
      const newPrefs = {
        ...prefs,
        google_access_token: body.access_token,
        google_refresh_token: body.refresh_token,
        google_calendar_mode: body.mode || "partial",
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
      delete newPrefs.google_refresh_token;
      delete newPrefs.google_calendar_mode;
      await supabaseClient
        .from("profiles")
        .update({ preferences: newPrefs })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected", connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "status") {
      return new Response(JSON.stringify({ 
        connected: true, 
        mode: integrationMode || "partial" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-event") {
      const { summary, description, startDateTime, endDateTime, startDate, endDate } = body;
      
      const eventBody: any = {
        summary,
        description: description || "",
      };

      if (startDateTime && endDateTime) {
        eventBody.start = { dateTime: startDateTime, timeZone: "America/Sao_Paulo" };
        eventBody.end = { dateTime: endDateTime, timeZone: "America/Sao_Paulo" };
      } else if (startDate) {
        eventBody.start = { date: startDate };
        eventBody.end = { date: endDate || startDate };
      }

      const gcalRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        throw new Error(`Google Calendar API error: ${gcalRes.status} - ${errText}`);
      }

      const event = await gcalRes.json();
      return new Response(JSON.stringify({ success: true, eventId: event.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-events") {
      const { timeMin, timeMax } = body;
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "100",
      });

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: { Authorization: `Bearer ${googleToken}` },
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        throw new Error(`Google Calendar API error: ${gcalRes.status} - ${errText}`);
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
