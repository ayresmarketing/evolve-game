import { useEffect } from 'react';

const STYLE_ID = 'sword-clash-keyframes';

export function SwordClashAnimation() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* ── Sword entry / exit ── */
      @keyframes sword-left-move {
        0%        { transform: translate(-75px, 68px); opacity: 0; }
        8%        { opacity: 1; }
        38%, 75%  { transform: translate(0px, 0px);   opacity: 1; }
        42%       { transform: translate(8px, -6px);  opacity: 1; }
        46%       { transform: translate(-3px, 3px);  opacity: 1; }
        92%       { transform: translate(0px, 0px);   opacity: 1; }
        100%      { transform: translate(-75px, 68px); opacity: 0; }
      }
      @keyframes sword-right-move {
        0%        { transform: translate(75px, 68px);  opacity: 0; }
        8%        { opacity: 1; }
        38%, 75%  { transform: translate(0px, 0px);    opacity: 1; }
        42%       { transform: translate(-8px, -6px);  opacity: 1; }
        46%       { transform: translate(3px, 3px);    opacity: 1; }
        92%       { transform: translate(0px, 0px);    opacity: 1; }
        100%      { transform: translate(75px, 68px);  opacity: 0; }
      }

      /* ── Impact flash ── */
      @keyframes clash-flash {
        0%, 34%  { opacity: 0; transform: scale(0.1); }
        38%      { opacity: 1; transform: scale(1.6); }
        44%      { opacity: 0.6; transform: scale(1); }
        46%      { opacity: 1; transform: scale(1.3); }
        52%      { opacity: 0; transform: scale(2.2); }
        100%     { opacity: 0; transform: scale(0.1); }
      }

      /* ── Sparks flying outward ── */
      @keyframes spark-up       { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 42%{opacity:1;transform:translate(0,0) scale(1)} 68%{opacity:0;transform:translate(0px,-36px) scale(0.4)} 100%{opacity:0} }
      @keyframes spark-up-right { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 42%{opacity:1;transform:translate(0,0) scale(1)} 68%{opacity:0;transform:translate(28px,-28px) scale(0.3)} 100%{opacity:0} }
      @keyframes spark-right     { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 42%{opacity:1;transform:translate(0,0) scale(1)} 68%{opacity:0;transform:translate(38px,-10px) scale(0.3)} 100%{opacity:0} }
      @keyframes spark-up-left   { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 42%{opacity:1;transform:translate(0,0) scale(1)} 68%{opacity:0;transform:translate(-28px,-28px) scale(0.3)} 100%{opacity:0} }
      @keyframes spark-left      { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 42%{opacity:1;transform:translate(0,0) scale(1)} 68%{opacity:0;transform:translate(-38px,-10px) scale(0.3)} 100%{opacity:0} }
      @keyframes spark-up-right2 { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 44%{opacity:1;transform:translate(0,0) scale(1)} 72%{opacity:0;transform:translate(18px,-44px) scale(0.2)} 100%{opacity:0} }
      @keyframes spark-up-left2  { 0%,38%{opacity:0;transform:translate(0,0) scale(1)} 44%{opacity:1;transform:translate(0,0) scale(1)} 72%{opacity:0;transform:translate(-18px,-44px) scale(0.2)} 100%{opacity:0} }
      @keyframes spark-up-right3 { 0%,40%{opacity:0;transform:translate(0,0) scale(1)} 45%{opacity:1;transform:translate(0,0) scale(1)} 70%{opacity:0;transform:translate(34px,-18px) scale(0.25)} 100%{opacity:0} }
      @keyframes spark-up-left3  { 0%,40%{opacity:0;transform:translate(0,0) scale(1)} 45%{opacity:1;transform:translate(0,0) scale(1)} 70%{opacity:0;transform:translate(-34px,-18px) scale(0.25)} 100%{opacity:0} }

      /* ── Outer glow ring at impact ── */
      @keyframes clash-ring {
        0%, 35%  { opacity: 0; transform: scale(0.2); }
        40%      { opacity: 0.7; transform: scale(1); }
        55%      { opacity: 0; transform: scale(2.5); }
        100%     { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {};
  }, []);

  const DUR = '4s';

  const sparks = [
    { anim: 'spark-up',       cx: 100, cy: 52, r: 3.2, color: '#FFD700' },
    { anim: 'spark-up-right', cx: 100, cy: 52, r: 2.8, color: '#FFA500' },
    { anim: 'spark-right',    cx: 100, cy: 52, r: 2.4, color: '#FF8C00' },
    { anim: 'spark-up-left',  cx: 100, cy: 52, r: 2.8, color: '#FFD700' },
    { anim: 'spark-left',     cx: 100, cy: 52, r: 2.4, color: '#FF6B00' },
    { anim: 'spark-up-right2',cx: 100, cy: 52, r: 2,   color: '#FFFF00' },
    { anim: 'spark-up-left2', cx: 100, cy: 52, r: 2,   color: '#FFE566' },
    { anim: 'spark-up-right3',cx: 100, cy: 52, r: 1.8, color: '#FFC200' },
    { anim: 'spark-up-left3', cx: 100, cy: 52, r: 1.8, color: '#FF9800' },
  ];

  return (
    <div style={{ width: '200px', height: '110px', margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox="0 0 200 110"
        width="200"
        height="110"
        style={{ overflow: 'visible' }}
      >
        {/* ═══════════════════════════════════
            LEFT SWORD
            Origin of transforms: (100, 52) — clash point
        ════════════════════════════════════ */}
        <g
          style={{
            transformOrigin: '100px 52px',
            animation: `sword-left-move ${DUR} ease-in-out infinite`,
            willChange: 'transform',
          }}
        >
          {/* Blade — tip at (100,22), handle at (28,94) */}
          <polygon
            points="100,22 25,92 30,97"
            fill="url(#blade-left-grad)"
            stroke="#8899bb"
            strokeWidth="0.4"
          />
          {/* Blade highlight */}
          <polygon
            points="100,22 25,92 27.5,94"
            fill="white"
            opacity="0.22"
          />
          {/* Guard — perpendicular to blade at ~75% from tip */}
          <rect
            x="31" y="79" width="14" height="4"
            rx="2"
            fill="#6a7280"
            stroke="#555"
            strokeWidth="0.5"
            transform="rotate(45 38 81)"
          />
          {/* Handle */}
          <rect
            x="20" y="87" width="15" height="5"
            rx="2"
            fill="#7B4F2E"
            stroke="#5a3820"
            strokeWidth="0.4"
            transform="rotate(45 27.5 89.5)"
          />
          {/* Pommel */}
          <circle
            cx="16" cy="97"
            r="3.5"
            fill="#888"
            stroke="#666"
            strokeWidth="0.5"
            transform="rotate(45 16 97)"
          />
        </g>

        {/* ═══════════════════════════════════
            RIGHT SWORD (mirrored)
        ════════════════════════════════════ */}
        <g
          style={{
            transformOrigin: '100px 52px',
            animation: `sword-right-move ${DUR} ease-in-out infinite`,
            willChange: 'transform',
          }}
        >
          {/* Blade — mirror: tip at (100,22), handle at (172,94) */}
          <polygon
            points="100,22 175,92 170,97"
            fill="url(#blade-right-grad)"
            stroke="#bb9988"
            strokeWidth="0.4"
          />
          <polygon
            points="100,22 175,92 172.5,94"
            fill="white"
            opacity="0.22"
          />
          {/* Guard */}
          <rect
            x="155" y="79" width="14" height="4"
            rx="2"
            fill="#7a6870"
            stroke="#655"
            strokeWidth="0.5"
            transform="rotate(-45 162 81)"
          />
          {/* Handle */}
          <rect
            x="165" y="87" width="15" height="5"
            rx="2"
            fill="#7B4F2E"
            stroke="#5a3820"
            strokeWidth="0.4"
            transform="rotate(-45 172.5 89.5)"
          />
          {/* Pommel */}
          <circle
            cx="184" cy="97"
            r="3.5"
            fill="#888"
            stroke="#666"
            strokeWidth="0.5"
          />
        </g>

        {/* ═══════════════════════════════════
            IMPACT — glow ring
        ════════════════════════════════════ */}
        <circle
          cx="100" cy="52" r="10"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          style={{
            transformOrigin: '100px 52px',
            animation: `clash-ring ${DUR} ease-out infinite`,
          }}
        />

        {/* ═══════════════════════════════════
            IMPACT — central flash
        ════════════════════════════════════ */}
        <circle
          cx="100" cy="52" r="7"
          fill="url(#flash-grad)"
          style={{
            transformOrigin: '100px 52px',
            animation: `clash-flash ${DUR} ease-out infinite`,
          }}
        />

        {/* ═══════════════════════════════════
            SPARKS
        ════════════════════════════════════ */}
        {sparks.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill={s.color}
            style={{
              transformOrigin: `${s.cx}px ${s.cy}px`,
              animation: `${s.anim} ${DUR} ease-out infinite`,
              filter: `drop-shadow(0 0 3px ${s.color})`,
            }}
          />
        ))}

        {/* ═══════════════════════════════════
            GRADIENTS
        ════════════════════════════════════ */}
        <defs>
          <linearGradient id="blade-left-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#e8eef8" />
            <stop offset="40%"  stopColor="#c8d4e8" />
            <stop offset="100%" stopColor="#8899bb" />
          </linearGradient>
          <linearGradient id="blade-right-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#f8eee8" />
            <stop offset="40%"  stopColor="#e8d4c8" />
            <stop offset="100%" stopColor="#bb9988" />
          </linearGradient>
          <radialGradient id="flash-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%"  stopColor="#FFE066" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
