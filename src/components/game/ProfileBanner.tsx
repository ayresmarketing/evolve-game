import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';
import { Zap, Flame, Target, Trophy, Swords, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function ProfileBanner() {
  const { stats, metas } = useGame();
  const { level, name, xpInLevel, xpForNext } = getLevelFromXP(stats.xp);
  const percent = Math.round((xpInLevel / xpForNext) * 100);
  const activeMetas = metas.filter(m => !m.completed).length;

  const winData = [
    { name: 'Progress', value: percent },
    { name: 'Remaining', value: 100 - percent },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/8 rounded-full blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-game-purple/8 rounded-full blur-[60px]" />
      </div>

      <div className="relative p-6">
        <h2 className="font-display text-xs tracking-[0.25em] text-muted-foreground mb-5 uppercase">Stats Overview</h2>

        <div className="flex items-start gap-6">
          {/* Left: Stats */}
          <div className="flex-1 space-y-4">
            {[
              { label: 'XP Total', value: stats.xp.toLocaleString(), color: 'text-foreground' },
              { label: 'Nível', value: level, color: 'text-foreground' },
              { label: 'Streak', value: `${stats.streak} dias`, color: 'text-foreground' },
              { label: 'Missões', value: stats.totalMissionsCompleted, color: 'text-foreground' },
              { label: 'Metas Ativas', value: activeMetas, color: 'text-foreground' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[11px] text-muted-foreground font-body">{s.label}</p>
                <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Center: Ring chart */}
          <div className="flex flex-col items-center">
            <div className="relative w-[160px] h-[160px] ring-glow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={72}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-foreground">{percent}%</span>
                <span className="text-[10px] text-primary font-body font-semibold tracking-wider uppercase">Nível {level}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-body mt-2">{xpInLevel} / {xpForNext} XP</p>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
          {[
            { label: 'Streak', value: stats.streak, icon: Flame, color: 'text-game-fire' },
            { label: 'Missões', value: stats.totalMissionsCompleted, icon: Swords, color: 'text-game-green' },
            { label: 'Ativas', value: activeMetas, icon: Target, color: 'text-game-cyan' },
            { label: 'Conquistas', value: stats.totalMetasCompleted, icon: Trophy, color: 'text-game-gold' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
