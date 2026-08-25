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
    GithubRepoResponse,
    RepoScanResponse,
    RepoScanRequest,
    BatchScanRequest,
    TaskStatusResponse,
    RemediateRepoRequest,
    RemediateRepoResponse,
)
from services.github_service import github_service
from services.task_manager import task_manager

logger = logging.getLogger("career_os")
router = APIRouter()


# --- Background task implementations with TaskManager tracking ---

async def sync_repos_task(task_id: str):
    """Sync all repos from GitHub API and track progress."""
    task_manager.update_progress(task_id, completed_steps=0, message="Connecting to GitHub API...")
    async with AsyncSessionLocal() as db:
        try:
            repos = await github_service.get_all_repos()
            total = len(repos)
            task_manager.update_progress(task_id, completed_steps=1, message=f"Fetched {total} repos from GitHub. Persisting to database...")

            for i, repo_data in enumerate(repos, 1):
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
            task_manager.complete_task(task_id, result={"synced_count": total})
            logger.info(f"Synced {total} repos from GitHub")
        except Exception as e:
            logger.error(f"sync_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


async def scan_batch_repos_task(task_id: str, repo_full_names: List[str]):
    """Scan a specific batch of repos sequentially and update live progress."""
    total = len(repo_full_names)
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(GithubRepo).where(GithubRepo.full_name.in_(repo_full_names))
            )
            repos = result.scalars().all()
            logger.info(f"Starting background scan for batch of {len(repos)} repositories")

            for i, repo in enumerate(repos, 1):
                try:
                    task_manager.update_progress(
                        task_id,
                        completed_steps=i,
                        current_item=repo.full_name,
                        message=f"Scanning security for {repo.full_name} ({i}/{total})..."
                    )
                    scan_data = await github_service.scan_for_secrets(repo.full_name)
                    scan = RepoScan(
                        repo_id=repo.id,
                        has_gitignore=scan_data.get('has_gitignore', False),
                        has_env_file=scan_data.get('has_env_file', False),
                        leaked_secrets=scan_data.get('leaked_secrets', []),
                        ai_issues=scan_data.get('ai_issues', []),
                    )
                    repo.has_readme = scan_data.get('has_readme', False)
                    health_score = github_service.calculate_health_score(repo, scan)
                    scan.health_score = health_score
                    db.add(scan)
                    await db.commit()
                except Exception as repo_err:
                    logger.error(f"Failed to scan repository {repo.full_name}: {repo_err}")
                    await db.rollback()

            task_manager.complete_task(task_id, result={"scanned_count": total})
            logger.info("Finished background scan for batch of repositories")
        except Exception as e:
            logger.error(f"scan_batch_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


async def scan_all_repos_task(task_id: str):
    """Scan all repos in DB sequentially."""
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(GithubRepo))
            repos = result.scalars().all()
            total = len(repos)
            logger.info(f"Starting background scan for all {total} repositories")

            for i, repo in enumerate(repos, 1):
                try:
                    task_manager.update_progress(
                        task_id,
                        completed_steps=i,
                        current_item=repo.full_name,
                        message=f"Scanning {repo.full_name} ({i}/{total})..."
                    )
                    scan_data = await github_service.scan_for_secrets(repo.full_name)
                    scan = RepoScan(
                        repo_id=repo.id,
                        has_gitignore=scan_data.get('has_gitignore', False),
                        has_env_file=scan_data.get('has_env_file', False),
                        leaked_secrets=scan_data.get('leaked_secrets', []),
                        ai_issues=scan_data.get('ai_issues', []),
                    )
                    repo.has_readme = scan_data.get('has_readme', False)
                    health_score = github_service.calculate_health_score(repo, scan)
                    scan.health_score = health_score
                    db.add(scan)
                    await db.commit()
                except Exception as repo_err:
                    logger.error(f"Failed to scan {repo.full_name}: {repo_err}")
                    await db.rollback()

            task_manager.complete_task(task_id, result={"scanned_count": total})
        except Exception as e:
            logger.error(f"scan_all_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


@router.get("/repos", response_model=List[GithubRepoResponse])
async def get_repos(
    health: Optional[str] = Query(None, description="needs_readme|has_secrets|all"),
    db: AsyncSession = Depends(get_db),
):
    query = select(GithubRepo)
    result = await db.execute(query)
    repos = result.scalars().all()

    repo_ids = [repo.id for repo in repos]
    if repo_ids:
        from sqlalchemy import func as sa_func
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

    response_repos = []
    for repo in repos:
        latest_scan = scans_by_repo.get(repo.id)

        if health == "needs_readme" and repo.has_readme:
            continue
        if health == "has_secrets" and (not latest_scan or not latest_scan.leaked_secrets):
            continue

        repo_response = GithubRepoResponse.model_validate(repo)
        if latest_scan:
            repo_response.latest_scan = RepoScanResponse.model_validate(latest_scan)
        response_repos.append(repo_response)

    return response_repos


@router.post("/sync")
async def sync_repos(background_tasks: BackgroundTasks):
    """Trigger background repo sync with live task tracking."""
    task_id = task_manager.create_task(task_type="github_sync", total_steps=10)
    background_tasks.add_task(sync_repos_task, task_id)
    return {"task_id": task_id, "status": "queued"}


@router.post("/scan", response_model=RepoScanResponse)
async def scan_repo(req: RepoScanRequest, db: AsyncSession = Depends(get_db)):
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
    repo.has_readme = scan_data.get('has_readme', False)

    health_score = github_service.calculate_health_score(repo, scan)
    scan.health_score = health_score

    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    return scan


@router.post("/scan/all")
async def scan_all_repos(background_tasks: BackgroundTasks):
    task_id = task_manager.create_task(task_type="batch_scan_all", total_steps=50)
    background_tasks.add_task(scan_all_repos_task, task_id)
    return {"task_id": task_id, "status": "queued", "message": "Background scan of all repositories started."}


@router.post("/scan/batch")
async def scan_batch_repos(req: BatchScanRequest, background_tasks: BackgroundTasks):
    total = len(req.repo_full_names)
    task_id = task_manager.create_task(
        task_type="batch_scan_selected",
        total_steps=total,
        metadata={"repos": req.repo_full_names}
    )
    background_tasks.add_task(scan_batch_repos_task, task_id, req.repo_full_names)
    return {"task_id": task_id, "status": "queued", "message": f"Background scan of {total} repositories started."}


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Poll the execution status and progress of a background GitHub task.
    """
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskStatusResponse.model_validate(task)


@router.post("/remediate", response_model=RemediateRepoResponse)
async def remediate_repo(req: RemediateRepoRequest):
    """
    Automated security remediation: push standard .gitignore or remove committed .env.
    """
    try:
        result = await github_service.remediate_repo(req.repo_full_name, req.action)
        return RemediateRepoResponse(
            repo_full_name=req.repo_full_name,
            remediated=result.get("remediated", False),
            action_taken=result.get("action_taken", req.action),
            commit_sha=result.get("commit_sha"),
            message=result.get("message", "Remediation executed."),
        )
    except Exception as e:
        logger.error(f"Remediation failed for {req.repo_full_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Remediation failed: {e}")
