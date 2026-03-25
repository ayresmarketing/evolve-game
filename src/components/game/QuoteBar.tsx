import { useGame } from '@/contexts/GameContext';
import { Heart, RefreshCw, Quote } from 'lucide-react';

export function QuoteBar() {
  const { quotes, currentQuoteIndex, toggleQuoteFavorite, nextQuote } = useGame();
  const quote = quotes[currentQuoteIndex];
  if (!quote) return null;

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
      <Quote className="w-5 h-5 text-primary shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-foreground/90 italic truncate">"{quote.text}"</p>
        {quote.author && <p className="text-[11px] text-muted-foreground font-body mt-0.5">— {quote.author}</p>}
      </div>
      <button onClick={() => toggleQuoteFavorite(quote.id)} className="shrink-0 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
        <Heart className={`w-4 h-4 ${quote.favorited ? 'fill-game-red text-game-red' : 'text-muted-foreground'}`} />
      </button>
      <button onClick={nextQuote} className="shrink-0 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
