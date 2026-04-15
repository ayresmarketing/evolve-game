import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { googleListEvents } from '@/lib/googleSync';
import { toast } from 'sonner';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
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
      const { data } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'status' },
      });
      return data?.mode || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Sincroniza Google Calendar → App (só no modo 'full')
   * Importa eventos criados fora do app como novos afazeres.
   */
  const syncFromGoogle = useCallback(async () => {
    if (syncInProgress.current) return;

    const mode = await getSyncMode();
    if (mode !== 'full') return;

    syncInProgress.current = true;

    try {
      const events = await googleListEvents(
        new Date().toISOString(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const event of events as GoogleEvent[]) {
        const googleEventId = event.id;
        const sourceType = event.extendedProperties?.private?.sourceType;

        // Ignora eventos que foram criados pelo próprio app
        if (sourceType === 'afazer' || sourceType === 'meta') continue;

        // Verifica se já foi importado antes
        const { data: existing } = await supabase
          .from('afazeres')
          .select('id')
          .eq('google_event_id', googleEventId)
          .single();

        if (existing) continue;

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
