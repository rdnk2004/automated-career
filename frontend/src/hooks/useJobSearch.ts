import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '@/services/jobsApi';
import { analysisApi } from '@/services/analysisApi';

export const useJobSearch = (title: string, limit: number = 30) => {
  return useQuery({
    queryKey: ['jobs', title, limit],
    queryFn: () => jobsApi.searchJobs(title, limit),
    enabled: !!title
  });
};

export const useJobKeywords = (title: string) => {
  return useQuery({
    queryKey: ['keywords', title],
    queryFn: () => jobsApi.getKeywords(title),
    enabled: !!title
  });
};

export const useResumeSuggestion = () => {
  return useMutation({
    mutationFn: ({ resumeText, targetRole }: { resumeText: string, targetRole: string }) => 
      analysisApi.analyzeResume(resumeText, targetRole)
  });
};
