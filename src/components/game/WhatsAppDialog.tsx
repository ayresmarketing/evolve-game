import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_URL = 'https://n8n.srv943937.hstgr.cloud/webhook/autenticacao';
const CODE_TTL = 300; // 5 minutes in seconds

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  currentPhone?: string;
  onSuccess: (phone: string) => void;
}

const toDigits = (v: string) => v.replace(/\D/g, '');

function formatPhone(digits: string) {
  const d = digits.slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function WhatsAppDialog({ open, onOpenChange, userId, currentPhone, onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Code verification state
  const [showCode, setShowCode] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CODE_TTL);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = toDigits(phone).slice(0, 11);
  const isPhoneValid = digits.length === 11;
  const e164 = `55${digits.slice(0, 2)}${digits.slice(3)}`;
  const enteredCode = codeDigits.join('');

  // Countdown timer
  useEffect(() => {
    if (!showCode || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [showCode, timeLeft]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Step 1 — send code via n8n webhook
  const handleSendCode = async () => {
    if (!isPhoneValid) {
      toast.error('Informe DDD + 9 + número (exatamente 11 dígitos).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, user_id: userId }),
      });
      if (!res.ok) throw new Error(`Webhook retornou ${res.status}`);
      setCodeDigits(['', '', '', '', '']);
      setTimeLeft(CODE_TTL);
      setShowCode(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify code against auth_cod_whatsapp then save phone
  const handleVerifyCode = async () => {
    if (enteredCode.length !== 5) return;
    setVerifying(true);
    try {
      // Check code: must match cod_5digitos and still be within expiration
      const { data } = await (supabase as any)
        .from('auth_cod_whatsapp')
        .select('id')
        .eq('user_id', userId)
        .eq('cod_5digitos', enteredCode)
        .gt('expiration', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        toast.error('Código inválido ou expirado.');
        setCodeDigits(['', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      // Code valid — save phone
      const { error: saveError } = await (supabase as any)
        .from('user_whatsapp_config')
        .upsert({
          user_id: userId,
          whatsapp_phone: e164,
          whatsapp_phone_raw: e164,
          whatsapp_phone_normalized: e164,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (saveError) throw saveError;

      toast.success('Número verificado e vinculado!');
      onSuccess(e164);
      setDone(true);
      setTimeout(() => { onOpenChange(false); reset(); }, 1500);
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setPhone(''); setDone(false); setShowCode(false);
    setCodeDigits(['', '', '', '', '']); setTimeLeft(CODE_TTL);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  // Code input helpers
  const handleDigitChange = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...codeDigits];
    next[idx] = d;
    setCodeDigits(next);
    if (d && idx < 4) inputRefs.current[idx + 1]?.focus();
    if (d && idx === 4) {
      // auto-submit when last digit filled
      const code = next.join('');
      if (code.length === 5) setTimeout(handleVerifyCode, 80);
    }
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (pasted.length === 5) {
      setCodeDigits(pasted.split(''));
      inputRefs.current[4]?.focus();
      setTimeout(handleVerifyCode, 80);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider">
            {showCode
              ? <><ShieldCheck className="w-5 h-5 text-green-400" /> Verificar WhatsApp</>
              : <><MessageCircle className="w-5 h-5 text-green-400" /> WhatsApp Financeiro</>
            }
          </DialogTitle>
          <DialogDescription>
            {showCode
              ? `Enviamos um código de 5 dígitos para ${formatPhone(digits)}. Digite-o abaixo.`
              : 'Vincule seu número para acessar seus dados financeiros do bot.'
            }
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="font-display text-sm tracking-wider text-foreground">WhatsApp verificado!</p>
          </div>

        ) : showCode ? (
          <div className="space-y-6">
            {/* 5-digit code inputs */}
            <div className="flex justify-center gap-3">
              {codeDigits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  onPaste={handleDigitPaste}
                  className="w-12 h-14 text-center text-xl font-display font-bold rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-green-400 transition-colors"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0
                ? <p className="text-xs font-body text-muted-foreground">Código expira em <span className="text-foreground font-semibold">{formatTime(timeLeft)}</span></p>
                : <button onClick={handleSendCode} disabled={loading}
                    className="text-xs font-body text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">
                    {loading ? 'Reenviando...' : 'Reenviar código'}
                  </button>
              }
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={verifying || enteredCode.length !== 5}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-display tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Confirmar</>}
            </button>

            <button onClick={() => setShowCode(false)}
              className="w-full text-xs font-body text-muted-foreground hover:text-foreground transition-colors text-center">
              ← Alterar número
            </button>
          </div>

        ) : (
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
                  placeholder="90000-0000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1.5">DDD + 9 + número — ex: 31900000000</p>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading || !isPhoneValid}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-display tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Enviar código de verificação</>}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
