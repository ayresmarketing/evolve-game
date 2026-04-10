import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Trash2, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight, Pencil, Check, X,
  CalendarDays, Sliders, BarChart3,
  RefreshCw, Wifi, WifiOff, AlertCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { financeClient, financeConfigured } from '@/integrations/supabase/financeClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type TransactionType = 'income' | 'expense';

type ExpenseCategory =
  | 'alimentacao' | 'transporte' | 'moradia' | 'saude' | 'lazer'
  | 'educacao' | 'vestuario' | 'pets' | 'beleza' | 'filhos'
  | 'assinaturas' | 'presentes' | 'emergencias' | 'investimentos'
  | 'dividas' | 'eletronicos' | 'outros';

interface Transaction {
  id: string;
  shortId: string;       // gasto_id / receb_id — shown in UI
  title: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  date: string;
  isRecurrent: boolean;
  _sourceTable: 'Gastos' | 'Recebimentos';
  _sourceId: number;
}

interface GastoRow {
  id: number;
  created_at: string;
  lead_nome: string | null;
  whatsapp: string | null;
  nome_gasto: string | null;
  valor_gasto: number | null;
  categoria_gasto: string | null;
  data_do_gasto: string | null;
  gasto_id: string | null;
}

interface RecebimentoRow {
  id: number;
  created_at: string;
  lead_nome: string | null;
  whatsapp: string | null;
  receb_fixos: number | null;
  receb_id: string | null;
  receb_var: number | null;
  data_receb: string | null;
  receb_nome: string | null;
  receb_categoria: string | null;
  tipo: string | null;
}

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const CATEGORIES: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  alimentacao:   { label: 'Alimentação',           emoji: '🍽',  color: '#f97316' },
  transporte:    { label: 'Transporte',             emoji: '🚗',  color: '#3b82f6' },
  moradia:       { label: 'Moradia',                emoji: '🏠',  color: '#8b5cf6' },
  saude:         { label: 'Despesas médicas',        emoji: '🦩',  color: '#ec4899' },
  lazer:         { label: 'Lazer',                  emoji: '🎉',  color: '#eab308' },
  educacao:      { label: 'Educação',               emoji: '🎓',  color: '#06b6d4' },
  vestuario:     { label: 'Vestuário',              emoji: '👗',  color: '#f43f5e' },
  pets:          { label: 'Pets',                   emoji: '🐾',  color: '#84cc16' },
  beleza:        { label: 'Beleza e cuidados',      emoji: '💇',  color: '#a855f7' },
  filhos:        { label: 'Filhos',                 emoji: '🧸',  color: '#fb923c' },
  assinaturas:   { label: 'Assinaturas e serviços', emoji: '📺',  color: '#22d3ee' },
  presentes:     { label: 'Presentes e doações',    emoji: '🎁',  color: '#f472b6' },
  emergencias:   { label: 'Emergências',            emoji: '🚨',  color: '#ef4444' },
  investimentos: { label: 'Investimentos',          emoji: '📈',  color: '#22c55e' },
  dividas:       { label: 'Dívidas / Empréstimos', emoji: '💳',  color: '#64748b' },
  eletronicos:   { label: 'Eletrônicos',            emoji: '🔌',  color: '#0ea5e9' },
  outros:        { label: 'Outros',                 emoji: '📦',  color: '#94a3b8' },
};

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function generateId() {
  return Math.random().toString(36).substring(2, 7); // max 5 chars
}

/** Map internal category key → exact Supabase label */
const CATEGORY_SUPABASE_LABEL: Record<ExpenseCategory, string> = {
  alimentacao:   'Alimentação',
  transporte:    'Transporte',
  moradia:       'Moradia',
  saude:         'Despesas médicas',
  lazer:         'Lazer',
  educacao:      'Educação',
  vestuario:     'Vestuário',
  pets:          'Pets',
  beleza:        'Beleza e cuidados pessoais',
  filhos:        'Filhos',
  assinaturas:   'Assinaturas e serviços',
  presentes:     'Presentes e doações',
  emergencias:   'Emergências / Imprevistos',
  investimentos: 'Investimentos',
  dividas:       'Dívidas / Empréstimos',
  eletronicos:   'Eletrônicos',
  outros:        'Outros',
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dateLabel(date: string) {
  return new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getDateRange(days: number, startDate?: string, endDate?: string): string[] {
  // Se tiver data de início e fim, usa elas
  if (startDate && endDate) {
    const dates: string[] = [];
    const cur = new Date(startDate + 'T12:00');
    const end = new Date(endDate + 'T12:00');
    // Garante que a data de início não seja depois da data de fim
    if (cur > end) return dates;
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  // Se days for 1, retorna apenas hoje
  if (days === 1) {
    return [new Date().toISOString().split('T')[0]];
  }
  // Se days for 0 ou negativo, retorna array vazio
  if (days <= 0) return [];
  // Retorna os últimos 'days' dias
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function mapCategory(cat: string | null): ExpenseCategory {
  if (!cat) return 'outros';
  const c = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (c.includes('aliment') || c.includes('mercado') || c.includes('comida') || c.includes('ifood')) return 'alimentacao';
  if (c.includes('transport') || c.includes('uber') || c.includes('gasolina') || c.includes('onibus')) return 'transporte';
  if (c.includes('morad') || c.includes('aluguel') || c.includes('luz') || c.includes('agua')) return 'moradia';
  if (c.includes('saude') || c.includes('medic') || c.includes('farmac') || c.includes('consulta')) return 'saude';
  if (c.includes('lazer') || c.includes('cinema') || c.includes('bar') || c.includes('viagem')) return 'lazer';
  if (c.includes('educa') || c.includes('curso') || c.includes('livro') || c.includes('escola')) return 'educacao';
  if (c.includes('vestuario') || c.includes('roupa') || c.includes('tenis') || c.includes('calcado')) return 'vestuario';
  if (c.includes('pet') || c.includes('racao') || c.includes('veterinario')) return 'pets';
  if (c.includes('beleza') || c.includes('salao') || c.includes('academia') || c.includes('cabelo')) return 'beleza';
  if (c.includes('filho') || c.includes('crianca') || c.includes('fralda') || c.includes('brinquedo')) return 'filhos';
  if (c.includes('assina') || c.includes('netflix') || c.includes('spotify') || c.includes('streaming')) return 'assinaturas';
  if (c.includes('presente') || c.includes('doacao')) return 'presentes';
  if (c.includes('emergencia') || c.includes('imprevisto') || c.includes('multa') || c.includes('conserto')) return 'emergencias';
  if (c.includes('invest') || c.includes('acoes') || c.includes('poupanca')) return 'investimentos';
  if (c.includes('divida') || c.includes('emprestimo') || c.includes('parcela') || c.includes('financiamento')) return 'dividas';
  if (c.includes('eletronico') || c.includes('celular') || c.includes('tablet') || c.includes('computador')) return 'eletronicos';
  return 'outros';
}

function gastoToTransaction(row: GastoRow): Transaction {
  const dateStr = row.data_do_gasto || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
  return {
    id: `gasto_${row.id}`,
    shortId: row.gasto_id || String(row.id),
    title: row.nome_gasto || '(sem nome)',
    amount: Number(row.valor_gasto) || 0,
    type: 'expense',
    category: mapCategory(row.categoria_gasto),
    date: dateStr,
    isRecurrent: false,
    _sourceTable: 'Gastos',
    _sourceId: row.id,
  };
}

function recebimentoToTransaction(row: RecebimentoRow): Transaction {
  const dateStr = row.data_receb || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
  return {
    id: `receb_${row.id}`,
    shortId: row.receb_id || String(row.id),
    title: row.receb_nome || '(sem nome)',
    amount: Number(row.receb_fixos || 0) + Number(row.receb_var || 0),
    type: 'income',
    category: 'outros',
    date: dateStr,
    isRecurrent: row.tipo === 'fixo',
    _sourceTable: 'Recebimentos',
    _sourceId: row.id,
  };
}

const tooltipStyle = {
  backgroundColor: 'hsl(240 16% 10%)',
  border: '1px solid hsl(240 14% 20%)',
  borderRadius: '10px',
  fontSize: '11px',
  color: '#f5f0e0',
};

/* ═══════════════════════════════════════════════════════
   COMPONENT — Daily Cash Flow Chart
═══════════════════════════════════════════════════════ */
function DailyCashFlowChart({ transactions }: { transactions: Transaction[] }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [range, setRange] = useState(7);
  const [useCustom, setUseCustom] = useState(false);
  const [useToday, setUseToday] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const dateRange = useMemo(() => {
    if (useToday) return [todayStr];
    if (useCustom && customStart && customEnd) return getDateRange(0, customStart, customEnd);
    return getDateRange(range);
  }, [range, useCustom, useToday, customStart, customEnd, todayStr]);

  const chartData = useMemo(() =>
    dateRange.map(date => {
      const dayTx = transactions.filter(t => t.date === date);
      return {
        label: dateLabel(date),
        Receitas: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Despesas: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    }), [dateRange, transactions]);

  const isEmpty = chartData.every(d => d.Receitas === 0 && d.Despesas === 0);

  const selectRange = (d: number) => { setRange(d); setUseCustom(false); setUseToday(false); setShowCustom(false); };
  const selectToday = () => { setUseToday(true); setUseCustom(false); setShowCustom(false); };

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" /> Receitas e Despesas por Dia
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Hoje */}
          <button onClick={selectToday}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-display tracking-wider transition-all border ${
              useToday ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}>Hoje</button>
          {/* 7 / 14 / 30 */}
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => selectRange(d)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-display tracking-wider transition-all border ${
                !useCustom && !useToday && range === d
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}>{d}d</button>
          ))}
          {/* Período custom */}
          <button onClick={() => setShowCustom(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-display tracking-wider transition-all border ${
              useCustom ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
            }`}><Sliders className="w-2.5 h-2.5" /> Período</button>
        </div>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="date" value={customStart}
            onChange={e => { setCustomStart(e.target.value); if (customEnd) { setUseCustom(true); setUseToday(false); } }}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50" />
          <span className="text-[10px] text-muted-foreground">até</span>
          <input type="date" value={customEnd} min={customStart}
            onChange={e => { setCustomEnd(e.target.value); if (customStart) { setUseCustom(true); setUseToday(false); } }}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50" />
          {useCustom && (
            <button onClick={() => { setUseCustom(false); setCustomStart(''); setCustomEnd(''); setShowCustom(false); }}
              className="text-[10px] text-destructive font-body hover:underline">Limpar</button>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center py-10 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground font-body">Nenhuma transação no período</p>
        </div>
      ) : (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 14% 18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(240 8% 56%)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(240 8% 56%)' }} tickFormatter={v => `R$${v}`} allowDecimals={false} />
                <ChartTooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f5f0e0', marginBottom: 4 }}
                  formatter={(v: number) => [formatCurrency(v)]} />
                <Line type="monotone" dataKey="Receitas" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} strokeOpacity={0.85} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] font-body text-green-400">
              <span className="w-3 h-2 rounded bg-green-500 inline-block" /> Receitas
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-body text-red-400">
              <span className="w-3 h-2 rounded bg-red-500 inline-block opacity-85" /> Despesas
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT — Category Spending Dashboard
═══════════════════════════════════════════════════════ */
function CategoryDashboard({ transactions }: { transactions: Transaction[] }) {
  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([cat, value]) => ({ cat, name: CATEGORIES[cat].label, emoji: CATEGORIES[cat].emoji, color: CATEGORIES[cat].color, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = expensesByCategory.reduce((s, c) => s + c.value, 0);

  if (expensesByCategory.length === 0) {
    return (
      <div className="section-card">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🗂 Gastos por Categoria</h3>
        <div className="flex flex-col items-center py-10 text-center">
          <p className="text-sm text-muted-foreground font-body">Nenhuma despesa registrada ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">🗂 Gastos por Categoria</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[180px] h-[180px] shrink-0 mx-auto lg:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expensesByCategory.slice(0, 8)} cx="50%" cy="50%"
                innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {expensesByCategory.slice(0, 8).map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <ChartTooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [formatCurrency(v), name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5 min-w-0">
          {expensesByCategory.map(cat => {
            const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
            return (
              <div key={cat.cat}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="text-xs font-body font-semibold text-foreground truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-muted-foreground font-body">{pct}%</span>
                    <span className="text-xs font-body font-bold text-foreground">{formatCurrency(cat.value)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/60">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPONENT — Editable Transaction Row
═══════════════════════════════════════════════════════ */
function TransactionRow({
  t, onDelete, onUpdate,
}: {
  t: Transaction;
  onDelete: (t: Transaction) => void;
  onUpdate: (t: Transaction, patch: Partial<Transaction>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: t.title, amount: String(t.amount), date: t.date, category: t.category });
  const cat = CATEGORIES[t.category];

  const save = () => {
    const amount = parseFloat(draft.amount);
    if (!draft.title || isNaN(amount) || amount <= 0) return;
    onUpdate(t, { title: draft.title, amount, date: draft.date, category: draft.category as ExpenseCategory });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 rounded-xl bg-secondary/40 border border-primary/25 space-y-2 animate-slide-up">
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} placeholder="Descrição"
            className="col-span-2 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <input type="number" value={draft.amount} onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))} placeholder="Valor"
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
          <input type="date" value={draft.date} onChange={e => setDraft(p => ({ ...p, date: e.target.value }))}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50" />
          {t.type === 'expense' && (
            <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
              className="col-span-2 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50">
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={save}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:opacity-90 transition-all">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-border/80 transition-all">
            <X className="w-3 h-3" /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 group hover:border-border transition-all">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        {t.type === 'income' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <span className="text-base leading-none">{cat.emoji}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-semibold text-foreground truncate">{t.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-body">
            {new Date(t.date + 'T12:00').toLocaleDateString('pt-BR')}
          </span>
          {t.type === 'expense' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-body"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
          )}
          {t.isRecurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-body">Recorrente</span>
          )}
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary font-mono text-muted-foreground">#{t.shortId}</span>
        </div>
      </div>
      <span className={`font-display text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Editar">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(t)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHONE SETUP — inline (sem popup agressivo)
═══════════════════════════════════════════════════════ */
function PhoneSetupInline({ onSave, userId }: { onSave: (phone: string) => void; userId: string }) {
  const [digits, setDigits] = useState('');
  const [saving, setSaving] = useState(false);

  const toDigits = (v: string) => v.replace(/\D/g, '');
  const format = (d: string) => {
    const s = d.slice(0, 13); // 55 + 11 dígitos máx
    if (s.length <= 2)  return s;
    if (s.length <= 4)  return `+${s.slice(0,2)} (${s.slice(2)}`;
    if (s.length <= 9)  return `+${s.slice(0,2)} (${s.slice(2,4)}) ${s.slice(4)}`;
    return `+${s.slice(0,2)} (${s.slice(2,4)}) ${s.slice(4,9)}-${s.slice(9)}`;
  };

  const handleSave = async () => {
    const raw = toDigits(digits);
    if (raw.length < 12) { toast.error('Informe o número completo: código do país + DDD + número'); return; }
    setSaving(true);
    try {
      await supabase.from('user_whatsapp_config' as any).upsert({
        user_id: userId,
        whatsapp_phone: raw,
        whatsapp_phone_raw: raw,
        whatsapp_phone_normalized: raw,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      toast.success('WhatsApp vinculado com sucesso!');
      onSave(raw);
    } catch {
      toast.error('Erro ao salvar número.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <p className="text-xs font-body text-muted-foreground mb-3">
        Informe seu número de WhatsApp para ver seus dados financeiros (ex: <code>5531999999999</code>)
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={format(toDigits(digits))}
          onChange={e => setDigits(e.target.value)}
          placeholder="+55 (31) 99999-9999"
          className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-body"
        />
        <button
          onClick={handleSave}
          disabled={saving || toDigits(digits).length < 12}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-display tracking-wider uppercase disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

export function FinancePanel() {
  const { user } = useAuth();
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof financeClient.channel> | null>(null);

  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense' as TransactionType,
    category: 'outros' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    isRecurrent: false,
  });

  /* ── Carregar número: tabela → user_metadata (fallback) → salvar automaticamente ── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_whatsapp_config' as any)
      .select('whatsapp_phone_normalized, whatsapp_phone')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        const wp = data?.whatsapp_phone_normalized || data?.whatsapp_phone || '';
        if (wp) { setWhatsappPhone(wp); return; }

        // Fallback: número vem do user_metadata salvo no signup
        const meta = user.user_metadata as any;
        const fromMeta = meta?.whatsapp_normalized || meta?.whatsapp_raw || '';
        if (fromMeta) {
          // Salva na tabela para próximas sessões
          await supabase.from('user_whatsapp_config' as any).upsert({
            user_id: user.id,
            whatsapp_phone: fromMeta,
            whatsapp_phone_raw: fromMeta,
            whatsapp_phone_normalized: fromMeta,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
          setWhatsappPhone(fromMeta);
        }
      });
  }, [user]);

  /* ── Fetch dados financeiros ── */
  const fetchAll = useCallback(async (phone?: string) => {
    const wp = phone ?? whatsappPhone;
    if (!wp || !financeClient) return;
    setLoading(true);
    try {
      const [gastosRes, recebRes] = await Promise.all([
        financeClient.from('Gastos').select('*').eq('whatsapp', wp),
        financeClient.from('Recebimentos').select('*').eq('whatsapp', wp),
      ]);
      if (gastosRes.error) throw gastosRes.error;
      if (recebRes.error) throw recebRes.error;

      const gastos = ((gastosRes.data as unknown as GastoRow[]) || []).map(gastoToTransaction);
      const recebimentos = ((recebRes.data as unknown as RecebimentoRow[]) || []).map(recebimentoToTransaction);
      setTransactions([...gastos, ...recebimentos]);
      setConnected(true);
    } catch (err: any) {
      console.error('Finance DB fetch error:', err);
      toast.error('Erro ao buscar dados: ' + (err.message || 'verifique sua conexão'));
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [whatsappPhone]);

  useEffect(() => {
    if (whatsappPhone && financeClient) fetchAll();
    else { setTransactions([]); setConnected(false); }
  }, [whatsappPhone, fetchAll]);

  /* ── Realtime (banco financeiro) ── */
  useEffect(() => {
    if (!whatsappPhone || !financeClient) return;
    if (channelRef.current) { financeClient.removeChannel(channelRef.current); channelRef.current = null; }

    const ch = financeClient.channel(`finance-${whatsappPhone}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Gastos' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Recebimentos' }, () => fetchAll())
      .subscribe(status => setConnected(status === 'SUBSCRIBED'));

    channelRef.current = ch;
    return () => { financeClient.removeChannel(ch); channelRef.current = null; };
  }, [whatsappPhone, fetchAll]);

  /* ── ADD ── */
  const addTransaction = useCallback(async () => {
    if (!whatsappPhone) { toast.error('Seu WhatsApp não está vinculado na conta.'); return; }
    if (!financeClient) { toast.error('Banco financeiro não configurado. Verifique as variáveis de ambiente.'); return; }
    const amount = parseFloat(form.amount);
    if (!form.title || isNaN(amount) || amount <= 0) { toast.error('Preencha descrição e valor.'); return; }

    try {
      if (form.type === 'expense') {
        const { error } = await financeClient.from('Gastos').insert({
          whatsapp: whatsappPhone, nome_gasto: form.title, valor_gasto: amount,
          categoria_gasto: CATEGORY_SUPABASE_LABEL[form.category], data_do_gasto: form.date, gasto_id: generateId(),
        } as any);
        if (error) throw error;
      } else {
        const { error } = await financeClient.from('Recebimentos').insert({
          whatsapp: whatsappPhone, receb_nome: form.title, receb_fixos: amount,
          receb_var: 0, data_receb: form.date, receb_id: generateId(),
          receb_categoria: 'receita', tipo: form.isRecurrent ? 'fixo' : 'variável',
        } as any);
        if (error) throw error;
      }
      setForm({ title: '', amount: '', type: 'expense', category: 'outros', date: new Date().toISOString().split('T')[0], isRecurrent: false });
      toast.success('Transação adicionada!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'tente novamente'));
    }
  }, [form, whatsappPhone]);

  /* ── DELETE ── */
  const deleteTransaction = useCallback(async (t: Transaction) => {
    if (!financeClient) return;
    try {
      const { error } = await (financeClient.from(t._sourceTable) as any).delete().eq('id', t._sourceId);
      if (error) throw error;
      // Remove imediatamente do estado local + força re-fetch
      setTransactions(prev => prev.filter(tx => tx.id !== t.id));
      toast.success('Excluído!');
      fetchAll();
    } catch (err: any) { toast.error('Erro ao excluir: ' + (err.message || 'sem permissão?')); }
  }, [fetchAll]);

  /* ── UPDATE ── */
  const updateTransaction = useCallback(async (t: Transaction, patch: Partial<Transaction>) => {
    if (!financeClient) return;
    try {
      if (t._sourceTable === 'Gastos') {
        const u: Record<string, unknown> = {};
        if (patch.title !== undefined)    u.nome_gasto      = patch.title;
        if (patch.amount !== undefined)   u.valor_gasto     = patch.amount;
        if (patch.category !== undefined) u.categoria_gasto = CATEGORY_SUPABASE_LABEL[patch.category];
        if (patch.date !== undefined)     u.data_do_gasto   = patch.date;
        const { error } = await (financeClient.from('Gastos') as any).update(u).eq('id', t._sourceId);
        if (error) throw error;
      } else {
        const u: Record<string, unknown> = {};
        if (patch.title !== undefined)  u.receb_nome  = patch.title;
        if (patch.amount !== undefined) u.receb_fixos = patch.amount;
        if (patch.date !== undefined)   u.data_receb  = patch.date;
        const { error } = await (financeClient.from('Recebimentos') as any).update(u).eq('id', t._sourceId);
        if (error) throw error;
      }
      // Atualiza estado local imediatamente + força re-fetch
      setTransactions(prev => prev.map(tx => tx.id === t.id ? { ...tx, ...patch } : tx));
      toast.success('Atualizado!');
      fetchAll();
    } catch (err: any) { toast.error('Erro ao atualizar: ' + (err.message || 'sem permissão?')); }
  }, [fetchAll]);

  /* ── Derived ── */
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTransactions = useMemo(() =>
    transactions.filter(t => t.date.startsWith(currentMonth)), [transactions, currentMonth]);

  const totalIncome   = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpenses;

  /* ── Render ── */
  return (
    <div className="space-y-5">

      {/* Status bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          {whatsappPhone ? (
            loading ? (
              <span className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...
              </span>
            ) : connected ? (
              <span className="flex items-center gap-1.5 text-[10px] font-body text-green-400 truncate">
                <Wifi className="w-3 h-3 shrink-0" /> Conectado ·
                <code className="text-muted-foreground">{whatsappPhone}</code>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-body text-red-400">
                <WifiOff className="w-3 h-3" /> Desconectado
              </span>
            )
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {whatsappPhone && (
            <button onClick={() => fetchAll()}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Atualizar">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Phone setup — só aparece se não tiver número vinculado e não houver no metadata */}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas',  value: totalIncome,   icon: ArrowUpRight,   color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          { label: 'Despesas',  value: totalExpenses, icon: ArrowDownRight, color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20'   },
          { label: 'Saldo',     value: balance,       icon: Wallet,
            color: balance >= 0 ? 'text-green-400' : 'text-red-400',
            bg: balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
            border: balance >= 0 ? 'border-green-500/20' : 'border-red-500/20' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border ${card.border} ${card.bg} p-4 flex flex-col items-center text-center gap-2`}>
            <div className="w-9 h-9 rounded-xl bg-card/60 flex items-center justify-center">
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-display tracking-[0.18em] text-muted-foreground uppercase">{card.label}</p>
              <p className={`font-display text-sm font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && transactions.length === 0 && (
        <div className="section-card flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-body">Buscando dados do Supabase...</span>
          </div>
        </div>
      )}

      {/* Charts — sempre visíveis */}
      {!loading && (
        <>
          <DailyCashFlowChart transactions={transactions} />
          <CategoryDashboard transactions={monthTransactions} />
        </>
      )}

      {/* Add Transaction */}
      <div className="section-card">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-primary" /> Nova Transação
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 py-2 rounded-xl text-xs font-display tracking-wider transition-all border ${
                  form.type === t
                    ? t === 'income' ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-secondary text-muted-foreground border-border'
                }`}>{t === 'income' ? '↑ Receita' : '↓ Despesa'}</button>
            ))}
          </div>
          <input placeholder="Descrição" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50 w-full" />
          </div>
          {form.type === 'expense' && (
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50">
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRecurrent} onChange={e => setForm(p => ({ ...p, isRecurrent: e.target.checked }))}
              className="rounded border-border" />
            <span className="text-xs font-body text-muted-foreground">Transação recorrente (mensal)</span>
          </label>
          <button onClick={addTransaction}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 transition-all shadow-[0_0_16px_hsl(45_95%_52%/0.25)]">
            {form.type === 'expense' ? 'Adicionar gasto' : 'Adicionar recebimento'}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            Transações de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <span className="text-[10px] text-muted-foreground font-body">{monthTransactions.length} registros</span>
        </div>
        {monthTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-6">
            {whatsappPhone ? 'Nenhuma transação neste mês' : 'Configure seu WhatsApp para ver os dados'}
          </p>
        ) : (
          <div className="space-y-2">
            {[...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
              <TransactionRow key={t.id} t={t} onDelete={deleteTransaction} onUpdate={updateTransaction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
