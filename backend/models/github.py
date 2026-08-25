from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from database import Base

class GithubRepo(Base):
    __tablename__ = 'github_repos'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    github_id = Column(BigInteger, unique=True, nullable=False)
    name = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    description = Column(String)
    language = Column(String)
    topics = Column(ARRAY(String))
    has_readme = Column(Boolean, server_default=text("false"))
    readme_content = Column(String)
    is_private = Column(Boolean, server_default=text("false"))
    stars = Column(Integer, server_default=text("0"))
    forks_count = Column(Integer, server_default=text("0"))
    open_issues_count = Column(Integer, server_default=text("0"))
    size_kb = Column(Integer, server_default=text("0"))
    default_branch = Column(String, default="main")
    license_name = Column(String, nullable=True)
    html_url = Column(String, nullable=True)
    last_pushed_at = Column(DateTime(timezone=True))
    synced_at = Column(DateTime(timezone=True), server_default=func.now())

class RepoScan(Base):
    __tablename__ = 'repo_scans'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    repo_id = Column(UUID(as_uuid=True), ForeignKey('github_repos.id', ondelete='CASCADE'))
    health_score = Column(Integer)
    resume_score = Column(Integer)
    portfolio_tier = Column(String)
    key_technologies = Column(ARRAY(String))
    architecture_summary = Column(String)
    resume_bullets = Column(JSONB)
    recommendation_reason = Column(String)
    production_readiness = Column(JSONB)
    has_gitignore = Column(Boolean)
    has_env_file = Column(Boolean)
    leaked_secrets = Column(JSONB)
    ai_issues = Column(JSONB)
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())
