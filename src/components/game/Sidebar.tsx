import { useState } from 'react';
import { LayoutDashboard, Target, ListChecks, Calendar, Heart, TrendingUp, Trophy, DollarSign, Droplets, StickyNote, Swords, Sun, Moon } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';

export type Page = 'dashboard' | 'metas' | 'afazeres' | 'agenda' | 'missao' | 'progressao' | 'ranking' | 'financeiro' | 'hidratacao' | 'anotacoes' | 'duelo';

interface BottomNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'afazeres', label: 'Afazeres', icon: ListChecks },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'anotacoes', label: 'Notas', icon: StickyNote },
  { id: 'financeiro', label: 'Finanças', icon: DollarSign },
  { id: 'hidratacao', label: 'Água', icon: Droplets },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'progressao', label: 'Progresso', icon: TrendingUp },
  { id: 'missao', label: 'Missão', icon: Heart },
];

export function BottomNav({ currentPage, onPageChange, darkMode, onToggleTheme }: BottomNavProps) {
  const { stats } = useGame();
  const { level, name, icon } = getLevelFromXP(stats.xp);
  const [showMore, setShowMore] = useState(false);

  // Show first 5 in bottom bar, rest in "more" tray
  const visibleItems = navItems.slice(0, 5);
  const moreItems = navItems.slice(5);

  return (
    <>
      {/* More tray overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowMore(false)} />
      )}

      {/* More tray */}
      {showMore && (
        <div className="fixed bottom-[72px] left-3 right-3 z-50 bg-card border border-border rounded-2xl shadow-game-card p-3 animate-slide-up">
          <div className="grid grid-cols-5 gap-1">
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onPageChange(item.id); setShowMore(false); }}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-body font-semibold leading-tight">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={onToggleTheme}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-muted-foreground hover:text-foreground transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-[10px] font-body font-semibold leading-tight">{darkMode ? 'Claro' : 'Escuro'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_hsl(220_30%_50%/0.06)]">
        <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onPageChange(item.id); setShowMore(false); }}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px] ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/12 shadow-glow-cyan' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[10px] font-body font-semibold leading-tight ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px] ${
              showMore || moreItems.some(i => i.id === currentPage)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${showMore || moreItems.some(i => i.id === currentPage) ? 'bg-primary/12' : ''}`}>
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </div>
            <span className="text-[10px] font-body font-semibold leading-tight">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// Keep backward compat export
export { BottomNav as Sidebar };
export type { BottomNavProps as SidebarProps };
