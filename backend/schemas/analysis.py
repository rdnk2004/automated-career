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

class SuggestionSetResponse(BaseModel):
    section_scores: List[SectionScore]
    keyword_gaps: List[KeywordGap]
    rewrites: List[BulletRewrite]

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
