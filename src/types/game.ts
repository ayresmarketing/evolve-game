export type Category = 'pessoal' | 'trabalho' | 'espiritual';

export type AlertTone = 'leve' | 'equilibrado' | 'confrontador';

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
  frequency: string; // ex: "diária", "semanal"
  dailyTarget: string; // ex: "10 páginas"
  etapas: Etapa[];
  completedToday: boolean;
  xpReward: number;
}

export interface Meta {
  id: string;
  title: string;
  category: Category;
  deadline: string; // ISO date
  totalDays: number;
  volume?: string; // ex: "300 páginas"
  missions: Mission[];
  progress: number; // 0-100
  xpTotal: number;
  xpEarned: number;
  completed: boolean;
  createdAt: string;
  reward?: string;
  benefits30d?: string;
  benefits6m?: string;
  benefits1y?: string;
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
  trabalho: { label: 'Trabalho', color: 'game-orange', glowClass: 'text-game-orange' },
  espiritual: { label: 'Espiritual', color: 'game-blue', glowClass: 'text-game-blue' },
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
