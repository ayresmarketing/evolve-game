import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { financeClient } from '@/integrations/supabase/financeClient';

/* ── Floating particle ── */
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  key: i,
  style: {
    width: `${4 + (i % 5) * 3}px`,
    height: `${4 + (i % 5) * 3}px`,
    left: `${(i * 37 + 11) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    background: i % 3 === 0
      ? 'rgba(251,191,36,0.25)'
      : i % 3 === 1
      ? 'rgba(234,179,8,0.15)'
      : 'rgba(255,255,255,0.06)',
    animation: `float-${(i % 3) + 1} ${5 + (i % 4)}s ease-in-out infinite`,
    animationDelay: `${(i * 0.4) % 3}s`,
    filter: 'blur(1px)',
  } as React.CSSProperties,
}));

/* ─── check phone uniqueness against finance Supabase ─── */
async function isPhoneAlreadyRegistered(normalized: string): Promise<boolean> {
  try {
    // Check if the phone is already linked to an app account
    // by querying Gastos in the finance DB - if phone exists there,
    // it means the number is already a registered customer
    // We want to ensure no TWO APP ACCOUNTS share the same phone,
    // so we query the app's user_whatsapp_config via financeClient
    // Actually: per user request, query finance DB Gastos.whatsapp
    const { data, error } = await financeClient
      .from('Gastos')
      .select('whatsapp')
      .eq('whatsapp', normalized)
      .limit(1);
    if (error) return false; // if error, don't block registration
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Floating particle animation keyframes injected once
  useEffect(() => {
    const id = 'auth-particle-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes float-1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.1)} }
      @keyframes float-2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(0.9)} }
      @keyframes float-3 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-25px) scale(1.05)} }
      @keyframes glow-pulse { 0%,100%{opacity:.55} 50%{opacity:.85} }
      @keyframes drift-x { 0%,100%{transform:translateX(0)} 50%{transform:translateX(30px)} }
    `;
    document.head.appendChild(style);
  }, []);

  const toDigits = (v: string) => v.replace(/\D/g, '');
  const formatPhone = (digits: string) => {
    const d = digits.slice(0, 10);
    const ddd = d.slice(0, 2);
    const p1  = d.slice(2, 6);
    const p2  = d.slice(6, 10);
    if (!ddd) return '';
    if (!p1)  return `(${ddd}`;
    if (!p2)  return `(${ddd}) ${p1}`;
    return `(${ddd}) ${p1}-${p2}`;
  };

  const phoneDigits    = toDigits(whatsapp).slice(0, 10);
  const phoneE164      = phoneDigits.length === 10 ? `55${phoneDigits}` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030610] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center animate-pulse shadow-[0_0_24px_rgba(251,191,36,0.5)]">
          <Zap className="w-5 h-5 text-black" />
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
          else toast.error(error.message);
        }
      } else {
        if (phoneDigits.length !== 10) {
          toast.error('Informe DDD + número (8 dígitos).');
          return;
        }
        // Check uniqueness against finance DB
        const alreadyInUse = await isPhoneAlreadyRegistered(phoneE164);
        if (alreadyInUse) {
          toast.error('Este número já está associado a uma conta. Use outro número.');
          return;
        }
        const { error } = await signUp(email, password, displayName, phoneE164);
        if (error) { toast.error(error.message); return; }
        // Auto-login após cadastro (não exige verificação de e-mail)
        const { error: loginErr } = await signIn(email, password);
        if (loginErr) {
          toast.success('Conta criada! Faça login para continuar.');
          setMode('login');
          setPassword('');
          setDisplayName('');
          setWhatsapp('');
        } else {
          toast.success('Conta criada com sucesso!');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setEmail(''); setPassword(''); setDisplayName(''); setWhatsapp('');
  };

  return (
    <div className="min-h-screen bg-[#030610] flex items-center justify-center overflow-hidden relative">

      {/* ── Background atmospheric glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)',
            top: '-15%', left: '-15%',
            animation: 'glow-pulse 4s ease-in-out infinite, drift-x 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(234,179,8,0.10) 0%, transparent 70%)',
            bottom: '-15%', right: '-10%',
            animation: 'glow-pulse 5s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Floating particles ── */}
      {PARTICLES.map(p => <Particle key={p.key} style={p.style} />)}

      {/* ── Center card ── */}
      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_0_32px_rgba(251,191,36,0.55)] mb-1">
            <Zap className="w-7 h-7 text-black" />
          </div>
          <div className="text-center">
            <p className="font-display text-[15px] tracking-[0.28em] text-white font-bold">LIFEQUEST</p>
            <p className="text-[9px] text-white/35 tracking-[0.22em] font-body uppercase mt-0.5">Plataforma de evolução pessoal</p>
          </div>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] px-7 py-8">

          {/* Tab switcher — no white bg container */}
          <div className="flex mb-7 border-b border-white/10">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 pb-3 text-[11px] font-display tracking-[0.2em] uppercase transition-all ${
                  mode === m
                    ? 'text-yellow-400 border-b-2 border-yellow-400 -mb-px'
                    : 'text-white/35 hover:text-white/55'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {/* Headline */}
          <div className="mb-6">
            <h1 className="font-display text-[22px] text-white tracking-wide">
              {mode === 'login' ? 'Acesso ao Sistema' : 'Iniciar Jornada'}
            </h1>
            <p className="text-[11px] text-white/40 font-body mt-1.5 leading-relaxed">
              {mode === 'login'
                ? 'Entre e retome sua evolução de onde parou.'
                : 'Crie sua conta e comece a evoluir hoje.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[9px] font-display tracking-[0.24em] text-white/35 uppercase mb-1.5">
                  Nome de Exibição
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-yellow-400/40 focus:bg-yellow-400/[0.04] transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-[9px] font-display tracking-[0.24em] text-white/35 uppercase mb-1.5">
                  WhatsApp
                </label>
                <div className="relative">
                  {/* Flag inside the input field */}
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none select-none">🇧🇷</span>
                  <input
                    type="tel"
                    value={formatPhone(phoneDigits)}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(31) 1234-5678"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-yellow-400/40 focus:bg-yellow-400/[0.04] transition-all"
                  />
                </div>
                <p className="text-[9px] text-white/25 font-body mt-1 ml-0.5">DDD + 8 dígitos</p>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-display tracking-[0.24em] text-white/35 uppercase mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-yellow-400/40 focus:bg-yellow-400/[0.04] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-display tracking-[0.24em] text-white/35 uppercase mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 font-body focus:outline-none focus:border-yellow-400/40 focus:bg-yellow-400/[0.04] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/55 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-display text-sm tracking-[0.18em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 shadow-[0_0_28px_rgba(251,191,36,0.4)] hover:shadow-[0_0_36px_rgba(251,191,36,0.6)]"
            >
              {submitting ? (
                <div className="w-4.5 h-4.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-[9px] text-white/20 font-body text-center mt-6">
            © 2026 LifeQuest — Plataforma de evolução pessoal gamificada
          </p>
        </div>
      </div>
    </div>
  );
}
