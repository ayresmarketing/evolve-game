import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP, LEVELS } from '@/types/game';
import { Trophy, Flame, Target, Zap, Crown } from 'lucide-react';

export function RankingPanel() {
  const { stats } = useGame();
  const { level, name, icon } = getLevelFromXP(stats.xp);

  // Simulated leaderboard (single player for now, shows progression)
  const achievements = [
    { label: 'XP Total', value: stats.xp.toLocaleString(), icon: Zap, color: 'text-primary' },
    { label: 'Nível', value: `${icon} ${name}`, icon: Crown, color: 'text-game-gold' },
    { label: 'Melhor Streak', value: `${stats.longestStreak} dias`, icon: Flame, color: 'text-game-fire' },
    { label: 'Missões Completas', value: stats.totalMissionsCompleted, icon: Target, color: 'text-game-green' },
    { label: 'Metas Concluídas', value: stats.totalMetasCompleted, icon: Trophy, color: 'text-game-purple' },
    { label: 'Dias de Uso', value: stats.daysUsed, icon: Target, color: 'text-game-blue' },
  ];

  return (
    <div className="space-y-5">
      {/* Personal ranking card */}
      <div className="glass-card rounded-2xl p-6 text-center animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-game-gold to-game-orange flex items-center justify-center text-4xl mb-4 shadow-glow-gold">
          {icon}
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-1">Jogador</h2>
        <p className="font-display text-sm text-primary tracking-wider">Level {level} — {name}</p>
        <p className="text-xs text-muted-foreground font-body mt-2">{stats.xp.toLocaleString()} XP acumulados</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map(a => (
          <div key={a.label} className="glass-card rounded-xl p-4 text-center">
            <a.icon className={`w-5 h-5 mx-auto mb-2 ${a.color}`} />
            <p className="font-display text-lg font-bold text-foreground">{a.value}</p>
            <p className="text-[10px] text-muted-foreground font-display tracking-wider uppercase mt-1">{a.label}</p>
          </div>
        ))}
      </div>

      {/* Level milestones */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🏅 Marcos Alcançados</h3>
        <div className="space-y-3">
          {LEVELS.map(lvl => {
            const reached = stats.xp >= lvl.xpMin;
            return (
              <div key={lvl.level} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                reached ? 'bg-game-green/5 border-game-green/15' : 'bg-secondary/10 border-border opacity-50'
              }`}>
                <span className="text-xl">{lvl.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-body font-bold ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>{lvl.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{lvl.xpMin.toLocaleString()} XP</p>
                </div>
                {reached && <span className="text-game-green text-xs font-display">✅</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🎖️ Conquistas</h3>
          <div className="grid grid-cols-3 gap-3">
            {stats.badges.map(badge => (
              <div key={badge.id} className="text-center p-3 rounded-xl bg-secondary/20">
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-[10px] font-body text-foreground mt-1">{badge.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
