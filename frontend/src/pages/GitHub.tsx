import { useState } from 'react';
import { useRepos, useSyncRepos, useScanRepo, useScanBatchRepos } from '@/hooks/useGithubRepos';
import { RepoHealthTable } from '@/components/github/RepoHealthTable';
import { SecurityScanPanel } from '@/components/github/SecurityScanPanel';
import { ReadmeGenerator } from '@/components/github/ReadmeGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GithubRepo } from '@/types/github';
import { Github as GithubIcon, RefreshCw, ShieldAlert, Search, FolderGit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GitHub() {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [selectedRepoFullNames, setSelectedRepoFullNames] = useState<Set<string>>(new Set());
  
  const { data: repos, isLoading } = useRepos(filter !== 'all' ? filter : undefined);
  const { mutate: syncRepos, isPending: isSyncing } = useSyncRepos();
  const { mutate: scanRepo, isPending: isScanning } = useScanRepo();
  const { mutate: scanBatchRepos, isPending: isScanningBatch } = useScanBatchRepos();

  const filteredRepos = repos?.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.language && r.language.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleScan = () => {
    if (selectedRepo) {
      scanRepo(selectedRepo.full_name);
    }
  };

  const handleToggleSelect = (fullName: string) => {
    setSelectedRepoFullNames(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (!repos) return;
    const allSelected = repos.length > 0 && repos.every(repo => selectedRepoFullNames.has(repo.full_name));
    if (allSelected) {
      setSelectedRepoFullNames(prev => {
        const next = new Set(prev);
        repos.forEach(repo => next.delete(repo.full_name));
        return next;
      });
    } else {
      setSelectedRepoFullNames(prev => {
        const next = new Set(prev);
        repos.forEach(repo => next.add(repo.full_name));
        return next;
      });
    }
  };

  const handleScanSelected = () => {
    if (selectedRepoFullNames.size > 0) {
      scanBatchRepos(Array.from(selectedRepoFullNames), {
        onSuccess: () => {
          setSelectedRepoFullNames(new Set());
        }
      });
    }
  };

  return (
    <div className="flex h-full overflow-hidden animate-fade-in">
      {/* Left Column: Repository List & Filters */}
      <div className="w-1/2 p-8 overflow-y-auto border-r border-border/40 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-heading tracking-tight text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <GithubIcon className="h-5 w-5" />
                </div>
                GitHub Portfolio
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspect repository security, hardcoded secrets & missing README files
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleScanSelected} 
                disabled={isScanningBatch || selectedRepoFullNames.size === 0} 
                variant="outline"
                className="text-xs rounded-xl h-9 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
              >
                {isScanningBatch ? 'Scanning...' : `Scan Selected (${selectedRepoFullNames.size})`}
              </Button>
              <Button 
                onClick={() => syncRepos()} 
                disabled={isSyncing} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl h-9 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync GitHub'}
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Filter repos or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-secondary/40 border-border/40"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-secondary/30 rounded-xl border border-border/40">
              <button 
                onClick={() => setFilter('all')}
                className={cn("px-3 py-1 text-xs font-semibold rounded-lg transition-all", filter === 'all' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('needs_readme')}
                className={cn("px-3 py-1 text-xs font-semibold rounded-lg transition-all", filter === 'needs_readme' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                No README
              </button>
              <button 
                onClick={() => setFilter('has_secrets')}
                className={cn("px-3 py-1 text-xs font-semibold rounded-lg transition-all", filter === 'has_secrets' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Security Issues
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-medium">Fetching GitHub Repositories...</p>
            </div>
          ) : (
            <RepoHealthTable 
              repos={filteredRepos} 
              onSelectRepo={setSelectedRepo} 
              selectedRepoId={selectedRepo?.id || null} 
              selectedRepoFullNames={selectedRepoFullNames}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          )}
        </div>
      </div>
      
      {/* Right Column: Repository Inspector Studio */}
      <div className="w-1/2 p-8 overflow-y-auto bg-card/40 backdrop-blur-xl space-y-6">
        {selectedRepo ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-border/40 pb-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                  <FolderGit2 className="h-5 w-5 text-indigo-400" />
                  {selectedRepo.name}
                </h2>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedRepo.full_name}</p>
              </div>
              <Button 
                onClick={handleScan} 
                disabled={isScanning} 
                variant="outline"
                className="text-xs rounded-xl h-9 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
              >
                <ShieldAlert className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Run Security Scan'}
              </Button>
            </div>
            
            {selectedRepo.description && (
              <p className="text-xs text-muted-foreground leading-relaxed p-3 bg-secondary/30 rounded-xl border border-border/30">
                {selectedRepo.description}
              </p>
            )}

            <SecurityScanPanel scan={selectedRepo.latest_scan} />
            <ReadmeGenerator repoFullName={selectedRepo.full_name} hasReadme={selectedRepo.has_readme} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-lg">
              <GithubIcon className="h-8 w-8" />
            </div>
            <h4 className="font-semibold text-foreground text-sm">Select a Repository</h4>
            <p className="text-xs text-muted-foreground max-w-xs text-center">
              Click any repository from the left panel to inspect security vulnerabilities, leaked secrets, or generate a professional README.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
