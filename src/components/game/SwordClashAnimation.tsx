import { useEffect } from 'react';

const STYLE_ID = 'sword-clash-pixel-kf';

/* ─────────────────────────────────────────────────
   Pixel art sword logic
   Grid: (c, r) → SVG (SX + c*PS, SY - r*PS)
   SX=40, SY=108, PS=6
   Blade runs along the diagonal c == r (NE direction)
   Guard runs along anti-diagonal c + r == 8 (NW–SE, perpendicular)
───────────────────────────────────────────────── */
const PS  = 6;   // pixel size in SVG units
const SX  = 40;  // handle start x
const SY  = 108; // handle start y

const px = (c: number, r: number) => ({ x: SX + c * PS, y: SY - r * PS });

type PixColor =
  | 'pommel' | 'handle' | 'guard'
  | 'blade'  | 'blade2' | 'tip' | 'hi';

const COL: Record<PixColor, string> = {
  pommel : '#4e545f',
  handle : '#6b3f1c',
  guard  : '#424955',
  blade  : '#8fa4b8',
  blade2 : '#aec0d0',
  tip    : '#cce0f0',
  hi     : '#dff0ff',
};

// [col, row, colorKey]
const SWORD_PIXELS: Array<[number, number, PixColor]> = [
  // ── Pommel (2×2 block) ──
  [0, 0, 'pommel'], [1, 0, 'pommel'],
  [0, 1, 'pommel'], [1, 1, 'pommel'],

  // ── Handle (diagonal steps) ──
  [2, 2, 'handle'], [3, 3, 'handle'],

  // ── Guard (anti-diagonal c+r=8, perpendicular to blade) ──
  [2, 6, 'guard'], [3, 5, 'guard'],
  [4, 4, 'guard'],                    // ← guard center (intersects blade diagonal)
  [5, 3, 'guard'], [6, 2, 'guard'],

  // ── Blade (c==r, after guard) ──
  [5, 5, 'blade'], [6, 6, 'blade'], [7, 7, 'blade'],
  [8, 8, 'blade2'], [9, 9, 'blade2'],
  [10, 10, 'tip'],

  // ── Highlight edge (NW face of blade: col c-1, row c+1) ──
  [4, 6, 'hi'], [5, 7, 'hi'], [6, 8, 'hi'], [7, 9, 'hi'],
];

/** Render all pixels for one sword side */
function SwordPixels({ opacity = 1 }: { opacity?: number }) {
  return (
    <>
      {SWORD_PIXELS.map(([c, r, col], i) => {
        const { x, y } = px(c, r);
        return (
          <rect
            key={i}
            x={x} y={y}
            width={PS} height={PS}
            fill={COL[col]}
            shapeRendering="crispEdges"
            opacity={opacity}
          />
        );
      })}
    </>
  );
}

/* ─────────────────────────────────────────────────
   Pixel sparks: 4×4 squares, flying in 8 directions
   All anchored at the clash point (100, 52)
───────────────────────────────────────────────── */
const SPARKS: Array<{
  animName: string;
  dx: number; dy: number;
  color: string;
  size: number;
}> = [
  { animName: 'spk0', dx:  0, dy:-34, color:'#FFE033', size: 4 },
  { animName: 'spk1', dx: 24, dy:-24, color:'#FF9900', size: 4 },
  { animName: 'spk2', dx:-24, dy:-24, color:'#FFD700', size: 4 },
  { animName: 'spk3', dx: 32, dy: -8, color:'#FF6600', size: 3 },
  { animName: 'spk4', dx:-32, dy: -8, color:'#FFD700', size: 3 },
  { animName: 'spk5', dx: 16, dy:-36, color:'#FFEE55', size: 3 },
  { animName: 'spk6', dx:-16, dy:-36, color:'#FFC000', size: 3 },
  { animName: 'spk7', dx:  8, dy:-42, color:'#FFFFFF', size: 2 },
  { animName: 'spk8', dx: -8, dy:-42, color:'#FFEE88', size: 2 },
];

/* ─────────────────────────────────────────────────
   Component
───────────────────────────────────────────────── */
export function SwordClashAnimation() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    /* Clash point in SVG: (100, 52)  →  tip of left sword = (100, 45+7=52 approx) */
    style.textContent = `
      /* ── Sword movements ── */
      @keyframes pxSwordL {
        0%        { transform: translate(-68px, 66px); opacity:0 }
        6%        { opacity:1 }
        36%, 72%  { transform: translate(0,0);         opacity:1 }
        40%       { transform: translate(7px,-5px);    opacity:1 }
        44%       { transform: translate(-2px,2px);    opacity:1 }
        90%       { transform: translate(0,0);         opacity:1 }
        100%      { transform: translate(-68px,66px);  opacity:0 }
      }
      @keyframes pxSwordR {
        0%        { transform: translate(68px, 66px);  opacity:0 }
        6%        { opacity:1 }
        36%, 72%  { transform: translate(0,0);         opacity:1 }
        40%       { transform: translate(-7px,-5px);   opacity:1 }
        44%       { transform: translate(2px,2px);     opacity:1 }
        90%       { transform: translate(0,0);         opacity:1 }
        100%      { transform: translate(68px,66px);   opacity:0 }
      }

      /* ── Impact flash ── */
      @keyframes pxFlash {
        0%,33%   { opacity:0; transform:scale(0.1) }
        38%      { opacity:1; transform:scale(1.5) }
        43%      { opacity:0.5; transform:scale(1) }
        45%      { opacity:1; transform:scale(1.8) }
        52%      { opacity:0; transform:scale(2.8) }
        100%     { opacity:0; transform:scale(0.1) }
      }
      @keyframes pxRing {
        0%,34%   { opacity:0; transform:scale(0.2) }
        39%      { opacity:0.7; transform:scale(1) }
        54%      { opacity:0; transform:scale(3) }
        100%     { opacity:0 }
      }

      /* ── Sparks ── */
      ${SPARKS.map(s => `
        @keyframes ${s.animName} {
          0%,36%  { opacity:0; transform:translate(0,0) scale(1) }
          40%     { opacity:1; transform:translate(0,0) scale(1) }
          65%     { opacity:0; transform:translate(${s.dx}px,${s.dy}px) scale(0.3) }
          100%    { opacity:0; transform:translate(${s.dx}px,${s.dy}px) scale(0) }
        }
      `).join('')}

      /* ── Pixel shimmer on blades ── */
      @keyframes pxBlade {
        0%,100% { opacity:1 }
        38%,48% { opacity:0.55 }
        42%     { opacity:1 }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const DUR = '4s';
  const TF  = 'ease-in-out';

  /* Clash point (SVG units) */
  const CX = 100, CY = 52;

  return (
    <div style={{ width: 200, height: 110, margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox="0 0 200 110"
        width={200}
        height={110}
        style={{ overflow: 'visible', imageRendering: 'pixelated' }}
      >
        {/* ═════════════════════════════
            LEFT SWORD
            transformOrigin = clash point
        ═════════════════════════════ */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: `pxSwordL ${DUR} ${TF} infinite`,
            willChange: 'transform',
          }}
        >
          <g style={{ animation: `pxBlade ${DUR} ${TF} infinite` }}>
            <SwordPixels />
          </g>
        </g>

        {/* ═════════════════════════════
            RIGHT SWORD
            Mirror horizontally about x=100
            using inner SVG translate(200,0) scale(-1,1)
        ═════════════════════════════ */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: `pxSwordR ${DUR} ${TF} infinite`,
            willChange: 'transform',
          }}
        >
          <g transform="translate(200,0) scale(-1,1)">
            <g style={{ animation: `pxBlade ${DUR} ${TF} infinite` }}>
              <SwordPixels />
            </g>
          </g>
        </g>

        {/* ═════════════════════════════
            IMPACT — outer ring (pixel-ish: square instead of circle)
        ═════════════════════════════ */}
        <rect
          x={CX - 10} y={CY - 10}
          width={20} height={20}
          fill="none"
          stroke="#FFD700"
          strokeWidth={2}
          shapeRendering="crispEdges"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: `pxRing ${DUR} ease-out infinite`,
          }}
        />

        {/* ═════════════════════════════
            IMPACT — central flash (pixel square)
        ═════════════════════════════ */}
        <rect
          x={CX - 6} y={CY - 6}
          width={12} height={12}
          fill="#FFEE55"
          shapeRendering="crispEdges"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: `pxFlash ${DUR} ease-out infinite`,
          }}
        />
        {/* Bright core */}
        <rect
          x={CX - 3} y={CY - 3}
          width={6} height={6}
          fill="#FFFFFF"
          shapeRendering="crispEdges"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            animation: `pxFlash ${DUR} ease-out infinite`,
          }}
        />

        {/* ═════════════════════════════
            SPARKS (pixel squares)
        ═════════════════════════════ */}
        {SPARKS.map((s, i) => (
          <rect
            key={i}
            x={CX - s.size / 2}
            y={CY - s.size / 2}
            width={s.size}
            height={s.size}
            fill={s.color}
            shapeRendering="crispEdges"
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              animation: `${s.animName} ${DUR} ease-out infinite`,
              filter: `drop-shadow(0 0 2px ${s.color})`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
