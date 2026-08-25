import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { useRefreshCareerScore } from '@/hooks/useAnalysis';
import { toast } from '@/hooks/useToast';
import {
  LayoutDashboard,
  Linkedin,
  Github,
  FileText,
  Settings,
  Target,
  Sparkles,
  Command,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const location = useLocation();
  const { targetRole } = useSettingsStore();
  const { mutate: refreshScore, isPending: isAuditing } = useRefreshCareerScore();

  const getPageInfo = (path: string) => {
    switch (path) {
      case '/':
        return { title: 'Executive Career Dashboard', icon: LayoutDashboard, subtitle: 'Real-time readiness & weekly priority actions' };
      case '/linkedin':
        return { title: 'LinkedIn Optimization Studio', icon: Linkedin, subtitle: 'AI section scoring, keyword gaps & bullet point rewrites' };
      case '/github':
        return { title: 'GitHub Portfolio Inspector', icon: Github, subtitle: 'Repository security audits, secret detection & README studio' };
      case '/resume':
        return { title: 'Resume Market Matcher', icon: FileText, subtitle: 'Live JD scraping, keyword matrix & ATS-ready PDF generation' };
      case '/settings':
        return { title: 'System Settings & Keys', icon: Settings, subtitle: 'API integrations, target roles & n8n scheduled workflows' };
      default:
        return { title: 'Career OS', icon: LayoutDashboard, subtitle: 'Personal AI career assistant' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);
  const PageIcon = pageInfo.icon;

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const handleQuickAudit = () => {
    toast.ai('Synthesizing Career Readiness...', `Evaluating signals for ${targetRole}`);
    refreshScore(targetRole, {
      onSuccess: () => toast.success('Career Score Snapshot updated!'),
      onError: (err: any) => toast.error('Audit failed', err?.message || 'Check Gemini configuration'),
    });
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/70 backdrop-blur-2xl flex items-center justify-between px-6 z-10 shadow-sm select-none">
      {/* Left: Page Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-secondary/50 border border-border/40 text-indigo-400">
          <PageIcon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
            {pageInfo.title}
          </h2>
          <p className="hidden md:block text-[11px] text-muted-foreground">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Command search, Target badge, Audit Trigger, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={openPalette}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-secondary/30 border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-indigo-500/30 transition-all shadow-sm"
        >
          <Command className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[11px] font-medium">Quick Find...</span>
          <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-slate-900 text-muted-foreground border border-border/40">
            ⌘K
          </kbd>
        </button>

        {/* Target Role Chip */}
        <Badge
          variant="outline"
          onClick={openPalette}
          className="cursor-pointer hover:border-indigo-500/40 transition-all inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs font-semibold py-1 px-2.5"
        >
          <Target className="h-3 w-3 text-indigo-400" />
          <span className="hidden sm:inline font-normal text-muted-foreground">Target:</span>
          {targetRole || 'AI Engineer'}
        </Badge>

        {/* Quick Run Audit Button */}
        <Button
          size="sm"
          onClick={handleQuickAudit}
          disabled={isAuditing}
          className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-8 px-3 text-xs font-semibold gap-1.5 shadow-md shadow-indigo-600/25"
        >
          {isAuditing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {isAuditing ? 'Auditing...' : 'Audit'}
        </Button>

        {/* User Capsule */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border/40">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs text-white shadow-md ring-2 ring-indigo-500/25 font-heading">
              RD
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
          </div>
          <div className="hidden lg:block text-xs text-left">
            <div className="font-bold text-foreground leading-tight font-heading">RDNK</div>
            <div className="text-[10px] text-muted-foreground font-mono">Self-Hosted User</div>
          </div>
        </div>
      </div>
    </header>
  );
}
