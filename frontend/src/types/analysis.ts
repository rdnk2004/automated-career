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

export interface HeadlineAlternative {
  headline: string;
  target_focus: string;
  char_count: number;
}

export interface VisualPresenceGuidance {
  photo_recommendation: string;
  banner_strategy: string;
}

export interface ExperienceRewrite {
  role_title: string;
  company?: string;
  original_snippet?: string;
  suggested_bullets: string[];
  impact_metrics: string[];
}

export interface SkillsOptimization {
  skills_to_add: string[];
  skills_to_remove: string[];
  top_pinned_skills: string[];
}

export interface LinkedInProjectRecommendation {
  repo_full_name: string;
  name: string;
  linkedin_placement: string;
  why_add: string;
  title_for_linkedin: string;
  description_snippet: string;
  skills_tags: string[];
}

export interface GrowthRoadmapPhase {
  phase: string;
  key_actions: string[];
}

export interface ContentStrategyIdea {
  topic: string;
  post_angle: string;
  target_audience: string;
  suggested_hook: string;
}

export interface SuggestionSet {
  profile_score?: number;
  headline_alternatives?: HeadlineAlternative[];
  visual_presence?: VisualPresenceGuidance;
  about_rewrite?: string;
  experience_rewrites?: ExperienceRewrite[];
  skills_optimization?: SkillsOptimization;
  recommended_projects_to_add?: LinkedInProjectRecommendation[];
  featured_section_advice?: string;
  recommendations_advice?: string;
  industry_keywords?: string[];
  competitive_analysis?: Record<string, any>;
  quick_wins?: string[];
  long_term_improvements?: string[];
  growth_roadmap?: GrowthRoadmapPhase[];
  content_ideas?: ContentStrategyIdea[];
  industry_benchmarks?: string;
  profile_completion_gaps?: string[];
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
