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
  scheduledTime?: string;
  scheduledDay?: string;
  // Timer tracking
  timerStartedAt?: string;
  timerCompletedAt?: string;
  actualMinutes?: number;
}

export interface Meta {
  id: string;
  title: string;
  category: Category;
  deadline: string;
  totalDays: number;
  mainAction: string;
  weeklyFrequency: number;
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

// Standalone task (Afazer)
export interface Afazer {
  id: string;
  title: string;
  description?: string;
  category: Category;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isRecurrent: boolean;
  recurrentDays?: DayOfWeek[];
  recurrentEndDate?: string;
  linkedMetaId?: string;
  completed: boolean;
  completedAt?: string;
  xpReward: number;
  createdAt: string;
  // Timer
  timerStartedAt?: string;
  timerCompletedAt?: string;
  actualMinutes?: number;
  estimatedMinutes?: number;
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
  daysUsed: number;
  categoryStreaks: Record<Category, number>;
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
  bedtime: string;
  wakeTime: string;
  days: DayOfWeek[];
}

export interface FixedTimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
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

// ====================== LEVEL SYSTEM ======================

export interface LevelDefinition {
  level: number;
  name: string;
  xpMin: number;
  xpMax: number;
  icon: string;
  requirements: string[];
  identity: string;
  motivation: string;
  description: string;
  tasksRequired: number;
  streakRequired: number;
  daysRequired: number;
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1, name: 'Despertar', xpMin: 0, xpMax: 100, icon: '🌅',
    requirements: ['Concluir pelo menos 5 tarefas', 'Usar o sistema por pelo menos 1 dia'],
    identity: 'Você deixa de ser alguém parado e começa a agir. O simples fato de estar aqui já te coloca à frente de quem nunca tentou.',
    motivation: 'Todo grande guerreiro começou dando o primeiro passo. Esse é o seu.',
    description: 'Você iniciou sua jornada. Neste nível, o mais importante é sair da inércia. Aqui não importa perfeição, apenas começar.',
    tasksRequired: 5, streakRequired: 0, daysRequired: 1,
  },
  {
    level: 2, name: 'Aprendiz', xpMin: 100, xpMax: 400, icon: '📖',
    requirements: ['Concluir pelo menos 20 tarefas', 'Usar o sistema em 3 dias diferentes', 'Iniciar uma sequência de consistência'],
    identity: 'Você se torna alguém que começou a sair do piloto automático. O ritmo está sendo criado.',
    motivation: 'A maioria das pessoas desiste antes desse ponto. Você não.',
    description: 'Você já começou a agir. Agora precisa provar que consegue continuar. O objetivo aqui é criar ritmo.',
    tasksRequired: 20, streakRequired: 1, daysRequired: 3,
  },
  {
    level: 3, name: 'Jogador', xpMin: 400, xpMax: 1000, icon: '🎮',
    requirements: ['Concluir pelo menos 50 tarefas', 'Manter uma sequência de 5 dias', 'Executar tarefas com mais frequência'],
    identity: 'Você se torna alguém consistente. Evolução vem da repetição, e você já entendeu isso.',
    motivation: 'Consistência é a mãe de todas as conquistas. Continue.',
    description: 'Agora você está jogando de verdade. Você já entendeu que evolução vem da repetição.',
    tasksRequired: 50, streakRequired: 5, daysRequired: 7,
  },
  {
    level: 4, name: 'Professor', xpMin: 1000, xpMax: 2500, icon: '🎓',
    requirements: ['Concluir pelo menos 120 tarefas', 'Manter consistência semanal', 'Manter tarefas dentro do prazo', 'Registrar aprendizados ou ajudar outros'],
    identity: 'Você não depende mais apenas de motivação. Você começou a dominar o processo.',
    motivation: 'Quem ensina, domina. Quem domina, transforma.',
    description: 'Você deixa de apenas fazer e começa a entender. A disciplina está se tornando parte de você.',
    tasksRequired: 120, streakRequired: 7, daysRequired: 14,
  },
  {
    level: 5, name: 'Mestre', xpMin: 2500, xpMax: 6000, icon: '⚔️',
    requirements: ['Concluir pelo menos 250 tarefas', 'Manter uma sequência de 15 dias', 'Ter baixa taxa de falha'],
    identity: 'Você construiu disciplina. Agora você executa mesmo sem vontade.',
    motivation: 'A disciplina é a ponte entre onde você está e onde quer chegar.',
    description: 'A disciplina começa a ser parte da sua identidade. Você executa sem depender de motivação.',
    tasksRequired: 250, streakRequired: 15, daysRequired: 30,
  },
  {
    level: 6, name: 'Grão Mestre', xpMin: 6000, xpMax: 12000, icon: '👑',
    requirements: ['Concluir pelo menos 500 tarefas', 'Manter consistência forte por 30 dias', 'Manter estabilidade nas suas rotinas'],
    identity: 'Você está em um nível elevado. Poucas pessoas chegam aqui. Você se diferencia da maioria.',
    motivation: 'Enquanto outros sonham, você executa. Essa é a diferença.',
    description: 'Poucas pessoas chegam aqui. Sua consistência é excepcional e suas rotinas são sólidas.',
    tasksRequired: 500, streakRequired: 30, daysRequired: 60,
  },
  {
    level: 7, name: 'Elite', xpMin: 12000, xpMax: 25000, icon: '💎',
    requirements: ['Concluir pelo menos 1.000 tarefas', 'Manter desempenho por 60 dias', 'Manter disciplina em múltiplas áreas'],
    identity: 'Você está acima da média. Sua consistência é real. Você se tornou referência.',
    motivation: 'Você é prova viva de que disciplina supera talento.',
    description: 'Você está acima da média. Sua consistência e execução são referência para outros.',
    tasksRequired: 1000, streakRequired: 45, daysRequired: 90,
  },
  {
    level: 8, name: 'Implacável', xpMin: 25000, xpMax: 50000, icon: '🔥',
    requirements: ['Concluir pelo menos 2.000 tarefas', 'Manter consistência por 90 dias', 'Manter alto nível de execução'],
    identity: 'Você não negocia consigo mesmo. Você executa. Extremamente raro.',
    motivation: 'Você é imparável. Continue provando isso todos os dias.',
    description: 'Você não negocia consigo mesmo. Você executa. Você se tornou extremamente raro.',
    tasksRequired: 2000, streakRequired: 60, daysRequired: 120,
  },
  {
    level: 9, name: 'Lendário', xpMin: 50000, xpMax: Infinity, icon: '🏆',
    requirements: ['XP acumulativo continua crescendo', 'Evolução contínua sem limites', 'Novos desafios desbloqueados'],
    identity: 'Você não está mais tentando evoluir. Você SE TORNOU evolução.',
    motivation: 'Lendas não param. Elas continuam criando legado.',
    description: 'Você alcançou um nível que poucos chegam. Você se tornou evolução. Novos desafios podem ser desbloqueados.',
    tasksRequired: 5000, streakRequired: 90, daysRequired: 180,
  },
];

export function getLevelFromXP(xp: number): { level: number; name: string; xpInLevel: number; xpForNext: number; icon: string; definition: LevelDefinition } {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpMin) current = lvl;
    else break;
  }
  const xpInLevel = xp - current.xpMin;
  const xpForNext = current.xpMax === Infinity ? 10000 : current.xpMax - current.xpMin;
  return { level: current.level, name: current.name, xpInLevel, xpForNext, icon: current.icon, definition: current };
}

export function checkLevelRequirements(stats: PlayerStats): { meetsRequirements: boolean; missing: string[] } {
  const levelDef = LEVELS.find(l => l.level === stats.level) || LEVELS[0];
  const missing: string[] = [];
  if (stats.totalMissionsCompleted < levelDef.tasksRequired) missing.push(`Concluir ${levelDef.tasksRequired - stats.totalMissionsCompleted} tarefas a mais`);
  if (stats.longestStreak < levelDef.streakRequired) missing.push(`Atingir sequência de ${levelDef.streakRequired} dias (melhor: ${stats.longestStreak})`);
  if (stats.daysUsed < levelDef.daysRequired) missing.push(`Usar o sistema por ${levelDef.daysRequired - stats.daysUsed} dias a mais`);
  return { meetsRequirements: missing.length === 0, missing };
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 1.5;
  if (streak >= 15) return 1.3;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1.0;
}

export function classifyTask(xp: number): string {
  if (xp >= 80) return 'CRÍTICA';
  if (xp >= 30) return 'AVANÇADA';
  if (xp >= 10) return 'PADRÃO';
  return 'MICRO';
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
  { id: '9', text: 'Todo hábito é um voto para o tipo de pessoa que você quer se tornar.', author: 'James Clear', favorited: false },
  { id: '10', text: 'Nunca quebre a cadeia duas vezes seguidas.', author: 'James Clear', favorited: false },
  { id: '11', text: 'Melhore 1% por dia. Em um ano, será 37x melhor.', author: 'James Clear', favorited: false },
  { id: '12', text: 'Você não sobe ao nível de suas metas. Cai ao nível de seus sistemas.', author: 'James Clear', favorited: false },
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
