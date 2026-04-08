from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime
from uuid import UUID

class ProfileSectionUpdate(BaseModel):
    section_type: str
    title: Optional[str] = None
    content: Dict[str, Any]

class ProfileSectionResponse(BaseModel):
    id: UUID
    profile_id: UUID
    section_type: str
    title: Optional[str] = None
    content: Dict[str, Any]
    ai_score: Optional[int] = None
    scored_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(BaseModel):
    id: UUID
    raw_data: Dict[str, Any]
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    updated_at: datetime
    sections: List[ProfileSectionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class LinkedInImportResponse(BaseModel):
    imported: bool
    sections_count: int
