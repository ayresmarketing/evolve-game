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
import { Clock, CalendarPlus, Zap, Target, ListChecks, Calendar, Activity, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
    }).slice(0, 3);
  }, [metas, todayStr]);

  if (upcoming.length === 0) return null;

  return (
    <section className="section-card animate-slide-up" aria-label="Próximas tarefas agendadas">
      <h2 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase flex items-center gap-2">
        <CalendarPlus className="w-3.5 h-3.5 text-primary" /> Próximas Tarefas
      </h2>
      <div className="space-y-2">
        {upcoming.map(task => {
          const cat = CATEGORY_CONFIG[task.category];
          return (
            <article key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
              <div className={`w-1 h-8 rounded-full ${CATEGORY_BG[cat.color]}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-foreground truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {task.scheduledDay && (
                    <span className="text-[10px] text-muted-foreground font-body">
                      📅 {new Date(task.scheduledDay + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                  {task.scheduledTime && <span className="text-[10px] text-muted-foreground font-body">🕐 {task.scheduledTime}</span>}
                  {task.estimatedMinutes && (
                    <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {formatMinutesToHM(task.estimatedMinutes)}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <nav className="grid grid-cols-3 gap-2 animate-slide-up" aria-label="Ações rápidas">
      <CreateMetaDialog triggerElement={
        <button className="section-card flex flex-col items-center gap-2 py-3 hover:border-primary/30 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-body font-semibold text-foreground">Adicionar Meta</span>
        </button>
      } />
      <button onClick={() => onNavigate('afazeres')} className="section-card flex flex-col items-center gap-2 py-3 hover:border-primary/30 transition-all group">
        <div className="w-9 h-9 rounded-xl bg-game-orange/10 flex items-center justify-center group-hover:bg-game-orange/20 transition-colors">
          <ListChecks className="w-4 h-4 text-game-orange" />
        </div>
        <span className="text-[10px] font-body font-semibold text-foreground">Adicionar Afazer</span>
      </button>
      <button onClick={() => onNavigate('agenda')} className="section-card flex flex-col items-center gap-2 py-3 hover:border-primary/30 transition-all group">
        <div className="w-9 h-9 rounded-xl bg-game-blue/10 flex items-center justify-center group-hover:bg-game-blue/20 transition-colors">
          <Calendar className="w-4 h-4 text-game-blue" />
        </div>
        <span className="text-[10px] font-body font-semibold text-foreground">Ir para Agenda</span>
      </button>
    </nav>
  );
}

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

  const DashboardHome = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      <div className="xl:col-span-8 space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 p-6 md:p-7 shadow-glow-cyan bg-[linear-gradient(130deg,hsl(var(--primary)/0.24),hsl(228_90%_12%/0.95)_45%,hsl(228_80%_8%/0.95))]">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-primary-foreground/80 font-display">Painel Premium</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-display text-primary-foreground tracking-[0.08em]">LIFEQUEST COMMAND</h1>
              <p className="mt-2 text-sm text-primary-foreground/85 font-body max-w-xl">
                Operação diária com métricas, progresso visual e ações rápidas para evoluir sem fricção.
              </p>
              {streakMult > 1 && (
                <p className="mt-2 text-xs font-body text-game-gold">
                  🔥 Combo ativo: +{Math.round((streakMult - 1) * 100)}% XP por consistência
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[360px]">
              <div className="rounded-2xl border border-white/20 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">XP</p>
                <p className="text-xl font-display text-primary-foreground">{stats.xp.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">Nível</p>
                <p className="text-xl font-display text-primary-foreground">{stats.level}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">Streak</p>
                <p className="text-xl font-display text-primary-foreground">{stats.streak}d</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="section-card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Total de Missões</p>
            <p className="mt-2 text-2xl font-display text-foreground">{stats.totalMissionsCompleted}</p>
          </div>
          <div className="section-card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Melhor Sequência</p>
            <p className="mt-2 text-2xl font-display text-game-fire">{stats.longestStreak}d</p>
          </div>
          <div className="section-card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Metas Concluídas</p>
            <p className="mt-2 text-2xl font-display text-game-green">{stats.totalMetasCompleted}</p>
          </div>
          <div className="section-card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dias de Uso</p>
            <p className="mt-2 text-2xl font-display text-primary">{stats.daysUsed}</p>
          </div>
        </section>

        <QuickActions onNavigate={setCurrentPage} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaskStatsChart />
          <HydrationMini />
        </div>
        <RecurringTasksChart />
        <QuoteBar />
        <UpcomingTasks />
        <CategoryOverview />
      </div>

      <aside className="xl:col-span-4 space-y-4">
        <RightPanel />
        <ProfileBanner />
        <EvolutionTimeline />
      </aside>

      <section className="xl:col-span-8" aria-label="Metas ativas">
        <h2 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
          🎯 Metas Ativas
          <span className="text-primary font-body text-xs">({activeMetas.length})</span>
        </h2>
        <div className="space-y-4">
          <CreateMetaDialog />
          {activeMetas.map(meta => (
            <MetaCard key={meta.id} meta={meta} />
          ))}
        </div>
      </section>

      {completedMetas.length > 0 && (
        <section className="xl:col-span-4" aria-label="Metas concluídas">
          <h2 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🏆 Metas Concluídas ({completedMetas.length})</h2>
          <div className="space-y-3 opacity-70">
            {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
          </div>
        </section>
      )}
    </div>
  );

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
            <p className="text-sm text-muted-foreground font-body">
              Tarefas avulsas ou recorrentes do dia a dia.
            </p>
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
            <p className="text-sm text-muted-foreground font-body">
              Toda semana você recebe uma missão de ajudar alguém.
            </p>
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
            <p className="text-sm text-muted-foreground font-body">
              Registre pensamentos, aprendizados e reflexões.
            </p>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_100%_10%,hsl(var(--personal-purple)/0.14),transparent_35%)] pointer-events-none" />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="px-4 md:px-6">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between py-3">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-game-cyan flex items-center justify-center shadow-glow-cyan ring-1 ring-primary/50">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[9px] md:text-[10px] tracking-[0.28em] text-primary uppercase">
                  LIFEQUEST PREMIUM UI
                </span>
                <span className="text-[11px] md:text-xs font-body text-muted-foreground">
                  {pageTitle[currentPage]} • produtividade gamificada
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-body text-muted-foreground">Nível {stats.level}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2">
                <Trophy className="w-4 h-4 text-game-gold" />
                <span className="text-xs font-body text-muted-foreground">{stats.xp.toLocaleString()} XP</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-gold flex items-center justify-center text-sm shadow-glow-gold ring-2 ring-game-gold/30">
                {getLevelFromXP(stats.xp).icon}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 md:px-6 py-5">
        <div className="max-w-[1700px] mx-auto space-y-5">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="section-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Modo</p>
                <p className="font-display text-base text-foreground">Visual Premium</p>
              </div>
            </div>
            <div className="section-card p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Data</p>
              <p className="font-display text-base text-foreground mt-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div className="section-card p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Status</p>
              <p className="font-display text-base text-game-green mt-1">Sistema online</p>
            </div>
          </section>

          {renderPage()}
        </div>
      </main>

      {/* Bottom navigation sempre visível e centralizado */}
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
