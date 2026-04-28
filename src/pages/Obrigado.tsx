import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, KeyRound, LogIn, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { GlitchWord } from '@/components/game/GlitchWord';

const STEPS = [
  {
    icon: Mail,
    title: 'Verifique seu e-mail',
    desc: 'Enviamos um convite para o e-mail cadastrado no pagamento. Abra e clique no link de ativação.',
    color: '#00e879',
  },
  {
    icon: KeyRound,
    title: 'Crie sua senha',
    desc: 'Ao clicar no link do e-mail, você será direcionado para definir sua senha de acesso ao sistema.',
    color: '#06d6e8',
  },
  {
    icon: LogIn,
    title: 'Entre no sistema',
    desc: 'Com e-mail e senha definidos, acesse o app e comece sua jornada de evolução pessoal.',
    color: '#8b5cf6',
  },
];

export default function Obrigado() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = 'obrigado-style';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes ob-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes ob-glow  { 0%,100%{opacity:.4} 50%{opacity:.85} }
        @keyframes ob-scan  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes ob-in    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `;
      document.head.appendChild(style);
    }
    setTimeout(() => setVisible(true), 80);
  }, []);

  return (
    <div className="min-h-screen bg-[#040a17] flex items-center justify-center overflow-hidden relative px-4 py-10">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,232,121,0.10) 0%, transparent 70%)', top: '-15%', left: '-20%', animation: 'ob-glow 5s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,214,232,0.07) 0%, transparent 70%)', bottom: '-20%', right: '-15%', animation: 'ob-glow 6s ease-in-out infinite reverse' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', top: '40%', left: '60%', animation: 'ob-glow 7s ease-in-out infinite 1s' }} />
        <div className="absolute inset-0 opacity-[0.022]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        <div className="absolute left-0 right-0 h-[2px] opacity-[0.04]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,232,121,1), transparent)', animation: 'ob-scan 9s linear infinite' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg" style={{ animation: visible ? 'ob-in .5s ease both' : 'none' }}>

        {/* Icon + brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e879] to-[#06d6e8] flex items-center justify-center"
              style={{ boxShadow: '0 0 50px rgba(0,232,121,0.55), 0 0 100px rgba(0,232,121,0.20)', animation: 'ob-float 3s ease-in-out infinite' }}>
              <Zap className="w-10 h-10 text-black" strokeWidth={3} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#00e879] flex items-center justify-center"
              style={{ boxShadow: '0 0 12px rgba(0,232,121,0.8)' }}>
              <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
            </div>
          </div>
          <div className="text-center mt-1">
            <p className="font-display text-[11px] tracking-[0.3em] uppercase font-bold"
              style={{ background: 'linear-gradient(135deg, #00e879, #06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              SUA VIDA É UM <GlitchWord word="JOGO" buildDelay={500}
                style={{ background: 'linear-gradient(135deg, #00e879, #06d6e8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl px-7 py-8"
          style={{ background: 'rgba(13,21,38,0.80)', border: '1px solid rgba(0,232,121,0.14)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

          {/* Headline */}
          <div className="mb-7 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(0,232,121,0.10)', border: '1px solid rgba(0,232,121,0.22)' }}>
              <Sparkles className="w-3 h-3" style={{ color: '#00e879' }} />
              <span className="text-[10px] font-display tracking-[0.2em] uppercase" style={{ color: '#00e879' }}>Assinatura Confirmada</span>
            </div>
            <h1 className="font-display text-2xl text-white tracking-wide leading-snug">
              Bem-vindo ao Sistema!
            </h1>
            <p className="text-[12px] text-white/45 font-body mt-2 leading-relaxed">
              Seu pagamento foi processado. Siga os passos abaixo para ativar sua conta e começar a evoluir.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-7">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${step.color}18` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-display tracking-[0.22em] uppercase"
                        style={{ color: step.color }}>Passo {i + 1}</span>
                    </div>
                    <p className="text-sm font-body font-semibold text-white leading-tight mb-1">{step.title}</p>
                    <p className="text-[11px] text-white/40 font-body leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3.5 rounded-xl font-display text-sm tracking-[0.18em] uppercase font-bold flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00e879, #06d6e8)', color: '#040a17', boxShadow: '0 0 30px rgba(0,232,121,0.38)' }}
          >
            Ir para o Login
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Footer note */}
          <p className="text-[10px] text-white/22 font-body text-center mt-4 leading-relaxed">
            Não recebeu o e-mail? Verifique a pasta de spam ou aguarde alguns minutos.<br />
            O e-mail é enviado pelo domínio <span className="text-white/38">mail.app.supabase.io</span>
          </p>
        </div>
      </div>
    </div>
  );
}
