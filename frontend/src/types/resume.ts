export interface SectionBsFactor {
  section_name: string;
  bs_factor: number;
  critique: string;
}

export interface RecommendedProject {
  repo_full_name: string;
  name: string;
  html_url?: string;
  match_rationale: string;
  key_technologies: string[];
  suggested_bullets: string[];
  stars: number;
}

export interface CompetitiveAnalysis {
  realistic_level: string;
  critical_differentiators: string[];
  development_priorities: string[];
  market_benchmark_summary: string;
}

export interface BulletRewrite {
  original?: string;
  suggested: string;
  evidence_refs?: string[];
}

export interface KeywordGap {
  keyword: string;
  frequency?: number;
}

export interface ResumeDestroyerAudit {
  match_score: number;
  overall_bs_factor: number;
  section_bs_factors: SectionBsFactor[];
  critical_flaws: string[];
  ats_red_flags: string[];
  recommended_projects: RecommendedProject[];
  bullet_rewrites: BulletRewrite[];
  competitive_analysis: CompetitiveAnalysis;
  gap_keywords: (KeywordGap | string)[];
  evidence_refs: string[];
}

export interface TargetedResume {
  id: string;
  title: string;
  target_role: string;
  raw_text: string;
  parsed_data?: Record<string, any>;
  match_score?: number;
  bs_factor?: number;
  last_analysis?: ResumeDestroyerAudit;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface TargetedResumeCreate {
  title: string;
  target_role: string;
  raw_text: string;
  parsed_data?: Record<string, any>;
  is_primary?: boolean;
}

export interface TargetedResumeUpdate {
  title?: string;
  target_role?: string;
  raw_text?: string;
  parsed_data?: Record<string, any>;
  is_primary?: boolean;
}
