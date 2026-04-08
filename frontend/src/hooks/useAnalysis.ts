import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '@/services/analysisApi';
import { CareerScore } from '@/types/analysis';

/**
 * Fetches the latest cached career score. Uses a query but does NOT
 * auto-trigger synthesis (which would burn Gemini credits).
 * Call refreshCareerScore() to trigger a fresh synthesis.
 */
export const useCareerScore = (targetRole: string) => {
  return useQuery<CareerScore | null>({
    queryKey: ['career-score', targetRole],
    queryFn: () => null, // returns null until manually refreshed
    staleTime: Infinity, // never auto-refetch
    enabled: !!targetRole,
  });
};

/**
 * Manually trigger career score synthesis.
 * Updates the cache so useCareerScore consumers get the new data.
 */
export const useRefreshCareerScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetRole: string) => analysisApi.synthesize(targetRole),
    onSuccess: (data, targetRole) => {
      queryClient.setQueryData(['career-score', targetRole], data);
    },
  });
};

/**
 * Trigger LinkedIn profile analysis.
 */
export const useLinkedInAnalysis = (targetRole: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analysisApi.analyzeLinkedIn(targetRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career-score'] });
    },
  });
};
