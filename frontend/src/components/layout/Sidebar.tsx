import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  LayoutDashboard,
  Linkedin,
  Github,
  FileText,
  Settings,
  Compass,
  Sparkles,
  Command,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', badge: null },
  { icon: Linkedin, label: 'LinkedIn', href: '/linkedin', badge: 'AI' },
  { icon: Github, label: 'GitHub', href: '/github', badge: null },
  { icon: FileText, label: 'Resume', href: '/resume', badge: 'ATS' },
  { icon: Settings, label: 'Settings', href: '/settings', badge: null },
];

export function Sidebar() {
  const location = useLocation();
  const { targetRole } = useSettingsStore();

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <aside className="w-64 border-r border-border/40 bg-card/85 backdrop-blur-2xl flex flex-col justify-between shadow-2xl relative z-20 select-none">
      <div>
        {/* Logo Header */}
        <div className="p-6 flex items-center justify-between border-b border-border/30">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
              <Compass className="h-5.5 w-5.5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight font-heading gradient-text">
                Career OS
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                v1.0 • Personal AI
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Command Palette Button */}
        <div className="px-4 pt-4">
          <button
            onClick={openPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/40 border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 hover:border-indigo-500/30 transition-all duration-200 group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Command className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Search / Commands</span>
            </div>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-muted-foreground border border-border/40">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
            Workspace
          </div>
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative',
                  active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-indigo-600/25 font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-white rounded-r-full shadow-glow"></span>
                )}
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      'h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                      active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-indigo-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Target Role & Engine Status Footer */}
      <div className="p-4 space-y-3">
        {/* Active Target Role Capsule */}
        <div 
          onClick={openPalette}
          className="p-3 rounded-2xl bg-secondary/30 border border-border/40 hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-indigo-400" />
              Target Role
            </span>
            <span className="text-[10px] text-indigo-400 group-hover:underline">Edit</span>
          </div>
          <p className="text-xs font-bold text-foreground truncate font-heading">
            {targetRole || 'AI Engineer'}
          </p>
        </div>

        {/* Gemini Engine Telemetry */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-secondary/40 to-secondary/15 border border-border/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Gemini 2.5 Pro
            </span>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 font-mono">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Continuous synthesis across LinkedIn, GitHub & live market JDs.
          </p>
        </div>
      </div>
    </aside>
  );
}
