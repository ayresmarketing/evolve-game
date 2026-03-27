import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category, DayOfWeek, DAYS_OF_WEEK, CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { Plus, X, CheckCircle2, Circle, Trash2, Clock, Play, Square, Repeat, Calendar, Link2 } from 'lucide-react';

export function AfazeresPanel() {
  const { afazeres, addAfazer, completeAfazer, uncompleteAfazer, deleteAfazer, startAfazerTimer, stopAfazerTimer, metas } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('pessoal');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrentDays, setRecurrentDays] = useState<DayOfWeek[]>([]);
  const [recurrentEndDate, setRecurrentEndDate] = useState('');
  const [linkedMetaId, setLinkedMetaId] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [pendingAfazer, setPendingAfazer] = useState<any>(null);

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  const toggleDay = (day: DayOfWeek) => {
    setRecurrentDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const submitAfazer = (data: any) => {
    addAfazer(data);
    resetForm();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      startDate,
      endDate: endDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      isRecurrent,
      recurrentDays: isRecurrent ? recurrentDays : undefined,
      recurrentEndDate: isRecurrent && recurrentEndDate ? recurrentEndDate : undefined,
      linkedMetaId: linkedMetaId || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
    };

    if (!linkedMetaId && metas.filter(m => !m.completed).length > 0) {
      setPendingAfazer(data);
      setShowLinkPrompt(true);
      return;
    }
    submitAfazer(data);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(''); setStartTime(''); setEndTime(''); setIsRecurrent(false);
    setRecurrentDays([]); setRecurrentEndDate(''); setLinkedMetaId('');
    setEstimatedMinutes(''); setShowForm(false); setShowLinkPrompt(false); setPendingAfazer(null);
  };

  const pendingAfazeres = afazeres.filter(a => !a.completed);
  const completedAfazeres = afazeres.filter(a => a.completed);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAfazeres = afazeres.filter(a => a.startDate === todayStr || (a.isRecurrent && !a.completed));

  const categories: { value: Category; label: string; icon: string; activeClass: string }[] = [
    { value: 'pessoal', label: 'Pessoal', icon: '🟣', activeClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: 'Profissional', icon: '🟠', activeClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: 'Espiritual', icon: '🔵', activeClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  return (
    <div className="space-y-5">
      {/* Link prompt dialog */}
      {showLinkPrompt && pendingAfazer && (
        <div className="glass-card rounded-2xl p-5 animate-slide-up border border-primary/20">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-primary mb-3 uppercase">🔗 Isso faz parte de alguma meta?</h3>
          <div className="space-y-2 mb-4">
            {metas.filter(m => !m.completed).map(m => (
              <button key={m.id} onClick={() => { submitAfazer({ ...pendingAfazer, linkedMetaId: m.id }); }}
                className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary/30 transition-all flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${CATEGORY_BG[CATEGORY_CONFIG[m.category].color]}`} />
                <span className="text-sm font-body text-foreground">{m.title}</span>
                <Link2 className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { submitAfazer(pendingAfazer); }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:text-foreground transition-all">
              Não, é avulso
            </button>
            <button onClick={() => { setShowLinkPrompt(false); setPendingAfazer(null); }}
              className="px-4 py-2.5 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground transition-all">
              Cancelar
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-3">
            💡 Tarefas avulsas são classificadas como operacionais e ganham XP reduzido.
          </p>
        </div>
      )}

      {/* Add button */}
      {!showForm && !showLinkPrompt && (
        <button onClick={() => setShowForm(true)}
          className="w-full glass-card rounded-2xl p-4 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-glow-cyan transition-all duration-300 flex items-center justify-center gap-3 text-primary font-display text-xs tracking-[0.2em]">
          <Plus className="w-5 h-5" /> NOVO AFAZER
        </button>
      )}

      {/* Creation form */}
      {showForm && !showLinkPrompt && (
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-[11px] tracking-[0.2em] text-primary uppercase">Novo Afazer</h3>
            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Nome da tarefa *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Ir ao mercado" className={inputClass} autoFocus />
            </div>
            <div>
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Descrição (opcional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da tarefa..." className={`${inputClass} min-h-[60px] resize-none`} />
            </div>
            <div>
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Categoria</label>
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-body font-semibold border transition-all ${
                      category === cat.value ? cat.activeClass : 'border-border text-muted-foreground'
                    }`}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Data início</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Data término</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Horário início</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Horário término</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Tempo estimado (min)</label>
              <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="Ex: 30" min="1" className={inputClass} />
            </div>

            {/* Recurrence */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsRecurrent(!isRecurrent)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-body font-semibold border transition-all ${isRecurrent ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                <Repeat className="w-3.5 h-3.5" /> Tarefa recorrente
              </button>
            </div>
            {isRecurrent && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(d => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={`w-9 h-9 rounded-lg text-xs font-body font-bold border transition-all ${
                        recurrentDays.includes(d.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                      }`}>
                      {d.short}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Finaliza em</label>
                  <input type="date" value={recurrentEndDate} onChange={e => setRecurrentEndDate(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            {/* Link to meta */}
            {metas.filter(m => !m.completed).length > 0 && (
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Conectar a uma meta</label>
                <select value={linkedMetaId} onChange={e => setLinkedMetaId(e.target.value)} className={inputClass}>
                  <option value="">Nenhuma (tarefa avulsa)</option>
                  {metas.filter(m => !m.completed).map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" onClick={handleSubmit} disabled={!title.trim()}
              className="w-full bg-gradient-accent text-primary-foreground font-display text-xs tracking-[0.2em] py-3 rounded-xl hover:shadow-glow-cyan transition-all duration-300 uppercase font-bold disabled:opacity-40">
              ✅ CRIAR AFAZER
            </button>
          </div>
        </div>
      )}

      {/* Today's tasks */}
      {todayAfazeres.length > 0 && (
        <div>
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase">📅 Hoje</h3>
          <div className="space-y-2">
            {todayAfazeres.map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingAfazeres.length > 0 && (
        <div>
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase">📋 Pendentes ({pendingAfazeres.length})</h3>
          <div className="space-y-2">
            {pendingAfazeres.map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedAfazeres.length > 0 && (
        <div>
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase opacity-60">✅ Concluídos ({completedAfazeres.length})</h3>
          <div className="space-y-2 opacity-60">
            {completedAfazeres.slice(0, 10).map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AfazerItem({ afazer: a }: { afazer: any }) {
  const { completeAfazer, uncompleteAfazer, deleteAfazer, startAfazerTimer, stopAfazerTimer } = useGame();
  const cat = CATEGORY_CONFIG[a.category as Category];
  const isTimerRunning = !!a.timerStartedAt && !a.timerCompletedAt && !a.completed;
  const [elapsed, setElapsed] = useState(0);

  // Timer tick
  useState(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(a.timerStartedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`glass-card rounded-xl p-4 transition-all ${a.completed ? 'border-game-green/15' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => a.completed ? uncompleteAfazer(a.id) : completeAfazer(a.id)} className="shrink-0 mt-0.5 transition-transform hover:scale-110">
          {a.completed ? <CheckCircle2 className="w-5 h-5 text-game-green" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${CATEGORY_BG[cat.color]}`} />
            <p className={`text-sm font-body font-bold ${a.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{a.title}</p>
            {a.isRecurrent && <Repeat className="w-3 h-3 text-muted-foreground" />}
            {a.linkedMetaId && <Link2 className="w-3 h-3 text-primary" />}
            {!a.linkedMetaId && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-body">avulsa</span>}
          </div>
          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {a.startTime && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground font-body">🕐 {a.startTime}{a.endTime ? ` - ${a.endTime}` : ''}</span>}
            {a.estimatedMinutes && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground font-body flex items-center gap-1"><Clock className="w-3 h-3" /> ~{a.estimatedMinutes}min</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-display">+{a.xpReward} XP</span>
            {a.actualMinutes && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-game-green/10 text-game-green font-body">⏱️ {a.actualMinutes}min</span>}
          </div>

          {/* Timer */}
          {!a.completed && (
            <div className="flex items-center gap-2 mt-3">
              {!isTimerRunning ? (
                <button onClick={() => startAfazerTimer(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-game-green/10 border border-game-green/20 text-game-green text-[11px] font-display tracking-wider hover:bg-game-green/20 transition-all">
                  <Play className="w-3 h-3" /> INICIAR
                </button>
              ) : (
                <>
                  <span className="text-sm font-display text-primary animate-pulse-glow">{formatTime(elapsed)}</span>
                  {a.estimatedMinutes && <span className="text-[10px] text-muted-foreground font-body">/ {a.estimatedMinutes}min</span>}
                  <button onClick={() => { stopAfazerTimer(a.id); completeAfazer(a.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-display tracking-wider hover:bg-destructive/20 transition-all">
                    <Square className="w-3 h-3" /> FINALIZAR
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={() => deleteAfazer(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
