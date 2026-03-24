import { useGame } from '@/contexts/GameContext';
import { Heart, RefreshCw } from 'lucide-react';

export function QuoteBar() {
  const { quotes, currentQuoteIndex, toggleQuoteFavorite, nextQuote } = useGame();
  const quote = quotes[currentQuoteIndex];
  if (!quote) return null;

  return (
    <div className="bg-gradient-card rounded-lg p-4 shadow-game-card border border-border flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-foreground italic truncate">"{quote.text}"</p>
        {quote.author && <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>}
      </div>
      <button onClick={() => toggleQuoteFavorite(quote.id)} className="shrink-0 p-1.5 rounded hover:bg-secondary transition-colors">
        <Heart className={`w-4 h-4 ${quote.favorited ? 'fill-game-red text-game-red' : 'text-muted-foreground'}`} />
      </button>
      <button onClick={nextQuote} className="shrink-0 p-1.5 rounded hover:bg-secondary transition-colors">
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
