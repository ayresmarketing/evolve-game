import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category, CATEGORY_CONFIG, LifeGoal } from '@/types/game';
import { Star, Plus, Trash2, X, Target, Calendar } from 'lucide-react';

export function LifeGoals() {
  const { lifeGoals, addLifeGoal, deleteLifeGoal, metas } = useGame();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('pessoal');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 10);
  const [icon, setIcon] = useState('🏠');

  const icons = ['🏠', '💰', '👨‍👩‍👧‍👦', '🎓', '🏖️', '🚗', '💼', '🌍', '🏋️', '📖', '🙏', '❤️'];

  const handleAdd = () => {
    if (!title.trim()) return;
    addLifeGoal({ title, description, category, targetYear, icon });
    setTitle(''); setDescription(''); setShowAdd(false);
  };

  const getLinkedMetas = (goalId: string) => metas.filter(m => m.linkedLifeGoalId === goalId);
  const yearsLeft = (year: number) => Math.max(0, year - new Date().getFullYear());

  const categories: { value: Category; label: string; colorClass: string }[] = [
    { value: 'pessoal', label: '🟣 Pessoal', colorClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: '🟠 Profissional', colorClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: '🔵 Espiritual', colorClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full bg-card rounded-xl p-4 border border-dashed border-primary/40 hover:border-primary hover:shadow-glow-gold transition-all duration-300 flex items-center justify-center gap-2 text-primary font-display text-sm tracking-wider"
      >
        <Plus className="w-5 h-5" />
        NOVA META DE VIDA
      </button>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-card rounded-xl p-5 border border-primary/30 shadow-game-card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm tracking-wider text-game-gold flex items-center gap-2">
              <Star className="w-5 h-5" /> META DE VIDA
            </h3>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Icon Picker */}
            <div>
              <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">ÍCONE</label>
              <div className="flex gap-2 flex-wrap">
                {icons.map(i => (
                  <button key={i} type="button" onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${icon === i ? 'bg-primary/20 border border-primary/40 scale-110' : 'bg-secondary/50 border border-transparent hover:bg-secondary'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">OBJETIVO</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Comprar um apartamento"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">DESCRIÇÃO</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva seu objetivo..."
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">ANO ALVO</label>
                <input type="number" value={targetYear} onChange={e => setTargetYear(parseInt(e.target.value))} min={new Date().getFullYear() + 1}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">CATEGORIA</label>
                <select value={category} onChange={e => setCategory(e.target.value as Category)}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleAdd} className="w-full bg-gradient-gold text-primary-foreground font-display text-sm tracking-wider py-2.5 rounded-md hover:shadow-glow-gold transition-all">
              ⭐ DEFINIR META DE VIDA
            </button>
          </div>
        </div>
      )}

      {/* Life Goals List */}
      <div className="space-y-3">
        {lifeGoals.map(goal => {
          const linked = getLinkedMetas(goal.id);
          const cat = CATEGORY_CONFIG[goal.category];
          const years = yearsLeft(goal.targetYear);

          return (
            <div key={goal.id} className="bg-card rounded-xl p-4 border border-border shadow-game-card hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-game-gold/20 to-game-purple/20 flex items-center justify-center text-2xl shrink-0">
                  {goal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display text-sm tracking-wider text-foreground truncate">{goal.title}</h4>
                    <span className={`text-[10px] font-display tracking-wider ${cat.glowClass}`}>{cat.label}</span>
                  </div>
                  {goal.description && <p className="text-xs text-muted-foreground font-body mb-2 line-clamp-2">{goal.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-body">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{goal.targetYear} ({years} anos)</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{linked.length} meta(s) conectada(s)</span>
                  </div>
                  {linked.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {linked.map(m => (
                        <span key={m.id} className="px-2 py-0.5 rounded-full bg-game-gold/10 text-game-gold text-[10px] font-body">
                          {m.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteLifeGoal(goal.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {lifeGoals.length === 0 && (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">Nenhuma meta de vida definida.</p>
            <p className="text-xs text-muted-foreground font-body">Defina objetivos a longo prazo para guiar sua evolução!</p>
          </div>
        )}
      </div>
    </div>
  );
}
