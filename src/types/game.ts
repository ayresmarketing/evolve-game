export type Category = 'pessoal' | 'profissional' | 'espiritual';

export type AlertTone = 'leve' | 'equilibrado' | 'confrontador';

export type DayOfWeek = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'seg', label: 'Segunda', short: 'S' },
  { value: 'ter', label: 'Terça', short: 'T' },
  { value: 'qua', label: 'Quarta', short: 'Q' },
  { value: 'qui', label: 'Quinta', short: 'Q' },
  { value: 'sex', label: 'Sexta', short: 'S' },
  { value: 'sab', label: 'Sábado', short: 'S' },
  { value: 'dom', label: 'Domingo', short: 'D' },
];

export interface Etapa {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Mission {
  id: string;
  metaId: string;
  title: string;
  description: string;
  frequency: string;
  dailyTarget: string;
  etapas: Etapa[];
  completedToday: boolean;
  xpReward: number;
  estimatedMinutes?: number;
  scheduledTime?: string; // HH:mm
  scheduledDay?: string; // ISO date
}

export interface Meta {
  id: string;
  title: string;
  category: Category;
  deadline: string;
  totalDays: number;
  volume?: string;
  missions: Mission[];
  progress: number;
  xpTotal: number;
  xpEarned: number;
  completed: boolean;
  createdAt: string;
  reward?: string;
  benefits30d?: string;
  benefits6m?: string;
  benefits1y?: string;
  linkedLifeGoalId?: string;
}

export interface PlayerStats {
  xp: number;
  level: number;
  levelName: string;
  streak: number;
  longestStreak: number;
  totalMissionsCompleted: number;
  totalMetasCompleted: number;
  badges: Badge[];
  alertTone: AlertTone;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  favorited: boolean;
}

export interface Justificativa {
  id: string;
  missionId: string;
  reason: string;
  date: string;
}

export interface SleepSchedule {
  id: string;
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  days: DayOfWeek[];
}

export interface FixedTimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  days: DayOfWeek[];
  category?: Category;
}

export interface LifeGoal {
  id: string;
  title: string;
  description: string;
  targetYear: number;
  category: Category;
  icon: string;
  createdAt: string;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  weekStart: string;
  xpReward: number;
}

export const LEVEL_NAMES = [
  'Iniciante',
  'Aprendiz',
  'Executor',
  'Disciplinado',
  'Estrategista',
  'Evoluído',
  'Imparável',
] as const;

export const XP_PER_LEVEL = 500;

export function getLevelFromXP(xp: number): { level: number; name: string; xpInLevel: number; xpForNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const cappedLevel = Math.min(level, LEVEL_NAMES.length);
  return {
    level: cappedLevel,
    name: LEVEL_NAMES[cappedLevel - 1],
    xpInLevel: xp % XP_PER_LEVEL,
    xpForNext: XP_PER_LEVEL,
  };
}

export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; glowClass: string }> = {
  pessoal: { label: 'Pessoal', color: 'game-purple', glowClass: 'text-game-purple' },
  profissional: { label: 'Profissional', color: 'game-orange', glowClass: 'text-game-orange' },
  espiritual: { label: 'Espiritual', color: 'game-blue', glowClass: 'text-game-blue' },
};

export const CATEGORY_BG: Record<string, string> = {
  'game-purple': 'bg-game-purple',
  'game-orange': 'bg-game-orange',
  'game-blue': 'bg-game-blue',
};

export const CATEGORY_BORDER: Record<string, string> = {
  'game-purple': 'border-game-purple/30',
  'game-orange': 'border-game-orange/30',
  'game-blue': 'border-game-blue/30',
};

export const DEFAULT_QUOTES: Quote[] = [
  { id: '1', text: 'A disciplina é a ponte entre metas e conquistas.', author: 'Jim Rohn', favorited: false },
  { id: '2', text: 'Você não precisa ser extremo, precisa ser consistente.', favorited: false },
  { id: '3', text: 'O que você faz todos os dias importa mais do que o que faz de vez em quando.', favorited: false },
  { id: '4', text: 'Não espere por motivação. Crie disciplina.', favorited: false },
  { id: '5', text: 'Cada dia é uma nova chance de evoluir.', favorited: false },
  { id: '6', text: 'Quem você será daqui a 1 ano depende do que faz hoje.', favorited: false },
  { id: '7', text: 'A dor da disciplina pesa gramas. O arrependimento pesa toneladas.', favorited: false },
  { id: '8', text: 'Seja imparável. Não perfeito, mas persistente.', favorited: false },
];

export const ALTRUISTIC_MISSIONS = [
  { title: 'Ajude um colega', description: 'Ofereça ajuda a alguém com uma tarefa ou problema.' },
  { title: 'Faça um elogio sincero', description: 'Elogie genuinamente alguém pelo trabalho ou atitude.' },
  { title: 'Doe algo', description: 'Doe um item que não usa mais para alguém que precisa.' },
  { title: 'Ensine algo', description: 'Compartilhe um conhecimento ou habilidade com alguém.' },
  { title: 'Prepare algo para alguém', description: 'Faça algo especial para outra pessoa (comida, presente, carta).' },
  { title: 'Mensagem de encorajamento', description: 'Envie uma mensagem motivacional para alguém que precisa.' },
  { title: 'Ajude um estranho', description: 'Faça algo gentil por alguém que você não conhece.' },
  { title: 'Seja voluntário', description: 'Dedique tempo a uma causa ou organização social.' },
];

export function calculateSleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

export function calculateBlockHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return (end - start) / 60;
}
