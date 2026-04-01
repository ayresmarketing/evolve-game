import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'lifequest_hydration';

export function HydrationMini() {
  const [consumed, setConsumed] = useState(0);
  const [goal, setGoal] = useState(2000);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = state.history?.find((h: any) => h.date === today);
        setConsumed(todayEntry?.consumed || 0);
        setGoal(state.dailyGoalMl || 2000);
      }
    } catch {}
  }, []);

  const percent = Math.min(100, Math.round((consumed / goal) * 100));
  const goalReached = consumed >= goal;

  const addWater = (ml: number) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const state = saved ? JSON.parse(saved) : { dailyGoalMl: 2000, todayConsumed: 0, history: [] };
      const today = new Date().toISOString().split('T')[0];
      const newConsumed = (state.todayConsumed || 0) + ml;
      const existingIdx = state.history.findIndex((h: any) => h.date === today);
      if (existingIdx >= 0) {
        state.history[existingIdx].consumed = newConsumed;
      } else {
        state.history.push({ date: today, consumed: newConsumed, goal: state.dailyGoalMl });
      }
      state.todayConsumed = newConsumed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setConsumed(newConsumed);

      if (newConsumed >= state.dailyGoalMl && consumed < state.dailyGoalMl) {
        toast.success('🎉 Meta de hidratação concluída!');
      } else {
        toast.success(`💧 +${ml}ml adicionado`);
      }
    } catch {}
  };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-primary" /> Hidratação
        </h3>
        <span className="text-xs font-body text-primary">{consumed}ml / {goal}ml</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${goalReached ? 'bg-game-green' : 'bg-primary'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {goalReached ? (
        <p className="text-xs font-body text-game-green text-center">✅ Meta concluída!</p>
      ) : (
        <div className="flex gap-2">
          {[250, 500].map(ml => (
            <button key={ml} onClick={() => addWater(ml)}
              className="flex-1 py-2 rounded-xl bg-primary/8 border border-primary/15 text-primary text-xs font-display hover:bg-primary/15 transition-all">
              +{ml}ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
