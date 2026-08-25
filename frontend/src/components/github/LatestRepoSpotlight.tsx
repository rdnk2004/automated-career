import { GithubRepo } from '@/types/github';
import { RepoHealthBadge } from './RepoHealthBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderGit2,
  ExternalLink,
  Star,
  GitFork,
  AlertCircle,
  HardDrive,
  GitBranch,
  Scale,
  Sparkles,
  FileText,
  Clock,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function LatestRepoSpotlight({
  repo,
  onSelect,
  onOpenReadme,
  onEvaluate,
  isSelected,
}: {
  repo: GithubRepo | null;
  onSelect: (repo: GithubRepo) => void;
  onOpenReadme: (repo: GithubRepo) => void;
  onEvaluate: (repo: GithubRepo) => void;
  isSelected?: boolean;
}) {
  if (!repo) return null;

  // Format relative or friendly date
  const formatPushedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently active';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Active just now';
      if (diffHours < 24) return `Pushed ${diffHours}h ago`;
      if (diffDays === 1) return 'Pushed yesterday';
      if (diffDays < 7) return `Pushed ${diffDays}d ago`;
      return `Pushed on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return 'Active';
    }
  };

  const formatSize = (sizeKb?: number) => {
    if (!sizeKb || sizeKb === 0) return '< 1 MB';
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    }
    return `${sizeKb} KB`;
  };

  const getLanguageColor = (lang?: string) => {
    switch (lang?.toLowerCase()) {
      case 'python':
        return 'bg-sky-400';
      case 'typescript':
        return 'bg-blue-500';
      case 'javascript':
        return 'bg-amber-400';
      case 'html':
        return 'bg-orange-500';
      case 'css':
        return 'bg-purple-400';
      case 'go':
        return 'bg-cyan-400';
      case 'rust':
        return 'bg-red-400';
      case 'c++':
      case 'cpp':
        return 'bg-pink-400';
      default:
        return 'bg-indigo-400';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl border shadow-xl',
        isSelected
          ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900/80 to-purple-950/60 border-indigo-500/50 ring-1 ring-indigo-500/30'
          : 'bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-indigo-950/40 border-border/50 hover:border-indigo-500/30'
      )}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-4">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
              <span>Latest Active Repo</span>
            </div>

            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{formatPushedDate(repo.last_pushed_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {repo.is_private ? (
              <Badge variant="outline" className="text-[10px] bg-slate-800 text-muted-foreground border-border/40 font-mono">
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-mono">
                Public
              </Badge>
            )}

            <RepoHealthBadge
              score={repo.latest_scan?.resume_score ?? repo.latest_scan?.health_score}
              tier={repo.latest_scan?.portfolio_tier}
            />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              onClick={() => onSelect(repo)}
              className="text-xl font-black font-heading tracking-tight text-foreground hover:text-indigo-300 cursor-pointer transition-colors flex items-center gap-2"
            >
              <FolderGit2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>{repo.name}</span>
            </h3>

            <a
              href={repo.html_url || `https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-muted-foreground hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <span>{repo.full_name}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {repo.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {repo.description}
            </p>
          )}
        </div>

        {/* Rich Stats Grid Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 font-mono text-xs">
          {/* Language */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', getLanguageColor(repo.language))} />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase font-sans">Language</div>
              <div className="font-bold text-foreground truncate">{repo.language || 'Plain Text'}</div>
            </div>
          </div>

          {/* Stars */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-sans">Stars</div>
              <div className="font-bold text-foreground">{repo.stars || 0}</div>
            </div>
          </div>

          {/* Forks */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <GitFork className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-sans">Forks</div>
              <div className="font-bold text-foreground">{repo.forks_count ?? 0}</div>
            </div>
          </div>

          {/* Open Issues */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-sans">Issues</div>
              <div className="font-bold text-foreground">{repo.open_issues_count ?? 0}</div>
            </div>
          </div>

          {/* Repo Size */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-sans">Size</div>
              <div className="font-bold text-foreground">{formatSize(repo.size_kb)}</div>
            </div>
          </div>

          {/* License / Branch */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-border/30 flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase font-sans">License</div>
              <div className="font-bold text-foreground truncate">{repo.license_name || 'MIT'}</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
            <span>Branch: <strong className="text-foreground font-semibold">{repo.default_branch || 'main'}</strong></span>
            <span className="text-border/60">•</span>
            <span>README: <strong className={repo.has_readme ? 'text-emerald-400' : 'text-rose-400'}>{repo.has_readme ? 'Present' : 'Missing'}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEvaluate(repo)}
              className="h-8 text-xs rounded-xl border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Evaluate Resume Impact
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenReadme(repo)}
              className="h-8 text-xs rounded-xl border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              AI README Studio
            </Button>

            <Button
              size="sm"
              onClick={() => onSelect(repo)}
              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 rounded-xl"
            >
              Inspect Codebase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
