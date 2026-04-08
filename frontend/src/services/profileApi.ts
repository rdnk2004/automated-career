import { api } from './api';
import { UserProfile, ProfileSection, LinkedInImportResponse } from '../types/profile';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get('/api/profile');
    return res.data;
  },
  updateSection: async (section: any): Promise<ProfileSection> => {
    const res = await api.put('/api/profile', section);
    return res.data;
  },
  importProfile: async (file: File): Promise<LinkedInImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/profile/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
