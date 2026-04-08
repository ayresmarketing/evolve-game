import { supabase } from '@/integrations/supabase/client';

export async function googleCreateEvent(payload: {
  summary: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  sourceType?: 'meta' | 'afazer';
  sourceId?: string;
}) {
  await supabase.functions.invoke('google-calendar', {
    body: { action: 'create-event', ...payload },
  });
}

export async function googleUpdateEvent(payload: {
  eventId: string;
  summary?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startDateTime?: string;
  endDateTime?: string;
}) {
  await supabase.functions.invoke('google-calendar', {
    body: { action: 'update-event', ...payload },
  });
}

export async function googleDeleteEvent(eventId: string) {
  await supabase.functions.invoke('google-calendar', {
    body: { action: 'delete-event', eventId },
  });
}

export async function googleListEvents(timeMin?: string, timeMax?: string) {
  const { data } = await supabase.functions.invoke('google-calendar', {
    body: { action: 'list-events', timeMin, timeMax },
  });
  return data?.events || [];
}