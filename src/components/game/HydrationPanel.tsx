import { useState, useEffect, useCallback } from 'react';
import { Droplets, Plus, Minus, Trophy, TrendingUp } from 'lucide-react';

interface HydrationDay {
  date: string;
  consumed: number;
  goal: number;
}

interface HydrationState {
  dailyGoalMl: number;
  todayConsumed: number;
  history: HydrationDay[];
}

const STORAGE_KEY = 'lifequest_hydration';

function loadHydration(): HydrationState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as HydrationState;
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = state.history.find(h => h.date === today);
      return { ...state, todayConsumed: todayEntry?.consumed || 0 };
    }
  } catch {}
  return { dailyGoalMl: 2000, todayConsumed: 0, history: [] };
}

export function HydrationPanel() {
  const [state, setState] = useState<HydrationState>(loadHydration);
  const [customAmount, setCustomAmount] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const percent = Math.min(100, Math.round((state.todayConsumed / state.dailyGoalMl) * 100));
  const remaining = Math.max(0, state.dailyGoalMl - state.todayConsumed);
  const goalReached = state.todayConsumed >= state.dailyGoalMl;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addWater = useCallback((ml: number) => {
    setState(prev => {
      const newConsumed = prev.todayConsumed + ml;
      const existingIdx = prev.history.findIndex(h => h.date === today);
      const history = [...prev.history];
      if (existingIdx >= 0) {
        history[existingIdx] = { ...history[existingIdx], consumed: newConsumed };
      } else {
        history.push({ date: today, consumed: newConsumed, goal: prev.dailyGoalMl });
      }
      return { ...prev, todayConsumed: newConsumed, history };
    });
  }, [today]);

  const setGoal = () => {
    const val = parseFloat(goalInput);
    if (val > 0) {
      setState(prev => ({ ...prev, dailyGoalMl: Math.round(val * 1000) }));
      setEditingGoal(false);
    }
  };

  // Last 7 days history
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = state.history.find(h => h.date === dateStr);
    return {
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      consumed: entry?.consumed || 0,
      goal: entry?.goal || state.dailyGoalMl,
      reached: (entry?.consumed || 0) >= (entry?.goal || state.dailyGoalMl),
    };
  });

  const consistencyDays = last7Days.filter(d => d.reached).length;

  return (
    <div className="space-y-5">
      {/* Main hydration card */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Droplets className="w-6 h-6 text-game-blue" />
          <h2 className="font-display text-sm tracking-[0.2em] text-foreground uppercase">Hidratação</h2>
        </div>

        {/* Circular progress */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--spiritual-blue))" strokeWidth="12"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - percent / 100)}`}
              className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {goalReached ? (
              <>
                <Trophy className="w-8 h-8 text-game-gold mb-1" />
                <span className="font-display text-xs text-game-gold tracking-wider">CONCLUÍDA!</span>
              </>
            ) : (
              <>
                <Droplets className="w-6 h-6 text-game-blue mb-1" />
                <span className="font-display text-2xl font-bold text-foreground">{percent}%</span>
                <span className="text-xs text-muted-foreground font-body">{state.todayConsumed}ml / {state.dailyGoalMl}ml</span>
              </>
            )}
          </div>
        </div>

        {goalReached && (
          <div className="mb-4 p-3 rounded-xl bg-game-green/10 border border-game-green/20">
            <p className="text-sm font-body text-game-green font-semibold">🎉 Meta de hidratação concluída hoje!</p>
            <p className="text-xs text-muted-foreground font-body mt-1">Total: {state.todayConsumed}ml</p>
          </div>
        )}

        {!goalReached && (
          <p className="text-sm text-muted-foreground font-body mb-4">
            Faltam <span className="text-foreground font-semibold">{remaining}ml</span> para sua meta
          </p>
        )}

        {/* Quick add buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[250, 500, 1000].map(ml => (
            <button key={ml} onClick={() => addWater(ml)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-game-blue/10 border border-game-blue/20 text-game-blue hover:bg-game-blue/20 transition-all">
              <Plus className="w-4 h-4" />
              <span className="font-display text-sm font-bold">{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}</span>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Outro valor (ml)" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-game-blue" />
          <button onClick={() => { const v = parseInt(customAmount); if (v > 0) { addWater(v); setCustomAmount(''); } }}
            className="px-4 py-2.5 rounded-xl bg-game-blue text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 transition-all">
            Adicionar
          </button>
        </div>

        {/* Goal setting */}
        <div className="mt-5 pt-4 border-t border-border">
          {!editingGoal ? (
            <button onClick={() => { setEditingGoal(true); setGoalInput(String(state.dailyGoalMl / 1000)); }}
              className="text-xs text-muted-foreground font-body hover:text-foreground transition-colors">
              Meta diária: <span className="text-foreground font-semibold">{state.dailyGoalMl / 1000}L</span> — clique para alterar
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <input type="number" step="0.5" min="0.5" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                className="w-24 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-body text-foreground text-center focus:outline-none focus:ring-1 focus:ring-game-blue" />
              <span className="text-sm text-muted-foreground font-body">litros</span>
              <button onClick={setGoal} className="px-3 py-1.5 rounded-lg bg-game-blue/10 text-game-blue text-xs font-display hover:bg-game-blue/20">Salvar</button>
              <button onClick={() => setEditingGoal(false)} className="px-3 py-1.5 rounded-lg text-muted-foreground text-xs">Cancelar</button>
            </div>
          )}
        </div>
      </div>

      {/* Weekly history */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-game-blue" /> Histórico Semanal
          </h3>
          <span className="text-xs font-body text-game-blue">{consistencyDays}/7 dias atingidos</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map(day => {
            const dayPercent = Math.min(100, Math.round((day.consumed / day.goal) * 100));
            return (
              <div key={day.date} className="text-center">
                <span className="text-[10px] font-body text-muted-foreground capitalize">{day.label}</span>
                <div className="relative h-20 bg-muted rounded-lg mt-1 overflow-hidden">
                  <div className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 ${day.reached ? 'bg-game-blue' : 'bg-game-blue/40'}`}
                    style={{ height: `${dayPercent}%` }} />
                </div>
                <span className="text-[9px] font-body text-muted-foreground mt-1 block">{dayPercent}%</span>
                {day.reached && <span className="text-[10px]">💧</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
