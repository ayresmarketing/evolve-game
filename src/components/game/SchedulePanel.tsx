import { useState } from 'react';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useGame } from '@/contexts/GameContext';
import { DayOfWeek, DAYS_OF_WEEK, calculateSleepHours, calculateBlockHours } from '@/types/game';
import { Moon, Sun, Plus, Trash2, Clock, AlertTriangle, X, BedDouble } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMinutesToHM } from '@/lib/formatTime';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface SchedulePanelProps {
  /** Data específica selecionada no calendário — usada no gráfico de distribuição */
  selectedDate?: string;
  /** Minutos extras de eventos externos do Google Calendar (não vinculados a afazeres locais) */
  googleExtraMinutes?: number;
}

export function SchedulePanel({ selectedDate, googleExtraMinutes = 0 }: SchedulePanelProps) {
  const { sleepSchedules, fixedBlocks, addSleepSchedule, deleteSleepSchedule, addFixedBlock, deleteFixedBlock, getDaySchedule } = useSchedule();
  const { afazeres, metas } = useGame();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('seg');
  const [showAddSleep, setShowAddSleep] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);

  // Sleep form state
  const [sleepBedtime, setSleepBedtime] = useState('22:00');
  const [sleepWakeTime, setSleepWakeTime] = useState('06:00');
  const [sleepDays, setSleepDays] = useState<DayOfWeek[]>(['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']);

  // Block form state
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('08:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockDays, setBlockDays] = useState<DayOfWeek[]>(['seg', 'ter', 'qua', 'qui', 'sex']);

  // Usa a data selecionada no calendário; se não tiver, usa hoje
  const chartDate = selectedDate || new Date().toISOString().split('T')[0];
  const dayOfWeekMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
  const chartDayOfWeek: DayOfWeek = dayOfWeekMap[new Date(chartDate + 'T12:00').getDay()];

  // Todos os afazeres da data específica (não recorrentes no dia + recorrentes que incluem esse dia)
  const dateAfazeres = afazeres.filter(a => {
    if (a.completed) return false;
    if (a.startDate === chartDate) return true;
    if (a.isRecurrent && a.recurrentDays?.includes(chartDayOfWeek)) return true;
    return false;
  });

  // Missões agendadas para a data específica
  const dateMissions = metas.flatMap(m =>
    m.missions.filter(mi => mi.scheduledDay === chartDate && !mi.completedToday)
  );

  // Total de minutos ocupados por tarefas na data (local + eventos externos do Google)
  const taskMinutes =
    dateAfazeres.reduce((total, a) => {
      if (a.startTime && a.endTime) {
        return total + Math.max(0, toMinutes(a.endTime) - toMinutes(a.startTime));
      }
      return total + (a.estimatedMinutes || 0);
    }, 0) +
    dateMissions.reduce((total, m) => total + (m.estimatedMinutes || 0), 0) +
    googleExtraMinutes;

  // Overlap de tarefas com horário de sono
  const sleepForChartDay = sleepSchedules.find(s => s.days.includes(chartDayOfWeek));
  let taskInSleepTime = 0;
  if (sleepForChartDay) {
    const sleepStart = toMinutes(sleepForChartDay.bedtime);
    const sleepEnd = toMinutes(sleepForChartDay.wakeTime);
    const spansMidnight = sleepStart > sleepEnd;

    [...dateAfazeres, ...dateMissions.map(m => ({ startTime: m.scheduledTime, endTime: undefined, estimatedMinutes: m.estimatedMinutes }))].forEach((a: any) => {
      if (!a.startTime) return;
      const aStart = toMinutes(a.startTime);
      const aEnd = a.endTime ? toMinutes(a.endTime) : aStart + (a.estimatedMinutes || 0);
      const overlap = (s: number, e: number) => Math.max(0, Math.min(aEnd, e) - Math.max(aStart, s));
      taskInSleepTime += spansMidnight
        ? overlap(sleepStart, 1440) + overlap(0, sleepEnd)
        : overlap(sleepStart, sleepEnd);
    });
  }

  const daySchedule = getDaySchedule(chartDayOfWeek, taskMinutes, taskInSleepTime);

  // Para a seção de configuração de horários ainda usa o selectedDay
  const sleepForDay = sleepSchedules.find(s => s.days.includes(selectedDay));
  const sleepHours = sleepForDay ? calculateSleepHours(sleepForDay.bedtime, sleepForDay.wakeTime) : 0;

  // Sleep alerts
  const getSleepAlert = () => {
    if (!sleepForDay) return null;
    if (sleepHours < 7) {
      return {
        type: 'danger' as const,
        icon: <AlertTriangle className="w-5 h-5 text-game-red" />,
        title: '⚠️ ALERTA: SONO INSUFICIENTE',
        message: `Você está dormindo apenas ${formatMinutesToHM(Math.round(sleepHours * 60))}. Dormir menos de 7 horas causa: perda de memória, queda na imunidade, aumento de peso, irritabilidade, risco de doenças cardíacas e redução drástica na produtividade. Seu corpo PRECISA de descanso para evoluir.`,
        color: 'border-game-red/50 bg-game-red/10',
      };
    }
    if (sleepHours > 8) {
      return {
        type: 'warning' as const,
        icon: <BedDouble className="w-5 h-5 text-game-orange" />,
        title: '💤 SONO EXCESSIVO',
        message: `Você está dormindo ${formatMinutesToHM(Math.round(sleepHours * 60))}. Está se sentindo cansado durante o dia? Se não, considere reduzir 30-60 minutos de sono e usar esse tempo para avançar nos seus objetivos. Cada hora extra acordado com propósito é uma hora de evolução.`,
        color: 'border-game-orange/50 bg-game-orange/10',
      };
    }
    return null;
  };

  const sleepAlert = getSleepAlert();

  // Pie chart data
  const chartData = [
    { name: 'Sono', value: daySchedule.sleepHours, color: 'hsl(260, 70%, 60%)' },
    { name: 'Ocupado', value: daySchedule.busyHours, color: 'hsl(25, 90%, 55%)' },
    { name: 'Livre', value: daySchedule.freeHours, color: 'hsl(145, 70%, 45%)' },
  ].filter(d => d.value > 0);

  const toggleDay = (day: DayOfWeek, current: DayOfWeek[], setter: (d: DayOfWeek[]) => void) => {
    setter(current.includes(day) ? current.filter(d => d !== day) : [...current, day]);
  };

  const handleAddSleep = () => {
    if (sleepDays.length === 0) return;
    addSleepSchedule({ bedtime: sleepBedtime, wakeTime: sleepWakeTime, days: sleepDays });
    setShowAddSleep(false);
  };

  const handleAddBlock = () => {
    if (!blockTitle.trim() || blockDays.length === 0) return;
    addFixedBlock({ title: blockTitle, startTime: blockStart, endTime: blockEnd, days: blockDays });
    setBlockTitle('');
    setShowAddBlock(false);
  };

  return (
    <div className="space-y-6">
      {/* Time Distribution Chart + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart - altura igualada */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-game-card h-[280px] flex flex-col">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">
            DISTRIBUIÇÃO — {new Date(chartDate + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toUpperCase()}
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMinutesToHM(Math.round(value * 60))} contentStyle={{ background: 'hsl(228, 20%, 12%)', border: '1px solid hsl(228, 15%, 20%)', borderRadius: '8px', fontFamily: 'Rajdhani' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {chartData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                <span className="text-xs font-body text-muted-foreground">{d.name}: {formatMinutesToHM(Math.round(d.value * 60))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats cards - altura igualada */}
        <div className="grid grid-rows-3 gap-3 h-[280px]">
          {[
            { label: 'Tempo de Sono', value: formatMinutesToHM(daySchedule.sleepMinutes), icon: Moon, color: 'text-game-purple' },
            { label: 'Tempo Ocupado', value: formatMinutesToHM(daySchedule.busyMinutes), icon: Clock, color: 'text-game-orange' },
            { label: 'Tempo Livre', value: formatMinutesToHM(daySchedule.freeMinutes), icon: Sun, color: 'text-game-green' },
          ].map(item => (
            <div key={item.label} className="bg-card rounded-xl p-4 border border-border shadow-game-card flex items-center gap-3">
              <item.icon className={`w-8 h-8 ${item.color}`} />
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{item.label}</p>
                <p className="font-display text-xl text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep Alert */}
      {sleepAlert && (
        <div className={`rounded-xl p-4 border ${sleepAlert.color} animate-slide-up`}>
          <div className="flex items-start gap-3">
            {sleepAlert.icon}
            <div>
              <h4 className="font-display text-sm tracking-wider text-foreground mb-1">{sleepAlert.title}</h4>
              <p className="text-sm font-body text-foreground/80 leading-relaxed">{sleepAlert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Schedules + Fixed Blocks - lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sleep Schedules */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-game-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground flex items-center gap-2">
              <Moon className="w-4 h-4 text-game-purple" /> HORÁRIOS DE SONO
            </h3>
            <button onClick={() => setShowAddSleep(!showAddSleep)} className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              {showAddSleep ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showAddSleep && (
            <div className="space-y-3 mb-4 p-3 bg-secondary/30 rounded-lg animate-slide-up">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">DORMIR ÀS</label>
                  <input type="time" value={sleepBedtime} onChange={e => setSleepBedtime(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">ACORDAR ÀS</label>
                  <input type="time" value={sleepWakeTime} onChange={e => setSleepWakeTime(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">DIAS DA SEMANA</label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value, sleepDays, setSleepDays)}
                      className={`flex-1 py-1.5 rounded text-xs font-body font-semibold transition-all ${sleepDays.includes(d.value) ? 'bg-game-purple/30 text-game-purple border border-game-purple/40' : 'bg-muted text-muted-foreground border border-transparent'}`}>
                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddSleep} className="w-full bg-gradient-gold text-primary-foreground font-display text-xs tracking-wider py-2 rounded-md hover:shadow-glow-gold transition-all">
                SALVAR HORÁRIO DE SONO
              </button>
            </div>
          )}

          <div className="space-y-2">
            {sleepSchedules.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-game-purple" />
                  <div>
                    <p className="text-sm font-body font-semibold text-foreground">{s.bedtime} → {s.wakeTime}</p>
                    <p className="text-[10px] text-muted-foreground font-body">
                      {s.days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label?.substring(0, 3)).join(', ')} · {formatMinutesToHM(Math.round(calculateSleepHours(s.bedtime, s.wakeTime) * 60))} de sono
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteSleepSchedule(s.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {sleepSchedules.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-3">Nenhum horário de sono configurado</p>}
          </div>
        </div>

        {/* Fixed Time Blocks */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-game-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-game-orange" /> COMPROMISSOS FIXOS
            </h3>
            <button onClick={() => setShowAddBlock(!showAddBlock)} className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              {showAddBlock ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showAddBlock && (
            <div className="space-y-3 mb-4 p-3 bg-secondary/30 rounded-lg animate-slide-up">
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">NOME</label>
                <input value={blockTitle} onChange={e => setBlockTitle(e.target.value)} placeholder="Ex: Trabalho, Faculdade..."
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">INÍCIO</label>
                  <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">FIM</label>
                  <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1">DIAS DA SEMANA</label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value, blockDays, setBlockDays)}
                      className={`flex-1 py-1.5 rounded text-xs font-body font-semibold transition-all ${blockDays.includes(d.value) ? 'bg-game-orange/30 text-game-orange border border-game-orange/40' : 'bg-muted text-muted-foreground border border-transparent'}`}>
                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddBlock} className="w-full bg-gradient-gold text-primary-foreground font-display text-xs tracking-wider py-2 rounded-md hover:shadow-glow-gold transition-all">
                ADICIONAR COMPROMISSO
              </button>
            </div>
          )}

          <div className="space-y-2">
            {fixedBlocks.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-game-orange" />
                  <div>
                    <p className="text-sm font-body font-semibold text-foreground">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground font-body">
                      {b.startTime} → {b.endTime} · {b.days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label?.substring(0, 3)).join(', ')} · {formatMinutesToHM(Math.round(calculateBlockHours(b.startTime, b.endTime) * 60))}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteFixedBlock(b.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {fixedBlocks.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-3">Nenhum compromisso fixo configurado</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
