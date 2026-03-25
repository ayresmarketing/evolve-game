import { useGame } from '@/contexts/GameContext';
import { Heart, CheckCircle2, Circle, Gift, Sparkles } from 'lucide-react';

export function WeeklyMission() {
  const { weeklyMission, completeWeeklyMission } = useGame();

  if (!weeklyMission) return null;

  return (
    <div className="space-y-4">
      <div className={`relative overflow-hidden rounded-2xl border shadow-game-card ${
        weeklyMission.completed 
          ? 'bg-game-green/10 border-game-green/30' 
          : 'bg-gradient-to-br from-game-purple/10 via-card to-game-blue/10 border-primary/20'
      }`}>
        {/* Decorative */}
        {!weeklyMission.completed && (
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-game-purple rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-game-blue rounded-full blur-[60px]" />
          </div>
        )}

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              weeklyMission.completed 
                ? 'bg-game-green/20' 
                : 'bg-gradient-to-br from-game-purple/30 to-game-blue/30'
            }`}>
              <Heart className={`w-7 h-7 ${weeklyMission.completed ? 'text-game-green fill-game-green' : 'text-game-purple'}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-display tracking-widest text-game-gold">MISSÃO SEMANAL OBRIGATÓRIA</span>
                <Sparkles className="w-3 h-3 text-game-gold" />
              </div>
              <h3 className="font-display text-base tracking-wider text-foreground mb-1">{weeklyMission.title}</h3>
              <p className="text-sm font-body text-muted-foreground mb-4">{weeklyMission.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-game-gold" />
                  <span className="text-sm font-body text-game-gold font-semibold">+{weeklyMission.xpReward} XP</span>
                </div>

                {weeklyMission.completed ? (
                  <div className="flex items-center gap-2 text-game-green">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-display text-xs tracking-wider">CONCLUÍDA!</span>
                  </div>
                ) : (
                  <button
                    onClick={completeWeeklyMission}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-game-purple to-game-blue text-foreground font-display text-xs tracking-wider hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <Circle className="w-4 h-4" />
                    COMPLETAR MISSÃO
                  </button>
                )}
              </div>
            </div>
          </div>

          {!weeklyMission.completed && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-body italic text-center">
                "Quem ajuda os outros, ajuda a si mesmo. Evolução real inclui impactar vidas."
              </p>
            </div>
          )}
        </div>
      </div>

      {weeklyMission.completed && (
        <div className="text-center py-4">
          <p className="text-sm font-body text-game-green">🎉 Você completou sua missão altruísta desta semana!</p>
          <p className="text-xs text-muted-foreground font-body mt-1">Uma nova missão será gerada na próxima semana.</p>
        </div>
      )}
    </div>
  );
}
