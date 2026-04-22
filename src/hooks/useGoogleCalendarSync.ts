import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { googleListEvents, googleGetStatus } from '@/lib/googleSync';
import { toast } from 'sonner';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  status?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  extendedProperties?: {
    private?: {
      sourceType?: 'afazer' | 'meta';
      sourceId?: string;
    };
  };
}

/**
 * Hook para sincronização com Google Calendar
 * - Modo 'partial': App → Google apenas
 * - Modo 'full':    App ↔ Google (bidirecional)
 */
export function useGoogleCalendarSync() {
  const syncInProgress = useRef(false);

  const getSyncMode = useCallback(async (): Promise<'partial' | 'full' | null> => {
    try {
      const result = await googleGetStatus();
      return (result.mode as 'partial' | 'full' | null) || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Sincroniza Google Calendar → App (só no modo 'full')
   * - Importa eventos externos como novos afazeres
   * - Detecta edições em eventos criados pelo app e atualiza o DB local
   * - Detecta exclusões na Google e remove do app
   */
  const syncFromGoogle = useCallback(async () => {
    if (syncInProgress.current) return;

    const mode = await getSyncMode();
    if (mode !== 'full') return;

    syncInProgress.current = true;

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const events = await googleListEvents(timeMin, timeMax);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build a Set of all Google event IDs currently visible in the window
      const googleEventIds = new Set((events as GoogleEvent[]).map(e => e.id));

      // --- Detect DELETED events from Google (only for app-created events within the window) ---
      // Afazeres deleted from Google
      const { data: localAfazeres } = await supabase
        .from('afazeres')
        .select('id, google_event_id, start_date')
        .eq('user_id', user.id)
        .not('google_event_id', 'is', null)
        .eq('completed', false)
        .gte('start_date', timeMin.split('T')[0])
        .lte('start_date', timeMax.split('T')[0]) as any;

      if (localAfazeres) {
        for (const a of localAfazeres) {
          if (a.google_event_id && !googleEventIds.has(a.google_event_id)) {
            // Event deleted from Google — remove from app
            await supabase.from('afazeres').delete().eq('id', a.id);
          }
        }
      }

      // Missions deleted from Google
      const { data: localMissions } = await supabase
        .from('missions')
        .select('id, google_event_id, scheduled_day')
        .eq('user_id', user.id)
        .not('google_event_id', 'is', null)
        .not('scheduled_day', 'is', null)
        .gte('scheduled_day', timeMin.split('T')[0])
        .lte('scheduled_day', timeMax.split('T')[0]) as any;

      if (localMissions) {
        for (const m of localMissions) {
          if (m.google_event_id && !googleEventIds.has(m.google_event_id)) {
            await supabase.from('missions').delete().eq('id', m.id);
          }
        }
      }

      // --- Process each Google event ---
      for (const event of events as GoogleEvent[]) {
        const googleEventId = event.id;
        if (event.status === 'cancelled') continue;

        const sourceType = event.extendedProperties?.private?.sourceType;

        if (sourceType === 'afazer') {
          // App-created afazer: detect edits from Google → update local DB
          const { data: existing } = await supabase
            .from('afazeres')
            .select('id, title, description, start_date, start_time, end_time')
            .eq('google_event_id', googleEventId)
            .maybeSingle() as any;

          if (existing) {
            const googleTitle = event.summary || '';
            const googleDesc = event.description || '';
            const googleDate = event.start?.date || event.start?.dateTime?.split('T')[0];
            const googleStartTime = event.start?.dateTime ? event.start.dateTime.split('T')[1]?.slice(0, 5) : null;
            const googleEndTime = event.end?.dateTime ? event.end.dateTime.split('T')[1]?.slice(0, 5) : null;

            const changed =
              googleTitle !== existing.title ||
              googleDesc !== (existing.description || '') ||
              (googleDate && googleDate !== existing.start_date) ||
              (googleStartTime !== (existing.start_time || null)) ||
              (googleEndTime !== (existing.end_time || null));

            if (changed) {
              const updates: Record<string, any> = {};
              if (googleTitle && googleTitle !== existing.title) updates.title = googleTitle;
              if (googleDesc !== (existing.description || '')) updates.description = googleDesc || null;
              if (googleDate && googleDate !== existing.start_date) updates.start_date = googleDate;
              if (googleStartTime !== (existing.start_time || null)) updates.start_time = googleStartTime || null;
              if (googleEndTime !== (existing.end_time || null)) updates.end_time = googleEndTime || null;
              await supabase.from('afazeres').update(updates).eq('id', existing.id);
            }
          }
          continue;
        }

        if (sourceType === 'meta') {
          // App-created mission: detect edits from Google → update local DB
          const { data: existing } = await supabase
            .from('missions')
            .select('id, title, scheduled_day, scheduled_time')
            .eq('google_event_id', googleEventId)
            .maybeSingle() as any;

          if (existing) {
            const googleTitle = (event.summary || '').replace(/^🎯\s*/, '');
            const googleDate = event.start?.date || event.start?.dateTime?.split('T')[0];
            const googleStartTime = event.start?.dateTime ? event.start.dateTime.split('T')[1]?.slice(0, 5) : null;

            const changed =
              googleTitle !== existing.title ||
              (googleDate && googleDate !== existing.scheduled_day) ||
              (googleStartTime !== (existing.scheduled_time || null));

            if (changed) {
              const updates: Record<string, any> = {};
              if (googleTitle && googleTitle !== existing.title) updates.title = googleTitle;
              if (googleDate && googleDate !== existing.scheduled_day) updates.scheduled_day = googleDate;
              if (googleStartTime !== (existing.scheduled_time || null)) updates.scheduled_time = googleStartTime || null;
              await supabase.from('missions').update(updates).eq('id', existing.id);
            }
          }
          continue;
        }

        // External event (no sourceType): import as new afazer if not already imported
        const { data: existingById } = await supabase
          .from('afazeres')
          .select('id')
          .eq('google_event_id', googleEventId)
          .single();

        if (existingById) continue;

        const eventDate = event.start?.date || event.start?.dateTime?.split('T')[0];
        const eventTitle = (event.summary || '').trim();

        if (eventTitle && eventDate) {
          const { data: existingByTitle } = await supabase
            .from('afazeres')
            .select('id')
            .eq('title', eventTitle)
            .eq('start_date', eventDate)
            .eq('user_id', user.id)
            .single();

          if (existingByTitle) {
            await supabase.from('afazeres')
              .update({ google_event_id: googleEventId } as any)
              .eq('id', existingByTitle.id);
            continue;
          }
        }

        const startDate = event.start?.date || event.start?.dateTime?.split('T')[0];
        if (!startDate) continue;

        const startTime = event.start?.dateTime
          ? event.start.dateTime.split('T')[1]?.slice(0, 5)
          : undefined;
        const endTime = event.end?.dateTime
          ? event.end.dateTime.split('T')[1]?.slice(0, 5)
          : undefined;

        await supabase.from('afazeres').insert({
          title: event.summary || '(Sem título)',
          description: event.description || '',
          start_date: startDate,
          start_time: startTime || null,
          end_time: endTime || null,
          google_event_id: googleEventId,
          category: 'pessoal',
          user_id: user.id,
          is_recurrent: false,
          recurrent_days: [],
          xp_reward: 5,
        } as any);
      }

      await supabase.from('google_sync_state').upsert({
        user_id: user.id,
        last_sync_at: new Date().toISOString(),
        mode: 'full',
      }, { onConflict: 'user_id' });

    } catch (err) {
      console.error('Sync from Google failed:', err);
    } finally {
      syncInProgress.current = false;
    }
  }, [getSyncMode]);

  /** Sincronização manual — botão "Sincronizar agora" */
  const syncManual = useCallback(async () => {
    toast.info('Sincronizando com Google Calendar...');
    await syncFromGoogle();
    toast.success('Sincronização concluída!');
  }, [syncFromGoogle]);

  // Sync automático a cada 5 minutos (só no modo full)
  useEffect(() => {
    syncFromGoogle();
    const interval = setInterval(syncFromGoogle, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncFromGoogle]);

  return { syncManual, getSyncMode };
}
