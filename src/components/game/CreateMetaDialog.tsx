import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category } from '@/types/game';
import { Plus, X, Sparkles, ArrowRight, ArrowLeft, Target, Calendar, Repeat, Zap } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

const META_EXAMPLES = [
  'Ler 12 livros no ano',
  'Perder 8kg em 6 meses',
  'Aprender inglês fluente',
  'Passar em um concurso público',
  'Economizar R$ 10.000',
  'Correr uma maratona',
  'Meditar todos os dias',
  'Criar uma rotina espiritual',
];

export function CreateMetaDialog() {
  const { addMeta, lifeGoals } = useGame();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('pessoal');
  const [deadlineType, setDeadlineType] = useState<'days' | 'date'>('days');
  const [days, setDays] = useState('30');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [mainAction, setMainAction] = useState('');
  const [weeklyFrequency, setWeeklyFrequency] = useState('5');
  const [reward, setReward] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');

  const reset = () => {
    setTitle(''); setDays('30'); setMainAction(''); setWeeklyFrequency('5');
    setReward(''); setLinkedGoalId(''); setStep(1); setDeadlineDate('');
    setDeadlineType('days'); setCategory('pessoal');
  };

  const totalDays = deadlineType === 'days'
    ? parseInt(days) || 30
    : deadlineDate
      ? Math.max(1, Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / 86400000))
      : 30;

  const deadline = deadlineType === 'date' && deadlineDate
    ? new Date(deadlineDate).toISOString()
    : new Date(Date.now() + totalDays * 86400000).toISOString();

  const handleSubmit = () => {
    if (!title.trim() || !mainAction.trim()) return;
    addMeta({
      title: title.trim(),
      category,
      deadline,
      totalDays,
      mainAction: mainAction.trim(),
      weeklyFrequency: parseInt(weeklyFrequency) || 5,
      reward: reward || undefined,
      linkedLifeGoalId: linkedGoalId || undefined,
      benefits30d: 'Mais disciplina, foco e consistência',
      benefits6m: 'Transformação visível nos resultados',
      benefits1y: 'Identidade consolidada nesta área',
    });
    reset();
    setOpen(false);
  };

  const canNext = () => {
    switch (step) {
      case 1: return title.trim().length > 0;
      case 2: return (deadlineType === 'days' ? parseInt(days) > 0 : !!deadlineDate);
      case 3: return mainAction.trim().length > 0;
      case 4: return parseInt(weeklyFrequency) > 0;
      case 5: return true;
    }
  };

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

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const categories: { value: Category; label: string; icon: string; activeClass: string }[] = [
    { value: 'pessoal', label: 'Pessoal', icon: '🟣', activeClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: 'Profissional', icon: '🟠', activeClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: 'Espiritual', icon: '🔵', activeClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display text-[11px] tracking-[0.2em] text-primary uppercase">Criar Nova Meta</h3>
        </div>
        <button onClick={() => { setOpen(false); reset(); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      {/* Step 1: What meta */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-primary block mb-2 uppercase flex items-center gap-2">
              <Target className="w-3.5 h-3.5" /> Qual meta você quer alcançar?
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Ler 12 livros no ano"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <p className="text-[10px] font-display tracking-[0.15em] text-muted-foreground uppercase mb-2">Exemplos de metas:</p>
            <div className="flex flex-wrap gap-2">
              {META_EXAMPLES.map(ex => (
                <button key={ex} type="button" onClick={() => setTitle(ex)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${title === ex ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'}`}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Categoria</label>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-body font-semibold border transition-all ${
                    category === cat.value ? cat.activeClass : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Deadline */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <label className="text-[10px] font-display tracking-[0.2em] text-primary block mb-2 uppercase flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Qual o prazo para atingir essa meta?
          </label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setDeadlineType('days')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-body font-semibold border transition-all ${deadlineType === 'days' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              Número de dias
            </button>
            <button type="button" onClick={() => setDeadlineType('date')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-body font-semibold border transition-all ${deadlineType === 'date' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              Data específica
            </button>
          </div>
          {deadlineType === 'days' ? (
            <div>
              <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" placeholder="30" className={inputClass} />
              <p className="text-xs text-muted-foreground font-body mt-2">
                Prazo final: {new Date(Date.now() + (parseInt(days) || 30) * 86400000).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ) : (
            <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} className={inputClass} />
          )}
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90, 180, 365].map(d => (
              <button key={d} type="button" onClick={() => { setDeadlineType('days'); setDays(String(d)); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${days === String(d) && deadlineType === 'days' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}>
                {d} dias
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Main action */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-primary block mb-2 uppercase flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Qual ação principal vai te fazer chegar lá?
            </label>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Pense em uma ação prática e repetível que você possa fazer regularmente.
            </p>
            <input
              value={mainAction}
              onChange={e => setMainAction(e.target.value)}
              placeholder={title.toLowerCase().includes('ler') ? 'Ex: Ler pelo menos 10 páginas por dia' : 'Ex: Treinar 30 minutos por dia'}
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="glass-card rounded-xl p-4 border border-primary/10">
            <p className="text-[10px] font-display tracking-[0.15em] text-primary uppercase mb-2">💡 Dica — Regra dos 2 minutos</p>
            <p className="text-xs text-muted-foreground font-body">
              Comece com algo tão simples que leve menos de 2 minutos. Em vez de "ler 30 páginas", comece com "abrir o livro e ler 1 parágrafo". Vença a resistência inicial.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Frequency */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <label className="text-[10px] font-display tracking-[0.2em] text-primary block mb-2 uppercase flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5" /> Quantas vezes por semana você consegue fazer isso?
          </label>
          <p className="text-xs text-muted-foreground font-body mb-3">
            Seja realista. É melhor fazer 3x por semana com consistência do que prometer 7x e falhar.
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <button key={n} type="button" onClick={() => setWeeklyFrequency(String(n))}
                className={`flex-1 py-3 rounded-xl text-sm font-body font-bold border transition-all ${
                  weeklyFrequency === String(n) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}>
                {n}x
              </button>
            ))}
          </div>
          <div className="glass-card rounded-xl p-4 border border-primary/10">
            <p className="text-[10px] font-display tracking-[0.15em] text-primary uppercase mb-2">📊 Seu cálculo</p>
            <p className="text-xs text-foreground font-body">
              Em <strong>{totalDays} dias</strong>, você terá <strong>{Math.floor(totalDays / 7 * parseInt(weeklyFrequency || '5'))} sessões</strong> de "<em>{mainAction || 'sua ação'}</em>"
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Extras */}
      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-[10px] font-display tracking-[0.2em] text-primary uppercase">Detalhes finais (opcionais)</p>

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
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Recompensa ao concluir</label>
            <input value={reward} onChange={e => setReward(e.target.value)} placeholder="Ex: Comprar um livro novo" className={inputClass} />
          </div>

          <div className="glass-card rounded-xl p-4 border border-game-green/20">
            <p className="text-[10px] font-display tracking-[0.15em] text-game-green uppercase mb-2">✅ Resumo da sua meta</p>
            <div className="space-y-1.5 text-xs font-body text-foreground">
              <p>🎯 <strong>{title}</strong></p>
              <p>⚡ Ação: {mainAction}</p>
              <p>📅 Prazo: {totalDays} dias ({new Date(deadline).toLocaleDateString('pt-BR')})</p>
              <p>🔄 Frequência: {weeklyFrequency}x por semana</p>
              <p>📊 Total: ~{Math.floor(totalDays / 7 * parseInt(weeklyFrequency || '5'))} sessões</p>
              {reward && <p>🏆 Recompensa: {reward}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((step - 1) as Step)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : <div />}

        {step < 5 ? (
          <button type="button" onClick={() => canNext() && setStep((step + 1) as Step)} disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.15em] uppercase font-bold disabled:opacity-40 hover:shadow-glow-cyan transition-all">
            Próximo <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.15em] uppercase font-bold hover:shadow-glow-cyan transition-all">
            🚀 CRIAR META
          </button>
        )}
      </div>
    </div>
  );
}
