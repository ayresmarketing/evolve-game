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
  googleEventId?: string;
  recurrentGroupId?: string;
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
  lastTaskCompletedAt?: string;
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
    level: 1, name: 'Iniciante', xpMin: 0, xpMax: 150, icon: '🌱',
    requirements: ['Conclua sua primeira tarefa'],
    identity: 'Você tomou a decisão mais difícil: a de começar.',
    motivation: 'Todo grande jogador começou aqui.',
    description: 'Todo grande jogador começou aqui. Você tomou a decisão mais difícil: a de começar. A maioria das pessoas passa a vida inteira planejando e nunca dá o primeiro passo. Você deu. Isso já te coloca à frente de quem ficou parado.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 2, name: 'Aprendiz', xpMin: 150, xpMax: 450, icon: '📖',
    requirements: ['Acumule 150 XP'],
    identity: 'Você está descobrindo que suas raízes crescem antes da árvore.',
    motivation: 'A maioria das pessoas desiste antes desse ponto. Você não.',
    description: 'Você está descobrindo que as primeiras semanas são frágeis, cada tarefa concluída está construindo uma versão mais sólida de você. Continue — as raízes crescem antes da árvore.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 3, name: 'Executor', xpMin: 450, xpMax: 950, icon: '⚡',
    requirements: ['Acumule 450 XP'],
    identity: 'Você cruzou a linha que separa quem fala de quem faz.',
    motivation: 'O mundo pertence a quem executa.',
    description: 'Você cruzou a linha que separa quem fala de quem faz. Planejar é fácil — executar exige caráter. Você está desenvolvendo esse caráter dia após dia, tarefa após tarefa. O mundo pertence a quem executa.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 4, name: 'Consistente', xpMin: 950, xpMax: 1750, icon: '🔄',
    requirements: ['Acumule 950 XP'],
    identity: 'Sua rotina tem ritmo. As pessoas ao seu redor já começam a perceber.',
    motivation: 'A consistência é um dos maiores poderes humanos.',
    description: 'Aqui mora um dos maiores poderes humanos: a consistência. Você não precisa mais de motivação para agir — você age porque decidiu agir. Sua rotina tem ritmo, suas metas têm progresso e as pessoas ao seu redor já começam a perceber a diferença.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 5, name: 'Determinado', xpMin: 1750, xpMax: 2950, icon: '💪',
    requirements: ['Acumule 1.750 XP'],
    identity: 'Cada obstáculo superado te tornou mais resistente do que era antes.',
    motivation: 'Isso não é sorte — é determinação sendo forjada.',
    description: 'Você já enfrentou dias difíceis e não desistiu. Já teve vontade de parar e continuou. Isso não é sorte — é determinação sendo forjada. Cada obstáculo que você superou até aqui te tornou mais resistente do que era antes.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 6, name: 'Focado', xpMin: 2950, xpMax: 4950, icon: '🎯',
    requirements: ['Acumule 2.950 XP'],
    identity: 'O foco não é um dom — é uma escolha que você faz todos os dias.',
    motivation: 'E você está escolhendo certo.',
    description: 'Suas ações têm direção. Você aprendeu a dizer não para o que não importa e sim para o que te aproxima dos seus objetivos. O foco não é um dom — é uma escolha que você faz todos os dias. E você está escolhendo certo.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 7, name: 'Disciplinado', xpMin: 4950, xpMax: 8450, icon: '🛡️',
    requirements: ['Acumule 4.950 XP'],
    identity: 'Você age independente de como está se sentindo.',
    motivation: 'Sentimentos passam e resultados ficam.',
    description: 'A disciplina chegou para ficar. Você não depende mais do humor do dia para executar. Você age independente de como está se sentindo, porque entendeu que sentimentos passam e resultados ficam. Você está se tornando alguém em quem se pode confiar — começando por você mesmo.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 8, name: 'Estratégico', xpMin: 8450, xpMax: 13950, icon: '🧠',
    requirements: ['Acumule 8.450 XP'],
    identity: 'Você não corre mais em círculos — você avança em linha reta.',
    motivation: 'Tempo e energia são recursos que precisam ser investidos com inteligência.',
    description: 'Você evoluiu além da execução. Agora você pensa antes de agir, escolhe as batalhas certas e entende que tempo e energia são recursos que precisam ser investidos com inteligência. Você não corre mais em círculos — você avança em linha reta.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 9, name: 'Alto Desempenho', xpMin: 13950, xpMax: 21950, icon: '🚀',
    requirements: ['Acumule 13.950 XP'],
    identity: 'Seu esforço virou identidade.',
    motivation: 'Enquanto outros buscam conforto, você busca crescimento.',
    description: 'Você opera em um nível que a maioria das pessoas nunca vai conhecer. Não porque é mais talentoso, mas porque enquanto outros buscam conforto, você busca crescimento. Sua consistência virou resultado. Seu esforço virou identidade.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 10, name: 'Elite', xpMin: 21950, xpMax: 33950, icon: '💎',
    requirements: ['Acumule 21.950 XP'],
    identity: 'Você é prova viva de que disciplina aplicada transforma vidas.',
    motivation: 'Poucos chegam aqui — não por falta de capacidade, mas de comprometimento.',
    description: 'Poucos chegam aqui. Não por falta de capacidade, mas por falta de comprometimento. Você se comprometeu. Você se manteve no jogo quando tudo dentro de você queria pausar. Você é prova viva de que disciplina aplicada transforma vidas — e a sua está sendo transformada.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 11, name: 'Elite II', xpMin: 33950, xpMax: 50950, icon: '💎',
    requirements: ['Acumule 33.950 XP'],
    identity: 'Você está construindo uma versão de si que poucos alcançam.',
    motivation: 'Cada dia executado é um tijolo na sua fundação.',
    description: 'Você passou pelo ponto onde a maioria desiste. Seu comprometimento deixou de ser uma intenção e se tornou uma identidade. Cada dia executado é um tijolo na fundação de uma vida que poucos alcançam. Continue construindo.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 12, name: 'Elite III', xpMin: 50950, xpMax: 73950, icon: '💎',
    requirements: ['Acumule 50.950 XP'],
    identity: 'Sua disciplina já é um ativo. Ninguém pode te tirar isso.',
    motivation: 'O que você construiu até aqui é permanente.',
    description: 'Você entrou em um território onde a execução diária já não é mais um esforço — é um reflexo. Sua disciplina já é um ativo. Ninguém pode te tirar o que você construiu até aqui. Continue avançando.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 13, name: 'Elite IV', xpMin: 73950, xpMax: 103950, icon: '💎',
    requirements: ['Acumule 73.950 XP'],
    identity: 'Você se tornou referência silenciosa para quem está ao redor.',
    motivation: 'Resultados acumulados ao longo do tempo são impossíveis de ignorar.',
    description: 'Resultados acumulados ao longo do tempo são impossíveis de ignorar. Você se tornou uma referência silenciosa para quem está ao seu redor. Não por palavras, mas por ações consistentes que falam mais alto do que qualquer discurso.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 14, name: 'Elite V', xpMin: 103950, xpMax: 141950, icon: '💎',
    requirements: ['Acumule 103.950 XP'],
    identity: 'Você cruzou o limiar entre executar e dominar.',
    motivation: 'Pouquíssimas pessoas chegam aqui. Você é uma delas.',
    description: 'Você cruzou o limiar entre executar e dominar. A consistência que parecia difícil no início agora é quem você é. Pouquíssimas pessoas chegam aqui. Você é uma delas. O próximo nível é Lendário — e você está perto.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 15, name: 'Lendário', xpMin: 141950, xpMax: 188950, icon: '👑',
    requirements: ['Acumule 141.950 XP'],
    identity: 'Sua história inspira sem que você precise dizer uma palavra.',
    motivation: 'Lendas são construídas em mil dias de escolhas certas.',
    description: 'Você não joga mais só por você. Sua evolução se tornou uma referência silenciosa para quem está ao seu redor. Sua história inspira sem que você precise dizer uma palavra. Lendas não são criadas em um dia — são construídas em mil dias de escolhas certas. Você fez as suas.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 16, name: 'Lendário II', xpMin: 188950, xpMax: 245950, icon: '👑',
    requirements: ['Acumule 188.950 XP'],
    identity: 'Você avança porque é quem você decidiu ser.',
    motivation: 'Não é motivação que te move — é identidade.',
    description: 'Aqui, a motivação é apenas um detalhe. Você avança porque é quem você decidiu ser. Não é um estado de espírito — é uma escolha permanente que você renova todos os dias com cada tarefa concluída.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 17, name: 'Lendário III', xpMin: 245950, xpMax: 313950, icon: '👑',
    requirements: ['Acumule 245.950 XP'],
    identity: 'Sua trajetória já é prova de que o impossível é apenas o que ainda não foi tentado.',
    motivation: 'O que você realiza diariamente inspira o que os outros sonham.',
    description: 'Sua trajetória já é prova de que o impossível é apenas o que ainda não foi tentado. O que você realiza diariamente inspira o que os outros apenas sonham. Você não é mais um aspirante — você é uma referência.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 18, name: 'Lendário IV', xpMin: 313950, xpMax: 393950, icon: '👑',
    requirements: ['Acumule 313.950 XP'],
    identity: 'Você superou versões de si mesmo que a maioria nunca ousou imaginar.',
    motivation: 'A jornada te transformou além do que você esperava.',
    description: 'Você chegou aqui não pelo talento, mas pela persistência inquebrantável. A jornada te transformou além do que você esperava. Você superou versões de si mesmo que a maioria nunca ousou imaginar. Cada dia é agora uma afirmação do que você se tornou.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 19, name: 'Lendário V', xpMin: 393950, xpMax: 486950, icon: '👑',
    requirements: ['Acumule 393.950 XP'],
    identity: 'Você está a um passo do topo — e cada ação te leva mais perto.',
    motivation: 'A última fronteira antes do nível máximo.',
    description: 'Você está na última fronteira antes do nível máximo. Cada tarefa concluída aqui é um ato de coragem e comprometimento que muito poucos jamais experenciarão. Você está a um passo do topo — e cada ação te leva mais perto.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
  },
  {
    level: 20, name: 'Mestre da Vida', xpMin: 486950, xpMax: Infinity, icon: '🏆',
    requirements: ['Acumule 486.950 XP'],
    identity: 'Você transformou quem era em quem sempre soube que poderia ser.',
    motivation: 'Esse nível não é um destino — é a prova de que você nunca mais vai ser o mesmo.',
    description: 'Você chegou onde pouquíssimos chegam. Não porque a jornada foi fácil, mas porque você escolheu continuar mesmo quando era difícil. Você transformou quem era em quem sempre soube que poderia ser. Esse nível não é um destino — é a prova de que você nunca mais vai ser o mesmo.',
    tasksRequired: 0, streakRequired: 0, daysRequired: 0,
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
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

/** Retorna XP baseado no tempo estimado de execução */
export function getXPFromMinutes(minutes?: number): number {
  if (!minutes || minutes <= 0) return 20;
  if (minutes <= 15) return 20;
  if (minutes <= 45) return 50;
  if (minutes <= 120) return 100;
  return 200;
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
