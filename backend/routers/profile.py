from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Any, Dict
from uuid import UUID
import httpx
import logging

from database import get_db
from models.profile import UserProfile, ProfileSection
from schemas.profile import UserProfileResponse, ProfileSectionUpdate, ProfileSectionResponse, LinkedInImportResponse
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
    
    if db_section:
        db_section.title = section.title
        db_section.content = section.content
    else:
        # Get profile
        profile_res = await db.execute(select(UserProfile))
        profile = profile_res.scalars().first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        db_section = ProfileSection(
            profile_id=profile.id,
            section_type=section.section_type,
            title=section.title,
            content=section.content
        )
        db.add(db_section)
        
    await db.commit()
    await db.refresh(db_section)
    return db_section

async def trigger_n8n_webhook():
    webhook_url = f"{settings.n8n_webhook_url}/webhook/linkedin-imported"
    try:
        async with httpx.AsyncClient() as client:
            await client.post(webhook_url, json={"event": "profile_imported", "source": "career_os"})
            logger.info(f"Successfully triggered n8n webhook at {webhook_url}")
    except Exception as e:
        logger.error(f"Failed to trigger n8n webhook: {e}")

@router.post("/import", response_model=LinkedInImportResponse)
async def import_profile(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Since Step 7 implements linkedin_parser, we'll import it conditionally
    try:
        from services.linkedin_parser import parse_zip, to_profile_sections
    except ImportError:
        raise HTTPException(status_code=501, detail="linkedin_parser not implemented yet (Step 7)")
        
    content = await file.read()

    # Guard against oversized uploads (10MB max)
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    parsed_data = parse_zip(content)
    
    # Upsert UserProfile
    result = await db.execute(select(UserProfile))
    profile = result.scalars().first()
    if not profile:
        profile = UserProfile(raw_data=parsed_data.get('profile', {}))
        db.add(profile)
        await db.flush()
    else:
        profile.raw_data = parsed_data.get('profile', {})
        
    # Bulk insert sections
    sections_data = to_profile_sections(parsed_data)
    
    # Delete old sections
    await db.execute(ProfileSection.__table__.delete().where(ProfileSection.profile_id == profile.id))
    
    # Add new ones
    for sec_data in sections_data:
        sec = ProfileSection(
            profile_id=profile.id,
            section_type=sec_data['section_type'],
            title=sec_data.get('title'),
            content=sec_data['content']
        )
        db.add(sec)
        
    await db.commit()
    
    # Trigger linkedin_trigger webhook in the background
    background_tasks.add_task(trigger_n8n_webhook)
    
    return LinkedInImportResponse(imported=True, sections_count=len(sections_data))
