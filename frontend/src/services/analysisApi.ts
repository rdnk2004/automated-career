import { api } from './api';
import { CareerScore, SuggestionSet, ResumeSuggestion } from '../types/analysis';

export const analysisApi = {
  synthesize: async (targetRole: string): Promise<CareerScore> => {
    const res = await api.post('/api/analysis/synthesis', { target_role: targetRole });
    return res.data;
  },
  analyzeLinkedIn: async (targetRole: string): Promise<SuggestionSet> => {
    const res = await api.post('/api/analysis/linkedin', { target_role: targetRole });
    return res.data;
  },
  analyzeResume: async (resumeText: string, targetRole: string): Promise<ResumeSuggestion> => {
    const res = await api.post('/api/analysis/resume', { resume_text: resumeText, target_role: targetRole });
    return res.data;
  }
};
