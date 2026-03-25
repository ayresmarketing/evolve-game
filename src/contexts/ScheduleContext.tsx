import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SleepSchedule, FixedTimeBlock, DayOfWeek, calculateSleepHours, calculateBlockHours } from '@/types/game';

interface ScheduleState {
  sleepSchedules: SleepSchedule[];
  fixedBlocks: FixedTimeBlock[];
}

interface ScheduleContextType extends ScheduleState {
  addSleepSchedule: (schedule: Omit<SleepSchedule, 'id'>) => void;
  updateSleepSchedule: (id: string, schedule: Partial<SleepSchedule>) => void;
  deleteSleepSchedule: (id: string) => void;
  addFixedBlock: (block: Omit<FixedTimeBlock, 'id'>) => void;
  updateFixedBlock: (id: string, block: Partial<FixedTimeBlock>) => void;
  deleteFixedBlock: (id: string) => void;
  getDaySchedule: (day: DayOfWeek) => { sleepHours: number; busyHours: number; freeHours: number };
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

const STORAGE_KEY = 'lifequest_schedule';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function loadState(): ScheduleState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { sleepSchedules: [], fixedBlocks: [] };
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScheduleState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addSleepSchedule = useCallback((schedule: Omit<SleepSchedule, 'id'>) => {
    setState(prev => ({
      ...prev,
      sleepSchedules: [...prev.sleepSchedules, { ...schedule, id: generateId() }],
    }));
  }, []);

  const updateSleepSchedule = useCallback((id: string, updates: Partial<SleepSchedule>) => {
    setState(prev => ({
      ...prev,
      sleepSchedules: prev.sleepSchedules.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteSleepSchedule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      sleepSchedules: prev.sleepSchedules.filter(s => s.id !== id),
    }));
  }, []);

  const addFixedBlock = useCallback((block: Omit<FixedTimeBlock, 'id'>) => {
    setState(prev => ({
      ...prev,
      fixedBlocks: [...prev.fixedBlocks, { ...block, id: generateId() }],
    }));
  }, []);

  const updateFixedBlock = useCallback((id: string, updates: Partial<FixedTimeBlock>) => {
    setState(prev => ({
      ...prev,
      fixedBlocks: prev.fixedBlocks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, []);

  const deleteFixedBlock = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      fixedBlocks: prev.fixedBlocks.filter(b => b.id !== id),
    }));
  }, []);

  const getDaySchedule = useCallback((day: DayOfWeek) => {
    const sleepSchedule = state.sleepSchedules.find(s => s.days.includes(day));
    const sleepHours = sleepSchedule ? calculateSleepHours(sleepSchedule.bedtime, sleepSchedule.wakeTime) : 8;

    const dayBlocks = state.fixedBlocks.filter(b => b.days.includes(day));
    const busyHours = dayBlocks.reduce((total, b) => total + calculateBlockHours(b.startTime, b.endTime), 0);

    const freeHours = Math.max(0, 24 - sleepHours - busyHours);
    return { sleepHours: Math.round(sleepHours * 10) / 10, busyHours: Math.round(busyHours * 10) / 10, freeHours: Math.round(freeHours * 10) / 10 };
  }, [state]);

  return (
    <ScheduleContext.Provider value={{
      ...state,
      addSleepSchedule, updateSleepSchedule, deleteSleepSchedule,
      addFixedBlock, updateFixedBlock, deleteFixedBlock,
      getDaySchedule,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
}
