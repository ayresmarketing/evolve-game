import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';
import { Shield, Zap } from 'lucide-react';

export function XPBar() {
  const { stats } = useGame();
  const { level, name, xpInLevel, xpForNext } = getLevelFromXP(stats.xp);
  const percent = Math.round((xpInLevel / xpForNext) * 100);

  return (
    <div className="bg-gradient-card rounded-lg p-4 shadow-game-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-game-gold" />
          <span className="font-display text-sm tracking-wider text-game-gold">NÍVEL {level}</span>
        </div>
        <span className="font-display text-xs tracking-widest text-muted-foreground uppercase">{name}</span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-xp rounded-full animate-xp-fill transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-muted-foreground font-body">{xpInLevel} / {xpForNext} XP</span>
        <div className="flex items-center gap-1 text-xs text-game-gold">
          <Zap className="w-3 h-3" />
          <span className="font-body font-semibold">{stats.xp} XP total</span>
        </div>
      </div>
    </div>
  );
}
