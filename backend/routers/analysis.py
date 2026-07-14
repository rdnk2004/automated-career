import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any

from database import get_db
from models.profile import UserProfile, ProfileSection
from models.github import GithubRepo
from models.jobs import JDKeyword
from models.suggestions import SuggestionLog, CareerScoreSnapshot
from schemas.analysis import SuggestionSetResponse, CareerScoreResponse, ResumeSuggestionResponse

from agents.linkedin_agent import analyze as analyze_linkedin_agent
from agents.resume_agent import analyze as analyze_resume_agent
from agents.synthesis_agent import synthesize as synthesize_agent

from pydantic import BaseModel, Field

logger = logging.getLogger("career_os")
router = APIRouter()

# --- Request schemas with validation ---

class LinkedInAnalysisRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=200)

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, max_length=50_000)
    target_role: str = Field(..., min_length=1, max_length=200)



class SynthesisRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=200)


async def save_suggestion_log(db: AsyncSession, suggestion_type: str, context: dict, suggestion: str):
    log = SuggestionLog(
        suggestion_type=suggestion_type,
        context=context,
        suggestion=suggestion
    )
    db.add(log)
    await db.commit()


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

    # Save snapshot
    snapshot = CareerScoreSnapshot(
        linkedin_score=career_score.linkedin,
        github_score=career_score.github,
        resume_match_score=career_score.resume,
        overall_score=career_score.overall,
        target_role=req.target_role
    )
    db.add(snapshot)
    await db.commit()

    await save_suggestion_log(db, "synthesis", {"target_role": req.target_role}, json.dumps(career_score.model_dump()))
    return career_score
