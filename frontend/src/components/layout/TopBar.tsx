
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TopBar() {
  const location = useLocation();
  const { targetRole } = useSettingsStore();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Career Dashboard';
      case '/linkedin': return 'LinkedIn Optimization Studio';
      case '/github': return 'GitHub Portfolio Inspector';
      case '/resume': return 'Resume Market Matcher';
      case '/settings': return 'System Settings & Keys';
      default: return 'Career OS';
    }
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center justify-between px-8 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="font-heading font-semibold text-lg text-foreground tracking-tight">
          {getPageTitle(location.pathname)}
        </h2>
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-medium py-0.5">
          <ShieldCheck className="h-3 w-3" />
          Target: {targetRole || 'AI Engineer'}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2 bg-secondary/40 px-3 py-1.5 rounded-full border border-border/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Synced: Just now</span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-border/40">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md ring-2 ring-indigo-500/20">
            RD
          </div>
          <div className="hidden md:block text-xs text-left">
            <div className="font-semibold text-foreground leading-tight">RDNK</div>
            <div className="text-[10px] text-muted-foreground">Self-Hosted User</div>
          </div>
        </div>
      </div>
    </header>
  );
}
