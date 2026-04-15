import { useState, useEffect, useMemo } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ScheduleProvider, useSchedule } from '@/contexts/ScheduleContext';
import { BottomNav, Page } from '@/components/game/Sidebar';
import { QuoteBar } from '@/components/game/QuoteBar';
import { MetaCard } from '@/components/game/MetaCard';
import { CreateMetaDialog } from '@/components/game/CreateMetaDialog';
import { CategoryOverview } from '@/components/game/CategoryOverview';
import { SchedulePanel } from '@/components/game/SchedulePanel';
import { WeeklyMission } from '@/components/game/WeeklyMission';
import { LevelProgression } from '@/components/game/LevelProgression';
import { AfazeresPanel } from '@/components/game/AfazeresPanel';
import { CalendarView } from '@/components/game/CalendarView';
import { FinancePanel } from '@/components/game/FinancePanel';
import { HydrationPanel } from '@/components/game/HydrationPanel';
import { NotesPanel } from '@/components/game/NotesPanel';
import { DueloPanel } from '@/components/game/DueloPanel';
import { GoogleCalendarDialog } from '@/components/game/GoogleCalendarDialog';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getLevelFromXP, CATEGORY_CONFIG, DayOfWeek } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { googleGetStatus } from '@/lib/googleSync';
import {
  Zap, Target, ListChecks, Calendar, Activity, ChevronRight, Flame,
  CalendarDays, Droplets, Moon, Sun, BarChart3, TrendingUp,
  CheckCircle2, Clock, CalendarPlus, Sliders, CreditCard, Settings
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════
   HELPERS — date range utilities
═══════════════════════════════════════════════ */
function getDateRange(days: number, startDate?: string, endDate?: string): string[] {
  // Se tiver data de início e fim, usa elas
  if (startDate && endDate) {
    const dates: string[] = [];
    const cur = new Date(startDate + 'T12:00');
    const end = new Date(endDate + 'T12:00');
    // Garante que a data de início não seja depois da data de fim
    if (cur > end) return dates;
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  // Se days for 1, retorna apenas hoje
  if (days === 1) {
    return [new Date().toISOString().split('T')[0]];
  }
  // Se days for 0 ou negativo, retorna array vazio
  if (days <= 0) return [];
  // Retorna os últimos 'days' dias
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function dateLabel(date: string): string {
  return new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTaskHistory(dateRange: string[]) {
  const stored: any[] = JSON.parse(localStorage.getItem('lifequest_task_history') || '[]');
  return dateRange.map(date => ({
    date,
    label: dateLabel(date),
    Concluídas: stored.find(h => h.date === date)?.completed ?? 0,
    Perdidas: stored.find(h => h.date === date)?.missed ?? 0,
  }));
}

function getHydrationHistory(dateRange: string[]) {
  const stored = JSON.parse(localStorage.getItem('lifequest_hydration') || '{}');
  const history: any[] = stored.history || [];
  const goalMl = stored.dailyGoalMl || 2000;
  return dateRange.map(date => ({
    date,
    label: dateLabel(date),
    'Ingestão (ml)': history.find((h: any) => h.date === date)?.consumed ?? 0,
    meta: goalMl,
  }));
}

/* ═══════════════════════════════════════════════
   COMPONENT — Range pill selector (reusable)
═══════════════════════════════════════════════ */
function RangePill({
  value, onChange, disabled
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[7, 14, 30].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          disabled={disabled}
          className={`px-2 py-0.5 rounded-md text-[9px] font-display tracking-wider transition-all ${
            value === d
              ? 'bg-primary/18 text-primary border border-primary/30'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — FutureProjection (for metas page)
═══════════════════════════════════════════════ */
function FutureProjection({ meta }: { meta: any }) {
  if (!meta.benefits30d && !meta.benefits6m && !meta.benefits1y) return null;
  return (
    <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
      <h4 className="font-display text-[10px] tracking-[0.2em] text-primary uppercase mb-3">🔮 Projeção de Futuro</h4>
      <div className="space-y-2">
        {meta.benefits30d && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-display text-muted-foreground shrink-0 w-16">30 dias</span>
            <p className="text-xs font-body text-foreground">{meta.benefits30d}</p>
          </div>
        )}
        {meta.benefits6m && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-display text-muted-foreground shrink-0 w-16">6 meses</span>
            <p className="text-xs font-body text-foreground">{meta.benefits6m}</p>
          </div>
        )}
        {meta.benefits1y && (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-display text-muted-foreground shrink-0 w-16">1 ano</span>
            <p className="text-xs font-body text-foreground">{meta.benefits1y}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Quick Actions
═══════════════════════════════════════════════ */
function QuickActions({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const actions = [
    { label: 'Nova Meta', desc: 'Criar objetivo com IA', icon: <Target className="w-4 h-4" />, color: '#EAB308', isMeta: true },
    { label: 'Novo Afazer', desc: 'Tarefa avulsa rápida', icon: <ListChecks className="w-4 h-4" />, color: '#f97316', page: 'afazeres' as Page },
    { label: 'Ver Agenda', desc: 'Planejar calendário', icon: <Calendar className="w-4 h-4" />, color: '#a855f7', page: 'agenda' as Page },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map(a => {
        const card = (
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:bg-secondary/40 transition-all cursor-pointer group text-center"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${a.color}18`, color: a.color }}
            >
              {a.icon}
            </div>
            <div>
              <p className="text-xs font-body font-semibold text-foreground">{a.label}</p>
              <p className="text-[10px] text-muted-foreground font-body">{a.desc}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        );

        if (a.isMeta) return <CreateMetaDialog key={a.label} triggerElement={card} />;
        return <div key={a.label} onClick={() => onNavigate(a.page!)}>{card}</div>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Dashboard Home (standalone, outside Dashboard)
   Contains all 8 blocks + global date selector
═══════════════════════════════════════════════ */
function DashboardHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { metas, afazeres } = useGame();
  const { getDaySchedule } = useSchedule();

  /* ── Google OAuth callback handler ── */
  useEffect(() => {
    // Check for OAuth callback in URL hash
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const state = params.get('state');
      
      if (accessToken) {
        // Send message to parent window (for popup flow)
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-oauth-callback',
            access_token: accessToken,
            state: state
          }, '*');
        }
        
        // Clear hash from URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    }
  }, []);

  /* ── Date range state ── */
  const [globalRange, setGlobalRange] = useState(7);
  const [useCustom, setUseCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  /* ── Per-block range overrides (null = use global) ── */
  const [taskRange, setTaskRange] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number | null>(null);
  const [metricsRange, setMetricsRange] = useState<number | null>(null);
  const [hydRange, setHydRange] = useState<number | null>(null);
  const [catRange, setCatRange] = useState<number | null>(null);

  /* Track today's task completion in localStorage */
  useEffect(() => {
    const allMissions = metas.flatMap(m => m.missions);
    const today = new Date().toISOString().split('T')[0];
    const completed = allMissions.filter(m => m.completedToday).length;
    const missed = Math.max(0, allMissions.length - completed);
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('lifequest_task_history') || '[]');
      const idx = stored.findIndex(h => h.date === today);
      const entry = { date: today, completed, missed };
      if (idx >= 0) stored[idx] = entry; else stored.push(entry);
      localStorage.setItem('lifequest_task_history', JSON.stringify(stored.slice(-90)));
    } catch { /* storage may be full */ }
  }, [metas]);

  /* When global range changes, reset per-block overrides */
  useEffect(() => {
    setTaskRange(null);
    setTimeRange(null);
    setMetricsRange(null);
    setHydRange(null);
    setCatRange(null);
  }, [globalRange, useCustom, customStart, customEnd]);

  /* Resolve effective date range for a block */
  const effectiveDateRange = (override: number | null): string[] => {
    if (useCustom && customStart && customEnd) return getDateRange(0, customStart, customEnd);
    return getDateRange(override ?? globalRange);
  };

  /* ── Computed data ── */
  const taskData = useMemo(() => getTaskHistory(effectiveDateRange(taskRange)), [taskRange, globalRange, useCustom, customStart, customEnd]);
  const hydData = useMemo(() => getHydrationHistory(effectiveDateRange(hydRange)), [hydRange, globalRange, useCustom, customStart, customEnd]);

  const timeStats = useMemo(() => {
    const range = effectiveDateRange(timeRange);
    // Se o range estiver vazio (ex: período custom sem datas), retorna zeros
    if (range.length === 0) {
      return { sleep: 0, busy: 0, free: 0, days: 0 };
    }
    const dayMap: Record<number, DayOfWeek> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
    let sleep = 0, busy = 0, free = 0;
    range.forEach(date => {
      const dow = dayMap[new Date(date + 'T12:00').getDay()];
      // Missões agendadas para esse dia
      const missionMins = metas.flatMap(m => m.missions)
        .filter(mi => mi.scheduledDay === date && mi.estimatedMinutes)
        .reduce((s, mi) => s + (mi.estimatedMinutes || 0), 0);
      // Afazeres agendados para esse dia
      const afazerMins = afazeres
        .filter(a => a.startDate === date && a.estimatedMinutes)
        .reduce((s, a) => s + (a.estimatedMinutes || 0), 0);
      const sched = getDaySchedule(dow, missionMins + afazerMins);
      sleep += sched.sleepMinutes;
      busy += sched.busyMinutes;
      free += sched.freeMinutes;
    });
    return { sleep, busy, free, days: range.length };
  }, [timeRange, globalRange, metas, afazeres, getDaySchedule, useCustom, customStart, customEnd]);

  const metricsData = useMemo(() => {
    const range = effectiveDateRange(metricsRange);
    const stored: any[] = JSON.parse(localStorage.getItem('lifequest_task_history') || '[]');
    const completed = range.reduce((s, d) => s + (stored.find(h => h.date === d)?.completed || 0), 0);
    const missed = range.reduce((s, d) => s + (stored.find(h => h.date === d)?.missed || 0), 0);
    const total = completed + missed;
    return { completed, missed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0, days: range.length };
  }, [metricsRange, globalRange, useCustom, customStart, customEnd]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMissions = useMemo(() => {
    return metas.filter(m => !m.completed).flatMap(m =>
      m.missions
        .filter(mi => mi.scheduledDay === todayStr)
        .map(mi => ({ ...mi, metaTitle: m.title, category: m.category }))
    );
  }, [metas, todayStr]);

  const catProgress = useMemo(() => {
    return (['pessoal', 'profissional', 'espiritual'] as const).map(cat => {
      const catMetas = metas.filter(m => m.category === cat);
      const avg = catMetas.length > 0
        ? Math.round(catMetas.reduce((s, m) => s + m.progress, 0) / catMetas.length)
        : 0;
      return { cat, label: CATEGORY_CONFIG[cat].label, avg, color: CATEGORY_CONFIG[cat].color, count: catMetas.length };
    });
  }, [metas]);

  /* ── Shared chart tooltip style ── */
  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    fontSize: '11px',
  };

  /* ── Block header helper ── */
  const BlockHdr = ({
    icon, title, range, setRange, showRange = true,
  }: {
    icon: React.ReactNode; title: string;
    range: number | null; setRange: (v: number | null) => void; showRange?: boolean;
  }) => {
    const effectiveRange = range ?? globalRange;
    return (
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
          {icon} {title}
        </h3>
        {showRange && (
          <div className="flex items-center gap-1.5">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setRange(d === globalRange && range === null ? null : d)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-display tracking-wider transition-all border ${
                  effectiveRange === d
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'text-muted-foreground border-transparent hover:border-border'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          [0] GLOBAL DATE RANGE SELECTOR
          Full-width bar at the top — controls all blocks
      ══════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-display tracking-[0.24em] text-muted-foreground uppercase">Período de análise</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setGlobalRange(1); setUseCustom(false); setShowCustomInputs(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border ${
              !useCustom && globalRange === 1
                ? 'border-primary/50 bg-primary/12 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            Hoje
          </button>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => { setGlobalRange(d); setUseCustom(false); setShowCustomInputs(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border ${
                !useCustom && globalRange === d
                  ? 'border-primary/50 bg-primary/12 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {d} dias
            </button>
          ))}
          <button
            onClick={() => { setShowCustomInputs(v => !v); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border ${
              useCustom
                ? 'border-primary/50 bg-primary/12 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            <Sliders className="w-3 h-3" /> Personalizar
          </button>
        </div>

        {showCustomInputs && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={customStart}
              onChange={e => { setCustomStart(e.target.value); if (customEnd) { setUseCustom(true); } }}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50"
            />
            <span className="text-[10px] text-muted-foreground">até</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={e => { setCustomEnd(e.target.value); if (customStart) { setUseCustom(true); } }}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50"
            />
            {useCustom && (
              <button
                onClick={() => { setUseCustom(false); setCustomStart(''); setCustomEnd(''); setShowCustomInputs(false); }}
                className="text-[10px] text-destructive font-body hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        {useCustom && customStart && customEnd && (
          <span className="text-[10px] text-primary font-body ml-auto">
            {dateLabel(customStart)} → {dateLabel(customEnd)}
          </span>
        )}
      </section>

      {/* ══════════════════════════════════════════
          [1] BLOCO DE FRASE MOTIVACIONAL
      ══════════════════════════════════════════ */}
      <QuoteBar />

      {/* ══════════════════════════════════════════
          [2] GRÁFICO DE TAREFAS CONCLUÍDAS / PERDIDAS
          Desktop: 8/12 | Time block: 4/12
      ══════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Tasks bar chart */}
        <div className="xl:col-span-8 rounded-2xl border border-border/50 bg-card p-5">
          <BlockHdr
            icon={<BarChart3 className="w-3.5 h-3.5 text-primary" />}
            title="Tarefas concluídas vs. perdidas"
            range={taskRange} setRange={setTaskRange}
          />

          {taskData.every(d => d.Concluídas === 0 && d.Perdidas === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhum dado disponível para o período</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Os dados serão acumulados conforme você usa o app</p>
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taskData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <ChartTooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="Concluídas" stroke="hsl(45 95% 52%)" strokeWidth={2} dot={{ fill: 'hsl(45 95% 52%)', r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Perdidas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))', r: 3 }} activeDot={{ r: 5 }} strokeOpacity={0.75} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-[10px] font-body text-primary">
                  <span className="w-3 h-2 rounded bg-primary inline-block" /> Concluídas
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-body text-destructive">
                  <span className="w-3 h-2 rounded bg-destructive inline-block opacity-75" /> Perdidas
                </span>
              </div>
            </>
          )}
        </div>

        {/* Time block — Sleep / Busy / Free */}
        <div className="xl:col-span-4 rounded-2xl border border-border/50 bg-card p-5">
          <BlockHdr
            icon={<Clock className="w-3.5 h-3.5 text-primary" />}
            title="Distribuição de tempo"
            range={timeRange} setRange={setTimeRange}
          />

          <div className="space-y-3">
            {[
              { label: 'Sono', value: timeStats.sleep, icon: <Moon className="w-4 h-4" />, color: '#a855f7', bg: 'bg-purple-500' },
              { label: 'Tempo ocupado', value: timeStats.busy, icon: <Activity className="w-4 h-4" />, color: '#EAB308', bg: 'bg-primary' },
              { label: 'Tempo livre', value: timeStats.free, icon: <Sun className="w-4 h-4" />, color: '#22c55e', bg: 'bg-green-500' },
            ].map(item => {
              const total = timeStats.sleep + timeStats.busy + timeStats.free || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: item.color }}>
                      {item.icon}
                      <span className="text-xs font-body font-semibold text-foreground">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-body font-bold text-foreground">{formatMinutesToHM(item.value)}</span>
                      <span className="text-[10px] text-muted-foreground font-body ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/60">
                    <div
                      className={`h-full rounded-full ${item.bg} opacity-80 transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground font-body mt-4 text-center">
            Média por dia · {timeStats.days} dia{timeStats.days !== 1 ? 's' : ''} analisado{timeStats.days !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          [3] MÉTRICAS DA SEMANA   +   [4] AÇÕES RÁPIDAS
      ══════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Weekly metrics */}
        <div className="xl:col-span-5 rounded-2xl border border-border/50 bg-card p-5">
          <BlockHdr
            icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
            title="Métricas do período"
            range={metricsRange} setRange={setMetricsRange}
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Concluídas', value: metricsData.completed, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
              { label: 'Perdidas', value: metricsData.missed, color: 'text-destructive', bg: 'bg-destructive/8 border-destructive/20' },
              { label: 'Taxa de conclusão', value: `${metricsData.rate}%`, color: metricsData.rate >= 70 ? 'text-green-400' : metricsData.rate >= 40 ? 'text-yellow-400' : 'text-destructive', bg: 'bg-secondary/40 border-border/60' },
              { label: 'Total de tarefas', value: metricsData.total, color: 'text-foreground', bg: 'bg-secondary/40 border-border/60' },
            ].map(m => (
              <div key={m.label} className={`rounded-xl border p-3 ${m.bg}`}>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">{m.label}</p>
                <p className={`font-display text-xl mt-0.5 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-body mb-1.5">
              <span>Taxa de conclusão</span>
              <span className={metricsData.rate >= 70 ? 'text-green-400' : 'text-muted-foreground'}>{metricsData.rate}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metricsData.rate >= 70 ? 'bg-green-500' : metricsData.rate >= 40 ? 'bg-yellow-500' : 'bg-destructive'
                }`}
                style={{ width: `${metricsData.rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="xl:col-span-7 rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Ações Rápidas
            </h3>
          </div>
          <QuickActions onNavigate={onNavigate} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          [5] TAREFAS DO DIA (AGENDA)
      ══════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
            <CalendarPlus className="w-3.5 h-3.5 text-primary" /> Tarefas do Dia
            <span className="text-[9px] text-muted-foreground font-body normal-case">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </span>
          </h3>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-[10px] text-primary font-body inline-flex items-center gap-1 hover:underline"
          >
            Agenda completa <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {todayMissions.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CalendarPlus className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-body text-muted-foreground">Nenhuma tarefa agendada para hoje</p>
            <button
              onClick={() => onNavigate('agenda')}
              className="mt-3 text-xs text-primary font-body underline"
            >
              Agendar missões
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {todayMissions.map(mi => {
              const cat = CATEGORY_CONFIG[mi.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG['pessoal'];
              return (
                <div
                  key={mi.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                    mi.completedToday
                      ? 'bg-secondary/20 border-border/30 opacity-55'
                      : 'bg-secondary/40 border-border/60 hover:border-primary/30'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${mi.completedToday ? 'bg-green-500' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-body font-semibold truncate ${mi.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {mi.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-display tracking-wider" style={{ color: `hsl(var(--${cat.color}))` }}>
                        {cat.label}
                      </span>
                      {mi.estimatedMinutes && (
                        <span className="text-[9px] text-muted-foreground font-body flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{formatMinutesToHM(mi.estimatedMinutes)}
                        </span>
                      )}
                      {mi.scheduledTime && (
                        <span className="text-[9px] text-muted-foreground font-body">{mi.scheduledTime}</span>
                      )}
                    </div>
                  </div>
                  {mi.completedToday && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          [6] HIDRATAÇÃO (gráfico 7 dias)
          Desktop: 6/12  |  [7] PROGRESSO POR ÁREA: 6/12
      ══════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Hydration bar chart */}
        <div className="xl:col-span-6 rounded-2xl border border-border/50 bg-card p-5">
          <BlockHdr
            icon={<Droplets className="w-3.5 h-3.5 text-primary" />}
            title="Hidratação diária"
            range={hydRange} setRange={setHydRange}
          />

          {hydData.every(d => d['Ingestão (ml)'] === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Droplets className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhum dado de hidratação</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Registre a água ingerida na aba Hidratação</p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hydData} margin={{ top: 5, right: 5, bottom: 5, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${Math.round(v / 1000 * 10) / 10}L`} />
                    <ChartTooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(v: number, name: string) => {
                        if (name === 'meta') return [`${v}ml`, 'Meta'];
                        return [`${v}ml`, 'Ingestão'];
                      }}
                    />
                    <ReferenceLine y={hydData[0]?.meta || 2000} stroke="#EAB308" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Meta', position: 'right', fontSize: 9, fill: '#EAB308' }} />
                    <Line type="monotone" dataKey="Ingestão (ml)" stroke="#EAB308" strokeWidth={2} dot={{ fill: '#EAB308', r: 3 }} activeDot={{ r: 5 }} strokeOpacity={0.85} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground font-body text-center mt-2">
                Linha pontilhada = meta diária ({hydData[0]?.meta || 2000}ml)
              </p>
            </>
          )}
        </div>

        {/* Category progress */}
        <div className="xl:col-span-6 rounded-2xl border border-border/50 bg-card p-5">
          <BlockHdr
            icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
            title="Progresso por área"
            range={catRange} setRange={setCatRange}
          />

          {catProgress.every(c => c.count === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhuma meta criada ainda</p>
              <button onClick={() => onNavigate('metas')} className="mt-2 text-xs text-primary font-body underline">
                Criar primeira meta
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {catProgress.map(c => {
                const colorMap: Record<string, string> = {
                  'personal-purple': '#a855f7',
                  'game-orange': '#f97316',
                  'game-blue': '#EAB308',
                };
                const hex = colorMap[c.color] || '#EAB308';
                return (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-body font-semibold text-foreground">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground font-body ml-2">({c.count} meta{c.count !== 1 ? 's' : ''})</span>
                      </div>
                      <span className="font-display text-sm" style={{ color: hex }}>{c.avg}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary/60">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${c.avg}%`, backgroundColor: hex }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Mini chart */}
              <div className="mt-2 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={catProgress.map(c => ({ name: c.label.split(' ')[0], Progresso: c.avg }))}
                    margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                    <ChartTooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Progresso']} />
                    <Line type="monotone" dataKey="Progresso" stroke="#EAB308" strokeWidth={2} dot={{ fill: '#EAB308', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Agenda page with Google Calendar
═══════════════════════════════════════════════ */
function AgendaPage({ pendingToken, pendingMode, onTokenConsumed }: {
  pendingToken?: string | null;
  pendingMode?: 'partial' | 'total' | null;
  onTokenConsumed?: () => void;
}) {
  const [gcalOpen, setGcalOpen] = useState(false);
  const [gcalStatus, setGcalStatus] = useState<{ connected: boolean; mode: string | null }>({ connected: false, mode: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [googleCalendarMinutes, setGoogleCalendarMinutes] = useState(0);

  useEffect(() => {
    checkGcalStatus();
  }, []);

  // Abre o dialog automaticamente quando vem token do redirect OAuth
  useEffect(() => {
    if (pendingToken) {
      setGcalOpen(true);
    }
  }, [pendingToken]);

  const checkGcalStatus = async () => {
    try {
      const result = await googleGetStatus();
      setGcalStatus({ connected: result.connected, mode: result.mode });
    } catch {
      setGcalStatus({ connected: false, mode: null });
    }
  };

  const handleIntegrationSuccess = () => {
    setShowSuccessModal(true);
    checkGcalStatus();
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  return (
    <div className="space-y-5 relative">
      <h1 className="font-display text-lg tracking-wider text-foreground">Agenda</h1>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-green-500/30 rounded-2xl p-6 max-w-sm mx-4 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-display text-lg text-foreground mb-2">Agenda Integrada!</h3>
            <p className="text-sm text-muted-foreground font-body">
              Sua conta Google Agenda foi conectada com sucesso.
            </p>
          </div>
        </div>
      )}
      
      {/* Google Calendar Status - só aparece se NÃO estiver conectado */}
      {!gcalStatus.connected ? (
        <div className="section-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-foreground">Google Agenda</p>
            <p className="text-[11px] text-muted-foreground font-body">Sincronize seus eventos com o Google</p>
          </div>
          <button
            onClick={() => setGcalOpen(true)}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body font-semibold hover:bg-primary/20 transition-colors"
          >
            Integrar
          </button>
        </div>
      ) : (
        /* Quando conectado, mostra botão pequeno para reintegrar */
        <div className="flex justify-end">
          <button
            onClick={() => setGcalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border"
          >
            Reintegrar agenda
          </button>
        </div>
      )}
      
      <CalendarView onDateSelect={setCalendarSelectedDate} onGoogleMinutesChange={setGoogleCalendarMinutes} />
      <SchedulePanel selectedDate={calendarSelectedDate} googleExtraMinutes={googleCalendarMinutes} />
      <GoogleCalendarDialog
        open={gcalOpen}
        onOpenChange={(v) => { setGcalOpen(v); if (!v) onTokenConsumed?.(); }}
        onSuccess={handleIntegrationSuccess}
        initialToken={pendingToken}
        initialMode={pendingMode}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Dashboard shell
═══════════════════════════════════════════════ */
function Dashboard() {
  const { stats } = useGame();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Recupera a página salva no localStorage ou usa 'dashboard' como padrão
    const savedPage = localStorage.getItem('lifequest_current_page') as Page;
    return savedPage || 'dashboard';
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lifequest_theme') !== 'light');
  const [pendingGcalToken, setPendingGcalToken] = useState<string | null>(null);
  const [pendingGcalMode, setPendingGcalMode] = useState<'partial' | 'total' | null>(null);

  // Detecta retorno do OAuth do Google (token fica no hash da URL)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const mode = sessionStorage.getItem('gcal_pending_mode') as 'partial' | 'total' | null;
      if (token) {
        // Limpa o hash da URL para não ficar exposto
        window.history.replaceState(null, '', window.location.pathname);
        sessionStorage.removeItem('gcal_pending_mode');
        setPendingGcalToken(token);
        setPendingGcalMode(mode || 'partial');
        setCurrentPage('agenda');
      }
    }
  }, []);

  // Salva a página atual no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('lifequest_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('lifequest_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const levelInfo = getLevelFromXP(stats.xp);
  const xpProgress = Math.min(((stats.xp % 1000) / 1000) * 100, 100);

  const { metas } = useGame();
  const activeMetas = metas.filter(m => !m.completed);
  const completedMetas = metas.filter(m => m.completed);

  const pageTitle: Record<Page, string> = {
    dashboard: 'Início',
    metas: 'Metas',
    afazeres: 'Afazeres',
    agenda: 'Agenda',
    missao: 'Missão Semanal',
    progressao: 'Progressão',
    financeiro: 'Financeiro',
    hidratacao: 'Hidratação',
    anotacoes: 'Anotações',
    duelo: 'Duelos',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome onNavigate={setCurrentPage} />;

      case 'metas':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Gerenciar Metas</h1>
            <CreateMetaDialog />
            <CategoryOverview />
            <div className="space-y-4">
              {activeMetas.map(meta => (
                <div key={meta.id}>
                  <MetaCard meta={meta} />
                  <FutureProjection meta={meta} />
                </div>
              ))}
            </div>
            {completedMetas.length > 0 && (
              <div className="space-y-3 opacity-60">
                <h2 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Concluídas</h2>
                {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
              </div>
            )}
          </div>
        );

      case 'afazeres':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Afazeres</h1>
            <p className="text-sm text-muted-foreground font-body">Tarefas avulsas ou recorrentes do dia a dia.</p>
            <AfazeresPanel />
          </div>
        );

      case 'agenda':
        return <AgendaPage pendingToken={pendingGcalToken} pendingMode={pendingGcalMode} onTokenConsumed={() => { setPendingGcalToken(null); setPendingGcalMode(null); }} />;

      case 'missao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Missão Semanal</h1>
            <p className="text-sm text-muted-foreground font-body">Toda semana você recebe uma missão de ajudar alguém.</p>
            <WeeklyMission />
          </div>
        );

      case 'progressao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Progressão & Níveis</h1>
            <p className="text-sm text-muted-foreground font-body">
              Cada nível representa quem você está se tornando.
            </p>
            <LevelProgression />
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Financeiro</h1>
            <FinancePanel />
          </div>
        );

      case 'hidratacao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Hidratação</h1>
            <HydrationPanel />
          </div>
        );

      case 'anotacoes':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Anotações</h1>
            <p className="text-sm text-muted-foreground font-body">Registre pensamentos, aprendizados e reflexões.</p>
            <NotesPanel />
          </div>
        );

      case 'duelo':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Duelos</h1>
            <DueloPanel />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-24 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.12),transparent_40%),radial-gradient(circle_at_100%_15%,hsl(var(--personal-purple)/0.08),transparent_40%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-4 md:px-6">
          <div className="max-w-[1800px] mx-auto flex items-center gap-3 py-3">

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-blue-400 flex items-center justify-center shadow-[0_0_14px_hsl(var(--primary)/0.4)] ring-1 ring-primary/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-display text-[9px] md:text-[10px] tracking-[0.28em] text-primary uppercase">SUA VIDA É UM JOGO</span>
                <span className="text-[10px] md:text-[11px] font-body text-muted-foreground">{pageTitle[currentPage]}</span>
              </div>
            </div>

            {/* XP bar — desktop only */}
            <div className="hidden lg:flex flex-1 items-center gap-3 px-4">
              <span className="text-[10px] font-body text-muted-foreground flex-shrink-0">Nv.{stats.level}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_8px_hsl(var(--primary)/0.4)] transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-body text-muted-foreground flex-shrink-0">{stats.xp.toLocaleString()} XP</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {stats.streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/8 px-2.5 py-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-body text-orange-400">{stats.streak}d</span>
                </div>
              )}
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-card/80 px-2.5 py-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-body text-muted-foreground">Nível {stats.level}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-4 md:px-6 py-5">
        <div className="max-w-[1800px] mx-auto">
          {renderPage()}
        </div>
      </main>

      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />
    </div>
  );
}

export default function Index() {
  return (
    <GameProvider>
      <ScheduleProvider>
        <Dashboard />
      </ScheduleProvider>
    </GameProvider>
  );
}
