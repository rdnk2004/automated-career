"""Add rich github stats columns

Revision ID: 002
Revises: 001
Create Date: 2026-08-25 21:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    statements = [
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS forks_count INTEGER DEFAULT 0;",
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS open_issues_count INTEGER DEFAULT 0;",
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS size_kb INTEGER DEFAULT 0;",
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS default_branch VARCHAR DEFAULT 'main';",
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS license_name VARCHAR;",
        "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS html_url VARCHAR;",
    ]
    for stmt in statements:
        op.execute(stmt)

def downgrade() -> None:
    statements = [
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS forks_count;",
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS open_issues_count;",
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS size_kb;",
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS default_branch;",
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS license_name;",
        "ALTER TABLE github_repos DROP COLUMN IF EXISTS html_url;",
    ]
    for stmt in statements:
        op.execute(stmt)
