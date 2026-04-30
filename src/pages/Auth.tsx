import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, KeyRound, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { GlitchWord } from '@/components/game/GlitchWord';

/* ── Particle ── */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  key: i,
  style: {
    width: `${3 + (i % 4) * 2}px`, height: `${3 + (i % 4) * 2}px`,
    left: `${(i * 41 + 13) % 100}%`, top: `${(i * 57 + 9) % 100}%`,
    background: i % 3 === 0 ? 'rgba(0,232,121,0.18)' : i % 3 === 1 ? 'rgba(6,214,232,0.12)' : 'rgba(139,92,246,0.10)',
    animation: `float-${(i % 3) + 1} ${5 + (i % 4)}s ease-in-out infinite`,
    animationDelay: `${(i * 0.35) % 3}s`, filter: 'blur(1px)',
  } as React.CSSProperties,
}));

const WELCOME_STEPS = [
  { icon: Mail,    color: '#00e879', title: 'Acesse o e-mail que enviamos',   desc: 'Enviamos uma mensagem com seu link de acesso para o e-mail cadastrado na assinatura.' },
  { icon: KeyRound,color: '#06d6e8', title: 'Defina a senha que desejar',     desc: 'Clique no botão do e-mail e escolha uma senha pessoal para entrar no sistema.' },
  { icon: LogIn,   color: '#8b5cf6', title: 'Clique no botão e entre!',       desc: 'Após definir sua senha, você já pode acessar o sistema e começar sua jornada.' },
];

/* ── Login form (shared) ── */
function LoginForm({ compact = false }: { compact?: boolean }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha todos os campos.'); return; }
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login')) toast.error('Email ou senha incorretos.');
        else toast.error(error.message);
      }
    } finally { setSubmitting(false); }
  };

  const inputCls = `w-full py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body focus:outline-none transition-all`;
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' };
  const focusStyle = 'rgba(0,232,121,0.36)';
  const blurStyle  = 'rgba(255,255,255,0.09)';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <div className="mb-6">
          <h2 className="font-display text-[22px] text-white tracking-wide">Acesso ao Sistema</h2>
          <p className="text-[11px] text-white/38 font-body mt-1.5">Entre e retome sua evolução de onde parou.</p>
        </div>
      )}

      <div>
        <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
            className={`${inputCls} pl-9 pr-4`} style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = focusStyle}
            onBlur={e  => e.currentTarget.style.borderColor = blurStyle} />
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required minLength={6}
            className={`${inputCls} pl-9 pr-11`} style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = focusStyle}
            onBlur={e  => e.currentTarget.style.borderColor = blurStyle} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/55 transition-colors">
            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full mt-2 py-3.5 rounded-xl font-display text-sm tracking-[0.18em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
        style={{ background: submitting ? 'rgba(0,232,121,0.5)' : 'linear-gradient(135deg,#00e879,#06d6e8)', color: '#040a17', boxShadow: submitting ? 'none' : '0 0 28px rgba(0,232,121,0.40)' }}>
        {submitting
          ? <div className="w-5 h-5 border-2 border-black/25 border-t-black/70 rounded-full animate-spin" />
          : <><span>Entrar no Sistema</span><ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  useEffect(() => {
    const id = 'auth-particle-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes float-1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.08)}}
      @keyframes float-2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(0.92)}}
      @keyframes float-3{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-28px) scale(1.04)}}
      @keyframes auth-glow{0%,100%{opacity:.45}50%{opacity:.80}}
      @keyframes auth-scan{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    `;
    document.head.appendChild(style);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040a17] flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center"
          style={{ boxShadow: '0 0 32px rgba(0,232,121,0.5)' }}>
          <Zap className="w-6 h-6 text-black" strokeWidth={3} />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  /* ─── Background layers ─── */
  const bgGlows = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(0,232,121,0.09) 0%,transparent 70%)', top: '-20%', left: '-20%', animation: 'auth-glow 5s ease-in-out infinite' }} />
      <div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(6,214,232,0.07) 0%,transparent 70%)', bottom: '-20%', right: '-15%', animation: 'auth-glow 6s ease-in-out infinite reverse' }} />
      <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
      <div className="absolute left-0 right-0 h-[2px] opacity-[0.04]" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,232,121,1),transparent)', animation: 'auth-scan 8s linear infinite' }} />
    </div>
  );
  // Normal login keeps the floating particles; welcome mode uses clean bg only
  const bg = <>{bgGlows}{PARTICLES.map(p => <Particle key={p.key} style={p.style} />)}</>;

  /* ─── Logo header ─── */
  const logo = (
    <div className="flex flex-col items-center mb-8 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center"
        style={{ boxShadow: '0 0 40px rgba(0,232,121,0.50), 0 0 80px rgba(0,232,121,0.20)' }}>
        <Zap className="w-8 h-8 text-black" strokeWidth={3} />
      </div>
      <p className="font-display text-base tracking-[0.28em] font-bold uppercase"
        style={{ background: 'linear-gradient(135deg,#00e879,#06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        SUA VIDA É UM{' '}
        <GlitchWord word="JOGO" buildDelay={600}
          style={{ background: 'linear-gradient(135deg,#00e879,#06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
      </p>
    </div>
  );

  const cardStyle = { background: 'rgba(13,21,38,0.75)', border: '1px solid rgba(0,232,121,0.12)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' };

  /* ══════════════════════════════════════════════
     WELCOME MODE — split layout
  ══════════════════════════════════════════════ */
  if (isWelcome) {
    return (
      <div className="min-h-screen bg-[#040a17] flex items-center justify-center overflow-hidden relative px-4 py-8">
        {bgGlows}
        <div className="relative z-10 w-full max-w-4xl">

          {/* Logo centered above */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center"
                style={{ boxShadow: '0 0 20px rgba(0,232,121,0.38)' }}>
                <Zap className="w-4.5 h-4.5 text-black" strokeWidth={3} />
              </div>
              <p className="font-display text-[11px] tracking-[0.3em] font-bold uppercase"
                style={{ background: 'linear-gradient(135deg,#00e879,#06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                SUA VIDA É UM JOGO
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

            {/* LEFT — instructions */}
            <div className="rounded-2xl px-6 py-6" style={cardStyle}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4"
                style={{ background: 'rgba(0,232,121,0.10)', border: '1px solid rgba(0,232,121,0.22)' }}>
                <CheckCircle2 className="w-2.5 h-2.5" style={{ color: '#00e879' }} />
                <span className="text-[9px] font-display tracking-[0.2em] uppercase" style={{ color: '#00e879' }}>
                  Assinatura confirmada
                </span>
              </div>

              <h2 className="font-display text-lg text-white tracking-wide mb-1">
                O que fazer agora?
              </h2>
              <p className="text-[12px] text-white/70 font-body mb-4 leading-relaxed">
                Siga os 3 passos abaixo para acessar o sistema pela primeira vez.
              </p>

              <div className="space-y-2.5">
                {WELCOME_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${step.color}18` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${step.color}12`, border: `1px solid ${step.color}28` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: step.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body font-semibold text-white leading-tight">
                          <span className="text-[10px] font-display tracking-[0.15em] uppercase mr-1.5" style={{ color: step.color }}>{i + 1}.</span>
                          {step.title}
                        </p>
                        <p className="text-[12px] text-white/70 font-body leading-snug mt-1">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-white/50 font-body mt-4">
                Não recebeu? Verifique a pasta de spam.
              </p>
            </div>

            {/* RIGHT — login form */}
            <div className="rounded-2xl px-6 py-6" style={cardStyle}>
              <LoginForm compact={false} />

              <div className="mt-5 pt-4 border-t border-white/6">
                <div className="flex items-center justify-center gap-4">
                  {['Metas com IA', 'Gamificação', 'Evolução diária'].map(f => (
                    <div key={f} className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" style={{ color: '#00e879' }} />
                      <span className="text-[8px] text-white/22 font-body">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     NORMAL LOGIN
  ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#040a17] flex items-center justify-center overflow-hidden relative">
      {bg}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {logo}
        <div className="rounded-2xl px-7 py-8" style={cardStyle}>
          <LoginForm />
          <div className="mt-6 pt-5 border-t border-white/6">
            <div className="flex items-center justify-center gap-4">
              {['Metas com IA', 'Gamificação', 'Evolução diária'].map(f => (
                <div key={f} className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" style={{ color: '#00e879' }} />
                  <span className="text-[8px] text-white/22 font-body">{f}</span>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/16 font-body text-center mt-3">© 2026 Sua Vida é um Jogo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
