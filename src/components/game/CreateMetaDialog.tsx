import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category, LifeGoal } from '@/types/game';
import { Plus, X, Sparkles } from 'lucide-react';

export function CreateMetaDialog() {
  const { addMeta, lifeGoals } = useGame();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('pessoal');
  const [days, setDays] = useState('30');
  const [volume, setVolume] = useState('');
  const [reward, setReward] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addMeta({
      title: title.trim(),
      category,
      deadline: new Date(Date.now() + parseInt(days) * 86400000).toISOString(),
      totalDays: parseInt(days),
      volume: volume || undefined,
      reward: reward || undefined,
      linkedLifeGoalId: linkedGoalId || undefined,
      benefits30d: 'Mais disciplina, foco e consistência',
      benefits6m: 'Transformação visível nos resultados',
      benefits1y: 'Identidade consolidada nesta área',
    });
    setTitle(''); setVolume(''); setReward(''); setDays('30'); setLinkedGoalId('');
    setOpen(false);
  };

  const categories: { value: Category; label: string; colorClass: string }[] = [
    { value: 'pessoal', label: '🟣 Pessoal', colorClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: '🟠 Profissional', colorClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: '🔵 Espiritual', colorClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card rounded-xl p-4 shadow-game-card border border-dashed border-primary/40 hover:border-primary hover:shadow-glow-gold transition-all duration-300 flex items-center justify-center gap-2 text-primary font-display text-sm tracking-wider"
      >
        <Plus className="w-5 h-5" />
        NOVA META
      </button>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-game-card border border-primary/30 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-game-gold" />
          <h3 className="font-display text-sm tracking-wider text-game-gold">CRIAR NOVA META</h3>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">NOME DA META</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Ler 1 livro por mês"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">CATEGORIA</label>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-body font-semibold border transition-all ${
                  category === cat.value ? cat.colorClass : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">PRAZO (DIAS)</label>
            <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">VOLUME (OPCIONAL)</label>
            <input value={volume} onChange={e => setVolume(e.target.value)} placeholder="Ex: 300"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Link to Life Goal */}
        {lifeGoals.length > 0 && (
          <div>
            <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">
              CONECTAR A META DE VIDA (1.5x XP) ⭐
            </label>
            <select value={linkedGoalId} onChange={e => setLinkedGoalId(e.target.value)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Nenhuma</option>
              {lifeGoals.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-[10px] font-display tracking-wider text-muted-foreground block mb-1.5">RECOMPENSA (OPCIONAL)</label>
          <input value={reward} onChange={e => setReward(e.target.value)} placeholder="Ex: Comprar um livro novo"
            className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <button type="submit"
          className="w-full bg-gradient-gold text-primary-foreground font-display text-sm tracking-wider py-2.5 rounded-md hover:shadow-glow-gold transition-all duration-300">
          🚀 CRIAR META E GERAR MISSÕES
        </button>
      </form>
    </div>
  );
}
