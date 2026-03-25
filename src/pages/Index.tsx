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
          <div className="space-y-6">
            <QuoteBar />
            <ProfileBanner />
            <CategoryOverview />

            {/* Active Metas */}
            <section>
              <h2 className="font-display text-sm tracking-widest text-foreground mb-4 flex items-center gap-2">
                🎯 METAS ATIVAS
                <span className="text-muted-foreground text-xs font-body">({activeMetas.length})</span>
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
                <h2 className="font-display text-sm tracking-widest text-muted-foreground mb-4">🏆 METAS CONCLUÍDAS ({completedMetas.length})</h2>
                <div className="space-y-3 opacity-70">
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
          <div className="space-y-6">
            <h2 className="font-display text-sm tracking-widest text-game-gold flex items-center gap-2">🎯 GERENCIAR METAS</h2>
            <CreateMetaDialog />
            <CategoryOverview />
            <div className="space-y-4">
              {activeMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
            </div>
            {completedMetas.length > 0 && (
              <div className="space-y-3 opacity-70">
                <h3 className="font-display text-xs tracking-widest text-muted-foreground">CONCLUÍDAS</h3>
                {completedMetas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
              </div>
            )}
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm tracking-widest text-game-gold flex items-center gap-2">📅 AGENDA & SONO</h2>
            <SchedulePanel />
          </div>
        );

      case 'vida':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm tracking-widest text-game-gold flex items-center gap-2">⭐ METAS DE VIDA</h2>
            <p className="text-sm text-muted-foreground font-body">
              Defina seus objetivos a longo prazo. Metas conectadas a objetivos de vida ganham 1.5x XP!
            </p>
            <LifeGoals />
          </div>
        );

      case 'missao':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-sm tracking-widest text-game-gold flex items-center gap-2">❤️ MISSÃO SEMANAL</h2>
            <p className="text-sm text-muted-foreground font-body">
              Toda semana você recebe uma missão obrigatória de ajudar alguém. Evolução real inclui impactar vidas.
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
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto lg:pl-8">
        <div className="max-w-3xl mx-auto lg:mx-0">
          {renderPage()}
        </div>
      </main>

      {/* Right Panel - Desktop only */}
      <aside className="hidden xl:block w-[300px] min-h-screen p-4 border-l border-border bg-card/50 overflow-y-auto shrink-0">
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
