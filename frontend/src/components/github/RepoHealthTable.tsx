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
  ShieldAlert,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'stars' | 'health' | 'pushed' | 'language';
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
  selectedRepoFullNames: Set<string>;
  onToggleSelect: (fullName: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection?: () => void;
  onBatchScan?: (fullNames: string[]) => void;
  isBatchScanning?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<'all' | 'needs_readme' | 'has_secrets' | 'healthy'>('all');
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

      // Health status filter
      if (healthFilter === 'needs_readme' && repo.has_readme) return false;
      if (healthFilter === 'has_secrets') {
        const hasSecrets =
          repo.latest_scan?.has_env_file ||
          (repo.latest_scan?.leaked_secrets && repo.latest_scan.leaked_secrets.length > 0);
        if (!hasSecrets) return false;
      }
      if (healthFilter === 'healthy') {
        const score = repo.latest_scan?.health_score;
        if (!score || score < 80) return false;
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
      } else if (sortKey === 'health') {
        const aScore = a.latest_scan?.health_score ?? -1;
        const bScore = b.latest_scan?.health_score ?? -1;
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
  }, [repos, search, healthFilter, languageFilter, sortKey, sortOrder]);

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

  const allVisibleSelected =
    filteredAndSortedRepos.length > 0 &&
    filteredAndSortedRepos.every((r) => selectedRepoFullNames.has(r.full_name));
  const someVisibleSelected =
    filteredAndSortedRepos.some((r) => selectedRepoFullNames.has(r.full_name)) && !allVisibleSelected;

  if (!repos || repos.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground glass-card rounded-3xl border border-dashed border-border/40 space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-glow">
          <FolderGit2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold font-heading text-foreground text-base">No Repositories Synced</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Click "Sync from GitHub" to fetch all public and private repositories from your GitHub account.
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

        {/* Health status filter pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-border/40 text-[11px]">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'needs_readme', label: 'Missing README' },
              { key: 'has_secrets', label: 'Secrets Risk' },
              { key: 'healthy', label: 'Healthy (80+)' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setHealthFilter(item.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
                healthFilter === item.key
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
                    <span>Language</span>
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
                    <span>Stars</span>
                    {sortKey === 'stars' ? (
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
                    <span>Last Pushed</span>
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
                  onClick={() => handleSort('health')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Health Score</span>
                    {sortKey === 'health' ? (
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
              {filteredAndSortedRepos.map((repo) => {
                const isSelected = selectedRepoFullNames.has(repo.full_name);
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
                          <span className="font-bold text-foreground truncate block max-w-[170px] group-hover:text-indigo-300 transition-colors">
                            {repo.name}
                          </span>
                          {repo.description && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-[200px]">
                              {repo.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className={cn('w-2 h-2 rounded-full', getLanguageColor(repo.language))} />
                        <span>{repo.language || 'Plain Text'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                        <span>{repo.stars}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-muted-foreground font-mono">
                      {repo.last_pushed_at ? new Date(repo.last_pushed_at).toLocaleDateString() : '-'}
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
                      <RepoHealthBadge score={repo.latest_scan?.health_score} />
                    </td>

                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://github.com/${repo.full_name}`}
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
      {selectedRepoFullNames.size > 0 && onBatchScan && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/40 shadow-2xl backdrop-blur-xl animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-foreground">
              {selectedRepoFullNames.size} {selectedRepoFullNames.size === 1 ? 'repository' : 'repositories'} selected
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
              onClick={() => onBatchScan(Array.from(selectedRepoFullNames))}
              className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 gap-1.5 rounded-xl"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Batch Scan Security ({selectedRepoFullNames.size})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
