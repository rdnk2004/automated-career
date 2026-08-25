from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime

class SettingsUpdate(BaseModel):
    target_roles: List[str]

class N8nWorkflowItem(BaseModel):
    name: str
    active: bool
    cron: str
    description: str
    status: str

class N8nStatusResponse(BaseModel):
    connected: bool
    webhook_url: str
    active_workflows: List[N8nWorkflowItem]

class SettingsResponse(BaseModel):
    github_pat_set: bool
    indeed_api_key_set: bool
    gemini_key_set: bool
    target_roles: List[str]
    sync_schedule: Dict[str, Any]
    n8n_status: Optional[N8nStatusResponse] = None

class SystemResetRequest(BaseModel):
    target: Literal['scores', 'suggestions', 'cache', 'all'] = 'all'

class SystemResetResponse(BaseModel):
    reset_target: str
    cleared_records: Dict[str, int]
    message: str
