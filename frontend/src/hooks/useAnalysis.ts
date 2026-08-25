import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '@/services/analysisApi';
import { CareerScore, CareerScoreHistory, CareerMetrics } from '@/types/analysis';

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
 * Fetch historical career score snapshots for trend visualization.
 */
export const useScoreHistory = (targetRole?: string, days: number = 30) => {
  return useQuery<CareerScoreHistory>({
    queryKey: ['score-history', targetRole, days],
    queryFn: () => analysisApi.getHistory(targetRole, days),
  });
};

/**
 * Fetch career growth metrics (7-day velocity delta, best dimension, benchmark gap).
 */
export const useCareerMetrics = (targetRole?: string) => {
  return useQuery<CareerMetrics>({
    queryKey: ['career-metrics', targetRole],
    queryFn: () => analysisApi.getMetrics(targetRole),
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
      queryClient.invalidateQueries({ queryKey: ['score-history'] });
      queryClient.invalidateQueries({ queryKey: ['career-metrics'] });
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
      queryClient.invalidateQueries({ queryKey: ['score-history'] });
      queryClient.invalidateQueries({ queryKey: ['career-metrics'] });
    },
  });
};
