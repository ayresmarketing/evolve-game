import { Meta, CATEGORY_CONFIG, CATEGORY_BG, classifyTask, getStreakMultiplier } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { formatMinutesToHM } from '@/lib/formatTime';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Zap, Clock, CalendarPlus, Undo2, X, Trophy, Play, Square, Edit3, CalendarCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

function MissionTimer({ metaId, mission }: { metaId: string; mission: any }) {
  const { startMissionTimer, stopMissionTimer, completeMission } = useGame();
  const isRunning = !!mission.timerStartedAt && !mission.timerCompletedAt && !mission.completedToday;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(mission.timerStartedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mission.timerStartedAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (mission.completedToday) {
    return mission.actualMinutes ? (
      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-game-green/10 text-game-green font-body">⏱️ {formatMinutesToHM(mission.actualMinutes)}</span>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRunning ? (
        <button onClick={() => startMissionTimer(metaId, mission.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-game-green/10 border border-game-green/20 text-game-green text-[11px] font-display tracking-wider hover:bg-game-green/20 transition-all">
          <Play className="w-3 h-3" /> INICIAR
        </button>
      ) : (
        <>
          <span className="text-sm font-display text-primary animate-pulse-glow">{formatTime(elapsed)}</span>
          {mission.estimatedMinutes && <span className="text-[10px] text-muted-foreground font-body">/ {formatMinutesToHM(mission.estimatedMinutes)}</span>}
          <button onClick={() => { stopMissionTimer(metaId, mission.id); completeMission(metaId, mission.id); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-display tracking-wider hover:bg-destructive/20 transition-all">
            <Square className="w-3 h-3" /> FINALIZAR
          </button>
        </>
      )}
    </div>
  );
}

export function MetaCard({ meta }: { meta: Meta }) {
  const { completeMission, uncompleteMission, completeEtapa, deleteMeta, deleteMission, scheduleMission, scheduleAllMissions, completeMeta, updateMissionEstimate, updateMission, stats } = useGame();
  const schedule = useSchedule();
  const [expanded, setExpanded] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [estimateValue, setEstimateValue] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editDescValue, setEditDescValue] = useState('');
  const cat = CATEGORY_CONFIG[meta.category];
  const streakMult = getStreakMultiplier(stats.streak);

  const completedMissions = meta.missions.filter(m => m.completedToday).length;
  const totalMissions = meta.missions.length;
  const unscheduledCount = meta.missions.filter(m => !m.completedToday && !m.scheduledTime).length;

  const autoSchedule = (metaId: string, missionId: string, estimatedMinutes: number) => {
    const today = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
    const todayDay = days[today.getDay()];
    const busySlots: { start: number; end: number }[] = [];
    schedule.fixedBlocks.filter(b => b.days.includes(todayDay as any)).forEach(b => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      busySlots.push({ start: sh * 60 + sm, end: eh * 60 + em });
    });
    const sleepSchedule = schedule.sleepSchedules.find(s => s.days.includes(todayDay as any));
    let wakeMinutes = 6 * 60, bedMinutes = 22 * 60;
    if (sleepSchedule) {
      const [wh, wm] = sleepSchedule.wakeTime.split(':').map(Number);
      const [bh, bm] = sleepSchedule.bedtime.split(':').map(Number);
      wakeMinutes = wh * 60 + wm; bedMinutes = bh * 60 + bm;
    }
    busySlots.sort((a, b) => a.start - b.start);
    const now = today.getHours() * 60 + today.getMinutes();
    let searchStart = Math.max(wakeMinutes, now + 15);
    for (const slot of busySlots) {
      if (searchStart + estimatedMinutes <= slot.start) {
        const h = Math.floor(searchStart / 60), m = searchStart % 60;
        scheduleMission(metaId, missionId, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, today.toISOString().split('T')[0]);
        return;
      }
      searchStart = Math.max(searchStart, slot.end);
    }
    if (searchStart + estimatedMinutes <= bedMinutes) {
      const h = Math.floor(searchStart / 60), m = searchStart % 60;
      scheduleMission(metaId, missionId, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, today.toISOString().split('T')[0]);
    } else {
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      scheduleMission(metaId, missionId, `${String(Math.floor(wakeMinutes / 60) + 1).padStart(2, '0')}:00`, tomorrow.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-slide-up hover:border-primary/20 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_BG[cat.color]}`} />
              <span className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase">{cat.label}</span>
              {meta.linkedLifeGoalId && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-display tracking-wider">⭐ 1.5x XP</span>}
              {streakMult > 1 && <span className="px-2 py-0.5 rounded-full bg-game-fire/10 text-game-fire text-[9px] font-display tracking-wider">🔥 +{Math.round((streakMult-1)*100)}%</span>}
            </div>
            <h3 className="font-body text-base font-bold text-foreground">{meta.title}</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              📅 Prazo: {new Date(meta.deadline).toLocaleDateString('pt-BR')} • {meta.totalDays} dias
              {meta.mainAction && ` • ⚡ ${meta.mainAction}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!meta.completed && totalMissions === 0 && (
              <button onClick={() => completeMeta(meta.id)} className="p-2 rounded-lg hover:bg-game-green/10 text-muted-foreground hover:text-game-green" title="Finalizar meta">
                <Trophy className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => deleteMeta(meta.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-body">{meta.progress}% completo • {completedMissions}/{totalMissions} tarefas</span>
            <span className="text-primary font-body flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3" />{meta.xpEarned} / {meta.xpTotal} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-accent transition-all duration-700" style={{ width: `${meta.progress}%` }} />
          </div>
        </div>

        {/* Schedule all button */}
        {!meta.completed && unscheduledCount > 0 && (
          <button onClick={() => scheduleAllMissions(meta.id)}
            className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-game-blue/10 border border-game-blue/20 text-game-blue text-[11px] font-display tracking-wider hover:bg-game-blue/20 transition-all">
            <CalendarCheck className="w-4 h-4" /> ENCAIXAR TODAS NA AGENDA ({unscheduledCount})
          </button>
        )}

        {!meta.completed && meta.missions.filter(m => !m.completedToday).length === 0 && totalMissions > 0 && (
          <button onClick={() => completeMeta(meta.id)}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-game-green/10 border border-game-green/20 text-game-green text-sm font-display tracking-wider hover:bg-game-green/20 transition-all">
            <Trophy className="w-4 h-4" /> FINALIZAR META — +{meta.xpTotal - meta.xpEarned} XP
          </button>
        )}

        {meta.reward && <p className="text-xs text-game-gold/80 font-body mt-2">🏆 Recompensa: {meta.reward}</p>}
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 bg-secondary/20 text-sm text-muted-foreground hover:text-foreground transition-colors font-body border-t border-border">
        <span>{totalMissions} tarefa(s) • {completedMissions} concluída(s)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-3 border-t border-border">
          {meta.missions.map(mission => {
            const taskClass = classifyTask(mission.xpReward);
            return (
              <div key={mission.id} className={`rounded-xl p-4 border transition-all ${mission.completedToday ? 'bg-game-green/5 border-game-green/15' : 'bg-secondary/20 border-border'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => mission.completedToday ? uncompleteMission(meta.id, mission.id) : completeMission(meta.id, mission.id)}
                    className="shrink-0 mt-0.5 transition-transform hover:scale-110">
                    {mission.completedToday ? <CheckCircle2 className="w-5 h-5 text-game-green" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingTitle === mission.id ? (
                      <div className="space-y-2 mb-2">
                        <input value={editTitleValue} onChange={e => setEditTitleValue(e.target.value)} autoFocus
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <textarea value={editDescValue} onChange={e => setEditDescValue(e.target.value)} rows={2}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Descrição (opcional)" />
                        <div className="flex gap-2">
                          <button onClick={() => { updateMission(meta.id, mission.id, { title: editTitleValue.trim() || mission.title, description: editDescValue.trim() || undefined }); setEditingTitle(null); }}
                            className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-display hover:bg-primary/20">Salvar</button>
                          <button onClick={() => setEditingTitle(null)} className="px-3 py-1 rounded-lg text-muted-foreground text-[10px] font-body">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-body font-bold ${mission.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{mission.title}</p>
                        {!mission.completedToday && (
                          <button onClick={() => { setEditingTitle(mission.id); setEditTitleValue(mission.title); setEditDescValue(mission.description || ''); }}
                            className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title="Editar título">
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        {mission.completedToday && (
                          <button onClick={() => uncompleteMission(meta.id, mission.id)} className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" title="Desfazer">
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    {editingTitle !== mission.id && <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-lg font-display tracking-wider uppercase ${
                        taskClass === 'CRÍTICA' ? 'bg-game-fire/15 text-game-fire' :
                        taskClass === 'AVANÇADA' ? 'bg-game-gold/15 text-game-gold' :
                        taskClass === 'PADRÃO' ? 'bg-primary/10 text-primary' :
                        'bg-secondary/50 text-muted-foreground'
                      }`}>{taskClass}</span>
                      {mission.frequency && <span className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-display tracking-wider uppercase">{mission.frequency}</span>}
                      {mission.estimatedMinutes && (
                        <button onClick={() => { setEditingEstimate(mission.id); setEstimateValue(String(mission.estimatedMinutes)); }}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground font-body flex items-center gap-1 hover:bg-secondary transition-all">
                          <Clock className="w-3 h-3" /> ~{formatMinutesToHM(mission.estimatedMinutes)} <Edit3 className="w-2.5 h-2.5 ml-1" />
                        </button>
                      )}
                      {mission.scheduledDay && (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-game-blue/10 text-game-blue font-body flex items-center gap-1">
                          <CalendarPlus className="w-3 h-3" /> {new Date(mission.scheduledDay + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                      {mission.scheduledTime && <span className="text-[10px] px-2.5 py-1 rounded-lg bg-game-purple/10 text-game-purple font-body">🕐 {mission.scheduledTime}</span>}
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-display">+{mission.xpReward} XP</span>
                    </div>

                    {/* Edit estimate */}
                    {editingEstimate === mission.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="number" value={estimateValue} onChange={e => setEstimateValue(e.target.value)} min="1"
                          className="w-20 bg-secondary border border-border rounded-lg px-3 py-1.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <span className="text-[10px] text-muted-foreground">min</span>
                        <button onClick={() => { updateMissionEstimate(meta.id, mission.id, parseInt(estimateValue) || 30); setEditingEstimate(null); }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-display hover:bg-primary/20">Salvar</button>
                        <button onClick={() => setEditingEstimate(null)} className="px-3 py-1.5 rounded-lg text-muted-foreground text-[10px] font-body">Cancelar</button>
                      </div>
                    )}

                    {/* Timer */}
                    <MissionTimer metaId={meta.id} mission={mission} />

                    {/* Timeline info */}
                    {mission.timerStartedAt && (
                      <div className="mt-2 text-[10px] text-muted-foreground font-body space-y-0.5">
                        <p>▶️ Início: {new Date(mission.timerStartedAt).toLocaleString('pt-BR')}</p>
                        {mission.timerCompletedAt && <p>⏹️ Fim: {new Date(mission.timerCompletedAt).toLocaleString('pt-BR')}</p>}
                        {mission.actualMinutes != null && <p>⏱️ Duração: {formatMinutesToHM(mission.actualMinutes)} {mission.estimatedMinutes ? `(estimado: ${formatMinutesToHM(mission.estimatedMinutes)})` : ''}</p>}
                      </div>
                    )}

                    {/* Auto-schedule */}
                    {!mission.completedToday && !mission.scheduledTime && (
                      <button onClick={() => autoSchedule(meta.id, mission.id, mission.estimatedMinutes || 30)}
                        className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-display tracking-wider hover:bg-primary/20 transition-all">
                        <CalendarPlus className="w-3.5 h-3.5" /> ENCAIXAR NA AGENDA
                      </button>
                    )}

                    {!mission.completedToday && mission.scheduledTime && (
                      <div className="mt-3 flex items-center gap-2">
                        <input type="time" value={mission.scheduledTime || ''} onChange={e => scheduleMission(meta.id, mission.id, e.target.value, mission.scheduledDay)}
                          className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <input type="date" value={mission.scheduledDay || ''} onChange={e => scheduleMission(meta.id, mission.id, mission.scheduledTime || '', e.target.value)}
                          className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <button onClick={() => scheduleMission(meta.id, mission.id, '', undefined)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => deleteMission(meta.id, mission.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0" title="Excluir tarefa">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {mission.etapas.length > 0 && (
                  <div className="ml-8 mt-3 space-y-1.5 border-l-2 border-primary/20 pl-3">
                    {mission.etapas.map(etapa => (
                      <button key={etapa.id} onClick={() => completeEtapa(meta.id, mission.id, etapa.id)}
                        className="flex items-center gap-2 w-full text-left group">
                        {etapa.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-game-green shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />}
                        <span className={`text-xs font-body ${etapa.completed ? 'line-through text-muted-foreground' : 'text-secondary-foreground'}`}>{etapa.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
