import json
import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from database import get_db
from models.resume import TargetedResume
from models.github import GithubRepo, RepoScan
from models.jobs import JDKeyword
from models.suggestions import SuggestionLog
from schemas.analysis import (
    TargetedResumeCreate,
    TargetedResumeUpdate,
    TargetedResumeResponse,
    ResumeDestroyerResponse,
)
from agents.resume_agent import analyze as analyze_resume_agent
from limiter import limiter

logger = logging.getLogger("career_os")
router = APIRouter()


@router.get("", response_model=List[TargetedResumeResponse])
async def list_resumes(
    target_role: Optional[str] = Query(None, description="Filter by target job role"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all stored targeted resumes, optionally filtered by target role.
    """
    query = select(TargetedResume).order_by(
        TargetedResume.is_primary.desc(),
        TargetedResume.updated_at.desc()
    )
    if target_role:
        query = query.where(TargetedResume.target_role.ilike(f"%{target_role.strip()}%"))

    result = await db.execute(query)
    resumes = result.scalars().all()
    return resumes


@router.post("", response_model=TargetedResumeResponse, status_code=201)
async def create_resume(
    req: TargetedResumeCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new targeted resume for a specific job role.
    """
    if req.is_primary:
        # Unset other primary resumes for this target role
        await db.execute(
            update(TargetedResume)
            .where(TargetedResume.target_role == req.target_role)
            .values(is_primary=False)
        )

    resume = TargetedResume(
        title=req.title.strip(),
        target_role=req.target_role.strip(),
        raw_text=req.raw_text.strip(),
        parsed_data=req.parsed_data,
        is_primary=bool(req.is_primary),
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


@router.get("/{resume_id}", response_model=TargetedResumeResponse)
async def get_resume(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch a single targeted resume by UUID.
    """
    result = await db.execute(select(TargetedResume).where(TargetedResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.put("/{resume_id}", response_model=TargetedResumeResponse)
async def update_resume(
    resume_id: UUID,
    req: TargetedResumeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update content, target role, or title of an existing resume.
    """
    result = await db.execute(select(TargetedResume).where(TargetedResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if req.title is not None:
        resume.title = req.title.strip()
    if req.target_role is not None:
        resume.target_role = req.target_role.strip()
    if req.raw_text is not None:
        resume.raw_text = req.raw_text.strip()
    if req.parsed_data is not None:
        resume.parsed_data = req.parsed_data
    if req.is_primary is not None:
        if req.is_primary:
            await db.execute(
                update(TargetedResume)
                .where(TargetedResume.target_role == resume.target_role)
                .where(TargetedResume.id != resume.id)
                .values(is_primary=False)
            )
        resume.is_primary = req.is_primary

    await db.commit()
    await db.refresh(resume)
    return resume


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a stored targeted resume.
    """
    result = await db.execute(select(TargetedResume).where(TargetedResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    await db.delete(resume)
    await db.commit()
    return {"deleted": True, "id": str(resume_id)}


@router.post("/{resume_id}/set-primary", response_model=TargetedResumeResponse)
async def set_primary_resume(
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Mark this resume as primary default for its target role.
    """
    result = await db.execute(select(TargetedResume).where(TargetedResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    await db.execute(
        update(TargetedResume)
        .where(TargetedResume.target_role == resume.target_role)
        .values(is_primary=False)
    )
    resume.is_primary = True
    await db.commit()
    await db.refresh(resume)
    return resume


@router.post("/{resume_id}/destroyer", response_model=ResumeDestroyerResponse)
@limiter.limit("5/minute")
async def review_resume_with_destroyer(
    request: Request,
    resume_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute 'The Resume Destroyer' review on this stored targeted resume.
    Saves analysis score, BS factor, and project recommendations to resume history.
    """
    result = await db.execute(select(TargetedResume).where(TargetedResume.id == resume_id))
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Fetch top JD keywords for target role
    res_kw = await db.execute(
        select(JDKeyword)
        .where(JDKeyword.target_role == resume.target_role)
        .order_by(JDKeyword.frequency.desc())
        .limit(30)
    )
    jd_keywords = [kw.keyword for kw in res_kw.scalars().all()]

    # Fetch public & collaborated repositories with scan evaluations
    res_repos = await db.execute(
        select(GithubRepo)
        .where(GithubRepo.is_private == False)
        .order_by(GithubRepo.stars.desc(), GithubRepo.last_pushed_at.desc().nullslast())
        .limit(15)
    )
    db_repos = res_repos.scalars().all()
    repo_ids = [r.id for r in db_repos]

    scans_map = {}
    if repo_ids:
        scans_res = await db.execute(
            select(RepoScan).where(RepoScan.repo_id.in_(repo_ids)).order_by(RepoScan.scanned_at.desc())
        )
        for s in scans_res.scalars().all():
            if s.repo_id not in scans_map:
                scans_map[s.repo_id] = s

    repos_context = []
    for r in db_repos:
        scan = scans_map.get(r.id)
        repos_context.append({
            "name": r.name,
            "full_name": r.full_name,
            "description": r.description,
            "language": r.language,
            "stars": r.stars,
            "key_technologies": scan.key_technologies if scan else [],
            "architecture_summary": scan.architecture_summary if scan else "",
        })

    try:
        audit = await analyze_resume_agent(
            resume_text=resume.raw_text,
            target_role=resume.target_role,
            jd_keywords=jd_keywords,
            github_repos=repos_context
        )
    except Exception as e:
        logger.error(f"Resume Destroyer audit failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    # Persist audit results to the targeted resume
    resume.match_score = audit.match_score
    resume.bs_factor = audit.overall_bs_factor
    resume.last_analysis = audit.model_dump()
    await db.commit()

    # Save to global suggestion log
    log = SuggestionLog(
        suggestion_type="resume_destroyer",
        context={"resume_id": str(resume.id), "target_role": resume.target_role},
        suggestion=json.dumps(audit.model_dump())
    )
    db.add(log)
    await db.commit()

    return audit
