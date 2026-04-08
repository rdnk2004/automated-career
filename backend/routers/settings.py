from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Dict, Any

from database import get_db
from models.settings import AppSettings
from config import settings as env_settings

router = APIRouter()

class SettingsUpdate(BaseModel):
    target_roles: List[str]

class SettingsResponse(BaseModel):
    github_pat_set: bool
    indeed_api_key_set: bool
    gemini_key_set: bool
    target_roles: List[str]
    sync_schedule: Dict[str, Any]

@router.get("/", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AppSettings).where(AppSettings.key == 'target_roles'))
    row = res.scalars().first()
    target_roles = []
    if row and row.value:
        import json
        target_roles = json.loads(row.value)
        
    return SettingsResponse(
        github_pat_set=bool(env_settings.github_pat),
        indeed_api_key_set=bool(env_settings.indeed_api_key),
        gemini_key_set=bool(env_settings.gemini_api_key),
        target_roles=target_roles,
        sync_schedule={} # mockup
    )

@router.put("/")
async def update_settings(req: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    import json
    res = await db.execute(select(AppSettings).where(AppSettings.key == 'target_roles'))
    row = res.scalars().first()
    if row:
        row.value = json.dumps(req.target_roles)
    else:
        new_row = AppSettings(key='target_roles', value=json.dumps(req.target_roles))
        db.add(new_row)
    await db.commit()
    return {"updated": True}
