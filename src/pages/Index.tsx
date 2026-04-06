import { useState, useEffect, useMemo } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { BottomNav, Page } from '@/components/game/Sidebar';
import { ProfileBanner } from '@/components/game/ProfileBanner';
import { QuoteBar } from '@/components/game/QuoteBar';
import { MetaCard } from '@/components/game/MetaCard';
import { CreateMetaDialog } from '@/components/game/CreateMetaDialog';
import { CategoryOverview } from '@/components/game/CategoryOverview';
import { SchedulePanel } from '@/components/game/SchedulePanel';
import { WeeklyMission } from '@/components/game/WeeklyMission';
import { TaskStatsChart } from '@/components/game/TaskStatsChart';
import { LevelProgression } from '@/components/game/LevelProgression';
import { AfazeresPanel } from '@/components/game/AfazeresPanel';
import { CalendarView } from '@/components/game/CalendarView';
import { EvolutionTimeline } from '@/components/game/EvolutionTimeline';
import { FinancePanel } from '@/components/game/FinancePanel';
import { HydrationPanel } from '@/components/game/HydrationPanel';
import { NotesPanel } from '@/components/game/NotesPanel';
import { HydrationMini } from '@/components/game/HydrationMini';
import { DueloPanel } from '@/components/game/DueloPanel';
import { RecurringTasksChart } from '@/components/game/RecurringTasksChart';
import { RightPanel } from '@/components/game/RightPanel';
import { getStreakMultiplier, getLevelFromXP, CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import {
  Clock, CalendarPlus, Zap, Target, ListChecks, Calendar,
  Activity, Trophy, ChevronRight, Flame,
  CheckCircle2, Star, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────
   KPI Tile — new design, completely different from old tiles
───────────────────────────────────────────────────────── */
function KpiTile({
  label, value, accent, icon, sub
}: {
  label: string; value: string; accent: string; icon: React.ReactNode; sub?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 border relative overflow-hidden bg-[hsl(var(--card))]"
      style={{ borderColor: `${accent}22` }}
    >
      {/* Corner accent glow */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: accent }}
      />
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
        style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
      >
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-display tracking-[0.22em] text-muted-foreground uppercase">{label}</p>
        <p className="font-display text-2xl text-foreground mt-0.5" style={{ color: accent }}>{value}</p>
        {sub && <p className="text-[10px] font-body text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Upcoming Tasks — compact mission feed
───────────────────────────────────────────────────────── */
function UpcomingTasks() {
  const { metas } = useGame();
  const todayStr = new Date().toISOString().split('T')[0];

  const upcoming = useMemo(() => {
    return metas.flatMap(m => m.missions
      .filter(mi => !mi.completedToday && mi.scheduledDay && mi.scheduledDay >= todayStr)
      .map(mi => ({ ...mi, metaTitle: m.title, category: m.category }))
    ).sort((a, b) => {
      const da = `${a.scheduledDay}${a.scheduledTime || ''}`;
      const db = `${b.scheduledDay}${b.scheduledTime || ''}`;
      return da.localeCompare(db);
    }).slice(0, 4);
  }, [metas, todayStr]);

  if (upcoming.length === 0) return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
      <CalendarPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
      <p className="text-[11px] text-muted-foreground font-body">Nenhuma tarefa agendada</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <h3 className="font-display text-[10px] tracking-[0.24em] text-muted-foreground uppercase flex items-center gap-2 mb-3">
        <CalendarPlus className="w-3.5 h-3.5 text-primary" /> Agenda
      </h3>
      <div className="space-y-2">
        {upcoming.map(task => {
          const cat = CATEGORY_CONFIG[task.category];
          return (
            <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/40">
              <div className={`w-1 h-7 rounded-full flex-shrink-0 ${CATEGORY_BG[cat.color]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-semibold text-foreground truncate">{task.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {task.scheduledDay && (
                    <span className="text-[9px] text-muted-foreground font-body">
                      {new Date(task.scheduledDay + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                  {task.scheduledTime && (
                    <span className="text-[9px] text-muted-foreground font-body">{task.scheduledTime}</span>
                  )}
                  {task.estimatedMinutes && (
                    <span className="text-[9px] text-muted-foreground font-body flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{formatMinutesToHM(task.estimatedMinutes)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Quick Actions — vertical stack layout (was grid)
───────────────────────────────────────────────────────── */
function QuickActions({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const actions = [
    {
      label: 'Nova Meta',
      desc: 'Criar objetivo com IA',
      icon: <Target className="w-4 h-4" />,
      color: '#0280FF',
      component: 'meta' as const,
    },
    {
      label: 'Novo Afazer',
      desc: 'Tarefa avulsa rápida',
      icon: <ListChecks className="w-4 h-4" />,
      color: '#f97316',
      page: 'afazeres' as Page,
    },
    {
      label: 'Planejar Agenda',
      desc: 'Organizar calendário',
      icon: <Calendar className="w-4 h-4" />,
      color: '#a855f7',
      page: 'agenda' as Page,
    },
  ];

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <h3 className="font-display text-[10px] tracking-[0.24em] text-muted-foreground uppercase mb-3">
        Ações Rápidas
      </h3>
      <div className="space-y-2">
        {actions.map(a => {
          const inner = (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${a.color}18`, color: a.color }}
              >
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-semibold text-foreground">{a.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{a.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          );

          if (a.component === 'meta') {
            return (
              <CreateMetaDialog key={a.label} triggerElement={inner} />
            );
          }
          return (
            <div key={a.label} onClick={() => onNavigate(a.page!)}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Future Projection (for Metas page)
───────────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════
   DASHBOARD — main shell
═══════════════════════════════════════════════════════════ */
function Dashboard() {
  const { metas, stats } = useGame();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('lifequest_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('lifequest_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const activeMetas = metas.filter(m => !m.completed);
  const completedMetas = metas.filter(m => m.completed);
  const streakMult = getStreakMultiplier(stats.streak);
  const levelInfo = getLevelFromXP(stats.xp);

  /* XP bar progress (simple linear within current level range) */
  const xpProgress = Math.min(((stats.xp % 1000) / 1000) * 100, 100);

  /* ────────────────── NEW DashboardHome ────────────────── */
  const DashboardHome = () => (
    <div className="space-y-5">

      {/* ── 1. COMMANDER BANNER ─────────────────────────────
          Full-width hero with player identity + XP bar.
          STRUCTURAL DIFFERENCE: replaces 3-panel info row
          + hero card combo with a single unified command strip.
      ─────────────────────────────────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden border p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(222 45% 10%) 100%)',
          borderColor: 'hsl(var(--primary) / 0.22)'
        }}
      >
        {/* Background atmospheric blobs */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-8 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">

          {/* Left: identity */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-display tracking-[0.32em] text-primary uppercase">
                Command Center
              </span>
              {streakMult > 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-body text-orange-400 bg-orange-500/12 border border-orange-500/20 rounded-lg px-2 py-0.5">
                  <Flame className="w-3 h-3" />
                  +{Math.round((streakMult - 1) * 100)}% XP
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-wider">
              {levelInfo.icon} {levelInfo.name}
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Center: live counters */}
          <div className="flex items-center gap-5 md:gap-8">
            <div className="text-center">
              <p className="font-display text-2xl text-primary">{activeMetas.length}</p>
              <p className="text-[10px] text-muted-foreground font-body tracking-wide uppercase">Metas</p>
            </div>
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div className="text-center">
              <p className="font-display text-2xl text-orange-400">{stats.streak}</p>
              <p className="text-[10px] text-muted-foreground font-body tracking-wide uppercase">Streak</p>
            </div>
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div className="text-center">
              <p className="font-display text-2xl text-green-400">{stats.totalMissionsCompleted}</p>
              <p className="text-[10px] text-muted-foreground font-body tracking-wide uppercase">Missões</p>
            </div>
          </div>

          {/* Right: level badge */}
          <div className="hidden xl:flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xl">
              {levelInfo.icon}
            </div>
            <div>
              <p className="text-[9px] font-display tracking-[0.2em] text-primary uppercase">Nível Atual</p>
              <p className="font-display text-sm text-foreground">{stats.level} · {levelInfo.name}</p>
            </div>
          </div>
        </div>

        {/* XP Progress bar — full width at bottom */}
        <div className="relative z-10 mt-6 pt-5 border-t border-border/40">
          <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-2">
            <span>{stats.xp.toLocaleString()} XP acumulados</span>
            <span>Nível {stats.level + 1} →</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_12px_hsl(var(--primary)/0.5)] transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 2. KPI STRIP ─────────────────────────────────────
          5 tiles (was 4), new icons, new accent colors,
          new layout with sub-label, different visual treatment.
      ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3" aria-label="Indicadores principais">
        <KpiTile label="XP Total" value={stats.xp.toLocaleString()} accent="#0280FF" icon={<Zap className="w-4 h-4" />} sub="pontos de experiência" />
        <KpiTile label="Nível" value={String(stats.level)} accent="#a855f7" icon={<Trophy className="w-4 h-4" />} sub={levelInfo.name} />
        <KpiTile label="Sequência" value={`${stats.streak}d`} accent="#f97316" icon={<Flame className="w-4 h-4" />} sub={streakMult > 1 ? `×${streakMult} XP` : 'Continue assim'} />
        <KpiTile label="Missões" value={String(stats.totalMissionsCompleted)} accent="#22c55e" icon={<CheckCircle2 className="w-4 h-4" />} sub="concluídas no total" />
        <KpiTile label="Metas" value={String(stats.totalMetasCompleted)} accent="#eab308" icon={<Star className="w-4 h-4" />} sub={`${activeMetas.length} ativas`} />
      </section>

      {/* ── 3. ANALYTICS ZONE ────────────────────────────────
          Layout: 5 + 4 + 3 (was 7 center + 3 right panel)
          • Col A (5): Main chart (TaskStatsChart)
          • Col B (4): Quick actions + upcoming tasks
          • Col C (3): Hydration + ProfileBanner
      ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4" aria-label="Zona analítica">
        <div className="xl:col-span-5">
          <TaskStatsChart />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <QuickActions onNavigate={setCurrentPage} />
          <UpcomingTasks />
        </div>
        <div className="xl:col-span-3 space-y-4">
          <HydrationMini />
          <ProfileBanner />
        </div>
      </section>

      {/* ── 4. INTELLIGENCE ZONE ─────────────────────────────
          Layout: 7 + 5 (content order swapped from analytics)
          • Col A (7): Recurring chart + Quote
          • Col B (5): Category overview
          STRUCTURAL DIFFERENCE: CategoryOverview moved to
          right column (was in center main column)
      ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4" aria-label="Zona inteligência">
        <div className="xl:col-span-7 space-y-4">
          <RecurringTasksChart />
          <QuoteBar />
        </div>
        <div className="xl:col-span-5">
          <CategoryOverview />
        </div>
      </section>

      {/* ── 5. OPERATIONS ZONE — Active + Completed Metas ─── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5" aria-label="Zona operacional — metas">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[10px] tracking-[0.28em] text-muted-foreground uppercase flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              Metas Ativas
              <span className="text-primary font-body text-xs">({activeMetas.length})</span>
            </h2>
            <button
              onClick={() => setCurrentPage('metas')}
              className="text-[10px] text-primary font-body inline-flex items-center gap-1 hover:underline"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <CreateMetaDialog />
          {activeMetas.map(meta => (
            <MetaCard key={meta.id} meta={meta} />
          ))}
        </div>

        <div className="xl:col-span-4 space-y-4">
          {/* Stats at-a-glance card */}
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <h3 className="font-display text-[10px] tracking-[0.24em] text-muted-foreground uppercase mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-primary" /> Resumo
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Maior sequência', value: `${stats.longestStreak} dias`, color: 'text-orange-400' },
                { label: 'Dias de uso', value: `${stats.daysUsed} dias`, color: 'text-primary' },
                { label: 'Metas concluídas', value: String(stats.totalMetasCompleted), color: 'text-green-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/25 border border-border/40">
                  <span className="text-[11px] text-muted-foreground font-body">{row.label}</span>
                  <span className={`text-xs font-body font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel with time breakdown + missions */}
          <RightPanel />

          {/* Completed metas (compact) */}
          {completedMetas.length > 0 && (
            <div>
              <h3 className="font-display text-[10px] tracking-[0.28em] text-muted-foreground uppercase mb-3">
                🏆 Concluídas ({completedMetas.length})
              </h3>
              <div className="space-y-3 opacity-65">
                {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. EVOLUTION TIMELINE — full width ─────────────── */}
      <section className="w-full">
        <EvolutionTimeline />
      </section>
    </div>
  );

  /* ────────────────── Page title map ─────────────────── */
  const pageTitle: Record<Page, string> = {
    dashboard: 'Command Center',
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

  /* ────────────────── Page renderer ─────────────────── */
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;

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
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Agenda</h1>
            <div className="section-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-body font-semibold text-foreground">Google Calendar</p>
                <p className="text-[11px] text-muted-foreground font-body">Sincronize sua agenda com o Google</p>
              </div>
              <button
                onClick={() => toast.info('Para integrar o Google Calendar, conecte o sistema a um banco de dados primeiro (Lovable Cloud).')}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body font-semibold hover:bg-primary/20 transition-colors"
              >
                Conectar
              </button>
            </div>
            <CalendarView />
            <SchedulePanel />
          </div>
        );

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
              Cada nível representa quem você está se tornando. Você só avança quando o nível anterior estiver completo.
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

  /* ────────────────── RENDER ─────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-hero pb-24 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.14),transparent_40%),radial-gradient(circle_at_100%_15%,hsl(var(--personal-purple)/0.10),transparent_40%)] pointer-events-none" />

      {/* ── HEADER — redesigned: XP bar inline, cleaner layout ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-4 md:px-6">
          <div className="max-w-[1800px] mx-auto flex items-center gap-3 md:gap-4 py-3">

            {/* Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-blue-400 flex items-center justify-center shadow-[0_0_16px_hsl(var(--primary)/0.45)] ring-1 ring-primary/40">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-display text-[9px] md:text-[10px] tracking-[0.28em] text-primary uppercase">LIFEQUEST</span>
                <span className="text-[10px] md:text-[11px] font-body text-muted-foreground">
                  {pageTitle[currentPage]}
                </span>
              </div>
            </div>

            {/* Center: inline XP progress bar (desktop only) */}
            <div className="hidden lg:flex flex-1 items-center gap-3 px-4">
              <span className="text-[10px] font-body text-muted-foreground flex-shrink-0">
                Nv.{stats.level}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_8px_hsl(var(--primary)/0.4)] transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-body text-muted-foreground flex-shrink-0">
                {stats.xp.toLocaleString()} XP
              </span>
            </div>

            {/* Right: streak + level display + avatar */}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(234,179,8,0.35)] ring-2 ring-yellow-500/25">
                {levelInfo.icon}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 px-4 md:px-6 py-5">
        <div className="max-w-[1800px] mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Bottom navigation — always preserved */}
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
