import { Meta, CATEGORY_CONFIG } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';

export function MetaCard({ meta }: { meta: Meta }) {
  const { completeMission, completeEtapa, deleteMeta } = useGame();
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[meta.category];

  const categoryBorderColors: Record<string, string> = {
    'game-purple': 'border-game-purple/30',
    'game-orange': 'border-game-orange/30',
    'game-blue': 'border-game-blue/30',
  };

  const categoryBgColors: Record<string, string> = {
    'game-purple': 'bg-game-purple',
    'game-orange': 'bg-game-orange',
    'game-blue': 'bg-game-blue',
  };

  return (
    <div className={`bg-gradient-card rounded-lg shadow-game-card border ${categoryBorderColors[cat.color] || 'border-border'} overflow-hidden animate-slide-up`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${categoryBgColors[cat.color]}`} />
              <span className="text-xs font-display tracking-widest text-muted-foreground uppercase">{cat.label}</span>
            </div>
            <h3 className="font-display text-base font-semibold text-foreground truncate">{meta.title}</h3>
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
              <Zap className="w-3 h-3" />{meta.xpEarned} XP
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${categoryBgColors[cat.color]}`} style={{ width: `${meta.progress}%` }} />
          </div>
        </div>

        {meta.reward && (
          <p className="text-xs text-game-gold/80 font-body">🏆 Recompensa: {meta.reward}</p>
        )}
      </div>

      {/* Missions Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-secondary/30 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
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
                </div>
                <span className="text-xs text-game-gold font-display">+{mission.xpReward} XP</span>
              </div>

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
