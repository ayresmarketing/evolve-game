import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meta, Mission, PlayerStats, Quote, Justificativa, Category, LifeGoal, WeeklyMission, Afazer, DEFAULT_QUOTES, ALTRUISTIC_MISSIONS, getLevelFromXP, getStreakMultiplier, Etapa } from '@/types/game';

interface ManualMissionInput {
  title: string;
  estimatedMinutes: number;
}

interface AddMetaInput extends Omit<Meta, 'id' | 'missions' | 'progress' | 'xpEarned' | 'completed' | 'createdAt' | 'xpTotal'> {
  manualMissions?: ManualMissionInput[];
  taskMode?: 'auto' | 'manual';
}

interface GameState {
  metas: Meta[];
  stats: PlayerStats;
  quotes: Quote[];
  justificativas: Justificativa[];
  currentQuoteIndex: number;
  lifeGoals: LifeGoal[];
  weeklyMission: WeeklyMission | null;
  lastActiveDate: string;
  afazeres: Afazer[];
}

interface GameContextType extends GameState {
  addMeta: (meta: AddMetaInput) => void;
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
  scheduleAllMissions: (metaId: string) => void;
  completeMeta: (metaId: string) => void;
  startMissionTimer: (metaId: string, missionId: string) => void;
  stopMissionTimer: (metaId: string, missionId: string) => void;
  addAfazer: (afazer: Omit<Afazer, 'id' | 'completed' | 'xpReward' | 'createdAt'>) => void;
  completeAfazer: (id: string) => void;
  uncompleteAfazer: (id: string) => void;
  deleteAfazer: (id: string) => void;
  startAfazerTimer: (id: string) => void;
  stopAfazerTimer: (id: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);
const STORAGE_KEY = 'lifequest_game_state';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateMissions(meta: { title: string; totalDays: number; mainAction: string; weeklyFrequency: number; category: Category; deadline: string }, manualMissions?: ManualMissionInput[]): Mission[] {
  const startDate = new Date();
  const missions: Mission[] = [];

  // If manual missions are provided, use those
  if (manualMissions && manualMissions.length > 0) {
    const interval = Math.max(1, Math.floor(meta.totalDays / manualMissions.length));
    manualMissions.forEach((m, idx) => {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + idx * interval);
      missions.push({
        id: generateId(), metaId: '',
        title: m.title,
        description: `Tarefa para "${meta.title}"`,
        frequency: `${meta.weeklyFrequency}x/semana`,
        dailyTarget: m.title,
        etapas: [],
        completedToday: false,
        xpReward: Math.round(20 + (idx * 5)),
        estimatedMinutes: m.estimatedMinutes,
        scheduledDay: scheduledDate.toISOString().split('T')[0],
      });
    });
    return missions;
  }

  // Auto-generated missions
  const totalSessions = Math.floor(meta.totalDays / 7 * meta.weeklyFrequency);

  // Step 1: Planning
  missions.push({
    id: generateId(), metaId: '',
    title: '📋 Planejamento estratégico',
    description: `Organize-se para atingir "${meta.title}" em ${meta.totalDays} dias. Defina seu sistema diário.`,
    frequency: 'única', dailyTarget: 'Concluir planejamento',
    etapas: [
      { id: generateId(), title: `Defina exatamente o que precisa ser feito para "${meta.title}"`, completed: false, order: 0 },
      { id: generateId(), title: `Quebre em ações menores: "${meta.mainAction}" será sua ação principal`, completed: false, order: 1 },
      { id: generateId(), title: `Escolha os ${meta.weeklyFrequency} dias da semana para executar`, completed: false, order: 2 },
      { id: generateId(), title: `Reserve o horário ideal — ambiente > motivação`, completed: false, order: 3 },
      { id: generateId(), title: `Comece com 2 minutos — vença a resistência inicial`, completed: false, order: 4 },
    ],
    completedToday: false, xpReward: 15, estimatedMinutes: 20,
    scheduledDay: startDate.toISOString().split('T')[0],
  });

  // Step 2: Execution with checkpoints
  const execDate = new Date(startDate);
  execDate.setDate(execDate.getDate() + 1);
  const checkpoints = Math.min(5, Math.max(2, Math.floor(meta.totalDays / 7)));
  const interval = Math.max(1, Math.floor(meta.totalDays / checkpoints));

  const execEtapas: Etapa[] = [];
  for (let i = 0; i < checkpoints; i++) {
    const dayNum = i * interval + 1;
    if (dayNum <= meta.totalDays) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + dayNum);
      const sessionsCompleted = Math.floor(dayNum / 7 * meta.weeklyFrequency);
      execEtapas.push({
        id: generateId(),
        title: `Dia ${dayNum} (${targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}): ${sessionsCompleted}/${totalSessions} sessões — ${meta.mainAction}`,
        completed: false, order: i,
      });
    }
  }

  missions.push({
    id: generateId(), metaId: '',
    title: `🎯 ${meta.mainAction}`,
    description: `Execute "${meta.mainAction}" ${meta.weeklyFrequency}x por semana. Total: ~${totalSessions} sessões em ${meta.totalDays} dias.`,
    frequency: `${meta.weeklyFrequency}x/semana`, dailyTarget: meta.mainAction,
    etapas: execEtapas, completedToday: false, xpReward: 25, estimatedMinutes: 30,
    scheduledDay: execDate.toISOString().split('T')[0],
  });

  // Step 3: Weekly review
  const reviewDate = new Date(startDate);
  reviewDate.setDate(reviewDate.getDate() + 7);
  missions.push({
    id: generateId(), metaId: '',
    title: '📊 Revisão semanal',
    description: `Avalie seu progresso em "${meta.title}". Ajuste o sistema, não a meta.`,
    frequency: 'semanal', dailyTarget: 'Avaliar progresso',
    etapas: [
      { id: generateId(), title: 'Quantas sessões completei esta semana?', completed: false, order: 0 },
      { id: generateId(), title: 'Estou no ritmo? Se não, o que posso simplificar?', completed: false, order: 1 },
      { id: generateId(), title: 'O que pode tornar isso mais fácil/atraente?', completed: false, order: 2 },
      { id: generateId(), title: 'Quem estou me tornando com esse hábito?', completed: false, order: 3 },
    ],
    completedToday: false, xpReward: 20, estimatedMinutes: 15,
    scheduledDay: reviewDate.toISOString().split('T')[0],
  });

  // Step 4: Reflection
  missions.push({
    id: generateId(), metaId: '',
    title: '🏆 Finalização e reflexão',
    description: `Conclua "${meta.title}" e reflita sobre quem você se tornou.`,
    frequency: 'única', dailyTarget: 'Finalizar meta',
    etapas: [
      { id: generateId(), title: 'Confirme que atingiu o objetivo', completed: false, order: 0 },
      { id: generateId(), title: 'Registre: quem eu era vs quem sou agora', completed: false, order: 1 },
      { id: generateId(), title: 'Defina o próximo nível desse hábito', completed: false, order: 2 },
      { id: generateId(), title: 'Celebre! 🎉', completed: false, order: 3 },
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
      if (!state.afazeres) state.afazeres = [];
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
    afazeres: [],
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastActiveDate !== today) {
      setState(prev => ({
        ...prev, lastActiveDate: today,
        stats: { ...prev.stats, daysUsed: prev.stats.daysUsed + 1 },
      }));
    }
  }, [state.lastActiveDate]);

  const addMeta = useCallback((metaData: AddMetaInput) => {
    const id = generateId();
    const { manualMissions: manualMissionsInput, taskMode, ...metaBase } = metaData;
    const missions = generateMissions(
      { ...metaBase },
      taskMode === 'manual' ? manualMissionsInput : undefined
    );
    missions.forEach(m => m.metaId = id);
    const xpMultiplier = metaBase.linkedLifeGoalId ? 1.5 : 1;
    const totalMissionXP = missions.reduce((s, m) => s + m.xpReward, 0);
    const meta: Meta = {
      ...metaBase, id, missions, progress: 0,
      xpTotal: Math.round(totalMissionXP * metaBase.totalDays / missions.length * xpMultiplier),
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
        stats: { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMissionsCompleted: Math.max(0, prev.stats.totalMissionsCompleted - 1) },
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
      if (remainingMissions.length > 0 && !deletedMission.completedToday) {
        const xpPerMission = Math.ceil(deletedMission.xpReward / remainingMissions.length);
        remainingMissions.forEach(m => { m.xpReward += xpPerMission; });
      }
      return { ...prev, metas: prev.metas.map(m => m.id !== metaId ? m : { ...m, missions: remainingMissions }) };
    });
  }, []);

  const completeEtapa = useCallback((metaId: string, missionId: string, etapaId: string) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => {
          if (m.id !== missionId) return m;
          return { ...m, etapas: m.etapas.map(e => e.id === etapaId ? { ...e, completed: !e.completed } : e) };
        }) };
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
        stats: { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMetasCompleted: prev.stats.totalMetasCompleted + 1 },
      };
    });
  }, []);

  const startMissionTimer = useCallback((metaId: string, missionId: string) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, timerStartedAt: new Date().toISOString() } : m) };
      }),
    }));
  }, []);

  const stopMissionTimer = useCallback((metaId: string, missionId: string) => {
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => {
          if (m.id !== missionId || !m.timerStartedAt) return m;
          const actualMinutes = Math.round((Date.now() - new Date(m.timerStartedAt).getTime()) / 60000);
          return { ...m, timerCompletedAt: new Date().toISOString(), actualMinutes };
        }) };
      }),
    }));
  }, []);

  const addJustificativa = useCallback((missionId: string, reason: string) => {
    setState(prev => ({
      ...prev,
      justificativas: [...prev.justificativas, { id: generateId(), missionId, reason, date: new Date().toISOString() }],
    }));
  }, []);

  const toggleQuoteFavorite = useCallback((id: string) => {
    setState(prev => ({ ...prev, quotes: prev.quotes.map(q => q.id === id ? { ...q, favorited: !q.favorited } : q) }));
  }, []);

  const nextQuote = useCallback(() => {
    setState(prev => ({ ...prev, currentQuoteIndex: (prev.currentQuoteIndex + 1) % prev.quotes.length }));
  }, []);

  const setAlertTone = useCallback((tone: PlayerStats['alertTone']) => {
    setState(prev => ({ ...prev, stats: { ...prev.stats, alertTone: tone } }));
  }, []);

  const addLifeGoal = useCallback((goal: Omit<LifeGoal, 'id' | 'createdAt'>) => {
    setState(prev => ({ ...prev, lifeGoals: [...prev.lifeGoals, { ...goal, id: generateId(), createdAt: new Date().toISOString() }] }));
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

  const scheduleAllMissions = useCallback((metaId: string) => {
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;

      const today = new Date();
      let currentDay = new Date(today);
      let currentMinute = today.getHours() * 60 + today.getMinutes() + 15;

      const updatedMissions = meta.missions.map(mission => {
        if (mission.completedToday || mission.scheduledTime) return mission;
        const est = mission.estimatedMinutes || 30;

        // Simple scheduling: stack tasks starting from now
        if (currentMinute + est > 22 * 60) {
          // Move to next day
          currentDay.setDate(currentDay.getDate() + 1);
          currentMinute = 8 * 60;
        }

        const h = Math.floor(currentMinute / 60);
        const m = currentMinute % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const day = currentDay.toISOString().split('T')[0];
        currentMinute += est + 15; // 15min break between tasks

        return { ...mission, scheduledTime: time, scheduledDay: day };
      });

      return {
        ...prev,
        metas: prev.metas.map(m => m.id !== metaId ? m : { ...m, missions: updatedMissions }),
      };
    });
  }, []);

  // Afazeres
  const addAfazer = useCallback((data: Omit<Afazer, 'id' | 'completed' | 'xpReward' | 'createdAt'>) => {
    const xpReward = data.linkedMetaId ? 10 : 5;
    const afazer: Afazer = {
      ...data, id: generateId(), completed: false, xpReward, createdAt: new Date().toISOString(),
    };

    setState(prev => {
      let newState = { ...prev, afazeres: [...prev.afazeres, afazer] };

      // If linked to a meta, add as a mission inside the best-fit mission group and redistribute free XP
      if (data.linkedMetaId) {
        const meta = newState.metas.find(m => m.id === data.linkedMetaId);
        if (meta) {
          const newMission: Mission = {
            id: generateId(),
            metaId: meta.id,
            title: data.title,
            description: data.description || `Tarefa adicionada manualmente`,
            frequency: data.isRecurrent ? `recorrente` : 'única',
            dailyTarget: data.title,
            etapas: [],
            completedToday: false,
            xpReward: 0, // will be set by redistribution
            estimatedMinutes: data.estimatedMinutes,
          };

          const updatedMissions = [...meta.missions, newMission];
          // Redistribute remaining XP evenly among incomplete missions
          const incompleteMissions = updatedMissions.filter(m => !m.completedToday);
          const earnedXP = meta.xpEarned;
          const freeXP = meta.xpTotal - earnedXP;
          const perMission = incompleteMissions.length > 0 ? Math.floor(freeXP / incompleteMissions.length) : 0;

          const redistributed = updatedMissions.map(m => {
            if (m.completedToday) return m;
            return { ...m, xpReward: Math.max(5, perMission) };
          });

          newState = {
            ...newState,
            metas: newState.metas.map(m => m.id !== meta.id ? m : { ...m, missions: redistributed }),
          };
        }
      }

      return newState;
    });
  }, []);

  const completeAfazer = useCallback((id: string) => {
    setState(prev => {
      const afazer = prev.afazeres.find(a => a.id === id);
      if (!afazer || afazer.completed) return prev;
      const streakMult = getStreakMultiplier(prev.stats.streak);
      const xpGain = Math.round(afazer.xpReward * streakMult);
      const xp = prev.stats.xp + xpGain;
      const levelInfo = getLevelFromXP(xp);

      let updatedAfazeres = prev.afazeres.map(a => a.id !== id ? a : { ...a, completed: true, completedAt: new Date().toISOString() });

      // If recurring, create a new instance for the next occurrence
      if (afazer.isRecurrent) {
        const nextDate = new Date(afazer.startDate);
        nextDate.setDate(nextDate.getDate() + 1); // simple: next day; could be smarter with recurrentDays
        if (afazer.recurrentDays && afazer.recurrentDays.length > 0) {
          const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
          for (let i = 1; i <= 7; i++) {
            const tryDate = new Date(afazer.startDate);
            tryDate.setDate(tryDate.getDate() + i);
            const dayName = dayMap[tryDate.getDay()];
            if (afazer.recurrentDays.includes(dayName as any)) {
              nextDate.setTime(tryDate.getTime());
              break;
            }
          }
        }
        const nextDateStr = nextDate.toISOString().split('T')[0];
        // Don't create if past recurrentEndDate
        if (!afazer.recurrentEndDate || nextDateStr <= afazer.recurrentEndDate) {
          const newAfazer: Afazer = {
            ...afazer,
            id: generateId(),
            completed: false,
            completedAt: undefined,
            startDate: nextDateStr,
            createdAt: new Date().toISOString(),
            timerStartedAt: undefined,
            timerCompletedAt: undefined,
            actualMinutes: undefined,
          };
          updatedAfazeres = [...updatedAfazeres, newAfazer];
        }
      }

      return {
        ...prev,
        afazeres: updatedAfazeres,
        stats: {
          ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
          totalMissionsCompleted: prev.stats.totalMissionsCompleted + 1,
        },
      };
    });
  }, []);

  const uncompleteAfazer = useCallback((id: string) => {
    setState(prev => {
      const afazer = prev.afazeres.find(a => a.id === id);
      if (!afazer || !afazer.completed) return prev;
      const xp = Math.max(0, prev.stats.xp - afazer.xpReward);
      const levelInfo = getLevelFromXP(xp);
      return {
        ...prev,
        afazeres: prev.afazeres.map(a => a.id !== id ? a : { ...a, completed: false, completedAt: undefined }),
        stats: { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMissionsCompleted: Math.max(0, prev.stats.totalMissionsCompleted - 1) },
      };
    });
  }, []);

  const deleteAfazer = useCallback((id: string) => {
    setState(prev => ({ ...prev, afazeres: prev.afazeres.filter(a => a.id !== id) }));
  }, []);

  const startAfazerTimer = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      afazeres: prev.afazeres.map(a => a.id !== id ? a : { ...a, timerStartedAt: new Date().toISOString() }),
    }));
  }, []);

  const stopAfazerTimer = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      afazeres: prev.afazeres.map(a => {
        if (a.id !== id || !a.timerStartedAt) return a;
        const actualMinutes = Math.round((Date.now() - new Date(a.timerStartedAt).getTime()) / 60000);
        return { ...a, timerCompletedAt: new Date().toISOString(), actualMinutes };
      }),
    }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      addMeta, completeMission, uncompleteMission, completeEtapa, deleteMeta, deleteMission,
      addJustificativa, toggleQuoteFavorite, nextQuote, setAlertTone,
      addLifeGoal, deleteLifeGoal, completeWeeklyMission,
      updateMissionEstimate, scheduleMission, scheduleAllMissions, completeMeta,
      startMissionTimer, stopMissionTimer,
      addAfazer, completeAfazer, uncompleteAfazer, deleteAfazer, startAfazerTimer, stopAfazerTimer,
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
