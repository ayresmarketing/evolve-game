import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2 } from 'lucide-react';

export default function Obrigado() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const step = 100 / 30; // 3 seconds, 100ms intervals
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          navigate('/auth?welcome=1');
          return 100;
        }
        return p + step;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#040a17] flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,232,121,0.07) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(6,214,232,0.05) 0%, transparent 60%), #040a17' }}>
      <div className="text-center max-w-sm w-full">
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center"
            style={{ boxShadow: '0 0 50px rgba(0,232,121,0.50)' }}>
            <Zap className="w-10 h-10 text-black" strokeWidth={3} />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#00e879] flex items-center justify-center"
            style={{ boxShadow: '0 0 14px rgba(0,232,121,0.8)' }}>
            <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
          </div>
        </div>

        <p className="text-[10px] font-display tracking-[0.3em] uppercase mb-3"
          style={{ color: '#00e879' }}>Assinatura Confirmada</p>

        <h1 className="font-display text-2xl text-white tracking-wide mb-3">
          Seja bem-vindo!
        </h1>

        <p className="text-sm text-white/45 font-body leading-relaxed mb-8">
          Enviamos suas credenciais de acesso por e-mail.<br />
          Redirecionando para o login...
        </p>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00e879, #06d6e8)' }} />
        </div>

        <button
          onClick={() => navigate('/auth?welcome=1')}
          className="text-[11px] font-body text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
        >
          Ir agora
        </button>
      </div>
    </div>
  );
}
