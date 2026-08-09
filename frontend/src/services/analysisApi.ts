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
  },
  exportResumePdf: async (payload: {
    name?: string;
    target_role: string;
    contact?: Record<string, string>;
    summary?: string;
    experience?: Array<{ title?: string; company?: string; dates?: string; bullets?: string[] }>;
    skills?: string[];
    education?: Array<{ degree?: string; school?: string; dates?: string }>;
    certifications?: string[];
  }): Promise<void> => {
    const res = await api.post('/api/analysis/resume/export-pdf', payload, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `${payload.name || 'Candidate'}_ATS_Resume.pdf`.replace(/\s+/g, '_');
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
