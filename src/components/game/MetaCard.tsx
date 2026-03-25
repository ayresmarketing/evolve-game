import { Meta, CATEGORY_CONFIG, CATEGORY_BG, CATEGORY_BORDER } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Zap, Clock, CalendarPlus } from 'lucide-react';
import { useState } from 'react';

export function MetaCard({ meta }: { meta: Meta }) {
  const { completeMission, completeEtapa, deleteMeta, updateMissionEstimate, scheduleMission } = useGame();
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[meta.category];

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
            <span className="text-muted-foreground font-body">{meta.progress}% completo</span>
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
        <span>{meta.missions.length} missão(ões)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Missions */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-border">
          {meta.missions.map(mission => (
            <div key={mission.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => !mission.completedToday && completeMission(meta.id, mission.id)}
                  disabled={mission.completedToday}
                  className="shrink-0"
                >
                  {mission.completedToday
                    ? <CheckCircle2 className="w-5 h-5 text-game-green" />
                    : <Circle className="w-5 h-5 text-muted-foreground hover:text-game-green transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body font-semibold ${mission.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {mission.estimatedMinutes && (
                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{mission.estimatedMinutes} min
                      </span>
                    )}
                    {mission.scheduledTime && (
                      <span className="text-[10px] text-game-blue font-body flex items-center gap-1">
                        <CalendarPlus className="w-3 h-3" /> {mission.scheduledTime}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-game-gold font-display">+{mission.xpReward} XP</span>
              </div>

              {/* Time Estimate & Schedule Controls */}
              {!mission.completedToday && (
                <div className="ml-8 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <input
                      type="number"
                      value={mission.estimatedMinutes || ''}
                      onChange={e => updateMissionEstimate(meta.id, mission.id, parseInt(e.target.value) || 0)}
                      placeholder="min"
                      className="w-16 bg-muted border border-border rounded px-2 py-0.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarPlus className="w-3 h-3 text-muted-foreground" />
                    <input
                      type="time"
                      value={mission.scheduledTime || ''}
                      onChange={e => scheduleMission(meta.id, mission.id, e.target.value)}
                      className="bg-muted border border-border rounded px-2 py-0.5 text-[11px] font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Etapas */}
              {mission.etapas.length > 0 && (
                <div className="ml-8 space-y-1">
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
