import json
import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_db, AsyncSessionLocal
from models.github import GithubRepo, RepoScan
from models.suggestions import SuggestionLog
from schemas.github import (
    GithubRepoResponse, RepoScanResponse,
    ReadmeGenerateRequest, ReadmeGenerateResponse,
    ReadmePushRequest, ReadmePushResponse,
)
from services.github_service import github_service
from agents.github_agent import generate_readme as agent_generate_readme

logger = logging.getLogger("career_os")
router = APIRouter()


# --- Background task uses its OWN session (C-5 fix) ---
async def sync_repos_task():
    """Sync all repos from GitHub API. Creates its own DB session."""
    async with AsyncSessionLocal() as db:
        try:
            repos = await github_service.get_all_repos()
            for repo_data in repos:
                result = await db.execute(
                    select(GithubRepo).where(GithubRepo.github_id == repo_data['id'])
                )
                repo = result.scalars().first()
                if not repo:
                    repo = GithubRepo(github_id=repo_data['id'])
                    db.add(repo)

                repo.name = repo_data.get('name', '')
                repo.full_name = repo_data.get('full_name', '')
                repo.description = repo_data.get('description')
                repo.language = repo_data.get('language')
                repo.topics = repo_data.get('topics', [])
                repo.is_private = repo_data.get('private', False)
                repo.stars = repo_data.get('stargazers_count', 0)
            await db.commit()
            logger.info(f"Synced {len(repos)} repos from GitHub")
        except Exception as e:
            logger.error(f"sync_repos_task failed: {e}")
            await db.rollback()


@router.get("/repos", response_model=List[GithubRepoResponse])
async def get_repos(
    health: Optional[str] = Query(None, description="needs_readme|has_secrets|all"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all repos with their latest scan.
    Uses a subquery to avoid N+1 (M-3 fix).
    """
    query = select(GithubRepo)
    result = await db.execute(query)
    repos = result.scalars().all()

    response_repos = []
    # Batch-fetch all latest scans in one query to avoid N+1
    repo_ids = [repo.id for repo in repos]
    if repo_ids:
        from sqlalchemy import func as sa_func, distinct
        # Get latest scan per repo via subquery
        latest_scan_subq = (
            select(
                RepoScan.repo_id,
                sa_func.max(RepoScan.scanned_at).label("max_scanned_at"),
            )
            .group_by(RepoScan.repo_id)
            .subquery()
        )
        scan_result = await db.execute(
            select(RepoScan)
            .join(
                latest_scan_subq,
                (RepoScan.repo_id == latest_scan_subq.c.repo_id)
                & (RepoScan.scanned_at == latest_scan_subq.c.max_scanned_at),
            )
            .where(RepoScan.repo_id.in_(repo_ids))
        )
        scans_by_repo = {scan.repo_id: scan for scan in scan_result.scalars().all()}
    else:
        scans_by_repo = {}

    for repo in repos:
        latest_scan = scans_by_repo.get(repo.id)

        # Apply filters
        if health == "needs_readme" and repo.has_readme:
            continue
        if health == "has_secrets" and (not latest_scan or not latest_scan.leaked_secrets):
            continue

        # Build response using Pydantic model properly (H-2 fix)
        repo_response = GithubRepoResponse.model_validate(repo)
        if latest_scan:
            repo_response.latest_scan = RepoScanResponse.model_validate(latest_scan)
        response_repos.append(repo_response)

    return response_repos


@router.post("/sync")
async def sync_repos(background_tasks: BackgroundTasks):
    """Trigger background repo sync — no db dependency passed (C-5 fix)."""
    background_tasks.add_task(sync_repos_task)
    return {"task_id": "sync_task", "status": "queued"}


@router.post("/readme/generate", response_model=ReadmeGenerateResponse)
async def generate_readme(req: ReadmeGenerateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GithubRepo).where(GithubRepo.full_name == req.repo_full_name)
    )
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    tree = await github_service.get_repo_file_tree(req.repo_full_name)
    sample_code = ""  # ideally fetch a sample file

    repo_data = {
        'name': repo.name,
        'description': repo.description,
        'language': repo.language,
        'topics': repo.topics,
    }

    readme_markdown = await agent_generate_readme(repo_data, json.dumps(tree), sample_code)

    # Save to suggestions_log
    log = SuggestionLog(
        suggestion_type="github_readme",
        context={"repo_full_name": req.repo_full_name},
        suggestion=readme_markdown,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return ReadmeGenerateResponse(readme_markdown=readme_markdown, suggestion_id=log.id)


@router.post("/readme/push", response_model=ReadmePushResponse)
async def push_readme(req: ReadmePushRequest):
    try:
        resp = await github_service.push_file(
            req.repo_full_name, "README.md", req.content, "Add AI generated README"
        )
        return ReadmePushResponse(committed=True, sha=resp.get("content", {}).get("sha", ""))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan", response_model=RepoScanResponse)
async def scan_repo(req: ReadmeGenerateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GithubRepo).where(GithubRepo.full_name == req.repo_full_name)
    )
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    scan_data = await github_service.scan_for_secrets(req.repo_full_name)

    scan = RepoScan(
        repo_id=repo.id,
        has_gitignore=scan_data.get('has_gitignore', False),
        has_env_file=scan_data.get('has_env_file', False),
        leaked_secrets=scan_data.get('leaked_secrets', []),
        ai_issues=scan_data.get('ai_issues', []),
    )

    # C-6 fix: calculate_health_score is now sync, no await needed
    health_score = github_service.calculate_health_score(repo, scan)
    scan.health_score = health_score

    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    return scan
