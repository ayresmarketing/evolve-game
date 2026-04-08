import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Link2, Link2Off, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type IntegrationMode = 'partial' | 'total' | null;

interface GoogleCalendarStatus {
  connected: boolean;
  mode: IntegrationMode;
  loading: boolean;
}

interface GCalCalendar {
  id: string;
  summary: string;
  primary?: boolean;
}

// Google OAuth config - users need to set up their own Google Cloud project
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '990869380684-iu5iuvukn6sl69vhsc0e8qcbv0n3s8r6.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

export function GoogleCalendarDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false, mode: null, loading: true });
  const [selectedMode, setSelectedMode] = useState<IntegrationMode>(null);
  const [connecting, setConnecting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GCalCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');

  useEffect(() => {
    if (open) checkStatus();
  }, [open]);

  const checkStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'status' },
      });
      setStatus({
        connected: data?.connected ?? false,
        mode: data?.mode ?? null,
        loading: false,
      });
      if (data?.mode) setSelectedMode(data.mode);
    } catch {
      setStatus({ connected: false, mode: null, loading: false });
    }
  };

  const handleConnect = async () => {
    if (!selectedMode) {
      toast.error('Selecione um modo de integração.');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      toast.error('Configure a variável VITE_GOOGLE_CLIENT_ID para ativar a integração com o Google Agenda.');
      return;
    }

    setConnecting(true);

    // Open Google OAuth popup
    const redirectUri = `${window.location.origin}/`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(GOOGLE_SCOPES)}` +
      `&state=gcal_${selectedMode}` +
      `&prompt=consent` +
      `&access_type=online`;

    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    // Listen for the OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'google-oauth-callback') {
        const { access_token } = event.data;
        if (access_token) {
          setAccessToken(access_token);
          const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          const calJson = await calRes.json();
          const list = (calJson?.items || []).map((c: any) => ({
            id: c.id,
            summary: c.summary,
            primary: !!c.primary,
          })) as GCalCalendar[];
          setCalendars(list);
          const primary = list.find(c => c.primary)?.id || list[0]?.id || 'primary';
          setSelectedCalendarId(primary);
          toast.success('Conta conectada! Escolha qual agenda integrar.');
        }
        setConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);

    // Fallback: check hash on redirect
    const checkInterval = setInterval(() => {
      try {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
        if (popup?.location?.hash) {
          const hash = popup.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get('access_token');
          if (token) {
            popup.close();
            clearInterval(checkInterval);
            setAccessToken(token);
            fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.json())
              .then(calJson => {
                const list = (calJson?.items || []).map((c: any) => ({
                  id: c.id,
                  summary: c.summary,
                  primary: !!c.primary,
                })) as GCalCalendar[];
                setCalendars(list);
                const primary = list.find(c => c.primary)?.id || list[0]?.id || 'primary';
                setSelectedCalendarId(primary);
                toast.success('Conta conectada! Escolha qual agenda integrar.');
              });
            setConnecting(false);
            window.removeEventListener('message', handleMessage);
          }
        }
      } catch {
        // Cross-origin - ignore
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (connecting) setConnecting(false);
    }, 120000);
  };

  const handleDisconnect = async () => {
    await supabase.functions.invoke('google-calendar', {
      body: { action: 'disconnect' },
    });
    setStatus({ connected: false, mode: null, loading: false });
    setSelectedMode(null);
    setAccessToken(null);
    setCalendars([]);
    toast.success('Google Agenda desconectado.');
  };

  const finalizeIntegration = async () => {
    if (!accessToken || !selectedMode) return;
    await supabase.functions.invoke('google-calendar', {
      body: {
        action: 'save-token',
        access_token: accessToken,
        mode: selectedMode,
        calendar_id: selectedCalendarId,
      },
    });
    setAccessToken(null);
    setCalendars([]);
    toast.success('Google Agenda integrada com sucesso!');
    checkStatus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider">
            <Calendar className="w-5 h-5 text-primary" />
            Google Agenda
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta Google para sincronizar seus eventos.
          </DialogDescription>
        </DialogHeader>

        {status.loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : status.connected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-game-green/30 bg-game-green/5 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-game-green flex-shrink-0" />
              <div>
                <p className="text-sm font-body font-semibold text-foreground">Conectado</p>
                <p className="text-xs text-muted-foreground font-body">
                  Modo: {status.mode === 'total' ? 'Integração Total' : 'Integração Parcial'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-display tracking-wider hover:bg-destructive/5 transition-all flex items-center justify-center gap-2"
            >
              <Link2Off className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        ) : accessToken ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-body font-semibold text-foreground mb-2">Escolha qual agenda integrar</p>
              <select
                value={selectedCalendarId}
                onChange={e => setSelectedCalendarId(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground"
              >
                {calendars.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.summary}{c.primary ? ' (principal)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={finalizeIntegration}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-display tracking-[0.18em] uppercase font-bold"
            >
              Confirmar integração
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode selection */}
            <div className="space-y-3">
              <button
                onClick={() => setSelectedMode('partial')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'partial'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'partial' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {selectedMode === 'partial' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm font-body font-semibold text-foreground">Integração Parcial</p>
                </div>
                <p className="text-xs text-muted-foreground font-body ml-6">
                  Seus eventos criados aqui serão automaticamente adicionados ao seu Google Agenda, 
                  permitindo que você os visualize junto com suas demais atividades pessoais.
                </p>
              </button>

              <button
                onClick={() => setSelectedMode('total')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'total'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'total' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {selectedMode === 'total' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm font-body font-semibold text-foreground">Integração Total</p>
                </div>
                <p className="text-xs text-muted-foreground font-body ml-6">
                  O jogo e seu Google Agenda ficarão completamente sincronizados. 
                  Todos os seus compromissos existentes aparecerão aqui, e tudo que você criar 
                  aqui aparecerá lá — gerencie toda a sua vida em um só lugar.
                </p>
              </button>
            </div>

            <button
              onClick={handleConnect}
              disabled={!selectedMode || connecting}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-display tracking-[0.18em] uppercase font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-glow-cyan hover:opacity-90"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Conectar Google Agenda
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
