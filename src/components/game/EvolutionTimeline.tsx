import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP, LEVELS } from '@/types/game';

export function EvolutionTimeline() {
  const { stats } = useGame();
  const { level } = getLevelFromXP(stats.xp);

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-5 uppercase">
        🧬 Sua Evolução — Quem você está se tornando
      </h3>

      <div className="relative">
        {/* Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {LEVELS.map(lvl => {
            const reached = stats.xp >= lvl.xpMin;
            const isCurrent = lvl.level === level;

            return (
              <div key={lvl.level} className="relative flex items-start gap-4 pl-2">
                {/* Node */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                  isCurrent ? 'bg-primary shadow-glow-cyan ring-2 ring-primary/40' :
                  reached ? 'bg-game-green/20 border-2 border-game-green' :
                  'bg-muted border-2 border-border'
                }`}>
                  {lvl.icon}
                </div>

                <div className={`flex-1 pb-2 ${!reached && !isCurrent ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-xs font-bold tracking-wider ${isCurrent ? 'text-primary' : reached ? 'text-game-green' : 'text-muted-foreground'}`}>
                      {lvl.name}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-display tracking-wider animate-pulse-glow">VOCÊ ESTÁ AQUI</span>
                    )}
                    {reached && !isCurrent && (
                      <span className="text-[9px] text-game-green font-body">✅ Alcançado</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
                    {isCurrent || reached ? lvl.identity : lvl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
