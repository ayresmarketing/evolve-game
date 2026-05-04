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

const toDigits = (v: string) => v.replace(/\D/g, '');

function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  if (d.length <= 2)  return d;
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function WhatsAppDialog({ open, onOpenChange, userId, currentPhone, onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const digits = toDigits(phone).slice(0, 10);
  const isPhoneValid = digits.length === 10;
  const e164 = `55${digits}`;

  const handleSave = async () => {
    if (!isPhoneValid) {
      toast.error('Informe DDD + número (exatamente 10 dígitos).');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('user_whatsapp_config' as any).upsert({
        user_id: userId,
        whatsapp_phone: e164,
        whatsapp_phone_raw: e164,
        whatsapp_phone_normalized: e164,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Número do WhatsApp vinculado!');
      onSuccess(e164);
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
        setPhone('');
        setDone(false);
      }, 1500);
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) { setPhone(''); setDone(false); }
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

        {!done ? (
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
                  placeholder="0000-0000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1.5">DDD + número — ex: 3100000000</p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || !isPhoneValid}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-display tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Vincular Número</>}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="font-display text-sm tracking-wider text-foreground">WhatsApp vinculado!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
