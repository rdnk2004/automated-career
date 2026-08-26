import { useMemo } from 'react';
import { useRepos, useSyncRepos, useEvaluateRepo, useScanBatchRepos } from '@/hooks/useGithubRepos';
import { useGithubStore } from '@/stores/githubStore';
import { toast } from '@/hooks/useToast';
import { RepoHealthTable } from '@/components/github/RepoHealthTable';
import { LatestRepoSpotlight } from '@/components/github/LatestRepoSpotlight';
import { ProjectIntelligencePanel } from '@/components/github/ProjectIntelligencePanel';
import { ReadmeGenerator } from '@/components/github/ReadmeGenerator';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GithubRepo } from '@/types/github';
import {
  Github as GithubIcon,
  RefreshCw,
  FolderGit2,
  FileText,
  Star,
  GitFork,
  AlertCircle,
  HardDrive,
  Scale,
  ExternalLink,
  GitBranch,
  Trophy,
  Sparkles,
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
  const { mutate: evaluateRepo, isPending: isEvaluating } = useEvaluateRepo();
  const { mutate: scanBatchRepos, isPending: isScanningBatch } = useScanBatchRepos();

  // Find the single most recently committed repository
  const latestCommittedRepo = useMemo(() => {
    if (!repos || repos.length === 0) return null;
    const sorted = [...repos].sort((a, b) => {
      const aDate = a.last_pushed_at ? new Date(a.last_pushed_at).getTime() : 0;
      const bDate = b.last_pushed_at ? new Date(b.last_pushed_at).getTime() : 0;
      return bDate - aDate;
    });
    return sorted[0];
  }, [repos]);

  const selectedRepo = repos?.find((r) => r.id === selectedRepoId) || null;

  const handleSync = () => {
    toast.info('Syncing GitHub Repositories...', 'Fetching public and collaborated repositories');
    syncRepos(undefined, {
      onSuccess: () => toast.success('GitHub Sync Complete!', 'Public and collaborated repositories updated'),
      onError: (err: any) => toast.error('Sync Failed', err?.message),
    });
  };

  const handleEvaluateRepo = (targetRepo: GithubRepo) => {
    setSelectedRepo(targetRepo.id, targetRepo.full_name);
    toast.ai('Analyzing Codebase Architecture...', `Evaluating resume impact for ${targetRepo.full_name}`);
    evaluateRepo(
      { repoFullName: targetRepo.full_name },
      {
        onSuccess: (data: any) => {
          toast.success(
            'Project Evaluation Complete!',
            `${data.portfolio_tier || 'Tier 1'} • Resume Impact: ${data.resume_score || 85}%`
          );
        },
        onError: (err: any) => toast.error('Evaluation Failed', err?.message),
      }
    );
  };

  const handleOpenReadme = (targetRepo: GithubRepo) => {
    setSelectedRepo(targetRepo.id, targetRepo.full_name);
    setStudioTab('readme');
  };

  const handleBatchEvaluate = (fullNames: string[]) => {
    toast.ai('Batch Evaluating Repositories...', `Inspecting code & architecture across ${fullNames.length} repos`);
    scanBatchRepos(fullNames, {
      onSuccess: () => {
        clearSelectedRepos();
        toast.success('Batch Portfolio Evaluation Finished!');
      },
      onError: (err: any) => toast.error('Batch Evaluation Failed', err?.message),
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

  const formatSize = (sizeKb?: number) => {
    if (!sizeKb || sizeKb === 0) return null;
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    }
    return `${sizeKb} KB`;
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
                Portfolio & Project Intelligence
              </h2>
              <p className="text-xs text-muted-foreground">
                Evaluate repository codebase depth, generate quantified resume bullets & author AI READMEs
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

          {/* Spotlight on Latest Committed Repo */}
          {!isLoading && latestCommittedRepo && (
            <LatestRepoSpotlight
              repo={latestCommittedRepo}
              onSelect={handleSelectRepo}
              onOpenReadme={handleOpenReadme}
              onEvaluate={handleEvaluateRepo}
              isSelected={selectedRepoId === latestCommittedRepo.id}
            />
          )}

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
              onBatchScan={handleBatchEvaluate}
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
                    {selectedRepo.is_private ? (
                      <Badge variant="outline" className="text-[10px] bg-slate-800 text-muted-foreground border-border/40 font-mono">
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-mono">
                        Public
                      </Badge>
                    )}
                  </h2>
                  <a
                    href={selectedRepo.html_url || `https://github.com/${selectedRepo.full_name}`}
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
                    onClick={() => handleEvaluateRepo(selectedRepo)}
                    disabled={isEvaluating}
                    className="text-xs rounded-xl h-9 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 gap-1.5 font-semibold"
                  >
                    <Trophy className={`h-3.5 w-3.5 text-amber-300 ${isEvaluating ? 'animate-spin' : ''}`} />
                    {isEvaluating ? 'Inspecting Code...' : 'Evaluate Resume Impact'}
                  </Button>
                </div>
              </div>

              {selectedRepo.description && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/30">
                  {selectedRepo.description}
                </p>
              )}

              {/* Repo Quick Stats Grid */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1 border-t border-border/20">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                  <span>{selectedRepo.stars || 0} stars</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{selectedRepo.forks_count ?? 0} forks</span>
                </div>
                {selectedRepo.open_issues_count ? (
                  <div className="flex items-center gap-1 text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{selectedRepo.open_issues_count} issues</span>
                  </div>
                ) : null}
                {formatSize(selectedRepo.size_kb) && (
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{formatSize(selectedRepo.size_kb)}</span>
                  </div>
                )}
                {selectedRepo.license_name && (
                  <div className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-purple-400" />
                    <span>{selectedRepo.license_name}</span>
                  </div>
                )}
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
                onClick={() => setStudioTab('overview')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all select-none',
                  studioTab === 'overview' || studioTab === 'security'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-300" />
                Resume Intelligence
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
            {(studioTab === 'overview' || studioTab === 'security') && (
              <ProjectIntelligencePanel
                scan={selectedRepo.latest_scan}
                repoFullName={selectedRepo.full_name}
                onEvaluate={() => handleEvaluateRepo(selectedRepo)}
                isEvaluating={isEvaluating}
              />
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
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="space-y-1 text-center">
              <h4 className="font-bold font-heading text-foreground text-sm">Select a Repository</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Click any repository in the portfolio list to evaluate resume-worthiness, extract quantified bullet points, and generate an elite README.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
