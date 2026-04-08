import { useState } from 'react';
import { useRepos, useSyncRepos, useScanRepo } from '@/hooks/useGithubRepos';
import { RepoHealthTable } from '@/components/github/RepoHealthTable';
import { SecurityScanPanel } from '@/components/github/SecurityScanPanel';
import { ReadmeGenerator } from '@/components/github/ReadmeGenerator';
import { Button } from '@/components/ui/button';
import { GithubRepo } from '@/types/github';

export default function GitHub() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  
  const { data: repos, isLoading } = useRepos(filter !== 'all' ? filter : undefined);
  const { mutate: syncRepos, isPending: isSyncing } = useSyncRepos();
  const { mutate: scanRepo, isPending: isScanning } = useScanRepo();

  const handleScan = () => {
    if (selectedRepo) {
      scanRepo(selectedRepo.full_name);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-1/2 p-6 overflow-y-auto border-r flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">GitHub Repositories</h2>
          <Button onClick={() => syncRepos()} disabled={isSyncing} variant="outline">
            {isSyncing ? 'Syncing...' : 'Sync from GitHub'}
          </Button>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button variant={filter === 'all' ? 'default' : 'secondary'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'needs_readme' ? 'default' : 'secondary'} size="sm" onClick={() => setFilter('needs_readme')}>Needs README</Button>
          <Button variant={filter === 'has_secrets' ? 'default' : 'secondary'} size="sm" onClick={() => setFilter('has_secrets')}>Security Issues</Button>
        </div>

        {isLoading ? (
          <div>Loading repositories...</div>
        ) : (
          <RepoHealthTable 
            repos={repos || []} 
            onSelectRepo={setSelectedRepo} 
            selectedRepoId={selectedRepo?.id || null} 
          />
        )}
      </div>
      
      <div className="w-1/2 p-6 overflow-y-auto bg-muted/10">
        {selectedRepo ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedRepo.name}</h2>
                <p className="text-muted-foreground">{selectedRepo.full_name}</p>
              </div>
              <Button onClick={handleScan} disabled={isScanning} variant="secondary">
                {isScanning ? 'Scanning...' : 'Run Security Scan'}
              </Button>
            </div>
            
            {selectedRepo.description && (
              <p className="text-sm">{selectedRepo.description}</p>
            )}

            <SecurityScanPanel scan={selectedRepo.latest_scan} />
            <ReadmeGenerator repoFullName={selectedRepo.full_name} hasReadme={selectedRepo.has_readme} />
            
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a repository to view details, scan for secrets, or generate a README.
          </div>
        )}
      </div>
    </div>
  );
}
