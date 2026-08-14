import { GithubRepo } from '@/types/github';
import { RepoHealthBadge } from './RepoHealthBadge';
import { Star, CheckCircle, XCircle, FileCode, FolderGit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RepoHealthTable({ 
  repos, 
  onSelectRepo, 
  selectedRepoId,
  selectedRepoFullNames,
  onToggleSelect,
  onToggleSelectAll
}: { 
  repos: GithubRepo[], 
  onSelectRepo: (repo: GithubRepo) => void,
  selectedRepoId: string | null,
  selectedRepoFullNames: Set<string>,
  onToggleSelect: (fullName: string) => void,
  onToggleSelectAll: () => void
}) {
  if (!repos || repos.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground glass-card rounded-2xl border border-dashed space-y-3">
        <FolderGit2 className="h-10 w-10 text-indigo-400 mx-auto opacity-60" />
        <h4 className="font-semibold text-foreground">No Repositories Synced</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Click "Sync from GitHub" above to fetch your GitHub repositories and scan them for security & documentation gaps.
        </p>
      </div>
    );
  }

  const getLanguageColor = (lang?: string) => {
    switch (lang?.toLowerCase()) {
      case 'python': return 'bg-sky-400';
      case 'typescript': return 'bg-blue-500';
      case 'javascript': return 'bg-amber-400';
      case 'html': return 'bg-orange-500';
      case 'css': return 'bg-purple-400';
      case 'go': return 'bg-cyan-400';
      case 'rust': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  };

  const allSelected = repos.length > 0 && repos.every(repo => selectedRepoFullNames.has(repo.full_name));

  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-xl">
      <table className="w-full text-xs text-left">
        <thead className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-semibold">
          <tr>
            <th className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelectAll();
                }}
                className="rounded border-border/50 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-slate-900"
              />
            </th>
            <th className="px-4 py-3 font-semibold text-foreground">Repository</th>
            <th className="px-4 py-3 font-semibold">Language</th>
            <th className="px-4 py-3 font-semibold">Stars</th>
            <th className="px-4 py-3 font-semibold">Pushed</th>
            <th className="px-4 py-3 font-semibold">README</th>
            <th className="px-4 py-3 font-semibold">Health</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {repos.map(repo => {
            const isSelected = selectedRepoFullNames.has(repo.full_name);
            const isCurrentActive = selectedRepoId === repo.id;

            return (
              <tr 
                key={repo.id} 
                onClick={() => onSelectRepo(repo)}
                className={cn(
                  "cursor-pointer transition-all duration-150 hover:bg-secondary/50",
                  isCurrentActive ? "bg-indigo-500/10 font-medium" : ""
                )}
              >
                <td className="px-4 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onToggleSelect(repo.full_name)}
                    className="rounded border-border/50 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-slate-900"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{repo.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", getLanguageColor(repo.language))}></span>
                    <span>{repo.language || '-'}</span>
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
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                      <XCircle className="h-3.5 w-3.5" />
                      Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <RepoHealthBadge score={repo.latest_scan?.health_score} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
