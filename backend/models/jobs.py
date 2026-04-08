from sqlalchemy import Column, String, Integer, Boolean, DateTime, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class JobListing(Base):
    __tablename__ = 'job_listings'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    indeed_id = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String)
    location = Column(String)
    description = Column(String, nullable=False)
    salary_range = Column(String)
    job_type = Column(String)
    target_role = Column(String, nullable=False, index=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())

class JDKeyword(Base):
    __tablename__ = 'jd_keywords'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    target_role = Column(String, nullable=False)
    keyword = Column(String, nullable=False)
    frequency = Column(Integer, server_default=text("1"))
    is_technical = Column(Boolean, server_default=text("true"))
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('target_role', 'keyword', name='uq_jd_keywords_role_keyword'),
    )
