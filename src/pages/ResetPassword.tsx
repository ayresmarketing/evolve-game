import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
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
      toast.success('Senha atualizada com sucesso!');
      navigate('/');
    }
    setSubmitting(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-body text-sm">Link inválido ou expirado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-lg tracking-wider text-primary font-bold">NOVA SENHA</h1>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm section-card p-6 space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider font-bold hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Atualizando...' : 'Atualizar Senha'}
        </button>
      </form>
    </div>
  );
}
