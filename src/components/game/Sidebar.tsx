import { useState } from 'react';
import { LayoutDashboard, Target, Calendar, Star, Heart, Menu, X, Flame, Zap, TrendingUp, ListChecks, Trophy, Sun, Moon } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';

export type Page = 'dashboard' | 'metas' | 'afazeres' | 'agenda' | 'vida' | 'missao' | 'progressao' | 'ranking';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export function Sidebar({ currentPage, onPageChange, darkMode, onToggleTheme }: SidebarProps) {
  const { stats } = useGame();
  const { level, name, icon } = getLevelFromXP(stats.xp);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'metas', label: 'Metas', icon: <Target className="w-5 h-5" /> },
    { id: 'afazeres', label: 'Afazeres', icon: <ListChecks className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-5 h-5" /> },
    { id: 'vida', label: 'Metas de Vida', icon: <Star className="w-5 h-5" /> },
    { id: 'missao', label: 'Missão Semanal', icon: <Heart className="w-5 h-5" /> },
    { id: 'progressao', label: 'Progressão', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-5 h-5" /> },
  ];

  const sidebarContent = (
    <>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-[11px] tracking-[0.2em] text-primary text-glow-cyan font-bold">LIFE QUEST</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { onPageChange(item.id); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-body font-semibold transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-primary text-primary-foreground shadow-glow-cyan'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="my-4 border-t border-border" />

        <div className="px-4 py-3 rounded-xl bg-secondary/40">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-game-fire" />
            <span className="text-sm font-body font-semibold text-foreground">{stats.streak} dias de Consistência</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-body mt-0.5">Melhor: {stats.longestStreak} dias</p>
        </div>

        {/* Theme toggle */}
        <button onClick={onToggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all mt-2">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-game-purple to-game-cyan flex items-center justify-center text-lg ring-2 ring-primary/30">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-semibold text-foreground truncate">Jogador</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-primary font-body font-semibold">Level {level}</span>
              <span className="text-[11px] text-muted-foreground font-body">· {name}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card border border-border shadow-game-card">
        {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside className="hidden lg:flex flex-col w-[220px] min-h-screen bg-gradient-sidebar border-r border-border shrink-0">
        {sidebarContent}
      </aside>

      <aside className={`lg:hidden fixed inset-y-0 left-0 z-40 w-[260px] bg-gradient-sidebar border-r border-border flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
