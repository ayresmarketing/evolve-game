import { supabase } from '@/integrations/supabase/client';
import { APP_SUPABASE_URL, APP_SUPABASE_ANON_KEY } from '@/config/supabase';

/**
 * Chama a edge function google-calendar com o JWT do usuário explicitamente.
 * Necessário porque o novo formato de chave (sb_publishable_) não injeta
 * o token automaticamente no supabase.functions.invoke.
 */
async function callGCalFunction(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${APP_SUPABASE_URL}/functions/v1/google-calendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': APP_SUPABASE_ANON_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { data: null, error: res.status };
  const data = await res.json();
  return { data, error: null };
}

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
    const { data } = await callGCalFunction({ action: 'create-event', ...payload });
    return data?.eventId as string | undefined;
  } catch {
    return undefined;
  }
}

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
    await callGCalFunction({ action: 'update-event', ...payload });
  } catch {
    // não bloqueia o app
  }
}

export async function googleDeleteEvent(eventId: string): Promise<void> {
  if (!eventId) return;
  try {
    await callGCalFunction({ action: 'delete-event', eventId });
  } catch {
    // não bloqueia o app
  }
}

export async function googleListEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
  try {
    const { data } = await callGCalFunction({ action: 'list-events', timeMin, timeMax });
    return data?.events || [];
  } catch {
    return [];
  }
}

/** Salva o token do Google no perfil do usuário */
export async function googleSaveToken(accessToken: string, mode: string, calendarId: string): Promise<void> {
  await callGCalFunction({ action: 'save-token', access_token: accessToken, mode, calendar_id: calendarId });
}

/** Desconecta a integração com o Google */
export async function googleDisconnect(): Promise<void> {
  await callGCalFunction({ action: 'disconnect' });
}

/** Retorna o status da integração */
export async function googleGetStatus(): Promise<{ connected: boolean; mode: string | null }> {
  try {
    const { data } = await callGCalFunction({ action: 'status' });
    return { connected: data?.connected ?? false, mode: data?.mode ?? null };
  } catch {
    return { connected: false, mode: null };
  }
}
