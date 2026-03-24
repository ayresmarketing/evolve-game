import { useGame } from '@/contexts/GameContext';
import { Flame, Target, Trophy, Swords } from 'lucide-react';

export function StatsPanel() {
  const { stats, metas } = useGame();
  const activeMetas = metas.filter(m => !m.completed).length;

  const statItems = [
    { label: 'Streak', value: stats.streak, icon: Flame, colorClass: 'text-game-fire' },
    { label: 'Missões', value: stats.totalMissionsCompleted, icon: Swords, colorClass: 'text-game-green' },
    { label: 'Metas Ativas', value: activeMetas, icon: Target, colorClass: 'text-game-blue' },
    { label: 'Conquistas', value: stats.totalMetasCompleted, icon: Trophy, colorClass: 'text-game-gold' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map(item => (
        <div key={item.label} className="bg-gradient-card rounded-lg p-4 shadow-game-card border border-border text-center">
          <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.colorClass}`} />
          <div className="font-display text-2xl font-bold text-foreground">{item.value}</div>
          <div className="text-xs text-muted-foreground font-body uppercase tracking-wider">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
