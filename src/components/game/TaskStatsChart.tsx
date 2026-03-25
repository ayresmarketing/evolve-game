import { useGame } from '@/contexts/GameContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, Target } from 'lucide-react';

export function TaskStatsChart() {
  const { metas } = useGame();

  const allMissions = metas.flatMap(m => m.missions);
  const totalCompleted = allMissions.filter(m => m.completedToday).length;
  const totalPending = allMissions.filter(m => !m.completedToday).length;

  const today = new Date().toISOString().split('T')[0];
  const todayMissions = allMissions.filter(m => {
    if (m.scheduledDay === today) return true;
    if (m.frequency === 'diária') return true;
    return false;
  });
  const todayCompleted = todayMissions.filter(m => m.completedToday).length;
  const todayPending = todayMissions.filter(m => !m.completedToday).length;

  if (allMissions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-body">Crie metas para ver estatísticas</p>
      </div>
    );
  }

  const COLORS_GREEN = 'hsl(var(--health-green))';
  const COLORS_MUTED = 'hsl(var(--muted))';

  const renderDonut = (completed: number, pending: number, label: string) => {
    const total = completed + pending;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const data = [
      { name: 'Concluídas', value: completed || 0 },
      { name: 'Pendentes', value: pending || 0 },
    ];

    return (
      <div className="text-center">
        <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-3 uppercase">{label}</p>
        <div className="relative w-[110px] h-[110px] mx-auto ring-glow">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={48} startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value" stroke="none">
                  <Cell fill={COLORS_GREEN} />
                  <Cell fill={COLORS_MUTED} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-full border-4 border-muted" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-xl font-bold text-foreground">{pct}%</span>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[11px] font-body text-game-green">
            <CheckCircle2 className="w-3 h-3" /> {completed}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground">
            <Clock className="w-3 h-3" /> {pending}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-primary mb-5 uppercase">
        Progresso de Tarefas
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {renderDonut(todayCompleted, todayPending, 'Hoje')}
        {renderDonut(totalCompleted, totalPending, 'Total')}
      </div>
    </div>
  );
}
