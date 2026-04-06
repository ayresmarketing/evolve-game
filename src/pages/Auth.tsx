import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Gauge, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow-cyan animate-pulse">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (!isLogin && password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Email ou senha incorretos.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
          } else {
            toast.error(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
          setIsLogin(true);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-premium min-h-screen relative overflow-x-hidden bg-[#050a14]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(2,128,255,0.28),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(96,64,255,0.22),transparent_32%),radial-gradient(circle_at_60%_85%,rgba(26,214,173,0.16),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.02),transparent_40%)]" />

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-2rem)] grid lg:grid-cols-12 gap-5">
          <section className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,#0280FF,#5fa9ff)] flex items-center justify-center shadow-glow-cyan">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-xl tracking-[0.16em] text-white font-bold">LIFEQUEST</h1>
                  <p className="text-xs text-white/60 font-body tracking-[0.12em]">PREMIUM CONTROL CENTER</p>
                </div>
              </div>

              <h2 className="mt-8 text-4xl md:text-5xl leading-tight font-display text-white max-w-2xl">
                Uma interface que transforma disciplina em progresso visual.
              </h2>
              <p className="mt-4 text-sm md:text-base text-white/75 font-body max-w-2xl">
                Organize metas, acompanhe gráficos e execute rotinas em uma experiência fluida, responsiva e orientada por performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <Gauge className="w-4 h-4 text-[#0280FF] mb-2" />
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">Performance</p>
                <p className="text-2xl font-display text-white mt-1">Ultra</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <Sparkles className="w-4 h-4 text-[#63ff9f] mb-2" />
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">UX</p>
                <p className="text-2xl font-display text-white mt-1">Fluida</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <ShieldCheck className="w-4 h-4 text-[#f7b84b] mb-2" />
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">Segurança</p>
                <p className="text-2xl font-display text-white mt-1">Ativa</p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-5 flex items-center">
            <div className="w-full max-w-[520px] mx-auto rounded-3xl border border-white/15 bg-[#0b1220]/90 backdrop-blur-xl p-6 md:p-8">
              <p className="text-[10px] text-[#7ebcff] tracking-[0.24em] uppercase font-display">Acesso</p>
              <h2 className="font-display text-3xl tracking-wider text-white mt-1">
                {isLogin ? 'Entrar no Painel' : 'Criar Conta Premium'}
              </h2>
              <p className="text-xs text-white/60 font-body mt-2">
                {isLogin ? 'Continue sua jornada de evolução.' : 'Comece agora com a nova experiência LifeQuest.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                    <input
                      type="text"
                      placeholder="Nome de exibição"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/12 text-sm font-body text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0280FF]/45"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/12 text-sm font-body text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0280FF]/45"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/12 text-sm font-body text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0280FF]/45"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[linear-gradient(135deg,#0280FF,#49a5ff)] text-white font-display text-sm tracking-wider font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-glow-cyan"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-5">
                <button
                  onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setDisplayName(''); }}
                  className="text-xs text-[#77b8ff] font-body hover:underline"
                >
                  {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
