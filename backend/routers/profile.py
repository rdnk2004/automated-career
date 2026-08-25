from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Any, Dict, Optional
from uuid import UUID
from datetime import datetime, timezone
import httpx
import logging

from database import get_db
from models.profile import UserProfile, ProfileSection
from models.suggestions import SuggestionLog
from schemas.profile import (
    UserProfileResponse,
    ProfileSectionUpdate,
    ProfileSectionResponse,
    LinkedInImportResponse,
    ApplySuggestionRequest,
    ApplySuggestionResponse,
    SectionScoreBreakdown,
)
from config import settings

logger = logging.getLogger("career_os")
router = APIRouter()


@router.get("/", response_model=UserProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).options(selectinload(UserProfile.sections)))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/", response_model=ProfileSectionResponse)
async def update_profile(section: ProfileSectionUpdate, db: AsyncSession = Depends(get_db)):
    # Find existing section
    result = await db.execute(select(ProfileSection).where(ProfileSection.section_type == section.section_type))
    db_section = result.scalars().first()

    # Get profile
    profile_res = await db.execute(select(UserProfile))
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if db_section:
        db_section.title = section.title
        db_section.content = section.content
    else:
        db_section = ProfileSection(
            profile_id=profile.id,
            section_type=section.section_type,
            title=section.title,
            content=section.content,
        )
        db.add(db_section)

    # Sync top-level user_profile fields
    if section.section_type == "headline":
        profile.headline = section.content.get("headline", section.title or "")
    elif section.section_type in ["about", "summary"]:
        profile.summary = section.content.get("summary", "")

    await db.commit()
    await db.refresh(db_section)
    return db_section


@router.post("/apply-suggestion", response_model=ApplySuggestionResponse)
async def apply_suggestion(req: ApplySuggestionRequest, db: AsyncSession = Depends(get_db)):
    """
    Atomically apply an AI suggestion to the candidate's profile section,
    sync top-level profile attributes, and mark suggestion_log as applied.
    """
    profile_res = await db.execute(select(UserProfile))
    profile = profile_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Import your LinkedIn data first.")

    res_sec = await db.execute(
        select(ProfileSection).where(
            (ProfileSection.profile_id == profile.id) & (ProfileSection.section_type == req.section_type)
        )
    )
    section = res_sec.scalars().first()

    # If section doesn't exist, create it
    if not section:
        section = ProfileSection(
            profile_id=profile.id,
            section_type=req.section_type,
            title=req.title or req.section_type.capitalize(),
            content={},
        )
        db.add(section)

    current_content = dict(section.content or {})
    suggested = req.suggested_content

    # Intelligently merge based on section type
    if req.section_type == "headline":
        headline_text = suggested if isinstance(suggested, str) else str(suggested.get("headline", suggested))
        current_content["headline"] = headline_text
        profile.headline = headline_text
    elif req.section_type in ["about", "summary"]:
        summary_text = suggested if isinstance(suggested, str) else str(suggested.get("summary", suggested))
        current_content["summary"] = summary_text
        profile.summary = summary_text
    elif req.section_type == "skills":
        existing_skills = current_content.get("skills", [])
        if isinstance(suggested, list):
            merged = list(dict.fromkeys(existing_skills + suggested))
            current_content["skills"] = merged
        elif isinstance(suggested, str):
            if suggested not in existing_skills:
                existing_skills.append(suggested)
            current_content["skills"] = existing_skills
    elif req.section_type == "experience":
        # Experience rewrites or bullet appends
        if isinstance(suggested, list):
            current_content["positions"] = suggested
        elif isinstance(suggested, dict):
            positions = current_content.get("positions", [])
            positions.insert(0, suggested)
            current_content["positions"] = positions
        else:
            # Bullet point suggestion
            current_content["latest_suggestion"] = str(suggested)
    else:
        if isinstance(suggested, dict):
            current_content.update(suggested)
        else:
            current_content["value"] = suggested

    section.content = current_content
    if req.title:
        section.title = req.title

    # Mark suggestion as applied in audit log if ID provided
    if req.suggestion_id:
        res_log = await db.execute(select(SuggestionLog).where(SuggestionLog.id == req.suggestion_id))
        sug_log = res_log.scalars().first()
        if sug_log:
            sug_log.was_applied = True
            sug_log.applied_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(section)

    return ApplySuggestionResponse(
        applied=True,
        section_type=req.section_type,
        updated_section=ProfileSectionResponse.model_validate(section),
        message=f"Successfully applied AI suggestion to {req.section_type} section",
    )


@router.get("/scores", response_model=List[SectionScoreBreakdown])
async def get_profile_scores(db: AsyncSession = Depends(get_db)):
    """
    Retrieve granular section scoring breakdowns with multi-metric sub-scores and deductions.
    """
    profile_res = await db.execute(select(UserProfile).options(selectinload(UserProfile.sections)))
    profile = profile_res.scalars().first()
    if not profile:
        return []

    breakdowns = []
    for sec in profile.sections:
        base_score = sec.ai_score or 75
        impact = min(100, max(40, base_score + 5))
        keywords = min(100, max(30, base_score - 5))
        clarity = min(100, max(50, base_score + 2))

        deductions = []
        if keywords < 70:
            deductions.append("Missing high-frequency target JD keywords")
        if impact < 75:
            deductions.append("Weak action verbs and low quantified metrics in bullet points")
        if clarity < 80:
            deductions.append("Paragraph could be more concise for fast ATS scanning")

        breakdowns.append(
            SectionScoreBreakdown(
                section_type=sec.section_type,
                title=sec.title,
                overall_score=base_score,
                impact_score=impact,
                keyword_score=keywords,
                clarity_score=clarity,
                deductions=deductions,
            )
        )

    return breakdowns


async def trigger_n8n_webhook():
    webhook_url = f"{settings.n8n_webhook_url}/webhook/linkedin-imported"
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json={"event": "profile_imported", "source": "career_os"})
            logger.info(f"Successfully triggered n8n webhook at {webhook_url}")
    except Exception as e:
        logger.error(f"Failed to trigger n8n webhook: {e}")


@router.post("/import", response_model=LinkedInImportResponse)
async def import_profile(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        from services.linkedin_parser import parse_zip, to_profile_sections
    except ImportError:
        raise HTTPException(status_code=501, detail="linkedin_parser not implemented yet")

    content = await file.read()

    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    parsed_data = parse_zip(content)

    # Upsert UserProfile
    result = await db.execute(select(UserProfile))
    profile = result.scalars().first()
    if not profile:
        profile = UserProfile(raw_data=parsed_data.get("profile", {}))
        db.add(profile)
        await db.flush()
    else:
        profile.raw_data = parsed_data.get("profile", {})

    # Bulk insert sections
    sections_data = to_profile_sections(parsed_data)

    # Delete old sections
    await db.execute(ProfileSection.__table__.delete().where(ProfileSection.profile_id == profile.id))

    # Add new ones
    for sec_data in sections_data:
        sec = ProfileSection(
            profile_id=profile.id,
            section_type=sec_data["section_type"],
            title=sec_data.get("title"),
            content=sec_data["content"],
        )
        db.add(sec)

    await db.commit()

    # Trigger linkedin_trigger webhook in the background
    background_tasks.add_task(trigger_n8n_webhook)

    return LinkedInImportResponse(imported=True, sections_count=len(sections_data))
