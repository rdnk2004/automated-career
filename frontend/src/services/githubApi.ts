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
  syncRepos: async (): Promise<{ task_id: string; status: string; result?: any }> => {
    const res = await api.post('/api/github/sync');
    const taskId = res.data?.task_id;
    if (!taskId) return res.data;

    const startTime = Date.now();
    while (Date.now() - startTime < 30000) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const taskRes = await api.get(`/api/github/tasks/${taskId}`);
        if (taskRes.data.status === 'completed') {
          return { task_id: taskId, status: 'completed', result: taskRes.data.result };
        }
        if (taskRes.data.status === 'failed') {
          throw new Error(taskRes.data.error || 'Sync task failed');
        }
      } catch (err: any) {
        if (err?.message?.includes('Sync task failed')) throw err;
      }
    }
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
  scanAllRepos: async (): Promise<{ status: string; message: string }> => {
    const res = await api.post('/api/github/scan/all');
    return res.data;
  },
  scanBatchRepos: async (repoFullNames: string[]): Promise<{ task_id?: string; status: string; message: string }> => {
    const res = await api.post('/api/github/scan/batch', { repo_full_names: repoFullNames });
    const taskId = res.data?.task_id;
    if (!taskId) return res.data;

    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const taskRes = await api.get(`/api/github/tasks/${taskId}`);
        if (taskRes.data.status === 'completed') {
          return { task_id: taskId, status: 'completed', message: 'Batch evaluation completed' };
        }
        if (taskRes.data.status === 'failed') {
          throw new Error(taskRes.data.error || 'Batch scan failed');
        }
      } catch (err: any) {
        if (err?.message?.includes('Batch scan failed')) throw err;
      }
    }
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
