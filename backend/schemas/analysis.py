from pydantic import BaseModel
from typing import List, Optional

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
