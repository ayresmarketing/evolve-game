import { useState, useEffect, useMemo } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ScheduleProvider, useSchedule } from '@/contexts/ScheduleContext';
import { Sidebar, Page } from '@/components/game/Sidebar';
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
import { getStreakMultiplier, CATEGORY_CONFIG, CATEGORY_BG, DayOfWeek } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { Clock, CalendarPlus, Zap } from 'lucide-react';

function UpcomingTasks() {
  const { metas } = useGame();
  const todayStr = new Date().toISOString().split('T')[0];

  // Get next 3 scheduled tasks sorted by date+time
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
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase flex items-center gap-2">
        <CalendarPlus className="w-3.5 h-3.5 text-primary" /> Próximas Tarefas na Agenda
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {upcoming.map(task => {
          const cat = CATEGORY_CONFIG[task.category];
          return (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border">
              <div className={`w-1.5 h-10 rounded-full ${CATEGORY_BG[cat.color]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-foreground truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
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

function Dashboard() {
  const { metas, stats } = useGame();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('lifequest_theme');
    return saved !== 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode);
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
            <div>
              <p className="text-sm text-muted-foreground font-body">Olá, Jogador</p>
              <h1 className="font-display text-xl tracking-wider text-foreground">Dashboard</h1>
              {streakMult > 1 && (
                <p className="text-xs text-game-fire font-body mt-1">
                  🔥 Bônus de consistência ativo: +{Math.round((streakMult - 1) * 100)}% XP ({stats.streak} dias)
                </p>
              )}
            </div>

            {/* Upcoming tasks at top */}
            <UpcomingTasks />

            <QuoteBar />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3">
                <ProfileBanner />
              </div>
              <div className="lg:col-span-2">
                <TaskStatsChart />
              </div>
            </div>

            <EvolutionTimeline />

            <CategoryOverview />

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
            <h1 className="font-display text-xl tracking-wider text-foreground">Gerenciar Metas</h1>
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
            <h1 className="font-display text-xl tracking-wider text-foreground">Afazeres</h1>
            <p className="text-sm text-muted-foreground font-body">
              Tarefas avulsas ou recorrentes do dia a dia. Conecte a uma meta para ganhar mais XP!
            </p>
            <AfazeresPanel />
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Agenda</h1>
            <CalendarView />
            <SchedulePanel />
          </div>
        );

      case 'missao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Missão Semanal</h1>
            <p className="text-sm text-muted-foreground font-body">
              Toda semana você recebe uma missão de ajudar alguém. Evolução real inclui impactar vidas.
            </p>
            <WeeklyMission />
          </div>
        );

      case 'progressao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Progressão & Níveis</h1>
            <p className="text-sm text-muted-foreground font-body">
              Cada nível representa quem você está se tornando. Não é apenas XP — é transformação.
            </p>
            <LevelProgression />
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Ranking</h1>
            <p className="text-sm text-muted-foreground font-body">
              Seu progresso e conquistas acumuladas ao longo da jornada.
            </p>
            <RankingPanel />
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground font-body">
              Acompanhe suas receitas, despesas e mantenha o controle financeiro.
            </p>
            <FinancePanel />
          </div>
        );

      case 'hidratacao':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Hidratação</h1>
            <p className="text-sm text-muted-foreground font-body">
              Mantenha-se hidratado! Registre seu consumo de água e acompanhe sua consistência.
            </p>
            <HydrationPanel />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
      <main className="flex-1 min-w-0 p-5 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto lg:mx-0">
          {renderPage()}
        </div>
      </main>
      <aside className="hidden xl:block w-[280px] min-h-screen p-4 border-l border-border overflow-y-auto shrink-0">
        <RightPanel />
      </aside>
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
