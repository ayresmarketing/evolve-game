import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { googleCreateEvent, googleDeleteEvent, googleUpdateEvent } from '@/lib/googleSync';

/** Monta startDateTime/endDateTime a partir de date + time (HH:MM), usando estimatedMinutes para calcular o fim */
function makeGoogleDateTimes(date: string, startTime?: string, endTime?: string, estimatedMinutes?: number) {
  if (!startTime) return { startDate: date, endDate: date };
  const start = `${date}T${startTime}:00`;
  let end: string;
  if (endTime) {
    end = `${date}T${endTime}:00`;
  } else if (estimatedMinutes) {
    // Usa estimatedMinutes para calcular o horário de término
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + estimatedMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    end = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
  } else {
    // Fallback: +1 hora
    const [h, m] = startTime.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0');
    end = `${date}T${endH}:${String(m).padStart(2, '0')}:00`;
  }
  return { startDateTime: start, endDateTime: end };
}

import { Meta, Mission, PlayerStats, Quote, Justificativa, Category, LifeGoal, WeeklyMission, Afazer, DEFAULT_QUOTES, ALTRUISTIC_MISSIONS, getLevelFromXP, getStreakMultiplier, Etapa } from '@/types/game';
import { toast } from 'sonner';

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
  loading: boolean;
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

function generateId() {
  return crypto.randomUUID();
}

function generateMissions(meta: { title: string; totalDays: number; mainAction: string; weeklyFrequency: number; category: Category; deadline: string }, manualMissions?: ManualMissionInput[]): Mission[] {
  const startDate = new Date();
  const missions: Mission[] = [];

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

  const totalSessions = Math.floor(meta.totalDays / 7 * meta.weeklyFrequency);

  missions.push({
    id: generateId(), metaId: '',
    title: '📋 Planejamento estratégico',
    description: `Organize-se para atingir "${meta.title}" em ${meta.totalDays} dias.`,
    frequency: 'única', dailyTarget: 'Concluir planejamento',
    etapas: [
      { id: generateId(), title: `Defina o que precisa ser feito para "${meta.title}"`, completed: false, order: 0 },
      { id: generateId(), title: `Quebre em ações menores: "${meta.mainAction}"`, completed: false, order: 1 },
      { id: generateId(), title: `Escolha os ${meta.weeklyFrequency} dias da semana`, completed: false, order: 2 },
      { id: generateId(), title: `Reserve o horário ideal`, completed: false, order: 3 },
      { id: generateId(), title: `Comece com 2 minutos`, completed: false, order: 4 },
    ],
    completedToday: false, xpReward: 15, estimatedMinutes: 20,
    scheduledDay: startDate.toISOString().split('T')[0],
  });

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
        title: `Dia ${dayNum} (${targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}): ${sessionsCompleted}/${totalSessions} sessões`,
        completed: false, order: i,
      });
    }
  }

  missions.push({
    id: generateId(), metaId: '',
    title: `🎯 ${meta.mainAction}`,
    description: `Execute "${meta.mainAction}" ${meta.weeklyFrequency}x por semana. Total: ~${totalSessions} sessões.`,
    frequency: `${meta.weeklyFrequency}x/semana`, dailyTarget: meta.mainAction,
    etapas: execEtapas, completedToday: false, xpReward: 25, estimatedMinutes: 30,
    scheduledDay: execDate.toISOString().split('T')[0],
  });

  const reviewDate = new Date(startDate);
  reviewDate.setDate(reviewDate.getDate() + 7);
  missions.push({
    id: generateId(), metaId: '',
    title: '📊 Revisão semanal',
    description: `Avalie seu progresso em "${meta.title}".`,
    frequency: 'semanal', dailyTarget: 'Avaliar progresso',
    etapas: [
      { id: generateId(), title: 'Quantas sessões completei esta semana?', completed: false, order: 0 },
      { id: generateId(), title: 'Estou no ritmo?', completed: false, order: 1 },
      { id: generateId(), title: 'O que pode tornar isso mais fácil?', completed: false, order: 2 },
      { id: generateId(), title: 'Quem estou me tornando?', completed: false, order: 3 },
    ],
    completedToday: false, xpReward: 20, estimatedMinutes: 15,
    scheduledDay: reviewDate.toISOString().split('T')[0],
  });

  missions.push({
    id: generateId(), metaId: '',
    title: '🏆 Finalização e reflexão',
    description: `Conclua "${meta.title}" e reflita.`,
    frequency: 'única', dailyTarget: 'Finalizar meta',
    etapas: [
      { id: generateId(), title: 'Confirme que atingiu o objetivo', completed: false, order: 0 },
      { id: generateId(), title: 'Registre: quem eu era vs quem sou agora', completed: false, order: 1 },
      { id: generateId(), title: 'Defina o próximo nível', completed: false, order: 2 },
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

// ======= DB HELPERS =======
async function loadFromDB(userId: string): Promise<{ metas: Meta[]; stats: PlayerStats; afazeres: Afazer[]; lifeGoals: LifeGoal[]; weeklyMission: WeeklyMission | null; justificativas: Justificativa[] }> {
  // Load stats
  const { data: statsRow } = await supabase.from('player_stats').select('*').eq('user_id', userId).single();
  const stats: PlayerStats = statsRow ? {
    xp: statsRow.xp, level: statsRow.level, levelName: statsRow.level_name,
    streak: statsRow.streak, longestStreak: statsRow.longest_streak,
    totalMissionsCompleted: statsRow.total_missions_completed, totalMetasCompleted: statsRow.total_metas_completed,
    badges: (statsRow.badges as any) || [], alertTone: statsRow.alert_tone as any,
    daysUsed: statsRow.days_used, categoryStreaks: (statsRow.category_streaks as any) || { pessoal: 0, profissional: 0, espiritual: 0 },
  } : defaultStats;

  // Load metas with missions and etapas
  const { data: metasRows } = await supabase.from('metas').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  const { data: missionsRows } = await supabase.from('missions').select('*').eq('user_id', userId).order('sort_order', { ascending: true });
  const { data: etapasRows } = await supabase.from('etapas').select('*').eq('user_id', userId).order('sort_order', { ascending: true });

  const metas: Meta[] = (metasRows || []).map(m => {
    const missions: Mission[] = (missionsRows || []).filter(mi => mi.meta_id === m.id).map(mi => ({
      id: mi.id, metaId: mi.meta_id, title: mi.title, description: mi.description || '',
      frequency: mi.frequency || 'única', dailyTarget: mi.daily_target || '',
      etapas: (etapasRows || []).filter(e => e.mission_id === mi.id).map(e => ({
        id: e.id, title: e.title, completed: e.completed, order: e.sort_order,
      })),
      completedToday: mi.completed_today, xpReward: mi.xp_reward,
      estimatedMinutes: mi.estimated_minutes || undefined,
      scheduledTime: mi.scheduled_time || undefined,
      scheduledDay: mi.scheduled_day || undefined,
      timerStartedAt: mi.timer_started_at || undefined,
      timerCompletedAt: mi.timer_completed_at || undefined,
      actualMinutes: mi.actual_minutes || undefined,
    }));
    return {
      id: m.id, title: m.title, category: m.category as Category,
      deadline: m.deadline, totalDays: m.total_days,
      mainAction: m.main_action, weeklyFrequency: m.weekly_frequency,
      missions, progress: m.progress, xpTotal: m.xp_total, xpEarned: m.xp_earned,
      completed: m.completed, createdAt: m.created_at,
      reward: m.reward || undefined, benefits30d: m.benefits_30d || undefined,
      benefits6m: m.benefits_6m || undefined, benefits1y: m.benefits_1y || undefined,
      linkedLifeGoalId: m.linked_life_goal_id || undefined,
    };
  });

  // Load afazeres
  const { data: afazeresRows } = await supabase.from('afazeres').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  const afazeres: Afazer[] = (afazeresRows || []).map(a => ({
    id: a.id, title: a.title, description: a.description || undefined,
    category: a.category as Category, startDate: a.start_date, endDate: a.end_date || undefined,
    startTime: a.start_time || undefined, endTime: a.end_time || undefined,
    isRecurrent: a.is_recurrent, recurrentDays: (a.recurrent_days as any) || undefined,
    recurrentEndDate: a.recurrent_end_date || undefined,
    linkedMetaId: a.linked_meta_id || undefined,
    completed: a.completed, completedAt: a.completed_at || undefined,
    xpReward: a.xp_reward, createdAt: a.created_at,
    estimatedMinutes: a.estimated_minutes || undefined,
    timerStartedAt: a.timer_started_at || undefined,
    timerCompletedAt: a.timer_completed_at || undefined,
    actualMinutes: a.actual_minutes || undefined,
  }));

  // Load life goals
  const { data: goalsRows } = await supabase.from('life_goals').select('*').eq('user_id', userId);
  const lifeGoals: LifeGoal[] = (goalsRows || []).map(g => ({
    id: g.id, title: g.title, description: g.description || '',
    targetYear: g.target_year, category: g.category as Category, icon: g.icon || '🎯',
    createdAt: g.created_at,
  }));

  // Load weekly mission
  const currentWeek = getWeekStart();
  const { data: wmRow } = await supabase.from('weekly_missions').select('*').eq('user_id', userId).eq('week_start', currentWeek).single();
  const weeklyMission: WeeklyMission | null = wmRow ? {
    id: wmRow.id, title: wmRow.title, description: wmRow.description || '',
    completed: wmRow.completed, weekStart: wmRow.week_start, xpReward: wmRow.xp_reward,
  } : null;

  // Load justificativas
  const { data: justRows } = await supabase.from('justificativas').select('*').eq('user_id', userId);
  const justificativas: Justificativa[] = (justRows || []).map(j => ({
    id: j.id, missionId: j.mission_id, reason: j.reason, date: j.date,
  }));

  return { metas, stats, afazeres, lifeGoals, weeklyMission, justificativas };
}

async function saveStatsToDB(userId: string, stats: PlayerStats) {
  await supabase.from('player_stats').update({
    xp: stats.xp, level: stats.level, level_name: stats.levelName,
    streak: stats.streak, longest_streak: stats.longestStreak,
    total_missions_completed: stats.totalMissionsCompleted,
    total_metas_completed: stats.totalMetasCompleted,
    alert_tone: stats.alertTone, days_used: stats.daysUsed,
    category_streaks: stats.categoryStreaks as any,
    badges: stats.badges as any,
    last_active_date: new Date().toISOString().split('T')[0],
  }).eq('user_id', userId);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [state, setState] = useState<GameState>({
    metas: [], stats: defaultStats, quotes: DEFAULT_QUOTES,
    justificativas: [], currentQuoteIndex: 0,
    lifeGoals: [], weeklyMission: null,
    lastActiveDate: new Date().toISOString().split('T')[0],
    afazeres: [], loading: true,
  });

  // Load data from DB on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await loadFromDB(userId);
        if (cancelled) return;

        let weeklyMission = data.weeklyMission;
        if (!weeklyMission) {
          const wm = generateWeeklyMission();
          await supabase.from('weekly_missions').insert({
            id: wm.id, user_id: userId, title: wm.title, description: wm.description,
            completed: false, week_start: wm.weekStart, xp_reward: wm.xpReward,
          } as any);
          weeklyMission = wm;
        }

        setState(prev => ({
          ...prev,
          metas: data.metas, stats: data.stats, afazeres: data.afazeres,
          lifeGoals: data.lifeGoals, weeklyMission,
          justificativas: data.justificativas, loading: false,
        }));

        // Update days used
        const today = new Date().toISOString().split('T')[0];
        const { data: statsRow } = await supabase.from('player_stats').select('last_active_date').eq('user_id', userId).single();
        if (statsRow && statsRow.last_active_date !== today) {
          const newDaysUsed = data.stats.daysUsed + 1;
          await supabase.from('player_stats').update({ days_used: newDaysUsed, last_active_date: today }).eq('user_id', userId);
          if (!cancelled) {
            setState(prev => ({ ...prev, stats: { ...prev.stats, daysUsed: newDaysUsed }, lastActiveDate: today }));
          }
        }
      } catch (err) {
        console.error('Failed to load game data:', err);
        if (!cancelled) setState(prev => ({ ...prev, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const addMeta = useCallback(async (metaData: AddMetaInput) => {
    if (!userId) return;
    const { manualMissions: manualMissionsInput, taskMode, ...metaBase } = metaData;
    const missions = generateMissions(
      { ...metaBase },
      taskMode === 'manual' ? manualMissionsInput : undefined
    );

    const metaId = generateId();
    missions.forEach(m => m.metaId = metaId);
    const xpMultiplier = metaBase.linkedLifeGoalId ? 1.5 : 1;
    const totalMissionXP = missions.reduce((s, m) => s + m.xpReward, 0);
    const xpTotal = Math.round(totalMissionXP * metaBase.totalDays / missions.length * xpMultiplier);

    const meta: Meta = {
      ...metaBase, id: metaId, missions, progress: 0,
      xpTotal, xpEarned: 0, completed: false, createdAt: new Date().toISOString(),
    };

    // Save to DB
    await supabase.from('metas').insert({
      id: metaId, user_id: userId, title: meta.title, category: meta.category,
      deadline: meta.deadline, total_days: meta.totalDays, main_action: meta.mainAction,
      weekly_frequency: meta.weeklyFrequency, xp_total: xpTotal,
      reward: meta.reward || null, benefits_30d: meta.benefits30d || null,
      benefits_6m: meta.benefits6m || null, benefits_1y: meta.benefits1y || null,
      linked_life_goal_id: meta.linkedLifeGoalId || null,
    } as any);

    // Save missions
    for (const m of missions) {
      await supabase.from('missions').insert({
        id: m.id, user_id: userId, meta_id: metaId, title: m.title,
        description: m.description, frequency: m.frequency, daily_target: m.dailyTarget,
        xp_reward: m.xpReward, estimated_minutes: m.estimatedMinutes || null,
        scheduled_day: m.scheduledDay || null, scheduled_time: m.scheduledTime || null,
        sort_order: missions.indexOf(m),
      } as any);

      // Google Calendar sync: usa datetime se tiver horário, usando estimatedMinutes para duração
      if (m.scheduledDay) {
        const googleTimes = makeGoogleDateTimes(m.scheduledDay, m.scheduledTime, undefined, m.estimatedMinutes);
        googleCreateEvent({
          summary: m.title,
          description: `Meta: ${meta.title}`,
          ...googleTimes,
          sourceType: 'meta',
          sourceId: m.id,
        }).then(eventId => {
          if (eventId) {
            supabase.from('missions').update({ google_event_id: eventId } as any).eq('id', m.id);
          }
        });
      }

      // Save etapas
      for (const e of m.etapas) {
        await supabase.from('etapas').insert({
          id: e.id, user_id: userId, mission_id: m.id, title: e.title, sort_order: e.order,
        } as any);
      }
    }

    setState(prev => ({ ...prev, metas: [...prev.metas, meta] }));
  }, [userId]) as (meta: AddMetaInput) => void;

  const completeMission = useCallback(async (metaId: string, missionId: string) => {
    if (!userId) return;
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
      const newStats = {
        ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
        streak: newStreak, longestStreak: Math.max(newStreak, prev.stats.longestStreak),
        totalMissionsCompleted: prev.stats.totalMissionsCompleted + 1,
        totalMetasCompleted: metas.filter(m => m.completed).length,
      };

      // Save async
      const updatedMeta = metas.find(m => m.id === metaId)!;
      supabase.from('missions').update({ completed_today: true }).eq('id', missionId);
      supabase.from('metas').update({ xp_earned: updatedMeta.xpEarned, progress: updatedMeta.progress, completed: updatedMeta.completed }).eq('id', metaId);
      saveStatsToDB(userId, newStats);

      return { ...prev, metas, stats: newStats };
    });
  }, [userId]) as (metaId: string, missionId: string) => void;

  const uncompleteMission = useCallback(async (metaId: string, missionId: string) => {
    if (!userId) return;
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
      const newStats = { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMissionsCompleted: Math.max(0, prev.stats.totalMissionsCompleted - 1) };

      const updatedMeta = metas.find(m => m.id === metaId)!;
      supabase.from('missions').update({ completed_today: false }).eq('id', missionId);
      supabase.from('metas').update({ xp_earned: updatedMeta.xpEarned, progress: updatedMeta.progress, completed: false }).eq('id', metaId);
      saveStatsToDB(userId, newStats);

      return { ...prev, metas, stats: newStats };
    });
  }, [userId]) as (metaId: string, missionId: string) => void;

  const deleteMission = useCallback(async (metaId: string, missionId: string) => {
    if (!userId) return;
    // Busca o google_event_id antes de deletar
    const { data: mRow } = await supabase.from('missions').select('google_event_id').eq('id', missionId).single() as any;
    await supabase.from('etapas').delete().eq('mission_id', missionId);
    await supabase.from('missions').delete().eq('id', missionId);
    if (mRow?.google_event_id) googleDeleteEvent(mRow.google_event_id);
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;
      const remaining = meta.missions.filter(m => m.id !== missionId);
      return { ...prev, metas: prev.metas.map(m => m.id !== metaId ? m : { ...m, missions: remaining }) };
    });
  }, [userId]) as (metaId: string, missionId: string) => void;

  const completeEtapa = useCallback(async (metaId: string, missionId: string, etapaId: string) => {
    if (!userId) return;
    setState(prev => {
      const newMetas = prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => {
          if (m.id !== missionId) return m;
          return { ...m, etapas: m.etapas.map(e => e.id === etapaId ? { ...e, completed: !e.completed } : e) };
        }) };
      });
      const mission = newMetas.find(m => m.id === metaId)?.missions.find(m => m.id === missionId);
      const etapa = mission?.etapas.find(e => e.id === etapaId);
      if (etapa) supabase.from('etapas').update({ completed: etapa.completed }).eq('id', etapaId);
      return { ...prev, metas: newMetas };
    });
  }, [userId]) as (metaId: string, missionId: string, etapaId: string) => void;

  const deleteMeta = useCallback(async (metaId: string) => {
    if (!userId) return;
    await supabase.from('metas').delete().eq('id', metaId);
    setState(prev => ({ ...prev, metas: prev.metas.filter(m => m.id !== metaId) }));
  }, [userId]) as (metaId: string) => void;

  const completeMeta = useCallback(async (metaId: string) => {
    if (!userId) return;
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta || meta.completed) return prev;
      const remainingXP = meta.xpTotal - meta.xpEarned;
      const xp = prev.stats.xp + remainingXP;
      const levelInfo = getLevelFromXP(xp);
      const newStats = { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMetasCompleted: prev.stats.totalMetasCompleted + 1 };

      supabase.from('metas').update({ completed: true, progress: 100, xp_earned: meta.xpTotal }).eq('id', metaId);
      meta.missions.forEach(mi => supabase.from('missions').update({ completed_today: true }).eq('id', mi.id));
      saveStatsToDB(userId, newStats);

      return {
        ...prev,
        metas: prev.metas.map(m => m.id !== metaId ? m : {
          ...m, completed: true, progress: 100, xpEarned: m.xpTotal,
          missions: m.missions.map(mi => ({ ...mi, completedToday: true })),
        }),
        stats: newStats,
      };
    });
  }, [userId]) as (metaId: string) => void;

  const startMissionTimer = useCallback(async (metaId: string, missionId: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from('missions').update({ timer_started_at: now }).eq('id', missionId);
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, timerStartedAt: now } : m) };
      }),
    }));
  }, [userId]) as (metaId: string, missionId: string) => void;

  const stopMissionTimer = useCallback(async (metaId: string, missionId: string) => {
    if (!userId) return;
    setState(prev => {
      const newMetas = prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => {
          if (m.id !== missionId || !m.timerStartedAt) return m;
          const actualMinutes = Math.round((Date.now() - new Date(m.timerStartedAt).getTime()) / 60000);
          const now = new Date().toISOString();
          supabase.from('missions').update({ timer_completed_at: now, actual_minutes: actualMinutes }).eq('id', missionId);
          return { ...m, timerCompletedAt: now, actualMinutes };
        }) };
      });
      return { ...prev, metas: newMetas };
    });
  }, [userId]) as (metaId: string, missionId: string) => void;

  const addJustificativa = useCallback(async (missionId: string, reason: string) => {
    if (!userId) return;
    const id = generateId();
    const date = new Date().toISOString();
    await supabase.from('justificativas').insert({ id, user_id: userId, mission_id: missionId, reason, date } as any);
    setState(prev => ({
      ...prev,
      justificativas: [...prev.justificativas, { id, missionId, reason, date }],
    }));
  }, [userId]) as (missionId: string, reason: string) => void;

  const toggleQuoteFavorite = useCallback((id: string) => {
    setState(prev => ({ ...prev, quotes: prev.quotes.map(q => q.id === id ? { ...q, favorited: !q.favorited } : q) }));
  }, []);

  const nextQuote = useCallback(() => {
    setState(prev => ({ ...prev, currentQuoteIndex: (prev.currentQuoteIndex + 1) % prev.quotes.length }));
  }, []);

  const setAlertTone = useCallback(async (tone: PlayerStats['alertTone']) => {
    if (!userId) return;
    await supabase.from('player_stats').update({ alert_tone: tone }).eq('user_id', userId);
    setState(prev => ({ ...prev, stats: { ...prev.stats, alertTone: tone } }));
  }, [userId]) as (tone: PlayerStats['alertTone']) => void;

  const addLifeGoal = useCallback(async (goal: Omit<LifeGoal, 'id' | 'createdAt'>) => {
    if (!userId) return;
    const id = generateId();
    const createdAt = new Date().toISOString();
    await supabase.from('life_goals').insert({
      id, user_id: userId, title: goal.title, description: goal.description,
      target_year: goal.targetYear, category: goal.category, icon: goal.icon,
    } as any);
    setState(prev => ({ ...prev, lifeGoals: [...prev.lifeGoals, { ...goal, id, createdAt }] }));
  }, [userId]) as (goal: Omit<LifeGoal, 'id' | 'createdAt'>) => void;

  const deleteLifeGoal = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('life_goals').delete().eq('id', id);
    setState(prev => ({ ...prev, lifeGoals: prev.lifeGoals.filter(g => g.id !== id) }));
  }, [userId]) as (id: string) => void;

  const completeWeeklyMission = useCallback(async () => {
    if (!userId) return;
    setState(prev => {
      if (!prev.weeklyMission) return prev;
      const xp = prev.stats.xp + prev.weeklyMission.xpReward;
      const levelInfo = getLevelFromXP(xp);
      const newStats = { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name };
      supabase.from('weekly_missions').update({ completed: true }).eq('id', prev.weeklyMission.id);
      saveStatsToDB(userId, newStats);
      return { ...prev, weeklyMission: { ...prev.weeklyMission, completed: true }, stats: newStats };
    });
  }, [userId]) as () => void;

  const updateMissionEstimate = useCallback(async (metaId: string, missionId: string, minutes: number) => {
    if (!userId) return;
    await supabase.from('missions').update({ estimated_minutes: minutes }).eq('id', missionId);
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, estimatedMinutes: minutes } : m) };
      }),
    }));
  }, [userId]) as (metaId: string, missionId: string, minutes: number) => void;

  const scheduleMission = useCallback(async (metaId: string, missionId: string, time: string, day?: string) => {
    if (!userId) return;
    await supabase.from('missions').update({ scheduled_time: time, scheduled_day: day || null }).eq('id', missionId);
    // Sincroniza horário no Google Calendar
    if (day) {
      const mission = state.metas.find(m => m.id === metaId)?.missions.find(m => m.id === missionId);
      const { data: mRow } = await supabase.from('missions').select('google_event_id, title').eq('id', missionId).single() as any;
      const googleTimes = makeGoogleDateTimes(day, time, undefined, mission?.estimatedMinutes);
      if (mRow?.google_event_id) {
        googleUpdateEvent({ eventId: mRow.google_event_id, ...googleTimes });
      } else {
        // Evento ainda não existe, cria agora
        const meta = state.metas.find(m => m.id === metaId);
        googleCreateEvent({
          summary: `🎯 ${mRow?.title || ''}`,
          description: meta ? `Meta: ${meta.title}` : '',
          ...googleTimes,
        }).then(eventId => {
          if (eventId) supabase.from('missions').update({ google_event_id: eventId } as any).eq('id', missionId);
        });
      }
    }
    setState(prev => ({
      ...prev,
      metas: prev.metas.map(meta => {
        if (meta.id !== metaId) return meta;
        return { ...meta, missions: meta.missions.map(m => m.id === missionId ? { ...m, scheduledTime: time, scheduledDay: day } : m) };
      }),
    }));
  }, [userId, state.metas]) as (metaId: string, missionId: string, time: string, day?: string) => void;

  const scheduleAllMissions = useCallback(async (metaId: string) => {
    if (!userId) return;
    setState(prev => {
      const meta = prev.metas.find(m => m.id === metaId);
      if (!meta) return prev;

      const today = new Date();
      let currentDay = new Date(today);
      let currentMinute = today.getHours() * 60 + today.getMinutes() + 15;

      const updatedMissions = meta.missions.map(mission => {
        if (mission.completedToday || mission.scheduledTime) return mission;
        const est = mission.estimatedMinutes || 30;
        if (currentMinute + est > 22 * 60) {
          currentDay.setDate(currentDay.getDate() + 1);
          currentMinute = 8 * 60;
        }
        const h = Math.floor(currentMinute / 60);
        const m = currentMinute % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const day = currentDay.toISOString().split('T')[0];
        currentMinute += est + 15;
        supabase.from('missions').update({ scheduled_time: time, scheduled_day: day }).eq('id', mission.id);
        return { ...mission, scheduledTime: time, scheduledDay: day };
      });

      return { ...prev, metas: prev.metas.map(m => m.id !== metaId ? m : { ...m, missions: updatedMissions }) };
    });
  }, [userId]) as (metaId: string) => void;

  // Afazeres
  const addAfazer = useCallback(async (data: Omit<Afazer, 'id' | 'completed' | 'xpReward' | 'createdAt'>) => {
    if (!userId) return;
    const xpReward = data.linkedMetaId ? 10 : 5;
    const id = generateId();
    const createdAt = new Date().toISOString();
    const afazer: Afazer = { ...data, id, completed: false, xpReward, createdAt };

    await supabase.from('afazeres').insert({
      id, user_id: userId, title: data.title, description: data.description || null,
      category: data.category, start_date: data.startDate, end_date: data.endDate || null,
      start_time: data.startTime || null, end_time: data.endTime || null,
      is_recurrent: data.isRecurrent, recurrent_days: (data.recurrentDays as any) || [],
      recurrent_end_date: data.recurrentEndDate || null,
      linked_meta_id: data.linkedMetaId || null, xp_reward: xpReward,
      estimated_minutes: data.estimatedMinutes || null,
    } as any);

    // Google Calendar sync: usa datetime se tiver horário, usando estimatedMinutes para duração
    const googleTimes = makeGoogleDateTimes(data.startDate, data.startTime, data.endTime, data.estimatedMinutes);
    googleCreateEvent({
      summary: data.title,
      description: data.description || '',
      ...googleTimes,
      sourceType: 'afazer',
      sourceId: id,
    }).then(eventId => {
      if (eventId) supabase.from('afazeres').update({ google_event_id: eventId } as any).eq('id', id);
    });

    setState(prev => {
      let newState = { ...prev, afazeres: [...prev.afazeres, afazer] };

      if (data.linkedMetaId) {
        const meta = newState.metas.find(m => m.id === data.linkedMetaId);
        if (meta) {
          const missionId = generateId();
          const newMission: Mission = {
            id: missionId, metaId: meta.id, title: data.title,
            description: data.description || 'Tarefa adicionada manualmente',
            frequency: data.isRecurrent ? 'recorrente' : 'única',
            dailyTarget: data.title, etapas: [], completedToday: false,
            xpReward: 0, estimatedMinutes: data.estimatedMinutes,
          };

          const updatedMissions = [...meta.missions, newMission];
          const incompleteMissions = updatedMissions.filter(m => !m.completedToday);
          const freeXP = meta.xpTotal - meta.xpEarned;
          const perMission = incompleteMissions.length > 0 ? Math.floor(freeXP / incompleteMissions.length) : 0;
          const redistributed = updatedMissions.map(m => {
            if (m.completedToday) return m;
            return { ...m, xpReward: Math.max(5, perMission) };
          });

          // Save new mission to DB
          supabase.from('missions').insert({
            id: missionId, user_id: userId, meta_id: meta.id, title: data.title,
            description: data.description || 'Tarefa adicionada manualmente',
            frequency: data.isRecurrent ? 'recorrente' : 'única',
            daily_target: data.title, xp_reward: Math.max(5, perMission),
            estimated_minutes: data.estimatedMinutes || null,
            sort_order: updatedMissions.length - 1,
          } as any);

          // Update XP on existing missions
          redistributed.forEach(m => {
            if (!m.completedToday) {
              supabase.from('missions').update({ xp_reward: m.xpReward }).eq('id', m.id);
            }
          });

          newState = { ...newState, metas: newState.metas.map(m => m.id !== meta.id ? m : { ...m, missions: redistributed }) };
        }
      }

      return newState;
    });
  }, [userId]) as (afazer: Omit<Afazer, 'id' | 'completed' | 'xpReward' | 'createdAt'>) => void;

  const completeAfazer = useCallback(async (id: string) => {
    if (!userId) return;
    setState(prev => {
      const afazer = prev.afazeres.find(a => a.id === id);
      if (!afazer || afazer.completed) return prev;
      const streakMult = getStreakMultiplier(prev.stats.streak);
      const xpGain = Math.round(afazer.xpReward * streakMult);
      const xp = prev.stats.xp + xpGain;
      const levelInfo = getLevelFromXP(xp);
      const completedAt = new Date().toISOString();

      let updatedAfazeres = prev.afazeres.map(a => a.id !== id ? a : { ...a, completed: true, completedAt });
      supabase.from('afazeres').update({ completed: true, completed_at: completedAt }).eq('id', id);

      if (afazer.isRecurrent) {
        const nextDate = new Date(afazer.startDate);
        nextDate.setDate(nextDate.getDate() + 1);
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
        if (!afazer.recurrentEndDate || nextDateStr <= afazer.recurrentEndDate) {
          const newId = generateId();
          const newAfazer: Afazer = {
            ...afazer, id: newId, completed: false, completedAt: undefined,
            startDate: nextDateStr, createdAt: new Date().toISOString(),
            timerStartedAt: undefined, timerCompletedAt: undefined, actualMinutes: undefined,
          };
          updatedAfazeres = [...updatedAfazeres, newAfazer];
          supabase.from('afazeres').insert({
            id: newId, user_id: userId, title: afazer.title, description: afazer.description || null,
            category: afazer.category, start_date: nextDateStr, end_date: afazer.endDate || null,
            start_time: afazer.startTime || null, end_time: afazer.endTime || null,
            is_recurrent: true, recurrent_days: (afazer.recurrentDays as any) || [],
            recurrent_end_date: afazer.recurrentEndDate || null,
            linked_meta_id: afazer.linkedMetaId || null, xp_reward: afazer.xpReward,
            estimated_minutes: afazer.estimatedMinutes || null,
          } as any);
        }
      }

      const newStats = {
        ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name,
        totalMissionsCompleted: prev.stats.totalMissionsCompleted + 1,
      };
      saveStatsToDB(userId, newStats);
      return { ...prev, afazeres: updatedAfazeres, stats: newStats };
    });
  }, [userId]) as (id: string) => void;

  const uncompleteAfazer = useCallback(async (id: string) => {
    if (!userId) return;
    setState(prev => {
      const afazer = prev.afazeres.find(a => a.id === id);
      if (!afazer || !afazer.completed) return prev;
      const xp = Math.max(0, prev.stats.xp - afazer.xpReward);
      const levelInfo = getLevelFromXP(xp);
      const newStats = { ...prev.stats, xp, level: levelInfo.level, levelName: levelInfo.name, totalMissionsCompleted: Math.max(0, prev.stats.totalMissionsCompleted - 1) };
      supabase.from('afazeres').update({ completed: false, completed_at: null }).eq('id', id);
      saveStatsToDB(userId, newStats);
      return {
        ...prev,
        afazeres: prev.afazeres.map(a => a.id !== id ? a : { ...a, completed: false, completedAt: undefined }),
        stats: newStats,
      };
    });
  }, [userId]) as (id: string) => void;

  const deleteAfazer = useCallback(async (id: string) => {
    if (!userId) return;
    // Busca o google_event_id antes de deletar
    const { data: aRow } = await supabase.from('afazeres').select('google_event_id').eq('id', id).single() as any;
    await supabase.from('afazeres').delete().eq('id', id);
    if (aRow?.google_event_id) googleDeleteEvent(aRow.google_event_id);
    setState(prev => ({ ...prev, afazeres: prev.afazeres.filter(a => a.id !== id) }));
  }, [userId]) as (id: string) => void;

  const startAfazerTimer = useCallback(async (id: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from('afazeres').update({ timer_started_at: now }).eq('id', id);
    setState(prev => ({
      ...prev,
      afazeres: prev.afazeres.map(a => a.id !== id ? a : { ...a, timerStartedAt: now }),
    }));
  }, [userId]) as (id: string) => void;

  const stopAfazerTimer = useCallback(async (id: string) => {
    if (!userId) return;
    setState(prev => ({
      ...prev,
      afazeres: prev.afazeres.map(a => {
        if (a.id !== id || !a.timerStartedAt) return a;
        const actualMinutes = Math.round((Date.now() - new Date(a.timerStartedAt).getTime()) / 60000);
        const now = new Date().toISOString();
        supabase.from('afazeres').update({ timer_completed_at: now, actual_minutes: actualMinutes }).eq('id', id);
        return { ...a, timerCompletedAt: now, actualMinutes };
      }),
    }));
  }, [userId]) as (id: string) => void;

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
