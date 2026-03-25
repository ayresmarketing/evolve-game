import { Meta, CATEGORY_CONFIG, CATEGORY_BG, CATEGORY_BORDER } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Zap, Clock, CalendarPlus, Undo2, X } from 'lucide-react';
import { useState } from 'react';

export function MetaCard({ meta }: { meta: Meta }) {
  const { completeMission, uncompleteMission, completeEtapa, deleteMeta, deleteMission, scheduleMission } = useGame();
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[meta.category];

  const completedMissions = meta.missions.filter(m => m.completedToday).length;
  const totalMissions = meta.missions.length;

  return (
    <div className={`glass-card rounded-2xl overflow-hidden animate-slide-up hover:border-primary/20 transition-all duration-200`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_BG[cat.color]}`} />
              <span className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase">{cat.label}</span>
              {meta.linkedLifeGoalId && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-display tracking-wider">⭐ META DE VIDA</span>
              )}
            </div>
            <h3 className="font-body text-base font-bold text-foreground">{meta.title}</h3>
          </div>
          <button onClick={() => deleteMeta(meta.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-body">{meta.progress}% completo • {completedMissions}/{totalMissions} tarefas</span>
            <span className="text-primary font-body flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3" />{meta.xpEarned} / {meta.xpTotal} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-accent transition-all duration-700`} style={{ width: `${meta.progress}%` }} />
          </div>
        </div>

        {meta.reward && (
          <p className="text-xs text-game-gold/80 font-body">🏆 Recompensa: {meta.reward}</p>
        )}
      </div>

      {/* Missions Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 bg-secondary/20 text-sm text-muted-foreground hover:text-foreground transition-colors font-body border-t border-border"
      >
        <span>{totalMissions} tarefa(s) • {completedMissions} concluída(s)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Missions */}
      {expanded && (
        <div className="px-5 py-4 space-y-3 border-t border-border">
          {meta.missions.map(mission => (
            <div key={mission.id} className={`rounded-xl p-4 border transition-all ${mission.completedToday ? 'bg-game-green/5 border-game-green/15' : 'bg-secondary/20 border-border'}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => mission.completedToday ? uncompleteMission(meta.id, mission.id) : completeMission(meta.id, mission.id)}
                  className="shrink-0 mt-0.5 transition-transform hover:scale-110"
                  title={mission.completedToday ? 'Desmarcar' : 'Concluir'}
                >
                  {mission.completedToday
                    ? <CheckCircle2 className="w-5 h-5 text-game-green" />
                    : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-body font-bold ${mission.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {mission.title}
                    </p>
                    {mission.completedToday && (
                      <button onClick={() => uncompleteMission(meta.id, mission.id)}
                        className="p-0.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Desfazer">
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>

                  {/* Metadata badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {mission.frequency && (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-display tracking-wider uppercase">
                        {mission.frequency}
                      </span>
                    )}
                    {mission.estimatedMinutes && (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{mission.estimatedMinutes} min
                      </span>
                    )}
                    {mission.scheduledDay && (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-game-blue/10 text-game-blue font-body flex items-center gap-1">
                        <CalendarPlus className="w-3 h-3" /> {new Date(mission.scheduledDay + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    {mission.scheduledTime && (
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-game-purple/10 text-game-purple font-body flex items-center gap-1">
                        🕐 {mission.scheduledTime}
                      </span>
                    )}
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-display">+{mission.xpReward} XP</span>
                  </div>

                  {/* Schedule button */}
                  {!mission.completedToday && !mission.scheduledTime && (
                    <button
                      onClick={() => {
                        const now = new Date();
                        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        const time = prompt('Horário para encaixar na agenda (HH:mm):', defaultTime);
                        if (time) scheduleMission(meta.id, mission.id, time, mission.scheduledDay || new Date().toISOString().split('T')[0]);
                      }}
                      className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-display tracking-wider hover:bg-primary/20 transition-all"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      ENCAIXAR NA AGENDA
                    </button>
                  )}

                  {/* Edit schedule */}
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
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive shrink-0" title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Etapas */}
              {mission.etapas.length > 0 && (
                <div className="ml-8 mt-3 space-y-1.5 border-l-2 border-primary/20 pl-3">
                  {mission.etapas.map(etapa => (
                    <button key={etapa.id} onClick={() => completeEtapa(meta.id, mission.id, etapa.id)}
                      className="flex items-center gap-2 w-full text-left group">
                      {etapa.completed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-game-green shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                      }
                      <span className={`text-xs font-body ${etapa.completed ? 'line-through text-muted-foreground' : 'text-secondary-foreground'}`}>
                        {etapa.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
