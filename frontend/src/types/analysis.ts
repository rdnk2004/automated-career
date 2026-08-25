export interface SectionScore {
  section_type: string;
  score: number;
  reasoning?: string;
}

export interface KeywordGap {
  keyword: string;
  frequency?: number;
}

export interface BulletRewrite {
  original?: string;
  suggested: string;
  evidence_refs?: string[];
}

export interface SuggestionSet {
  section_scores: SectionScore[];
  keyword_gaps: KeywordGap[];
  rewrites: BulletRewrite[];
}

export interface CareerScore {
  linkedin: number;
  github: number;
  resume: number;
  overall: number;
  weekly_actions: string[];
}

export interface ResumeSuggestion {
  match_score: number;
  gap_keywords: KeywordGap[];
  bullet_rewrites: BulletRewrite[];
  evidence_refs: string[];
}

export interface ScoreSnapshotItem {
  id?: string;
  snapshotted_at: string;
  linkedin_score: number;
  github_score: number;
  resume_match_score: number;
  overall_score: number;
  target_role?: string;
}

export interface CareerScoreHistory {
  target_role?: string;
  timeframe_days: number;
  total_snapshots: number;
  snapshots: ScoreSnapshotItem[];
}

export interface CareerMetrics {
  current_overall: number;
  previous_overall: number;
  delta_7d: number;
  current_linkedin: number;
  current_github: number;
  current_resume: number;
  best_dimension: string;
  target_role?: string;
  market_benchmark_gap: number;
  snapshotted_at?: string;
}
