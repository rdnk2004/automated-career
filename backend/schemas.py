from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# PORTED from CareerCompass AI reference (unchanged)
# ─────────────────────────────────────────────────────────────────────────────

class ResumeHighlightSegment(BaseModel):
    id: str
    section: str
    original_text: str
    rating: Literal["green", "yellow", "red"]
    label: str
    comment: str
    suggested_text: Optional[str] = None


class ResumeHighlightSummaryCounts(BaseModel):
    green: int
    yellow: int
    red: int


class ResumeHighlightsResult(BaseModel):
    overall_feedback: str
    segments: List[ResumeHighlightSegment]
    summary_counts: ResumeHighlightSummaryCounts


class GithubDeepAnalysisResult(BaseModel):
    project_name: str
    short_description: str
    project_type: str
    tech_stack: List[str]
    complexity_rating: float
    recommended_resume_bullets: List[str]
    improvement_suggestions: List[str]


class GithubProject(BaseModel):
    name: str
    summary: str
    tech_stack: List[str]
    complexity_rating: float
    resume_bullets: List[str]
    improvement_suggestions: List[str]


# ─────────────────────────────────────────────────────────────────────────────
# RESUME ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

class ATSIssue(BaseModel):
    issue: str
    severity: Literal["high", "medium", "low"]


class ATSScoreResult(BaseModel):
    score: float = Field(ge=0, le=100)
    passed_checks: List[str]
    issues: List[ATSIssue]


class ResumeBulletsRequest(BaseModel):
    project_description: str
    target_role: Optional[str] = "Data Analyst / ML Engineer"


class ResumeBulletsResponse(BaseModel):
    bullets: List[str]
    suggested_section: str


class ResumeAnalysisResponse(BaseModel):
    highlights: ResumeHighlightsResult
    ats_score: ATSScoreResult
    history_id: int


class ResumeHistoryItem(BaseModel):
    id: int
    jd_name: Optional[str]
    created_at: datetime
    ats_score: Optional[float]
    green_count: int
    yellow_count: int
    red_count: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────────────────
# GITHUB ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

class RepoClassification(BaseModel):
    name: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    url: str
    last_commit: Optional[str]
    classification: Literal["project", "experiment", "fork", "learning-exercise"]
    is_stale: bool


class GithubFetchResponse(BaseModel):
    repos: List[RepoClassification]
    total: int


class GithubAnalysisResponse(BaseModel):
    repo_name: str
    analysis: GithubDeepAnalysisResult
    readme_preview: Optional[str] = None


class GithubReadmeResponse(BaseModel):
    repo_name: str
    readme_markdown: str


class GithubProfileReadmeResponse(BaseModel):
    readme_markdown: str


# ─────────────────────────────────────────────────────────────────────────────
# LINKEDIN OPTIMIZER
# ─────────────────────────────────────────────────────────────────────────────

class LinkedInSectionRewrite(BaseModel):
    section: str
    original: str
    rewritten: str
    missing_keywords: List[str]


class LinkedInAnalysisResult(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    section_rewrites: List[LinkedInSectionRewrite]
    missing_keywords: List[str]
    overall_feedback: str


class LinkedInPostIdea(BaseModel):
    title: str
    draft: str
    hook: str


class LinkedInPostsResponse(BaseModel):
    posts: List[LinkedInPostIdea]


class LinkedInScrapeResponse(BaseModel):
    profile_data: Dict
    scraped_at: str
    from_cache: bool


# ─────────────────────────────────────────────────────────────────────────────
# HR PROSPECTOR
# ─────────────────────────────────────────────────────────────────────────────

class HRSearchRequest(BaseModel):
    company: str
    role: str
    location: str


class HRProfileResult(BaseModel):
    id: int
    name: str
    title: str
    company: str
    profile_url: str
    score: float = Field(ge=0, le=100)
    score_reason: str
    contact_status: Literal["not_contacted", "messaged", "replied"]


class HRMessageResult(BaseModel):
    connection_request: str
    follow_up_message: str


class HRStatusUpdate(BaseModel):
    status: Literal["not_contacted", "messaged", "replied"]


class HRDashboardStats(BaseModel):
    contacted: int
    replied: int
    pending: int


# ─────────────────────────────────────────────────────────────────────────────
# JOB FEED
# ─────────────────────────────────────────────────────────────────────────────

class JobListingResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    job_url: Optional[str]
    match_score: Optional[float]
    missing_skills: Optional[List[str]]
    must_have_skills: Optional[List[str]]
    source: Optional[str]
    scraped_at: datetime

    class Config:
        from_attributes = True


class JobTailoringResponse(BaseModel):
    tailored_resume_bullets: List[str]
    tailored_headline: str
    tailored_summary: str
    suggested_hr_contacts: List[HRProfileResult]


# ─────────────────────────────────────────────────────────────────────────────
# CROSS-CHANNEL SYNC ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class CrossSuggestionResponse(BaseModel):
    id: int
    suggestion_text: str
    suggestion_type: str
    draft_content: Optional[str]
    status: Literal["pending", "accepted", "dismissed"]
    created_at: datetime

    class Config:
        from_attributes = True


class SuggestionStatusUpdate(BaseModel):
    status: Literal["accepted", "dismissed"]


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

class ProfileHealthScore(BaseModel):
    overall: float = Field(ge=0, le=100)
    linkedin_score: float
    resume_score: float
    github_score: float
    sync_score: float
    last_updated: Optional[str]


class DashboardQuickStats(BaseModel):
    total_repos: int
    repos_analyzed: int
    hr_contacts: int
    jobs_fetched: int
    pending_suggestions: int
    last_resume_analysis: Optional[str]
    last_linkedin_scrape: Optional[str]


class DashboardResponse(BaseModel):
    health_score: ProfileHealthScore
    pending_suggestions: List[CrossSuggestionResponse]
    quick_stats: DashboardQuickStats


# ─────────────────────────────────────────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    gemini_api_key: str       # masked: "sk-...xxxx"
    gemini_model: str
    github_pat: str           # masked
    linkedin_username: str
    linkedin_password: str    # masked


class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    github_pat: Optional[str] = None
    linkedin_username: Optional[str] = None
    linkedin_password: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# GEMINI AI INTERNAL SCHEMAS (used for structured JSON output)
# ─────────────────────────────────────────────────────────────────────────────

class JDParsedRequirements(BaseModel):
    must_have_skills: List[str]
    nice_to_have_skills: List[str]
    seniority: str
    responsibilities: List[str]
    company_type: str


class JobMatchResult(BaseModel):
    match_score: float = Field(ge=0, le=100)
    missing_skills: List[str]
    matching_skills: List[str]
    tailored_resume_bullets: List[str]
    tailored_headline: str
    tailored_summary: str


class HRScoredProfile(BaseModel):
    name: str
    title: str
    company: str
    profile_url: str
    score: float = Field(ge=0, le=100)
    score_reason: str


class LinkedInRewriteAI(BaseModel):
    section_rewrites: List[LinkedInSectionRewrite]
    missing_keywords: List[str]
    overall_score: float
    overall_feedback: str


class CrossSuggestionAI(BaseModel):
    suggestion_text: str
    suggestion_type: str
    draft_content: str


class HealthScoreAI(BaseModel):
    overall: float
    linkedin_score: float
    resume_score: float
    github_score: float
    sync_score: float


class ATSScoreAI(BaseModel):
    score: float
    passed_checks: List[str]
    issues: List[ATSIssue]


class ProfileREADMEResponse(BaseModel):
    readme_markdown: str


class RepoREADMEResponse(BaseModel):
    readme_markdown: str


class ResumeBulletsAI(BaseModel):
    bullets: List[str]
    suggested_section: str
