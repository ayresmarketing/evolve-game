import { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Zap, CreditCard, Crown, Shield, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { subscribed, trial, loading, trialEnd, subscriptionEnd, openCheckout, openCustomerPortal } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow-cyan animate-pulse">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (subscribed) {
    return <>{children}</>;
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await openCheckout();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030610] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0280FF] flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(2,128,255,0.5)]">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl text-white tracking-wider mb-2">
            Assine para Continuar
          </h1>
          <p className="text-sm text-white/50 font-body max-w-sm mx-auto">
            Seu período de acesso expirou. Assine o plano para retomar sua evolução.
          </p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-[#0280FF]/30 bg-white/5 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-display tracking-[0.25em] text-[#0280FF] uppercase">Plano Mensal</p>
              <p className="font-display text-2xl text-white mt-1">
                R$ 29,90<span className="text-sm text-white/40 font-body">/mês</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0280FF]/15 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#0280FF]" />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              '30 dias grátis para testar',
              'Metas com planejamento por IA',
              'Dashboard completo com analytics',
              'Gamificação: XP, níveis e streaks',
              'Integração com Google Agenda',
              'Controle financeiro e hidratação',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0280FF] flex-shrink-0" />
                <span className="text-sm text-white/70 font-body">{f}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full py-4 rounded-xl bg-[#0280FF] hover:bg-[#0270ee] text-white font-display text-sm tracking-[0.2em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 shadow-[0_0_28px_rgba(2,128,255,0.4)]"
          >
            {checkoutLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Começar Teste Grátis
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-white/30 font-body text-center">
          <Shield className="w-3 h-3 inline mr-1" />
          Pagamento seguro via Stripe. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
