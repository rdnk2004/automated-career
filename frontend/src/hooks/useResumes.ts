import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '@/services/resumeApi';
import { TargetedResumeCreate, TargetedResumeUpdate } from '@/types/resume';

export const useResumes = (targetRole?: string) => {
  return useQuery({
    queryKey: ['targeted-resumes', targetRole],
    queryFn: () => resumeApi.listResumes(targetRole),
  });
};

export const useResume = (id?: string | null) => {
  return useQuery({
    queryKey: ['targeted-resume', id],
    queryFn: () => (id ? resumeApi.getResume(id) : null),
    enabled: Boolean(id),
  });
};

export const useCreateResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TargetedResumeCreate) => resumeApi.createResume(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targeted-resumes'] });
    },
  });
};

export const useUpdateResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TargetedResumeUpdate }) =>
      resumeApi.updateResume(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['targeted-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['targeted-resume', data.id] });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targeted-resumes'] });
    },
  });
};

export const useSetPrimaryResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.setPrimaryResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targeted-resumes'] });
    },
  });
};

export const useAnalyzeWithDestroyer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resumeId: string) => resumeApi.analyzeWithDestroyer(resumeId),
    onSuccess: (_data, resumeId) => {
      queryClient.invalidateQueries({ queryKey: ['targeted-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['targeted-resume', resumeId] });
      queryClient.invalidateQueries({ queryKey: ['career-score'] });
    },
  });
};
