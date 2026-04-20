import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Category, DayOfWeek, DAYS_OF_WEEK, CATEGORY_CONFIG, CATEGORY_BG } from '@/types/game';
import { formatMinutesToHM } from '@/lib/formatTime';
import { Plus, X, CheckCircle2, Circle, Trash2, Clock, Play, Square, Repeat, Link2 } from 'lucide-react';

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
  const [showDescription, setShowDescription] = useState(false);
  const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [hasDailyTime, setHasDailyTime] = useState(false);
  const [dailyTime, setDailyTime] = useState('');

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  // If both start time and end time are set, don't require estimated minutes
  const hasTimeRange = startTime && endTime;
  // If only start time (no end time), require estimated minutes
  const needsEstimate = startTime && !endTime;

  const toggleDay = (day: DayOfWeek) => {
    setRecurrentDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const submitAfazer = (data: any) => {
    addAfazer(data);
    resetForm();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Compute startDate from dateOption
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const resolvedStartDate = dateOption === 'today' ? today : dateOption === 'tomorrow' ? tomorrow : startDate;

    // Daily time option: override startTime + force recurrence on all days
    const resolvedStartTime = hasDailyTime && dailyTime ? dailyTime : (startTime || undefined);
    const resolvedIsRecurrent = hasDailyTime ? true : isRecurrent;
    const resolvedRecurrentDays = hasDailyTime
      ? (['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as DayOfWeek[])
      : (isRecurrent ? recurrentDays : undefined);

    // If start time set but no end time, require estimated minutes
    const effectiveNeedsEstimate = resolvedStartTime && !endTime;
    if (effectiveNeedsEstimate && !estimatedMinutes) return;

    // Calculate estimated minutes from time range if both provided
    let finalEstimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : undefined;
    if (resolvedStartTime && endTime && !finalEstimatedMinutes) {
      const [sh, sm] = resolvedStartTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      finalEstimatedMinutes = diff;
    }

    const data = {
      title: title.trim(),
      description: (showDescription && description.trim()) ? description.trim() : undefined,
      category,
      startDate: resolvedStartDate,
      endDate: endDate || undefined,
      startTime: resolvedStartTime,
      endTime: endTime || undefined,
      isRecurrent: resolvedIsRecurrent,
      recurrentDays: resolvedRecurrentDays,
      recurrentEndDate: resolvedIsRecurrent && recurrentEndDate ? recurrentEndDate : undefined,
      linkedMetaId: linkedMetaId || undefined,
      estimatedMinutes: finalEstimatedMinutes,
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
    setShowDescription(false); setDateOption('today'); setHasDailyTime(false); setDailyTime('');
  };

  const completedAfazeres = afazeres.filter(a => a.completed);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAfazeres = afazeres.filter(a => !a.completed && (a.startDate === todayStr || (a.isRecurrent && !a.completed)));
  const upcomingAfazeres = afazeres.filter(a => !a.completed && a.startDate && a.startDate > todayStr && !a.isRecurrent);

  const categories: { value: Category; label: string; icon: string; activeClass: string }[] = [
    { value: 'pessoal', label: 'Pessoal', icon: '🟣', activeClass: 'border-game-purple bg-game-purple/10 text-game-purple' },
    { value: 'profissional', label: 'Profissional', icon: '🟠', activeClass: 'border-game-orange bg-game-orange/10 text-game-orange' },
    { value: 'espiritual', label: 'Espiritual', icon: '🔵', activeClass: 'border-game-blue bg-game-blue/10 text-game-blue' },
  ];

  return (
    <div className="space-y-5">
      {/* Link prompt dialog */}
      {showLinkPrompt && pendingAfazer && (
        <div className="glass-card rounded-2xl p-4 animate-slide-up border border-primary/20">
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
        <div className="glass-card rounded-2xl p-4 sm:p-6 animate-slide-up">
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
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Quando?</label>
              <div className="flex gap-2 mb-2">
                {(['today', 'tomorrow', 'custom'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => setDateOption(opt)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-body font-semibold border transition-all ${
                      dateOption === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    }`}>
                    {opt === 'today' ? 'Hoje' : opt === 'tomorrow' ? 'Amanhã' : 'Outra data'}
                  </button>
                ))}
              </div>
              {dateOption === 'custom' && (
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
              )}
            </div>
            <div>
              <button type="button" onClick={() => setShowDescription(p => !p)}
                className="flex items-center gap-2 text-xs font-body text-muted-foreground hover:text-foreground transition-colors mb-1">
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${showDescription ? 'bg-primary border-primary' : 'border-border'}`}>
                  {showDescription && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                </span>
                Adicionar descrição (opcional)
              </button>
              {showDescription && (
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da tarefa..." className={`${inputClass} min-h-[60px] resize-none mt-2`} />
              )}
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
            <div>
              <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Data término (opcional)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
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

            {/* Show estimated minutes only when start time is set but NO end time */}
            {needsEstimate && (
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Tempo estimado (min) *</label>
                <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="Ex: 30" min="1" className={inputClass} />
                <p className="text-[10px] text-muted-foreground font-body mt-1">
                  ⚠️ Como não foi definido horário de término, informe o tempo estimado.
                </p>
              </div>
            )}

            {/* Show estimated minutes optionally when no time at all */}
            {!startTime && (
              <div>
                <label className="text-[10px] font-display tracking-[0.2em] text-muted-foreground block mb-2 uppercase">Tempo estimado (min)</label>
                <input type="number" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="Ex: 30" min="1" className={inputClass} />
              </div>
            )}

            {/* Daily fixed time */}
            <div>
              <button type="button" onClick={() => setHasDailyTime(p => !p)}
                className="flex items-center gap-2 text-xs font-body text-muted-foreground hover:text-foreground transition-colors mb-1">
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${hasDailyTime ? 'bg-primary border-primary' : 'border-border'}`}>
                  {hasDailyTime && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                </span>
                Esta tarefa acontece todo dia em um horário fixo
              </button>
              {hasDailyTime && (
                <div className="mt-2">
                  <input type="time" value={dailyTime} onChange={e => setDailyTime(e.target.value)} className={inputClass} />
                  <p className="text-[10px] text-muted-foreground font-body mt-1">⟳ Será criada como tarefa recorrente todos os dias neste horário.</p>
                </div>
              )}
            </div>

            {/* Recurrence */}
            {!hasDailyTime && (
              <>
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
              </>
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
        <section aria-label="Tarefas de hoje">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase">📅 Hoje</h3>
          <div className="space-y-2">
            {todayAfazeres.map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingAfazeres.length > 0 && (
        <section aria-label="Próximas tarefas">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase">📋 Próximas ({upcomingAfazeres.length})</h3>
          <div className="space-y-2">
            {upcomingAfazeres.map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedAfazeres.length > 0 && (
        <section aria-label="Tarefas concluídas">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase opacity-60">✅ Concluídos ({completedAfazeres.length})</h3>
          <div className="space-y-2 opacity-60">
            {completedAfazeres.slice(0, 10).map(a => <AfazerItem key={a.id} afazer={a} />)}
          </div>
        </section>
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
    <article className={`glass-card rounded-xl p-4 transition-all ${a.completed ? 'border-game-green/15' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => a.completed ? uncompleteAfazer(a.id) : completeAfazer(a.id)} className="shrink-0 mt-0.5 transition-transform hover:scale-110"
          aria-label={a.completed ? 'Desmarcar tarefa' : 'Completar tarefa'}>
          {a.completed ? <CheckCircle2 className="w-5 h-5 text-game-green" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${CATEGORY_BG[cat.color]}`} aria-hidden="true" />
            <p className={`text-sm font-body font-bold ${a.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{a.title}</p>
            {a.isRecurrent && <Repeat className="w-3 h-3 text-muted-foreground" />}
            {a.linkedMetaId && <Link2 className="w-3 h-3 text-primary" />}
            {!a.linkedMetaId && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-body">avulsa</span>}
          </div>
          {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {a.startTime && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground font-body">🕐 {a.startTime}{a.endTime ? ` - ${a.endTime}` : ''}</span>}
            {a.estimatedMinutes && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground font-body flex items-center gap-1"><Clock className="w-3 h-3" /> ~{formatMinutesToHM(a.estimatedMinutes)}</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-display">+{a.xpReward} XP</span>
            {a.actualMinutes && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-game-green/10 text-game-green font-body">⏱️ {formatMinutesToHM(a.actualMinutes)}</span>}
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
                  {a.estimatedMinutes && <span className="text-[10px] text-muted-foreground font-body">/ {formatMinutesToHM(a.estimatedMinutes)}</span>}
                  <button onClick={() => { stopAfazerTimer(a.id); completeAfazer(a.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-display tracking-wider hover:bg-destructive/20 transition-all">
                    <Square className="w-3 h-3" /> FINALIZAR
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={() => deleteAfazer(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
          aria-label="Excluir tarefa">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
