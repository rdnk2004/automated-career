"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2026-04-07 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    statements = [
        """
        CREATE TABLE user_profile (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            raw_data        JSONB NOT NULL,
            headline        TEXT,
            summary         TEXT,
            location        TEXT,
            linkedin_url    TEXT,
            updated_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE profile_sections (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profile_id      UUID REFERENCES user_profile(id) ON DELETE CASCADE,
            section_type    TEXT NOT NULL,
            title           TEXT,
            content         JSONB NOT NULL,
            ai_score        INTEGER,
            scored_at       TIMESTAMPTZ,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE github_repos (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            github_id       BIGINT UNIQUE NOT NULL,
            name            TEXT NOT NULL,
            full_name       TEXT NOT NULL,
            description     TEXT,
            language        TEXT,
            topics          TEXT[],
            has_readme      BOOLEAN DEFAULT FALSE,
            readme_content  TEXT,
            is_private      BOOLEAN DEFAULT FALSE,
            stars           INTEGER DEFAULT 0,
            last_pushed_at  TIMESTAMPTZ,
            synced_at       TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE repo_scans (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            repo_id         UUID REFERENCES github_repos(id) ON DELETE CASCADE,
            health_score    INTEGER,
            has_gitignore   BOOLEAN,
            has_env_file    BOOLEAN,
            leaked_secrets  JSONB,
            ai_issues       JSONB,
            scanned_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE job_listings (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            indeed_id       TEXT UNIQUE NOT NULL,
            title           TEXT NOT NULL,
            company         TEXT,
            location        TEXT,
            description     TEXT NOT NULL,
            salary_range    TEXT,
            job_type        TEXT,
            target_role     TEXT NOT NULL,
            fetched_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE jd_keywords (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            target_role     TEXT NOT NULL,
            keyword         TEXT NOT NULL,
            frequency       INTEGER DEFAULT 1,
            is_technical    BOOLEAN DEFAULT TRUE,
            last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(target_role, keyword)
        )
        """,
        """
        CREATE TABLE suggestions_log (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            suggestion_type TEXT NOT NULL,
            context         JSONB,
            suggestion      TEXT NOT NULL,
            was_applied     BOOLEAN DEFAULT FALSE,
            applied_at      TIMESTAMPTZ,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE career_score_snapshots (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            linkedin_score      INTEGER,
            github_score        INTEGER,
            resume_match_score  INTEGER,
            overall_score       INTEGER,
            target_role         TEXT,
            snapshotted_at      TIMESTAMPTZ DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE app_settings (
            key                 TEXT PRIMARY KEY,
            value               TEXT
        )
        """,
        "CREATE INDEX idx_profile_sections_type ON profile_sections(section_type)",
        "CREATE INDEX idx_job_listings_role ON job_listings(target_role)",
        "CREATE INDEX idx_jd_keywords_role ON jd_keywords(target_role, frequency DESC)",
        "CREATE INDEX idx_suggestions_type ON suggestions_log(suggestion_type, created_at DESC)",
        "CREATE INDEX idx_score_snapshots_date ON career_score_snapshots(snapshotted_at DESC)"
    ]
    for stmt in statements:
        op.execute(stmt)


def downgrade() -> None:
    statements = [
        "DROP TABLE IF EXISTS app_settings CASCADE",
        "DROP TABLE IF EXISTS career_score_snapshots CASCADE",
        "DROP TABLE IF EXISTS suggestions_log CASCADE",
        "DROP TABLE IF EXISTS jd_keywords CASCADE",
        "DROP TABLE IF EXISTS job_listings CASCADE",
        "DROP TABLE IF EXISTS repo_scans CASCADE",
        "DROP TABLE IF EXISTS github_repos CASCADE",
        "DROP TABLE IF EXISTS profile_sections CASCADE",
        "DROP TABLE IF EXISTS user_profile CASCADE"
    ]
    for stmt in statements:
        op.execute(stmt)
