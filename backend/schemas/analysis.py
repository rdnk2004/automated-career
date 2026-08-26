from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class SectionScore(BaseModel):
    section_type: str
    score: int
    reasoning: Optional[str] = None

class KeywordGap(BaseModel):
    keyword: str
    frequency: Optional[int] = None

class BulletRewrite(BaseModel):
    original: Optional[str] = None
    suggested: str
    evidence_refs: Optional[List[str]] = None

class HeadlineAlternative(BaseModel):
    headline: str
    target_focus: str
    char_count: int = 0


class VisualPresenceGuidance(BaseModel):
    photo_recommendation: str
    banner_strategy: str


class ExperienceRewrite(BaseModel):
    role_title: str
    company: Optional[str] = None
    original_snippet: Optional[str] = None
    suggested_bullets: List[str] = []
    impact_metrics: List[str] = []


class SkillsOptimization(BaseModel):
    skills_to_add: List[str] = []
    skills_to_remove: List[str] = []
    top_pinned_skills: List[str] = []


class LinkedInProjectRecommendation(BaseModel):
    repo_full_name: str
    name: str
    linkedin_placement: str
    why_add: str
    title_for_linkedin: str
    description_snippet: str
    skills_tags: List[str] = []


class GrowthRoadmapPhase(BaseModel):
    phase: str
    key_actions: List[str] = []


class ContentStrategyIdea(BaseModel):
    topic: str
    post_angle: str
    target_audience: str
    suggested_hook: str


class SuggestionSetResponse(BaseModel):
    profile_score: int = 78
    headline_alternatives: List[HeadlineAlternative] = []
    visual_presence: Optional[VisualPresenceGuidance] = None
    about_rewrite: Optional[str] = None
    experience_rewrites: List[ExperienceRewrite] = []
    skills_optimization: Optional[SkillsOptimization] = None
    recommended_projects_to_add: List[LinkedInProjectRecommendation] = []
    featured_section_advice: Optional[str] = None
    recommendations_advice: Optional[str] = None
    industry_keywords: List[str] = []
    competitive_analysis: Optional[Dict[str, Any]] = None
    quick_wins: List[str] = []
    long_term_improvements: List[str] = []
    growth_roadmap: List[GrowthRoadmapPhase] = []
    content_ideas: List[ContentStrategyIdea] = []
    industry_benchmarks: Optional[str] = None
    profile_completion_gaps: List[str] = []
    # Core compatibility
    section_scores: List[SectionScore] = []
    keyword_gaps: List[KeywordGap] = []
    rewrites: List[BulletRewrite] = []

class CareerScoreResponse(BaseModel):
    linkedin: int
    github: int
    resume: int
    overall: int
    weekly_actions: List[str]

class ResumeSuggestionResponse(BaseModel):
    match_score: int
    gap_keywords: List[KeywordGap]
    bullet_rewrites: List[BulletRewrite]
    evidence_refs: List[str]

class ScoreSnapshotItem(BaseModel):
    id: Optional[UUID] = None
    snapshotted_at: datetime
    linkedin_score: int
    github_score: int
    resume_match_score: int
    overall_score: int
    target_role: Optional[str] = None

    class Config:
        from_attributes = True

class CareerScoreHistoryResponse(BaseModel):
    target_role: Optional[str] = None
    timeframe_days: int
    total_snapshots: int
    snapshots: List[ScoreSnapshotItem]

class CareerMetricsResponse(BaseModel):
    current_overall: int
    previous_overall: int
    delta_7d: int
    current_linkedin: int
    current_github: int
    current_resume: int
    best_dimension: str
    target_role: Optional[str] = None
    market_benchmark_gap: int
    snapshotted_at: Optional[datetime] = None

class ParsedResumeResponse(BaseModel):
    name: Optional[str] = "Candidate"
    contact: Dict[str, Optional[str]] = {}
    summary: Optional[str] = ""
    experience: List[Dict[str, Any]] = []
    skills: List[str] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    raw_text: str
    word_count: int


# --- Resume Destroyer Schemas ---

class SectionBsFactor(BaseModel):
    section_name: str
    bs_factor: float
    critique: str


class RecommendedProject(BaseModel):
    repo_full_name: str
    name: str
    html_url: Optional[str] = None
    match_rationale: str
    key_technologies: List[str] = []
    suggested_bullets: List[str] = []
    stars: int = 0


class CompetitiveAnalysis(BaseModel):
    realistic_level: str
    critical_differentiators: List[str] = []
    development_priorities: List[str] = []
    market_benchmark_summary: str


class ResumeDestroyerResponse(BaseModel):
    match_score: int
    overall_bs_factor: float
    section_bs_factors: List[SectionBsFactor] = []
    critical_flaws: List[str] = []
    ats_red_flags: List[str] = []
    recommended_projects: List[RecommendedProject] = []
    bullet_rewrites: List[BulletRewrite] = []
    competitive_analysis: CompetitiveAnalysis
    gap_keywords: List[KeywordGap] = []
    evidence_refs: List[str] = []


# --- Targeted Resume CRUD Schemas ---

class TargetedResumeCreate(BaseModel):
    title: str
    target_role: str
    raw_text: str
    parsed_data: Optional[Dict[str, Any]] = None
    is_primary: Optional[bool] = False


class TargetedResumeUpdate(BaseModel):
    title: Optional[str] = None
    target_role: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    is_primary: Optional[bool] = None


class TargetedResumeResponse(BaseModel):
    id: UUID
    title: str
    target_role: str
    raw_text: str
    parsed_data: Optional[Dict[str, Any]] = None
    match_score: Optional[int] = None
    bs_factor: Optional[float] = None
    last_analysis: Optional[Dict[str, Any]] = None
    is_primary: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
