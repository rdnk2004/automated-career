import { api } from './api';
import { GithubRepo, RepoScan } from '../types/github';

export const githubApi = {
  getRepos: async (health?: string): Promise<GithubRepo[]> => {
    const params = health ? { health } : {};
    const res = await api.get('/api/github/repos', { params });
    return res.data;
  },
  syncRepos: async (): Promise<{ task_id: string, status: string }> => {
    const res = await api.post('/api/github/sync');
    return res.data;
  },
  scanRepo: async (repoFullName: string): Promise<RepoScan> => {
    const res = await api.post('/api/github/scan', { repo_full_name: repoFullName });
    return res.data;
  },
  scanAllRepos: async (): Promise<{ status: string, message: string }> => {
    const res = await api.post('/api/github/scan/all');
    return res.data;
  },
  scanBatchRepos: async (repoFullNames: string[]): Promise<{ status: string, message: string }> => {
    const res = await api.post('/api/github/scan/batch', { repo_full_names: repoFullNames });
    return res.data;
  }
};
