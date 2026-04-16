import { useState, useEffect, useRef } from 'react';

const NOISE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&█▓▒░';

interface GlitchWordProps {
  word: string;
  className?: string;
  style?: React.CSSProperties;
  /** delay em ms antes de começar o build inicial (default 200) */
  buildDelay?: number;
}

/**
 * Renderiza uma palavra com efeito de pixel de TV se construindo:
 * - Cada letra aparece ciclando por caracteres aleatórios antes de fixar no correto
 * - Periodicamente, uma letra aleatória "glitcha" brevemente
 */
export function GlitchWord({ word, className, style, buildDelay = 200 }: GlitchWordProps) {
  const [letters, setLetters] = useState<string[]>(() => word.split('').map(() => ' '));
  const [glitching, setGlitching] = useState<Set<number>>(() => new Set());
  const periodicRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Build phase: constrói cada letra com ruído ── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    word.split('').forEach((targetChar, idx) => {
      const startAt = buildDelay + idx * 90;

      timers.push(
        setTimeout(() => {
          let tick = 0;
          const totalTicks = 7 + Math.floor(Math.random() * 4);

          const iv = setInterval(() => {
            tick++;
            if (tick >= totalTicks) {
              clearInterval(iv);
              setLetters(prev => {
                const next = [...prev];
                next[idx] = targetChar;
                return next;
              });
              setGlitching(prev => { const s = new Set(prev); s.delete(idx); return s; });
            } else {
              setGlitching(prev => new Set([...prev, idx]));
              setLetters(prev => {
                const next = [...prev];
                next[idx] = NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
                return next;
              });
            }
          }, 55);

          timers.push(iv as unknown as ReturnType<typeof setTimeout>);
        }, startAt)
      );
    });

    return () => timers.forEach(t => clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Periodic glitch: re-glitcha letra(s) aleatória(s) ── */
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 1800;
      periodicRef.current = setTimeout(() => {
        const numLetters = Math.random() < 0.35 ? 2 : 1;
        const indices = Array.from({ length: numLetters }, () =>
          Math.floor(Math.random() * word.length)
        );

        indices.forEach(idx => {
          let tick = 0;
          const ticks = 5 + Math.floor(Math.random() * 3);
          const iv = setInterval(() => {
            tick++;
            if (tick >= ticks) {
              clearInterval(iv);
              setLetters(prev => {
                const next = [...prev];
                next[idx] = word[idx];
                return next;
              });
              setGlitching(prev => { const s = new Set(prev); s.delete(idx); return s; });
            } else {
              setGlitching(prev => new Set([...prev, idx]));
              setLetters(prev => {
                const next = [...prev];
                next[idx] = NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)];
                return next;
              });
            }
          }, 60);
        });

        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => { if (periodicRef.current) clearTimeout(periodicRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={className} style={style}>
      {letters.map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transition: glitching.has(i) ? 'none' : 'color 0.08s',
            textShadow: glitching.has(i)
              ? '0 0 8px currentColor, 0 0 16px currentColor'
              : 'none',
            opacity: char === ' ' ? 0 : 1,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
