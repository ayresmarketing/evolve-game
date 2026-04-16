import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GlitchWord } from '@/components/game/GlitchWord';

/* ── Grid dot particle ── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  key: i,
  style: {
    width:  `${3 + (i % 4) * 2}px`,
    height: `${3 + (i % 4) * 2}px`,
    left:   `${(i * 41 + 13) % 100}%`,
    top:    `${(i * 57 +  9) % 100}%`,
    background: i % 4 === 0
      ? 'rgba(0,232,121,0.20)'
      : i % 4 === 1
      ? 'rgba(6,214,232,0.14)'
      : i % 4 === 2
      ? 'rgba(139,92,246,0.12)'
      : 'rgba(255,255,255,0.05)',
    animation: `float-${(i % 3) + 1} ${5 + (i % 4)}s ease-in-out infinite`,
    animationDelay: `${(i * 0.35) % 3}s`,
    filter: 'blur(1px)',
  } as React.CSSProperties,
}));

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode]             = useState<'login' | 'signup'>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Inject particle keyframes once */
  useEffect(() => {
    const id = 'auth-particle-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes float-1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.08)} }
      @keyframes float-2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(0.92)} }
      @keyframes float-3 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.04)} }
      @keyframes auth-glow { 0%,100%{opacity:.45} 50%{opacity:.80} }
      @keyframes auth-drift { 0%,100%{transform:translateX(0)} 50%{transform:translateX(40px)} }
      @keyframes auth-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    `;
    document.head.appendChild(style);
  }, []);

  const toDigits   = (v: string) => v.replace(/\D/g, '');
  const formatPhone = (digits: string) => {
    const d   = digits.slice(0, 10);
    const ddd = d.slice(0, 2);
    const p1  = d.slice(2, 6);
    const p2  = d.slice(6, 10);
    if (!ddd) return '';
    if (!p1)  return `(${ddd}`;
    if (!p2)  return `(${ddd}) ${p1}`;
    return `(${ddd}) ${p1}-${p2}`;
  };

  const phoneDigits = toDigits(whatsapp).slice(0, 10);
  const phoneE164   = phoneDigits.length === 10 ? `55${phoneDigits}` : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040a17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center animate-glow-pulse"
            style={{ boxShadow: '0 0 32px rgba(0,232,121,0.5)' }}>
            <Zap className="w-6 h-6 text-black" strokeWidth={3} />
          </div>
          <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#00e879] to-[#06d6e8] animate-shimmer" />
          </div>
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
        let { error } = await signIn(email, password);
        if (error && /not confirmed|não confirmado|não verificado|not verified/i.test(error.message)) {
          const { error: confirmErr } = await supabase.functions.invoke('create-confirmed-user', {
            body: { action: 'confirm', email },
          });
          if (!confirmErr) {
            const retry = await signIn(email, password);
            error = retry.error;
          }
        }
        if (error) {
          if (error.message.includes('Invalid login')) toast.error('Email ou senha incorretos.');
          else toast.error(error.message);
        }
      } else {
        if (phoneDigits.length !== 10) {
          toast.error('Informe DDD + número (8 dígitos).');
          return;
        }
        const { error } = await signUp(email, password, displayName, phoneE164);
        if (error) { toast.error(error.message); return; }
        const { error: loginErr } = await signIn(email, password);
        if (loginErr) {
          toast.success('Conta criada! Faça login para continuar.');
          setMode('login');
          setPassword(''); setDisplayName(''); setWhatsapp('');
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
    <div className="min-h-screen bg-[#040a17] flex items-center justify-center overflow-hidden relative">

      {/* ── Atmospheric glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,232,121,0.09) 0%, transparent 70%)',
            top: '-20%', left: '-20%',
            animation: 'auth-glow 5s ease-in-out infinite, auth-drift 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,214,232,0.07) 0%, transparent 70%)',
            bottom: '-20%', right: '-15%',
            animation: 'auth-glow 6s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
            top: '40%', left: '60%',
            animation: 'auth-glow 7s ease-in-out infinite 1s',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-[2px] opacity-[0.04]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,232,121,1), transparent)',
            animation: 'auth-scan 8s linear infinite',
          }}
        />
      </div>

      {/* ── Floating particles ── */}
      {PARTICLES.map(p => <Particle key={p.key} style={p.style} />)}

      {/* ── Center card ── */}
      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center mb-1 animate-float"
            style={{ boxShadow: '0 0 40px rgba(0,232,121,0.50), 0 0 80px rgba(0,232,121,0.20)' }}
          >
            <Zap className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <div className="text-center">
            <p className="font-display text-base tracking-[0.28em] font-bold uppercase"
              style={{
                background: 'linear-gradient(135deg, #00e879, #06d6e8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SUA VIDA É UM{' '}
              <GlitchWord
                word="JOGO"
                buildDelay={600}
                style={{
                  background: 'linear-gradient(135deg, #00e879, #06d6e8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              />
            </p>
            <p className="text-[9px] text-white/28 tracking-[0.22em] font-body uppercase mt-1">
              Plataforma de evolução pessoal
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl px-7 py-8"
          style={{
            background: 'rgba(13,21,38,0.75)',
            border: '1px solid rgba(0,232,121,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,232,121,0.06)',
          }}
        >
          {/* Tab switcher */}
          <div className="flex mb-7 border-b border-white/8">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 pb-3 text-[11px] font-display tracking-[0.2em] uppercase transition-all ${
                  mode === m
                    ? '-mb-px border-b-2 border-[#00e879]'
                    : 'text-white/30 hover:text-white/50'
                }`}
                style={mode === m
                  ? { color: '#00e879', textShadow: '0 0 12px rgba(0,232,121,0.6)' }
                  : {}}
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
            <p className="text-[11px] text-white/38 font-body mt-1.5 leading-relaxed">
              {mode === 'login'
                ? 'Entre e retome sua evolução de onde parou.'
                : 'Crie sua conta e comece a evoluir hoje.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">
                  Nome de Exibição
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input
                    type="text" value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body
                      focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,232,121,0.36)'}
                    onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">
                  WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none select-none">🇧🇷</span>
                  <input
                    type="tel" value={formatPhone(phoneDigits)}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(31) 1234-5678"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body
                      focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,232,121,0.36)'}
                    onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <p className="text-[9px] text-white/22 font-body mt-1 ml-0.5">DDD + 8 dígitos</p>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body
                    focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,232,121,0.36)'}
                  onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-9 pr-11 py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body
                    focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,232,121,0.36)'}
                  onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/55 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-xl font-display text-sm tracking-[0.18em] uppercase font-bold
                flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
              style={{
                background: submitting
                  ? 'rgba(0,232,121,0.5)'
                  : 'linear-gradient(135deg, #00e879, #06d6e8)',
                color: '#040a17',
                boxShadow: submitting
                  ? 'none'
                  : '0 0 30px rgba(0,232,121,0.42), 0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/25 border-t-black/70 rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Features hint */}
          <div className="mt-6 pt-5 border-t border-white/6">
            <div className="flex items-center justify-center gap-4">
              {['Metas com IA', 'Gamificação', 'Evolução diária'].map(f => (
                <div key={f} className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" style={{ color: '#00e879' }} />
                  <span className="text-[8px] text-white/22 font-body">{f}</span>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/16 font-body text-center mt-3">
              © 2026 Sua Vida é um Jogo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
