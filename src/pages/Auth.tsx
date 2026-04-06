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
    <div className="min-h-screen bg-gradient-hero relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,hsl(var(--primary)/0.22),transparent_34%),radial-gradient(circle_at_85%_12%,hsl(var(--personal-purple)/0.18),transparent_32%),radial-gradient(circle_at_62%_72%,hsl(var(--game-cyan)/0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,hsl(var(--primary)/0.06)_35%,transparent_70%)]" />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8 items-center">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-game-cyan flex items-center justify-center shadow-glow-cyan">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl tracking-[0.16em] text-primary font-bold">LIFEQUEST</h1>
                <p className="text-xs text-muted-foreground font-body tracking-[0.12em]">GAMIFIED PRODUCTIVITY ENGINE</p>
              </div>
            </div>

            <div className="section-card p-6 md:p-7 relative overflow-hidden">
              <div className="absolute -right-16 -bottom-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
              <p className="text-xs text-primary tracking-[0.2em] uppercase font-display">Dashboard Experience</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display text-foreground leading-tight">
                Interface imersiva, rápida e fluida em qualquer tela
              </h2>
              <p className="mt-3 text-sm text-muted-foreground font-body max-w-xl">
                Organize metas, acompanhe evolução, veja gráficos em tempo real e execute tarefas em poucos toques.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass-card p-3">
                  <Gauge className="w-4 h-4 text-primary mb-2" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">Performance</p>
                  <p className="text-lg font-display text-foreground">100%</p>
                </div>
                <div className="glass-card p-3">
                  <Sparkles className="w-4 h-4 text-game-purple mb-2" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">Gamificado</p>
                  <p className="text-lg font-display text-foreground">UI Pro</p>
                </div>
                <div className="glass-card p-3">
                  <ShieldCheck className="w-4 h-4 text-game-green mb-2" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">Segurança</p>
                  <p className="text-lg font-display text-foreground">Ativa</p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="w-full max-w-md mx-auto section-card p-6 md:p-7 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-accent" />
              <div className="text-left">
                <p className="text-[10px] text-primary tracking-[0.22em] uppercase font-display">Acesso</p>
                <h2 className="font-display text-2xl tracking-wider text-foreground mt-1">
                  {isLogin ? 'Entrar no Painel' : 'Criar Nova Conta'}
                </h2>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {isLogin ? 'Retome sua evolução de onde parou.' : 'Comece agora sua jornada gamificada.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Nome de exibição"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-accent text-primary-foreground font-display text-sm tracking-wider font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-glow-cyan"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => { setIsLogin(!isLogin); setEmail(''); setPassword(''); setDisplayName(''); }}
                  className="text-xs text-primary font-body hover:underline"
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
