import { api } from './api';
import {
  TargetedResume,
  TargetedResumeCreate,
  TargetedResumeUpdate,
  ResumeDestroyerAudit,
} from '../types/resume';

export const resumeApi = {
  listResumes: async (targetRole?: string): Promise<TargetedResume[]> => {
    const params = targetRole ? { target_role: targetRole } : {};
    const res = await api.get('/api/resumes', { params });
    return res.data;
  },

  getResume: async (id: string): Promise<TargetedResume> => {
    const res = await api.get(`/api/resumes/${id}`);
    return res.data;
  },

  createResume: async (payload: TargetedResumeCreate): Promise<TargetedResume> => {
    const res = await api.post('/api/resumes', payload);
    return res.data;
  },

  updateResume: async (id: string, payload: TargetedResumeUpdate): Promise<TargetedResume> => {
    const res = await api.put(`/api/resumes/${id}`, payload);
    return res.data;
  },

  deleteResume: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const res = await api.delete(`/api/resumes/${id}`);
    return res.data;
  },

  setPrimaryResume: async (id: string): Promise<TargetedResume> => {
    const res = await api.post(`/api/resumes/${id}/set-primary`);
    return res.data;
  },

  analyzeWithDestroyer: async (id: string): Promise<ResumeDestroyerAudit> => {
    const res = await api.post(`/api/resumes/${id}/destroyer`);
    return res.data;
  },

  uploadResume: async (formData: FormData): Promise<TargetedResume> => {
    const res = await api.post('/api/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
