import logging
import time
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import profile, github, jobs, analysis, settings
from config import settings as app_settings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limiter import limiter

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("career_os")

app = FastAPI(title="Career OS API", version="1.0.0")
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
