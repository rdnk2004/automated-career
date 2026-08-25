import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from routers import profile, github, jobs, analysis, settings
from config import settings as app_settings
from database import engine
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limiter import limiter
from services.task_manager import task_manager
from schemas.github import TaskStatusResponse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("career_os")

SCHEMA_PATCH_STATEMENTS = [
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS forks_count INTEGER DEFAULT 0;",
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS open_issues_count INTEGER DEFAULT 0;",
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS size_kb INTEGER DEFAULT 0;",
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS default_branch VARCHAR DEFAULT 'main';",
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS license_name VARCHAR;",
    "ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS html_url VARCHAR;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS resume_score INTEGER;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS portfolio_tier VARCHAR;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS key_technologies TEXT[];",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS architecture_summary TEXT;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS resume_bullets JSONB;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS recommendation_reason TEXT;",
    "ALTER TABLE repo_scans ADD COLUMN IF NOT EXISTS production_readiness JSONB;",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database schema columns exist on startup without manual SQL steps."""
    try:
        async with engine.begin() as conn:
            for stmt in SCHEMA_PATCH_STATEMENTS:
                await conn.execute(text(stmt))
            logger.info("Verified PostgreSQL github_repos and repo_scans schema columns on startup")
    except Exception as e:
        logger.warning(f"Auto-migration check notice: {e}")
    yield


app = FastAPI(title="Career OS API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms")
    return response

# CORS — allow frontend in dev and Docker networking
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Key Auth Dependency ---
async def verify_api_key(request: Request):
    """
    Simple API key auth. If API_AUTH_KEY is not set in .env,
    auth is disabled (personal tool, local-only use).
    """
    auth_key = app_settings.api_auth_key
    if not auth_key:
        # No key configured — skip auth (dev mode)
        return
    provided = request.headers.get("X-API-Key", "")
    if provided != auth_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# --- Health Check ---
@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/tasks/{task_id}", response_model=TaskStatusResponse, tags=["tasks"])
async def get_global_task_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskStatusResponse.model_validate(task)


# --- Routers ---
app.include_router(
    profile.router,
    prefix="/api/profile",
    tags=["profile"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    github.router,
    prefix="/api/github",
    tags=["github"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    jobs.router,
    prefix="/api/jobs",
    tags=["jobs"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    analysis.router,
    prefix="/api/analysis",
    tags=["analysis"],
    dependencies=[Depends(verify_api_key)],
)
app.include_router(
    settings.router,
    prefix="/api/settings",
    tags=["settings"],
    dependencies=[Depends(verify_api_key)],
)
