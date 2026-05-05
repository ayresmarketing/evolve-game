import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    // implicit flow: token in hash; PKCE flow: code in query string
    if (hash.includes('type=recovery') || hash.includes('type=invite') || params.has('code')) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha definida! Faça login para entrar.');
      await supabase.auth.signOut();
      navigate('/auth');
    }
    setSubmitting(false);
  };

  const bg = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(0,232,121,0.08) 0%,transparent 70%)', top: '-15%', left: '-20%' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(6,214,232,0.06) 0%,transparent 70%)', bottom: '-20%', right: '-15%' }} />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
    </div>
  );

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#040a17] flex items-center justify-center relative">
        {bg}
        <div className="relative z-10 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center mx-auto mb-5"
            style={{ boxShadow: '0 0 32px rgba(0,232,121,0.4)' }}>
            <Zap className="w-7 h-7 text-black" strokeWidth={3} />
          </div>
          <p className="text-white/40 font-body text-sm">Link inválido ou expirado.</p>
          <button onClick={() => navigate('/auth')}
            className="mt-4 text-[11px] font-body text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040a17] flex items-center justify-center relative px-4">
      {bg}

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center mb-4"
            style={{ boxShadow: '0 0 40px rgba(0,232,121,0.50), 0 0 80px rgba(0,232,121,0.18)' }}>
            <Zap className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase font-bold"
            style={{ background: 'linear-gradient(135deg,#00e879,#06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            SUA VIDA É UM JOGO
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl px-7 py-8"
          style={{ background: 'rgba(13,21,38,0.80)', border: '1px solid rgba(0,232,121,0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

          <h1 className="font-display text-[22px] text-white tracking-wide mb-1">
            Defina sua senha
          </h1>
          <p className="text-[11px] text-white/38 font-body mb-6 leading-relaxed">
            Crie uma senha para acessar o sistema. Mínimo de 6 caracteres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-display tracking-[0.26em] text-white/30 uppercase mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-11 py-3 rounded-xl text-sm text-white placeholder:text-white/18 font-body focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,232,121,0.36)'}
                  onBlur={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                  autoFocus
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
              className="w-full mt-2 py-3.5 rounded-xl font-display text-sm tracking-[0.18em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
              style={{
                background: submitting ? 'rgba(0,232,121,0.5)' : 'linear-gradient(135deg,#00e879,#06d6e8)',
                color: '#040a17',
                boxShadow: submitting ? 'none' : '0 0 28px rgba(0,232,121,0.40)',
              }}
            >
              {submitting
                ? <div className="w-5 h-5 border-2 border-black/25 border-t-black/70 rounded-full animate-spin" />
                : <><span>Confirmar Senha</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
