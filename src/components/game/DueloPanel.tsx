import { useState, useEffect, useCallback, useMemo } from 'react';
import { Swords, Plus, Users, Trophy, Clock, Check, X, Trash2, AlertTriangle, Crown, Medal, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───
interface DueloTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdBy: string;
  completions: Record<string, { completedAt: string }>;
  deletionRequests: string[];
}

interface DueloParticipant {
  id: string;
  name: string;
  email: string;
  accepted: boolean;
  joinedAt: string;
}

interface DueloConfig {
  allowNewParticipants: boolean;
  allowParticipantTasks: boolean;
  hasReward: boolean;
  reward: string;
}

interface Duelo {
  id: string;
  name: string;
  createdBy: string;
  startDate: string;
  endDate: string;
  config: DueloConfig;
  participants: DueloParticipant[];
  tasks: DueloTask[];
  createdAt: string;
}

interface IncomingInvite {
  id: string;
  duelo_name: string;
  inviter_email: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const STORAGE_KEY = 'lifequest_duelos';
const CURRENT_USER = { id: 'me', name: 'Você', email: 'jogador@lifequest.com' };

function generateId() { return Math.random().toString(36).substring(2, 15); }

function loadDuelos(): Duelo[] {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}

// ─── Main Component ───
export function DueloPanel() {
  const { user } = useAuth();
  const [duelos, setDuelos] = useState<Duelo[]>(loadDuelos);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [selectedDuelo, setSelectedDuelo] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(duelos)); }, [duelos]);

  const activeDuelos = duelos.filter(d => new Date(d.endDate) >= new Date());
  const pastDuelos = duelos.filter(d => new Date(d.endDate) < new Date());

  const addDuelo = useCallback((duelo: Duelo) => {
    setDuelos(prev => [...prev, duelo]);
    setShowCreate(false);
    toast.success('Duelo criado com sucesso! ⚔️');
  }, []);

  const loadInvites = useCallback(async () => {
    if (!user?.email) return;
    const { data, error } = await supabase
      .from('duelo_invites' as any)
      .select('*')
      .eq('invitee_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error) setIncomingInvites((data as IncomingInvite[]) || []);
  }, [user?.email]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const answerInvite = useCallback(async (id: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('duelo_invites' as any)
      .update({ status })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao responder convite');
      return;
    }
    toast.success(status === 'accepted' ? 'Convite aceito!' : 'Convite recusado');
    loadInvites();
  }, [loadInvites]);

  const deleteDuelo = useCallback((id: string) => {
    setDuelos(prev => prev.filter(d => d.id !== id));
    setSelectedDuelo(null);
    toast.success('Duelo removido');
  }, []);

  const updateDuelo = useCallback((id: string, updater: (d: Duelo) => Duelo) => {
    setDuelos(prev => prev.map(d => d.id === id ? updater(d) : d));
  }, []);

  const active = selectedDuelo ? duelos.find(d => d.id === selectedDuelo) : null;

  if (active) {
    return <DueloDashboard duelo={active} onBack={() => setSelectedDuelo(null)} onUpdate={updateDuelo} onDelete={deleteDuelo} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="section-card text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-game-fire to-game-orange mx-auto flex items-center justify-center mb-3 shadow-lg">
          <Swords className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display text-lg text-foreground mb-1">Duelos</h2>
        <p className="text-sm text-muted-foreground font-body">Compita com outros e mantenha a consistência</p>
      </div>

      {/* Create button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button onClick={() => setShowCreate(!showCreate)} className="w-full section-card flex items-center gap-3 hover:border-primary/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-body font-semibold text-foreground">Criar novo duelo</p>
            <p className="text-[11px] text-muted-foreground font-body">Desafie alguém e prove sua disciplina</p>
          </div>
        </button>
        <button onClick={() => setShowInvites(v => !v)} className="w-full section-card flex items-center gap-3 hover:border-primary/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Inbox className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-body font-semibold text-foreground">Ver meus convites</p>
            <p className="text-[11px] text-muted-foreground font-body">{incomingInvites.length} pendente(s)</p>
          </div>
        </button>
      </div>

      {showCreate && <CreateDueloForm onSubmit={addDuelo} onCancel={() => setShowCreate(false)} />}
      {showInvites && (
        <div className="section-card space-y-3">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">📨 Meus convites</h3>
          {incomingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Nenhum convite pendente.</p>
          ) : incomingInvites.map(inv => (
            <div key={inv.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-sm font-body font-semibold text-foreground">{inv.duelo_name}</p>
              <p className="text-xs text-muted-foreground font-body">De: {inv.inviter_email}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => answerInvite(inv.id, 'accepted')} className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-body">Aceitar</button>
                <button onClick={() => answerInvite(inv.id, 'declined')} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-body">Recusar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active duelos */}
      {activeDuelos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">⚔️ Duelos Ativos ({activeDuelos.length})</h3>
          {activeDuelos.map(d => (
            <DueloCard key={d.id} duelo={d} onClick={() => setSelectedDuelo(d.id)} />
          ))}
        </div>
      )}

      {/* Past duelos */}
      {pastDuelos.length > 0 && (
        <div className="space-y-3 opacity-60">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">🏆 Duelos Finalizados ({pastDuelos.length})</h3>
          {pastDuelos.map(d => (
            <DueloCard key={d.id} duelo={d} onClick={() => setSelectedDuelo(d.id)} />
          ))}
        </div>
      )}

      {activeDuelos.length === 0 && pastDuelos.length === 0 && !showCreate && (
        <div className="section-card text-center py-8">
          <p className="text-muted-foreground font-body text-sm">Nenhum duelo ainda.</p>
          <p className="text-muted-foreground font-body text-xs mt-1">Crie um duelo e desafie alguém!</p>
        </div>
      )}
    </div>
  );
}

// ─── Duelo Card ───
function DueloCard({ duelo, onClick }: { duelo: Duelo; onClick: () => void }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(duelo.endDate).getTime() - Date.now()) / 86400000));
  const isActive = daysLeft > 0;
  const totalTasks = duelo.tasks.length;
  const myCompleted = duelo.tasks.filter(t => t.completions[CURRENT_USER.id]).length;

  return (
    <button onClick={onClick} className="w-full section-card hover:border-primary/30 transition-all text-left">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-game-fire/10' : 'bg-muted'}`}>
          <Swords className={`w-5 h-5 ${isActive ? 'text-game-fire' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold text-foreground truncate">{duelo.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
              <Users className="w-3 h-3" /> {duelo.participants.length}
            </span>
            <span className="text-[10px] text-muted-foreground font-body">
              {myCompleted}/{totalTasks} tarefas
            </span>
            {isActive && <span className="text-[10px] text-game-fire font-body font-semibold">{daysLeft}d restantes</span>}
          </div>
        </div>
        {isActive ? (
          <div className="text-[10px] px-2 py-1 rounded-full bg-game-fire/10 text-game-fire font-body font-semibold">Ativo</div>
        ) : (
          <div className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-body">Encerrado</div>
        )}
      </div>
    </button>
  );
}

// ─── Create Duelo Form ───
function CreateDueloForm({ onSubmit, onCancel }: { onSubmit: (d: Duelo) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [emails, setEmails] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; });
  const [allowNew, setAllowNew] = useState(false);
  const [allowTasks, setAllowTasks] = useState(true);
  const [hasReward, setHasReward] = useState(false);
  const [reward, setReward] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Dê um nome ao duelo'); return; }
    const participantEmails = emails.split(',').map(e => e.trim()).filter(Boolean);
    const participants: DueloParticipant[] = [
      { id: CURRENT_USER.id, name: CURRENT_USER.name, email: CURRENT_USER.email, accepted: true, joinedAt: new Date().toISOString() },
      ...participantEmails.map(email => ({
        id: generateId(), name: email.split('@')[0], email, accepted: false, joinedAt: '',
      })),
    ];

    onSubmit({
      id: generateId(), name: name.trim(), createdBy: CURRENT_USER.id,
      startDate, endDate, participants, tasks: [], createdAt: new Date().toISOString(),
      config: { allowNewParticipants: allowNew, allowParticipantTasks: allowTasks, hasReward, reward: reward.trim() },
    });
  };

  const inputCls = "w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="section-card space-y-4">
      <h3 className="font-display text-sm text-foreground">Novo Duelo</h3>

      <div>
        <label className="text-[11px] font-body text-muted-foreground font-semibold mb-1 block">Nome do duelo</label>
        <input className={inputCls} placeholder="Ex: Desafio 30 dias fitness" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div>
        <label className="text-[11px] font-body text-muted-foreground font-semibold mb-1 block">Convidar participantes (e-mails separados por vírgula)</label>
        <input className={inputCls} placeholder="amigo@email.com, outro@email.com" value={emails} onChange={e => setEmails(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-body text-muted-foreground font-semibold mb-1 block">Início</label>
          <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-[11px] font-body text-muted-foreground font-semibold mb-1 block">Término</label>
          <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Config toggles */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={allowNew} onChange={e => setAllowNew(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <span className="text-sm font-body text-foreground">Permitir novos participantes após início</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={allowTasks} onChange={e => setAllowTasks(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <span className="text-sm font-body text-foreground">Permitir que convidados criem tarefas</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={hasReward} onChange={e => setHasReward(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <span className="text-sm font-body text-foreground">Definir recompensa para o ganhador</span>
        </label>
        {hasReward && (
          <input className={inputCls} placeholder="Ex: Jantar pago pelo perdedor" value={reward} onChange={e => setReward(e.target.value)} />
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
        <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-body font-semibold hover:bg-primary/90 transition-colors shadow-glow-cyan">Criar Duelo ⚔️</button>
      </div>
    </div>
  );
}

// ─── Duelo Dashboard ───
function DueloDashboard({ duelo, onBack, onUpdate, onDelete }: {
  duelo: Duelo;
  onBack: () => void;
  onUpdate: (id: string, updater: (d: Duelo) => Duelo) => void;
  onDelete: (id: string) => void;
}) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState(duelo.endDate);
  const [expandedRanking, setExpandedRanking] = useState(true);

  const daysLeft = Math.max(0, Math.ceil((new Date(duelo.endDate).getTime() - Date.now()) / 86400000));
  const isActive = daysLeft > 0;

  // Ranking calculation
  const ranking = useMemo(() => {
    return duelo.participants
      .filter(p => p.accepted)
      .map(p => {
        const completed = duelo.tasks.filter(t => t.completions[p.id]).length;
        const total = duelo.tasks.length;
        const onTime = duelo.tasks.filter(t => {
          const c = t.completions[p.id];
          return c && new Date(c.completedAt) <= new Date(t.deadline + 'T23:59:59');
        }).length;
        const rate = total > 0 ? Math.round(completed / total * 100) : 0;
        // Score: completed tasks * 10 + on-time bonus * 5
        const score = completed * 10 + onTime * 5;
        return { ...p, completed, total, rate, onTime, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [duelo]);

  const addTask = () => {
    if (!taskTitle.trim()) { toast.error('Dê um nome à tarefa'); return; }
    onUpdate(duelo.id, d => ({
      ...d,
      tasks: [...d.tasks, {
        id: generateId(), title: taskTitle.trim(), description: taskDesc.trim(),
        deadline: taskDeadline, createdBy: CURRENT_USER.id,
        completions: {}, deletionRequests: [],
      }],
    }));
    setTaskTitle(''); setTaskDesc(''); setShowAddTask(false);
    toast.success('Tarefa adicionada ao duelo! 📋');
  };

  const toggleTaskCompletion = (taskId: string) => {
    onUpdate(duelo.id, d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id !== taskId) return t;
        const completions = { ...t.completions };
        if (completions[CURRENT_USER.id]) {
          delete completions[CURRENT_USER.id];
        } else {
          completions[CURRENT_USER.id] = { completedAt: new Date().toISOString() };
        }
        return { ...t, completions };
      }),
    }));
  };

  const requestDeleteTask = (taskId: string) => {
    onUpdate(duelo.id, d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id !== taskId) return t;
        const reqs = t.deletionRequests.includes(CURRENT_USER.id)
          ? t.deletionRequests
          : [...t.deletionRequests, CURRENT_USER.id];
        // If all participants approved, remove the task
        if (reqs.length >= d.participants.filter(p => p.accepted).length) {
          return null as any; // Will be filtered out
        }
        return { ...t, deletionRequests: reqs };
      }).filter(Boolean),
    }));
    toast.info('Solicitação de exclusão enviada');
  };

  // Simulate accepting pending invites (for demo)
  const acceptInvite = (participantId: string) => {
    onUpdate(duelo.id, d => ({
      ...d,
      participants: d.participants.map(p =>
        p.id === participantId ? { ...p, accepted: true, joinedAt: new Date().toISOString() } : p
      ),
    }));
    toast.success('Participante aceito! 🎉');
  };

  const inputCls = "w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (i === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-body font-bold text-muted-foreground">{i + 1}º</span>;
  };

  return (
    <div className="space-y-5">
      {/* Back button + header */}
      <button onClick={onBack} className="text-sm text-primary font-body flex items-center gap-1 hover:underline">
        ← Voltar aos duelos
      </button>

      <div className="section-card">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isActive ? 'bg-gradient-to-br from-game-fire to-game-orange' : 'bg-muted'}`}>
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-foreground">{duelo.name}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground font-body flex items-center gap-1">
                <Users className="w-3 h-3" /> {duelo.participants.filter(p => p.accepted).length} participantes
              </span>
              {isActive && <span className="text-[11px] text-game-fire font-body font-semibold">{daysLeft} dias restantes</span>}
              {!isActive && <span className="text-[11px] text-muted-foreground font-body">Encerrado</span>}
            </div>
          </div>
        </div>
        {duelo.config.hasReward && duelo.config.reward && (
          <div className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mt-2">
            <p className="text-[11px] text-yellow-600 dark:text-yellow-400 font-body">🏆 Recompensa: {duelo.config.reward}</p>
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="section-card">
        <button onClick={() => setExpandedRanking(!expandedRanking)} className="w-full flex items-center justify-between">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Ranking
          </h3>
          {expandedRanking ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {expandedRanking && (
          <div className="space-y-2 mt-3">
            {ranking.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                i === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-secondary/20 border-border/50'
              }`}>
                <div className="w-8 flex items-center justify-center">{getRankIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-foreground truncate">
                    {p.name} {p.id === CURRENT_USER.id && <span className="text-[10px] text-primary">(você)</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-body">✅ {p.completed}/{p.total}</span>
                    <span className="text-[10px] text-muted-foreground font-body">📊 {p.rate}%</span>
                    <span className="text-[10px] text-muted-foreground font-body">⏰ {p.onTime} no prazo</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-bold text-primary">{p.score}</p>
                  <p className="text-[9px] text-muted-foreground font-body">pontos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {duelo.participants.filter(p => !p.accepted).length > 0 && (
        <div className="section-card">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-3">Convites Pendentes</h3>
          <div className="space-y-2">
            {duelo.participants.filter(p => !p.accepted).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                <div>
                  <p className="text-sm font-body font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{p.email}</p>
                </div>
                <button onClick={() => acceptInvite(p.id)} className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body font-semibold hover:bg-primary/20 transition-colors">
                  Simular Aceite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">📋 Tarefas do Duelo ({duelo.tasks.length})</h3>
          {isActive && (duelo.config.allowParticipantTasks || duelo.createdBy === CURRENT_USER.id) && (
            <button onClick={() => setShowAddTask(!showAddTask)} className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Nova tarefa
            </button>
          )}
        </div>

        {showAddTask && (
          <div className="space-y-3 mb-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
            <input className={inputCls} placeholder="Nome da tarefa" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            <input className={inputCls} placeholder="Descrição (opcional)" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
            <div>
              <label className="text-[11px] font-body text-muted-foreground font-semibold mb-1 block">Prazo</label>
              <input type="date" className={inputCls} value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddTask(false)} className="flex-1 px-3 py-2 rounded-xl border border-border text-sm font-body text-muted-foreground">Cancelar</button>
              <button onClick={addTask} className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-semibold">Adicionar</button>
            </div>
          </div>
        )}

        {duelo.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhuma tarefa adicionada ainda</p>
        ) : (
          <div className="space-y-2">
            {duelo.tasks.map(task => {
              const myCompleted = !!task.completions[CURRENT_USER.id];
              const completedCount = Object.keys(task.completions).length;
              const totalParticipants = duelo.participants.filter(p => p.accepted).length;
              const isPastDeadline = new Date(task.deadline + 'T23:59:59') < new Date();
              const deleteRequested = task.deletionRequests.includes(CURRENT_USER.id);

              return (
                <div key={task.id} className={`p-3 rounded-xl border transition-all ${
                  myCompleted ? 'bg-game-green/5 border-game-green/20' :
                  isPastDeadline ? 'bg-destructive/5 border-destructive/20' :
                  'bg-secondary/20 border-border/50'
                }`}>
                  <div className="flex items-start gap-3">
                    {isActive && (
                      <button onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          myCompleted ? 'bg-game-green border-game-green text-white' : 'border-border hover:border-primary'
                        }`}>
                        {myCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body font-semibold ${myCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                      {task.description && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(task.deadline + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-body">
                          ✅ {completedCount}/{totalParticipants}
                        </span>
                        {isPastDeadline && !myCompleted && (
                          <span className="text-[10px] text-destructive font-body flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Atrasada
                          </span>
                        )}
                      </div>
                      {/* Show who completed */}
                      {completedCount > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(task.completions).map(([uid, c]) => {
                            const participant = duelo.participants.find(p => p.id === uid);
                            return (
                              <span key={uid} className="text-[9px] px-1.5 py-0.5 rounded bg-game-green/10 text-game-green font-body">
                                {participant?.name || uid} • {new Date(c.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {isActive && !deleteRequested && (
                      <button onClick={() => requestDeleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Solicitar exclusão">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {deleteRequested && (
                      <span className="text-[9px] text-muted-foreground font-body">Exclusão solicitada</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete duelo */}
      <button onClick={() => { if (confirm('Tem certeza que deseja excluir este duelo?')) onDelete(duelo.id); }}
        className="w-full text-center text-sm text-destructive font-body py-3 hover:underline">
        Excluir duelo
      </button>
    </div>
  );
}
