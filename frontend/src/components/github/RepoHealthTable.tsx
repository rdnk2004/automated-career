import { useState, useMemo } from 'react';
import { GithubRepo } from '@/types/github';
import { RepoHealthBadge } from './RepoHealthBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  CheckCircle,
  XCircle,
  FileCode,
  FolderGit2,
  ExternalLink,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  GitFork,
  AlertCircle,
  HardDrive,
  Scale,
  Clock,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'stars' | 'forks' | 'resume_score' | 'pushed' | 'language';
type SortOrder = 'asc' | 'desc';

export function RepoHealthTable({
  repos = [],
  onSelectRepo,
  selectedRepoId,
  selectedRepoFullNames,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onBatchScan,
  isBatchScanning = false,
}: {
  repos: GithubRepo[];
  onSelectRepo: (repo: GithubRepo) => void;
  selectedRepoId: string | null;
  selectedRepoFullNames: string[] | Set<string>;
  onToggleSelect: (fullName: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection?: () => void;
  onBatchScan?: (fullNames: string[]) => void;
  isBatchScanning?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'tier2' | 'needs_readme'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('pushed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Collect available unique languages
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repos]);

  // Format relative or friendly date
  const formatPushedDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  };

  const formatSize = (sizeKb?: number) => {
    if (!sizeKb || sizeKb === 0) return '';
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(1)}M`;
    }
    return `${sizeKb}K`;
  };

  // Filter and Sort Repositories
  const filteredAndSortedRepos = useMemo(() => {
    let result = repos.filter((repo) => {
      // Search filter
      const matchesSearch =
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      // Language filter
      if (languageFilter !== 'all' && repo.language !== languageFilter) return false;

      // Tier & Readme filter
      if (tierFilter === 'needs_readme' && repo.has_readme) return false;
      if (tierFilter === 'tier1') {
        const tier = repo.latest_scan?.portfolio_tier;
        const score = repo.latest_scan?.resume_score ?? repo.latest_scan?.health_score;
        if (!tier?.toLowerCase().includes('tier 1') && (!score || score < 85)) return false;
      }
      if (tierFilter === 'tier2') {
        const tier = repo.latest_scan?.portfolio_tier;
        const score = repo.latest_scan?.resume_score ?? repo.latest_scan?.health_score;
        if (!tier?.toLowerCase().includes('tier 2') && (!score || score < 65 || score >= 85)) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortKey === 'stars') {
        comparison = (a.stars || 0) - (b.stars || 0);
      } else if (sortKey === 'forks') {
        comparison = (a.forks_count || 0) - (b.forks_count || 0);
      } else if (sortKey === 'resume_score') {
        const aScore = a.latest_scan?.resume_score ?? a.latest_scan?.health_score ?? -1;
        const bScore = b.latest_scan?.resume_score ?? b.latest_scan?.health_score ?? -1;
        comparison = aScore - bScore;
      } else if (sortKey === 'pushed') {
        const aDate = a.last_pushed_at ? new Date(a.last_pushed_at).getTime() : 0;
        const bDate = b.last_pushed_at ? new Date(b.last_pushed_at).getTime() : 0;
        comparison = aDate - bDate;
      } else if (sortKey === 'language') {
        comparison = (a.language || '').localeCompare(b.language || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [repos, search, tierFilter, languageFilter, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
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
        return 'bg-slate-400';
    }
  };

  const isRepoSelected = (fullName: string) =>
    Array.isArray(selectedRepoFullNames)
      ? selectedRepoFullNames.includes(fullName)
      : selectedRepoFullNames.has(fullName);

  const selectedCount = Array.isArray(selectedRepoFullNames)
    ? selectedRepoFullNames.length
    : selectedRepoFullNames.size;

  const selectedList = Array.isArray(selectedRepoFullNames)
    ? selectedRepoFullNames
    : Array.from(selectedRepoFullNames);

  const allVisibleSelected =
    filteredAndSortedRepos.length > 0 &&
    filteredAndSortedRepos.every((r) => isRepoSelected(r.full_name));
  const someVisibleSelected =
    filteredAndSortedRepos.some((r) => isRepoSelected(r.full_name)) && !allVisibleSelected;

  if (!repos || repos.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground glass-card rounded-3xl border border-dashed border-border/40 space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-glow">
          <FolderGit2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold font-heading text-foreground text-base">No Repositories Synced</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Click "Sync GitHub" to fetch all public and private repositories from your GitHub account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 relative">
      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter repos by name or keyword..."
            className="h-8 text-xs bg-slate-950/80 max-w-xs"
            icon={<Search className="h-3.5 w-3.5" />}
          />

          {/* Language filter select */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-border/50 bg-slate-950/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Languages</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Tier & Health status filter pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-border/40 text-[11px]">
          {(
            [
              { key: 'all', label: 'All Repos' },
              { key: 'tier1', label: '⭐ Tier 1 Flagship' },
              { key: 'tier2', label: '✨ Tier 2 Supporting' },
              { key: 'needs_readme', label: 'Missing README' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTierFilter(item.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
                tierFilter === item.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/50 border-b border-border/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={onToggleSelectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title={allVisibleSelected ? 'Deselect All' : 'Select All'}
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                    ) : someVisibleSelected ? (
                      <MinusSquare className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>

                <th
                  className="px-4 py-3 font-semibold text-foreground cursor-pointer select-none hover:text-indigo-300 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Repository</span>
                    {sortKey === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-indigo-300 transition-colors"
                  onClick={() => handleSort('language')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stack & Architecture</span>
                    {sortKey === 'language' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-indigo-300 transition-colors"
                  onClick={() => handleSort('stars')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Stats</span>
                    {sortKey === 'stars' || sortKey === 'forks' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-indigo-300 transition-colors"
                  onClick={() => handleSort('pushed')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Committed</span>
                    {sortKey === 'pushed' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 font-semibold">README</th>

                <th
                  className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-indigo-300 transition-colors"
                  onClick={() => handleSort('resume_score')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Resume Impact</span>
                    {sortKey === 'resume_score' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/30">
              {filteredAndSortedRepos.map((repo, idx) => {
                const isSelected = isRepoSelected(repo.full_name);
                const isCurrentActive = selectedRepoId === repo.id;

                return (
                  <tr
                    key={repo.id}
                    onClick={() => onSelectRepo(repo)}
                    className={cn(
                      'cursor-pointer transition-all duration-150 group',
                      isCurrentActive
                        ? 'bg-indigo-500/15 font-medium'
                        : isSelected
                        ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                        : 'hover:bg-secondary/50'
                    )}
                  >
                    <td className="px-4 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSelect(repo.full_name)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate max-w-[170px] group-hover:text-indigo-300 transition-colors">
                              {repo.name}
                            </span>
                            {idx === 0 && sortKey === 'pushed' && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                                Latest
                              </span>
                            )}
                            {repo.is_private && (
                              <span className="text-[9px] px-1 rounded bg-slate-800 text-muted-foreground border border-border/40 font-mono">
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-[200px]">
                              {repo.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className={cn('w-2 h-2 rounded-full', getLanguageColor(repo.language))} />
                          <span>{repo.language || 'Plain Text'}</span>
                        </div>
                        {repo.license_name && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                            <Scale className="h-2.5 w-2.5 text-purple-400" />
                            <span className="truncate max-w-[100px]">{repo.license_name}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex items-center gap-1" title="Stars">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                          <span>{repo.stars || 0}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Forks">
                          <GitFork className="h-3 w-3 text-indigo-400" />
                          <span>{repo.forks_count ?? 0}</span>
                        </div>
                        {repo.size_kb ? (
                          <div className="flex items-center gap-1 text-cyan-400" title="Repo Size">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatSize(repo.size_kb)}</span>
                          </div>
                        ) : null}
                        {repo.open_issues_count ? (
                          <div className="flex items-center gap-1 text-rose-400" title="Open Issues">
                            <AlertCircle className="h-3 w-3" />
                            <span>{repo.open_issues_count}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        <span>{formatPushedDate(repo.last_pushed_at)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {repo.has_readme ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] flex items-center gap-1 px-2 py-0.5 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          <span>Present</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/20 text-[10px] flex items-center gap-1 px-2 py-0.5 w-fit">
                          <XCircle className="h-3 w-3" />
                          <span>Missing</span>
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <RepoHealthBadge
                        score={repo.latest_scan?.resume_score ?? repo.latest_scan?.health_score}
                        tier={repo.latest_scan?.portfolio_tier}
                      />
                    </td>

                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={repo.html_url || `https://github.com/${repo.full_name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                          title="Open repo on GitHub"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedRepos.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-xs">
            No repositories match the active search or filters.
          </div>
        )}
      </div>

      {/* Floating Bottom Batch Action Bar */}
      {selectedCount > 0 && onBatchScan && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 shadow-2xl backdrop-blur-xl animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-foreground">
              {selectedCount} {selectedCount === 1 ? 'repository' : 'repositories'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Deselect All
              </Button>
            )}

            <Button
              size="sm"
              isLoading={isBatchScanning}
              onClick={() => onBatchScan(selectedList)}
              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 gap-1.5 rounded-xl"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Batch Evaluate Portfolio Impact ({selectedCount})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
