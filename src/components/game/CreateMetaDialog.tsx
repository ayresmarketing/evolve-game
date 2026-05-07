import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Sparkles, ArrowRight, ArrowLeft, Target, Calendar, Repeat, Zap, Wand2, PenLine, Trash2, RefreshCw, Edit3, Loader2, Clock, Brain } from 'lucide-react';
import { toast } from 'sonner';

type Step = number;
type PlanningMode = 'ai' | 'manual';

const META_EXAMPLES = [
  'Ler 12 livros no ano',
  'Aprender inglês fluente',
  'Economizar R$ 10.000',
];

interface ManualTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  frequency: string;
}

interface ManualMission {
  title: string;
  description: string;
  tasks: ManualTask[];
}

interface AIPlan {
  meta: string;
  missions: {
    title: string;
    description: string;
    type: string;
    tasks: {
      title: string;
      description: string;
      estimatedMinutes: number;
      frequency: string;
    }[];
  }[];
  totalEffortHours: number;
  summary: string;
}

export function CreateMetaDialog({ triggerElement }: { triggerElement?: React.ReactNode } = {}) {
  const { addMeta, lifeGoals } = useGame();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('pessoal');
  const [planningMode, setPlanningMode] = useState<PlanningMode>('ai');
  const [deadlineType, setDeadlineType] = useState<'days' | 'date'>('days');
  const [days, setDays] = useState('30');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [mainAction, setMainAction] = useState('');
  const [weeklyFrequency, setWeeklyFrequency] = useState('5');
  const [reward, setReward] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');

  // Mobile detection — split into 8 steps on mobile, 5 on desktop
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  const totalSteps = isMobile ? 8 : 5;

  // Mobile: 1=title 2=category 3=planningMode 4=deadline 5=mainAction 6=frequency 7=planning 8=extras
  // Desktop: 1=title+category+planningMode 2=deadline 3=mainAction 4=frequency 5=planning+extras
  const showBlock = (block: string): boolean => {
    if (isMobile) {
      const map: Record<string, number> = { title: 1, category: 2, planningMode: 3, deadline: 4, mainAction: 5, frequency: 6, planning: 7, extras: 8 };
      return step === map[block];
    }
    const map: Record<string, number[]> = { title: [1], category: [1], planningMode: [1], deadline: [2], mainAction: [3], frequency: [4], planning: [5], extras: [5] };
    return (map[block] ?? []).includes(step);
  };

  // AI plan state
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Manual missions state
  const [manualMissions, setManualMissions] = useState<ManualMission[]>([
    { title: '', description: '', tasks: [{ title: '', description: '', estimatedMinutes: 30, frequency: 'diária' }] }
  ]);

  const reset = () => {
    setTitle(''); setDays('30'); setMainAction(''); setWeeklyFrequency('5');
    setReward(''); setLinkedGoalId(''); setStep(1); setDeadlineDate('');
    setDeadlineType('days'); setCategory('pessoal'); setPlanningMode('ai');
    setAiPlan(null); setIsGenerating(false); setIsEditing(false);
    setManualMissions([{ title: '', description: '', tasks: [{ title: '', description: '', estimatedMinutes: 30, frequency: 'diária' }] }]);
  };

  const totalDays = deadlineType === 'days'
    ? parseInt(days) || 30
    : deadlineDate
      ? Math.max(1, Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / 86400000))
      : 30;

  const deadline = deadlineType === 'date' && deadlineDate
    ? new Date(deadlineDate).toISOString()
    : new Date(Date.now() + totalDays * 86400000).toISOString();

  const generateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meta-plan', {
        body: {
          meta: title,
          prazo: deadlineType === 'date' ? deadlineDate : `${days} dias`,
          acaoPrincipal: mainAction,
          frequenciaSemanal: parseInt(weeklyFrequency) || 5,
          totalDays,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setAiPlan(data as AIPlan);
      setIsEditing(false);
      toast.success('Plano gerado com sucesso!');
    } catch (err: any) {
      console.error('AI plan error:', err);
      toast.error(err.message || 'Erro ao gerar plano. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateAIPlan = async () => {
    setAiPlan(null);
    await generateAIPlan();
  };

  // Manual mission helpers
  const addManualMission = () => {
    setManualMissions(prev => [...prev, { title: '', description: '', tasks: [{ title: '', description: '', estimatedMinutes: 30, frequency: 'diária' }] }]);
  };

  const removeManualMission = (idx: number) => {
    setManualMissions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateManualMission = (idx: number, field: keyof Omit<ManualMission, 'tasks'>, value: string) => {
    setManualMissions(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addManualTask = (missionIdx: number) => {
    setManualMissions(prev => prev.map((m, i) => i === missionIdx ? { ...m, tasks: [...m.tasks, { title: '', description: '', estimatedMinutes: 30, frequency: 'diária' }] } : m));
  };

  const removeManualTask = (missionIdx: number, taskIdx: number) => {
    setManualMissions(prev => prev.map((m, i) => i === missionIdx ? { ...m, tasks: m.tasks.filter((_, ti) => ti !== taskIdx) } : m));
  };

  const updateManualTask = (missionIdx: number, taskIdx: number, field: keyof ManualTask, value: string | number) => {
    setManualMissions(prev => prev.map((m, i) => i === missionIdx ? { ...m, tasks: m.tasks.map((t, ti) => ti === taskIdx ? { ...t, [field]: value } : t) } : m));
  };

  // Edit AI plan inline
  const updateAIPlanMission = (mIdx: number, field: string, value: string) => {
    if (!aiPlan) return;
    setAiPlan({
      ...aiPlan,
      missions: aiPlan.missions.map((m, i) => i === mIdx ? { ...m, [field]: value } : m),
    });
  };

  const updateAIPlanTask = (mIdx: number, tIdx: number, field: string, value: string | number) => {
    if (!aiPlan) return;
    setAiPlan({
      ...aiPlan,
      missions: aiPlan.missions.map((m, mi) => mi === mIdx ? {
        ...m,
        tasks: m.tasks.map((t, ti) => ti === tIdx ? { ...t, [field]: value } : t),
      } : m),
    });
  };

  const handleSubmit = () => {
    if (!title.trim() || !mainAction.trim()) return;

    let missionsToCreate: { title: string; estimatedMinutes: number }[] = [];

    if (planningMode === 'ai' && aiPlan) {
      // Flatten AI plan into missions
      aiPlan.missions.forEach(m => {
        m.tasks.forEach(t => {
          missionsToCreate.push({ title: `${m.title}: ${t.title}`, estimatedMinutes: t.estimatedMinutes });
        });
      });
    } else if (planningMode === 'manual') {
      manualMissions.forEach(m => {
        m.tasks.filter(t => t.title.trim()).forEach(t => {
          missionsToCreate.push({ title: `${m.title}: ${t.title}`, estimatedMinutes: t.estimatedMinutes });
        });
      });
    }

    if (missionsToCreate.length === 0) {
      // Fallback: create from mainAction
      missionsToCreate = [{ title: mainAction, estimatedMinutes: 30 }];
    }

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
      manualMissions: missionsToCreate,
      taskMode: 'manual',
    });
    reset();
    setOpen(false);
    toast.success('Meta criada com sucesso! 🎯');
  };

  const canNext = (): boolean => {
    if (isMobile) {
      switch (step) {
        case 1: return title.trim().length > 0;
        case 2: return true;
        case 3: return true;
        case 4: return deadlineType === 'days' ? parseInt(days) > 0 : !!deadlineDate;
        case 5: return mainAction.trim().length > 0;
        case 6: return parseInt(weeklyFrequency) > 0;
        case 7:
          if (planningMode === 'ai') return !!aiPlan;
          return manualMissions.some(m => m.title.trim() && m.tasks.some(t => t.title.trim()));
        case 8: return true;
        default: return false;
      }
    }
    switch (step) {
      case 1: return title.trim().length > 0;
      case 2: return deadlineType === 'days' ? parseInt(days) > 0 : !!deadlineDate;
      case 3: return mainAction.trim().length > 0;
      case 4: return parseInt(weeklyFrequency) > 0;
      case 5:
        if (planningMode === 'ai') return !!aiPlan;
        return manualMissions.some(m => m.title.trim() && m.tasks.some(t => t.title.trim()));
      default: return false;
    }
  };

  if (!open) {
    if (triggerElement) {
      return <div onClick={() => setOpen(true)}>{triggerElement}</div>;
    }
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

  const frequencyOptions = ['diária', '2x por semana', '3x por semana', '4x por semana', '5x por semana', '1x por semana', 'semanal'];

  return (
    /* Modal overlay */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-t-2xl sm:rounded-2xl w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col animate-slide-up shadow-2xl overflow-hidden">
      {/* Fixed header */}
      <div className="shrink-0 px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display text-[11px] tracking-[0.2em] text-primary uppercase">Criar Nova Meta</h3>
          </div>
          <button onClick={() => { setOpen(false); reset(); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

      {/* TITLE — mobile step 1, desktop step 1 */}
      {showBlock('title') && (
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
        </div>
      )}

      {/* CATEGORY — mobile step 2, desktop step 1 */}
      {showBlock('category') && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Categoria</label>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`flex-1 py-3 px-3 rounded-xl text-xs font-body font-semibold border transition-all ${
                    category === cat.value ? cat.activeClass : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PLANNING MODE — mobile step 3, desktop step 1 */}
      {showBlock('planningMode') && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Como deseja criar o planejamento?</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPlanningMode('ai')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  planningMode === 'ai' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
                }`}>
                <Brain className={`w-6 h-6 mx-auto mb-2 ${planningMode === 'ai' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-body font-bold ${planningMode === 'ai' ? 'text-primary' : 'text-foreground'}`}>Criar com IA</p>
                <p className="text-[10px] text-muted-foreground font-body mt-1">A IA gera missões e tarefas para você</p>
              </button>
              <button type="button" onClick={() => setPlanningMode('manual')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  planningMode === 'manual' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
                }`}>
                <PenLine className={`w-6 h-6 mx-auto mb-2 ${planningMode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-body font-bold ${planningMode === 'manual' ? 'text-primary' : 'text-foreground'}`}>Criar manualmente</p>
                <p className="text-[10px] text-muted-foreground font-body mt-1">Você define suas missões e tarefas</p>
              </button>
            </div>
            {planningMode === 'ai' && (
              <p className="text-xs font-body text-muted-foreground bg-muted/40 border border-border/50 rounded-lg px-3 py-2 leading-relaxed mt-3">
                ⚠️ <strong className="text-foreground">Sugestões geradas por IA.</strong> Planos automáticos podem conter imprecisões. Revise antes de usar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* DEADLINE — mobile step 4, desktop step 2 */}
      {showBlock('deadline') && (
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

      {/* MAIN ACTION — mobile step 5, desktop step 3 */}
      {showBlock('mainAction') && (
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

      {/* FREQUENCY — mobile step 6, desktop step 4 */}
      {showBlock('frequency') && (
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

      {/* PLANNING — mobile step 7, desktop step 5 */}
      {showBlock('planning') && (
        <div className="space-y-4 animate-fade-in">
          {planningMode === 'ai' ? (
            <AIPlanningStep
              aiPlan={aiPlan}
              isGenerating={isGenerating}
              isEditing={isEditing}
              onGenerate={generateAIPlan}
              onRegenerate={regenerateAIPlan}
              onToggleEdit={() => setIsEditing(!isEditing)}
              onUpdateMission={updateAIPlanMission}
              onUpdateTask={updateAIPlanTask}
              inputClass={inputClass}
            />
          ) : (
            <ManualPlanningStep
              missions={manualMissions}
              onAddMission={addManualMission}
              onRemoveMission={removeManualMission}
              onUpdateMission={updateManualMission}
              onAddTask={addManualTask}
              onRemoveTask={removeManualTask}
              onUpdateTask={updateManualTask}
              inputClass={inputClass}
              frequencyOptions={frequencyOptions}
            />
          )}
        </div>
      )}

      {/* EXTRAS + SUMMARY — mobile step 8, desktop step 5 */}
      {showBlock('extras') && (
        <div className="space-y-4 animate-fade-in">
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
              <p>🤖 Planejamento: {planningMode === 'ai' ? (aiPlan ? `${aiPlan.missions.length} missões geradas por IA` : 'Aguardando geração') : 'Manual'}</p>
              {aiPlan && <p>⏱️ Esforço total estimado: {aiPlan.totalEffortHours}h</p>}
              {reward && <p>🏆 Recompensa: {reward}</p>}
            </div>
          </div>
        </div>
      )}

      </div>{/* end scrollable */}

      {/* Navigation — always visible at bottom */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-card/90 backdrop-blur-sm">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : <div />}

        {step < totalSteps ? (
          <div className="flex items-center gap-3">
            {/* Skip on frequency step */}
            {((isMobile && step === 6) || (!isMobile && step === 4)) && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="text-xs font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Pular
              </button>
            )}
            <button type="button" onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.15em] uppercase font-bold disabled:opacity-40 hover:shadow-glow-cyan transition-all">
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.15em] uppercase font-bold disabled:opacity-40 hover:shadow-glow-cyan transition-all">
            🚀 CRIAR META
          </button>
        )}
      </div>
    </div>
  </div>
  );
}

// ============================================
// AI Planning Sub-component
// ============================================
function AIPlanningStep({
  aiPlan, isGenerating, isEditing, onGenerate, onRegenerate, onToggleEdit, onUpdateMission, onUpdateTask, inputClass,
}: {
  aiPlan: AIPlan | null;
  isGenerating: boolean;
  isEditing: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onToggleEdit: () => void;
  onUpdateMission: (idx: number, field: string, value: string) => void;
  onUpdateTask: (mIdx: number, tIdx: number, field: string, value: string | number) => void;
  inputClass: string;
}) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-body text-muted-foreground">Gerando seu plano personalizado...</p>
        <p className="text-[10px] text-muted-foreground font-body">A IA está analisando sua meta e criando missões e tarefas</p>
      </div>
    );
  }

  if (!aiPlan) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-xl p-5 border border-primary/20 text-center">
          <Brain className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm font-body font-bold text-foreground mb-2">Gerar plano com Inteligência Artificial</p>
          <p className="text-xs text-muted-foreground font-body mb-4">
            A IA irá analisar sua meta, prazo, ação principal e frequência para criar um plano de execução completo com missões e tarefas.
          </p>
          <button type="button" onClick={onGenerate}
            className="px-6 py-3 rounded-xl bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.15em] uppercase font-bold hover:shadow-glow-cyan transition-all flex items-center gap-2 mx-auto">
            <Wand2 className="w-4 h-4" /> Gerar Plano com IA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button type="button" onClick={onRegenerate}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-body font-semibold hover:bg-primary/10 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refazer plano
        </button>
        <button type="button" onClick={onToggleEdit}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-body font-semibold transition-all ${
            isEditing ? 'border-game-green bg-game-green/10 text-game-green' : 'border-border text-muted-foreground hover:border-muted-foreground'
          }`}>
          <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Editando...' : 'Alterar manualmente'}
        </button>
      </div>

      {/* AI Summary */}
      {aiPlan.summary && (
        <div className="glass-card rounded-xl p-3 border border-primary/10">
          <p className="text-xs text-muted-foreground font-body">{aiPlan.summary}</p>
          <p className="text-[10px] text-primary font-display mt-2 tracking-wide">
            ⏱️ ESFORÇO TOTAL ESTIMADO: {aiPlan.totalEffortHours}h
          </p>
        </div>
      )}

      {/* Missions & Tasks */}
      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {aiPlan.missions.map((mission, mIdx) => (
          <div key={mIdx} className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-primary font-display text-[10px] tracking-wider mt-1">MISSÃO {mIdx + 1}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body">{mission.type === 'recorrente' ? '🔄 Recorrente' : '✅ Conclusão'}</span>
            </div>

            {isEditing ? (
              <div className="space-y-2 mb-3">
                <input value={mission.title} onChange={e => onUpdateMission(mIdx, 'title', e.target.value)} className={inputClass} />
                <input value={mission.description} onChange={e => onUpdateMission(mIdx, 'description', e.target.value)} className={inputClass} placeholder="Descrição" />
              </div>
            ) : (
              <div className="mb-3">
                <p className="text-sm font-body font-bold text-foreground">{mission.title}</p>
                <p className="text-xs text-muted-foreground font-body">{mission.description}</p>
              </div>
            )}

            <div className="space-y-2 pl-3 border-l-2 border-primary/20">
              {mission.tasks.map((task, tIdx) => (
                <div key={tIdx} className="py-2">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input value={task.title} onChange={e => onUpdateTask(mIdx, tIdx, 'title', e.target.value)} className={inputClass} />
                      <input value={task.description} onChange={e => onUpdateTask(mIdx, tIdx, 'description', e.target.value)} className={inputClass} placeholder="Descrição" />
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <input type="number" value={task.estimatedMinutes} onChange={e => onUpdateTask(mIdx, tIdx, 'estimatedMinutes', parseInt(e.target.value) || 10)}
                            className="w-16 bg-secondary border border-border rounded-lg px-2 py-1 text-xs font-body text-foreground" />
                          <span className="text-[10px] text-muted-foreground">min</span>
                        </div>
                        <input value={task.frequency} onChange={e => onUpdateTask(mIdx, tIdx, 'frequency', e.target.value)}
                          className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs font-body text-foreground" placeholder="Frequência" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-body font-semibold text-foreground">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{task.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-primary font-body flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimatedMinutes} min
                        </span>
                        <span className="text-[10px] text-muted-foreground font-body">📅 {task.frequency}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Manual Planning Sub-component
// ============================================
function ManualPlanningStep({
  missions, onAddMission, onRemoveMission, onUpdateMission, onAddTask, onRemoveTask, onUpdateTask, inputClass, frequencyOptions,
}: {
  missions: ManualMission[];
  onAddMission: () => void;
  onRemoveMission: (idx: number) => void;
  onUpdateMission: (idx: number, field: keyof Omit<ManualMission, 'tasks'>, value: string) => void;
  onAddTask: (missionIdx: number) => void;
  onRemoveTask: (missionIdx: number, taskIdx: number) => void;
  onUpdateTask: (missionIdx: number, taskIdx: number, field: keyof ManualTask, value: string | number) => void;
  inputClass: string;
  frequencyOptions: string[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-display tracking-[0.2em] text-primary uppercase">Suas missões e tarefas</p>
      <p className="text-xs text-muted-foreground font-body">
        Crie missões (blocos estratégicos) e dentro de cada missão, adicione tarefas práticas.
      </p>

      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
        {missions.map((mission, mIdx) => (
          <div key={mIdx} className="glass-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary font-display text-[10px] tracking-wider">MISSÃO {mIdx + 1}</span>
              {missions.length > 1 && (
                <button onClick={() => onRemoveMission(mIdx)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <input value={mission.title} onChange={e => onUpdateMission(mIdx, 'title', e.target.value)}
                placeholder="Nome da missão (ex: Criar rotina de leitura)" className={inputClass} />
              <input value={mission.description} onChange={e => onUpdateMission(mIdx, 'description', e.target.value)}
                placeholder="Descrição da missão" className={`${inputClass} text-xs`} />
            </div>

            {/* Tasks */}
            <div className="space-y-2 pl-3 border-l-2 border-primary/20">
              <p className="text-[9px] font-display tracking-wider text-muted-foreground uppercase">Tarefas desta missão:</p>
              {mission.tasks.map((task, tIdx) => (
                <div key={tIdx} className="bg-secondary/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1.5">
                      <input value={task.title} onChange={e => onUpdateTask(mIdx, tIdx, 'title', e.target.value)}
                        placeholder={`Tarefa ${tIdx + 1}: Ex: Ler 10 páginas`} className={inputClass} />
                      <input value={task.description} onChange={e => onUpdateTask(mIdx, tIdx, 'description', e.target.value)}
                        placeholder="Descrição clara" className={`${inputClass} text-xs`} />
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <input type="number" value={task.estimatedMinutes}
                            onChange={e => onUpdateTask(mIdx, tIdx, 'estimatedMinutes', parseInt(e.target.value) || 10)}
                            min="5" className="w-16 bg-secondary border border-border rounded-lg px-2 py-1 text-xs font-body text-foreground" />
                          <span className="text-[10px] text-muted-foreground">min</span>
                        </div>
                        <select value={task.frequency} onChange={e => onUpdateTask(mIdx, tIdx, 'frequency', e.target.value)}
                          className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs font-body text-foreground">
                          {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    {mission.tasks.length > 1 && (
                      <button onClick={() => onRemoveTask(mIdx, tIdx)} className="p-1 mt-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => onAddTask(mIdx)}
                className="w-full py-1.5 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:text-primary hover:border-primary/30 font-body transition-all">
                + Adicionar tarefa
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddMission}
        className="w-full py-2.5 rounded-xl border border-dashed border-primary/30 text-xs text-primary hover:border-primary/60 hover:bg-primary/5 font-body font-semibold transition-all">
        + Adicionar nova missão
      </button>
    </div>
  );
}
