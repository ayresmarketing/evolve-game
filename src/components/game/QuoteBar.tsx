import { useGame } from '@/contexts/GameContext';
import { Heart, RefreshCw, Quote } from 'lucide-react';

export function QuoteBar() {
  const { quotes, currentQuoteIndex, toggleQuoteFavorite, nextQuote } = useGame();
  const quote = quotes[currentQuoteIndex];
  if (!quote) return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3 animate-fade-in relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)/0.08), hsl(var(--card)))',
        border: '1px solid hsl(var(--primary)/0.14)',
      }}
    >
      {/* Subtle glow in corner */}
      <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-primary/8 blur-2xl pointer-events-none" />

      <div className="relative z-10 w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Quote className="w-3.5 h-3.5 text-primary" />
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <p className="text-sm font-body text-foreground/90 italic leading-relaxed">
          "{quote.text}"
        </p>
        {quote.author && (
          <p className="text-[11px] text-muted-foreground font-body mt-1.5">
            — {quote.author}
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => toggleQuoteFavorite(quote.id)}
          className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <Heart className={`w-4 h-4 ${quote.favorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </button>
        <button
          onClick={nextQuote}
          className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}
