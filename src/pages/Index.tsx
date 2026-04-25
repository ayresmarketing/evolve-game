import { useState, useEffect, useMemo } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ScheduleProvider, useSchedule } from '@/contexts/ScheduleContext';
import { BottomNav, DesktopSidebar, Page } from '@/components/game/Sidebar';
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
import { getLevelFromXP, CATEGORY_CONFIG } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { supabase } from '@/integrations/supabase/client';
import { googleGetStatus } from '@/lib/googleSync';
import {
  Zap, Target, ListChecks, Calendar, Activity, ChevronRight, Flame,
  CalendarDays, Droplets, Moon, Sun, BarChart3, TrendingUp,
  CheckCircle2, Clock, CalendarPlus, Sliders, Sparkles,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine, Legend,
  AreaChart, Area,
} from 'recharts';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════
   HELPERS — date range utilities
═══════════════════════════════════════════════ */
function getDateRange(days: number, startDate?: string, endDate?: string): string[] {
  if (startDate && endDate) {
    const dates: string[] = [];
    const cur = new Date(startDate + 'T12:00');
    const end = new Date(endDate + 'T12:00');
    if (cur > end) return dates;
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  if (days === 1) return [new Date().toISOString().split('T')[0]];
  if (days <= 0) return [];
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
   COMPONENT — Range pill selector
═══════════════════════════════════════════════ */
function RangePill({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[7, 14, 30].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-display tracking-wider transition-all border
            ${value === d
              ? 'bg-primary/14 text-primary border-primary/28'
              : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border/60'
            }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — FutureProjection
═══════════════════════════════════════════════ */
function FutureProjection({ meta }: { meta: any }) {
  if (!meta.benefits30d && !meta.benefits6m && !meta.benefits1y) return null;
  return (
    <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/12">
      <h4 className="font-display text-[10px] tracking-[0.22em] text-primary uppercase mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Projeção de Futuro
      </h4>
      <div className="space-y-2">
        {meta.benefits30d && (
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-display text-muted-foreground shrink-0 w-16">30 dias</span>
            <p className="text-xs font-body text-foreground">{meta.benefits30d}</p>
          </div>
        )}
        {meta.benefits6m && (
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-display text-muted-foreground shrink-0 w-16">6 meses</span>
            <p className="text-xs font-body text-foreground">{meta.benefits6m}</p>
          </div>
        )}
        {meta.benefits1y && (
          <div className="flex items-start gap-3">
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
    {
      label: 'Nova Meta', desc: 'Criar objetivo com IA',
      icon: <Target className="w-5 h-5" />, color: '#a855f7',
      colorHex: '#a855f7', isMeta: true,
    },
    {
      label: 'Novo Afazer', desc: 'Tarefa avulsa rápida',
      icon: <ListChecks className="w-5 h-5" />, color: '#f97316',
      colorHex: '#f97316', page: 'afazeres' as Page,
    },
    {
      label: 'Ver Agenda', desc: 'Planejar calendário',
      icon: <Calendar className="w-5 h-5" />, color: '#00e079',
      colorHex: '#00e079', page: 'agenda' as Page,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map(a => {
        const card = (
          <div
            className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-secondary/20
              hover:border-primary/25 hover:bg-secondary/40 transition-all cursor-pointer group"
            style={{ borderColor: `${a.colorHex}18` }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${a.colorHex}15`, color: a.colorHex }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-bold text-foreground">{a.label}</p>
              <p className="text-[11px] text-muted-foreground font-body">{a.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        );
        if (a.isMeta) return <CreateMetaDialog key={a.label} triggerElement={card} />;
        return <div key={a.label} onClick={() => onNavigate(a.page!)}>{card}</div>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Section header
═══════════════════════════════════════════════ */
function SectionHeader({ icon, title, action }: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-primary/12 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-display text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Dashboard Home
═══════════════════════════════════════════════ */
function DashboardHome({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { metas, afazeres, stats, showInactivityWarning, dismissInactivityWarning } = useGame();
  const { getDaySchedule } = useSchedule();

  /* ── Google OAuth callback ── */
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const state = params.get('state');
      if (accessToken) {
        if (window.opener) {
          window.opener.postMessage({ type: 'google-oauth-callback', access_token: accessToken, state }, '*');
        }
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

  /* Track today's task completion */
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

  const currentDateRange = useMemo((): string[] => {
    if (useCustom && customStart && customEnd) return getDateRange(0, customStart, customEnd);
    return getDateRange(globalRange);
  }, [globalRange, useCustom, customStart, customEnd]);

  const taskData    = useMemo(() => getTaskHistory(currentDateRange),    [currentDateRange]);
  const hydData     = useMemo(() => getHydrationHistory(currentDateRange),[currentDateRange]);

  const timeStats = useMemo(() => {
    if (currentDateRange.length === 0) return { sleep: 0, busy: 0, free: 0, days: 0 };
    const dowMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let sleep = 0, busy = 0, free = 0;
    currentDateRange.forEach(date => {
      const dow = dowMap[new Date(date + 'T12:00').getDay()];
      const missionMins = metas.flatMap(m => m.missions)
        .filter(mi => mi.scheduledDay === date)
        .reduce((s, mi) => s + (mi.estimatedMinutes || 0), 0);
      const afazerMins = afazeres
        .filter(a => {
          if (a.startDate === date) return true;
          if (a.isRecurrent && a.recurrentDays) {
            return a.recurrentDays.includes(dowMap[new Date(date + 'T12:00').getDay()]);
          }
          return false;
        })
        .reduce((s, a) => {
          if (a.startTime && a.endTime) return s + Math.max(0, toMin(a.endTime) - toMin(a.startTime));
          return s + (a.estimatedMinutes || 0);
        }, 0);
      const sched = getDaySchedule(dow, missionMins + afazerMins);
      sleep += sched.sleepMinutes;
      busy  += sched.busyMinutes;
      free  += sched.freeMinutes;
    });
    return { sleep, busy, free, days: currentDateRange.length };
  }, [currentDateRange, metas, afazeres, getDaySchedule]);

  const metricsData = useMemo(() => {
    const stored: any[] = JSON.parse(localStorage.getItem('lifequest_task_history') || '[]');
    const completed = currentDateRange.reduce((s, d) => s + (stored.find(h => h.date === d)?.completed || 0), 0);
    const missed    = currentDateRange.reduce((s, d) => s + (stored.find(h => h.date === d)?.missed    || 0), 0);
    const total = completed + missed;
    return { completed, missed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0, days: currentDateRange.length };
  }, [currentDateRange]);

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

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    fontSize: '11px',
    boxShadow: '0 8px 24px hsl(224 60% 2% / 0.4)',
  };

  const levelInfo = getLevelFromXP(stats.xp);
  const xpProgress = Math.min(((stats.xp % 1000) / 1000) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ══════════════════════
          AVISO 18H DE INATIVIDADE
      ══════════════════════ */}
      {showInactivityWarning && (
        <div
          className="rounded-xl border border-[#ff4444]/50 bg-[#ff4444]/10 px-4 py-3 flex items-center gap-3 animate-pulse cursor-pointer"
          onClick={dismissInactivityWarning}
        >
          <span className="text-[#ff4444] text-xl flex-shrink-0">⚠️</span>
          <p className="text-sm font-body text-[#ff4444] font-semibold flex-1">
            Você está prestes a perder XP. Conclua uma tarefa agora.
          </p>
          <button className="text-[#ff4444]/60 hover:text-[#ff4444] text-lg leading-none" onClick={dismissInactivityWarning}>✕</button>
        </div>
      )}

      {/* ══════════════════════
          HERO — boas-vindas
      ══════════════════════ */}
      <div className="rounded-2xl border border-primary/14 bg-gradient-to-br from-primary/8 via-card to-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-game-cyan/5 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[10px] font-display tracking-[0.3em] text-primary uppercase mb-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground mb-2">
            Olá, <span className="gradient-text">{levelInfo.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Nível {stats.level} · {stats.xp.toLocaleString()} XP total
            {stats.streak > 0 && ` · 🔥 ${stats.streak} dias de sequência`}
          </p>

          {/* XP progress bar */}
          <div className="max-w-sm">
            <div className="flex justify-between items-center mb-1.5 text-[10px] font-body text-muted-foreground">
              <span>Progresso do nível</span>
              <span className="text-primary">{Math.round(xpProgress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-game-cyan shadow-glow-primary transition-all duration-700 animate-xp-fill"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════
          GLOBAL DATE SELECTOR
      ══════════════════════ */}
      <section className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-display tracking-[0.26em] text-muted-foreground uppercase">
              Período de análise
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[{ label: 'Hoje', val: 1 }, { label: '7 dias', val: 7 }, { label: '14 dias', val: 14 }, { label: '30 dias', val: 30 }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => { setGlobalRange(val); setUseCustom(false); setShowCustomInputs(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border
                  ${!useCustom && globalRange === val
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-primary/25 hover:text-foreground'
                  }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInputs(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all border
                ${useCustom
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/50 text-muted-foreground hover:border-primary/25'
                }`}
            >
              <Sliders className="w-3 h-3" /> Personalizar
            </button>
          </div>

          {showCustomInputs && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date" value={customStart}
                onChange={e => { setCustomStart(e.target.value); if (customEnd) setUseCustom(true); }}
                className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground
                  focus:outline-none focus:border-primary/40 transition-colors"
              />
              <span className="text-[10px] text-muted-foreground">até</span>
              <input
                type="date" value={customEnd} min={customStart}
                onChange={e => { setCustomEnd(e.target.value); if (customStart) setUseCustom(true); }}
                className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground
                  focus:outline-none focus:border-primary/40 transition-colors"
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
        </div>
      </section>

      {/* ══════════════════════
          FRASE MOTIVACIONAL
      ══════════════════════ */}
      <QuoteBar />

      {/* ══════════════════════
          KPI CARDS — métricas
      ══════════════════════ */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: 'Concluídas',
            value: metricsData.completed,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: '#00e879',
            cardClass: 'metric-card-green',
            trend: metricsData.completed > 0 ? '+' : '',
          },
          {
            label: 'Perdidas',
            value: metricsData.missed,
            icon: <Activity className="w-5 h-5" />,
            color: 'hsl(var(--destructive))',
            cardClass: 'metric-card-red',
            trend: '',
          },
          {
            label: 'Taxa de conclusão',
            value: `${metricsData.rate}%`,
            icon: <TrendingUp className="w-5 h-5" />,
            color: metricsData.rate >= 70 ? '#00e879' : metricsData.rate >= 40 ? '#f59e0b' : 'hsl(var(--destructive))',
            cardClass: metricsData.rate >= 70 ? 'metric-card-green' : metricsData.rate >= 40 ? 'metric-card-gold' : 'metric-card-red',
            trend: '',
          },
          {
            label: 'Total de tarefas',
            value: metricsData.total,
            icon: <ListChecks className="w-5 h-5" />,
            color: '#8b5cf6',
            cardClass: 'metric-card-purple',
            trend: '',
          },
        ].map(m => (
          <div key={m.label} className={`${m.cardClass} p-4`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase leading-tight">
                {m.label}
              </p>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${m.color}18`, color: m.color }}>
                {m.icon}
              </div>
            </div>
            <p className="font-display text-2xl sm:text-3xl" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              {metricsData.days} dia{metricsData.days !== 1 ? 's' : ''} analisado{metricsData.days !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </section>

      {/* ══════════════════════
          GRÁFICO TAREFAS + DISTRIBUIÇÃO DE TEMPO
      ══════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Tasks chart */}
        <div className="xl:col-span-8 rounded-2xl border border-border/50 bg-card p-5">
          <SectionHeader
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            title="Tarefas concluídas vs. perdidas"
          />

          {taskData.every(d => d.Concluídas === 0 && d.Perdidas === 0) ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-body">Nenhum dado disponível para o período</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Os dados serão acumulados conforme você usa o app</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="gradConcluidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(152 100% 50%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(152 100% 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPerdidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(0 70% 56%)" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="hsl(0 70% 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <ChartTooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Area
                    type="monotone" dataKey="Concluídas"
                    stroke="hsl(152 100% 50%)" strokeWidth={2}
                    fill="url(#gradConcluidas)"
                    dot={{ fill: 'hsl(152 100% 50%)', r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(152 100% 50%)' }}
                  />
                  <Area
                    type="monotone" dataKey="Perdidas"
                    stroke="hsl(0 70% 56%)" strokeWidth={2}
                    fill="url(#gradPerdidas)"
                    dot={{ fill: 'hsl(0 70% 56%)', r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(0 70% 56%)' }}
                    strokeOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Time distribution */}
        <div className="xl:col-span-4 rounded-2xl border border-border/50 bg-card p-5">
          <SectionHeader
            icon={<Clock className="w-3.5 h-3.5" />}
            title="Distribuição de tempo"
          />

          <div className="space-y-4">
            {[
              { label: 'Sono',         value: timeStats.sleep, icon: <Moon className="w-4 h-4" />,     color: '#a855f7' },
              { label: 'Tempo ocupado',value: timeStats.busy,  icon: <Activity className="w-4 h-4" />, color: '#f59e0b' },
              { label: 'Tempo livre',  value: timeStats.free,  icon: <Sun className="w-4 h-4" />,      color: '#00e879' },
            ].map(item => {
              const total = timeStats.sleep + timeStats.busy + timeStats.free || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2" style={{ color: item.color }}>
                      {item.icon}
                      <span className="text-xs font-body font-semibold text-foreground">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-body font-bold text-foreground">{formatMinutesToHM(item.value)}</span>
                      <span className="text-[10px] text-muted-foreground font-body ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}55` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground font-body mt-5 text-center">
            Média por dia · {timeStats.days} dia{timeStats.days !== 1 ? 's' : ''} analisado{timeStats.days !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* ══════════════════════
          AÇÕES RÁPIDAS
      ══════════════════════ */}
      <section className="rounded-2xl border border-border/50 bg-card p-5">
        <SectionHeader
          icon={<Zap className="w-3.5 h-3.5" />}
          title="Ações Rápidas"
        />
        <QuickActions onNavigate={onNavigate} />
      </section>

      {/* ══════════════════════
          TAREFAS DO DIA
      ══════════════════════ */}
      <section className="rounded-2xl border border-border/50 bg-card p-5">
        <SectionHeader
          icon={<CalendarPlus className="w-3.5 h-3.5" />}
          title={`Tarefas de Hoje · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`}
          action={
            <button
              onClick={() => onNavigate('agenda')}
              className="text-[10px] text-primary font-body inline-flex items-center gap-1 hover:underline"
            >
              Agenda completa <ChevronRight className="w-3 h-3" />
            </button>
          }
        />

        {todayMissions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
              <CalendarPlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-body text-muted-foreground">Nenhuma tarefa agendada para hoje</p>
            <button onClick={() => onNavigate('agenda')} className="mt-3 text-xs text-primary font-body underline">
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
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all
                    ${mi.completedToday
                      ? 'bg-secondary/15 border-border/25 opacity-55'
                      : 'bg-secondary/30 border-border/50 hover:border-primary/25'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${mi.completedToday ? 'bg-primary' : 'bg-primary animate-pulse-glow'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-body font-semibold truncate
                      ${mi.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {mi.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-display tracking-wider text-primary/80">{cat.label}</span>
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
                  {mi.completedToday && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════
          HIDRATAÇÃO + PROGRESSO POR ÁREA
      ══════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Hydration chart */}
        <div className="xl:col-span-6 rounded-2xl border border-border/50 bg-card p-5">
          <SectionHeader
            icon={<Droplets className="w-3.5 h-3.5" />}
            title="Hidratação diária"
          />

          {hydData.every(d => d['Ingestão (ml)'] === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-body">Nenhum dado de hidratação</p>
              <p className="text-[11px] text-muted-foreground font-body mt-1">Registre a água ingerida na aba Hidratação</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hydData} margin={{ top: 5, right: 5, bottom: 5, left: -16 }}>
                  <defs>
                    <linearGradient id="gradHyd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(192 90% 52%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(192 90% 52%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
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
                  <ReferenceLine
                    y={hydData[0]?.meta || 2000} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
                    label={{ value: 'Meta', position: 'right', fontSize: 9, fill: '#f59e0b' }}
                  />
                  <Area
                    type="monotone" dataKey="Ingestão (ml)"
                    stroke="hsl(192 90% 52%)" strokeWidth={2}
                    fill="url(#gradHyd)"
                    dot={{ fill: 'hsl(192 90% 52%)', r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(192 90% 52%)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category progress */}
        <div className="xl:col-span-6 rounded-2xl border border-border/50 bg-card p-5">
          <SectionHeader
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            title="Progresso por área"
          />

          {catProgress.every(c => c.count === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
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
                  'game-blue': '#3b82f6',
                };
                const hex = colorMap[c.color] || '#00e879';
                return (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-body font-semibold text-foreground">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground font-body ml-2">
                          ({c.count} meta{c.count !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <span className="font-display text-sm" style={{ color: hex }}>{c.avg}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${c.avg}%`, backgroundColor: hex, boxShadow: `0 0 8px ${hex}66` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Agenda page
═══════════════════════════════════════════════ */
function AgendaPage({ pendingToken, pendingMode, pendingExpiresIn, onTokenConsumed }: {
  pendingToken?: string | null;
  pendingMode?: 'partial' | 'total' | null;
  pendingExpiresIn?: number | null;
  onTokenConsumed?: () => void;
}) {
  const [gcalOpen, setGcalOpen] = useState(false);
  const [gcalStatus, setGcalStatus] = useState<{ connected: boolean; mode: string | null }>({ connected: false, mode: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [googleCalendarMinutes, setGoogleCalendarMinutes] = useState(0);

  useEffect(() => { checkGcalStatus(); }, []);

  useEffect(() => {
    if (pendingToken) setGcalOpen(true);
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
    <div className="space-y-5 relative animate-fade-in">
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-primary/25 rounded-2xl p-6 max-w-sm mx-4 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg text-foreground mb-2">Agenda Integrada!</h3>
            <p className="text-sm text-muted-foreground font-body">
              Sua conta Google Agenda foi conectada com sucesso.
            </p>
          </div>
        </div>
      )}

      {!gcalStatus.connected ? (
        <div className="rounded-2xl border border-primary/14 bg-primary/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-foreground">Google Agenda</p>
            <p className="text-[11px] text-muted-foreground font-body">Sincronize seus eventos com o Google</p>
          </div>
          <button
            onClick={() => setGcalOpen(true)}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/12 text-primary font-body font-semibold
              hover:bg-primary/22 transition-colors border border-primary/20"
          >
            Integrar
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setGcalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-body
              text-muted-foreground hover:text-foreground transition-colors border border-border/60"
          >
            Reintegrar agenda
          </button>
        </div>
      )}

      <CalendarView onDateSelect={setCalendarSelectedDate} onGoogleMinutesChange={setGoogleCalendarMinutes} />
      <SchedulePanel selectedDate={calendarSelectedDate} googleExtraMinutes={googleCalendarMinutes} />
      <GoogleCalendarDialog
        open={gcalOpen}
        onOpenChange={v => { setGcalOpen(v); if (!v) onTokenConsumed?.(); }}
        onSuccess={handleIntegrationSuccess}
        initialToken={pendingToken}
        initialExpiresIn={pendingExpiresIn}
        initialMode={pendingMode}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Page header
═══════════════════════════════════════════════ */
function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-xl sm:text-2xl gradient-text tracking-wider">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground font-body mt-1">{subtitle}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT — Dashboard shell
═══════════════════════════════════════════════ */
function Dashboard() {
  const { stats } = useGame();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const savedPage = localStorage.getItem('lifequest_current_page') as Page;
    return savedPage || 'dashboard';
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lifequest_theme') !== 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingGcalToken, setPendingGcalToken] = useState<string | null>(null);
  const [pendingGcalMode, setPendingGcalMode] = useState<'partial' | 'total' | null>(null);
  const [pendingGcalExpiresIn, setPendingGcalExpiresIn] = useState<number | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const mode = sessionStorage.getItem('gcal_pending_mode') as 'partial' | 'total' | null;
      if (token) {
        window.history.replaceState(null, '', window.location.pathname);
        sessionStorage.removeItem('gcal_pending_mode');
        setPendingGcalToken(token);
        setPendingGcalMode(mode || 'partial');
        setPendingGcalExpiresIn(expiresIn ? parseInt(expiresIn) : 3600);
        setCurrentPage('agenda');
      }
    }
  }, []);

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
  const activeMetas    = metas.filter(m => !m.completed);
  const completedMetas = metas.filter(m =>  m.completed);

  const pageTitle: Record<Page, string> = {
    dashboard: 'Início', metas: 'Metas', afazeres: 'Afazeres',
    agenda: 'Agenda', missao: 'Missão Semanal', progressao: 'Progressão',
    financeiro: 'Financeiro', hidratacao: 'Hidratação',
    anotacoes: 'Anotações', duelo: 'Duelos',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome onNavigate={setCurrentPage} />;

      case 'metas':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Gerenciar Metas" />
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
              <div className="space-y-3 opacity-55">
                <h2 className="font-display text-[10px] tracking-[0.28em] text-muted-foreground uppercase">Concluídas</h2>
                {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
              </div>
            )}
          </div>
        );

      case 'afazeres':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Afazeres" subtitle="Tarefas avulsas ou recorrentes do dia a dia." />
            <AfazeresPanel />
          </div>
        );

      case 'agenda':
        return (
          <AgendaPage
            pendingToken={pendingGcalToken}
            pendingMode={pendingGcalMode}
            pendingExpiresIn={pendingGcalExpiresIn}
            onTokenConsumed={() => { setPendingGcalToken(null); setPendingGcalMode(null); setPendingGcalExpiresIn(null); }}
          />
        );

      case 'missao':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Missão Semanal" subtitle="Toda semana você recebe uma missão de ajudar alguém." />
            <WeeklyMission />
          </div>
        );

      case 'progressao':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Progressão & Níveis" subtitle="Cada nível representa quem você está se tornando." />
            <LevelProgression />
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Financeiro" />
            <FinancePanel />
          </div>
        );

      case 'hidratacao':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Hidratação" />
            <HydrationPanel />
          </div>
        );

      case 'anotacoes':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Anotações" subtitle="Registre pensamentos, aprendizados e reflexões." />
            <NotesPanel />
          </div>
        );

      case 'duelo':
        return (
          <div className="space-y-5 animate-fade-in">
            <PageTitle title="Duelos" />
            <DueloPanel />
          </div>
        );
    }
  };

  const sidebarW = sidebarCollapsed ? 'lg:pl-[64px]' : 'lg:pl-64';

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Atmospheric background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full -top-40 -left-40 bg-primary/5 blur-[100px]" />
        <div className="absolute w-[400px] h-[400px] rounded-full top-1/3 -right-40 bg-game-cyan/4 blur-[80px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full -bottom-20 left-1/3 bg-personal-purple/4 blur-[80px]" />
      </div>

      {/* Desktop sidebar */}
      <DesktopSidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(d => !d)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
      />

      {/* Main content wrapper */}
      <div className={`relative z-10 flex flex-col min-h-screen transition-all duration-300 ${sidebarW}`}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="px-4 md:px-6 max-w-[1800px] mx-auto">
            <div className="flex items-center gap-4 py-3.5">

              {/* Brand — only on mobile */}
              <div className="flex items-center gap-2.5 lg:hidden flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-game-cyan flex items-center justify-center shadow-glow-primary animate-glow-pulse">
                  <Zap className="w-4 h-4 text-black" strokeWidth={3} />
                </div>
              </div>

              {/* Page title */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs tracking-[0.3em] gradient-text uppercase font-bold leading-none truncate">
                  {pageTitle[currentPage]}
                </p>
              </div>

              {/* XP bar — desktop */}
              <div className="hidden lg:flex flex-1 max-w-xs items-center gap-3">
                <span className="text-[10px] font-body text-muted-foreground flex-shrink-0 font-semibold">
                  Nv.{stats.level}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-game-cyan shadow-glow-primary transition-all duration-700"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-body text-muted-foreground flex-shrink-0">
                  {stats.xp.toLocaleString()} XP
                </span>
              </div>

              {/* Right indicators */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {stats.streak > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-orange-500/22 bg-orange-500/8 px-2.5 py-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs font-body text-orange-400 font-semibold">{stats.streak}d</span>
                  </div>
                )}
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-primary/18 bg-primary/6 px-2.5 py-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-body text-primary font-semibold">Nível {stats.level}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 px-4 md:px-6 py-6 pb-28 lg:pb-8">
          <div className="max-w-[1800px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(d => !d)}
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
