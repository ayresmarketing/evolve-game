import { useGame } from '@/contexts/GameContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { DayOfWeek, DAYS_OF_WEEK, CATEGORY_CONFIG } from '@/types/game';
import { Moon, Sun, Clock, Target, Zap, Heart, Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function RightPanel() {
  const { stats, metas, weeklyMission } = useGame();
  const { getDaySchedule } = useSchedule();

  const dayIndex = new Date().getDay();
  const dayMap: DayOfWeek[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const today = dayMap[dayIndex];
  const todaySchedule = getDaySchedule(today);
  const todayLabel = DAYS_OF_WEEK.find(d => d.value === today)?.label || '';

  const todayMissions = metas.filter(m => !m.completed).flatMap(m => m.missions.filter(mi => !mi.completedToday));
  const completedToday = metas.flatMap(m => m.missions.filter(mi => mi.completedToday));
  const totalEstimated = todayMissions.reduce((t, m) => t + (m.estimatedMinutes || 30), 0);

  const timeData = [
    { name: 'Sono', value: todaySchedule.sleepHours, color: 'hsl(var(--personal-purple))' },
    { name: 'Ocupado', value: todaySchedule.busyHours, color: 'hsl(var(--work-orange))' },
    { name: 'Livre', value: todaySchedule.freeHours, color: 'hsl(var(--primary))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Today's Overview */}
      <div className="glass-card rounded-2xl p-5 animate-slide-in-right">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
          {todayLabel} — Hoje
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-[100px] h-[100px] ring-glow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={timeData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none">
                  {timeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-game-purple" />
              <span className="text-xs font-body text-muted-foreground">{todaySchedule.sleepHours}h sono</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-game-orange" />
              <span className="text-xs font-body text-muted-foreground">{todaySchedule.busyHours}h ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-body text-muted-foreground">{todaySchedule.freeHours}h livre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Missions */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-primary" /> Missões Pendentes
        </h3>
        <div className="space-y-2.5 mb-3">
          {todayMissions.slice(0, 5).map(m => (
            <div key={m.id} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-[13px] font-body text-foreground truncate flex-1">{m.title}</span>
              {m.estimatedMinutes && (
                <span className="text-[11px] text-muted-foreground font-clean shrink-0">{m.estimatedMinutes}min</span>
              )}
            </div>
          ))}
          {todayMissions.length === 0 && (
            <p className="text-sm text-game-green font-body text-center py-2">✅ Todas concluídas!</p>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] border-t border-border pt-3">
          <span className="text-muted-foreground font-body">{todayMissions.length} pendente(s)</span>
          <span className="text-primary font-body flex items-center gap-1">
            <Clock className="w-3 h-3" /> ~{Math.round(totalEstimated / 60 * 10) / 10}h
          </span>
        </div>
      </div>

      {/* Weekly Mission */}
      {weeklyMission && (
        <div className={`glass-card rounded-2xl p-5 ${weeklyMission.completed ? 'border-game-green/30' : ''}`}>
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-2 uppercase flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-game-purple" /> Missão Altruísta
          </h3>
          <p className="text-sm font-body text-foreground mb-1">{weeklyMission.title}</p>
          {weeklyMission.completed ? (
            <span className="text-xs text-game-green font-body font-semibold">✅ Concluída!</span>
          ) : (
            <span className="text-xs text-primary font-display">+{weeklyMission.xpReward} XP</span>
          )}
        </div>
      )}

      {/* Category Progress */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">Progresso por Área</h3>
        {(['pessoal', 'profissional', 'espiritual'] as const).map(cat => {
          const catMetas = metas.filter(m => m.category === cat);
          const avg = catMetas.length > 0 ? Math.round(catMetas.reduce((s, m) => s + m.progress, 0) / catMetas.length) : 0;
          const config = CATEGORY_CONFIG[cat];
          const bgColor: Record<string, string> = { 'game-purple': 'bg-game-purple', 'game-orange': 'bg-game-orange', 'game-blue': 'bg-game-blue' };
          return (
            <div key={cat} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="font-body text-foreground font-semibold">{config.label}</span>
                <span className="font-clean text-muted-foreground">{avg}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${bgColor[config.color]} transition-all duration-500`} style={{ width: `${avg}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* XP Card */}
      <div className="glass-card rounded-2xl p-5 text-center">
        <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="font-display text-2xl font-bold text-foreground">{stats.xp.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground font-display tracking-[0.2em] uppercase mt-1">XP Total</p>
      </div>
    </div>
  );
}
