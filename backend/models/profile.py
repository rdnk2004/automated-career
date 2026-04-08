from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class UserProfile(Base):
    __tablename__ = 'user_profile'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    raw_data = Column(JSONB, nullable=False)
    headline = Column(String)
    summary = Column(String)
    location = Column(String)
    linkedin_url = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    sections = relationship("ProfileSection", back_populates="profile", cascade="all, delete-orphan", lazy="selectin")

class ProfileSection(Base):
    __tablename__ = 'profile_sections'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    profile_id = Column(UUID(as_uuid=True), ForeignKey('user_profile.id', ondelete='CASCADE'))
    section_type = Column(String, nullable=False, index=True)
    title = Column(String)
    content = Column(JSONB, nullable=False)
    ai_score = Column(Integer)
    scored_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("UserProfile", back_populates="sections")
