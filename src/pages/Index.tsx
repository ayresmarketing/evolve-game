import { useState } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { ScheduleProvider } from '@/contexts/ScheduleContext';
import { Sidebar } from '@/components/game/Sidebar';
import { ProfileBanner } from '@/components/game/ProfileBanner';
import { QuoteBar } from '@/components/game/QuoteBar';
import { MetaCard } from '@/components/game/MetaCard';
import { CreateMetaDialog } from '@/components/game/CreateMetaDialog';
import { CategoryOverview } from '@/components/game/CategoryOverview';
import { SchedulePanel } from '@/components/game/SchedulePanel';
import { LifeGoals } from '@/components/game/LifeGoals';
import { WeeklyMission } from '@/components/game/WeeklyMission';
import { RightPanel } from '@/components/game/RightPanel';
import { TaskStatsChart } from '@/components/game/TaskStatsChart';

type Page = 'dashboard' | 'metas' | 'agenda' | 'vida' | 'missao';

function Dashboard() {
  const { metas } = useGame();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const activeMetas = metas.filter(m => !m.completed);
  const completedMetas = metas.filter(m => m.completed);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <p className="text-sm text-muted-foreground font-body">Olá, Jogador</p>
              <h1 className="font-display text-xl tracking-wider text-foreground">Dashboard</h1>
            </div>

            <QuoteBar />

            {/* Main grid: Stats + Tasks chart */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3">
                <ProfileBanner />
              </div>
              <div className="lg:col-span-2">
                <TaskStatsChart />
              </div>
            </div>

            <CategoryOverview />

            {/* Active Metas */}
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
                  {completedMetas.map(meta => (
                    <MetaCard key={meta.id} meta={meta} />
                  ))}
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

      case 'agenda':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Agenda & Sono</h1>
            <SchedulePanel />
          </div>
        );

      case 'vida':
        return (
          <div className="space-y-5">
            <h1 className="font-display text-xl tracking-wider text-foreground">Metas de Vida</h1>
            <p className="text-sm text-muted-foreground font-body">
              Defina seus objetivos a longo prazo. Metas conectadas ganham 1.5x XP!
            </p>
            <LifeGoals />
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
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-5 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto lg:mx-0">
          {renderPage()}
        </div>
      </main>

      {/* Right Panel */}
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
