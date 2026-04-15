import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = 'https://amjrbybrlphsvvfqusqh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';

/** Monta os objetos start/end do Google Calendar a partir dos campos recebidos */
function buildGcalTimes(body: any): { start: any; end: any } | null {
  const { startDateTime, endDateTime, startDate, endDate } = body;

  if (startDateTime) {
    return {
      start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
      end:   { dateTime: endDateTime || startDateTime, timeZone: "America/Sao_Paulo" },
    };
  }
  if (startDate) {
    return {
      start: { date: startDate },
      end:   { date: endDate || startDate },
    };
  }
  return null;
}

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

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // ── status: funciona sem usuário logado ─────────────────────────────
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

    // ── Demais ações requerem autenticação ──────────────────────────────
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
    const calendarId = prefs.google_calendar_id || "primary";

    // ── save-token ───────────────────────────────────────────────────────
    if (action === "save-token") {
      const newPrefs = {
        ...prefs,
        google_access_token: body.access_token,
        google_calendar_mode: body.mode || "partial",
        google_calendar_id: body.calendar_id || "primary",
      };
      await supabaseClient.from("profiles").update({ preferences: newPrefs }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── disconnect ───────────────────────────────────────────────────────
    if (action === "disconnect") {
      const newPrefs = { ...prefs };
      delete newPrefs.google_access_token;
      delete newPrefs.google_calendar_mode;
      delete newPrefs.google_calendar_id;
      await supabaseClient.from("profiles").update({ preferences: newPrefs }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!googleToken) {
      return new Response(JSON.stringify({ error: "Not connected", connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── create-event ─────────────────────────────────────────────────────
    if (action === "create-event") {
      const { summary, description, sourceType, sourceId } = body;
      const times = buildGcalTimes(body);

      const eventBody: any = {
        summary,
        description: description || "",
      };

      if (times) {
        eventBody.start = times.start;
        eventBody.end = times.end;
      }

      // Marca a origem do evento para evitar duplicatas no sync bidirecional
      if (sourceType || sourceId) {
        eventBody.extendedProperties = {
          private: {
            ...(sourceType ? { sourceType } : {}),
            ...(sourceId ? { sourceId } : {}),
          },
        };
      }

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        throw new Error(`Google API error ${gcalRes.status}: ${errText}`);
      }

      const event = await gcalRes.json();
      return new Response(JSON.stringify({ success: true, eventId: event.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── update-event ─────────────────────────────────────────────────────
    if (action === "update-event") {
      const { eventId, summary, description } = body;

      if (!eventId) {
        return new Response(JSON.stringify({ error: "eventId is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const patchBody: any = {};
      if (summary !== undefined) patchBody.summary = summary;
      if (description !== undefined) patchBody.description = description;

      const times = buildGcalTimes(body);
      if (times) {
        patchBody.start = times.start;
        patchBody.end = times.end;
      }

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${googleToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        throw new Error(`Google API error ${gcalRes.status}: ${errText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── delete-event ─────────────────────────────────────────────────────
    if (action === "delete-event") {
      const { eventId } = body;

      if (!eventId) {
        return new Response(JSON.stringify({ error: "eventId is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${googleToken}` },
        }
      );

      // 404 = já foi deletado antes — trata como sucesso
      if (!gcalRes.ok && gcalRes.status !== 404) {
        const errText = await gcalRes.text();
        throw new Error(`Google API error ${gcalRes.status}: ${errText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── list-events ──────────────────────────────────────────────────────
    if (action === "list-events") {
      const timeMin = body.timeMin || new Date().toISOString();
      const timeMax = body.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
        // inclui extendedProperties para identificar eventos criados pelo app
        privateExtendedProperty: "sourceType=afazer",
      });

      // Busca eventos do app + eventos externos separadamente para não perder nenhum
      const [appRes, allRes] = await Promise.all([
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        ),
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250" })}`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        ),
      ]);

      if (!allRes.ok) {
        throw new Error(`Google API error: ${allRes.status}`);
      }

      const allData = await allRes.json();
      return new Response(JSON.stringify({ events: allData.items || [] }), {
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
