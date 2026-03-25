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
    <div className={`bg-card rounded-xl shadow-game-card border ${CATEGORY_BORDER[cat.color] || 'border-border'} overflow-hidden animate-slide-up hover:border-primary/20 transition-all duration-200`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_BG[cat.color]}`} />
              <span className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">{cat.label}</span>
              {meta.linkedLifeGoalId && (
                <span className="px-1.5 py-0.5 rounded-full bg-game-gold/10 text-game-gold text-[9px] font-display">⭐ META DE VIDA</span>
              )}
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground truncate">{meta.title}</h3>
          </div>
          <button onClick={() => deleteMeta(meta.id)} className="p-1 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground font-body">{meta.progress}% completo • {completedMissions}/{totalMissions} tarefas</span>
            <span className="text-game-gold font-body flex items-center gap-1">
              <Zap className="w-3 h-3" />{meta.xpEarned} / {meta.xpTotal} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${CATEGORY_BG[cat.color]}`} style={{ width: `${meta.progress}%` }} />
          </div>
        </div>

        {meta.reward && (
          <p className="text-xs text-game-gold/80 font-body">🏆 Recompensa: {meta.reward}</p>
        )}
      </div>

      {/* Missions Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-secondary/20 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
      >
        <span>{totalMissions} tarefa(s) • {completedMissions} concluída(s)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Missions */}
      {expanded && (
        <div className="px-4 py-3 space-y-4 border-t border-border">
          {meta.missions.map(mission => (
            <div key={mission.id} className={`rounded-lg p-3 border transition-all ${mission.completedToday ? 'bg-game-green/5 border-game-green/20' : 'bg-secondary/10 border-border'}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => mission.completedToday ? uncompleteMission(meta.id, mission.id) : completeMission(meta.id, mission.id)}
                  className="shrink-0 mt-0.5"
                  title={mission.completedToday ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                >
                  {mission.completedToday
                    ? <CheckCircle2 className="w-5 h-5 text-game-green" />
                    : <Circle className="w-5 h-5 text-muted-foreground hover:text-game-green transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-body font-semibold ${mission.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {mission.title}
                    </p>
                    {mission.completedToday && (
                      <button
                        onClick={() => uncompleteMission(meta.id, mission.id)}
                        className="p-0.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Desfazer conclusão"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{mission.description}</p>
                  
                  {/* Mission metadata */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {mission.frequency && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-display uppercase tracking-wider">
                        {mission.frequency}
                      </span>
                    )}
                    {mission.estimatedMinutes && (
                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{mission.estimatedMinutes} min
                      </span>
                    )}
                    {mission.scheduledDay && (
                      <span className="text-[10px] text-game-blue font-body flex items-center gap-1">
                        <CalendarPlus className="w-3 h-3" /> {new Date(mission.scheduledDay + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    {mission.scheduledTime && (
                      <span className="text-[10px] text-game-purple font-body flex items-center gap-1">
                        🕐 {mission.scheduledTime}
                      </span>
                    )}
                    <span className="text-xs text-game-gold font-display">+{mission.xpReward} XP</span>
                  </div>

                  {/* Schedule button */}
                  {!mission.completedToday && !mission.scheduledTime && (
                    <button
                      onClick={() => {
                        const now = new Date();
                        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                        const time = prompt('Horário para encaixar na agenda (HH:mm):', defaultTime);
                        if (time) {
                          scheduleMission(meta.id, mission.id, time, mission.scheduledDay || new Date().toISOString().split('T')[0]);
                        }
                      }}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-game-blue/10 border border-game-blue/20 text-game-blue text-[11px] font-display tracking-wider hover:bg-game-blue/20 transition-all"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      ENCAIXAR NA AGENDA
                    </button>
                  )}

                  {/* Edit schedule if already scheduled */}
                  {!mission.completedToday && mission.scheduledTime && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={mission.scheduledTime || ''}
                          onChange={e => scheduleMission(meta.id, mission.id, e.target.value, mission.scheduledDay)}
                          className="bg-muted border border-border rounded px-2 py-0.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <input
                        type="date"
                        value={mission.scheduledDay || ''}
                        onChange={e => scheduleMission(meta.id, mission.id, mission.scheduledTime || '', e.target.value)}
                        className="bg-muted border border-border rounded px-2 py-0.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => scheduleMission(meta.id, mission.id, '', undefined)}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover da agenda"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete mission */}
                <button
                  onClick={() => deleteMission(meta.id, mission.id)}
                  className="p-1 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive shrink-0"
                  title="Excluir tarefa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Etapas */}
              {mission.etapas.length > 0 && (
                <div className="ml-8 mt-2 space-y-1 border-l-2 border-border pl-3">
                  {mission.etapas.map(etapa => (
                    <button
                      key={etapa.id}
                      onClick={() => completeEtapa(meta.id, mission.id, etapa.id)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      {etapa.completed
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-game-green shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-game-green shrink-0 transition-colors" />
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
