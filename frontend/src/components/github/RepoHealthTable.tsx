import { GithubRepo } from '@/types/github';
import { RepoHealthBadge } from './RepoHealthBadge';

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
    return <div className="p-8 text-center text-muted-foreground">No repositories found. Try syncing.</div>;
  }

  const allSelected = repos.length > 0 && repos.every(repo => selectedRepoFullNames.has(repo.full_name));

  return (
    <div className="border rounded-md">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelectAll();
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 font-medium">Repository</th>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">Stars</th>
            <th className="px-4 py-3 font-medium">Last Pushed</th>
            <th className="px-4 py-3 font-medium">README</th>
            <th className="px-4 py-3 font-medium">Health</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {repos.map(repo => {
            const isSelected = selectedRepoFullNames.has(repo.full_name);
            return (
              <tr 
                key={repo.id} 
                onClick={() => onSelectRepo(repo)}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedRepoId === repo.id ? 'bg-muted' : ''}`}
              >
                <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onToggleSelect(repo.full_name)}
                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{repo.name}</td>
                <td className="px-4 py-3">{repo.language || '-'}</td>
                <td className="px-4 py-3">{repo.stars}</td>
                <td className="px-4 py-3 text-xs">{repo.last_pushed_at ? new Date(repo.last_pushed_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  {repo.has_readme ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}
                </td>
                <td className="px-4 py-3">
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
