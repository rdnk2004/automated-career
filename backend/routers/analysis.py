import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, Response, Query
from limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from database import get_db
from models.profile import UserProfile, ProfileSection
from models.github import GithubRepo
from models.jobs import JDKeyword
from models.suggestions import SuggestionLog, CareerScoreSnapshot
from schemas.analysis import (
    SuggestionSetResponse,
    CareerScoreResponse,
    ResumeSuggestionResponse,
    ScoreSnapshotItem,
    CareerScoreHistoryResponse,
    CareerMetricsResponse,
)

from agents.linkedin_agent import analyze as analyze_linkedin_agent
from agents.resume_agent import analyze as analyze_resume_agent
from agents.synthesis_agent import synthesize as synthesize_agent
from services.pdf_service import pdf_export_service

from pydantic import BaseModel, Field

logger = logging.getLogger("career_os")
router = APIRouter()

# --- Request schemas with validation ---

class LinkedInAnalysisRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=200)

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, max_length=50_000)
    target_role: str = Field(..., min_length=1, max_length=200)

class ResumeExportPDFRequest(BaseModel):
    name: Optional[str] = "Candidate"
    target_role: str = Field(..., min_length=1, max_length=200)
    contact: Optional[Dict[str, str]] = Field(default_factory=dict)
    summary: Optional[str] = ""
    experience: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    skills: Optional[List[str]] = Field(default_factory=list)
    education: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    certifications: Optional[List[str]] = Field(default_factory=list)

class SynthesisRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=200)


async def save_suggestion_log(db: AsyncSession, suggestion_type: str, context: dict, suggestion: str):
    log = SuggestionLog(
        suggestion_type=suggestion_type,
        context=context,
        suggestion=suggestion
    )
    db.add(log)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save suggestion log: {e}")


@router.post("/linkedin", response_model=SuggestionSetResponse)
@limiter.limit("5/minute")
async def analyze_linkedin(request: Request, req: LinkedInAnalysisRequest, db: AsyncSession = Depends(get_db)):
    res_prof = await db.execute(select(UserProfile))
    profile = res_prof.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Import your LinkedIn data first.")

    res_sec = await db.execute(select(ProfileSection).where(ProfileSection.profile_id == profile.id))
    sections = res_sec.scalars().all()

    profile_data = {
        "raw_data": profile.raw_data,
        "sections": [{"type": s.section_type, "content": s.content} for s in sections]
    }

    res_kw = await db.execute(
        select(JDKeyword)
        .where(JDKeyword.target_role == req.target_role)
        .order_by(JDKeyword.frequency.desc())
        .limit(30)
    )
    jd_keywords = [kw.keyword for kw in res_kw.scalars().all()]

    try:
        suggestion_set = await analyze_linkedin_agent(profile_data, req.target_role, jd_keywords)
    except (RuntimeError, ValueError) as e:
        logger.error(f"LinkedIn analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    await save_suggestion_log(db, "linkedin", {"target_role": req.target_role}, json.dumps(suggestion_set.model_dump()))
    return suggestion_set


@router.post("/resume", response_model=ResumeSuggestionResponse)
@limiter.limit("5/minute")
async def analyze_resume(request: Request, req: ResumeAnalysisRequest, db: AsyncSession = Depends(get_db)):
    res_kw = await db.execute(
        select(JDKeyword)
        .where(JDKeyword.target_role == req.target_role)
        .order_by(JDKeyword.frequency.desc())
        .limit(30)
    )
    jd_keywords = [kw.keyword for kw in res_kw.scalars().all()]

    res_repo = await db.execute(select(GithubRepo).order_by(GithubRepo.stars.desc()).limit(5))
    github_projects = [repo.name for repo in res_repo.scalars().all()]

    try:
        suggestion = await analyze_resume_agent(req.resume_text, req.target_role, jd_keywords, github_projects)
    except (RuntimeError, ValueError) as e:
        logger.error(f"Resume analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    await save_suggestion_log(db, "resume", {"target_role": req.target_role}, json.dumps(suggestion.model_dump()))
    return suggestion


@router.post("/resume/export-pdf")
@limiter.limit("10/minute")
async def export_resume_pdf(request: Request, req: ResumeExportPDFRequest):
    try:
        pdf_bytes = pdf_export_service.generate_resume_pdf(req.model_dump())
    except Exception as e:
        logger.error(f"Failed to generate ATS PDF: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    safe_name = (req.name or "Candidate").replace(" ", "_")
    filename = f"{safe_name}_ATS_Resume.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("/synthesis", response_model=CareerScoreResponse)
@limiter.limit("5/minute")
async def analyze_synthesis(request: Request, req: SynthesisRequest, db: AsyncSession = Depends(get_db)):
    res_prof = await db.execute(select(UserProfile))
    profile = res_prof.scalars().first()
    profile_data = {"summary": profile.summary} if profile else {}

    res_repo = await db.execute(select(GithubRepo).order_by(GithubRepo.stars.desc()).limit(5))
    repos_data = [{"name": r.name, "stars": r.stars} for r in res_repo.scalars().all()]

    res_kw = await db.execute(
        select(JDKeyword)
        .where(JDKeyword.target_role == req.target_role)
        .order_by(JDKeyword.frequency.desc())
        .limit(20)
    )
    jd_keywords = [kw.keyword for kw in res_kw.scalars().all()]

    try:
        career_score = await synthesize_agent(profile_data, repos_data, jd_keywords, req.target_role)
    except (RuntimeError, ValueError) as e:
        logger.error(f"Synthesis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI synthesis failed: {e}")

    # Save snapshot defensively
    try:
        snapshot = CareerScoreSnapshot(
            linkedin_score=career_score.linkedin,
            github_score=career_score.github,
            resume_match_score=career_score.resume,
            overall_score=career_score.overall,
            target_role=req.target_role
        )
        db.add(snapshot)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save career score snapshot: {e}")

    await save_suggestion_log(db, "synthesis", {"target_role": req.target_role}, json.dumps(career_score.model_dump()))
    return career_score


@router.get("/history", response_model=CareerScoreHistoryResponse)
async def get_score_history(
    target_role: Optional[str] = Query(None, description="Filter snapshots by target role"),
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    limit: int = Query(50, ge=1, le=200, description="Max snapshots to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve historical career score snapshots for trend visualization.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    query = select(CareerScoreSnapshot).where(CareerScoreSnapshot.snapshotted_at >= cutoff)
    if target_role:
        query = query.where(CareerScoreSnapshot.target_role == target_role)
    query = query.order_by(CareerScoreSnapshot.snapshotted_at.asc()).limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()

    snapshots = [
        ScoreSnapshotItem(
            id=row.id,
            snapshotted_at=row.snapshotted_at,
            linkedin_score=row.linkedin_score or 0,
            github_score=row.github_score or 0,
            resume_match_score=row.resume_match_score or 0,
            overall_score=row.overall_score or 0,
            target_role=row.target_role
        )
        for row in rows
    ]

    return CareerScoreHistoryResponse(
        target_role=target_role,
        timeframe_days=days,
        total_snapshots=len(snapshots),
        snapshots=snapshots
    )


@router.get("/metrics", response_model=CareerMetricsResponse)
async def get_career_metrics(
    target_role: Optional[str] = Query(None, description="Target career role"),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate rolling 7-day delta, best dimension, and target benchmark indicators.
    """
    query = select(CareerScoreSnapshot)
    if target_role:
        query = query.where(CareerScoreSnapshot.target_role == target_role)
    query = query.order_by(CareerScoreSnapshot.snapshotted_at.desc()).limit(10)

    result = await db.execute(query)
    snapshots = result.scalars().all()

    if not snapshots:
        # Graceful default when no analysis has been executed yet
        return CareerMetricsResponse(
            current_overall=0,
            previous_overall=0,
            delta_7d=0,
            current_linkedin=0,
            current_github=0,
            current_resume=0,
            best_dimension="None",
            target_role=target_role,
            market_benchmark_gap=85,
            snapshotted_at=None
        )

    latest = snapshots[0]
    current_overall = latest.overall_score or 0
    current_linkedin = latest.linkedin_score or 0
    current_github = latest.github_score or 0
    current_resume = latest.resume_match_score or 0

    # Determine previous snapshot (from ~7 days ago or earliest recent snapshot)
    previous_overall = snapshots[-1].overall_score or current_overall if len(snapshots) > 1 else current_overall
    delta_7d = current_overall - previous_overall

    # Determine best performing dimension
    dims = [
        ("LinkedIn", current_linkedin),
        ("GitHub Portfolio", current_github),
        ("Resume Match", current_resume)
    ]
    best_dimension = max(dims, key=lambda d: d[1])[0] if any(d[1] > 0 for d in dims) else "Balanced"

    market_benchmark_gap = max(0, 85 - current_overall)

    return CareerMetricsResponse(
        current_overall=current_overall,
        previous_overall=previous_overall,
        delta_7d=delta_7d,
        current_linkedin=current_linkedin,
        current_github=current_github,
        current_resume=current_resume,
        best_dimension=best_dimension,
        target_role=target_role or latest.target_role,
        market_benchmark_gap=market_benchmark_gap,
        snapshotted_at=latest.snapshotted_at
    )
