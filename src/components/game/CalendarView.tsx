import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function CalendarView() {
  const { metas, afazeres } = useGame();
  const { fixedBlocks, sleepSchedules } = useSchedule();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

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

  // Get all events for a date
  const getEventsForDate = (dateStr: string) => {
    const missions = metas.flatMap(m => m.missions.filter(mi => mi.scheduledDay === dateStr).map(mi => ({
      type: 'mission' as const, title: mi.title, time: mi.scheduledTime, category: m.category,
      completed: mi.completedToday, estimatedMinutes: mi.estimatedMinutes, metaTitle: m.title,
    })));
    const tasks = afazeres.filter(a => {
      if (a.startDate === dateStr) return true;
      if (a.isRecurrent && a.recurrentDays) {
        const d = new Date(dateStr + 'T12:00:00');
        const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
        return a.recurrentDays.includes(dayMap[d.getDay()]);
      }
      return false;
    }).map(a => ({
      type: 'afazer' as const, title: a.title, time: a.startTime, category: a.category,
      completed: a.completed, estimatedMinutes: a.estimatedMinutes,
    }));
    return [...missions, ...tasks].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedEvents = getEventsForDate(selectedDate);

  const hasEvents = (day: number) => getEventsForDate(getDateStr(day)).length > 0;
  const hasCompleted = (day: number) => getEventsForDate(getDateStr(day)).some(e => e.completed);
  const hasPending = (day: number) => getEventsForDate(getDateStr(day)).some(e => !e.completed);

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-2xl p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-display text-sm tracking-[0.15em] text-foreground uppercase">{monthName}</h3>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-[10px] font-display tracking-wider text-muted-foreground uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
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

      {/* Selected day events */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
          📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhum evento para este dia</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event, i) => {
              const cat = CATEGORY_CONFIG[event.category];
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  event.completed ? 'bg-game-green/5 border-game-green/15' : 'bg-secondary/20 border-border'
                }`}>
                  <div className={`w-1 h-8 rounded-full ${CATEGORY_BG[cat.color]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-body font-semibold ${event.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {event.time && <span className="text-[10px] text-muted-foreground font-body">🕐 {event.time}</span>}
                      {event.estimatedMinutes && (
                        <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{event.estimatedMinutes}min
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-body">{event.type === 'mission' ? 'missão' : 'afazer'}</span>
                    </div>
                  </div>
                  {event.completed && <span className="text-game-green text-xs">✅</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
