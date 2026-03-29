import { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type TransactionType = 'income' | 'expense';
type ExpenseCategory = 'moradia' | 'alimentação' | 'transporte' | 'lazer' | 'saúde' | 'educação' | 'outros';

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
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  moradia: 'hsl(var(--personal-purple))',
  alimentação: 'hsl(var(--work-orange))',
  transporte: 'hsl(var(--game-cyan))',
  lazer: 'hsl(var(--xp-gold))',
  saúde: 'hsl(var(--health-green))',
  educação: 'hsl(var(--spiritual-blue))',
  outros: 'hsl(var(--muted-foreground))',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  moradia: 'Moradia', alimentação: 'Alimentação', transporte: 'Transporte',
  lazer: 'Lazer', saúde: 'Saúde', educação: 'Educação', outros: 'Outros',
};

function generateId() { return Math.random().toString(36).substring(2, 15); }

function loadState(): FinanceState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { transactions: [], monthlyBudget: 0 };
}

export function FinancePanel() {
  const [state, setState] = useState<FinanceState>(loadState);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense' as TransactionType,
    category: 'outros' as ExpenseCategory, date: new Date().toISOString().split('T')[0], isRecurrent: false,
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthTransactions = useMemo(() =>
    state.transactions.filter(t => t.date.startsWith(currentMonth)),
  [state.transactions, currentMonth]);

  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([cat, value]) => ({
      name: CATEGORY_LABELS[cat], value, color: CATEGORY_COLORS[cat],
    })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const addTransaction = useCallback(() => {
    const amount = parseFloat(form.amount);
    if (!form.title || isNaN(amount) || amount <= 0) return;
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, { ...form, id: generateId(), amount }],
    }));
    setForm({ title: '', amount: '', type: 'expense', category: 'outros', date: new Date().toISOString().split('T')[0], isRecurrent: false });
    setShowForm(false);
  }, [form]);

  const deleteTransaction = useCallback((id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Receitas', value: totalIncome, icon: ArrowUpRight, color: 'text-game-green', bg: 'bg-game-green/10' },
          { label: 'Despesas', value: totalExpenses, icon: ArrowDownRight, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Saldo', value: balance, icon: Wallet, color: balance >= 0 ? 'text-game-green' : 'text-destructive', bg: balance >= 0 ? 'bg-game-green/10' : 'bg-destructive/10' },
        ].map(card => (
          <div key={card.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase">{card.label}</p>
                <p className={`font-display text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Add */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
            <PieChartIcon className="w-3.5 h-3.5 text-primary" /> Despesas por Categoria
          </h3>
          {expensesByCategory.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-[140px] h-[140px] ring-glow">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                      {expensesByCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {expensesByCategory.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                      <span className="text-xs font-body text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs font-body text-muted-foreground">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body text-center py-8">Nenhuma despesa registrada este mês</p>
          )}
        </div>

        {/* Add transaction form */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-primary" /> Nova Transação
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-display tracking-wider transition-all ${
                    form.type === t ? (t === 'income' ? 'bg-game-green/20 text-game-green border border-game-green/30' : 'bg-destructive/20 text-destructive border border-destructive/30')
                    : 'bg-secondary text-muted-foreground border border-border'
                  }`}>
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>
            <input placeholder="Descrição" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-2">
              <input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {form.type === 'expense' && (
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRecurrent} onChange={e => setForm(p => ({ ...p, isRecurrent: e.target.checked }))}
                className="rounded border-border" />
              <span className="text-xs font-body text-muted-foreground">Transação recorrente (mensal)</span>
            </label>
            <button onClick={addTransaction}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 transition-all">
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-4 uppercase">
          Transações de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        {monthTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-4">Nenhuma transação registrada</p>
        ) : (
          <div className="space-y-2">
            {[...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-game-green/10' : 'bg-destructive/10'}`}>
                  {t.type === 'income' ? <TrendingUp className="w-4 h-4 text-game-green" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-semibold text-foreground truncate">{t.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-body">{new Date(t.date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                    {t.type === 'expense' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{CATEGORY_LABELS[t.category]}</span>}
                    {t.isRecurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Recorrente</span>}
                  </div>
                </div>
                <span className={`font-display text-sm font-bold ${t.type === 'income' ? 'text-game-green' : 'text-destructive'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                <button onClick={() => deleteTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
