import { api } from './api';
import { GithubRepo, RepoScan } from '../types/github';

export const githubApi = {
  getRepos: async (health?: string): Promise<GithubRepo[]> => {
    const params = health ? { health } : {};
    const res = await api.get('/api/github/repos', { params });
    return res.data;
  },
  getLatestRepo: async (): Promise<GithubRepo | null> => {
    const res = await api.get('/api/github/latest');
    return res.data;
  },
  syncRepos: async (): Promise<{ task_id: string, status: string }> => {
    const res = await api.post('/api/github/sync');
    return res.data;
  },
  evaluateRepo: async (repoFullName: string, targetRole?: string): Promise<any> => {
    const res = await api.post('/api/github/evaluate', {
      repo_full_name: repoFullName,
      target_role: targetRole,
    });
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
  },
  generateReadme: async (repoFullName: string, style: string = 'recruiter'): Promise<{ readme_markdown: string; suggestion_id?: string }> => {
    const res = await api.post('/api/github/readme/generate', { repo_full_name: repoFullName, style });
    return res.data;
  },
  pushReadme: async (payload: { repoFullName: string; content: string }): Promise<{ committed: boolean; sha?: string }> => {
    const res = await api.post('/api/github/readme/push', { repo_full_name: payload.repoFullName, content: payload.content });
    return res.data;
  },
  remediateRepo: async (repoFullName: string, action: string): Promise<any> => {
    const res = await api.post('/api/github/remediate', { repo_full_name: repoFullName, action });
    return res.data;
  }
};
