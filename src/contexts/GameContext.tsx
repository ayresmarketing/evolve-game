import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Meta, Mission, PlayerStats, Quote, Justificativa, Category, DEFAULT_QUOTES, getLevelFromXP, Etapa } from '@/types/game';

interface GameState {
  metas: Meta[];
  stats: PlayerStats;
  quotes: Quote[];
  justificativas: Justificativa[];
  currentQuoteIndex: number;
}

interface GameContextType extends GameState {
  addMeta: (meta: Omit<Meta, 'id' | 'missions' | 'progress' | 'xpEarned' | 'completed' | 'createdAt' | 'xpTotal'>) => void;
  completeMission: (metaId: string, missionId: string) => void;
  completeEtapa: (metaId: string, missionId: string, etapaId: string) => void;
  deleteMeta: (metaId: string) => void;
  addJustificativa: (missionId: string, reason: string) => void;
  toggleQuoteFavorite: (id: string) => void;
  nextQuote: () => void;
  setAlertTone: (tone: PlayerStats['alertTone']) => void;
}

const GameContext = createContext<GameContextType | null>(null);

const STORAGE_KEY = 'lifequest_game_state';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function generateMissions(meta: { title: string; totalDays: number; volume?: string; category: Category }): Mission[] {
  const baseMission: Mission = {
    id: generateId(),
    metaId: '',
    title: '',
    description: '',
    frequency: 'diária',
    dailyTarget: '',
    etapas: [],
    completedToday: false,
    xpReward: 25,
  };

  // Try to parse volume for smart calculation
  const volumeNum = meta.volume ? parseInt(meta.volume) : null;
  const daily = volumeNum && meta.totalDays > 0 ? Math.ceil(volumeNum / meta.totalDays) : null;

  const mission: Mission = {
    ...baseMission,
    title: daily ? `${meta.title} — ${daily} unidades/dia` : `Executar: ${meta.title}`,
    description: daily ? `Complete ${daily} unidades por dia para atingir sua meta em ${meta.totalDays} dias.` : `Execute sua missão diariamente.`,
    dailyTarget: daily ? `${daily} unidades` : '1 sessão',
  };

  // Generate etapas
  const etapas: Etapa[] = [
    { id: generateId(), title: 'Planejamento inicial', completed: false, order: 0 },
    { id: generateId(), title: 'Executar diariamente', completed: false, order: 1 },
    { id: generateId(), title: 'Checkpoint semanal', completed: false, order: 2 },
    { id: generateId(), title: 'Revisão de progresso', completed: false, order: 3 },
    { id: generateId(), title: 'Finalização e reflexão', completed: false, order: 4 },
  ];

  mission.etapas = etapas;
  return [mission];
}

const defaultStats: PlayerStats = {
  xp: 0,
  level: 1,
  levelName: 'Iniciante',
  streak: 0,
  longestStreak: 0,
  totalMissionsCompleted: 0,
  totalMetasCompleted: 0,
  badges: [],
  alertTone: 'equilibrado',
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    metas: [],
    stats: defaultStats,
    quotes: DEFAULT_QUOTES,
    justificativas: [],
    currentQuoteIndex: 0,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addMeta = useCallback((metaData: Omit<Meta, 'id' | 'missions' | 'progress' | 'xpEarned' | 'completed' | 'createdAt' | 'xpTotal'>) => {
    const id = generateId();
    const missions = generateMissions({ ...metaData });
    missions.forEach(m => m.metaId = id);
    const meta: Meta = {
      ...metaData,
      id,
      missions,
      progress: 0,
      xpTotal: metaData.totalDays * 25,
      xpEarned: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, metas: [...prev.metas, meta] }));
  }, []);

  const completeMission = useCallback((metaId: string, missionId: string) => {
    setState(prev => {
      const metas = prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        const missions = meta.missions.map(m => {
          if (m.id !== missionId) return m;
          return { ...m, completedToday: true };
        });
        const completedMissions = missions.filter(m => m.completedToday).length;
        const progress = Math.min(100, Math.round((meta.xpEarned + 25) / meta.xpTotal * 100));
        const completed = progress >= 100;
        return { ...missions, ...meta, missions, progress, xpEarned: meta.xpEarned + 25, completed };
      });

      const xp = prev.stats.xp + 25;
      const levelInfo = getLevelFromXP(xp);
      const streak = prev.stats.streak + 1;

      return {
        ...prev,
        metas,
        stats: {
          ...prev.stats,
          xp,
          level: levelInfo.level,
          levelName: levelInfo.name,
          streak,
          longestStreak: Math.max(streak, prev.stats.longestStreak),
          totalMissionsCompleted: prev.stats.totalMissionsCompleted + 1,
        },
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
            return {
              ...m,
              etapas: m.etapas.map(e => e.id === etapaId ? { ...e, completed: !e.completed } : e),
            };
          }),
        };
      }),
    }));
  }, []);

  const deleteMeta = useCallback((metaId: string) => {
    setState(prev => ({ ...prev, metas: prev.metas.filter(m => m.id !== metaId) }));
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
    setState(prev => ({
      ...prev,
      currentQuoteIndex: (prev.currentQuoteIndex + 1) % prev.quotes.length,
    }));
  }, []);

  const setAlertTone = useCallback((tone: PlayerStats['alertTone']) => {
    setState(prev => ({ ...prev, stats: { ...prev.stats, alertTone: tone } }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      addMeta, completeMission, completeEtapa, deleteMeta,
      addJustificativa, toggleQuoteFavorite, nextQuote, setAlertTone,
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
