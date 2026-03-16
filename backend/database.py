import os
from pathlib import Path
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Text,
    DateTime, JSON, Enum as SAEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum

# ── Path ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "careerlens.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Enums ────────────────────────────────────────────────────────────────────
class ContactStatus(str, enum.Enum):
    not_contacted = "not_contacted"
    messaged = "messaged"
    replied = "replied"


class SuggestionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    dismissed = "dismissed"


class ProfileSource(str, enum.Enum):
    linkedin = "linkedin"
    resume = "resume"
    github = "github"


# ── ORM Models ───────────────────────────────────────────────────────────────

class ProfileSnapshot(Base):
    __tablename__ = "profile_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(SAEnum(ProfileSource), nullable=False)   # linkedin / resume / github
    data_json = Column(Text, nullable=False)                 # Full scraped data as JSON string
    scraped_at = Column(DateTime, default=datetime.utcnow)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    source = Column(String(50))                              # linkedin / resume / github
    last_seen = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), nullable=False)
    source = Column(String(50))                              # github / resume
    description = Column(Text)
    tech_stack = Column(JSON)                                # list of strings
    github_url = Column(String(500))
    complexity_rating = Column(Float)
    resume_bullets = Column(JSON)                            # list of strings
    last_updated = Column(DateTime, default=datetime.utcnow)


class HRContact(Base):
    __tablename__ = "hr_contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300))
    title = Column(String(300))
    company = Column(String(300))
    profile_url = Column(String(500))
    score = Column(Float, default=0.0)
    score_reason = Column(Text)
    contact_status = Column(
        SAEnum(ContactStatus), default=ContactStatus.not_contacted
    )
    connection_message = Column(Text)
    follow_up_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500))
    company = Column(String(300))
    location = Column(String(300))
    job_url = Column(String(500))
    jd_text = Column(Text)
    must_have_skills = Column(JSON)                          # list of strings
    nice_to_have_skills = Column(JSON)
    match_score = Column(Float)
    missing_skills = Column(JSON)
    source = Column(String(50))                              # indeed / linkedin
    scraped_at = Column(DateTime, default=datetime.utcnow)


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(100))                             # linkedin / resume / github
    input_hash = Column(String(64))                          # SHA-256 of input to avoid re-runs
    jd_name = Column(String(300))
    output_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class CrossSuggestion(Base):
    __tablename__ = "cross_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_text = Column(Text, nullable=False)
    suggestion_type = Column(String(100))                    # e.g. "add_to_linkedin", "add_to_resume"
    draft_content = Column(Text)                             # pre-written draft for the user
    status = Column(
        SAEnum(SuggestionStatus), default=SuggestionStatus.pending
    )
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Dependency ────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Bootstrap ─────────────────────────────────────────────────────────────────
def init_db():
    Base.metadata.create_all(bind=engine)
