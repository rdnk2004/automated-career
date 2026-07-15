from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from database import get_db
from models.jobs import JobListing, JDKeyword
from schemas.jobs import JobListingResponse, JDKeywordResponse
from services.ats_service import ats_service
from services.indeed_service import indeed_service  # kept only for extract_keywords()

router = APIRouter()

@router.get("/search", response_model=List[JobListingResponse])
async def search_jobs(title: str, location: Optional[str] = None, limit: int = 30, db: AsyncSession = Depends(get_db)):
    jobs = await ats_service.search_jobs(title=title, location=location, limit=limit)
    # NOTE: persist to JobListing table here via db.add(...)/db.commit() following
    # your existing weekly_job_sync pattern, then return the ORM rows.
    return jobs

@router.get("/keywords", response_model=List[JDKeywordResponse])
async def get_keywords(title: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(JDKeyword).where(JDKeyword.target_role == title).order_by(JDKeyword.frequency.desc()))
    return res.scalars().all()

@router.get("/trends")
async def get_trends(title: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """Keyword trends over time. NOTE: Not yet implemented — returns placeholder data."""
    return {"rising": [], "stable": [], "falling": [], "_notice": "Trends endpoint not yet implemented"}