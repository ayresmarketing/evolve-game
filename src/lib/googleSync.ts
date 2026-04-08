import { supabase } from '@/integrations/supabase/client';

/** Cria evento no Google Calendar e retorna o eventId gerado pelo Google */
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
    const { data } = await supabase.functions.invoke('google-calendar', {
      body: { action: 'create-event', ...payload },
    });
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
    await supabase.functions.invoke('google-calendar', {
      body: { action: 'update-event', ...payload },
    });
  } catch {
    // silently ignore — don't block the app
  }
}

export async function googleDeleteEvent(eventId: string): Promise<void> {
  if (!eventId) return;
  try {
    await supabase.functions.invoke('google-calendar', {
      body: { action: 'delete-event', eventId },
    });
  } catch {
    // silently ignore
  }
}

export async function googleListEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
  try {
    const { data } = await supabase.functions.invoke('google-calendar', {
      body: { action: 'list-events', timeMin, timeMax },
    });
    return data?.events || [];
  } catch {
    return [];
  }
}
