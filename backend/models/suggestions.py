from sqlalchemy import Column, String, Integer, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base

class SuggestionLog(Base):
    __tablename__ = 'suggestions_log'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    suggestion_type = Column(String, nullable=False)
    context = Column(JSONB)
    suggestion = Column(String, nullable=False)
    was_applied = Column(Boolean, server_default=text("false"))
    applied_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CareerScoreSnapshot(Base):
    __tablename__ = 'career_score_snapshots'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    linkedin_score = Column(Integer)
    github_score = Column(Integer)
    resume_match_score = Column(Integer)
    overall_score = Column(Integer)
    target_role = Column(String)
    snapshotted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
