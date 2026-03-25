import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category } from '@/types/game';
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

  const categories: { value: Category; label: string; activeClass: string }[] = [
    { value: 'pessoal', label: '🟣 Pessoal', activeClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: '🟠 Profissional', activeClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: '🔵 Espiritual', activeClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full glass-card rounded-2xl p-5 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-glow-cyan transition-all duration-300 flex items-center justify-center gap-3 text-primary font-display text-xs tracking-[0.2em]"
      >
        <Plus className="w-5 h-5" />
        NOVA META
      </button>
    );
  }

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display text-[11px] tracking-[0.2em] text-primary uppercase">Criar Nova Meta</h3>
        </div>
        <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Nome da Meta</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Ler 1 livro por mês" className={inputClass} />
        </div>

        <div>
          <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Categoria</label>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-body font-semibold border transition-all ${
                  category === cat.value ? cat.activeClass : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Prazo (dias)</label>
            <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Volume (opcional)</label>
            <input value={volume} onChange={e => setVolume(e.target.value)} placeholder="Ex: 300" className={inputClass} />
          </div>
        </div>

        {lifeGoals.length > 0 && (
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">
              Conectar a Meta de Vida (1.5x XP) ⭐
            </label>
            <select value={linkedGoalId} onChange={e => setLinkedGoalId(e.target.value)} className={inputClass}>
              <option value="">Nenhuma</option>
              {lifeGoals.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Recompensa (opcional)</label>
          <input value={reward} onChange={e => setReward(e.target.value)} placeholder="Ex: Comprar um livro novo" className={inputClass} />
        </div>

        <button type="submit"
          className="w-full bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.2em] py-3 rounded-xl hover:shadow-glow-cyan transition-all duration-300 uppercase font-bold">
          🚀 CRIAR META E GERAR MISSÕES
        </button>
      </form>
    </div>
  );
}
