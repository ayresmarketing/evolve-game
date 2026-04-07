import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet,
  ArrowUpRight, ArrowDownRight, Pencil, Check, X,
  CalendarDays, Sliders, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ═══════════════════════════════════════════════════════
   TYPES & CONSTANTS
═══════════════════════════════════════════════════════ */
type TransactionType = 'income' | 'expense';

type ExpenseCategory =
  | 'alimentacao' | 'transporte' | 'moradia' | 'saude' | 'lazer'
  | 'educacao' | 'vestuario' | 'pets' | 'beleza' | 'filhos'
  | 'assinaturas' | 'presentes' | 'emergencias' | 'investimentos'
  | 'dividas' | 'eletronicos' | 'outros';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  date: string;
  isRecurrent: boolean;
}

interface FinanceState {
  transactions: Transaction[];
  monthlyBudget: number;
}

const STORAGE_KEY = 'lifequest_finance';

const CATEGORIES: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  alimentacao:  { label: 'Alimentação',            emoji: '🍽',  color: '#f97316' },
  transporte:   { label: 'Transporte',              emoji: '🚗',  color: '#3b82f6' },
  moradia:      { label: 'Moradia',                 emoji: '🏠',  color: '#8b5cf6' },
  saude:        { label: 'Despesas médicas',         emoji: '🦩',  color: '#ec4899' },
  lazer:        { label: 'Lazer',                   emoji: '🎉',  color: '#eab308' },
  educacao:     { label: 'Educação',                emoji: '🎓',  color: '#06b6d4' },
  vestuario:    { label: 'Vestuário',               emoji: '👗',  color: '#f43f5e' },
  pets:         { label: 'Pets',                    emoji: '🐾',  color: '#84cc16' },
  beleza:       { label: 'Beleza e cuidados',       emoji: '💇',  color: '#a855f7' },
  filhos:       { label: 'Filhos',                  emoji: '🧸',  color: '#fb923c' },
  assinaturas:  { label: 'Assinaturas e serviços',  emoji: '📺',  color: '#22d3ee' },
  presentes:    { label: 'Presentes e doações',     emoji: '🎁',  color: '#f472b6' },
  emergencias:  { label: 'Emergências',             emoji: '🚨',  color: '#ef4444' },
  investimentos:{ label: 'Investimentos',           emoji: '📈',  color: '#22c55e' },
  dividas:      { label: 'Dívidas / Empréstimos',  emoji: '💳',  color: '#64748b' },
  eletronicos:  { label: 'Eletrônicos',             emoji: '🔌',  color: '#0ea5e9' },
  outros:       { label: 'Outros',                  emoji: '📦',  color: '#94a3b8' },
};

function generateId() { return Math.random().toString(36).substring(2, 15); }

function loadState(): FinanceState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { transactions: [], monthlyBudget: 0 };
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dateLabel(date: string) {
  return new Date(date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getDateRange(days: number, startDate?: string, endDate?: string): string[] {
  if (startDate && endDate && startDate <= endDate) {
    const dates: string[] = [];
    const cur = new Date(startDate + 'T12:00');
    const end = new Date(endDate + 'T12:00');
    while (cur <= end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

/* ═══════════════════════════════════════════════════════
   TOOLTIP STYLE
═══════════════════════════════════════════════════════ */
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
  const [range, setRange] = useState(7);
  const [useCustom, setUseCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const dateRange = useMemo(() => {
    if (useCustom && customStart && customEnd) return getDateRange(0, customStart, customEnd);
    return getDateRange(range);
  }, [range, useCustom, customStart, customEnd]);

  const chartData = useMemo(() => {
    return dateRange.map(date => {
      const dayTx = transactions.filter(t => t.date === date);
      return {
        label: dateLabel(date),
        Receitas: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Despesas: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [dateRange, transactions]);

  const isEmpty = chartData.every(d => d.Receitas === 0 && d.Despesas === 0);

  return (
    <div className="section-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-primary" /> Receitas e Despesas por Dia
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => { setRange(d); setUseCustom(false); setShowCustom(false); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-display tracking-wider transition-all border ${
                !useCustom && range === d
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => setShowCustom(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-display tracking-wider transition-all border ${
              useCustom
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            <Sliders className="w-2.5 h-2.5" /> Período
          </button>
        </div>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            value={customStart}
            onChange={e => { setCustomStart(e.target.value); if (customEnd) setUseCustom(true); }}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50"
          />
          <span className="text-[10px] text-muted-foreground">até</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            onChange={e => { setCustomEnd(e.target.value); if (customStart) setUseCustom(true); }}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-body text-foreground focus:outline-none focus:border-primary/50"
          />
          {useCustom && (
            <button
              onClick={() => { setUseCustom(false); setCustomStart(''); setCustomEnd(''); setShowCustom(false); }}
              className="text-[10px] text-destructive font-body hover:underline"
            >
              Limpar
            </button>
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
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 14% 18%)" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(240 8% 56%)' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(240 8% 56%)' }} tickFormatter={v => `R$${v}`} allowDecimals={false} />
                <ChartTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#f5f0e0', marginBottom: 4 }}
                  formatter={(v: number) => [formatCurrency(v)]}
                />
                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} fillOpacity={0.85} />
              </BarChart>
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
      .map(([cat, value]) => ({
        cat,
        name: CATEGORIES[cat].label,
        emoji: CATEGORIES[cat].emoji,
        color: CATEGORIES[cat].color,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = expensesByCategory.reduce((s, c) => s + c.value, 0);

  if (expensesByCategory.length === 0) {
    return (
      <div className="section-card">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
          🗂 Gastos por Categoria
        </h3>
        <div className="flex flex-col items-center py-10 text-center">
          <p className="text-sm text-muted-foreground font-body">Nenhuma despesa registrada ainda</p>
        </div>
      </div>
    );
  }

  const pieData = expensesByCategory.slice(0, 8);

  return (
    <div className="section-card">
      <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
        🗂 Gastos por Categoria
      </h3>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Donut chart */}
        <div className="w-full lg:w-[180px] h-[180px] shrink-0 mx-auto lg:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <ChartTooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category list with progress bars */}
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
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
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
  t,
  onDelete,
  onUpdate,
}: {
  t: Transaction;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: t.title, amount: String(t.amount), date: t.date, category: t.category });
  const cat = CATEGORIES[t.category];

  const save = () => {
    const amount = parseFloat(draft.amount);
    if (!draft.title || isNaN(amount) || amount <= 0) return;
    onUpdate(t.id, { title: draft.title, amount, date: draft.date, category: draft.category as ExpenseCategory });
    setEditing(false);
  };

  const cancel = () => {
    setDraft({ title: t.title, amount: String(t.amount), date: t.date, category: t.category });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 rounded-xl bg-secondary/40 border border-primary/25 space-y-2 animate-slide-up">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={draft.title}
            onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
            placeholder="Descrição"
            className="col-span-2 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <input
            type="number"
            value={draft.amount}
            onChange={e => setDraft(p => ({ ...p, amount: e.target.value }))}
            placeholder="Valor"
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <input
            type="date"
            value={draft.date}
            onChange={e => setDraft(p => ({ ...p, date: e.target.value }))}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
          />
          {t.type === 'expense' && (
            <select
              value={draft.category}
              onChange={e => setDraft(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
              className="col-span-2 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:opacity-90 transition-all"
          >
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-border/80 transition-all"
          >
            <X className="w-3 h-3" /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50 group hover:border-border transition-all">
      {/* Type icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}>
        {t.type === 'income'
          ? <TrendingUp className="w-4 h-4 text-green-400" />
          : <span className="text-base leading-none">{cat.emoji}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-semibold text-foreground truncate">{t.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-body">
            {new Date(t.date + 'T12:00').toLocaleDateString('pt-BR')}
          </span>
          {t.type === 'expense' && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-md font-body"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {cat.label}
            </span>
          )}
          {t.isRecurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-body">Recorrente</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <span className={`font-display text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(t.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN — FinancePanel
═══════════════════════════════════════════════════════ */
export function FinancePanel() {
  const [state, setState] = useState<FinanceState>(loadState);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'outros' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    isRecurrent: false,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthTransactions = useMemo(() =>
    state.transactions.filter(t => t.date.startsWith(currentMonth)),
    [state.transactions, currentMonth]
  );

  const totalIncome   = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpenses;

  const addTransaction = useCallback(() => {
    const amount = parseFloat(form.amount);
    if (!form.title || isNaN(amount) || amount <= 0) return;
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, { ...form, id: generateId(), amount }],
    }));
    setForm({
      title: '', amount: '', type: 'expense', category: 'outros',
      date: new Date().toISOString().split('T')[0], isRecurrent: false,
    });
  }, [form]);

  const deleteTransaction = useCallback((id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  }, []);

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas',  value: totalIncome,   icon: ArrowUpRight,   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
          { label: 'Despesas',  value: totalExpenses, icon: ArrowDownRight, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'   },
          { label: 'Saldo',     value: balance,       icon: Wallet,          color: balance >= 0 ? 'text-green-400' : 'text-red-400', bg: balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10', border: balance >= 0 ? 'border-green-500/20' : 'border-red-500/20' },
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

      {/* ── Daily Chart ── */}
      <DailyCashFlowChart transactions={state.transactions} />

      {/* ── Category Dashboard ── */}
      <CategoryDashboard transactions={monthTransactions} />

      {/* ── Add Transaction ── */}
      <div className="section-card">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-primary" /> Nova Transação
        </h3>

        <div className="space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 py-2 rounded-xl text-xs font-display tracking-wider transition-all border ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-secondary text-muted-foreground border-border'
                }`}
              >
                {t === 'income' ? '↑ Receita' : '↓ Despesa'}
              </button>
            ))}
          </div>

          <input
            placeholder="Descrição"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Valor (R$)"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50 w-full"
            />
          </div>

          {form.type === 'expense' && (
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:border-primary/50"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurrent}
              onChange={e => setForm(p => ({ ...p, isRecurrent: e.target.checked }))}
              className="rounded border-border"
            />
            <span className="text-xs font-body text-muted-foreground">Transação recorrente (mensal)</span>
          </label>

          <button
            onClick={addTransaction}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 transition-all shadow-[0_0_16px_hsl(45_95%_52%/0.25)]"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* ── Transaction List ── */}
      <div className="section-card">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
          Transações de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>

        {monthTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-6">
            Nenhuma transação registrada neste mês
          </p>
        ) : (
          <div className="space-y-2">
            {[...monthTransactions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(t => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  onDelete={deleteTransaction}
                  onUpdate={updateTransaction}
                />
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
