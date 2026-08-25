from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict, Literal
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

class RepoScanRequest(BaseModel):
    repo_full_name: str

class BatchScanRequest(BaseModel):
    repo_full_names: List[str]

class TaskStatusResponse(BaseModel):
    task_id: str
    task_type: str
    status: Literal['queued', 'running', 'completed', 'failed']
    progress: float
    completed_steps: int
    total_steps: int
    current_item: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    result: Optional[Dict[str, Any]] = None

class RemediateRepoRequest(BaseModel):
    repo_full_name: str
    action: Literal['add_gitignore', 'remove_env', 'fix_all']

class RemediateRepoResponse(BaseModel):
    repo_full_name: str
    remediated: bool
    action_taken: str
    commit_sha: Optional[str] = None
    message: str
