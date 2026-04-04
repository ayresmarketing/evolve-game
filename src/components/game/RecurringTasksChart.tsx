import { useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function RecurringTasksChart() {
  const { metas, afazeres } = useGame();

  const chartData = useMemo(() => {
    const last14Days: { date: string; label: string; completed: number; missed: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      // Count recurring missions due on this day
      const recurringMissions = metas.flatMap(m => m.missions).filter(mi => {
        if (mi.frequency === 'diária') return true;
        if (mi.frequency?.includes('/semana')) return true;
        return false;
      });

      const recurringAfazeres = afazeres.filter(a => a.isRecurrent);

      const totalRecurring = recurringMissions.length + recurringAfazeres.length;
      const completedMissions = recurringMissions.filter(mi => mi.completedToday && mi.scheduledDay === dateStr).length;
      const completedAfazeres = recurringAfazeres.filter(a => a.completed && a.completedAt?.startsWith(dateStr)).length;

      const completed = completedMissions + completedAfazeres;
      const missed = Math.max(0, totalRecurring - completed);

      last14Days.push({ date: dateStr, label, completed, missed });
    }

    return last14Days;
  }, [metas, afazeres]);

  const hasData = chartData.some(d => d.completed > 0 || d.missed > 0);

  if (!hasData) {
    return (
      <div className="section-card text-center py-6">
        <TrendingUp className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-body">Crie tarefas recorrentes para acompanhar seu progresso</p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-primary" /> Tarefas Recorrentes — Últimos 14 dias
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="Realizadas" />
            <Line type="monotone" dataKey="missed" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" name="Não realizadas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-body text-primary">
          <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Realizadas
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-body text-destructive">
          <span className="w-3 h-0.5 bg-destructive rounded-full inline-block border-dashed" /> Não realizadas
        </span>
      </div>
    </div>
  );
}
