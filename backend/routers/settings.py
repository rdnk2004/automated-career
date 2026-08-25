import json
import httpx
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Dict, Any

from database import get_db
from models.settings import AppSettings
from models.suggestions import CareerScoreSnapshot, SuggestionLog
from schemas.settings import (
    SettingsUpdate,
    SettingsResponse,
    N8nWorkflowItem,
    N8nStatusResponse,
    SystemResetRequest,
    SystemResetResponse,
)
from config import settings as env_settings
from services.task_manager import task_manager

logger = logging.getLogger("career_os")
router = APIRouter()

DEFAULT_N8N_WORKFLOWS = [
    N8nWorkflowItem(
        name="Nightly GitHub Sync",
        active=True,
        cron="0 2 * * *",
        description="Syncs all public and private repositories and calculates health scores",
        status="active"
    ),
    N8nWorkflowItem(
        name="Weekly Market Analysis",
        active=True,
        cron="0 7 * * 1",
        description="Scrapes 30 JDs per target role from ATS boards and aggregates keywords",
        status="active"
    ),
    N8nWorkflowItem(
        name="LinkedIn Trigger Sync",
        active=True,
        cron="On Data ZIP Upload",
        description="Webhook listener that triggers multi-metric AI profile analysis upon upload",
        status="active"
    ),
]


@router.get("/", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AppSettings).where(AppSettings.key == "target_roles"))
    row = res.scalars().first()
    target_roles = []
    if row and row.value:
        try:
            target_roles = json.loads(row.value)
        except Exception:
            target_roles = []

    if not target_roles:
        target_roles = ["Senior AI Engineer", "Staff Backend Engineer", "Full Stack AI Engineer"]

    sync_schedule = {
        "nightly_github_sync": {"cron": "0 2 * * *", "enabled": True, "time": "02:00 AM"},
        "weekly_market_scrape": {"cron": "0 7 * * 1", "enabled": True, "time": "07:00 AM Mondays"},
        "linkedin_export_hook": {"enabled": True, "trigger": "On ZIP Upload"},
    }

    n8n_status = N8nStatusResponse(
        connected=True,
        webhook_url=env_settings.n8n_webhook_url or "http://localhost:5678",
        active_workflows=DEFAULT_N8N_WORKFLOWS,
    )

    return SettingsResponse(
        github_pat_set=bool(env_settings.github_pat),
        indeed_api_key_set=bool(env_settings.indeed_api_key),
        gemini_key_set=bool(env_settings.gemini_api_key),
        target_roles=target_roles,
        sync_schedule=sync_schedule,
        n8n_status=n8n_status,
    )


@router.put("/")
async def update_settings(req: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AppSettings).where(AppSettings.key == "target_roles"))
    row = res.scalars().first()
    if row:
        row.value = json.dumps(req.target_roles)
    else:
        new_row = AppSettings(key="target_roles", value=json.dumps(req.target_roles))
        db.add(new_row)
    await db.commit()
    return {"updated": True}


@router.get("/n8n-status", response_model=N8nStatusResponse)
async def get_n8n_status():
    """
    Check live connectivity and active workflows on the local n8n automation engine.
    """
    webhook_url = env_settings.n8n_webhook_url or "http://localhost:5678"
    is_connected = False
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(f"{webhook_url}/healthz")
            if resp.status_code < 500:
                is_connected = True
    except Exception:
        is_connected = False

    return N8nStatusResponse(
        connected=is_connected,
        webhook_url=webhook_url,
        active_workflows=DEFAULT_N8N_WORKFLOWS,
    )


@router.post("/reset", response_model=SystemResetResponse)
async def reset_system_data(req: SystemResetRequest, db: AsyncSession = Depends(get_db)):
    """
    Safely reset cached score snapshots, AI suggestion audit logs, and in-memory background tasks.
    """
    cleared = {}
    target = req.target

    try:
        if target in ("scores", "all"):
            res_del_scores = await db.execute(delete(CareerScoreSnapshot))
            cleared["career_score_snapshots"] = res_del_scores.rowcount or 0

        if target in ("suggestions", "all"):
            res_del_sug = await db.execute(delete(SuggestionLog))
            cleared["suggestions_log"] = res_del_sug.rowcount or 0

        if target in ("cache", "all"):
            task_count = len(task_manager._tasks)
            task_manager._tasks.clear()
            cleared["background_tasks"] = task_count

        await db.commit()
        return SystemResetResponse(
            reset_target=target,
            cleared_records=cleared,
            message=f"System reset successfully executed for target '{target}'.",
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"System reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {e}")
