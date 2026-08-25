import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '@/services/githubApi';

export const useRepos = (healthFilter?: string) => {
  return useQuery({
    queryKey: ['repos', healthFilter],
    queryFn: () => githubApi.getRepos(healthFilter)
  });
};

export const useLatestRepo = () => {
  return useQuery({
    queryKey: ['latestRepo'],
    queryFn: () => githubApi.getLatestRepo()
  });
};

export const useSyncRepos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: githubApi.syncRepos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
      queryClient.invalidateQueries({ queryKey: ['latestRepo'] });
    }
  });
};

export const useEvaluateRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { repoFullName: string; targetRole?: string }) =>
      githubApi.evaluateRepo(payload.repoFullName, payload.targetRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
      queryClient.invalidateQueries({ queryKey: ['latestRepo'] });
    }
  });
};

export const useScanRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoFullName: string) => githubApi.scanRepo(repoFullName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    }
  });
};

export const useScanAllRepos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: githubApi.scanAllRepos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    }
  });
};

export const useScanBatchRepos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoFullNames: string[]) => githubApi.scanBatchRepos(repoFullNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    }
  });
};

export const useGenerateReadme = () => {
  return useMutation({
    mutationFn: (payload: { repoFullName: string; style?: string } | string) => {
      const repoFullName = typeof payload === 'string' ? payload : payload.repoFullName;
      const style = typeof payload === 'string' ? 'recruiter' : (payload.style || 'recruiter');
      return githubApi.generateReadme(repoFullName, style);
    }
  });
};

export const usePushReadme = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { repoFullName: string; content: string }) => githubApi.pushReadme(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    }
  });
};
