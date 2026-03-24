import { GameProvider } from '@/contexts/GameContext';
import { XPBar } from '@/components/game/XPBar';
import { StatsPanel } from '@/components/game/StatsPanel';
import { QuoteBar } from '@/components/game/QuoteBar';
import { MetaCard } from '@/components/game/MetaCard';
import { CreateMetaDialog } from '@/components/game/CreateMetaDialog';
import { CategoryOverview } from '@/components/game/CategoryOverview';
import { useGame } from '@/contexts/GameContext';
import { Gamepad2 } from 'lucide-react';

function Dashboard() {
  const { metas } = useGame();
  const activeMetas = metas.filter(m => !m.completed);
  const completedMetas = metas.filter(m => m.completed);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-game-gold" />
          <h1 className="font-display text-lg tracking-widest text-game-gold text-glow-gold">LIFE QUEST</h1>
          <span className="text-xs text-muted-foreground font-body ml-2">RPG da Vida Real</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Quote */}
        <QuoteBar />

        {/* XP + Stats */}
        <XPBar />
        <StatsPanel />

        {/* Category Overview */}
        <CategoryOverview />

        {/* Metas Section */}
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

        {/* Completed */}
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
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <GameProvider>
      <Dashboard />
    </GameProvider>
  );
}
