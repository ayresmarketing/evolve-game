import { useState } from 'react';
import {
  LayoutDashboard, Target, ListChecks, Calendar, Heart, TrendingUp,
  DollarSign, Droplets, StickyNote, Swords, Sun, Moon, LogOut,
  Zap, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLevelFromXP } from '@/types/game';
import { GlitchWord } from '@/components/game/GlitchWord';

export type Page =
  | 'dashboard' | 'metas' | 'afazeres' | 'agenda'
  | 'missao' | 'progressao' | 'financeiro' | 'hidratacao'
  | 'anotacoes' | 'duelo';

export interface BottomNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export type SidebarProps = BottomNavProps;

const navGroups: { group: string; items: { id: Page; label: string; icon: React.ElementType }[] }[] = [
  {
    group: 'PRINCIPAL',
    items: [
      { id: 'dashboard',  label: 'Início',    icon: LayoutDashboard },
      { id: 'metas',      label: 'Metas',     icon: Target },
      { id: 'afazeres',   label: 'Afazeres',  icon: ListChecks },
      { id: 'agenda',     label: 'Agenda',    icon: Calendar },
    ],
  },
  {
    group: 'FERRAMENTAS',
    items: [
      { id: 'anotacoes',  label: 'Notas',     icon: StickyNote },
      { id: 'financeiro', label: 'Finanças',  icon: DollarSign },
      { id: 'hidratacao', label: 'Hidratação',icon: Droplets },
    ],
  },
  {
    group: 'EVOLUÇÃO',
    items: [
      { id: 'progressao', label: 'Progresso', icon: TrendingUp },
      { id: 'missao',     label: 'Missão',    icon: Heart },
      { id: 'duelo',      label: 'Duelo',     icon: Swords },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

/* ═══════════════════════════════════════════════════
   DESKTOP SIDEBAR
═══════════════════════════════════════════════════ */
export function DesktopSidebar({
  currentPage, onPageChange, darkMode, onToggleTheme,
  sidebarCollapsed = false, onToggleSidebar,
}: BottomNavProps) {
  const { stats } = useGame();
  const { signOut } = useAuth();
  const { level, name, icon } = getLevelFromXP(stats.xp);
  const xpProgress = Math.min(((stats.xp % 1000) / 1000) * 100, 100);
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-50 transition-all duration-300
        border-r border-border/50 bg-gradient-sidebar
        ${collapsed ? 'w-[64px]' : 'w-64'}`}
    >
      {/* ── Brand ── */}
      <div className={`flex items-center gap-3 px-3 py-5 border-b border-border/40 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-game-cyan flex items-center justify-center shadow-glow-primary animate-glow-pulse flex-shrink-0">
          <Zap className="w-[18px] h-[18px] text-black" strokeWidth={3} />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-display text-[9px] tracking-[0.28em] gradient-text uppercase font-bold leading-tight">SUA VIDA</p>
            <p className="font-display text-[8px] tracking-[0.22em] text-muted-foreground uppercase leading-tight">
              É UM{' '}
              <GlitchWord
                word="JOGO"
                className="gradient-text"
                buildDelay={400}
              />
            </p>
          </div>
        )}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft  className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* ── Level card ── */}
      {!collapsed ? (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-primary/8 border border-primary/14">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-game-cyan/15 flex items-center justify-center text-base flex-shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-[9px] font-display tracking-[0.24em] text-muted-foreground uppercase">Nível {level}</p>
              <p className="text-xs font-body font-semibold text-foreground leading-tight">{name}</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-secondary/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-game-cyan shadow-glow-primary transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[9px] text-muted-foreground font-body">{stats.xp.toLocaleString()} XP</span>
            <span className="text-[9px] text-muted-foreground font-body">{Math.round(xpProgress)}%</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-base">
            {icon}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {navGroups.map(({ group, items }) => (
          <div key={group}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[8px] font-display tracking-[0.35em] text-muted-foreground/50 uppercase">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group
                      ${collapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-primary/10 text-primary border border-primary/18'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      className={`w-[17px] h-[17px] flex-shrink-0 transition-all
                        ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}
                    />
                    {!collapsed && (
                      <>
                        <span className={`flex-1 text-sm font-body font-semibold tracking-wide text-left
                          ${isActive ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom actions ── */}
      <div className={`px-2 py-3 border-t border-border/40 space-y-0.5`}>
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground
            hover:text-foreground hover:bg-secondary/50 transition-all
            ${collapsed ? 'justify-center' : ''}`}
        >
          {darkMode
            ? <Sun  className="w-[17px] h-[17px] flex-shrink-0" />
            : <Moon className="w-[17px] h-[17px] flex-shrink-0" />
          }
          {!collapsed && (
            <span className="text-sm font-body font-semibold">
              {darkMode ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          )}
        </button>
        <button
          onClick={async () => await signOut()}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-destructive/55 hover:text-destructive hover:bg-destructive/8 transition-all
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          {!collapsed && <span className="text-sm font-body font-semibold">Sair</span>}
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════
   MOBILE BOTTOM NAV
═══════════════════════════════════════════════════ */
export function BottomNav({ currentPage, onPageChange, darkMode, onToggleTheme }: BottomNavProps) {
  const { signOut } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const visibleItems = allNavItems.slice(0, 5);
  const moreItems    = allNavItems.slice(5);

  const close = () => setShowMore(false);

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={close} />
      )}

      {showMore && (
        <div className="fixed bottom-[72px] left-3 right-3 z-50 rounded-2xl border border-border/70
          bg-card/96 backdrop-blur-xl shadow-[0_-8px_40px_hsl(224_60%_2%/0.65)] p-3.5
          animate-slide-up">
          <div className="grid grid-cols-5 gap-1">
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onPageChange(item.id); close(); }}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all
                    ${isActive
                      ? 'bg-primary/10 text-primary border border-primary/18'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-body font-semibold leading-tight">{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => { onToggleTheme(); close(); }}
              className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl
                text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-[10px] font-body font-semibold leading-tight">
                {darkMode ? 'Claro' : 'Escuro'}
              </span>
            </button>

            <button
              onClick={async () => { close(); await signOut(); }}
              className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl
                text-destructive/65 hover:text-destructive hover:bg-destructive/8 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-body font-semibold leading-tight">Sair</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden
        bg-card/95 backdrop-blur-xl border-t border-border/50
        shadow-[0_-4px_30px_hsl(224_60%_2%/0.5)]">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-[768px] mx-auto">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onPageChange(item.id); close(); }}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-xl transition-all min-w-[52px]
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all
                  ${isActive ? 'bg-primary/12 shadow-glow-primary' : ''}`}>
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[9px] font-display tracking-wide leading-tight
                  ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-xl transition-all min-w-[52px]
              ${showMore || moreItems.some(i => i.id === currentPage)
                ? 'text-primary'
                : 'text-muted-foreground'
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-all
              ${showMore || moreItems.some(i => i.id === currentPage) ? 'bg-primary/12' : ''}`}>
              <div className="flex gap-[3px] py-[5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </div>
            <span className="text-[9px] font-display tracking-wide leading-tight">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export { BottomNav as Sidebar };
