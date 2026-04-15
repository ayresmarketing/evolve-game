import { useState, useMemo, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { ChevronLeft, ChevronRight, Clock, Trash2, RefreshCw } from 'lucide-react';
import { googleListEvents } from '@/lib/googleSync';
import { toast } from 'sonner';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';
import { supabase } from '@/integrations/supabase/client';

const PERIODS = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
];

export function CalendarView() {
  const { metas, afazeres, deleteMission, deleteAfazer } = useGame();
  const { fixedBlocks, sleepSchedules } = useSchedule();
  const { syncManual, getSyncMode } = useGoogleCalendarSync();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [periodDays, setPeriodDays] = useState<number>(0);
  const [syncMode, setSyncMode] = useState<'partial' | 'full' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, daysInMonth]);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const todayStr = new Date().toISOString().split('T')[0];

  // Get all events for a date
  const getEventsForDate = (dateStr: string) => {
    const missions = metas.flatMap(m => m.missions
      .filter(mi => mi.scheduledDay === dateStr)
      .map(mi => ({
        type: 'mission' as const,
        id: mi.id,
        metaId: m.id,
        title: mi.title,
        time: mi.scheduledTime,
        category: m.category,
        completed: mi.completedToday,
        estimatedMinutes: mi.estimatedMinutes,
        metaTitle: m.title,
      }))
    );
    const tasks = afazeres
      .filter(a => {
        if (a.startDate === dateStr) return true;
        if (a.isRecurrent && a.recurrentDays) {
          const d = new Date(dateStr + 'T12:00:00');
          const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
          return a.recurrentDays.includes(dayMap[d.getDay()]);
        }
        return false;
      })
      .map(a => ({
        type: 'afazer' as const,
        id: a.id,
        metaId: undefined,
        title: a.title,
        time: a.startTime,
        category: a.category,
        completed: a.completed,
        estimatedMinutes: a.estimatedMinutes,
        metaTitle: undefined,
      }));
    const remote = googleEvents
      .filter(ev => {
        const start = ev.start?.date || ev.start?.dateTime?.split('T')[0];
        return start === dateStr;
      })
      .map(ev => ({
        type: 'google' as const,
        id: ev.id,
        metaId: undefined,
        title: ev.summary || '(Sem título)',
        time: ev.start?.dateTime ? ev.start.dateTime.split('T')[1]?.slice(0, 5) : '',
        category: 'pessoal',
        completed: false,
        estimatedMinutes: undefined as number | undefined,
        metaTitle: undefined,
      }));
    return [...missions, ...tasks, ...remote].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  // Carrega o modo de sync
  useEffect(() => {
    getSyncMode().then(setSyncMode);
  }, []);

  // Handler para sync manual
  const handleSync = async () => {
    setIsSyncing(true);
    await syncManual();
    setIsSyncing(false);
    // Recarrega eventos do Google
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const events = await googleListEvents(start, end);
    setGoogleEvents(events);
  };
  const periodEvents = useMemo(() => {
    if (periodDays === 0) return null;
    const result: { date: string; events: ReturnType<typeof getEventsForDate> }[] = [];
    // Começa de ontem e vai para trás
    for (let i = 1; i <= periodDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const evs = getEventsForDate(ds);
      if (evs.length > 0) result.push({ date: ds, events: evs });
    }
    // Ordena do mais recente para o mais antigo
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [periodDays, metas, afazeres, googleEvents]);

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    googleListEvents(start, end).then(setGoogleEvents).catch(() => setGoogleEvents([]));
  }, [year, month]);

  const selectedEvents = getEventsForDate(selectedDate);
  const hasEvents = (day: number) => getEventsForDate(getDateStr(day)).length > 0;
  const hasCompleted = (day: number) => getEventsForDate(getDateStr(day)).some(e => e.completed);
  const hasPending = (day: number) => getEventsForDate(getDateStr(day)).some(e => !e.completed);

  const handleDelete = async (event: ReturnType<typeof getEventsForDate>[number]) => {
    if (!confirm(`Excluir "${event.title}"?`)) return;
    try {
      if (event.type === 'mission' && event.metaId) {
        await deleteMission(event.metaId, event.id);
      } else if (event.type === 'afazer') {
        await deleteAfazer(event.id);
      }
      toast.success('Tarefa excluída');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const EventCard = ({ event }: { event: ReturnType<typeof getEventsForDate>[number] }) => {
    const cat = CATEGORY_CONFIG[event.category as string] || CATEGORY_CONFIG['pessoal'];
    const canDelete = event.type === 'mission' || event.type === 'afazer';
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        event.completed ? 'bg-game-green/5 border-game-green/15' : 'bg-secondary/20 border-border'
      }`}>
        <div className={`w-1 h-8 rounded-full shrink-0 ${CATEGORY_BG[cat.color]}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-body font-semibold truncate ${event.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {event.time && <span className="text-[10px] text-muted-foreground font-body">🕐 {event.time}</span>}
            {event.estimatedMinutes && (
              <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{formatMinutesToHM(event.estimatedMinutes)}
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-body">
              {event.type === 'mission' ? 'missão' : event.type === 'google' ? 'google' : 'afazer'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {event.completed && <span className="text-game-green text-xs">✅</span>}
          {canDelete && (
            <button
              onClick={() => handleDelete(event)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Period filter com botão de sync */}
      <div className="flex gap-2 flex-wrap items-center">
        {PERIODS.map(p => (
          <button
            key={p.label}
            onClick={() => setPeriodDays(p.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border ${
              periodDays === p.days
                ? 'border-primary/50 bg-primary/12 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
        
        {/* Botão de sync manual - só aparece no modo full */}
        {syncMode === 'full' && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sync...' : 'Sync Google'}
          </button>
        )}
      </div>

      {periodDays === 0 ? (
        /* ── Calendário ── */
        <>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h3 className="font-display text-sm tracking-[0.15em] text-foreground uppercase">{monthName}</h3>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-[10px] font-display tracking-wider text-muted-foreground uppercase py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = getDateStr(day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const events = hasEvents(day);
                const completed = hasCompleted(day);
                const pending = hasPending(day);

                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    className={`relative h-10 rounded-lg text-sm font-body font-semibold transition-all ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-glow-cyan' :
                      isToday ? 'bg-primary/20 text-primary' :
                      'text-foreground hover:bg-secondary'
                    }`}>
                    {day}
                    {events && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {pending && <div className="w-1 h-1 rounded-full bg-game-orange" />}
                        {completed && <div className="w-1 h-1 rounded-full bg-game-green" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
              📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhum evento para este dia</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((event, i) => <EventCard key={i} event={event} />)}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Lista de período ── */
        <div className="glass-card rounded-2xl p-5 space-y-5">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            📋 Últimos {periodDays} dias
          </h3>
          {!periodEvents || periodEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhum evento no período</p>
          ) : (
            periodEvents.map(({ date, events }) => (
              <div key={date}>
                <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-2">
                  {date === todayStr ? '🟡 Hoje' : new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <div className="space-y-2">
                  {events.map((event, i) => <EventCard key={i} event={event} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
