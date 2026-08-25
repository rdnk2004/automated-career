import json
import logging
from datetime import datetime, timezone
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
    EvaluateRepoRequest,
    ProjectEvaluationResponse,
)
from services.github_service import github_service
from services.task_manager import task_manager
from agents.github_agent import evaluate_portfolio_project, generate_readme

logger = logging.getLogger("career_os")
router = APIRouter()


# --- Background task implementations with TaskManager tracking ---

def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None


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
                repo.forks_count = repo_data.get('forks_count', 0)
                repo.open_issues_count = repo_data.get('open_issues_count', 0)
                repo.size_kb = repo_data.get('size', 0)
                repo.default_branch = repo_data.get('default_branch', 'main')
                repo.html_url = repo_data.get('html_url') or f"https://github.com/{repo_data.get('full_name')}"
                
                # License parsing
                license_obj = repo_data.get('license')
                if isinstance(license_obj, dict):
                    repo.license_name = license_obj.get('spdx_id') or license_obj.get('name')
                else:
                    repo.license_name = None

                # Last pushed date parsing
                pushed_at_str = repo_data.get('pushed_at')
                repo.last_pushed_at = parse_iso_datetime(pushed_at_str)

            await db.commit()
            task_manager.complete_task(task_id, result={"synced_count": total})
            logger.info(f"Synced {total} repos from GitHub with rich stats")
        except Exception as e:
            logger.error(f"sync_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


async def scan_batch_repos_task(task_id: str, repo_full_names: List[str]):
    """Evaluate a specific batch of repos sequentially and update live progress."""
    total = len(repo_full_names)
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(GithubRepo).where(GithubRepo.full_name.in_(repo_full_names))
            )
            repos = result.scalars().all()
            logger.info(f"Starting background portfolio evaluation for batch of {len(repos)} repositories")

            for i, repo in enumerate(repos, 1):
                try:
                    task_manager.update_progress(
                        task_id,
                        completed_steps=i,
                        current_item=repo.full_name,
                        message=f"Evaluating resume worthiness for {repo.full_name} ({i}/{total})..."
                    )
                    code_info = await github_service.inspect_repo_code(repo.full_name)
                    eval_data = await evaluate_portfolio_project(
                        repo_data={"name": repo.name, "full_name": repo.full_name, "description": repo.description, "language": repo.language, "stars": repo.stars, "forks_count": repo.forks_count},
                        file_tree=code_info.get("file_tree", ""),
                        sample_code=code_info.get("sample_code", ""),
                    )

                    scan = RepoScan(
                        repo_id=repo.id,
                        health_score=eval_data.get("resume_score", 75),
                        resume_score=eval_data.get("resume_score", 75),
                        portfolio_tier=eval_data.get("portfolio_tier", "Tier 2: Strong Supporting"),
                        key_technologies=eval_data.get("key_technologies", []),
                        architecture_summary=eval_data.get("architecture_summary", ""),
                        resume_bullets=eval_data.get("resume_bullets", []),
                        recommendation_reason=eval_data.get("recommendation_reason", ""),
                        production_readiness=eval_data.get("production_readiness", {}),
                        has_gitignore=True,
                        has_env_file=False,
                    )
                    db.add(scan)
                    await db.commit()
                except Exception as repo_err:
                    logger.error(f"Failed to evaluate repository {repo.full_name}: {repo_err}")
                    await db.rollback()

            task_manager.complete_task(task_id, result={"scanned_count": total})
            logger.info("Finished background evaluation for batch of repositories")
        except Exception as e:
            logger.error(f"scan_batch_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


async def scan_all_repos_task(task_id: str):
    """Evaluate all repos in DB sequentially."""
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(GithubRepo))
            repos = result.scalars().all()
            total = len(repos)
            logger.info(f"Starting background portfolio evaluation for all {total} repositories")

            for i, repo in enumerate(repos, 1):
                try:
                    task_manager.update_progress(
                        task_id,
                        completed_steps=i,
                        current_item=repo.full_name,
                        message=f"Evaluating {repo.full_name} ({i}/{total})..."
                    )
                    code_info = await github_service.inspect_repo_code(repo.full_name)
                    eval_data = await evaluate_portfolio_project(
                        repo_data={"name": repo.name, "full_name": repo.full_name, "description": repo.description, "language": repo.language, "stars": repo.stars, "forks_count": repo.forks_count},
                        file_tree=code_info.get("file_tree", ""),
                        sample_code=code_info.get("sample_code", ""),
                    )

                    scan = RepoScan(
                        repo_id=repo.id,
                        health_score=eval_data.get("resume_score", 75),
                        resume_score=eval_data.get("resume_score", 75),
                        portfolio_tier=eval_data.get("portfolio_tier", "Tier 2: Strong Supporting"),
                        key_technologies=eval_data.get("key_technologies", []),
                        architecture_summary=eval_data.get("architecture_summary", ""),
                        resume_bullets=eval_data.get("resume_bullets", []),
                        recommendation_reason=eval_data.get("recommendation_reason", ""),
                        production_readiness=eval_data.get("production_readiness", {}),
                        has_gitignore=True,
                        has_env_file=False,
                    )
                    db.add(scan)
                    await db.commit()
                except Exception as repo_err:
                    logger.error(f"Failed to evaluate {repo.full_name}: {repo_err}")
                    await db.rollback()

            task_manager.complete_task(task_id, result={"scanned_count": total})
        except Exception as e:
            logger.error(f"scan_all_repos_task failed: {e}")
            task_manager.fail_task(task_id, str(e))
            await db.rollback()


@router.get("/repos", response_model=List[GithubRepoResponse])
async def get_repos(
    health: Optional[str] = Query(None, description="needs_readme|tier1|all"),
    db: AsyncSession = Depends(get_db),
):
    query = select(GithubRepo).order_by(GithubRepo.last_pushed_at.desc().nullslast(), GithubRepo.stars.desc())
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
        if health == "tier1" and (not latest_scan or not latest_scan.portfolio_tier or not latest_scan.portfolio_tier.startswith("Tier 1")):
            continue

        repo_response = GithubRepoResponse.model_validate(repo)
        if latest_scan:
            repo_response.latest_scan = RepoScanResponse.model_validate(latest_scan)
        response_repos.append(repo_response)

    return response_repos


@router.get("/latest", response_model=Optional[GithubRepoResponse])
async def get_latest_pushed_repo(db: AsyncSession = Depends(get_db)):
    """
    Get the single most recently committed/pushed repository with its scan.
    """
    query = (
        select(GithubRepo)
        .where(GithubRepo.last_pushed_at.isnot(None))
        .order_by(GithubRepo.last_pushed_at.desc())
        .limit(1)
    )
    result = await db.execute(query)
    repo = result.scalars().first()

    if not repo:
        res_any = await db.execute(select(GithubRepo).order_by(GithubRepo.stars.desc()).limit(1))
        repo = res_any.scalars().first()

    if not repo:
        return None

    scan_res = await db.execute(
        select(RepoScan)
        .where(RepoScan.repo_id == repo.id)
        .order_by(RepoScan.scanned_at.desc())
        .limit(1)
    )
    latest_scan = scan_res.scalars().first()

    repo_response = GithubRepoResponse.model_validate(repo)
    if latest_scan:
        repo_response.latest_scan = RepoScanResponse.model_validate(latest_scan)
    return repo_response


@router.post("/sync")
async def sync_repos(background_tasks: BackgroundTasks):
    """Trigger background repo sync with live task tracking."""
    task_id = task_manager.create_task(task_type="github_sync", total_steps=10)
    background_tasks.add_task(sync_repos_task, task_id)
    return {"task_id": task_id, "status": "queued"}


@router.post("/evaluate", response_model=ProjectEvaluationResponse)
async def evaluate_repo(req: EvaluateRepoRequest, db: AsyncSession = Depends(get_db)):
    """
    Perform deep codebase inspection on a repository and evaluate resume worthiness.
    """
    result = await db.execute(
        select(GithubRepo).where(GithubRepo.full_name == req.repo_full_name)
    )
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    code_info = await github_service.inspect_repo_code(req.repo_full_name)
    eval_data = await evaluate_portfolio_project(
        repo_data={
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "language": repo.language,
            "stars": repo.stars,
            "forks_count": repo.forks_count,
        },
        file_tree=code_info.get("file_tree", ""),
        sample_code=code_info.get("sample_code", ""),
        target_role=req.target_role,
    )

    scan = RepoScan(
        repo_id=repo.id,
        health_score=eval_data.get("resume_score", 75),
        resume_score=eval_data.get("resume_score", 75),
        portfolio_tier=eval_data.get("portfolio_tier", "Tier 2: Strong Supporting"),
        key_technologies=eval_data.get("key_technologies", []),
        architecture_summary=eval_data.get("architecture_summary", ""),
        resume_bullets=eval_data.get("resume_bullets", []),
        recommendation_reason=eval_data.get("recommendation_reason", ""),
        production_readiness=eval_data.get("production_readiness", {}),
    )
    db.add(scan)

    # Save to suggestion log
    log = SuggestionLog(
        suggestion_type="github_portfolio",
        context={"repo": req.repo_full_name, "tier": eval_data.get("portfolio_tier")},
        suggestion=json.dumps(eval_data.get("resume_bullets", []))
    )
    db.add(log)

    await db.commit()
    await db.refresh(scan)

    return ProjectEvaluationResponse(
        repo_full_name=req.repo_full_name,
        resume_score=scan.resume_score or 75,
        portfolio_tier=scan.portfolio_tier or "Tier 2: Strong Supporting",
        key_technologies=scan.key_technologies or [],
        architecture_summary=scan.architecture_summary or "",
        resume_bullets=scan.resume_bullets or [],
        recommendation_reason=scan.recommendation_reason or "",
        production_readiness=scan.production_readiness or {},
        evaluated_at=scan.scanned_at,
    )


@router.post("/scan", response_model=RepoScanResponse)
async def scan_repo_alias(req: RepoScanRequest, db: AsyncSession = Depends(get_db)):
    """
    Backward-compatible scan endpoint that routes through deep portfolio evaluation.
    """
    res = await evaluate_repo(EvaluateRepoRequest(repo_full_name=req.repo_full_name), db)
    
    # Fetch created scan
    result = await db.execute(
        select(GithubRepo).where(GithubRepo.full_name == req.repo_full_name)
    )
    repo = result.scalars().first()
    scan_res = await db.execute(
        select(RepoScan).where(RepoScan.repo_id == repo.id).order_by(RepoScan.scanned_at.desc()).limit(1)
    )
    return scan_res.scalars().first()


@router.post("/readme/generate")
async def generate_repo_readme(req: RepoScanRequest, db: AsyncSession = Depends(get_db)):
    """
    Generate an elite README with Mermaid architecture diagrams based on actual code.
    """
    result = await db.execute(
        select(GithubRepo).where(GithubRepo.full_name == req.repo_full_name)
    )
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    code_info = await github_service.inspect_repo_code(req.repo_full_name)
    readme_md = await generate_readme(
        repo_data={
            "name": repo.name,
            "description": repo.description,
            "language": repo.language,
            "topics": repo.topics or [],
        },
        file_tree=code_info.get("file_tree", ""),
        sample_code=code_info.get("sample_code", ""),
    )

    log = SuggestionLog(
        suggestion_type="github_readme",
        context={"repo": req.repo_full_name},
        suggestion=readme_md
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return {"readme_markdown": readme_md, "suggestion_id": str(log.id)}


@router.post("/readme/push")
async def push_repo_readme(body: dict):
    repo_full_name = body.get("repo_full_name")
    content = body.get("content")
    if not repo_full_name or not content:
        raise HTTPException(status_code=400, detail="Missing repo_full_name or content")

    try:
        res = await github_service.push_file(
            repo_full_name=repo_full_name,
            path="README.md",
            content=content,
            message="docs: update README with AI architecture diagrams and setup guide"
        )
        return {"committed": True, "sha": res.get("commit", {}).get("sha", "")}
    except Exception as e:
        logger.error(f"Failed to push README: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to push README: {e}")


@router.post("/scan/all")
async def scan_all_repos(background_tasks: BackgroundTasks):
    task_id = task_manager.create_task(task_type="batch_scan_all", total_steps=50)
    background_tasks.add_task(scan_all_repos_task, task_id)
    return {"task_id": task_id, "status": "queued", "message": "Background portfolio evaluation for all repositories started."}


@router.post("/scan/batch")
async def scan_batch_repos(req: BatchScanRequest, background_tasks: BackgroundTasks):
    total = len(req.repo_full_names)
    task_id = task_manager.create_task(
        task_type="batch_scan_selected",
        total_steps=total,
        metadata={"repos": req.repo_full_names}
    )
    background_tasks.add_task(scan_batch_repos_task, task_id, req.repo_full_names)
    return {"task_id": task_id, "status": "queued", "message": f"Background portfolio evaluation of {total} repositories started."}


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskStatusResponse.model_validate(task)


@router.post("/remediate", response_model=RemediateRepoResponse)
async def remediate_repo(req: RemediateRepoRequest):
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
