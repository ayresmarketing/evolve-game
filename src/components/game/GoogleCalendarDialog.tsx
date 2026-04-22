import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { googleSaveToken, googleDisconnect, googleGetStatus } from '@/lib/googleSync';
import { Calendar, Link2, Link2Off, CheckCircle2, Loader2 } from 'lucide-react';
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

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '990869380684-iu5iuvukn6sl69vhsc0e8qcbv0n3s8r6.apps.googleusercontent.com';
const GOOGLE_SCOPES =
  'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  /** Token vindo do redirect OAuth — pula direto para seleção de agenda */
  initialToken?: string | null;
  /** Tempo de expiração em segundos do token OAuth */
  initialExpiresIn?: number | null;
  /** Modo escolhido antes do redirect */
  initialMode?: IntegrationMode;
}

export function GoogleCalendarDialog({ open, onOpenChange, onSuccess, initialToken, initialExpiresIn, initialMode }: Props) {
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false, mode: null, loading: true });
  const [selectedMode, setSelectedMode] = useState<IntegrationMode>(initialMode || null);
  const [connecting, setConnecting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null);
  const [calendars, setCalendars] = useState<GCalCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');

  useEffect(() => {
    if (open) checkStatus();
  }, [open]);

  // Quando vier token do redirect OAuth, vai direto pra seleção de agenda
  useEffect(() => {
    if (!initialToken) return;
    setAccessToken(initialToken);
    if (initialExpiresIn) setTokenExpiresIn(initialExpiresIn);
    if (initialMode) setSelectedMode(initialMode);
    fetchCalendars(initialToken);
  }, [initialToken, initialExpiresIn, initialMode]);

  const fetchCalendars = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const list: GCalCalendar[] = (json?.items || []).map((c: any) => ({
        id: c.id,
        summary: c.summary,
        primary: !!c.primary,
      }));
      setCalendars(list);
      const primary = list.find(c => c.primary)?.id || list[0]?.id || 'primary';
      setSelectedCalendarId(primary);
      toast.success('Conta conectada! Escolha qual agenda integrar.');
    } catch {
      toast.error('Não foi possível carregar suas agendas.');
    }
  };

  const checkStatus = async () => {
    try {
      const result = await googleGetStatus();
      setStatus({ connected: result.connected, mode: result.mode as IntegrationMode, loading: false });
      if (result.mode) setSelectedMode(result.mode as IntegrationMode);
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
      toast.error('Configure a variável VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    // Salva o modo escolhido para quando o Google redirecionar de volta
    sessionStorage.setItem('gcal_pending_mode', selectedMode);

    const redirectUri = `${window.location.origin}/`;
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(GOOGLE_SCOPES)}` +
      `&prompt=consent` +
      `&access_type=online`;

    // Redireciona a página inteira (evita problemas de COOP com popup)
    window.location.assign(authUrl);
  };

  const handleDisconnect = async () => {
    await googleDisconnect();
    setStatus({ connected: false, mode: null, loading: false });
    setSelectedMode(null);
    setAccessToken(null);
    setCalendars([]);
    toast.success('Google Agenda desconectado.');
  };

  const finalizeIntegration = async () => {
    if (!accessToken || !selectedMode) return;
    const expiresIn = tokenExpiresIn || 3600;
    await googleSaveToken(accessToken, selectedMode, selectedCalendarId, expiresIn);
    setAccessToken(null);
    setCalendars([]);
    setTokenExpiresIn(null);
    toast.success('Google Agenda integrada com sucesso!');
    onOpenChange(false);
    onSuccess?.();
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
            <div className="space-y-3">
              {(['partial', 'total'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedMode === mode
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === mode ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedMode === mode && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm font-body font-semibold text-foreground">
                      {mode === 'partial' ? 'Integração Parcial' : 'Integração Total'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-body ml-6">
                    {mode === 'partial'
                      ? 'Seus eventos criados aqui serão automaticamente adicionados ao seu Google Agenda.'
                      : 'O jogo e seu Google Agenda ficarão completamente sincronizados — o que estiver em um aparece no outro.'}
                  </p>
                </button>
              ))}
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
