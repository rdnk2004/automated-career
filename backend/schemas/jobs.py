from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID

class JobSearchRequest(BaseModel):
    title: str
    location: Optional[str] = None
    limit: int = 30

class JobListingResponse(BaseModel):
    id: UUID
    indeed_id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: str
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    target_role: str
    fetched_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JDKeywordResponse(BaseModel):
    id: UUID
    target_role: str
    keyword: str
    frequency: int
    is_technical: bool
    last_seen_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TrendKeywordItem(BaseModel):
    keyword: str
    current_frequency: int
    previous_frequency: int
    velocity_percent: float
    is_technical: bool
    status: Literal['rising', 'stable', 'falling']

class JobTrendsResponse(BaseModel):
    target_role: str
    days: int
    total_analyzed: int
    rising: List[TrendKeywordItem]
    stable: List[TrendKeywordItem]
    falling: List[TrendKeywordItem]
