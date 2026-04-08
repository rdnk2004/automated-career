import { api } from './api';
import { GithubRepo, RepoScan, ReadmeGenerateResponse, ReadmePushResponse } from '../types/github';

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
  generateReadme: async (repoFullName: string): Promise<ReadmeGenerateResponse> => {
    const res = await api.post('/api/github/readme/generate', { repo_full_name: repoFullName });
    return res.data;
  },
  pushReadme: async (repoFullName: string, content: string): Promise<ReadmePushResponse> => {
    const res = await api.post('/api/github/readme/push', { repo_full_name: repoFullName, content });
    return res.data;
  }
};
