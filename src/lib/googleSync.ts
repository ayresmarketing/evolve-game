import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars';

/** Busca o token do Google, verifica expiração e retorna null (com aviso) se expirado */
async function getGoogleAuth(): Promise<{ token: string; calendarId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', user.id)
    .single();

  const prefs = (profile?.preferences as any) || {};
  const token = prefs.google_access_token;
  if (!token) return null;

  // Verifica expiração — token OAuth dura ~1h
  const expiry = prefs.google_token_expiry;
  if (expiry && new Date(expiry) <= new Date()) {
    // Token expirado: limpa e avisa o usuário
    const cleaned = { ...prefs };
    delete cleaned.google_access_token;
    delete cleaned.google_token_expiry;
    await supabase.from('profiles').update({ preferences: cleaned }).eq('user_id', user.id);
    toast.error('Sessão do Google Agenda expirou. Reconecte na aba Agenda.', { id: 'gcal-expired', duration: 8000 });
    return null;
  }

  return {
    token,
    calendarId: prefs.google_calendar_id || 'primary',
  };
}

/** Cria evento no Google Calendar e retorna o eventId */
export async function googleCreateEvent(payload: {
  summary: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  sourceType?: 'meta' | 'afazer';
  sourceId?: string;
}): Promise<string | undefined> {
  try {
    const auth = await getGoogleAuth();
    if (!auth) return undefined;

    const { summary, description, startDateTime, endDateTime, startDate, endDate, sourceType, sourceId } = payload;

    const eventBody: any = {
      summary,
      description: description || '',
    };

    if (startDateTime) {
      eventBody.start = { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' };
      eventBody.end = { dateTime: endDateTime || startDateTime, timeZone: 'America/Sao_Paulo' };
    } else if (startDate) {
      eventBody.start = { date: startDate };
      eventBody.end = { date: endDate || startDate };
    }

    if (sourceType || sourceId) {
      eventBody.extendedProperties = {
        private: {
          ...(sourceType ? { sourceType } : {}),
          ...(sourceId ? { sourceId } : {}),
        },
      };
    }

    const res = await fetch(
      `${GCAL_BASE}/${encodeURIComponent(auth.calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (res.status === 401) {
      toast.error('Sessão do Google Agenda expirou. Reconecte na aba Agenda.', { id: 'gcal-expired', duration: 8000 });
      return undefined;
    }
    if (!res.ok) {
      console.error('[googleSync] createEvent error', res.status, await res.text());
      return undefined;
    }
    const data = await res.json();
    return data.id as string | undefined;
  } catch (err) {
    console.error('[googleSync] createEvent exception', err);
    return undefined;
  }
}

/** Atualiza evento existente no Google Calendar */
export async function googleUpdateEvent(payload: {
  eventId: string;
  summary?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
}): Promise<void> {
  try {
    const auth = await getGoogleAuth();
    if (!auth) return;

    const { eventId, summary, description, startDateTime, endDateTime, startDate, endDate } = payload;
    const patch: any = {};
    if (summary !== undefined) patch.summary = summary;
    if (description !== undefined) patch.description = description;

    if (startDateTime) {
      patch.start = { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' };
      patch.end = { dateTime: endDateTime || startDateTime, timeZone: 'America/Sao_Paulo' };
    } else if (startDate) {
      patch.start = { date: startDate };
      patch.end = { date: endDate || startDate };
    }

    const res = await fetch(
      `${GCAL_BASE}/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      }
    );
    if (res.status === 401) {
      toast.error('Sessão do Google Agenda expirou. Reconecte na aba Agenda.', { id: 'gcal-expired', duration: 8000 });
    } else if (!res.ok) {
      console.error('[googleSync] updateEvent error', res.status, await res.text());
    }
  } catch (err) {
    console.error('[googleSync] updateEvent exception', err);
  }
}

/** Remove evento do Google Calendar */
export async function googleDeleteEvent(eventId: string): Promise<void> {
  if (!eventId) return;
  try {
    const auth = await getGoogleAuth();
    if (!auth) return;

    const res = await fetch(
      `${GCAL_BASE}/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    if (res.status === 401) {
      toast.error('Sessão do Google Agenda expirou. Reconecte na aba Agenda.', { id: 'gcal-expired', duration: 8000 });
    } else if (!res.ok && res.status !== 404) {
      console.error('[googleSync] deleteEvent error', res.status);
    }
  } catch (err) {
    console.error('[googleSync] deleteEvent exception', err);
  }
}

/** Lista eventos do Google Calendar */
export async function googleListEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
  try {
    const auth = await getGoogleAuth();
    if (!auth) return [];

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      ...(timeMin ? { timeMin } : {}),
      ...(timeMax ? { timeMax } : {}),
    });

    const res = await fetch(
      `${GCAL_BASE}/${encodeURIComponent(auth.calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

/** Salva o token do Google no perfil (com expiração e normalização de modo) */
export async function googleSaveToken(accessToken: string, mode: string, calendarId: string, expiresIn?: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', user.id)
    .single();

  const prefs = (profile?.preferences as any) || {};
  // Normaliza 'total' → 'full' para consistência interna
  const normalizedMode = mode === 'total' ? 'full' : mode;
  // Token expira em expiresIn segundos (padrão 3600 = 1h). Salva com 5min de margem
  const expiry = new Date(Date.now() + ((expiresIn || 3600) - 300) * 1000).toISOString();

  await supabase
    .from('profiles')
    .update({
      preferences: {
        ...prefs,
        google_access_token: accessToken,
        google_calendar_mode: normalizedMode,
        google_calendar_id: calendarId,
        google_token_expiry: expiry,
      },
    })
    .eq('user_id', user.id);
}

/** Remove a integração do Google do perfil */
export async function googleDisconnect(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', user.id)
    .single();

  const prefs = { ...(profile?.preferences as any) || {} };
  delete prefs.google_access_token;
  delete prefs.google_calendar_mode;
  delete prefs.google_calendar_id;

  await supabase.from('profiles').update({ preferences: prefs }).eq('user_id', user.id);
}

/** Retorna o status da integração */
export async function googleGetStatus(): Promise<{ connected: boolean; mode: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { connected: false, mode: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    const prefs = (profile?.preferences as any) || {};
    return {
      connected: !!prefs.google_access_token,
      mode: prefs.google_calendar_mode || null,
    };
  } catch {
    return { connected: false, mode: null };
  }
}
