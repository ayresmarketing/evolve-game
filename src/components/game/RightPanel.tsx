import { useGame } from '@/contexts/GameContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { DayOfWeek, DAYS_OF_WEEK, CATEGORY_CONFIG } from '@/types/game';
import { Moon, Sun, Clock, Target, Zap, Heart, Calendar } from 'lucide-react';

export function RightPanel() {
  const { stats, metas, weeklyMission } = useGame();
  const { getDaySchedule, sleepSchedules } = useSchedule();

  // Get today's day
  const dayIndex = new Date().getDay();
  const dayMap: DayOfWeek[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const today = dayMap[dayIndex];
  const todaySchedule = getDaySchedule(today);
  const todayLabel = DAYS_OF_WEEK.find(d => d.value === today)?.label || '';

  // Today's missions
  const todayMissions = metas.filter(m => !m.completed).flatMap(m => m.missions.filter(mi => !mi.completedToday));
  const completedToday = metas.flatMap(m => m.missions.filter(mi => mi.completedToday));
  const totalEstimated = todayMissions.reduce((t, m) => t + (m.estimatedMinutes || 30), 0);

  return (
    <div className="space-y-4">
      {/* Today's Overview */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-game-card">
        <h3 className="font-display text-xs tracking-wider text-game-gold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> HOJE — {todayLabel.toUpperCase()}
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-secondary/30 rounded-lg p-2">
            <Moon className="w-4 h-4 mx-auto text-game-purple mb-1" />
            <p className="font-display text-sm text-foreground">{todaySchedule.sleepHours}h</p>
            <p className="text-[9px] text-muted-foreground font-body">Sono</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <Clock className="w-4 h-4 mx-auto text-game-orange mb-1" />
            <p className="font-display text-sm text-foreground">{todaySchedule.busyHours}h</p>
            <p className="text-[9px] text-muted-foreground font-body">Ocupado</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2">
            <Sun className="w-4 h-4 mx-auto text-game-green mb-1" />
            <p className="font-display text-sm text-foreground">{todaySchedule.freeHours}h</p>
            <p className="text-[9px] text-muted-foreground font-body">Livre</p>
          </div>
        </div>
      </div>

      {/* Today's Missions Summary */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-game-card">
        <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-game-blue" /> MISSÕES PENDENTES
        </h3>
        <div className="space-y-2 mb-3">
          {todayMissions.slice(0, 5).map(m => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-game-gold shrink-0" />
              <span className="font-body text-foreground truncate flex-1">{m.title}</span>
              {m.estimatedMinutes && (
                <span className="text-muted-foreground font-body shrink-0">{m.estimatedMinutes}min</span>
              )}
            </div>
          ))}
          {todayMissions.length === 0 && (
            <p className="text-xs text-game-green font-body text-center">✅ Todas concluídas!</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs border-t border-border pt-2">
          <span className="text-muted-foreground font-body">{todayMissions.length} restante(s)</span>
          <span className="text-game-gold font-body flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{Math.round(totalEstimated / 60 * 10) / 10}h estimado
          </span>
        </div>
      </div>

      {/* Weekly Mission Mini */}
      {weeklyMission && (
        <div className={`bg-card rounded-xl p-4 border shadow-game-card ${weeklyMission.completed ? 'border-game-green/30' : 'border-game-purple/30'}`}>
          <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-game-purple" /> MISSÃO ALTRUÍSTA
          </h3>
          <p className="text-sm font-body text-foreground mb-1">{weeklyMission.title}</p>
          {weeklyMission.completed ? (
            <span className="text-xs text-game-green font-body">✅ Concluída!</span>
          ) : (
            <span className="text-xs text-game-gold font-body">+{weeklyMission.xpReward} XP</span>
          )}
        </div>
      )}

      {/* Category Progress */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-game-card">
        <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">PROGRESSO POR ÁREA</h3>
        {(['pessoal', 'profissional', 'espiritual'] as const).map(cat => {
          const catMetas = metas.filter(m => m.category === cat);
          const avg = catMetas.length > 0 ? Math.round(catMetas.reduce((s, m) => s + m.progress, 0) / catMetas.length) : 0;
          const config = CATEGORY_CONFIG[cat];
          const bgColor: Record<string, string> = { 'game-purple': 'bg-game-purple', 'game-orange': 'bg-game-orange', 'game-blue': 'bg-game-blue' };
          return (
            <div key={cat} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-body text-muted-foreground">{config.label}</span>
                <span className="font-body text-muted-foreground">{avg}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${bgColor[config.color]} transition-all duration-500`} style={{ width: `${avg}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* XP Info */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-game-card text-center">
        <Zap className="w-6 h-6 text-game-gold mx-auto mb-1" />
        <p className="font-display text-2xl text-game-gold text-glow-gold">{stats.xp}</p>
        <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">XP Total</p>
      </div>
    </div>
  );
}
