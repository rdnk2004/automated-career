from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID

class RepoScanResponse(BaseModel):
    id: UUID
    repo_id: UUID
    health_score: Optional[int] = None
    has_gitignore: Optional[bool] = None
    has_env_file: Optional[bool] = None
    leaked_secrets: Optional[List[Dict[str, Any]]] = None
    ai_issues: Optional[List[Dict[str, Any]]] = None
    scanned_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GithubRepoResponse(BaseModel):
    id: UUID
    github_id: int
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    topics: Optional[List[str]] = None
    has_readme: bool
    readme_content: Optional[str] = None
    is_private: bool
    stars: int
    last_pushed_at: Optional[datetime] = None
    synced_at: datetime
    latest_scan: Optional[RepoScanResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ReadmeGenerateRequest(BaseModel):
    repo_full_name: str

class ReadmeGenerateResponse(BaseModel):
    readme_markdown: str
    suggestion_id: UUID

class ReadmePushRequest(BaseModel):
    repo_full_name: str
    content: str

class ReadmePushResponse(BaseModel):
    committed: bool
    sha: str
