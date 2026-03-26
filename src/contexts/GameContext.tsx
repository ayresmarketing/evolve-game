import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meta, Mission, PlayerStats, Quote, Justificativa, Category, LifeGoal, WeeklyMission, DEFAULT_QUOTES, ALTRUISTIC_MISSIONS, getLevelFromXP, getStreakMultiplier, Etapa } from '@/types/game';

interface GameState {
  metas: Meta[];
  stats: PlayerStats;
  quotes: Quote[];
  justificativas: Justificativa[];
  currentQuoteIndex: number;
  lifeGoals: LifeGoal[];
  weeklyMission: WeeklyMission | null;
  lastActiveDate: string;
}

interface GameContextType extends GameState {
  addMeta: (meta: Omit<Meta, 'id' | 'missions' | 'progress' | 'xpEarned' | 'completed' | 'createdAt' | 'xpTotal'>) => void;
  completeMission: (metaId: string, missionId: string) => void;
  uncompleteMission: (metaId: string, missionId: string) => void;
  completeEtapa: (metaId: string, missionId: string, etapaId: string) => void;
  deleteMeta: (metaId: string) => void;
  deleteMission: (metaId: string, missionId: string) => void;
  addJustificativa: (missionId: string, reason: string) => void;
  toggleQuoteFavorite: (id: string) => void;
  nextQuote: () => void;
  setAlertTone: (tone: PlayerStats['alertTone']) => void;
  addLifeGoal: (goal: Omit<LifeGoal, 'id' | 'createdAt'>) => void;
  deleteLifeGoal: (id: string) => void;
  completeWeeklyMission: () => void;
  updateMissionEstimate: (metaId: string, missionId: string, minutes: number) => void;
  scheduleMission: (metaId: string, missionId: string, time: string, day?: string) => void;
  completeMeta: (metaId: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);
const STORAGE_KEY = 'lifequest_game_state';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateMissions(meta: { title: string; totalDays: number; volume?: string; category: Category; deadline: string }): Mission[] {
  const volumeNum = meta.volume ? parseInt(meta.volume) : null;
  const daily = volumeNum && meta.totalDays > 0 ? Math.ceil(volumeNum / meta.totalDays) : null;
  const startDate = new Date();
  const missions: Mission[] = [];

  // Step 1: Planning mission
  const planningEtapas: Etapa[] = [];
  if (daily && volumeNum) {
    planningEtapas.push(
      { id: generateId(), title: `Defina o material/recurso que será usado`, completed: false, order: 0 },
      { id: generateId(), title: `Calcule: ${volumeNum} unidades ÷ ${meta.totalDays} dias = ${daily} unidades/dia`, completed: false, order: 1 },
      { id: generateId(), title: `Reserve um horário fixo do dia para essa atividade`, completed: false, order: 2 },
      { id: generateId(), title: `Prepare o ambiente (silêncio, materiais, local)`, completed: false, order: 3 },
      { id: generateId(), title: `Comece com apenas 2 minutos — vença a resistência inicial`, completed: false, order: 4 },
    );
  } else {
    planningEtapas.push(
      { id: generateId(), title: `Defina exatamente o que precisa ser feito`, completed: false, order: 0 },
      { id: generateId(), title: `Quebre em pequenas ações diárias (regra dos 2 minutos)`, completed: false, order: 1 },
      { id: generateId(), title: `Escolha o melhor horário — ambiente > motivação`, completed: false, order: 2 },
      { id: generateId(), title: `Empilhe: "Depois de [hábito existente], vou [nova ação]"`, completed: false, order: 3 },
    );
  }

  missions.push({
    id: generateId(), metaId: '',
    title: '📋 Planejamento da meta',
    description: `Organize-se para atingir "${meta.title}" em ${meta.totalDays} dias. Foque em sistemas, não apenas na meta.`,
    frequency: 'única', dailyTarget: 'Concluir planejamento',
    etapas: planningEtapas, completedToday: false, xpReward: 15,
    estimatedMinutes: 20, scheduledDay: startDate.toISOString().split('T')[0],
  });

  // Step 2: Daily execution
  const execDate = new Date(startDate);
  execDate.setDate(execDate.getDate() + 1);
  const execEtapas: Etapa[] = [];

  if (daily) {
    const checkpoints = Math.min(5, meta.totalDays);
    const interval = Math.max(1, Math.floor(meta.totalDays / checkpoints));
    for (let i = 0; i < checkpoints; i++) {
      const dayNum = i * interval + 1;
      if (dayNum <= meta.totalDays) {
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + dayNum);
        const accumulated = daily * dayNum;
        execEtapas.push({
          id: generateId(),
          title: `Dia ${dayNum}: Complete ${daily} unidades (Total: ${accumulated}/${volumeNum}) — ${targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
          completed: false, order: i,
        });
      }
    }
  } else {
    execEtapas.push(
      { id: generateId(), title: 'Dia 1: Iniciar a execução — só comece, sem pressão', completed: false, order: 0 },
      { id: generateId(), title: `Dia ${Math.ceil(meta.totalDays / 2)}: Checkpoint — avalie e ajuste`, completed: false, order: 1 },
      { id: generateId(), title: `Dia ${meta.totalDays}: Finalizar — nunca quebre 2x seguidas`, completed: false, order: 2 },
    );
  }

  missions.push({
    id: generateId(), metaId: '',
    title: daily ? `🎯 ${meta.title} — ${daily} unidades/dia` : `🎯 Executar: ${meta.title}`,
    description: daily
      ? `Complete ${daily} unidades/dia por ${meta.totalDays} dias. Total: ${volumeNum}. Melhore 1% por dia.`
      : `Execute diariamente até ${new Date(meta.deadline).toLocaleDateString('pt-BR')}. Consistência > perfeição.`,
    frequency: 'diária', dailyTarget: daily ? `${daily} unidades` : '1 sessão',
    etapas: execEtapas, completedToday: false, xpReward: 25,
    estimatedMinutes: daily ? Math.max(10, daily * 4) : 30,
    scheduledDay: execDate.toISOString().split('T')[0],
  });

  // Step 3: Weekly review
  const reviewDate = new Date(startDate);
  reviewDate.setDate(reviewDate.getDate() + 7);
  missions.push({
    id: generateId(), metaId: '',
    title: '📊 Revisão semanal de progresso',
    description: `Avalie seu ritmo para "${meta.title}". Foque em sistemas, não resultados.`,
    frequency: 'semanal', dailyTarget: 'Avaliar progresso',
    etapas: [
      { id: generateId(), title: 'Verifique quantas unidades/sessões completou', completed: false, order: 0 },
      { id: generateId(), title: 'Está no ritmo? Se não, ajuste o sistema diário', completed: false, order: 1 },
      { id: generateId(), title: 'O que pode tornar o hábito mais fácil/atraente?', completed: false, order: 2 },
      { id: generateId(), title: 'Anote: que tipo de pessoa estou me tornando?', completed: false, order: 3 },
    ],
    completedToday: false, xpReward: 20, estimatedMinutes: 15,
    scheduledDay: reviewDate.toISOString().split('T')[0],
  });

  // Step 4: Final reflection
  missions.push({
    id: generateId(), metaId: '',
    title: '🏆 Finalização e reflexão',
    description: `Conclua "${meta.title}" e reflita sobre a identidade que construiu.`,
    frequency: 'única', dailyTarget: 'Finalizar meta',
    etapas: [
      { id: generateId(), title: 'Confirme que atingiu o objetivo', completed: false, order: 0 },
      { id: generateId(), title: 'Registre: quem eu era antes vs quem sou agora', completed: false, order: 1 },
      { id: generateId(), title: 'Defina o próximo nível desse hábito', completed: false, order: 2 },
      { id: generateId(), title: 'Celebre sua conquista! 🎉', completed: false, order: 3 },
    ],
    completedToday: false, xpReward: 50, estimatedMinutes: 20,
    scheduledDay: meta.deadline.split('T')[0],
  });

  return missions;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function generateWeeklyMission(): WeeklyMission {
  const template = ALTRUISTIC_MISSIONS[Math.floor(Math.random() * ALTRUISTIC_MISSIONS.length)];
  return { id: generateId(), ...template, completed: false, weekStart: getWeekStart(), xpReward: 100 };
}

const defaultStats: PlayerStats = {
  xp: 0, level: 1, levelName: 'Despertar',
  streak: 0, longestStreak: 0,
  totalMissionsCompleted: 0, totalMetasCompleted: 0,
  badges: [], alertTone: 'equilibrado',
  daysUsed: 0,
  categoryStreaks: { pessoal: 0, profissional: 0, espiritual: 0 },
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      const currentWeek = getWeekStart();
      if (!state.weeklyMission || state.weeklyMission.weekStart !== currentWeek) {
        state.weeklyMission = generateWeeklyMission();
      }
      if (!state.lifeGoals) state.lifeGoals = [];
      if (!state.lastActiveDate) state.lastActiveDate = new Date().toISOString().split('T')[0];
      if (!state.stats.daysUsed) state.stats.daysUsed = 0;
      if (!state.stats.categoryStreaks) state.stats.categoryStreaks = { pessoal: 0, profissional: 0, espiritual: 0 };
      return state;
    }
  } catch {}
  return {
    metas: [], stats: defaultStats, quotes: DEFAULT_QUOTES,
    justificativas: [], currentQuoteIndex: 0,
    lifeGoals: [], weeklyMission: generateWeeklyMission(),
    lastActiveDate: new Date().toISOString().split('T')[0],
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Track daily usage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastActiveDate !== today) {
      setState(prev => ({
        ...prev,
        lastActiveDate: today,
        stats: { ...prev.stats, daysUsed: prev.stats.daysUsed + 1 },
      }));
    }
  }, [state.lastActiveDate]);

  const addMeta = useCallback((metaData: Omit<Meta, 'id' | 'missions' | 'progress' | 'xpEarned' | 'completed' | 'createdAt' | 'xpTotal'>) => {
    const id = generateId();
    const missions = generateMissions({ ...metaData });
    missions.forEach(m => m.metaId = id);
    const xpMultiplier = metaData.linkedLifeGoalId ? 1.5 : 1;
    const totalMissionXP = missions.reduce((s, m) => s + m.xpReward, 0);
    const meta: Meta = {
      ...metaData, id, missions, progress: 0,
      xpTotal: Math.round(totalMissionXP * metaData.totalDays / missions.length * xpMultiplier),
      xpEarned: 0, completed: false, createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, metas: [...prev.metas, meta] }));
  }, []);

  const completeMission = useCallback((metaId: string, missionId: string) => {
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;
      const mission = meta.missions.find(m => m.id === missionId);
      if (!mission || mission.completedToday) return prev;

      const lifeGoalMultiplier = meta.linkedLifeGoalId ? 1.5 : 1;
      const streakMult = getStreakMultiplier(prev.stats.streak);
      const xpGain = Math.round(mission.xpReward * lifeGoalMultiplier * streakMult);

      const metas = prev.metas.map(m => {
        if (m.id !== metaId) return m;
        const missions = m.missions.map(mi => mi.id === missionId ? { ...mi, completedToday: true } : mi);
        const newXpEarned = m.xpEarned + xpGain;
        const progress = m.xpTotal > 0 ? Math.min(100, Math.round(newXpEarned / m.xpTotal * 100)) : 0;
        return { ...m, missions, progress, xpEarned: newXpEarned, completed: progress >= 100 };
      });

      const xp = prev.stats.xp + xpGain;
      const levelInfo = getLevelFromXP(xp);
      const newStreak = prev.stats.streak + 1;

      return {
        ...prev, metas,
        stats: {
          ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
          streak: newStreak, longestStreak: Math.max(newStreak, prev.stats.longestStreak),
          totalMissionsCompleted: prev.stats.totalMissionsCompleted + 1,
          totalMetasCompleted: metas.filter(m => m.completed).length,
        },
      };
    });
  }, []);

  const uncompleteMission = useCallback((metaId: string, missionId: string) => {
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;
      const mission = meta.missions.find(m => m.id === missionId);
      if (!mission || !mission.completedToday) return prev;
      const xpLoss = Math.round(mission.xpReward * (meta.linkedLifeGoalId ? 1.5 : 1));

      const metas = prev.metas.map(m => {
        if (m.id !== metaId) return m;
        const missions = m.missions.map(mi => mi.id === missionId ? { ...mi, completedToday: false } : mi);
        const newXp = Math.max(0, m.xpEarned - xpLoss);
        const progress = m.xpTotal > 0 ? Math.min(100, Math.round(newXp / m.xpTotal * 100)) : 0;
        return { ...m, missions, progress, xpEarned: newXp, completed: false };
      });

      const xp = Math.max(0, prev.stats.xp - xpLoss);
      const levelInfo = getLevelFromXP(xp);

      return {
        ...prev, metas,
        stats: {
          ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
          totalMissionsCompleted: Math.max(0, prev.stats.totalMissionsCompleted - 1),
        },
      };
    });
  }, []);

  const deleteMission = useCallback((metaId: string, missionId: string) => {
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;
      const deletedMission = meta.missions.find(m => m.id === missionId);
      if (!deletedMission) return prev;

      const remainingMissions = meta.missions.filter(m => m.id !== missionId);

      // Redistribute XP from deleted mission among remaining missions
      if (remainingMissions.length > 0 && !deletedMission.completedToday) {
        const xpPerMission = Math.ceil(deletedMission.xpReward / remainingMissions.length);
        remainingMissions.forEach(m => { m.xpReward += xpPerMission; });
      }

      return {
        ...prev,
        metas: prev.metas.map(m => m.id !== metaId ? m : { ...m, missions: remainingMissions }),
      };
    });
  }, []);

  const completeEtapa = useCallback((metaId: string, missionId: string, etapaId: string) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          missions: meta.missions.map(m => {
            if (m.id !== missionId) return m;
            return { ...m, etapas: m.etapas.map(e => e.id === etapaId ? { ...e, completed: !e.completed } : e) };
          }),
        };
      }),
    }));
  }, []);

  const deleteMeta = useCallback((metaId: string) => {
    setState(prev => ({ ...prev, metas: prev.metas.filter(m => m.id !== metaId) }));
  }, []);

  const completeMeta = useCallback((metaId: string) => {
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta || meta.completed) return prev;

      const remainingXP = meta.xpTotal - meta.xpEarned;
      const xp = prev.stats.xp + remainingXP;
      const levelInfo = getLevelFromXP(xp);

      return {
        ...prev,
        metas: prev.metas.map(m => m.id !== metaId ? m : {
          ...m, completed: true, progress: 100, xpEarned: m.xpTotal,
          missions: m.missions.map(mi => ({ ...mi, completedToday: true })),
        }),
        stats: {
          ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
          totalMetasCompleted: prev.stats.totalMetasCompleted + 1,
        },
      };
    });
  }, []);

  const addJustificativa = useCallback((missionId: string, reason: string) => {
    setState(prev => ({
      ...prev,
      justificativas: [...prev.justificativas, { id: generateId(), missionId, reason, date: new Date().toISOString() }],
    }));
  }, []);

  const toggleQuoteFavorite = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      quotes: prev.quotes.map(q => q.id === id ? { ...q, favorited: !q.favorited } : q),
    }));
  }, []);

  const nextQuote = useCallback(() => {
    setState(prev => ({ ...prev, currentQuoteIndex: (prev.currentQuoteIndex + 1) % prev.quotes.length }));
  }, []);

  const setAlertTone = useCallback((tone: PlayerStats['alertTone']) => {
    setState(prev => ({ ...prev, stats: { ...prev.stats, alertTone: tone } }));
  }, []);

  const addLifeGoal = useCallback((goal: Omit<LifeGoal, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      lifeGoals: [...prev.lifeGoals, { ...goal, id: generateId(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const deleteLifeGoal = useCallback((id: string) => {
    setState(prev => ({ ...prev, lifeGoals: prev.lifeGoals.filter(g => g.id !== id) }));
  }, []);

  const completeWeeklyMission = useCallback(() => {
    setState(prev => {
      if (!prev.weeklyMission) return prev;
      const xp = prev.stats.xp + prev.weeklyMission.xpReward;
      const levelInfo = getLevelFromXP(xp);
      return {
        ...prev,
        weeklyMission: { ...prev.weeklyMission, completed: true },
        stats: { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name },
      };
    });
  }, []);

  const updateMissionEstimate = useCallback((metaId: string, missionId: string, minutes: number) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, estimatedMinutes: minutes } : m) };
      }),
    }));
  }, []);

  const scheduleMission = useCallback((metaId: string, missionId: string, time: string, day?: string) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, scheduledTime: time, scheduledDay: day } : m) };
      }),
    }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      addMeta, completeMission, uncompleteMission, completeEtapa, deleteMeta, deleteMission,
      addJustificativa, toggleQuoteFavorite, nextQuote, setAlertTone,
      addLifeGoal, deleteLifeGoal, completeWeeklyMission,
      updateMissionEstimate, scheduleMission, completeMeta,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
