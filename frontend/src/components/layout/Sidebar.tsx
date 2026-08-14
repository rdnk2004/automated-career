import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Linkedin, Github, FileText, Settings, Compass, Sparkles } from 'lucide-react';
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

  return (
    <aside className="w-64 border-r border-border/40 bg-card/80 backdrop-blur-xl flex flex-col justify-between shadow-2xl relative z-20">
      <div>
        {/* Logo Header */}
        <div className="p-6 flex items-center gap-3 border-b border-border/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Compass className="h-5.5 w-5.5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-heading gradient-text">
              Career OS
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Personal AI Layer
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
            Navigation
          </div>
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-glow"></span>
                )}
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
                      active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-indigo-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"
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

      {/* System Status Footer */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-secondary/40 to-secondary/10 border border-border/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Gemini 2.5 Pro
          </span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
            Active
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Self-hosted AI engine orchestrating LinkedIn, GitHub & Indeed.
        </p>
      </div>
    </aside>
  );
}
