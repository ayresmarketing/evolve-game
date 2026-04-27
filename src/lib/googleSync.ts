import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '990869380684-iu5iuvukn6sl69vhsc0e8qcbv0n3s8r6.apps.googleusercontent.com';

// Resolve/rejeita a Promise da renovação silenciosa em curso
let _silentRefreshResolve: ((token: string | null) => void) | null = null;

/** Chamado pelo Index.tsx quando um popup de silent refresh retorna um token via postMessage */
export function handleSilentRefreshCallback(token: string | null) {
  _silentRefreshResolve?.(token);
  _silentRefreshResolve = null;
}

/** Tenta renovar o token silenciosamente via popup (prompt=none). Retorna o novo token ou null. */
async function trySilentRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return new Promise(resolve => {
    _silentRefreshResolve = resolve;
    const redirectUri = `${window.location.origin}/`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(GCAL_SCOPES)}` +
      `&prompt=none`;
    const popup = window.open(url, 'gcal-silent-refresh', 'width=1,height=1,left=-2000,top=-2000');
    // Timeout de 10s: se o popup não responder (bloqueado ou erro), desiste
    const timer = setTimeout(() => {
      popup?.close();
      resolve(null);
      _silentRefreshResolve = null;
    }, 10_000);
    // Limpa o timer assim que a Promise for resolvida via handleSilentRefreshCallback
    const orig = _silentRefreshResolve;
    _silentRefreshResolve = (t) => { clearTimeout(timer); orig?.(t); };
  });
}

/** Busca o token do Google, tenta refresh silencioso se expirado */
async function getGoogleAuth(): Promise<{ token: string; calendarId: string; prefs: any; userId: string } | null> {
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

  const expiry = prefs.google_token_expiry;
  if (expiry && new Date(expiry) <= new Date()) {
    // Token expirado — tenta refresh silencioso via popup
    const newToken = await trySilentRefresh();
    if (newToken) {
      const newExpiry = new Date(Date.now() + (3600 - 300) * 1000).toISOString();
      const newPrefs = { ...prefs, google_access_token: newToken, google_token_expiry: newExpiry };
      await supabase.from('profiles').update({ preferences: newPrefs }).eq('user_id', user.id);
      return { token: newToken, calendarId: prefs.google_calendar_id || 'primary', prefs: newPrefs, userId: user.id };
    }
    // Refresh falhou: limpa token e avisa
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
    prefs,
    userId: user.id,
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
