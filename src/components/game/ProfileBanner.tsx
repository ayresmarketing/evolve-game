import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';
import { Shield, Zap, Flame, Target, Trophy, Swords } from 'lucide-react';

export function ProfileBanner() {
  const { stats, metas } = useGame();
  const { level, name, xpInLevel, xpForNext } = getLevelFromXP(stats.xp);
  const percent = Math.round((xpInLevel / xpForNext) * 100);
  const activeMetas = metas.filter(m => !m.completed).length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-secondary to-card border border-border shadow-game-card">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-game-gold rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-game-purple rounded-full blur-[80px]" />
      </div>

      <div className="relative p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-game-purple via-game-blue to-game-gold flex items-center justify-center shadow-glow-gold">
              <span className="font-display text-3xl text-foreground">{level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-game-green flex items-center justify-center border-2 border-card">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-lg tracking-wider text-foreground">{name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-game-gold/20 text-game-gold text-[10px] font-display tracking-wider">
                LVL {level}
              </span>
            </div>

            {/* XP Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-body">{xpInLevel} / {xpForNext} XP</span>
                <span className="text-game-gold font-body flex items-center gap-1">
                  <Zap className="w-3 h-3" />{stats.xp} XP total
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-xp animate-xp-fill transition-all duration-700" style={{ width: `${percent}%` }} />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex gap-4">
              {[
                { label: 'Streak', value: stats.streak, icon: Flame, color: 'text-game-fire' },
                { label: 'Missões', value: stats.totalMissionsCompleted, icon: Swords, color: 'text-game-green' },
                { label: 'Ativas', value: activeMetas, icon: Target, color: 'text-game-blue' },
                { label: 'Conquistas', value: stats.totalMetasCompleted, icon: Trophy, color: 'text-game-gold' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className={`w-4 h-4 mx-auto mb-0.5 ${s.color}`} />
                  <div className="font-display text-base text-foreground">{s.value}</div>
                  <div className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
