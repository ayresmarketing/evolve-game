import { useGame } from '@/contexts/GameContext';
import { Heart, RefreshCw, Quote } from 'lucide-react';

export function QuoteBar() {
  const { quotes, currentQuoteIndex, toggleQuoteFavorite, nextQuote } = useGame();
  const quote = quotes[currentQuoteIndex];
  if (!quote) return null;

  return (
    <div className="section-card flex items-start gap-3 animate-fade-in">
      <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-foreground/90 italic leading-relaxed">"{quote.text}"</p>
        {quote.author && <p className="text-[11px] text-muted-foreground font-body mt-1">— {quote.author}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => toggleQuoteFavorite(quote.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Heart className={`w-4 h-4 ${quote.favorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </button>
        <button onClick={nextQuote} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
