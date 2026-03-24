import { useGame } from '@/contexts/GameContext';
import { CATEGORY_CONFIG, Category } from '@/types/game';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function CategoryOverview() {
  const { metas, stats } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const categories: (Category | 'all')[] = ['all', 'pessoal', 'trabalho', 'espiritual'];

  const filteredMetas = selectedCategory === 'all' ? metas : metas.filter(m => m.category === selectedCategory);
  const activeMetas = filteredMetas.filter(m => !m.completed);
  const completedMetas = filteredMetas.filter(m => m.completed);

  const catStats = (['pessoal', 'trabalho', 'espiritual'] as Category[]).map(cat => {
    const catMetas = metas.filter(m => m.category === cat);
    const avgProgress = catMetas.length > 0 ? Math.round(catMetas.reduce((s, m) => s + m.progress, 0) / catMetas.length) : 0;
    return { ...CATEGORY_CONFIG[cat], category: cat, count: catMetas.length, avgProgress };
  });

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map(cat => {
          const label = cat === 'all' ? 'Todas' : CATEGORY_CONFIG[cat].label;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-display tracking-wider transition-all ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Category Progress Bars */}
      {selectedCategory === 'all' && (
        <div className="grid grid-cols-3 gap-3">
          {catStats.map(cs => {
            const bgColors: Record<string, string> = {
              'game-purple': 'bg-game-purple',
              'game-orange': 'bg-game-orange',
              'game-blue': 'bg-game-blue',
            };
            return (
              <div key={cs.category} className="bg-gradient-card rounded-lg p-3 shadow-game-card border border-border">
                <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">{cs.label}</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${bgColors[cs.color]}`} style={{ width: `${cs.avgProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground font-body">{cs.count} meta(s) · {cs.avgProgress}%</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Projection */}
      {activeMetas.length > 0 && (
        <div className="bg-gradient-card rounded-lg p-4 shadow-game-card border border-border">
          <h4 className="font-display text-xs tracking-wider text-game-gold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> PROJEÇÃO DE FUTURO
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1">30 dias</p>
              <p className="text-xs font-body text-game-green">Mais disciplina e foco</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1">6 meses</p>
              <p className="text-xs font-body text-game-green">Resultados visíveis</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1">1 ano</p>
              <p className="text-xs font-body text-game-green">Identidade consolidada</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-game-red" />
              <p className="text-xs font-body text-game-red/80">Se parar: perda de progresso e volta ao ponto zero.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
