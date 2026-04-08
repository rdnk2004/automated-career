import { api } from './api';
import { JobListing, JDKeyword } from '../types/jobs';

export const jobsApi = {
  searchJobs: async (title: string, limit: number = 30): Promise<JobListing[]> => {
    const res = await api.get('/api/jobs/search', { params: { title, limit } });
    return res.data;
  },
  getKeywords: async (title: string): Promise<JDKeyword[]> => {
    const res = await api.get('/api/jobs/keywords', { params: { title } });
    return res.data;
  }
};
