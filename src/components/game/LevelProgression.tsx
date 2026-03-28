import { useGame } from '@/contexts/GameContext';
import { LEVELS, getLevelFromXP, checkLevelRequirements } from '@/types/game';
import { Lock, CheckCircle2, ChevronRight, Zap, Flame, Target, Trophy } from 'lucide-react';

export function LevelProgression() {
  const { stats } = useGame();
  const current = getLevelFromXP(stats.xp);
  const requirements = checkLevelRequirements(stats);

  return (
    <div className="space-y-6">
      {/* Current Level Hero */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/8 rounded-full blur-[80px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-3xl shadow-glow-cyan">
              {current.icon}
            </div>
            <div>
              <p className="text-[10px] font-display tracking-[0.25em] text-muted-foreground uppercase">Seu Nível Atual</p>
              <h2 className="font-display text-2xl font-bold text-foreground text-glow-cyan">{current.name}</h2>
              <p className="text-sm font-body text-primary">{stats.xp.toLocaleString()} XP Total</p>
            </div>
          </div>

          {current.level < 9 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-body mb-2">
                <span className="text-muted-foreground">Progresso para {LEVELS[current.level].name}</span>
                <span className="text-primary font-semibold">{Math.round((current.xpInLevel / current.xpForNext) * 100)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-accent transition-all duration-1000 animate-xp-fill"
                  style={{ width: `${Math.min(100, (current.xpInLevel / current.xpForNext) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-body mt-1">
                <span>{current.xpInLevel.toLocaleString()} XP</span>
                <span>{current.xpForNext.toLocaleString()} XP</span>
              </div>
            </div>
          )}

          {!requirements.meetsRequirements && requirements.missing.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-game-gold/5 border border-game-gold/20">
              <p className="text-[10px] font-display tracking-[0.2em] text-game-gold uppercase mb-2">⚠️ Requisitos Pendentes</p>
              {requirements.missing.map((req, i) => (
                <p key={i} className="text-xs font-body text-game-gold/80 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 shrink-0" /> {req}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
            {[
              { icon: Target, label: 'Tarefas', value: stats.totalMissionsCompleted, color: 'text-primary' },
              { icon: Flame, label: 'Consistência', value: stats.streak, color: 'text-game-fire' },
              { icon: Trophy, label: 'Melhor', value: stats.longestStreak, color: 'text-game-gold' },
              { icon: Zap, label: 'Dias', value: stats.daysUsed, color: 'text-game-cyan' },
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

      {/* All Levels */}
      <div className="space-y-4">
        <h2 className="font-display text-xs tracking-[0.25em] text-muted-foreground uppercase">Todos os Níveis</h2>

        {LEVELS.map((lvl) => {
          const isCurrentLevel = current.level === lvl.level;
          const isUnlocked = stats.xp >= lvl.xpMin;
          const isNext = current.level + 1 === lvl.level;

          let progressPercent = 0;
          if (isUnlocked && !isCurrentLevel) progressPercent = 100;
          else if (isCurrentLevel) progressPercent = Math.round((current.xpInLevel / current.xpForNext) * 100);

          const taskProgress = Math.min(100, Math.round((stats.totalMissionsCompleted / lvl.tasksRequired) * 100));
          const consistencyProgress = lvl.streakRequired > 0 ? Math.min(100, Math.round((stats.longestStreak / lvl.streakRequired) * 100)) : 100;
          const daysProgress = Math.min(100, Math.round((stats.daysUsed / lvl.daysRequired) * 100));

          return (
            <div
              key={lvl.level}
              className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                isCurrentLevel ? 'ring-2 ring-primary/50 shadow-glow-cyan' :
                isNext ? 'ring-1 ring-game-gold/30' :
                isUnlocked ? 'opacity-80' : 'opacity-50'
              }`}
            >
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    isUnlocked ? 'bg-gradient-accent shadow-glow-cyan' : 'bg-secondary'
                  }`}>
                    {isUnlocked ? lvl.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">NÍVEL {lvl.level}</span>
                      {isCurrentLevel && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-display tracking-wider animate-pulse-glow">ATUAL</span>
                      )}
                      {isNext && (
                        <span className="px-2 py-0.5 rounded-full bg-game-gold/15 text-game-gold text-[9px] font-display tracking-wider">PRÓXIMO</span>
                      )}
                      {isUnlocked && !isCurrentLevel && (
                        <CheckCircle2 className="w-4 h-4 text-game-green" />
                      )}
                    </div>
                    <h3 className={`font-display text-xl font-bold ${isCurrentLevel ? 'text-primary text-glow-cyan' : 'text-foreground'}`}>
                      {lvl.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {lvl.xpMax === Infinity ? `${lvl.xpMin.toLocaleString()}+ XP` : `${lvl.xpMin.toLocaleString()} — ${lvl.xpMax.toLocaleString()} XP`}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-body text-secondary-foreground mb-4 leading-relaxed">{lvl.description}</p>

                <div className="mb-4">
                  <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase mb-2">O que você precisa fazer:</p>
                  <div className="space-y-1.5">
                    {lvl.requirements.map((req, i) => {
                      let met = false;
                      if (i === 0) met = stats.totalMissionsCompleted >= lvl.tasksRequired;
                      else if (i === 1 && lvl.streakRequired > 0) met = stats.longestStreak >= lvl.streakRequired;
                      else if (i === 1 && lvl.daysRequired > 0) met = stats.daysUsed >= lvl.daysRequired;
                      else met = isUnlocked;

                      return (
                        <div key={i} className="flex items-center gap-2">
                          {met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-game-green shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                          )}
                          <span className={`text-xs font-body ${met ? 'text-game-green' : 'text-secondary-foreground'}`}>{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(isCurrentLevel || isNext) && (
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                        <span>Tarefas: {stats.totalMissionsCompleted}/{lvl.tasksRequired}</span>
                        <span>{taskProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${taskProgress}%` }} />
                      </div>
                    </div>
                    {lvl.streakRequired > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                          <span>Consistência: {stats.longestStreak}/{lvl.streakRequired}</span>
                          <span>{consistencyProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-game-fire rounded-full transition-all" style={{ width: `${consistencyProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                        <span>Dias de uso: {stats.daysUsed}/{lvl.daysRequired}</span>
                        <span>{daysProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-game-gold rounded-full transition-all" style={{ width: `${daysProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <p className="text-[10px] font-display tracking-[0.2em] text-primary uppercase mb-1">Quem você se torna:</p>
                  <p className="text-sm font-body text-foreground leading-relaxed">{lvl.identity}</p>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-game-gold/5 border border-game-gold/15">
                  <p className="text-[10px] font-display tracking-[0.2em] text-game-gold uppercase mb-1">💡 Motivação:</p>
                  <p className="text-sm font-body text-game-gold/90 italic leading-relaxed">"{lvl.motivation}"</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
