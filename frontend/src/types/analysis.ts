export interface SectionScore { section_type: string; score: number; reasoning?: string; }
export interface KeywordGap { keyword: string; frequency?: number; }
export interface BulletRewrite { original?: string; suggested: string; evidence_refs?: string[]; }
export interface SuggestionSet { section_scores: SectionScore[]; keyword_gaps: KeywordGap[]; rewrites: BulletRewrite[]; }
export interface CareerScore { linkedin: number; github: number; resume: number; overall: number; weekly_actions: string[]; }
export interface ResumeSuggestion { match_score: number; gap_keywords: KeywordGap[]; bullet_rewrites: BulletRewrite[]; evidence_refs: string[]; }
