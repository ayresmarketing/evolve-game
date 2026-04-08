import { useState } from 'react';
import { LayoutDashboard, Target, ListChecks, Calendar, Heart, TrendingUp, DollarSign, Droplets, StickyNote, Swords, Sun, Moon, LogOut } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelFromXP } from '@/types/game';

export type Page = 'dashboard' | 'metas' | 'afazeres' | 'agenda' | 'missao' | 'progressao' | 'financeiro' | 'hidratacao' | 'anotacoes' | 'duelo';

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
  { id: 'progressao', label: 'Progresso', icon: TrendingUp },
  { id: 'missao', label: 'Missão', icon: Heart },
  { id: 'duelo', label: 'Duelo', icon: Swords },
];

export function BottomNav({ currentPage, onPageChange, darkMode, onToggleTheme }: BottomNavProps) {
  const { stats } = useGame();
  const { signOut } = useAuth();
  const { level, name, icon } = getLevelFromXP(stats.xp);
  const [showMore, setShowMore] = useState(false);

  const visibleItems = navItems.slice(0, 5);
  const moreItems = navItems.slice(5);

  const close = () => setShowMore(false);

  return (
    <>
      {/* Backdrop — sem backdrop-blur para não causar reflow */}
      {showMore && (
        <div
          className="fixed inset-0 z-40"
          onClick={close}
        />
      )}

      {/* More menu — ancorado ao bottom da tela sem transform que cause salto */}
      {showMore && (
        <div className="fixed bottom-[68px] left-3 right-3 z-50 bg-card border border-border rounded-2xl shadow-game-card p-3">
          <div className="grid grid-cols-5 gap-1">
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onPageChange(item.id); close(); }}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-body font-semibold leading-tight">{item.label}</span>
                </button>
              );
            })}

            {/* Tema claro/escuro */}
            <button
              onClick={() => { onToggleTheme(); close(); }}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-muted-foreground hover:text-foreground transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-[10px] font-body font-semibold leading-tight">{darkMode ? 'Claro' : 'Escuro'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={async () => { close(); await signOut(); }}
              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/8 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-body font-semibold leading-tight">Sair</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_hsl(220_30%_50%/0.06)]">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-[1100px] mx-auto">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onPageChange(item.id); close(); }}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/12 shadow-glow-cyan' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[10px] font-body font-semibold leading-tight ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMore(v => !v)}
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

export { BottomNav as Sidebar };
export type { BottomNavProps as SidebarProps };
