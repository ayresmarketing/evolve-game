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
import { RightPanel } from '@/components/game/RightPanel';
import { TaskStatsChart } from '@/components/game/TaskStatsChart';
import { LevelProgression } from '@/components/game/LevelProgression';
import { AfazeresPanel } from '@/components/game/AfazeresPanel';
import { CalendarView } from '@/components/game/CalendarView';
import { RankingPanel } from '@/components/game/RankingPanel';
import { EvolutionTimeline } from '@/components/game/EvolutionTimeline';
import { FinancePanel } from '@/components/game/FinancePanel';
import { HydrationPanel } from '@/components/game/HydrationPanel';
import { NotesPanel } from '@/components/game/NotesPanel';
import { HydrationMini } from '@/components/game/HydrationMini';
import { DueloPanel } from '@/components/game/DueloPanel';
import { getStreakMultiplier, getLevelFromXP, CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { Clock, CalendarPlus, Zap, Target, ListChecks, Calendar } from 'lucide-react';
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
    <div className="section-card animate-slide-up">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase flex items-center gap-2">
        <CalendarPlus className="w-3.5 h-3.5 text-primary" /> Próximas Tarefas
      </h3>
      <div className="space-y-2">
        {upcoming.map(task => {
          const cat = CATEGORY_CONFIG[task.category];
          return (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
              <div className={`w-1 h-8 rounded-full ${CATEGORY_BG[cat.color]}`} />
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 animate-slide-up">
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-body">Olá, Jogador 👋</p>
                <h1 className="font-display text-lg tracking-wider text-foreground">Dashboard</h1>
                {streakMult > 1 && (
                  <p className="text-xs text-game-fire font-body mt-0.5">
                    🔥 Bônus de consistência: +{Math.round((streakMult - 1) * 100)}% XP
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="font-display text-xs text-primary">{stats.xp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>

            {/* 1. Quote */}
            <QuoteBar />

            {/* 2. Upcoming tasks */}
            <UpcomingTasks />

            {/* 3. Quick actions */}
            <QuickActions onNavigate={setCurrentPage} />

            {/* 3. Task progress + Hydration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TaskStatsChart />
              <HydrationMini />
            </div>

            {/* 4. Profile overview */}
            <ProfileBanner />

            {/* 5. Category overview */}
            <CategoryOverview />

            {/* 6. Evolution */}
            <EvolutionTimeline />

            {/* Active metas */}
            <section>
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
              <section>
                <h2 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🏆 Metas Concluídas ({completedMetas.length})</h2>
                <div className="space-y-3 opacity-60">
                  {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
                </div>
              </section>
            )}
          </div>
        );

      case 'metas':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Gerenciar Metas</h1>
            <CreateMetaDialog />
            <CategoryOverview />
            <div className="space-y-4">
              {activeMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
            </div>
            {completedMetas.length > 0 && (
              <div className="space-y-3 opacity-60">
                <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Concluídas</h3>
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
            {/* Google Calendar integration */}
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
              Cada nível representa quem você está se tornando.
            </p>
            <LevelProgression />
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-lg tracking-wider text-foreground">Ranking</h1>
            <RankingPanel />
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
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top header bar */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow-cyan">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-[10px] tracking-[0.18em] text-primary font-bold">LIFE QUEST</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-body text-muted-foreground">Nível {stats.level}</p>
              <p className="text-xs font-display text-foreground font-bold">{stats.xp.toLocaleString()} XP</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm ring-2 ring-primary/20">
              {getLevelFromXP(stats.xp).icon}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-5 max-w-2xl mx-auto">
        {renderPage()}
      </main>

      {/* Bottom navigation */}
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
