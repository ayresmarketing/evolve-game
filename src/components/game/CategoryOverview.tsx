import { useGame } from '@/contexts/GameContext';
import { CATEGORY_CONFIG, Category, CATEGORY_BG } from '@/types/game';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function CategoryOverview() {
  const { metas } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const categories: (Category | 'all')[] = ['all', 'pessoal', 'profissional', 'espiritual'];
  const filteredMetas = selectedCategory === 'all' ? metas : metas.filter(m => m.category === selectedCategory);
  const activeMetas = filteredMetas.filter(m => !m.completed);

  const catStats = (['pessoal', 'profissional', 'espiritual'] as Category[]).map(cat => {
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
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-display tracking-wider transition-all duration-200 ${
                isActive ? 'bg-primary text-primary-foreground shadow-glow-cyan' : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Category Progress Cards */}
      {selectedCategory === 'all' && (
        <div className="grid grid-cols-3 gap-3">
          {catStats.map(cs => (
            <div key={cs.category} className="glass-card rounded-2xl p-4">
              <p className="text-[11px] font-display tracking-[0.15em] text-muted-foreground mb-3 uppercase">{cs.label}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${CATEGORY_BG[cs.color]} transition-all duration-500`} style={{ width: `${cs.avgProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground font-body">{cs.count} meta(s) · {cs.avgProgress}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Projection */}
      {activeMetas.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-display text-[10px] tracking-[0.25em] text-primary mb-4 flex items-center gap-2 uppercase">
            <TrendingUp className="w-4 h-4" /> Projeção de Futuro
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { period: '30 dias', text: 'Mais disciplina e foco' },
              { period: '6 meses', text: 'Resultados visíveis' },
              { period: '1 ano', text: 'Identidade consolidada' },
            ].map(p => (
              <div key={p.period} className="bg-secondary/30 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground font-display tracking-wider mb-1 uppercase">{p.period}</p>
                <p className="text-xs font-body text-game-green">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-game-red shrink-0" />
            <p className="text-xs font-body text-game-red/80">Se parar: perda de progresso e volta ao ponto zero.</p>
          </div>
        </div>
      )}
    </div>
  );
}
