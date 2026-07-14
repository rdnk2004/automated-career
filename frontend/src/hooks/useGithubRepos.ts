import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '@/services/githubApi';

export const useRepos = (healthFilter?: string) => {
  return useQuery({
    queryKey: ['repos', healthFilter],
    queryFn: () => githubApi.getRepos(healthFilter)
  });
};

export const useSyncRepos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: githubApi.syncRepos,
    onSuccess: () => {
      // In a real app, we might poll or wait, but here we just invalidate
      queryClient.invalidateQueries({ queryKey: ['repos'] });
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
