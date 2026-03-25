import { useState } from 'react';
import { Gamepad2, LayoutDashboard, Target, Calendar, Star, Heart, Settings, Menu, X, Swords, Moon } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getLevelFromXP } from '@/types/game';

type Page = 'dashboard' | 'metas' | 'agenda' | 'vida' | 'missao';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { stats } = useGame();
  const { level, name } = getLevelFromXP(stats.xp);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'metas', label: 'Metas', icon: <Target className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-5 h-5" /> },
    { id: 'vida', label: 'Metas de Vida', icon: <Star className="w-5 h-5" /> },
    { id: 'missao', label: 'Missão Semanal', icon: <Heart className="w-5 h-5" /> },
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-gold">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-sm tracking-widest text-game-gold text-glow-gold">LIFE QUEST</h1>
            <p className="text-[10px] text-muted-foreground font-body">RPG da Vida Real</p>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-game-purple to-game-blue flex items-center justify-center text-lg font-display text-foreground shadow-lg">
            {level}
          </div>
          <div>
            <p className="font-display text-xs tracking-wider text-foreground">{name}</p>
            <p className="text-xs text-game-gold font-body">{stats.xp} XP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { onPageChange(item.id); setMobileOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-semibold transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-primary/15 text-game-gold shadow-inner border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Streak */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Swords className="w-4 h-4 text-game-fire" />
            <span className="font-display text-xs tracking-wider text-game-fire">{stats.streak} STREAK</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-body">Melhor: {stats.longestStreak} dias</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-game-card"
      >
        {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-card border-r border-border shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-40 w-[280px] bg-card border-r border-border flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
