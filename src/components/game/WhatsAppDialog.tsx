import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  currentPhone?: string;
  onSuccess: (phone: string) => void;
}

type Step = 'phone' | 'code' | 'done';

const toDigits = (v: string) => v.replace(/\D/g, '');

function formatPhone(digits: string) {
  const d = digits.slice(0, 10); // DDD (2) + número (8) = 10 dígitos
  if (d.length <= 2)  return d;
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function WhatsAppDialog({ open, onOpenChange, userId, currentPhone, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneE164, setPhoneE164] = useState('');

  const digits = toDigits(phone).slice(0, 10);
  const isPhoneValid = digits.length === 10;

  const handleSendCode = async () => {
    if (!isPhoneValid) {
      toast.error('Informe DDD + número (exatamente 10 dígitos).');
      return;
    }
    const e164 = `55${digits}`;
    setPhoneE164(e164);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-code', {
        body: { phone: e164 },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Erro ao enviar código.');
        return;
      }
      toast.success('Código enviado no WhatsApp!');
      setStep('code');
    } catch (e: any) {
      toast.error('Erro ao enviar código: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error('O código tem 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-phone-code', {
        body: { phone: phoneE164, code },
      });
      if (error || data?.error) {
        toast.error(data?.error === 'invalid code' ? 'Código incorreto.' : data?.error || 'Erro ao verificar.');
        return;
      }
      // Save verified number
      await supabase.from('user_whatsapp_config' as any).upsert({
        user_id: userId,
        whatsapp_phone: phoneE164,
        whatsapp_phone_raw: phoneE164,
        whatsapp_phone_normalized: phoneE164,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      toast.success('WhatsApp verificado e vinculado!');
      onSuccess(phoneE164);
      setStep('done');
      setTimeout(() => {
        onOpenChange(false);
        setStep('phone');
        setPhone('');
        setCode('');
      }, 1500);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep('phone');
      setPhone('');
      setCode('');
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider">
            <MessageCircle className="w-5 h-5 text-green-400" />
            WhatsApp Financeiro
          </DialogTitle>
          <DialogDescription>
            Vincule seu número para acessar seus dados financeiros do bot.
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' && (
          <div className="space-y-4">
            {currentPhone && (
              <div className="rounded-xl border border-border bg-secondary/20 p-3 text-xs font-body text-muted-foreground">
                Número atual: <code className="text-foreground">{currentPhone}</code>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase mb-2">
                Número do WhatsApp
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none select-none">🇧🇷</span>
                <input
                  type="tel"
                  value={formatPhone(digits)}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(31) 00000-000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1.5">DDD + número — ex: 3100000000</p>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading || !isPhoneValid}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-display tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Enviar Código</>}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-xs font-body text-muted-foreground">
              Código enviado para <strong className="text-foreground">+{phoneE164}</strong> via WhatsApp.
            </div>
            <div>
              <label className="block text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase mb-2">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full py-3 px-4 rounded-xl bg-secondary/50 border border-border text-center text-2xl font-mono font-bold text-foreground tracking-[0.5em] focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('phone')}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-display tracking-wider hover:text-foreground transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-display tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
              </button>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full text-[11px] text-muted-foreground font-body hover:text-foreground transition-colors"
            >
              Reenviar código
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="font-display text-sm tracking-wider text-foreground">WhatsApp verificado!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
