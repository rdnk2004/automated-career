import { useRepos, useSyncRepos, useScanRepo, useScanBatchRepos } from '@/hooks/useGithubRepos';
import { useGithubStore } from '@/stores/githubStore';
import { toast } from '@/hooks/useToast';
import { RepoHealthTable } from '@/components/github/RepoHealthTable';
import { SecurityScanPanel } from '@/components/github/SecurityScanPanel';
import { ReadmeGenerator } from '@/components/github/ReadmeGenerator';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GithubRepo } from '@/types/github';
import {
  Github as GithubIcon,
  RefreshCw,
  ShieldAlert,
  FolderGit2,
  Lock,
  FileText,
  Star,
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GitHub() {
  const {
    selectedRepoId,
    setSelectedRepo,
    selectedRepoFullNames,
    toggleSelectRepo,
    selectAllRepos,
    clearSelectedRepos,
    studioTab,
    setStudioTab,
  } = useGithubStore();

  const { data: repos, isLoading } = useRepos();
  const { mutate: syncRepos, isPending: isSyncing } = useSyncRepos();
  const { mutate: scanRepo, isPending: isScanning } = useScanRepo();
  const { mutate: scanBatchRepos, isPending: isScanningBatch } = useScanBatchRepos();

  const selectedRepo = repos?.find((r) => r.id === selectedRepoId) || null;

  const handleSync = () => {
    toast.info('Syncing GitHub Repositories...', 'Fetching public and private repositories');
    syncRepos(undefined, {
      onSuccess: () => toast.success('GitHub Sync Complete!'),
      onError: (err: any) => toast.error('Sync Failed', err?.message),
    });
  };

  const handleScanCurrent = () => {
    if (!selectedRepo) return;
    toast.ai('Scanning Repository Security...', `Inspecting ${selectedRepo.full_name}`);
    scanRepo(selectedRepo.full_name, {
      onSuccess: () => toast.success('Security Scan Complete!'),
      onError: (err: any) => toast.error('Scan Failed', err?.message),
    });
  };

  const handleBatchScan = (fullNames: string[]) => {
    toast.ai('Batch Scanning Repositories...', `Running security audit on ${fullNames.length} repos`);
    scanBatchRepos(fullNames, {
      onSuccess: () => {
        clearSelectedRepos();
        toast.success('Batch Security Scan Finished!');
      },
      onError: (err: any) => toast.error('Batch Scan Failed', err?.message),
    });
  };

  const handleSelectRepo = (repo: GithubRepo) => {
    setSelectedRepo(repo.id, repo.full_name);
  };

  const allRepoNames = (repos || []).map((r) => r.full_name);
  const handleToggleSelectAll = () => {
    const allSelected = allRepoNames.length > 0 && allRepoNames.every((n) => selectedRepoFullNames.includes(n));
    if (allSelected) {
      clearSelectedRepos();
    } else {
      selectAllRepos(allRepoNames);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden animate-fade-in">
      {/* Left Column: Repository Portfolio Table */}
      <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto border-r border-border/40 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold font-heading tracking-tight text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
                  <GithubIcon className="h-5 w-5" />
                </div>
                GitHub Portfolio
              </h2>
              <p className="text-xs text-muted-foreground">
                Inspect repository security, hardcoded secrets & missing README files
              </p>
            </div>

            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl h-9 text-xs font-semibold gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync GitHub'}
            </Button>
          </div>

          {/* Table or Skeleton Loading */}
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <RepoHealthTable
              repos={repos || []}
              onSelectRepo={handleSelectRepo}
              selectedRepoId={selectedRepoId}
              selectedRepoFullNames={selectedRepoFullNames}
              onToggleSelect={toggleSelectRepo}
              onToggleSelectAll={handleToggleSelectAll}
              onClearSelection={clearSelectedRepos}
              onBatchScan={handleBatchScan}
              isBatchScanning={isScanningBatch}
            />
          )}
        </div>
      </div>

      {/* Right Column: Repository Inspector Studio */}
      <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto bg-card/40 backdrop-blur-xl space-y-6">
        {selectedRepo ? (
          <div className="space-y-6 animate-fade-in">
            {/* Repo Inspector Top Banner */}
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/40 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                    <FolderGit2 className="h-5 w-5 text-indigo-400" />
                    <span>{selectedRepo.name}</span>
                    {selectedRepo.is_private && (
                      <Badge variant="outline" className="text-[10px] bg-slate-800 text-muted-foreground border-border/40 font-mono">
                        Private
                      </Badge>
                    )}
                  </h2>
                  <a
                    href={`https://github.com/${selectedRepo.full_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-muted-foreground hover:text-indigo-300 transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <span>{selectedRepo.full_name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleScanCurrent}
                    disabled={isScanning}
                    variant="outline"
                    className="text-xs rounded-xl h-9 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                  >
                    <ShieldAlert className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    {isScanning ? 'Scanning...' : 'Scan Security'}
                  </Button>
                </div>
              </div>

              {selectedRepo.description && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/30">
                  {selectedRepo.description}
                </p>
              )}

              {/* Repo Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                  <span>{selectedRepo.stars} stars</span>
                </div>
                {selectedRepo.language && (
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{selectedRepo.language}</span>
                  </div>
                )}
                {selectedRepo.last_pushed_at && (
                  <div>
                    Last pushed: {new Date(selectedRepo.last_pushed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-2xl border border-border/40 text-xs">
              <button
                onClick={() => setStudioTab('security')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all select-none',
                  studioTab === 'security' || studioTab === 'overview'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Lock className="h-3.5 w-3.5" />
                Security Audit
              </button>

              <button
                onClick={() => setStudioTab('readme')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all select-none',
                  studioTab === 'readme'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                AI README Studio
              </button>
            </div>

            {/* Tab Views */}
            {(studioTab === 'security' || studioTab === 'overview') && (
              <SecurityScanPanel scan={selectedRepo.latest_scan} />
            )}

            {studioTab === 'readme' && (
              <ReadmeGenerator
                repoFullName={selectedRepo.full_name}
                hasReadme={selectedRepo.has_readme}
                existingReadmeContent={selectedRepo.readme_content || ''}
              />
            )}
          </div>
        ) : (
          /* Empty Placeholder */
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 p-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-glow">
              <GithubIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1 text-center">
              <h4 className="font-bold font-heading text-foreground text-sm">Select a Repository</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Click any repository in the portfolio list to run security audits, review leaked secrets, or generate a professional README.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
