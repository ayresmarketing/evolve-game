import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { googleListEvents, googleCreateEvent, googleUpdateEvent, googleDeleteEvent } from '@/lib/googleSync';
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
 * Hook para sincronização bidirecional com Google Calendar
 * - Modo 'partial': App → Google apenas
 * - Modo 'full': App ↔ Google (bidirecional)
 */
export function useGoogleCalendarSync() {
  const { afazeres, addAfazer, deleteAfazer, updateAfazer } = useGame();
  const syncInProgress = useRef(false);

  /**
   * Busca o modo de integração do usuário
   */
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
   * Sincroniza eventos do Google Calendar → App (modo full)
   */
  const syncFromGoogle = useCallback(async () => {
    if (syncInProgress.current) return;
    
    const mode = await getSyncMode();
    if (mode !== 'full') return; // Só sincroniza do Google se modo for 'full'

    syncInProgress.current = true;

    try {
      // Busca estado de sync
      const { data: syncState } = await supabase
        .from('google_sync_state')
        .select('sync_token')
        .single();

      // Lista eventos do Google (com sync_token para delta sync)
      const events = await googleListEvents(
        new Date().toISOString(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      );

      // Para cada evento do Google
      for (const event of events as GoogleEvent[]) {
        const googleEventId = event.id;
        const sourceType = event.extendedProperties?.private?.sourceType;
        
        // Verifica se já existe no app
        const { data: existing } = await supabase
          .from('afazeres')
          .select('id')
          .eq('google_event_id', googleEventId)
          .single();

        // Só cria afazer no app se o evento do Google NÃO foi criado pelo app
        // (evita duplicação - eventos criados pelo app já têm afazer correspondente)
        if (!existing && sourceType !== 'afazer' && sourceType !== 'meta') {
          // Evento novo do Google (não criado pelo app) → cria afazer no app
          const startDate = event.start?.date || event.start?.dateTime?.split('T')[0];
          const startTime = event.start?.dateTime?.split('T')[1]?.slice(0, 5);
          const endTime = event.end?.dateTime?.split('T')[1]?.slice(0, 5);

          if (startDate) {
            await supabase.from('afazeres').insert({
              title: event.summary || '(Sem título)',
              description: event.description || '',
              start_date: startDate,
              start_time: startTime,
              end_time: endTime,
              google_event_id: googleEventId,
              category: 'pessoal',
              user_id: (await supabase.auth.getUser()).data.user?.id,
            });
          }
        }
      }

      // Atualiza timestamp de sync
      await supabase.from('google_sync_state').upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        last_sync_at: new Date().toISOString(),
        mode: 'full',
      }, { onConflict: 'user_id' });

    } catch (err) {
      console.error('Sync from Google failed:', err);
    } finally {
      syncInProgress.current = false;
    }
  }, [afazeres]);

  /**
   * Sincroniza App → Google Calendar (sempre, independente do modo)
   * Esta função é chamada pelo GameContext quando afazeres são criados/editados/deletados
   */
  const syncToGoogle = useCallback(async (
    action: 'create' | 'update' | 'delete',
    data: {
      id?: string;
      googleEventId?: string;
      title?: string;
      description?: string;
      startDate?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    const mode = await getSyncMode();
    if (!mode) return; // Não sincroniza se não estiver conectado

    try {
      if (action === 'create') {
        const { startDateTime, endDateTime } = makeGoogleDateTimes(
          data.startDate!,
          data.startTime,
          data.endTime
        );
        
        const eventId = await googleCreateEvent({
          summary: data.title || '',
          description: data.description || '',
          startDate,
          endDate,
          startDateTime,
          endDateTime,
          sourceType: 'afazer',
          sourceId: data.id,
        });

        // Retorna o eventId para ser salvo no banco
        return eventId;
      }

      if (action === 'update' && data.googleEventId) {
        const { startDateTime, endDateTime } = makeGoogleDateTimes(
          data.startDate!,
          data.startTime,
          data.endTime
        );

        await googleUpdateEvent({
          eventId: data.googleEventId,
          summary: data.title,
          description: data.description,
          startDate,
          endDate,
          startDateTime,
          endDateTime,
        });
      }

      if (action === 'delete' && data.googleEventId) {
        await googleDeleteEvent(data.googleEventId);
      }
    } catch (err) {
      console.error('Sync to Google failed:', err);
    }
  }, []);

  /**
   * Sincronização manual (para botão "Sincronizar agora")
   */
  const syncManual = useCallback(async () => {
    toast.info('Sincronizando com Google Calendar...');
    await syncFromGoogle();
    toast.success('Sincronização concluída!');
  }, [syncFromGoogle]);

  // Sync automático a cada 5 minutos (apenas modo full)
  useEffect(() => {
    const interval = setInterval(() => {
      syncFromGoogle();
    }, 5 * 60 * 1000); // 5 minutos

    // Sync inicial
    syncFromGoogle();

    return () => clearInterval(interval);
  }, [syncFromGoogle]);

  return {
    syncToGoogle,
    syncFromGoogle,
    syncManual,
    getSyncMode,
  };
}

/** Helper para montar datetime */
function makeGoogleDateTimes(date: string, startTime?: string, endTime?: string) {
  if (!startTime) return { startDate: date, endDate: date };
  
  const start = `${date}T${startTime}:00`;
  let end: string;
  
  if (endTime) {
    end = `${date}T${endTime}:00`;
  } else {
    const [h, m] = startTime.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0');
    end = `${date}T${endH}:${String(m).padStart(2, '0')}:00`;
  }
  
  return { startDateTime: start, endDateTime: end };
}
