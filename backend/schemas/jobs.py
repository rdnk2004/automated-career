from pydantic import BaseModel, ConfigDict
from typing import Optional
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
