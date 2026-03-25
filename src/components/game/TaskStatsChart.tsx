import { useGame } from '@/contexts/GameContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle2, Clock, Target } from 'lucide-react';

export function TaskStatsChart() {
  const { metas } = useGame();

  const allMissions = metas.flatMap(m => m.missions);
  const totalCompleted = allMissions.filter(m => m.completedToday).length;
  const totalPending = allMissions.filter(m => !m.completedToday).length;

  // Today's tasks (scheduled for today or daily)
  const today = new Date().toISOString().split('T')[0];
  const todayMissions = allMissions.filter(m => {
    if (m.scheduledDay === today) return true;
    if (m.frequency === 'diária') return true;
    return false;
  });
  const todayCompleted = todayMissions.filter(m => m.completedToday).length;
  const todayPending = todayMissions.filter(m => !m.completedToday).length;

  const totalData = [
    { name: 'Concluídas', value: totalCompleted },
    { name: 'Pendentes', value: totalPending },
  ].filter(d => d.value > 0);

  const todayData = [
    { name: 'Concluídas', value: todayCompleted },
    { name: 'Pendentes', value: todayPending },
  ].filter(d => d.value > 0);

  const COLORS = ['hsl(var(--game-green))', 'hsl(var(--game-orange))'];

  if (allMissions.length === 0) {
    return (
      <div className="bg-card rounded-xl p-5 border border-border shadow-game-card text-center">
        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-body">Crie metas para ver suas estatísticas aqui</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-game-card">
      <h3 className="font-display text-xs tracking-widest text-game-gold mb-4 flex items-center gap-2">
        📊 PROGRESSO DE TAREFAS
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Today */}
        <div>
          <p className="text-[10px] font-display tracking-wider text-muted-foreground text-center mb-2">HOJE</p>
          {todayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={todayData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="value">
                  {todayData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-body">Sem tarefas hoje</p>
            </div>
          )}
          <div className="flex justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] font-body text-game-green">
              <CheckCircle2 className="w-3 h-3" /> {todayCompleted}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-body text-game-orange">
              <Clock className="w-3 h-3" /> {todayPending}
            </span>
          </div>
        </div>

        {/* Total */}
        <div>
          <p className="text-[10px] font-display tracking-wider text-muted-foreground text-center mb-2">TOTAL</p>
          {totalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={totalData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="value">
                  {totalData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-body">Sem tarefas</p>
            </div>
          )}
          <div className="flex justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] font-body text-game-green">
              <CheckCircle2 className="w-3 h-3" /> {totalCompleted}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-body text-game-orange">
              <Clock className="w-3 h-3" /> {totalPending}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
