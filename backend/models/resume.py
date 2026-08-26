from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base

class TargetedResume(Base):
    __tablename__ = 'targeted_resumes'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    title = Column(String, nullable=False)
    target_role = Column(String, nullable=False, index=True)
    raw_text = Column(Text, nullable=False)
    parsed_data = Column(JSONB)
    match_score = Column(Integer)
    bs_factor = Column(Float)
    last_analysis = Column(JSONB)
    is_primary = Column(Boolean, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
