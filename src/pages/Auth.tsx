import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Trophy, Flame, CheckCircle2, TrendingUp, Target,
  Shield, BarChart3, Star
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Preview data (static, for the visual panel) ─── */
const PREVIEW_STATS = [
  { label: 'XP Acumulado', value: '12.480', color: '#0280FF' },
  { label: 'Streak Ativo', value: '23 dias', color: '#f97316' },
  { label: 'Nível Atual', value: 'Mestre', color: '#a855f7' },
];

const PREVIEW_MISSIONS = [
  { title: 'Estudar por 1 hora', done: true },
  { title: 'Exercício físico', done: true },
  { title: 'Meditação matinal', done: false },
];

const FEATURES = [
  { icon: <Target className="w-4 h-4" />, label: 'Metas com IA', desc: 'Planejamento automático por inteligência artificial', color: '#0280FF' },
  { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics', desc: 'Gráficos e métricas de desempenho em tempo real', color: '#a855f7' },
  { icon: <Shield className="w-4 h-4" />, label: 'Gamificação', desc: 'Níveis, streaks e missões semanais motivadoras', color: '#22c55e' },
];

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030610] flex items-center justify-center">
        <div className="w-9 h-9 rounded-xl bg-[#0280FF] flex items-center justify-center animate-pulse shadow-[0_0_24px_rgba(2,128,255,0.5)]">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha todos os campos.'); return; }
    if (mode === 'signup' && password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) toast.error('Email ou senha incorretos.');
          else if (error.message.includes('Email not confirmed')) toast.error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
          else toast.error(error.message);
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) { toast.error(error.message); }
        else { toast.success('Conta criada! Verifique seu email para confirmar o cadastro.'); setMode('login'); }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setEmail(''); setPassword(''); setDisplayName('');
  };

  return (
    <div className="min-h-screen flex bg-[#030610] overflow-hidden">

      {/* ══════════════════════════════════════
          LEFT — AUTH FORM PANEL (5/12)
          Completely different from old right panel:
          • Narrower, form-first approach
          • Tab switcher at top (not a link at bottom)
          • No max-width card — full panel height
          • Softer dark bg, accent separator on right
      ══════════════════════════════════════ */}
      <div className="w-full lg:w-5/12 flex flex-col relative overflow-hidden">

        {/* Subtle left-panel atmosphere */}
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#060c1c_0%,#030610_60%,#04080f_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(2,128,255,0.08),transparent_60%)]" />
        {/* Right edge separator */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />

        <div className="relative z-10 flex flex-col h-full min-h-screen lg:min-h-0 px-8 md:px-12 lg:px-14 py-10">

          {/* Brand mark */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#0280FF] flex items-center justify-center shadow-[0_0_20px_rgba(2,128,255,0.45)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-[13px] tracking-[0.22em] text-white font-bold">LIFEQUEST</p>
              <p className="text-[9px] text-white/40 tracking-[0.18em] font-body uppercase">System Access</p>
            </div>
          </div>

          {/* Mode tab switcher — NEW: was a link toggle at bottom, now tabs at top */}
          <div className="flex rounded-xl bg-white/5 border border-white/8 p-1 mb-8 w-fit gap-1">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setEmail(''); setPassword(''); setDisplayName(''); }}
                className={`px-6 py-2 rounded-lg text-[11px] font-display tracking-[0.18em] uppercase transition-all ${
                  mode === m
                    ? 'bg-[#0280FF] text-white shadow-[0_0_16px_rgba(2,128,255,0.4)]'
                    : 'text-white/40 hover:text-white/65'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {/* Headline */}
          <div className="mb-7">
            <h1 className="font-display text-[28px] md:text-[32px] text-white tracking-wider leading-tight">
              {mode === 'login' ? 'Acesso ao\nSistema' : 'Iniciar\nJornada'}
            </h1>
            <p className="text-sm text-white/45 font-body mt-2 leading-relaxed">
              {mode === 'login'
                ? 'Entre na sua conta e retome sua evolução de onde parou.'
                : 'Crie sua conta gratuitamente e comece a evoluir hoje.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-display tracking-[0.22em] text-white/40 uppercase mb-2">
                  Nome de Exibição
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 font-body focus:outline-none focus:border-[#0280FF]/55 focus:bg-[#0280FF]/6 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-display tracking-[0.22em] text-white/40 uppercase mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 font-body focus:outline-none focus:border-[#0280FF]/55 focus:bg-[#0280FF]/6 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-display tracking-[0.22em] text-white/40 uppercase mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 font-body focus:outline-none focus:border-[#0280FF]/55 focus:bg-[#0280FF]/6 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-4 rounded-xl bg-[#0280FF] hover:bg-[#0270ee] text-white font-display text-sm tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 shadow-[0_0_28px_rgba(2,128,255,0.4)] hover:shadow-[0_0_36px_rgba(2,128,255,0.55)]"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-8 border-t border-white/6 mt-8">
            <p className="text-[10px] text-white/25 font-body text-center">
              © 2026 LifeQuest — Plataforma de evolução pessoal gamificada
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — VISUAL SHOWCASE PANEL (7/12)
          Completely new: was 7-col hero text on LEFT.
          Now RIGHT, wider, with actual app preview cards:
          • Mesh grid background pattern
          • Blue radial glow atmosphere
          • Live preview stats cards
          • Mission completion feed
          • Feature list with icons
          • Level badge at bottom
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden flex-col">

        {/* Background layers */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#050d1f_0%,#071630_40%,#040c1e_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(2,128,255,0.22),transparent_55%),radial-gradient(ellipse_at_80%_75%,rgba(124,58,237,0.18),transparent_55%)]" />
        {/* Mesh grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:52px_52px]" />
        {/* Corner glow accent */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-[#0280FF]/8 blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14 justify-between">

          {/* Top: headline */}
          <div>
            <p className="text-[10px] tracking-[0.36em] font-display text-[#0280FF] uppercase mb-4">
              Preview do Sistema
            </p>
            <h2 className="font-display text-3xl xl:text-4xl text-white leading-tight max-w-md">
              Transforme disciplina em resultados mensuráveis.
            </h2>
            <p className="mt-3 text-sm text-white/50 font-body max-w-sm leading-relaxed">
              Acompanhe metas, missões e evolução pessoal com dados reais, análises precisas e gamificação inteligente.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${f.color}18`, color: f.color, border: `1px solid ${f.color}30` }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-white">{f.label}</p>
                    <p className="text-[11px] text-white/40 font-body">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: app preview cards */}
          <div className="space-y-4">
            <p className="text-[10px] tracking-[0.24em] font-display text-white/35 uppercase">
              Dados de um jogador ativo
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {PREVIEW_STATS.map(s => (
                <div
                  key={s.label}
                  className="rounded-2xl border bg-white/4 backdrop-blur-sm p-4"
                  style={{ borderColor: `${s.color}25` }}
                >
                  <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: s.color }} />
                  <p className="text-[10px] text-white/45 font-body tracking-wide uppercase">{s.label}</p>
                  <p className="font-display text-[19px] text-white mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Mission feed card */}
            <div className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-display tracking-[0.22em] text-white/40 uppercase">Missões de Hoje</p>
                <span className="text-[10px] font-body text-[#0280FF] font-semibold">2 / 3 completas</span>
              </div>

              <div className="space-y-2.5">
                {PREVIEW_MISSIONS.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                      m.done
                        ? 'bg-[#0280FF] shadow-[0_0_8px_rgba(2,128,255,0.5)]'
                        : 'border border-white/20 bg-transparent'
                    }`}>
                      {m.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <p className={`text-sm font-body ${m.done ? 'line-through text-white/35' : 'text-white/75'}`}>
                      {m.title}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mini XP bar */}
              <div className="mt-4 pt-4 border-t border-white/8">
                <div className="flex justify-between text-[10px] text-white/35 font-body mb-2">
                  <span>Progresso XP hoje</span>
                  <span className="text-[#0280FF]">+340 XP</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0280FF] to-[#49a5ff] w-[67%] shadow-[0_0_8px_rgba(2,128,255,0.5)]" />
                </div>
              </div>
            </div>

            {/* Level badge */}
            <div className="rounded-2xl border border-[#0280FF]/25 bg-[#0280FF]/8 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0280FF]/20 border border-[#0280FF]/30 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-display tracking-[0.2em] text-[#0280FF] uppercase">Nível atual</p>
                <p className="font-display text-white text-base mt-0.5">Mestre · Nível 5</p>
              </div>
              <div className="flex items-center gap-1 text-[#0280FF]">
                <TrendingUp className="w-4 h-4" />
                <Star className="w-4 h-4" />
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
