from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from database import get_db
from models.jobs import JobListing, JDKeyword
from schemas.jobs import JobListingResponse, JDKeywordResponse

router = APIRouter()

@router.get("/search", response_model=List[JobListingResponse])
async def search_jobs(title: str, location: Optional[str] = None, limit: int = 30, db: AsyncSession = Depends(get_db)):
    # The integration with Indeed or any other external job API is paused.
    # Return empty results gracefully to keep the frontend running smoothly without crashing.
    return []

@router.get("/keywords", response_model=List[JDKeywordResponse])
async def get_keywords(title: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(JDKeyword).where(JDKeyword.target_role == title).order_by(JDKeyword.frequency.desc()))
    return res.scalars().all()

@router.get("/trends")
async def get_trends(title: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """Keyword trends over time. NOTE: Not yet implemented — returns placeholder data."""
    return {"rising": [], "stable": [], "falling": [], "_notice": "Trends endpoint not yet implemented"}
